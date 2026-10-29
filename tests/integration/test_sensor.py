"""JARVIS sensor platform against a real Home Assistant (PHACC) — fork Phase 1.

Only the ``sensor`` platform is forwarded (``PLATFORMS`` is patched down to
it); provider construction is stubbed as in ``test_wiring_smoke``. Snapshot
inputs that come from executor-side stores (suggestions, goals, announcements)
are driven through ``panel_data``'s hook seam.
"""
from unittest.mock import patch

from homeassistant.const import STATE_ON, EntityCategory
from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.jarvis import panel_data
from custom_components.jarvis.sensor import ITEMS_LIMIT, parse_leading_int, parse_satellites

DOMAIN = "jarvis"
ENTRY_DATA = {
    "api_key": "", "model": "llama3.1", "honorific": "Sir",
    "llm_provider": "ollama", "llm_base_url": "http://localhost:11434/v1",
    "schema_version": 7,
}
ALL_SUFFIXES = ("observer", "dominant_area", "satellites", "llm_providers", "uptime",
                "announcements_today", "suggestions", "goals")


class _FakeProvider:
    name = "fake"

    def chat(self, *a, **k):
        return {"text": "", "tool_calls": [], "raw": None}

    def supports_vision(self):
        return False


class _platform_only:
    """Stub the provider and forward only the sensor platform."""

    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch("custom_components.jarvis.PLATFORMS", ["sensor"]),
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
    return er.async_get(hass).async_get_entity_id(
        "sensor", DOMAIN, f"{entry.entry_id}_{suffix}")


def _state(hass, entry, suffix):
    entity_id = _eid(hass, entry, suffix)
    assert entity_id, suffix
    return hass.states.get(entity_id)


def test_tile_parsers():
    assert parse_satellites("3 / 4") == (3, 4)
    assert parse_satellites("NONE") == (0, 0)
    assert parse_satellites(None) == (0, 0)
    assert parse_leading_int("2 READY") == 2
    assert parse_leading_int("UNSET") == 0
    assert parse_leading_int("") == 0


async def test_all_sensors_exist_enabled_on_the_jarvis_device(hass):
    with _platform_only():
        entry = await _setup(hass)
        dev = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, entry.entry_id)})
        reg = er.async_get(hass)
        for suffix in ALL_SUFFIXES:
            entity_id = _eid(hass, entry, suffix)
            assert entity_id, suffix
            reg_entry = reg.async_get(entity_id)
            assert reg_entry.device_id == dev.id
            assert reg_entry.disabled_by is None, suffix
            assert hass.states.get(entity_id) is not None, suffix
        # diagnostics
        assert reg.async_get(_eid(hass, entry, "uptime")).entity_category == EntityCategory.DIAGNOSTIC
        assert reg.async_get(_eid(hass, entry, "announcements_today")).entity_category == EntityCategory.DIAGNOSTIC
        assert reg.async_get(_eid(hass, entry, "observer")).entity_category is None
        await _unload(hass, entry)


async def test_status_sensors_reflect_snapshot(hass):
    with _platform_only():
        entry = await _setup(hass)
        coord = _coordinator(hass, entry)

        observer = _state(hass, entry, "observer")
        assert observer.state == coord.data["status"]["observer"]["state"]
        assert observer.state in ("RUNNING", "READY", "DISABLED")
        assert observer.attributes["level"] in ("live", "warn", "off")

        providers = _state(hass, entry, "llm_providers")
        assert providers.state == str(parse_leading_int(coord.data["status"]["llm_providers"]["state"]))
        assert providers.attributes["status"] == coord.data["status"]["llm_providers"]["state"]

        uptime = _state(hass, entry, "uptime")
        assert uptime.state == coord.data["meta"]["uptime"]
        assert uptime.attributes["icon"] == "mdi:timer-outline"

        announcements = _state(hass, entry, "announcements_today")
        assert announcements.state == str(coord.data["meta"]["announcements_today"])
        assert announcements.attributes["state_class"] == "measurement"

        # no satellites configured → "0"
        satellites = _state(hass, entry, "satellites")
        assert satellites.state == "0"
        assert satellites.attributes["available"] == 0 and satellites.attributes["total"] == 0

        hass.states.async_set("assist_satellite.kitchen", "idle")
        hass.states.async_set("assist_satellite.hall", "unavailable")
        await coord.async_refresh()
        await hass.async_block_till_done()
        satellites = _state(hass, entry, "satellites")
        assert satellites.state == "1/2"
        assert satellites.attributes["available"] == 1 and satellites.attributes["total"] == 2
        await _unload(hass, entry)


async def test_dominant_area_follows_presence(hass):
    with _platform_only():
        entry = await _setup(hass)
        coord = _coordinator(hass, entry)
        dominant = _state(hass, entry, "dominant_area")
        assert dominant.state == "AWAY"
        assert dominant.attributes["area_id"] is None

        area = ar.async_get(hass).async_get_or_create("Kitchen")
        reg = er.async_get(hass)
        motion = reg.async_get_or_create(
            "binary_sensor", "test", "uid_kitchen_motion", suggested_object_id="kitchen_motion",
        ).entity_id
        reg.async_update_entity(motion, area_id=area.id)
        hass.states.async_set(motion, STATE_ON, {"device_class": "motion"})
        await coord.async_refresh()
        await hass.async_block_till_done()
        dominant = _state(hass, entry, "dominant_area")
        assert dominant.state == "Kitchen"
        assert dominant.attributes["area_id"] == area.id
        for key in ("subtitle", "temp", "humidity", "lights", "last_motion"):
            assert key in dominant.attributes, key
        await _unload(hass, entry)


async def test_suggestions_and_goals_count_with_truncated_items(hass):
    suggestions = [{"id": f"s{i}", "description": f"suggestion {i}", "confidence": 0.5}
                   for i in range(ITEMS_LIMIT + 5)]
    goals = [{"id": "g1", "title": "Lower the bill", "status": "active"}]
    with _platform_only():
        entry = await _setup(hass)
        coord = _coordinator(hass, entry)
        assert _state(hass, entry, "suggestions").state == str(len(coord.data["suggestions"]))
        assert _state(hass, entry, "goals").state == str(len(coord.data["goals"]))
        with patch.object(panel_data, "_get_suggestions", return_value=suggestions), \
                patch.object(panel_data, "_get_goals", return_value=goals):
            await coord.async_refresh()
            await hass.async_block_till_done()
            sugg = _state(hass, entry, "suggestions")
            assert sugg.state == str(ITEMS_LIMIT + 5)
            assert len(sugg.attributes["items"]) == ITEMS_LIMIT
            assert sugg.attributes["items"][0]["id"] == "s0"
            assert sugg.attributes["state_class"] == "measurement"
            goal = _state(hass, entry, "goals")
            assert goal.state == "1"
            assert goal.attributes["items"] == goals
        await _unload(hass, entry)
