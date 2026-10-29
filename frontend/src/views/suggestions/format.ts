/**
 * Pure helpers for the suggestions view: labels, payload parsing, relative
 * times and the toast event. No Lit, no DOM (easy to reason about, easy to
 * keep under the no-literal-colour rule).
 */
import { css } from "lit";
import { t } from "../../i18n";
import type { BadgeLevel } from "../../components";
import type { ToastDetail } from "./types";

// ── suggestion type chips ───────────────────────────────────────────────────

export function patternLabel(type: string | undefined): string {
  switch (type) {
    case "time_routine":
      return t("Daily routine");
    case "sequence":
      return t("Action sequence");
    case "repeated_command":
      return t("Repeated command");
    case "temp_pref":
      return t("Temperature");
    case "presence":
      return t("Presence");
    case "numeric_trigger":
      return t("Sensor threshold");
    case "confirm_sequence":
      return t("Confirmed sequence");
    default:
      return t("Learned pattern");
  }
}

export function patternLevel(type: string | undefined): BadgeLevel {
  return type === "confirm_sequence" ? "warn" : "neutral";
}

export function confidencePct(confidence: unknown): number {
  const n = typeof confidence === "number" && Number.isFinite(confidence) ? confidence : 0;
  return Math.max(0, Math.min(100, Math.round(n * 100)));
}

export function confidenceLevel(pct: number): BadgeLevel {
  if (pct >= 80) return "ok";
  if (pct >= 55) return "warn";
  return "neutral";
}

// ── automation payload ──────────────────────────────────────────────────────

export interface ParsedPayload {
  /** pretty text for the <pre>; "" when there is no payload at all */
  text: string;
  /** true when the payload is an advisory marker (nothing installable) */
  advisory: boolean;
}

export function parsePayload(raw: unknown): ParsedPayload {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return { text: "", advisory: false };
  try {
    const obj: unknown = JSON.parse(s);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      const advisory = o.type === "manual_review" || (typeof o.note === "string" && !("trigger" in o));
      return { text: JSON.stringify(obj, null, 2), advisory };
    }
    return { text: JSON.stringify(obj, null, 2), advisory: false };
  } catch {
    return { text: s, advisory: false };
  }
}

// ── time ────────────────────────────────────────────────────────────────────

/** Goal timestamps use a space separator ("2026-10-29 08:15:00.123"); suggestions use "T". */
export function parseTs(s: unknown): Date | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s.trim().replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12m" | "3h" | "2d" for an absolute millisecond span. */
function span(ms: number): string {
  const m = Math.round(Math.abs(ms) / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** "in 12m" / "3h ago"; "" when unparseable. */
export function relativeTime(s: unknown, now: number = Date.now()): string {
  const d = parseTs(s);
  if (!d) return "";
  const diff = d.getTime() - now;
  return diff >= 0 ? t("in {t}", { t: span(diff) }) : t("{t} ago", { t: span(diff) });
}

/** "{n}m ago" | "{n}h ago" | "{n}d ago" for a unix-seconds timestamp; "" when missing. */
export function agoText(unixSeconds: unknown, now: number = Date.now()): string {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds) || unixSeconds <= 0) return "";
  const m = Math.max(0, Math.round((now - unixSeconds * 1000) / 60_000));
  if (m < 60) return t("{n}m ago", { n: m });
  const h = Math.round(m / 60);
  if (h < 48) return t("{n}h ago", { n: h });
  return t("{n}d ago", { n: Math.round(h / 24) });
}

export function pad2(n: unknown): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return String(v).padStart(2, "0");
}

// ── misc ────────────────────────────────────────────────────────────────────

export function asInt(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0;
}

export function capitalise(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return String(err ?? "");
}

export function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return "";
}

/** Fire the toast event the view listens for (bubbles out of any sub-card). */
export function toast(target: EventTarget, message: string, tone: ToastDetail["tone"] = "neutral"): void {
  const detail: ToastDetail = { message, tone };
  target.dispatchEvent(new CustomEvent<ToastDetail>("jv-toast", { detail, bubbles: true, composed: true }));
}

// ── styles shared by the cards ──────────────────────────────────────────────

export const cardStyles = css`
  :host {
    display: block;
    min-width: 0;
    /* cards size their action rows by their OWN width (container query), so
       the harness's narrow frame and a real phone behave the same */
    container-type: inline-size;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .item {
    padding: var(--jv-space-4);
    border-top: 1px solid var(--jv-divider);
  }
  .item.faded {
    opacity: 0.35;
  }
  .item.dim {
    opacity: 0.65;
  }
  .intro {
    margin: 0;
    padding: 0 var(--jv-space-4) var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .bar {
    height: 4px;
    border-radius: 2px;
    background: var(--jv-neutral-soft);
    overflow: hidden;
  }
  .bar > span {
    display: block;
    height: 100%;
    background: var(--jv-accent);
  }
  .bar.ok > span {
    background: var(--jv-ok);
  }
  .bar.warn > span {
    background: var(--jv-warn);
  }
  .bar.neutral > span {
    background: var(--jv-neutral);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-top: var(--jv-space-3);
  }
  .actions .jv-btn {
    flex: 1 1 auto;
  }
  .actions .jv-btn.primary {
    flex-basis: 100%;
  }
  @container (min-width: 480px) {
    .actions .jv-btn,
    .actions .jv-btn.primary {
      flex: 0 0 auto;
    }
  }
  .inline-error {
    color: var(--jv-danger-text);
    font-size: var(--jv-font-size-s);
    margin: var(--jv-space-1) 0 0;
  }
  .skeleton-rows {
    display: grid;
    gap: var(--jv-space-3);
    padding: var(--jv-space-4);
  }
  .skeleton-rows .jv-skeleton {
    min-height: 56px;
  }
  .skeleton-rows .jv-skeleton:nth-child(2) {
    min-height: 40px;
  }
  .text-btn {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    color: var(--jv-accent);
    cursor: pointer;
    text-decoration: underline;
  }
  ha-icon-button {
    --mdc-icon-button-size: var(--jv-tap);
    color: var(--jv-text-2);
  }
`;
