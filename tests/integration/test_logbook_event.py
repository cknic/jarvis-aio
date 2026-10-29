"""Event platform + logbook describers against a real Home Assistant (PHACC).

Covers fork Phase 1 task B1c:

* ``output_gate.async_record_announcement`` (the one async funnel that persists
  activity_log rows) also fires ``jarvis_activity`` on the bus;
* ``event.jarvis_activity`` / ``event.jarvis_camera`` / ``event.jarvis_intrusion``
  are created on the JARVIS device and update from those bus events, carrying
  the payload in their attributes;
* ``logbook.async_describe_events`` registers a describer for every ``jarvis_*``
  event and those describers produce the expected human names / messages.

Only provider construction is stubbed (as in test_wiring_smoke). The platform
forward is REAL but narrowed to ``["event"]`` so this test exercises its own
platform without dragging in HA's conversation / stt stacks or the sibling
platforms other tasks are filling in concurrently.
"""
from unittest.mock import patch

import pytest
from homeassistant.components.event import ATTR_EVENT_TYPE, ATTR_EVENT_TYPES
from homeassistant.components.logbook import (
    LOGBOOK_ENTRY_ENTITY_ID,
    LOGBOOK_ENTRY_MESSAGE,
    LOGBOOK_ENTRY_NAME,
)
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
)

from custom_components import jarvis as jarvis_init
from custom_components.jarvis import event as jarvis_event
from custom_components.jarvis import logbook as jarvis_logbook
from custom_components.jarvis import output_gate

DOMAIN = "jarvis"
ENTRY_DATA = {
    "api_key": "", "model": "llama3.1", "honorific": "Sir",
    "llm_provider": "ollama", "llm_base_url": "http://localhost:11434/v1",
    "schema_version": 7,
}


class _FakeProvider:
    name = "fake"

    def chat(self, *a, **k):
        return {"text": "", "tool_calls": [], "raw": None}

    def supports_vision(self):
        return False


class _event_platform_only:
    """Stub the provider and forward ONLY the event platform (real forward)."""

    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch.object(jarvis_init, "PLATFORMS", ["event"]),
        ]
        for p in self._patchers:
            p.start()
        return self

    def __exit__(self, *exc):
        for p in reversed(self._patchers):
            p.stop()
        return False


