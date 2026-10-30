/**
 * Rooms tab - the canvas side: the `rooms` layer (replaces the canvas's basic
 * one), the `property` (lot) layer, the rectangle / polygon draw tools and the
 * room / lot document operations the tab, the inspector, the context menu and
 * the keyboard share (frontend/specs/editor.md sections 4.2, 4.4, 4.6, 6 R1-R17).
 *
 * Everything here goes through `store.change()`; drags apply transient frames
 * and commit once on release (one history entry per gesture).
 */
import { svg, nothing, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { t } from "../../../../i18n";
import { confirmDialog } from "../../../../components";
import {
  MIN_ROOM_H, MIN_ROOM_W, SNAP_GRID, bboxOfPoints, dim, area, ensureFloor, findRoom, floorBBox, floorOf, listFor, newRoomId, polygonArea, r1, ri,
  roomPoints, syncBBox, translateRoom, type EditorDoc, type FloorKey, type Pt2, type Room, type Units,
} from "../model";
import { registerLayer, hitOf, parseHit, pathOf, LAYER_ORDER, type CanvasDragEvent, type CanvasPointerEvent, type DragHandler, type Guide, type Hit, type JvPlanCanvas, type Layer, type LayerContext } from "../canvas";
import type { EditorStore } from "../store";
import { showPlanMenu, type MenuItem } from "./rooms-menu";
import { roomDialog } from "./rooms-dialog";

// ── labels ──────────────────────────────────────────────────────────────────
const ROOM_TYPE_LABEL: Record<string, string> = { room: "Room", bath: "Bathroom", stairs: "Stairs", door: "Door", outdoor: "Outdoor zone" };
/** English t() key for a room type (unknown types are shown raw). */
export function roomTypeLabel(type: string): string {
  return ROOM_TYPE_LABEL[type] || type;
}
function typeClass(type: string): string {
  return /^[a-z]+$/.test(type) ? type : "room";
}
const roomName = (r: Pick<Room, "name"> | undefined | null): string => r?.name || t("Room");
/** The hit of the element a keydown came from (the focused handle), from the event itself. */
function keyTarget(e: KeyboardEvent, ctx: LayerContext): Hit | null {
  const el = e.composedPath()[0];
  return (el instanceof Element ? parseHit(el.closest("[data-hit]")?.getAttribute("data-hit")) : null) ?? ctx.focus;
}

// ── touch pads ──────────────────────────────────────────────────────────────
/** CSS px radius of the invisible hit pad behind every small handle (touch needs more than the drawn dot). */
export const PAD_PX = 16;
/** An invisible, larger hit area carrying the same data-hit as the handle drawn on top of it. */
export function hitPad(hit: string, cx: number, cy: number, pxPerUnit: number) {
  return svg`<circle class="pad" data-hit=${hit} aria-hidden="true" cx=${cx} cy=${cy} r=${PAD_PX / Math.max(pxPerUnit, 0.01)}></circle>`;
}

// ── geometry helpers ────────────────────────────────────────────────────────
const snap5 = (v: number): number => Math.round(v / SNAP_GRID) * SNAP_GRID;

/** A 60 x 40 rectangle at the centre of the current view (R3). */
export function defaultRoomRect(store: EditorStore): { x: number; y: number; w: number; h: number } {
  const vb = store.canvas?.viewBox ?? { x: 0, y: 0, w: 320, h: 150 };
  return { x: snap5(vb.x + vb.w / 2 - 30), y: snap5(vb.y + vb.h / 2 - 20), w: 60, h: 40 };
}

/** The default outdoor zone below the house (section 3.6). */
export function defaultZone(rooms: readonly Room[]): { x: number; y: number; w: number; h: number; points: Pt2[] } {
  const bb = floorBBox(rooms);
  const x = bb ? ri(bb.x0) : 20;
  const y = bb ? ri(bb.y1) + 25 : 140;
  const w = bb ? Math.max(ri(bb.x1 - bb.x0), 90) : 90;
  const h = 70;
  return { x, y, w, h, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] };
}

/** The default lot around the floor's rooms (section 3.6). */
export function defaultProperty(rooms: readonly Room[]): Pt2[] {
  let bb = bboxOfPoints(rooms.flatMap((r) => roomPoints(r)));
  if (!bb) bb = { x0: 20, y0: 20, x1: 220, y1: 170 };
  const m = Math.max(150, 0.7 * Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0));
  return [
    [ri(bb.x0 - m), ri(bb.y0 - m)],
    [ri(bb.x1 + m), ri(bb.y0 - m)],
    [ri(bb.x1 + m), ri(bb.y1 + m)],
    [ri(bb.x0 - m), ri(bb.y1 + m)],
  ];
}

/** The 4 corners of a polygon are, within `tol`, its own bbox corners (any order). */
export function isAxisAlignedRect(pts: readonly Pt2[], tol = 0.05): boolean {
  if (pts.length !== 4) return false;
  const bb = bboxOfPoints(pts)!;
  const corners: Pt2[] = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x1, bb.y1], [bb.x0, bb.y1]];
  const left = corners.slice();
  for (const p of pts) {
    const i = left.findIndex((c) => Math.abs(c[0] - p[0]) <= tol && Math.abs(c[1] - p[1]) <= tol);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return left.length === 0;
}

// ── document operations ─────────────────────────────────────────────────────
export interface NewRoomSpec {
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: Pt2[];
}

/** Push a room onto `floor` (history entry "Add {name}"); returns its client id. */
export function pushRoom(store: EditorStore, floor: FloorKey, spec: NewRoomSpec): string {
  const id = newRoomId();
  store.change(t("Add {name}", { name: spec.name || t("Room") }), (d) => {
    const f = ensureFloor(d, floor);
    const room: Room = { id, name: spec.name, x: ri(spec.x), y: ri(spec.y), w: ri(spec.w), h: ri(spec.h), type: spec.type || "room", extra: {} };
    if (spec.points && spec.points.length >= 3) {
      room.points = spec.points.map((p): Pt2 => [r1(p[0]), r1(p[1])]);
      syncBBox(room);
    }
    f.rooms.push(room);
  });
  return id;
}

/**
 * `name` when no room on the floor uses it, else `name 2`, `name 3`, ... (from
 * `first` on). Interior / cased / french openings anchor to a room by NAME, so
 * two rooms with one name would share them on delete, rename and floor moves.
 */
