/**
 * Toggle lists and mode bindings (frontend/specs/settings-tools.md §4.5–4.8).
 *
 *   disabled_sentinel_rules  <jarvis-editor-toggle-list invert>  one switch per
 *                            data.config.sentinel_rules[]; ON = id ABSENT
 *   announcement_speakers    <jarvis-editor-toggle-list>         one switch per
 *                            data.config.cast_devices[]; ON = id present
 *   lab_areas                <jv-picker kind="area" multiple>
 *   movie_area               <jv-picker kind="area">             "" = none
 *   movie_media_player       <jv-picker kind="entity" domains=[media_player]>
 *
 * Every toggle saves the whole array through the row's onChange (optimistic;
 * the row reverts on failure). Ids stored but unknown to the snapshot stay in
 * the list, flagged, so they can still be switched.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { registerFieldEditor } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { watchDefinitions } from "../../../ha";
import type { PanelData } from "../../../types";
import "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail } from "../../../components/jv-picker";
import { CONTROL_TAGS, controlStyles, renderSwitch, onOff, friendlyName } from "./lists-controls";

export interface ToggleRow {
  id: string;
  label: string;
  secondary?: string;
  /** stored id the snapshot does not know (shown with a dashed border) */
  unknown?: boolean;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : [];
}

function cfgRows(data: PanelData | null, key: string): Array<Record<string, unknown>> {
  const v = data?.config?.[key];
  return Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];
}

/** "door_left_open" -> "Door left open" */
export function humanise(id: string): string {
  const s = id.replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : id;
}

// ── element ─────────────────────────────────────────────────────────────────

