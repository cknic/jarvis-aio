/**
 * Pure helpers for the people view: name normalisation (mirror of
 * recognition._face_norm), age formatting, response coercion, toasts.
 */
import { t } from "../../i18n";
import type { Hass } from "../../types";
import type {
  BiometricsResponse,
  BiometricsState,
  FaceRow,
  FacesResponse,
  FacesState,
  VoiceMatch,
  VoiceProfile,
  VoicesResponse,
  VoicesState,
} from "./types";

/** Rows with this age (or more) carry no timestamp (Frigate sensor rows send 1e9). */
export const NO_TIMESTAMP_AGE = 1e8;
/** Generous list limit: residents beyond it would show as "not seen recently". */
export const FACES_LIMIT = 60;

/** Client mirror of recognition._face_norm (identity.normalize + [a-z0-9_-] filter, 80 chars). */
export function normName(name: unknown): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join("_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

/** `formatAge` from spec §3.6: "" for unknown / sentinel ages. */
export function formatAge(s: number | null | undefined): string {
  const n = Number(s);
  if (s === null || s === undefined || !Number.isFinite(n) || n < 0 || n >= NO_TIMESTAMP_AGE) return "";
  if (n < 60) return t("{n}s ago", { n: Math.round(n) });
  if (n < 3600) return t("{n}m ago", { n: Math.round(n / 60) });
  return t("{n}h ago", { n: Math.round(n / 3600) });
}

/** Relative time for an epoch-seconds value, via Intl.RelativeTimeFormat when available. */
export function relativeEpoch(tsSeconds: number | null | undefined, locale?: string, nowMs: number = Date.now()): string {
  const ms = Number(tsSeconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const diffS = Math.round((ms - nowMs) / 1000);
  const abs = Math.abs(diffS);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    for (const [unit, size] of units) {
      if (abs >= size) return rtf.format(Math.round(diffS / size), unit);
    }
    return rtf.format(diffS, "second");
  } catch {
    return new Date(ms).toLocaleString();
  }
}

export function localeOf(hass: Hass | undefined): string | undefined {
  const l = hass?.locale?.language || hass?.language;
  return typeof l === "string" && l ? l : undefined;
}

/** Friendly camera name: friendly_name, else the slug with "_" -> " ". */
export function cameraLabel(hass: Hass | undefined, row: Pick<FaceRow, "camera_entity" | "camera">): string {
  const ent = row.camera_entity || "";
  const friendly = ent ? hass?.states?.[ent]?.attributes?.friendly_name : undefined;
  if (typeof friendly === "string" && friendly.trim()) return friendly;
  const slug = row.camera || ent.replace(/^camera\./, "");
  return String(slug || "").replace(/_/g, " ");
}

export function cameraLabelFor(hass: Hass | undefined, entity: string): string {
  if (!entity) return "";
  return cameraLabel(hass, { camera_entity: entity, camera: entity.replace(/^camera\./, "") });
}

/** hass.states filtered to camera.* (sorted by entity id). */
export function cameraOptions(hass: Hass | undefined): Array<{ entity: string; label: string }> {
  const states = hass?.states ?? {};
  return Object.keys(states)
    .filter((id) => id.startsWith("camera."))
    .sort()
    .map((entity) => {
      const friendly = states[entity]?.attributes?.friendly_name;
      return { entity, label: typeof friendly === "string" && friendly.trim() ? friendly : entity };
    });
}

/** hass.states keys starting with "stt." */
export function sttEntities(hass: Hass | undefined): string[] {
  return Object.keys(hass?.states ?? {})
    .filter((id) => id.startsWith("stt."))
    .sort();
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v === null || v === undefined ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function coerceRow(r: unknown): FaceRow | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const name = str(o.name).trim();
  const relationship = str(o.relationship);
  return {
    name: name || t("Unknown"),
    camera_entity: str(o.camera_entity),
    camera: str(o.camera),
    confidence: num(o.confidence),
    age_seconds: num(o.age_seconds, NO_TIMESTAMP_AGE * 10),
    is_unknown: !!o.is_unknown,
    is_resident: !!o.is_resident,
    relationship: relationship === "resident" || relationship === "guest" ? relationship : "unknown",
    snapshot_url: typeof o.snapshot_url === "string" && o.snapshot_url ? o.snapshot_url : null,
    is_low_confidence: !!o.is_low_confidence,
    source: str(o.source),
  };
}

export function coerceFaces(res: FacesResponse | null | undefined, prev?: FacesState | null): FacesState {
  const recent = Array.isArray(res?.recent) ? res.recent.map(coerceRow).filter((r): r is FaceRow => !!r) : [];
  recent.sort((a, b) => a.age_seconds - b.age_seconds);
  return {
    recent,
    residents: Array.isArray(res?.residents) ? res.residents.map((n) => str(n)).filter(Boolean) : [],
    references: Array.isArray(res?.references) ? res.references.map((n) => str(n)).filter(Boolean) : [],
    llmFaceRecognition: typeof res?.llm_face_recognition === "boolean" ? res.llm_face_recognition : !!prev?.llmFaceRecognition,
    recognitionSource: str(res?.recognition_source, prev?.recognitionSource ?? ""),
  };
}

function coerceMatch(m: unknown): VoiceMatch | null {
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  const name = str(o.name).trim();
  if (!name) return null;
  return { name, score: num(o.score), similarity: num(o.similarity), count: num(o.count), trusted: !!o.trusted };
}

export function coerceVoices(res: VoicesResponse | null | undefined): VoicesState {
  const profiles: VoiceProfile[] = Array.isArray(res?.profiles)
    ? res.profiles
        .map((p) => {
          const o = (p ?? {}) as unknown as Record<string, unknown>;
          return { name: str(o.name).trim(), count: Math.max(0, Math.round(num(o.count))), updated: num(o.updated) };
        })
        .filter((p) => !!p.name)
    : [];
  return {
    profiles,
    current: coerceMatch(res?.current),
    localEnabled: !!res?.local_enabled,
    delegateStt: str(res?.delegate_stt),
    modelPath: str(res?.model_path),
    backendAvailable: !!res?.backend_available,
  };
}

/** `identify` answers {match} only; a list-shaped answer (missing field fall-through) is "no match". */
export function identifyMatch(res: VoicesResponse | null | undefined): VoiceMatch | null {
  if (!res || typeof res !== "object" || !("match" in res)) return null;
  return coerceMatch(res.match);
}

export function coerceBiometrics(res: BiometricsResponse | null | undefined): BiometricsState {
  const entities = Array.isArray(res?.entities)
    ? res.entities
        .map((e) => {
          const o = (e ?? {}) as unknown as Record<string, unknown>;
          return { kind: str(o.kind), entity: str(o.entity), value: str(o.value), unit: str(o.unit), name: str(o.name) };
        })
        .filter((e) => !!e.entity)
    : [];
  return { enabled: !!res?.enabled, found: Number.isFinite(Number(res?.found)) ? Number(res?.found) : entities.length, entities };
}

/** Group biometric entities by kind, preserving first-seen kind order. */
export function groupByKind<T extends { kind: string }>(items: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = it.kind || "other";
    const list = map.get(k);
    if (list) list.push(it);
    else map.set(k, [it]);
  }
  return [...map.entries()];
}

/** Freshest `recent` row whose name matches (case-insensitive), or null. */
export function freshestFor(recent: FaceRow[], name: string): FaceRow | null {
  const key = name.trim().toLowerCase();
  let best: FaceRow | null = null;
  for (const r of recent) {
    if (r.name.trim().toLowerCase() !== key) continue;
    if (!best || r.age_seconds < best.age_seconds) best = r;
  }
  return best;
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return String(err ?? t("Unknown error"));
}

export function errorCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string" && c) return c;
  }
  return null;
}

/** HA toast: the shell / HA listens for `hass-notification` on the window. */
export function notify(el: HTMLElement, message: string): void {
  el.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
}

const SNAP_CAM_KEY = "jarvis_faces_snap_cam";

export function rememberedCamera(): string {
  try {
    return localStorage.getItem(SNAP_CAM_KEY) || "";
  } catch {
    return "";
  }
}

export function rememberCamera(entity: string): void {
  try {
    if (entity) localStorage.setItem(SNAP_CAM_KEY, entity);
    else localStorage.removeItem(SNAP_CAM_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}