export function uniqueRoomName(rooms: readonly Room[], name: string, first = 1): string {
  if (!name) return name;
  const taken = new Set(rooms.map((r) => r.name));
  if (first <= 1 && !taken.has(name)) return name;
  let n = Math.max(2, first);
  while (taken.has(`${name} ${n}`)) n++;
  return `${name} ${n}`;
}

/** Rename a room and re-anchor the openings that referenced the old name. */
export function renameRoomTo(doc: EditorDoc, id: string, name: string): string | null {
  const hit = findRoom(doc, id);
  if (!hit) return null;
  const old = hit.room.name;
  hit.room.name = name;
  if (old && old !== name) for (const o of doc.openings[hit.floor.key] || []) if (o.room === old) o.room = name;
  return old;
}

export function setRoomType(store: EditorStore, id: string, type: string): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.change(t("Change type of {name}", { name }), (d) => {
    const r = findRoom(d, id)?.room;
    if (r) r.type = type;
  });
}

/** Resize a rectangle room (polygons are reshaped by their corners). */
export function resizeRoom(store: EditorStore, id: string, w: number, h: number): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.change(t("Resize {name}", { name }), (d) => {
    const r = findRoom(d, id)?.room;
    if (!r || r.points) return;
    r.w = Math.max(MIN_ROOM_W, ri(w));
    r.h = Math.max(MIN_ROOM_H, ri(h));
  });
}

/** Move a room (rect or polygon) so its bbox origin lands at (x, y). */
export function moveRoomTo(store: EditorStore, id: string, x: number, y: number): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.change(t("Move {name}", { name }), (d) => {
    const r = findRoom(d, id)?.room;
    if (r) translateRoom(r, ri(x) - r.x, ri(y) - r.y);
  });
}

/**
 * Floor assignment: move a room (and the openings anchored to its name) to
 * another floor, then follow it there. Returns false when nothing moved.
 */
export function moveRoomToFloor(store: EditorStore, id: string, to: FloorKey): boolean {
  const src = findRoom(store.doc, id);
  if (!src || src.floor.key === to) return false;
  const from = src.floor.key;
  const name = roomName(src.room);
  store.change(t("Move {name} to {floor}", { name, floor: t(store.floorLabel(to)) }), (d) => {
    const hit = findRoom(d, id);
    if (!hit) return;
    hit.floor.rooms.splice(hit.index, 1);
    ensureFloor(d, to).rooms.push(hit.room);
    const list = d.openings[from];
    if (list && hit.room.name) {
      const moving = list.filter((o) => o.room === hit.room.name);
      if (moving.length) {
        d.openings[from] = list.filter((o) => o.room !== hit.room.name);
        listFor(d.openings, to).push(...moving);
      }
    }
  });
  store.setFloor(to);
  store.select({ kind: "room", id });
  store.toast(t("Moved {name} to {floor}", { name, floor: t(store.floorLabel(to)) }), {
    label: t("Undo"),
    run: () => {
      store.undo();
      store.setFloor(from);
      store.select({ kind: "room", id });
    },
  });
  return true;
}

export function duplicateRoom(store: EditorStore, id: string): string | null {
  const src = findRoom(store.doc, id);
  if (!src) return null;
  const nid = newRoomId();
  const name = uniqueRoomName(src.floor.rooms, src.room.name || t("Room"), 2);
  store.change(t("Duplicate {name}", { name: roomName(src.room) }), (d) => {
    const hit = findRoom(d, id);
    if (!hit) return;
    const copy: Room = { ...hit.room, id: nid, name, extra: { ...hit.room.extra }, x: hit.room.x + 10, y: hit.room.y + 10 };
    if (hit.room.points) copy.points = hit.room.points.map((p): Pt2 => [r1(p[0] + 10), r1(p[1] + 10)]);
    hit.floor.rooms.splice(hit.index + 1, 0, copy);
  });
  store.select({ kind: "room", id: nid });
  return nid;
}

/** Rect -> polygon with 4 corners (R8). */
export function reshapeRoom(store: EditorStore, id: string): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.change(t("Reshape {name}", { name }), (d) => {
    const r = findRoom(d, id)?.room;
    if (!r || r.points) return;
    r.points = roomPoints(r).map((p): Pt2 => [r1(p[0]), r1(p[1])]);
  });
  store.toast(t("Reshape: drag the corners, click an edge midpoint to add one, right-click a corner to remove"));
}

/** Polygon -> rect: drop the points, keep the bbox (R9). */
export function convertToRect(store: EditorStore, id: string): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.change(t("Convert {name} to rectangle", { name }), (d) => {
    const r = findRoom(d, id)?.room;
    if (!r || !r.points) return;
    syncBBox(r);
    delete r.points;
  });
}

/** Insert a corner after vertex `i` (on the midpoint of edge i -> i+1) and select it. */
export function addCorner(store: EditorStore, id: string, i: number): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  let added = -1;
  store.changeWith((d) => {
    const r = findRoom(d, id)?.room;
    const pts = r?.points;
    if (!r || !pts || i < 0 || i >= pts.length) return null;
    const a = pts[i], b = pts[(i + 1) % pts.length];
    pts.splice(i + 1, 0, [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)]);
    syncBBox(r);
    added = i + 1;
    return t("Add a corner to {name}", { name });
  });
  if (added >= 0) store.select({ kind: "vtx", id, sub: added });
}

export function removeCorner(store: EditorStore, id: string, i: number): boolean {
  const r = findRoom(store.doc, id)?.room;
  if (!r?.points) return false;
  if (r.points.length <= 3) {
    store.toast(t("Needs at least 3 corners"));
    return false;
  }
  const name = roomName(r);
  store.change(t("Remove a corner of {name}", { name }), (d) => {
    const rr = findRoom(d, id)?.room;
    if (!rr?.points || rr.points.length <= 3) return;
    rr.points.splice(i, 1);
    syncBBox(rr);
  });
  store.select({ kind: "room", id });
  store.toast(t("Removed a corner of {name}", { name }), { label: t("Undo"), run: () => store.undo() });
  return true;
}

/** Remove a room (and the openings anchored to it) with an undo toast (R13). */
export function deleteRoom(store: EditorStore, id: string): void {
  const name = roomName(findRoom(store.doc, id)?.room);
  store.select({ kind: "room", id });
  const label = store.removeSelection();
  if (!label) return;
  store.toast(t("Removed {name}", { name }), { label: t("Undo"), run: () => store.undo() });
  store.canvas?.announce(t("Removed {name}", { name }));
  // the Delete button / the room's <g> leaves the DOM with the room: keep focus on the plan, not <body>
  store.canvas?.focusSurface();
}

