"""panel_data.build_snapshot — the live half of jarvis/get_panel_data (fork Phase 0).

Pins three things:

* the WS payload is byte-compatible: ``ws_get_panel_data`` sends exactly
  ``{**build_snapshot(...), "config": {...}}`` with the snapshot keys first and
  in the documented order;
* the snapshot's top-level schema and per-area row keys (the contract the
  native-entity platforms build on);
* the legacy monkeypatch seam: a test that patches ``websocket._helper`` still
  steers ``panel_data`` (and a patch on ``panel_data`` alone works too).
"""
from __future__ import annotations

import importlib.util
import pathlib
import sys
import types

import pytest

_COMP = pathlib.Path(__file__).resolve().parents[2] / "custom_components" / "jarvis"

SNAPSHOT_KEYS = [
    "status", "version", "meta", "dominant", "areas", "sleep_reason",
    "doorbell_training", "doors", "lockdown", "intrusion", "knowledge",
    "suggestions", "goals",
]
AREA_ROW_KEYS = [
    "id", "name", "caps", "active", "bedroom", "lights_on", "lights_total",
    "temp", "humidity", "temp_entity", "humidity_entity", "last_motion",
]
STATUS_TILES = ["observer", "sleep", "llm_providers", "broadcast", "notify", "satellites"]


def _load_websocket_module():
    """Same loader test_websocket_provider_config uses (stubbed websocket_api)."""
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


class _Conn:
    def __init__(self):
        self.result = None
        self.error = None
        self.user = types.SimpleNamespace(is_admin=True)

    def send_result(self, msg_id, payload):
        self.result = (msg_id, payload)

    def send_error(self, msg_id, code, message):
        self.error = (msg_id, code, message)


async def _resolved(value):
    return value


