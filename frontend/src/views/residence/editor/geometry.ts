/**
 * Pure plan geometry (frontend/specs/editor.md section 4.7), ported from the
 * old panel's coverage code: opening markers, walls + gaps, ray casting, the
 * wall-clipped camera cone, coverage sampling, room lookup and the opening
 * descriptions the coverage LLM receives. No DOM, no HA access.
 *
 * Inputs are the rooms / openings / cameras of ONE floor in editor units.
 */
import {
  anchorBox, floorBBox, pointInPoly, roomPoints, type BBox, type CameraPin, type EditorDoc, type FloorKey, type Opening, type Pt2, type Room,
  floorOf, FT_PER_UNIT,
} from "./model";

export interface Seg {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface PlanGeo {
  /** polygon edges of enclosed rooms (type not in stairs / door / outdoor) */
  walls: Seg[];
  /** one segment per window / door opening (dormers excluded) */
  gaps: Seg[];
}
export interface MarkerRect {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  /** the wall runs left -> right (front / back / dormer) */
  horizontal: boolean;
  /** the box the opening is anchored to */
  box: BBox;
}

/** `_FULL` of the backend: a sampled fraction at or above this counts as "sees most of". */
export const COVERAGE_FULL = 0.7;

/** Where an opening is drawn: a 4 u bar on its wall (w x 4 or 4 x w), dormers an 8 x 6 block on the front / back edge. */
export function markerRect(o: Opening, rooms: readonly Room[]): MarkerRect | null {
  if (o.type === "dormer") {
    const bb = floorBBox(rooms);
    if (!bb) return null;
    const cx = bb.x0 + o.pos * (bb.x1 - bb.x0);
    const cy = o.slope === "rear" ? bb.y1 : bb.y0;
    return { x: cx - 4, y: cy - 3, w: 8, h: 6, cx, cy, horizontal: true, box: bb };
  }
  const bb = anchorBox(o, rooms);
  if (!bb) return null;
  const W = bb.x1 - bb.x0, H = bb.y1 - bb.y0;
  let cx: number, cy: number;
  let horizontal = true;
  switch (o.wall) {
    case "back":
      cx = bb.x0 + o.pos * W;
      cy = bb.y1;
      break;
    case "left":
      cx = bb.x0;
      cy = bb.y0 + o.pos * H;
      horizontal = false;
      break;
    case "right":
      cx = bb.x1;
      cy = bb.y0 + o.pos * H;
      horizontal = false;
      break;
    default:
      cx = bb.x0 + o.pos * W;
      cy = bb.y0;
  }
  const w = o.w || 20;
  return horizontal
    ? { x: cx - w / 2, y: cy - 2, w, h: 4, cx, cy, horizontal, box: bb }
    : { x: cx - 2, y: cy - w / 2, w: 4, h: w, cx, cy, horizontal, box: bb };
}

/** Project a plan point onto an opening's wall -> `pos` 0..1 (for marker drags). */
export function posOnWall(o: Opening, rooms: readonly Room[], p: Pt2): number | null {
  const mr = markerRect(o, rooms);
  if (!mr) return null;
  const bb = mr.box;
  const span = mr.horizontal ? bb.x1 - bb.x0 : bb.y1 - bb.y0;
  if (span <= 0) return null;
  const v = mr.horizontal ? (p[0] - bb.x0) / span : (p[1] - bb.y0) / span;
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}

/**
 * Walls and gaps of a floor. Walls = every polygon edge of enclosed rooms;
 * gaps = one segment per window / door, width `w`, centred at its marker on
 * the anchor box. NOTE french doors use the floor box here (as the old code
 * did) while their marker is room-anchored - editor.md risk 10.
 */
export function planGeometry(rooms: readonly Room[], openings: readonly Opening[]): PlanGeo {
  const walls: Seg[] = [];
  for (const r of rooms) {
    if (r.type === "stairs" || r.type === "door" || r.type === "outdoor") continue;
    const pts = roomPoints(r);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      walls.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1] });
    }
  }
  const fb = floorBBox(rooms);
  const gaps: Seg[] = [];
  for (const e of openings) {
    if (e.type !== "door" && e.type !== "window") continue;
    const ow = e.w || 20;
    let bb = fb;
    if ((e.kind === "interior" || e.kind === "cased") && e.room) {
      const rr = rooms.find((r) => r.name === e.room);
      if (rr) bb = { x0: rr.x, y0: rr.y, x1: rr.x + rr.w, y1: rr.y + rr.h };
    }
    if (!bb) continue;
    const p = e.pos;
    if (e.wall === "front") {
      const c = bb.x0 + p * (bb.x1 - bb.x0);
      gaps.push({ x0: c - ow / 2, y0: bb.y0, x1: c + ow / 2, y1: bb.y0 });
    } else if (e.wall === "back") {
      const c = bb.x0 + p * (bb.x1 - bb.x0);
      gaps.push({ x0: c - ow / 2, y0: bb.y1, x1: c + ow / 2, y1: bb.y1 });
    } else if (e.wall === "left") {
      const c = bb.y0 + p * (bb.y1 - bb.y0);
      gaps.push({ x0: bb.x0, y0: c - ow / 2, x1: bb.x0, y1: c + ow / 2 });
    } else {
      const c = bb.y0 + p * (bb.y1 - bb.y0);
      gaps.push({ x0: bb.x1, y0: c - ow / 2, x1: bb.x1, y1: c + ow / 2 });
    }
  }
  return { walls, gaps };
}

