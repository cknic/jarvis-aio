# Floor-plan editor — foundation API

`<jarvis-plan-editor>` is mounted by the Residence view at
`/jarvis/residence/editor[/<tab>]` (tabs: `rooms`, `openings`, `doors`, `pins`,
`import`; no tail = `rooms`). The spec is `frontend/specs/editor.md`; this file
is the contract between the foundation (this directory) and the three Build
agents who write the sub-tabs. Everything a tab needs is one of three objects:

| object | what it is | file |
|---|---|---|
| `store: EditorStore` | the working copy, history, dirty/save, floor/tab/selection, settings, toasts | `store.ts` |
| `canvas: JvPlanCanvas` | the SVG surface: layers, viewBox, pointer gestures, snapping, announcements | `canvas.ts` |
| the model | types, `parseDoc` / `serialize*`, units, ids, pickers, doc operations, small geometry | `model.ts` (+ `geometry.ts`) |

```
editor/
  model.ts      types + parse/serialize + units + ids + pickers + doc ops (pure)
  geometry.ts   markerRect, walls/gaps, ray cast, clipped cone, coverage, roomAt, coverageContext (pure)
  history.ts    History<T>: snapshot undo/redo with coalescing (pure)
  store.ts      EditorStore (observable; the only thing that talks to the backend)
  canvas.ts     <jv-plan-canvas>, Layer API, registerLayer(), built-in layers
  editor.ts     <jarvis-plan-editor>: header, banners, Plan card, tab host, 3D preview, toasts, shortcuts
  tab-base.ts   JarvisEditorTab - optional base class for tab elements
  tabs/index.ts the barrel: ADD `import "./rooms";` etc. here (one line per tab)
  selftest.ts   dev-only assertions (parse/serialize round trip ...), see its header for how to run
  i18n-keys.ts  literal t() calls for the label tables' strings (t(label) is invisible to npm run i18n:keys); not bundled
```

Rules that apply to everything in here: `frontend/DESIGN.md` (tokens only,
`t()` for every string, 44 px targets, feature-detect HA elements). The WS
contract test (`tests/unit/test_ws_contract.py`) greps every `"jarvis/..."`
literal in `src/**/*.ts`: only quote commands that `websocket.py` registers,
and rebuild the bundle before you finish (the test also checks the committed
bundle carries them).

---

## 1. Writing a tab

1. Create `tabs/<tab>.ts` defining the element the editor renders by tag name:

   | tab (route tail) | element | receives |
   |---|---|---|
   | `rooms` | `<jarvis-editor-rooms>` | `.store .canvas .hass .narrow` |
   | `openings` | `<jarvis-editor-openings>` | same |
   | `doors` | `<jarvis-editor-doors>` | same |
   | `pins` | `<jarvis-editor-pins>` | same |
   | `import` | `<jarvis-editor-import>` | same |

   `canvas` is `null` on the very first render and set right after the canvas
   mounts (the editor re-sets the property). `hass` is re-set on every HA
   state change - never cache it.

2. Add `import "./<tab>";` to `tabs/index.ts`. Until then the editor shows a
   placeholder for that tab.

3. Extend `JarvisEditorTab` (`tab-base.ts`) if you like: it declares the four
   properties, re-renders on every store change and gives you `this.floor`,
   `this.units`, `this.ctx()`.

4. Register your canvas layer(s) at module scope with `registerLayer()`
   (section 3). Layers live for the whole editor, not just while your tab is
   shown - rooms stay visible in every tab; use `ctx.mode` to show handles only
   in yours.

5. All plan mutation goes through `store.change()` (section 2). Never mutate
   `store.doc`.

6. Fixtures for the commands you call: `dev/fixtures/jarvis_floorplan_sources.json`,
   `jarvis_import_floorplan.json`, `jarvis_segment_floorplan_rooms.json`,
   `jarvis_set_floor_background.json`, `jarvis_compute_camera_coverage.json`
   exist already (editor.md §2.10).

