/**
 * Floor-plan editor - the data model.
 *
 *   snapshot config  --parseDoc()-->  EditorDoc (working copy)  --serialize*()-->  wire values
 *
 * Plan coordinates are EDITOR UNITS: 1 unit = 0.2 ft = 0.06096 m, x grows to
 * the right, y grows downward (the 3D renderer treats y as front -> rear).
 * Parsing is tolerant (dict or JSON string, legacy shapes, unknown keys kept in
 * `extra`); serialising is strict and produces exactly what the backend keys
 * expect (frontend/specs/editor.md section 2.2 / 3.3). `planToFeet(serializeRooms(doc))`
 * is what the 3D preview renders, so the preview is the round-trip proof.
 *
 * Everything here is pure (no DOM, no HA access beyond reading `hass.states`).
 * The small geometry the model itself needs (points, bboxes, point-in-polygon,
 * polygon area) lives here; the camera / wall geometry is in ./geometry.ts.
 */
import type { Hass, PanelData } from "../../../types";
import type { Pt2, PlanFeet, ElementsFeet, Floor as RendererFloor } from "../house3d";
import type { BadgeLevel } from "../../../components/jv-state-badge";
import {
  parsePlan, parseElements, planToFeet, elementsToFeet, num, STYLES,
  type FloorPlan, type FloorElements, type EditorRoom, type EditorElement,
} from "../plan";

export type { Pt2 };

// ── constants ───────────────────────────────────────────────────────────────
/** feet per editor unit (plan.ts uses the same constant) */
export const FT_PER_UNIT = 0.2;
export const M_PER_FT = 0.3048;
/** grid lines: minor every 10 u (2 ft), major every 50 u (10 ft) */
export const GRID_MINOR = 10;
export const GRID_MAJOR = 50;
/** snapping: to a 5 u (1 ft) grid and to other rooms' edges within 3 u */
export const SNAP_GRID = 5;
export const SNAP_EDGE_TOL = 3;
/** the smallest room the editor creates / resizes to (units) */
export const MIN_ROOM_W = 15;
export const MIN_ROOM_H = 10;
/** the viewBox used when a floor has nothing on it */
export const EMPTY_FLOOR_BOX: BBox = { x0: 0, y0: 0, x1: 320, y1: 150 };

// ── types ───────────────────────────────────────────────────────────────────
export type FloorKey = string;
export const CANONICAL_FLOORS: ReadonlyArray<{ key: FloorKey; label: string }> = [
  { key: "1f", label: "1st Floor" },
  { key: "2f", label: "2nd Floor" },
  { key: "bsmt", label: "Basement" },
];
export function isCanonical(key: FloorKey): boolean {
  return CANONICAL_FLOORS.some((f) => f.key === key);
}

export type RoomType = "room" | "bath" | "stairs" | "door" | "outdoor";
/** Type options for a room form (English labels: pass through t()). Wire values are the `value`s. */
export const ROOM_TYPES: ReadonlyArray<{ value: RoomType; label: string }> = [
  { value: "room", label: "Room" },
  { value: "bath", label: "Bathroom" },
  { value: "stairs", label: "Stairs" },
  { value: "door", label: "Door" },
  { value: "outdoor", label: "Outdoor zone" },
];

export interface Room {
  /** client-only identity (never serialised): stable across clones for selection / undo */
  id: string;
  /** display name; equal (case-insensitively) to an HA area name lights the room from occupancy */
  name: string;
  /** bounding box - ALWAYS present (residence_graph reads only these) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** "room" | "bath" | "stairs" | "door" | "outdoor" - unknown strings preserved */
  type: RoomType | string;
  /** polygon outline (>= 3 vertices); only for non-rectangular rooms and outdoor zones */
  points?: Pt2[];
  /** every other stored key, round-tripped untouched */
  extra: Record<string, unknown>;
}

/** legacy free text on a floor (the default basement plan has some); read-only, preserved */
export interface PlanLabel {
  text: string;
  x: number;
  y: number;
}

export interface Floor {
  key: FloorKey;
  /** stored label; shown when present, else the canonical label (or the key) */
  label?: string;
  rooms: Room[];
  labels?: PlanLabel[];
  /** e.g. the legacy "viewBox" - preserved, ignored */
  extra: Record<string, unknown>;
  /** true when the floor existed in the stored plan (a synthesised empty canonical floor is not emitted) */
  stored: boolean;
}

export type OpeningType = "window" | "door" | "dormer";
export type DoorKind = "exterior" | "interior" | "french" | "cellar" | "cased";
export type Wall = "front" | "back" | "left" | "right";
export const WALLS: readonly Wall[] = ["front", "back", "left", "right"];
/** kinds anchored to a named room's wall instead of the floor's outer wall */
export const ROOM_ANCHORED_KINDS: ReadonlySet<string> = new Set(["interior", "cased", "french"]);

export interface Opening {
  /** stored; "e" + base36 time when created; a legacy row lacking one gets a stable "e-<floor>-<index>" (legacyId) */
  id: string;
  type: OpeningType;
  /** door: DoorKind; window: null (exterior) | "interior"; dormer: null */
  kind: DoorKind | "interior" | string | null;
  /** outer wall, or the ROOM's wall for room-anchored kinds; unused by dormers */
  wall: Wall;
  /** room NAME for interior | cased | french doors and interior windows */
  room?: string;
  /** dormers only */
  slope?: "front" | "rear";
  /** 0..1 along the wall (left -> right for front/back, top -> bottom for left/right) */
  pos: number;
  /** width in editor units (default 20 = 4 ft); not used by dormers */
  w: number;
  /** open/closed source entity_id or ""; cased openings never have one */
  entity: string;
  extra: Record<string, unknown>;
}

/** The add-buttons of the Openings tab (English labels: pass through t()). */
export const OPENING_PRESETS: ReadonlyArray<{ label: string; type: OpeningType; kind: string | null; slope?: "front" | "rear"; floors?: FloorKey[] }> = [
  { label: "Window", type: "window", kind: null },
  { label: "Interior Window", type: "window", kind: "interior" },
  { label: "Exterior Door", type: "door", kind: "exterior" },
  { label: "Balcony Door", type: "door", kind: "french" },
  { label: "Cellar Door", type: "door", kind: "cellar" },
  { label: "Interior Door", type: "door", kind: "interior" },
  { label: "Cased Opening", type: "door", kind: "cased" },
  { label: "Front Dormer", type: "dormer", kind: null, slope: "front", floors: ["2f"] },
  { label: "Rear Dormer", type: "dormer", kind: null, slope: "rear", floors: ["2f"] },
];

