"""JARVIS binary_sensor platform (fork Phase 1).

Every entity reads :class:`~.coordinator.JarvisCoordinator` data only — nothing
here touches disk, the registries' slow paths, or the network.

Entities
--------
* ``<Area name> occupied`` — one per row of ``coordinator.data["areas"]``
  (device_class OCCUPANCY, unique_id ``<entry_id>_area_<area_id>_occupied``).
  Rows that appear later (a room gains its first sensor) are added by a
  coordinator listener that diffs area ids; rows that vanish leave their entity
  ``unavailable`` rather than deleting it, so history and dashboards survive.
* ``Lockdown`` — ``data["lockdown"]["active"]`` (device_class SAFETY).
* ``Intrusion`` — ``data["intrusion"]["active"]``; ``confirmed`` and the
  investigation's breach/path/zones ride along as attributes.
* ``Asleep`` — ``data["status"]["sleep"]["state"] == "ASLEEP"``.

Area placement
~~~~~~~~~~~~~~
The occupied entities deliberately carry **no HA area**. JARVIS discovers
presence by scanning every ``binary_sensor`` with device_class occupancy/motion/
presence whose entity (or device) area matches (``audio_routing.
presence_entities_in_area``, ``panel_data._entities_in_area``), and neither
scan skips JARVIS's own entities. Placing ``binary_sensor.jarvis_kitchen_occupied``
in *Kitchen* would therefore feed its own state back into the occupancy it
mirrors — once "on" it would keep the room occupied forever, and every room
would gain a permanent ``mmwave`` capability. Until those scans exclude
``platform == DOMAIN`` entities the room stays on the JARVIS device; the
``area_id`` attribute still says which room each entity mirrors.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity
from .panel_data import area_rows

_LOGGER = logging.getLogger(__name__)

# Row keys mirrored verbatim onto the occupied entity's attributes.
AREA_ATTR_KEYS = (
    "lights_on", "lights_total", "temp", "humidity", "last_motion",
    "caps", "bedroom", "temp_entity", "humidity_entity",
)


def _area_key(area_id: str) -> str:
    """unique_id suffix for an area's occupied entity."""
    return f"area_{area_id}_occupied"


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Create the fixed sensors plus one occupied sensor per known area, and
    keep adding occupied sensors as new areas show up in the snapshot."""
    coordinator: JarvisCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]

    known: set[str] = set()

    @callback
    def _sync_areas() -> None:
        new_entities = []
        for row in area_rows(coordinator.data):
            area_id = row.get("id")
            if not isinstance(area_id, str) or not area_id or area_id in known:
                continue
            known.add(area_id)
            new_entities.append(AreaOccupiedSensor(coordinator, area_id, row.get("name")))
        if new_entities:
            _LOGGER.debug("jarvis binary_sensor: adding %d area entities", len(new_entities))
            async_add_entities(new_entities)

    async_add_entities([
        LockdownSensor(coordinator),
        IntrusionSensor(coordinator),
        AsleepSensor(coordinator),
    ])
    _sync_areas()
    entry.async_on_unload(coordinator.async_add_listener(_sync_areas))


class AreaOccupiedSensor(JarvisEntity, BinarySensorEntity):
    """Mirror of one snapshot area row's ``active`` flag."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coordinator: JarvisCoordinator, area_id: str, name: Any) -> None:
        super().__init__(coordinator, key=_area_key(area_id))
        self._area_id = area_id
        # Snapshot name at creation; entity names are registry-stable anyway.
        self._attr_name = f"{name or area_id} occupied"

    def _row(self) -> dict | None:
        for row in area_rows(self.snapshot):
            if row.get("id") == self._area_id:
                return row
        return None

    @property
    def available(self) -> bool:
        return super().available and self._row() is not None

    @property
    def is_on(self) -> bool | None:
        row = self._row()
        if row is None:
            return None
        return bool(row.get("active"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        row = self._row() or {}
        attrs: dict[str, Any] = {"area_id": self._area_id}
        for key in AREA_ATTR_KEYS:
            attrs[key] = row.get(key)
        return attrs


class LockdownSensor(JarvisEntity, BinarySensorEntity):
    """``data["lockdown"]["active"]``."""

    _attr_device_class = BinarySensorDeviceClass.SAFETY
    _attr_name = "Lockdown"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="lockdown")

    def _status(self) -> dict:
        status = self.snapshot.get("lockdown")
        return status if isinstance(status, dict) else {}

    @property
    def is_on(self) -> bool:
        return bool(self._status().get("active"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        status = self._status()
        return {
            "since": status.get("since"),
            "reason": status.get("reason"),
            "auto": status.get("auto"),
            "exempt_windows": status.get("exempt_windows"),
        }


class IntrusionSensor(JarvisEntity, BinarySensorEntity):
    """``data["intrusion"]["active"]`` — an intrusion investigation is running."""

    _attr_device_class = BinarySensorDeviceClass.SAFETY
    _attr_name = "Intrusion"
    _attr_icon = "mdi:shield-alert"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="intrusion_active")

    def _status(self) -> dict:
        status = self.snapshot.get("intrusion")
        return status if isinstance(status, dict) else {}

    @property
    def is_on(self) -> bool:
        return bool(self._status().get("active"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        status = self._status()
        return {
            "confirmed": bool(status.get("confirmed")),
            "breach_area": status.get("breach_area"),
            "breach_name": status.get("breach_name"),
            "path": list(status.get("path") or []),
            "zones": list(status.get("zones") or []),
        }


class AsleepSensor(JarvisEntity, BinarySensorEntity):
    """``status.sleep.state == "ASLEEP"`` (sleep_detection's verdict)."""

    _attr_name = "Asleep"
    _attr_icon = "mdi:sleep"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="asleep")

    @property
    def is_on(self) -> bool:
        status = self.snapshot.get("status") or {}
        sleep = status.get("sleep") if isinstance(status, dict) else None
        state = sleep.get("state") if isinstance(sleep, dict) else None
        return state == "ASLEEP"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"reason": self.snapshot.get("sleep_reason")}