A minimal tab:

```ts
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { JarvisEditorTab } from "../tab-base";
import { registerLayer, hitOf, LAYER_ORDER } from "../canvas";

registerLayer({ id: "cameras", order: LAYER_ORDER.cameras, hits: ["camera"], render(ctx) { /* svg`...` */ return nothing; } });

@customElement("jarvis-editor-pins")
export class JarvisEditorPins extends JarvisEditorTab {
  static override styles = [base, css`...`];
  override render() {
    const s = this.store!;
    return html`<button class="jv-btn" @click=${() => s.change(t("Add camera"), (d) => { ... })}>+ ${t("Camera")}</button>`;
  }
}
```

---

## 2. `EditorStore` (`store.ts`)

One instance per editor (`editor.store`). Plain observable: `subscribe(fn)`
calls `fn` (microtask-batched) after every change; `JarvisEditorTab` already
does `requestUpdate()` from it.

### Reads

| member | meaning |
|---|---|
| `doc: EditorDoc` | the working copy - **read only** |
| `floors`, `currentFloor`, `rooms(floor?)`, `openings(floor?)`, `cameras(floor?)`, `pins(floor?)` | convenience views on `doc` (default: the current floor); always arrays |
| `floor: FloorKey`, `tab: EditorTab`, `selection: Selection \| null` | shared UI state |
| `config` | `data.config` overlaid with in-flight optimistic setting values (read house keys, `garage_bays`, ... from here) |
| `settings: EditorSettings` | `{units, bg, bgOpacity, doorMapping}` parsed from `config` (`bg`: floor -> image; `mergeFloorBackground` in model.ts is the per-floor merge the backend does) |
| `data: PanelData \| null` | the latest snapshot (`data.areas`, `data.doors` ...) |
| `areaNames()` | room-name suggestions (areas with capabilities only - editor.md R9) |
| `floorLabel(key?)`, `floorHidden(key)` | label (pass through `t()`), "Hidden on the Residence tab" |
| `configured`, `warnings`, `loaded` | sample-home state, parse warnings |
| `dirty`, `dirtyKeys`, `saving`, `saveError`, `saveErrorCode`, `remoteChanged` | lifecycle state (section 4.8 of the spec) |
| `canUndo`, `canRedo`, `undoLabel`, `redoLabel`, `history` | undo state |
| `settingStatus[key]` | `{level: "saving" \| "saved" \| "error", message?}` per immediate-save key |
| `toasts` | rendered by the editor |
| `canvas` | the mounted `<jv-plan-canvas>` (null before it connects) |
| `hass`, `host` | set by the editor |
| `describeSelection()` | `{name, w?, h?}` for announcements |

### Mutating the plan (enters the history, marks dirty)

```ts
store.change(label, apply, opts?)            // label: English, e.g. t("Move {name}", {name}) - feeds the undo tooltip
store.changeWith(apply => string | null)     // apply returns the label, or null to abandon (nothing recorded)
store.undo() / store.redo()
store.nudgeSelection(dx, dy)                 // coalesced; openings move along their wall (pos); a pin on the CURRENT floor
store.removeSelection()                      // a room takes the openings anchored to its name; returns the label or null
store.select(sel | null); store.setFloor(key); store.setTab(tab)
```

`opts.transient: true` replaces the doc WITHOUT a history entry (drag frames);
the release calls `change()` once more without `transient` and that single
entry is what undo reverts. `opts.coalesce: "some-key"` merges into the
previous entry when it carries the same key and is younger than 800 ms
(arrow nudges, slider `input` frames).

`apply` receives a **clone**: mutate it freely with the model helpers
(`findRoom(doc, id)`, `listFor(doc.openings, floor)`, `ensureFloor(doc, key)`,
`translateRoom`, `syncBBox`, ...). Room identity is the client-only `room.id`
(never serialised); openings / cameras use their stored `id`; pins their `e`.
Create ids with `newRoomId()` / `newStoredId("e" | "c", existingIds)`.

