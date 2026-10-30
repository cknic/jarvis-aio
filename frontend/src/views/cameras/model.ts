/**
 * Pure helpers and types for the cameras view (frontend/specs/cameras.md).
 * No DOM rendering, no colour literals: snapshot normalisers (every optional
 * field defaulted, R4/R7/R9), the frame-source resolver (§2.3), the luma
 * test, the bus-event mapper (§2.9), the related-settings table (§3.2.3),
 * date formatting and the toast / error-message helpers.
 */
import { t } from "../../i18n";
import { WsError } from "../../ws";
import type { Hass, HassEntityState, PanelData } from "../../types";

// ── snapshot types (§2.1) ────────────────────────────────────────────────────

export type LocationMode = "auto" | "indoor" | "outdoor";

export interface Camera {
  entity_id: string;
  name: string;
  raw_name: string;
  enabled: boolean;
  outdoor: boolean;
  location_mode: LocationMode;
}

export interface DoorbellEvent {
  ts: string;
  camera: string;
  entity_id: string;
  image_source: string;
  summary: string;
  analysis: string;
  category: string;
  notable: boolean;
}

export interface DoorbellStats {
  total: number;
  notable: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  first: string | null;
  last: string | null;
}

export interface DoorbellTraining {
  stats: DoorbellStats;
  /** newest first (the snapshot is oldest first; normaliseTraining reverses) */
  recent: DoorbellEvent[];
}

/** What the view keeps from `data.config`. */
export interface CameraConfig {
  cameras: Camera[];
  overrides: Record<string, string>;
  names: Record<string, string>;
  disabled: string[];
  /** the raw catalogue values shown next to the Settings links */
  values: Record<string, unknown>;
}

// ── command responses ────────────────────────────────────────────────────────

export interface RenameResult {
  ok?: boolean;
  camera_names?: Record<string, string>;
  cameras?: unknown;
}

export interface LocationResult {
  ok?: boolean;
  cameras?: unknown;
}

export interface SnapshotResult {
  image?: string | null;
}

export interface ProbeTier {
  tier: string;
  detail: string;
}

export interface Probe {
  entity_id: string;
  tiers: ProbeTier[];
  verdict: string;
  override: string;
  state: string;
  available: boolean | null;
  attrs: { brand: string; model: string; supported_features: string; frontend_stream_type: string } | null;
  platform: string;
  elapsed_ms: number | null;
}

export interface Diagnostics {
  summary: Array<{ entity_id: string; state: string; platform: string }>;
  platforms: Record<string, number>;
  probe: Probe | null;
}

// ── bus events (§2.9) ────────────────────────────────────────────────────────

export interface FocusEvent {
  entity_id: string;
  label: string;
  /** integer percent, or null when the source has none */
  confidence: number | null;
}

interface CameraBusEvent {
  entity_id?: unknown;
  label?: unknown;
  confidence?: unknown;
}

interface FaceBusEvent {
  camera_entity?: unknown;
  name?: unknown;
  confidence?: unknown;
  is_confident?: unknown;
}

/** `jarvis_camera_event` → focus, or null when malformed. */
export function focusFromCameraEvent(data: unknown): FocusEvent | null {
  const d = (data ?? {}) as CameraBusEvent;
  const entity = typeof d.entity_id === "string" ? d.entity_id : "";
  if (!entity) return null;
  const conf = typeof d.confidence === "number" && Number.isFinite(d.confidence) ? Math.round(d.confidence) : null;
  return { entity_id: entity, label: typeof d.label === "string" && d.label ? d.label : "motion", confidence: conf };
}

/** `jarvis_face_recognized` → focus only when confident and resolved to an entity. */
export function focusFromFaceEvent(data: unknown): FocusEvent | null {
  const d = (data ?? {}) as FaceBusEvent;
  const entity = typeof d.camera_entity === "string" ? d.camera_entity : "";
  if (!entity || d.is_confident !== true) return null;
  const conf = typeof d.confidence === "number" && Number.isFinite(d.confidence) ? Math.round(d.confidence) : null;
  return { entity_id: entity, label: typeof d.name === "string" && d.name ? d.name : "FACE", confidence: conf };
}

// ── normalisers ──────────────────────────────────────────────────────────────

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v === null || v === undefined ? fallback : String(v);
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function stringMap(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(rec(v))) if (typeof val === "string" && val) out[k] = val;
  return out;
}