// clipboard (Ctrl+C / Ctrl+V, session only)
let _clip: Room | null = null;
export function copyRoom(store: EditorStore, id: string): boolean {
  const r = findRoom(store.doc, id)?.room;
  if (!r) return false;
  _clip = { ...r, extra: { ...r.extra }, points: r.points ? r.points.map((p): Pt2 => [p[0], p[1]]) : undefined };
  store.toast(t("Copied {name}", { name: roomName(r) }));
  return true;
}
export function hasClipboard(): boolean {
  return _clip !== null;
}
/** Paste the copied room onto the current floor, offset by 10 u (renamed "<name> 2" ... when the floor has that name). */
export function pasteRoom(store: EditorStore): string | null {
  if (!_clip) return null;
  const src = _clip;
  const name = uniqueRoomName(store.rooms(store.floor), src.name);
  const id = pushRoom(store, store.floor, { name, type: src.type, x: src.x + 10, y: src.y + 10, w: src.w, h: src.h, points: src.points?.map((p): Pt2 => [p[0] + 10, p[1] + 10]) });
  store.select({ kind: "room", id });
  void store.canvas?.focusHit(hitOf("room", id));
  return id;
}

// property (lot)
export function addPropertyLine(store: EditorStore): void {
  const pts = defaultProperty(store.rooms());
  store.change(t("Add property line"), (d) => {
    d.property.points = pts;
  });
  store.toast(t("Property boundary added — drag the corners to your lot lines; click an edge midpoint to add a corner, right-click a corner to remove"));
}
export async function clearPropertyLine(store: EditorStore): Promise<void> {
  const ok = await confirmDialog({ heading: t("Remove the property boundary?"), confirmLabel: t("Remove"), destructive: true });
  if (!ok) return;
  store.change(t("Clear property line"), (d) => {
    d.property.points = [];
  });
  store.toast(t("Property boundary cleared"), { label: t("Undo"), run: () => store.undo() });
}
export function addPropertyCorner(store: EditorStore, i: number): void {
  let added = -1;
  store.changeWith((d) => {
    const pts = d.property.points;
    if (i < 0 || i >= pts.length) return null;
    const a = pts[i], b = pts[(i + 1) % pts.length];
    pts.splice(i + 1, 0, [ri((a[0] + b[0]) / 2), ri((a[1] + b[1]) / 2)]);
    added = i + 1;
    return t("Add a property corner");
  });
  if (added >= 0) store.select({ kind: "prop-vtx", id: "lot", sub: added });
}
export function removePropertyCorner(store: EditorStore, i: number): boolean {
  if (store.doc.property.points.length <= 3) {
    store.toast(t("A boundary needs at least 3 corners"));
    return false;
  }
  store.change(t("Remove a property corner"), (d) => {
    if (d.property.points.length > 3 && i < d.property.points.length) d.property.points.splice(i, 1);
  });
  store.select(null);
  store.toast(t("Removed a property corner"), { label: t("Undo"), run: () => store.undo() });
  return true;
}
/** `Lot: 0.42 acres` for the toolbar / layer label ("" when there is no lot). */
export function lotAreaLabel(points: readonly Pt2[], units: Units): string {
  return points.length >= 3 ? t("Lot: {area}", { area: area(points, units) }) : "";
}

/** R17: move everything on a non-canonical floor under 1f and drop the floor. */
export async function moveFloorToFirst(store: EditorStore, from: FloorKey): Promise<void> {
  const n = store.rooms(from).length;
  const ok = await confirmDialog({ heading: t("Move {n} rooms to 1st Floor?", { n }), confirmLabel: t("Move rooms to 1st Floor") });
  if (!ok) return;
  store.change(t("Move rooms to 1st Floor"), (d) => {
    const src = floorOf(d, from);
    const dst = ensureFloor(d, "1f");
    if (src) dst.rooms.push(...src.rooms);
    d.floors = d.floors.filter((f) => f.key !== from);
    listFor(d.openings, "1f").push(...(d.openings[from] || []));
    listFor(d.cameras, "1f").push(...(d.cameras[from] || []));
    listFor(d.pins, "1f").push(...(d.pins[from] || []));
    delete d.openings[from];
    delete d.cameras[from];
    delete d.pins[from];
  });
  store.setFloor("1f");
  store.toast(t("Moved {n} rooms to 1st Floor", { n }), { label: t("Undo"), run: () => store.undo() });
}

// ── dialogs ─────────────────────────────────────────────────────────────────
export interface PromptRoomOptions {
  heading?: string;
  type?: string;
  zone?: boolean;
}

/** Name dialog -> push the room -> select + focus + toast (R1-R4). Resolves the new id or null. */
export async function promptNewRoom(store: EditorStore, floor: FloorKey, rect: { x: number; y: number; w: number; h: number }, points?: Pt2[], opts: PromptRoomOptions = {}): Promise<string | null> {
  const res = await roomDialog({ heading: opts.heading ?? t("Add Room"), name: "", type: opts.type ?? "room", areas: store.areaNames(), confirmLabel: t("Add") });
  if (!res) return null;
  const id = pushRoom(store, floor, { name: res.name, type: res.type, ...rect, points });
  store.select({ kind: "room", id });
  void store.canvas?.focusHit(hitOf("room", id));
  store.toast(opts.zone ? t("Added zone {name} — size it over the area the camera watches, then Save", { name: res.name }) : t("Added {name} — drag to position, then Save", { name: res.name }));
  return id;
}

export async function promptRename(store: EditorStore, id: string): Promise<void> {
  const r = findRoom(store.doc, id)?.room;
  if (!r) return;
  const res = await roomDialog({ heading: t("Rename…"), name: r.name, type: r.type, areas: store.areaNames(), confirmLabel: t("Rename"), nameOnly: true });
  if (!res || res.name === r.name) return;
  store.change(t("Rename {name}", { name: roomName(r) }), (d) => {
    renameRoomTo(d, id, res.name);
  });
}

/** R3: a default rectangle at the view centre, then the name dialog. */
export function placeRoom(store: EditorStore): Promise<string | null> {
  return promptNewRoom(store, store.floor, defaultRoomRect(store));
}
/** R4: the default outdoor zone. */
export function addOutdoorZone(store: EditorStore): Promise<string | null> {
  const z = defaultZone(store.rooms());
  return promptNewRoom(store, store.floor, { x: z.x, y: z.y, w: z.w, h: z.h }, z.points, { heading: t("Outdoor Zone"), type: "outdoor", zone: true });
}

