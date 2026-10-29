"""JARVIS select platform (fork Phase 1).

* ``select.jarvis_mode`` — headline: the operational mode. Options come from
  the coordinator's ``mode.available`` list (``modes.mode_info()``), the
  current option from ``mode.active``. Selecting performs exactly what the
  panel's ``jarvis/mode action=set`` does: ``modes.set_mode`` in the executor,
  ``mode_scene.apply_mode_entry`` best effort, then a coordinator refresh.
* One CONFIG select per ``config_apply.CONFIG_FIELDS`` entry with
  ``kind == "enum"`` and ``expose=True`` (disabled in the registry by default),
  written through :func:`config_apply.async_apply`.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import config_apply
from .const import DATA_COORDINATOR, DOMAIN, SIGNAL_CONFIG_CHANGED
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity

_LOGGER = logging.getLogger(__name__)

MODE_SELECT_REASON = "selected from Home Assistant"
_DEFAULT_MODE = "normal"


def _setting_value(hass: HomeAssistant, entry, key: str, default: Any, snapshot: dict) -> Any:
    """Live value of a setting (runtime_config → config cache → entry →
    snapshot → default). In-memory, never raises."""
    fallback = (snapshot.get("settings") or {}).get(key, default)
    try:
        from . import jarvis_config
        return jarvis_config.runtime_get(hass, entry, key, fallback)
    except Exception:
        return fallback


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: JarvisCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    entities: list[SelectEntity] = [JarvisModeSelect(coordinator)]
    for spec in config_apply.exposed_fields():
        if spec.kind == "enum" and spec.options:
            entities.append(JarvisSettingSelect(coordinator, spec))
    async_add_entities(entities)


class JarvisModeSelect(JarvisEntity, SelectEntity):
    """Headline select: JARVIS's operational mode."""

    _attr_name = "Mode"
    _attr_icon = "mdi:tune-variant"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="mode")
        self._pending: str | None = None  # optimistic value until the next snapshot

    @property
    def _mode(self) -> dict:
        return self.snapshot.get("mode") or {}

    @property
    def options(self) -> list[str]:
        names = [str(m.get("name")) for m in self._mode.get("available") or []
                 if isinstance(m, dict) and m.get("name")]
        active = self.current_option
        if active and active not in names:
            names.append(active)
        return names or [_DEFAULT_MODE]

    @property
    def current_option(self) -> str | None:
        if self._pending is not None:
            return self._pending
        return self._mode.get("active") or _DEFAULT_MODE

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        mode = self._mode
        return {
            "since": mode.get("since"),
            "reason": mode.get("reason"),
            "description": mode.get("description"),
            "overrides": mode.get("overrides"),
        }

    @callback
    def _handle_coordinator_update(self) -> None:
        self._pending = None
        super()._handle_coordinator_update()

    async def async_select_option(self, option: str) -> None:
        from . import modes
        res = await self.hass.async_add_executor_job(modes.set_mode, option, MODE_SELECT_REASON)
        if not res.get("ok"):
            raise HomeAssistantError(res.get("error") or f"cannot set mode {option!r}")
        try:
            from .websocket import jarvis_log
            jarvis_log("MODE", f"mode → {res['mode']} (home assistant)")
        except Exception:
            pass
        try:
            from . import mode_scene
            await mode_scene.apply_mode_entry(self.hass, res["mode"])
        except Exception:
            pass
        self._pending = str(res.get("mode") or option)
        self.async_write_ha_state()
        await self.coordinator.async_request_refresh()


class JarvisSettingSelect(JarvisEntity, SelectEntity):
    """CONFIG select mirroring one enum panel setting."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_entity_registry_enabled_default = False

    def __init__(self, coordinator: JarvisCoordinator, spec: config_apply.FieldSpec) -> None:
        super().__init__(coordinator, key=spec.key)
        self._spec = spec
        self._attr_name = spec.label or spec.key.replace("_", " ").capitalize()
        self._attr_options = [str(o) for o in (spec.options or ())]

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_CONFIG_CHANGED, self._on_config_changed))

    @callback
    def _on_config_changed(self, key: str, _value: Any) -> None:
        if key == self._spec.key:
            self.async_write_ha_state()

    @property
    def current_option(self) -> str | None:
        value = _setting_value(
            self.hass, self.coordinator.entry, self._spec.key, self._spec.default, self.snapshot)
        if value is None:
            value = self._spec.default
        text = str(value) if value is not None else None
        return text if text in self._attr_options else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"setting": self._spec.key, "category": self._spec.category}

    async def async_select_option(self, option: str) -> None:
        await config_apply.async_apply(self.hass, self.coordinator.entry, self._spec.key, option)
        self.async_write_ha_state()
        await self.coordinator.async_request_refresh()
