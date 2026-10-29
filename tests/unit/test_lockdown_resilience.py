"""Regression tests for lockdown resilience (v6.24.2).

Lockdown must work even when the cognitive-core start path didn't initialise the
manager (it lives deep inside the observer's start(), wrapped in a non-fatal
catch). And, per the security requirement, it must auto-engage when any alarm is
armed and lift when disarmed — event-driven, independent of the loop tick.
"""
import pytest


@pytest.fixture(autouse=True)
def _isolate_lockdown(tmp_path, monkeypatch, cognitive_core):
    """Each test gets a private lockdown-state file and a clean _CORE, so
    persisted state never bleeds between tests (or between runs)."""
    monkeypatch.setattr(cognitive_core, "LOCKDOWN_STATE_PATH", str(tmp_path / "lockdown_state.json"))
    cognitive_core._CORE.lockdown_mgr = None
    cognitive_core._CORE.hass = None
    cognitive_core._CORE.config = {"honorific": "sir", "lockdown_auto_on_arm": True}
    cognitive_core._CORE.alarm_unsub = None
    yield


def _reset(cc):
    cc._CORE.lockdown_mgr = None
    cc._CORE.hass = None
    cc._CORE.config = {"honorific": "sir", "lockdown_auto_on_arm": True}
    cc._CORE.alarm_unsub = None


async def test_manual_toggle_lazily_creates_manager(cognitive_core, fake_hass):
    # Boot where start() never set lockdown_mgr — the manual toggle must still work.
    _reset(cognitive_core)
    ok = await cognitive_core.request_lockdown(True, reason="test", hass=fake_hass)
    fake_hass.close_pending()
    assert ok is True
    assert cognitive_core._CORE.lockdown_mgr is not None
    assert cognitive_core.is_lockdown() is True

    ok2 = await cognitive_core.request_lockdown(False, reason="test", hass=fake_hass)
    fake_hass.close_pending()
    assert ok2 is True
    assert cognitive_core.is_lockdown() is False


async def test_request_without_hass_or_core_is_safe(cognitive_core):
    # No hass anywhere → returns False rather than raising.
    _reset(cognitive_core)
    ok = await cognitive_core.request_lockdown(True, reason="test")
    assert ok is False
    assert cognitive_core.is_lockdown() is False


async def test_alarm_armed_engages_on_ensure(cognitive_core, fake_hass):
    # A reboot while the alarm is armed must re-engage lockdown at setup time.
    _reset(cognitive_core)
    fake_hass.states.set("alarm_control_panel.home", "armed_away")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True
    assert cognitive_core._CORE.lockdown_mgr.auto is True


async def test_alarm_disarm_lifts_auto_lockdown(cognitive_core, fake_hass):
    _reset(cognitive_core)
    fake_hass.states.set("alarm_control_panel.home", "armed_home")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True

    fake_hass.states.set("alarm_control_panel.home", "disarmed")
    await cognitive_core._sync_lockdown_to_alarm("test disarm")
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is False


# ── v6.47.2: Cove/Alula cloud dropouts must not lift lockdown ────────────────

async def test_alarm_unavailable_holds_lockdown(cognitive_core, fake_hass, monkeypatch):
    """The live bug: armed-night lockdown lifted itself whenever the Cove
    integration lost its cloud and the panel went `unavailable`."""
    _reset(cognitive_core)
    monkeypatch.setattr(cognitive_core, "_ALARM_INDET_LOG_TS", 0.0)
    fake_hass.states.set("alarm_control_panel.cove", "armed_night")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True

    fake_hass.states.set("alarm_control_panel.cove", "unavailable")
    await cognitive_core._sync_lockdown_to_alarm("cove dropped")
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True          # HELD, not lifted
    assert cognitive_core._CORE.lockdown_mgr.auto is True  # still alarm-owned


async def test_alarm_recovery_after_dropout_stays_quietly_locked(cognitive_core, fake_hass, monkeypatch):
    _reset(cognitive_core)
    monkeypatch.setattr(cognitive_core, "_ALARM_INDET_LOG_TS", 0.0)
    fake_hass.states.set("alarm_control_panel.cove", "armed_night")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()

    fake_hass.states.set("alarm_control_panel.cove", "unavailable")
    await cognitive_core._sync_lockdown_to_alarm("cove dropped")
    fake_hass.states.set("alarm_control_panel.cove", "armed_night")
    await cognitive_core._sync_lockdown_to_alarm("cove recovered", announce=False)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True


