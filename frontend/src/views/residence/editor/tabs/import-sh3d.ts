/**
 * SweetHome3D -> floor-plan rooms, in the browser (editor.md section 6.1;
 * port of scripts/sweethome3d_to_floorplan.py).
 *
 *   readSweetHome(file bytes) -> SweetHome {levels, rooms}      (.sh3d ZIP, Home.xml, JSON export)
 *   convertSweetHome(home, opts) -> {floor: NewRoom[]}             (scale, mirror, rotate, origin, level -> floor)
 *
 * Errors are Sh3dError with a code; the tab maps the code to the translated
 * message of section 6.1. Pure apart from DOMParser / DecompressionStream.
 */
import { asRecord, bboxOfPoints, r1, ri, type FloorKey, type Pt2 } from "../model";
import { canInflate, isZip, zipEntries, zipRead, ZipError } from "./import-zip";

export type Sh3dErrorCode = "no_inflate" | "legacy_binary" | "no_rooms" | "unreadable";
export class Sh3dError extends Error {
  readonly code: Sh3dErrorCode;
  constructor(code: Sh3dErrorCode, message: string) {
    super(message);
    this.name = "Sh3dError";
    this.code = code;
  }
}

export interface SweetLevel {
  id: string;
  name: string;
}
export interface SweetRoom {
  name: string;
  /** level id, or null when the home has no levels */
  level: string | null;
  points: Pt2[];
}
export interface SweetHome {
  levels: SweetLevel[];
  rooms: SweetRoom[];
}

/** SweetHome3D centimetres -> editor units at true size (1 unit = 0.2 ft = 6.096 cm). */
export const SH3D_REAL_SCALE = 1 / 6.096;
const RECT_TOLERANCE = 0.05;

function looksLikeXml(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length && i < 64 && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0xef || bytes[i] === 0xbb || bytes[i] === 0xbf)) i++;
  if (bytes[i] !== 0x3c) return false; // "<"
  const head = new TextDecoder("utf-8").decode(bytes.subarray(i, Math.min(bytes.length, i + 256))).toLowerCase();
  return head.startsWith("<?xml") || head.includes("<home");
}

function parseXmlHome(text: string): SweetHome {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(text, "application/xml");
  } catch (err) {
    throw new Sh3dError("unreadable", err instanceof Error ? err.message : String(err));
  }
  if (doc.getElementsByTagName("parsererror").length) throw new Sh3dError("unreadable", "the XML is not well-formed");
  const levels: SweetLevel[] = [];
  const lv = doc.getElementsByTagName("level");
  for (let i = 0; i < lv.length; i++) {
    const el = lv[i];
    const id = el.getAttribute("id") || el.getAttribute("name") || String(levels.length);
    levels.push({ id, name: el.getAttribute("name") || id });
  }
  const rooms: SweetRoom[] = [];
  const rm = doc.getElementsByTagName("room");
  for (let i = 0; i < rm.length; i++) {
    const el = rm[i];
    const pts: Pt2[] = [];
    for (const child of Array.from(el.children)) {
      if (child.tagName !== "point") continue;
      const x = Number(child.getAttribute("x")), y = Number(child.getAttribute("y"));
      if (child.getAttribute("x") == null || child.getAttribute("y") == null || !Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push([x, y]);
    }
    rooms.push({ name: el.getAttribute("name") || "", level: el.getAttribute("level"), points: pts });
  }
  return { levels, rooms };
}

