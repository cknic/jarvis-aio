/**
 * JARVIS3D - rotatable axonometric 3D residence model rendered to SVG.
 *
 * Ported from the IIFE the old panel inlined (jarvis-panel.js L45-1150). The
 * geometry is unchanged; what changed:
 *   - every colour comes from a `Palette` passed in `RenderOpts` (built by
 *     ./palette.ts from the HA theme tokens) - nothing here spells a colour;
 *   - SVG ids are prefixed per render (`idPrefix`) so two models never clash;
 *   - the occupancy pulse `<animate>` is omitted when `animate` is false
 *     (prefers-reduced-motion);
 *   - room labels are HTML-escaped;
 *   - the legacy hard-coded house (the non-plan path) is gone: the view always
 *     passes a plan, so `build()` is plan-driven only.
 *
 * Pure functions, no DOM, no HA access. Coordinates are feet: x left->right,
 * y front (0) -> rear, z up.
 */
import type { Palette } from "./palette";

export type Pt2 = [number, number];
export type Pt3 = [number, number, number];
export type Box = [number, number, number, number];
export type Floor = "all" | "1f" | "2f" | "b";
export type LitState = "on" | "mmwave" | "dom";
type RoomState = "off" | "on" | "mmwave" | "dom";
type WinState = "off" | "on" | "dom";

export interface HouseSpec {
  roof: "gable" | "gambrel" | "hip" | "flat";
  stories: number;
  pitch: number;
  dormersFront: number;
  dormersRear: number;
  garageBays?: number;
  chimney?: "right" | "left" | "center" | "none";
  chimneyCount: number;
  basementEntrance: "bulkhead" | "interior";
}

export interface PlanRoom {
  name: string;
  label: string;
  x: number;
  y: number;
  w: number;
  d: number;
  type?: string;
  points?: Pt2[];
}
export type PlanFeet = Record<string, PlanRoom[]>;

export interface PlanElement {
  type: "window" | "door" | "dormer" | string;
  kind?: string | null;
  wall?: string;
  room?: string;
  slope?: string;
  pos: number;
  w: number;
  open: boolean;
}
export type ElementsFeet = Record<string, PlanElement[]>;

export interface RenderOpts {
  theta?: number;
  floor?: Floor;
  lit?: Record<string, LitState>;
  box?: Box;
  spec?: Partial<HouseSpec>;
  plan: PlanFeet;
  elements?: ElementsFeet;
  garage?: Array<{ open: boolean }>;
  palette: Palette;
  idPrefix?: string;
  animate?: boolean;
}

interface Face {
  p: Pt3[];
  f: string;
  s: string;
  w: number;
  cls?: string;
}
interface Glow {
  p: Pt3[];
  f: string;
}
interface Label {
  x: number;
  y: number;
  z: number;
  t?: string;
  st: RoomState;
  big?: boolean;
  small?: boolean;
  dot?: boolean;
}
interface Built {
  faces: Face[];
  glow: Glow[];
  labels: Label[];
}
interface RoofInfo {
  axis: "x" | "y" | "flat";
  eave: number;
  ridge: number;
  front?: number;
  back?: number;
  mid?: number;
  a?: number;
  b?: number;
  knuckleZ?: number;
  knuckleFront?: number;
  knuckleBack?: number;
}

// ---------- real dimensions (feet) ----------
const GW = 30, HW = 33, D = 24; // garage W, house W, depth
const XG0 = 0, XHE = GW + HW;
const WALL = 9; // 1st-floor wall height = main eave
const BASE_RISE = 11;
let RIDGE = WALL + BASE_RISE;
const RY = D / 2;
const OVH = 1.2; // roof overhang
const SCALE = 8.6; // feet -> px
const PITCH = (30 * Math.PI) / 180; // camera elevation
let CENTER: Pt3 = [(XG0 + XHE) / 2, RY, WALL * 0.5];
const FLOOR_Z: Record<string, [number, number]> = { "1f": [0.4, 8.6], "2f": [9.0, 13.8], b: [-7, -0.6] };

// ---------- per-render state ----------
let SPEC: Partial<HouseSpec> = {};
let C: Palette;
function applySpec(s?: Partial<HouseSpec>): void {
  SPEC = s || {};
  const p = SPEC.pitch && SPEC.pitch > 0 ? SPEC.pitch : 1;
  RIDGE = WALL + BASE_RISE * p;
}

// ---------- projection (turntable axonometric, orthographic) ----------
function rot(p: Pt3, t: number): Pt3 {
  const x = p[0] - CENTER[0], y = p[1] - CENTER[1], z = p[2] - CENTER[2];
  const c = Math.cos(t), s = Math.sin(t);
  return [x * c - y * s, x * s + y * c, z];
}
export function project(p: Pt3, thetaDeg: number): Pt2 {
  const r = rot(p, (thetaDeg * Math.PI) / 180);
  return [-r[0] * SCALE, -(r[1] * Math.sin(PITCH) + r[2] * Math.cos(PITCH)) * SCALE];
}
function faceDepth(face: Face, thetaDeg: number): number {
  const t = (thetaDeg * Math.PI) / 180;
  let cy = 0, cz = 0;
  const n = face.p.length;
  for (let i = 0; i < n; i++) {
    const r = rot(face.p[i], t);
    cy += r[1];
    cz += r[2];
  }
  cy /= n;
  cz /= n;
  return cy * Math.cos(PITCH) - cz * Math.sin(PITCH); // larger = farther from camera
}

// ---------- face helpers ----------
function F(list: Face[], pts: Pt3[], fill: string, stroke?: string, sw?: number, extra?: { cls?: string }): void {
  const o: Face = { p: pts, f: fill, s: stroke || C.edge, w: sw == null ? 0.9 : sw };
  if (extra?.cls) o.cls = extra.cls;
  list.push(o);
}
function gableEnd(L: Face[], x: number, yA: number, yB: number, zWall: number, yPk: number, zPk: number, f: string, s: string, w: number): void {
  F(L, [[x, yA, 0], [x, yB, 0], [x, yB, zWall], [x, yPk, zPk], [x, yA, zWall]], f, s, w);
}

// ---------- a lit window on a front/back plane (y=const) ----------
function winY(L: Face[], GL: Glow[] | null, y: number, x0: number, x1: number, z0: number, z1: number, state: WinState, mull: boolean, faceOut?: number, cols?: number): void {
  const f = state === "dom" ? C.winDom : state === "on" ? C.winOn : C.winOff;
  const st = state === "dom" ? C.glassDom : state === "on" ? C.glassOn : C.glassOff;
  const n = faceOut == null ? -0.06 : faceOut;
  const yy = y + n;
  F(L, [[x0, yy, z0], [x1, yy, z0], [x1, yy, z1], [x0, yy, z1]], f, st, 0.7);
  if (mull) {
    F(L, [[x0, yy, (z0 + z1) / 2], [x1, yy, (z0 + z1) / 2]], "none", st, 0.4);
    const nc = cols || 2;
    for (let k = 1; k < nc; k++) {
      const xm = x0 + ((x1 - x0) * k) / nc;
      F(L, [[xm, yy, z0], [xm, yy, z1]], "none", st, 0.4);
    }
  }
  if (state !== "off" && GL) {
    const g = state === "dom" ? C.glowDom : C.glowOn;
    GL.push({ p: [[x0 - 1.4, yy, z0 - 1.4], [x1 + 1.4, yy, z0 - 1.4], [x1 + 1.4, yy, z1 + 1.4], [x0 - 1.4, yy, z1 + 1.4]], f: g });
  }
}
// window on an end plane (x=const)
function winX(L: Face[], GL: Glow[] | null, x: number, y0: number, y1: number, z0: number, z1: number, state: WinState, mull: boolean, faceOut?: number): void {
  const f = state === "dom" ? C.winDom : state === "on" ? C.winOn : C.winOff;
  const st = state === "dom" ? C.glassDom : state === "on" ? C.glassOn : C.glassOff;
  const n = faceOut == null ? 0.06 : faceOut;
  const xx = x + n;
  F(L, [[xx, y0, z0], [xx, y1, z0], [xx, y1, z1], [xx, y0, z1]], f, st, 0.7);
  if (mull) {
    F(L, [[xx, y0, (z0 + z1) / 2], [xx, y1, (z0 + z1) / 2]], "none", st, 0.4);
    F(L, [[xx, (y0 + y1) / 2, z0], [xx, (y0 + y1) / 2, z1]], "none", st, 0.4);
  }
  if (state !== "off" && GL) {
    const g = state === "dom" ? C.glowDom : C.glowOn;
    GL.push({ p: [[xx, y0 - 1.4, z0 - 1.4], [xx, y1 + 1.4, z0 - 1.4], [xx, y1 + 1.4, z1 + 1.4], [xx, y0 - 1.4, z1 + 1.4]], f: g });
  }
}

