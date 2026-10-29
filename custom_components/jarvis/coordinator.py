"""Snapshot coordinator — one ``panel_data.build_snapshot`` feeding every
native Home Assistant entity (fork Phase 0).

* Polls every ``COORDINATOR_UPDATE_INTERVAL_S`` seconds (Home Assistant only
  polls while at least one entity listens, so the stub platforms alone do not
  start the timer; ``request_refresh`` still works without listeners).
* Listens to ``state_changed`` for the domains in
  ``COORDINATOR_REFRESH_DOMAINS`` and debounces them (``COORDINATOR_DEBOUNCE_S``)
  into ``async_request_refresh``. Events for the integration's OWN entities
  are ignored: they are written by every refresh (``sensor.jarvis_uptime`` and
  the area rows' ``last_motion`` change at one-second granularity), so without
  the filter each refresh re-armed the debounce and the coordinator chased
  itself at the Debouncer's 10 s cooldown instead of the 20 s poll.
* :func:`request_refresh` is the best-effort hook other modules call after
  lockdown / mode / observer changes.

``coordinator.data`` is the :func:`panel_data.build_snapshot` dict (keys
status/version/meta/dominant/areas/sleep_reason/doorbell_training/doors/
lockdown/intrusion/knowledge/suggestions/goals) plus two coordinator-only keys:

    settings  dict  {key: current value} for every config_apply.CONFIG_FIELDS
                    entry with expose=True (resolved via jarvis_config.runtime_get)
    mode      dict  modes.mode_info() — active, since, reason, description,
                    overrides, available=[{name, description}]

Home Assistant's ``update_coordinator`` helper is imported defensively: the
unit-test harness stubs only a few HA modules, and ``websocket.py`` /
``config_apply.py`` import this module lazily for :func:`request_refresh`.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback

from . import panel_data
from .entity_filter import is_own_entity
from .const import (
    COORDINATOR_DEBOUNCE_S,
    COORDINATOR_REFRESH_DOMAINS,
    COORDINATOR_UPDATE_INTERVAL_S,
    DATA_COORDINATOR,
    DOMAIN,
)

try:
    from homeassistant.helpers.update_coordinator import (
        DataUpdateCoordinator,
        UpdateFailed,
    )
except ImportError:  # pragma: no cover - unit harness without HA's helper
    class UpdateFailed(Exception):  # type: ignore[no-redef]
        """Stand-in so this module imports under the unit-test HA stubs."""

    class DataUpdateCoordinator:  # type: ignore[no-redef]
        """Stand-in base: only request_refresh() is usable without real HA."""

        def __class_getitem__(cls, _item: Any) -> type:
            return cls

_LOGGER = logging.getLogger(__name__)


def _exposed_settings(hass: HomeAssistant, entry) -> dict:
    """Current value of every exposed config field (in-memory reads)."""
    out: dict = {}
    try:
        from . import config_apply, jarvis_config
        for key, spec in config_apply.CONFIG_FIELDS.items():
            if not spec.expose:
                continue
            try:
                out[key] = jarvis_config.runtime_get(hass, entry, key, spec.default)
            except Exception:
                out[key] = spec.default
    except Exception as exc:  # noqa: BLE001 - never fail a snapshot over settings
        _LOGGER.debug("exposed settings unavailable: %s", exc)
    return out


def _mode_info() -> dict:
    """modes.mode_info(), never raising (runs in the executor: first call may load)."""
    try:
        from . import modes
        return modes.mode_info()
    except Exception:
        return {}


def _warm_config() -> None:
    """Load config.json into jarvis_config's cache (blocking; executor only)."""
    try:
        from . import jarvis_config
        jarvis_config.get_all()
    except Exception:
        pass


class JarvisCoordinator(DataUpdateCoordinator[dict]):
    """Polls ``panel_data.build_snapshot`` and refreshes on relevant state changes."""

    def __init__(self, hass: HomeAssistant, entry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} snapshot",
            update_interval=timedelta(seconds=COORDINATOR_UPDATE_INTERVAL_S),
        )
        self.entry = entry
        self._unsub_state_changed = None
        self._debounce_unsub = None

    # ── DataUpdateCoordinator hooks ──────────────────────────────────────────
    async def _async_setup(self) -> None:
        # Warm the config cache off-loop so the first snapshot's many
        # jarvis_config reads never touch disk on the event loop.
        await self.hass.async_add_executor_job(_warm_config)

    async def _async_update_data(self) -> dict:
        try:
            snapshot = await panel_data.build_snapshot(self.hass, self.entry)
        except Exception as exc:  # noqa: BLE001 - surfaced as UpdateFailed
            raise UpdateFailed(f"snapshot failed: {exc}") from exc
        snapshot["settings"] = _exposed_settings(self.hass, self.entry)
        snapshot["mode"] = await self.hass.async_add_executor_job(_mode_info)
        return snapshot

    # ── state_changed → debounced refresh ────────────────────────────────────
    @callback
    def async_start_listening(self) -> None:
        """Install the state_changed listener (idempotent)."""
        if self._unsub_state_changed is not None:
            return
        self._unsub_state_changed = self.hass.bus.async_listen(
            "state_changed", self._handle_state_changed)

    @callback
    def _handle_state_changed(self, event) -> None:
        entity_id = str((event.data or {}).get("entity_id") or "")
        if entity_id.split(".", 1)[0] not in COORDINATOR_REFRESH_DOMAINS:
            return
        if is_own_entity(self.hass, entity_id):
            return  # our own sensors echo every refresh; never refresh on the echo
        if self._debounce_unsub is not None:
            return  # a refresh is already pending — absorb the burst
        from homeassistant.helpers.event import async_call_later
        self._debounce_unsub = async_call_later(
            self.hass, COORDINATOR_DEBOUNCE_S, self._fire_debounced_refresh)

    @callback
    def _fire_debounced_refresh(self, _now) -> None:
        # NB: not `_debounced_refresh` — that name is the base class's Debouncer.
        self._debounce_unsub = None
        self.hass.async_create_task(self.async_request_refresh())

    async def async_shutdown(self) -> None:
        """Cancel the debounce timer and listener, then stop polling."""
        if self._debounce_unsub is not None:
            try:
                self._debounce_unsub()
            except Exception:
                pass
            self._debounce_unsub = None
        if self._unsub_state_changed is not None:
            try:
                self._unsub_state_changed()
            except Exception:
                pass
            self._unsub_state_changed = None
        await super().async_shutdown()


def get_coordinator(hass: HomeAssistant, entry_id: str | None = None):
    """The entry's coordinator (first entry when ``entry_id`` is None), or None."""
    try:
        store = hass.data.get(DOMAIN) or {}
        if entry_id is not None:
            data = store.get(entry_id)
            return data.get(DATA_COORDINATOR) if isinstance(data, dict) else None
        for data in store.values():
            if isinstance(data, dict) and data.get(DATA_COORDINATOR) is not None:
                return data[DATA_COORDINATOR]
    except Exception:
        pass
    return None


def request_refresh(hass: HomeAssistant) -> None:
    """Best-effort: ask every entry's coordinator to refresh soon. Never raises;
    must be called from the event loop (all current callers are)."""
    try:
        for data in list((hass.data.get(DOMAIN) or {}).values()):
            if not isinstance(data, dict):
                continue
            coord = data.get(DATA_COORDINATOR)
            if coord is None:
                continue
            hass.async_create_task(coord.async_request_refresh())
    except Exception as exc:  # noqa: BLE001 - a missed refresh is never fatal
        _LOGGER.debug("coordinator refresh request skipped: %s", exc)
