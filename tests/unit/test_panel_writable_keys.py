"""Every config key the panel tries to save must be accepted by the backend.

This guards the bug class where the panel calls jarvis/update_config with a key
that isn't in PANEL_WRITABLE_KEYS, so the write is rejected with `invalid_key`
and the user sees a save failure (e.g. the Residence tab's HOME STYLE control).

Both sides are parsed statically from source — websocket.py can't be imported
(heavy HA module-level imports), and the panel is TypeScript under
frontend/src (fork Phase 2). The generic Settings view writes whatever
`jarvis/config_schema` lists — parity of that catalogue with
PANEL_WRITABLE_KEYS is pinned in test_config_schema_ws.py — so here we check
the keys the OTHER views name by hand (overview, residence, intrusion).
"""
import ast
import re
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_COMPONENT = _ROOT / "custom_components" / "jarvis"
_WEBSOCKET = _COMPONENT / "websocket.py"
_CONFIG_APPLY = _COMPONENT / "config_apply.py"
_FRONTEND_SRC = _ROOT / "frontend" / "src"
_SETTINGS_VIEW = _FRONTEND_SRC / "views" / "settings.ts"
_SETTINGS_PRESENTATION = _FRONTEND_SRC / "views" / "settings" / "presentation.ts"
_INTRUSION_SETTINGS = _FRONTEND_SRC / "views" / "intrusion" / "settings.ts"


def _frontend_sources() -> str:
    files = sorted(_FRONTEND_SRC.rglob("*.ts"))
    assert files, f"no panel sources under {_FRONTEND_SRC}"
    return "\n".join(p.read_text(encoding="utf-8") for p in files)


def _catalogue() -> dict[str, str]:
    """{key: kind} for every FieldSpec in config_apply._FIELDS. The Settings
    view renders one control per catalogue field (a switch for bool), so a key
    in the catalogue IS a panel control."""
    kinds = {"_b": "bool", "_i": "int", "_f": "float", "_e": "enum",
             "_s": "str", "_l": "list", "_j": "json"}
    found = re.findall(r'^\s*(_[bifeslj])\(\s*"([a-z0-9_]+)"',
                       _CONFIG_APPLY.read_text(), re.M)
    assert found, "FieldSpec catalogue not found in config_apply.py"
    return {key: kinds[helper] for helper, key in found}


def _allowlist() -> set[str]:
    """The PANEL_WRITABLE_KEYS set, read from websocket.py via AST."""
    tree = ast.parse(_WEBSOCKET.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Set):
            for tgt in node.targets:
                if isinstance(tgt, ast.Name) and tgt.id == "PANEL_WRITABLE_KEYS":
                    return {e.value for e in node.value.elts
                            if isinstance(e, ast.Constant)}
    raise AssertionError("PANEL_WRITABLE_KEYS set not found in websocket.py")


def _panel_saved_keys() -> set[str]:
    """Every literal key a view writes through jarvis/update_config:
    `"jarvis/update_config", { key: "k", … }` call sites, plus the keys the
    intrusion settings card passes through its typed key union."""
    js = _frontend_sources()
    keys = set(re.findall(
        r"""jarvis/update_config["']\s*,\s*\{\s*key:\s*["']([a-z0-9_]+)["']""", js))
    union = re.search(r"type IntrusionSettingKey\s*=([^;]*);",
                      _INTRUSION_SETTINGS.read_text(encoding="utf-8"))
    assert union, "IntrusionSettingKey union not found"
    keys |= set(re.findall(r"""["']([a-z0-9_]+)["']""", union.group(1)))
    return keys


def test_panel_writable_keys_set_exists():
    assert len(_allowlist()) > 0


def test_every_panel_saved_key_is_writable():
    allow = _allowlist()
    saved = _panel_saved_keys()
    assert saved, "expected to find keys the panel saves"
    missing = sorted(k for k in saved if k not in allow)
    assert not missing, (
        "panel saves config keys the backend rejects as not-writable "
        f"(jarvis/update_config -> invalid_key): {missing}"
    )


def test_residence_keys_specifically_writable():
    # The exact keys behind the Residence-tab save failure — pinned so this can't
    # regress silently.
    allow = _allowlist()
    for key in ("residence_style", "floor_plan_sqft", "home_stories",
                "has_basement", "dormers_front", "dormers_rear",
                "garage_bays", "chimney_side"):
        assert key in allow, f"{key} missing from PANEL_WRITABLE_KEYS"


def _panel_data_config_keys() -> set[str]:
    """Keys surfaced in ws_get_panel_data's `config` dict, read from the
    "key": _runtime_opt(...) / "key": _get_... lines via regex. This is what the
    panel reads back as d.config.KEY."""
    js = _WEBSOCKET.read_text()
    # crude but effective: any '"key":' inside the config block
    m = re.search(r'"config":\s*\{(.*?)\n            \},', js, re.DOTALL)
    if not m:
        return set()
    return set(re.findall(r'"([a-z0-9_]+)":', m.group(1)))


