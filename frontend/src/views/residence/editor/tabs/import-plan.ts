/**
 * The plan file (editor.md section 6.2): export the working copy as a JSON
 * bundle, and read a bundle / legacy bare plan / `{floor_plan_rooms}` wrapper
 * back. Parsing goes through the model's tolerant parseDoc(), so a file is
 * read exactly like a snapshot would be. Immediate-save sections (units,
 * door mapping, backgrounds) are returned separately: the tab OFFERS them
 * after a confirmation, never applies them silently.
 */
import {
  PLAN_KEYS, asRecord, parseDoc, parseDoorMapping, parseJsonish, parseUnits, serializeAll,
  type DoorMapping, type EditorDoc, type FloorKey, type PlanKey, type Units,
} from "../model";
import type { EditorStore } from "../store";
import { BG_MAX_BYTES, dataUrlBytes } from "./import-image";
import { ALIGN_KEY, parseAlign, type BgAlign } from "./import-layers";

export const PLAN_FILE_NAME = "jarvis-floor-plan.json";

/** reason is an English t() key, or a raw JSON.parse message */
export class PlanFileError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.name = "PlanFileError";
    this.reason = reason;
  }
}

/** The raw floor_plan_bg dict (backgrounds AND the alignment entry), {} when unset. */
export function rawBackground(config: Record<string, unknown>): Record<string, unknown> {
  const rec = asRecord(parseJsonish(config.floor_plan_bg));
  return rec ? { ...rec } : {};
}

/**
 * A background a plan FILE may bring in: an inline image (data:image/...) no
 * bigger than an upload may be. A shared file must not plant external URLs
 * (every admin's panel would load them) or multi-megabyte strings.
 */
export function isImportableImage(v: unknown): v is string {
  return typeof v === "string" && /^data:image\/[a-z0-9.+-]+[;,]/i.test(v) && dataUrlBytes(v) <= BG_MAX_BYTES;
}

/**
 * The part of a plan file's floor_plan_bg that will be written: images of
 * `floors` that pass isImportableImage, and the alignments of exactly those
 * floors. `skipped` counts the other (non-alignment) entries.
 */
export function importableBackgrounds(raw: Record<string, unknown>, floors: ReadonlySet<FloorKey>): { images: Record<FloorKey, string>; align: Record<FloorKey, BgAlign>; skipped: number } {
  const images: Record<FloorKey, string> = {};
  let skipped = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (k === ALIGN_KEY) continue;
    if (floors.has(k) && isImportableImage(v)) images[k] = v;
    else skipped += 1;
  }
  const align: Record<FloorKey, BgAlign> = {};
  const parsed = parseAlign({ floor_plan_bg: { [ALIGN_KEY]: raw[ALIGN_KEY] } });
  for (const k of Object.keys(images)) if (parsed[k]) align[k] = parsed[k];
  return { images, align, skipped };
}

/** The export bundle of the CURRENT working copy (unsaved changes included). */
export function buildBundle(store: EditorStore, includeBackgrounds: boolean): Record<string, unknown> {
  const all = serializeAll(store.doc);
  const out: Record<string, unknown> = { jarvis_floor_plan: 1 };
  for (const k of PLAN_KEYS) out[k] = all[k];
  out.floor_plan_units = store.settings.units;
  out.door_mapping = { ...store.settings.doorMapping };
  if (includeBackgrounds) out.floor_plan_bg = rawBackground(store.config);
  return out;
}

