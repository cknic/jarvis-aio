"""``jarvis/set_floor_background`` — one floor's background per message.

``floor_plan_bg`` is one dict ``{"<floor>": "data:image/...", "_align": {...}}``.
The editor used to write it whole through ``jarvis/update_config``, and HA's
websocket takes at most 4 MiB per incoming frame, so every floor's image
together had to fit in that (and an alignment nudge resent them all). The
per-floor command merges ONE floor server-side. Covered here: the pure merge
(``floorplan_import.merge_floor_background``), validation, the handler (admin
gating, runtime-aware read, persistence + ``runtime_config`` mirror through
``config_apply.async_apply_many``, error replies) and the vacuum-map import
sharing the same write.
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

IMG_1F = "data:image/png;base64,AAAA"
IMG_2F = "data:image/jpeg;base64,BBBB"
IMG_NEW = "data:image/webp;base64,CCCC"
ALIGN_1F = {"x": 1.0, "y": 2.0, "w": 300.0}
ALIGN_2F = {"x": -5.0, "y": 0.0, "w": 120.0}


@pytest.fixture
def fp(load):
    return load("floorplan_import")


# ── helpers (same shape as test_websocket_provider_config / test_admin_gating) ──

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

    spec = importlib.util.spec_from_file_location("jc.websocket", _WS_PY)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["jc.websocket"] = mod
    spec.loader.exec_module(mod)
    return mod


class _Conn:
    def __init__(self, is_admin=True):
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


def _setup(fake_hass, monkeypatch, *, runtime=None, stored=None):
    """A JARVIS entry whose runtime_config holds ``runtime`` (when given) and a
    config.json stub holding ``stored``. Returns (entry, persisted writes)."""
    persisted: list[dict] = []
    store = {} if stored is None else {"floor_plan_bg": stored}
    _install_jc_module(monkeypatch, "jarvis_config", types.SimpleNamespace(
        get=lambda key, default=None: store.get(key, default),
        runtime_get=lambda hass, entry, key, default=None: store.get(key, default),
        set_many=lambda updates: (persisted.append(dict(updates)), store.update(updates)),
    ))
    entry = types.SimpleNamespace(entry_id="fp", data={}, options={})
    fake_hass.config_entries.async_entries = lambda domain: [entry]
    rc = {} if runtime is None else {"floor_plan_bg": runtime}
    fake_hass.data = {"jarvis": {entry.entry_id: {"runtime_config": rc}}}
    return entry, persisted


def _rc(fake_hass):
    return fake_hass.data["jarvis"]["fp"]["runtime_config"]


# ── merge: only the named floor changes ───────────────────────────────────────

def test_merge_sets_one_floor_and_keeps_the_rest(fp):
    prior = {"1f": IMG_1F, "2f": IMG_2F, "_align": {"1f": ALIGN_1F, "2f": ALIGN_2F}}
    out = fp.merge_floor_background(prior, "1f", image=IMG_NEW)
    assert out == {"1f": IMG_NEW, "2f": IMG_2F, "_align": {"1f": ALIGN_1F, "2f": ALIGN_2F}}
    # a copy: the stored value is never mutated in place
    assert prior["1f"] == IMG_1F


def test_merge_removes_an_image(fp):
    out = fp.merge_floor_background({"1f": IMG_1F, "2f": IMG_2F}, "1f", image=None)
    assert out == {"2f": IMG_2F}


def test_merge_sets_and_removes_one_alignment(fp):
    prior = {"1f": IMG_1F, "_align": {"2f": ALIGN_2F}}
    out = fp.merge_floor_background(prior, "1f", align=ALIGN_1F)
    assert out == {"1f": IMG_1F, "_align": {"2f": ALIGN_2F, "1f": ALIGN_1F}}
    assert prior["_align"] == {"2f": ALIGN_2F}          # nested dict copied too
    out = fp.merge_floor_background(out, "2f", align=None)
    assert out == {"1f": IMG_1F, "_align": {"1f": ALIGN_1F}}


def test_merge_drops_an_empty_align_entry(fp):
    out = fp.merge_floor_background({"1f": IMG_1F, "_align": {"1f": ALIGN_1F}}, "1f",
                                    image=None, align=None)
    assert out == {}


def test_merge_tolerates_json_text_and_garbage(fp):
    # the vacuum import used to store JSON text; a non-dict _align is replaced
    out = fp.merge_floor_background('{"2f": "%s", "_align": "x"}' % IMG_2F, "1f",
                                    image=IMG_1F, align=ALIGN_1F)
    assert out == {"2f": IMG_2F, "1f": IMG_1F, "_align": {"1f": ALIGN_1F}}
    assert fp.merge_floor_background("not json", "1f", image=IMG_1F) == {"1f": IMG_1F}
    assert fp.merge_floor_background(None, "1f", align=None) == {}


# ── validation ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("floor", ["1f", "2f", "bsmt", "Loft 2", "attic-1", "Étage.3"])
def test_valid_floor_keys(fp, floor):
    assert fp.validate_floor(floor) == floor


@pytest.mark.parametrize("floor", ["_align", "_other", "", " 1f", "a/b", "1f\n", "x" * 65, None, 3])
def test_invalid_floor_keys(fp, floor):
    with pytest.raises(ValueError, match="not a floor key"):
        fp.validate_floor(floor)


def test_image_must_be_an_inline_image(fp):
    assert fp.validate_image(IMG_1F) == IMG_1F
    assert fp.validate_image("DATA:IMAGE/SVG+XML;base64,PHN2Zz4=").startswith("DATA:")
    assert fp.validate_image(None) is None
    assert fp.validate_image("") is None
    for bad in ("https://example.com/plan.png", "/api/image_proxy/image.map",
                "data:text/html;base64,PGI+", "javascript:alert(1)", 42):
        with pytest.raises(ValueError, match="data:image"):
            fp.validate_image(bad)


def test_align_is_three_finite_numbers(fp):
    assert fp.validate_align({"x": 1, "y": -2.5, "w": 10, "extra": "dropped"}) == \
        {"x": 1.0, "y": -2.5, "w": 10.0}
    assert fp.validate_align(None) is None
    for bad in ({"x": 1, "y": 2}, {"x": "1", "y": 2, "w": 3}, {"x": True, "y": 2, "w": 3},
                {"x": float("nan"), "y": 2, "w": 3}, {"x": 1, "y": float("inf"), "w": 3}):
        with pytest.raises(ValueError, match="finite number"):
            fp.validate_align(bad)
    for bad in ({"x": 0, "y": 0, "w": 0}, {"x": 0, "y": 0, "w": -4}):
        with pytest.raises(ValueError, match="greater than 0"):
            fp.validate_align(bad)
    with pytest.raises(ValueError, match="or null"):
        fp.validate_align([1, 2, 3])


# ── the WS handler ────────────────────────────────────────────────────────────

def _handler_node():
    tree = ast.parse(_WS_PY.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "ws_set_floor_background":
            return node
    raise AssertionError("ws_set_floor_background not found in websocket.py")


def test_static_command_is_admin_only_and_registered():
    node = _handler_node()
    names = []
    for dec in node.decorator_list:
        target = dec.func if isinstance(dec, ast.Call) else dec
        names.append(getattr(target, "attr", getattr(target, "id", "")))
    assert names[0] == "require_admin", names
    assert names.index("require_admin") < names.index("websocket_command")
    src = _WS_PY.read_text(encoding="utf-8")
    assert '"jarvis/set_floor_background"' in src
    assert "async_register_command(hass, ws_set_floor_background)" in src


async def test_set_image_merges_only_that_floor(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    prior = {"1f": IMG_1F, "2f": IMG_2F, "_align": {"1f": ALIGN_1F}}
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime=prior)
    conn = _Conn()
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 1, "floor": "2f", "image": IMG_NEW})
    assert conn.error is None
    assert conn.result == (1, {"floor": "2f", "bytes": len(IMG_NEW), "align": None})
    want = {"1f": IMG_1F, "2f": IMG_NEW, "_align": {"1f": ALIGN_1F}}
    assert persisted == [{"floor_plan_bg": want}]
    assert _rc(fake_hass)["floor_plan_bg"] == want     # the open panel sees it at once


async def test_remove_image_and_alignment(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    prior = {"1f": IMG_1F, "2f": IMG_2F, "_align": {"1f": ALIGN_1F, "2f": ALIGN_2F}}
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime=prior)
    conn = _Conn()
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 2, "floor": "1f", "image": None, "align": None})
    assert conn.result == (2, {"floor": "1f", "bytes": 0, "align": None})
    assert persisted[-1] == {"floor_plan_bg": {"2f": IMG_2F, "_align": {"2f": ALIGN_2F}}}
    # "" removes as well
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 3, "floor": "2f", "image": ""})
    assert persisted[-1] == {"floor_plan_bg": {"_align": {"2f": ALIGN_2F}}}


async def test_align_only_leaves_every_image_alone(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    prior = {"1f": IMG_1F, "2f": IMG_2F}
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime=prior)
    conn = _Conn()
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 4, "floor": "1f", "align": {"x": 1, "y": 2, "w": 300}})
    assert conn.result == (4, {"floor": "1f", "bytes": len(IMG_1F), "align": ALIGN_1F})
    assert persisted == [{"floor_plan_bg": {"1f": IMG_1F, "2f": IMG_2F, "_align": {"1f": ALIGN_1F}}}]


async def test_reads_runtime_config_before_config_json(fake_hass, monkeypatch):
    # runtime_config holds the live value (another write this session); the
    # stale config.json copy must not resurrect a removed floor
    websocket = _load_websocket_module()
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime={"1f": IMG_1F},
                               stored={"1f": IMG_1F, "2f": IMG_2F})
    conn = _Conn()
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 5, "floor": "bsmt", "image": IMG_NEW})
    assert persisted == [{"floor_plan_bg": {"1f": IMG_1F, "bsmt": IMG_NEW}}]


async def test_falls_back_to_config_json_and_json_text(fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    _entry, persisted = _setup(fake_hass, monkeypatch, stored='{"2f": "%s"}' % IMG_2F)
    conn = _Conn()
    await websocket.ws_set_floor_background(
        fake_hass, conn, {"id": 6, "floor": "1f", "image": IMG_1F})
    assert persisted == [{"floor_plan_bg": {"2f": IMG_2F, "1f": IMG_1F}}]
    assert _rc(fake_hass)["floor_plan_bg"] == {"2f": IMG_2F, "1f": IMG_1F}


async def test_sequential_floors_build_on_each_other(fake_hass, monkeypatch):
    # a multi-floor plan import sends one message per floor
    websocket = _load_websocket_module()
    _entry, persisted = _setup(fake_hass, monkeypatch)
    conn = _Conn()
    await websocket.ws_set_floor_background(fake_hass, conn, {"id": 7, "floor": "1f", "image": IMG_1F, "align": ALIGN_1F})
    await websocket.ws_set_floor_background(fake_hass, conn, {"id": 8, "floor": "2f", "image": IMG_2F})
    assert persisted[-1] == {"floor_plan_bg": {"1f": IMG_1F, "2f": IMG_2F, "_align": {"1f": ALIGN_1F}}}


@pytest.mark.parametrize("msg,match", [
    ({"floor": "_align", "image": IMG_1F}, "not a floor key"),
    ({"floor": "../etc", "image": IMG_1F}, "not a floor key"),
    ({"floor": "1f", "image": "https://evil.example/x.png"}, "data:image"),
    ({"floor": "1f", "align": {"x": 0, "y": 0, "w": 0}}, "greater than 0"),
    ({"floor": "1f"}, "nothing to change"),
])
async def test_bad_input_is_invalid_format_and_writes_nothing(fake_hass, monkeypatch, msg, match):
    websocket = _load_websocket_module()
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime={"1f": IMG_1F})
    conn = _Conn()
    await websocket.ws_set_floor_background(fake_hass, conn, {"id": 9, **msg})
    assert conn.result is None
    assert conn.error[:2] == (9, "invalid_format")
    assert match in conn.error[2]
    assert persisted == []
    assert _rc(fake_hass)["floor_plan_bg"] == {"1f": IMG_1F}


async def test_unexpected_failure_is_update_failed(fp, fake_hass, monkeypatch):
    websocket = _load_websocket_module()
    _setup(fake_hass, monkeypatch)

    async def _boom(*a, **k):
        raise RuntimeError("disk full")
    monkeypatch.setattr(fp, "async_set_floor_background", _boom)
    conn = _Conn()
    await websocket.ws_set_floor_background(fake_hass, conn, {"id": 10, "floor": "1f", "image": IMG_1F})
    assert conn.error == (10, "update_failed", "disk full")


# ── the vacuum-map import shares the per-floor write ──────────────────────────

async def test_import_to_floor_merges_through_the_same_path(fp, fake_hass, monkeypatch):
    prior = {"2f": IMG_2F, "_align": {"1f": ALIGN_1F}}
    _entry, persisted = _setup(fake_hass, monkeypatch, runtime=prior)

    async def _fetch(hass, entity_id):
        return b"\x89PNG" + b"m" * 2000, "image/png"
    monkeypatch.setattr(fp, "_fetch_image_bytes", _fetch)
    res = await fp.async_import_to_floor(fake_hass, "image.cleaner_map", "1f")
    assert res == {"floor": "1f", "entity_id": "image.cleaner_map", "bytes": 2004}
    saved = persisted[-1]["floor_plan_bg"]
    assert saved["1f"].startswith("data:image/png;base64,")
    assert saved["2f"] == IMG_2F and saved["_align"] == {"1f": ALIGN_1F}   # kept
    assert _rc(fake_hass)["floor_plan_bg"] == saved
    with pytest.raises(ValueError, match="not a floor key"):
        await fp.async_import_to_floor(fake_hass, "image.cleaner_map", "_align")