async def test_real_disarm_after_dropout_still_lifts(cognitive_core, fake_hass, monkeypatch):
    _reset(cognitive_core)
    monkeypatch.setattr(cognitive_core, "_ALARM_INDET_LOG_TS", 0.0)
    fake_hass.states.set("alarm_control_panel.cove", "armed_away")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    fake_hass.states.set("alarm_control_panel.cove", "unavailable")
    await cognitive_core._sync_lockdown_to_alarm("cove dropped")
    assert cognitive_core.is_lockdown() is True

    fake_hass.states.set("alarm_control_panel.cove", "disarmed")   # genuine disarm
    await cognitive_core._sync_lockdown_to_alarm("real disarm")
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is False


async def test_all_unavailable_at_startup_is_inert(cognitive_core, fake_hass, monkeypatch):
    _reset(cognitive_core)
    monkeypatch.setattr(cognitive_core, "_ALARM_INDET_LOG_TS", 0.0)
    fake_hass.states.set("alarm_control_panel.cove", "unavailable")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is False   # nothing engaged, no crash


async def test_dropout_logs_safety_line_throttled(cognitive_core, fake_hass, monkeypatch):
    import sys
    _reset(cognitive_core)
    monkeypatch.setattr(cognitive_core, "_ALARM_INDET_LOG_TS", 0.0)
    logged = []
    monkeypatch.setattr(sys.modules["jc.websocket"], "jarvis_log",
                        lambda cat, msg: logged.append((cat, msg)))
    fake_hass.states.set("alarm_control_panel.cove", "armed_home")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()

    fake_hass.states.set("alarm_control_panel.cove", "unavailable")
    await cognitive_core._sync_lockdown_to_alarm("drop 1")
    await cognitive_core._sync_lockdown_to_alarm("drop 2")   # inside throttle window
    safety = [m for c, m in logged if c == "SAFETY" and "unavailable" in m]
    assert len(safety) == 1
    assert "holding lockdown" in safety[0]


async def test_alarm_state_view_triads(cognitive_core, fake_hass):
    _reset(cognitive_core)
    fake_hass.states.set("alarm_control_panel.a", "armed_home")
    fake_hass.states.set("alarm_control_panel.b", "unavailable")
    assert cognitive_core._alarm_state_view(fake_hass) == (True, False, False)
    fake_hass.states.set("alarm_control_panel.a", "disarmed")
    assert cognitive_core._alarm_state_view(fake_hass) == (False, True, False)
    fake_hass.states.set("alarm_control_panel.a", "unknown")
    assert cognitive_core._alarm_state_view(fake_hass) == (False, False, True)


async def test_auto_on_arm_can_be_disabled(cognitive_core, fake_hass):
    _reset(cognitive_core)
    cognitive_core._CORE.config["lockdown_auto_on_arm"] = False
    fake_hass.states.set("alarm_control_panel.home", "armed_away")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    # Opt-out respected: armed alarm does NOT force lockdown.
    assert cognitive_core.is_lockdown() is False


# ── Open-entity policy (v6.24.3): snapshot-and-ignore at engage, secure-or-ignore on change ──
from fakes import FakeState  # noqa: E402


async def _engage(cc, hass):
    await cc.request_lockdown(True, reason="test", hass=hass)
    hass.close_pending()
    return cc._CORE.lockdown_mgr


async def test_new_open_controllable_cover_is_closed(cognitive_core, fake_hass):
    # A non-garage closeable cover (e.g. a powered door) that opens mid-lockdown
    # is still re-secured — only garages/gates are left alone (see below).
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.service_calls.clear()
    old = FakeState("cover.patio_door", "closed", {"device_class": "door"})
    new = FakeState("cover.patio_door", "open", {"device_class": "door"})
    fake_hass.states.set("cover.patio_door", "open", device_class="door")
    action = await mgr.handle_state_change("cover.patio_door", old, new)
    fake_hass.close_pending()  # discard the delayed verify task
    assert ("cover", "close_cover", {"entity_id": "cover.patio_door"}) in fake_hass.service_calls
    assert action is None
    assert "cover.patio_door" in mgr._secured_by_us