// ── draw tools ──────────────────────────────────────────────────────────────
/**
 * Draw-tool state for the tab's toolbar: touch users have no Enter / Escape /
 * Backspace, so the tab shows Finish / Remove last corner / Cancel buttons
 * while a tool is active. `onDrawChange` notifies on every state change.
 */
export type DrawMode = "rect" | "poly" | null;
export interface PolygonControls {
  count(): number;
  close(): void;
  undo(): void;
  cancel(): void;
}
const _drawListeners = new Set<() => void>();
let _poly: PolygonControls | null = null;
function notifyDraw(): void {
  for (const fn of _drawListeners) {
    try {
      fn();
    } catch {
      /* a listener must never break the tool */
    }
  }
}
export function onDrawChange(fn: () => void): () => void {
  _drawListeners.add(fn);
  return () => {
    _drawListeners.delete(fn);
  };
}
export function drawMode(canvas: JvPlanCanvas | null | undefined): DrawMode {
  const id = canvas?.tool?.id;
  return id === "draw-rect" ? "rect" : id === "draw-poly" ? "poly" : null;
}
/** The active polygon tool's controls (null unless the polygon tool is active). */
export function polygonControls(canvas: JvPlanCanvas | null | undefined): PolygonControls | null {
  return drawMode(canvas) === "poly" ? _poly : null;
}
/** End a rectangle / polygon tool without adding anything. */
export function cancelDrawTool(store: EditorStore): void {
  const canvas = store.canvas;
  const mode = drawMode(canvas);
  if (mode === "poly" && _poly) _poly.cancel();
  else if (mode === "rect" && canvas) {
    canvas.band = null;
    canvas.tooltip = null;
    canvas.setTool(null);
    canvas.announce(t("Drawing cancelled"));
  }
  _poly = null;
  notifyDraw();
}

/** R1: rubber-band a rectangle; on release >= 15 x 10 u the name dialog adds it. */
export function startRectTool(store: EditorStore): void {
  const canvas = store.canvas;
  if (!canvas) return;
  if (drawMode(canvas) === "poly") cancelDrawTool(store);
  canvas.cursor = "crosshair";
  const tool: Layer = {
    id: "draw-rect",
    order: LAYER_ORDER.tool,
    hits: ["*"],
    render: () => nothing,
    onTap: () => true,
    onDragStart(ev) {
      // (no button check: onDragStart gets the pointermove, whose `button` is -1; the canvas already routes only primary / touch drags here)
      const p0 = canvas.snapper({ enabled: canvas.snap && !ev.altKey }).point(ev.plan);
      const rect = (e: CanvasDragEvent) => {
        const p1 = e.snap.point(e.plan);
        const x = Math.min(p0[0], p1[0]), y = Math.min(p0[1], p1[1]);
        return { x, y, w: Math.abs(p1[0] - p0[0]), h: Math.abs(p1[1] - p0[1]) };
      };
      return {
        cursor: "crosshair",
        onMove(e) {
          const r = rect(e);
          canvas.band = r;
          canvas.tooltip = { x: r.x + r.w / 2, y: r.y - 3, text: `${dim(r.w, store.settings.units)} × ${dim(r.h, store.settings.units)}` };
        },
        onEnd(e) {
          const r = rect(e);
          canvas.band = null;
          canvas.tooltip = null;
          canvas.setTool(null);
          notifyDraw();
          if (r.w >= MIN_ROOM_W && r.h >= MIN_ROOM_H) void promptNewRoom(store, store.floor, r);
          else canvas.announce(t("Too small for a room — drag a larger rectangle"));
        },
        onCancel() {
          canvas.band = null;
          canvas.tooltip = null;
        },
      } satisfies DragHandler;
    },
    onKey(e) {
      if (e.key === "Escape") {
        canvas.setTool(null);
        canvas.announce(t("Drawing cancelled"));
        notifyDraw();
        return true;
      }
      if (e.key === "Enter") {
        // the keyboard path (no pointer to drag with): R, Enter = a default room at the view centre (R3)
        canvas.setTool(null);
        notifyDraw();
        void placeRoom(store);
        return true;
      }
      return false;
    },
  };
  canvas.setTool(tool);
  notifyDraw();
  canvas.announce(t("Drag on the plan to draw a room. Escape cancels."));
}

/** R2: click vertices; close on the first vertex, Enter or double-click; Backspace removes the last; Escape cancels. */
export function startPolygonTool(store: EditorStore): void {
  const canvas = store.canvas;
  if (!canvas) return;
  if (drawMode(canvas)) cancelDrawTool(store);
  canvas.cursor = "crosshair";
  const pts: Pt2[] = [];
  const update = () => {
    canvas.draft = pts.slice();
    const last = pts[pts.length - 1];
    canvas.tooltip = last ? { x: last[0], y: last[1] - 4, text: t("{n} corners", { n: pts.length }) } : null;
    canvas.requestRender();
    notifyDraw();
  };
  const end = () => {
    canvas.tooltip = null;
    canvas.setTool(null);
    if (_poly === controls) _poly = null;
    notifyDraw();
  };
  const cancel = () => {
    end();
    store.toast(t("Polygon cancelled"));
  };
  const close = () => {
    end();
    const bb = bboxOfPoints(pts);
    if (pts.length < 3 || !bb || bb.x1 - bb.x0 < MIN_ROOM_W || bb.y1 - bb.y0 < MIN_ROOM_H || polygonArea(pts) < MIN_ROOM_W * MIN_ROOM_H) {
      store.toast(t("Polygon cancelled"));
      return;
    }
    void promptNewRoom(store, store.floor, { x: bb.x0, y: bb.y0, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 }, pts.slice());
  };
  const undo = () => {
    pts.pop();
    update();
    canvas.announce(t("{n} corners", { n: pts.length }));
  };
  const controls: PolygonControls = { count: () => pts.length, close, undo, cancel };
  const tool: Layer = {
    id: "draw-poly",
    order: LAYER_ORDER.tool,
    hits: ["*"],
    render: () => nothing,
    onTap(ev) {
      if (ev.button !== 0) return true;
      const p = canvas.snapper({ enabled: canvas.snap && !ev.altKey }).point(ev.plan);
      const last = pts[pts.length - 1];
      if (pts.length >= 3 && Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) <= 6) {
        close();
        return true;
      }
      if (last && Math.abs(last[0] - p[0]) < 0.5 && Math.abs(last[1] - p[1]) < 0.5) return true; // the second tap of a double-click
      pts.push([r1(p[0]), r1(p[1])]);
      update();
      canvas.announce(t("{n} corners", { n: pts.length }));
      return true;
    },
    onDoubleClick() {
      if (pts.length >= 3) close();
      return true;
    },
    onDragStart: () => null,
    onKey(e) {
      switch (e.key) {
        case "Enter":
          if (pts.length >= 3) close();
          return true;
        case "Backspace":
        case "Delete":
          undo();
          return true;
        case "Escape":
          cancel();
          return true;
        default:
          return false;
      }
    },
  };
  canvas.setTool(tool);
  _poly = controls;
  canvas.draft = [];
  notifyDraw();
  canvas.announce(t("Click the plan to add corners; click the first corner, press Enter or double-click to close. Escape cancels."));
}

