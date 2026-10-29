"""Frontend <-> WebSocket command contract — v7.45.0, re-pointed at the Lit
panel sources in fork Phase 2.

The panel talks to the backend over a set of `jarvis/*` WebSocket commands. A
backend refactor that renames or drops a command, or forgets to register a
handler, would break the dashboard silently. These tests pin the contract by
static analysis (no Home Assistant / voluptuous needed):

  * every command the panel SENDS is registered and reachable in the backend,
  * every WS handler that declares a command type is actually registered,
  * the committed bundle carries every command the sources send (a stale
    build would otherwise pass here and fail in the browser),
  * the extraction itself found commands on both sides (guards vacuous passes).

The panel is TypeScript under frontend/src (built into
custom_components/jarvis/frontend/jarvis-panel.js); `ws(hass, "jarvis/…")`
spreads the type into the message, so every "jarvis/…" string literal in the
sources is a command the panel can send.
"""
from __future__ import annotations

import ast
import pathlib
import re

_ROOT = pathlib.Path(__file__).resolve().parents[2]
_COMP = _ROOT / "custom_components" / "jarvis"
_WS_PY = _COMP / "websocket.py"
_PANEL_JS = _COMP / "frontend" / "jarvis-panel.js"
_FRONTEND_SRC = _ROOT / "frontend" / "src"

_COMMAND_RE = re.compile(r"""["'](jarvis/[a-z_]+)["']""")


def _type_from_decorator(dec: ast.AST):
    """Pull the "jarvis/…" type out of a @websocket_command({...type...: "…"})
    decorator, or None if this decorator isn't one."""
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


def _backend():
    """Return (func_to_type, registered_funcs, registered_types)."""
    src = _WS_PY.read_text()
    tree = ast.parse(src)
    func_to_type: dict[str, str] = {}
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for dec in node.decorator_list:
                t = _type_from_decorator(dec)
                if t:
                    func_to_type[node.name] = t
    registered_funcs = set(
        re.findall(r"async_register_command\(\s*hass\s*,\s*([A-Za-z_]\w*)", src))
    registered_types = {t for f, t in func_to_type.items() if f in registered_funcs}
    return func_to_type, registered_funcs, registered_types


def _frontend_sources() -> str:
    files = sorted(_FRONTEND_SRC.rglob("*.ts"))
    assert files, f"no panel sources under {_FRONTEND_SRC}"
    return "\n".join(p.read_text(encoding="utf-8") for p in files)


def _frontend() -> set:
    """The jarvis/* command types the panel sources can SEND."""
    return set(_COMMAND_RE.findall(_frontend_sources()))


def test_every_panel_command_is_registered():
    _, _, registered_types = _backend()
    missing = _frontend() - registered_types
    assert not missing, (
        "panel sends WS commands the backend doesn't register (would break the "
        f"dashboard): {sorted(missing)}")


def test_no_declared_handler_left_unregistered():
    func_to_type, registered_funcs, _ = _backend()
    orphans = {t for f, t in func_to_type.items() if f not in registered_funcs}
    assert not orphans, (
        "WS handlers declare a command type but are never async_register_command'd: "
        f"{sorted(orphans)}")


def test_built_bundle_carries_every_source_command():
    # The committed bundle is what HACS ships. Every command the sources send
    # must survive into it — a bundle built from older sources would not have
    # the newest commands.
    bundle = set(_COMMAND_RE.findall(_PANEL_JS.read_text(encoding="utf-8")))
    missing = _frontend() - bundle
    assert not missing, (
        "custom_components/jarvis/frontend/jarvis-panel.js is stale: rebuild "
        f"with `cd frontend && npm run build` (missing {sorted(missing)})")


def test_extraction_found_commands_on_both_sides():
    # If a regex/AST change silently extracts nothing, the parity checks above
    # would pass vacuously — this guards against that.
    _, _, registered_types = _backend()
    frontend = _frontend()
    assert len(registered_types) >= 20, f"backend extraction looks wrong: {len(registered_types)}"
    assert len(frontend) >= 20, f"frontend extraction looks wrong: {len(frontend)}"
