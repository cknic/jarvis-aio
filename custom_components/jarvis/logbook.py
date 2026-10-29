"""Logbook descriptions for JARVIS's bus events (fork Phase 1).

Home Assistant's logbook shows raw ``jarvis_*`` events as nothing at all
unless the integration teaches it how to describe them. This platform is
discovered by ``homeassistant.components.logbook`` (``logbook`` is already in
``manifest.json``'s ``after_dependencies``) and registers one describer per
event type so the household sees lines like

    JARVIS                 Front door: opened while nobody is home
    JARVIS camera          saw a person on Driveway (87%)
    JARVIS intrusion       confirmed an intrusion: motion after lockdown

Every describer reads only the event's own ``data`` dict (the payloads are
documented at each ``hass.bus.async_fire`` site: output_gate, camera,
recognition, cognitive_core, __init__) and never raises — a malformed payload
degrades to a generic message rather than breaking the logbook stream.

:func:`describe` is the pure core, usable without Home Assistant's logbook
component (tests, the panel), and :func:`async_describe_events` is the hook
logbook calls.
"""
from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from homeassistant.components.logbook import (
    LOGBOOK_ENTRY_ENTITY_ID,
    LOGBOOK_ENTRY_ICON,
    LOGBOOK_ENTRY_MESSAGE,
    LOGBOOK_ENTRY_NAME,
)
from homeassistant.core import Event, HomeAssistant, callback

from .const import DOMAIN

# ── Event types this integration fires ───────────────────────────────────────
EVENT_ACTIVITY = "jarvis_activity"                      # output_gate (activity_log mirror)
EVENT_CAMERA = "jarvis_camera_event"                    # camera.py (nest / frigate)
EVENT_FACE_RECOGNIZED = "jarvis_face_recognized"        # recognition.py
EVENT_PERSON_DETECTED = "jarvis_person_detected"        # recognition.py
EVENT_INTRUSION_CONFIRMED = "jarvis_intrusion_confirmed"      # cognitive_core.py
EVENT_INTRUSION_UNRESOLVED = "jarvis_intrusion_unresolved"    # cognitive_core.py
EVENT_OBSERVER_NAP = "jarvis_observer_nap"              # __init__ service jarvis.nap
EVENT_OBSERVER_SHUSHED = "jarvis_observer_shushed"      # __init__ service jarvis.shush
EVENT_OBSERVER_UNSHUSHED = "jarvis_observer_unshushed"  # __init__ service jarvis.unshush
EVENT_OBSERVER_STATUS = "jarvis_observer_status"        # __init__ service jarvis.observer_status
EVENT_AUTOMATION_CREATED = "jarvis_automation_created"  # __init__ service jarvis.create_automation

NAME_JARVIS = "JARVIS"
NAME_CAMERA = "JARVIS camera"
NAME_RECOGNITION = "JARVIS recognition"
NAME_INTRUSION = "JARVIS intrusion"
NAME_OBSERVER = "JARVIS observer"
NAME_AUTOMATION = "JARVIS automation"

_URGENCY_ICON = {
    "critical": "mdi:alert-octagon",
    "high": "mdi:alert",
    "medium": "mdi:information",
    "low": "mdi:information-outline",
}


# ── Small, never-raising field readers ───────────────────────────────────────
def _s(data: Mapping[str, Any], key: str, default: str = "") -> str:
    """String field or ``default`` (None and non-strings coerced safely)."""
    val = data.get(key)
    if val is None:
        return default
    try:
        text = str(val).strip()
    except Exception:  # noqa: BLE001
        return default
    return text or default


def _entity(data: Mapping[str, Any], *keys: str) -> str | None:
    """First field that looks like an ``entity_id`` (``domain.object``)."""
    for key in keys:
        val = data.get(key)
        if isinstance(val, str) and "." in val and " " not in val:
            return val
    return None


def _camera_label(data: Mapping[str, Any]) -> str:
    """Human camera name: ``camera`` (name) wins, else the entity's object id."""
    name = _s(data, "camera")
    if name and "." not in name:
        return name
    ent = _entity(data, "camera_entity", "entity_id", "camera")
    if ent:
        return ent.split(".", 1)[1].replace("_", " ")
    return "a camera"


