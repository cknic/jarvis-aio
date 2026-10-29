"""JARVIS number platform (fork Phase 1).

One CONFIG number (box mode, disabled in the registry by default) per
``config_apply.CONFIG_FIELDS`` entry with ``kind in {"int", "float"}`` and
``expose=True``; min/max/step come from the spec and writes go through
:func:`config_apply.async_apply`. Values are read from the in-memory runtime
config / coordinator snapshot — never from disk.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.number import NumberEntity, NumberMode
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

NUMERIC_KINDS = ("int", "float")


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
    async_add_entities(
        JarvisSettingNumber(coordinator, spec)
        for spec in config_apply.exposed_fields()
        if spec.kind in NUMERIC_KINDS
    )


class JarvisSettingNumber(JarvisEntity, NumberEntity):
    """CONFIG number mirroring one int/float panel setting."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_entity_registry_enabled_default = False
    _attr_mode = NumberMode.BOX

    def __init__(self, coordinator: JarvisCoordinator, spec: config_apply.FieldSpec) -> None:
        super().__init__(coordinator, key=spec.key)
        self._spec = spec
        self._attr_name = spec.label or spec.key.replace("_", " ").capitalize()
        if spec.min is not None:
            self._attr_native_min_value = float(spec.min)
        if spec.max is not None:
            self._attr_native_max_value = float(spec.max)
        if spec.step is not None:
            self._attr_native_step = float(spec.step)
        elif spec.kind == "int":
            self._attr_native_step = 1.0

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_CONFIG_CHANGED, self._on_config_changed))

    @callback
    def _on_config_changed(self, key: str, _value: Any) -> None:
        if key == self._spec.key:
            self.async_write_ha_state()

    @property
    def native_value(self) -> float | None:
        value = _setting_value(
            self.hass, self.coordinator.entry, self._spec.key, self._spec.default, self.snapshot)
        if value in (None, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"setting": self._spec.key, "category": self._spec.category}

    async def async_set_native_value(self, value: float) -> None:
        out: int | float = int(round(value)) if self._spec.kind == "int" else float(value)
        await config_apply.async_apply(self.hass, self.coordinator.entry, self._spec.key, out)
        self.async_write_ha_state()
        await self.coordinator.async_request_refresh()
