"""JARVIS event platform (fork Phase 1).

Three headline ``event`` entities on the JARVIS device, each a thin bridge from
a ``jarvis_*`` bus event to Home Assistant's event entity model so automations
can trigger on "JARVIS announced something critical" or "the driveway camera
saw a vehicle" without parsing raw bus payloads:

    event.jarvis_activity   every activity_log row (fired by output_gate as
                            ``jarvis_activity``); event_type = urgency
    event.jarvis_camera     ``jarvis_camera_event`` (nest / frigate); event_type
                            = a normalised kind of the detector label
    event.jarvis_intrusion  ``jarvis_intrusion_confirmed`` / ``_unresolved``

State is the last event's timestamp (HA semantics); the triggering payload is
kept in the entity's attributes. Nothing here blocks the loop — the bus
listeners are ``@callback``s and the entities read nothing from disk.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.event import EventEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_COORDINATOR, DOMAIN, URGENCY_LEVELS
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity
from .logbook import (
    EVENT_ACTIVITY,
    EVENT_CAMERA,
    EVENT_INTRUSION_CONFIRMED,
    EVENT_INTRUSION_UNRESOLVED,
)

_LOGGER = logging.getLogger(__name__)

# activity_log urgencies (const.URGENCY_LEVELS, highest first) plus "info" as
# the bucket for anything a caller invents, so _trigger_event never raises.
ACTIVITY_EVENT_TYPES: list[str] = [*reversed(URGENCY_LEVELS), "info"]

# jarvis_camera_event carries the detector's free-form ``label`` (frigate object
# labels, nest event types); fold it into a small fixed vocabulary.
CAMERA_EVENT_TYPES: list[str] = [
    "person", "vehicle", "animal", "package", "doorbell", "motion", "object",
]
_CAMERA_KINDS: dict[str, str] = {
    "person": "person", "people": "person", "face": "person",
    "car": "vehicle", "truck": "vehicle", "bus": "vehicle", "motorcycle": "vehicle",
    "bicycle": "vehicle", "vehicle": "vehicle", "boat": "vehicle",
    "dog": "animal", "cat": "animal", "bird": "animal", "animal": "animal",
    "horse": "animal", "deer": "animal", "squirrel": "animal", "rabbit": "animal",
    "package": "package", "parcel": "package", "box": "package",
    "doorbell": "doorbell", "doorbell_chime": "doorbell", "chime": "doorbell",
    "motion": "motion", "camera_motion": "motion",
}

INTRUSION_EVENT_TYPES: list[str] = ["confirmed", "unresolved"]


def camera_kind(label: Any) -> str:
    """Map a detector label onto one of :data:`CAMERA_EVENT_TYPES`."""
    text = str(label or "").strip().lower()
    if not text:
        return "motion"
    if text in _CAMERA_KINDS:
        return _CAMERA_KINDS[text]
    for needle, kind in _CAMERA_KINDS.items():
        if needle in text:
            return kind
    return "object"


def activity_kind(urgency: Any) -> str:
    """Map an activity_log urgency onto :data:`ACTIVITY_EVENT_TYPES`."""
    text = str(urgency or "").strip().lower()
    return text if text in ACTIVITY_EVENT_TYPES else "info"


class _BusEventEntity(JarvisEntity, EventEntity):
    """Event entity that re-emits selected ``jarvis_*`` bus events."""

    _bus_events: tuple[str, ...] = ()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        for event_type in self._bus_events:
            self.async_on_remove(
                self.hass.bus.async_listen(event_type, self._handle_bus_event)
            )

    @callback
    def _handle_bus_event(self, event: Event) -> None:
        data = event.data if isinstance(event.data, dict) else {}
        try:
            kind, attrs = self._translate(event.event_type, data)
            self._trigger_event(kind, attrs)
        except Exception as exc:  # noqa: BLE001 - never let a bad payload kill the listener
            _LOGGER.debug("%s: ignoring %s payload (%s)", self.entity_id, event.event_type, exc)
            return
        self.async_write_ha_state()

    def _translate(self, event_type: str, data: dict) -> tuple[str, dict[str, Any]]:
        raise NotImplementedError


class JarvisActivityEvent(_BusEventEntity):
    """Mirror of the activity log — fires on every ``jarvis_activity``."""

    _attr_name = "Activity"
    _attr_icon = "mdi:message-text"
    _attr_event_types = ACTIVITY_EVENT_TYPES
    _bus_events = (EVENT_ACTIVITY,)

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="activity")

    def _translate(self, event_type: str, data: dict) -> tuple[str, dict[str, Any]]:
        return activity_kind(data.get("urgency")), {
            "tag": str(data.get("tag") or ""),
            "message": str(data.get("message") or ""),
            "entity_id": str(data.get("entity_id") or ""),
            "source": str(data.get("source") or ""),
            "was_spoken": bool(data.get("was_spoken")),
        }


class JarvisCameraEvent(_BusEventEntity):
    """Camera detections (``jarvis_camera_event`` from nest / frigate)."""

    _attr_name = "Camera"
    _attr_icon = "mdi:cctv"
    _attr_event_types = CAMERA_EVENT_TYPES
    _bus_events = (EVENT_CAMERA,)

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="camera")

    def _translate(self, event_type: str, data: dict) -> tuple[str, dict[str, Any]]:
        confidence = data.get("confidence")
        return camera_kind(data.get("label")), {
            "label": str(data.get("label") or ""),
            "camera_entity": str(data.get("entity_id") or ""),
            "source": str(data.get("source") or ""),
            "confidence": confidence if isinstance(confidence, (int, float)) else None,
        }


class JarvisIntrusionEvent(_BusEventEntity):
    """Intrusion outcomes from the cognitive core."""

    _attr_name = "Intrusion"
    _attr_icon = "mdi:shield-alert"
    _attr_event_types = INTRUSION_EVENT_TYPES
    _bus_events = (EVENT_INTRUSION_CONFIRMED, EVENT_INTRUSION_UNRESOLVED)

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="intrusion")

    def _translate(self, event_type: str, data: dict) -> tuple[str, dict[str, Any]]:
        kind = "confirmed" if event_type == EVENT_INTRUSION_CONFIRMED else "unresolved"
        return kind, {
            "reason": str(data.get("reason") or ""),
            "camera": str(data.get("camera") or ""),
            "snapshot_url": str(data.get("snapshot_url") or ""),
        }


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Create the three JARVIS event entities."""
    coordinator: JarvisCoordinator | None = (
        hass.data.get(DOMAIN, {}).get(entry.entry_id, {}).get(DATA_COORDINATOR)
    )
    if coordinator is None:
        _LOGGER.warning("JARVIS event platform: no coordinator for %s; skipping", entry.entry_id)
        return
    async_add_entities([
        JarvisActivityEvent(coordinator),
        JarvisCameraEvent(coordinator),
        JarvisIntrusionEvent(coordinator),
    ])