def _pct(data: Mapping[str, Any], key: str) -> str:
    """`` (87%)`` suffix from a 0-100 or 0-1 confidence/score, or ``""``."""
    val = data.get(key)
    if val is None or isinstance(val, bool):
        return ""
    try:
        num = float(val)
    except (TypeError, ValueError):
        return ""
    if 0 < num <= 1.0:
        num *= 100
    return f" ({num:.0f}%)"


def _join(items: Any) -> str:
    if not isinstance(items, (list, tuple, set)):
        return ""
    return ", ".join(str(i) for i in items if i)


# ── Describers (one per event type) ──────────────────────────────────────────
def _describe_activity(data: Mapping[str, Any]) -> dict[str, Any]:
    urgency = _s(data, "urgency", "low").lower()
    tag = _s(data, "tag") or _s(data, "category")
    message = _s(data, "message") or (f"{tag} activity" if tag else "activity")
    if urgency in ("high", "critical"):
        message = f"[{urgency}] {message}"
    if "was_spoken" in data and not data.get("was_spoken"):
        message = f"{message} (not spoken)"
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_JARVIS,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: _URGENCY_ICON.get(urgency, "mdi:robot"),
    }
    if ent := _entity(data, "entity_id"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_camera(data: Mapping[str, Any]) -> dict[str, Any]:
    label = _s(data, "label", "motion").replace("_", " ")
    message = f"saw {label} on {_camera_label(data)}{_pct(data, 'confidence')}"
    source = _s(data, "source")
    if source:
        message = f"{message} via {source}"
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_CAMERA,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: "mdi:cctv",
    }
    if ent := _entity(data, "entity_id"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_face(data: Mapping[str, Any]) -> dict[str, Any]:
    name = _s(data, "name", "unknown")
    unknown = bool(data.get("is_unknown")) or name.lower() in ("unknown", "unknown person")
    where = _camera_label(data)
    if unknown:
        message = f"saw an unknown face at {where}{_pct(data, 'confidence')}"
    else:
        rel = _s(data, "relationship")
        who = f"{name} ({rel})" if rel and rel != "resident" else name
        message = f"recognized {who} at {where}{_pct(data, 'confidence')}"
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_RECOGNITION,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: "mdi:face-recognition",
    }
    if ent := _entity(data, "camera_entity"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_person(data: Mapping[str, Any]) -> dict[str, Any]:
    label = _s(data, "label", "person").replace("_", " ")
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_RECOGNITION,
        LOGBOOK_ENTRY_MESSAGE: f"detected a {label} at {_camera_label(data)}{_pct(data, 'score')}",
        LOGBOOK_ENTRY_ICON: "mdi:motion-sensor",
    }
    if ent := _entity(data, "camera_entity"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_intrusion_confirmed(data: Mapping[str, Any]) -> dict[str, Any]:
    reason = _s(data, "reason", "suspicious activity")
    cam = _s(data, "camera")
    message = f"confirmed an intrusion: {reason}"
    if cam:
        message = f"{message} (snapshot from {cam.split('.', 1)[-1].replace('_', ' ')})"
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_INTRUSION,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: "mdi:shield-alert",
    }
    if ent := _entity(data, "camera"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_intrusion_unresolved(data: Mapping[str, Any]) -> dict[str, Any]:
    reason = _s(data, "reason", "no response; unconfirmed activity")
    out: dict[str, Any] = {
        LOGBOOK_ENTRY_NAME: NAME_INTRUSION,
        LOGBOOK_ENTRY_MESSAGE: f"could not resolve suspicious activity: {reason}",
        LOGBOOK_ENTRY_ICON: "mdi:shield-search",
    }
    if ent := _entity(data, "camera"):
        out[LOGBOOK_ENTRY_ENTITY_ID] = ent
    return out


def _describe_nap(data: Mapping[str, Any]) -> dict[str, Any]:
    mins = _s(data, "duration_minutes", "30")
    return {
        LOGBOOK_ENTRY_NAME: NAME_OBSERVER,
        LOGBOOK_ENTRY_MESSAGE: f"napping for {mins} minutes",
        LOGBOOK_ENTRY_ICON: "mdi:sleep",
    }


def _describe_shushed(data: Mapping[str, Any]) -> dict[str, Any]:
    if data.get("all"):
        message = "shushed all announcements"
    else:
        parts = [p for p in (_join(data.get("muted_entities")),
                             _join(data.get("muted_categories"))) if p]
        message = f"shushed {', '.join(parts)}" if parts else "shushed"
    return {
        LOGBOOK_ENTRY_NAME: NAME_OBSERVER,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: "mdi:volume-off",
    }


def _describe_unshushed(data: Mapping[str, Any]) -> dict[str, Any]:
    parts = [p for p in (_join(data.get("cleared_entities")),
                         _join(data.get("cleared_categories"))) if p]
    if data.get("blanket_cleared") or not parts:
        message = "cleared all mutes"
    else:
        message = f"unmuted {', '.join(parts)}"
    return {
        LOGBOOK_ENTRY_NAME: NAME_OBSERVER,
        LOGBOOK_ENTRY_MESSAGE: message,
        LOGBOOK_ENTRY_ICON: "mdi:volume-high",
    }


def _describe_status(data: Mapping[str, Any]) -> dict[str, Any]:
    running = data.get("running")
    state = "running" if running else ("stopped" if running is not None else "status")
    spoken = data.get("announcements_last_hour")
    bits = [state]
    if isinstance(spoken, int):
        bits.append(f"{spoken} announcement{'s' if spoken != 1 else ''} in the last hour")
    if data.get("sleeping"):
        reason = _s(data, "sleep_reason")
        bits.append(f"household asleep ({reason})" if reason else "household asleep")
    return {
        LOGBOOK_ENTRY_NAME: NAME_OBSERVER,
        LOGBOOK_ENTRY_MESSAGE: ", ".join(bits),
        LOGBOOK_ENTRY_ICON: "mdi:eye",
    }


def _describe_automation_created(data: Mapping[str, Any]) -> dict[str, Any]:
    alias = _s(data, "alias", "an automation")
    return {
        LOGBOOK_ENTRY_NAME: NAME_AUTOMATION,
        LOGBOOK_ENTRY_MESSAGE: f"created automation {alias}",
        LOGBOOK_ENTRY_ICON: "mdi:robot-happy",
    }


DESCRIBERS: dict[str, Callable[[Mapping[str, Any]], dict[str, Any]]] = {
    EVENT_ACTIVITY: _describe_activity,
    EVENT_CAMERA: _describe_camera,
    EVENT_FACE_RECOGNIZED: _describe_face,
    EVENT_PERSON_DETECTED: _describe_person,
    EVENT_INTRUSION_CONFIRMED: _describe_intrusion_confirmed,
    EVENT_INTRUSION_UNRESOLVED: _describe_intrusion_unresolved,
    EVENT_OBSERVER_NAP: _describe_nap,
    EVENT_OBSERVER_SHUSHED: _describe_shushed,
    EVENT_OBSERVER_UNSHUSHED: _describe_unshushed,
    EVENT_OBSERVER_STATUS: _describe_status,
    EVENT_AUTOMATION_CREATED: _describe_automation_created,
}

DESCRIBED_EVENTS: tuple[str, ...] = tuple(DESCRIBERS)


def describe(event_type: str, data: Mapping[str, Any] | None) -> dict[str, Any] | None:
    """Pure describer: logbook entry dict for ``event_type``/``data``, or None.

    Never raises — a describer error falls back to a bare ``{name, message}``
    so the logbook stream keeps flowing.
    """
    fn = DESCRIBERS.get(event_type)
    if fn is None:
        return None
    payload: Mapping[str, Any] = data if isinstance(data, Mapping) else {}
    try:
        return fn(payload)
    except Exception:  # noqa: BLE001 - describers are best effort
        return {
            LOGBOOK_ENTRY_NAME: NAME_JARVIS,
            LOGBOOK_ENTRY_MESSAGE: event_type.removeprefix("jarvis_").replace("_", " "),
        }


def _make_describer(event_type: str) -> Callable[[Event], dict[str, Any]]:
    @callback
    def _describe(event: Event) -> dict[str, Any]:
        out = describe(event_type, getattr(event, "data", None))
        return out if out is not None else {LOGBOOK_ENTRY_NAME: NAME_JARVIS}

    return _describe


@callback
def async_describe_events(
    hass: HomeAssistant,
    async_describe_event: Callable[[str, str, Callable[[Event], dict[str, Any]]], None],
) -> None:
    """Teach Home Assistant's logbook about every ``jarvis_*`` event."""
    for event_type in DESCRIBED_EVENTS:
        async_describe_event(DOMAIN, event_type, _make_describer(event_type))
