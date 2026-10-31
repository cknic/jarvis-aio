/**
 * Shared bits of the Openings, Doors and Cameras & pins tabs (the "annex" of
 * the floor-plan editor): feature-detected form controls (ha-select /
 * ha-textfield with token-styled fallbacks, a native range), the icon helper,
 * the form CSS, opening labels / colours, the row <-> marker hover bridge and
 * a relative-time formatter. No DOM state of its own beyond the hover bridge.
 */
import { html, css, nothing, type TemplateResult } from "lit";
import { html as staticHtml, literal } from "lit/static-html.js";
import { live } from "lit/directives/live.js";
import { haDefined } from "../../../../ha";
import { t } from "../../../../i18n";
import type { Hass } from "../../../../types";
import { toHaSelectValue, fromHaSelectValue } from "../../../settings/coerce";
import type { Hit } from "../canvas";
import type { EditorStore } from "../store";
import { OPENING_PRESETS, WALLS, type Opening, type Wall } from "../model";

/** HA elements the annex tabs feature-detect (pass to watchDefinitions). */
export const HA_FORM_TAGS = ["ha-icon", "ha-select", "ha-list-item", "mwc-list-item", "ha-textfield"];

export interface SelectOption {
  value: string;
  label: string;
}

const stop = (e: Event): void => e.stopPropagation();

/** <ha-icon> when HA has it, else the text fallback (aria-hidden). */
export function icon(name: string, fallback: string): TemplateResult {
  return haDefined("ha-icon") ? html`<ha-icon icon=${name}></ha-icon>` : html`<span aria-hidden="true">${fallback}</span>`;
}

/** A labelled select: ha-select + ha-list-item / mwc-list-item, or a native <select>. `onChange` fires only for a different value. */
export function selectField(o: { id: string; label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; disabled?: boolean }): TemplateResult {
  // ha-select floats its label only over a non-empty value: "" ("— none —") travels as HA_SELECT_EMPTY
  const pick = (e: Event) => {
    const v = fromHaSelectValue(String((e.target as HTMLSelectElement | null)?.value ?? ""));
    if (v !== o.value) o.onChange(v);
  };
  const inOptions = o.options.some((x) => x.value === o.value);
  if (haDefined("ha-select")) {
    const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
    return html`
      <div class="field">
        <ha-select id=${o.id} .label=${o.label} .value=${live(toHaSelectValue(o.value))} ?disabled=${!!o.disabled} naturalMenuWidth fixedMenuPosition @selected=${pick} @closed=${stop}>
          ${inOptions ? nothing : staticHtml`<${item} .value=${toHaSelectValue(o.value)} disabled>${o.value}</${item}>`}
          ${o.options.map((x) => staticHtml`<${item} .value=${toHaSelectValue(x.value)}>${x.label}</${item}>`)}
        </ha-select>
      </div>
    `;
  }
  return html`
    <label class="field">
      <span class="lbl">${o.label}</span>
      <select id=${o.id} .value=${live(o.value)} ?disabled=${!!o.disabled} @change=${pick}>
        ${inOptions ? nothing : html`<option value=${o.value} disabled ?selected=${true}>${o.value}</option>`}
        ${o.options.map((x) => html`<option value=${x.value} ?selected=${x.value === o.value}>${x.label}</option>`)}
      </select>
    </label>
  `;
}

/** A labelled number input (ha-textfield or native). `onChange` receives the raw text on `change`. */
export function numberField(o: {
  id: string;
  label: string;
  value: string;
  min?: number;
  max?: number;
  step?: number | string;
  suffix?: string;
  onChange: (raw: string) => void;
  disabled?: boolean;
}): TemplateResult {
  const change = (e: Event) => o.onChange(String((e.target as HTMLInputElement | null)?.value ?? ""));
  if (haDefined("ha-textfield")) {
    return html`
      <div class="field">
        <ha-textfield id=${o.id} type="number" .label=${o.label} .value=${live(o.value)} .suffix=${o.suffix ?? ""} min=${o.min ?? nothing} max=${o.max ?? nothing} step=${o.step ?? nothing} ?disabled=${!!o.disabled} @change=${change}></ha-textfield>
      </div>
    `;
  }
  return html`
    <label class="field">
      <span class="lbl">${o.label}</span>
      <span class="num">
        <input id=${o.id} type="number" .value=${live(o.value)} min=${o.min ?? nothing} max=${o.max ?? nothing} step=${o.step ?? nothing} ?disabled=${!!o.disabled} @change=${change} />
        ${o.suffix ? html`<span class="suffix">${o.suffix}</span>` : nothing}
      </span>
    </label>
  `;
}

