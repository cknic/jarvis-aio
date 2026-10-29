"""Native control entities against a real Home Assistant (PHACC) — fork Phase 1.

switch / select / number / alarm_control_panel are forwarded for real (the
other platforms are left out of ``PLATFORMS`` for the test so HA's conversation
stack is never imported); provider construction is stubbed as in
``test_wiring_smoke``. Every write path is patched at its seam —
``config_apply.async_apply``, ``modes.set_mode`` (+ ``mode_scene``) and
``cognitive_core.request_lockdown`` — and state is asserted via ``hass.states``
after pushing new coordinator data.
"""
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.jarvis import config_apply
from custom_components.jarvis.const import SIGNAL_CONFIG_CHANGED

DOMAIN = "jarvis"
CONTROL_PLATFORMS = ["switch", "select", "number", "alarm_control_panel"]
ENTRY_DATA = {
    "api_key": "", "model": "llama3.1", "honorific": "Sir",
    "llm_provider": "ollama", "llm_base_url": "http://localhost:11434/v1",
    "schema_version": 7,
}

OBSERVER = "switch.jarvis_observer"
MODE = "select.jarvis_mode"
LOCKDOWN = "alarm_control_panel.jarvis_lockdown"


class _FakeProvider:
    name = "fake"

    def chat(self, *a, **k):
        return {"text": "", "tool_calls": [], "raw": None}

    def supports_vision(self):
        return False


class _mock_setup:
    """Stub the provider and narrow PLATFORMS to the four control platforms."""

    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch("custom_components.jarvis.PLATFORMS", CONTROL_PLATFORMS),
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
    return entry, hass.data[DOMAIN][entry.entry_id]["coordinator"]


async def _teardown(hass, entry):
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    # Removing alarm_control_panel.jarvis_lockdown fires cognitive_core's alarm
    # sync, whose SAFETY log re-spawns websocket's daemon log-writer thread AFTER
    # __init__ already stopped it (the mode select's jarvis_log starts it too).
    # Join it so PHACC's verify_cleanup sees no stray thread.
    from custom_components.jarvis.websocket import stop_log_writer
    await hass.async_add_executor_job(stop_log_writer)


def _push(coord, **overrides):
    """Replace top-level snapshot keys and notify every entity."""
    coord.async_set_updated_data({**coord.data, **overrides})


def _observer_status(coord, state):
    level = {"RUNNING": "live", "READY": "warn"}.get(state, "off")
    return {**coord.data["status"], "observer": {"state": state, "level": level}}


# ── creation / registry shape ────────────────────────────────────────────────

async def test_headline_entities_created_and_config_entities_registered_disabled(hass):
    with _mock_setup():
        entry, coord = await _setup(hass)
        try:
            for entity_id in (OBSERVER, MODE, LOCKDOWN):
                assert hass.states.get(entity_id) is not None, entity_id
            assert hass.states.get(OBSERVER).state == "off"
            assert hass.states.get(MODE).state == "normal"
            assert hass.states.get(LOCKDOWN).state == "disarmed"

            registry = er.async_get(hass)
            expected = {"bool": "switch", "enum": "select", "int": "number", "float": "number"}
            for spec in config_apply.exposed_fields():
                platform = expected.get(spec.kind)
                if platform is None or spec.key == "observer_enabled":
                    continue
                eid = registry.async_get_entity_id(platform, DOMAIN, f"{entry.entry_id}_{spec.key}")
                assert eid is not None, spec.key
                reg = registry.async_get(eid)
                assert reg.entity_category is er.EntityCategory.CONFIG, spec.key
                assert reg.disabled_by is er.RegistryEntryDisabler.INTEGRATION, spec.key
                assert hass.states.get(eid) is None, spec.key  # disabled → no state
            # headline entities share the one JARVIS device
            headline = {registry.async_get(e).device_id for e in (OBSERVER, MODE, LOCKDOWN)}
            assert len(headline) == 1 and None not in headline
            # the observer is a headline switch, not a second disabled copy
            assert registry.async_get_entity_id(
                "switch", DOMAIN, f"{entry.entry_id}_observer_enabled") is None
            assert registry.async_get(OBSERVER).disabled_by is None
        finally:
            await _teardown(hass, entry)


# ── observer switch ──────────────────────────────────────────────────────────

async def test_observer_switch_toggles_through_config_apply(hass):
    apply = AsyncMock(return_value={"key": "observer_enabled", "value": True, "updates": {}})
    with _mock_setup(), patch("custom_components.jarvis.config_apply.async_apply", apply):
        entry, coord = await _setup(hass)
        try:
            await hass.services.async_call(
                "switch", "turn_on", {"entity_id": OBSERVER}, blocking=True)
            apply.assert_awaited_once()
            assert apply.await_args.args == (hass, entry, "observer_enabled", True)

            apply.reset_mock()
            await hass.services.async_call(
                "switch", "turn_off", {"entity_id": OBSERVER}, blocking=True)
            assert apply.await_args.args == (hass, entry, "observer_enabled", False)
        finally:
            await _teardown(hass, entry)


