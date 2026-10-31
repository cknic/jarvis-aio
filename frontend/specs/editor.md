# Floor-plan editor — specification

Derived from the OLD panel's Settings › Floor Plan editor (`git show 47bede5:custom_components/jarvis/frontend/jarvis-panel.js`:
`_renderFloorPlanEditor` L3947, `_renderEditableSVG` L4261, `_renderOpenings` L4225, `_renderCameras` L4103,
`_renderPlanEntities` L4134, `_renderDoorMapping` L3880, `_doorSlots` L3780, `_doorEntityOptions` L3854,
coverage geometry L3206–3340, plan/element/camera/entity getters L3028–3135, 3D preview L3477–3500,
control wiring `_wireFloorPlanControls` L6998–7395, pointer wiring `_wireFloorPlanDrag` L7405–7760) and from the
backend (`websocket.py` handlers `ws_update_config`, `ws_compute_camera_coverage`, `ws_floorplan_sources`,
`ws_import_floorplan`, `ws_set_floor_background`, `ws_segment_floorplan_rooms`;
`floorplan_import.py`, `floorplan_segment.py`, `camera_coverage.py`, `config_apply.py` catalogue,
`door_state.py`, `residence_graph.py`, `camera.py::_parse_coverage_rooms`;
`scripts/sweethome3d_to_floorplan.py`). The builder does **not** need to open the old panel: every contract,
algorithm and string it needs is here. Where this spec and the old code differ, this spec wins.

Route: **`/jarvis/residence/editor[/<tab>]`** — a sub-path of the Residence view (`route.path` starts
`/residence/editor`; `subPath` is `editor` or `editor/<tab>` with `<tab>` one of `rooms`, `openings`, `doors`,
`pins`, `import`; no tail or an unknown tail = `rooms`). Admin-only like the whole panel (every command below
is `@websocket_api.require_admin`).

Files the editor owns: `frontend/src/views/residence/editor/**` (layout below; its `README.md` is the
foundation API the tabs are written against) and the fixtures `frontend/dev/fixtures/jarvis_floorplan_sources.json`,
`jarvis_import_floorplan.json`, `jarvis_segment_floorplan_rooms.json`, `jarvis_set_floor_background.json`,
`jarvis_compute_camera_coverage.json`. Two **minimal** edits to shared files (see §10 R1): (a)
`src/views/residence.ts` imports `./residence/editor/editor` and renders
`<jarvis-plan-editor .hass .narrow .data .route>` in place of its normal content when
`this.subPath.split("/")[0] === "editor"`, and its "Import a floor plan" docs link became an "Edit floor plan"
button that calls `this.navigate("residence", "editor")`; (b) `dev/fixtures/panel_data.json` carries a
realistic `config.floor_plan_*` / `door_mapping` block (§2.10) so the harness shows a plan.

```
src/views/residence/editor/
  editor.ts        <jarvis-plan-editor> (extends JarvisView): header, banners, Plan card + sub-tab chips,
                   side card hosting the active tab element, 3D preview, toasts, shortcuts, leave guards
  store.ts         EditorStore: working copy, history, dirty/save, writeSetting, writeFloorBackground,
                   floor/tab/selection, toasts; EDITOR_TABS; the only module that talks to the backend
  model.ts         EditorDoc types, parse*/serialize*, floor list, units, ids, pickers, doc operations (§3)
  history.ts       History<T>: snapshot undo/redo with coalescing (§4.3)
  canvas.ts        <jv-plan-canvas>: Layer API (registerLayer), built-in grid/background/ghost/rooms/overlay
                   layers, Pointer Events controller (§4.1–4.2, 4.4–4.6)
  geometry.ts      markerRect, walls+gaps, ray casting, clipped cone, coverage sampling, coverageContext (§4.7)
  tab-base.ts      JarvisEditorTab: optional base class of the tab elements
  selftest.ts      dev-only model assertions (parse/serialize round trip, units, geometry), run by the smoke test
  i18n-keys.ts     literal t() calls for label tables (read by npm run i18n:keys; not bundled)
  tabs/index.ts    the barrel: one import per tab
  tabs/rooms.ts (+ rooms-layers.ts, rooms-controls.ts, rooms-dialog.ts, rooms-menu.ts)   <jarvis-editor-rooms>
  tabs/openings.ts  <jarvis-editor-openings>     tabs/doors.ts  <jarvis-editor-doors>
  tabs/pins.ts      <jarvis-editor-pins> (cameras + pins)   tabs/openings-doors-pins-shared.ts
  tabs/import.ts (+ import-layers.ts, import-image.ts, import-plan.ts, import-sh3d.ts, import-zip.ts)
                    <jarvis-editor-import> (§6 I-actions; background alignment layer + tool)
```

It reuses, unchanged: `../plan.ts` (`parsePlan`, `parseElements`, `planToFeet`, `elementsToFeet`,
`garageBays`, `houseSpec`, `styleOf`, `STYLES`, `DEFAULT_PLAN`, `num`, `FloorPlan`, `EditorRoom`,
`EditorElement`), `../house3d.ts` (`renderSVG`, `fixedBox`, `Pt2`) and `../palette.ts`
(`buildPalette`, `paletteKey`) for the live 3D preview. **Do not fork those modules**; if a type there is
too loose, narrow it locally in `model.ts` with a type guard.

---

## 1. Purpose

Let an admin draw and maintain the home's floor plan — the data behind the Residence 3D model, the
intrusion investigator's room adjacency (`residence_graph.py`), the camera coverage hints the vision
model receives (`camera.py`), and the door slots of the model (`door_state.py`) — without hand-editing JSON:

* **Rooms** per floor (`1f`, `2f`, `bsmt`): rectangles and polygons, dragged, resized, reshaped, named to
  match Home Assistant areas (that name match is what lights a room from occupancy), typed (room, bath,
  stairs, door, outdoor zone), with real dimensions in feet or metres.
* **Openings**: windows, doors (exterior, interior, balcony/french, cellar, cased), dormers — placed on an
  outer wall or a room's wall, optionally bound to an open/closed sensor.
* **Doors**: the fixed door slots of the 3D model mapped to entities (front, garage bays, garage side,
  kitchen↔garage, cellar, basement).
* **Cameras & pins**: cameras placed with aim, field of view and range, their line-of-sight cone clipped by
  walls (bleeding through openings), AI-judged coverage; arbitrary entities pinned on the plan with live
  state.
* **Import**: background image per floor (file upload, or straight from a vacuum-map / dashboard `image.*`
  / `camera.*` entity) with opacity and a per-floor **alignment** (top-left corner + width in plan units,
  typed or dragged/scaled on the plan); automatic room detection from a vacuum map; SweetHome3D
  (`.sh3d` / `Home.xml` / JSON export) conversion; JSON export/import of the whole plan; property
  boundary; reset to the sample plan.
* **House shape** keys that drive the 3D massing (stories, basement, dormers, garage bays, chimney,
  bedrooms/bathrooms, square footage, style) and the units toggle.

Everything is edited on a working copy with undo/redo and saved explicitly (one `jarvis/update_config` per
changed key); a handful of independent settings save immediately (units, opacity, door mapping, house-shape
keys through `jarvis/update_config`; a floor's background image and alignment through
`jarvis/set_floor_background`, one floor per message). Pointer Events throughout (mouse, touch, pen);
keyboard-operable; follows the HA theme (tokens only, see DESIGN.md).

---

## 2. Data

All commands go through `this.ws(type, payload)` (`JarvisView.ws` → `src/ws.ts`). A rejected call is a
`WsError {code, message, command}` built from HA's `{code, message}` error frame
(`connection.send_error(id, code, message)`). Show `err.message` in alerts/toasts.

### 2.1 `jarvis/get_panel_data` — the snapshot (`this.data`, shared, refreshed every 20 s)

Request `{type: "jarvis/get_panel_data"}`. The editor reads only `data.config` and `data.areas`:

```ts
// data.config — every key below is emitted by websocket.ws_get_panel_data. "wire type" is what
// actually arrives (no coercion on the backend); "stored by the editor" is what the editor WRITES.
interface EditorConfigSlice {
  floor_plan_rooms:      unknown; // _get_runtime_json: dict normally; legacy JSON *string*; "" / {} when unset
  floor_plan_elements:   unknown; // same tolerance; dict {floor: Opening[]}
  floor_plan_cameras:    unknown; // dict {floor: CameraPin[]}
  floor_plan_entities:   unknown; // dict {floor: EntityPin[]}
  floor_plan_property:   unknown; // dict {points: [[x,y],...]} | {} | string
  floor_plan_bg:         unknown; // dict {floor: "data:image/...;base64,...", _align?: {floor: {x, y, w}}} |
                                  // JSON string (installs from before jarvis/set_floor_background)
  floor_plan_bg_opacity: unknown; // _runtime_opt raw: "" (unset) | "0.35" (old panel wrote strings) | 0.35
  floor_plan_units:      string;  // "imperial" | "metric" (str()-coerced, default "imperial")
  floor_plan_sqft:       unknown; // "" | "1800" | 1800
  door_mapping:          unknown; // dict {slot: entity_id}
  residence_style:       string;  // one of STYLES ids, default "cape_cod"
  home_stories:          unknown; // "1" | "1.5" | "2" | "3" (str) — may arrive as number from a native entity
  has_basement:          unknown; // bool (default true) — may arrive as "true"/"false" string
  dormers_front:         unknown; // int 0..3 | "" | "2"
  dormers_rear:          unknown; // int 0..2
  garage_bays:           unknown; // int 0..4 (catalogue) — old UI accepted up to 8
  chimney_side:          string;  // "right" | "left" | "center" | "none"
  chimney_count:         unknown; // int 1..4
  basement_entrance:     string;  // "bulkhead" | "interior"
  home_bedrooms:         unknown; // int 0..20 | ""
  home_bathrooms:        unknown; // int 0..20 | ""
}
// data.areas[] — {id, name, ...} (PanelData.areas, see residence.md §2.1): the room-name suggestions.
```

`_get_runtime_json` (panel_data.py L119) returns the parsed object when the stored value is a dict/list or a
parseable JSON string; when the string does NOT parse it returns the raw **string** (step 2) — so every
`floor_plan_*` JSON key must be parsed through the tolerant `parseJsonish` rule of §3.2 (dict → use;
string → `JSON.parse` or treat as empty). `floor_plan_bg` is the one key the **backend itself** writes
(`jarvis/import_floorplan` and `jarvis/set_floor_background`, both through
`floorplan_import.async_set_floor_background` → a **dict**); installs from before that path still hold the
JSON **string** the old `_merge_background` produced, so a dict-or-string read stays mandatory.

### 2.2 `jarvis/update_config` — write one setting (every key except `floor_plan_bg`)

Two commands persist editor data: `jarvis/update_config` for the plan keys and the immediate-save
settings, and `jarvis/set_floor_background` (§2.4b) for `floor_plan_bg`, which is never written whole.

Request (voluptuous, exact — `websocket.py` L1488):

```python
{ vol.Required("type"): "jarvis/update_config",
  vol.Required("key"): str,
  vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None) }
```

Success `{"key": string, "value": <echo of the value sent>}`. Errors: `invalid_key`
(`Key '<key>' is not writable from the panel`), `no_entry` (`No JARVIS config entry found`), `no_data`
(`JARVIS runtime data not found`), `update_failed` (`str(exc)`). Behaviour (`config_apply.async_apply`):
writes `runtime_config` in memory **as sent, no coercion**, persists via `jarvis_config.set_many`
(config.json), nudges the snapshot coordinator, fires `SIGNAL_CONFIG_CHANGED`. No entry reload.

**Encoding rule (decided here; the "string-vs-dict quirk" of residence.md §9.1):** the editor sends
**structured JSON values** — a `dict` for the `json` keys, a `number` for floats/ints, a `boolean`, a
`string` for enums/str — never a stringified JSON blob. The old panel sent `JSON.stringify(...)` strings;
every backend reader tolerates both (`_get_runtime_json`, `residence_graph._boxes`,
`camera.py::_parse_coverage_rooms`, `camera_coverage.camera_for_area`, `floorplan_import._merge_background`,
`door_state.get_door_states` via `_get_runtime_json`), the Settings view already sends objects for
`json` kinds (settings.md §2.3), and config.json becomes hand-readable. Readers must stay tolerant forever
because old installs still hold strings. One consequence: `_get_runtime_json`'s raw-string fallback can only
ever hand the editor a string that is *not* JSON — treat that as "unset".

Keys the editor writes, with the catalogue `kind` (`config_apply.CONFIG_FIELDS`, category `home`) and the
exact JSON shape (types in §3):