// ── context menus ───────────────────────────────────────────────────────────
function roomMenu(store: EditorStore, id: string): MenuItem[] {
  const r = findRoom(store.doc, id)?.room;
  if (!r) return [];
  return [
    { label: t("Rename…"), icon: "mdi:rename-outline", run: () => void promptRename(store, id) },
    { label: t("Duplicate"), icon: "mdi:content-copy", run: () => void duplicateRoom(store, id) },
    r.points
      ? { label: t("Convert to rectangle"), icon: "mdi:vector-square", run: () => convertToRect(store, id) }
      : { label: t("Reshape (edit corners)"), icon: "mdi:vector-polygon", run: () => reshapeRoom(store, id) },
    { label: t("Delete"), icon: "mdi:delete-outline", danger: true, run: () => deleteRoom(store, id) },
  ];
}

function backgroundMenu(store: EditorStore, plan: Pt2): MenuItem[] {
  return [
    {
      label: t("Add room here"),
      icon: "mdi:plus-box-outline",
      run: () => void promptNewRoom(store, store.floor, { x: snap5(plan[0] - 30), y: snap5(plan[1] - 20), w: 60, h: 40 }),
    },
    { label: t("Paste"), icon: "mdi:content-paste", disabled: !hasClipboard(), run: () => void pasteRoom(store) },
  ];
}

// ── the rooms layer ─────────────────────────────────────────────────────────
/** Move a room with grid / edge snapping and a position tooltip (used by the body drag). */
function moveHandler(ev: CanvasPointerEvent, ctx: LayerContext, id: string): DragHandler | null {
  const found = findRoom(ctx.doc, id);
  if (!found) return null;
  const orig = { x: found.room.x, y: found.room.y, w: found.room.w, h: found.room.h };
  const name = roomName(found.room);
  const u = ctx.units;
  ctx.store.select({ kind: "room", id });
  const place = (nx: number, ny: number, transient: boolean) =>
    ctx.store.change(t("Move {name}", { name }), (d) => {
      const r = findRoom(d, id)?.room;
      if (r) translateRoom(r, nx - r.x, ny - r.y);
    }, { transient });
  const snapped = (e: CanvasDragEvent): Pt2 => {
    const rx = orig.x + e.delta[0], ry = orig.y + e.delta[1];
    const s = e.snap;
    const guides: Guide[] = [];
    const pick = (v: number, span: number, f: (n: number) => number) => {
      const a = f(v), ga = s.guides.splice(0);
      const b = f(v + span) - span, gb = s.guides.splice(0);
      const useA = Math.abs(a - v) <= Math.abs(b - v);
      guides.push(...(useA ? ga : gb));
      return useA ? a : b;
    };
    const nx = pick(rx, orig.w, s.x), ny = pick(ry, orig.h, s.y);
    s.guides.push(...guides);
    return [ri(nx), ri(ny)];
  };
  return {
    cursor: "move",
    onMove(e) {
      const [nx, ny] = snapped(e);
      place(nx, ny, true);
      ctx.canvas.tooltip = { x: nx + orig.w / 2, y: ny - 3, text: `${dim(nx, u)}, ${dim(ny, u)}` };
    },
    onEnd(e) {
      const [nx, ny] = snapped(e);
      place(nx, ny, false);
      ctx.canvas.tooltip = null;
      ctx.canvas.announce(t("{name} moved to {x}, {y}", { name, x: dim(nx, u), y: dim(ny, u) }));
    },
    onCancel() {
      ctx.canvas.tooltip = null;
    },
  };
}

/** Bottom-right handle: resize with minimum 15 x 10 u; Shift keeps the aspect ratio. */
function resizeHandler(ev: CanvasPointerEvent, ctx: LayerContext, id: string): DragHandler | null {
  const found = findRoom(ctx.doc, id);
  if (!found || found.room.points) return null;
  const orig = { x: found.room.x, y: found.room.y, w: found.room.w, h: found.room.h };
  const name = roomName(found.room);
  const u = ctx.units;
  ctx.store.select({ kind: "room", id });
  const size = (e: CanvasDragEvent): [number, number] => {
    const x1 = e.snap.x(orig.x + orig.w + e.delta[0]);
    const y1 = e.snap.y(orig.y + orig.h + e.delta[1]);
    let w = Math.max(MIN_ROOM_W, ri(x1 - orig.x));
    let h = Math.max(MIN_ROOM_H, ri(y1 - orig.y));
    if (e.shiftKey && orig.w > 0 && orig.h > 0) {
      const k = orig.h / orig.w;
      if (Math.abs(e.delta[0]) >= Math.abs(e.delta[1])) h = Math.max(MIN_ROOM_H, ri(w * k));
      else w = Math.max(MIN_ROOM_W, ri(h / k));
    }
    return [w, h];
  };
  const apply = (w: number, h: number, transient: boolean) =>
    ctx.store.change(t("Resize {name}", { name }), (d) => {
      const r = findRoom(d, id)?.room;
      if (r && !r.points) {
        r.w = w;
        r.h = h;
      }
    }, { transient });
  return {
    cursor: "nwse-resize",
    onMove(e) {
      const [w, h] = size(e);
      apply(w, h, true);
      ctx.canvas.tooltip = { x: orig.x + w / 2, y: orig.y - 3, text: `${dim(w, u)} × ${dim(h, u)}` };
    },
    onEnd(e) {
      const [w, h] = size(e);
      apply(w, h, false);
      ctx.canvas.tooltip = null;
      ctx.canvas.announce(t("{name} resized to {w} × {h}", { name, w: dim(w, u), h: dim(h, u) }));
    },
    onCancel() {
      ctx.canvas.tooltip = null;
    },
  };
}