/** Trigger a download of `text` as `name` (Blob + <a download>). */
export function downloadText(name: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export interface PlanFile {
  /** "bundle" = a jarvis_floor_plan export; "rooms" = a legacy bare plan / {floor_plan_rooms} wrapper */
  kind: "bundle" | "rooms";
  /** the plan sections present in the file (raw, parsed by applyPlanFile) */
  sections: Partial<Record<PlanKey, unknown>>;
  units?: Units;
  doorMapping?: DoorMapping;
  /** raw floor_plan_bg of the bundle (string values + alignment); importableBackgrounds() picks what may be written */
  backgrounds?: Record<string, unknown>;
  /** number of importable images in `backgrounds` (isImportableImage; the floor check happens at import time) */
  backgroundCount: number;
  /** rooms in the file's floor_plan_rooms */
  roomCount: number;
}

function isFloorValue(v: unknown): boolean {
  if (Array.isArray(v)) return true;
  const o = asRecord(v);
  return !!o && Array.isArray(o.rooms);
}

function countRoomsIn(raw: unknown): number {
  const rec = asRecord(parseJsonish(raw));
  if (!rec) return 0;
  let n = 0;
  for (const v of Object.values(rec)) {
    if (Array.isArray(v)) n += v.length;
    else {
      const o = asRecord(v);
      if (o && Array.isArray(o.rooms)) n += o.rooms.length;
    }
  }
  return n;
}

const INVALID = "expected a JARVIS floor plan";

/** Parse a plan file's text (throws PlanFileError). */
export function parsePlanFile(text: string): PlanFile {
  let doc: unknown;
  try {
    doc = JSON.parse(text.replace(/^﻿/, ""));
  } catch (err) {
    throw new PlanFileError(err instanceof Error ? err.message : String(err));
  }
  const top = asRecord(doc);
  if (!top) throw new PlanFileError(INVALID);
  if ("jarvis_floor_plan" in top) {
    const sections: Partial<Record<PlanKey, unknown>> = {};
    for (const k of PLAN_KEYS) {
      if (!(k in top)) continue;
      const v = parseJsonish(top[k]);
      if (v == null) continue;
      if (k === "floor_plan_rooms" && !(asRecord(v) && Object.keys(v as object).length)) continue; // {} = no rooms section
      sections[k] = v;
    }
    const out: PlanFile = { kind: "bundle", sections, backgroundCount: 0, roomCount: countRoomsIn(sections.floor_plan_rooms) };
    if (typeof top.floor_plan_units === "string") out.units = parseUnits(top.floor_plan_units);
    if (top.door_mapping != null) out.doorMapping = parseDoorMapping(top.door_mapping);
    const bg = asRecord(parseJsonish(top.floor_plan_bg));
    if (bg) {
      out.backgrounds = { ...bg };
      out.backgroundCount = Object.entries(bg).filter(([k, v]) => k !== ALIGN_KEY && isImportableImage(v)).length;
    }
    if (!Object.keys(sections).length && !out.units && !out.doorMapping && !out.backgroundCount) throw new PlanFileError(INVALID);
    return out;
  }
  // {"floor_plan_rooms": {...}}
  if ("floor_plan_rooms" in top) {
    const v = asRecord(parseJsonish(top.floor_plan_rooms));
    if (!v || !Object.keys(v).length || !Object.values(v).every(isFloorValue)) throw new PlanFileError(INVALID);
    return { kind: "rooms", sections: { floor_plan_rooms: v }, backgroundCount: 0, roomCount: countRoomsIn(v) };
  }
  // the legacy bare plan: every top-level value is a floor ({rooms: [...]} or an array of rooms)
  const values = Object.values(top);
  if (values.length && values.every(isFloorValue)) {
    return { kind: "rooms", sections: { floor_plan_rooms: top }, backgroundCount: 0, roomCount: countRoomsIn(top) };
  }
  throw new PlanFileError(INVALID);
}

/**
 * Load the file's plan sections into `doc` (a clone inside store.change): each
 * present section replaces the doc's; absent ones are kept. House keys come
 * from the live config so the floor list follows home_stories / has_basement.
 * Returns the parse warnings.
 */
export function applyPlanFile(doc: EditorDoc, file: PlanFile, config: Record<string, unknown>): string[] {
  const cfg: Record<string, unknown> = { ...config };
  for (const k of PLAN_KEYS) cfg[k] = file.sections[k] ?? null;
  const { doc: parsed, warnings } = parseDoc(cfg);
  if (file.sections.floor_plan_rooms !== undefined) doc.floors = parsed.floors;
  if (file.sections.floor_plan_elements !== undefined) doc.openings = parsed.openings;
  if (file.sections.floor_plan_cameras !== undefined) doc.cameras = parsed.cameras;
  if (file.sections.floor_plan_entities !== undefined) doc.pins = parsed.pins;
  if (file.sections.floor_plan_property !== undefined) doc.property = parsed.property;
  return warnings;
}