| key | kind | value the editor sends | when |
|---|---|---|---|
| `floor_plan_rooms` | json | `Record<FloorKey, {label?: string, rooms: Room[], labels?: Label[]}>` — `{}` to reset | Save; Reset |
| `floor_plan_elements` | json | `Record<FloorKey, Opening[]>` | Save |
| `floor_plan_cameras` | json | `Record<FloorKey, CameraPin[]>` (incl. `coverage` results) | Save |
| `floor_plan_entities` | json | `Record<FloorKey, EntityPin[]>` (`{e, x, y}` — the key is **`e`**) | Save |
| `floor_plan_property` | json | `{points: Pt2[]}` (`{points: []}` when cleared) | Save |
| `floor_plan_bg` | json | `Record<FloorKey, dataUrl>` + `_align: Record<FloorKey, {x, y, w}>` — **not** sent through `update_config`: one floor at a time with `jarvis/set_floor_background` (§2.4b, merged server-side) | immediately on upload / remove / align |
| `floor_plan_bg_opacity` | float 0..1 step 0.05 (default unset → treat as 0.2) | `number` | immediately on slider `change` |
| `floor_plan_units` | enum `imperial`\|`metric` | `string` | immediately |
| `door_mapping` | json | `Record<DoorSlot, entity_id>` — omit blank slots | immediately per select |
| `residence_style` | str (ids from `STYLES`) | `string` | immediately |
| `home_stories` | enum `"1"\|"1.5"\|"2"\|"3"` | `string` | immediately |
| `has_basement` | bool | `boolean` | immediately |
| `dormers_front` | int 0..3 | `number` | immediately |
| `dormers_rear` | int 0..2 | `number` | immediately |
| `garage_bays` | int 0..4 | `number` | immediately |
| `chimney_side` | enum `right\|left\|center\|none` | `string` | immediately |
| `chimney_count` | int 1..4 | `number` | immediately |
| `basement_entrance` | enum `bulkhead\|interior` | `string` | immediately |
| `home_bedrooms`, `home_bathrooms` | int 0..20 (default unset) | `number` or `null` to clear | immediately |
| `floor_plan_sqft` | int 0..100000 (default unset) | `number` or `null` to clear | immediately |

Keys that are NOT writable and must not be attempted: `floor_plan_address` (appears in the harness fixture
only; it is in no backend list — §10 R12).

### 2.3 `jarvis/floorplan_sources` — image/camera entities that look like a map

Request `{type: "jarvis/floorplan_sources"}` (no other keys). Response:

```ts
{ sources: Array<{ entity_id: string; name: string; domain: "image" | "camera" }> }
```

Every `image.*` entity qualifies; a `camera.*` only when its id or friendly name contains one of
`map, floor, plan, vacuum, cleaner, roborock, valetudo, robot, lidar, mop, neato, dreame, ecovacs, rooms`.
Order: all `image` rows sorted by lower-cased name, then the `camera` rows sorted likewise. Empty list when
nothing matches (the handler never fails for that). Error code `floorplan_sources_failed`.

### 2.4 `jarvis/import_floorplan` — store an entity's current image as a floor's background

Request:

```python
{ vol.Required("type"): "jarvis/import_floorplan",
  vol.Required("entity_id"): str,
  vol.Optional("floor", default="1f"): str }
```

Response `{floor: string, entity_id: string, bytes: number}`. The **backend** fetches the image (in-process
`image`/`camera.async_get_image`, then the `entity_picture` proxy), builds a `data:<ctype>;base64,...` URL,
merges it into `floor_plan_bg[floor]` and writes the key itself (through the same per-floor write as
`jarvis/set_floor_background`, so a dict, mirrored into `runtime_config`; older installs may still hold a
JSON **string**). The editor must therefore `refresh()` afterwards and re-read `floor_plan_bg` from the
next snapshot (do not patch it locally with a guessed image). Errors: `import_failed` with messages
`"<entity_id> is not available"` (no state), `"couldn't read an image from <entity_id>"` (every fetch
failed / image < 1024 bytes), `"'<floor>' is not a floor key"` (§2.4b floor rule), or `str(exc)` for
anything else.

### 2.4b `jarvis/set_floor_background` — set / remove ONE floor's background image and alignment

Request (voluptuous, exact — `websocket.ws_set_floor_background`):

```python
{ vol.Required("type"): "jarvis/set_floor_background",
  vol.Required("floor"): str,
  vol.Optional("image"): vol.Any(str, None),    # a data:image/... URL sets it; null or "" removes it; absent keeps it
  vol.Optional("align"): vol.Any(dict, None) }  # {x, y, w} in plan units sets it; null removes it; absent keeps it
```

Response `{floor: string, bytes: number, align: {x, y, w} | null}` (`FloorBackgroundResult` in
`src/types.ts`): `bytes` is the length of the floor's stored image string (0 = none), `align` its stored
alignment. Admin-only (`@websocket_api.require_admin`, pinned by `tests/unit/test_admin_gating.py`).

Behaviour (`floorplan_import.async_set_floor_background`): validates, reads the current `floor_plan_bg`
runtime-aware (runtime_config → config.json → entry; dict or legacy JSON string), merges **only** `floor`
(`merge_floor_background`: other floors' images, other floors' `_align` entries and unknown keys are kept; an
empty `_align` is dropped) and writes the dict through `config_apply.async_apply_many` (runtime_config,
config.json, coordinator refresh, mirror signal). `align` is stored as floats `{x, y, w}` (other keys
dropped). Why per floor: HA's websocket accepts at most 4 MiB per incoming frame, so the old whole-dict
`update_config` write capped every floor's images together at that, and an alignment nudge resent them all.

Errors: `invalid_format` (a `ValueError`; message = the reason): `'<floor>' is not a floor key` (a letter or
digit first, then word characters / space / dot / hyphen, 64 at most; `_align` is reserved), `the image must
be a data:image/... URL` (external URLs, `/api/` paths and other `data:` types are refused — every admin's
panel would load them), `align must be {x, y, w} or null`, `align.<k> must be a finite number`, `align.w must
be greater than 0`, `nothing to change: pass image and/or align`; `update_failed` (`str(exc)`) for anything
else.

The panel's client-side guard (`store.ts`): a message whose UTF-8 frame would exceed `WS_FRAME_LIMIT`
(4 MiB − 8 KiB) is refused before sending with the status `This image is {size} MB; Home Assistant accepts
at most {max} MB per image` (an image) or `This change is {size} MB; Home Assistant accepts at most {max} MB
at once` (anything else, and every `update_config` write via `save()` / `writeSetting()`).

### 2.5 `jarvis/segment_floorplan_rooms` — detect room polygons in a vacuum map

Request:

```python
{ vol.Required("type"): "jarvis/segment_floorplan_rooms",
  vol.Required("entity_id"): str,
  vol.Optional("target_span", default=60.0): vol.Coerce(float) }
```

Response (read-only; the handler never writes the plan):

```ts
{ ok: true;
  rooms: Array<{ name: string;          // "Room 1", "Room 2", ... (largest first)
                 x: number; y: number;  // bbox, editor units, 1 decimal
                 w: number; h: number;
                 type: "room";
                 points: Pt2[] }>;      // traced + simplified outline, 1 decimal, offset by a 2-unit margin
  count: number }
```

The whole detected layout is scaled (aspect preserved) so its larger dimension spans `target_span` editor
units and shifted off the origin by 2 units — relative positions are kept, but the result is **not**
aligned with the background image or any existing rooms: the user positions it. Up to 16 rooms. Errors
(send_error code = the `error` field, message = `message`): `needs_numpy` (`Room detection needs numpy +
Pillow, which this Home Assistant install doesn't have.`), `decode_failed` (`Couldn't read that image for
room detection.`), `segmentation_failed` (`Couldn't detect rooms in that map.`), `no_rooms` (`No distinct
room colours found in that map — it may not be a segmented vacuum map.`), `segment_failed` (fetch
failures, same messages as §2.4). Takes seconds (numpy off the event loop): show a busy state.

### 2.6 `jarvis/compute_camera_coverage` — AI judgement of one camera's coverage

Request `{type: "jarvis/compute_camera_coverage", camera: dict}` where the dict is built by the editor:

```ts
interface CoverageContext {
  entity: string;                     // camera.* or ""
  room: string;                       // name of the room the camera sits in (§4.7 roomAt), "the area" if none
  fov: number;                        // degrees (default 90)
  range_ft: number;                   // range converted to FEET regardless of the units toggle (units * 0.2)
  indoor: boolean;
  candidates: Record<string, number>; // room name -> fraction of its sample points in view, 0.01..1 (§4.7)
  openings: string[];                 // e.g. "interior door at Kitchen", "cased opening at Hall", "open staircase"
}
```

Response `{covered: string[], reason: string, source: "llm" | "geometry", ts: number}` — `covered` is a
subset of the candidate names (the backend drops invented rooms), `reason` one sentence. With no
candidates the backend answers `{covered: [], reason: "Nothing in view.", source: "geometry", ts}`; when the
reasoning LLM fails it falls back to geometry (`covered` = candidates ≥ 0.7, `reason` = `Sees most of X,
part of Y, a corner of Z.`). Error `coverage_failed`. The result is stored verbatim as
`CameraPin.coverage` and saved with the plan — `camera.py` and `camera_coverage.camera_for_area` read
`coverage.covered` to tell the vision model which areas a camera sees and to pick a camera for an
intrusion area. Calls are sequential per camera (one LLM call each, seconds).

### 2.7 `auth/sign_path` — camera thumbnails (optional nicety, Cameras tab)

A camera row may show a 96 px still: `await signPath(this.hass, "/api/camera_proxy/" + entity_id)` and
`<img src=${signed}>`. Never an unsigned `/api/` src (smoke test fails). Re-sign on each render per
`ws.ts` caching. If the image errors, hide it (`@error` → remove). Not used anywhere else.

### 2.8 Client-side Home Assistant state (no command)

* `hass.states` for every entity picker (camera list = ids starting `camera.`; door/opening sensor list =
  §3.9 filter; pin picker = all ids; friendly names from `attributes.friendly_name`, falling back to the id —
  never throw on a missing state), and for the live value shown on a pin (§3.8).
* Room-name suggestions: `data.areas.map(a => a.name)` (areas with capabilities only — the snapshot carries
  no area registry; see §10 R9).
* Pin tap → `this.dispatchEvent(new CustomEvent("hass-more-info", {detail: {entityId}, bubbles: true,
  composed: true}))` opens HA's more-info dialog.

### 2.9 Events the editor emits

`jarvis-refresh` after every successful write (so the Residence view and the snapshot catch up),
`jarvis-navigate {view: "residence"}` from the Back button and `jarvis-navigate {view: "residence",
path: "editor/<tab>"}` from a sub-tab chip (both through `JarvisView.navigate`), and `hass-more-info`
for a pin (§2.8). Nothing else.

### 2.10 Fixtures (harness + smoke)

* `jarvis_floorplan_sources.json`: `{"sources": [{"entity_id": "image.roborock_s7_map", "name": "Roborock S7 Map", "domain": "image"}, {"entity_id": "camera.valetudo_map", "name": "Valetudo Map", "domain": "camera"}]}`
* `jarvis_import_floorplan.json`: `{"floor": "1f", "entity_id": "image.roborock_s7_map", "bytes": 48213}`
* `jarvis_segment_floorplan_rooms.json`: `{"ok": true, "count": 2, "rooms": [{"name": "Room 1", "x": 2.0, "y": 2.0, "w": 60.0, "h": 38.5, "type": "room", "points": [[2.0,2.0],[62.0,2.0],[62.0,40.5],[30.0,40.5],[30.0,28.0],[2.0,28.0]]}, {"name": "Room 2", "x": 30.5, "y": 28.5, "w": 31.5, "h": 22.0, "type": "room", "points": [[30.5,28.5],[62.0,28.5],[62.0,50.5],[30.5,50.5]]}]}`
* `jarvis_compute_camera_coverage.json`: `{"covered": ["Living Room"], "reason": "Sees most of the Living Room and a corner of the Downstairs Hallway.", "source": "llm", "ts": 1761700000}`
* `jarvis_set_floor_background.json`: `{"floor": "1f", "bytes": 64412, "align": null}` — the mock
  (`dev/mock-hass.ts`) echoes the request on top of it: `floor` from the message, `bytes` = the sent image's
  length (0 for null) when `image` was sent, `align` = the sent value when `align` was sent.
* `panel_data.json` (shared; additive): under `config` set `floor_plan_rooms` to `DEFAULT_PLAN` with
  `"Living Room"` given a 6-point `points` polygon, `floor_plan_elements` `{"1f": [{"id":"e1","type":"window","kind":null,"wall":"front","pos":0.3,"w":20,"entity":""},{"id":"e2","type":"door","kind":"exterior","wall":"front","pos":0.62,"w":18,"entity":"binary_sensor.front_door"},{"id":"e3","type":"door","kind":"interior","wall":"left","room":"Kitchen","pos":0.5,"w":16,"entity":""}], "2f": [{"id":"e4","type":"dormer","slope":"front","pos":0.35,"entity":""}]}`,
  `floor_plan_cameras` `{"1f": [{"id":"c1","x":230,"y":112,"angle":270,"fov":90,"range":55,"entity":"camera.living_room","indoor":true,"coverage":{"covered":["Living Room"],"reason":"Sees most of the Living Room.","source":"geometry","ts":1761700000}}]}`,
  `floor_plan_entities` `{"1f": [{"e":"binary_sensor.front_door","x":210,"y":120}]}`,
  `floor_plan_property` `{"points": [[-120,-110],[440,-110],[440,260],[-120,260]]}`, `floor_plan_bg` `{}`,
  `floor_plan_bg_opacity` `0.2`, `floor_plan_units` `"imperial"`, and `door_mapping` in the backend's
  orientation `{"front": "binary_sensor.front_door", "garage_1": "cover.garage_door"}` (§10 R11). Every
  other key is kept (including the harness-only `floor_plan_address`, §10 R12).