/** Drag one polygon vertex (1 decimal; bbox re-derived every frame). */
function vertexHandler(ev: CanvasPointerEvent, ctx: LayerContext, id: string, i: number): DragHandler | null {
  const found = findRoom(ctx.doc, id);
  const pts = found?.room.points;
  if (!found || !pts || !pts[i]) return null;
  const orig: Pt2 = [pts[i][0], pts[i][1]];
  const name = roomName(found.room);
  const u = ctx.units;
  ctx.store.select({ kind: "vtx", id, sub: i });
  const target = (e: CanvasDragEvent): Pt2 => {
    const raw: Pt2 = [orig[0] + e.delta[0], orig[1] + e.delta[1]];
    return e.snap.enabled ? e.snap.point(raw) : [r1(raw[0]), r1(raw[1])];
  };
  const apply = (p: Pt2, transient: boolean) =>
    ctx.store.change(t("Reshape {name}", { name }), (d) => {
      const r = findRoom(d, id)?.room;
      if (!r?.points || !r.points[i]) return;
      r.points[i] = [r1(p[0]), r1(p[1])];
      syncBBox(r);
    }, { transient });
  return {
    cursor: "move",
    onMove(e) {
      const p = target(e);
      apply(p, true);
      ctx.canvas.tooltip = { x: p[0], y: p[1] - 4, text: `${dim(p[0], u)}, ${dim(p[1], u)}` };
    },
    onEnd(e) {
      apply(target(e), false);
      ctx.canvas.tooltip = null;
    },
    onCancel() {
      ctx.canvas.tooltip = null;
    },
  };
}