// A roof slope drawn as fill strips (so a protruding dormer sorts correctly
// per-strip) plus a single crisp outline.
function roofPlane(L: Face[], xL: number, xR: number, yE: number, zE: number, yR: number, zR: number, fill: string, stroke: string, sw: number): void {
  const N = 12;
  for (let i = 0; i < N; i++) {
    const xa = xL + ((xR - xL) * i) / N, xb = xL + ((xR - xL) * (i + 1)) / N;
    F(L, [[xa, yE, zE], [xb, yE, zE], [xb, yR, zR], [xa, yR, zR]], fill, "none", 0);
  }
  F(L, [[xL, yE, zE], [xR, yE, zE], [xR, yR, zR], [xL, yR, zR]], "none", stroke, sw);
}

function roomStyle(state: RoomState): { ff: string; ss: string; sw: number; wf: string } {
  const occ = state !== "off", mm = state === "mmwave";
  return {
    ff: state === "dom" ? C.roomFillDom : mm ? C.roomFillMmwave : occ ? C.roomFillOn : C.roomFillOff,
    ss: state === "dom" ? C.roomStrokeDom : mm ? C.roomStrokeMmwave : occ ? C.roomStrokeOn : C.roomStrokeOff,
    sw: mm ? 1.3 : occ ? 1.0 : 0.6,
    wf: state === "dom" ? C.roomWallDom : mm ? C.roomWallMmwave : occ ? C.roomWallOn : C.roomWallOff,
  };
}
function roomBox(L: Face[], LBL: Label[], x0: number, y0: number, w: number, d: number, z0: number, z1: number, name: string, state: RoomState): void {
  const x1 = x0 + w, y1 = y0 + d, occ = state !== "off";
  const { ff, ss, sw, wf } = roomStyle(state);
  F(L, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], ff, ss, sw * 0.7); // floor
  F(L, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], wf, ss, sw * 0.5);
  F(L, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], wf, ss, sw * 0.5);
  F(L, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], wf, ss, sw * 0.5);
  F(L, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], wf, ss, sw * 0.5);
  LBL.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: z0 + 0.2, t: name, st: state, big: w > 14 });
  if (occ) LBL.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: z1 - 0.5, st: state, dot: true });
}
// Extrude a room from its actual polygon: floor = the polygon, one wall quad per edge.
function roomPrism(L: Face[], LBL: Label[], pts: Pt2[], z0: number, z1: number, name: string, state: RoomState): void {
  const occ = state !== "off";
  const { ff, ss, sw, wf } = roomStyle(state);
  F(L, pts.map((p): Pt3 => [p[0], p[1], z0]), ff, ss, sw * 0.7);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    F(L, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], wf, ss, sw * 0.5);
  }
  let cx = 0, cy = 0, mnx = 1e9, mxx = -1e9;
  pts.forEach((p) => {
    cx += p[0];
    cy += p[1];
    mnx = Math.min(mnx, p[0]);
    mxx = Math.max(mxx, p[0]);
  });
  cx /= pts.length;
  cy /= pts.length;
  LBL.push({ x: cx, y: cy, z: z0 + 0.2, t: name, st: state, big: mxx - mnx > 14 });
  if (occ) LBL.push({ x: cx, y: cy, z: z1 - 0.5, st: state, dot: true });
}

// ---------- data-driven build: geometry from the editor's rooms (feet) ----------
function _planZ(fk: string): [number, number] {
  const A: Record<string, string> = { bsmt: "b", basement: "b" };
  return FLOOR_Z[fk] || FLOOR_Z[A[fk]] || FLOOR_Z["1f"];
}
function _planFloorKey(plan: PlanFeet, floor: string): string {
  if (plan[floor]) return floor;
  const A: Record<string, string> = { b: "bsmt", bsmt: "b" };
  return plan[A[floor]] ? A[floor] : floor;
}
function extWalls(L: Face[], x0: number, y0: number, x1: number, y1: number, z0: number, z1: number): void {
  F(L, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], C.wallFill, C.wallStroke, 0.7); // front
  F(L, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], C.wallFillDark, C.wallStrokeDark, 0.7); // back
  F(L, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], C.wallFillDark, C.wallStrokeDark, 0.7); // left
  F(L, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], C.wallFill, C.wallStroke, 0.7); // right
}
function _roomCorners(r: PlanRoom): Pt2[] {
  if (r.points && r.points.length >= 3) return r.points;
  const x = r.x || 0, y = r.y || 0, w = r.w || 0, d = r.d || 0;
  return [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
}
function _ptInPoly(px: number, py: number, pts: Pt2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function _enclosed(rooms: PlanRoom[] | undefined): PlanRoom[] {
  return (rooms || []).filter((r) => r.type !== "outdoor" && r.type !== "stairs" && r.type !== "door");
}
// x-intervals of an orthogonal room polygon at scanline y
function _polyScanX(pts: Pt2[], ym: number): Pt2[] {
  const xs: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    if ((a[1] <= ym && b[1] > ym) || (b[1] <= ym && a[1] > ym)) xs.push(a[0] + ((ym - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
  }
  xs.sort((p, q) => p - q);
  const ivs: Pt2[] = [];
  for (let k = 0; k + 1 < xs.length; k += 2) ivs.push([xs[k], xs[k + 1]]);
  return ivs;
}
interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
// Decompose an orthogonal footprint into rectangular masses (one for a rectangle, several for an L/T).
function _footprintMasses(rooms: PlanRoom[] | undefined): Rect[] {
  const encl = _enclosed(rooms);
  if (!encl.length) return [];
  let ys: number[] = [];
  encl.forEach((r) => _roomCorners(r).forEach((p) => ys.push(p[1])));
  ys = ys.sort((a, b) => a - b).filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) > 0.01);
  let rects: Array<Rect | null> = [];
  for (let i = 0; i < ys.length - 1; i++) {
    const y0 = ys[i], y1 = ys[i + 1], ym = (y0 + y1) / 2;
    const ivs: Pt2[] = [];
    encl.forEach((r) => _polyScanX(_roomCorners(r), ym).forEach((iv) => ivs.push(iv)));
    ivs.sort((a, b) => a[0] - b[0]);
    const merged: Pt2[] = [];
    ivs.forEach((iv) => {
      const last = merged[merged.length - 1];
      if (last && iv[0] <= last[1] + 0.01) last[1] = Math.max(last[1], iv[1]);
      else merged.push([iv[0], iv[1]]);
    });
    merged.forEach((iv) => rects.push({ x0: iv[0], y0, x1: iv[1], y1 }));
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let a = 0; a < rects.length; a++) {
      const A = rects[a];
      if (!A) continue;
      for (let b = a + 1; b < rects.length; b++) {
        const B = rects[b];
        if (!B) continue;
        if (Math.abs(A.x0 - B.x0) < 0.01 && Math.abs(A.x1 - B.x1) < 0.01 && (Math.abs(A.y1 - B.y0) < 0.01 || Math.abs(B.y1 - A.y0) < 0.01)) {
          A.y0 = Math.min(A.y0, B.y0);
          A.y1 = Math.max(A.y1, B.y1);
          rects[b] = null;
          changed = true;
        }
      }
    }
    rects = rects.filter(Boolean);
  }
  return rects as Rect[];
}
// Exterior walls from the real outline: an edge is an outside wall unless the point
// just past it lands inside another enclosed room (a shared wall).
function extWallsPoly(L: Face[], rooms: PlanRoom[], z0: number, z1: number): void {
  const encl = _enclosed(rooms);
  const corners: Pt2[] = [];
  encl.forEach((r) => _roomCorners(r).forEach((c) => corners.push(c)));
  const inAny = (px: number, py: number, skip: PlanRoom) => encl.some((rr) => rr !== skip && _ptInPoly(px, py, _roomCorners(rr)));
  interface Seg {
    a: Pt2;
    b: Pt2;
    front: boolean;
  }
  const segs: Seg[] = [];
  encl.forEach((r) => {
    const pts = _roomCorners(r);
    let cx = 0, cy = 0;
    pts.forEach((p) => {
      cx += p[0];
      cy += p[1];
    });
    cx /= pts.length;
    cy /= pts.length;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      if (L2 < 1e-6) continue;
      const ts = [0, 1];
      corners.forEach((c) => {
        const t = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / L2;
        if (t <= 0.001 || t >= 0.999) return;
        if (Math.hypot(c[0] - (a[0] + dx * t), c[1] - (a[1] + dy * t)) < 0.05) ts.push(t);
      });
      ts.sort((p, q) => p - q);
      let nx = -dy, ny = dx;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const mmx = (a[0] + b[0]) / 2, mmy = (a[1] + b[1]) / 2;
      if ((mmx + nx - cx) * (mmx + nx - cx) + (mmy + ny - cy) * (mmy + ny - cy) < (mmx - nx - cx) * (mmx - nx - cx) + (mmy - ny - cy) * (mmy - ny - cy)) {
        nx = -nx;
        ny = -ny;
      }
      const front = ny < -0.3;
      for (let k = 0; k < ts.length - 1; k++) {
        const t0 = ts[k], t1 = ts[k + 1];
        if (t1 - t0 < 0.001) continue;
        const tm = (t0 + t1) / 2, smx = a[0] + dx * tm, smy = a[1] + dy * tm;
        if (inAny(smx + nx * 1.5, smy + ny * 1.5, r)) continue;
        segs.push({ a: [a[0] + dx * t0, a[1] + dy * t0], b: [a[0] + dx * t1, a[1] + dy * t1], front });
      }
    }
  });
  // Merge collinear + adjacent same-shade segments into continuous runs so each wall is ONE quad.
  const nr = (p: Pt2, q: Pt2) => Math.abs(p[0] - q[0]) < 0.06 && Math.abs(p[1] - q[1]) < 0.06;
  const coll = (a: Pt2, b: Pt2, c: Pt2) => {
    const LL = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return Math.abs(((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / LL) < 0.06;
  };
  const used: boolean[] = new Array(segs.length).fill(false);
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    let A = segs[s].a, B = segs[s].b;
    const fr = segs[s].front;
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < segs.length; j++) {
        if (used[j] || segs[j].front !== fr) continue;
        const ta = segs[j].a, tb = segs[j].b;
        if (!coll(A, B, ta) || !coll(A, B, tb)) continue;
        if (nr(tb, A)) { A = ta; used[j] = true; grew = true; }
        else if (nr(ta, A)) { A = tb; used[j] = true; grew = true; }
        else if (nr(ta, B)) { B = tb; used[j] = true; grew = true; }
        else if (nr(tb, B)) { B = ta; used[j] = true; grew = true; }
      }
    }
    F(L, [[A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1], [A[0], A[1], z1]], fr ? C.wallFill : C.wallFillDark, fr ? C.wallStroke : C.wallStrokeDark, 0.7);
  }
}

