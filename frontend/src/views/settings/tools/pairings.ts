/**
 * Satellite → Speaker pairings (frontend/specs/settings-tools.md §4.9).
 *
 * `satellite_pairings` is `{ [assist_satellite id]: media_player id }`. One
 * row per `data.config.satellites[]` with a select of `data.config.cast_devices[]`
 * (plus "— none —"); a pairing whose satellite the snapshot no longer lists is
 * kept, flagged "satellite not found" and removable. Every change saves the
 * whole dict through the row's onChange; an unpaired satellite is simply
 * absent from the dict (never stored as "").
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { registerFieldEditor } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { watchDefinitions } from "../../../ha";
import type { Hass, PanelData } from "../../../types";
import "../../../components";
import { CONTROL_TAGS, controlStyles, renderSelect, friendlyName, type SelectOption } from "./lists-controls";

export interface SatelliteRow {
  entity_id: string;
  /** area name, area id or friendly name — whatever the snapshot offers */
  label: string;
  name: string;
}

export interface SpeakerOption {
  entity_id: string;
  name: string;
}

export type Pairings = Record<string, string>;

function asPairings(v: unknown): Pairings {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Pairings = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (k && typeof val === "string") out[k] = val;
  return out;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function satellitesFrom(data: PanelData | null): SatelliteRow[] {
  const raw = data?.config?.satellites;
  if (!Array.isArray(raw)) return [];
  const areaNames = new Map<string, string>();
  for (const a of Array.isArray(data?.areas) ? data.areas : []) {
    const rec = a as unknown as Record<string, unknown>;
    if (str(rec.id) && str(rec.name)) areaNames.set(str(rec.id), str(rec.name));
  }
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => {
      const id = str(s.entity_id);
      const name = str(s.name) || id;
      const areaId = str(s.area_id);
      return { entity_id: id, name, label: str(s.area) || areaNames.get(areaId) || areaId || name };
    })
    .filter((s) => s.entity_id);
}

export function speakersFrom(data: PanelData | null): SpeakerOption[] {
  const raw = data?.config?.cast_devices;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
    .map((d) => ({ entity_id: str(d.entity_id), name: str(d.name) || str(d.entity_id) }))
    .filter((d) => d.entity_id);
}

@customElement("jarvis-editor-pairings")
export class JarvisEditorPairings extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) value: Pairings = {};
  @property({ attribute: false }) satellites: SatelliteRow[] = [];
  @property({ attribute: false }) speakers: SpeakerOption[] = [];
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";
  @property({ attribute: false }) onChange?: (next: Pairings) => void;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li {
        flex-wrap: wrap;
      }
      .rows .ctl {
        flex: 0 1 260px;
        min-width: 180px;
      }
      :host([narrow]) .rows .ctl {
        flex-basis: 100%;
      }
      .rows > li.orphan {
        border-left: 3px dashed var(--jv-warn);
      }
      .empty {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .tag {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-warn-text);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  private _set(sat: string, speaker: string): void {
    if (this.disabled || !this.onChange) return;
    const next: Pairings = { ...this.value };
    if (speaker) next[sat] = speaker;
    else delete next[sat];
    this.onChange(next);
  }

  private _options(current: string): SelectOption[] {
    const opts: SelectOption[] = [{ value: "", label: t("— none —") }, ...this.speakers.map((s) => ({ value: s.entity_id, label: s.name }))];
    if (current && !this.speakers.some((s) => s.entity_id === current)) {
      opts.push({ value: current, label: t("{name} (not a Cast device)", { name: friendlyName(this.hass, current) }) });
    }
    return opts;
  }

  override render() {
    const known = new Set(this.satellites.map((s) => s.entity_id));
    const orphans = Object.keys(this.value).filter((k) => !known.has(k));
    if (!this.satellites.length && !orphans.length) {
      return html`<p class="empty" id=${this.controlId || nothing}>${t("No satellites found")}</p>`;
    }
    return html`
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId || nothing}>
        ${this.satellites.map((s, i) => {
          const sid = `${this.controlId || "pair"}-${i}`;
          const current = this.value[s.entity_id] ?? "";
          return html`
            <li>
              <label class="text" for=${sid}>
                <span class="name">${s.label}</span>
                <span class="sec jv-mono">${s.entity_id}</span>
              </label>
              <span class="ctl">
                ${renderSelect({
                  id: sid,
                  label: t("Speaker for {name}", { name: s.label }),
                  value: current,
                  options: this._options(current),
                  disabled: this.disabled,
                  onChange: (v) => this._set(s.entity_id, v),
                })}
              </span>
            </li>
          `;
        })}
        ${orphans.map(
          (sat) => html`
            <li class="orphan">
              <span class="text">
                <span class="name">${friendlyName(this.hass, sat)} <span class="tag">${t("satellite not found")}</span></span>
                <span class="sec jv-mono">${sat} → ${this.value[sat]}</span>
              </span>
              <span class="ctl">
                <button type="button" class="jv-btn" ?disabled=${this.disabled} @click=${() => this._set(sat, "")}>${t("Remove")}</button>
              </span>
            </li>
          `,
        )}
      </ul>
    `;
  }
}

registerFieldEditor("satellite_pairings", (_field, value, onChange, ctx) => html`
  <jarvis-editor-pairings
    .hass=${ctx.hass}
    .value=${asPairings(value)}
    .satellites=${satellitesFrom(ctx.data)}
    .speakers=${speakersFrom(ctx.data)}
    .disabled=${ctx.disabled}
    .narrow=${ctx.narrow}
    .label=${ctx.label}
    .controlId=${ctx.id}
    .onChange=${(next: Pairings) => onChange(next)}
  ></jarvis-editor-pairings>
`);

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-pairings": JarvisEditorPairings;
  }
}
