"""JARVIS switch platform (fork Phase 1).

* ``switch.jarvis_observer`` — headline: the Observer on/off. ``is_on`` is
  true while the observer reports RUNNING in the snapshot or the
  ``observer_enabled`` setting is on; toggling goes through
  :func:`config_apply.async_apply` (which starts/stops the observer and
  maintains ``observer_running``).
* One CONFIG switch per ``config_apply.CONFIG_FIELDS`` entry with
  ``kind == "bool"`` and ``expose=True`` (disabled in the registry by default;
  ``observer_enabled`` is covered by the headline switch and skipped here).

State is read from the coordinator snapshot / the in-memory runtime config —
never from disk. Writes await the coordinator refresh and listen to
``SIGNAL_CONFIG_CHANGED`` so a panel edit is mirrored without waiting for the
next poll.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import config_apply
from .const import DATA_COORDINATOR, DOMAIN, SIGNAL_CONFIG_CHANGED
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity

_LOGGER = logging.getLogger(__name__)

OBSERVER_KEY = "observer_enabled"


def _setting_value(hass: HomeAssistant, entry, key: str, default: Any, snapshot: dict) -> Any:
    """Live value of a setting: runtime_config → config.json cache → entry →
    coordinator snapshot → spec default. In-memory, never raises."""
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
    entities: list[SwitchEntity] = [JarvisObserverSwitch(coordinator)]
    for spec in config_apply.exposed_fields():
        if spec.kind != "bool" or spec.key == OBSERVER_KEY:
            continue
        entities.append(JarvisSettingSwitch(coordinator, spec))
    async_add_entities(entities)


class _JarvisSwitchBase(JarvisEntity, SwitchEntity):
    """A switch mirroring one CONFIG_FIELDS key, written via config_apply."""

    _setting_key: str

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_CONFIG_CHANGED, self._on_config_changed))

    @callback
    def _on_config_changed(self, key: str, _value: Any) -> None:
        if key == self._setting_key:
            self.async_write_ha_state()

    async def _apply(self, value: bool) -> None:
        await config_apply.async_apply(self.hass, self.coordinator.entry, self._setting_key, value)
        self.async_write_ha_state()
        await self.coordinator.async_request_refresh()

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._apply(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._apply(False)


class JarvisObserverSwitch(_JarvisSwitchBase):
    """Headline switch: the Observer (learning loop) on/off."""

    _attr_name = "Observer"
    _attr_icon = "mdi:eye-outline"
    _setting_key = OBSERVER_KEY

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="observer")

    @property
    def is_on(self) -> bool:
        status = (self.snapshot.get("status") or {}).get("observer") or {}
        if str(status.get("state", "")).upper() == "RUNNING":
            return True
        return bool(_setting_value(
            self.hass, self.coordinator.entry, OBSERVER_KEY, False, self.snapshot))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        status = (self.snapshot.get("status") or {}).get("observer") or {}
        return {"observer_state": status.get("state"), "level": status.get("level")}


class JarvisSettingSwitch(_JarvisSwitchBase):
    """CONFIG switch mirroring one boolean panel setting."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_entity_registry_enabled_default = False

    def __init__(self, coordinator: JarvisCoordinator, spec: config_apply.FieldSpec) -> None:
        super().__init__(coordinator, key=spec.key)
        self._spec = spec
        self._setting_key = spec.key
        self._attr_name = spec.label or spec.key.replace("_", " ").capitalize()

    @property
    def is_on(self) -> bool:
        value = _setting_value(
            self.hass, self.coordinator.entry, self._spec.key,
            bool(self._spec.default), self.snapshot)
        if isinstance(value, str):
            return value.strip().lower() in ("1", "true", "yes", "on")
        return bool(value)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"setting": self._spec.key, "category": self._spec.category}