/** A labelled native range with its value shown as an <output>. `onInput` is for live previews, `onChange` commits. */
export function rangeField(o: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onInput?: (value: number) => void;
  onChange: (value: number) => void;
  disabled?: boolean;
}): TemplateResult {
  const read = (e: Event) => Number((e.target as HTMLInputElement | null)?.value ?? o.value);
  return html`
    <label class="field range">
      <span class="lbl"><span>${o.label}</span><output for=${o.id}>${o.display}</output></span>
      <input id=${o.id} type="range" .value=${live(String(o.value))} min=${o.min} max=${o.max} step=${o.step} ?disabled=${!!o.disabled} @input=${(e: Event) => o.onInput?.(read(e))} @change=${(e: Event) => o.onChange(read(e))} />
    </label>
  `;
}

/** Form / list CSS shared by the three tabs (tokens only). */
export const annexStyles = css`
  :host {
    display: block;
  }
  .help,
  .hint {
    margin: 0 0 var(--jv-space-3);
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  .hint {
    font-size: var(--jv-font-size-xs);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-3);
  }
  .toolbar .jv-btn {
    min-height: 36px;
    padding: 0 var(--jv-space-3);
    font-size: var(--jv-font-size-s);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-2);
  }
  .row {
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: var(--jv-space-2) var(--jv-space-3);
    background: var(--jv-surface);
    transition: border-color var(--jv-ease), background-color var(--jv-ease);
  }
  .row.is-glow {
    background: var(--jv-hover);
  }
  .row.is-selected {
    border-color: var(--jv-accent);
    box-shadow: inset 2px 0 0 var(--jv-accent);
  }
  .row-head {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .row-head .grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .row-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
    gap: var(--jv-space-2) var(--jv-space-3);
    margin-top: var(--jv-space-2);
  }
  .row-fields .wide {
    grid-column: 1 / -1;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    min-width: 0;
  }
  .lbl {
    display: flex;
    justify-content: space-between;
    gap: var(--jv-space-2);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
  }
  .lbl output {
    color: var(--jv-text);
    font-variant-numeric: tabular-nums;
  }
  select,
  input[type="number"],
  input[type="text"] {
    width: 100%;
    min-width: 0;
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-2);
    min-height: var(--jv-tap);
  }
  select:disabled,
  input:disabled {
    color: var(--jv-text-3);
  }
  .num {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
  }
  .num .suffix {
    flex: none;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  input[type="range"] {
    width: 100%;
    min-height: var(--jv-tap);
    margin: 0;
    accent-color: var(--jv-accent);
  }
  ha-select,
  ha-textfield {
    display: block;
    width: 100%;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 var(--jv-space-2);
    border-radius: var(--jv-radius-pill);
    border: var(--jv-border-width) solid var(--jv-border);
    background: var(--jv-neutral-soft);
    color: var(--jv-text);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    white-space: nowrap;
    cursor: pointer;
    font-family: inherit;
  }
  .tag[aria-pressed="true"] {
    border-color: var(--jv-accent);
    background: var(--jv-accent-soft);
  }
  .tag .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: var(--jv-space-1);
    background: var(--jv-neutral);
  }
  .pill {
    appearance: none;
    display: inline-flex;
    align-items: center;
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    min-height: 36px;
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-pill);
    background: var(--jv-surface);
    color: var(--jv-text);
    cursor: pointer;
  }
  .pill:hover {
    background: var(--jv-hover);
  }
  .pill[aria-pressed="true"] {
    background: var(--jv-accent-soft);
    border-color: var(--jv-accent);
  }
  .seg {
    display: inline-flex;
    gap: var(--jv-space-1);
    border: 0;
    padding: 0;
    margin: 0;
  }
  .err {
    margin: var(--jv-space-1) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-danger-text);
    overflow-wrap: anywhere;
  }
  .status {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    min-height: 1.4em;
  }
  .status.ok {
    color: var(--jv-ok-text);
  }
  .jv-icon-btn {
    width: 36px;
    height: 36px;
    flex: none;
  }
  .jv-icon-btn ha-icon {
    --mdc-icon-size: 20px;
  }
  /* narrow = touch: the full 44 px targets (DESIGN section 3); the per-row remove buttons sit side by side */
  :host([narrow]) .toolbar .jv-btn {
    min-height: var(--jv-tap);
  }
  :host([narrow]) .jv-icon-btn {
    width: var(--jv-tap);
    height: var(--jv-tap);
  }
  .empty {
    margin-top: var(--jv-space-2);
  }
`;

