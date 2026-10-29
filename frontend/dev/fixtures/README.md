# Mock WebSocket fixtures

`dev/mock-hass.ts` (harness) and `scripts/smoke.mjs` (CI) route `hass.callWS`
by message type:

| type                      | file                                   |
| ------------------------- | -------------------------------------- |
| `jarvis/get_panel_data`   | `panel_data.json`                      |
| `jarvis/config_schema`    | `config_schema.json`                   |
| `auth/sign_path`          | synthetic: `{path: path + "?authSig=mock"}` |
| anything else             | `<type with "/" -> "_">.json` if present, else `{}` |

So `jarvis/get_activity_log` reads `jarvis_get_activity_log.json`. View agents
add fixtures for the commands their view calls; keep them realistic (copy the
shape the handler passes to `connection.send_result` in websocket.py).
Mutating commands (update_config, suggestion_action ...) return `{}` by
default; the harness logs every call in its console pane. Two set-style
commands are echoed by `mock-hass.ts` instead, so the harness shows what was
asked for: `jarvis/mode {action: "set", mode}` answers `jarvis_mode.json`
merged with `{ok: true, mode, active: mode}` (the real handler returns
`{**set_mode_result, **mode_info()}`), and `jarvis/set_lockdown {on}` answers
`{ok: true, lockdown: {active: on, ...}}`. The smoke test (`scripts/smoke.mjs`)
has its own, fixture-only router and does not echo.

`config_schema.json` is generated, not hand-written: it is the real
`config_apply.build_schema` catalogue (every panel-writable key, values =
defaults). Regenerate it after changing the catalogue with
`python frontend/scripts/config-schema-fixture.py` from the repo root, using a
Python that has Home Assistant installed.

The fixtures are static, so in the harness a saved value snaps back on the
next refetch (the backend would return the new value); that is a mock
limitation, not a view bug.
