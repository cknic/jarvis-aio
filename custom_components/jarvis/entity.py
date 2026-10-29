"""Shared entity base for JARVIS's native Home Assistant entities (fork Phase 0).

Every platform entity derives from :class:`JarvisEntity`, which binds to the
snapshot coordinator and attaches to the single "JARVIS" device so the
integration shows up as one device with many entities.

Usage from a platform::

    class ObserverSwitch(JarvisEntity, SwitchEntity):
        _attr_translation_key = "observer"      # or _attr_name = "Observer"
        def __init__(self, coordinator):
            super().__init__(coordinator, key="observer_enabled")
        @property
        def is_on(self):
            return bool(self.snapshot.get("settings", {}).get("observer_enabled"))

``key`` becomes the unique_id suffix (``<entry_id>_<key>``); pass ``None`` to
set ``_attr_unique_id`` yourself.
"""
from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DEVICE_MANUFACTURER, DEVICE_MODEL, DEVICE_NAME, DOMAIN
from .coordinator import JarvisCoordinator
from .panel_data import _INTEGRATION_VERSION


def device_info_for(entry) -> DeviceInfo:
    """The one JARVIS device every entity attaches to."""
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name=DEVICE_NAME,
        manufacturer=DEVICE_MANUFACTURER,
        model=DEVICE_MODEL,
        sw_version=_INTEGRATION_VERSION,
    )


class JarvisEntity(CoordinatorEntity[JarvisCoordinator]):
    """Coordinator-backed entity attached to the JARVIS device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: JarvisCoordinator, key: str | None = None) -> None:
        super().__init__(coordinator)
        self._key = key
        if key is not None:
            self._attr_unique_id = f"{coordinator.entry.entry_id}_{key}"
        self._attr_device_info = device_info_for(coordinator.entry)

    @property
    def snapshot(self) -> dict:
        """The coordinator's latest snapshot (``{}`` before the first refresh)."""
        return self.coordinator.data or {}