// ── openings: labels and colours ─────────────────────────────────────────────
/** The preset an opening was made from (type + kind, or slope for dormers). */
export function openingPreset(o: Pick<Opening, "type" | "kind" | "slope">) {
  return OPENING_PRESETS.find((p) => p.type === o.type && (o.type === "dormer" ? p.slope === (o.slope === "rear" ? "rear" : "front") : (p.kind ?? null) === (o.kind ?? null)));
}
/** English t() key of the opening's name ("Interior Door"), falling back to "<kind> <type>" for unknown kinds. */
export function openingLabel(o: Pick<Opening, "type" | "kind" | "slope">): string {
  const p = openingPreset(o);
  if (p) return p.label;
  return o.kind ? `${o.kind} ${o.type}` : o.type;
}
/** The `k-*` class that colours a marker / type badge. */
export function openingKindClass(o: Pick<Opening, "type" | "kind">): string {
  if (o.type === "dormer") return "dormer";
  if (o.type === "window") return o.kind === "interior" ? "interior" : "window";
  const k = o.kind ?? "exterior";
  return /^[a-z]+$/.test(k) ? k : "exterior";
}
export const WALL_LABELS: Readonly<Record<Wall, string>> = { front: "Front", back: "Back", left: "Left", right: "Right" };
export function wallOptions(): SelectOption[] {
  return WALLS.map((w) => ({ value: w, label: t(WALL_LABELS[w]) }));
}

// ── row <-> marker hover bridge ──────────────────────────────────────────────
// A tab row that is hovered / focused sets the glow id; the layer draws
// `.is-glow` on that marker. The layer reports the canvas hover back so the
// tab can highlight the matching row (the canvas's hover state is private).
let _glow: string | null = null;
let _canvasHover: string | null = null;
const _hoverListeners = new Set<() => void>();
let _queued = false;
function _notifyHover(): void {
  if (_queued) return;
  _queued = true;
  queueMicrotask(() => {
    _queued = false;
    for (const fn of _hoverListeners) {
      try {
        fn();
      } catch {
        /* a listener must never break the others */
      }
    }
  });
}
/** Highlight the marker of `id` (null clears); re-renders the canvas. */
export function setGlow(id: string | null, store?: EditorStore | null): void {
  if (_glow === id) return;
  _glow = id;
  store?.canvas?.requestRender();
}
export function glowId(): string | null {
  return _glow;
}
/** Called from a layer's render(): remembers the canvas hover and wakes the tabs when it changed. */
export function reportCanvasHover(hit: Hit | null): void {
  const raw = hit?.raw ?? null;
  if (raw === _canvasHover) return;
  _canvasHover = raw;
  _notifyHover();
}
/** The data-hit value under the pointer on the canvas, if any. */
export function canvasHover(): string | null {
  return _canvasHover;
}
export function onCanvasHover(fn: () => void): () => void {
  _hoverListeners.add(fn);
  return () => {
    _hoverListeners.delete(fn);
  };
}

// ── bring a list row into view without yanking the canvas away ──────────────
// Selecting on the canvas (tap, or the start of a drag) should reveal the
// matching row - but only when the tab sits BESIDE the canvas (wide layout):
// when the list is stacked below it, scrolling the page would move the canvas
// out from under the user's pointer. While a pointer is down the reveal waits
// for the release so a drag never scrolls the page.
let _pointerDown = false;
let _pendingReveal: (() => void) | null = null;
let _revealWired = false;
function _wireReveal(): void {
  if (_revealWired || typeof window === "undefined") return;
  _revealWired = true;
  const down = () => {
    _pointerDown = true;
  };
  const up = () => {
    _pointerDown = false;
    const run = _pendingReveal;
    _pendingReveal = null;
    run?.();
  };
  window.addEventListener("pointerdown", down, true);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", up, true);
}
export function revealRow(host: HTMLElement, row: HTMLElement | null, canvas: HTMLElement | null): void {
  if (!row) return;
  _wireReveal();
  const go = () => {
    if (!row.isConnected) return;
    if (canvas?.isConnected) {
      const a = canvas.getBoundingClientRect(), b = host.getBoundingClientRect();
      const beside = b.left >= a.right - 1 || b.right <= a.left + 1;
      if (!beside) return;
    }
    row.scrollIntoView?.({ block: "nearest" });
  };
  if (_pointerDown) _pendingReveal = go;
  else go();
}

// ── misc ─────────────────────────────────────────────────────────────────────
/** "3 days ago" for a unix timestamp (seconds or ms) in the user's language; "" when unknown. */
export function relativeTime(ts: number | undefined | null, hass?: Hass): string {
  if (!ts || !Number.isFinite(ts)) return "";
  const ms = ts > 1e12 ? ts : ts * 1000;
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return t("just now");
  const scale: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let value = Math.round(diff / 60_000);
  for (const [u, n] of scale) {
    if (abs >= n) {
      unit = u;
      value = Math.round(diff / n);
      break;
    }
  }
  try {
    const lang = hass?.locale?.language || hass?.language || "en";
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(value, unit);
  } catch {
    return "";
  }
}

/** Escape a value for use inside a quoted attribute selector. */
export function attrQuote(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Centre of the floor's enclosed rooms, or (100, 80) with no rooms (editor.md section 3.6). */
export function floorCentre(bb: { x0: number; y0: number; x1: number; y1: number } | null): [number, number] {
  if (!bb) return [100, 80];
  return [Math.round((bb.x0 + bb.x1) / 2), Math.round((bb.y0 + bb.y1) / 2)];
}