/** Keep only the non-empty string values of a map (rename's camera_names). */
export function stringMapOf(v: unknown): Record<string, string> {
  return stringMap(v);
}

function numberMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(rec(v))) {
    const n = typeof val === "number" ? val : Number(val);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/** `disabled_cameras` may be a list, null, or a JSON string on older installs (R9). */
export function normaliseDisabled(v: unknown): string[] {
  let list: unknown = v;
  if (typeof v === "string") {
    try {
      list = JSON.parse(v);
    } catch {
      list = [];
    }
  }
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
}

export function normaliseCameras(v: unknown, disabled: string[]): Camera[] {
  if (!Array.isArray(v)) return [];
  const out: Camera[] = [];
  for (const raw of v) {
    const c = rec(raw);
    const entity_id = str(c.entity_id);
    if (!entity_id) continue;
    const mode = c.location_mode;
    const raw_name = str(c.raw_name) || str(c.name) || entity_id;
    out.push({
      entity_id,
      name: str(c.name) || raw_name,
      raw_name,
      // the shared fixture lacks `enabled`; the disabled list is the source of truth then
      enabled: typeof c.enabled === "boolean" ? c.enabled : !disabled.includes(entity_id),
      outdoor: c.outdoor === true,
      location_mode: mode === "indoor" || mode === "outdoor" ? mode : "auto",
    });
  }
  return out;
}

export function pickConfig(data: PanelData | null): CameraConfig {
  const cfg = rec(data?.config);
  const disabled = normaliseDisabled(cfg.disabled_cameras);
  return {
    cameras: normaliseCameras(cfg.cameras, disabled),
    overrides: stringMap(cfg.camera_overrides),
    names: stringMap(cfg.camera_names),
    disabled,
    values: cfg,
  };
}

export function normaliseEvent(raw: unknown): DoorbellEvent | null {
  const e = rec(raw);
  const ts = str(e.ts);
  const entity_id = str(e.entity_id);
  if (!ts && !entity_id) return null;
  return {
    ts,
    camera: str(e.camera) || entity_id,
    entity_id,
    image_source: str(e.image_source) || "?",
    summary: str(e.summary),
    analysis: str(e.analysis),
    category: str(e.category),
    notable: e.notable === true,
  };
}

export function normaliseTraining(v: unknown): DoorbellTraining {
  const d = rec(v);
  const s = rec(d.stats);
  const total = typeof s.total === "number" && Number.isFinite(s.total) ? s.total : Number(s.total) || 0;
  const notable = typeof s.notable === "number" && Number.isFinite(s.notable) ? s.notable : Number(s.notable) || 0;
  const recent = (Array.isArray(d.recent) ? d.recent : []).map(normaliseEvent).filter((x): x is DoorbellEvent => !!x);
  return {
    stats: {
      total,
      notable,
      by_category: numberMap(s.by_category),
      by_source: numberMap(s.by_source),
      first: typeof s.first === "string" && s.first ? s.first : null,
      last: typeof s.last === "string" && s.last ? s.last : null,
    },
    recent: recent.reverse(),
  };
}

export function normaliseProbe(v: unknown): Probe | null {
  if (!v || typeof v !== "object") return null;
  const p = rec(v);
  const tiers: ProbeTier[] = [];
  if (Array.isArray(p.tiers)) {
    for (const item of p.tiers) {
      if (Array.isArray(item)) tiers.push({ tier: str(item[0], "?"), detail: str(item[1]) });
      else if (item && typeof item === "object") {
        const o = rec(item);
        tiers.push({ tier: str(o.tier, "?"), detail: str(o.detail) });
      }
    }
  }
  const a = p.attrs && typeof p.attrs === "object" ? rec(p.attrs) : null;
  return {
    entity_id: str(p.entity_id),
    tiers,
    verdict: str(p.verdict),
    override: str(p.override),
    state: str(p.state),
    available: typeof p.available === "boolean" ? p.available : null,
    attrs: a
      ? {
          brand: str(a.brand),
          model: str(a.model),
          supported_features: a.supported_features === null || a.supported_features === undefined ? "" : String(a.supported_features),
          frontend_stream_type: str(a.frontend_stream_type),
        }
      : null,
    platform: str(p.platform),
    elapsed_ms: typeof p.elapsed_ms === "number" && Number.isFinite(p.elapsed_ms) ? p.elapsed_ms : null,
  };
}

export function normaliseDiagnostics(v: unknown): Diagnostics {
  const d = rec(v);
  const summary = (Array.isArray(d.summary) ? d.summary : []).map((row) => {
    const r = rec(row);
    return { entity_id: str(r.entity_id), state: str(r.state), platform: str(r.platform, "?") || "?" };
  });
  return { summary, platforms: numberMap(d.platforms), probe: normaliseProbe(d.probe) };
}

// ── frame sources (§2.3) ─────────────────────────────────────────────────────

/** The entity whose pixels the tile shows: the override when its target exists, else the entity. */
export function resolveSource(entity: string, overrides: Record<string, string>, states: Record<string, HassEntityState> | undefined): string {
  const ov = overrides[entity];
  if (ov && ov !== entity && states && states[ov]) return ov;
  return entity;
}

/** The entity id without its domain ("camera.front_door" -> "front_door"). */
export function entityTail(entity: string): string {
  const i = entity.indexOf(".");
  return i >= 0 ? entity.slice(i + 1) : entity;
}

export const BLACK_LUMA = 10;

/**
 * Mean luminance (0-255) of the image's current frame via a 32x32 canvas.
 * null = cannot sample (no decoded pixels, no 2d context under jsdom, a
 * tainted canvas): the caller gives null the benefit of the doubt.
 */
export function frameLuma(img: HTMLImageElement | null | undefined): number | null {
  try {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 32, 32);
    const px = ctx.getImageData(0, 0, 32, 32).data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    return sum / (px.length / 4);
  } catch {
    return null;
  }
}

