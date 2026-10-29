"""Admin gating of the JARVIS panel and its websocket commands (Phase 0/1).

The panel is admin-only: Phase 1 exposes stock HA entities for household
members, so a non-admin HA login must not reach the panel itself, nor any
websocket command that exposes household data (faces, snapshots, documents,
memory, logs) or triggers paid/external work. Pure-read commands in that set
carry ``@websocket_api.require_admin``; mixed read/write commands gate the
sensitive branches with ``_deny_non_admin`` while leaving plain status reads
open for future household cards.

Static checks parse ``websocket.py`` with ``ast`` (no HA needed); behavioural
checks drive two handlers with a fake non-admin connection under the same
websocket_api stub the other websocket unit tests use.
"""
from __future__ import annotations

import ast
import importlib.util
import pathlib
import sys
import types

import pytest

_COMP = pathlib.Path(__file__).resolve().parents[2] / "custom_components" / "jarvis"
_WS_PY = _COMP / "websocket.py"
_PANEL_PY = _COMP / "panel_register.py"

# Pure-read commands that must be admin-only in their entirety.
ADMIN_ONLY_READ_COMMANDS = [
    "jarvis/get_panel_data",
    "jarvis/config_schema",
    "jarvis/get_activity_log",
    "jarvis/camera_snapshot",
    "jarvis/get_debug_log",
    "jarvis/get_knowledge",
    "jarvis/search_memory",
    "jarvis/root_cause",
    "jarvis/face_reference",
    "jarvis/compute_camera_coverage",
    "jarvis/camera_diagnostics",
    "jarvis/get_calibration",
    "jarvis/diagnostics",
    "jarvis/get_person_routines",
    "jarvis/briefings",
    "jarvis/get_area_sparklines",
    "jarvis/mmwave_overview",
    "jarvis/get_cognitive_status",
    "jarvis/get_enforcement",
    "jarvis/floorplan_sources",
    "jarvis/area_lights",
]

# Mixed read/write commands: (command type, actions that must be guarded).
GUARDED_BRANCHES = {
    "jarvis/faces": {"list"},
    "jarvis/voices": {"list", "identify", "enroll", "forget"},
    "jarvis/hazard": {"scan"},
    "jarvis/semantic_search": {"test"},
    "jarvis/documents": {"status", "search"},
    "jarvis/intrusion": {"log"},
}

# Reads deliberately left open for household cards (must NOT be require_admin).
OPEN_MIXED_COMMANDS = [
    "jarvis/intrusion", "jarvis/mode", "jarvis/energy", "jarvis/mutes",
    "jarvis/biometrics",
]


# ── helpers ───────────────────────────────────────────────────────────────────

def _type_from_decorator(dec: ast.AST):
    if not (isinstance(dec, ast.Call) and dec.args):
        return None
    first = dec.args[0]
    if not isinstance(first, ast.Dict):
        return None
    for key, value in zip(first.keys, first.values):
        is_type_key = (
            (isinstance(key, ast.Call) and key.args
             and isinstance(key.args[0], ast.Constant) and key.args[0].value == "type")
            or (isinstance(key, ast.Constant) and key.value == "type")
        )
        if is_type_key and isinstance(value, ast.Constant) and isinstance(value.value, str):
            return value.value
    return None


def _decorator_name(dec: ast.AST) -> str:
    target = dec.func if isinstance(dec, ast.Call) else dec
    if isinstance(target, ast.Attribute):
        return target.attr
    if isinstance(target, ast.Name):
        return target.id
    return ""


def _handlers() -> dict[str, ast.AsyncFunctionDef | ast.FunctionDef]:
    """Map command type -> handler function node."""
    tree = ast.parse(_WS_PY.read_text(encoding="utf-8"))
    out = {}
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for dec in node.decorator_list:
                t = _type_from_decorator(dec)
                if t:
                    out[t] = node
    return out


def _is_require_admin(node) -> bool:
    return any(_decorator_name(d) == "require_admin" for d in node.decorator_list)


def _guarded_actions(node) -> set[str]:
    """Collect the action literals that appear in a ``_deny_non_admin`` guard
    inside the handler: ``if action in ("a", "b") and _deny_non_admin(...)`` or
    ``if msg["action"] == "a" and _deny_non_admin(...)``."""
    actions: set[str] = set()
    for sub in ast.walk(node):
        if not isinstance(sub, ast.If):
            continue
        test = sub.test
        if not (isinstance(test, ast.BoolOp) and isinstance(test.op, ast.And)):
            continue
        calls_deny = any(
            isinstance(v, ast.Call) and _decorator_name(v) == "_deny_non_admin"
            for v in test.values)
        if not calls_deny:
            continue
        for v in test.values:
            if isinstance(v, ast.Compare):
                for comp in v.comparators:
                    if isinstance(comp, ast.Constant) and isinstance(comp.value, str):
                        actions.add(comp.value)
                    elif isinstance(comp, (ast.Tuple, ast.List)):
                        actions.update(
                            e.value for e in comp.elts
                            if isinstance(e, ast.Constant) and isinstance(e.value, str))
    return actions