async def test_garage_opened_midlockdown_is_not_force_closed(cognitive_core, fake_hass):
    # BUGFIX (9.21.2): a garage/gate that OPENS during lockdown is a resident
    # arriving — never force it closed (safety hazard + it was blocking arrival
    # opens). Alert once, exempt it, and leave the door alone.
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.service_calls.clear()
    old = FakeState("cover.garage_door", "closed", {"device_class": "garage"})
    new = FakeState("cover.garage_door", "open", {"device_class": "garage"})
    fake_hass.states.set("cover.garage_door", "open", device_class="garage")
    action = await mgr.handle_state_change("cover.garage_door", old, new)
    fake_hass.close_pending()
    assert not [c for c in fake_hass.service_calls if c[0] == "cover" and c[1] == "close_cover"]
    assert "cover.garage_door" not in mgr._secured_by_us
    assert "cover.garage_door" in mgr.exempt_windows
    assert action is not None and action["type"] == "lockdown_breach"
    # a second event on the same door does not re-alert (dedup) or fight it
    action2 = await mgr.handle_state_change("cover.garage_door", old, new)
    assert action2 is None


async def test_indeterminate_cover_is_not_treated_as_a_breach(cognitive_core, fake_hass):
    # BUGFIX (9.21.2): a closed garage dropping to `unavailable` (cloud opener
    # losing its link) must NOT be read as "open" and "secured" — that was the
    # source of the "I tried to secure … but it's still open" spam on doors
    # that were in fact already secure.
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.service_calls.clear()
    old = FakeState("cover.garage_door", "closed", {"device_class": "garage"})
    new = FakeState("cover.garage_door", "unavailable", {"device_class": "garage"})
    action = await mgr.handle_state_change("cover.garage_door", old, new)
    fake_hass.close_pending()
    assert fake_hass.service_calls == []       # never actuated
    assert action is None                       # never alerted
    assert "cover.garage_door" not in mgr._secured_by_us


async def test_cover_without_close_support_is_not_nagged(cognitive_core, fake_hass):
    # BUGFIX (9.21.2): a cover that reports features but no CLOSE service can't
    # actually be closed — don't try (a no-op close) and don't nag; adopt it.
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.service_calls.clear()
    # supported_features=1 → OPEN only, no CLOSE (bit 2). Use a non-garage class
    # so the no-reactive-close garage rule isn't what's being exercised here.
    old = FakeState("cover.odd", "closed", {"device_class": "door", "supported_features": 1})
    new = FakeState("cover.odd", "open", {"device_class": "door", "supported_features": 1})
    action = await mgr.handle_state_change("cover.odd", old, new)
    fake_hass.close_pending()
    assert fake_hass.service_calls == []
    assert action is None
    assert "cover.odd" in mgr.exempt_windows


async def test_new_open_contact_sensor_is_assumed_intentional(cognitive_core, fake_hass):
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.service_calls.clear()
    old = FakeState("binary_sensor.kitchen_window", "off", {"device_class": "window"})
    new = FakeState("binary_sensor.kitchen_window", "on", {"device_class": "window"})
    action = await mgr.handle_state_change("binary_sensor.kitchen_window", old, new)
    fake_hass.close_pending()
    assert fake_hass.service_calls == []          # nothing JARVIS could close
    assert action is None                          # ignored, no alert
    assert "binary_sensor.kitchen_window" in mgr.exempt_windows


async def test_uncloseable_open_at_engage_is_ignored(cognitive_core, fake_hass):
    # A bare window contact open at engage can't be closed remotely, so it's left
    # as-is and not fought afterwards. (Closeable covers like garage doors ARE
    # closed on engage — see test_lockdown_engage.)
    _reset(cognitive_core)
    fake_hass.states.set("binary_sensor.window", "on", device_class="window")  # already open
    mgr = await _engage(cognitive_core, fake_hass)
    fake_hass.close_pending()
    assert "binary_sensor.window" in mgr.exempt_windows
    fake_hass.service_calls.clear()
    old = FakeState("binary_sensor.window", "on", {"device_class": "window"})
    new = FakeState("binary_sensor.window", "on", {"device_class": "window"})
    action = await mgr.handle_state_change("binary_sensor.window", old, new)
    assert action is None
    assert fake_hass.service_calls == []           # never fought


async def test_reopen_after_secure_is_adopted_and_alerts(cognitive_core, fake_hass):
    mgr = await _engage(cognitive_core, fake_hass)
    mgr._secured_by_us.add("cover.garage_door")    # JARVIS already closed it once
    old = FakeState("cover.garage_door", "closed", {"device_class": "garage"})
    new = FakeState("cover.garage_door", "open", {"device_class": "garage"})
    action = await mgr.handle_state_change("cover.garage_door", old, new)
    fake_hass.close_pending()
    assert action is not None and action["type"] == "lockdown_breach"
    assert "cover.garage_door" in mgr.exempt_windows
    assert "cover.garage_door" not in mgr._secured_by_us


