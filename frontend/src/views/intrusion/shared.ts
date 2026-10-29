/**
 * Types and small helpers shared by the intrusion view and its sub-elements.
 * Shapes follow frontend/specs/intrusion.md (websocket.ws_intrusion,
 * intrusion.status / get_log / learning_summary / label_event).
 */
import type { Hass } from "../../types";
import type { BadgeLevel } from "../../components";
import { t } from "../../i18n";

export interface IntrusionSnapshotRef {
  path?: string; // server filesystem path - never rendered
  url: string; // /api/jarvis/snapshot/intrusion/...jpg - must be signed
  camera: string; // camera.front_door
  ts: number; // epoch seconds
}

/** `intrusion.status()` - returned by action:"status" and spread into dismiss / acknowledge. */
export interface IntrusionStatus {
  last_snapshot: IntrusionSnapshotRef | null;
  called_off: boolean;
  acknowledged: boolean;
  suppressed_for: number;
  false_alarms_24h: number;
  ok?: boolean;
  suppressed_seconds?: number;
  held_seconds?: number;
}

export interface IntrusionEvent {
  id: string;
  ts: number; // epoch seconds (float)
  kind: string; // investigating | unresolved | confirmed | false_alarm | (unknown)
  reason: string;
  breach: string;
  breach_area: string;
  camera: string;
  snapshot_url: string;
  snapshot_path?: string; // never rendered
  zones: string[];
  max_depth: number | null;
  label: null | "real" | "false";
  labeled_ts?: number;
  pattern?: string;
}

export interface LearningSummary {
  events: number;
  labeled: number;
  patterns: Record<string, { false?: number; real?: number }>;
  damped_patterns: string[];
  min_false_to_damp: number;
}

export interface IntrusionLogResponse {
  events?: IntrusionEvent[];
  learning?: LearningSummary;
}

/** `label` answers {ok:false, error} as a RESULT, not a WS error. */
export interface LabelResponse {
  ok?: boolean;
  id?: string;
  label?: string | null;
  error?: string;
  learning?: LearningSummary;
}

export const EMPTY_LEARNING: LearningSummary = {
  events: 0,
  labeled: 0,
  patterns: {},
  damped_patterns: [],
  min_false_to_damp: 3,
};

/** The old tab's timeout choices (seconds -> label key). */
export const TIMEOUT_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
];

export function normaliseLearning(l: Partial<LearningSummary> | null | undefined): LearningSummary {
  if (!l || typeof l !== "object") return EMPTY_LEARNING;
  return {
    events: Number(l.events) || 0,
    labeled: Number(l.labeled) || 0,
    patterns: l.patterns && typeof l.patterns === "object" ? l.patterns : {},
    damped_patterns: Array.isArray(l.damped_patterns) ? l.damped_patterns : [],
    min_false_to_damp: Number(l.min_false_to_damp) || 3,
  };
}

/** Friendly camera name: hass.states friendly_name, else "camera.front_door" -> "front door". */
export function cameraName(hass: Hass | undefined, camera: string | null | undefined): string {
  if (!camera) return "";
  const friendly = hass?.states?.[camera]?.attributes?.friendly_name;
  if (typeof friendly === "string" && friendly.trim()) return friendly;
  return camera.replace(/^camera\./, "").replace(/_/g, " ");
}

function locale(hass: Hass | undefined): string | undefined {
  const l = hass?.locale?.language || hass?.language;
  return typeof l === "string" && l ? l : undefined;
}

/** Absolute date+time for an epoch-seconds timestamp, in the HA locale. */
export function formatTime(hass: Hass | undefined, tsSeconds: number | null | undefined): string {
  const ms = Number(tsSeconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  try {
    return new Intl.DateTimeFormat(locale(hass), { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

/** Short relative time ("3 min ago"); translated via t(). */
export function relativeTime(tsSeconds: number | null | undefined, nowMs: number = Date.now()): string {
  const ms = Number(tsSeconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const diff = Math.max(0, Math.round((nowMs - ms) / 1000));
  if (diff < 60) return t("just now");
  const min = Math.round(diff / 60);
  if (min < 60) return t("{n} min ago", { n: min });
  const h = Math.round(min / 60);
  if (h < 48) return t("{n} h ago", { n: h });
  return t("{n} d ago", { n: Math.round(h / 24) });
}

export function kindLevel(kind: string): BadgeLevel {
  switch (kind) {
    case "confirmed":
      return "danger";
    case "unresolved":
      return "warn";
    case "investigating":
      return "info";
    case "false_alarm":
      return "neutral";
    default:
      return "neutral";
  }
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case "confirmed":
      return t("CONFIRMED");
    case "unresolved":
      return t("UNRESOLVED");
    case "investigating":
      return t("INVESTIGATING");
    case "false_alarm":
      return t("FALSE ALARM");
    default:
      return String(kind || "").replace(/_/g, " ").toUpperCase();
  }
}

/** HA toast: the shell / HA listens for `hass-notification` on the window. */
export function notify(el: HTMLElement, message: string): void {
  el.dispatchEvent(
    new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }),
  );
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return String(err ?? t("Unknown error"));
}