export interface CameraCoverage {
  covered: string[];
  reason: string;
  source: "llm" | "geometry" | string;
  ts: number;
}

export interface CameraPin {
  /** stored; "c" + base36 time; a legacy row lacking one gets a stable "c-<floor>-<index>" (legacyId) */
  id: string;
  x: number;
  y: number;
  /** degrees: 0 = +x (right), 90 = +y (down / rear), 180 = left, 270 = up / front */
  angle: number;
  /** 20..170 step 5 */
  fov: number;
  /** editor units (default 55 = 11 ft); the UI edits it in ft / m */
  range: number;
  /** camera.* or "" */
  entity: string;
  /** true: sight stops at walls; false (outdoor): only the range limits it */
  indoor: boolean;
  /** jarvis/compute_camera_coverage result, saved verbatim */
  coverage?: CameraCoverage;
  extra: Record<string, unknown>;
}

/** NOTE the key is `e`, not `entity`. */
export interface EntityPin {
  e: string;
  x: number;
  y: number;
  extra: Record<string, unknown>;
}

export type DoorSlot = "front" | "garage" | `garage_${number}` | "garage_rear" | "kitchen_garage" | "cellar" | "basement" | string;
/** slot -> entity_id; a missing slot = auto-detect */
export type DoorMapping = Partial<Record<DoorSlot, string>>;
/** the lot outline; [] = none */
export interface Property {
  points: Pt2[];
}
export type Boundary = Property;
/** floor -> data: URL (or an http(s) / absolute path) */
export type Background = Record<FloorKey, string>;
export type Units = "imperial" | "metric";

/** The working copy. Background / opacity / units / door mapping / house keys are NOT in it: they save immediately. */
export interface EditorDoc {
  /** ordered: 1f, 2f, bsmt (those present or enabled), then any other stored keys */
  floors: Floor[];
  openings: Record<FloorKey, Opening[]>;
  cameras: Record<FloorKey, CameraPin[]>;
  pins: Record<FloorKey, EntityPin[]>;
  property: Property;
}

/** The five keys the working copy saves to, in save order. */
export const PLAN_KEYS = ["floor_plan_rooms", "floor_plan_elements", "floor_plan_cameras", "floor_plan_entities", "floor_plan_property"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/** The immediate-save settings read from the snapshot (section 2.2 "immediately" rows). */
export interface EditorSettings {
  units: Units;
  bg: Background;
  bgOpacity: number;
  doorMapping: DoorMapping;
}

/** House-shape keys (section 2.2 table). `label` is an English t() key; residence_style's options are STYLES. */
export interface HouseKeySpec {
  key: string;
  kind: "enum" | "bool" | "int" | "str";
  label: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  min?: number;
  max?: number;
  /** blank clears the key (the editor sends null) */
  nullable?: boolean;
}
export const HOUSE_KEYS: readonly HouseKeySpec[] = [
  { key: "residence_style", kind: "str", label: "HOME STYLE", options: STYLES.map((s) => ({ value: s.id, label: s.label })) },
  { key: "home_stories", kind: "enum", label: "Stories", options: ["1", "1.5", "2", "3"].map((v) => ({ value: v, label: v })) },
  { key: "has_basement", kind: "bool", label: "Has basement" },
  { key: "dormers_front", kind: "int", label: "Front dormers", min: 0, max: 3 },
  { key: "dormers_rear", kind: "int", label: "Rear dormers", min: 0, max: 2 },
  { key: "garage_bays", kind: "int", label: "Garage bays", min: 0, max: 4 },
  { key: "chimney_side", kind: "enum", label: "Chimney side", options: [{ value: "right", label: "Right" }, { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "none", label: "None" }] },
  { key: "chimney_count", kind: "int", label: "Chimney count", min: 1, max: 4 },
  { key: "basement_entrance", kind: "enum", label: "Basement entrance", options: [{ value: "bulkhead", label: "Bulkhead" }, { value: "interior", label: "Interior" }] },
  { key: "home_bedrooms", kind: "int", label: "Bedrooms", min: 0, max: 20, nullable: true },
  { key: "home_bathrooms", kind: "int", label: "Bathrooms", min: 0, max: 20, nullable: true },
  { key: "floor_plan_sqft", kind: "int", label: "Square footage", min: 0, max: 100000, nullable: true },
];

/** What is selected on the canvas. `sub` is a vertex index for `vtx` (room polygon) / `prop-vtx` (lot). */
export type SelectionKind = "room" | "opening" | "camera" | "pin" | "vtx" | "prop-vtx";
export interface Selection {
  kind: SelectionKind | string;
  id: string;
  sub?: number;
}

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// ── small helpers ───────────────────────────────────────────────────────────
export const ri = (v: number): number => Math.round(v);
export const r1 = (v: number): number => Math.round(v * 10) / 10;
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** string: "" -> null, else JSON.parse (null on error); anything else as-is. */
export function parseJsonish(raw: unknown): unknown {
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

/** A plain object (not an array), else null. */
export function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function isPt2(p: unknown): p is Pt2 {
  return Array.isArray(p) && p.length >= 2 && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]));
}

/** An array of >= 3 numeric pairs, else undefined. */
export function parsePoints(raw: unknown): Pt2[] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) return undefined;
  const pts: Pt2[] = [];
  for (const p of raw) {
    if (!isPt2(p)) return undefined;
    pts.push([Number(p[0]), Number(p[1])]);
  }
  return pts;
}

/** Deep copy for undo snapshots (structuredClone, JSON fallback). */
export function cloneDoc<T>(v: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(v);
  } catch {
    /* fall through */
  }
  return JSON.parse(JSON.stringify(v)) as T;
}

let _seq = 0;
/** A client-only id ("r" + base36) - rooms only; never serialised. */
export function newRoomId(): string {
  _seq += 1;
  return `r${Date.now().toString(36)}${_seq.toString(36)}`;
}
/** A stored id: `prefix` + base36 time, de-duplicated against `existing`. */
export function newStoredId(prefix: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  const base = prefix + Date.now().toString(36);
  if (!taken.has(base)) return base;
  let i = 1;
  while (taken.has(base + i.toString(36))) i++;
  return base + i.toString(36);
}
/**
 * The id of a stored row that has none: derived from where the row sits
 * (`e-1f-0`), NOT from the clock, so every re-parse of the same snapshot
 * gives the same id and the baseline does not change on each refresh.
 * Save writes it, after which the row has a real stored id.
 */