### Persisting

```ts
await store.save()                 // sequential jarvis/update_config for each dirty plan key
                                   // (rooms, elements, cameras, entities, property); stops at the first
                                   // failure (that key and the rest stay dirty); -> {ok, results[], error?, code?};
                                   // dispatches jarvis-refresh when everything succeeded. The editor's
                                   // Save button / Ctrl+S / sticky bar call this - tabs normally don't.
await store.writeSetting(key, v)   // the IMMEDIATE-save keys: floor_plan_units, floor_plan_bg_opacity (number),
                                   // door_mapping (whole dict), the house keys of HOUSE_KEYS (see editor.md
                                   // §2.2 for the exact value types). Optimistic overlay in `config`, status
                                   // in settingStatus[key] (saving -> saved, auto-cleared; error -> reverted),
                                   // jarvis-refresh on success. Resolves true/false. Not part of the history.
await store.writeFloorBackground(floor, {image?, align?})
                                   // ONE floor of floor_plan_bg via jarvis/set_floor_background: image = a
                                   // data:image/ URL (null removes it), align = {x, y, w} (null removes it),
                                   // absent = kept. The backend merges only that floor. Same overlay / status
                                   // (settingStatus.floor_plan_bg) / refresh / true-false contract as
                                   // writeSetting; an error restores the previous overlay. Never write
                                   // floor_plan_bg whole through writeSetting.
store.discard(); store.adoptRemote(); store.dismissRemote(); store.clearSaveError(); store.refresh()
store.toast(message, {label, run}?)   // message already translated; e.g. toast(t("Removed {name}", {name}), {label: t("Undo"), run: () => store.undo()})
                                      // the action is dropped as soon as the history moves on (the editor's button calls
                                      // store.runToastAction(id)), so an "Undo" never reverts a later change
```

`writeSetting()`, `writeFloorBackground()` and `save()` refuse a message over
`WS_FRAME_LIMIT` (HA's websocket takes at most 4 MiB; a bigger frame drops the
connection) with an error status instead of sending it (`updateFrameBytes`,
`floorBackgroundFrameBytes`). `floor_plan_bg` is one dict for every floor
(`{"<floor>": "data:image/...", "_align": {"<floor>": {x, y, w}}}`) but it
travels one floor per message, so the limit is per image, not for all of them
together, and an alignment change sends no image at all. The Import tab
compresses an upload to what one message leaves (at most 1.5 MB), and a plan
file with several backgrounds writes them floor by floor, reporting the floors
that failed.

Pins are keyed by entity id and one entity may be pinned on several floors:
the model's `selectionExists` / `moveSelection` / `removeSelection` /
`describeSelection` take the floor (the store passes its current floor).
The floor list follows `home_stories` / `has_basement` even while the doc is
kept (`syncFloors`: synthesised empty floors are added / dropped; they never
serialise).

Snapshot sync is automatic (`editor.ts` calls `store.load(data)` on every
`data`): while clean the doc follows the snapshot; while dirty a differing
snapshot raises `remoteChanged` (banner Reload / Keep mine) and the local
doc is kept.

---

## 3. `<jv-plan-canvas>` and the Layer API (`canvas.ts`)

The canvas renders `[grid, background, ghost, …registered layers…, tool, overlay]`
sorted by `order`. Register yours once at module scope:

```ts
import { registerLayer, LAYER_ORDER, hitOf, pathOf, type Layer } from "../canvas";

export const roomsLayer: Layer = {
  id: "rooms",                    // "rooms" REPLACES the built-in basic rooms layer
  order: LAYER_ORDER.rooms,       // property 4, rooms 5, openings 6, cameras 7, pins 8
  hits: ["room", "vtx", "mid", "handle"],   // hit kinds this layer owns; add "*" to also get background events
  styles: css`...`,               // optional, adopted by the canvas (tokens only; lint + smoke check it)
  render(ctx) { return svg`...`; },
  onTap?(ev, ctx) { return true; }        // handled -> no default selection
  onDragStart?(ev, ctx) { return handler; } // or null -> the canvas pans
  onDoubleClick?(ev, ctx) {}, onContextMenu?(ev, ctx) {}, onKey?(e, ctx) {}
};
registerLayer(roomsLayer);
```