/** Intersection point of segments a-b and c-d, or null. */
export function segIntersect(a: Pt2, b: Pt2, c: Pt2, d: Pt2): Pt2 | null {
  const [x1, y1] = a, [x2, y2] = b, [x3, y3] = c, [x4, y4] = d;
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

export function inGap(pt: Pt2, gaps: readonly Seg[], tol = 2.5): boolean {
  const [x, y] = pt;
  for (const g of gaps) {
    if (x >= Math.min(g.x0, g.x1) - tol && x <= Math.max(g.x0, g.x1) + tol && y >= Math.min(g.y0, g.y1) - tol && y <= Math.max(g.y0, g.y1) + tol) return true;
  }
  return false;
}

/** No wall between p and q, openings excepted. */
export function losClear(p: Pt2, q: Pt2, geo: PlanGeo): boolean {
  for (const w of geo.walls) {
    const ip = segIntersect(p, q, [w.x0, w.y0], [w.x1, w.y1]);
    if (ip && !inGap(ip, geo.gaps)) return false;
  }
  return true;
}

/** Distance from (cx, cy) along `ang` (radians) to the first blocking wall, passing through gaps, else `range`. */
export function rayCast(cx: number, cy: number, ang: number, range: number, geo: PlanGeo): number {
  const ex = cx + range * Math.cos(ang), ey = cy + range * Math.sin(ang);
  let best = range;
  for (const w of geo.walls) {
    const ip = segIntersect([cx, cy], [ex, ey], [w.x0, w.y0], [w.x1, w.y1]);
    if (!ip || inGap(ip, geo.gaps)) continue;
    const d = Math.hypot(ip[0] - cx, ip[1] - cy);
    if (d < best) best = d;
  }
  return best;
}

type Cam = Pick<CameraPin, "x" | "y" | "angle" | "fov" | "range" | "indoor">;

/** The raw sector path of a camera (no walls). */
export function coneD(cam: Cam): string {
  const rng = Math.max(cam.range, 5);
  const a1 = ((cam.angle - cam.fov / 2) * Math.PI) / 180, a2 = ((cam.angle + cam.fov / 2) * Math.PI) / 180;
  const x1 = cam.x + rng * Math.cos(a1), y1 = cam.y + rng * Math.sin(a1);
  const x2 = cam.x + rng * Math.cos(a2), y2 = cam.y + rng * Math.sin(a2);
  const large = cam.fov > 180 ? 1 : 0;
  return `M ${cam.x} ${cam.y} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rng} ${rng} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

/** The cone clipped by walls (indoor cameras with walls); outdoor cameras and empty floors get the raw cone. */
export function clippedCone(cam: Cam, geo: PlanGeo): string {
  if (!cam.indoor || !geo.walls.length) return coneD(cam);
  const rng = Math.max(cam.range, 5);
  const N = Math.max(24, Math.round(cam.fov / 3));
  const a0 = ((cam.angle - cam.fov / 2) * Math.PI) / 180;
  const step = (cam.fov * Math.PI) / 180 / N;
  let d = `M ${cam.x} ${cam.y}`;
  for (let i = 0; i <= N; i++) {
    const a = a0 + i * step;
    const dist = rayCast(cam.x, cam.y, a, rng, geo);
    d += ` L ${(cam.x + dist * Math.cos(a)).toFixed(1)} ${(cam.y + dist * Math.sin(a)).toFixed(1)}`;
  }
  return d + " Z";
}

/** Within range, within the field of view and (indoor only) with a clear line of sight. */
export function pointCovered(px: number, py: number, cam: Cam, geo: PlanGeo): boolean {
  const dx = px - cam.x, dy = py - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > Math.max(cam.range, 5)) return false;
  let diff = ((Math.atan2(dy, dx) * 180) / Math.PI - cam.angle) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  if (Math.abs(diff) > cam.fov / 2) return false;
  return !cam.indoor || losClear([cam.x, cam.y], [px, py], geo);
}

/** room name -> fraction of sample points in view (only rooms with any hit; door / stairs skipped). */
export function coverage(rooms: readonly Room[], cam: Cam, geo: PlanGeo): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rooms) {
    if (r.type === "door" || r.type === "stairs") continue;
    let hit = 0, tot = 0;
    if (r.type === "outdoor" || (r.points && r.points.length >= 3)) {
      const pts = roomPoints(r);
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const p of pts) {
        bx0 = Math.min(bx0, p[0]);
        by0 = Math.min(by0, p[1]);
        bx1 = Math.max(bx1, p[0]);
        by1 = Math.max(by1, p[1]);
      }
      const n = 6;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const px = bx0 + ((i + 0.5) / n) * (bx1 - bx0), py = by0 + ((j + 0.5) / n) * (by1 - by0);
        if (!pointInPoly(px, py, pts)) continue;
        tot++;
        if (pointCovered(px, py, cam, geo)) hit++;
      }
    } else {
      const n = 4;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const px = r.x + ((i + 0.5) / n) * r.w, py = r.y + ((j + 0.5) / n) * r.h;
        tot++;
        if (pointCovered(px, py, cam, geo)) hit++;
      }
    }
    if (hit > 0 && tot > 0) out[r.name] = Math.round((hit / tot) * 100) / 100;
  }
  return out;
}

/** The enclosed room containing (x, y), else the nearest room by centre, else "the area". */
export function roomAt(rooms: readonly Room[], x: number, y: number): string {
  const enclosed = rooms.filter((r) => r.type !== "stairs" && r.type !== "door");
  for (const r of enclosed) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.name || "the area";
  let best: Room | null = null, bd = Infinity;
  for (const r of enclosed) {
    const d = Math.hypot(r.x + r.w / 2 - x, r.y + r.h / 2 - y);
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best?.name || "the area";
}

/** "cased opening at Kitchen", "interior door at Hall", "open staircase" - what the coverage LLM is told. */
export function openingDescriptions(rooms: readonly Room[], openings: readonly Opening[]): string[] {
  const out: string[] = [];
  for (const o of openings) {
    if (o.type !== "door" || !o.room) continue;
    if (o.kind === "cased") out.push(`cased opening at ${o.room}`);
    else if (o.kind === "interior") out.push(`interior door at ${o.room}`);
  }
  if (rooms.some((r) => r.type === "stairs")) out.push("open staircase");
  return out;
}

/** The `camera` dict of jarvis/compute_camera_coverage (section 2.6), built from the working copy. */
export interface CoverageContext {
  entity: string;
  room: string;
  fov: number;
  range_ft: number;
  indoor: boolean;
  candidates: Record<string, number>;
  openings: string[];
}
export function coverageContext(doc: EditorDoc, floor: FloorKey, cam: CameraPin): CoverageContext {
  const rooms = floorOf(doc, floor)?.rooms || [];
  const openings = doc.openings[floor] || [];
  const geo = planGeometry(rooms, openings);
  return {
    entity: cam.entity || "",
    room: roomAt(rooms, cam.x, cam.y),
    fov: cam.fov,
    range_ft: Math.round(cam.range * FT_PER_UNIT * 10) / 10,
    indoor: cam.indoor,
    candidates: coverage(rooms, cam, geo),
    openings: openingDescriptions(rooms, openings),
  };
}