export const roomsLayer: Layer = {
  id: "rooms",
  order: LAYER_ORDER.rooms,
  hits: ["room", "vtx", "mid", "handle", "*"],
  styles: css`
    .room .shape {
      fill: var(--jv-accent);
      fill-opacity: 0.06;
      stroke: var(--jv-text-2);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .room.t-bath .shape,
    .room.t-stairs .shape {
      fill: var(--jv-info);
    }
    .room.t-outdoor .shape {
      fill: var(--jv-ok);
      stroke-dasharray: 4 3;
    }
    .room.is-hover .shape {
      fill-opacity: 0.12;
    }
    .room.is-selected .shape {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .room.is-focus .shape,
    .room:focus-visible .shape {
      stroke: var(--jv-focus);
      stroke-width: 2;
    }
    .room .name {
      fill: var(--jv-text);
      text-anchor: middle;
      dominant-baseline: middle;
      font-weight: var(--jv-font-weight-medium);
    }
    .room .dims {
      fill: var(--jv-text-2);
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .handle {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: nwse-resize;
    }
    .handle:focus-visible,
    .handle.is-focus {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .vtx {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .vtx.is-selected,
    .vtx.is-hover {
      fill: var(--jv-accent);
    }
    .vtx.is-focus,
    .vtx:focus-visible {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .mid {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1;
      stroke-dasharray: 2 1.5;
      vector-effect: non-scaling-stroke;
      opacity: 0.85;
      cursor: copy;
    }
    .mid.is-hover,
    .mid:focus-visible {
      fill: var(--jv-accent-soft);
      opacity: 1;
    }
    .legacy-label {
      fill: var(--jv-text-2);
    }
    .pad {
      fill: transparent;
      stroke: none;
    }
  `,
  render(ctx) {
    const u = ctx.units;
    const labels = ctx.floorDef?.labels || [];
    const editable = ctx.mode === "rooms";
    const hs = Math.max(2.5, 9 / Math.max(ctx.pxPerUnit, 0.01));
    const vr = Math.max(1.6, 5.5 / Math.max(ctx.pxPerUnit, 0.01));
    const sel = ctx.selection;
    return svg`
      ${repeat(
        ctx.rooms,
        (r) => r.id,
        (r) => {
          const hit = hitOf("room", r.id);
          const fs = r.w > 80 ? 7 : r.w > 50 ? 5.5 : r.w > 25 ? 4 : 3;
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          const selected = !!sel && (sel.kind === "room" || sel.kind === "vtx") && sel.id === r.id;
          const typeLabel = t(roomTypeLabel(r.type));
          const pts = r.points;
          return svg`
            <g data-hit=${hit} tabindex="0" role="button" class="room t-${typeClass(r.type)} ${ctx.classes(hit)}"
               aria-label=${`${r.name || t("Room")}, ${typeLabel}, ${dim(r.w, u)} × ${dim(r.h, u)}`}>
              <path class="shape" d=${pathOf(roomPoints(r))}></path>
              <text class="name" x=${cx} y=${cy} font-size=${fs}>${r.name}</text>
              ${r.w > 30 && r.h > 24 ? svg`<text class="dims" x=${cx} y=${cy + fs * 1.15} font-size=${fs * 0.62}>${dim(r.w, u)} × ${dim(r.h, u)}</text>` : nothing}
            </g>
            ${editable && selected && !pts
              ? svg`${hitPad(hitOf("handle", r.id), r.x + r.w, r.y + r.h, ctx.pxPerUnit)}<rect class="handle ${ctx.classes(hitOf("handle", r.id))}" data-hit=${hitOf("handle", r.id)} tabindex="0" role="button"
                       aria-label=${t("Resize {name}", { name: r.name || t("Room") })}
                       x=${r.x + r.w - hs / 2} y=${r.y + r.h - hs / 2} width=${hs} height=${hs}></rect>`
              : nothing}
            ${editable && selected && pts
              ? svg`
                  ${pts.map((p, i) => {
                    const q = pts[(i + 1) % pts.length];
                    const mh = hitOf("mid", r.id, i);
                    return svg`${hitPad(mh, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, ctx.pxPerUnit)}<circle class="mid ${ctx.classes(mh)}" data-hit=${mh} tabindex="0" role="button" aria-label=${t("Add corner")} cx=${(p[0] + q[0]) / 2} cy=${(p[1] + q[1]) / 2} r=${vr * 0.75}></circle>`;
                  })}
                  ${pts.map((p, i) => {
                    const vh = hitOf("vtx", r.id, i);
                    return svg`${hitPad(vh, p[0], p[1], ctx.pxPerUnit)}<circle class="vtx ${ctx.classes(vh)}" data-hit=${vh} tabindex="0" role="button" aria-label=${t("Corner {i} of {name}", { i: i + 1, name: r.name || t("Room") })} cx=${p[0]} cy=${p[1]} r=${vr}></circle>`;
                  })}
                `
              : nothing}
          `;
        },
      )}
      ${labels.map((l) => svg`<text class="legacy-label" x=${l.x} y=${l.y} font-size="4" text-anchor="middle">${l.text}</text>`)}
    `;
  },
  onTap(ev, ctx) {
    const hit = ev.hit;
    if (!hit || ctx.mode !== "rooms") return false;
    if (hit.kind === "handle") {
      ctx.store.select({ kind: "room", id: hit.id });
      return true;
    }
    if (hit.kind === "mid" && hit.sub != null) {
      addCorner(ctx.store, hit.id, hit.sub);
      return true;
    }
    return false;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "rooms" || ctx.canvas.tool || !ev.hit) return null;
    switch (ev.hit.kind) {
      case "room":
        return moveHandler(ev, ctx, ev.hit.id);
      case "handle":
        return resizeHandler(ev, ctx, ev.hit.id);
      case "vtx":
        return ev.hit.sub == null ? null : vertexHandler(ev, ctx, ev.hit.id, ev.hit.sub);
      default:
        return null;
    }
  },
  onDoubleClick(ev, ctx) {
    if (ctx.mode !== "rooms" || ctx.canvas.tool || !ev.hit || ev.hit.kind !== "room") return false;
    void promptRename(ctx.store, ev.hit.id);
    return true;
  },
  onContextMenu(ev, ctx) {
    if (ctx.mode !== "rooms" || ctx.canvas.tool) return false;
    const hit = ev.hit;
    const store = ctx.store;
    if (!hit) {
      showPlanMenu({ at: ev.client, label: t("Plan"), items: backgroundMenu(store, ev.plan) });
      return true;
    }
    if (hit.kind === "room" || hit.kind === "handle") {
      store.select({ kind: "room", id: hit.id });
      showPlanMenu({ at: ev.client, label: roomName(findRoom(ctx.doc, hit.id)?.room), items: roomMenu(store, hit.id) });
      return true;
    }
    if (hit.kind === "vtx" && hit.sub != null) {
      const r = findRoom(ctx.doc, hit.id)?.room;
      const i = hit.sub;
      showPlanMenu({
        at: ev.client,
        label: t("Corner {i} of {name}", { i: i + 1, name: roomName(r) }),
        items: [{ label: t("Remove corner"), icon: "mdi:vector-point-minus", danger: true, disabled: !r?.points || r.points.length <= 3, run: () => removeCorner(store, hit.id, i) }],
      });
      return true;
    }
    if (hit.kind === "mid" && hit.sub != null) {
      const i = hit.sub;
      showPlanMenu({ at: ev.client, label: t("Add corner"), items: [{ label: t("Add corner"), icon: "mdi:vector-point-plus", run: () => addCorner(store, hit.id, i) }] });
      return true;
    }
    return false;
  },
  onKey(e, ctx) {
    if (ctx.canvas.tool) return false;
    const store = ctx.store;
    const sel = ctx.selection;
    const roomId = sel && (sel.kind === "room" || sel.kind === "vtx") ? sel.id : null;
    const mod = e.ctrlKey || e.metaKey;
    // the focused handles are buttons: Enter / Space on an edge midpoint adds a corner, arrows on the corner handle resize
    const focus = keyTarget(e, ctx);
    if (focus && ctx.mode === "rooms" && !mod && !e.altKey) {
      if (focus.kind === "mid" && focus.sub != null && (e.key === "Enter" || e.key === " ")) {
        const i = focus.sub;
        addCorner(store, focus.id, i);
        void ctx.canvas.focusHit(hitOf("vtx", focus.id, i + 1));
        ctx.canvas.announce(t("Add a corner to {name}", { name: roomName(findRoom(store.doc, focus.id)?.room) }));
        return true;
      }
      if (focus.kind === "handle") {
        if (e.key === "Enter" || e.key === " ") {
          store.select({ kind: "room", id: focus.id });
          const r = findRoom(store.doc, focus.id)?.room;
          if (r) ctx.canvas.announce(t("{name} selected · {w} × {h}", { name: roomName(r), w: dim(r.w, ctx.units), h: dim(r.h, ctx.units) }));
          return true;
        }
        const step = e.shiftKey ? 10 : 1;
        const dw = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dh = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        if (dw || dh) {
          const r = findRoom(store.doc, focus.id)?.room;
          if (r && !r.points) {
            const w = Math.max(MIN_ROOM_W, ri(r.w + dw)), h = Math.max(MIN_ROOM_H, ri(r.h + dh));
            const name = roomName(r);
            if (w !== r.w || h !== r.h) {
              store.change(t("Resize {name}", { name }), (d) => {
                const rr = findRoom(d, focus.id)?.room;
                if (rr && !rr.points) {
                  rr.w = w;
                  rr.h = h;
                }
              }, { coalesce: `resize:${focus.id}` });
            }
            ctx.canvas.announce(t("{name} resized to {w} × {h}", { name, w: dim(w, ctx.units), h: dim(h, ctx.units) }));
          }
          return true;
        }
      }
    }
    if (mod && !e.shiftKey && !e.altKey && ctx.mode === "rooms") {
      const k = e.key.toLowerCase();
      if (k === "d" && roomId) {
        duplicateRoom(store, roomId);
        return true;
      }
      if (k === "c" && roomId) return copyRoom(store, roomId);
      if (k === "v" && hasClipboard()) return !!pasteRoom(store);
      return false;
    }
    if (mod || e.altKey || ctx.mode !== "rooms") return false;
    if (e.key === "F2" && roomId) {
      void promptRename(store, roomId);
      return true;
    }
    if ((e.key === "r" || e.key === "R") && !e.shiftKey) {
      startRectTool(store);
      return true;
    }
    if ((e.key === "p" || e.key === "P") && !e.shiftKey) {
      startPolygonTool(store);
      return true;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && sel?.kind === "vtx" && sel.sub != null) {
      removeCorner(store, sel.id, sel.sub);
      return true;
    }
    return false;
  },
};