async def test_observer_switch_state_follows_coordinator(hass):
    with _mock_setup():
        entry, coord = await _setup(hass)
        try:
            assert hass.states.get(OBSERVER).state == "off"
            _push(coord, status=_observer_status(coord, "RUNNING"))
            await hass.async_block_till_done()
            st = hass.states.get(OBSERVER)
            assert st.state == "on"
            assert st.attributes["observer_state"] == "RUNNING"

            _push(coord, status=_observer_status(coord, "DISABLED"))
            await hass.async_block_till_done()
            assert hass.states.get(OBSERVER).state == "off"

            # the runtime flag alone (observer configured on but not running) reads on
            hass.data[DOMAIN][entry.entry_id].setdefault("runtime_config", {})["observer_enabled"] = True
            _push(coord, status=_observer_status(coord, "READY"))
            await hass.async_block_till_done()
            assert hass.states.get(OBSERVER).state == "on"
        finally:
            hass.data[DOMAIN][entry.entry_id].get("runtime_config", {}).pop("observer_enabled", None)
            await _teardown(hass, entry)


async def test_setting_switch_mirrors_runtime_config_and_signal(hass):
    """A CONFIG switch (built directly: it is registry-disabled by default) reads
    the live runtime value and writes through config_apply."""
    from custom_components.jarvis.switch import JarvisSettingSwitch

    apply = AsyncMock(return_value={})
    with _mock_setup(), patch("custom_components.jarvis.config_apply.async_apply", apply):
        entry, coord = await _setup(hass)
        try:
            spec = config_apply.CONFIG_FIELDS["announcements_enabled"]
            ent = JarvisSettingSwitch(coord, spec)
            ent.hass = hass
            assert ent.unique_id == f"{entry.entry_id}_announcements_enabled"
            assert ent.name == spec.label
            assert ent.entity_category is er.EntityCategory.CONFIG
            assert ent.entity_registry_enabled_default is False
            assert ent.is_on is False

            rc = hass.data[DOMAIN][entry.entry_id].setdefault("runtime_config", {})
            rc["announcements_enabled"] = True
            assert ent.is_on is True
            rc.pop("announcements_enabled")

            ent.async_write_ha_state = lambda: None
            await ent.async_turn_on()
            assert apply.await_args.args == (hass, entry, "announcements_enabled", True)
        finally:
            await _teardown(hass, entry)


# ── mode select ──────────────────────────────────────────────────────────────

async def test_mode_select_options_and_set(hass):
    set_mode = patch("custom_components.jarvis.modes.set_mode")
    scene = AsyncMock(return_value=None)
    with _mock_setup(), set_mode as set_mode_mock, \
            patch("custom_components.jarvis.mode_scene.apply_mode_entry", scene):
        entry, coord = await _setup(hass)
        try:
            st = hass.states.get(MODE)
            available = [m["name"] for m in coord.data["mode"]["available"]]
            assert st.attributes["options"] == available
            assert "normal" in available and "guest" in available
            assert st.state == "normal"

            set_mode_mock.return_value = {"ok": True, "mode": "guest", "overrides": {}}
            await hass.services.async_call(
                "select", "select_option", {"entity_id": MODE, "option": "guest"}, blocking=True)
            assert set_mode_mock.call_args.args[0] == "guest"
            scene.assert_awaited_once_with(hass, "guest")
            # optimistic until the next snapshot lands
            assert hass.states.get(MODE).state == "guest"

            # the next coordinator snapshot is authoritative again
            _push(coord, mode={**coord.data["mode"], "active": "normal"})
            await hass.async_block_till_done()
            assert hass.states.get(MODE).state == "normal"

            _push(coord, mode={**coord.data["mode"], "active": "away"})
            await hass.async_block_till_done()
            assert hass.states.get(MODE).state == "away"
        finally:
            await _teardown(hass, entry)


async def test_mode_select_rejected_mode_raises(hass):
    with _mock_setup(), patch(
        "custom_components.jarvis.modes.set_mode",
        return_value={"ok": False, "error": "unknown mode 'party'", "available": ["normal"]},
    ), patch("custom_components.jarvis.mode_scene.apply_mode_entry", AsyncMock()) as scene:
        entry, coord = await _setup(hass)
        try:
            with pytest.raises(HomeAssistantError):
                await hass.services.async_call(
                    "select", "select_option", {"entity_id": MODE, "option": "party"},
                    blocking=True)
            scene.assert_not_awaited()
            assert hass.states.get(MODE).state == "normal"
        finally:
            await _teardown(hass, entry)


