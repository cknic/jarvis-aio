"""``jarvis/config_schema`` — the typed settings description the new panel
renders its Settings view from (fork Phase 2).

Response: ``{"fields": [...], "values": {...}, "categories": [...]}`` built by
``config_apply.build_schema`` from the ``FieldSpec`` catalogue and
``PANEL_WRITABLE_KEYS``. These tests pin the wire shape, parity with the
catalogue (every exposed field with its kind/options/bounds), the category
order, the secret-key exclusion, JSON-safety of the values and the admin gate.

The admin gate is HA's ``@websocket_api.require_admin`` decorator, so instead
of the identity stub the other websocket tests use, this file's loader installs
an *enforcing* ``require_admin`` that behaves like the real one (sends
``unauthorized`` for a non-admin connection) — proving the decorator really
wraps the handler, and sits outermost.
"""
from __future__ import annotations

import ast
import functools
import importlib.util
import json
import pathlib
import re
import sys
import types

import pytest

_COMP = pathlib.Path(__file__).resolve().parents[2] / "custom_components" / "jarvis"
_WS_PY = _COMP / "websocket.py"

FIELD_KEYS = {"key", "kind", "label", "category", "default", "options",
              "min", "max", "step", "expose"}


def _load_websocket_module():
    """Load websocket.py under the synthetic ``jc`` package with an ENFORCING
    ``require_admin`` stub (the other decorators stay identity)."""
    sys.modules.pop("jc.websocket", None)
    ws_api = types.ModuleType("homeassistant.components.websocket_api")

    def _websocket_command(schema):
        def deco(func):
            func._ws_schema = schema
            return func
        return deco

    def _require_admin(func):
        @functools.wraps(func)
        async def wrapper(hass, connection, msg):
            user = getattr(connection, "user", None)
            if not (user is not None and getattr(user, "is_admin", False)):
                connection.send_error(msg["id"], "unauthorized", "Unauthorized")
                return None
            return await func(hass, connection, msg)
        wrapper._admin_wrapped = True
        return wrapper

    ws_api.websocket_command = _websocket_command
    ws_api.async_response = lambda func: func
    ws_api.require_admin = _require_admin
    ws_api.async_register_command = lambda hass, func: None
    sys.modules["homeassistant.components.websocket_api"] = ws_api
    import homeassistant.components as ha_components
    ha_components.websocket_api = ws_api

    spec = importlib.util.spec_from_file_location("jc.websocket", _WS_PY)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["jc.websocket"] = mod
    spec.loader.exec_module(mod)
    return mod


class _Conn:
    def __init__(self, is_admin: bool):
        self.result = None
        self.error = None
        self.user = types.SimpleNamespace(is_admin=is_admin)

    def send_result(self, msg_id, payload):
        self.result = (msg_id, payload)

    def send_error(self, msg_id, code, message):
        self.error = (msg_id, code, message)


def _wire_runtime(websocket, monkeypatch, fake_hass, runtime: dict | None):
    """Point the handler's value resolvers at ``runtime_config`` in
    ``fake_hass.data`` (the real resolvers go through jarvis_config / config.json,
    which this suite does not touch). ``runtime=None`` means no config entry."""
    if runtime is None:
        fake_hass.config_entries.async_entries = lambda domain: []
        entry = None
    else:
        entry = types.SimpleNamespace(entry_id="e1", data={}, options={})
        fake_hass.config_entries.async_entries = lambda domain: [entry]
        fake_hass.data = {websocket.DOMAIN: {entry.entry_id: {"runtime_config": runtime}}}

    def _rc(hass, ent):
        if ent is None:
            return {}
        data = hass.data.get(websocket.DOMAIN, {}).get(ent.entry_id, {})
        return data.get("runtime_config", {}) if isinstance(data, dict) else {}

    def _runtime_opt(hass, ent, key, default=None):
        rc = _rc(hass, ent)
        if key in rc and rc[key] not in (None, ""):
            return rc[key]
        return default

    def _runtime_json(hass, ent, key, default):
        raw = _rc(hass, ent).get(key)
        if raw is None:
            return default
        if isinstance(raw, (dict, list, tuple, set, frozenset)):
            return raw            # hand containers back as stored: build_schema must JSON-coerce them
        try:
            return json.loads(raw)
        except Exception:
            return default

    monkeypatch.setattr(websocket, "_runtime_opt", _runtime_opt)
    monkeypatch.setattr(websocket, "_get_runtime_json", _runtime_json)
    return entry


