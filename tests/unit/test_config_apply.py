"""config_apply.async_apply + CONFIG_FIELDS — the shared settings write path
(fork Phase 0).

``ws_update_config`` is now validate → ``config_apply.async_apply`` →
send_result, and the native switch/select/number entities call the same
function. These tests pin the behaviour the panel relied on (runtime_config
write, persistence, review opt-in, observer lifecycle) and the catalogue's
parity with ``PANEL_WRITABLE_KEYS``.
"""
from __future__ import annotations

import ast
import importlib.util
import pathlib
import sys
import types

import pytest

_COMP = pathlib.Path(__file__).resolve().parents[2] / "custom_components" / "jarvis"


def _load_websocket_module():
    sys.modules.pop("jc.websocket", None)
    ws_api = types.ModuleType("homeassistant.components.websocket_api")
    ws_api.websocket_command = lambda schema: (lambda func: func)
    ws_api.async_response = lambda func: func
    ws_api.require_admin = lambda func: func
    ws_api.async_register_command = lambda hass, func: None
    sys.modules["homeassistant.components.websocket_api"] = ws_api
    import homeassistant.components as ha_components
    ha_components.websocket_api = ws_api
    spec = importlib.util.spec_from_file_location("jc.websocket", _COMP / "websocket.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules["jc.websocket"] = mod
    spec.loader.exec_module(mod)
    return mod


def _install_jc_module(monkeypatch, name, module):
    monkeypatch.setitem(sys.modules, f"jc.{name}", module)
    monkeypatch.setattr(sys.modules["jc"], name, module, raising=False)
    return module


async def _resolved(value):
    return value


def _writable_keys_from_source() -> set[str]:
    tree = ast.parse((_COMP / "websocket.py").read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Set):
            for tgt in node.targets:
                if isinstance(tgt, ast.Name) and tgt.id == "PANEL_WRITABLE_KEYS":
                    return {e.value for e in node.value.elts if isinstance(e, ast.Constant)}
    raise AssertionError("PANEL_WRITABLE_KEYS not found")


# ── catalogue ────────────────────────────────────────────────────────────────

def test_config_fields_match_panel_writable_keys_exactly(load):
    _load_websocket_module()
    ca = load("config_apply")
    writable = _writable_keys_from_source()
    assert set(ca.CONFIG_FIELDS) == writable
    assert ca.writable_keys() == writable


def test_every_field_spec_is_well_formed(load):
    ca = load("config_apply")
    for key, spec in ca.CONFIG_FIELDS.items():
        assert spec.key == key
        assert spec.kind in ca.KINDS and spec.category in ca.CATEGORIES
        assert spec.label, key
        if spec.kind == "enum":
            assert spec.options and spec.default in spec.options, key
        if spec.kind in ("int", "float") and spec.default is not None:
            if spec.min is not None:
                assert spec.default >= spec.min, key
            if spec.max is not None:
                assert spec.default <= spec.max, key
        if spec.kind == "bool":
            assert isinstance(spec.default, bool), key
        if spec.kind == "list":
            assert spec.default == [], key
        if spec.expose:
            # entities exist for scalars only; lists/json/urls/providers stay panel-only
            assert spec.kind in ("bool", "int", "float", "enum", "str"), key
            assert not key.endswith(("_url", "_provider", "_model")), key


def test_exposed_fields_cover_the_headline_toggles(load):
    ca = load("config_apply")
    exposed = {f.key for f in ca.exposed_fields()}
    for key in ("announcements_enabled", "announce_notify_only", "sentinel_enabled",
                "observer_enabled", "light_control_enabled", "banter_level",
                "directive_preset", "voice_confirm_enabled", "voice_confirm_mode",
                "camera_auto_analyze", "camera_alert_level", "intrusion_vision_veto",
                "intrusion_response_timeout", "energy_agency",
                "briefing_morning_enabled", "briefing_evening_enabled",
                "briefing_morning_time", "briefing_evening_time",
                "observer_quiet_start", "observer_quiet_end",
                "ui_language", "output_language"):
        assert key in exposed, key
    for key in ("llm_provider", "model", "excluded_entities", "floor_plan_rooms",
                "searxng_url", "imap_host", "friday_automator", "autonomy_enforce"):
        assert key not in exposed, key
    assert 20 <= len(exposed) <= 45


def test_field_spec_rejects_bad_values(load):
    ca = load("config_apply")
    with pytest.raises(ValueError):
        ca.FieldSpec("x", "colour")
    with pytest.raises(ValueError):
        ca.FieldSpec("x", "bool", category="misc")
    with pytest.raises(ValueError):
        ca.FieldSpec("x", "enum", "a")


# ── async_apply ──────────────────────────────────────────────────────────────

async def test_async_apply_rejects_unknown_key_and_missing_runtime(fake_hass, load):
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="e1", data={}, options={})
    with pytest.raises(ValueError):
        await ca.async_apply(fake_hass, entry, "not_writable", True)
    with pytest.raises(LookupError):
        await ca.async_apply(fake_hass, None, "ui_language", "fr")
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: None}}
    with pytest.raises(LookupError):
        await ca.async_apply(fake_hass, entry, "ui_language", "fr")