async def test_setting_select_and_number_write_through_config_apply(hass):
    from custom_components.jarvis.number import JarvisSettingNumber
    from custom_components.jarvis.select import JarvisSettingSelect

    apply = AsyncMock(return_value={})
    with _mock_setup(), patch("custom_components.jarvis.config_apply.async_apply", apply):
        entry, coord = await _setup(hass)
        try:
            sel = JarvisSettingSelect(coord, config_apply.CONFIG_FIELDS["banter_level"])
            sel.hass = hass
            sel.async_write_ha_state = lambda: None
            assert sel.options == ["0", "1", "2"]
            assert sel.current_option == "1"
            assert sel.entity_category is er.EntityCategory.CONFIG
            await sel.async_select_option("2")
            assert apply.await_args.args == (hass, entry, "banter_level", "2")

            num = JarvisSettingNumber(coord, config_apply.CONFIG_FIELDS["intrusion_response_timeout"])
            num.hass = hass
            num.async_write_ha_state = lambda: None
            assert (num.native_min_value, num.native_max_value, num.native_step) == (30, 900, 30)
            assert num.mode == "box"
            assert num.native_value == 120
            await num.async_set_native_value(60.0)
            assert apply.await_args.args == (hass, entry, "intrusion_response_timeout", 60)
            assert isinstance(apply.await_args.args[3], int)
        finally:
            await _teardown(hass, entry)


# ── lockdown alarm panel ─────────────────────────────────────────────────────

async def test_lockdown_alarm_arms_and_disarms_via_cognitive_core(hass):
    request = AsyncMock(return_value=True)
    with _mock_setup(), patch("custom_components.jarvis.cognitive_core.request_lockdown", request):
        entry, coord = await _setup(hass)
        try:
            st = hass.states.get(LOCKDOWN)
            assert st.state == "disarmed"
            assert st.attributes["jarvis_internal"] is True
            assert st.attributes["code_arm_required"] is False
            assert st.attributes["supported_features"] == 2  # ARM_AWAY only

            await hass.services.async_call(
                "alarm_control_panel", "alarm_arm_away", {"entity_id": LOCKDOWN}, blocking=True)
            request.assert_awaited_once()
            assert request.await_args.args[0] is True
            assert request.await_args.kwargs["hass"] is hass

            request.reset_mock()
            await hass.services.async_call(
                "alarm_control_panel", "alarm_disarm", {"entity_id": LOCKDOWN}, blocking=True)
            assert request.await_args.args[0] is False
        finally:
            await _teardown(hass, entry)


async def test_lockdown_alarm_state_follows_coordinator(hass):
    with _mock_setup():
        entry, coord = await _setup(hass)
        try:
            lockdown = {"active": True, "since": 1.0, "reason": "test", "auto": False,
                        "exempt_windows": 0}
            _push(coord, lockdown=lockdown)
            await hass.async_block_till_done()
            st = hass.states.get(LOCKDOWN)
            assert st.state == "armed_away"
            assert st.attributes["reason"] == "test"

            intrusion = {"active": True, "confirmed": True, "breach_area": "hall",
                         "breach_name": "Hall", "path": [], "zones": []}
            _push(coord, intrusion=intrusion)
            await hass.async_block_till_done()
            st = hass.states.get(LOCKDOWN)
            assert st.state == "triggered"
            assert st.attributes["breach_area"] == "Hall"

            # an unconfirmed investigation is not a trigger
            _push(coord, intrusion={**intrusion, "confirmed": False})
            await hass.async_block_till_done()
            assert hass.states.get(LOCKDOWN).state == "armed_away"

            _push(coord, lockdown={**lockdown, "active": False},
                  intrusion={"active": False, "confirmed": False})
            await hass.async_block_till_done()
            assert hass.states.get(LOCKDOWN).state == "disarmed"
        finally:
            await _teardown(hass, entry)


async def test_lockdown_alarm_failed_request_raises(hass):
    with _mock_setup(), patch("custom_components.jarvis.cognitive_core.request_lockdown",
                              AsyncMock(return_value=False)):
        entry, coord = await _setup(hass)
        try:
            with pytest.raises(HomeAssistantError):
                await hass.services.async_call(
                    "alarm_control_panel", "alarm_arm_away", {"entity_id": LOCKDOWN},
                    blocking=True)
            assert hass.states.get(LOCKDOWN).state == "disarmed"
        finally:
            await _teardown(hass, entry)


async def test_config_changed_signal_refreshes_observer_switch(hass):
    """A panel write fires SIGNAL_CONFIG_CHANGED; the switch re-reads at once."""
    from homeassistant.helpers.dispatcher import async_dispatcher_send

    with _mock_setup():
        entry, coord = await _setup(hass)
        try:
            assert hass.states.get(OBSERVER).state == "off"
            rc = hass.data[DOMAIN][entry.entry_id].setdefault("runtime_config", {})
            rc["observer_enabled"] = True
            async_dispatcher_send(hass, SIGNAL_CONFIG_CHANGED, "observer_enabled", True)
            await hass.async_block_till_done()
            assert hass.states.get(OBSERVER).state == "on"
        finally:
            hass.data[DOMAIN][entry.entry_id].get("runtime_config", {}).pop("observer_enabled", None)
            await _teardown(hass, entry)