The mock answers `jarvis/update_config` with `{}` (`jarvis_update_config.json`) and does not persist, so a saved plan snaps back on the
next refetch in the harness; the editor's dirty-vs-snapshot rule (§4.8) must not fight that (it keeps the
local doc while dirty; after a save it adopts the next snapshot — which in the harness is the old plan;
that is the mock, not a bug).

---

## 3. Data model (`model.ts`)

Plan coordinates are **editor units**: `1 unit = 0.2 ft = 0.06096 m` (`FT = 0.2`, `plan.ts`); x grows to
the right, y grows **downward** (screen convention; the 3D renderer treats y as front→rear). The grid is
10 units minor (2 ft) and 50 units major (10 ft). Negative coordinates are legal (front yard, left of the
garage). Values are stored as plain numbers, rounded to **integers** for rect rooms, cameras, pins and
property vertices (old behaviour) and to **1 decimal** for polygon `points` (what the segmenter emits).

### 3.1 Types

```ts
export type Pt2 = [number, number];                       // from house3d
export type FloorKey = string;                            // canonical: "1f" | "2f" | "bsmt"; others tolerated
export const CANONICAL_FLOORS: ReadonlyArray<{ key: FloorKey; label: string }> = [
  { key: "1f", label: "1st Floor" }, { key: "2f", label: "2nd Floor" }, { key: "bsmt", label: "Basement" }];
export type RoomType = "room" | "bath" | "stairs" | "door" | "outdoor";   // unknown strings are preserved
export interface Room {
  id: string;            // client-only (nanoid-ish, never serialized) — stable identity for selection/undo
  name: string;          // display name; should equal an HA area name for occupancy lighting (case-insensitive)
  x: number; y: number; w: number; h: number;   // bounding box, ALWAYS present (residence_graph reads only these)
  type: RoomType | string;                       // default "room"
  points?: Pt2[];        // polygon outline, >= 3 vertices; present only for non-rectangular rooms and outdoor zones
  extra: Record<string, unknown>;                // every other key found in the stored object (round-trips untouched)
}
export interface PlanLabel { text: string; x: number; y: number }      // legacy free text (default basement plan); rendered read-only, preserved
export interface Floor {
  key: FloorKey;
  label?: string;        // stored; shown when present, else the canonical label (or the key)
  rooms: Room[];
  labels?: PlanLabel[];  // preserved
  extra: Record<string, unknown>;   // e.g. legacy "viewBox" — preserved, ignored
}
export type OpeningType = "window" | "door" | "dormer";
export type DoorKind = "exterior" | "interior" | "french" | "cellar" | "cased";
export type Wall = "front" | "back" | "left" | "right";
export interface Opening {
  id: string;                     // stored; "e" + Date.now().toString(36) when created (generate for legacy rows lacking one)
  type: OpeningType;
  kind: DoorKind | "interior" | null;   // door: DoorKind; window: null (exterior) | "interior"; dormer: null
  wall: Wall;                     // outer wall (or the ROOM's wall for room-anchored kinds); default "front"; unused by dormers
  room?: string;                  // room NAME, for kind interior|cased|french (windows: interior) — anchors the opening to that room's bbox
  slope?: "front" | "rear";       // dormers only
  pos: number;                    // 0..1 along the wall (left→right for front/back, top→bottom for left/right); default 0.5
  w: number;                      // width in editor units (default 20 = 4 ft); not used by dormers
  entity: string;                 // open/closed source entity_id or ""; cased openings never have one
  extra: Record<string, unknown>;
}
export interface CameraCoverage { covered: string[]; reason: string; source: "llm" | "geometry" | string; ts: number }
export interface CameraPin {
  id: string;                     // stored; "c" + Date.now().toString(36)
  x: number; y: number;
  angle: number;                  // degrees, 0 = +x (right), 90 = +y (down/rear), 180 = left, 270 = up/front; default 270
  fov: number;                    // 20..170 step 5, default 90
  range: number;                  // editor units (default 55 = 11 ft); the UI edits it in ft/m
  entity: string;                 // camera.* or ""
  indoor: boolean;                // default true: sight stops at walls; false (outdoor): only range limits it
  coverage?: CameraCoverage;      // §2.6 result, saved verbatim
  extra: Record<string, unknown>;
}
export interface EntityPin { e: string; x: number; y: number; extra: Record<string, unknown> }   // key "e", not "entity"
export type DoorSlot = "front" | "garage" | `garage_${number}` | "garage_rear" | "kitchen_garage" | "cellar" | "basement";
export type DoorMapping = Partial<Record<DoorSlot, string>>;            // slot -> entity_id; blank = auto-detect
export interface Property { points: Pt2[] }                              // [] = none
export type Units = "imperial" | "metric";

/** The working copy. Backgrounds/opacity/units/door mapping/house keys are NOT part of it: they save immediately. */
export interface EditorDoc {
  floors: Floor[];                             // ordered: 1f, 2f, bsmt (those present or enabled), then any other keys in stored order
  openings: Record<FloorKey, Opening[]>;
  cameras: Record<FloorKey, CameraPin[]>;
  pins: Record<FloorKey, EntityPin[]>;
  property: Property;
}
```

### 3.2 Parsing (snapshot → `EditorDoc`), tolerant by design

```ts
parseJsonish(raw): unknown      // string: "" → null, else JSON.parse or null on error; else raw as-is  (plan.ts has the same)
parseDoc(config): { doc: EditorDoc; configured: boolean; warnings: string[] }
```

