/**
 * Plan preparation for the residence view: config -> renderer inputs.
 * Pure functions (see specs/residence.md section 3.2-3.4).
 */
import type { Hass, PanelData } from "../../types";
import type { ElementsFeet, HouseSpec, LitState, PlanFeet, PlanRoom, Pt2 } from "./house3d";

export type FloorKey = "all" | "1f" | "2f" | "bsmt";

export interface HomeStyle {
  id: string;
  label: string;
  roof: HouseSpec["roof"];
  pitch: number;
  dormersFront: number;
  dormersRear: number;
}

/** The 10 home styles; the backend types residence_style as a plain str, so this table is the only source. */
export const STYLES: readonly HomeStyle[] = [
  { id: "cape_cod", label: "Cape Cod", roof: "gable", pitch: 1.0, dormersFront: 2, dormersRear: 1 },
  { id: "colonial", label: "Colonial", roof: "gable", pitch: 0.7, dormersFront: 0, dormersRear: 0 },
  { id: "dutch_colonial", label: "Dutch Colonial", roof: "gambrel", pitch: 0.6, dormersFront: 2, dormersRear: 1 },
  { id: "ranch", label: "Ranch", roof: "hip", pitch: 0.5, dormersFront: 0, dormersRear: 0 },
  { id: "two_story", label: "Two-Story", roof: "gable", pitch: 0.65, dormersFront: 0, dormersRear: 0 },
  { id: "craftsman", label: "Craftsman", roof: "hip", pitch: 0.6, dormersFront: 1, dormersRear: 0 },
  { id: "modern", label: "Modern", roof: "flat", pitch: 0.12, dormersFront: 0, dormersRear: 0 },
  { id: "townhouse", label: "Townhouse", roof: "gable", pitch: 0.85, dormersFront: 0, dormersRear: 0 },
  { id: "apartment", label: "Apartment", roof: "flat", pitch: 0.12, dormersFront: 0, dormersRear: 0 },
  { id: "cabin", label: "Cabin", roof: "gable", pitch: 1.25, dormersFront: 2, dormersRear: 1 },
];

export function styleOf(id: unknown): HomeStyle {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}

/** Editor-unit floor plan as stored in config.floor_plan_rooms. */
export interface EditorRoom {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type?: string;
  points?: Pt2[];
}
export type FloorPlan = Record<string, { label?: string; rooms: EditorRoom[] }>;

export interface EditorElement {
  id?: string;
  type: string;
  kind?: string | null;
  wall?: string;
  room?: string;
  slope?: string;
  pos?: number;
  w?: number;
  entity?: string;
}
export type FloorElements = Record<string, EditorElement[]>;

/** The original author's home: the demo / fallback plan when none is configured. */
export const DEFAULT_PLAN: FloorPlan = {
  "1f": {
    label: "1st Floor",
    rooms: [
      { name: "Garage", x: 5, y: 5, w: 100, h: 88, type: "room" },
      { name: "Kitchen", x: 115, y: 5, w: 65, h: 40, type: "room" },
      { name: "Bath", x: 185, y: 5, w: 28, h: 22, type: "bath" },
      { name: "Guest Room", x: 218, y: 5, w: 95, h: 40, type: "room" },
      { name: "Dining Room", x: 115, y: 50, w: 65, h: 38, type: "room" },
      { name: "Stairs", x: 185, y: 32, w: 28, h: 32, type: "stairs" },
      { name: "Living Room", x: 218, y: 50, w: 95, h: 38, type: "room" },
      { name: "Downstairs Hallway", x: 115, y: 93, w: 198, h: 20, type: "room" },
      { name: "Front Door", x: 185, y: 117, w: 50, h: 12, type: "door" },
    ],
  },
  "2f": {
    label: "2nd Floor",
    rooms: [
      { name: "Eliana's Room", x: 50, y: 25, w: 95, h: 80, type: "room" },
      { name: "Bath", x: 150, y: 25, w: 30, h: 40, type: "bath" },
      { name: "Master Bedroom", x: 185, y: 25, w: 85, h: 80, type: "room" },
      { name: "Upstairs Hallway", x: 150, y: 70, w: 30, h: 35, type: "room" },
      { name: "Stairs", x: 150, y: 108, w: 25, h: 20, type: "stairs" },
    ],
  },
  bsmt: {
    label: "Basement",
    rooms: [
      { name: "Basement", x: 50, y: 10, w: 220, h: 90, type: "room" },
      { name: "Stairs", x: 120, y: 20, w: 28, h: 35, type: "stairs" },
    ],
  },
};