/**
 * Does any media element in `root` (and nested shadow roots) show decoded
 * pixels? true / false, or null when no media element was found at all.
 */
export function decodedInTree(root: ParentNode | null | undefined, depth = 0): boolean | null {
  if (!root || depth > 6) return null;
  let found = false;
  try {
    for (const el of root.querySelectorAll("video, img")) {
      found = true;
      if (el instanceof HTMLVideoElement && (el.videoWidth > 0 || el.readyState >= 2)) return true;
      if (el instanceof HTMLImageElement && el.naturalWidth > 0) return true;
    }
    for (const el of root.querySelectorAll("*")) {
      const inner = (el as Element).shadowRoot;
      if (!inner) continue;
      const r = decodedInTree(inner, depth + 1);
      if (r === true) return true;
      if (r === false) found = true;
    }
  } catch {
    return null;
  }
  return found ? false : null;
}

/**
 * Size of the first decoded media element in `root` (and nested shadow
 * roots), for the DIAG readout of the ha-camera-stream tier, whose <video> or
 * MJPEG <img> lives inside HA's own shadow tree. null when nothing has
 * decoded yet.
 */
export function decodedSizeInTree(
  root: ParentNode | null | undefined,
  depth = 0,
): { width: number; height: number } | null {
  if (!root || depth > 6) return null;
  try {
    for (const el of root.querySelectorAll("video, img")) {
      if (el instanceof HTMLVideoElement && el.videoWidth > 0) return { width: el.videoWidth, height: el.videoHeight };
      if (el instanceof HTMLImageElement && el.naturalWidth > 0) return { width: el.naturalWidth, height: el.naturalHeight };
    }
    for (const el of root.querySelectorAll("*")) {
      const r = decodedSizeInTree((el as Element).shadowRoot, depth + 1);
      if (r) return r;
    }
  } catch {
    return null;
  }
  return null;
}

// ── related settings (§3.2.3) ────────────────────────────────────────────────

export interface RelatedSetting {
  key: string;
  label: string;
  value: string;
}

function onOff(v: unknown): string {
  return v === true || v === "true" || v === 1 ? t("On") : t("Off");
}

function numberOrDash(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? String(n) : "—";
}

