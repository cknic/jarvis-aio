# Residence view — specification

Derived from the OLD panel's `residence` tab (`custom_components/jarvis/frontend/jarvis-panel.js`,
markup at ~L4685–4752, helpers `_build3DHouse` / `_renderHouse3d` / `_buildResidenceAnnotations` /
`_house3d*` / `_fetchMmwave` / `_renderMmwave` at ~L3400–3760, wiring at ~L6236–6268, and the
`JARVIS3D` IIFE at L44–1147). Everything below is what the new Lit view needs; the view agent
does not need to open the old file **except** for the one mechanical copy described in
§Renderer (the 3D geometry module).

Route: `/jarvis/residence` (tab id `residence`). Admin-only like the whole panel. Sub-route
`/jarvis/residence/editor[/<tab>]` renders the floor-plan editor (`<jarvis-plan-editor>`, editor.md) in
place of this view's cards (`subPath.split("/")[0] === "editor"`).

---

## 1. Purpose

Show the home as a rotatable axonometric 3D model (SVG) whose rooms/windows light up from
live occupancy, with:

* floor isolation (All / 1st Floor / 2nd Floor / Basement),
* the user's **home style** template (roof massing) selectable inline,
* per-bay garage doors and exterior/interior doors drawn open or closed from live HA state,
* a **mmWave Presence** card listing every room that has presence/motion/occupancy sensors with
  its live detection state — the "ground truth" behind the glow,
* a **dominant room** strip (the most-alive room: name, subtitle, temperature / humidity /
  lights gauges),
* property stats overlay (location, est. sq ft, bed/bath, style, occupied-rooms count).

The renderer must take its palette from Home Assistant theme tokens (`getComputedStyle`) so the
model follows HA light/dark themes. No Google Fonts, no scanlines, no HUD chrome.

---

## 2. Data

All commands are `hass.callWS(...)`. All are `@websocket_api.require_admin`. Error replies arrive
as a rejected promise whose `.code` / `.message` come from `connection.send_error(id, code, msg)`.

### 2.1 `jarvis/get_panel_data` — the status snapshot (shared with every view)

**Request** (voluptuous): `{ "type": "jarvis/get_panel_data" }` — no other keys.

**Response**: `{ ...snapshot, config: {...} }`, built by `panel_data.build_snapshot_with_context`
plus `websocket.ws_get_panel_data`'s `config` block. Fields the residence view reads:

```ts
interface PanelData {
  dominant: {
    area_id: string | null;    // null when nobody is detected anywhere
    name: string;              // area friendly name; or "AWAY" / "AT HOME" when area_id is null
    subtitle: string;          // "Occupied · 14m" | "Occupied" | "no presence detected"
    coord: string;             // "#<first 8 chars of area_id>" | "—"
    temp: string;              // "72°F" (int-rounded + first unit char) | "—"
    humidity: string;          // "44%" | "—"
    lights: string;            // "ON" | "OFF" (one light) | "2/5" (several) | "—"
    satellite: string;         // assist_satellite object_id[:20] | "—"
    last_motion: string;       // duration string, see _format_duration | "—"
  };
  areas: Array<{               // ONLY areas with >=1 capability (sat/spkr/mmwave/cam/light/...)
    id: string;                // area_id
    name: string;              // area friendly name
    caps: string[];            // subset of ["sat","spkr","mmwave","cam","light","switch","lock","climate","door","leak","alarm"]
    active: boolean;           // any presence/motion/occupancy binary_sensor in the area is "on"
    bedroom: boolean;          // area_id in configured bedroom_areas
    lights_on: number;
    lights_total: number;
    temp: string | null;       // "72°F" | null
    humidity: string | null;   // "44%" | null
    temp_entity: string | null;
    humidity_entity: string | null;
    last_motion: string;       // duration string ("—" when no presence sensor)
  }>;                          // sorted: active first, then bedroom, then name
  meta: {
    bedrooms: number;          // len(bedroom_areas) — count of configured bedroom areas
    areas_monitored: number;
    announcements_today: number;
    est_cost: string;
    uptime: string;
  };
  doors: {                     // door_state.get_door_states(hass, door_mapping); slots ABSENT when unknown
    front?: "open" | "closed";
    garage?: "open" | "closed";
    garage_rear?: "open" | "closed";
    kitchen_garage?: "open" | "closed";
    cellar?: "open" | "closed";
    basement?: "open" | "closed";
  };
  config: {
    // --- home massing (FieldSpec catalogue in config_apply.py, category "home") ---
    residence_style: string;   // str, default "cape_cod"; see §3.2 for the 10 known values
    home_stories: string | number;      // enum "1" | "1.5" | "2" | "3", default "1.5" (NOT str()-wrapped server-side -> may arrive as number)
    has_basement: boolean;     // default true
    dormers_front: number | string;     // int 0..3, default 2  (NOT coerced server-side)
    dormers_rear: number | string;      // int 0..2, default 1
    garage_bays: number | string;       // int 0..4, default 3
    chimney_side: "right" | "left" | "center" | "none";   // default "right"
    chimney_count: number | string;     // int 1..4, default 1
    basement_entrance: "bulkhead" | "interior";           // default "bulkhead"
    home_bedrooms: number | "" ;        // int 0..20 or "" when unset
    home_bathrooms: number | "";        // int 0..20 or "" when unset
    floor_plan_sqft: number | "";       // int 0..100000 or "" when unset
    floor_plan_units: "imperial" | "metric";             // default "imperial" (editor only; not used here)
    // --- floor plan (json kind; _get_runtime_json returns a parsed dict, see Risks) ---
    floor_plan_rooms: FloorPlan | string | {};  // {} when unset
    floor_plan_elements: FloorElements | string | {};
    door_mapping: Record<string, string>;        // slot -> entity_id; {} when unset
    // (floor_plan_cameras, floor_plan_entities, floor_plan_property, floor_plan_bg,
    //  floor_plan_bg_opacity also exist — editor only, NOT used by this view)
    [other: string]: unknown;
  };
}

// floor keys: "1f" | "2f" | "bsmt"   (the renderer maps "bsmt" <-> "b")
type FloorPlan = Record<string, {
  label?: string;              // "1st Floor"
  viewBox?: string;            // editor only
  rooms: Array<{
    name: string;              // room name; matched case-insensitively to area names for lighting
    x: number; y: number; w: number; h: number;   // editor SVG units; 0.2 ft per unit
    type?: "room" | "bath" | "stairs" | "door" | "outdoor";
    points?: Array<[number, number]>;  // optional polygon outline (>=3 vertices) in the same units
  }>;
  labels?: Array<{ text: string; x: number; y: number }>;  // editor only
}>;

type FloorElements = Record<string, Array<{
  id: string;                  // "e<base36 ts>"
  type: "window" | "door" | "dormer";
  kind?: "interior" | "exterior" | "french" | "cellar" | "cased" | null;  // windows: null|"interior"; doors: one of the five
  wall?: "front" | "back" | "left" | "right";
  room?: string;               // room name the element belongs to (interior/cased/french/interior-window)
  slope?: "front" | "rear";    // dormers only
  pos?: number;                // 0..1 fraction along the wall/roof, default 0.5
  w?: number;                  // width in editor units (default 20 => 4 ft)
  entity?: string;             // entity_id whose state "on"|"open" means open (doors) — resolved CLIENT-side from hass.states
}>>;
```

