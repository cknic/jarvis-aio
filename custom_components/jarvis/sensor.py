"""JARVIS sensor platform (fork Phase 1).

Every entity reads :class:`~.coordinator.JarvisCoordinator` data only. The
snapshot schema is documented in :mod:`.panel_data`; the status tiles are the
same strings the panel renders, so the sensors parse them rather than
re-deriving anything.

Entities (all enabled by default):

================  ==================================  =============================
unique_id suffix  state                               attributes
================  ==================================  =============================
observer          RUNNING / READY / DISABLED          level
dominant_area     dominant.name (room, AWAY, AT HOME) area_id, subtitle, temp,
                                                      humidity, lights, last_motion
satellites        "<avail>/<total>" or "0"            available, total, level
llm_providers     int: configured providers           level, status (raw tile text)
uptime            meta.uptime (text, e.g. "3d 4h")    — (DIAGNOSTIC)
announcements_today  int, MEASUREMENT                 — (DIAGNOSTIC)
suggestions       int: pending automation suggestions items (first 20 rows)
goals             int: tracked goals                  items (first 20 rows)
================  ==================================  =============================
"""
from __future__ import annotations

import re
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity
from .panel_data import status_tiles

# How many suggestion / goal rows ride along as attributes (recorder-friendly).
ITEMS_LIMIT = 20

_SATELLITES_RE = re.compile(r"^\s*(\d+)\s*/\s*(\d+)\s*$")
_LEADING_INT_RE = re.compile(r"^\s*(\d+)")


def parse_satellites(tile_state: Any) -> tuple[int, int]:
    """``"3 / 4"`` → ``(3, 4)``; ``"NONE"`` (or anything else) → ``(0, 0)``."""
    match = _SATELLITES_RE.match(str(tile_state or ""))
    if not match:
        return 0, 0
    return int(match.group(1)), int(match.group(2))


def parse_leading_int(tile_state: Any) -> int:
    """``"2 READY"`` → ``2``; ``"UNSET"`` (or anything else) → ``0``."""
    match = _LEADING_INT_RE.match(str(tile_state or ""))
    return int(match.group(1)) if match else 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: JarvisCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    async_add_entities([
        ObserverSensor(coordinator),
        DominantAreaSensor(coordinator),
        SatellitesSensor(coordinator),
        LlmProvidersSensor(coordinator),
        UptimeSensor(coordinator),
        AnnouncementsTodaySensor(coordinator),
        SuggestionsSensor(coordinator),
        GoalsSensor(coordinator),
    ])


class _TileSensor(JarvisEntity, SensorEntity):
    """Base for sensors that mirror one ``status`` tile."""

    _tile: str = ""

    def _tile_data(self) -> dict:
        tile = status_tiles(self.snapshot).get(self._tile)
        return tile if isinstance(tile, dict) else {}


class ObserverSensor(_TileSensor):
    """``status.observer.state`` — RUNNING, READY or DISABLED."""

    _tile = "observer"
    _attr_name = "Observer"
    _attr_icon = "mdi:eye-outline"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="observer")

    @property
    def native_value(self) -> str | None:
        state = self._tile_data().get("state")
        return str(state) if state is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"level": self._tile_data().get("level")}


class DominantAreaSensor(JarvisEntity, SensorEntity):
    """``dominant.name`` — the liveliest room, or AWAY / AT HOME."""

    _attr_name = "Dominant area"
    _attr_icon = "mdi:home-account"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="dominant_area")

    def _dominant(self) -> dict:
        dominant = self.snapshot.get("dominant")
        return dominant if isinstance(dominant, dict) else {}

    @property
    def native_value(self) -> str | None:
        name = self._dominant().get("name")
        return str(name) if name is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        dominant = self._dominant()
        return {
            key: dominant.get(key)
            for key in ("area_id", "subtitle", "temp", "humidity", "lights", "last_motion")
        }


class SatellitesSensor(_TileSensor):
    """``"<avail>/<total>"`` voice satellites, ``"0"`` when none exist."""

    _tile = "satellites"
    _attr_name = "Satellites"
    _attr_icon = "mdi:microphone-outline"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="satellites")

    @property
    def native_value(self) -> str:
        avail, total = parse_satellites(self._tile_data().get("state"))
        return f"{avail}/{total}" if total else "0"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        tile = self._tile_data()
        avail, total = parse_satellites(tile.get("state"))
        return {"available": avail, "total": total, "level": tile.get("level")}


class LlmProvidersSensor(_TileSensor):
    """Number of LLM providers with a usable credential or endpoint."""

    _tile = "llm_providers"
    _attr_name = "LLM providers"
    _attr_icon = "mdi:brain"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="llm_providers")

    @property
    def native_value(self) -> int:
        return parse_leading_int(self._tile_data().get("state"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        tile = self._tile_data()
        return {"level": tile.get("level"), "status": tile.get("state")}


class UptimeSensor(JarvisEntity, SensorEntity):
    """``meta.uptime`` as the panel formats it (e.g. ``"3d 4h"``)."""

    _attr_name = "Uptime"
    _attr_icon = "mdi:timer-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="uptime")

    @property
    def native_value(self) -> str | None:
        meta = self.snapshot.get("meta") or {}
        value = meta.get("uptime") if isinstance(meta, dict) else None
        return str(value) if value is not None else None


class AnnouncementsTodaySensor(JarvisEntity, SensorEntity):
    """``meta.announcements_today``."""

    _attr_name = "Announcements today"
    _attr_icon = "mdi:bullhorn-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="announcements_today")

    @property
    def native_value(self) -> int | None:
        meta = self.snapshot.get("meta") or {}
        value = meta.get("announcements_today") if isinstance(meta, dict) else None
        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None


class _ListCountSensor(JarvisEntity, SensorEntity):
    """Count of a top-level snapshot list, with the first rows as ``items``."""

    _list_key: str = ""
    _attr_state_class = SensorStateClass.MEASUREMENT

    def _items(self) -> list:
        items = self.snapshot.get(self._list_key)
        return items if isinstance(items, list) else []

    @property
    def native_value(self) -> int:
        return len(self._items())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"items": self._items()[:ITEMS_LIMIT]}


class SuggestionsSensor(_ListCountSensor):
    """Pending automation suggestions awaiting review."""

    _list_key = "suggestions"
    _attr_name = "Suggestions"
    _attr_icon = "mdi:lightbulb-on-outline"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="suggestions")


class GoalsSensor(_ListCountSensor):
    """Goals JARVIS is tracking."""

    _list_key = "goals"
    _attr_name = "Goals"
    _attr_icon = "mdi:flag-checkered"

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="goals")