* `floor_plan_rooms` → `plan.ts parsePlan` (dict with ≥1 key = configured; else `DEFAULT_PLAN`,
  `configured = false`). Each floor value may be `{rooms:[...]}` or (legacy, tolerated by
  `residence_graph`) a bare array of rooms. Each room: `name` → `String(name ?? "")`, `x,y,w,h` →
  `Number(...) || 0` (missing `h` → also accept `d`, the renderer's name), `type` → string or `"room"`,
  `points` → kept only when an array of ≥ 3 `[number, number]` pairs, else dropped. If `points` exists the
  bbox is **re-derived** from them (`syncBBox`, §4.7) so the two never disagree. All other keys → `extra`.
  A room with `w <= 0 || h <= 0` and no polygon is kept but flagged in `warnings`
  (`"<name>" on <floor> has no size`).
* Floor list: every key in the stored plan in its stored order, then the canonical floors that are
  **enabled** (`1f` always; `2f` when `String(home_stories ?? "1.5") !== "1"`; `bsmt` when
  `has_basement !== false && has_basement !== "false"`) but absent get an empty `Floor`; finally sorted so
  canonical keys come first in `1f, 2f, bsmt` order. A non-canonical key (e.g. `main`) is kept, shown with
  the warning badge of §7 and the "Move rooms to 1st Floor" action.
* `floor_plan_elements` → `parseElements`; per floor an array; rows: `type` must be one of the three
  (else the row is dropped with a warning), `kind` normalised (`"exterior"` → `"exterior"`; `undefined` → `null`),
  `wall` defaults `"front"`, `pos` → `Number` clamped 0..1 default 0.5, `w` → `Number || 20`, `entity` →
  `String || ""`, `id` generated when missing.
* `floor_plan_cameras` → per floor array; `angle` default 270, `fov` 90 (clamp 20..170), `range` 55
  (min 5), `indoor` = `c.indoor !== false`, `entity` string, `coverage` kept only when it is an object with
  an array `covered`.
* `floor_plan_entities` → per floor array; rows without a string `e` are dropped.
* `floor_plan_property` → `{points}` when `points` is an array of ≥ 3 pairs, else `{points: []}`.
* `floor_plan_bg` → `Record<string,string>` (dict or JSON string; only string values that start with
  `data:` or `/` or `http` are kept — the `_align` entry is a dict, so it never shows up as a floor).
  The alignment is read separately (`import-layers.ts parseAlign`): `_align[floor]` = `{x, y, w}` with finite
  numbers, `w > 0`; anything else = not calibrated (the image is drawn over the floor's content bbox).
* `floor_plan_bg_opacity` → `num()`; if not finite or outside 0..1 → `0.2`.
* `floor_plan_units` → `=== "metric" ? "metric" : "imperial"`.
* `door_mapping` → dict of string → string, dropping non-string values.
* House keys → `num()` / `String()` as in `plan.ts houseSpec`.

### 3.3 Serialising (`EditorDoc` → wire values)

```ts
serializeRooms(doc): Record<FloorKey, {label?, rooms: object[], labels?, ...extra}>
```
* A floor is emitted when it has rooms **or** a stored `label`/`labels`/`extra`, or is canonical and was
  present before; a canonical floor that was synthesised empty is **omitted** (don't pollute the plan).
* Room → `{...extra, name, x, y, w, h, type}` + `points` only when `points.length >= 3`
  (`x,y,w,h` rounded to integers; `points` to 1 decimal). Key order as listed (readability of config.json).
* `serializeElements` → `{...extra, id, type, kind, wall, pos, w, entity}` + `room` when set + `slope` for
  dormers (dormers omit `wall` and `w`). `kind` is emitted as `null` for exterior windows/dormers (old shape).
* `serializeCameras` → `{...extra, id, x, y, angle, fov, range, entity, indoor}` + `coverage` when present.
* `serializePins` → `{...extra, e, x, y}`.
* `serializeProperty` → `{points}` (integers).
* Round-trip test the builder must include (a `*.test.ts` run by `npm run check` is not available — write
  it as a dev-only assertion module invoked from the harness, or as plain functions exercised in the smoke
  page): `serialize(parse(X))` deep-equals `X` for the §2.10 fixture and for `DEFAULT_PLAN`, and
  `planToFeet(serializeRooms(doc))` / `elementsToFeet(serializeElements(doc), hass)` produce exactly what
  the Residence view produces from the same stored values (the 3D preview renders from the serialised
  form, never from `EditorDoc` directly, so the preview is the proof).

### 3.4 Units

```ts
toReal(units: number, u: Units): number     // ft = units*0.2 ; metric → round(ft*0.3048, 1) ; imperial → round(ft, 1)
fromReal(v: number, u: Units): number       // ft = metric ? v/0.3048 : v ; units = max(1, round(ft/0.2))   (old clamped to 8 for openings/cameras; rooms min 15 wide / 10 deep)
unitLabel(u): "ft" | "m"
dim(units, u): string                       // "12.4 ft" / "3.8 m" (space before the unit; no prime mark)
area(pts, u): string                        // shoelace |A|/2 * 0.04 = sq ft; imperial: >= 43560 → "x.xx acres" else "n sq ft" (toLocaleString); metric: sqm = sqft*0.092903; >= 10000 → "x.xx ha" else "n m²"
```

### 3.5 Floor availability vs content

Floor pills list every `doc.floors` entry; the canonical floors that are disabled by `home_stories` /
`has_basement` but still hold rooms are shown with a warning badge (`Hidden on the Residence tab`), never
dropped. The 3D renderer keys are `1f | 2f | b` (`bsmt → "b"`) — only for the preview.

### 3.6 Default new objects

| object | defaults |
|---|---|
| rectangle room | placed where the user drags; via toolbar "Place" at the view centre, `w 60 h 40`, type `room`, name from the dialog |
| polygon room | the drawn vertices; bbox derived |
| outdoor zone | type `outdoor`; default rectangle below the house: `x = min room x`, `y = max room bottom + 25`, `w = max(house width, 90)`, `h 70`; stored **with** `points` (4 corners) |
| window | `{type:"window", kind:null, wall:"front", pos:0.5, w:20, entity:""}`; interior window `kind:"interior"` |
| door | `kind` per button: `exterior`, `interior`, `french`, `cellar`, `cased`; same defaults |
| dormer | `{type:"dormer", slope:"front"|"rear", pos:0.5, entity:""}`; only offered on `2f` |
| camera | centre of the floor's room bbox (or 100,80 when no rooms), `angle 270, fov 90, range 55, entity "", indoor true` |
| pin | same centre; `e` = chosen entity; refuse duplicates on the same floor (`Already placed on this floor`) and unknown ids (`"<id>" is not a known entity id`) |
| property | rect around the floor's rooms (`x0-m, y0-m, x1+m, y1+m`, `m = max(150, 0.7 * max(width, depth))`); with no rooms `[20,20]..[220,170]` expanded likewise |

### 3.7 Door slots (Doors tab)

`bays = clamp(num(config.garage_bays) ?? 0, 0, 8)`. Slots, in order, with labels:
`front` "Front Door"; if `bays >= 1`: `garage_1`.."garage_<bays>" "Garage Door {n}", else the single `garage`
"Garage Door"; then `garage_rear` "Garage Side / Rear", `kitchen_garage` "Kitchen ↔ Garage", `cellar`
"Cellar / Bulkhead", `basement` "Basement". Backend `door_state.DOOR_SLOTS` honours only
`front, garage, garage_rear, kitchen_garage, cellar, basement`; `garage_<n>` is read client-side only
(`plan.ts garageBays`: bay 1 also falls back to `garage`). Show that as the help line of §7. A mapping that
contains slots not in the current slot list (e.g. `garage_3` after bays dropped to 2) is kept and listed
under "Other mapped slots" with a remove button.

### 3.8 Pin live state (`pinState(hass, entity_id)` → `{ level, value, name }`)

Ported from the old `_entMarkerStyle`, colours replaced by badge levels: `sensor` → `info`, value
`state + unit` (`—` when unknown/unavailable); `binary_sensor` with device_class in
`door|window|garage_door|opening` → on: `warn` "Open" / off: `neutral` "Closed"; in
`motion|occupancy|presence` → on: `ok` "Detected" / `neutral` "—"; other binary → `ok` "On" / `neutral` "Off";
`lock` → locked: `neutral` "Locked" / else `danger` "Unlocked"; `cover` → open/opening: `warn` "Open" /
`neutral` "Closed"; `person|device_tracker` → home: `ok` "Home" / `neutral` "Away"; `climate` → `info`,
`current_temperature + "°"` or state; anything else → state in `off|unavailable|unknown|idle|standby|none` →
`neutral` "Off", else `ok` "On". Missing state → `neutral`, value `—`, name = entity id.

### 3.9 Entity pickers

* **Opening / door-slot sensors** (`doorEntityCandidates(hass)`): every `cover.*` and `lock.*`, plus
  `binary_sensor.*` whose `device_class ∈ {door, window, garage_door, opening}` or whose id/friendly name
  matches `/door|garage|gate|cellar|bulkhead|hatch|window|contact|entry|slider|sash|casement|patio|french|skylight|opening|sliding/i`;
  sorted; the currently selected id is always included even when it no longer exists. First option
  `— auto-detect —` (value `""`).
* **Cameras**: ids starting `camera.`; first option `— camera —`.
* **Pins**: all `hass.states` ids (`<datalist>` or `ha-combo-box`), label `friendly_name (entity_id)`.
* **Room names**: `<datalist>` of `data.areas[].name`.

---

## 4. Architecture

### 4.1 Component tree

```
<jarvis-view-residence>  (subPath "editor" or "editor/<tab>")
  └─ <jarvis-plan-editor .hass .narrow .data .route>    editor.ts — owns the EditorStore (doc, history, dirty, save, floor, tab, selection, toasts)
       ├─ header (Back · title · dirty badge · floor pills · undo/redo · snap · fit · preview · units · Discard · Save)
       ├─ <jv-plan-canvas .store .hass ?narrow>          canvas.ts — layers registered by the tab modules (registerLayer)
       ├─ sub-tab chips (role=tablist): Rooms · Openings · Doors · Cameras & pins · Import   → navigate("residence", "editor/<tab>")
       ├─ side card: the active tab element <jarvis-editor-{rooms|openings|doors|pins|import} .store .canvas .hass .narrow>
       │    (each tab renders its own inspector for the selection + its tools and lists)
       └─ 3D preview (collapsible)                       renderSVG(docToFeet(doc), docElementsToFeet(doc, hass), …)
```

Every mutation goes through `store.change(label, apply, {transient?, coalesce?})` /
`store.changeWith(apply → label | null)`: the store clones the doc, applies, pushes a history entry unless
`transient` (drag frames), recomputes dirty and notifies its subscribers (microtask-batched). Unhandled canvas
context requests bubble as a `plan-context` CustomEvent. Undo/redo and dirty tracking are therefore
automatic.

### 4.2 Canvas layers (`<jv-plan-canvas>`, one `<svg>`)

Rendered with Lit `svg` templates (not `innerHTML` — room names are then escaped for free). Layer order,
bottom to top, each a `<g data-layer>`:

1. **grid** — `<pattern>` 10 u minor / 50 u major using `--jv-border` (minor at `opacity .35`) and axis
   labels every 50 u (`--jv-text-3`, font-size 3 u). Pattern and label rects span the *current* viewBox
   (negative coordinates included).
2. **background** — `<image href=${bg[floor]} … opacity=${bgOpacity}>`, `pointer-events: none`. With a
   stored alignment (`_align[floor] = {x, y, w}`) it is drawn at `x, y`, `w` wide and `w × naturalHeight /
   naturalWidth` high (`preserveAspectRatio="none"`); without one it is placed over the **content bbox** of
   the floor (or `0 0 320 150` when empty) with `preserveAspectRatio="xMidYMid meet"`. (Old code stretched it
   over the viewBox, so it moved when zooming — fixed here.) The Import tab's **Align on the plan** tool
   (`bg-align`) draws the image with a move/scale handle while active.
3. **ghost** — the floor directly below (`2f → 1f`, `1f → bsmt`), enclosed rooms only (type ≠ outdoor), as
   dashed `--jv-danger` outlines at `opacity .45` plus the caption `↓ {floor} below (stay within)`;
   `pointer-events: none`.
4. **property** — dashed polygon (`--jv-warn`, fill `--jv-warn-soft`), vertex handles (r 3) and edge
   midpoints (r 2.2, dashed) when the Rooms tab is active; `data-hit="prop-vtx:i"` / `prop-mid:i`.
5. **rooms** — per room a `<g data-hit="room:idx" tabindex="0" role="button" aria-label="{name}, {type}, {w} × {h}">`:
   path (polygon or rect, `rx 2`), fill per type at 6 % (`room|door → --jv-accent`, `bath|stairs →
   --jv-info`, `outdoor → --jv-ok`, dashed stroke for outdoor), name label centred (font-size by width:
   `w > 80 → 7, > 50 → 5.5, > 25 → 4, else 3`), dimension caption (`dim(w) × dim(h)`) when `w > 30 && h > 24`,
   and — when selected — the resize handle (8 × 8 at the bottom-right, `data-hit="handle:idx"`), or for
   polygons the vertex (`vtx:idx:i`) and midpoint (`mid:idx:i`) handles. Legacy `labels[]` drawn in
   `--jv-text-3` size 4, non-interactive.
6. **openings** — markers from `markerRect(opening, floor)` (§4.7): 4 u thick bars on the wall, colour by
   kind (`window → --jv-accent`, `interior → --jv-text-2`, `cellar → --jv-warn`, `cased → --jv-info`,
   `french → --jv-ok`, `exterior → --jv-warn`), dormers as 8 × 6 u blocks on the front/back edge;
   `data-hit="marker:idx"` (click selects the row in the Openings tab; **draggable along its wall** — a
   drag maps the pointer to `pos`, see A-O5).
7. **cameras** — cone path (`clippedCone`), indoor fill `--jv-danger-soft`/stroke `--jv-danger`, outdoor
   `--jv-warn-soft`/`--jv-warn`; dot r 3.2 (`data-hit="cam:idx"`, focusable); index label above.
8. **pins** — dot r 3 in the badge colour of `pinState` (`--jv-ok|warn|danger|info|neutral`), name above
   (≤ 16 chars + …), value below; `data-hit="pin:idx"`, focusable.
9. **overlay** — selection outline (`--jv-accent`, stroke 2, dashed for polygon-in-progress), the rubber
   band while drawing a rectangle, the polygon-in-progress with its vertices and a "closing" hint circle on
   the first vertex, snap guides, and the measurement tooltip (`<text>` with a `--jv-surface` rect behind)
   during drag/resize showing `dim(w) × dim(h)` / position.

The `<svg>` has `touch-action: none`, `tabindex="0"`, `role="application"`, `aria-label=t("Floor plan
canvas")`, `aria-describedby` pointing at the visually-hidden instructions string (§8), and a visible focus
ring (`:focus-visible` → outer ring; the host gives it 4 px padding so the ring is not clipped). Focused
objects inside the SVG get the `.is-focus` class drawing the ring as an extra stroke (`box-shadow` does not
apply to SVG). Height: `clamp(360px, 65vh, 820px)` wide, `min(70vh, 520px)` narrow; width 100 %.

### 4.3 History (`history.ts`)

```ts
class History<T> { push(label: string, snapshot: T): void; undo(): T | null; redo(): T | null; canUndo; canRedo; clear(); }
```
Snapshot-based (`structuredClone(doc)`), max 100 entries, redo stack cleared on push. One entry per
**gesture** (pointerup), per committed form field (`change`, not `input`), per add/remove, per import.
Drag frames are `transient` (mutate a scratch copy; the entry is pushed once on release with the final
doc). Immediate-save actions (units, opacity, background, door mapping, house keys) are **not** in the
history. Labels feed the toolbar tooltips (`Undo: Move Kitchen`). Keyboard: `Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`,
`Ctrl+Y`.

### 4.4 Pointer controller (`canvas.ts`)

One set of listeners on the `<svg>`: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`,
`lostpointercapture`, `wheel` (non-passive), `dblclick`, `contextmenu`, `keydown`.

* **Coordinates**: `toPlan(clientX, clientY)` via `svg.getScreenCTM().inverse()` (adapts to any viewBox /
  CSS size). Rounding: integers for rect/camera/pin/property moves, 1 decimal for polygon vertices.
* **Hit test**: `event.target.closest("[data-hit]")?.dataset.hit` → `kind:idx[:sub]`. No hit → background.
* **Gesture start** (`pointerdown`): record `{pointerId, start, startPlan, hit, orig snapshot of the
  object}`, `setPointerCapture`. Nothing changes until the pointer has moved ≥ 4 CSS px (**drag threshold**);
  a release before that is a **tap**: select (room/camera/pin/marker), open more-info for a pin (only when
  the pin is already selected, so a first tap selects and shows the inspector — old code opened on any
  no-move click), or clear the selection (background). Primary button only for object drags; **middle
  button** or **primary on background** = pan; `Space` held = pan regardless of target.
* **Drag kinds**: `move-room` (whole rect or polygon: translate all points; a dragged outdoor zone or
  polygon room updates its bbox on release), `resize-room` (bottom-right handle: `w = max(15, …)`,
  `h = max(10, …)`; `Shift` keeps the aspect ratio), `move-vtx`, `move-prop-vtx`, `move-cam`, `move-pin`,
  `move-marker` (projects the pointer onto the opening's wall segment → `pos` clamped 0..1), `pan`,
  `draw-rect` (rubber band from the press point; release creates the room when `w ≥ 15 && h ≥ 10`, else
  nothing), `draw-poly` (click adds a vertex; a click within 6 u of the first vertex, `Enter` or
  double-click closes when ≥ 3 vertices; `Esc` cancels; `Backspace` removes the last vertex).
* **Snapping**: when the toolbar "Snap" toggle is on (default **on**), moves/resizes snap to the
  **5 u grid** (1 ft) and to other rooms' edges within 3 u (edge-to-edge alignment, also used by
  `planToFeet`'s 1 ft snap, so seams stay closed). Holding `Alt` disables snapping for the gesture.
  Snapped guides are drawn in the overlay.
* **Live feedback**: during a drag only the affected `<g>` is re-rendered (Lit keyed repeat; frames
  rAF-throttled); cameras recompute their cone each frame (cheap ray cast); coverage percentages recompute
  on release only.
* **Release** (`pointerup` / `lostpointercapture`): commit via `plan-change` (one history entry), or cancel
  and restore the original on `pointercancel`.
* **Multi-touch**: a second active pointer during an object drag **cancels** that drag (restores the
  object) and switches to **pinch** (zoom about the midpoint, pan with the midpoint). Two-finger gestures
  never change objects. `touch-action: none` on the svg prevents page scroll while touching the canvas;
  the page still scrolls outside it.
* **Long-press** (touch, 500 ms, no movement) = context menu for the hit object (same as right-click).
* **Wheel**: zoom about the cursor, factor `0.85` (in) / `1.18` (out), viewBox width clamped `60..8000`;
  `Shift+wheel` pans horizontally; trackpad pinch (ctrlKey wheel) zooms likewise. Zoom/pan state is not
  persisted; "Fit" (`0` key) recomputes the auto viewBox (§4.5).
* **Context menu** (right-click / long-press / `Shift+F10` / `ContextMenu` key on a focused object): a small
  popover (`role="menu"`, keyboard navigable, Escape closes) anchored at the pointer: room → `Rename…`,
  `Duplicate`, `Reshape (edit corners)` (rect only) / `Convert to rectangle` (polygon only), `Delete`;
  vertex → `Remove corner` (disabled at 3); midpoint → `Add corner`; camera → `Toggle indoor/outdoor`,
  `Delete`; pin → `Open controls`, `Remove`; property vertex/midpoint as rooms; background → `Add room
  here`, `Add camera here`, `Paste` (when the clipboard holds a room copied with `Ctrl+C`). No native
  `confirm()`/`prompt()` anywhere — deletions are undoable and announce a toast with an Undo button.

### 4.5 ViewBox fit (`fitViewBox(floor)`)

Bbox of the floor's rooms (`x..x+w`, `y..y+h`) ∪ property points ∪ camera/pin positions; if empty use
`0 0 320 150`. Pad by `max(120, 0.25 * max(width, height))` on every side (the yard around the house), then
width `≥ 200`, height `≥ 140`. The canvas then letterboxes with `preserveAspectRatio="xMidYMid meet"`.
Re-fit on floor change and on "Fit"; keep the user's zoom otherwise, including across re-renders.

### 4.6 Keyboard

Canvas focused: `Tab`/`Shift+Tab` move through objects (they are focusable `<g>`s in DOM order: rooms,
markers, cameras, pins — the floating focus follows selection); `Enter`/`Space` select the focused object;
`Arrow keys` nudge the selection 1 u (`Shift` 10 u; polygons move whole; a focused vertex handle moves
that vertex); `Delete`/`Backspace` remove the selection (toast + Undo); `Esc` clear selection / cancel a
draw; `R` start rectangle draw, `P` polygon draw (announced in the instructions string); `+`/`-` zoom,
`0` fit; `Ctrl/⌘+C`/`V` copy/paste a room (paste offsets by 10 u); `Ctrl/⌘+D` duplicate; `F2` rename.
Selection changes are announced through an `aria-live="polite"` region (`{name} selected · {w} × {h}`).

### 4.7 Geometry (`geometry.ts`, pure functions — ported exactly)

* `roomPoints(r)`: `r.points` when ≥ 3, else the 4 bbox corners `[x,y],[x+w,y],[x+w,y+h],[x,y+h]`.
* `syncBBox(r)`: from `points`: `x = round(minX)`, `y = round(minY)`, `w = round(maxX-minX)`, `h = round(maxY-minY)`.
* `pointInPoly(x, y, pts)`: even-odd ray test (old `_pointInPoly`).
* `floorBBox(rooms)`: over rooms with `type !== "outdoor"` (for openings and cameras) — `null` when none.
* `markerRect(opening, rooms)`: dormer → centre `(bx0 + pos*(bx1-bx0), slope === "rear" ? by1 : by0)`, size
  8 × 6. Else anchor box `bb` = the named room's bbox when `kind ∈ {interior, cased, french} && room`
  matches a room name, else `floorBBox`; `front → (bx0+pos*W, by0)`, `back → (…, by1)`,
  `left → (bx0, by0+pos*H)`, `right → (bx1, …)`; bar `w × 4` (horizontal walls) or `4 × w` (vertical),
  centred. Returns `null` when there is no box (no rooms).
* `planGeometry(floor)` → `{walls, gaps}`: walls = every polygon edge of rooms with
  `type ∉ {stairs, door, outdoor}`; gaps = one segment per window/door opening (dormers excluded) of width
  `w` centred at its marker position on the anchor box (for `interior|cased` with a `room`, that room's
  box — note **french** doors use the floor box here, as the old code did).
* `segIntersect(a, b, c, d)` → point or `null`; `inGap(pt, gaps, tol = 2.5)`; `losClear(p, q, geo)`: no wall
  intersection outside a gap.
* `rayCast(cx, cy, ang, range, geo)`: distance to the nearest blocking wall (passing through gaps), else `range`.
* `coneD(cam)`: raw sector path (`M c L p1 A r r 0 large 1 p2 Z`, `large = fov > 180`);
  `clippedCone(cam, geo)`: when `geo.walls` is empty (or `indoor === false` → **outdoor cameras use the
  raw cone**), `coneD`; else `N = max(24, round(fov/3))` rays from `ang - fov/2` to `ang + fov/2`, each
  shortened by `rayCast`, joined into a closed path.
* `pointCovered(px, py, cam, geo)`: within `range`, within `±fov/2` of `angle` (angle difference normalised
  to −180..180), and (indoor only) `losClear`.
* `coverage(floor, cam, geo)` → `Record<roomName, fraction>`: for each room with `type ∉ {door, stairs}`:
  outdoor zones and polygons sample a 6 × 6 grid over the bbox keeping points inside the polygon; rects a
  4 × 4 grid at cell centres; `fraction = round(hit/total, 2)`; only rooms with `hit > 0` are reported. A
  value `≥ 0.7` counts as "full" (matches the backend `_FULL`).
* `roomAt(floor, x, y)`: first enclosed room (type ∉ {stairs, door}) whose bbox contains the point, else
  the room with the nearest centre, else `"the area"`.
* `openingDescriptions(floor)`: for doors of kind `cased` → `cased opening at {room}`, `interior` →
  `interior door at {room}` (only with a `room`), plus `open staircase` when a `stairs` room exists.
* `polygonArea(pts)` shoelace (for §3.4 `area`).

### 4.8 Document lifecycle, dirty state, snapshot sync

* On first `data` → `parseDoc` → `doc`, `baseline = serializeAll(doc)` (the five plan keys), `dirty = false`,
  history cleared, floor = `1f` (or the first floor with rooms).
* On every later `data`: if `!dirty` and `serializeAll(parseDoc(newConfig)) !== baseline` → adopt the new
  doc (another client or an import changed it). If `dirty` and it differs → keep the local doc and show
  the banner `The plan changed elsewhere.` with `Reload` (discard local) / `Keep mine` (dismiss until the
  next difference). Immediate-save keys (bg, opacity, units, door mapping, house keys) always come from
  the latest snapshot, overlaid by an in-flight optimistic value while the write is pending. Writes
  to one key may overlap (the opacity slider's `change` again before the first answer): only the
  latest one started sets the key's status or reverts it, and a failing latest write goes back to the
  last value a write confirmed (or to the snapshot's when none did) - never to whatever overlay it saw
  when it started, which may be an earlier write the backend refused. Background writes patch one
  floor each, so they are independent: every confirmed floor folds into the confirmed dict whatever
  order the answers arrive in, and the floors still in flight stay shown on top of it.
* `dirty = serializeAll(doc) !== baseline` (recomputed after every change; so undoing back to the baseline
  clears it).
* **Save** (toolbar, `Ctrl/⌘+S`): for each of the five keys whose serialised value differs from the
  baseline, `update_config` **sequentially** in the order `floor_plan_rooms, floor_plan_elements,
  floor_plan_cameras, floor_plan_entities, floor_plan_property`; on success set that key's baseline; on
  failure stop, show `ha-alert error` `Save failed — {message}` with `Retry` (retries the remaining keys),
  keep `dirty`. After all succeed: toast `Floor plan saved`, `refresh()`, history kept (undo still works;
  the doc is now equal to the baseline). Disabled while a save is in flight.
* **Discard** (toolbar, only when dirty): `confirmDialog({heading: "Discard unsaved changes?", destructive:
  true, confirmLabel: "Discard"})` → reparse from the latest snapshot, clear history.
* **Leaving**: while dirty, a `beforeunload` handler is registered (browser prompt on tab close/reload)
  and the Back button confirms (`Leave without saving?` → `Leave` / `Keep editing`). HA tab navigation
  cannot be intercepted (§10 R5); the doc is lost when the element disconnects, so the toolbar's dirty badge
  (`Unsaved changes`) stays visible and the Save button is sticky on narrow.

### 4.9 3D preview

Collapsible section (`Preview`, default open ≥ 1100 px, closed narrow; state in `localStorage`
`jarvis.editor.preview`, wrapped in try/catch). Renders `renderSVG({theta, floor: previewFloor, lit: {},
box, spec: houseSpec(config), plan: planToFeet(serializeRooms(doc)), elements:
elementsToFeet(serializeElements(doc), hass), garage: garageBays(config, hass), palette: buildPalette(this),
idPrefix: "j3de", animate: false})`; `fixedBox` cached on the serialised plan + spec key exactly as the
Residence view does (`paletteKey` in the cache key). Drag horizontally / `←` `→` to rotate (`theta -= dx *
0.6`), presets FRONT/RIGHT/REAR/LEFT/ISO reuse the Residence view's labels, `previewFloor` follows the
editor floor with an "All" option. Re-render debounced 120 ms after a change (the model build is the
expensive part). Errors in the renderer are caught → `jv-empty kind="error"` with the message, never a
crash of the editor.

---

## 5. Layout

Page (the Residence view renders only the editor when `subPath === "editor"`; no Residence cards).

```
┌ header row (not a card; sticky at --jv-sticky-top on wide) ───────────────────────────────────┐
│ [← Residence]  Floor plan editor   ● Unsaved changes      [1st Floor][2nd Floor][Basement]       │
│                                                       [↶][↷] [Snap ☑] [Fit] [Preview] [Save]     │
├ jv-grid ───────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ Card "Plan" (.jv-span-all on <1100; 2 of 3 cols ≥1100) ──────────────┐ ┌ Card "Inspector" ──┐ │
│ │ sub-tab chip row: Rooms · Openings · Doors · Cameras & pins · Import   │ │ selection form or  │ │
│ │ ┌ <jv-plan-canvas> ────────────────────────────────────────────────┐ │ │ hint; then the     │ │
│ │ │                                                                  │ │ │ active sub-tab's   │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │ list / tools       │ │
│ │ hint line (drag · resize · right-click · keys)                        │ │                    │ │
│ └──────────────────────────────────────────────────────────────────────┘ └────────────────────┘ │
│ ┌ Card "Preview" (collapsible, .jv-span-all) ────────────────────────────────────────────────┐ │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

* ≥ 1100 px: three-column `jv-grid`; the Plan card spans two columns (`grid-column: span 2`), the right
  column holds the Inspector + sub-tab content (own card, scrolls with the page). 600–1100: Plan card
  full width, Inspector below. The header row wraps.
* **Narrow (`this.narrow` / < 600 px), in priority order**: (1) floor pills (scrollable chip row) and
  the canvas (`min(70vh, 520px)`), (2) the Inspector for the current selection directly under the canvas
  (collapsed to a one-line summary when nothing is selected), (3) the sub-tab chip row + its content,
  (4) Preview (collapsed). A **sticky bottom bar** inside the view (`position: sticky; bottom: 0`, above
  the panel's bottom nav padding) with `Undo` `Redo` and the full-width primary `Save` (`Discard` as text
  button when dirty). No floating buttons. The header on narrow keeps only Back, the title and the dirty
  badge.
* Sub-tab chips: `role="tablist"` / `role="tab"` (`aria-selected`), the content region
  `role="tabpanel"`. The active sub-tab also sets the canvas **mode** (what the handles/markers show and
  what the background context menu offers): Rooms → room handles + property handles; Openings → markers
  draggable, rooms select-only; Doors → canvas read-only with mapped slots highlighted (front/garage
  markers pulse once); Cameras & pins → camera and pin handles; Import → detected-room review overlay.
  Deep link: `/jarvis/residence/editor/<tab>` — the active sub-tab **is** in the URL (a chip click or
  `←`/`→`/`Home`/`End` on the tablist calls `navigate("residence", "editor/<tab>")`; the store's `tab`
  follows the route); `/jarvis/residence/editor` alone opens Rooms.
* **Inspector** forms (all `ha-textfield`/`ha-select`/`ha-switch` with fallbacks; labels visible):
  * Room: Name (text + area datalist, with the hint `Use the Home Assistant area name so occupancy lights
    this room`), Type (select: Room, Bathroom, Stairs, Door, Outdoor zone), Floor (select: moves the room to
    another floor), Width / Depth (number, real
    units, step 0.5, min 1 — disabled for polygons, which show `{n} corners` and `Convert to rectangle`),
    X / Y (number, real units), `Reshape (edit corners)` (rect) , `Duplicate`, `Delete` (danger).
    A room named like `/garage/i` on `1f` shows the hint `The 3D model gives this room the garage roof.`
  * Opening (when a marker is selected; same form as the Openings tab row).
  * Camera: entity select, Aim (range 0..359 + numeric), FOV (range 20..170 step 5), Range (number in
    real units, min 1, step 1), Indoor/Outdoor segmented toggle, coverage readout, `Compute coverage`,
    `Delete`. On the canvas the selected camera (Cameras & pins tab) also gets an **aim knob** at the end
    of its cone: drag it to set direction and range; arrow keys on the focused knob rotate it.
  * Pin: entity (read-only), live state badge, `Open controls`, `Remove`.
  * Polygon corner / property vertex: `Corner {i} of {name}` / `Property corner {i}`, X / Y (real
    units), `Remove corner` (disabled at 3 corners), `Done`.
  * Nothing selected: the Rooms tab's "House" disclosure (house-shape keys) when Rooms is active, else a
    one-line hint.
* **Sub-tab contents** (right column / below canvas):
  * **Rooms**: `+ Room (draw)` (`R`), `+ Room (polygon)` (`P`), `+ Place room` (drops a default rect —
    the touch path), `+ Outdoor zone`, `+ Property line` / `Clear property line` with the lot area; the
    room list (`<ul>`, one row per room: type dot, name, `dim(w) × dim(h)`, warning icon when the name
    matches no area; click selects + scrolls the canvas to it); and the collapsible **House** section: Home
    style (select, `STYLES` labels), Stories (`1`, `1.5`, `2`, `3`), Basement (switch), Front dormers
    (0–3), Rear dormers (0–2), Garage bays (0–4), Chimney side, Chimney count (1–4), Basement entrance,
    Bedrooms, Bathrooms, Square footage (blank = estimate), Units (Imperial ft / Metric m — the same
    toggle also sits in the editor header on wide screens). Each saves immediately with the Settings
    view's row status (saving → saved → fades; error inline + revert). While a draw tool is active the
    tools row offers `Finish` / `Remove last corner` / `Cancel` (touch has no Enter / Esc); on narrow it also
    carries `Snap` and `Fit`, which the header hides there.
  * **Openings**: add buttons `+ Window`, `+ Interior window`, `+ Exterior door`, `+ Balcony door`,
    `+ Cellar door`, `+ Interior door`, `+ Cased opening`, and on `2f` `+ Front dormer`, `+ Rear dormer`;
    the list (`<ul>`), each row: type badge, Room (select, only for interior/cased/french and interior
    windows; options = non-outdoor rooms of the floor), Wall (select, hidden for dormers), Slope (dormers),
    Position (range 0..1 step 0.02 with the value as %), Width (number real units, hidden for dormers),
    Sensor (select §3.9; replaced by the text `open passage · no sensor` for cased), Remove. Hover/focus on
    a row highlights its marker (`.is-glow`), and vice-versa.
  * **Doors**: the slot grid (`<fieldset class="slots">`), one `<jv-picker>` per slot (§3.7) over the
    `binary_sensor` / `cover` / `lock` candidates, with the auto-detect option
    and the current live state badge next to it (`Open`/`Closed` from `data.doors[slot]` for backend
    slots, from the entity for `garage_<n>`); the help line; "Other mapped slots" when present. Each
    change saves `door_mapping` immediately (whole dict).
  * **Cameras & pins**: `+ Camera`, `Compute coverage for this floor` (disabled when no cameras); camera
    list rows (`CAM n` badge, entity, aim/FOV/range summary, `sees: Living Room 85% · Hall 30%` from the
    geometry with `full` emphasis ≥ 70 % and a `zone` tag for outdoor zones, or `nothing in view — aim
    it, widen the FOV, or extend the range`; the AI line `✓ confirms A, B — {reason}` when `coverage`
    exists; thumbnail §2.7); pins: entity picker + `+ Add`, chips with the live badge and a remove
    button; the tip `add a device, then drag its pin on the plan · tap a pin to open its controls`.
  * **Import**: cards stacked — **Map / vacuum entity** (select from §2.3 + `Import as background` +
    `Detect rooms`, span field hidden under "Advanced"), **Background image** (file input `accept="image/*"`,
    current floor's thumbnail, Opacity slider 0–1 step 0.05 with %, `Remove background`, and an
    **Alignment** disclosure — `· calibrated` when stored — with Left / Top / Image width in real units,
    the derived image height, `Align on the plan` (drag to move, corner handle to scale; arrows nudge,
    Page Up / Page Down scale, Enter finishes, Escape cancels; `Done` / `Cancel` buttons) and
    `Reset alignment`), **SweetHome3D**
    (file input `.sh3d,.xml,.json`, options, preview summary, `Add to plan` / `Replace plan`), **Plan file**
    (`Export JSON`, `Import JSON…` with `include background images` checkbox on export), **Reset**
    (`Reset to sample plan`, danger). The **detected-rooms review** (after `Detect rooms`) shows the
    candidates as a dashed overlay on the canvas with a checklist (name editable inline, checkbox) and
    `Add selected` / `Replace rooms on {floor}` (when the floor already has rooms; confirmed) / `Cancel`;
    tapping a candidate on the plan includes / skips it and dragging any of them moves the whole layout;
    candidates are not part of the doc until added.

---

## 6. Actions

Columns: Trigger → Effect; Command (none = in-memory, enters history); Confirm; Feedback. "Toast" is the
view's own small `role="status"` strip (no shared toast helper exists yet), auto-hiding after 4 s, with an
optional `Undo` button.

### Toolbar / lifecycle

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| T1 | Back (`← Residence`) | `navigate("residence")` | – | when dirty: `Leave without saving?` (`Leave` destructive / `Keep editing`) | – |
| T2 | Floor pill / `Alt+1..3` | `floor = key`; clear selection; re-fit viewBox | – | no | pill `aria-selected` |
| T3 | Undo / Redo (`Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y`) | pop/push history, re-render | – | no | buttons disabled at the ends; tooltip names the step |
| T4 | Snap toggle | `snap = !snap` (persist in `localStorage jarvis.editor.snap`) | – | no | pressed state |
| T5 | Fit (`0`) | `fitViewBox(floor)` | – | no | – |
| T6 | Preview toggle | show/hide §4.9 | – | no | – |
| T7 | Save (`Ctrl/⌘+S`) | §4.8 sequential writes | `jarvis/update_config` × changed keys | no | button `Saving…` disabled; toast `Floor plan saved`; on error `ha-alert` `Save failed — {message}` + `Retry`; then `jarvis-refresh` |
| T8 | Discard | reparse snapshot, clear history | – | `Discard unsaved changes?` destructive | toast `Changes discarded` |
| T9 | Banner `Reload` / `Keep mine` (§4.8) | adopt remote / dismiss | – | Reload when dirty: same as T8 | – |

### Rooms (R)

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| R1 | `+ Room (draw)` / `R`, then drag on the canvas | rubber band; on release ≥ 15 × 10 u → name dialog (`jv-confirm`-style dialog with Name + Type) → push room | – | no | cursor crosshair; toast `Added {name} — drag to position, then Save` |
| R2 | `+ Room (polygon)` / `P`, click vertices, close | as R1 with `points` and derived bbox | – | no | vertex count in the overlay; `Esc` cancels (toast `Polygon cancelled`) |
| R3 | `+ Place room` | default 60 × 40 rect at the view centre, then the name dialog | – | no | selected; inspector focused on Name |
| R4 | `+ Outdoor zone` | §3.6 default zone with `points`, name dialog | – | no | toast `Added zone {name} — size it over the area the camera watches, then Save` |
| R5 | Drag a room body | move (snap §4.4) | – (one history entry) | no | measurement tooltip; cursor `move`; `aria-live` on release |
| R6 | Drag the resize handle | resize (`w ≥ 15, h ≥ 10`) | – | no | tooltip `dim(w) × dim(h)` |
| R7 | Drag a polygon vertex / `Add corner` (midpoint click) / `Remove corner` | reshape; bbox re-derived on release; refuse removal below 3 (`Needs at least 3 corners`) | – | no | – |
| R8 | `Reshape (edit corners)` | rect → `points` (4 corners) | – | no | toast `Reshape: drag the corners, click an edge midpoint to add one, right-click a corner to remove` |
| R9 | `Convert to rectangle` | drop `points`, keep bbox | – | no | – |
| R10 | Inspector Name / Type / Width / Depth / X / Y `change` | update room (dimensions via `fromReal`; min 15 × 10) | – | no | polygon rooms: width/depth disabled |
| R11 | Rename (`F2` / context) | inline name dialog | – | no | – |
| R12 | Duplicate (`Ctrl+D` / context) | copy offset +10,+10, name `{name} 2` | – | no | selected |
| R13 | Delete (`Delete` / context / inspector) | remove room **and** any openings whose `room` was this name (they would become floor-anchored otherwise) | – | no (undoable) | toast `Removed {name}` + `Undo` |
| R14 | `+ Property line` | §3.6 default lot | – | no | toast `Property boundary added — drag the corners to your lot lines; click an edge midpoint to add a corner, right-click a corner to remove` |
| R15 | `Clear property line` | `points = []` | – | `Remove the property boundary?` destructive | toast `Property boundary cleared` |
| R16 | Drag property vertex / add / remove corner | edit lot; min 3 (`A boundary needs at least 3 corners`) | – | no | lot area label updates |
| R17 | `Move rooms to 1st Floor` (non-canonical floor badge) | move that floor's rooms/openings/cameras/pins under `1f` (append), delete the floor | – | `Move {n} rooms to 1st Floor?` | toast |
| R18 | House section field `change` | optimistic write of that key; revert on error | `jarvis/update_config {key, value}` (§2.2 table) | `has_basement` off while `bsmt` has rooms → `Hide the basement? Its rooms stay saved.`; `home_stories` → `1` likewise for `2f` | row status `Saving…` → `Saved`; error text under the field |
| R19 | Units toggle | write; re-label every dimension (stored units unchanged) | `jarvis/update_config {key:"floor_plan_units", value}` | no | toast `Units: Metric (m)` / `Units: Imperial (ft)` |

### Openings (O)

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| O1 | `+ Window` … `+ Cased opening` / dormers | push §3.6 default; select its row | – | no | marker appears mid front wall |
| O2 | Row Wall / Room / Slope / Position / Width / Sensor `change` | update (`w = fromReal(v || 4)`, `pos = Number`) | – | no | marker moves |
| O3 | Remove | drop row | – | no | toast + Undo |
| O4 | Row hover/focus ↔ marker | highlight both | – | no | `.is-glow` |
| O5 | Drag a marker (Openings tab) | project onto its wall → `pos` | – | no | tooltip `{pos}%` |
| O6 | Click a marker | select row (scroll into view) | – | no | – |

### Doors (D)

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| D1 | Slot select `change` | `mapping[slot] = eid` (delete key when `""`); optimistic | `jarvis/update_config {key:"door_mapping", value: <whole dict>}` | no | select disabled while saving; `Saved` status; error → revert + inline message |
| D2 | Remove under "Other mapped slots" | delete that key | same | no | same |

### Cameras & pins (C)

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| C1 | `+ Camera` | §3.6 default | – | no | selected |
| C2 | Drag camera dot | move; cone re-clipped each frame | – | no | – |
| C3 | Aim / FOV / Range / Entity / Indoor-Outdoor `change` (`input` for the ranges updates the cone only) | update camera; `range = fromReal(v || 10)` (`≥ 5` u) | – | no | coverage percentages recompute on `change` |
| C4 | Delete camera | remove | – | no | toast + Undo |
| C5 | `Compute coverage` (camera) / `… for this floor` | for each camera (sequentially): `ctx` of §2.6 → store `coverage` | `jarvis/compute_camera_coverage {camera: ctx}` | no | button `Computing… {i}/{n}` disabled; per-camera failures shown inline (`Coverage failed — {message}`) and the loop continues; toast `Coverage computed — Save to keep it` |
| C6 | Pin picker `+ Add` | validate (§3.6), push `{e, x, y}` | – | no | errors as inline text under the picker |
| C7 | Drag pin | move | – | no | – |
| C8 | Tap a selected pin / `Open controls` | `hass-more-info` event | – | no | HA dialog |
| C9 | Remove pin | drop | – | no | toast + Undo |

### Import (I)

| # | Trigger | Effect | Command | Confirm | Feedback |
|---|---|---|---|---|---|
| I1 | Import tab first shown | load sources | `jarvis/floorplan_sources` | – | select `Loading…`; empty → disabled option `No map or image entities found`; error → inline `Couldn't list image entities — {message}` + Retry |
| I2 | `Import as background` | backend writes `floor_plan_bg[floor]`; then `refresh()`; the canvas shows it when the snapshot lands | `jarvis/import_floorplan {entity_id, floor}` | the floor already has a background → `Replace the background of {floor}?` | button busy; toast `Floor plan imported from {entity} ({kb} KB)`; error `Import failed — {message}` |
| I3 | `Detect rooms` | candidates → review overlay (§5) | `jarvis/segment_floorplan_rooms {entity_id, target_span}` | no | button `Detecting…`; toast on success `Detected {n} room(s) — review, rename, position, then Save`; errors by code: `needs_numpy` → `ha-alert warning` with the backend message; others `ha-alert error` |
| I4 | Review `Add selected` | push the checked rooms (names as edited) to the current floor | – | no | toast `Added {n} rooms` |
| I5 | Background file chosen | read → downscale to ≤ 1600 px on the long side (canvas), PNG if the source is PNG/has transparency else JPEG q 0.85, refuse results > 1.5 MB (`Image too large after compression — use a smaller image`); write that floor only | `jarvis/set_floor_background {floor, image}` (was `jarvis/update_config` with the whole dict, which capped all floors' images together at HA's 4 MiB frame) | existing background → `Replace the background of {floor}?` | toast `Background image set for {floor}`; error `Image import failed — {message}` |
| I6 | Opacity slider `change` (`input` previews live) | write number | `jarvis/update_config {key:"floor_plan_bg_opacity", value}` | no | `%` label |
| I7 | `Remove background` | remove the floor's image and alignment | `jarvis/set_floor_background {floor, image: null, align: null}` | `Remove the background image of {floor}?` destructive | toast `Background image removed from {floor}` |
| I7b | Alignment fields `change` / `Align on the plan` → `Done` / `Reset alignment` | store that floor's `{x, y, w}` (1 decimal; `w ≥ 5` u) or remove it (the image falls back to the content bbox) | `jarvis/set_floor_background {floor, align}` / `{floor, align: null}` — no image travels | no | toast `Background aligned on {floor}` / `Background fitted to the rooms again`; error `Image import failed — {message}` |
| I8 | SweetHome3D file chosen | parse (§6.1) → summary (`{n} rooms on {m} levels`, level → floor mapping selects, options) | – | no | `ha-alert error` for unreadable files with the §6.1 messages |
| I9 | SweetHome3D `Add to plan` / `Replace plan` | convert with the chosen options; merge (append rooms per mapped floor) or replace `doc.floors` rooms entirely (openings/cameras/pins kept) | – | Replace: `Replace every room on every floor?` destructive | toast `Imported {n} rooms — review, then Save`; floor switches to the first imported floor |
| I10 | `Export JSON` | download `jarvis-floor-plan.json` (§6.2) via Blob + `<a download>` | – | no | toast `Floor plan exported` |
| I11 | `Import JSON…` | parse (§6.2): bundle → load every section into the doc (bg handled separately: offered as I5 writes **one floor per `set_floor_background` message** after confirmation, the floors that failed are reported), legacy plan → rooms only | – | units / door mapping in the file → `Also apply the units and door mapping from the file? They save immediately.`; backgrounds → `Also import {n} background images? They save immediately.` | toast `Layout imported — review, then Save` + Undo; partial background failure → `Imported {done} of {n} background images; {floors} failed — {message}`; entries that are not inline floor images → `Skipped {n} background entries that are not inline floor images of this home`; invalid → `Invalid layout file — {reason}` |
| I12 | `Reset Default` (disabled while the plan is dirty: `Save or discard your unsaved changes first.`) | write `floor_plan_rooms = {}`; local doc reparsed (default plan, `configured = false`); openings/cameras/pins/property untouched | `jarvis/update_config {key:"floor_plan_rooms", value: {}}` | `Reset the floor plan to the sample home? Your rooms are removed; openings, cameras and pins stay.` destructive | toast `Floor plan reset to the sample home`; `refresh()` |

#### 6.1 SweetHome3D conversion (port of `scripts/sweethome3d_to_floorplan.py`, in the browser)

Input detection: bytes starting `PK` → ZIP (`.sh3d`): parse the central directory, pick the entry named
`Home`, else the first `*.xml`, else the first entry whose bytes look like XML (leading `<`); entries use
method 0 (stored) or 8 (deflate → `new DecompressionStream("deflate-raw")`; when `DecompressionStream` is
undefined show `This browser can't unpack .sh3d files — export Home.xml from SweetHome3D or run
scripts/sweethome3d_to_floorplan.py`). No XML entry → `This .sh3d was saved in SweetHome3D's legacy binary
format. Turn on File → Preferences → "Save homes in XML format", re-save, and try again.` Text starting
`<` → XML (`DOMParser`); else JSON (strip a BOM; unwrap `{home: {...}}`).

XML → `{level: [{id, name}], room: [{name, level, points}]}`: every `<level>` (`id` or `name`), every `<room>`
with its `<point x y>` children. JSON → `home.level[]` (`id`/index, `name`), `home.room[] | home.rooms[]`
with `points` | `sPoints` | `point` as `{x,y}` objects or `[x,y]` pairs.

Convert: skip rooms with < 3 points; bbox from the points; `name` or `Room {n}`; floor =
`levelName(room.level)` mapped through the user's **level → floor** selects (default: first level → `1f`,
second → `2f`, a level whose name matches `/base|cellar|sous|keller|bsmt/i` → `bsmt`, rooms without a
level → `1f`); `type: "room"`; `points` kept only when the 4 points are **not** the bbox corners within
tolerance `0.05` (any order). Options: **Scale** — default `1/6.096 ≈ 0.16404` (SweetHome3D centimetres →
editor units at true size; shown as `Real size (cm → plan)`), with a free number field; **Rotate** 0/90/180/270
clockwise (about the bbox centre, applied after conversion); **Mirror** none/x/y; **Origin to (0,0)** on by
default. Round `x,y,w,h` to integers and `points` to 1 decimal after all transforms. Zero rooms → `No room
polygons found — draw rooms in SweetHome3D (Plan → Create rooms) and use the native .sh3d file.`

#### 6.2 JSON export / import format

Export (bundle, pretty-printed):

```json
{ "jarvis_floor_plan": 1,
  "floor_plan_rooms": {…}, "floor_plan_elements": {…}, "floor_plan_cameras": {…},
  "floor_plan_entities": {…}, "floor_plan_property": {…},
  "floor_plan_units": "imperial",
  "door_mapping": {…},
  "floor_plan_bg": {…}        // only with the "include background images" checkbox
}
```

Import accepts: the bundle (`jarvis_floor_plan` present → each present section parsed with §3.2;
`floor_plan_units` / `door_mapping` / `floor_plan_bg` are *offered* as immediate writes after confirmation,
never applied silently), or the **legacy bare plan** (every top-level value is a floor object/array →
rooms only, the old `Export` output and the SweetHome3D script's output), or a plan wrapped as
`{"floor_plan_rooms": {…}}`. Anything else → `Invalid layout file — expected a JARVIS floor plan`.

---

## 7. States

| State | Where | Rendering |
|---|---|---|
| Loading (`data === null`) | whole editor | `jv-section loading` ×2 (Plan, Inspector) |
| Not configured (`configured === false`) | banner under the toolbar | `ha-alert info`: `This is the sample home. Change anything and Save to make it yours, or import your plan.` |
| Empty floor (no rooms) | canvas overlay | `jv-empty compact` text `No rooms on this floor yet — draw one, place one, or import.` (canvas still interactive) |
| Non-canonical floor key | pill badge + inspector note | `jv-state-badge warn` `Hidden on the Residence tab` + R17 action |
| Disabled canonical floor with rooms | pill badge | same badge; the pill stays |
| Room name matches no area | list row icon / inspector hint | `mdi:alert-circle-outline` + `No Home Assistant area has this name — occupancy won't light it.` (areas come from `data.areas`, which lists only areas with capabilities; soften: `…in the snapshot`) |
| Dirty | header badge, Save enabled, sticky bar on narrow, `beforeunload` armed | `jv-state-badge accent` `Unsaved changes` |
| Saving | Save button `Saving…` disabled; keys' progress in the button tooltip | – |
| Save error | `ha-alert error` above the canvas | `Save failed — {message}` + `Retry` |
| Remote change while dirty | banner | `ha-alert warning` `The plan changed elsewhere.` + `Reload` / `Keep mine` |
| Sources loading / empty / error | Import tab select | §6 I1 |
| Import / detect / coverage in flight | the button | label with ellipsis, disabled; a second click ignored |
| Detected-room review | canvas overlay + Import tab list | dashed `--jv-info` polygons, checklist |
| Coverage per camera | Cameras tab row | geometry line always; AI line when `coverage` present; `source: "geometry"` → prefix `(geometry)`; `ts` shown as relative time via `hass.locale` |
| Background present | canvas layer 2; Import tab thumbnail | – ; `Remove background` enabled; Alignment disclosure (`· calibrated` when `_align[floor]` is stored; `This image can't be aligned (its size is unknown).` when the image's natural size cannot be read) |
| Background write refused / failed | Import tab inline error | `This image is {size} MB; Home Assistant accepts at most {max} MB per image` (client-side frame check, nothing sent) or the `set_floor_background` error message |
| Image too large / unreadable | Import tab inline error | §6 I5 messages |
| `.sh3d` unsupported browser | Import tab inline warning | §6.1 message |
| No admin (`hass.user.is_admin === false`) | Save error banner | the panel is admin-only; when a save returns `unauthorized` the save-error banner reads `Administrator access is required to edit the floor plan.` (with Retry / Dismiss) instead of `Save failed — {message}` |
| Parse warnings | above the grid | `<details>` `Plan warnings ({n})` listing `parseDoc` warnings |
| Keyboard focus after a removal | lists, toasts | a row's Remove (Openings rows, Doors "Other mapped slots", camera rows and the camera form's Delete, pin chips, toasts' Undo / Dismiss) goes through `keepRowFocus()` (`src/focus.ts`, DESIGN.md §8): focus moves to the same control in the **next** row, else the **previous** row, else a fallback — Openings: the first add button; Cameras: `+ Camera`; Pins: the add picker; Doors: the "Other mapped slots" heading, else the slot grid (`fieldset.slots`, `tabindex="-1"`); toasts: the selected editor tab. A polygon's `Remove corner` focuses the room inspector heading (`#insp-h`), a lot corner's the plan. An object removed on the canvas leaves focus on the plan (`canvas.focusSurface()`). A removal that waits for the backend (Doors: the `door_mapping` write disables the row controls while it saves) hands its Promise to `keepRowFocus()`, and focus is placed once it settles — on the same row's control again if the write failed and the row came back. Focus only moves when the control had it and it has since fallen to `<body>`; the smoke test asserts first / last / only row. A toast holds its 4 s auto-dismiss while focus is inside it (`store.holdToast`); the hold ends on focusout, and after every editor update for a held toast that no longer contains the focus (its focused Undo was stripped by a re-render: focus fell to `<body>`, which some browsers announce with no focusout) |
| Reduced motion | marker glow / pulse | no transitions beyond 200 ms; no pulse |
| Narrow | §5 | sticky bottom bar; inspector under canvas |

Never show `undefined`, `NaN` or `[object Object]`: every number passes through `num()` with a `—`
fallback; every entity name through the safe-name helper.

---

## 8. Strings

**Phase 3 status:** every panel key is now translated in all 22 language files (`frontend/i18n-missing.json` reports nothing missing; `npm run i18n:report` regenerates it). The de.json / ✓ / ✗ columns below record what existed before the port; the code's `t()` keys (`npm run i18n:keys`) are authoritative where they differ from this list.

All through `t()`. Column *de* = present in `custom_components/jarvis/frontend/i18n/de.json` today (✓ keeps
the existing translation if the English is kept byte-for-byte; ✗ new key to translate in one pass). Keys
marked ✓ were checked directly.

### Chrome, toolbar, states

| English key | de |
|---|---|
| `Floor Plan Editor` | ✓ (Grundriss-Editor) — header title |
| `Residence` | ✓ (Back button label `← Residence`: compose `← ` + t("Residence")) |
| `1st Floor` · `2nd Floor` | ✗ |
| `Basement` | ✓ |
| `Undo` · `Redo` · `Undo: {label}` · `Redo: {label}` | ✗ |
| `Snap to grid` · `Fit` · `Preview` | ✗ |
| `Save Layout` | ✓ (Layout speichern) — the Save button |
| `Saving…` · `Floor plan saved` · `Save failed — {message}` · `Retry` | ✗ |
| `Discard` · `Discard unsaved changes?` · `Changes discarded` · `Unsaved changes` | ✗ |
| `Leave without saving?` · `Leave` · `Keep editing` | ✗ |
| `The plan changed elsewhere.` · `Reload` · `Keep mine` | ✗ |
| `This is the sample home. Change anything and Save to make it yours, or import your plan.` | ✗ |
| `No rooms on this floor yet — draw one, place one, or import.` | ✗ |
| `Hidden on the Residence tab` · `Move rooms to 1st Floor` · `Move {n} rooms to 1st Floor?` | ✗ |
| `Floor plan canvas` | ✗ (aria-label) |
| `Drag a room to move it, its corner handle to resize. Right-click or long-press for more. Arrow keys nudge the selection, Delete removes it, R draws a room, P a polygon, 0 fits the view, Ctrl+Z undoes.` | ✗ (visually hidden instructions + the visible hint line is the shorter `Drag to move · corner handle to resize · right-click for more`) |
| `{name} selected · {w} × {h}` · `Nothing selected` | ✗ (aria-live) |
| `↓ {floor} below (stay within)` | ✗ |
| `Administrator access is required to edit the floor plan.` | ✗ |
| `Loading…` | ✗ (the Residence spec uses `Loading...` with ASCII dots — reuse that key instead: `Loading...` ✓) |

### Sub-tabs and Rooms

| English key | de |
|---|---|
| `Rooms` · `Openings` · `Doors` · `Cameras & pins` · `Import` | `Import` ✓, others ✗ |
| `Add Room` | ✓ — the draw button label is `Add Room`; variants `Add Room (polygon)` ✗, `Place Room` ✗ |
| `Outdoor Zone` | ✓ (+ button `+ ` prefix composed) |
| `Property Line` · `Clear Property Line` · `Lot: {area}` | ✗ |
| `Remove the property boundary?` · `Property boundary cleared` · `Property boundary added — drag the corners to your lot lines; click an edge midpoint to add a corner, right-click a corner to remove` · `A boundary needs at least 3 corners` | ✗ |
| `Name` · `Type` · `Width` · `Depth` · `X` · `Y` · `Corners: {n}` | ✗ |
| `Room` · `Bathroom` · `Stairs` · `Door` · `Outdoor zone` | ✗ (type labels; wire values `room`,`bath`,`stairs`,`door`,`outdoor`) |
| `Use the Home Assistant area name so occupancy lights this room` · `No Home Assistant area has this name — occupancy won't light it.` | ✗ |
| `The 3D model gives this room the garage roof.` | ✗ |
| `Reshape (edit corners)` · `Convert to rectangle` · `Duplicate` · `Rename…` · `Delete` · `Remove` · `Add corner` · `Remove corner` · `Needs at least 3 corners` | ✗ |
| `Reshape: drag the corners, click an edge midpoint to add one, right-click a corner to remove` | ✗ |
| `Added {name} — drag to position, then Save` · `Added zone {name} — size it over the area the camera watches, then Save` · `Removed {name}` · `Polygon cancelled` · `Added {n} rooms` | ✗ |
| `House` · `HOME STYLE` ✓ (reuse) · `Stories` ✓ · `Has basement` ✗ · `Front dormers` ✓ · `Rear dormers` ✓ · `Garage bays` ✓ · `Chimney side` ✗ · `Chimney count` ✗ · `Basement entrance` ✗ · `Bedrooms` ✓ · `Bathrooms` ✓ · `Square footage` ✗ · `blank = estimated from the plan` ✗ | as marked |
| `Units` · `Imperial (ft)` · `Metric (m)` · `Units: Metric (m)` · `Units: Imperial (ft)` | ✗ |
| `Hide the basement? Its rooms stay saved.` · `Hide the 2nd floor? Its rooms stay saved.` | ✗ |
| `Saved` · `Saving` | ✗ (row status; `Saving…` above) |
| Style labels `Cape Cod` … `Cabin` | ✗ (same keys as residence.md) |

### Openings

| English key | de |
|---|---|
| `Window` ✓ · `Interior Window` ✗ · `Exterior Door` ✓ · `Balcony Door` ✗ · `Cellar Door` ✓ · `Interior Door` ✓ · `Cased Opening` ✓ · `Front Dormer` ✓ · `Rear Dormer` ✓ | as marked (add buttons compose `+ ` + key) |
| `Wall` · `Front` · `Back` · `Left` · `Right` · `Roof slope` · `Front slope` · `Rear slope` · `Position` · `Sensor` | ✗ |
| `— room —` ✓ · `— auto-detect —` ✗ · `— camera —` ✓ · `— none —` ✗ | as marked |
| `open passage · no sensor` | ✗ |
| `Interior windows, interior / balcony doors and cased openings attach to a room's wall — pick the room, then the wall. A balcony door is full-height glass; a cased opening is a doorway with no door; dormers go on the 2nd floor.` | ✗ |
| `No openings placed on this floor yet — add one above.` | ✗ |

### Doors

| English key | de |
|---|---|
| `Front Door` · `Garage Door` · `Garage Door {n}` · `Garage Side / Rear` · `Kitchen ↔ Garage` · `Cellar / Bulkhead` | ✗ |
| `Map the model's doors to your entities. Blank = auto-detect by name. Per-bay garage slots drive the 3D model only; JARVIS's door awareness uses Front, Garage, Garage Side / Rear, Kitchen ↔ Garage, Cellar and Basement.` | ✗ |
| `Other mapped slots` · `Open` · `Closed` | ✗ |

### Cameras & pins

| English key | de |
|---|---|
| `Camera` ✓ · `Cameras` ✓ · `CAM {n}` ✗ · `Aim` ✗ · `Field of view` ✗ · `Range` ✗ · `INDOOR` ✓ · `OUTDOOR` ✓ (keep uppercase keys for the segmented toggle) | as marked |
| `indoor = bounded by walls, outdoor = by range` | ✗ |
| `Compute coverage` ✓ · `Compute coverage for this floor` ✗ · `Computing… {i}/{n}` ✗ · `Coverage computed — Save to keep it` ✗ · `Coverage failed — {message}` ✗ | as marked |
| `sees:` · `nothing in view — aim it, widen the FOV, or extend the range` · `confirms {rooms}` · `(geometry)` · `zone` | ✗ |
| `No cameras placed on this floor yet — add one above.` | ✗ |
| `Devices on plan` · `type to find an entity…` · `Add` ✓ · `add a device, then drag its pin on the plan · tap a pin to open its controls` · `No devices placed on this floor yet.` · `Open controls` | `Add` ✓, others ✗ |
| `"{id}" is not a known entity id` · `Already placed on this floor` | ✗ |
| Pin values `Open` · `Closed` · `Detected` · `On` · `Off` · `Locked` · `Unlocked` · `Home` · `Away` · `—` | ✗ |

### Import

| English key | de |
|---|---|
| `Map / vacuum entity` · `Import as background` · `Detect Rooms` · `Advanced` · `Fit detected layout to {n} units wide` | ✗ |
| `No map or image entities found` · `Couldn't list image entities — {message}` | ✗ |
| `Replace the background of {floor}?` · `Floor plan imported from {entity} ({kb} KB)` · `Import failed — {message}` | ✗ |
| `Detecting…` · `Detected {n} room(s) — review, rename, position, then Save` · `Add selected` · `Cancel` · `No rooms detected in that map` | ✗ (backend messages for `needs_numpy` etc. are shown verbatim, untranslated) |
| `Background image` · `Opacity` · `Remove background` · `Remove the background image of {floor}?` · `Background image set for {floor}` · `Image import failed — {message}` · `Image too large after compression — use a smaller image` · `upload a floor-plan image, then set its opacity here` | ✗ |
| `SweetHome3D` · `Choose a .sh3d, Home.xml or JSON export` · `{n} rooms on {m} levels` · `Level {name} →` · `Scale` · `Real size (cm → plan)` · `Rotate` · `Mirror` · `None` · `Left/right` · `Front/back` · `Move to origin` · `Add to plan` · `Replace plan` · `Replace every room on every floor?` · `Imported {n} rooms — review, then Save` | ✗ |
| `This browser can't unpack .sh3d files — export Home.xml from SweetHome3D or run scripts/sweethome3d_to_floorplan.py` · `This .sh3d was saved in SweetHome3D's legacy binary format. Turn on File → Preferences → "Save homes in XML format", re-save, and try again.` · `No room polygons found — draw rooms in SweetHome3D (Plan → Create rooms) and use the native .sh3d file.` · `Couldn't read that file — {message}` | ✗ |
| `Plan file` · `Export` ✓ · `Export JSON` ✗ · `Import JSON…` ✗ · `Include background images` ✗ · `Floor plan exported` ✗ · `Layout imported — review, then Save` ✗ · `Invalid layout file — {reason}` ✗ · `expected a JARVIS floor plan` ✗ · `Also import {n} background images? They save immediately.` ✗ | as marked |
| `Reset Default` ✓ (button) · `Reset the floor plan to the sample home? Your rooms are removed; openings, cameras and pins stay.` ✗ · `Floor plan reset to the sample home` ✗ | as marked |

Technical values (entity ids, `{floor}` keys like `1f`, numbers, backend `reason` text) are not
translated. `{floor}` in toasts should be the floor **label** (`t("1st Floor")`), not the key.

---

## 9. Out of scope (with reasons)

| Not in this editor | Why |
|---|---|
| Camera Watch / live streams, camera enable/rename/indoor-outdoor tools (`rename_camera`, `camera_location`), doorbell training | separate Cameras work (settings.md §7); the editor only *places* cameras |
| Automatic LLM coverage on every change | one reasoning-LLM call per camera; explicit button only (as before) |
| Multi-select / marquee, group move, rotation of rooms, wall drawing, snapping to the background image | the data model has no walls or rotation; keep the first port to the old feature set + undo/keyboard/touch |
| Editing legacy `labels[]` free text | the default basement labels were decoration; preserved untouched, read-only, not creatable |
| Persisting zoom/pan or a per-floor `viewBox` | the stored `viewBox` was never read back meaningfully; auto-fit instead |
| Creating arbitrary floor keys | the Residence tab shows `1f`/`2f`/`bsmt` only; extra keys are tolerated and can be merged (R17) but not created |
| Address / location (`floor_plan_address`) | no writable key exists for it (§10 R12) |
| Writing `floor_plan_sqft` from the plan estimate | the Residence view estimates it when blank; the field here is the manual override only |
| Area registry sync (creating HA areas from rooms) | needs HA's area registry WS commands and admin flows beyond this panel |
| Server-side image calibration / georeferencing of vacuum maps | the backend stores the image and the manual per-floor alignment only (§10 R6) |
| A shared toast component | DESIGN.md: shared components are frozen; the editor ships its own `role="status"` strip (noted in panel.md as a Phase 3 nice-to-have) |
| Native `prompt()` / `confirm()` dialogs the old editor used | replaced by `confirmDialog` and an inline name dialog |
| HUD styling, Orbitron/JetBrains fonts, literal colours, scanlines | design mandate |

---

## 10. Risks / ambiguities

1. **Shared-file edits.** Mounting at `/jarvis/residence/editor` is a small change in
   `src/views/residence.ts` (it imports `editor.ts`) plus an additive fixture block in
   `dev/fixtures/panel_data.json`. The smoke test (`scripts/smoke.mjs`) exercises the editor: every sub-tab
   route `/residence/editor/<tab>` in light and dark (element mounted, canvas draws the floor's rooms, clean
   after load, no error state, adopted styles linted), a store round trip (add a room, undo, redo, save →
   exactly `floor_plan_rooms` is written, reload adopted silently), the per-floor background writes (§2.4b),
   the keyboard focus after Remove (§7) and the model self-test (`selftest.ts`). Narrow layouts are still
   checked by hand in the harness (`http://localhost:5173/jarvis/residence/editor/<tab>`).
2. **Payload size of `floor_plan_bg`.** Backgrounds are base64 data URLs inside config.json **and**
   inside every `get_panel_data` snapshot (every 20 s, for every open panel). The old panel uploaded files
   untouched. Writes travel one floor per `jarvis/set_floor_background` message, so the 4 MiB websocket frame
   limits each image, not all of them together. The client-side downscale/compress rule (I5, ≤ 1600 px,
   ≤ 1.5 MB) bounds the panel's part;
   the backend import path (`import_floorplan`) stores whatever the entity serves — a large vacuum map
   still bloats the snapshot. A backend follow-up (serve backgrounds through a signed `/api/jarvis/...`
   view instead of inlining) is recommended but out of this spec.
3. **String vs dict persistence.** The editor and `floorplan_import` (`async_set_floor_background`) write
   dicts; older installs hold strings. Every reader tolerates both today, and `_get_runtime_json` returns the raw string
   when a stored string is not JSON — the parser treats that as unset. Any new backend reader must keep the
   `isinstance(raw, str) → json.loads` guard; `tests/unit/test_floorplan_import.py` and
   `test_residence_graph.py` already pin the tolerant behaviour.
4. **No server-side validation.** `update_config` stores anything the voluptuous union accepts. A
   malformed save (e.g. a room without `x`) would be stored and later tolerated (dropped/zeroed) by the
   readers. The serialiser is the only guard; keep §3.3 strict.
5. **Leaving with unsaved changes.** The panel's tab bar and HA's sidebar navigate without asking; only
   `beforeunload` (reload/close) and the editor's own Back button can prompt. A future `jarvis-before-navigate`
   hook in `panel.ts` would close the gap; until then the dirty badge + sticky Save are the mitigation.
6. **Background alignment.** A background image (upload or vacuum map) carries no scale of its own: until a
   floor is aligned (`_align[floor] = {x, y, w}`, set numerically or with `Align on the plan`) it is drawn over
   the floor's content bbox (or `0 0 320 150`), so rooms detected from the same map (which the backend scales
   to `target_span` from its own origin) will **not** line up with it. Users align the image and/or drag the
   detected block into place; a two-point "calibrate from a known distance" remains a follow-up.
7. **`garage_<n>` slots are client-only** (residence.md §9.5): `door_state.DOOR_SLOTS` lacks them, so
   `data.doors` never reports per-bay state; the Doors tab reads the mapped entity's state directly for
   those rows. If the backend ever adds them, nothing here changes.
8. **`garage_bays` bounds disagree**: catalogue `0..4`, old UI clamp `0..8`. The House field offers 0–4 but
   the slot list honours an existing larger value (clamped at 8).
9. **Area names from `data.areas` are incomplete** (only areas with at least one capability). The "no
   area has this name" hint can therefore be a false warning for an area without sensors; soften the
   wording as in §7. A proper fix is a backend list of all area names (follow-up).
10. **Opening anchor inconsistency inherited from the old code**: french/balcony doors are room-anchored
    for the marker (`markerRect`) but floor-anchored for the coverage gap (`planGeometry`). Ported as-is
    for fidelity with the 3D renderer; flag for a later backend/renderer review rather than silently fixing.
11. **Fixture `door_mapping` orientation**: the backend contract is `{slot: entity}`
    (`door_state.get_door_states` iterates `mapping.items()` as `slot, eid`); the fixture was reversed
    (`{entity: slot}`) and has been fixed (§2.10). `test_panel_data_doors.py` covers the backend, not the
    fixture.
12. **`floor_plan_address`** exists in the harness fixture but in no backend file (not in
    `PANEL_WRITABLE_KEYS`, not in the catalogue, not emitted by `ws_get_panel_data`). The Residence banner's
    "ADDRESS NOT SET" has no setter; nothing in the editor should pretend otherwise.
13. **Compute-coverage latency and cost**: one reasoning-LLM call per camera, seconds each, sequential.
    Keep the explicit button, show progress, never auto-run. The backend ignores a camera's `aim` (docstring
    mentions it; `_build_prompt` does not read it) — do not send it.
14. **Snapshot clobbering during edits**: the 20 s refresh replaces `data`; §4.8 keeps the local doc while
    dirty. The harness mock never persists, so after a Save the next snapshot *reverts* the plan there —
    expected in the mock only (fixtures README).
15. **`DecompressionStream("deflate-raw")`** is needed for `.sh3d`; absent in some older WebViews (HA
    Companion on old Android). The fallback message points to `Home.xml`/the script. ZIP64 and encrypted
    archives are not supported (SweetHome3D does not produce them).
16. **Polygon rooms and `residence_graph` adjacency** use the bbox only; a concave polygon room may be
    reported adjacent to a room it does not touch. Not a panel bug; mention in the Room inspector hint only
    if it confuses users.
17. **Default plan is the original author's home** ("Eliana's Room") — kept as the sample for parity with
    the Residence view (residence.md §9.12); the "sample home" banner makes that explicit.
18. **i18n volume**: ~180 new keys. `npm run i18n:keys` lists them; translate in one pass per DESIGN.md §9.
    Existing ✓ keys must be kept byte-for-byte (`Save Layout`, `Add Room`, `Reset Default`, `Compute
    coverage`, `Outdoor Zone`, the opening names, `INDOOR`/`OUTDOOR`, `— camera —`, `— room —`).
