"""JARVIS binary_sensor platform against a real Home Assistant (PHACC) — fork Phase 1.

Only the ``binary_sensor`` platform is forwarded (``PLATFORMS`` is patched down
to it), so the test exercises the real platform/entity machinery without
pulling in HA's conversation stack. Provider construction is stubbed exactly as
in ``test_wiring_smoke``. Snapshot inputs that would need the cognitive core
(lockdown, intrusion, sleep) are driven through ``panel_data``'s hook seam.
"""
from unittest.mock import patch

from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE
from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.jarvis import panel_data

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


class _platform_only:
    """Stub the provider and forward only the binary_sensor platform."""

    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch("custom_components.jarvis.PLATFORMS", ["binary_sensor"]),
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


async def _unload(hass, entry):
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


def _coordinator(hass, entry):
    return hass.data[DOMAIN][entry.entry_id]["coordinator"]


def _eid(hass, entry, suffix):
    """entity_id of the jarvis binary_sensor with unique_id ``<entry>_<suffix>``."""
    return er.async_get(hass).async_get_entity_id(
        "binary_sensor", DOMAIN, f"{entry.entry_id}_{suffix}")


def _add_motion_area(hass, name, entity_slug, state=STATE_ON):
    """Create an HA area with one motion sensor in it; returns the area id."""
    area = ar.async_get(hass).async_get_or_create(name)
    reg = er.async_get(hass)
    entity_id = reg.async_get_or_create(
        "binary_sensor", "test", f"uid_{entity_slug}", suggested_object_id=entity_slug,
    ).entity_id
    reg.async_update_entity(entity_id, area_id=area.id)
    hass.states.async_set(entity_id, state, {"device_class": "motion"})
    return area.id, entity_id


async def test_fixed_entities_exist_on_the_jarvis_device(hass):
    with _platform_only():
        entry = await _setup(hass)
        dev = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, entry.entry_id)})
        assert dev is not None and dev.name == "JARVIS"
        reg = er.async_get(hass)
        for suffix, expected in (("lockdown", STATE_OFF), ("intrusion_active", STATE_OFF),
                                 ("asleep", STATE_OFF)):
            entity_id = _eid(hass, entry, suffix)
            assert entity_id, suffix
            assert hass.states.get(entity_id).state == expected, suffix
            assert reg.async_get(entity_id).device_id == dev.id
        assert hass.states.get(_eid(hass, entry, "lockdown")).attributes["device_class"] == "safety"
        await _unload(hass, entry)


async def test_area_occupied_entity_mirrors_snapshot_row(hass):
    area_id, motion = _add_motion_area(hass, "Kitchen", "kitchen_motion")
    with _platform_only():
        entry = await _setup(hass)
        entity_id = _eid(hass, entry, f"area_{area_id}_occupied")
        assert entity_id
        state = hass.states.get(entity_id)
        assert state.state == STATE_ON
        assert state.attributes["device_class"] == "occupancy"
        assert state.attributes["friendly_name"] == "JARVIS Kitchen occupied"
        assert state.attributes["area_id"] == area_id
        assert state.attributes["caps"] == ["mmwave"]
        assert state.attributes["bedroom"] is False
        assert state.attributes["lights_on"] == 0 and state.attributes["lights_total"] == 0
        for key in ("temp", "humidity", "last_motion", "temp_entity", "humidity_entity"):
            assert key in state.attributes, key
        # JARVIS's own mirror must NOT sit in the room (it would feed presence
        # detection back into itself) — see the platform docstring.
        assert er.async_get(hass).async_get(entity_id).area_id is None

        # motion stops → next snapshot flips the mirror off
        hass.states.async_set(motion, STATE_OFF, {"device_class": "motion"})
        await _coordinator(hass, entry).async_refresh()
        await hass.async_block_till_done()
        assert hass.states.get(entity_id).state == STATE_OFF
        await _unload(hass, entry)


async def test_new_area_gets_an_entity_via_coordinator_listener(hass):
    with _platform_only():
        entry = await _setup(hass)
        coord = _coordinator(hass, entry)
        assert not [r for r in coord.data["areas"]]  # nothing interesting yet

        area_id, _motion = _add_motion_area(hass, "Office", "office_motion")
        assert _eid(hass, entry, f"area_{area_id}_occupied") is None
        await coord.async_refresh()
        await hass.async_block_till_done()
        entity_id = _eid(hass, entry, f"area_{area_id}_occupied")
        assert entity_id and hass.states.get(entity_id).state == STATE_ON

        # a second refresh must not try to add it again (unique_id collision)
        await coord.async_refresh()
        await hass.async_block_till_done()
        assert hass.states.get(entity_id).state == STATE_ON
        await _unload(hass, entry)


async def test_vanished_area_becomes_unavailable_not_deleted(hass):
    area_id, motion = _add_motion_area(hass, "Garage", "garage_motion")
    with _platform_only():
        entry = await _setup(hass)
        entity_id = _eid(hass, entry, f"area_{area_id}_occupied")
        assert hass.states.get(entity_id).state == STATE_ON
        # the room loses its only sensor → it drops out of the snapshot
        er.async_get(hass).async_update_entity(motion, area_id=None)
        await _coordinator(hass, entry).async_refresh()
        await hass.async_block_till_done()
        assert hass.states.get(entity_id).state == STATE_UNAVAILABLE
        assert er.async_get(hass).async_get(entity_id) is not None
        await _unload(hass, entry)


async def test_lockdown_intrusion_and_sleep_follow_the_snapshot(hass):
    with _platform_only():
        entry = await _setup(hass)
        coord = _coordinator(hass, entry)
        with patch.object(panel_data, "_get_lockdown_status", return_value={
            "active": True, "since": 1.0, "reason": "requested from panel",
            "auto": False, "exempt_windows": 2,
        }), patch.object(panel_data, "_get_intrusion_status", return_value={
            "active": True, "confirmed": True, "breach_area": "hall",
            "breach_name": "Hall", "path": ["hall", "kitchen"], "zones": ["z1"],
        }), patch.object(panel_data.sleep_detection, "is_sleeping",
                         return_value=(True, "quiet hours")):
            await coord.async_refresh()
            await hass.async_block_till_done()
            lockdown = hass.states.get(_eid(hass, entry, "lockdown"))
            assert lockdown.state == STATE_ON
            assert lockdown.attributes["reason"] == "requested from panel"
            assert lockdown.attributes["exempt_windows"] == 2
            intrusion = hass.states.get(_eid(hass, entry, "intrusion_active"))
            assert intrusion.state == STATE_ON
            assert intrusion.attributes["confirmed"] is True
            assert intrusion.attributes["path"] == ["hall", "kitchen"]
            asleep = hass.states.get(_eid(hass, entry, "asleep"))
            assert asleep.state == STATE_ON
            assert asleep.attributes["reason"] == "quiet hours"

        await coord.async_refresh()
        await hass.async_block_till_done()
        assert hass.states.get(_eid(hass, entry, "lockdown")).state == STATE_OFF
        assert hass.states.get(_eid(hass, entry, "intrusion_active")).state == STATE_OFF
        assert hass.states.get(_eid(hass, entry, "asleep")).state == STATE_OFF
        await _unload(hass, entry)