async def _schema(websocket, fake_hass, msg_id=1):
    conn = _Conn(is_admin=True)
    await websocket.ws_config_schema(fake_hass, conn, {"id": msg_id, "type": "jarvis/config_schema"})
    assert conn.error is None, conn.error
    assert conn.result[0] == msg_id
    return conn.result[1]


# ── static ────────────────────────────────────────────────────────────────────

def test_static_registered_and_decorated_like_get_panel_data():
    src = _WS_PY.read_text(encoding="utf-8")
    assert re.search(r"async_register_command\(\s*hass\s*,\s*ws_config_schema\s*\)", src)
    tree = ast.parse(src)
    node = next(n for n in ast.walk(tree)
                if isinstance(n, ast.AsyncFunctionDef) and n.name == "ws_config_schema")
    names = []
    for dec in node.decorator_list:
        target = dec.func if isinstance(dec, ast.Call) else dec
        names.append(target.attr if isinstance(target, ast.Attribute) else target.id)
    assert names == ["require_admin", "websocket_command", "async_response"]
    # the docstring states the secret-key rule
    doc = ast.get_docstring(node) or ""
    for word in ("key", "token", "password", "secret"):
        assert f"``{word}``" in doc, f"docstring must name the {word!r} marker"
    assert "update_config" in doc


def test_static_command_type_and_no_arguments():
    websocket = _load_websocket_module()
    schema = websocket.ws_config_schema._ws_schema
    assert list(schema.values()) == ["jarvis/config_schema"]
    assert getattr(websocket.ws_config_schema, "_admin_wrapped", False)


# ── admin gate ────────────────────────────────────────────────────────────────

