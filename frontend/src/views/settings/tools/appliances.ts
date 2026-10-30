/**
 * Appliances — row editor for `appliance_profile` (frontend/specs/settings-tools.md §4.10).
 *
 * The one editor with an explicit Save: the profile is a record the user edits
 * as a whole and every save restarts the appliance monitor (the host's
 * `jarvis/reload_appliances` hook runs after the write; the row status reads
 * "Saved — appliance monitor reloaded"). Rows: Name (required), Type, Entity
 * (a power / status sensor, any id may be typed), Watts, Remove. A row whose
 * name the monitor has learned watts for (`data.config.appliances.profile[]
 * .learned_w`, refreshed by the snapshot) shows "learned ~N W" with a one-tap
 * Use. Drafts survive a category switch for the view's lifetime (module-level
 * map keyed by setting key, dropped on a successful save).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { registerFieldEditor, type SettingsHost } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { haDefined, watchDefinitions } from "../../../ha";
import type { Hass, PanelData } from "../../../types";
import "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail, PickerItem } from "../../../components/jv-picker";
import { CONTROL_TAGS, controlStyles, renderSelect, renderText, friendlyName } from "./lists-controls";

export const APPLIANCE_TYPES = ["washer", "dryer", "dishwasher", "oven", "microwave", "appliance"] as const;

export interface ApplianceRow {
  name: string;
  type: string;
  entity: string;
  watts: number;
}

interface DraftRow {
  uid: number;
  name: string;
  type: string;
  entity: string;
  /** raw text so a half-typed number is not clobbered */
  watts: string;
}

export interface LearnedHint {
  name: string;
  learned_w: number;
}

const ENTITY_RE = /(washer|dryer|dishwash|laundry|appliance|run_complete|cycle_complete|job_state|machine_state)/i;
const LEARNED_DELTA_W = 5;

let _uid = 0;
/** Drafts survive a category switch (the element is re-created per render). */
const _drafts = new Map<string, DraftRow[]>();

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** The stored value as clean rows (non-array / non-object items dropped, like the backend does). */
export function normaliseProfile(value: unknown): ApplianceRow[] {
  if (!Array.isArray(value)) return [];
  const out: ApplianceRow[] = [];
  for (const it of value) {
    if (!it || typeof it !== "object") continue;
    const r = it as Record<string, unknown>;
    const w = Number(r.watts);
    const type = str(r.type).trim().toLowerCase() || "appliance";
    out.push({ name: str(r.name).trim(), type, entity: str(r.entity).trim(), watts: Number.isFinite(w) ? w : 0 });
  }
  return out;
}

function toDraft(rows: ApplianceRow[]): DraftRow[] {
  return rows.map((r) => ({ uid: ++_uid, name: r.name, type: r.type, entity: r.entity, watts: r.watts ? String(r.watts) : "" }));
}

/** Draft -> wire rows; rows without a name are dropped (the backend would drop them too). */
export function fromDraft(draft: DraftRow[]): ApplianceRow[] {
  return draft
    .map((d) => ({ name: d.name.trim(), type: (APPLIANCE_TYPES as readonly string[]).includes(d.type) ? d.type : "appliance", entity: d.entity.trim(), watts: Number(d.watts) || 0 }))
    .filter((r) => r.name);
}

function sameRows(a: ApplianceRow[], b: ApplianceRow[]): boolean {
  return a.length === b.length && a.every((r, i) => r.name === b[i].name && r.type === b[i].type && r.entity === b[i].entity && r.watts === b[i].watts);
}

/** learned watts per appliance name from data.config.appliances.profile[] (backend shape; tolerant). */
export function learnedFrom(data: PanelData | null): LearnedHint[] {
  const app = data?.config?.appliances;
  const profile = app && typeof app === "object" ? (app as Record<string, unknown>).profile : undefined;
  if (!Array.isArray(profile)) return [];
  return profile
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({ name: str(p.name), learned_w: Number(p.learned_w) }))
    .filter((p) => p.name && Number.isFinite(p.learned_w) && p.learned_w > 0);
}

