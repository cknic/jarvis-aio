/**
 * Pure helpers for the logs view: number / percent / relative-time
 * formatting, debug-log category ordering and tone, and the shared card
 * styles (search box, chips, list rows). No DOM, no colour literals.
 */
import { css } from "lit";
import { t } from "../../i18n";
import type { DebugEntry } from "./types";

/** `0.81` -> "81%", null/undefined/NaN -> "—". */
export function pct(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? `${Math.round(v * 100)}%` : "—";
}

/** Any backend number as text, `0` when missing (never "undefined"/"NaN"). */
export function num(v: unknown): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "0";
}

/** "12m ago" / "3h ago" / "2d ago" from epoch seconds. */
export function ago(epochSeconds: number, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((now / 1000 - epochSeconds) / 60));
  if (minutes < 60) return t("{n}m ago", { n: minutes });
  if (minutes < 1440) return t("{n}h ago", { n: Math.round(minutes / 60) });
  return t("{n}d ago", { n: Math.round(minutes / 1440) });
}

/** HH:MM:SS in the user's locale, for the "Last updated" caption. */
export function clock(d: Date, lang?: string): string {
  try {
    return d.toLocaleTimeString(lang || undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return d.toTimeString().slice(0, 8);
  }
}

// ── debug log categories ─────────────────────────────────────────────────────

export const ALL = "All";
const KNOWN_ORDER = ["CONV", "LOCAL", "AGENT", "GATE", "DEDUP", "CLASSIFY", "CAMERA", "ROUTE", "ERROR"];

/** Distinct categories: the known ones first (fixed order), then the rest A-Z. */
export function orderCategories(entries: readonly DebugEntry[]): string[] {
  const present = new Set<string>();
  for (const e of entries) if (e.cat) present.add(e.cat);
  const known = KNOWN_ORDER.filter((c) => present.has(c));
  const rest = [...present].filter((c) => !KNOWN_ORDER.includes(c)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

export type CatTone = "danger" | "accent" | "muted" | "default";

export function catTone(cat: string): CatTone {
  switch (cat) {
    case "ERROR":
      return "danger";
    case "AGENT":
    case "LOCAL":
    case "CONV":
      return "accent";
    case "GATE":
    case "DEDUP":
      return "muted";
    default:
      return "default";
  }
}

/** Old-panel rule: ERROR rows and messages mentioning error/failed stand out. */
export function isErrorRow(e: DebugEntry): boolean {
  return e.cat === "ERROR" || /error|failed/i.test(e.msg || "");
}

/** Case-insensitive substring match over the given fields. */
export function matches(q: string, ...fields: Array<string | undefined>): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => (f || "").toLowerCase().includes(needle));
}

/** Stable-ish repeat() keys: the entry text plus an occurrence counter. */
export function keyed<T>(items: readonly T[], base: (item: T) => string): Array<{ key: string; item: T }> {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const b = base(item);
    const n = seen.get(b) ?? 0;
    seen.set(b, n + 1);
    return { key: n ? `${b}#${n}` : b, item };
  });
}

// ── shared card styles ───────────────────────────────────────────────────────

export const cardStyles = css`
  :host {
    display: block;
    min-width: 0;
  }
  .search {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .search::placeholder {
    color: var(--jv-text-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
  }
  .chip {
    appearance: none;
    min-height: 32px;
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-pill);
    background: var(--jv-surface);
    color: var(--jv-text-2);
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    transition: background-color var(--jv-ease);
  }
  .chip:hover {
    background: var(--jv-hover);
  }
  /* 32 px chip, 44 px hit box (DESIGN.md §3) */
  .chip {
    position: relative;
  }
  .chip::before {
    content: "";
    position: absolute;
    inset: calc((var(--jv-tap) - 100%) / -2) 0;
  }
  .chip[aria-pressed="true"] {
    background: var(--jv-accent-soft);
    border-color: var(--jv-accent);
    color: var(--jv-text);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: var(--jv-space-2);
    min-height: 28px;
    padding: var(--jv-space-1) var(--jv-space-4);
    border-left: 3px solid transparent;
    font-size: var(--jv-font-size-s);
    line-height: 1.45;
  }
  .row + .row {
    border-top: 1px solid var(--jv-divider);
  }
  .row.err {
    background: var(--jv-danger-soft);
    border-left-color: var(--jv-danger);
  }
  .row time {
    flex: none;
    color: var(--jv-text-2);
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }
  .row .msg {
    flex: 1 1 auto;
    min-width: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .day {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: var(--jv-space-1) var(--jv-space-4);
    background: var(--jv-surface-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .state {
    padding: var(--jv-space-4);
    color: var(--jv-text-2);
    text-align: center;
  }
  .banner {
    display: flex;
    align-items: flex-start;
    gap: var(--jv-space-2);
    margin: 0 var(--jv-space-4) var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    border-left: 4px solid var(--jv-danger);
    background: var(--jv-danger-soft);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  ha-alert {
    display: block;
    margin: 0 var(--jv-space-4) var(--jv-space-3);
  }
  .controls {
    display: grid;
    gap: var(--jv-space-3);
    padding: 0 var(--jv-space-4) var(--jv-space-3);
  }
  .sub {
    margin: 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  h3 {
    margin: var(--jv-space-4) 0 var(--jv-space-2);
    font-size: var(--jv-font-size-m);
    font-weight: var(--jv-font-weight-medium);
  }
  /* "RUN CHECK" (an existing i18n key) rendered in sentence case */
  .sentence {
    display: block;
    text-transform: lowercase;
  }
  .sentence::first-letter {
    text-transform: uppercase;
  }
`;
