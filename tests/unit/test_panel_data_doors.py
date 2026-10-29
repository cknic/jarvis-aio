"""Guard: door states reach the Residence model unfiltered.

The old panel rebuilt a whitelist object in _data() and once dropped `doors`,
so no door ever rendered open (the bug present through v6.31.0). The Lit panel
(fork Phase 2) hands the jarvis/get_panel_data snapshot to every view as-is,
so the guard is now three static checks: the backend snapshot carries
`doors`, the shell stores the WebSocket result without rebuilding it, and the
shared PanelData type declares the field."""
import re
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_PANEL_DATA = _ROOT / "custom_components" / "jarvis" / "panel_data.py"
_SHELL = _ROOT / "frontend" / "src" / "panel.ts"
_TYPES = _ROOT / "frontend" / "src" / "types.ts"


def test_snapshot_carries_doors():
    py = _PANEL_DATA.read_text()
    assert re.search(r'"doors":\s*_h\("_get_door_states"\)\(hass\)', py), (
        "build_snapshot must include doors from _get_door_states")
    assert "def _get_door_states(" in py


def test_shell_passes_snapshot_through():
    ts = _SHELL.read_text(encoding="utf-8")
    m = re.search(
        r'const data = await ws<PanelData>\(this\.hass, "jarvis/get_panel_data"\);\s*'
        r'this\._data = data;', ts)
    assert m, "the shell must store the snapshot exactly as received (no whitelist rebuild)"
    assert re.search(r"\.data=\$\{this\._data\}", ts), "views must receive the whole snapshot"
    assert not re.search(r"this\._data\s*=\s*\{", ts), "no hand-built snapshot object in the shell"


def test_panel_data_type_declares_doors():
    assert re.search(r"^\s*doors\?:", _TYPES.read_text(encoding="utf-8"), re.M)