function asList(v: unknown): unknown[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function jsonPoints(room: Record<string, unknown>): Pt2[] {
  const raw = room.points ?? room.sPoints ?? room.point;
  const out: Pt2[] = [];
  for (const p of asList(raw)) {
    const o = asRecord(p);
    const x = o ? Number(o.x) : Array.isArray(p) ? Number(p[0]) : NaN;
    const y = o ? Number(o.y) : Array.isArray(p) ? Number(p[1]) : NaN;
    if (Number.isFinite(x) && Number.isFinite(y)) out.push([x, y]);
  }
  return out;
}

function parseJsonHome(text: string): SweetHome {
  let doc: unknown;
  try {
    doc = JSON.parse(text.replace(/^﻿/, ""));
  } catch (err) {
    throw new Sh3dError("unreadable", err instanceof Error ? err.message : String(err));
  }
  const top = asRecord(doc);
  if (!top) throw new Sh3dError("unreadable", "expected a JSON object at the top level");
  const home = asRecord(top.home) ?? top;
  const levels: SweetLevel[] = [];
  asList(home.level).forEach((l, i) => {
    const o = asRecord(l);
    if (!o) return;
    const id = String(o.id ?? i);
    levels.push({ id, name: String(o.name ?? "").trim() || id });
  });
  const rooms: SweetRoom[] = [];
  for (const r of asList(home.room ?? home.rooms)) {
    const o = asRecord(r);
    if (!o) continue;
    rooms.push({ name: String(o.name ?? ""), level: o.level == null ? null : String(o.level), points: jsonPoints(o) });
  }
  return { levels, rooms };
}

/** Read a .sh3d (ZIP), Home.xml or JSON export. */
export async function readSweetHome(bytes: Uint8Array): Promise<SweetHome> {
  if (isZip(bytes)) {
    if (!canInflate()) throw new Sh3dError("no_inflate", "DecompressionStream is not available");
    let entries;
    try {
      entries = zipEntries(bytes);
    } catch (err) {
      throw new Sh3dError("unreadable", err instanceof Error ? err.message : String(err));
    }
    // "Home" first, then any *.xml, then anything that looks like XML (same order as the script)
    const ordered = [...entries.filter((e) => e.name === "Home"), ...entries.filter((e) => e.name.toLowerCase().endsWith(".xml")), ...entries];
    const seen = new Set<string>();
    for (const e of ordered) {
      if (seen.has(e.name)) continue;
      seen.add(e.name);
      if (e.name.endsWith("/") || e.size > 64 * 1024 * 1024) continue;
      let data: Uint8Array;
      try {
        data = await zipRead(bytes, e);
      } catch (err) {
        if (err instanceof ZipError && err.code === "no_inflate") throw new Sh3dError("no_inflate", err.message);
        continue;
      }
      if (looksLikeXml(data)) return parseXmlHome(new TextDecoder("utf-8").decode(data));
    }
    throw new Sh3dError("legacy_binary", "no XML home entry");
  }
  if (looksLikeXml(bytes)) return parseXmlHome(new TextDecoder("utf-8").decode(bytes));
  return parseJsonHome(new TextDecoder("utf-8").decode(bytes));
}

// ── conversion ──────────────────────────────────────────────────────────────
export interface NewRoom {
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: Pt2[];
}

export type Rotation = 0 | 90 | 180 | 270;
export type Mirror = "none" | "x" | "y";
export interface ConvertOptions {
  /** multiply every coordinate (SH3D_REAL_SCALE = true size) */
  scale: number;
  /** clockwise, about the bbox centre of the whole plan */
  rotate: Rotation;
  mirror: Mirror;
  /** translate so the plan's top-left corner is (0, 0) */
  origin: boolean;
  /** level id -> floor key ("" = skip); rooms without a level use the "" key of this map, default 1f */
  floors: Record<string, FloorKey>;
}

/** The default level -> floor mapping: 1st level 1f, 2nd 2f, a basement-like name bsmt. */
export function defaultLevelFloors(home: SweetHome): Record<string, FloorKey> {
  const out: Record<string, FloorKey> = { "": "1f" };
  const above = ["1f", "2f"];
  let i = 0;
  for (const l of home.levels) {
    if (/base|cellar|sous|keller|bsmt/i.test(l.name)) out[l.id] = "bsmt";
    else out[l.id] = above[i++] ?? ""; // a third storey has no floor on the Residence tab: skipped until mapped
  }
  return out;
}

/** Levels that actually carry rooms (for the mapping selects). */
export function levelsWithRooms(home: SweetHome): SweetLevel[] {
  const used = new Set(home.rooms.filter((r) => r.points.length >= 3).map((r) => r.level ?? ""));
  const out = home.levels.filter((l) => used.has(l.id));
  if (used.has("") || [...used].some((id) => id && !home.levels.some((l) => l.id === id))) out.push({ id: "", name: "" });
  return out;
}

/** The 4 points are, within tol, the corners of their own bbox (any order). */
function isAxisAlignedRect(pts: readonly Pt2[], tol = RECT_TOLERANCE): boolean {
  if (pts.length !== 4) return false;
  const bb = bboxOfPoints(pts)!;
  const left: Pt2[] = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x1, bb.y1], [bb.x0, bb.y1]];
  for (const p of pts) {
    const i = left.findIndex((c) => Math.abs(c[0] - p[0]) <= tol && Math.abs(c[1] - p[1]) <= tol);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

/** Convert with the user's options; rooms grouped by target floor (skipped levels dropped). */
export function convertSweetHome(home: SweetHome, opts: ConvertOptions): Record<FloorKey, NewRoom[]> {
  const scale = Number.isFinite(opts.scale) && opts.scale > 0 ? opts.scale : SH3D_REAL_SCALE;
  interface Work {
    floor: FloorKey;
    name: string;
    pts: Pt2[];
    rect: boolean;
  }
  const work: Work[] = [];
  let auto = 0;
  for (const r of home.rooms) {
    if (r.points.length < 3) continue;
    auto += 1;
    const levelKey = r.level != null && home.levels.some((l) => l.id === r.level) ? r.level : "";
    const floor = opts.floors[levelKey] ?? (levelKey ? "" : "1f");
    if (!floor) continue;
    work.push({
      floor,
      name: r.name.trim() || `Room ${auto}`,
      // rectangle-ness is decided on the source points (the script's rule, before any transform)
      rect: isAxisAlignedRect(r.points),
      pts: r.points.map((p): Pt2 => [p[0] * scale, p[1] * scale]),
    });
  }
  const all = (): Pt2[] => work.flatMap((w) => w.pts);
  // mirror (about the plan's own centre)
  if (opts.mirror !== "none" && work.length) {
    const bb = bboxOfPoints(all())!;
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    for (const w of work) w.pts = w.pts.map((p): Pt2 => (opts.mirror === "x" ? [2 * cx - p[0], p[1]] : [p[0], 2 * cy - p[1]]));
  }
  // rotate clockwise about the bbox centre (y grows downward, so (x, y) -> (-y, x) is clockwise on screen)
  const deg = ((opts.rotate % 360) + 360) % 360;
  if (deg && work.length) {
    const bb = bboxOfPoints(all())!;
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    const rot = (p: Pt2): Pt2 => {
      const dx = p[0] - cx, dy = p[1] - cy;
      if (deg === 90) return [cx - dy, cy + dx];
      if (deg === 180) return [cx - dx, cy - dy];
      return [cx + dy, cy - dx];
    };
    for (const w of work) w.pts = w.pts.map(rot);
  }
  if (opts.origin && work.length) {
    const bb = bboxOfPoints(all())!;
    for (const w of work) w.pts = w.pts.map((p): Pt2 => [p[0] - bb.x0, p[1] - bb.y0]);
  }
  const out: Record<FloorKey, NewRoom[]> = {};
  for (const w of work) {
    const pts = w.pts.map((p): Pt2 => [r1(p[0]), r1(p[1])]);
    const bb = bboxOfPoints(pts)!;
    const room: NewRoom = { name: w.name, type: "room", x: ri(bb.x0), y: ri(bb.y0), w: Math.max(1, ri(bb.x1 - bb.x0)), h: Math.max(1, ri(bb.y1 - bb.y0)) };
    if (!w.rect) room.points = pts;
    (out[w.floor] ??= []).push(room);
  }
  return out;
}

/** Total rooms in a conversion result. */
export function countRooms(plan: Record<FloorKey, NewRoom[]>): number {
  return Object.values(plan).reduce((n, list) => n + list.length, 0);
}
