/**
 * <jarvis-editor-biometrics-map> - field editor for `biometric_entities`
 * (frontend/specs/settings-tools.md §4.11).
 *
 * Nine fixed wellbeing kinds (the backend's biometrics._KINDS), each with a
 * single entity picker limited to sensor / binary_sensor; value =
 * `value[kind] ?? ""`. A pick sets the kind, clearing it deletes the kind;
 * either way the whole dict is saved through the row's onChange. Stored
 * kinds outside the nine are listed after them, tagged "unknown kind", with a
 * Remove button. Enabling the feature stays the generic `biometrics_enabled`
 * switch; the discovered-wearables list is on the People view (§7).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { registerFieldEditor } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { watchDefinitions } from "../../../ha";
import { keepRowFocus, type RowFocus } from "../../../focus";
import type { Hass, PanelData } from "../../../types";
import "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail } from "../../../components/jv-picker";
import { CONTROL_TAGS, controlStyles } from "./lists-controls";

/** An unknown kind's Remove hands keyboard focus to the next / previous one's, else the last kind's picker above. */
const REMOVE_FOCUS: RowFocus = { row: ".rows > li", key: "data-kind", control: [".remove", "jv-picker"] };

/** kind -> label; functions so the t() keys stay literals (npm run i18n:keys) */
export const BIOMETRIC_KINDS: Array<[string, () => string]> = [
  ["heart_rate", () => t("Heart rate")],
  ["resting_hr", () => t("Resting heart rate")],
  ["sleep_stage", () => t("Sleep stage")],
  ["sleep_state", () => t("Sleep state")],
  ["spo2", () => t("Blood oxygen (SpO2)")],
  ["steps", () => t("Steps")],
  ["respiratory", () => t("Respiratory rate")],
  ["stress", () => t("Stress")],
  ["temperature", () => t("Body temperature")],
];
const KNOWN = new Set(BIOMETRIC_KINDS.map(([k]) => k));
const DOMAINS = ["sensor", "binary_sensor"];

export type BiometricMap = Record<string, unknown>;

function asMap(v: unknown): BiometricMap {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as BiometricMap) : {};
}

@customElement("jarvis-editor-biometrics-map")
export class JarvisEditorBiometricsMap extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  /** the stored dict {kind: entity_id} */
  @property({ attribute: false }) value: BiometricMap = {};
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";
  @property({ attribute: false }) onChange?: (next: BiometricMap) => void;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li {
        display: grid;
        grid-template-columns: minmax(0, 11em) minmax(0, 1fr);
        align-items: center;
      }
      :host([narrow]) .rows > li {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-1);
      }
      .rows > li.unknown {
        grid-template-columns: minmax(0, 1fr) auto;
        border-left: 3px dashed var(--jv-warn);
      }
      jv-picker {
        min-width: 0;
      }
      .remove {
        appearance: none;
        min-height: var(--jv-tap);
        min-width: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .remove:hover {
        background: var(--jv-hover);
      }
      .remove:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  private _set(kind: string, entity: string): void {
    if (this.disabled || !this.onChange) return;
    const cur = asMap(this.value);
    const now = typeof cur[kind] === "string" ? (cur[kind] as string) : "";
    if (entity === now && (entity !== "" || !(kind in cur))) return;
    const next: BiometricMap = { ...cur };
    if (entity) next[kind] = entity;
    else delete next[kind];
    this.onChange(next);
  }

  private _onPick(kind: string, e: CustomEvent<PickerChangeDetail>): void {
    e.stopPropagation();
    const v = e.detail?.value;
    this._set(kind, (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim());
  }

  override render() {
    const map = asMap(this.value);
    const unknown = Object.keys(map).filter((k) => !KNOWN.has(k));
    return html`
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId || nothing}>
        ${BIOMETRIC_KINDS.map(([kind, label]) => {
          const name = label();
          const v = map[kind];
          return html`
            <li data-kind=${kind}>
              <span class="text">
                <span class="name">${name}</span>
                <span class="sec jv-mono">${kind}</span>
              </span>
              <jv-picker
                kind="entity"
                .domains=${DOMAINS}
                .hass=${this.hass}
                .data=${this.data}
                .value=${typeof v === "string" ? v : ""}
                .label=${name}
                ?disabled=${this.disabled}
                @value-changed=${(e: CustomEvent<PickerChangeDetail>) => this._onPick(kind, e)}
              ></jv-picker>
            </li>
          `;
        })}
        ${unknown.map((kind) => {
          const v = map[kind];
          const shown = typeof v === "string" ? v : JSON.stringify(v);
          return html`
            <li class="unknown" title=${kind} data-kind=${kind}>
              <span class="text">
                <span class="name jv-mono">${kind}</span>
                <span class="sec">${t("unknown kind")} · <span class="jv-mono">${shown}</span></span>
              </span>
              <button type="button" class="remove" ?disabled=${this.disabled} aria-label=${t("Remove {name}", { name: kind })} @click=${(e: Event) => keepRowFocus(e, this, REMOVE_FOCUS, () => this._set(kind, ""))}>${t("Remove")}</button>
            </li>
          `;
        })}
      </ul>
    `;
  }
}

registerFieldEditor("biometric_entities", (_field, value, onChange, ctx) => html`
  <jarvis-editor-biometrics-map
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${asMap(value)}
    .disabled=${ctx.disabled}
    .narrow=${ctx.narrow}
    .label=${ctx.label}
    .controlId=${ctx.id}
    .onChange=${(next: BiometricMap) => onChange(next)}
  ></jarvis-editor-biometrics-map>
`);

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-biometrics-map": JarvisEditorBiometricsMap;
  }
}