# ── fork Phase 1: alarm_control_panel.jarvis_lockdown is a MIRROR, not an alarm ─
# The native lockdown entity reads armed_away while lockdown is active and marks
# itself with ``jarvis_internal: True``. The household-alarm sweeps must skip it,
# otherwise an auto-engaged lockdown can never see the real panel's disarm.

def test_alarm_state_view_ignores_jarvis_internal_mirror(cognitive_core, fake_hass):
    _reset(cognitive_core)
    fake_hass.states.set("alarm_control_panel.jarvis_lockdown", "armed_away", jarvis_internal=True)
    fake_hass.states.set("alarm_control_panel.cove", "disarmed")
    # The mirror alone must not make the house read as armed.
    assert cognitive_core._alarm_state_view(fake_hass) == (False, True, False)
    assert cognitive_core._armed_mode(fake_hass) == ""
    # Only the mirror present -> indeterminate (no household panel), not armed.
    fake_hass.states.remove("alarm_control_panel.cove")
    assert cognitive_core._alarm_state_view(fake_hass) == (False, False, True)
    # A real armed panel still reads through.
    fake_hass.states.set("alarm_control_panel.cove", "armed_home")
    assert cognitive_core._alarm_state_view(fake_hass) == (True, False, False)
    assert cognitive_core._armed_mode(fake_hass) == "armed_home"


def test_is_jarvis_internal_accepts_states_and_facade_dicts(cognitive_core):
    from fakes import FakeState
    assert cognitive_core._is_jarvis_internal(FakeState("alarm_control_panel.x", "armed_away", {"jarvis_internal": True}))
    assert not cognitive_core._is_jarvis_internal(FakeState("alarm_control_panel.x", "armed_away"))
    assert cognitive_core._is_jarvis_internal({"state": "armed_away", "attributes": {"jarvis_internal": True}})
    assert not cognitive_core._is_jarvis_internal({"state": "armed_away", "attributes": {}})
    assert not cognitive_core._is_jarvis_internal(None)


async def test_real_alarm_disarm_lifts_lockdown_despite_mirror(cognitive_core, fake_hass):
    """Regression: arm real panel -> lockdown engages -> mirror reads armed_away;
    disarming the real panel must still lift the auto lockdown."""
    _reset(cognitive_core)
    fake_hass.states.set("alarm_control_panel.cove", "armed_away")
    await cognitive_core.ensure_lockdown(fake_hass, cognitive_core._CORE.config)
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is True
    assert cognitive_core._CORE.lockdown_mgr.auto is True

    # What alarm_control_panel.jarvis_lockdown now publishes.
    fake_hass.states.set("alarm_control_panel.jarvis_lockdown", "armed_away", jarvis_internal=True)

    fake_hass.states.set("alarm_control_panel.cove", "disarmed")
    await cognitive_core._sync_lockdown_to_alarm("alarm alarm_control_panel.cove")
    fake_hass.close_pending()
    assert cognitive_core.is_lockdown() is False


async def test_lockdown_listener_ignores_mirror_entity_events(cognitive_core, fake_hass, monkeypatch):
    from fakes import FakeState
    _reset(cognitive_core)
    cognitive_core._CORE.hass = fake_hass
    calls = []

    async def _fake_sync(reason, announce=True):
        calls.append((reason, announce))

    monkeypatch.setattr(cognitive_core, "_sync_lockdown_to_alarm", _fake_sync)

    class _Event:
        def __init__(self, data):
            self.data = data

    # Mirror entity transitions are echoes of lockdown itself -> ignored.
    await cognitive_core._on_lockdown_state(_Event({
        "entity_id": "alarm_control_panel.jarvis_lockdown",
        "old_state": FakeState("alarm_control_panel.jarvis_lockdown", "disarmed", {"jarvis_internal": True}),
        "new_state": FakeState("alarm_control_panel.jarvis_lockdown", "armed_away", {"jarvis_internal": True}),
    }))
    # Entity removal (new_state None) with a marked old_state is ignored too.
    await cognitive_core._on_lockdown_state(_Event({
        "entity_id": "alarm_control_panel.jarvis_lockdown",
        "old_state": FakeState("alarm_control_panel.jarvis_lockdown", "armed_away", {"jarvis_internal": True}),
        "new_state": None,
    }))
    assert calls == []

    # A household panel's genuine arm still syncs.
    await cognitive_core._on_lockdown_state(_Event({
        "entity_id": "alarm_control_panel.cove",
        "old_state": FakeState("alarm_control_panel.cove", "disarmed"),
        "new_state": FakeState("alarm_control_panel.cove", "armed_away"),
    }))
    assert calls == [("alarm alarm_control_panel.cove", True)]