const FT = 0.2; // feet per editor unit

/** `''`/null -> null, else Number(v) (NaN -> null). */
export function num(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseJsonish(raw: unknown): unknown {
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

/** The configured plan (dict or JSON string) or the default; `configured` says which. */
export function parsePlan(raw: unknown): { plan: FloorPlan; configured: boolean } {
  const parsed = parseJsonish(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length) {
    return { plan: parsed as FloorPlan, configured: true };
  }
  return { plan: DEFAULT_PLAN, configured: false };
}

export function parseElements(raw: unknown): FloorElements {
  const parsed = parseJsonish(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as FloorElements) : {};
}

// Map a coordinate to its cluster representative (groups values within `tol`).
function snapMap(vals: number[], tol: number): (v: number) => number {
  const s = vals.slice().sort((a, b) => a - b);
  const reps: Array<{ vals: number[]; start: number }> = [];
  let cur: { vals: number[]; start: number } | null = null;
  for (const v of s) {
    if (cur && v - cur.start <= tol) cur.vals.push(v);
    else {
      cur = { vals: [v], start: v };
      reps.push(cur);
    }
  }
  const means = reps.map((g) => g.vals.reduce((a, b) => a + b, 0) / g.vals.length);
  return (v) => {
    let best = v, bd = tol + 1e-6;
    for (const m of means) {
      const d = Math.abs(v - m);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  };
}

// Align nearly-touching room edges so exterior walls render seamless.
function snapFeet(out: PlanFeet): PlanFeet {
  const TOL = 1.0;
  for (const fk of Object.keys(out)) {
    const rooms = out[fk] || [];
    if (rooms.length < 2) continue;
    const xs: number[] = [], ys: number[] = [];
    rooms.forEach((r) => {
      xs.push(r.x, r.x + r.w);
      ys.push(r.y, r.y + r.d);
      r.points?.forEach((p) => {
        xs.push(p[0]);
        ys.push(p[1]);
      });
    });
    const sx = snapMap(xs, TOL), sy = snapMap(ys, TOL);
    rooms.forEach((r) => {
      const x0 = sx(r.x), x1 = sx(r.x + r.w), y0 = sy(r.y), y1 = sy(r.y + r.d);
      r.x = x0;
      r.w = x1 - x0;
      r.y = y0;
      r.d = y1 - y0;
      if (r.points) r.points = r.points.map((p): Pt2 => [sx(p[0]), sy(p[1])]);
    });
  }
  return out;
}

/** Editor plan -> renderer plan in feet (outdoor rooms dropped, edges snapped). */
export function planToFeet(plan: FloorPlan): PlanFeet {
  const out: PlanFeet = {};
  for (const fk of Object.keys(plan || {})) {
    const rooms = Array.isArray(plan[fk]?.rooms) ? plan[fk].rooms : [];
    out[fk] = rooms
      .filter((r) => r && r.type !== "outdoor")
      .map(
        (r): PlanRoom => ({
          name: String(r.name || "").toLowerCase(),
          label: String(r.name || "").toUpperCase(),
          x: (Number(r.x) || 0) * FT,
          y: (Number(r.y) || 0) * FT,
          w: (Number(r.w) || 0) * FT,
          d: (Number(r.h) || 0) * FT,
          type: r.type,
          points: Array.isArray(r.points) && r.points.length >= 3 ? r.points.map((p): Pt2 => [p[0] * FT, p[1] * FT]) : undefined,
        }),
      );
  }
  return snapFeet(out);
}

function entityOpen(hass: Hass | undefined, entity: unknown): boolean {
  if (!entity || typeof entity !== "string") return false;
  const st = hass?.states?.[entity]?.state;
  return st === "on" || st === "open";
}

/** Placed openings -> feet, with open/closed resolved from each mapped entity. */
export function elementsToFeet(raw: FloorElements, hass: Hass | undefined): ElementsFeet {
  const out: ElementsFeet = {};
  for (const fk of Object.keys(raw || {})) {
    const list = Array.isArray(raw[fk]) ? raw[fk] : [];
    out[fk] = list.map((e) => ({
      type: e.type,
      kind: e.kind,
      wall: e.wall,
      room: e.room,
      slope: e.slope,
      pos: e.pos != null ? Number(e.pos) : 0.5,
      w: (Number(e.w) || 20) * FT,
      open: entityOpen(hass, e.entity),
    }));
  }
  return out;
}

/** Per-bay garage door state from door_mapping["garage_<i>"] (bay 1 also accepts "garage"). */
export function garageBays(config: Record<string, unknown>, hass: Hass | undefined): Array<{ open: boolean }> {
  const map = (config.door_mapping && typeof config.door_mapping === "object" ? config.door_mapping : {}) as Record<string, unknown>;
  const bays = Math.max(0, Math.min(Number(config.garage_bays) || 0, 8));
  const out: Array<{ open: boolean }> = [];
  for (let i = 1; i <= bays; i++) {
    const eid = map[`garage_${i}`] || (i === 1 ? map["garage"] || "" : "");
    out.push({ open: entityOpen(hass, eid) });
  }
  return out;
}

/** Home massing spec from config + the style table. */
export function houseSpec(config: Record<string, unknown>): HouseSpec {
  const sd = styleOf(config.residence_style);
  const fEx = num(config.dormers_front), rEx = num(config.dormers_rear), stories = num(config.home_stories);
  const spec: HouseSpec = {
    roof: sd.roof,
    stories: stories != null ? stories : 1.5,
    pitch: sd.pitch,
    dormersFront: fEx != null ? fEx : sd.dormersFront,
    dormersRear: rEx != null ? rEx : sd.dormersRear,
    chimneyCount: Math.max(1, Math.min(4, num(config.chimney_count) || 1)),
    basementEntrance: config.basement_entrance === "interior" ? "interior" : "bulkhead",
  };
  const bays = num(config.garage_bays);
  if (bays != null) spec.garageBays = bays;
  const side = config.chimney_side;
  if (side === "right" || side === "left" || side === "center" || side === "none") spec.chimney = side;
  return spec;
}

export interface MmwaveSensor {
  entity_id: string;
  name: string;
  detecting: boolean;
  age: string;
}
export interface MmwaveRoom {
  area_id: string;
  name: string;
  outdoor: boolean;
  sensor_count: number;
  detecting_count: number;
  state: "detecting" | "clear";
  freshest: string;
  sensors: MmwaveSensor[];
}
export interface MmwaveOverview {
  rooms: MmwaveRoom[];
  summary: { rooms_with_mmwave: number; rooms_detecting: number; total_sensors: number };
}

/** Room name (lowercased) -> lit state. mmwave overrides on; dominant wins (only with an area_id). */
export function litMap(data: PanelData | null, mm: MmwaveOverview | null): Record<string, LitState> {
  const lit: Record<string, LitState> = {};
  for (const a of data?.areas || []) if (a.active) lit[String(a.name).toLowerCase()] = "on";
  for (const r of mm?.rooms || []) if (r.detecting_count > 0) lit[String(r.name).toLowerCase()] = "mmwave";
  const dom = data?.dominant;
  if (dom && dom.name && dom.area_id) lit[String(dom.name).toLowerCase()] = "dom";
  return lit;
}

/** Estimated floor area: config.floor_plan_sqft, else a heuristic from the plan (editor units). */
export function estimateSqft(config: Record<string, unknown>, plan: FloorPlan): number | null {
  const cfg = num(config.floor_plan_sqft);
  if (cfg) return cfg;
  let u = 0;
  for (const fk of Object.keys(plan || {})) {
    for (const r of plan[fk]?.rooms || []) {
      if (r.type === "door" || r.type === "stairs") continue;
      u += (Number(r.w) || 0) * (Number(r.h) || 0);
    }
  }
  if (!u) return null;
  return Math.min(5000, Math.max(600, Math.round((u * 0.032) / 50) * 50));
}