@customElement("jarvis-editor-toggle-list")
export class JarvisEditorToggleList extends LitElement {
  @property({ attribute: false }) rows: ToggleRow[] = [];
  /** the stored array */
  @property({ attribute: false }) value: string[] = [];
  /** ON = id absent from the array (disabled_* keys) */
  @property({ type: Boolean, reflect: true }) invert = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";
  @property({ type: String }) emptyMessage = "";
  @property({ type: String }) help = "";
  /** secondary text for stored ids the source does not list */
  @property({ type: String }) unknownNote = "";
  @property({ type: String }) countLabel = "";
  @property({ attribute: false }) onChange?: (next: string[]) => void;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li.unknown {
        border-left: 3px dashed var(--jv-warn);
      }
      .state {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        min-width: 2.5em;
        text-align: right;
      }
      .count {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .empty {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  private _isOn(id: string): boolean {
    const present = this.value.includes(id);
    return this.invert ? !present : present;
  }

  private _toggle(id: string, on: boolean): void {
    if (this.disabled || !this.onChange) return;
    const keep = this.invert ? !on : on; // should the id be IN the array?
    const cur = this.value;
    const next = keep ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
    if (next.length !== cur.length || next.some((x, i) => x !== cur[i])) this.onChange(next);
  }

  override render() {
    const known = new Set(this.rows.map((r) => r.id));
    const extras: ToggleRow[] = this.value
      .filter((id) => !known.has(id))
      .map((id) => ({ id, label: humanise(id), secondary: this.unknownNote, unknown: true }));
    const all = [...this.rows, ...extras];
    if (!all.length) {
      return html`
        <p class="empty" id=${this.controlId || nothing}>${this.emptyMessage}</p>
        ${this.help ? html`<p class="note">${this.help}</p>` : nothing}
      `;
    }
    return html`
      ${this.countLabel ? html`<p class="count">${this.countLabel}</p>` : nothing}
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId || nothing}>
        ${all.map((r, i) => {
          const on = this._isOn(r.id);
          const sid = `${this.controlId || "tl"}-${i}`;
          return html`
            <li class=${r.unknown ? "unknown" : ""} title=${r.id}>
              <label class="text" for=${sid}>
                <span class="name">${r.label}</span>
                ${r.secondary ? html`<span class="sec ${r.unknown ? "" : "jv-mono"}">${r.secondary}</span>` : nothing}
                ${r.unknown ? html`<span class="sec jv-mono">${r.id}</span>` : nothing}
              </label>
              <span class="ctl">
                <span class="state" aria-hidden="true">${onOff(on)}</span>
                ${renderSwitch({ id: sid, label: r.label, checked: on, disabled: this.disabled, onChange: (c) => this._toggle(r.id, c) })}
              </span>
            </li>
          `;
        })}
      </ul>
      ${this.help ? html`<p class="note">${this.help}</p>` : nothing}
    `;
  }
}

// ── registrations ──────────────────────────────────────────────────────────

/** Sentinel rules: ON = rule id absent from disabled_sentinel_rules. */
registerFieldEditor("disabled_sentinel_rules", (_field, value, onChange, ctx) => {
  const rows: ToggleRow[] = cfgRows(ctx.data, "sentinel_rules")
    .map((r) => {
      const id = typeof r.id === "string" ? r.id : "";
      const desc = typeof r.desc === "string" ? r.desc : typeof r.name === "string" ? r.name : "";
      return { id, label: humanise(id), secondary: desc };
    })
    .filter((r) => r.id);
  return html`
    <jarvis-editor-toggle-list
      invert
      .rows=${rows}
      .value=${strList(value)}
      .disabled=${ctx.disabled}
      .narrow=${ctx.narrow}
      .label=${ctx.label}
      .controlId=${ctx.id}
      .emptyMessage=${t("No sentinel rules reported.")}
      .unknownNote=${t("unknown rule")}
      .countLabel=${rows.length ? t("{count} rules", { count: rows.length }) : ""}
      .onChange=${(next: string[]) => onChange(next)}
    ></jarvis-editor-toggle-list>
  `;
});

/** Announcement speakers: ON = media_player id present in announcement_speakers. */
registerFieldEditor("announcement_speakers", (_field, value, onChange, ctx) => {
  const rows: ToggleRow[] = cfgRows(ctx.data, "cast_devices")
    .map((d) => {
      const id = typeof d.entity_id === "string" ? d.entity_id : "";
      const name = typeof d.name === "string" && d.name ? d.name : friendlyName(ctx.hass, id);
      return { id, label: name, secondary: id };
    })
    .filter((r) => r.id);
  // stored ids outside the Cast list keep their HA name
  const known = new Set(rows.map((r) => r.id));
  const extra = strList(value).filter((id) => !known.has(id)).map((id) => ({ id, label: friendlyName(ctx.hass, id), secondary: t("not a Cast device"), unknown: true }));
  return html`
    <jarvis-editor-toggle-list
      .rows=${[...rows, ...extra]}
      .value=${strList(value)}
      .disabled=${ctx.disabled}
      .narrow=${ctx.narrow}
      .label=${ctx.label}
      .controlId=${ctx.id}
      .emptyMessage=${t("No Cast devices found")}
      .help=${t("Choose the media players JARVIS announces through. Empty = the broadcast group, then every speaker.")}
      .unknownNote=${t("not a Cast device")}
      .onChange=${(next: string[]) => onChange(next)}
    ></jarvis-editor-toggle-list>
  `;
});

// ── mode bindings (jv-picker) ──────────────────────────────────────────────

const onMulti = (onChange: (v: unknown) => void) => (e: CustomEvent<PickerChangeDetail>) => {
  e.stopPropagation();
  const v = e.detail?.value;
  onChange(Array.isArray(v) ? v : v ? [v] : []);
};
const onSingle = (onChange: (v: unknown) => void) => (e: CustomEvent<PickerChangeDetail>) => {
  e.stopPropagation();
  const v = e.detail?.value;
  onChange(Array.isArray(v) ? v[0] ?? "" : v ?? "");
};

/** Lab mode rooms: area ids. */
registerFieldEditor("lab_areas", (_field, value, onChange, ctx) => html`
  <jv-picker
    id=${ctx.id}
    kind="area"
    multiple
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${strList(value)}
    .label=${ctx.label}
    .placeholder=${ctx.placeholder}
    ?disabled=${ctx.disabled}
    @value-changed=${onMulti(onChange)}
  ></jv-picker>
`);

/** Movie mode room: one area id or "". */
registerFieldEditor("movie_area", (_field, value, onChange, ctx) => html`
  <jv-picker
    id=${ctx.id}
    kind="area"
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${typeof value === "string" ? value : ""}
    .label=${ctx.label}
    .placeholder=${ctx.placeholder || t("— none —")}
    ?disabled=${ctx.disabled}
    @value-changed=${onSingle(onChange)}
  ></jv-picker>
`);

/** Movie mode player: one media_player id or "". */
registerFieldEditor("movie_media_player", (_field, value, onChange, ctx) => html`
  <jv-picker
    id=${ctx.id}
    kind="entity"
    .domains=${["media_player"]}
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${typeof value === "string" ? value : ""}
    .label=${ctx.label}
    .placeholder=${ctx.placeholder || t("— none —")}
    ?disabled=${ctx.disabled}
    @value-changed=${onSingle(onChange)}
  ></jv-picker>
`);

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-toggle-list": JarvisEditorToggleList;
  }
}