def _stub_everything(websocket, monkeypatch, fake_hass, entry):
    """Stub every executor/registry helper on the websocket module, exactly the
    way the pre-refactor panel-data tests did — proving the seam still works."""
    fake_hass.data = {websocket.DOMAIN: {entry.entry_id: {"observer_running": False}}}
    monkeypatch.setattr(websocket, "_get_entry", lambda hass: entry)
    monkeypatch.setattr(websocket, "_entry_opt", lambda entry, key, default=None: {
        websocket.CONF_BEDROOM_AREAS: ["bedroom"],
        websocket.CONF_BROADCAST_GROUP: "media_player.house",
        websocket.CONF_NOTIFY_SERVICE: "notify.mobile_app_phone",
    }.get(key, default))
    runtime = {websocket.CONF_OBSERVER_ENABLED: True, "announcements_enabled": True,
               "sentinel_enabled": False, "honorific": "Tony"}
    monkeypatch.setattr(websocket, "_runtime_opt",
                        lambda hass, entry, key, default=None: runtime.get(key, default))
    monkeypatch.setattr(websocket, "_get_runtime_json", lambda hass, entry, key, default: default)
    monkeypatch.setattr(websocket, "_get_onboarding_state", lambda hass, entry, notify: {"show": False})
    monkeypatch.setattr(websocket, "_get_disabled_rules", lambda hass, entry: [])
    monkeypatch.setattr(websocket, "_available_labels", lambda hass: [])
    monkeypatch.setattr(websocket, "_get_sentinel_rules", lambda: [])
    monkeypatch.setattr(websocket, "_get_door_states", lambda hass: {"front": True})
    monkeypatch.setattr(websocket, "_get_lockdown_status", lambda: {"active": True, "reason": "test"})
    monkeypatch.setattr(websocket, "_get_intrusion_status", lambda: {"active": False})
    monkeypatch.setattr(websocket, "_get_appliance_status", lambda: {"running": False})
    monkeypatch.setattr(websocket, "_get_satellites", lambda hass: [])
    monkeypatch.setattr(websocket, "_get_cast_devices", lambda hass: [])
    monkeypatch.setattr(websocket, "_get_cameras", lambda hass: [])
    monkeypatch.setattr(websocket, "_get_camera_overrides", lambda: {"camera.a": "camera.b"})
    monkeypatch.setattr(websocket, "_get_camera_names", lambda: {"camera.a": "Porch"})
    monkeypatch.setattr(websocket, "_get_announcements_today", lambda: 4)
    monkeypatch.setattr(websocket, "_get_doorbell_training", lambda: {"stats": {"total": 2}, "recent": []})
    monkeypatch.setattr(websocket, "_get_knowledge_stats", lambda: {"total": 3})
    monkeypatch.setattr(websocket, "_get_suggestions", lambda: [{"id": 1}])
    monkeypatch.setattr(websocket, "_get_goals", lambda: [{"id": 2}])
    monkeypatch.setattr(websocket, "_async_get_observer_stats", lambda hass: _resolved({"events_24h": 5}))
    monkeypatch.setattr(websocket, "_get_memory_stats", lambda: {"total_memories": 6})
    monkeypatch.setattr(websocket, "_configured_providers", lambda hass, entry: _resolved(["custom"]))
    monkeypatch.setattr(websocket, "_format_uptime", lambda seconds: "1m 0s")
    monkeypatch.setattr(websocket, "_telemetry_est_cost", lambda: "—")
    monkeypatch.setattr(websocket.sleep_detection, "is_sleeping", lambda *a, **k: (True, "quiet hours"))
    monkeypatch.setattr(websocket, "_all_areas_with_anything", lambda hass: ["living"])
    monkeypatch.setattr(websocket, "_area_capabilities", lambda hass, aid: ["light"])
    monkeypatch.setattr(websocket.audio_routing, "is_area_occupied", lambda hass, aid: True)
    monkeypatch.setattr(websocket, "_area_light_state", lambda hass, aid: (1, 2))
    monkeypatch.setattr(websocket, "_area_live_readings", lambda hass, aid: {
        "temp": "21°C", "humidity": "50%", "last_motion_seconds": 90, "lights": "1/2"})
    monkeypatch.setattr(websocket, "_area_temp_humidity_entities", lambda hass, aid: ("sensor.t", "sensor.h"))
    monkeypatch.setattr(websocket, "_area_name", lambda hass, aid: "Living Room")
    monkeypatch.setattr(websocket, "_dominant_area", lambda hass: "living")
    monkeypatch.setattr(websocket.audio_routing, "satellites_in_area", lambda hass, aid: [])

    class _Services:
        @staticmethod
        def async_services():
            return {"notify": {"mobile_app_phone": None}}
    fake_hass._services = _Services()