// ----- generalized roofs over the derived footprint -----
function _oneFloorTop(): number {
  return FLOOR_Z["1f"][1];
}
function _pitch(): number {
  return SPEC.pitch != null ? SPEC.pitch : 1;
}
function _roofRise(spanShort: number): number {
  return (spanShort / 2) * 0.9 * Math.max(_pitch(), 0.08);
}

function gableRoofOver(L: Face[], x0: number, y0: number, x1: number, y1: number, zE: number, minRise?: number, pitchOv?: number): RoofInfo {
  const W = x1 - x0, Dd = y1 - y0, ov = OVH, alongX = W >= Dd, span = alongX ? Dd : W;
  const p = pitchOv != null ? pitchOv : _pitch();
  const rise = Math.max((span / 2) * 0.9 * Math.max(p, 0.08), minRise || 0), zR = zE + rise;
  if (alongX) {
    const yC = (y0 + y1) / 2;
    roofPlane(L, x0 - ov, x1 + ov, y0 - ov, zE, yC, zR, C.roofFill, C.roofStroke, 0.85);
    F(L, [[x0 - ov, y1 + ov, zE], [x1 + ov, y1 + ov, zE], [x1 + ov, yC, zR], [x0 - ov, yC, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
    gableEnd(L, x0, y0, y1, zE, yC, zR, C.gableFill, C.gableStroke, 0.8);
    gableEnd(L, x1, y0, y1, zE, yC, zR, C.gableFill, C.gableStroke, 0.8);
    return { axis: "x", front: y0, back: y1, eave: zE, ridge: zR, mid: yC, a: x0, b: x1 };
  }
  const xC = (x0 + x1) / 2;
  F(L, [[x0 - ov, y0 - ov, zE], [x0 - ov, y1 + ov, zE], [xC, y1 + ov, zR], [xC, y0 - ov, zR]], C.roofFill, C.roofStroke, 0.85);
  F(L, [[x1 + ov, y0 - ov, zE], [x1 + ov, y1 + ov, zE], [xC, y1 + ov, zR], [xC, y0 - ov, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
  F(L, [[x0, y0, zE], [x1, y0, zE], [xC, y0, zR]], C.gableFill, C.gableStroke, 0.8);
  F(L, [[x0, y1, zE], [x1, y1, zE], [xC, y1, zR]], C.gableFill, C.gableStroke, 0.8);
  return { axis: "y", eave: zE, ridge: zR };
}

// gambrel (Dutch Colonial "barn") ends: wall + steep lower + shallow upper
function gambrelEnd(L: Face[], x: number, yA: number, yB: number, zWall: number, yKa: number, yKb: number, zK: number, yPk: number, zPk: number): void {
  F(L, [[x, yA, 0], [x, yB, 0], [x, yB, zWall], [x, yKb, zK], [x, yPk, zPk], [x, yKa, zK], [x, yA, zWall]], C.gableFill, C.gableStroke, 0.8);
}
function gambrelEndY(L: Face[], y: number, xA: number, xB: number, zWall: number, xKa: number, xKb: number, zK: number, xPk: number, zPk: number): void {
  F(L, [[xA, y, 0], [xB, y, 0], [xB, y, zWall], [xKb, y, zK], [xPk, y, zPk], [xKa, y, zK], [xA, y, zWall]], C.gableFill, C.gableStroke, 0.8);
}
function gambrelRoofOver(L: Face[], x0: number, y0: number, x1: number, y1: number, zE: number, minRise?: number, pitchOv?: number): RoofInfo {
  const W = x1 - x0, Dd = y1 - y0, ov = OVH, alongX = W >= Dd, span = alongX ? Dd : W;
  const p = pitchOv != null ? pitchOv : _pitch();
  const rise = Math.max((span / 2) * 0.9 * Math.max(p, 0.08), minRise || 0), zR = zE + rise;
  const KH = 0.42, KV = 0.64, zK = zE + rise * KV;
  if (alongX) {
    const yC = (y0 + y1) / 2, yKa = y0 + (yC - y0) * KH, yKb = y1 - (y1 - yC) * KH;
    roofPlane(L, x0 - ov, x1 + ov, y0 - ov, zE, yKa, zK, C.roofFill, C.roofStroke, 0.85);
    roofPlane(L, x0 - ov, x1 + ov, yKa, zK, yC, zR, C.roofFill, C.roofStroke, 0.85);
    F(L, [[x0 - ov, y1 + ov, zE], [x1 + ov, y1 + ov, zE], [x1 + ov, yKb, zK], [x0 - ov, yKb, zK]], C.roofFillDark, C.roofStrokeDark, 0.7);
    F(L, [[x0 - ov, yKb, zK], [x1 + ov, yKb, zK], [x1 + ov, yC, zR], [x0 - ov, yC, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
    gambrelEnd(L, x0, y0, y1, zE, yKa, yKb, zK, yC, zR);
    gambrelEnd(L, x1, y0, y1, zE, yKa, yKb, zK, yC, zR);
    return { axis: "x", front: y0, back: y1, eave: zE, ridge: zR, mid: yC, a: x0, b: x1, knuckleZ: zK, knuckleFront: yKa, knuckleBack: yKb };
  }
  const xC = (x0 + x1) / 2, xKa = x0 + (xC - x0) * KH, xKb = x1 - (x1 - xC) * KH;
  F(L, [[x0 - ov, y0 - ov, zE], [x0 - ov, y1 + ov, zE], [xKa, y1 + ov, zK], [xKa, y0 - ov, zK]], C.roofFill, C.roofStroke, 0.85);
  F(L, [[xKa, y0 - ov, zK], [xKa, y1 + ov, zK], [xC, y1 + ov, zR], [xC, y0 - ov, zR]], C.roofFill, C.roofStroke, 0.85);
  F(L, [[x1 + ov, y0 - ov, zE], [x1 + ov, y1 + ov, zE], [xKb, y1 + ov, zK], [xKb, y0 - ov, zK]], C.roofFillDark, C.roofStrokeDark, 0.7);
  F(L, [[xKb, y0 - ov, zK], [xKb, y1 + ov, zK], [xC, y1 + ov, zR], [xC, y0 - ov, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
  gambrelEndY(L, y0, x0, x1, zE, xKa, xKb, zK, xC, zR);
  gambrelEndY(L, y1, x0, x1, zE, xKa, xKb, zK, xC, zR);
  return { axis: "y", eave: zE, ridge: zR };
}

function hipRoofOver(L: Face[], x0: number, y0: number, x1: number, y1: number, zE: number, minRise?: number): RoofInfo {
  const W = x1 - x0, Dd = y1 - y0, ov = OVH, span = Math.min(W, Dd);
  const rise = Math.max(_roofRise(span), minRise || 0), zR = zE + rise, yC = (y0 + y1) / 2, inset = span / 2;
  let a = x0 + inset, b = x1 - inset;
  if (b < a) a = b = (x0 + x1) / 2;
  F(L, [[x0 - ov, y0 - ov, zE], [x1 + ov, y0 - ov, zE], [b, yC, zR], [a, yC, zR]], C.roofFill, C.roofStroke, 0.85);
  F(L, [[x0 - ov, y1 + ov, zE], [x1 + ov, y1 + ov, zE], [b, yC, zR], [a, yC, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
  F(L, [[x0 - ov, y0 - ov, zE], [x0 - ov, y1 + ov, zE], [a, yC, zR]], C.roofFill, C.roofStroke, 0.8);
  F(L, [[x1 + ov, y0 - ov, zE], [x1 + ov, y1 + ov, zE], [b, yC, zR]], C.roofFillDark, C.roofStrokeDark, 0.7);
  return { axis: "x", front: y0, eave: zE, ridge: zR, mid: yC, a, b };
}

function flatRoofOver(L: Face[], x0: number, y0: number, x1: number, y1: number, zTop: number): RoofInfo {
  const ov = OVH * 0.5;
  F(L, [[x0 - ov, y0 - ov, zTop], [x1 + ov, y0 - ov, zTop], [x1 + ov, y1 + ov, zTop], [x0 - ov, y1 + ov, zTop]], C.roofFill, C.roofStroke, 0.85);
  extWalls(L, x0 - ov, y0 - ov, x1 + ov, y1 + ov, zTop, zTop + 1.0); // parapet
  return { axis: "flat", eave: zTop, ridge: zTop + 1.0 };
}

function dormersOn(L: Face[], GL: Glow[], roof: RoofInfo | undefined, wSt: WinState, rear: boolean, positions: number[], states: WinState[]): void {
  const nD = positions.length;
  if (!nD || !roof || roof.axis !== "x" || roof.a == null || roof.b == null || roof.mid == null || roof.front == null) return;
  const a = roof.a, b = roof.b, eave = roof.eave;
  let ridge = roof.ridge, mid = roof.mid;
  if (roof.knuckleZ != null) {
    ridge = roof.knuckleZ;
    mid = (rear ? roof.knuckleBack : roof.knuckleFront) ?? mid;
  }
  const edge = rear ? (roof.back != null ? roof.back : 2 * mid - roof.front) : roof.front;
  const sgn = rear ? -1 : 1;
  const slope = mid - edge !== 0 ? (ridge - eave) / Math.abs(mid - edge) : 0;
  const dw = 5, proj = 5.5;
  for (let i = 0; i < nD; i++) {
    const frac = positions[i];
    const cx = a + (b - a) * frac;
    const yFace = edge + sgn * 1.4, yBack = edge + sgn * proj;
    const zBack = eave + Math.abs(yBack - edge) * slope;
    const zSill = eave + 0.9, zHead = zSill + 3.4, zPk = zHead + 1.5, out = sgn * -0.06;
    F(L, [[cx - dw / 2, yFace, zSill], [cx + dw / 2, yFace, zSill], [cx + dw / 2, yFace, zHead], [cx - dw / 2, yFace, zHead]], C.solidDark, C.wallStroke, 0.7);
    F(L, [[cx - dw / 2, yFace, zHead], [cx + dw / 2, yFace, zHead], [cx, yFace, zPk]], C.solidDark, C.wallStroke, 0.7);
    F(L, [[cx - dw / 2, yFace, zSill], [cx - dw / 2, yFace, zHead], [cx - dw / 2, yBack, zBack]], C.solidDark, C.roofStrokeDark, 0.55);
    F(L, [[cx + dw / 2, yFace, zSill], [cx + dw / 2, yFace, zHead], [cx + dw / 2, yBack, zBack]], C.solidDark, C.roofStrokeDark, 0.55);
    F(L, [[cx - dw / 2, yFace, zHead], [cx, yFace, zPk], [cx, yBack, zBack], [cx - dw / 2, yBack, zBack]], C.roofFill, C.roofStroke, 0.6);
    F(L, [[cx + dw / 2, yFace, zHead], [cx, yFace, zPk], [cx, yBack, zBack], [cx + dw / 2, yBack, zBack]], C.roofFill, C.roofStroke, 0.6);
    const dst = states[i] != null ? states[i] : wSt;
    winY(L, GL, yFace, cx - 1.7, cx + 1.7, zSill + 0.3, zHead - 0.3, dst, true, out);
  }
}

function garageDoorsOn(L: Face[], GL: Glow[], x0: number, x1: number, yF: number, state: WinState, baysState?: Array<{ open: boolean }>): void {
  const bays = SPEC.garageBays && SPEC.garageBays > 0 ? SPEC.garageBays : 3;
  let gap = 1.8;
  const W = x1 - x0, z0 = 0.4, z1 = 7.2, n = -0.06;
  let dw = (W - gap * (bays + 1)) / bays;
  if (dw <= 1) {
    gap = 0.6;
    dw = (W - gap * (bays + 1)) / bays;
  }
  if (dw <= 0) return;
  const litD = state === "on" || state === "dom";
  const f = litD ? C.doorOn : C.doorOff, s = litD ? C.glassOn : C.doorStroke;
  for (let i = 0; i < bays; i++) {
    const gx = x0 + gap + i * (dw + gap);
    const bayOpen = !!(baysState && baysState[i] && baysState[i].open);
    if (bayOpen) {
      // door rolled up: amber opening + a raised panel at the top
      F(L, [[gx, yF + n - 0.35, z0], [gx + dw, yF + n - 0.35, z0], [gx + dw, yF + n - 0.35, z1 - 1.4], [gx, yF + n - 0.35, z1 - 1.4]], C.doorOpenFaint, C.doorOpenStroke, 0.6, { cls: "door-open" });
      F(L, [[gx, yF + n, z1 - 1.4], [gx + dw, yF + n, z1 - 1.4], [gx + dw, yF + n, z1], [gx, yF + n, z1]], C.doorOpen, C.doorOpenStroke, 1.0, { cls: "gdoor door-open" });
      GL.push({ p: [[gx - 1.2, yF + n, z0], [gx + dw + 1.2, yF + n, z0], [gx + dw + 1.2, yF + n, z1 + 1.2], [gx - 1.2, yF + n, z1 + 1.2]], f: C.doorOpenGlow });
    } else {
      F(L, [[gx, yF + n, z0], [gx + dw, yF + n, z0], [gx + dw, yF + n, z1], [gx, yF + n, z1]], f, s, 1.0, { cls: "gdoor" });
      for (let k = 1; k < 4; k++) {
        const zz = z0 + ((z1 - z0) * k) / 4;
        F(L, [[gx, yF + n, zz], [gx + dw, yF + n, zz]], "none", s, 0.45);
      }
      if (litD) GL.push({ p: [[gx - 1.2, yF + n, z0], [gx + dw + 1.2, yF + n, z0], [gx + dw + 1.2, yF + n, z1 + 1.2], [gx - 1.2, yF + n, z1 + 1.2]], f: C.glowOn });
    }
  }
}

function chimneyAt(L: Face[], xEdge: number, yc: number, zTop: number, outward: number): void {
  const ya = yc - 1.8, yb = yc + 1.8, x0 = xEdge, x1 = xEdge + outward * 2.2;
  F(L, [[x1, ya, 0], [x1, yb, 0], [x1, yb, zTop], [x1, ya, zTop]], C.chimneyFill, C.chimneyStroke, 0.7);
  F(L, [[x0, ya, 0], [x1, ya, 0], [x1, ya, zTop], [x0, ya, zTop]], C.solidDark, C.chimneyStroke, 0.6);
  F(L, [[x0, yb, 0], [x1, yb, 0], [x1, yb, zTop], [x0, yb, zTop]], C.solidDark, C.dim, 0.5);
  F(L, [[x0, ya, zTop], [x1, ya, zTop], [x1, yb, zTop], [x0, yb, zTop]], C.chimneyCap, C.chimneyStroke, 0.5);
}
// a free-standing chimney stack that rises through the roof at an interior (x,y)
function chimneyStack(L: Face[], cx: number, cy: number, zBase: number, zTop: number): void {
  const r = 1.3, xa = cx - r, xb = cx + r, ya = cy - r, yb = cy + r;
  F(L, [[xb, ya, zBase], [xb, yb, zBase], [xb, yb, zTop], [xb, ya, zTop]], C.chimneyFill, C.chimneyStroke, 0.7);
  F(L, [[xa, ya, zBase], [xa, yb, zBase], [xa, yb, zTop], [xa, ya, zTop]], C.solidDark, C.dim, 0.5);
  F(L, [[xa, ya, zBase], [xb, ya, zBase], [xb, ya, zTop], [xa, ya, zTop]], C.solidDark, C.chimneyStroke, 0.6);
  F(L, [[xa, yb, zBase], [xb, yb, zBase], [xb, yb, zTop], [xa, yb, zTop]], C.solidDark, C.dim, 0.5);
  F(L, [[xa, ya, zTop], [xb, ya, zTop], [xb, yb, zTop], [xa, yb, zTop]], C.chimneyCap, C.chimneyStroke, 0.5);
}

// A Bilco-style bulkhead cellar door: a sloped wedge against the wall, split into two panels.
function bulkheadDoor(L: Face[], GL: Glow[], wall: string | undefined, cx: number, cy: number, w: number, open: boolean): void {
  const depth = Math.max(w, 5.5), zHigh = 3.2, zLow = 0.2;
  const f = open ? C.doorOpen : C.doorOff, s = open ? C.doorOpenStroke : C.doorStroke, cls = open ? "cellar-door door-open" : "cellar-door";
  const dk = C.solidDark;
  if (wall === "front" || wall === "back") {
    const sgn = wall === "front" ? -1 : 1, yw = cy, yo = cy + sgn * depth;
    F(L, [[cx - w / 2, yw, zHigh], [cx, yw, zHigh], [cx, yo, zLow], [cx - w / 2, yo, zLow]], f, s, 0.9, { cls });
    F(L, [[cx, yw, zHigh], [cx + w / 2, yw, zHigh], [cx + w / 2, yo, zLow], [cx, yo, zLow]], f, s, 0.9, { cls });
    F(L, [[cx - w / 2, yw, 0], [cx - w / 2, yw, zHigh], [cx - w / 2, yo, zLow], [cx - w / 2, yo, 0]], dk, s, 0.6);
    F(L, [[cx + w / 2, yw, 0], [cx + w / 2, yw, zHigh], [cx + w / 2, yo, zLow], [cx + w / 2, yo, 0]], dk, s, 0.6);
    F(L, [[cx - w / 2, yo, 0], [cx + w / 2, yo, 0], [cx + w / 2, yo, zLow], [cx - w / 2, yo, zLow]], dk, s, 0.6);
  } else {
    const sgnx = wall === "left" ? -1 : 1, xw = cx, xo = cx + sgnx * depth;
    F(L, [[xw, cy - w / 2, zHigh], [xw, cy, zHigh], [xo, cy, zLow], [xo, cy - w / 2, zLow]], f, s, 0.9, { cls });
    F(L, [[xw, cy, zHigh], [xw, cy + w / 2, zHigh], [xo, cy + w / 2, zLow], [xo, cy, zLow]], f, s, 0.9, { cls });
    F(L, [[xw, cy - w / 2, 0], [xw, cy - w / 2, zHigh], [xo, cy - w / 2, zLow], [xo, cy - w / 2, 0]], dk, s, 0.6);
    F(L, [[xw, cy + w / 2, 0], [xw, cy + w / 2, zHigh], [xo, cy + w / 2, zLow], [xo, cy + w / 2, 0]], dk, s, 0.6);
    F(L, [[xo, cy - w / 2, 0], [xo, cy + w / 2, 0], [xo, cy + w / 2, zLow], [xo, cy - w / 2, zLow]], dk, s, 0.6);
  }
  if (open) GL.push({ p: [[cx - w / 2, cy, zHigh], [cx + w / 2, cy, zHigh], [cx + w / 2, cy, zHigh + 1.5], [cx - w / 2, cy, zHigh + 1.5]], f: C.doorOpenGlow });
}

// A cased opening (doorway with no leaf) on a room wall.
function casedOnWall(L: Face[], wall: string | undefined, cx: number, cy: number, w: number, z0: number, z1: number): void {
  const horiz = wall === "front" || wall === "back";
  const f = C.casedFill, s = C.casedStroke;
  if (horiz) {
    const yy = cy + (wall === "front" ? -0.06 : 0.06);
    F(L, [[cx - w / 2, yy, z0], [cx + w / 2, yy, z0], [cx + w / 2, yy, z1], [cx - w / 2, yy, z1]], f, s, 0.7, { cls: "cased" });
  } else {
    const xx = cx + (wall === "left" ? -0.06 : 0.06);
    F(L, [[xx, cy - w / 2, z0], [xx, cy + w / 2, z0], [xx, cy + w / 2, z1], [xx, cy - w / 2, z1]], f, s, 0.7, { cls: "cased" });
  }
}
// A door on a wall, open (swung) or closed.
function doorOnWall(L: Face[], GL: Glow[], wall: string | undefined, cx: number, cy: number, w: number, z0: number, z1: number, open: boolean): void {
  const horiz = wall === "front" || wall === "back";
  const f = open ? C.doorOpen : C.doorOff, s = open ? C.doorOpenStroke : C.doorStroke, cls = open ? "door door-open" : "door";
  const ang = (55 * Math.PI) / 180;
  if (horiz) {
    const n = wall === "front" ? -0.06 : 0.06, yy = cy + n;
    if (!open) F(L, [[cx - w / 2, yy, z0], [cx + w / 2, yy, z0], [cx + w / 2, yy, z1], [cx - w / 2, yy, z1]], f, s, 0.9, { cls });
    else {
      const dir = wall === "front" ? -1 : 1, dx = w * Math.cos(ang), dy = dir * w * Math.sin(ang);
      F(L, [[cx - w / 2, yy, z0], [cx - w / 2 + dx, yy + dy, z0], [cx - w / 2 + dx, yy + dy, z1], [cx - w / 2, yy, z1]], f, s, 0.9, { cls });
      GL.push({ p: [[cx - w / 2 - 1, yy, z0], [cx + w / 2 + 1, yy, z0], [cx + w / 2 + 1, yy + dy, z1 + 1], [cx - w / 2 - 1, yy + dy, z1 + 1]], f: C.doorOpenGlow });
    }
  } else {
    const nx = wall === "left" ? -0.06 : 0.06, xx = cx + nx;
    if (!open) F(L, [[xx, cy - w / 2, z0], [xx, cy + w / 2, z0], [xx, cy + w / 2, z1], [xx, cy - w / 2, z1]], f, s, 0.9, { cls });
    else {
      const dir2 = wall === "left" ? -1 : 1, dx2 = dir2 * w * Math.sin(ang), dy2 = w * Math.cos(ang);
      F(L, [[xx, cy - w / 2, z0], [xx + dx2, cy - w / 2 + dy2, z0], [xx + dx2, cy - w / 2 + dy2, z1], [xx, cy - w / 2, z1]], f, s, 0.9, { cls });
      GL.push({ p: [[xx, cy - w / 2 - 1, z0], [xx + dx2, cy + w / 2 + 1, z0], [xx + dx2, cy + w / 2 + 1, z1 + 1], [xx, cy - w / 2 - 1, z1 + 1]], f: C.doorOpenGlow });
    }
  }
}

function bboxOf(rooms: PlanRoom[] | undefined): Rect | null {
  let b: Rect | null = null;
  (rooms || []).forEach((r) => {
    if (!b) b = { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.d };
    else {
      b.x0 = Math.min(b.x0, r.x);
      b.y0 = Math.min(b.y0, r.y);
      b.x1 = Math.max(b.x1, r.x + r.w);
      b.y1 = Math.max(b.y1, r.y + r.d);
    }
  });
  return b;
}

// Clean exterior shell for the whole-house view - presence shows as lit windows.
function buildExteriorFromPlan(opts: RenderOpts, plan: PlanFeet, minx: number, miny: number, maxx: number, maxy: number, ztop: number): Built {
  const lit = opts.lit || {}, L: Face[] = [], GL: Glow[] = [], LBL: Label[] = [];
  const wOf = (n: string): WinState => {
    const s = lit[String(n).toLowerCase()];
    return s === "dom" ? "dom" : s ? "on" : "off";
  };
  const stories = SPEC.stories != null ? SPEC.stories : 1.5;
  const has2f = !!(plan["2f"] && plan["2f"].length);
  const rt = SPEC.roof || "gable";
  const lowStory = rt !== "flat" && stories < 2 && has2f;
  const eave = lowStory ? _oneFloorTop() : ztop;
  const minRise = lowStory ? ztop - eave + 2.5 : 0;
  const els = opts.elements || {};

  if ((plan["1f"] || []).length) extWallsPoly(L, plan["1f"], 0, eave);
  else extWalls(L, minx, miny, maxx, maxy, 0, eave);

  const TOL = 1.5, EDGE = 3, z0 = 3, z1 = 7;
  let garageRoom: PlanRoom | null = null;
  (plan["1f"] || []).forEach((r) => {
    if (String(r.name).toLowerCase().indexOf("garage") >= 0 && !garageRoom) garageRoom = r;
  });
  const garage = garageRoom as PlanRoom | null;

  const occIn = (rooms: PlanRoom[] | undefined, cx: number, cy: number): WinState => {
    let best: WinState = "off";
    (rooms || []).forEach((r) => {
      if (cx >= r.x - 1 && cx <= r.x + r.w + 1 && cy >= r.y - 1 && cy <= r.y + r.d + 1) {
        const s = wOf(r.name);
        if (s === "dom") best = "dom";
        else if (s === "on" && best !== "dom") best = "on";
      }
    });
    return best;
  };
  const winOcc = (cx: number, cy: number) => occIn(plan["1f"], cx, cy);
  const winOcc2f = (cx: number, cy: number) => occIn(plan["2f"], cx, cy);
  const wallXY = (wall: string | undefined, p: number): Pt2 => {
    if (wall === "front") return [minx + p * (maxx - minx), miny];
    if (wall === "back") return [minx + p * (maxx - minx), maxy];
    if (wall === "left") return [minx, miny + p * (maxy - miny)];
    return [maxx, miny + p * (maxy - miny)];
  };
  const isExterior = (e: PlanElement) => e.type === "window" || (e.type === "door" && e.kind !== "interior" && e.kind !== "cased");
  const placed = (els["1f"] || []).filter(isExterior);

  if (placed.length) {
    placed.forEach((e) => {
      const p = e.pos != null ? e.pos : 0.5, w = e.w || 4, horiz = e.wall === "front" || e.wall === "back";
      const [cx, cy] = wallXY(e.wall, p);
      if (e.type === "window") {
        const st = winOcc(cx, cy);
        if (horiz) winY(L, GL, cy, cx - w / 2, cx + w / 2, z0, z1, st, true, e.wall === "front" ? -0.06 : 0.06);
        else winX(L, GL, cx, cy - w / 2, cy + w / 2, z0, z1, st, true, e.wall === "left" ? -0.06 : 0.06);
      } else if (e.kind === "cellar") bulkheadDoor(L, GL, e.wall, cx, cy, Math.max(w, 5), e.open);
      else doorOnWall(L, GL, e.wall, cx, cy, Math.max(w, 3), 0.4, 6.8, e.open);
    });
  } else {
    // auto: a window on each room's exterior-facing wall
    (plan["1f"] || []).forEach((r) => {
      if (String(r.name).toLowerCase().indexOf("garage") >= 0) return;
      if (r.type && r.type !== "room" && r.type !== "bath") return;
      const x0r = r.x, x1r = r.x + r.w, y0r = r.y, y1r = r.y + r.d, st = wOf(r.name);
      if (x1r - x0r < 6 || y1r - y0r < 6) return;
      if (Math.abs(y0r - miny) < TOL) winY(L, GL, miny, x0r + EDGE, x1r - EDGE, z0, z1, st, true, -0.06);
      if (Math.abs(y1r - maxy) < TOL) winY(L, GL, maxy, x0r + EDGE, x1r - EDGE, z0, z1, st, true, 0.06);
      if (Math.abs(x0r - minx) < TOL) winX(L, GL, minx, y0r + EDGE, y1r - EDGE, z0, z1, st, true, -0.06);
      if (Math.abs(x1r - maxx) < TOL) winX(L, GL, maxx, y0r + EDGE, y1r - EDGE, z0, z1, st, true, 0.06);
    });
  }

  if (garage) {
    const g = garage;
    const gy = Math.abs(g.y - miny) < TOL ? miny : Math.abs(g.y + g.d - maxy) < TOL ? maxy : g.y;
    garageDoorsOn(L, GL, g.x + 0.5, g.x + g.w - 0.5, gy, wOf(g.name), opts.garage);
  }

  let roof: RoofInfo | undefined;
  const gLow = (rt === "gable" || rt === "gambrel") && garage && garage.w > 8;
  const roofOver = (m: Rect) => (rt === "gambrel" ? gambrelRoofOver(L, m.x0, m.y0, m.x1, m.y1, eave, minRise) : gableRoofOver(L, m.x0, m.y0, m.x1, m.y1, eave, minRise));
  const byArea = (a: Rect, b: Rect) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0);
  if (rt === "flat") roof = flatRoofOver(L, minx, miny, maxx, maxy, ztop);
  else if (rt === "hip") roof = hipRoofOver(L, minx, miny, maxx, maxy, eave, minRise);
  else if (gLow && garage) {
    // House = non-garage 1f rooms. Nearly-rectangular -> one gable; a real notch -> per mass.
    const houseRooms = (plan["1f"] || []).filter((r) => r !== garage && r.type !== "outdoor" && r.type !== "stairs" && r.type !== "door");
    const hb = bboxOf(houseRooms);
    let harea = 0;
    houseRooms.forEach((r) => (harea += r.w * r.d));
    const hbArea = hb ? (hb.x1 - hb.x0) * (hb.y1 - hb.y0) : 0;
    const houseRect = !hb || hbArea <= 0 || harea / hbArea >= 0.85;
    if (!houseRect) {
      const hmasses = _footprintMasses(houseRooms).sort(byArea);
      hmasses.forEach((m, mi) => {
        const r = roofOver(m);
        if (mi === 0) roof = r;
      });
    } else if (hb) roof = roofOver(hb);
    // attached garage: low, shallow-pitch roof over its actual bbox
    gableRoofOver(L, garage.x, garage.y, garage.x + garage.w, garage.y + garage.d, _oneFloorTop(), 0, 0.2);
  } else {
    const masses = _footprintMasses(plan["1f"] || []);
    if (masses.length > 1) {
      masses.sort(byArea).forEach((m, mi) => {
        const r = roofOver(m);
        if (mi === 0) roof = r;
      });
    } else roof = roofOver({ x0: minx, y0: miny, x1: maxx, y1: maxy });
  }

  let d2: WinState = "off";
  (plan["2f"] || []).forEach((r) => {
    const s = wOf(r.name);
    if (s === "dom") d2 = "dom";
    else if (s === "on" && d2 !== "dom") d2 = "on";
  });
  if (rt !== "flat" && roof) {
    const rf = roof;
    const dormF = (els["2f"] || []).filter((e) => e.type === "dormer" && e.slope !== "rear");
    const dormR = (els["2f"] || []).filter((e) => e.type === "dormer" && e.slope === "rear");
    // occupancy of the 2f room under a dormer at fraction `frac` along the roof
    const dSt = (frac: number): WinState => {
      if (rf.a == null || rf.b == null) return "off";
      const cx = rf.a + (rf.b - rf.a) * frac;
      const rm = (plan["2f"] || []).filter((r) => cx >= r.x && cx <= r.x + r.w)[0];
      return rm ? wOf(rm.name) : "off";
    };
    const autoPos = (n: number) => {
      const ps: number[] = [];
      for (let k = 0; k < n; k++) ps.push((k + 1) / (n + 1));
      return ps;
    };
    if (dormF.length) {
      const pf = dormF.map((e) => (e.pos != null ? e.pos : 0.5));
      dormersOn(L, GL, rf, d2, false, pf, pf.map(dSt));
    } else if (SPEC.dormersFront) {
      const pfa = autoPos(SPEC.dormersFront);
      dormersOn(L, GL, rf, d2, false, pfa, pfa.map(dSt));
    }
    if (dormR.length) {
      const pr = dormR.map((e) => (e.pos != null ? e.pos : 0.5));
      dormersOn(L, GL, rf, d2, true, pr, pr.map(dSt));
    } else if (SPEC.dormersRear) {
      const pra = autoPos(SPEC.dormersRear);
      dormersOn(L, GL, rf, d2, true, pra, pra.map(dSt));
    }
  }

  // 2nd-floor placed windows: side walls on the gable ends, front/back on the roof slope.
  const h2 = bboxOf(plan["2f"]) || { x0: minx, y0: miny, x1: maxx, y1: maxy };
  const gyC = (h2.y0 + h2.y1) / 2, gHalf = Math.max((h2.y1 - h2.y0) / 2, 0.1), ridgeApprox = eave + (minRise || 0);
  (els["2f"] || []).filter((e) => e.type === "window").forEach((e) => {
    const p = e.pos != null ? e.pos : 0.5, w = e.w || 4;
    if (e.wall === "left" || e.wall === "right") {
      const xg = e.wall === "left" ? (h2.x0 - minx < 3 ? minx : h2.x0) : maxx - h2.x1 < 3 ? maxx : h2.x1;
      const yc = h2.y0 + p * (h2.y1 - h2.y0);
      const roofAtYc = eave + (1 - Math.min(1, Math.abs(yc - gyC) / gHalf)) * (ridgeApprox - eave);
      const zHi = Math.min(15.0, roofAtYc - 0.5), zLo = Math.max(zHi - 2.8, 10.2);
      winX(L, GL, xg, yc - w / 2, yc + w / 2, zLo, zHi, winOcc2f(xg, yc), true, e.wall === "left" ? -0.06 : 0.06);
    } else {
      const cx2 = h2.x0 + p * (h2.x1 - h2.x0), yf = e.wall === "front" ? h2.y0 + 3.5 : h2.y1 - 3.5;
      winY(L, GL, yf, cx2 - w / 2, cx2 + w / 2, 10.8, 13.8, winOcc2f(cx2, yf), true, e.wall === "front" ? -0.3 : 0.3);
    }
  });

  // basement exterior openings - walkout doors / egress windows at grade
  const bb = bboxOf(plan["bsmt"]);
  const placedB = (els["bsmt"] || []).filter(isExterior);
  if (bb && placedB.length) {
    placedB.forEach((e) => {
      const p = e.pos != null ? e.pos : 0.5, w = e.w || 4, horiz = e.wall === "front" || e.wall === "back";
      let cx: number, cy: number;
      if (e.wall === "front") { cx = bb.x0 + p * (bb.x1 - bb.x0); cy = miny; }
      else if (e.wall === "back") { cx = bb.x0 + p * (bb.x1 - bb.x0); cy = maxy; }
      else if (e.wall === "left") { cx = bb.x0 - minx < 3 ? minx : bb.x0; cy = bb.y0 + p * (bb.y1 - bb.y0); }
      else { cx = maxx - bb.x1 < 3 ? maxx : bb.x1; cy = bb.y0 + p * (bb.y1 - bb.y0); }
      if (e.type === "window") {
        if (horiz) winY(L, GL, cy, cx - w / 2, cx + w / 2, 0.6, 3.4, "off", true, e.wall === "front" ? -0.06 : 0.06);
        else winX(L, GL, cx, cy - w / 2, cy + w / 2, 0.6, 3.4, "off", true, e.wall === "left" ? -0.06 : 0.06);
      } else if (e.kind === "cellar") bulkheadDoor(L, GL, e.wall, cx, cy, Math.max(w, 5), e.open);
      else doorOnWall(L, GL, e.wall, cx, cy, Math.max(w, 3), 0.3, 6.4, e.open);
    });
  }
  // auto bulkhead only when nothing is placed and the basement is entered from outside
  if (SPEC.basementEntrance !== "interior" && !placed.length && !placedB.length && plan["bsmt"] && plan["bsmt"].length) {
    bulkheadDoor(L, GL, "back", (minx + maxx) / 2, maxy, 6, false);
  }

  // Chimney: single edge stack (right/left), or one-or-more central stacks through the ridge.
  const side = SPEC.chimney, yc = (miny + maxy) / 2;
  const cn = Math.max(1, Math.min(4, Math.round(SPEC.chimneyCount || 1)));
  const ridgeZ = roof && roof.ridge != null ? roof.ridge : ztop;
  const cfrac = (i: number) => (i + 1) / (cn + 1);
  if (side === "center") {
    for (let ci = 0; ci < cn; ci++) {
      let ccx: number, ccy: number;
      if (roof && roof.axis === "x" && roof.a != null && roof.b != null) {
        ccx = roof.a + (roof.b - roof.a) * cfrac(ci);
        ccy = roof.mid != null ? roof.mid : yc;
      } else if (roof && roof.axis === "y") {
        ccx = (minx + maxx) / 2;
        ccy = miny + (maxy - miny) * cfrac(ci);
      } else {
        ccx = minx + (maxx - minx) * cfrac(ci);
        ccy = yc;
      }
      chimneyStack(L, ccx, ccy, ridgeZ - 1.5, ridgeZ + 4);
    }
  } else if (side === "left" && roof && roof.ridge) {
    for (let ci = 0; ci < cn; ci++) chimneyAt(L, minx, cn === 1 ? yc : miny + (maxy - miny) * cfrac(ci), roof.ridge + 4, -1);
  } else if (side === "right" && roof && roof.ridge) {
    for (let ci = 0; ci < cn; ci++) chimneyAt(L, maxx, cn === 1 ? yc : miny + (maxy - miny) * cfrac(ci), roof.ridge + 4, 1);
  }

  return { faces: L, glow: GL, labels: LBL };
}

function roomByName(rooms: PlanRoom[] | undefined, name: string | undefined): PlanRoom | undefined {
  const n = String(name || "").toLowerCase();
  return (rooms || []).filter((r) => String(r.name).toLowerCase() === n)[0];
}
function onRoomWall(rr: PlanRoom, wall: string | undefined, p: number): Pt2 {
  const rx0 = rr.x, ry0 = rr.y, rx1 = rr.x + rr.w, ry1 = rr.y + rr.d;
  if (wall === "front") return [rx0 + p * (rx1 - rx0), ry0];
  if (wall === "back") return [rx0 + p * (rx1 - rx0), ry1];
  if (wall === "left") return [rx0, ry0 + p * (ry1 - ry0)];
  return [rx1, ry0 + p * (ry1 - ry0)];
}

function buildFromPlan(opts: RenderOpts): Built {
  const plan = opts.plan || {}, lit = opts.lit || {}, floor = opts.floor || "all";
  const L: Face[] = [], GL: Glow[] = [], LBL: Label[] = [];
  const stOf = (n: string): RoomState => {
    const s = lit[String(n).toLowerCase()];
    return s === "dom" ? "dom" : s === "mmwave" ? "mmwave" : s ? "on" : "off";
  };
  // footprint bbox across all floors -> center + exterior walls
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, ztop = -1e9;
  Object.keys(plan).forEach((fk) => {
    const z = _planZ(fk);
    if (fk !== "b" && fk !== "bsmt" && z[1] > ztop) ztop = z[1];
    (plan[fk] || []).forEach((r) => {
      if (r.x < minx) minx = r.x;
      if (r.y < miny) miny = r.y;
      if (r.x + r.w > maxx) maxx = r.x + r.w;
      if (r.y + r.d > maxy) maxy = r.y + r.d;
    });
  });
  if (minx > maxx) {
    minx = XG0;
    miny = 0;
    maxx = XHE;
    maxy = D;
  }
  if (ztop < 0) ztop = RIDGE;
  CENTER = [(minx + maxx) / 2, (miny + maxy) / 2, WALL * 0.5];
  if (floor !== "all") {
    const pf = _planFloorKey(plan, floor);
    const z = _planZ(pf);
    const rooms = plan[pf] || [];
    rooms.forEach((r) => {
      if (r.points && r.points.length >= 3) roomPrism(L, LBL, r.points, z[0], z[1], r.label || r.name, stOf(r.name));
      else roomBox(L, LBL, r.x, r.y, r.w, r.d, z[0], z[1], r.label || r.name, stOf(r.name));
    });
    const els = (opts.elements && opts.elements[pf]) || [];
    const zd0 = z[0] + 0.3, zd1 = Math.min(z[0] + 7, z[1] - 0.2);
    // interior doors, open/closed from their sensor
    els.filter((e) => e.type === "door" && e.kind === "interior").forEach((e) => {
      const rr = roomByName(rooms, e.room);
      if (!rr) return;
      const [cx, cy] = onRoomWall(rr, e.wall, e.pos != null ? e.pos : 0.5);
      doorOnWall(L, GL, e.wall, cx, cy, Math.max(e.w || 3, 3), zd0, zd1, e.open);
    });
    els.filter((e) => e.type === "door" && e.kind === "cased").forEach((e) => {
      const rr = roomByName(rooms, e.room);
      if (!rr) return;
      const [cx, cy] = onRoomWall(rr, e.wall, e.pos != null ? e.pos : 0.5);
      casedOnWall(L, e.wall, cx, cy, Math.max(e.w || 3, 3), zd0, zd1);
    });
    // interior windows - glazing on a chosen room's wall
    els.filter((e) => e.type === "window" && e.kind === "interior").forEach((e) => {
      const rr = roomByName(rooms, e.room);
      if (!rr) return;
      const p = e.pos != null ? e.pos : 0.5, w = Math.max(e.w || 3, 2);
      const zw0 = z[0] + 2.5, zw1 = Math.min(z[0] + 6.5, z[1] - 0.4);
      const [cx, cy] = onRoomWall(rr, e.wall, p);
      if (e.wall === "front") winY(L, GL, cy, cx - w / 2, cx + w / 2, zw0, zw1, "off", true, -0.06);
      else if (e.wall === "back") winY(L, GL, cy, cx - w / 2, cx + w / 2, zw0, zw1, "off", true, 0.06);
      else if (e.wall === "left") winX(L, GL, cx, cy - w / 2, cy + w / 2, zw0, zw1, "off", true, -0.06);
      else winX(L, GL, cx, cy - w / 2, cy + w / 2, zw0, zw1, "off", true, 0.06);
    });
    // balcony / French doors - full-height glazing, lit when open
    els.filter((e) => e.type === "door" && e.kind === "french").forEach((e) => {
      const rr = roomByName(rooms, e.room);
      if (!rr) return;
      const p = e.pos != null ? e.pos : 0.5, w = Math.max(e.w || 4, 3), stt: WinState = e.open ? "on" : "off";
      const [cx, cy] = onRoomWall(rr, e.wall, p);
      if (e.wall === "front") winY(L, GL, cy, cx - w / 2, cx + w / 2, zd0, zd1, stt, true, -0.07, 2);
      else if (e.wall === "back") winY(L, GL, cy, cx - w / 2, cx + w / 2, zd0, zd1, stt, true, 0.07, 2);
      else if (e.wall === "left") winX(L, GL, cx, cy - w / 2, cy + w / 2, zd0, zd1, stt, true, -0.07);
      else winX(L, GL, cx, cy - w / 2, cy + w / 2, zd0, zd1, stt, true, 0.07);
    });
    return { faces: L, glow: GL, labels: LBL };
  }
  return buildExteriorFromPlan(opts, plan, minx, miny, maxx, maxy, ztop);
}

/** Assemble a frame for the given options (faces, glow quads, labels). */
export function build(opts: RenderOpts): Built {
  C = opts.palette;
  applySpec(opts.spec);
  return buildFromPlan(opts);
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safeId(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]/g, "");
}

/** Render one frame to an `<svg>` string. */
export function renderSVG(opts: RenderOpts): string {
  const theta = opts.theta == null ? 35 : opts.theta;
  const built = build(opts);
  const faces = built.faces, glow = built.glow, labels = built.labels || [];
  faces.sort((a, b) => faceDepth(b, theta) - faceDepth(a, theta)); // farthest first

  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  const all: Array<{ p: Pt3[] }> = (faces as Array<{ p: Pt3[] }>).concat(glow);
  for (const item of all) for (const pt of item.p) {
    const q = project(pt, theta);
    if (q[0] < mnx) mnx = q[0];
    if (q[0] > mxx) mxx = q[0];
    if (q[1] < mny) mny = q[1];
    if (q[1] > mxy) mxy = q[1];
  }
  const pad = 40;
  let X0: number, Y0: number, W: number, H: number;
  if (opts.box) [X0, Y0, W, H] = opts.box;
  else {
    X0 = mnx - pad;
    Y0 = mny - pad;
    W = mxx - mnx + 2 * pad;
    H = mxy - mny + 2 * pad;
  }
  const vb = `${X0.toFixed(1)} ${Y0.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`;
  const pp = (pts: Pt3[]) => pts.map((p) => { const s = project(p, theta); return `${s[0].toFixed(1)},${s[1].toFixed(1)}`; }).join(" ");
  const id = safeId(opts.idPrefix || "j3d");
  const gId = `${id}-glow`, bgId = `${id}-bg`, shId = `${id}-sh`;

  // Palette values come from the HA theme (palette.ts validates them, this
  // escapes them too): nothing reaches an attribute position unescaped.
  const col = (v: string) => esc(v);

  let body = "";
  body += `<defs><filter id="${gId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`
    + `<radialGradient id="${bgId}" cx="50%" cy="40%" r="65%"><stop offset="0%" style="stop-color:${col(C.bgGlow)}"/><stop offset="100%" style="stop-color:${col(C.bgGlow)};stop-opacity:0"/></radialGradient>`
    + `<radialGradient id="${shId}" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:${col(C.shadow)}"/><stop offset="100%" style="stop-color:${col(C.shadow)};stop-opacity:0"/></radialGradient></defs>`;
  body += `<rect x="${X0.toFixed(1)}" y="${Y0.toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="url(#${bgId})"/>`;
  const gc = project([CENTER[0], CENTER[1], 0], theta);
  body += `<ellipse cx="${gc[0].toFixed(1)}" cy="${(mxy + pad * 0.2).toFixed(1)}" rx="${((mxx - mnx) * 0.42).toFixed(1)}" ry="20" fill="url(#${shId})"/>`;
  for (const g of glow) body += `<polygon points="${pp(g.p)}" style="fill:${col(g.f)}" filter="url(#${gId})"/>`;
  for (const fc of faces) {
    const closed = fc.f !== "none";
    body += `<poly${closed ? "gon" : "line"} points="${pp(fc.p)}"${fc.cls ? ` class="${esc(fc.cls)}"` : ""}`
      + ` style="fill:${closed ? col(fc.f) : "none"};stroke:${col(fc.s)}" stroke-width="${fc.w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const animate = opts.animate !== false;
  for (const lb of labels) {
    const sp = project([lb.x, lb.y, lb.z], theta);
    if (lb.dot) {
      const dc = lb.st === "dom" ? C.dotDom : lb.st === "mmwave" ? C.dotMmwave : C.dotOn;
      body += `<circle cx="${sp[0].toFixed(1)}" cy="${sp[1].toFixed(1)}" r="2.4" style="fill:${col(dc)}">`
        + (animate ? `<animate attributeName="opacity" values="0.35;1;0.35" dur="2s" repeatCount="indefinite"/>` : "")
        + `</circle>`;
    } else {
      const tc = lb.st === "dom" ? C.textDom : lb.st === "mmwave" ? C.textMmwave : lb.st === "on" ? C.textOn : C.textOff;
      const fs = lb.small ? 6 : lb.big ? 9 : 7.5;
      body += `<text x="${sp[0].toFixed(1)}" y="${sp[1].toFixed(1)}" text-anchor="middle" dominant-baseline="middle"`
        + ` font-size="${fs}" font-weight="600" letter-spacing="0.8" paint-order="stroke" stroke-width="0.8" stroke-linejoin="round"`
        + ` style="fill:${col(tc)};stroke:${col(C.textHalo)}">${esc(lb.t || "")}</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="${vb}" role="presentation" focusable="false">${body}</svg>`;
}

/** A stable viewBox covering the model across all rotations (15 degree steps). */
export function fixedBox(opts: RenderOpts): Box {
  const b = build(opts);
  const all: Array<{ p: Pt3[] }> = (b.faces as Array<{ p: Pt3[] }>).concat(b.glow);
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  for (let t = 0; t < 360; t += 15)
    for (const item of all) for (const pt of item.p) {
      const q = project(pt, t);
      if (q[0] < mnx) mnx = q[0];
      if (q[0] > mxx) mxx = q[0];
      if (q[1] < mny) mny = q[1];
      if (q[1] > mxy) mxy = q[1];
    }
  const pad = 46;
  return [mnx - pad, mny - pad, mxx - mnx + 2 * pad, mxy - mny + 2 * pad];
}

export const dims = { GW, HW, D, WALL, get RIDGE() { return RIDGE; } };
