"""JarvisCoordinator against a real Home Assistant (PHACC) — fork Phase 0.

Proves the wiring the unit fakes cannot: the coordinator is created during
``async_setup_entry`` with a populated first snapshot, a ``light`` state change
schedules a debounced refresh (and an unrelated domain does not), explicit
``request_refresh`` works, and unload shuts it down with no lingering timers
(PHACC's ``verify_cleanup``).

Stubs mirror ``test_wiring_smoke``: provider construction and the platform
forward/unload only.
"""
from datetime import timedelta
from unittest.mock import AsyncMock, patch

from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.jarvis import coordinator as coordinator_mod
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


class _mock_setup:
    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch("homeassistant.config_entries.ConfigEntries.async_forward_entry_setups",
                  AsyncMock(return_value=None)),
            patch("homeassistant.config_entries.ConfigEntries.async_unload_platforms",
                  AsyncMock(return_value=True)),
        ]
        for p in self._patchers:
            p.start()
        return self

    def __exit__(self, *exc):
        for p in reversed(self._patchers):
            p.stop()
        return False


class _CountingSnapshot:
    """Wraps panel_data.build_snapshot so a test can count coordinator refreshes."""

    def __init__(self):
        self.calls = 0
        self._real = panel_data.build_snapshot

    async def __call__(self, hass, entry):
        self.calls += 1
        return await self._real(hass, entry)


async def _setup(hass):
    entry = MockConfigEntry(domain=DOMAIN, data=ENTRY_DATA, options={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_coordinator_created_with_first_snapshot(hass):
    with _mock_setup():
        entry = await _setup(hass)
        coord = hass.data[DOMAIN][entry.entry_id]["coordinator"]
        assert isinstance(coord, coordinator_mod.JarvisCoordinator)
        assert coordinator_mod.get_coordinator(hass) is coord
        assert coordinator_mod.get_coordinator(hass, entry.entry_id) is coord
        assert coord.last_update_success is True
        data = coord.data
        for key in ("status", "version", "meta", "dominant", "areas", "lockdown",
                    "intrusion", "doors", "suggestions", "goals"):
            assert key in data, key
        assert set(data["status"]) == {"observer", "sleep", "llm_providers",
                                       "broadcast", "notify", "satellites"}
        assert isinstance(data["areas"], list)
        assert data["lockdown"]["active"] is False
        # coordinator-only enrichments for the setting-mirror entities
        assert "observer_enabled" in data["settings"]
        assert data["mode"]["active"] == "normal"
        assert coord._unsub_state_changed is not None

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    assert coord._unsub_state_changed is None
    assert entry.entry_id not in hass.data.get(DOMAIN, {})


async def test_light_state_change_schedules_debounced_refresh(hass):
    counting = _CountingSnapshot()
    with _mock_setup(), patch.object(panel_data, "build_snapshot", counting):
        entry = await _setup(hass)
        coord = hass.data[DOMAIN][entry.entry_id]["coordinator"]
        # setup itself requested a refresh (observer flag flip); let HA's 10 s
        # request-refresh cooldown lapse so the debounced refresh below runs at once
        async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
        await hass.async_block_till_done()
        baseline = counting.calls
        assert baseline >= 1

        # an unrelated domain never schedules a refresh
        hass.states.async_set("media_player.tv", "playing")
        await hass.async_block_till_done()
        assert coord._debounce_unsub is None

        # a light change schedules one refresh 2 s later (bursts coalesce)
        hass.states.async_set("light.kitchen", "on")
        hass.states.async_set("light.kitchen", "off")
        await hass.async_block_till_done()
        assert coord._debounce_unsub is not None
        assert counting.calls == baseline  # nothing yet — debounced

        async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=3))
        await hass.async_block_till_done()
        assert counting.calls == baseline + 1
        assert coord._debounce_unsub is None

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_request_refresh_is_best_effort(hass):
    counting = _CountingSnapshot()
    with _mock_setup(), patch.object(panel_data, "build_snapshot", counting):
        entry = await _setup(hass)
        baseline = counting.calls

        coordinator_mod.request_refresh(hass)
        await hass.async_block_till_done()
        # inside the coordinator's 10 s request cooldown (setup already asked
        # once) the refresh is deferred to the cooldown's end, then runs
        async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
        await hass.async_block_till_done()
        assert counting.calls == baseline + 1

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    # with no entry loaded it is a silent no-op
    coordinator_mod.request_refresh(hass)
    await hass.async_block_till_done()


async def test_pending_debounce_is_cancelled_on_unload(hass):
    with _mock_setup():
        entry = await _setup(hass)
        coord = hass.data[DOMAIN][entry.entry_id]["coordinator"]
        hass.states.async_set("binary_sensor.hall_motion", "on")
        await hass.async_block_till_done()
        assert coord._debounce_unsub is not None
        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    assert coord._debounce_unsub is None  # verify_cleanup would flag a live timer


async def test_own_entities_do_not_rearm_the_debounce(hass, freezer):
    """Review finding: with the sensor platform live, every refresh rewrote
    ``sensor.jarvis_uptime`` (one-second granularity), that state_changed
    re-armed the debounce, and the coordinator chased itself at the Debouncer's
    10 s cooldown. Own entities must be ignored; foreign ones still count."""
    counting = _CountingSnapshot()
    with patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()), \
         patch("custom_components.jarvis.PLATFORMS", ["sensor"]), \
         patch.object(panel_data, "build_snapshot", counting):
        entry = await _setup(hass)
        coord = hass.data[DOMAIN][entry.entry_id]["coordinator"]
        uptime_eid = er.async_get(hass).async_get_entity_id(
            "sensor", DOMAIN, f"{entry.entry_id}_uptime")
        assert uptime_eid and hass.states.get(uptime_eid) is not None

        async def _tick(seconds: int) -> None:
            freezer.tick(timedelta(seconds=seconds))
            async_fire_time_changed(hass, dt_util.utcnow())
            await hass.async_block_till_done()

        # drain the setup-time refresh requests and HA's 10 s request cooldown
        for _ in range(3):
            await _tick(11)
        assert coord._debounce_unsub is None

        # 60 simulated seconds, one-second steps, nothing external touched:
        # plain polling (20 s interval → at most 3 refreshes), and after EVERY
        # step the debounce is still unarmed — with the bug, the first refresh's
        # own sensor echo armed it and the coordinator chased itself every 10 s.
        base = counting.calls
        for _ in range(60):
            await _tick(1)
            assert coord._debounce_unsub is None
        assert 1 <= counting.calls - base <= 3

        # an explicit state write to one of our entities is ignored too …
        hass.states.async_set(uptime_eid, "forced", {})
        await hass.async_block_till_done()
        assert coord._debounce_unsub is None
        # … while a foreign sensor in a refresh domain still schedules a refresh
        hass.states.async_set("sensor.kitchen_power", "12")
        await hass.async_block_till_done()
        assert coord._debounce_unsub is not None

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    assert coord._debounce_unsub is None