async def test_non_admin_rejected_admin_served(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    _wire_runtime(websocket, monkeypatch, fake_hass, {})

    nonadmin = _Conn(is_admin=False)
    await websocket.ws_config_schema(fake_hass, nonadmin, {"id": 5, "type": "jarvis/config_schema"})
    assert nonadmin.result is None
    assert nonadmin.error is not None and nonadmin.error[1] == "unauthorized"

    # fail-safe: a connection with no user reads as non-admin
    anon = _Conn(is_admin=False)
    anon.user = None
    await websocket.ws_config_schema(fake_hass, anon, {"id": 6, "type": "jarvis/config_schema"})
    assert anon.result is None and anon.error[1] == "unauthorized"

    admin = _Conn(is_admin=True)
    await websocket.ws_config_schema(fake_hass, admin, {"id": 7, "type": "jarvis/config_schema"})
    assert admin.error is None
    assert set(admin.result[1]) == {"fields", "values", "categories"}


# ── response shape ────────────────────────────────────────────────────────────

async def test_response_shape(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, {})
    res = await _schema(websocket, fake_hass)

    assert set(res) == {"fields", "values", "categories"}
    assert isinstance(res["fields"], list) and res["fields"]
    assert isinstance(res["values"], dict)
    assert isinstance(res["categories"], list)

    keys = [f["key"] for f in res["fields"]]
    assert len(keys) == len(set(keys)), "duplicate field"
    assert set(res["values"]) == set(keys), "one value per field, no extras"

    for f in res["fields"]:
        assert set(f) == FIELD_KEYS, f["key"]
        assert f["kind"] in ca.KINDS
        assert isinstance(f["label"], str) and f["label"]
        assert isinstance(f["category"], str) and f["category"] in res["categories"]
        assert isinstance(f["expose"], bool)
        if f["kind"] == "enum":
            assert isinstance(f["options"], list) and f["options"]
            assert all(isinstance(o, str) for o in f["options"])
        else:
            assert f["options"] is None
        if f["kind"] in ("int", "float"):
            for b in ("min", "max", "step"):
                assert f[b] is None or isinstance(f[b], (int, float)), (f["key"], b)
        else:
            assert f["min"] is None and f["max"] is None and f["step"] is None, f["key"]

    # the whole thing is JSON-serialisable
    json.dumps(res)


async def test_every_writable_key_present_in_catalogue_order(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, {})
    res = await _schema(websocket, fake_hass)
    keys = [f["key"] for f in res["fields"]]
    # no secret-looking names in PANEL_WRITABLE_KEYS today, so every key is emitted
    assert set(keys) == set(websocket.PANEL_WRITABLE_KEYS) == set(ca.CONFIG_FIELDS)
    assert keys == [spec.key for spec in ca._FIELDS]
    # typed by the catalogue, not best-effort
    for f in res["fields"]:
        spec = ca.CONFIG_FIELDS[f["key"]]
        assert f["kind"] == spec.kind and f["category"] == spec.category
        assert f["label"] == spec.label and f["expose"] is spec.expose
    assert "vision_thinking_max_tokens" in keys   # a token *budget*, not a secret


async def test_every_exposed_field_present_with_kind_options_bounds(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, {})
    res = await _schema(websocket, fake_hass)
    by_key = {f["key"]: f for f in res["fields"]}

    exposed = ca.exposed_fields()
    assert exposed
    for spec in exposed:
        f = by_key[spec.key]
        assert f["expose"] is True
        assert f["kind"] == spec.kind
        assert f["category"] == spec.category
        assert f["default"] == spec.default
        if spec.kind == "enum":
            assert f["options"] == list(spec.options)
        if spec.kind in ("int", "float"):
            assert f["min"] == spec.min and f["max"] == spec.max and f["step"] == spec.step

    # spot-check the headline ones
    assert by_key["observer_enabled"]["kind"] == "bool"
    assert by_key["camera_alert_level"]["options"] == ["off", "urgent", "important", "all"]
    assert by_key["banter_level"]["options"] == ["0", "1", "2"]
    t = by_key["intrusion_response_timeout"]
    assert (t["kind"], t["min"], t["max"], t["step"]) == ("int", 30, 900, 30)
    assert by_key["briefing_morning_time"]["kind"] == "str"
    # non-exposed catalogue fields are present too, flagged expose=False
    assert by_key["llm_provider"]["expose"] is False
    assert by_key["cognition_threshold"]["kind"] == "float"
    assert by_key["cognition_threshold"]["step"] == 0.05
    assert by_key["excluded_entities"]["kind"] == "list"
    assert by_key["floor_plan_rooms"]["kind"] == "json"


async def test_categories_order_exposed_first_other_last(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, {})
    res = await _schema(websocket, fake_hass)

    expected: list[str] = []
    for spec in ca.exposed_fields():
        if spec.category not in expected:
            expected.append(spec.category)
    assert res["categories"] == expected + ["Other"]
    assert res["categories"] == ["core", "voice", "learning", "safety", "cameras",
                                 "home", "governance", "Other"]
    assert res["categories"][-1] == "Other"
    assert len(res["categories"]) == len(set(res["categories"]))
    # every field's category is listed
    assert {f["category"] for f in res["fields"]} <= set(res["categories"])
    assert ca.schema_categories() == res["categories"]


# ── values ────────────────────────────────────────────────────────────────────

async def test_values_reflect_runtime_config_coerced_to_kind(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, {
        "banter_level": 2,                        # enum stored as int → "2"
        "observer_enabled": "true",               # bool stored as text
        "sentinel_enabled": False,                # a stored False must not fall to the default True
        "departure_lead_minutes": "45",           # int stored as text
        "cognition_threshold": "0.8",             # float stored as text
        "excluded_entities": '["light.a", "switch.b"]',   # list as JSON text
        "excluded_domains": {"light", "switch"},  # a set → list (JSON-safe)
        "outdoor_areas": ("Yard", "Porch"),       # a tuple → list
        "floor_plan_rooms": {"1": [{"name": "Kitchen"}]},
        "satellite_pairings": '{"assist_satellite.k": "media_player.k"}',
        "honorific": "Ma'am",
    })
    res = await _schema(websocket, fake_hass)
    v = res["values"]
    assert v["banter_level"] == "2"
    assert v["observer_enabled"] is True
    assert v["sentinel_enabled"] is False
    assert v["departure_lead_minutes"] == 45
    assert v["cognition_threshold"] == 0.8
    assert v["excluded_entities"] == ["light.a", "switch.b"]
    assert sorted(v["excluded_domains"]) == ["light", "switch"]
    assert v["outdoor_areas"] == ["Yard", "Porch"]
    assert v["floor_plan_rooms"] == {"1": [{"name": "Kitchen"}]}
    assert v["satellite_pairings"] == {"assist_satellite.k": "media_player.k"}
    assert v["honorific"] == "Ma'am"
    # unset keys show the catalogue default
    assert v["ui_language"] == "auto"
    assert v["intrusion_response_timeout"] == 120
    assert v["voice_confirm_entities"] == []
    assert v["hazard_lat"] is None
    assert v["directive_preset"] == ca.DEFAULT_DIRECTIVE_PRESET
    json.dumps(res)


async def test_values_default_when_no_config_entry(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    _wire_runtime(websocket, monkeypatch, fake_hass, None)
    res = await _schema(websocket, fake_hass)
    assert len(res["fields"]) == len(ca.CONFIG_FIELDS)
    assert res["values"]["observer_enabled"] is False
    assert res["values"]["banter_level"] == "1"
    assert res["values"]["announcement_speakers"] == []


async def test_unparseable_stored_value_is_returned_json_safe_not_raised(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    _wire_runtime(websocket, monkeypatch, fake_hass, {
        "departure_lead_minutes": "soon",         # not a number
        "observer_enabled": "maybe",              # not a bool word
        "residence_style": object(),              # exotic type → str()
    })
    res = await _schema(websocket, fake_hass)
    assert res["values"]["departure_lead_minutes"] == "soon"
    assert res["values"]["observer_enabled"] == "maybe"
    assert isinstance(res["values"]["residence_style"], str)
    json.dumps(res)


# ── secrets and best-effort keys ──────────────────────────────────────────────

async def test_secret_looking_keys_excluded_best_effort_keys_in_other(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    ca = load("config_apply")
    secrets = {"openai_api_key": "sk-live-9f8e7d", "imap_password": "hunter2-correct",
               "webhook_token": "t0k3n-abc", "shared_secret": "sss-shh", "SearXNG_KEY": "sx-k3y"}
    extras = {"extra_flag": True, "extra_count": 3, "extra_ratio": 0.5,
              "extra_name": "x", "extra_map": {"a": 1}, "extra_list": ["a"]}
    monkeypatch.setattr(websocket, "PANEL_WRITABLE_KEYS",
                        set(websocket.PANEL_WRITABLE_KEYS) | set(secrets) | set(extras))
    _wire_runtime(websocket, monkeypatch, fake_hass, {**secrets, **extras})
    res = await _schema(websocket, fake_hass)
    keys = {f["key"] for f in res["fields"]}

    for s in secrets:
        assert s not in keys, s
        assert s not in res["values"], s
    blob = json.dumps(res)
    for leaked in secrets.values():
        assert leaked not in blob, leaked

    by_key = {f["key"]: f for f in res["fields"]}
    expect_kind = {"extra_flag": "bool", "extra_count": "int", "extra_ratio": "float",
                   "extra_name": "str", "extra_map": "json", "extra_list": "json"}
    for key, kind in expect_kind.items():
        f = by_key[key]
        assert f["kind"] == kind, key
        assert f["category"] == "Other" and f["expose"] is False
        assert f["label"] == key.replace("_", " ").capitalize()
        assert f["options"] is None and f["min"] is None and f["max"] is None and f["step"] is None
        assert f["default"] is None
        assert res["values"][key] == extras[key]
    # best-effort fields come after the catalogue, sorted, and "Other" is last
    tail = [f["key"] for f in res["fields"]][-len(extras):]
    assert tail == sorted(extras)
    assert res["categories"][-1] == "Other"
    # the catalogue's token budget survives the secret filter
    assert "vision_thinking_max_tokens" in keys
    assert ca.looks_secret("vision_thinking_max_tokens", ca.CONFIG_FIELDS["vision_thinking_max_tokens"]) is False
    assert ca.looks_secret("openai_api_key") is True
    assert ca.looks_secret("imap_user") is False


def test_looks_secret_rules(load):
    ca = load("config_apply")
    assert ca.looks_secret("api_key")
    assert ca.looks_secret("some_token")
    assert ca.looks_secret("db_password")
    assert ca.looks_secret("client_secret")
    assert not ca.looks_secret("imap_host")
    # an exposed catalogue field with a secret-looking name is kept
    spec = ca.FieldSpec("auth_token_ttl", "str", "", label="x", expose=True)
    assert not ca.looks_secret(spec.key, spec)
    # a non-exposed str catalogue field with a secret-looking name is hidden
    spec = ca.FieldSpec("auth_token", "str", "", label="x")
    assert ca.looks_secret(spec.key, spec)
    # numeric / bool catalogue fields cannot carry a credential
    spec = ca.FieldSpec("max_tokens", "int", 1, label="x")
    assert not ca.looks_secret(spec.key, spec)


# ── failure path ──────────────────────────────────────────────────────────────

async def test_builder_failure_sends_error(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    _wire_runtime(websocket, monkeypatch, fake_hass, {})

    def _boom(*a, **k):
        raise RuntimeError("kaput")
    monkeypatch.setattr(websocket.config_apply, "build_schema", _boom)
    conn = _Conn(is_admin=True)
    await websocket.ws_config_schema(fake_hass, conn, {"id": 9, "type": "jarvis/config_schema"})
    assert conn.result is None
    assert conn.error == (9, "config_schema_failed", "kaput")