async def test_ws_payload_is_snapshot_plus_config(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    panel_data = load("panel_data")
    entry = types.SimpleNamespace(entry_id="panel-entry", data={}, options={})
    _stub_everything(websocket, monkeypatch, fake_hass, entry)

    conn = _Conn()
    await websocket.ws_get_panel_data(fake_hass, conn, {"id": 21})
    assert conn.error is None
    payload = conn.result[1]

    snapshot = await panel_data.build_snapshot(fake_hass, entry)

    # byte-compatible wire shape: snapshot keys first and in order, then config
    assert list(payload.keys()) == SNAPSHOT_KEYS + ["config"]
    assert payload == {**snapshot, "config": payload["config"]}
    assert "config" not in snapshot and "onboarding" not in snapshot
    assert "onboarding" in payload["config"]
    # the config block still reuses the snapshot's intermediate values
    assert payload["config"]["configured_providers"] == ["custom"]
    assert payload["config"]["observer_stats"] == {"events_24h": 5}
    assert payload["config"]["memory_stats"] == {"total_memories": 6}
    assert payload["config"]["camera_overrides"] == {"camera.a": "camera.b"}
    assert payload["config"]["camera_names"] == {"camera.a": "Porch"}
    assert payload["config"]["honorific"] == "Tony"
    assert payload["config"]["notify_services_available"] == ["notify.mobile_app_phone"]


async def test_snapshot_schema_and_area_rows(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    panel_data = load("panel_data")
    entry = types.SimpleNamespace(entry_id="panel-entry", data={}, options={})
    _stub_everything(websocket, monkeypatch, fake_hass, entry)

    snapshot, ctx = await panel_data.build_snapshot_with_context(fake_hass, entry)
    assert list(snapshot.keys()) == SNAPSHOT_KEYS
    assert list(snapshot["status"].keys()) == STATUS_TILES
    for tile in snapshot["status"].values():
        assert set(tile) == {"state", "level"} and tile["level"] in ("live", "warn", "off")
    assert snapshot["status"]["observer"] == {"state": "READY", "level": "warn"}
    assert snapshot["status"]["sleep"] == {"state": "ASLEEP", "level": "warn"}
    assert snapshot["sleep_reason"] == "quiet hours"
    assert snapshot["lockdown"] == {"active": True, "reason": "test"}
    assert snapshot["doors"] == {"front": True}
    assert set(snapshot["meta"]) == {"bedrooms", "areas_monitored", "announcements_today", "est_cost", "uptime"}
    assert snapshot["meta"]["uptime"] == "1m 0s"

    rows = panel_data.area_rows(snapshot)
    assert len(rows) == 1 and list(rows[0].keys()) == AREA_ROW_KEYS
    assert rows[0]["lights_on"] == 1 and rows[0]["lights_total"] == 2
    assert rows[0]["last_motion"] == "1m"
    assert panel_data.status_tiles(snapshot) == snapshot["status"]
    assert panel_data.area_rows({}) == [] and panel_data.status_tiles(None) == {}

    assert set(ctx) >= {"bedroom_areas", "quiet_start", "quiet_end", "broadcast_group",
                        "observer_enabled_cfg", "configured_providers", "observer_stats",
                        "memory_stats", "camera_overrides", "camera_names"}
    assert ctx["bedroom_areas"] == ["bedroom"]


def test_hook_namespace_honours_patches_on_either_module(fake_hass, monkeypatch, load):
    websocket = _load_websocket_module()
    panel_data = load("panel_data")
    assert panel_data._HOOKS is websocket

    # patch on websocket (the legacy seam) steers panel_data internals
    monkeypatch.setattr(websocket, "_area_name", lambda hass, aid: "Back Yard")
    assert panel_data._is_outdoor_area(fake_hass, "x") is True
    assert websocket._is_outdoor_area(fake_hass, "x") is True

    # patch on panel_data alone (websocket's re-export is still the original)
    monkeypatch.undo()
    websocket = _load_websocket_module()
    monkeypatch.setattr(panel_data, "_area_name", lambda hass, aid: "Pool House")
    assert websocket._area_name is panel_data._ORIGINALS["_area_name"]
    assert panel_data._is_outdoor_area(fake_hass, "x") is True

    # no hooks registered: plain module-local resolution
    monkeypatch.setattr(panel_data, "_HOOKS", None)
    assert panel_data._h("_area_name") is panel_data._area_name


def test_websocket_reexports_every_hookable_name(load):
    websocket = _load_websocket_module()
    panel_data = load("panel_data")
    for name in panel_data.HOOKABLE:
        assert hasattr(websocket, name), f"websocket.{name} no longer resolvable"
    assert hasattr(websocket, "_STARTUP_TS") and hasattr(websocket, "_INTEGRATION_VERSION")
    assert websocket._INTEGRATION_VERSION == panel_data._INTEGRATION_VERSION != "?"


def test_panel_data_imports_without_websocket(load):
    """panel_data must never depend on websocket (the unit harness stubs
    jc.websocket to a bare module; the dependency runs websocket → panel_data)."""
    src = (_COMP / "panel_data.py").read_text()
    assert "from .websocket" not in src and "import websocket" not in src
    panel_data = load("panel_data")
    assert callable(panel_data.build_snapshot)


@pytest.mark.parametrize("name", ["build_snapshot", "build_snapshot_with_context",
                                  "area_rows", "status_tiles", "register_hook_namespace"])
def test_public_surface(load, name):
    assert callable(getattr(load("panel_data"), name))
