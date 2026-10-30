/**
 * <jarvis-editor-voice-confirm> - field editor for `voice_confirm_entities`
 * (frontend/specs/settings-tools.md §4.2, `options.allowExempt`).
 *
 * One row per stored entry with a Require / Exempt segmented toggle: Require
 * stores the bare entity id (always ask before acting on it), Exempt stores
 * "!" + id (never ask, even for a normally sensitive action). The row shows
 * the bare id and an "exempt" badge. Adding from the picker below stores the
 * bare id; the picker only offers real entity ids, never "!"-prefixed ones.
 * Every change saves the whole array through the row's onChange; the other
 * entries round-trip unchanged (§9 R9). Ids HA no longer knows are kept and
 * tagged "not found".
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { registerFieldEditor } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { watchDefinitions } from "../../../ha";
import { keepRowFocus, type RowFocus } from "../../../focus";
import type { Hass, PanelData } from "../../../types";
import "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail } from "../../../components/jv-picker";
import { CONTROL_TAGS, controlStyles, friendlyName } from "./lists-controls";

const EXEMPT = "!";
/** A row's × hands keyboard focus to the next / previous row's ×, else the add picker. */
const REMOVE_FOCUS: RowFocus = { row: ".rows > li", key: "data-key", control: ".x", fallback: ["jv-picker"] };

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : [];
}

function bareId(v: string): string {
  return v.startsWith(EXEMPT) ? v.slice(EXEMPT.length) : v;
}

@customElement("jarvis-editor-voice-confirm")
export class JarvisEditorVoiceConfirm extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  /** the stored array (bare ids and "!"-prefixed exemptions) */
  @property({ attribute: false }) value: string[] = [];
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";
  @property({ type: String }) placeholder = "";
  @property({ attribute: false }) onChange?: (next: string[]) => void;

  /** bumped after each add so the (single) add picker remounts empty */
  @state() private _addKey = 0;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .rows {
        margin-bottom: var(--jv-space-2);
      }
      .rows > li.missing {
        border-left: 3px dashed var(--jv-warn);
      }
      :host([narrow]) .rows > li {
        flex-wrap: wrap;
      }
      :host([narrow]) .rows .ctl {
        width: 100%;
        justify-content: space-between;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        overflow: visible;
      }
      .seg button {
        appearance: none;
        position: relative;
        min-height: 32px;
        min-width: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-pill);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .seg button[aria-pressed="true"] {
        background: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .seg button:disabled {
        cursor: default;
        opacity: 0.6;
      }
      .x {
        appearance: none;
        flex: none;
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-l);
        line-height: 1;
        cursor: pointer;
      }
      .x:hover {
        background: var(--jv-hover);
        color: var(--jv-text);
      }
      .x:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  private _commit(next: string[]): void {
    if (this.disabled || !this.onChange) return;
    const cur = this.value;
    if (next.length === cur.length && next.every((x, i) => x === cur[i])) return;
    this.onChange(next);
  }

  private _setExempt(index: number, exempt: boolean): void {
    const cur = this.value;
    const entry = cur[index];
    if (entry === undefined) return;
    const id = bareId(entry);
    const want = exempt ? EXEMPT + id : id;
    if (want === entry) return;
    // keep the position; drop any other entry for the same id so it cannot be both
    this._commit(cur.map((x, i) => (i === index ? want : x)).filter((x, i) => i === index || bareId(x) !== id));
  }

  private _remove(index: number): void {
    this._commit(this.value.filter((_, i) => i !== index));
  }

  private _onAdd(e: CustomEvent<PickerChangeDetail>): void {
    e.stopPropagation();
    const raw = e.detail?.value;
    const id = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    this._addKey++;
    if (!id || id.startsWith(EXEMPT)) return;
    if (this.value.some((x) => bareId(x) === id)) return; // already listed (required or exempt)
    this._commit([...this.value, id]);
  }

  private _renderRow(entry: string, index: number) {
    const exempt = entry.startsWith(EXEMPT);
    const id = bareId(entry);
    const name = friendlyName(this.hass, id);
    const missing = !!this.hass?.states && !this.hass.states[id];
    const off = this.disabled;
    return html`
      <li class=${missing ? "missing" : ""} title=${entry} data-key=${entry}>
        <span class="text">
          <span class="name">${name}</span>
          ${name !== id ? html`<span class="sec jv-mono">${id}</span>` : nothing}
          ${exempt || missing
            ? html`<span class="badges">
                ${exempt ? html`<jv-state-badge level="neutral" nodot .label=${t("exempt")}></jv-state-badge>` : nothing}
                ${missing ? html`<jv-state-badge level="warn" nodot .label=${t("not found")}></jv-state-badge>` : nothing}
              </span>`
            : nothing}
        </span>
        <span class="ctl">
          <span class="seg" role="group" aria-label=${name}>
            <button type="button" class="jv-hit" aria-pressed=${exempt ? "false" : "true"} ?disabled=${off} @click=${() => this._setExempt(index, false)}>${t("Require")}</button>
            <button type="button" class="jv-hit" aria-pressed=${exempt ? "true" : "false"} ?disabled=${off} @click=${() => this._setExempt(index, true)}>${t("Exempt")}</button>
          </span>
          <button type="button" class="x" aria-label=${t("Remove {name}", { name })} ?disabled=${off} @click=${(e: Event) => keepRowFocus(e, this, REMOVE_FOCUS, () => this._remove(index))}>×</button>
        </span>
      </li>
    `;
  }

  override render() {
    const list = this.value;
    return html`
      ${list.length ? html`<ul class="rows" aria-label=${this.label}>${list.map((v, i) => this._renderRow(v, i))}</ul>` : nothing}
      ${keyed(
        this._addKey,
        html`<jv-picker
          id=${this.controlId || nothing}
          kind="entity"
          .hass=${this.hass}
          .data=${this.data}
          .value=${""}
          .label=${this.label}
          .placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          @value-changed=${this._onAdd}
        ></jv-picker>`,
      )}
    `;
  }
}

registerFieldEditor("voice_confirm_entities", (_field, value, onChange, ctx) => html`
  <jarvis-editor-voice-confirm
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${strList(value)}
    .disabled=${ctx.disabled}
    .narrow=${ctx.narrow}
    .label=${ctx.label}
    .controlId=${ctx.id}
    .placeholder=${ctx.placeholder}
    .onChange=${(next: string[]) => onChange(next)}
  ></jarvis-editor-voice-confirm>
`);

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-voice-confirm": JarvisEditorVoiceConfirm;
  }
}