def _load_websocket_module():
    """Load websocket.py under the synthetic ``jc`` package with the
    websocket_api decorators stubbed to identity (same shape as
    test_websocket_provider_config)."""
    sys.modules.pop("jc.websocket", None)
    ws_api = types.ModuleType("homeassistant.components.websocket_api")
    ws_api.websocket_command = lambda schema: (lambda func: func)
    ws_api.async_response = lambda func: func
    ws_api.require_admin = lambda func: func
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


def _install_jc_module(monkeypatch, name, module):
    monkeypatch.setitem(sys.modules, f"jc.{name}", module)
    monkeypatch.setattr(sys.modules["jc"], name, module, raising=False)
    return module


# ── static: websocket.py ──────────────────────────────────────────────────────

def test_static_every_listed_read_command_requires_admin():
    handlers = _handlers()
    missing = [c for c in ADMIN_ONLY_READ_COMMANDS if c not in handlers]
    assert not missing, f"commands not found in websocket.py: {missing}"
    ungated = [c for c in ADMIN_ONLY_READ_COMMANDS if not _is_require_admin(handlers[c])]
    assert not ungated, \
        f"must carry @websocket_api.require_admin: {ungated}"


def test_static_require_admin_sits_above_websocket_command():
    """Match the house style (ws_update_config): require_admin is the outermost
    decorator, so HA checks the admin flag before the schema/handler run."""
    handlers = _handlers()
    for cmd in ADMIN_ONLY_READ_COMMANDS:
        names = [_decorator_name(d) for d in handlers[cmd].decorator_list]
        assert names.index("require_admin") < names.index("websocket_command"), \
            f"{cmd}: @require_admin must come before @websocket_command, got {names}"


def test_static_mixed_commands_guard_sensitive_branches():
    handlers = _handlers()
    for cmd, wanted in GUARDED_BRANCHES.items():
        node = handlers[cmd]
        assert not _is_require_admin(node), \
            f"{cmd} is mixed read/write and must stay a per-branch guard, not require_admin"
        guarded = _guarded_actions(node)
        assert wanted <= guarded, \
            f"{cmd}: branches {sorted(wanted - guarded)} lack a _deny_non_admin guard"


def test_static_household_status_reads_stay_open():
    handlers = _handlers()
    for cmd in OPEN_MIXED_COMMANDS:
        node = handlers[cmd]
        assert not _is_require_admin(node), f"{cmd} must stay open for household cards"
        guarded = _guarded_actions(node)
        assert "status" not in guarded, f"{cmd}: plain status read must not be gated"
        assert "list" not in guarded, f"{cmd}: plain list read must not be gated"


def test_static_face_reference_docstring_no_longer_argues_openness():
    src = _WS_PY.read_text(encoding="utf-8")
    idx = src.index("async def ws_face_reference(")
    doc = src[idx: idx + 1200]
    assert "not admin-gated" not in doc
    assert "Admin-only" in doc


# ── static: panel_register.py ────────────────────────────────────────────────

def test_static_panel_registered_admin_only_and_cmd_constants_gone():
    src = _PANEL_PY.read_text(encoding="utf-8")
    assert "require_admin=True" in src
    assert "require_admin=False" not in src
    for dead in ("CMD_URL_PATH", "CMD_TITLE", "CMD_ICON", "CMD_WEBCOMPONENT",
                 "CMD_JS_FILENAME"):
        assert dead not in src, f"dead constant {dead} should be deleted"
    # Legacy cleanup of the <=6.14.x Command Center entry is kept, inlined.
    assert '_remove_panel_if_present(hass, "jarvis-command")' in src


# ── behavioural: panel_register passes require_admin=True to HA ──────────────

def _install_frontend_stubs():
    comps = sys.modules.setdefault(
        "homeassistant.components", types.ModuleType("homeassistant.components"))
    frontend = types.ModuleType("homeassistant.components.frontend")
    frontend.DATA_PANELS = "frontend_panels"
    frontend.async_remove_panel = lambda hass, url_path, **kw: None
    comps.frontend = frontend
    sys.modules["homeassistant.components.frontend"] = frontend
    panel_custom = types.ModuleType("homeassistant.components.panel_custom")

    async def _register(*a, **k):
        return None
    panel_custom.async_register_panel = _register
    comps.panel_custom = panel_custom
    sys.modules["homeassistant.components.panel_custom"] = panel_custom
    http = types.ModuleType("homeassistant.components.http")

    class StaticPathConfig:
        def __init__(self, *a, **k): ...
    http.StaticPathConfig = StaticPathConfig
    sys.modules["homeassistant.components.http"] = http


