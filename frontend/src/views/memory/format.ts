/**
 * Pure formatting helpers for the memory view. No DOM, no Lit, so they are
 * trivially testable and keep memory.ts about rendering.
 */
import { t } from "../../i18n";
import type { Fact, PersonRoutine } from "./types";

/** "sam_smith" -> "Sam Smith"; known subjects get their translated label. */
export function subjectLabel(subject: string): string {
  if (subject === "household") return t("Household");
  if (subject === "primary") return t("About me");
  return humanizeId(subject);
}

export function humanizeId(id: string): string {
  const words = String(id || "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || "?";
}

/** household first, then the rest alphabetically (old-panel order). */
export function groupFacts(facts: Fact[]): Array<[string, Fact[]]> {
  const groups = new Map<string, Fact[]>();
  for (const f of facts) {
    const subject = String(f.subject || "household");
    const list = groups.get(subject);
    if (list) list.push(f);
    else groups.set(subject, [f]);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === b) return 0;
    if (a === "household") return -1;
    if (b === "household") return 1;
    return a.localeCompare(b);
  });
}

/** person keys alphabetically, items by confidence desc. */
export function groupRoutines(routines: Record<string, PersonRoutine[]>): Array<[string, PersonRoutine[]]> {
  return Object.keys(routines)
    .filter((k) => Array.isArray(routines[k]) && routines[k].length > 0)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => [k, [...routines[k]].sort((a, b) => num(b.confidence) - num(a.confidence))]);
}

export function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function pct(confidence: unknown): number {
  return Math.max(0, Math.min(100, Math.round(num(confidence) * 100)));
}

/** The old panel's hedge rule: anything not user-stated or under 90 % sure. */
export function isHedged(f: Fact): boolean {
  return f.source !== "stated" || num(f.confidence) < 0.9;
}

/** `${source} · ${pct}% sure` */
export function hedgeTitle(f: Fact): string {
  const src = f.source ? t(String(f.source)) : t("inferred");
  return `${src} · ${pct(f.confidence)}% ${t("sure")}`;
}

/** epoch seconds -> localized date/time, "" when missing/invalid. */
export function epochToLocale(sec: number | null | undefined, locale?: string): string {
  if (sec === null || sec === undefined) return "";
  const n = num(sec);
  if (!n) return "";
  return safeLocale(new Date(n * 1000), locale);
}

/**
 * Briefing timestamps are naive ISO in UTC without "Z"; append it unless the
 * string already carries a zone. Returns "" for null/unparseable input.
 */
export function isoUtcToLocale(ts: string | null | undefined, locale?: string): string {
  if (!ts) return "";
  const s = String(ts).trim();
  if (!s) return "";
  const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const d = new Date(zoned ? s : `${s}Z`);
  if (Number.isNaN(d.getTime())) return "";
  return safeLocale(d, locale);
}

function safeLocale(d: Date, locale?: string): string {
  try {
    return d.toLocaleString(locale || undefined);
  } catch {
    return d.toLocaleString();
  }
}

/** The "× n" occurrence marker; "?" for a falsy count like the old panel. */
export function occurrencesLabel(n: unknown): string {
  const v = num(n);
  return v ? `×${v}` : "×?";
}

/** The error text of a rejected hass.callWS (a {code,message} object or an Error). */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as { message?: unknown; code?: unknown };
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.code === "string" && o.code) return o.code;
  }
  return err ? String(err) : "";
}