/** Candidate entities: power / energy sensors, W / kW units, or appliance-ish ids. */
export function applianceEntityItems(hass: Hass | undefined): PickerItem[] {
  const out: PickerItem[] = [];
  for (const s of Object.values(hass?.states ?? {})) {
    const id = s.entity_id;
    if (!/^(sensor|binary_sensor)\./.test(id)) continue;
    const dc = String(s.attributes?.device_class ?? "").toLowerCase();
    const unit = String(s.attributes?.unit_of_measurement ?? "").toLowerCase();
    if (dc === "power" || dc === "energy" || unit === "w" || unit === "kw" || ENTITY_RE.test(id)) {
      const name = friendlyName(hass, id);
      out.push({ value: id, label: name, secondary: name !== id ? id : undefined });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

@customElement("jarvis-editor-appliances")
export class JarvisEditorAppliances extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ attribute: false }) value: unknown = [];
  @property({ attribute: false }) host?: SettingsHost;
  @property({ type: String }) fieldKey = "appliance_profile";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";

  @state() private _draft: DraftRow[] = [];
  @state() private _saving = false;
  @state() private _focusUid: number | null = null;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .row {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.6fr) minmax(0, 0.7fr) auto;
        gap: var(--jv-space-2);
        align-items: start;
        padding: var(--jv-space-2) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
      }
      :host([narrow]) .row {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      :host([narrow]) .row > .cell.wide {
        grid-column: 1 / -1;
      }
      .cell {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .cell > .cap {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .row.invalid {
        border-color: var(--jv-danger);
      }
      .remove {
        align-self: center;
      }
      .learned {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .learned .link {
        min-height: 24px;
        font-size: var(--jv-font-size-xs);
      }
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .foot .right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-left: auto;
      }
      :host([narrow]) .foot .jv-btn {
        flex: 1 1 auto;
      }
      .empty {
        margin: 0 0 var(--jv-space-2);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .dirty {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .hint-error {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-danger-text);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("fieldKey") && _drafts.has(this.fieldKey)) {
      this._draft = _drafts.get(this.fieldKey) ?? [];
    }
    if (changed.has("value") || changed.has("fieldKey")) {
      const stored = normaliseProfile(this.value);
      const kept = _drafts.get(this.fieldKey);
      // adopt the stored value unless the user has a different draft going
      if (!kept || sameRows(fromDraft(kept), stored) || (!this._saving && !this._dirty(kept, stored) )) {
        this._draft = toDraft(stored);
        _drafts.delete(this.fieldKey);
      } else {
        this._draft = kept;
      }
    }
  }

  override updated(): void {
    if (this._focusUid === null) return;
    const i = this._draft.findIndex((d) => d.uid === this._focusUid);
    this._focusUid = null;
    if (i < 0) return;
    const el = this.renderRoot.querySelector<HTMLElement>(`[id="${this._idBase(i)}-name"]`);
    el?.focus?.();
  }

  private _idBase(i: number): string {
    return `${this.controlId || "appl"}-${i}`;
  }

  private _dirty(draft: DraftRow[], stored = normaliseProfile(this.value)): boolean {
    if (!sameRows(fromDraft(draft), stored)) return true;
    // an unnamed row with content is a pending edit too
    return draft.some((d) => !d.name.trim() && (d.entity.trim() || d.watts.trim()));
  }

  private _update(uid: number, patch: Partial<DraftRow>): void {
    this._draft = this._draft.map((d) => (d.uid === uid ? { ...d, ...patch } : d));
    _drafts.set(this.fieldKey, this._draft);
  }

  private _add(): void {
    const row: DraftRow = { uid: ++_uid, name: "", type: "appliance", entity: "", watts: "" };
    this._draft = [...this._draft, row];
    _drafts.set(this.fieldKey, this._draft);
    this._focusUid = row.uid;
  }

  private _remove(uid: number): void {
    this._draft = this._draft.filter((d) => d.uid !== uid);
    _drafts.set(this.fieldKey, this._draft);
  }

  private _invalid(d: DraftRow): boolean {
    return !d.name.trim() && !!(d.entity.trim() || d.watts.trim());
  }

  private async _save(): Promise<void> {
    if (!this.host || this._saving) return;
    const rows = fromDraft(this._draft);
    this._saving = true;
    try {
      const r = await this.host.save(this.fieldKey, rows);
      if (r.ok) {
        _drafts.delete(this.fieldKey);
        this._draft = toDraft(rows);
      }
    } finally {
      this._saving = false;
    }
  }

  private _learnedFor(d: DraftRow): number | null {
    const name = d.name.trim().toLowerCase();
    if (!name) return null;
    const hit = learnedFrom(this.data).find((h) => h.name.trim().toLowerCase() === name);
    if (!hit) return null;
    const cur = Number(d.watts) || 0;
    return Math.abs(hit.learned_w - cur) > LEARNED_DELTA_W ? Math.round(hit.learned_w) : null;
  }

  private _renderRow(d: DraftRow, i: number) {
    const off = this.disabled || this._saving;
    const invalid = this._invalid(d);
    const learned = this._learnedFor(d);
    const idBase = this._idBase(i);
    const onEntity = (e: CustomEvent<PickerChangeDetail>) => {
      e.stopPropagation();
      const v = e.detail?.value;
      this._update(d.uid, { entity: Array.isArray(v) ? v[0] ?? "" : v ?? "" });
    };
    return html`
      <li class="row ${invalid ? "invalid" : ""}">
        <div class="cell">
          <span class="cap" id="${idBase}-name-cap">${t("Name")}</span>
          ${renderText({
            id: `${idBase}-name`,
            label: t("Name"),
            value: d.name,
            placeholder: t("e.g. Washer"),
            disabled: off,
            invalid,
            onInput: (v) => this._update(d.uid, { name: v }),
            onChange: (v) => this._update(d.uid, { name: v }),
          })}
          ${invalid ? html`<span class="hint-error" role="alert">${t("Name required")}</span>` : nothing}
        </div>
        <div class="cell">
          <span class="cap">${t("Type")}</span>
          ${renderSelect({
            id: `${idBase}-type`,
            label: t("Type"),
            value: (APPLIANCE_TYPES as readonly string[]).includes(d.type) ? d.type : "appliance",
            options: APPLIANCE_TYPES.map((v) => ({ value: v, label: v })),
            disabled: off,
            onChange: (v) => this._update(d.uid, { type: v }),
          })}
        </div>
        <div class="cell wide">
          <span class="cap">${t("Entity")}</span>
          <jv-picker
            kind="entity"
            allow-custom
            .hass=${this.hass}
            .data=${this.data}
            .items=${applianceEntityItems(this.hass)}
            .domains=${["sensor", "binary_sensor"]}
            .value=${d.entity}
            .label=${t("Entity")}
            .placeholder=${t("power or status sensor (optional)")}
            ?disabled=${off}
            @value-changed=${onEntity}
          ></jv-picker>
        </div>
        <div class="cell">
          <span class="cap">${t("Watts")}</span>
          ${renderText({
            id: `${idBase}-watts`,
            label: t("Watts"),
            type: "number",
            min: 0,
            step: 10,
            value: d.watts,
            placeholder: t("watts"),
            disabled: off,
            onInput: (v) => this._update(d.uid, { watts: v }),
            onChange: (v) => this._update(d.uid, { watts: v }),
          })}
          ${learned !== null
            ? html`
                <span class="learned">
                  <span>${t("learned ~{watts} W", { watts: learned })}</span>
                  <button type="button" class="link jv-hit" ?disabled=${off} @click=${() => this._update(d.uid, { watts: String(learned) })}>${t("Use")}</button>
                </span>
              `
            : nothing}
        </div>
        <div class="cell remove">
          ${haDefined("ha-icon-button")
            ? html`<ha-icon-button .label=${t("Remove appliance")} ?disabled=${off} @click=${() => this._remove(d.uid)}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>`
            : html`<button type="button" class="jv-icon-btn" aria-label=${t("Remove appliance")} ?disabled=${off} @click=${() => this._remove(d.uid)}>×</button>`}
        </div>
      </li>
    `;
  }

  override render() {
    const off = this.disabled || this._saving;
    const stored = normaliseProfile(this.value);
    const dirty = this._dirty(this._draft, stored);
    const blocked = this._draft.some((d) => this._invalid(d));
    const named = fromDraft(this._draft).length;
    return html`
      ${this._draft.length
        ? html`<ul class="list" role="group" aria-label=${this.label} id=${this.controlId || nothing}>${this._draft.map((d, i) => this._renderRow(d, i))}</ul>`
        : html`<p class="empty" id=${this.controlId || nothing}>${t("No appliances declared yet — JARVIS falls back to generic power guesses until you add some.")}</p>`}
      <div class="foot">
        <button type="button" class="jv-btn" ?disabled=${off} @click=${this._add}>${t("+ Add appliance")}</button>
        <span class="right">
          ${dirty && !this._saving ? html`<span class="dirty">${t("{count} items", { count: named })} · ${t("unsaved")}</span>` : nothing}
          <button type="button" class="jv-btn primary" ?disabled=${off || !dirty || blocked} @click=${this._save}>${this._saving ? t("Saving…") : t("Save appliances")}</button>
        </span>
      </div>
    `;
  }
}

registerFieldEditor("appliance_profile", (field, value, _onChange, ctx) => html`
  <jarvis-editor-appliances
    .hass=${ctx.hass}
    .data=${ctx.data}
    .value=${value}
    .host=${ctx.host}
    .fieldKey=${field.key}
    .disabled=${ctx.disabled}
    .narrow=${ctx.narrow}
    .label=${ctx.label}
    .controlId=${ctx.id}
  ></jarvis-editor-appliances>
`);

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-appliances": JarvisEditorAppliances;
  }
}