def _panel_read_cfg_keys() -> set[str]:
    """Config keys a view reads back from the snapshot (`data.config.KEY`,
    `cfg.KEY`, `this._config.KEY`, `this._cfg("KEY")`) — a control that saves
    AND is expected to reflect its saved value on the next snapshot."""
    js = _frontend_sources()
    keys = set(re.findall(r"\b(?:cfg|_config|config)\??\.([a-z][a-z0-9_]*)", js))
    keys |= set(re.findall(r"""_cfg\(\s*["']([a-z0-9_]+)["']""", js))
    return keys


def test_character_and_research_keys_surfaced_in_panel_data():
    """Regression: banter_level, search_backend, searxng_url,
    calendar_tight_gap_min, and recognition_source were SAVED but not returned
    by get_panel_data, so their selects snapped back to defaults on re-render.
    Pin them so this can't regress."""
    surfaced = _panel_data_config_keys()
    for key in ("banter_level", "search_backend", "searxng_url",
                "calendar_tight_gap_min", "recognition_source"):
        assert key in surfaced, (
            f"{key} is missing from ws_get_panel_data's config block — the panel "
            f"select will reset to its default on every re-render")


def test_read_back_cfg_fields_are_surfaced():
    """Every cfg-field the panel reads via d.config?.KEY must be surfaced in the
    panel-data config block, or its control silently resets after saving. Guards
    the whole bug class, not just the known keys."""
    read = _panel_read_cfg_keys()
    surfaced = _panel_data_config_keys()
    # only enforce for keys that are ALSO saved as cfg-fields (round-trip fields)
    saved = _panel_saved_keys()
    round_trip = read & saved
    missing = sorted(k for k in round_trip if k not in surfaced)
    assert not missing, (
        "these config keys are saved + read-back by the panel but not surfaced "
        f"in get_panel_data, so they reset on re-render: {missing}")


def test_onboarding_state_wired_into_panel_data():
    # the first-run onboarding block must be present in get_panel_data (v6.70.0)
    js = _WEBSOCKET.read_text()
    assert '"onboarding": _get_onboarding_state(' in js
    assert "def _get_onboarding_state(" in js


def test_onboarding_dismissed_is_writable():
    # the dismiss button persists onboarding_dismissed via update_config
    assert "onboarding_dismissed" in _allowlist()


def test_onboarding_steps_cover_key_setup():
    # the checklist should name the high-value post-install steps
    js = _WEBSOCKET.read_text()
    for step_id in ('"notify"', '"cameras"', '"voice"', '"banter"'):
        assert step_id in js, f"onboarding missing step {step_id}"


# ── v7.96.0 Sub-Agents & Automation toggles ──────────────────────────────────

_V796_KEYS = ("friday_automator", "proximity_volume", "host_telemetry")


def test_v796_agent_keys_are_writable():
    allow = _allowlist()
    for key in _V796_KEYS:
        assert key in allow, f"{key} missing from PANEL_WRITABLE_KEYS"


def test_v796_agent_keys_have_panel_toggles():
    # The Settings view renders a switch for every bool field in the catalogue.
    catalogue = _catalogue()
    for key in _V796_KEYS:
        assert catalogue.get(key) == "bool", f"panel has no toggle for {key}"


def test_v796_keys_in_panel_config_payload_with_defaults():
    # Each key must be echoed back in get_panel_data's config dict with the right
    # default, or its toggle can't reflect a saved value on re-render. FRIDAY is
    # off by default; proximity and host telemetry are on.
    js = _WEBSOCKET.read_text()
    assert 'bool(_runtime_opt(hass, entry, "friday_automator", False))' in js
    assert 'bool(_runtime_opt(hass, entry, "proximity_volume", True))' in js
    assert 'bool(_runtime_opt(hass, entry, "host_telemetry", True))' in js


def test_friday_toggle_is_confirmation_gated():
    # Enabling an actuating sub-agent from the panel must require an explicit
    # confirm — the key is in the Settings view's CONFIRM_ON_ENABLE map and the
    # save path opens confirmDialog() before writing a bool that turns ON.
    presentation = _SETTINGS_PRESENTATION.read_text(encoding="utf-8")
    block = re.search(r"CONFIRM_ON_ENABLE[^=]*=\s*\{(.*?)\n\};", presentation, re.S)
    assert block, "CONFIRM_ON_ENABLE map not found in settings/presentation.ts"
    assert re.search(r"^\s*friday_automator\s*:", block.group(1), re.M), \
        "friday_automator must be confirmation-gated"
    view = _SETTINGS_VIEW.read_text(encoding="utf-8")
    assert "CONFIRM_ON_ENABLE[key]" in view
    assert "confirmDialog(" in view