### Hits

Every interactive SVG element carries `data-hit="<kind>:<id>[:<sub>]"`
(`hitOf(kind, id, sub?)`), `tabindex="0"` and an `aria-label`. Kinds the
canvas understands by default (tap = select, Enter/Space = select, arrows =
`store.nudgeSelection`, Delete = `store.removeSelection` + toast with Undo):
`room`, `opening`, `camera`, `pin`, `vtx` (room polygon vertex, `sub` = index),
`prop-vtx` (lot vertex). Anything else (`handle`, `mid`, `prop-mid`, …) is
yours: handle it in `onTap` / `onDragStart`. `ctx.classes(hit)` gives
`"is-selected is-hover is-focus"` for the element's class list; the canvas
CSS draws `--jv-focus` on `.is-focus .shape` for the basic layer - style your
own classes in `styles`.

### `LayerContext` (passed to every callback)

`canvas`, `store`, `doc`, `floor`, `floorDef`, `rooms` (current floor),
`units`, `hass`, `selection`, `mode` (active tab id), `viewBox`, `pxPerUnit`
(CSS px per plan unit - divide a px size by it for a constant-size handle),
`hover`, `focus`, `snapEnabled`, `classes(hit)`, `isSelected(kind, id, sub?)`.

### Gestures

The canvas does `setPointerCapture`, a 4 CSS px drag threshold, tap vs drag,
middle-button / Space / background panning, wheel zoom (`Shift` pans,
`ctrlKey` = trackpad pinch), two-finger pinch (a second finger cancels an
object drag and restores the doc), 500 ms long-press = context menu,
`Esc`, `+ - 0`. `onDragStart` runs once the threshold is crossed and returns:

```ts
interface DragHandler {
  cursor?: string;                       // default "move"
  onMove(ev: CanvasDragEvent): void;     // ev.delta = plan delta since the press (unsnapped); ev.snap = Snapper
  onEnd(ev: CanvasDragEvent): void;      // commit here with a NON-transient store.change()
  onCancel?(): void;                     // the canvas already restored the pre-drag doc
}
```

Pattern (see `basicRoomsLayer` in canvas.ts for the full version): in
`onMove` apply a `store.change(label, apply, {transient: true})` and set
`ctx.canvas.tooltip = {x, y, text}`; in `onEnd` apply the same change without
`transient` and clear the tooltip; the canvas draws `ev.snap.guides` and
clears `guides` / `tooltip` after `onEnd`. `ev.snap.x(v)` / `.y(v)` /
`.point(p)` snap to the 5 u grid and other rooms' edges within 3 u (`Alt`
disables; `canvas.snapper({exclude: [roomId]})` to build your own). Round:
integers for rect rooms / cameras / pins / lot vertices, 1 decimal for
polygon vertices (`ri`, `r1` in model.ts).

Draw modes are **tools**: `canvas.setTool(layer)` installs a temporary
top-priority layer (`hits: ["*"]`) that gets taps / drags / keys first;
`canvas.band` (rubber band), `canvas.draft` (polygon in progress) and
`canvas.cursor` are drawn by the overlay; `canvas.setTool(null)` (or Esc)
ends it. `canvas.requestRender()` after changing overlay fields outside a
gesture.