export function relatedSettings(values: Record<string, unknown>): RelatedSetting[] {
  const has = (k: string) => values[k] !== undefined && values[k] !== null;
  const enumLabel = (k: string, map: Record<string, string>) => (has(k) && map[String(values[k])] ? t(map[String(values[k])]) : has(k) ? String(values[k]) : "—");
  const interval = (): string => {
    if (!has("vision_min_interval")) return "—";
    const n = numberOrDash(values.vision_min_interval);
    return n === "—" ? n : n === "0" ? t("Off") : t("{n} s", { n });
  };
  return [
    {
      key: "recognition_source",
      label: t("Face recognition source"),
      value: enumLabel("recognition_source", {
        both: "Both (Double Take + Frigate)",
        frigate: "Frigate only (sub_label)",
        doubletake: "Double Take only",
      }),
    },
    { key: "identity_min_confidence", label: t("Recognition confidence"), value: numberOrDash(values.identity_min_confidence) },
    {
      key: "camera_alert_level",
      label: t("Camera alerts"),
      value: enumLabel("camera_alert_level", {
        off: "Off — observe only",
        urgent: "Urgent only (default)",
        important: "Important — + deliveries",
        all: "Everything notable",
      }),
    },
    { key: "camera_auto_analyze", label: t("Camera Watch (inspect doorbell presses)"), value: has("camera_auto_analyze") ? onOff(values.camera_auto_analyze) : "—" },
    { key: "camera_auto_analyze_motion", label: t("Also inspect Frigate detections"), value: has("camera_auto_analyze_motion") ? onOff(values.camera_auto_analyze_motion) : "—" },
    { key: "camera_motion_vision", label: t("Motion sensor → camera vision"), value: has("camera_motion_vision") ? onOff(values.camera_motion_vision) : "—" },
    { key: "package_detection", label: t("Package detection"), value: has("package_detection") ? onOff(values.package_detection) : "—" },
    { key: "llm_face_recognition", label: t("LLM face recognition"), value: has("llm_face_recognition") ? onOff(values.llm_face_recognition) : "—" },
    { key: "vision_min_interval", label: t("Minimum seconds between automatic analyses"), value: interval() },
  ];
}

// ── misc ─────────────────────────────────────────────────────────────────────

/** "{name} → auto (indoor)" style mode text for toasts and the segmented control. */
export function resolvedLabel(cam: Camera): string {
  return cam.outdoor ? t("outdoor") : t("indoor");
}

/** HA-locale short date-time; the raw string when it does not parse. */
export function fmtDateTime(ts: string | null | undefined, lang?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  try {
    return d.toLocaleString(lang || undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

export function fmtDate(ts: string | null | undefined, lang?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  try {
    return d.toLocaleDateString(lang || undefined, { dateStyle: "medium" });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function errMsg(err: unknown): string {
  if (err instanceof WsError) {
    if (err.code === "unauthorized") return t("Administrator privileges are required for this action");
    return err.message || err.code;
  }
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err ?? "");
}

export function errCode(err: unknown): string {
  if (err instanceof WsError) return err.code;
  if (err && typeof err === "object" && "code" in err) return String((err as { code: unknown }).code);
  return "";
}

/**
 * Toast: HA's notification manager when the panel runs inside HA; the view's
 * own aria-live status line otherwise (the harness has no notification
 * manager). Both go through the same bubbling event so any ancestor can show
 * it; `jarvis-cam-toast` is what the view listens for.
 */
export function toast(from: EventTarget, message: string, link?: "logs"): void {
  from.dispatchEvent(new CustomEvent("jarvis-cam-toast", { detail: { message, link }, bubbles: true, composed: true }));
}

export function requestRefresh(from: EventTarget, delayMs = 0): void {
  const fire = () => from.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  if (delayMs > 0) setTimeout(fire, delayMs);
  else fire();
}

export function hasService(hass: Hass | undefined): hass is Hass & { callService: NonNullable<Hass["callService"]> } {
  return !!hass && typeof hass.callService === "function";
}

export const ACTIVE_CAM_KEY = "jarvis_active_cam";

export function readActiveCam(): string {
  try {
    return localStorage.getItem(ACTIVE_CAM_KEY) || "";
  } catch {
    return "";
  }
}

export function writeActiveCam(entity: string): void {
  try {
    if (entity) localStorage.setItem(ACTIVE_CAM_KEY, entity);
    else localStorage.removeItem(ACTIVE_CAM_KEY);
  } catch {
    /* private mode / disabled storage */
  }
}

/** Clamp the "Max events" field to 1..500, defaulting to 40 for anything invalid. */
export function clampLimit(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  if (!Number.isFinite(n) || n < 1) return 40;
  return Math.min(500, Math.max(1, Math.round(n)));
}
