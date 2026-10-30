/**
 * The Settings view's plug-in registry (see ./README.md).
 *
 *   registerFieldEditor(keyOrPredicate, factory, {consumes?, noReset?})
 *     - a bespoke control for one catalogue key, rendered by <jarvis-config-field>
 *       in place of the generic kind switch; may "consume" sibling keys whose
 *       generic rows are then not rendered.
 *   registerToolCard(category, {id, title, element, icon?, keywords?})
 *     - a self-contained custom element rendered at the top of that settings
 *       category (and found by the search box through its title / keywords);
 *       deep link /jarvis/settings/<category>/tool:<id>.
 *   SettingsHost
 *     - what the view hands to editors (ctx.host) and tool cards (.host): read
 *       the effective value of any key and write through the view's single save
 *       pipeline (confirm-before-enable, appliance reload, per-row status,
 *       queueing, debounced re-fetch, shell refresh).
 *
 * The registry is populated at module-evaluation time: a plug-in module calls
 * register*() at top level and is imported once from settings.ts. The one
 * built-in editor at the bottom of this file (list keys named *_entities /
 * *_domains / *_labels / *_areas -> <jv-picker>) doubles as the reference
 * implementation.
 */
import { html, type TemplateResult, nothing } from "lit";
import type { ConfigField, Hass, PanelData } from "../../types";
import type { WsError } from "../../ws";
import "../../components/jv-picker";
import type { PickerChangeDetail, PickerKind } from "../../components/jv-picker";

// ── host ────────────────────────────────────────────────────────────────────

export interface SaveResult {
  ok: boolean;
  /** set when the write failed; absent when the user declined a confirm dialog */
  error?: WsError;
}

export interface SettingsHost {
  /** Effective value (schema.values[key] ?? field.default); undefined when the key is not in the catalogue. */
  value(key: string): unknown;
  /** The catalogue entry for a key. */
  field(key: string): ConfigField | undefined;
  /**
   * Write one key through the view's pipeline (coerced to the key's kind).
   * Resolves {ok:false, error} instead of throwing; {ok:false} without error
   * when the user cancelled a confirm dialog.
   */
  save(key: string, value: unknown): Promise<SaveResult>;
  /** Save several keys in order; stops at the first failure. */
  saveMany(entries: Array<[string, unknown]>): Promise<SaveResult>;
  /** Re-fetch jarvis/config_schema soon (debounced, silent). */
  refetch(): void;
  /** Ask the shell to refresh the panel snapshot now. */
  refreshSnapshot(): void;
  /** Toast through HA (hass-notification). */
  toast(message: string): void;
}

// ── field editors ───────────────────────────────────────────────────────────

/** Everything the row knows that an editor may need besides field / value. */
export interface FieldEditorContext {
  hass?: Hass;
  data: PanelData | null;
  narrow: boolean;
  /** true while hass is missing (the view's offline banner is up) */
  disabled: boolean;
  /** the row's display label (use it for aria-label) */
  label: string;
  /** the id the row's <label for> points at; put it on your primary control */
  id: string;
  /** PLACEHOLDER[key] from presentation.ts, "" otherwise */
  placeholder: string;
  /** all config writes beyond the owner key go through here */
  host?: SettingsHost;
}

/**
 * Renders the control. `value` is already the catalogue kind's JS type
 * (list -> string[], json -> parsed value, bool -> boolean, int/float ->
 * number | null, str/enum -> string). Call `onChange(next)` with the same JS
 * type to save the OWNER key through the row (coerced, optimistic, status in
 * the row's slot); use `ctx.host.save()` for any other key.
 */
export type FieldEditorFactory = (
  field: ConfigField,
  value: unknown,
  onChange: (value: unknown) => void,
  ctx: FieldEditorContext,
) => TemplateResult | typeof nothing;

export type FieldEditorMatch = string | ((field: ConfigField) => boolean);

export interface FieldEditorOptions {
  /** sibling keys this editor edits too; their generic rows are not rendered */
  consumes?: string[];
  /** hide the row's "Reset to default" (the editor offers its own reset path) */
  noReset?: boolean;
}

export interface FieldEditor extends Required<FieldEditorOptions> {
  match: FieldEditorMatch;
  factory: FieldEditorFactory;
}

const _editors: FieldEditor[] = [];

/**
 * Register a field editor. An exact-key registration beats any predicate;
 * among several matches of the same kind the LAST registered wins, so a
 * plug-in registered after the built-ins overrides them. Returns an
 * unregister function.
 */
export function registerFieldEditor(match: FieldEditorMatch, factory: FieldEditorFactory, opts: FieldEditorOptions = {}): () => void {
  const editor: FieldEditor = { match, factory, consumes: [...(opts.consumes ?? [])], noReset: !!opts.noReset };
  _editors.push(editor);
  return () => {
    const i = _editors.indexOf(editor);
    if (i >= 0) _editors.splice(i, 1);
  };
}

function matches(e: FieldEditor, field: ConfigField): boolean {
  if (typeof e.match === "string") return e.match === field.key;
  try {
    return !!e.match(field);
  } catch {
    return false;
  }
}

