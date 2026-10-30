# The JARVIS panel

The sidebar entry **JARVIS** (`/jarvis`) is the integration's admin page. It is
registered by `panel_register.py` with `require_admin=True`, served from
`/jarvis_panel_static/jarvis-panel.js` (one self-contained ES module, sha1
cache-bust query, `embed_iframe=False` so Home Assistant's own elements are
available) and written in TypeScript with [Lit](https://lit.dev) under
`frontend/`. Household members do not see it; they get the native entities and
the stock dashboard described in [native-entities.md](native-entities.md).

This page covers what each of the ten views does and which backend commands it
uses, the floor-plan editor, the Settings tool API, the standalone harness, the
no-literal-colour rule, translations, tests and what is still missing. Build
commands and the source layout are in [frontend/README.md](../frontend/README.md);
the per-view contracts (exact WebSocket shapes, every string, the risks found
while porting) are in `frontend/specs/<view>.md` (plus `editor.md` and
`settings-tools.md`).

## How it is put together

* **Shell** (`src/panel.ts`): an app bar drawn with HA's header tokens and the
  navigation. On a wide screen every view has a tab in one horizontally
  scrollable row that never wraps (the selected tab is scrolled into view, the
  overflowing edges fade and carry a chevron button, and a vertical mouse
  wheel over the row scrolls it sideways). The row shares the app bar's line
  only when the panel itself is at least 1560 px wide (a container query, so
  HA's open sidebar counts); narrower, it takes a second line. When Home Assistant says `narrow` the shell shows
  `ha-menu-button` and a bottom nav with the four primary views (Overview,
  Intrusion, Residence, Settings) plus **More**, which opens a focus-trapped
  bottom sheet listing the other six (Escape or the scrim closes it and focus
  returns to More); while one of those six is open, the More item shows it as
  the current item. When the panel itself is narrower than 380 px (a container
  query, so HA's narrow layout and the harness frame measure the same thing)
  only the current item keeps its label and the others are icons with an
  `aria-label`. On narrow the version moves to Overview so the app bar stays
  one row. The
  shell also routes `/jarvis/<view>[/<sub>…]` with `history.pushState` +
  `location-changed` (deep links and the back button work; the view sees
  `<sub>` as `subPath`), runs the snapshot poll (`jarvis/get_panel_data` once,
  every 20 s while the tab is visible, and whenever a view dispatches
  `jarvis-refresh`), shows an alert when the WebSocket fails and bootstraps
  the translations.
* **Views** (`src/views/<key>.ts`, registered in `src/views/index.ts`): one
  custom element per view, `<jarvis-view-<key>>`, receiving `hass`, `narrow`,
  `data` (the snapshot) and `route`. Anything not in the snapshot is fetched by
  the view with its own loading, empty and error states; writes re-fetch and
  ask the shell to refresh.
* **Theme** (`src/theme/tokens.ts`): the only file allowed to mention a
  colour, and even there every `--jv-*` token is `var(--primary-color)`,
  `var(--card-background-color)`, `var(--error-color)` … or a `color-mix()`
  of them. Light, dark and custom HA themes therefore work without any theme
  code in the panel.
* **Components** (`src/components/`): `jv-section` (an `ha-card` when
  defined, a token-styled card otherwise), `jv-state-badge`, `jv-kv`,
  `jv-empty`, `jv-confirm` / `confirmDialog()` (an `ha-dialog` when defined, a
  native `<dialog>` otherwise) and `jv-picker` (entity / area / domain / label
  / device picker: HA's `ha-selector` or entity / area pickers when they are
  loaded, a chip list with a combobox otherwise). HA elements such as
  `ha-icon`, `ha-switch`, `ha-select`, `ha-textfield`, `ha-alert` and
  `ha-camera-stream` are feature-detected at render time (`haDefined()` /
  `watchDefinitions()`), because some are lazy-loaded, and every one has a
  plain, token-styled fallback.

The backend gained exactly one command for the panel, in Phase 2: the
read-only, admin-only `jarvis/config_schema` (`websocket.py` →
`config_apply.build_schema`), which returns every panel-writable setting with
its kind, default, options, bounds and current value and never includes a
secret-looking key (`config_apply.looks_secret`). Phase 3 added none: the
Cameras, People and Documents views, the floor-plan editor and the Settings
tools use the `jarvis/*` commands and `jarvis.*` services the old panel
already called. All setting writes still go through
`jarvis/update_config {key, value}` (structured JSON values, never a
stringified blob); `panel_register.py` did not change. Images from the
authenticated `/api/jarvis/snapshot/{kind}/{filename}` view and HA's
`/api/camera_proxy*` go through `auth/sign_path` first (`signPath()` in
`src/ws.ts`), because an `<img>` cannot carry a bearer token.

## The views

In tab order. Commands are `jarvis/*` WebSocket commands unless marked as a
service (`jarvis.*`, called with `hass.callService`).

### Overview — `/jarvis/overview`

The at-a-glance page. **System Status** maps the snapshot's status tokens to
tiles (observer, sleep with its reason, LLM providers, broadcast, notify
target, satellites, lockdown) and shows bedrooms, the version and the estimated
cost in a footer. **Operational Mode** reads `jarvis/mode` and sets it with
one tap per chip (the backend description is the tooltip); the "Follow
occupancy automatically" switch writes `operational_mode_auto` through
`jarvis/update_config`. The header's lockdown switch calls
`jarvis/set_lockdown` (engaging asks for confirmation) and follows what the
backend answers, not what was requested. **Right now** shows the dominant
room; **Quick Actions** call `jarvis.nap` (30 / 60 min) and
`jarvis.unshush`. **Areas** lists every room with its capabilities, readings,
a pulsing occupancy dot and a lights pill that opens a per-room light
popover (`jarvis/area_lights`, optimistic toggles, "Turn all off"). A
throttled `state_changed` subscription nudges a refresh for the relevant
domains.

### Intrusion — `/jarvis/intrusion`

Status card (ARMED / INVESTIGATING / CONFIRMED / CALLED OFF with a local
countdown), the active breach's zones or path, the lockdown and acknowledged
banners, the last still as a signed image, and the two actions: **Call off
(false alarm)** (confirmed, destructive) and **I'm looking** (acknowledge),
both through `jarvis/intrusion`. **Response settings** writes
`intrusion_response_timeout`, `intrusion_vision_confirm`,
`intrusion_vision_veto` and `intrusion_requires_confinement` with real
numbers and booleans. The **log** (`jarvis/intrusion {action: "log"}`) shows
each event with its still and a REAL / FALSE ALARM pair; labelling is what
JARVIS learns benign patterns from, and the card says how many patterns are
currently damped. Optional live refresh subscribes to the
`jarvis_intrusion_confirmed` / `_unresolved` bus events.

### Cameras — `/jarvis/cameras`

Everything camera-shaped (`frontend/specs/cameras.md`). The view owns the
selected camera (remembered in `localStorage`), every camera write with an
optimistic overlay over the snapshot, and a toast region; a
`jarvis_camera_event` or a confident `jarvis_face_recognized` event focuses
the camera concerned for 25 s.

* **Camera Watch**: chips to pick a camera and a live tile fed by a frame
  chain that falls through four tiers, each with a watchdog: HA's own
  `ha-camera-stream` when it is loaded (the only tier that plays WebRTC-only
  Nest cameras live; 8 s to show decoded pixels), the signed
  `/api/camera_proxy_stream/<entity>` MJPEG stream (6 s; a black frame also
  escalates), a signed `/api/camera_proxy/<entity>` still every 2 s (the cache
  buster sits inside the signed path, because HA signs query parameters) and
  finally `jarvis/camera_snapshot` every 6 s. The tier that worked is
  remembered per camera for the session; still polling pauses while the
  document is hidden. **DIAG** opens a diagnostics panel
  (`jarvis/camera_diagnostics`: platform, stream and still probes per tier);
  **Analyze now** asks first and calls the `jarvis.analyze_camera` service
  (optionally announcing the result).
* **Cameras**: one row per camera with its *use* switch (the
  `disabled_cameras` list, through `jarvis/update_config`; Enable all /
  Disable all in the header), a JARVIS-only display name
  (`jarvis/rename_camera`; blank reverts to HA's name) and Auto / Indoor /
  Outdoor (`jarvis/camera_location`, which pins the entity into
  `indoor_entities` / `outdoor_entities`), plus links to the related keys in
  Settings › Cameras.
* **Doorbell Training**: *Scan backlog* (the blocking
  `jarvis.train_doorbell_backlog` service with a max-events field), *Run
  doorbell diagnostics* (`jarvis.diagnose_doorbell`; the result goes to the
  Home Assistant log), the stats line and the recent training events from the
  snapshot.

### People — `/jarvis/people`

Who JARVIS knows (`frontend/specs/people.md`). Everything here is biometric
data about other people: destructive actions confirm, images only render
through `signPath()` or data URLs, and discovered wearables stay hidden until
the user opts in.

* **Household**: the resident roster with last-seen frames, add / remove a
  resident, and reference-photo enrolment from a file (downscaled in the
  browser), from a past sighting, or from a camera right now
  (`jarvis/camera_snapshot`); all through `jarvis/faces` actions
  (`add_resident`, `remove_resident`, `set_reference`, `from_sighting`,
  `snapshot_now`, …) and `jarvis/face_reference` for the current photo; a
  lightbox enlarges a frame.
* **Recently seen**: guests and unknown faces, with *Make resident* and *Name
  this face* (`jarvis/faces` `make_resident` / `label`).
* **Voices**: in-process speaker identification (`jarvis/voices` `list`,
  `enroll`, `identify`, `forget`): the enrolled voiceprints, who is speaking
  now, enrolment and identification from a 4 s browser-microphone clip (needs
  HTTPS or localhost), and the three keys `voice_recognition_local`,
  `voice_recognition_delegate_stt`, `voice_embedding_model_path`.
* **Wellbeing Context**: the opt-in wearable context (`jarvis/biometrics`
  `status` / `enable` / `disable`) and what discovery found.
* **Face recognition options**: the `llm_face_recognition` switch and the
  recognition source.

On a phone the cards come in the order an admin needs them (Recently seen
first); on a wide screen CSS `order` restores the desktop order.

### Suggestions — `/jarvis/suggestions`

Pending suggestions from the snapshot with the type, confidence, the
headline and the "What JARVIS observed" evidence, entity chips, a
pretty-printed view of the automation payload (it is JSON, not YAML) and
**Create automation** / **Dismiss** through `jarvis/suggestion_action`.
Advisory suggestions are detected and relabelled **Acknowledge**; a confirmed
sequence asks before installing. **Goals** adds, cancels and deletes through
`jarvis/goal_action`. **Routine Learning** reads `jarvis/get_cognitive_status`
and runs `jarvis/run_analysis` with the full result (patterns found, closest
routine, busiest source, backfill). A link jumps to the learning section of
Settings.

### Memory — `/jarvis/memory`

**What JARVIS Knows** (`jarvis/get_knowledge`) grouped by household / about
me / person, with hedge and expiry markers, a teach form
(`jarvis/add_knowledge`) and a confirmed per-fact forget
(`jarvis/forget_knowledge {fact_id}` — the WebSocket protocol reserves `id`).
**Person Routines** (`jarvis/get_person_routines`) and **Recent Briefings**
(`jarvis/briefings`) are read-only. Each card loads once and keeps its own
error state, so one failing read never blanks the others.

### Documents — `/jarvis/documents`

The household document library and what JARVIS can retrieve from it
(`frontend/specs/documents.md`).

* **Document Library**: the indexed sources with their chunk counts
  (`jarvis/documents {action: "status"}`), **Upload** (files up to 3 MB, sent
  base64 in `{action: "upload", filename, content}`), **Ingest folder**,
  **Scan watch folders** (`scan_watch`) and a confirmed per-source **Delete**,
  each with a result banner. Backend text (a per-file error, "folder
  unreadable", the semantic note) is shown verbatim in the code font.
* **Search documents**: `jarvis/documents {action: "search", query}` with the
  hits, their engine and score.
* **Search engine**: keyword (FTS) versus semantic search
  (`jarvis/semantic_search` `status` / `enable` / `disable` / `test`); the
  probe reports the Ollama embedding endpoint, model and vector count.
* **Conversation memory**: `jarvis/search_memory {query, k}` over past
  conversations.

The settings the feature depends on (`document_watch_folders`,
`embed_model`, `embed_base_url`) are linked into Settings › Learning, never
edited here; nothing on this view changes the snapshot.

### Residence — `/jarvis/residence`

The 3D model the old panel drew, ported to a typed module
(`src/views/residence/house3d.ts`, geometry unchanged for plan-driven homes)
whose palette is built at render time from the computed `--jv-*` values, so
it is correct in light and dark. Home style select (writes
`residence_style`), floor pills, five view presets, pointer drag or arrow
keys to rotate, the property banner and stats strip, the dominant-room
gauges, and the **mmWave Presence** card (`jarvis/mmwave_overview`). **Edit
floor plan** opens the floor-plan editor below at
`/jarvis/residence/editor`. Without a floor plan the view shows a sample home.

### Logs — `/jarvis/logs`

Owns its own 20 s poll (paused while the document is hidden). **System Log**
(`jarvis/get_debug_log`, newest first, day separators, data-driven category
chips, debounced search, scroll position preserved across refreshes),
**Activity Feed** (`jarvis/get_activity_log`), **System Diagnostics**
(`jarvis/diagnostics` + `jarvis/get_calibration`, on demand), **Cognitive
Core** (`jarvis/get_cognitive_status`) and **Governance**: a read-only summary
of the enforcement kill-switches (`jarvis/get_enforcement`: capabilities ON,
safety guards ON, owner overrides, and every switch that is not at its
shipped default) with **Change in Settings**, which opens Settings ›
Governance — the one place that writes them.

### Settings — `/jarvis/settings[/<section>[/<key> | /tool:<id>]]`

Settings as data. The view fetches `jarvis/config_schema` (every key in
`PANEL_WRITABLE_KEYS` with its kind, default, options, bounds and current
value — secret-looking keys are never included) and renders one row per
field: switch, select, number, text, one-item-per-line list with suggestions
drawn from `hass.states`, or a JSON editor with live validation. Sections are
General, Voice & Audio, Learning, Safety & Energy, Cameras, Home & Extras,
Governance and Other; search covers key, label, help, option labels and the
tool cards' titles. Each write is `jarvis/update_config {key, value}` with
per-row saving / saved / failed status, a reset-to-default action,
confirmation before enabling `friday_automator`, `autonomy_enforce` or
`suggest_garage_confirmation`, a `jarvis/reload_appliances` call after the
appliance keys, and the language dictionary is loaded before `ui_language` is
saved.

On top of the generic rows sit the **Settings tools** (Phase 3, see the API
below): field editors that replace a row's control and tool cards at the top
of a section.

| Section | Tool cards | Field editors |
| --- | --- | --- |
| General | **Briefings** (schedule summary and *Brief me now* → `jarvis.briefing`, with a speaker check), **Diagnostics** (one button per test service: `jarvis.test_tts`, `test_notify`, `observer_status`, `test_routing`, `diagnose_doorbell`, `briefing`, `analyze_camera`) | **AI Models**: one editor per role (main, classifier, reasoning, review, vision, camera reasoning) owning `<role>_provider` + `<role>_model`, with the live model list from `jarvis/list_models`, "needs setup" on unconfigured providers and a *Use {model}* fix when the stored model is no longer offered |
| Voice & Audio | **Voice Confirmation** test (`jarvis/voice_confirm_test` at a satellite) | **Satellite → Speaker** pairings (`satellite_pairings`), **Announcement Speakers** toggles over the Cast devices, an entity picker for `voice_confirm_entities` |
| Learning | — | entity / domain / label pickers (`jv-picker`) for `excluded_entities`, `excluded_domains`, `excluded_labels`, `pattern_include_entities`, `presence_only_entities` |
| Safety & Energy | **Energy Management** (`jarvis/energy` live draw and advice; the agency is written through `update_config`), **Hazard Monitor** (`jarvis/hazard` status and a confirmed *Scan now*), **Muted Announcements** (`jarvis/mutes`) | **Sentinel Rules** on/off rows (`disabled_sentinel_rules`), the **Appliances** row editor (`appliance_profile`) |
| Cameras | — | area / entity pickers for `outdoor_areas`, `outdoor_entities`, `indoor_entities` |
| Home & Extras | **Wellbeing Context** (status and a link to People) | area pickers (`lab_areas`, `bedroom_areas`, `movie_area`) and the `movie_media_player` picker |
| Governance | **Governance** (`jarvis/get_enforcement` / `jarvis/set_enforcement`: each switch, confirmed when it disables a safety guard or enables a capability) | — |

Every `*_entities`, `*_domains`, `*_labels` and `*_areas` list key without a
bespoke editor gets the built-in `jv-picker` editor. Old Settings cards that
now live in another view are listed at the end of their section under
**Elsewhere in the panel**, each with a link (Operational Mode → Overview,
System Diagnostics and Observer Tuning → Logs, Document Library → Documents,
Cameras and Doorbell Training → Cameras, Wellbeing and Face recognition →
People, Floor Plan Editor → Residence › Edit floor plan).

## The floor-plan editor — `/jarvis/residence/editor[/<tab>]`

The visual editor for the data behind the Residence model, the intrusion
investigator's room adjacency (`residence_graph.py`), the camera coverage the
vision model is told about (`camera.py`, `camera_coverage.py`) and the door
slots of the model (`door_state.py`). Spec: `frontend/specs/editor.md`; the
code contract for tab authors: `frontend/src/views/residence/editor/README.md`.

**Layout.** A header with Back, the floor pills (`1f`, `2f`, `bsmt`), the
units toggle, undo / redo, the dirty badge and Save / Discard (a sticky bar on
a phone); the **Plan** card with the SVG canvas; five tabs; and a collapsible
**3D preview** that renders the *serialised* plan through the same code as the
Residence view, so what you see is what the Residence tab shows after Save.

**Tabs.**

* **Rooms** — draw rectangles (`R`) or polygons (`P`), drag, resize, reshape
  vertices, nudge, rename (`F2`), type (room, bath, stairs, door, outdoor
  zone), move to another floor, delete with Undo; the inspector offers HA area
  names (a room lights up from occupancy when its name matches an area) and
  warns when none matches. Also the property line (lot polygon) and the house
  keys that drive the 3D massing.
* **Openings** — windows, interior windows, exterior / balcony / cellar /
  interior doors, cased openings and (on the 2nd floor) front / rear dormers,
  placed on an outer wall or on a named room's wall, optionally bound to an
  open/closed sensor.
* **Doors** — the fixed door slots of the 3D model (front, garage bays,
  garage side, kitchen ↔ garage, cellar, basement) mapped to entities
  (`door_mapping`).
* **Cameras & pins** — cameras with aim, field of view and range, their
  line-of-sight cone clipped by walls and bleeding through openings, and
  AI-judged coverage per camera (`jarvis/compute_camera_coverage`, one call per
  camera, the result saved with the plan as `coverage`); any entity pinned on
  the plan with its live state.
* **Import** — see the flows below.

**Data model** (`editor/model.ts`). The editor parses the snapshot's
`config.floor_plan_*` values into an `EditorDoc` (floors with rooms, openings,
cameras, pins, the property line), tolerantly: legacy strings, unknown keys
(kept in `extra` and written back untouched), rooms without a type. One plan
unit is 0.2 ft; dimensions show in feet or metres. Rooms get a client-only id
for selection and undo; it is never serialised.

| key | written | value |
| --- | --- | --- |
| `floor_plan_rooms` | on Save | `{<floor>: {label?, rooms: [{name, x, y, w, h, type, points?}], labels?}}` — `{}` resets to the sample home |
| `floor_plan_elements` | on Save | `{<floor>: [opening, …]}` |
| `floor_plan_cameras` | on Save | `{<floor>: [{id, x, y, angle, fov, range, entity, indoor, coverage?}, …]}` |
| `floor_plan_entities` | on Save | `{<floor>: [{e, x, y}, …]}` (the key is `e`) |
| `floor_plan_property` | on Save | `{points: [[x, y], …]}` |
| `floor_plan_bg` | immediately | `{<floor>: <data URL>, _align?: {<floor>: {x, y, w}}}` — the whole dict is re-sent |
| `floor_plan_bg_opacity` | immediately | number 0–1 (unset = 0.2) |
| `floor_plan_units` | immediately | `"imperial"` / `"metric"` |
| `door_mapping` | immediately | `{<slot>: entity_id}` (blank slots omitted) |
| house keys | immediately | `residence_style`, `home_stories`, `has_basement`, `dormers_front` / `_rear`, `garage_bays`, `chimney_side` / `_count`, `basement_entrance`, `home_bedrooms`, `home_bathrooms`, `floor_plan_sqft` |

**Saving and sync.** Plan edits happen on a working copy with snapshot-based
undo / redo (`Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z` / `Ctrl+Y`; drags and nudges
coalesce into one step). The copy is dirty when its serialised value differs
from what was loaded, so undoing back clears it. **Save** (`Ctrl/⌘+S`) writes
only the changed plan keys, one `jarvis/update_config` each in the order
rooms, elements, cameras, entities, property, stops at the first failure
(that key and the rest stay dirty, Retry offered) and then refreshes the
snapshot; the history survives. While the copy is clean it follows new
snapshots; while it is dirty and another client changes the plan a banner
offers *Reload* or *Keep mine*. Leaving with unsaved changes asks first
(Back button) or triggers the browser prompt (tab close). `Alt+1…3` switches
floors.

**Import flows** (Import tab).

* **From a map entity**: `jarvis/floorplan_sources` lists every `image.*`
  entity and the `camera.*` entities that look like a map (vacuum, lidar,
  floor plan, …). *Import as background* calls `jarvis/import_floorplan
  {entity_id, floor}`; the backend fetches the image, stores it in
  `floor_plan_bg[floor]` itself, and the editor re-reads it from the next
  snapshot. *Detect rooms* calls `jarvis/segment_floorplan_rooms {entity_id,
  target_span}` (numpy + Pillow on the backend; up to 16 rooms, scaled to the
  span and not aligned with anything) and shows the candidates in a review
  overlay with a checklist before they are added to, or replace, the floor's
  rooms.
* **Background image file**: downscaled in the browser to ≤ 1600 px (PNG kept
  when transparent, else JPEG), refused above 1.5 MB, merged into
  `floor_plan_bg`; opacity slider; alignment (position and width, typed or
  dragged on the plan, stored under `floor_plan_bg._align`); remove.
* **SweetHome3D**: a `.sh3d` (ZIP, unpacked with `DecompressionStream`),
  `Home.xml` or JSON export is converted in the browser (a port of
  `scripts/sweethome3d_to_floorplan.py`) with a level → floor mapping, scale
  (real size by default), rotate, mirror and origin options, then added to or
  replacing the plan.
* **Plan file**: *Export JSON* downloads `jarvis-floor-plan.json`
  (`{"jarvis_floor_plan": 1, floor_plan_rooms, …, door_mapping,
  floor_plan_units, floor_plan_bg?}`); *Import JSON* accepts that bundle, a
  legacy bare plan (the old export and the SweetHome3D script's output) or
  `{"floor_plan_rooms": …}`. Plan sections land in the working copy (review,
  then Save); units, door mapping and backgrounds are offered as immediate
  writes after a confirmation, never applied silently.
* **Reset to sample plan**: writes `floor_plan_rooms = {}` after a destructive
  confirmation; openings, cameras and pins stay.

The importing guide for the formats themselves is
[floor-plan-import.md](floor-plan-import.md).

**Pointer and keyboard.** Pointer Events throughout (mouse, touch, pen): a
4 px drag threshold, two-finger pinch zoom, middle-button / Space /
background panning, wheel zoom, 500 ms long-press for the context menu, snap
to a 5-unit grid and to other rooms' edges (`Alt` disables). Every object is a
focusable element: `Tab` moves through them, `Enter` selects, arrows nudge
(`Shift` 10 units), `Delete` removes with Undo, `Esc` clears or cancels,
`+` / `-` / `0` zoom and fit; selection changes are announced in an
`aria-live` region.

**Code.** `editor/model.ts` (types, parse / serialise, units, doc
operations), `geometry.ts` (walls and gaps, ray casting, the clipped cone,
coverage sampling), `history.ts`, `store.ts` (`EditorStore`: the working copy,
history, dirty / save, snapshot sync, immediate settings; the only part that
talks to the backend), `canvas.ts` (`<jv-plan-canvas>` and the layer API),
`editor.ts` (`<jarvis-plan-editor>`), and one element per tab under `tabs/`.
`selftest.ts` holds the pure-function assertions (parse → serialise round
trip of the fixture plan, units, door slots, history, camera geometry); the
smoke test bundles and runs it.

## Settings tools — the plug-in API

The Settings view knows no key by hand. Phase 3's bespoke controls hook in
through `src/views/settings/registry.ts` and register themselves on import;
`settings.ts` imports the barrel `./settings/tools` once. Full reference:
`frontend/src/views/settings/README.md`; contracts per tool:
`frontend/specs/settings-tools.md`.

* `registerFieldEditor(keyOrPredicate, factory, {consumes?, noReset?})` —
  `factory(field, value, onChange, ctx)` returns the control rendered inside
  the key's row instead of the kind's default control. `value` is already the
  kind's JS type; `onChange(next)` saves the owner key through the view's
  pipeline. `consumes` lists sibling keys the editor edits too (their rows are
  hidden, search and deep links land on the owner, the owner row shows their
  help and save status); `noReset` hides the row's reset link. An exact key
  beats a predicate; the last registration wins.
* `registerToolCard(category, {id, title, element, icon?, keywords?})` — a
  self-contained element rendered at the top of the category; deep link
  `/jarvis/settings/<category>/tool:<id>` scrolls to it and flashes it; the
  search matches its title, id and keywords.
* Both receive a **`SettingsHost`**: `value(key)`, `field(key)`,
  `save(key, value)` / `saveMany([[key, value], …])` (the single write path:
  confirm-before-enable, the `ui_language` ordering, the appliance reload, the
  per-row status, queueing of a second write to the same key, the debounced
  schema re-fetch and the shell refresh), `refetch()`, `refreshSnapshot()`
  and `toast(message)`. Tool cards also get `hass`, `data`, `narrow` and
  `active` (fetch on the first `true`). Runtime commands (`jarvis/energy`,
  `jarvis/hazard`, …) go through `ws()`; setting writes never call
  `jarvis/update_config` directly.

Modules: `tools/models.ts` (AI Models), `tools/lists.ts` (Sentinel rules,
announcement speakers, area and media-player pickers), `tools/pairings.ts`,
`tools/appliances.ts`, `tools/runtime*.ts` (Briefings, Diagnostics, Voice
Confirmation, Energy, Hazard, Mutes, Wellbeing) and `tools/governance.ts`.

## The harness

    cd frontend
    npm ci
    npm run dev          # http://localhost:5173/jarvis/overview

`dev/index.html` mounts the real bundle with a mock `hass`
(`dev/mock-hass.ts`) whose `callWS` answers from `dev/fixtures/`:
`jarvis/get_panel_data` → `panel_data.json`, `jarvis/config_schema` →
`config_schema.json` (generated from the real catalogue by
`frontend/scripts/config-schema-fixture.py`), `auth/sign_path` → a mock signed
path, anything else → `<type with / replaced by _>.json` when present, else
`{}`; `jarvis/mode {action: "set"}` and `jarvis/set_lockdown` are echoed
(`{ok: true, …}` with the requested mode / state) so a chip tap or the
lockdown switch visibly takes effect. Every command the sources send has a
fixture (the smoke test enforces it). The toolbar toggles HA light / dark (the
real HA default theme values set on `<html>`, exactly what Home Assistant
does), a 390 px narrow frame, the language, and a log of every WebSocket and
service call. Deep links work (`/jarvis/settings/cameras`,
`/jarvis/residence/editor/pins`). The fixtures are static and answer every
`action` of a command with the same file, so a mutation visibly snaps back on
the next refetch (a saved floor plan too); that is the mock, not the view.
HA's own elements are not defined in the harness, so it always shows the
fallback branches (`ha-switch` → a native switch, `ha-dialog` → `<dialog>`,
`ha-camera-stream` → the MJPEG / still tiers, which show nothing because the
harness serves no camera images); the HA branches follow the same contract
but need a look in a real Home Assistant.

## The no-literal-colour rule

The panel must look like Home Assistant in every theme, which only works if
it never chooses a colour. So:

* `src/theme/tokens.ts` is the only file that may name a colour, and even
  there every `--jv-*` token derives from an HA variable (`--primary-color`,
  `--card-background-color`, `--primary-text-color`, `--error-color`,
  `--warning-color`, `--success-color`, `--divider-color`,
  `--app-header-*`, `--black-color`, `--ha-card-border-radius`, …) with
  `color-mix()` for the soft tints. The raw state colours are for dots, bars,
  borders and filled buttons; as small text they fail WCAG AA in HA light
  (warning 1.96:1, primary 2.63:1 on a card), so status text uses the
  `--jv-ok-text` / `--jv-warn-text` / `--jv-danger-text` / `--jv-accent-text`
  / `--jv-info-text` variants, which are mixed toward the page text until they
  read at 4.5:1 or better on a card and on their own tint in both themes.
  Everything drawn on the app bar (tab indicator, hover, focus ring, border,
  the status badge, the inline SVG mark) uses the `--jv-header-*` tokens
  (`--app-header-background-color`, `--app-header-text-color`,
  `--app-header-selection-bar-color`, `--app-header-border-bottom`), so a
  theme that paints the header in its primary colour still gets a visible
  selected tab.
* Everywhere else `#hex`, `rgb()` / `hsl()` and friends, CSS named colours
  (`red`, `white`, …) and any named `font-family`, `@import`, `@font-face` or
  Google Fonts URL are forbidden. `transparent`, `currentColor`, `inherit`
  and the generic font families are fine.
* `npm run lint:theme` checks the sources (`scripts/colour-rules.mjs` is the
  detector) and `npm run smoke` re-checks the stylesheets the built panel
  actually adopts at runtime in HA light, HA dark and a theme with a
  primary-coloured app bar, so a colour cannot sneak in through a template
  string either; it also asserts that the app bar's own rules reference only
  `--jv-header-*` colour tokens. The Residence model's SVG palette (and the
  editor's 3D preview) is built from `getComputedStyle()` values of the tokens
  for the same reason; a computed value is only used when it looks like a CSS
  colour expression (otherwise the `var(--jv-*)` reference is kept) and is
  HTML-escaped on its way into the SVG, because those values come from the
  user's theme and the SVG is injected with `unsafeHTML`. The editor canvas
  layers style themselves with tokens through their `styles` and are checked
  the same way.
* State colours mean one thing each (`--jv-ok`, `--jv-warn`, `--jv-danger`,
  `--jv-info`, `--jv-accent`) and are never the only signal: they are paired
  with text or an icon.

The full contract for view code (layout, components, states, mobile,
accessibility, i18n, ownership) is `frontend/DESIGN.md`.

## Translations

Every user-visible string goes through `t("English text")`; the dictionaries
in `custom_components/jarvis/frontend/i18n/<lang>.json` are keyed by that
English string and loaded for `hass.language` (or the `ui_language` setting)
with fallback to English — the same mechanism and the same 22 files as
before. The new views reuse the old keys where the text is identical; the
roughly 1,100 strings Phases 2 and 3 added have entries in all 22 languages
from a machine-assisted translation pass (corrections from native speakers
are welcome). Anything added since shows in English until it is translated:

    cd frontend && npm run i18n:keys      # lists the keys no language has yet
    cd frontend && npm run i18n:report    # writes frontend/i18n-missing.json

`frontend/i18n-missing.json` is the translators' work list: per language the
number of source keys it translates and misses, and one entry per missing
key with the first source file that uses it and the languages that lack it
(`missing.filter(m => m.languages.includes("de"))` is German's list). Keys
reached only through a table (`t(tab.label)`, `t(CATEGORY_NAMES[c])`) are
listed under `indirect` because the extractor cannot resolve them, so the
report cannot tell whether they are translated: check the strings in those
tables by hand (the view titles in `src/views/index.ts` and the camera
presets FRONT / RIGHT / REAR / LEFT / ISO were missing this way until the
translation pass caught them). `npm run all` regenerates the file. See
`custom_components/jarvis/frontend/i18n/README.md` for how to translate.

## Tests and CI

* `npm run check` — `tsc --noEmit`, strict.
* `npm run lint:theme` — the colour / font lint above.
* `npm run build` — esbuild, deterministic, to
  `custom_components/jarvis/frontend/jarvis-panel.js`. **Commit the bundle
  with every source change**; the `frontend` CI job rebuilds and fails on a
  diff, then runs `node --check` on it.
* `npm run smoke` — the built bundle under jsdom with the mock `hass`:
  * every view in light, dark and a coloured-header theme renders content and
    no error state, with no uncaught error or `console.error`, no literal
    colour in any adopted stylesheet, the app bar on `--jv-header-*` colours
    only, and every `<img>` a `data:` URL, a panel static asset or a *signed*
    `/api/` path;
  * the shell: tab order, the scrolling tab row, the narrow bottom nav with
    More (focus trap, Escape, scrim, current item), tab clicks push
    `/jarvis/<view>`, the back button, `jarvis-navigate` / `jarvis-refresh`,
    keyboard navigation of the tablist, unknown routes, a German dictionary
    translating the tab bar, and a WebSocket failure surfacing as an alert;
  * every Settings section shows its tool cards and field editors, the
    `tool:<id>` deep link flashes its card, an *Elsewhere in the panel* link
    and the Logs governance link navigate;
  * every editor tab (`/residence/editor/<tab>`) in light and dark mounts its
    element and the canvas draws every room; then a round trip through the
    editor's store: add a room, undo, redo, save (exactly `floor_plan_rooms`
    is written, equal to the stored fixture plus the new room), and the
    refreshed snapshot is adopted without a conflict banner;
  * the editor model self-test (`selftest.ts`, bundled on the fly);
  * every `jarvis/…` / `config/…` command literal in `src/` has a fixture, no
    fixture is orphaned, and every call made during the run was answered by
    one.

  `node scripts/smoke_panel.js` from the repo root runs the same test.
* `npm run i18n:report` — regenerates `frontend/i18n-missing.json`; the
  `frontend` CI job reruns it and fails when the committed report differs,
  so commit it with every string or dictionary change.
* Python side: `tests/unit/test_ws_contract.py` pins that every command the
  sources send is registered in `websocket.py` and present in the committed
  bundle; `test_config_schema_ws.py` pins the `jarvis/config_schema` shape and
  its parity with the catalogue; `test_panel_writable_keys.py`,
  `test_briefing_schedule.py` (the Briefings tool card calls
  `jarvis.briefing`), `test_suggestion_evidence.py`,
  `test_panel_data_doors.py` and `test_ws_id_field.py` guard the per-view
  contracts statically.

## Still missing

Everything the old panel's tabs did is ported except:

* the `jarvis_doorbell_diag` bus event: *Run doorbell diagnostics* says to
  look in the Home Assistant log instead of showing the result;
* the onboarding card and area sparklines;
* backend follow-ups found while porting Documents: the ingest response still
  carries `files[].chunk_texts` (unused, large), uploads above 3 MB need an
  authenticated HTTP upload view, and no command lists files that are in the
  watch folder but not indexed;
* nice-to-haves noted in the specs: a shared toast helper instead of
  per-view fallbacks, a stale-snapshot banner inside views, `ha-slider` for
  0..1 floats, suggestion history, real YAML rendering.

Not yet checked in a real Home Assistant (the harness and the smoke test only
run the fallback branches): `ha-camera-stream` playback and its detection
through the shadow tree, signed camera stills with the cache buster inside the
signed path, the browser-microphone voice enrolment, `ha-dialog` lightboxes,
`ha-selector` pickers, and the narrow layout below 380 px on a real phone.

Chat is not coming back to the panel: it is Home Assistant's Assist dialog
with the JARVIS agent.