export function legacyId(prefix: string, floorKey: FloorKey, index: number, existing: Iterable<string>): string {
  const taken = new Set(existing);
  const base = `${prefix}-${String(floorKey).replace(/[^A-Za-z0-9_-]/g, "_")}-${index}`;
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// ── geometry the model itself needs ─────────────────────────────────────────
/** The polygon of a room: its points when >= 3, else the 4 bbox corners. */
export function roomPoints(r: Pick<Room, "x" | "y" | "w" | "h" | "points">): Pt2[] {
  if (r.points && r.points.length >= 3) return r.points;
  return [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
}

export function bboxOfPoints(pts: readonly Pt2[]): BBox | null {
  if (!pts.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}

export function unionBBox(a: BBox | null, b: BBox | null): BBox | null {
  if (!a) return b;
  if (!b) return a;
  return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
}

export function roomBBox(r: Pick<Room, "x" | "y" | "w" | "h">): BBox {
  return { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h };
}

/** Re-derive x/y/w/h from the polygon (integers) so the two never disagree. */
export function syncBBox(r: Room): Room {
  const bb = r.points && r.points.length >= 3 ? bboxOfPoints(r.points) : null;
  if (bb) {
    r.x = ri(bb.x0);
    r.y = ri(bb.y0);
    r.w = ri(bb.x1 - bb.x0);
    r.h = ri(bb.y1 - bb.y0);
  }
  return r;
}

/** Even-odd ray test. */
export function pointInPoly(x: number, y: number, pts: readonly Pt2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Shoelace area (units^2). */
export function polygonArea(pts: readonly Pt2[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}

/** Bbox of the ENCLOSED rooms (type !== "outdoor"): the house outline openings / cameras anchor to. */
export function floorBBox(rooms: readonly Room[]): BBox | null {
  let bb: BBox | null = null;
  for (const r of rooms) if (r.type !== "outdoor") bb = unionBBox(bb, roomBBox(r));
  return bb;
}

/** Everything drawn on a floor (rooms incl. outdoor, lot, cameras, pins) - for the viewBox fit. */
export function contentBBox(doc: EditorDoc, floor: FloorKey): BBox | null {
  let bb: BBox | null = null;
  const f = floorOf(doc, floor);
  for (const r of f?.rooms || []) bb = unionBBox(bb, bboxOfPoints(roomPoints(r)));
  bb = unionBBox(bb, bboxOfPoints(doc.property.points));
  for (const c of doc.cameras[floor] || []) bb = unionBBox(bb, { x0: c.x, y0: c.y, x1: c.x, y1: c.y });
  for (const p of doc.pins[floor] || []) bb = unionBBox(bb, { x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  return bb;
}

/** The box an opening is placed on: the named room for room-anchored kinds, else the floor. */
export function anchorBox(o: Pick<Opening, "kind" | "room">, rooms: readonly Room[]): BBox | null {
  if (o.kind && ROOM_ANCHORED_KINDS.has(o.kind) && o.room) {
    const rr = rooms.find((r) => r.name === o.room);
    if (rr) return roomBBox(rr);
  }
  return floorBBox(rooms);
}

/** The floor drawn as a ghost under `floor` (2f -> 1f, 1f -> bsmt). */
export function floorBelow(floor: FloorKey): FloorKey | null {
  return floor === "2f" ? "1f" : floor === "1f" ? "bsmt" : null;
}

// ── parsing: snapshot -> EditorDoc ──────────────────────────────────────────
export interface ParsedDoc {
  doc: EditorDoc;
  /** false when floor_plan_rooms is unset and the sample plan is shown */
  configured: boolean;
  warnings: string[];
}

/** `2f` needs home_stories !== "1"; `bsmt` needs has_basement not false; `1f` and other keys are always enabled. */
export function floorEnabled(config: Record<string, unknown>, key: FloorKey): boolean {
  if (key === "2f") return String(config.home_stories ?? "1.5") !== "1";
  if (key === "bsmt") return config.has_basement !== false && config.has_basement !== "false";
  return true;
}

function parseRoom(raw: unknown, floorKey: FloorKey, warnings: string[]): Room | null {
  const o = asRecord(raw);
  if (!o) return null;
  const { name, x, y, w, h, type, points, ...rest } = o;
  let hv: unknown = h;
  if (hv === undefined && "d" in rest) {
    hv = rest.d; // the renderer's name for depth
    delete rest.d;
  }
  const room: Room = {
    id: newRoomId(),
    name: String(name ?? ""),
    x: Number(x) || 0,
    y: Number(y) || 0,
    w: Number(w) || 0,
    h: Number(hv) || 0,
    type: typeof type === "string" && type ? type : "room",
    extra: rest,
  };
  const pts = parsePoints(points);
  if (pts) {
    // 1 decimal, exactly what serializeRoom writes: the bbox derived from these is then the one
    // the next parse derives too (unrounded points could shift it by a unit after a save)
    room.points = pts.map((p): Pt2 => [r1(p[0]), r1(p[1])]);
    syncBBox(room);
  } else if (room.w <= 0 || room.h <= 0) {
    warnings.push(`"${room.name}" on ${floorKey} has no size`);
  }
  return room;
}

function parseLabels(raw: unknown): PlanLabel[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PlanLabel[] = [];
  for (const l of raw) {
    const o = asRecord(l);
    if (!o || typeof o.text !== "string") continue;
    out.push({ text: o.text, x: Number(o.x) || 0, y: Number(o.y) || 0 });
  }
  return out;
}

function parseFloor(key: FloorKey, raw: unknown, warnings: string[]): Floor | null {
  let roomsRaw: unknown;
  let label: string | undefined;
  let labels: PlanLabel[] | undefined;
  let extra: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    roomsRaw = raw; // legacy: a bare array of rooms (residence_graph tolerates it too)
  } else {
    const o = asRecord(raw);
    if (!o) {
      warnings.push(`floor ${key} is not an object`);
      return null;
    }
    const { rooms, label: lb, labels: ls, ...rest } = o;
    roomsRaw = rooms;
    label = typeof lb === "string" ? lb : undefined;
    labels = parseLabels(ls);
    extra = rest;
  }
  const rooms: Room[] = [];
  for (const r of Array.isArray(roomsRaw) ? roomsRaw : []) {
    const room = parseRoom(r, key, warnings);
    if (room) rooms.push(room);
  }
  const floor: Floor = { key, rooms, extra, stored: true };
  if (label !== undefined) floor.label = label;
  if (labels) floor.labels = labels;
  return floor;
}

function parseOpening(raw: unknown, existing: Set<string>, floorKey: FloorKey, index: number, warnings: string[]): Opening | null {
  const o = asRecord(raw);
  if (!o) return null;
  const { id, type, kind, wall, room, slope, pos, w, entity, ...rest } = o;
  if (type !== "window" && type !== "door" && type !== "dormer") {
    warnings.push(`opening of unknown type "${String(type)}" on ${floorKey} dropped`);
    return null;
  }
  const p = Number(pos);
  const out: Opening = {
    id: typeof id === "string" && id ? id : legacyId("e", floorKey, index, existing),
    type,
    kind: typeof kind === "string" && kind ? kind : null,
    wall: (WALLS as readonly string[]).includes(String(wall)) ? (wall as Wall) : "front",
    pos: Number.isFinite(p) ? clamp(p, 0, 1) : 0.5,
    w: Number(w) || 20,
    entity: typeof entity === "string" ? entity : "",
    extra: rest,
  };
  existing.add(out.id);
  if (typeof room === "string" && room) out.room = room;
  if (type === "dormer") out.slope = slope === "rear" ? "rear" : "front";
  else if (slope !== undefined) out.extra.slope = slope; // not a window / door field: kept untouched, like any unknown key
  return out;
}

function parseCamera(raw: unknown, existing: Set<string>, floorKey: FloorKey, index: number): CameraPin | null {
  const o = asRecord(raw);
  if (!o) return null;
  const { id, x, y, angle, fov, range, entity, indoor, coverage, ...rest } = o;
  const cam: CameraPin = {
    id: typeof id === "string" && id ? id : legacyId("c", floorKey, index, existing),
    x: Number(x) || 0,
    y: Number(y) || 0,
    angle: num(angle) ?? 270,
    fov: clamp(num(fov) ?? 90, 20, 170),
    range: Math.max(5, num(range) ?? 55),
    entity: typeof entity === "string" ? entity : "",
    indoor: indoor !== false,
    extra: rest,
  };
  existing.add(cam.id);
  const cov = asRecord(coverage);
  if (cov && Array.isArray(cov.covered)) {
    cam.coverage = {
      covered: cov.covered.map((c) => String(c)),
      reason: typeof cov.reason === "string" ? cov.reason : "",
      source: typeof cov.source === "string" ? cov.source : "geometry",
      ts: num(cov.ts) ?? 0,
    };
  }
  return cam;
}

function parsePin(raw: unknown): EntityPin | null {
  const o = asRecord(raw);
  if (!o || typeof o.e !== "string" || !o.e) return null;
  const { e, x, y, ...rest } = o;
  return { e: e as string, x: Number(x) || 0, y: Number(y) || 0, extra: rest };
}

function perFloor<T>(raw: unknown, parse: (row: unknown, key: FloorKey, index: number) => T | null): Record<FloorKey, T[]> {
  const out: Record<FloorKey, T[]> = {};
  const rec = asRecord(parseJsonish(raw));
  if (!rec) return out;
  for (const key of Object.keys(rec)) {
    const list = rec[key];
    if (!Array.isArray(list)) continue;
    const rows: T[] = [];
    list.forEach((row, i) => {
      const v = parse(row, key, i);
      if (v) rows.push(v);
    });
    out[key] = rows;
  }
  return out;
}

const floorRank = (k: FloorKey): number => {
  const i = CANONICAL_FLOORS.findIndex((f) => f.key === k);
  return i < 0 ? CANONICAL_FLOORS.length : i;
};
/** 1f, 2f, bsmt, then the other keys in their stored order (stable sort). */
function sortFloors(floors: Floor[]): Floor[] {
  return floors.sort((a, b) => floorRank(a.key) - floorRank(b.key));
}

/** Snapshot `config` -> working copy. Never throws; problems land in `warnings`. */
export function parseDoc(config: Record<string, unknown> | null | undefined): ParsedDoc {
  const cfg = config || {};
  const warnings: string[] = [];
  const { plan, configured } = parsePlan(cfg.floor_plan_rooms);
  const floors: Floor[] = [];
  const planRec = plan as unknown as Record<string, unknown>;
  for (const key of Object.keys(planRec)) {
    const f = parseFloor(key, planRec[key], warnings);
    if (f) floors.push(f);
  }
  for (const c of CANONICAL_FLOORS) {
    if (!floors.some((f) => f.key === c.key) && floorEnabled(cfg, c.key)) floors.push({ key: c.key, rooms: [], extra: {}, stored: false });
  }
  sortFloors(floors);

  const openingIds = new Set<string>();
  const openings: Record<FloorKey, Opening[]> = {};
  const elRaw = parseElements(cfg.floor_plan_elements) as Record<string, unknown>;
  for (const key of Object.keys(elRaw)) {
    const list = elRaw[key];
    if (!Array.isArray(list)) continue;
    const rows: Opening[] = [];
    list.forEach((row, i) => {
      const o = parseOpening(row, openingIds, key, i, warnings);
      if (o) rows.push(o);
    });
    openings[key] = rows;
  }
  const cameraIds = new Set<string>();
  const cameras = perFloor(cfg.floor_plan_cameras, (row, key, i) => parseCamera(row, cameraIds, key, i));
  const pins = perFloor(cfg.floor_plan_entities, parsePin);
  const propRaw = asRecord(parseJsonish(cfg.floor_plan_property));
  const property: Property = { points: (propRaw && parsePoints(propRaw.points)) || [] };

  return { doc: { floors, openings, cameras, pins, property }, configured, warnings };
}

/**
 * Follow home_stories / has_basement in a doc that is kept across snapshots:
 * add the empty canonical floors that are now enabled and drop the
 * synthesised ones (never stored, nothing on them) that are now disabled.
 * Such floors never serialise, so the plan and the dirty state are untouched.
 * Returns a new doc (sharing everything but `floors`), or null when nothing changes.
 */
export function syncFloors(doc: EditorDoc, config: Record<string, unknown>): EditorDoc | null {
  const vacant = (f: Floor): boolean =>
    !f.stored && !f.rooms.length && f.label === undefined && !f.labels?.length && !Object.keys(f.extra).length &&
    !doc.openings[f.key]?.length && !doc.cameras[f.key]?.length && !doc.pins[f.key]?.length;
  let floors = doc.floors.filter((f) => !(isCanonical(f.key) && !floorEnabled(config, f.key) && vacant(f)));
  let changed = floors.length !== doc.floors.length;
  for (const c of CANONICAL_FLOORS) {
    if (floorEnabled(config, c.key) && !floors.some((f) => f.key === c.key)) {
      floors = [...floors, { key: c.key, rooms: [], extra: {}, stored: false }];
      changed = true;
    }
  }
  return changed ? { ...doc, floors: sortFloors(floors) } : null;
}

export function parseBackground(raw: unknown): Background {
  const out: Background = {};
  const rec = asRecord(parseJsonish(raw));
  if (!rec) return out;
  for (const k of Object.keys(rec)) {
    const v = rec[k];
    if (typeof v === "string" && /^(data:|\/|https?:)/.test(v)) out[k] = v;
  }
  return out;
}

/** 0..1, default 0.2 when unset / not finite / out of range. */
export function parseOpacity(raw: unknown): number {
  const v = num(raw);
  return v != null && v >= 0 && v <= 1 ? v : 0.2;
}

export function parseUnits(raw: unknown): Units {
  return raw === "metric" ? "metric" : "imperial";
}

export function parseDoorMapping(raw: unknown): DoorMapping {
  const out: DoorMapping = {};
  const rec = asRecord(parseJsonish(raw));
  if (!rec) return out;
  for (const k of Object.keys(rec)) if (typeof rec[k] === "string" && rec[k]) out[k] = rec[k] as string;
  return out;
}

export function parseSettings(config: Record<string, unknown> | null | undefined): EditorSettings {
  const cfg = config || {};
  return {
    units: parseUnits(cfg.floor_plan_units),
    bg: parseBackground(cfg.floor_plan_bg),
    bgOpacity: parseOpacity(cfg.floor_plan_bg_opacity),
    doorMapping: parseDoorMapping(cfg.door_mapping),
  };
}

// ── serialising: EditorDoc -> wire values ───────────────────────────────────
export function serializeRoom(r: Room): EditorRoom {
  // a polygon's bbox comes from the points AS WRITTEN (1 decimal), so parse(serialize(doc)) gives the same bbox back
  const pts = r.points && r.points.length >= 3 ? r.points.map((p): Pt2 => [r1(p[0]), r1(p[1])]) : null;
  const box = pts ? syncBBox({ x: r.x, y: r.y, w: r.w, h: r.h, points: pts } as Room) : r;
  const out: Record<string, unknown> = { ...r.extra, name: r.name, x: ri(box.x), y: ri(box.y), w: ri(box.w), h: ri(box.h), type: r.type };
  if (pts) out.points = pts;
  return out as unknown as EditorRoom;
}

/** Floors with rooms, a stored label/labels/extra, or that were stored before; synthesised empty floors are omitted. */
export function serializeRooms(doc: EditorDoc): FloorPlan {
  const out: Record<string, unknown> = {};
  for (const f of doc.floors) {
    const keep = f.rooms.length > 0 || f.label !== undefined || (f.labels && f.labels.length > 0) || Object.keys(f.extra).length > 0 || f.stored;
    if (!keep) continue;
    const fl: Record<string, unknown> = {};
    if (f.label !== undefined) fl.label = f.label;
    fl.rooms = f.rooms.map(serializeRoom);
    if (f.labels && f.labels.length) fl.labels = f.labels.map((l) => ({ text: l.text, x: l.x, y: l.y }));
    Object.assign(fl, f.extra);
    out[f.key] = fl;
  }
  return out as unknown as FloorPlan;
}

export function serializeOpening(o: Opening): EditorElement {
  const out: Record<string, unknown> = { ...o.extra, id: o.id, type: o.type, kind: o.kind ?? null };
  if (o.type === "dormer") {
    out.slope = o.slope ?? "front";
  } else {
    out.wall = o.wall;
  }
  out.pos = o.pos;
  if (o.type !== "dormer") out.w = o.w;
  out.entity = o.entity;
  if (o.room) out.room = o.room;
  return out as unknown as EditorElement;
}

/** Only floors with at least one opening are emitted. */
export function serializeElements(doc: EditorDoc): FloorElements {
  const out: FloorElements = {};
  for (const key of Object.keys(doc.openings)) {
    const list = doc.openings[key];
    if (list && list.length) out[key] = list.map(serializeOpening);
  }
  return out;
}

export function serializeCamera(c: CameraPin): Record<string, unknown> {
  const out: Record<string, unknown> = { ...c.extra, id: c.id, x: ri(c.x), y: ri(c.y), angle: c.angle, fov: c.fov, range: c.range, entity: c.entity, indoor: c.indoor };
  if (c.coverage) out.coverage = { covered: [...c.coverage.covered], reason: c.coverage.reason, source: c.coverage.source, ts: c.coverage.ts };
  return out;
}

export function serializeCameras(doc: EditorDoc): Record<FloorKey, Record<string, unknown>[]> {
  const out: Record<FloorKey, Record<string, unknown>[]> = {};
  for (const key of Object.keys(doc.cameras)) {
    const list = doc.cameras[key];
    if (list && list.length) out[key] = list.map(serializeCamera);
  }
  return out;
}

export function serializePin(p: EntityPin): Record<string, unknown> {
  return { ...p.extra, e: p.e, x: ri(p.x), y: ri(p.y) };
}

export function serializePins(doc: EditorDoc): Record<FloorKey, Record<string, unknown>[]> {
  const out: Record<FloorKey, Record<string, unknown>[]> = {};
  for (const key of Object.keys(doc.pins)) {
    const list = doc.pins[key];
    if (list && list.length) out[key] = list.map(serializePin);
  }
  return out;
}

export function serializeProperty(doc: EditorDoc): { points: Pt2[] } {
  return { points: doc.property.points.length >= 3 ? doc.property.points.map((p): Pt2 => [ri(p[0]), ri(p[1])]) : [] };
}

/** All five plan keys, as `jarvis/update_config` values. */
export function serializeAll(doc: EditorDoc): Record<PlanKey, unknown> {
  return {
    floor_plan_rooms: serializeRooms(doc),
    floor_plan_elements: serializeElements(doc),
    floor_plan_cameras: serializeCameras(doc),
    floor_plan_entities: serializePins(doc),
    floor_plan_property: serializeProperty(doc),
  };
}

/** Stable text of a serialised value (for dirty / baseline comparison). */
export function stableJson(v: unknown): string {
  return JSON.stringify(v);
}

/** The 3D renderer's inputs, from the SERIALISED doc (exactly what the Residence view would get after a save). */
export function docToFeet(doc: EditorDoc): PlanFeet {
  return planToFeet(serializeRooms(doc));
}
export function docElementsToFeet(doc: EditorDoc, hass: Hass | undefined): ElementsFeet {
  return elementsToFeet(serializeElements(doc), hass);
}
/** Editor floor key -> renderer floor ("bsmt" -> "b"; unknown keys -> "all"). */
export function rendererFloor(key: FloorKey | "all"): RendererFloor {
  if (key === "bsmt") return "b";
  if (key === "1f" || key === "2f") return key;
  return "all";
}

// ── units ───────────────────────────────────────────────────────────────────
/** editor units -> ft or m, 1 decimal */
export function toReal(units: number, u: Units): number {
  const ft = units * FT_PER_UNIT;
  return u === "metric" ? r1(ft * M_PER_FT) : r1(ft);
}
/** ft or m -> editor units (integer, at least `min`) */
export function fromReal(v: number, u: Units, min = 1): number {
  const ft = u === "metric" ? v / M_PER_FT : v;
  return Math.max(min, ri(ft / FT_PER_UNIT));
}
export function unitLabel(u: Units): "ft" | "m" {
  return u === "metric" ? "m" : "ft";
}
/** "12.4 ft" / "3.8 m" */
export function dim(units: number, u: Units): string {
  return `${toReal(units, u)} ${unitLabel(u)}`;
}
/** Lot / room area text: sq ft or acres; m² or ha. */
export function area(pts: readonly Pt2[], u: Units): string {
  if (pts.length < 3) return "";
  const sqFt = polygonArea(pts) * FT_PER_UNIT * FT_PER_UNIT;
  if (u === "metric") {
    const sqM = sqFt * 0.092903;
    return sqM >= 10000 ? `${(sqM / 10000).toFixed(2)} ha` : `${Math.round(sqM).toLocaleString()} m²`;
  }
  return sqFt >= 43560 ? `${(sqFt / 43560).toFixed(2)} acres` : `${Math.round(sqFt).toLocaleString()} sq ft`;
}

// ── floors ──────────────────────────────────────────────────────────────────
export function floorOf(doc: EditorDoc, key: FloorKey): Floor | undefined {
  return doc.floors.find((f) => f.key === key);
}
/** The floor, created (unstored, empty) when missing. */
export function ensureFloor(doc: EditorDoc, key: FloorKey): Floor {
  let f = floorOf(doc, key);
  if (!f) {
    f = { key, rooms: [], extra: {}, stored: false };
    doc.floors.push(f);
  }
  return f;
}
/** `map[floor]`, created when missing. */
export function listFor<T>(map: Record<FloorKey, T[]>, floor: FloorKey): T[] {
  return (map[floor] ??= []);
}
/** Stored label, else the canonical English label (a t() key), else the key. */
export function floorLabel(floor: Floor | FloorKey): string {
  const key = typeof floor === "string" ? floor : floor.key;
  const stored = typeof floor === "string" ? undefined : floor.label;
  return stored || CANONICAL_FLOORS.find((f) => f.key === key)?.label || key;
}

// ── lookups & doc operations ────────────────────────────────────────────────
export function findRoom(doc: EditorDoc, id: string): { floor: Floor; room: Room; index: number } | null {
  for (const floor of doc.floors) {
    const index = floor.rooms.findIndex((r) => r.id === id);
    if (index >= 0) return { floor, room: floor.rooms[index], index };
  }
  return null;
}
export function findOpening(doc: EditorDoc, id: string): { floor: FloorKey; opening: Opening; index: number } | null {
  for (const floor of Object.keys(doc.openings)) {
    const index = doc.openings[floor].findIndex((o) => o.id === id);
    if (index >= 0) return { floor, opening: doc.openings[floor][index], index };
  }
  return null;
}
export function findCamera(doc: EditorDoc, id: string): { floor: FloorKey; camera: CameraPin; index: number } | null {
  for (const floor of Object.keys(doc.cameras)) {
    const index = doc.cameras[floor].findIndex((c) => c.id === id);
    if (index >= 0) return { floor, camera: doc.cameras[floor][index], index };
  }
  return null;
}
export function findPin(doc: EditorDoc, e: string, floor?: FloorKey): { floor: FloorKey; pin: EntityPin; index: number } | null {
  for (const fk of floor ? [floor] : Object.keys(doc.pins)) {
    const list = doc.pins[fk] || [];
    const index = list.findIndex((p) => p.e === e);
    if (index >= 0) return { floor: fk, pin: list[index], index };
  }
  return null;
}

/*
 * Pins are keyed by entity id, and one entity may be pinned on several floors:
 * the selection helpers below take the floor the pin selection belongs to
 * (the store passes its current floor). Without one they search every floor.
 */

/** True when the selection still points at something in `doc`. */
export function selectionExists(doc: EditorDoc, sel: Selection | null, floor?: FloorKey): boolean {
  if (!sel) return false;
  switch (sel.kind) {
    case "room":
      return !!findRoom(doc, sel.id);
    case "vtx": {
      const r = findRoom(doc, sel.id)?.room;
      return !!r?.points && sel.sub != null && sel.sub < r.points.length;
    }
    case "opening":
      return !!findOpening(doc, sel.id);
    case "camera":
      return !!findCamera(doc, sel.id);
    case "pin":
      return !!findPin(doc, sel.id, floor);
    case "prop-vtx":
      return sel.sub != null && sel.sub < doc.property.points.length;
    default:
      return false;
  }
}

/** Translate a room (rect or polygon) by (dx, dy) and keep its bbox in sync. */
export function translateRoom(room: Room, dx: number, dy: number): void {
  room.x += dx;
  room.y += dy;
  if (room.points) {
    room.points = room.points.map((p): Pt2 => [r1(p[0] + dx), r1(p[1] + dy)]);
    syncBBox(room);
  } else {
    room.x = ri(room.x);
    room.y = ri(room.y);
  }
}

/**
 * Nudge the selected object by (dx, dy) editor units (keyboard arrows, generic
 * drags). Openings move along their wall (`pos`). Returns an English history
 * label like "Move Kitchen", or null when nothing moved.
 */
export function moveSelection(doc: EditorDoc, sel: Selection | null, dx: number, dy: number, floor?: FloorKey): string | null {
  if (!sel || (!dx && !dy)) return null;
  switch (sel.kind) {
    case "room": {
      const hit = findRoom(doc, sel.id);
      if (!hit) return null;
      translateRoom(hit.room, dx, dy);
      return `Move ${hit.room.name || "room"}`;
    }
    case "vtx": {
      const hit = findRoom(doc, sel.id);
      const pts = hit?.room.points;
      if (!hit || !pts || sel.sub == null || !pts[sel.sub]) return null;
      pts[sel.sub] = [r1(pts[sel.sub][0] + dx), r1(pts[sel.sub][1] + dy)];
      syncBBox(hit.room);
      return `Reshape ${hit.room.name || "room"}`;
    }
    case "prop-vtx": {
      const p = doc.property.points[sel.sub ?? -1];
      if (!p) return null;
      doc.property.points[sel.sub as number] = [ri(p[0] + dx), ri(p[1] + dy)];
      return "Move property corner";
    }
    case "camera": {
      const hit = findCamera(doc, sel.id);
      if (!hit) return null;
      hit.camera.x = ri(hit.camera.x + dx);
      hit.camera.y = ri(hit.camera.y + dy);
      return "Move camera";
    }
    case "pin": {
      const hit = findPin(doc, sel.id, floor);
      if (!hit) return null;
      hit.pin.x = ri(hit.pin.x + dx);
      hit.pin.y = ri(hit.pin.y + dy);
      return `Move ${hit.pin.e}`;
    }
    case "opening": {
      const hit = findOpening(doc, sel.id);
      if (!hit) return null;
      const o = hit.opening;
      const rooms = floorOf(doc, hit.floor)?.rooms || [];
      const bb = anchorBox(o, rooms);
      if (!bb) return null;
      const horizontal = o.type === "dormer" || o.wall === "front" || o.wall === "back";
      const span = horizontal ? bb.x1 - bb.x0 : bb.y1 - bb.y0;
      if (span <= 0) return null;
      o.pos = clamp(Math.round((o.pos + (horizontal ? dx : dy) / span) * 1000) / 1000, 0, 1);
      return "Move opening";
    }
    default:
      return null;
  }
}

/**
 * Remove the selected object. A room takes the openings anchored to its name
 * with it (they would silently become floor-anchored otherwise); a polygon or
 * lot corner is refused below 3 vertices. Returns the English label
 * ("Removed Kitchen") or null when nothing was removed.
 */
export function removeSelection(doc: EditorDoc, sel: Selection | null, floor?: FloorKey): string | null {
  if (!sel) return null;
  switch (sel.kind) {
    case "room": {
      const hit = findRoom(doc, sel.id);
      if (!hit) return null;
      hit.floor.rooms.splice(hit.index, 1);
      const list = doc.openings[hit.floor.key];
      if (list && hit.room.name) doc.openings[hit.floor.key] = list.filter((o) => o.room !== hit.room.name);
      return `Removed ${hit.room.name || "room"}`;
    }
    case "vtx": {
      const hit = findRoom(doc, sel.id);
      const pts = hit?.room.points;
      if (!hit || !pts || pts.length <= 3 || sel.sub == null || !pts[sel.sub]) return null;
      pts.splice(sel.sub, 1);
      syncBBox(hit.room);
      return `Removed a corner of ${hit.room.name || "room"}`;
    }
    case "prop-vtx": {
      const pts = doc.property.points;
      if (pts.length <= 3 || sel.sub == null || !pts[sel.sub]) return null;
      pts.splice(sel.sub, 1);
      return "Removed a property corner";
    }
    case "opening": {
      const hit = findOpening(doc, sel.id);
      if (!hit) return null;
      doc.openings[hit.floor].splice(hit.index, 1);
      return "Removed opening";
    }
    case "camera": {
      const hit = findCamera(doc, sel.id);
      if (!hit) return null;
      doc.cameras[hit.floor].splice(hit.index, 1);
      return "Removed camera";
    }
    case "pin": {
      const hit = findPin(doc, sel.id, floor);
      if (!hit) return null;
      doc.pins[hit.floor].splice(hit.index, 1);
      return `Removed ${hit.pin.e}`;
    }
    default:
      return null;
  }
}

/** Name + size of the selection for the aria-live announcement (sizes in editor units; null when nothing is selected). */
export function describeSelection(doc: EditorDoc, sel: Selection | null, floor?: FloorKey): { name: string; w?: number; h?: number } | null {
  if (!sel) return null;
  switch (sel.kind) {
    case "room":
    case "vtx": {
      const r = findRoom(doc, sel.id)?.room;
      return r ? { name: r.name || "room", w: r.w, h: r.h } : null;
    }
    case "opening": {
      const o = findOpening(doc, sel.id)?.opening;
      return o ? { name: `${o.kind ? o.kind + " " : ""}${o.type}`, w: o.w } : null;
    }
    case "camera":
      return findCamera(doc, sel.id) ? { name: findCamera(doc, sel.id)?.camera.entity || "camera" } : null;
    case "pin":
      return findPin(doc, sel.id, floor) ? { name: sel.id } : null;
    case "prop-vtx":
      return { name: "property corner" };
    default:
      return null;
  }
}

// ── area names (what lights a room on the Residence tab) ────────────────────
/** The key planToFeet() / litMap() match on: lower-cased, trimmed. */
export function areaKey(name: unknown): string {
  return String(name ?? "").trim().toLowerCase();
}
/** Area names from the snapshot (areas with capabilities only - see editor.md R9). */
export function areaNames(data: PanelData | null | undefined): string[] {
  return (data?.areas || []).map((a) => String(a.name || "")).filter(Boolean);
}
export function roomHasArea(name: string, areas: readonly string[]): boolean {
  const k = areaKey(name);
  return !!k && areas.some((a) => areaKey(a) === k);
}
/** Rooms (optionally of one floor) whose name matches no area name. */
export function unmatchedRooms(doc: EditorDoc, areas: readonly string[], floor?: FloorKey): Room[] {
  const out: Room[] = [];
  for (const f of doc.floors) {
    if (floor && f.key !== floor) continue;
    for (const r of f.rooms) if (r.type !== "outdoor" && !roomHasArea(r.name, areas)) out.push(r);
  }
  return out;
}

// ── door slots (Doors tab, section 3.7) ─────────────────────────────────────
export interface DoorSlotDef {
  slot: DoorSlot;
  /** English t() key; `{n}` for per-bay slots */
  label: string;
  n?: number;
  /** honoured by door_state.DOOR_SLOTS (false: `garage_<n>` is client-only) */
  backend: boolean;
}
export const BACKEND_DOOR_SLOTS: ReadonlySet<string> = new Set(["front", "garage", "garage_rear", "kitchen_garage", "cellar", "basement"]);

/** The slot list for the current garage_bays (clamped 0..8). */
export function doorSlots(config: Record<string, unknown>): DoorSlotDef[] {
  const bays = clamp(num(config.garage_bays) ?? 0, 0, 8);
  const out: DoorSlotDef[] = [{ slot: "front", label: "Front Door", backend: true }];
  if (bays >= 1) for (let i = 1; i <= bays; i++) out.push({ slot: `garage_${i}`, label: "Garage Door {n}", n: i, backend: false });
  else out.push({ slot: "garage", label: "Garage Door", backend: true });
  out.push(
    { slot: "garage_rear", label: "Garage Side / Rear", backend: true },
    { slot: "kitchen_garage", label: "Kitchen ↔ Garage", backend: true },
    { slot: "cellar", label: "Cellar / Bulkhead", backend: true },
    { slot: "basement", label: "Basement", backend: true },
  );
  return out;
}
/** Mapped slots that are not in the current slot list (e.g. garage_3 after the bays dropped to 2). */
export function otherMappedSlots(mapping: DoorMapping, slots: readonly DoorSlotDef[]): string[] {
  const known = new Set(slots.map((s) => s.slot));
  return Object.keys(mapping).filter((k) => !known.has(k) && mapping[k]);
}

// ── entities: names, pickers, pin live state ────────────────────────────────
/** friendly_name, else the id. Never throws for a missing state. */
export function friendlyName(hass: Hass | undefined | null, entityId: string): string {
  const fn = hass?.states?.[entityId]?.attributes?.friendly_name;
  return typeof fn === "string" && fn ? fn : entityId;
}
export function entityExists(hass: Hass | undefined | null, entityId: string): boolean {
  return !!hass?.states?.[entityId];
}
export function allEntityIds(hass: Hass | undefined | null): string[] {
  return Object.keys(hass?.states || {}).sort();
}
/** Every camera.* id (a `selected` id that no longer exists is kept at the front). */
export function cameraCandidates(hass: Hass | undefined | null, selected = ""): string[] {
  const ids = Object.keys(hass?.states || {}).filter((e) => e.startsWith("camera.")).sort();
  if (selected && !ids.includes(selected)) ids.unshift(selected);
  return ids;
}
const OPEN_DC = new Set(["door", "window", "garage_door", "opening"]);
const OPEN_RE = /door|garage|gate|cellar|bulkhead|hatch|window|contact|entry|slider|sash|casement|patio|french|skylight|opening|sliding/i;
/** Open/closed sources for openings and door slots: covers, locks, contact-like binary_sensors. */
export function doorEntityCandidates(hass: Hass | undefined | null, selected = ""): string[] {
  const states = hass?.states || {};
  const out: string[] = [];
  for (const eid of Object.keys(states)) {
    const dom = eid.split(".")[0];
    const at = states[eid]?.attributes || {};
    const dc = String(at.device_class || "");
    const fn = String(at.friendly_name || "");
    if (dom === "cover" || dom === "lock" || (dom === "binary_sensor" && (OPEN_DC.has(dc) || OPEN_RE.test(eid) || OPEN_RE.test(fn)))) out.push(eid);
  }
  out.sort();
  if (selected && !out.includes(selected)) out.unshift(selected);
  return out;
}

export interface PinState {
  level: BadgeLevel;
  /** English t() key ("Open", "Closed", ...) or a raw value ("21.5 °C", "—") */
  value: string;
  name: string;
}
const OFFISH = new Set(["off", "unavailable", "unknown", "idle", "standby", "none"]);
/** Live state of a pinned entity as a badge level + short value (section 3.8). */
export function pinState(hass: Hass | undefined | null, entityId: string): PinState {
  const st = hass?.states?.[entityId];
  if (!st) return { level: "neutral", value: "—", name: entityId };
  const dom = entityId.split(".")[0] || "";
  const s = st.state;
  const at = st.attributes || {};
  const dc = String(at.device_class || "");
  const name = typeof at.friendly_name === "string" && at.friendly_name ? at.friendly_name : entityId;
  if (dom === "sensor") {
    const unit = typeof at.unit_of_measurement === "string" ? at.unit_of_measurement : "";
    return { level: "info", value: s === "unknown" || s === "unavailable" ? "—" : `${s}${unit ? " " + unit : ""}`, name };
  }
  if (dom === "binary_sensor") {
    const on = s === "on";
    if (OPEN_DC.has(dc)) return { level: on ? "warn" : "neutral", value: on ? "Open" : "Closed", name };
    if (dc === "motion" || dc === "occupancy" || dc === "presence") return { level: on ? "ok" : "neutral", value: on ? "Detected" : "—", name };
    return { level: on ? "ok" : "neutral", value: on ? "On" : "Off", name };
  }
  if (dom === "lock") return s === "locked" ? { level: "neutral", value: "Locked", name } : { level: "danger", value: "Unlocked", name };
  if (dom === "cover") {
    const open = s === "open" || s === "opening";
    return { level: open ? "warn" : "neutral", value: open ? "Open" : "Closed", name };
  }
  if (dom === "person" || dom === "device_tracker") return s === "home" ? { level: "ok", value: "At home", name } : { level: "neutral", value: "Away", name };
  if (dom === "climate") {
    const ct = at.current_temperature;
    return { level: "info", value: ct != null && ct !== "" ? `${ct}°` : s, name };
  }
  return OFFISH.has(s) ? { level: "neutral", value: "Off", name } : { level: "ok", value: "On", name };
}