/** The editor for a catalogue entry, if any (consulted by <jarvis-config-field> before its kind switch). */
export function findFieldEditor(field: ConfigField | undefined): FieldEditor | undefined {
  if (!field) return undefined;
  let predicateHit: FieldEditor | undefined;
  for (let i = _editors.length - 1; i >= 0; i--) {
    const e = _editors[i];
    if (!matches(e, field)) continue;
    if (typeof e.match === "string") return e;
    predicateHit ??= e;
  }
  return predicateHit;
}

/** The owner key whose editor consumes `key`, or undefined. */
export function consumedBy(key: string, fields: ConfigField[]): string | undefined {
  for (const f of fields) {
    if (f.key === key) continue;
    const e = findFieldEditor(f);
    if (e?.consumes.includes(key)) return f.key;
  }
  return undefined;
}

/** All keys consumed by some owner's editor in this catalogue. */
export function consumedKeys(fields: ConfigField[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of fields) {
    const e = findFieldEditor(f);
    if (e) for (const k of e.consumes) if (k !== f.key) out.set(k, f.key);
  }
  return out;
}

// ── tool cards ──────────────────────────────────────────────────────────────

export interface ToolCard {
  /** deep-link id: /jarvis/settings/<category>/tool:<id> (also the data-tool-id attribute) */
  id: string;
  /** English heading (a t() key); matched by the search box */
  title: string;
  /** the custom element tag name; the view renders <tag .hass .data .narrow .host .active ?flash> */
  element: string;
  /** optional mdi icon (informational; the card renders its own <jv-section icon>) */
  icon?: string;
  /** extra English words the search box matches (not translated) */
  keywords?: string[];
}

/** The properties the view sets on a tool card element. */
export interface ToolCardElement extends HTMLElement {
  hass?: Hass;
  data: PanelData | null;
  narrow: boolean;
  host?: SettingsHost;
  /** true while the card's category is the visible one (fetch on first true, not on connect) */
  active: boolean;
}

const _tools = new Map<string, ToolCard[]>();

/** Register a tool card for a settings category (core, voice, learning, safety, cameras, home, governance). */
export function registerToolCard(category: string, card: ToolCard): () => void {
  const list = _tools.get(category) ?? [];
  const existing = list.findIndex((c) => c.id === card.id);
  if (existing >= 0) list.splice(existing, 1, card);
  else list.push(card);
  _tools.set(category, list);
  return () => {
    const cur = _tools.get(category) ?? [];
    const i = cur.indexOf(card);
    if (i >= 0) cur.splice(i, 1);
  };
}

export function toolCardsFor(category: string): ToolCard[] {
  return _tools.get(category) ?? [];
}

export function findToolCard(category: string, id: string): ToolCard | undefined {
  return toolCardsFor(category).find((c) => c.id === id);
}

/** Case-insensitive match of a query against the card's (translated) title, id and keywords. */
export function toolCardMatches(card: ToolCard, query: string, translate: (s: string) => string = (s) => s): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const hay = [card.title, translate(card.title), card.id, ...(card.keywords ?? [])];
  return hay.some((s) => s.toLowerCase().includes(q));
}

// ── built-in: list keys of ids -> <jv-picker> ───────────────────────────────

const PICKER_SUFFIX = /_(entities|domains|labels|areas)$/;
const PICKER_KIND: Record<string, PickerKind> = { entities: "entity", domains: "domain", labels: "label", areas: "area" };
/** Include filters for entity keys whose candidates are a known subset (spec settings-tools.md §4.2). */
const ENTITY_DOMAINS: Record<string, string[]> = {
  pattern_include_entities: ["binary_sensor", "device_tracker", "person", "sensor"],
};

/** `kind: "list"` keys named *_entities / *_domains / *_labels / *_areas. */
export function isPickerListKey(field: ConfigField): boolean {
  return field.kind === "list" && PICKER_SUFFIX.test(field.key);
}

export const pickerListEditor: FieldEditorFactory = (field, value, onChange, ctx) => {
  const suffix = PICKER_SUFFIX.exec(field.key)?.[1] ?? "entities";
  const kind = PICKER_KIND[suffix] ?? "entity";
  const list = Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  const onPick = (e: CustomEvent<PickerChangeDetail>) => {
    e.stopPropagation();
    const v = e.detail?.value;
    onChange(Array.isArray(v) ? v : v ? [v] : []);
  };
  return html`
    <jv-picker
      id=${ctx.id}
      kind=${kind}
      multiple
      .hass=${ctx.hass}
      .data=${ctx.data}
      .value=${list}
      .label=${ctx.label}
      .placeholder=${ctx.placeholder}
      .domains=${ENTITY_DOMAINS[field.key]}
      ?allow-custom=${kind === "domain" || kind === "label"}
      ?disabled=${ctx.disabled}
      @value-changed=${onPick}
    ></jv-picker>
  `;
};

registerFieldEditor(isPickerListKey, pickerListEditor);