`_format_duration(seconds)`: `"—"` when None, `"<n>s"` under 60 s, `"<n>m"` under 1 h, else `"<n>h"`.

**When fetched / refreshed**: on mount, then every **20 s** (the old panel's `_fetchInterval`
is `20000` ms; the module docstring's "every 5s" is stale). The panel shell owns this poll
(every 20 s while the browser tab is visible, plus on `jarvis-refresh`); the view receives each
snapshot as `data`. After the snapshot lands the view re-renders the model and re-fetches
`jarvis/mmwave_overview` (below). Switching to another view stops nothing; the shell keeps one
global poll.

### 2.2 `jarvis/mmwave_overview` — live per-room presence breakdown

**Request**: `{ "type": "jarvis/mmwave_overview" }` — no other keys.

**Response** (`connection.send_result`):

```ts
interface MmwaveOverview {
  rooms: Array<{
    area_id: string;
    name: string;              // area friendly name
    outdoor: boolean;          // name matches yard/garden/driveway/patio/deck/porch/pool/outdoor/outside/exterior/lawn
    sensor_count: number;      // presence/motion/occupancy binary_sensors in the area (excluded + JARVIS mirrors + non-person detectors skipped)
    detecting_count: number;   // of those, how many are "on"
    state: "detecting" | "clear";
    freshest: string;          // _format_duration of the most recent last_changed among its sensors; "—" if none
    sensors: Array<{
      entity_id: string;
      name: string;            // friendly_name or entity_id
      detecting: boolean;
      age: string;             // _format_duration(now - last_changed)
    }>;
  }>;                          // sorted: detecting rooms first, then name (case-insensitive)
  summary: {
    rooms_with_mmwave: number; // rooms.length
    rooms_detecting: number;
    total_sensors: number;
  };
}
```

Only areas that have at least one presence sensor appear; an area with capabilities but no
presence sensor is omitted. Error: `send_error(id, "mmwave_overview_failed", str(exc))`.

**When fetched**: on view mount and after every snapshot poll while the residence route is
active (i.e. ~every 20 s). Its result feeds BOTH the list card and the model's `lit` map
(`detecting_count > 0` → `'mmwave'` state, see §3.4), so re-render the model after it lands.

### 2.3 `jarvis/update_config` — write one setting

**Request**:
```python
{
  vol.Required("type"): "jarvis/update_config",
  vol.Required("key"): str,
  vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None),
}
```
**Response**: `{ "key": string, "value": <echo of value> }`.
Errors: `invalid_key` (key not in `PANEL_WRITABLE_KEYS`), `no_entry`, `no_data`, `update_failed`.
The write goes to `runtime_config` + `jarvis_config.set_many`; it does **not** reload the entry;
it nudges the snapshot coordinator so the next `get_panel_data` reflects it.

**Keys written by this view**: exactly one —

| key | kind | value sent | note |
|---|---|---|---|
| `residence_style` | str | one of the 10 style ids (§3.2) | written when the Home Style select changes |

(The old tab also wrote `door_mapping` as a JSON **string** of `{slot: entity_id}`; that editor
now lives in the floor-plan editor's Doors tab, which writes a dict (editor.md §2.2). Every other home
key — stories, dormers, bays, chimney, basement, bedrooms, bathrooms, sq ft — is written from the
Settings view or the editor's House section, not here; this view only READS them.)

### 2.4 Client-side HA state used directly (no WS command)

* `hass.states[entity_id].state` for:
  * every `floor_plan_elements[*][].entity` → `open = state === "on" || state === "open"`;
  * per-bay garage doors: for bay `i` in `1..garage_bays`, entity =
    `door_mapping["garage_" + i]` or, for bay 1 only, `door_mapping["garage"]`; same open test.
    (These `garage_N` slots are NOT understood by the backend's `door_state` — bay state is
    purely client-side.)
* `hass.config.location_name`, `hass.config.latitude`, `hass.config.longitude` for the
  PROPERTY banner.
* `hass.language` for i18n (shared mechanism).

### 2.5 Services

The old residence tab calls **no** `hass.callService`. (The `light.turn_on/off` calls in the
old file belong to the dashboard's area tiles.)

---

## 3. Renderer contract (JARVIS3D)

### 3.1 Obtain the geometry module

`JARVIS3D` is a self-contained pure-function IIFE with **no DOM, no `this`, no HA access**:
old file lines **44–1147** (`const JARVIS3D = (function () {` … `})();`). It is ~1100 lines of
projection + face-building geometry that cannot be re-specified in prose, so the view agent
copies it mechanically, e.g.

```sh
sed -n '44,1147p' custom_components/jarvis/frontend/jarvis-panel.js > frontend/src/lib/jarvis3d.js
```

then appends `export default JARVIS3D;` (or converts the trailing `return {...}` object into
named exports) and applies the modifications in §3.5. Keep geometry byte-for-byte otherwise;
there is a sibling Node/cairosvg verification path that relies on it. Do NOT port the panel's
DOM glue — that is re-written in Lit per this spec.

Public API after the copy:

```ts
JARVIS3D.renderSVG(opts: RenderOpts): string;          // full <svg ...>...</svg> markup
JARVIS3D.fixedBox(opts: Omit<RenderOpts,'theta'|'lit'|'doors'|'box'>): [x, y, w, h];  // stable viewBox over all rotations (15° steps)
JARVIS3D.build(opts): { faces, glow, labels };          // internal; not needed by the view
JARVIS3D.project(point, thetaDeg): [sx, sy];
JARVIS3D.dims: { GW: 30, HW: 33, D: 24, WALL: 9, RIDGE: 20 };

interface RenderOpts {
  theta: number;               // azimuth in degrees; default 35 ("ISO" hero angle)
  floor: 'all' | '1f' | '2f' | 'b';   // NOTE: 'b' not 'bsmt' (view maps bsmt -> b)
  lit: Record<string, 'on' | 'mmwave' | 'dom'>;   // key = room/area name LOWERCASED
  doors: Record<string, 'open' | 'closed'>;       // the snapshot's `doors` (legacy hardcoded path only)
  box: [x, y, w, h] | undefined;                  // from fixedBox(); undefined => auto-fit this frame
  spec: HouseSpec;
  plan: PlanFeet;              // when present the model is built from the plan (ALWAYS the case in this view)
  elements: ElementsFeet;
  garage: Array<{ open: boolean }>;               // one entry per bay, index = bay-1
  palette?: Palette;           // NEW (§3.5) — theme colours
}

interface HouseSpec {
  roof: 'gable' | 'gambrel' | 'hip' | 'flat';
  stories: number;             // Number(config.home_stories) ; default 1.5
  pitch: number;               // roof-rise scale; from the style table
  dormersFront: number;        // config.dormers_front if set, else style default
  dormersRear: number;
  garageBays?: number;         // only when config.garage_bays is set
  chimney?: 'right' | 'left' | 'center' | 'none';   // config.chimney_side when set
  chimneyCount: number;        // clamp(1..4, Number(config.chimney_count) || 1)
  basementEntrance: 'bulkhead' | 'interior';        // config.basement_entrance || 'bulkhead'
}

// plan converted to FEET (0.2 ft per editor unit), rooms of type 'outdoor' dropped
type PlanFeet = Record<'1f'|'2f'|'bsmt'|string, Array<{
  name: string;                // lowercased
  label: string;               // UPPERCASED (drawn on floor views)
  x: number; y: number; w: number; d: number;   // feet (d = depth, from editor h)
  type?: string;
  points?: Array<[number, number]>;             // feet
}>>;

type ElementsFeet = Record<string, Array<{
  type: 'window'|'door'|'dormer'; kind?: string; wall?: string; room?: string; slope?: string;
  pos: number;                 // default 0.5
  w: number;                   // feet = (e.w || 20) * 0.2
  open: boolean;               // resolved from hass.states[e.entity]
}>>;
```

### 3.2 Home style table (view-side, drives `spec`)

| id | label | roof | pitch | dormersFront | dormersRear |
|---|---|---|---|---|---|
| `cape_cod` | Cape Cod | gable | 1.0 | 2 | 1 |
| `colonial` | Colonial | gable | 0.7 | 0 | 0 |
| `dutch_colonial` | Dutch Colonial | gambrel | 0.6 | 2 | 1 |
| `ranch` | Ranch | hip | 0.5 | 0 | 0 |
| `two_story` | Two-Story | gable | 0.65 | 0 | 0 |
| `craftsman` | Craftsman | hip | 0.6 | 1 | 0 |
| `modern` | Modern | flat | 0.12 | 0 | 0 |
| `townhouse` | Townhouse | gable | 0.85 | 0 | 0 |
| `apartment` | Apartment | flat | 0.12 | 0 | 0 |
| `cabin` | Cabin | gable | 1.25 | 2 | 1 |

Unknown / empty `residence_style` → treat as `cape_cod`. The table above is the only source
of roof/pitch/dormer defaults — the backend catalogue types `residence_style` as a plain `str`
(no `options`), so the new Phase 2 `jarvis/config_schema` command (used by the Settings view)
does **not** enumerate these ids; keep the table in the frontend. `spec` building rule (old
`_houseSpec`): `num(v) = (v === '' || v == null) ? null : Number(v)`; `dormersFront =
num(config.dormers_front) ?? style.dormersFront` (same for rear); `garageBays` set only when
`num(config.garage_bays) != null`; `chimney` set only when `config.chimney_side` truthy.

### 3.3 Plan preparation (view-side)

1. `floor_plan_rooms`: accept dict OR JSON string (parse; on failure or empty object use the
   **default plan** below). Old `_getFloorPlan` logic.
2. Convert to feet: `FT = 0.2`; `x,y,w,d(h) *= FT`; `points` likewise; drop `type === 'outdoor'`
   rooms; `name` lowercased, `label` uppercased.
3. **Snap** nearly-touching edges per floor so exterior walls render seamless: cluster all
   x-coordinates (and separately y) within tolerance **1.0 ft** to their cluster mean, then
   re-derive `x,w,y,d` (and `points`). Skip floors with < 2 rooms. (Old `_snapFeet/_snapMap`.)
4. `floor_plan_elements`: accept dict or JSON string; convert as `ElementsFeet` above.
5. Garage bays: `bays = clamp(Number(config.garage_bays) || 0, 0, 8)`; build `garage[]` per §2.4.
6. The `fixedBox` is expensive (builds the model 24×): cache it keyed on
   `floor + JSON(spec) + JSON(plan) + JSON(elements) + JSON(garage)` and recompute only when the
   key changes. `renderSVG` itself is cheap enough to run on every drag frame (rAF-throttled).

**Default plan** (used when no `floor_plan_rooms` is configured — it is the original author's
home; keep it as the demo/fallback and show the empty-state hint of §5):

```json
{
  "1f": { "label": "1st Floor", "rooms": [
    {"name":"Garage","x":5,"y":5,"w":100,"h":88,"type":"room"},
    {"name":"Kitchen","x":115,"y":5,"w":65,"h":40,"type":"room"},
    {"name":"Bath","x":185,"y":5,"w":28,"h":22,"type":"bath"},
    {"name":"Guest Room","x":218,"y":5,"w":95,"h":40,"type":"room"},
    {"name":"Dining Room","x":115,"y":50,"w":65,"h":38,"type":"room"},
    {"name":"Stairs","x":185,"y":32,"w":28,"h":32,"type":"stairs"},
    {"name":"Living Room","x":218,"y":50,"w":95,"h":38,"type":"room"},
    {"name":"Downstairs Hallway","x":115,"y":93,"w":198,"h":20,"type":"room"},
    {"name":"Front Door","x":185,"y":117,"w":50,"h":12,"type":"door"} ] },
  "2f": { "label": "2nd Floor", "rooms": [
    {"name":"Eliana's Room","x":50,"y":25,"w":95,"h":80,"type":"room"},
    {"name":"Bath","x":150,"y":25,"w":30,"h":40,"type":"bath"},
    {"name":"Master Bedroom","x":185,"y":25,"w":85,"h":80,"type":"room"},
    {"name":"Upstairs Hallway","x":150,"y":70,"w":30,"h":35,"type":"room"},
    {"name":"Stairs","x":150,"y":108,"w":25,"h":20,"type":"stairs"} ] },
  "bsmt": { "label": "Basement", "rooms": [
    {"name":"Basement","x":50,"y":10,"w":220,"h":90,"type":"room"},
    {"name":"Stairs","x":120,"y":20,"w":28,"h":35,"type":"stairs"} ] }
}
```

### 3.4 Lit map (view-side, old `_house3dLit`)

```
lit = {}
for a in snapshot.areas:      if a.active                -> lit[a.name.toLowerCase()] = 'on'
for r in mmwave.rooms:        if r.detecting_count > 0   -> lit[r.name.toLowerCase()] = 'mmwave'   (overrides 'on')
if snapshot.dominant.name && dominant.area_id            -> lit[dominant.name.toLowerCase()] = 'dom'  (wins)
```
Room lighting works by **name equality** (plan room name ⇔ HA area name, case-insensitive). In
the whole-house (`all`) view windows light from the room they front (`'dom'` > `'on'`; `'mmwave'`
is treated as `'on'` there); in floor views each room is a translucent labelled box with a
pulsing dot when occupied, and `mmwave` gets the strongest stroke.
Note: the old code guarded only on `dominant.name`, so when nobody is home it set
`lit["away"]='dom'` harmlessly; the new code should additionally require `area_id != null`.

### 3.5 Required modifications to the copied module

1. **Palette injection.** Replace the hard-coded dark-cyan palette with a `palette` object
   passed in `RenderOpts` (fallback to the old literals when absent so the Node verification
   path still works). Every literal colour in L44–1147 and its role:

   | role (new palette key) | old literals (replace all occurrences) |
   |---|---|
   | `wallFill` / `wallStroke` | `C.wallF rgba(22,46,66,0.34)`, `C.wallS rgba(0,242,254,0.5)` |
   | `wallFillDark` / `wallStrokeDark` | `C.wallDk rgba(14,32,48,0.40)`, `C.wallSdk rgba(0,242,254,0.34)` |
   | `roofFill` / `roofStroke` | `C.roofF rgba(10,24,36,0.94)`, `C.roofS rgba(0,206,247,0.5)` |
   | `roofFillDark` / `roofStrokeDark` | `C.roofDk rgba(6,17,27,0.96)`, `C.roofSdk rgba(0,206,247,0.3)` |
   | `gableFill` / `gableStroke` | `C.gableF rgba(18,38,56,0.6)`, `C.gableS rgba(0,242,254,0.46)` |
   | `chimneyFill` / `chimneyStroke` | `C.chimF rgba(13,28,42,0.97)`, `C.chimS rgba(0,242,254,0.42)` |
   | `solidDark` (dormer/chimney/bulkhead bodies) | `rgba(8,19,29,0.97)`, `rgba(8,19,29,0.92)`, `rgba(14,30,44,0.96)`, `rgba(14,30,44,0.97)`, `rgba(9,22,34,0.94)`, `rgba(11,26,38,0.95)` |
   | `voidDark` (door hole / opening) | `rgba(2,8,14,0.92)`, `rgba(2,8,14,0.95)` |
   | `doorOff` / `doorOn` / `doorStroke` | `C.doorOff rgba(0,242,254,0.10)`, `C.doorOn rgba(0,242,254,0.30)`, `C.doorS rgba(0,242,254,0.6)`, interior door fill `rgba(0,242,254,0.14)` |
   | `doorOpen` / `doorOpenStroke` / `doorOpenGlow` (AMBER = open) | `C.doorOpen rgba(255,170,40,0.32)`, `C.doorOpenS rgba(255,190,72,0.95)`, `C.doorOpenGlow rgba(255,170,40,0.42)`, garage rolled-up `rgba(255,170,40,0.12)` |
   | `winOff` / `winOn` / `winDom` | `C.winOff rgba(0,242,254,0.07)`, `C.winOn rgba(0,242,254,0.72)`, `C.winDom rgba(0,245,160,0.82)` |
   | `glassOff` / `glassOn` / `glassDom` | `C.glassOff rgba(0,242,254,0.32)`, `C.glassOn rgba(120,240,255,0.92)`, `C.glassDom rgba(150,255,210,0.95)` |
   | `edge` / `dim` / `faint` | `C.edge rgba(0,242,254,0.5)`, `C.dim rgba(0,242,254,0.26)`, `C.faint rgba(0,242,254,0.13)`, context lines `rgba(0,242,254,0.13|0.10|0.16)`, chimney cap `rgba(0,242,254,0.08)` |
   | `glowOn` / `glowDom` | `C.glowOn rgba(0,242,254,0.5)`, `C.glowDom rgba(0,245,160,0.55)` |
   | `casedFill` / `casedStroke` | `rgba(70,120,150,0.12)`, `rgba(120,185,215,0.8)` |
   | room box: `roomFill{Off,On,Mmwave,Dom}` | `rgba(0,242,254,0.035)`, `rgba(0,242,254,0.13)`, `rgba(30,255,180,0.22)`, `rgba(0,245,160,0.15)` |
   | room box: `roomStroke{Off,On,Mmwave,Dom}` | `rgba(0,242,254,0.24)`, `rgba(0,242,254,0.62)`, `rgba(70,255,195,1)`, `rgba(130,255,205,0.9)` |
   | room box: `roomWall{Off,On,Mmwave,Dom}` | `rgba(0,242,254,0.018)`, `rgba(0,242,254,0.05)`, `rgba(20,255,170,0.1)`, `rgba(0,245,160,0.06)` |
   | labels: `dot{On,Mmwave,Dom}` | `#7af0ff`, `#5affbe`, `#7dffcd` |
   | labels: `text{Off,On,Mmwave,Dom}` | `rgba(120,200,225,0.5)`, `#7af0ff`, `#8fffd4`, `#9effd0` |
   | labels: `textHalo` | `#04080c` (paint-order stroke behind label text) |
   | scene: `bgGlow`, `shadow` | `<radialGradient id="bg3">` stops `rgba(0,60,90,0.20)`→transparent; `id="sh3"` `rgba(0,0,0,0.55)`→transparent |

   Derive the palette in the view from HA tokens read with
   `getComputedStyle(this)` (the panel host element inherits HA's theme variables):
   `--primary-color` (occupied / 'on' accent), `--accent-color` or `--success-color`
   (mmWave / dominant accent — use `--state-active-color` if present), `--warning-color`
   (open doors, keep amber semantics), `--primary-text-color` (labels on), `--secondary-text-color`
   (labels off / dim), `--divider-color` (edges / faint lines), `--card-background-color`
   (text halo, void), `--secondary-background-color` (solid masses). Build rgba variants by
   parsing the token to RGB and applying the SAME alpha values as the old literals (the alphas
   are what make walls translucent and glass readable). Fallbacks when a token is empty: the
   HA defaults (`#03a9f4`, `#ff9800`, `#212121`, `#727272`, `rgba(0,0,0,.12)`, `#fff`, `#e5e5e5`).
   Recompute the palette on every render (it's a handful of `getPropertyValue` calls) or cache
   it keyed on the joined token string — HA fires no DOM event on theme change, but the `hass`
   property is re-set (new `hass.themes` / `hass.selectedTheme`), which already triggers a
   Lit update. Also re-render on `matchMedia('(prefers-color-scheme: dark)')` change.

2. **SVG `id`s.** `g3`, `bg3`, `sh3` are global in the document; prefix them per render or
   per host instance (e.g. `j3d-<uid>-g3`) so two models on one page (future) do not clash.
3. **Fonts.** Label `font-family="JetBrains Mono, ui-monospace, monospace"` → a system stack:
   `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. No webfont load.
4. **`<animate>`** occupancy pulse on dots may stay (SVG SMIL) but must respect
   `prefers-reduced-motion` — omit the `<animate>` child when that media query matches.
5. **Dead code (optional cleanup).** The non-plan path (`ROOMS`, `BSMT_ITEMS`, `buildShell`,
   `chimney`, `garageDoors`, `dormerFront`, `dormerRearRound`, `bulkhead`, `buildRooms`,
   `buildContext`, `winY/winX/doorY` default-house callers in `build()`) is never reached
   because this view always passes `plan`. It may be deleted; if kept it must also use the
   palette. `opts.doors` is only consumed by that legacy path — still pass `snapshot.doors` so
   behaviour is identical if the path is kept.

### 3.6 Rendering semantics the view relies on (so the UI copy is accurate)

* `floor: 'all'` → clean exterior shell: exterior walls from the 1f footprint polygon, roof per
  `spec.roof` (gable per rectangular mass for L/T footprints; low 0.20-pitch gable over the
  garage when a room named `*garage*` exists and roof is gable/gambrel), dormers lit by the 2f
  room under them, windows from placed `elements` (or one auto window per exterior-facing room
  wall when none are placed), garage doors (count = `spec.garageBays`, default 3) amber when the
  bay is open, exterior doors / cellar bulkhead amber when open, chimney(s) per spec, auto
  bulkhead only when `basement_entrance !== 'interior'`, nothing is placed, and a `bsmt` floor
  exists.
* `floor: '1f'|'2f'|'b'` → that floor's rooms as translucent labelled boxes/prisms at
  `FLOOR_Z = {1f:[0.4,8.6], 2f:[9.0,13.8], b:[-7,-0.6]}` ft, with interior doors (`kind
  'interior'`, swings open when `open`), cased openings, interior windows and french/balcony
  doors from `elements[floor]`; occupied rooms get a pulsing dot.
* Theta: `0` FRONT, `90` RIGHT, `180` REAR, `270` LEFT, `35` ISO (default). Drag: `theta -=
  dx * 0.5` degrees per pixel; wrap is unnecessary (trig).

---

## 4. Layout

Two cards, stacked on mobile, side-by-side on wide screens (old: `.res-main` full width with
the mmWave card below it; the CSS comment says "side by side" but `.res-tab {display:block}`
stacks them — choose: ≥1280 px two columns `minmax(0,1.6fr) minmax(0,1fr)`, else one column).

### Card A — "Residence Overview" (primary; first on mobile)

1. **Header**: title `Residence Overview`; right-side chip `{occupied}/{total} OCCUPIED` (`ok` when
   any area is occupied, else neutral; the old panel's decorative `PRESENCE` chip is not used).
2. **Controls row** (wraps; stacks full-width on mobile):
   * `Home Style` — `<ha-select>`/native select of the 10 styles (§3.2), current =
     `config.residence_style`.
   * **Floor pills** (segmented buttons): `All`, `1st Floor`, then `2nd Floor` only when
     `String(config.home_stories ?? '1.5') !== '1'`, then `Basement` only when
     `config.has_basement !== false`. Default `All`. Keep the selection in view state only (not
     persisted).
   * **View presets**: `Front` (0°), `Right` (90°), `Rear` (180°), `Left` (270°), `Iso` (35°),
     plus hint text `drag to rotate`. Active preset highlighted; dragging clears the highlight.
   * **Edit floor plan** button → `/jarvis/residence/editor` (A6).
3. **Scene**: the SVG, `height: 560px` desktop / `340px` ≤ 768 px, `cursor: grab`
   (`grabbing` while dragging), `touch-action: pan-y` so vertical touch drags scroll the page
   and horizontal ones rotate (old code classified the gesture axis after 6 px of movement; with
   `touch-action: pan-y` the browser does it). Overlays, pointer-events none:
   * top-left banner: `PROPERTY · {location}` where location = `hass.config.location_name` ||
     `"{lat.toFixed(4)}, {lon.toFixed(4)}"` || `LOCATION NOT SET`. (Second line
     `SATELLITE + ARCHITECTURAL DATA MERGE` is HUD flavour — drop it.)
   * top-right stat strip (4 items; on ≤768 px hide STYLE, on ≤380 px hide EST SQ FT too):
     * `EST SQ FT` → `config.floor_plan_sqft` if truthy → `~{toLocaleString()}`; else estimate
       from the plan: sum over all floors of `w*h` for rooms whose `type` is not
       `door`/`stairs`, `sqft = clamp(600, 5000, round(sum * 0.032 / 50) * 50)`, shown as
       `~1,850`; `—` if nothing.
     * `BED / BATH` → beds = `config.home_bedrooms` if not `''`/null, else count of
       `areas[].bedroom`, else `meta.bedrooms`; baths = `config.home_bathrooms` if set, else
       count of areas whose name matches `/bath/i`; render `"{beds} / {baths || '—'}"`.
     * `STYLE` → style label uppercased.
     * `OCCUPIED` → `"{areas.filter(a=>a.active).length} / {areas.length}"`.
4. **Dominant room strip** (below the scene, top border): left `dominant.name` (large) and
   `dominant.subtitle`; right three radial gauges (old `_domGauges`):
   * Temp — value `dominant.temp`, fraction `(parseFloat(temp) - 50) / 40` clamped 0..1,
     hue `210 - f*190` (cool→warm) — in the new palette use `--primary-color`→`--warning-color`
     interpolation or just the primary colour;
   * Humidity — fraction `parseFloat(humidity)/100`;
   * Lights — ON when `/on|^[1-9]/i.test(dominant.lights)`, label `ON`/`OFF`, dimmed when off.
   Values `—` render as empty arcs.

### Card B — "mmWave Presence"

* Header: `mmWave Presence`; right chip = `"{rooms_detecting}/{rooms_with_mmwave} OCCUPIED"`
  when `rooms_with_mmwave > 0`, else `NONE`; while loading `SCAN`.
* Sub-text: `Live occupancy per room from presence / motion / mmWave sensors — the ground
  truth behind the floor-plan glow.`
* Grid of room rows (`repeat(auto-fill, minmax(220px, 1fr))`), each: status dot (pulsing,
  success colour when `detecting_count > 0`), name (+ small `OUT` badge when `outdoor`), meta
  line `"{OCCUPIED|clear} · {sensorLine} · {now|freshest}"` where `sensorLine =
  sensor_count > 1 ? "{detecting_count}/{sensor_count} sensors" : "{sensor_count} sensor"`.
  Optional enhancement: expand a row to list `sensors[]` (`name`, `detecting`, `age`) — the
  payload already carries it (unused by the old panel).

Mobile (≤768 px) priorities: Card A controls stack; floor pills get ≥ 8 px × 14 px padding;
the scene is 340 px tall; the stats strip shrinks as above; Card B follows below.

---

## 5. Actions

| # | Trigger | Effect | Command / service | Confirm? | Feedback |
|---|---|---|---|---|---|
| A1 | Change **Home Style** select | optimistic: patch local `config.residence_style`, invalidate fixedBox cache, re-render model; then persist | `jarvis/update_config {key:"residence_style", value:<id>}` | no | success toast `Home style → {label}`; on error toast `✗ residence_style — {message}` and revert the select to the snapshot value |
| A2 | Click a **floor pill** | set view-state floor (`bsmt`→`'b'` for the renderer), re-render model | none | no | pill becomes active; model redraws |
| A3 | Click a **view preset** | set theta, re-render | none | no | preset active |
| A4 | **Drag** horizontally on the scene (mouse / touch / pointer) | `theta -= dx * 0.5` per move, rAF-throttled re-render | none | no | cursor grabbing; presets de-highlight |
| A5 | Snapshot poll lands (every 20 s) | rebuild lit map, doors, garage, annotations, re-render; then fetch `jarvis/mmwave_overview` | `jarvis/get_panel_data` (shared), `jarvis/mmwave_overview` | — | silent |
| A6 | Click the **Edit floor plan** button (controls row) | open the in-panel editor | `navigate("residence", "editor")` → `/jarvis/residence/editor` (editor.md) | no | — |
| A7 | Click the **Import a floor plan** link (no-floor-plan hint only) | open the docs | `https://github.com/sam3gp8/jarvis-aio/blob/main/docs/floor-plan-import.md` in a new tab (`rel="noopener noreferrer"`) | no | — |

No destructive actions; nothing needs a confirmation dialog.

---

## 6. States

| State | Where | Rendering |
|---|---|---|
| **Loading (first snapshot)** | whole view | card skeletons; scene area shows a neutral placeholder (no model until `config` is known — the old panel rendered mock data; do not). |
| **Loading mmWave** | Card B list | single row `Reading sensors…`; chip `SCAN`. |
| **mmWave empty** (`rooms.length === 0`) | Card B list | `No presence, motion, or mmWave sensors found. Assign occupancy sensors to areas in Home Assistant and they'll appear here.`; chip `NONE`. |
| **mmWave error** (WS rejected) | Card B list | `Couldn't read sensors — restart Home Assistant after updating, then reopen.` + a `Retry` button; keep last good `rooms` for the lit map if any. |
| **No floor plan configured** (`floor_plan_rooms` empty/invalid) | Card A | render the default plan AND show an inline hint under the scene: `No floor plan yet — the model shows a sample home. Import your plan to see your rooms.` with the docs link (A7); the Edit floor plan button (A6) is always there. |
| **No presence anywhere** (`dominant.area_id === null`) | dominant strip | name `AWAY` / `AT HOME` as sent, subtitle `no presence detected`, gauges empty (`—`). |
| **Snapshot error** | whole view | keep the last model; the **shell** shows its error alert ("Could not load JARVIS data" + message + Retry) above the view. The view renders no banner of its own. |
| **Disabled controls** | Home Style select | disabled while an `update_config` is in flight; re-enabled on settle. |
| **Narrow** | layout | per §4 mobile rules; floor pills wrap. |
| **Reduced motion** | SVG dots, mmWave dot pulse | no `<animate>` / no CSS pulse when `prefers-reduced-motion: reduce`. |

---

## 7. Strings

All user-visible English strings; `t(key)` falls back to the key. Column "de.json" shows whether
`custom_components/jarvis/frontend/i18n/de.json` already has an entry (fr/es checked where
noted). Keep the EXACT English text for keys marked present so existing translations apply.

| English (t() key) | de.json | note |
|---|---|---|
| `Residence` | ✓ (Zuhause; fr Résidence; es Residencia) | nav/tab label |
| `Residence Overview` | ✓ | Card A title |
| `HOME STYLE` | ✓ (HAUSSTIL; fr/es ✓) | old label was uppercase; keep this key (render with CSS `text-transform` if a non-caps look is wanted) |
| `All` | ✓ (fr Tout, es Todo) | floor pill |
| `1st Floor` | ✗ | floor pill |
| `2nd Floor` | ✗ | floor pill |
| `Basement` | ✓ (fr/es ✓) | floor pill |
| `FRONT`, `RIGHT`, `REAR`, `LEFT`, `ISO` | ✗ | view presets |
| `drag to rotate` | ✗ | visible hint (`aria-hidden`) |
| `Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.` | ✗ | visually-hidden description of the scene (`aria-describedby`), so keyboard users learn about ArrowLeft / ArrowRight / Home |
| `Loading...` | ✓ | first-snapshot card state — three ASCII dots, the existing key |
| `PROPERTY` | ✗ | banner prefix |
| `ADDRESS NOT SET` | ✓ (fr/es ✓) | old key; the old code actually printed `LOCATION NOT SET` (untranslated). Use `ADDRESS NOT SET` so the translation hits |
| `EST SQ FT` | ✗ | stat label |
| `BED / BATH` | ✓ (fr/es ✓) | stat label |
| `STYLE` | ✗ | stat label |
| `OCCUPIED` | ✓ (Belegt; fr/es ✓) | stat label, mmWave meta, chip |
| `Temp` | ✗ | gauge label |
| `Humidity` | ✓ (fr/es ✓) | gauge label |
| `Lights` | ✓ (fr/es ✓) | gauge label |
| `ON` / `OFF` | ✓ (fr/es ✓) | gauge value |
| `mmWave Presence` | ✗ | Card B title |
| `Live occupancy per room from presence / motion / mmWave sensors — the ground truth behind the floor-plan glow.` | ✗ | Card B sub-text |
| `Reading sensors…` | ✗ | loading |
| `No presence, motion, or mmWave sensors found. Assign occupancy sensors to areas in Home Assistant and they'll appear here.` | ✗ | empty |
| `Couldn't read sensors — restart Home Assistant after updating, then reopen.` | ✗ | error |
| `Retry` | ✗ | new |
| `NONE` | ✗ | chip when no rooms |
| `SCAN` | ✗ | chip while loading |
| `clear` | ✗ | mmWave meta |
| `now` | ✗ | mmWave meta |
| `OUT` | ✗ | outdoor badge (old text `▲ OUT`; drop the glyph) |
| `{n} sensor` / `{n}/{m} sensors` | ✗ | compose: t(`sensor`) / t(`sensors`) — "sensor"/"sensors" alone are absent in de.json too |
| `Home style → {label}` | ✗ | toast (old had `◉ ` prefix — drop) |
| `Cape Cod`, `Colonial`, `Dutch Colonial`, `Ranch`, `Two-Story`, `Craftsman`, `Modern`, `Townhouse`, `Apartment`, `Cabin` | ✗ | style labels |
| `AWAY`, `AT HOME`, `no presence detected`, `Occupied` | ✗ | come from the BACKEND in English (`dominant.name/subtitle`) — pass through `t()` anyway; `Occupied · 14m` will not match and stays English |
| `No floor plan yet — the model shows a sample home. Import your plan to see your rooms.` | ✗ | new empty-state |
| `Import a floor plan` | ✗ | new link text (de.json has `Floor Plan Editor` → Grundriss-Editor, the editor's own title) |
| `Edit floor plan` | ✗ | button in the controls row (A6) |

Since Phase 3 every key is translated in all 22 language files (`frontend/i18n-missing.json`); the
de.json column records the state before the port.

Related de.json keys that exist and may be reused by the Settings/Phase 3 work (not this view):
`Floor Plan Editor`, `No floor data`, `Bedrooms`, `Bathrooms`, `Garage bays`, `Presence`,
`Cellar Door`, `Exterior Door`, `Interior Door`, `Save Layout`, `Add Room`.

---

## 8. Dropped to Phase 3 (not ported now)

| Old feature | Why dropped |
|---|---|
| **Floor-plan EDITOR** (Settings › Floor Plan: room drawing, resize/drag, polygon rooms, units toggle, background image + opacity, property boundary, import/export JSON, SweetHome3D import, live 3D preview `#fp-3d-preview`) | large, writes `floor_plan_rooms/_elements/_cameras/_entities/_property/_bg/_bg_opacity/_units` — **ported in Phase 3** as `/jarvis/residence/editor` (editor.md), reached from this view's Edit floor plan button. |
| **Door mapping grid** (`DOORS · map to your entities`, slots Front Door / Garage Door N / Garage Side / Rear / Kitchen ↔ Garage / Cellar / Bulkhead / Basement, `jarvis/update_config door_mapping=<JSON string>`) | config editor, not a status view; auto-detection still works without it (backend `door_state.classify`). Ported in Phase 3 as the editor's Doors tab. |
| **Openings editor** (`+ Window / + Interior Window / + Exterior Door / + Balcony Door / + Cellar Door / + Interior Door / + Cased Opening / dormers`, per-element wall/pos/width/entity) | part of the editor (its Openings tab); this view only RENDERS saved `floor_plan_elements`. |
| **Camera placement** (`floor_plan_cameras`) and **entity pins** (`floor_plan_entities`, `_entMarkerStyle` live-state pins) | editor features (its Cameras & pins tab); the 3D model never drew them. |
| Leader-line callouts (`#res-callouts`) | already retired in the old code (always cleared). |
| HUD flavour: `SATELLITE + ARCHITECTURAL DATA MERGE` subtitle, `◉`/`▲` glyphs, radar/scanline backgrounds, cyan glow text-shadows | design mandate: modern HA-themed UI. |
| Mock data fallback (`_mockData()` with the author's rooms) when WS has not answered | new view shows loading skeletons instead. |

---

## 9. Risks / ambiguities

1. **`floor_plan_rooms` type.** `_get_runtime_json` returns a parsed dict normally, but when the
   persisted value is a string that fails `json.loads` it returns the raw string (step 2) —
   and the Settings editor writes it as a JSON **string**. Always accept `dict | string | ''`
   and parse defensively; fall back to the default plan on failure.
2. **Numeric config arrives untyped.** `home_stories`, `dormers_front/rear`, `garage_bays`,
   `chimney_count`, `home_bedrooms/bathrooms`, `floor_plan_sqft` are emitted via `_runtime_opt`
   without coercion: expect `""`, `"2"`, or `2` depending on who wrote them (panel select → str;
   native HA number entity → float). Use the `num()` rule in §3.2 everywhere.
3. **Floor pill visibility vs plan content.** `2nd Floor` is gated on `home_stories !== '1'`
   and `Basement` on `has_basement`, not on whether the plan actually has `2f`/`bsmt` rooms.
   Selecting an empty floor renders an empty scene (just the fixed box). Consider also hiding a
   pill when the plan has no rooms for that floor.
4. **Name-based lighting.** Rooms light only when the plan room name equals the HA area name
   (case-insensitive). Multiple rooms with the same name (two `Bath`) light together. Plan rooms
   with no matching area never light. Document this in the empty-state hint.
5. **`garage_N` slots are client-only.** `door_state.DOOR_SLOTS` has no `garage_1..4`, so the
   backend `doors.garage` reflects only the single `garage` slot / auto-detect; per-bay open
   state is computed in the browser from `door_mapping["garage_i"]`. Without a mapping no bay
   ever shows open in the plan path.
6. **Poll period discrepancy.** websocket.py's docstring says 5 s, the panel polls every 20 s
   (`_fetchInterval`). Use 20 s; `mmwave_overview` piggybacks on it.
7. **mmWave sort comment vs code.** The handler comment says "detecting first, then
   most-recently-active, then name"; the code sorts by `(detecting_count == 0, name.lower())`
   only. Do not rely on recency ordering.
8. **`dominant.name` collision.** When nobody is home `dominant.name` is `"AWAY"`/`"AT HOME"`
   and `area_id` is `null`; the old lit-map logic keyed on `name` regardless. Guard on
   `area_id`.
9. **`fixedBox` cost.** It builds the model 24 times; on a large polygonal plan this can take
   tens of ms. Cache per key (§3.3) and compute off the drag path.
10. **Theme tokens.** Lit's shadow DOM inherits CSS custom properties, so
    `getComputedStyle(this)` works for the panel element; but a palette must be re-derived when
    HA swaps theme (the `hass` property changes) — HA emits no DOM event. Some themes do not
    define `--state-active-color` / `--success-color`; always fall back.
11. **SVG `<animate>` + `innerHTML`.** The old code injected the SVG string via `innerHTML`.
    In Lit use `unsafeSVG`/`unsafeHTML` from `lit/directives` — the string is generated from
    our own geometry and plan names; still HTML-escape room `label`s before interpolation
    (old code did NOT escape them: a room named `<b>` would inject markup).
12. **Default plan is the original author's home** (Eliana's Room, Master Bedroom…). Keeping it
    as the sample is faithful to the old behaviour; the fork owner may prefer a neutral sample —
    flag for review.
13. **Sq-ft estimate magic numbers** (`* 0.032`, clamp 600–5000, round to 50) assume the
    0.2 ft/unit editor scale; they are heuristics, not measurements. Label the value with `~`.
14. **Admin gating test** (`tests/unit/test_admin_gating.py`) lists `jarvis/mmwave_overview` as
    read-only guarded; nothing here changes the backend, so no test updates are needed.