async def test_register_one_passes_require_admin_true(load, fake_hass, tmp_path):
    _install_frontend_stubs()
    pr = load("panel_register")
    seen: list[dict] = []

    async def _capture(hass, **kwargs):
        seen.append(kwargs)
    pr.panel_custom.async_register_panel = _capture
    fake_hass.data = {"frontend_panels": {}}
    (tmp_path / "jarvis-panel.js").write_text("// panel", encoding="utf-8")

    ok = await pr._register_one(
        fake_hass, str(tmp_path),
        webcomponent="jarvis-panel", url_path="jarvis", title="JARVIS",
        icon="mdi:robot-outline", js_filename="jarvis-panel.js")
    assert ok is True
    assert len(seen) == 1
    assert seen[0]["require_admin"] is True
    assert seen[0]["frontend_url_path"] == "jarvis"


# ── behavioural: _deny_non_admin branches ────────────────────────────────────

async def test_faces_list_denied_for_non_admin_allowed_for_admin(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    calls: list[str] = []
    recognition = types.SimpleNamespace(
        recent_faces=lambda hass, limit: calls.append("recent") or [],
        list_face_references=lambda: calls.append("refs") or ["sam"],
        remove_face_reference=lambda name: None,
        set_face_reference=lambda name, raw: True,
    )
    roster = types.SimpleNamespace(
        _load=lambda: calls.append("load"),
        residents=lambda: ["Sam"],
        add_resident=lambda n: None, remove_resident=lambda n: None,
    )
    _install_jc_module(monkeypatch, "recognition", recognition)
    _install_jc_module(monkeypatch, "face_roster", roster)
    monkeypatch.setattr(websocket, "_get_entry", lambda hass: None)
    monkeypatch.setattr(websocket, "_runtime_opt",
                        lambda hass, entry, key, default=None: default)

    # Non-admin: explicit "list" → unauthorized, nothing read.
    nonadmin = _Conn(is_admin=False)
    await websocket.ws_faces(fake_hass, nonadmin, {"id": 1, "action": "list"})
    assert nonadmin.result is None
    assert nonadmin.error is not None and nonadmin.error[1] == "unauthorized"
    assert calls == []

    # Non-admin: omitted action defaults to "list" and is equally denied.
    nonadmin2 = _Conn(is_admin=False)
    await websocket.ws_faces(fake_hass, nonadmin2, {"id": 2})
    assert nonadmin2.result is None
    assert nonadmin2.error is not None and nonadmin2.error[1] == "unauthorized"
    assert calls == []

    # Admin: list works and returns the reference names.
    admin = _Conn(is_admin=True)
    await websocket.ws_faces(fake_hass, admin, {"id": 3, "action": "list"})
    assert admin.error is None
    assert admin.result is not None and admin.result[1]["references"] == ["sam"]
    assert "refs" in calls


async def test_documents_status_and_search_denied_for_non_admin(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    calls: list[str] = []

    async def _search(hass, query, k):
        calls.append("search")
        return [{"text": "secret passage"}]
    documents = types.SimpleNamespace(
        library_status=lambda: calls.append("status") or {"files": 3},
        search_documents_async=_search,
    )
    _install_jc_module(monkeypatch, "documents", documents)

    for action, extra in (("status", {}), ("search", {"query": "tax"})):
        conn = _Conn(is_admin=False)
        await websocket.ws_documents(fake_hass, conn, {"id": 1, "action": action, **extra})
        assert conn.result is None, action
        assert conn.error is not None and conn.error[1] == "unauthorized", action
    assert calls == []

    admin = _Conn(is_admin=True)
    await websocket.ws_documents(fake_hass, admin, {"id": 2, "action": "status"})
    assert admin.error is None and admin.result[1] == {"files": 3}
    admin2 = _Conn(is_admin=True)
    await websocket.ws_documents(fake_hass, admin2, {"id": 3, "action": "search", "query": "tax"})
    assert admin2.error is None and admin2.result[1]["results"][0]["text"] == "secret passage"


async def test_intrusion_log_denied_but_status_open_for_non_admin(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    loaded: list[str] = []

    async def _load(hass):
        loaded.append("load")
    snap = {"path": "/config/jarvis/snapshots/intrusion/intrusion_front_door_1.jpg",
            "url": "/api/jarvis/snapshot/intrusion/intrusion_front_door_1.jpg",
            "camera": "camera.front_door", "ts": 1730000000}
    full_status = {"last_snapshot": snap, "called_off": False, "acknowledged": False,
                   "suppressed_for": 0, "false_alarms_24h": 1}
    intrusion = types.SimpleNamespace(
        async_load=_load,
        get_log=lambda limit: [{"snapshot": "/api/x.jpg"}],
        learning_summary=lambda: {},
        status=lambda: dict(full_status),
    )
    _install_jc_module(monkeypatch, "intrusion", intrusion)

    nonadmin = _Conn(is_admin=False)
    await websocket.ws_intrusion(fake_hass, nonadmin, {"id": 1, "action": "log"})
    assert nonadmin.result is None
    assert nonadmin.error is not None and nonadmin.error[1] == "unauthorized"
    assert loaded == []

    # Open status read, but REDACTED: no server path / camera / snapshot URL.
    reader = _Conn(is_admin=False)
    await websocket.ws_intrusion(fake_hass, reader, {"id": 2, "action": "status"})
    assert reader.error is None
    assert reader.result[1] == {"called_off": False, "acknowledged": False,
                                "suppressed_for": 0, "false_alarms_24h": 1}
    assert "last_snapshot" not in reader.result[1]

    # The panel (admin) still gets the full record for its snapshot card.
    admin = _Conn(is_admin=True)
    await websocket.ws_intrusion(fake_hass, admin, {"id": 3, "action": "status"})
    assert admin.error is None and admin.result[1] == full_status
    assert admin.result[1]["last_snapshot"] == snap


async def test_voices_list_and_identify_denied_for_non_admin(fake_hass, monkeypatch):
    """The voiceprint roster (names), the server model path and on-demand
    speaker identification are household/biometric data: admin-only, like faces."""
    websocket = _load_websocket_module()
    calls: list[str] = []
    voice_roster = types.SimpleNamespace(
        all_profiles=lambda: calls.append("profiles") or [
            {"name": "Sam", "count": 3, "updated": 1}],
        enroll=lambda n, e: True, remove=lambda n: None)
    speaker_id = types.SimpleNamespace(
        embed_wav=lambda raw: calls.append("embed") or [0.1],
        identify=lambda emb: calls.append("identify") or {"name": "Sam"},
        backend_available=lambda: True)
    voice_recognition = types.SimpleNamespace(current_local_speaker=lambda: None)
    for name, mod in (("voice_roster", voice_roster), ("speaker_id", speaker_id),
                      ("voice_recognition", voice_recognition)):
        _install_jc_module(monkeypatch, name, mod)
    monkeypatch.setattr(websocket, "_get_entry", lambda hass: None)
    monkeypatch.setattr(websocket, "_runtime_opt",
                        lambda hass, entry, key, default=None: "/models/x.onnx"
                        if key == "voice_embedding_model_path" else default)

    for msg in ({"id": 1, "action": "list"}, {"id": 2},
                {"id": 3, "action": "identify", "audio": "AAAA"}):
        conn = _Conn(is_admin=False)
        await websocket.ws_voices(fake_hass, conn, msg)
        assert conn.result is None, msg
        assert conn.error is not None and conn.error[1] == "unauthorized", msg
    assert calls == []          # no roster read, no inference for a non-admin

    admin = _Conn(is_admin=True)
    await websocket.ws_voices(fake_hass, admin, {"id": 4, "action": "list"})
    assert admin.error is None
    assert admin.result[1]["profiles"] == [{"name": "Sam", "count": 3, "updated": 1}]
    assert admin.result[1]["model_path"] == "/models/x.onnx"
    admin2 = _Conn(is_admin=True)
    await websocket.ws_voices(fake_hass, admin2, {"id": 5, "action": "identify", "audio": "AAAA"})
    assert admin2.error is None and admin2.result[1] == {"match": {"name": "Sam"}}


async def test_semantic_search_status_hides_endpoint_from_non_admin(fake_hass, monkeypatch):
    """'status' stays open, but the internal Ollama/embedding endpoint and model
    are infrastructure details only the admin-only Settings tab needs."""
    websocket = _load_websocket_module()
    embeddings = types.SimpleNamespace(
        _ollama_base=lambda: "http://ollama.lan:11434",
        _model=lambda: "nomic-embed-text",
        vector_count=lambda: 42)
    jarvis_config = types.SimpleNamespace(get=lambda key, default=None: True)
    _install_jc_module(monkeypatch, "embeddings", embeddings)
    _install_jc_module(monkeypatch, "jarvis_config", jarvis_config)

    reader = _Conn(is_admin=False)
    await websocket.ws_semantic_search(fake_hass, reader, {"id": 1, "action": "status"})
    assert reader.error is None
    assert reader.result[1] == {"enabled": True, "ollama_configured": True, "vector_count": 42}

    admin = _Conn(is_admin=True)
    await websocket.ws_semantic_search(fake_hass, admin, {"id": 2, "action": "status"})
    assert admin.error is None
    assert admin.result[1] == {"enabled": True, "ollama_configured": True, "vector_count": 42,
                               "base": "http://ollama.lan:11434", "model": "nomic-embed-text"}
