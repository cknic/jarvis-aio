/**
 * Pure value helpers for the settings view: read a stored value tolerantly
 * (spec §3.3), write it with the JS type the catalogue kind demands (§3.1),
 * compare, format, search. No DOM, no Lit - unit-testable in isolation.
 */
import type { ConfigField, FieldOption } from "../../types";

export type Normalised =
  | { kind: "bool"; value: boolean; warning?: string }
  | { kind: "number"; value: number | null; warning?: string }
  | { kind: "enum"; value: string; inOptions: boolean; warning?: string }
  | { kind: "str"; value: string }
  | { kind: "list"; value: string[]; warning?: string }
  | { kind: "json"; value: unknown; text: string; warning?: string };

export function optionValue(o: FieldOption | string): string {
  return typeof o === "string" ? o : String(o.value);
}
export function optionLabel(o: FieldOption | string): string {
  return typeof o === "string" ? o : o.label || String(o.value);
}
export function optionValues(field: ConfigField): string[] {
  return (field.options ?? []).map(optionValue);
}

/**
 * HA's <ha-select> (mwc) floats its label only for a non-empty value, so an
 * option whose value is "" (e.g. "Auto", "— none —") draws the label over the
 * selected text. Selects hand it this stand-in instead and map it back.
 */
export const HA_SELECT_EMPTY = "__jv_empty__";
export function toHaSelectValue(v: string): string {
  return v === "" ? HA_SELECT_EMPTY : v;
}
export function fromHaSelectValue(v: string): string {
  return v === HA_SELECT_EMPTY ? "" : v;
}

export function rawText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function prettyJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2) ?? "";
  } catch {
    return String(v);
  }
}

/** Interpret a stored value for display; `warning` is an English t() key with {raw}. */
export function normalise(field: ConfigField, raw: unknown): Normalised {
  switch (field.kind) {
    case "bool":
      if (typeof raw === "boolean") return { kind: "bool", value: raw };
      if (raw === null || raw === undefined) return { kind: "bool", value: false };
      return { kind: "bool", value: false, warning: "Stored value is not a boolean: {raw}" };
    case "int":
    case "float":
      if (raw === null || raw === undefined || raw === "") return { kind: "number", value: null };
      if (typeof raw === "number" && Number.isFinite(raw)) return { kind: "number", value: raw };
      return { kind: "number", value: null, warning: "Stored value is not a number: {raw}" };
    case "enum": {
      const value = raw === null || raw === undefined ? "" : String(raw);
      const values = optionValues(field);
      if (values.includes(value)) return { kind: "enum", value, inOptions: true };
      if (value === "") {
        // nothing stored (or "" when "" is not an option): show the default,
        // else the first option, rather than a blank select - no warning
        const def = field.default === null || field.default === undefined ? "" : String(field.default);
        const shown = values.includes(def) ? def : values[0];
        return shown === undefined ? { kind: "enum", value, inOptions: false } : { kind: "enum", value: shown, inOptions: true };
      }
      return { kind: "enum", value, inOptions: false, warning: "Stored value is not an option: {raw}" };
    }
    case "list":
      if (Array.isArray(raw)) return { kind: "list", value: raw.map((x) => rawText(x)).filter((x) => x !== "") };
      if (raw === null || raw === undefined || raw === "") return { kind: "list", value: [] };
      return { kind: "list", value: [], warning: "Stored value is not a list: {raw}" };
    case "json":
      if (typeof raw === "string") {
        try {
          const parsed: unknown = JSON.parse(raw);
          return { kind: "json", value: parsed, text: prettyJson(parsed) };
        } catch {
          return { kind: "json", value: raw, text: raw, warning: "Invalid JSON stored" };
        }
      }
      if (raw === undefined) return { kind: "json", value: null, text: "" };
      return { kind: "json", value: raw, text: prettyJson(raw) };
    case "str":
    default:
      return { kind: "str", value: raw === null || raw === undefined ? "" : String(raw) };
  }
}

/**
 * For a `json` field whose catalogue default is a dict or a list, the value
 * must be the same container type (`satellite_pairings` is a dict,
 * `appliance_profile` a list, ...): the backend persists any JSON it is sent
 * and its consumers iterate the stored value. Returns an English t() key, or
 * "" when the shape is acceptable (keys whose default is null take anything).
 */
export function jsonShapeError(field: ConfigField, parsed: unknown): string {
  if (field.kind !== "json") return "";
  const d = field.default;
  if (Array.isArray(d)) return Array.isArray(parsed) ? "" : "Expected a JSON list";
  if (d !== null && typeof d === "object") {
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? "" : "Expected a JSON object";
  }
  return "";
}

/** One item per line; commas also split. Trimmed, non-empty, de-duplicated. */
export function parseListText(text: string): string[] {
  const out: string[] = [];
  for (const part of text.split(/[\n,]/)) {
    const s = part.trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}
export function listToText(items: string[]): string {
  return items.join("\n");
}

/** Round a number to the catalogue step/kind and clamp it into [min, max]. */
export function clampNumber(field: ConfigField, n: number): { value: number; clamped: boolean } {
  let v = field.kind === "int" ? Math.round(n) : n;
  let clamped = false;
  if (typeof field.min === "number" && v < field.min) {
    v = field.min;
    clamped = true;
  }
  if (typeof field.max === "number" && v > field.max) {
    v = field.max;
    clamped = true;
  }
  return { value: v, clamped };
}

/** The JS type the backend must receive for this kind (the only guard against type drift). */
export function coerceForSave(field: ConfigField, value: unknown): unknown {
  switch (field.kind) {
    case "bool":
      return value === true || value === "true" || value === 1;
    case "int": {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    case "float": {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "enum":
    case "str":
      return value === null || value === undefined ? "" : String(value);
    case "list":
      if (Array.isArray(value)) return value.map((x) => rawText(x)).filter((x) => x !== "");
      if (typeof value === "string") return parseListText(value);
      return [];
    case "json":
    default:
      return value === undefined ? null : value;
  }
}

function stable(v: unknown): string {
  if (v === undefined) return "null";
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + stable(o[k])).join(",") + "}";
  }
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  return JSON.stringify(v) ?? "null";
}
export function valueEquals(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

/** Short, never-undefined rendering of a value for the "Default: …" hint. */
export function formatValue(field: ConfigField, v: unknown, onText: string, offText: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (field.kind === "bool") return v === true ? onText : offText;
  if (Array.isArray(v)) return v.length ? v.map((x) => rawText(x)).join(", ") : "[]";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Case-insensitive substring match over key, label, help and option labels. */
export function matchesQuery(query: string, ...haystacks: Array<string | string[] | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  for (const h of haystacks) {
    if (!h) continue;
    const parts = Array.isArray(h) ? h : [h];
    for (const p of parts) if (p && p.toLowerCase().includes(q)) return true;
  }
  return false;
}