async def test_async_apply_writes_runtime_config_and_persists(fake_hass, monkeypatch, load):
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="e1", data={}, options={})
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {}}}
    persisted = []
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        set_many=lambda updates: persisted.append(dict(updates))))

    res = await ca.async_apply(fake_hass, entry, "ui_language", "fr")
    assert res == {"key": "ui_language", "value": "fr", "updates": {"ui_language": "fr"}}
    assert fake_hass.data[ca.DOMAIN][entry.entry_id]["runtime_config"] == {"ui_language": "fr"}
    assert persisted == [{"ui_language": "fr"}]

    # persistence failure is non-fatal (same as the old handler)
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        set_many=lambda updates: (_ for _ in ()).throw(RuntimeError("disk full"))))
    res = await ca.async_apply(fake_hass, entry, "banter_level", "2")
    assert res["value"] == "2"
    assert fake_hass.data[ca.DOMAIN][entry.entry_id]["runtime_config"]["banter_level"] == "2"


async def test_async_apply_observer_enabled_toggles_running_flag(fake_hass, monkeypatch, load):
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="obs", data={}, options={})
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {}}}
    persisted = []
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        set_many=lambda updates: persisted.append(dict(updates)),
        effective_config_with_runtime=lambda entry, runtime: {"enabled": runtime["observer_enabled"]},
    ))
    lifecycle = []
    _install_jc_module(monkeypatch, "observer", types.SimpleNamespace(
        start=lambda hass, config: _resolved(lifecycle.append(("start", config))),
        stop=lambda: _resolved(lifecycle.append(("stop", None))),
    ))

    await ca.async_apply(fake_hass, entry, "observer_enabled", True)
    assert fake_hass.data[ca.DOMAIN][entry.entry_id]["observer_running"] is True
    assert lifecycle == [("start", {"enabled": True})]

    await ca.async_apply(fake_hass, entry, "observer_enabled", False)
    assert fake_hass.data[ca.DOMAIN][entry.entry_id]["observer_running"] is False
    assert lifecycle[-1] == ("stop", None)
    assert persisted == [{"observer_enabled": True}, {"observer_enabled": False}]


async def test_async_apply_review_provider_sets_review_enabled(fake_hass, monkeypatch, load):
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="rev", data={}, options={})
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {}}}
    persisted, refreshes = [], []
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        set_many=lambda updates: persisted.append(dict(updates))))

    async def _refresh_observer(hass, updates=None):
        refreshes.append(dict(updates or {}))
    _install_jc_module(monkeypatch, "observer", types.SimpleNamespace(
        is_running=lambda: True, refresh_tier_providers=_refresh_observer))

    res = await ca.async_apply(fake_hass, entry, "review_provider", "gemini")
    rc = fake_hass.data[ca.DOMAIN][entry.entry_id]["runtime_config"]
    assert rc == {"review_provider": "gemini", "review_enabled": True}
    assert res["updates"] == {"review_provider": "gemini", "review_enabled": True}
    assert persisted == [{"review_provider": "gemini", "review_enabled": True}]
    assert refreshes == [{"review_provider": "gemini", "review_enabled": True}]


async def test_async_apply_main_provider_refreshes_live_clients(fake_hass, monkeypatch, load):
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="llm", data={}, options={})
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {}}}
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(set_many=lambda u: None))
    refreshed = {"main": 0, "observer": 0}

    async def _refresh_main(hass, entry):
        refreshed["main"] += 1

    async def _refresh_observer(hass, updates=None):
        refreshed["observer"] += 1
    _install_jc_module(monkeypatch, "llm_provider", types.SimpleNamespace(
        async_refresh_main_client=_refresh_main))
    _install_jc_module(monkeypatch, "observer", types.SimpleNamespace(
        is_running=lambda: True, refresh_tier_providers=_refresh_observer))

    await ca.async_apply(fake_hass, entry, "llm_provider", "openai")
    assert refreshed == {"main": 1, "observer": 1}
    # a non-main provider key refreshes only the observer tiers
    await ca.async_apply(fake_hass, entry, "classifier_model", "llama3")
    assert refreshed == {"main": 1, "observer": 2}