// ── the property (lot) layer ────────────────────────────────────────────────
function propertyVertexHandler(ev: CanvasPointerEvent, ctx: LayerContext, i: number): DragHandler | null {
  const pts = ctx.doc.property.points;
  if (!pts[i]) return null;
  const orig: Pt2 = [pts[i][0], pts[i][1]];
  ctx.store.select({ kind: "prop-vtx", id: "lot", sub: i });
  const u = ctx.units;
  const target = (e: CanvasDragEvent): Pt2 => {
    const p = e.snap.point([orig[0] + e.delta[0], orig[1] + e.delta[1]]);
    return [ri(p[0]), ri(p[1])];
  };
  const apply = (p: Pt2, transient: boolean) =>
    ctx.store.change(t("Move property corner"), (d) => {
      if (d.property.points[i]) d.property.points[i] = p;
    }, { transient });
  return {
    cursor: "move",
    onMove(e) {
      const p = target(e);
      apply(p, true);
      ctx.canvas.tooltip = { x: p[0], y: p[1] - 4, text: lotAreaLabel(ctx.store.doc.property.points, u) || `${dim(p[0], u)}, ${dim(p[1], u)}` };
    },
    onEnd(e) {
      apply(target(e), false);
      ctx.canvas.tooltip = null;
    },
    onCancel() {
      ctx.canvas.tooltip = null;
    },
  };
}

export const propertyLayer: Layer = {
  id: "property",
  order: LAYER_ORDER.property,
  hits: ["prop-vtx", "prop-mid"],
  styles: css`
    .lot {
      fill: var(--jv-warn);
      fill-opacity: 0.05;
      stroke: var(--jv-warn);
      stroke-width: 1.5;
      stroke-dasharray: 6 4;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .lot-label {
      fill: var(--jv-warn-text);
    }
    .prop-vtx {
      fill: var(--jv-surface);
      stroke: var(--jv-warn);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .prop-vtx.is-selected,
    .prop-vtx.is-hover {
      fill: var(--jv-warn);
    }
    .prop-vtx.is-focus,
    .prop-vtx:focus-visible {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .prop-mid {
      fill: var(--jv-surface);
      stroke: var(--jv-warn);
      stroke-width: 1;
      stroke-dasharray: 2 1.5;
      vector-effect: non-scaling-stroke;
      opacity: 0.85;
      cursor: copy;
    }
    .prop-mid.is-hover,
    .prop-mid:focus-visible {
      fill: var(--jv-warn-soft);
      opacity: 1;
    }
  `,
  render(ctx) {
    const pts = ctx.doc.property.points;
    if (pts.length < 3) return nothing;
    const editable = ctx.mode === "rooms";
    const vr = Math.max(1.6, 5.5 / Math.max(ctx.pxPerUnit, 0.01));
    const bb = bboxOfPoints(pts)!;
    const fs = Math.max(3.5, ctx.viewBox.w / 110);
    return svg`
      <path class="lot" d=${pathOf(pts)}></path>
      <text class="lot-label" x=${bb.x0 + fs * 0.5} y=${bb.y0 + fs * 1.3} font-size=${fs}>${lotAreaLabel(pts, ctx.units)}</text>
      ${editable
        ? svg`
            ${pts.map((p, i) => {
              const q = pts[(i + 1) % pts.length];
              const mh = hitOf("prop-mid", "lot", i);
              return svg`${hitPad(mh, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, ctx.pxPerUnit)}<circle class="prop-mid ${ctx.classes(mh)}" data-hit=${mh} tabindex="0" role="button" aria-label=${t("Add corner")} cx=${(p[0] + q[0]) / 2} cy=${(p[1] + q[1]) / 2} r=${vr * 0.75}></circle>`;
            })}
            ${pts.map((p, i) => {
              const vh = hitOf("prop-vtx", "lot", i);
              return svg`${hitPad(vh, p[0], p[1], ctx.pxPerUnit)}<circle class="prop-vtx ${ctx.classes(vh)}" data-hit=${vh} tabindex="0" role="button" aria-label=${t("Property corner {i}", { i: i + 1 })} cx=${p[0]} cy=${p[1]} r=${vr}></circle>`;
            })}
          `
        : nothing}
    `;
  },
  onTap(ev, ctx) {
    if (ctx.mode !== "rooms" || !ev.hit) return false;
    if (ev.hit.kind === "prop-mid" && ev.hit.sub != null) {
      addPropertyCorner(ctx.store, ev.hit.sub);
      return true;
    }
    return false;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "rooms" || ctx.canvas.tool || !ev.hit || ev.hit.kind !== "prop-vtx" || ev.hit.sub == null) return null;
    return propertyVertexHandler(ev, ctx, ev.hit.sub);
  },
  onContextMenu(ev, ctx) {
    if (ctx.mode !== "rooms" || !ev.hit || ev.hit.sub == null) return false;
    const i = ev.hit.sub;
    if (ev.hit.kind === "prop-vtx") {
      showPlanMenu({
        at: ev.client,
        label: t("Property corner {i}", { i: i + 1 }),
        items: [{ label: t("Remove corner"), icon: "mdi:vector-point-minus", danger: true, disabled: ctx.doc.property.points.length <= 3, run: () => removePropertyCorner(ctx.store, i) }],
      });
      return true;
    }
    if (ev.hit.kind === "prop-mid") {
      showPlanMenu({ at: ev.client, label: t("Add corner"), items: [{ label: t("Add corner"), icon: "mdi:vector-point-plus", run: () => addPropertyCorner(ctx.store, i) }] });
      return true;
    }
    return false;
  },
  onKey(e, ctx) {
    if (ctx.canvas.tool || ctx.mode !== "rooms") return false;
    const focus = keyTarget(e, ctx);
    if (focus?.kind === "prop-mid" && focus.sub != null && (e.key === "Enter" || e.key === " ") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const i = focus.sub;
      addPropertyCorner(ctx.store, i);
      void ctx.canvas.focusHit(hitOf("prop-vtx", "lot", i + 1));
      ctx.canvas.announce(t("Add a property corner"));
      return true;
    }
    const sel = ctx.selection;
    if (!sel || sel.kind !== "prop-vtx" || sel.sub == null) return false;
    if (e.key === "Delete" || e.key === "Backspace") {
      removePropertyCorner(ctx.store, sel.sub);
      return true;
    }
    return false;
  },
};

registerLayer(propertyLayer);
registerLayer(roomsLayer);