Other canvas API: `fit()`, `zoomBy(factor, aboutClient?)`, `panBy(dx, dy)`,
`toPlan(clientX, clientY)`, `viewBox`, `snap` / `setSnap(on)` (persisted),
`announce(text)` (aria-live), `focusHit(raw)` (the focusable element, not the
touch pad under it), `focusSurface()` (focus the svg itself, e.g. after the
focused object was removed), `context()`. Unhandled context
requests bubble as a `plan-context` CustomEvent whose `detail` is the
`CanvasPointerEvent` (`hit`, `plan`, `client`, modifiers) - the Rooms /
Cameras tabs listen on the canvas (or the editor) to show their menus.

---

## 4. Model essentials (`model.ts`, `geometry.ts`)

* Units: 1 plan unit = 0.2 ft. `toReal(units, u)`, `fromReal(real, u, min?)`,
  `dim(units, u)` → `"12.4 ft"` / `"3.8 m"`, `area(points, u)`, `unitLabel(u)`.
* Types: `EditorDoc {floors, openings, cameras, pins, property}`, `Floor`,
  `Room` (bbox always present; `points` for polygons; `extra` round-trips
  unknown keys), `Opening`, `CameraPin`, `EntityPin` (key **`e`**),
  `DoorMapping`, `Property`/`Boundary`, `Background`, `Selection`.
* Tables for forms: `ROOM_TYPES`, `OPENING_PRESETS`, `WALLS`, `HOUSE_KEYS`
  (key, kind, label, options, min/max, nullable), `CANONICAL_FLOORS`,
  `doorSlots(config)` / `otherMappedSlots()` / `BACKEND_DOOR_SLOTS`.
* Pickers / names: `doorEntityCandidates(hass, selected)`,
  `cameraCandidates(hass, selected)`, `allEntityIds(hass)`,
  `friendlyName(hass, id)`, `entityExists`, `pinState(hass, id)` →
  `{level, value, name}` (`value` is a `t()` key or a raw reading).
* Area matching (what lights a room on the Residence tab): `areaKey(name)`,
  `roomHasArea(name, areas)`, `unmatchedRooms(doc, areas, floor?)`.
* Geometry: `roomPoints`, `syncBBox`, `floorBBox` (enclosed rooms),
  `contentBBox`, `anchorBox`, `pointInPoly`, `polygonArea`; in geometry.ts
  `markerRect(opening, rooms)`, `posOnWall(opening, rooms, point)`,
  `planGeometry(rooms, openings)` → walls/gaps, `clippedCone(cam, geo)`,
  `coverage(rooms, cam, geo)`, `roomAt`, `openingDescriptions`,
  `coverageContext(doc, floor, cam)` (the `camera` dict of
  `jarvis/compute_camera_coverage`, section 2.6).
* Preview bridge: `docToFeet(doc)` / `docElementsToFeet(doc, hass)` -
  the 3D preview renders from the **serialised** doc, so what you see is
  what the Residence tab will show after Save.
* `cloneDoc(doc)` for your own copies; `parseJsonish`, `asRecord`,
  `parsePoints` for anything you read from the backend or a file.

Run the model self-test after touching `model.ts` / `geometry.ts` (see the
header of `selftest.ts`).

---

## 5. Strings, states, checks

* Every visible string through `t("English")`; the spec's section 8 lists the
  agreed keys - reuse them byte for byte.
* No `confirm()` / `prompt()`: `confirmDialog({...})` from `../../../components`
  for destructive things; otherwise an undoable change + `store.toast(..., {label: t("Undo"), run: () => store.undo()})`.
* A row's Remove goes through `keepRowFocus(e, this, spec, () => remove())`
  (`src/focus.ts`, DESIGN.md §8) so keyboard focus moves to the next /
  previous row instead of `<body>`; an object removed from the canvas leaves
  focus on the plan (`canvas.focusSurface()`).
* Loading / empty / error states per DESIGN.md §6; backend errors are
  `WsError.message`.
* Before hand-over: `npm run check`, `npm run lint:theme`, `npm run build`,
  `npm run smoke`, the model self-test, and a look at
  `http://localhost:5173/jarvis/residence/editor/<tab>` in light, dark and
  narrow (`npm run dev`).