async def _setup(hass):
    entry = MockConfigEntry(domain=DOMAIN, data=ENTRY_DATA, options={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _teardown(hass, entry):
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


# ── Entities exist, on the JARVIS device, with the documented event types ─────
async def test_event_entities_created_on_jarvis_device(hass):
    with _event_platform_only():
        entry = await _setup(hass)

        for entity_id, types in (
            ("event.jarvis_activity", jarvis_event.ACTIVITY_EVENT_TYPES),
            ("event.jarvis_camera", jarvis_event.CAMERA_EVENT_TYPES),
            ("event.jarvis_intrusion", jarvis_event.INTRUSION_EVENT_TYPES),
        ):
            state = hass.states.get(entity_id)
            assert state is not None, entity_id
            assert state.state == STATE_UNKNOWN            # nothing fired yet
            assert state.attributes[ATTR_EVENT_TYPES] == types
            assert state.attributes["friendly_name"].startswith("JARVIS ")

        ent_reg = er.async_get(hass)
        dev_reg = dr.async_get(hass)
        reg = ent_reg.async_get("event.jarvis_activity")
        assert reg is not None
        assert reg.unique_id == f"{entry.entry_id}_activity"
        assert reg.disabled_by is None                      # headline entity
        device = dev_reg.async_get(reg.device_id)
        assert device is not None
        assert (DOMAIN, entry.entry_id) in device.identifiers
        assert device.name == "JARVIS"
        assert ent_reg.async_get("event.jarvis_camera").unique_id == f"{entry.entry_id}_camera"
        assert ent_reg.async_get("event.jarvis_intrusion").unique_id == f"{entry.entry_id}_intrusion"

        await _teardown(hass, entry)
    assert entry.entry_id not in hass.data.get(DOMAIN, {})


# ── jarvis_activity → event.jarvis_activity ──────────────────────────────────
async def test_activity_bus_event_updates_entity(hass):
    with _event_platform_only():
        entry = await _setup(hass)

        hass.bus.async_fire("jarvis_activity", {
            "urgency": "high", "tag": "door", "entity_id": "binary_sensor.front_door",
            "message": "Front door opened while nobody is home",
            "source": "observer", "was_spoken": True,
        })
        await hass.async_block_till_done()

        state = hass.states.get("event.jarvis_activity")
        assert state.state != STATE_UNKNOWN                 # ISO timestamp of the event
        assert state.attributes[ATTR_EVENT_TYPE] == "high"
        assert state.attributes["message"] == "Front door opened while nobody is home"
        assert state.attributes["tag"] == "door"
        assert state.attributes["entity_id"] == "binary_sensor.front_door"
        assert state.attributes["was_spoken"] is True

        # an urgency outside the activity_log vocabulary lands in "info"
        # rather than raising inside the listener
        hass.bus.async_fire("jarvis_activity", {"urgency": "weird", "message": "x"})
        await hass.async_block_till_done()
        assert hass.states.get("event.jarvis_activity").attributes[ATTR_EVENT_TYPE] == "info"

        await _teardown(hass, entry)


async def test_record_announcement_fires_jarvis_activity(hass):
    """The activity_log funnel itself emits the bus event (the one added line
    in output_gate.async_record_announcement), and the entity picks it up."""
    with _event_platform_only():
        entry = await _setup(hass)
        captured = async_capture_events(hass, "jarvis_activity")

        await output_gate.async_record_announcement(
            hass,
            entity_id="binary_sensor.garage_door", category="door", urgency="medium",
            message="The garage door has been open for ten minutes.", was_spoken=False,
        )
        await hass.async_block_till_done()

        assert len(captured) == 1
        data = captured[0].data
        assert data == {
            "urgency": "medium", "tag": "door",
            "message": "The garage door has been open for ten minutes.",
            "entity_id": "binary_sensor.garage_door",
            "source": "observer", "was_spoken": False,
        }
        state = hass.states.get("event.jarvis_activity")
        assert state.attributes[ATTR_EVENT_TYPE] == "medium"
        assert state.attributes["message"] == "The garage door has been open for ten minutes."
        assert state.attributes["was_spoken"] is False

        await _teardown(hass, entry)


# ── jarvis_camera_event / jarvis_intrusion_* → their entities ────────────────
async def test_camera_and_intrusion_events_update_entities(hass):
    with _event_platform_only():
        entry = await _setup(hass)

        hass.bus.async_fire("jarvis_camera_event", {
            "entity_id": "camera.driveway", "source": "frigate",
            "label": "car", "confidence": 87,
        })
        await hass.async_block_till_done()
        cam = hass.states.get("event.jarvis_camera")
        assert cam.attributes[ATTR_EVENT_TYPE] == "vehicle"   # label folded to a kind
        assert cam.attributes["label"] == "car"
        assert cam.attributes["camera_entity"] == "camera.driveway"
        assert cam.attributes["confidence"] == 87

        hass.bus.async_fire("jarvis_intrusion_confirmed", {
            "reason": "motion in the hallway during lockdown",
            "camera": "camera.hallway", "snapshot_url": "/api/x", "snapshot_path": "/tmp/x",
        })
        await hass.async_block_till_done()
        intr = hass.states.get("event.jarvis_intrusion")
        assert intr.attributes[ATTR_EVENT_TYPE] == "confirmed"
        assert intr.attributes["reason"] == "motion in the hallway during lockdown"
        assert intr.attributes["camera"] == "camera.hallway"
        assert "snapshot_path" not in intr.attributes        # payload kept small

        hass.bus.async_fire("jarvis_intrusion_unresolved", {"reason": "no response"})
        await hass.async_block_till_done()
        assert hass.states.get("event.jarvis_intrusion").attributes[ATTR_EVENT_TYPE] == "unresolved"

        # after unload the entity is restored-unavailable and its bus listener
        # is gone: a late event changes nothing
        await _teardown(hass, entry)
    assert hass.states.get("event.jarvis_camera").state == STATE_UNAVAILABLE
    hass.bus.async_fire("jarvis_camera_event", {"entity_id": "camera.driveway", "label": "dog"})
    await hass.async_block_till_done()
    assert hass.states.get("event.jarvis_camera").state == STATE_UNAVAILABLE


@pytest.mark.parametrize("label,kind", [
    ("person", "person"), ("Car", "vehicle"), ("dog", "animal"), ("package", "package"),
    ("doorbell_chime", "doorbell"), ("motion", "motion"), ("", "motion"),
    (None, "motion"), ("umbrella", "object"),
])
def test_camera_kind_mapping(label, kind):
    assert jarvis_event.camera_kind(label) == kind


# ── Logbook describers ───────────────────────────────────────────────────────
def test_async_describe_events_registers_every_jarvis_event(hass):
    registered: dict[str, tuple[str, object]] = {}

    def _capture(domain, event_name, describer):
        registered[event_name] = (domain, describer)

    jarvis_logbook.async_describe_events(hass, _capture)

    assert set(registered) == set(jarvis_logbook.DESCRIBED_EVENTS)
    assert set(registered) >= {
        "jarvis_activity", "jarvis_camera_event", "jarvis_face_recognized",
        "jarvis_person_detected", "jarvis_intrusion_confirmed",
        "jarvis_intrusion_unresolved", "jarvis_observer_nap", "jarvis_observer_shushed",
        "jarvis_observer_unshushed", "jarvis_observer_status", "jarvis_automation_created",
    }
    assert all(domain == DOMAIN for domain, _ in registered.values())

    # the registered callables accept a real HA Event, as logbook hands them
    _, describe_activity = registered["jarvis_activity"]
    out = describe_activity(Event("jarvis_activity", {
        "urgency": "critical", "tag": "smoke", "entity_id": "binary_sensor.kitchen_smoke",
        "message": "Smoke detected in the kitchen", "source": "observer", "was_spoken": True,
    }))
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS"
    assert out[LOGBOOK_ENTRY_MESSAGE] == "[critical] Smoke detected in the kitchen"
    assert out[LOGBOOK_ENTRY_ENTITY_ID] == "binary_sensor.kitchen_smoke"

    _, describe_camera = registered["jarvis_camera_event"]
    out = describe_camera(Event("jarvis_camera_event", {
        "entity_id": "camera.front_door", "source": "frigate", "label": "person", "confidence": 91,
    }))
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS camera"
    assert out[LOGBOOK_ENTRY_MESSAGE] == "saw person on front door (91%) via frigate"
    assert out[LOGBOOK_ENTRY_ENTITY_ID] == "camera.front_door"


def test_describe_messages_for_remaining_events():
    d = jarvis_logbook.describe

    out = d("jarvis_activity", {"urgency": "low", "tag": "classified",
                                "message": "Hall motion: off → on", "was_spoken": False})
    assert out[LOGBOOK_ENTRY_MESSAGE] == "Hall motion: off → on (not spoken)"
    assert LOGBOOK_ENTRY_ENTITY_ID not in out                 # no entity in payload

    out = d("jarvis_face_recognized", {"camera": "front_door", "camera_entity": "camera.front_door",
                                       "name": "Alice", "confidence": 92.4, "is_unknown": False,
                                       "is_resident": True, "relationship": "resident"})
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS recognition"
    assert out[LOGBOOK_ENTRY_MESSAGE] == "recognized Alice at front_door (92%)"
    assert out[LOGBOOK_ENTRY_ENTITY_ID] == "camera.front_door"

    out = d("jarvis_face_recognized", {"camera": "porch", "name": "unknown", "confidence": 40,
                                       "is_unknown": True, "relationship": "unknown"})
    assert out[LOGBOOK_ENTRY_MESSAGE] == "saw an unknown face at porch (40%)"

    out = d("jarvis_person_detected", {"camera": "driveway", "camera_entity": "camera.driveway",
                                       "label": "person", "score": 0.83, "event_id": "abc"})
    assert out[LOGBOOK_ENTRY_MESSAGE] == "detected a person at driveway (83%)"

    out = d("jarvis_intrusion_confirmed", {"reason": "glass break after lockdown",
                                           "camera": "camera.living_room"})
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS intrusion"
    assert out[LOGBOOK_ENTRY_MESSAGE] == (
        "confirmed an intrusion: glass break after lockdown (snapshot from living room)")
    assert out[LOGBOOK_ENTRY_ENTITY_ID] == "camera.living_room"

    out = d("jarvis_intrusion_unresolved", {"reason": "no response; unconfirmed activity"})
    assert out[LOGBOOK_ENTRY_MESSAGE] == (
        "could not resolve suspicious activity: no response; unconfirmed activity")

    assert d("jarvis_observer_nap", {"duration_minutes": 45})[LOGBOOK_ENTRY_MESSAGE] == (
        "napping for 45 minutes")

    assert d("jarvis_observer_shushed", {"muted_entities": [], "muted_categories": [],
                                         "all": True})[LOGBOOK_ENTRY_MESSAGE] == (
        "shushed all announcements")
    assert d("jarvis_observer_shushed", {"muted_entities": ["binary_sensor.hall"],
                                         "muted_categories": ["motion"],
                                         "all": False})[LOGBOOK_ENTRY_MESSAGE] == (
        "shushed binary_sensor.hall, motion")

    assert d("jarvis_observer_unshushed", {"cleared_entities": [], "cleared_categories": [],
                                           "blanket_cleared": True})[LOGBOOK_ENTRY_MESSAGE] == (
        "cleared all mutes")
    assert d("jarvis_observer_unshushed", {"cleared_entities": ["binary_sensor.hall"],
                                           "cleared_categories": []})[LOGBOOK_ENTRY_MESSAGE] == (
        "unmuted binary_sensor.hall")

    out = d("jarvis_observer_status", {"running": True, "announcements_last_hour": 2,
                                       "suppressed_last_hour": 5, "sleeping": True,
                                       "sleep_reason": "quiet hours"})
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS observer"
    assert out[LOGBOOK_ENTRY_MESSAGE] == (
        "running, 2 announcements in the last hour, household asleep (quiet hours)")

    out = d("jarvis_automation_created", {"success": True, "automation_id": "jarvis_1234",
                                          "alias": "JARVIS · Porch light at dusk"})
    assert out[LOGBOOK_ENTRY_NAME] == "JARVIS automation"
    assert out[LOGBOOK_ENTRY_MESSAGE] == "created automation JARVIS · Porch light at dusk"


def test_describe_is_total():
    """Unknown events return None; malformed payloads never raise."""
    assert jarvis_logbook.describe("jarvis_db_stats", {}) is None
    for event_type in jarvis_logbook.DESCRIBED_EVENTS:
        for payload in ({}, None, {"message": None, "label": 7, "confidence": "n/a",
                                   "muted_entities": "oops", "duration_minutes": None}):
            out = jarvis_logbook.describe(event_type, payload)
            assert out is not None and out[LOGBOOK_ENTRY_NAME].startswith("JARVIS"), event_type
            assert isinstance(out[LOGBOOK_ENTRY_MESSAGE], str) and out[LOGBOOK_ENTRY_MESSAGE]
