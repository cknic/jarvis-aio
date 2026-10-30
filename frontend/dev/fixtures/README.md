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
shape the handler passes to `connection.send_result` in websocket.py). The
smoke test enforces the set: every `jarvis/…` / `config/…` command literal in
`src/**/*.ts` needs its file here, every file here must answer a command the
sources send, and every call made during the smoke run must hit a file. A
command with several `action`s gets ONE file, so make it a union that renders
sensibly for every action (see `jarvis_documents.json`).

Who uses what (besides `panel_data.json` / `config_schema.json`):

| view / tool | fixtures |
| --- | --- |
| Overview | `jarvis_mode`, `jarvis_area_lights`, `jarvis_set_lockdown` |
| Intrusion | `jarvis_intrusion` |
| Cameras | `jarvis_camera_snapshot`, `jarvis_camera_diagnostics`, `jarvis_rename_camera`, `jarvis_camera_location` |
| People | `jarvis_faces`, `jarvis_face_reference`, `jarvis_voices`, `jarvis_biometrics`, `jarvis_camera_snapshot` |
| Suggestions | `jarvis_suggestion_action`, `jarvis_goal_action`, `jarvis_get_cognitive_status`, `jarvis_run_analysis` |
| Memory | `jarvis_get_knowledge`, `jarvis_add_knowledge`, `jarvis_forget_knowledge`, `jarvis_get_person_routines`, `jarvis_briefings` |
| Documents | `jarvis_documents`, `jarvis_semantic_search`, `jarvis_search_memory` |
| Residence | `jarvis_mmwave_overview` |
| Floor-plan editor | `jarvis_floorplan_sources`, `jarvis_import_floorplan`, `jarvis_segment_floorplan_rooms`, `jarvis_set_floor_background`, `jarvis_compute_camera_coverage` (the plan itself is `panel_data.json` → `config.floor_plan_*`, `door_mapping`) |
| Logs | `jarvis_get_debug_log`, `jarvis_get_activity_log`, `jarvis_diagnostics`, `jarvis_get_calibration`, `jarvis_get_cognitive_status`, `jarvis_get_enforcement` |
| Settings + tools (`jarvis_update_config` is every view's write) | `jarvis_update_config`, `jarvis_reload_appliances`, `jarvis_list_models`, `jarvis_energy`, `jarvis_hazard`, `jarvis_mutes`, `jarvis_voice_confirm_test`, `jarvis_get_enforcement`, `jarvis_set_enforcement` |
| `jv-picker` | `config_area_registry_list`, `config_label_registry_list`, `config_device_registry_list` |

Mutating commands (update_config, suggestion_action ...) return `{}` by
default; the harness logs every call in its console pane. Three set-style
commands are echoed by `mock-hass.ts` instead, so the harness shows what was
asked for: `jarvis/mode {action: "set", mode}` answers `jarvis_mode.json`
merged with `{ok: true, mode, active: mode}` (the real handler returns
`{**set_mode_result, **mode_info()}`), `jarvis/set_lockdown {on}` answers
`{ok: true, lockdown: {active: on, ...}}`, and `jarvis/set_floor_background
{floor, image?, align?}` answers `{floor, bytes, align}` for the floor it was
sent (`jarvis_set_floor_background.json` fills in what the message left out).
The smoke test (`scripts/smoke.mjs`)
has its own, fixture-only router and does not echo.

`config_schema.json` is generated, not hand-written: it is the real
`config_apply.build_schema` catalogue (every panel-writable key, values =
defaults, except the few demo values in the script's `DEMO_VALUES`, which the
model picker, voice-confirm list and appliance editor are exercised against;
add a demo value there, never in the JSON). Regenerate it after changing the
catalogue with
`python frontend/scripts/config-schema-fixture.py` from the repo root, using a
Python that has Home Assistant installed.

The fixtures are static, so in the harness a saved value snaps back on the
next refetch (the backend would return the new value); that is a mock
limitation, not a view bug.