async def test_async_apply_notifies_coordinator_best_effort(fake_hass, monkeypatch, load):
    """Under the unit stubs HA's dispatcher is absent and the coordinator module
    may or may not import — neither may break a settings write."""
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="n", data={}, options={})
    nudged = []
    coord = types.SimpleNamespace(async_request_refresh=lambda: _resolved(nudged.append(1)))
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {"coordinator": coord}}}
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(set_many=lambda u: None))

    await ca.async_apply(fake_hass, entry, "sentinel_enabled", False)
    await fake_hass.drain()
    assert nudged == [1]  # coordinator.request_refresh found the entry's coordinator


async def test_ws_update_config_delegates_to_async_apply(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="ws", data={}, options={})
    fake_hass.config_entries.async_entries = lambda domain: [entry]
    fake_hass.data = {websocket.DOMAIN: {entry.entry_id: {}}}
    seen = []

    async def _fake_apply(hass, entry_, key, value):
        seen.append((entry_, key, value))
        return {"key": key, "value": value, "updates": {key: value}}
    monkeypatch.setattr(ca, "async_apply", _fake_apply)

    class _Conn:
        result = error = None

        def send_result(self, msg_id, payload):
            self.result = (msg_id, payload)

        def send_error(self, msg_id, code, message):
            self.error = (msg_id, code, message)
    conn = _Conn()
    await websocket.ws_update_config(fake_hass, conn, {"id": 9, "key": "ui_language", "value": "de"})
    assert seen == [(entry, "ui_language", "de")]
    assert conn.result == (9, {"key": "ui_language", "value": "de"}) and conn.error is None

    # validation still happens in the handler, before async_apply
    await websocket.ws_update_config(fake_hass, conn, {"id": 10, "key": "nope", "value": 1})
    assert conn.error == (10, "invalid_key", "Key 'nope' is not writable from the panel")
    assert len(seen) == 1


# ── async_apply_many (purpose-built handlers) ────────────────────────────────

async def test_async_apply_many_writes_runtime_config_persists_and_validates(fake_hass, monkeypatch, load):
    """Feature toggles written by jarvis/biometrics, jarvis/semantic_search and
    jarvis/camera_location used to land in config.json only, so the boot-time
    runtime_config copy kept the old value and Settings showed it until a
    restart. async_apply_many writes both."""
    _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="m", data={}, options={})
    fake_hass.data = {ca.DOMAIN: {entry.entry_id: {"runtime_config": {"semantic_search": True}}}}
    persisted = []
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        set_many=lambda updates: persisted.append(dict(updates))))

    res = await ca.async_apply_many(fake_hass, entry, {"semantic_search": False, "biometrics_enabled": True})
    assert res == {"semantic_search": False, "biometrics_enabled": True}
    assert fake_hass.data[ca.DOMAIN][entry.entry_id]["runtime_config"] == {
        "semantic_search": False, "biometrics_enabled": True}
    assert persisted == [{"semantic_search": False, "biometrics_enabled": True}]

    with pytest.raises(ValueError):
        await ca.async_apply_many(fake_hass, entry, {"semantic_search": True, "nope": 1})
    assert len(persisted) == 1  # nothing written when any key is invalid

    # no entry: still persists (old behaviour), no runtime_config to mirror
    await ca.async_apply_many(fake_hass, None, {"biometrics_enabled": False})
    assert persisted[-1] == {"biometrics_enabled": False}


async def test_ws_semantic_search_disable_mirrors_runtime_config(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    entry = types.SimpleNamespace(entry_id="ss", data={}, options={})
    fake_hass.config_entries.async_entries = lambda domain: [entry]
    fake_hass.data = {websocket.DOMAIN: {entry.entry_id: {"runtime_config": {"semantic_search": True}}}}
    seen = []

    async def _fake_many(hass, entry_, updates):
        seen.append((entry_, dict(updates)))
        hass.data[websocket.DOMAIN][entry_.entry_id]["runtime_config"].update(updates)
        return dict(updates)
    monkeypatch.setattr(ca, "async_apply_many", _fake_many)
    monkeypatch.setattr(websocket, "_is_admin", lambda conn: True)
    monkeypatch.setattr(websocket, "jarvis_log", lambda *a: None)

    class _Conn:
        result = error = None

        def send_result(self, msg_id, payload):
            self.result = (msg_id, payload)

        def send_error(self, msg_id, code, message):
            self.error = (msg_id, code, message)
    conn = _Conn()
    await websocket.ws_semantic_search(fake_hass, conn, {"id": 3, "action": "disable"})
    assert conn.error is None and conn.result == (3, {"enabled": False, "ok": True})
    assert seen == [(entry, {"semantic_search": False})]
    assert fake_hass.data[websocket.DOMAIN]["ss"]["runtime_config"]["semantic_search"] is False
