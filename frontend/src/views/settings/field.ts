/**
 * <jarvis-config-field .field .value .label .help .status ...>
 *
 * One generic settings row chosen by `field.kind` (spec §3): bool -> ha-switch,
 * enum -> ha-select, int/float -> ha-textfield type=number, str -> ha-textfield
 * (native <input list> when suggestions exist), list/json -> textarea with a
 * Save button. Every HA element is feature-detected with a token-styled native
 * fallback. The row never saves itself: it emits
 *   "field-change" {key, value}   value already in the kind's JS type
 *   "field-reset"  {key}          "Reset to default" pressed
 * and shows whatever `status` the owner passes back (saving / saved / error / warn).
 *
 * Before the kind switch the row asks the plug-in registry (./registry.ts)
 * for a field editor; when one matches, its template replaces the control
 * (label, key, help, hint, default / reset and the status slot stay). The
 * editor's `onChange` goes through the same "field-change" event, so the
 * owner's save pipeline is unchanged; `statuses` carries the status of keys
 * the editor consumes besides `status` (owner first), joined in the slot.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { html as staticHtml, literal } from "lit/static-html.js";
import type { ConfigField, FieldOption, Hass, PanelData } from "../../types";
import { findFieldEditor, type FieldEditorContext, type SettingsHost } from "./registry";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { haDefined, watchDefinitions } from "../../ha";
import "../../components";
import {
  normalise, optionLabel, optionValue, parseListText, listToText, clampNumber,
  coerceForSave, valueEquals, formatValue, prettyJson, rawText, jsonShapeError,
  toHaSelectValue, fromHaSelectValue,
} from "./coerce";
import { enumLabel, type Suggestion } from "./presentation";

export type StatusLevel = "saving" | "saved" | "error" | "warn";
export interface FieldStatus {
  level: StatusLevel;
  message: string;
}
export interface FieldChangeDetail {
  key: string;
  value: unknown;
}

const HA_TAGS = ["ha-switch", "ha-select", "ha-list-item", "mwc-list-item", "ha-textfield", "ha-textarea", "ha-icon"];
const MAX_CHIPS = 30;

@customElement("jarvis-config-field")
export class JarvisConfigField extends LitElement {
  @property({ attribute: false }) field!: ConfigField;
  @property({ attribute: false }) value: unknown = undefined;
  @property({ type: String }) label = "";
  @property({ type: String }) help = "";
  @property({ type: String }) hint = "";
  @property({ type: String }) placeholder = "";
  @property({ attribute: false }) suggest?: () => Suggestion[];
  @property({ attribute: false }) status: FieldStatus | null = null;
  /** statuses of keys a field editor consumes besides the owner (shown joined with " · ") */
  @property({ attribute: false }) statuses: FieldStatus[] = [];
  /** for field editors (./registry.ts): live HA, the snapshot and the write host */
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ attribute: false }) host?: SettingsHost;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, attribute: "show-key" }) showKey = true;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: Boolean, reflect: true }) flash = false;

  @state() private _draft = "";
  @state() private _dirty = false;
  @state() private _jsonError = "";
  @state() private _note: FieldStatus | null = null;
  @state() private _suggestions: Suggestion[] | null = null;
  /** an editor's last emitted value, shown until the owner's value changes or the save fails */
  @state() private _optimistic: { value: unknown } | null = null;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        padding: var(--jv-space-3) 0;
        border-radius: var(--jv-radius-sm);
        transition: background-color var(--jv-ease);
      }
      :host([flash]) {
        background: var(--jv-accent-soft);
        box-shadow: 0 0 0 var(--jv-space-2) var(--jv-accent-soft);
      }
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
      }
      .labels {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
      }
      .label {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .key {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .help {
        margin: var(--jv-space-1) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
        white-space: pre-line;
      }
      .control {
        margin-top: var(--jv-space-2);
        max-width: 440px;
      }
      :host([narrow]) .control {
        max-width: none;
      }
      .control.wide {
        max-width: none;
      }
      .inline {
        flex: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-space-5);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      ha-textfield,
      ha-select,
      ha-textarea,
      input:not([type="checkbox"]),
      select,
      textarea {
        width: 100%;
        display: block;
      }
      input:not([type="checkbox"]),
      select,
      textarea {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      textarea {
        padding: var(--jv-space-2) var(--jv-space-3);
        min-height: 120px;
        resize: vertical;
        line-height: var(--jv-line-height);
      }
      textarea.jv-mono,
      ha-textarea.jv-mono {
        --mdc-typography-subtitle1-font-family: var(--jv-font-code);
      }
      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin-top: var(--jv-space-1);
        min-height: 20px;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .status {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .status.saved {
        color: var(--jv-ok-text);
      }
      .status.error {
        color: var(--jv-danger-text);
      }
      .status.warn {
        color: var(--jv-warn-text);
      }
      .save-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--jv-space-3);
        margin-top: var(--jv-space-2);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        margin-top: var(--jv-space-2);
      }
      /* 32 px chip; .jv-hit gives it the 44 px hit box, so the chip itself
         must not clip (the label span truncates instead) */
      .chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        font: inherit;
        font-size: var(--jv-font-size-s);
        min-height: 32px;
        padding: 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        cursor: pointer;
        max-width: 100%;
        min-width: 0;
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .reset {
        appearance: none;
        font: inherit;
        font-size: var(--jv-font-size-s);
        background: transparent;
        border: 0;
        color: var(--jv-accent-text);
        cursor: pointer;
        padding: var(--jv-space-1) 0;
        min-height: 28px;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    // mwc's <ha-select> does not re-run its label / selected-text layout when
    // the value or its items change underneath it; nudge it once they settle.
    if (this.field?.kind !== "enum" || !(changed.has("value") || changed.has("field"))) return;
    type MwcSelect = HTMLElement & { updateComplete?: Promise<unknown>; layout?: () => unknown; layoutOptions?: () => unknown };
    const sel = this.renderRoot.querySelector("ha-select") as MwcSelect | null;
    if (!sel || (typeof sel.layout !== "function" && typeof sel.layoutOptions !== "function")) return;
    // layout() = layoutOptions() (re-pick the item for .value) + label float / notch
    void Promise.resolve(sel.updateComplete).then(() => (typeof sel.layout === "function" ? sel.layout() : sel.layoutOptions?.())).catch(() => undefined);
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!this.field) return;
    if (changed.has("value") || changed.has("field")) this._optimistic = null;
    if (changed.has("status") && this.status?.level === "error") this._optimistic = null;
    if (changed.has("value") || changed.has("field")) {
      const kind = this.field.kind;
      if (kind === "list") {
        const n = normalise(this.field, this.value);
        const items = n.kind === "list" ? n.value : [];
        if (!this._dirty || valueEquals(parseListText(this._draft), items)) {
          this._draft = listToText(items);
          this._dirty = false;
        }
      } else if (kind === "json") {
        const n = normalise(this.field, this.value);
        const text = n.kind === "json" ? n.text : "";
        let same = false;
        if (this._dirty) {
          try {
            same = valueEquals(JSON.parse(this._draft), n.kind === "json" ? n.value : null);
          } catch {
            same = false;
          }
        }
        if (!this._dirty || same) {
          this._draft = text;
          this._dirty = false;
          this._jsonError = "";
        }
      }
    }
  }

  private get _id(): string {
    return `f-${this.field.key}`;
  }

  private _emit(value: unknown): void {
    this._note = null;
    const detail: FieldChangeDetail = { key: this.field.key, value: coerceForSave(this.field, value) };
    this.dispatchEvent(new CustomEvent<FieldChangeDetail>("field-change", { detail }));
  }

  private _ensureSuggestions(): void {
    if (this._suggestions === null && this.suggest) {
      try {
        this._suggestions = this.suggest();
      } catch {
        this._suggestions = [];
      }
    }
  }

  // ── bool ──────────────────────────────────────────────────────────────
  private _onToggle(e: Event): void {
    const el = e.target as HTMLInputElement & { checked?: boolean };
    this._emit(!!el.checked);
  }

  private _renderSwitch(checked: boolean) {
    const label = this.label || this.field.key;
    return html`
      <span class="inline">
        <span aria-hidden="true">${checked ? t("ON") : t("OFF")}</span>
        ${haDefined("ha-switch")
          ? html`<ha-switch id=${this._id} .checked=${live(checked)} ?disabled=${this.disabled} aria-label=${label} @change=${this._onToggle}></ha-switch>`
          : html`<input id=${this._id} type="checkbox" role="switch" .checked=${live(checked)} ?disabled=${this.disabled} aria-label=${label} @change=${this._onToggle} />`}
      </span>
    `;
  }

  // ── enum ──────────────────────────────────────────────────────────────
  private _onSelect(e: Event): void {
    const el = e.target as HTMLSelectElement & { value?: string };
    const next = fromHaSelectValue(String(el.value ?? ""));
    const current = normalise(this.field, this.value);
    if (current.kind === "enum" && next !== current.value) this._emit(next);
  }

  private _renderEnum(current: string, inOptions: boolean) {
    const opts = this.field.options ?? [];
    const label = this.label || this.field.key;
    if (haDefined("ha-select")) {
      const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
      return html`
        <ha-select
          id=${this._id}
          .label=${label}
          .value=${live(toHaSelectValue(current))}
          ?disabled=${this.disabled}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onSelect}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          ${inOptions ? nothing : staticHtml`<${item} .value=${toHaSelectValue(current)} disabled>${t("{raw} (not an option)", { raw: current || "∅" })}</${item}>`}
          ${opts.map((o) => staticHtml`<${item} .value=${toHaSelectValue(optionValue(o))}>${this._optionText(o)}</${item}>`)}
        </ha-select>
      `;
    }
    return html`
      <select id=${this._id} .value=${live(current)} ?disabled=${this.disabled} aria-label=${label} @change=${this._onSelect}>
        ${inOptions ? nothing : html`<option value=${current} disabled>${t("{raw} (not an option)", { raw: current || "∅" })}</option>`}
        ${opts.map((o) => html`<option value=${optionValue(o)}>${this._optionText(o)}</option>`)}
      </select>
    `;
  }

  private _optionText(o: FieldOption | string): string {
    const v = optionValue(o);
    const own = typeof o === "string" ? "" : optionLabel(o);
    return t(own && own !== v ? own : enumLabel(this.field.key, v));
  }

  // ── numbers ───────────────────────────────────────────────────────────
  private _onNumber(e: Event): void {
    this._note = null;
    const el = e.target as HTMLInputElement;
    const raw = String(el.value ?? "").trim();
    const current = normalise(this.field, this.value);
    const cur = current.kind === "number" ? current.value : null;
    if (raw === "") {
      if (cur !== null) this._emit(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      this.requestUpdate();
      return;
    }
    const { value, clamped } = clampNumber(this.field, n);
    if (clamped) {
      this._note = { level: "warn", message: t("Clamped to {min}–{max}", { min: String(this.field.min ?? "−∞"), max: String(this.field.max ?? "∞") }) };
    }
    if (value !== cur) {
      const detail: FieldChangeDetail = { key: this.field.key, value: coerceForSave(this.field, value) };
      this.dispatchEvent(new CustomEvent<FieldChangeDetail>("field-change", { detail }));
    } else {
      this.requestUpdate();
    }
  }

  private _renderNumber(value: number | null) {
    const f = this.field;
    const text = value === null ? "" : String(value);
    const step = f.step ?? (f.kind === "int" ? 1 : "any");
    const placeholder = f.default === null || f.default === undefined ? "" : String(f.default);
    const label = this.label || f.key;
    if (haDefined("ha-textfield")) {
      return html`<ha-textfield id=${this._id} type="number" .label=${label} .value=${live(text)} .placeholder=${placeholder}
        min=${f.min ?? nothing} max=${f.max ?? nothing} step=${step} ?disabled=${this.disabled} @change=${this._onNumber}></ha-textfield>`;
    }
    return html`<input id=${this._id} type="number" .value=${live(text)} placeholder=${placeholder} aria-label=${label}
      min=${f.min ?? nothing} max=${f.max ?? nothing} step=${step} ?disabled=${this.disabled} @change=${this._onNumber} />`;
  }

  // ── str ───────────────────────────────────────────────────────────────
  private _onText(e: Event): void {
    const el = e.target as HTMLInputElement;
    const next = String(el.value ?? "").trim();
    const current = normalise(this.field, this.value);
    if (current.kind === "str" && next !== current.value) this._emit(next);
    else this.requestUpdate();
  }

  private _renderText(value: string) {
    const f = this.field;
    const type = /_url$/.test(f.key) ? "url" : "text";
    const placeholder = this.placeholder || (/_time$/.test(f.key) || /^observer_quiet_(start|end)$/.test(f.key) ? "HH:MM" : "");
    const label = this.label || f.key;
    if (this.suggest) {
      const listId = `${this._id}-list`;
      return html`
        <input id=${this._id} type=${type} .value=${live(value)} placeholder=${placeholder} aria-label=${label} list=${listId}
          autocomplete="off" ?disabled=${this.disabled} @focus=${this._ensureSuggestions} @change=${this._onText} />
        <datalist id=${listId}>
          ${(this._suggestions ?? []).map((s) => html`<option value=${s.value}>${s.label}</option>`)}
        </datalist>
      `;
    }
    if (haDefined("ha-textfield")) {
      return html`<ha-textfield id=${this._id} type=${type} .label=${label} .value=${live(value)} .placeholder=${placeholder}
        ?disabled=${this.disabled} @change=${this._onText}></ha-textfield>`;
    }
    return html`<input id=${this._id} type=${type} .value=${live(value)} placeholder=${placeholder} aria-label=${label}
      ?disabled=${this.disabled} @change=${this._onText} />`;
  }

  // ── list / json ───────────────────────────────────────────────────────
  private _onDraft(e: Event): void {
    const el = e.target as HTMLTextAreaElement;
    this._draft = String(el.value ?? "");
    this._note = null;
    const n = normalise(this.field, this.value);
    if (this.field.kind === "json") {
      try {
        const parsed: unknown = JSON.parse(this._draft);
        const shape = jsonShapeError(this.field, parsed);
        this._jsonError = shape ? t(shape) : "";
        this._dirty = !valueEquals(parsed, n.kind === "json" ? n.value : null);
      } catch (err) {
        this._jsonError = err instanceof Error ? err.message : String(err);
        this._dirty = true;
      }
    } else {
      this._dirty = !valueEquals(parseListText(this._draft), n.kind === "list" ? n.value : []);
    }
  }

  private _saveDraft(): void {
    if (this.field.kind === "json") {
      try {
        const parsed: unknown = JSON.parse(this._draft);
        // A dict/list key must stay a dict/list: the backend stores whatever
        // JSON it gets and its consumers iterate the value.
        const shape = jsonShapeError(this.field, parsed);
        if (shape) {
          this._jsonError = t(shape);
          return;
        }
        this._emit(parsed);
      } catch (err) {
        this._jsonError = err instanceof Error ? err.message : String(err);
      }
    } else {
      this._emit(parseListText(this._draft));
    }
  }

  private _addChip(value: string): void {
    const lines = this._draft.split("\n");
    const last = lines[lines.length - 1]?.trim() ?? "";
    const items = parseListText(this._draft);
    if (last && !items.includes(last)) lines.pop(); // the partial filter line
    else if (last === "" ) lines.pop();
    const text = [...lines.filter((l) => l.trim() !== ""), value].join("\n");
    this._draft = text;
    const n = normalise(this.field, this.value);
    this._dirty = !valueEquals(parseListText(text), n.kind === "list" ? n.value : []);
    this.renderRoot.querySelector<HTMLElement>("textarea, ha-textarea")?.focus();
  }

  private _renderChips() {
    if (!this.suggest || this._suggestions === null) return nothing;
    const items = new Set(parseListText(this._draft));
    const lines = this._draft.split("\n");
    const last = (lines[lines.length - 1] ?? "").trim().toLowerCase();
    const filter = last && !items.has(lines[lines.length - 1].trim()) ? last : "";
    const pool = this._suggestions.filter(
      (s) => !items.has(s.value) && (!filter || s.value.toLowerCase().includes(filter) || s.label.toLowerCase().includes(filter)),
    );
    if (!pool.length) return nothing;
    const shown = pool.slice(0, MAX_CHIPS);
    return html`
      <div class="chips" role="group" aria-label=${t("Suggestions")}>
        ${shown.map((s) => html`<button type="button" class="chip jv-hit" title=${s.value} ?disabled=${this.disabled} @click=${() => this._addChip(s.value)}><span class="jv-truncate">${s.label}</span></button>`)}
        ${pool.length > shown.length ? html`<span class="jv-muted">${t("{count} more — type to filter", { count: pool.length - shown.length })}</span>` : nothing}
      </div>
    `;
  }

  private _renderTextarea(mono: boolean) {
    const label = this.label || this.field.key;
    const rows = this.narrow ? 6 : 5;
    const invalid = !!this._jsonError;
    const ta = haDefined("ha-textarea")
      ? html`<ha-textarea id=${this._id} class=${mono ? "jv-mono" : ""} .label=${label} .value=${live(this._draft)} rows=${rows} autogrow
          ?disabled=${this.disabled} .helper=${this.field.kind === "list" ? t("One item per line") : ""} helperPersistent
          @input=${this._onDraft} @focus=${this._ensureSuggestions}></ha-textarea>`
      : html`<textarea id=${this._id} class=${mono ? "jv-mono" : ""} .value=${live(this._draft)} rows=${rows} aria-label=${label}
          aria-invalid=${invalid ? "true" : "false"} placeholder=${this.field.kind === "list" ? t("One item per line") : ""}
          ?disabled=${this.disabled} @input=${this._onDraft} @focus=${this._ensureSuggestions}></textarea>`;
    const count = this.field.kind === "list" ? parseListText(this._draft).length : 0;
    return html`
      <div class="control wide">
        ${ta}
        ${this.field.kind === "list" ? this._renderChips() : nothing}
        <div class="save-row">
          ${invalid ? html`<span class="status error" role="alert">${t("Invalid JSON: {message}", { message: this._jsonError })}</span>` : nothing}
          ${this.field.kind === "list" && this._dirty ? html`<span class="jv-muted">${t("{count} items", { count })}</span>` : nothing}
          <button type="button" class="jv-btn primary" ?disabled=${this.disabled || !this._dirty || invalid} @click=${this._saveDraft}>${t("Save")}</button>
        </div>
      </div>
    `;
  }

  // ── field editor (plug-in) ────────────────────────────────────────────
  private _onEditorChange(value: unknown): void {
    this._optimistic = { value };
    this._emit(value);
  }

  private _editorContext(label: string): FieldEditorContext {
    return {
      hass: this.hass,
      data: this.data,
      narrow: this.narrow,
      disabled: this.disabled,
      label,
      id: this._id,
      placeholder: this.placeholder,
      host: this.host,
    };
  }

  /** The owner's status plus the consumed keys', most severe level, messages joined. */
  private _combinedStatus(): FieldStatus | null {
    const all = [this.status, ...(this.statuses ?? [])].filter((s): s is FieldStatus => !!s);
    if (!all.length) return null;
    if (all.length === 1) return all[0];
    const rank: Record<StatusLevel, number> = { error: 3, warn: 2, saving: 1, saved: 0 };
    const level = all.reduce((acc, s) => (rank[s.level] > rank[acc] ? s.level : acc), all[0].level);
    const seen = new Set<string>();
    const message = all.map((s) => s.message).filter((m) => m && !seen.has(m) && seen.add(m)).join(" · ");
    return { level, message };
  }

  // ── row ───────────────────────────────────────────────────────────────
  override render() {
    const f = this.field;
    if (!f) return nothing;
    const n = normalise(f, this.value);
    const warning = "warning" in n && n.warning ? t(n.warning, { raw: rawText(this.value) }) : "";
    const isDefault = valueEquals(this.value === undefined ? f.default : this.value, f.default);
    const combined = this._combinedStatus();
    const status = combined && this._note && combined.level !== "error"
      ? { level: this._note.level, message: `${combined.message} · ${this._note.message}` }
      : combined ?? this._note;
    const showStatus = status ? status : warning ? { level: "warn" as StatusLevel, message: warning } : null;
    const label = this.label || f.label || f.key;
    const editor = findFieldEditor(f);
    const inlineControl = !editor && n.kind === "bool";

    let control: unknown;
    if (editor) {
      const value = this._optimistic ? this._optimistic.value : n.value;
      control = html`<div class="control wide">${editor.factory(f, value, (v) => this._onEditorChange(v), this._editorContext(label))}</div>`;
    } else switch (n.kind) {
      case "bool":
        control = this._renderSwitch(n.value);
        break;
      case "enum":
        control = this._renderEnum(n.value, n.inOptions);
        break;
      case "number":
        control = this._renderNumber(n.value);
        break;
      case "str":
        control = this._renderText(n.value);
        break;
      case "list":
        control = this._renderTextarea(false);
        break;
      case "json":
        control = this._renderTextarea(true);
        break;
    }

    return html`
      <div class="head">
        <div class="labels">
          <label class="label" for=${this._id}>${label}</label>
          ${f.expose ? html`<jv-state-badge level="info" nodot .label=${t("HA entity")}></jv-state-badge>` : nothing}
          ${this.showKey ? html`<code class="key jv-mono">${f.key}</code>` : nothing}
        </div>
        ${inlineControl ? control : nothing}
      </div>
      ${this.help ? html`<p class="help">${this.help}</p>` : nothing}
      ${this.hint ? html`<p class="help jv-mono">${this.hint}</p>` : nothing}
      ${editor || inlineControl || n.kind === "list" || n.kind === "json" ? (inlineControl ? nothing : control) : html`<div class="control">${control}</div>`}
      <div class="foot">
        ${isDefault || editor?.noReset
          ? nothing
          : html`
              <span>${t("Default: {value}", { value: formatValue(f, f.default, t("ON"), t("OFF")) })}</span>
              <button type="button" class="reset jv-hit" ?disabled=${this.disabled}
                @click=${() => this.dispatchEvent(new CustomEvent("field-reset", { detail: { key: f.key } }))}>${t("Reset to default")}</button>
            `}
        <span class="status ${showStatus?.level ?? ""}" role="status" aria-live="polite">${showStatus?.message ?? ""}</span>
      </div>
    `;
  }

  /** Re-pretty-print after a successful json save (owner may call). */
  resetDraft(): void {
    const n = normalise(this.field, this.value);
    this._dirty = false;
    this._jsonError = "";
    this._draft = n.kind === "json" ? n.text : n.kind === "list" ? listToText(n.value) : "";
  }
}

export { prettyJson };

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-config-field": JarvisConfigField;
  }
}
