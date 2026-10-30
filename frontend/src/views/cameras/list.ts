/**
 * <jarvis-cam-list> - the "Cameras" card (spec §3.2): the in-use header with
 * Enable all / Disable all, one row per camera (use switch, entity id +
 * override pill, JARVIS-only name field, Auto / Indoor / Outdoor segmented
 * control) and the related-settings links into Settings › Cameras.
 *
 * Presentational: every write is an intent event the view performs
 * (cameras.ts owns the optimistic overlay and the per-row status), so the
 * Camera Watch picker and this list always show the same state.
 *
 *   jarvis-cam-toggle   {entity_id, enabled}
 *   jarvis-cam-all      {enabled}
 *   jarvis-cam-rename   {entity_id, name}
 *   jarvis-cam-location {entity_id, mode}
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { t } from "../../i18n";
import { type Camera, type LocationMode, relatedSettings, resolvedLabel } from "./model";

export interface RowStatus {
  saving?: boolean;
  saved?: boolean;
  error?: string;
}

const HA_TAGS = ["ha-switch", "ha-textfield", "ha-icon"];
const MODES: LocationMode[] = ["auto", "indoor", "outdoor"];

type ValueEl = HTMLElement & { value?: string; checked?: boolean };

@customElement("jarvis-cam-list")
export class JarvisCamList extends LitElement {
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ attribute: false }) cameras: Camera[] = [];
  @property({ attribute: false }) overrides: Record<string, string> = {};
  /** the JARVIS-only names map (the name field's value, R12) */
  @property({ attribute: false }) names: Record<string, string> = {};
  /** data.config, for the related-settings values */
  @property({ attribute: false }) values: Record<string, unknown> = {};
  @property({ attribute: false }) rows: Record<string, RowStatus> = {};
  /** an Enable all / Disable all write is in flight */
  @property({ type: Boolean }) bulkBusy = false;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-bottom: var(--jv-space-3);
      }
      .head .count {
        flex: 1 1 auto;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .head .btns {
        display: flex;
        gap: var(--jv-space-2);
        flex-wrap: wrap;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li.cam {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: center;
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li.cam:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .ident {
        min-width: 0;
      }
      .ident .name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .ident .id {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      li.off .ident .name,
      li.off .ident .id {
        color: var(--jv-text-3);
      }
      .ovr {
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-info-soft);
        color: var(--jv-text);
      }
      .fields {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: center;
      }
      :host([narrow]) .fields {
        grid-template-columns: minmax(0, 1fr);
      }
      .name-field {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .name-field ha-textfield,
      .name-field input {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
      }
      .name-field input {
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      .name-field input::placeholder {
        color: var(--jv-text-3);
      }
      .status {
        flex: none;
        min-width: 4.5em;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .status.ok {
        color: var(--jv-ok-text);
      }
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        padding: 2px;
        gap: 2px;
        max-width: 100%;
      }
      :host([narrow]) .seg {
        display: flex;
      }
      .seg button {
        appearance: none;
        flex: 1 1 auto;
        min-height: 32px;
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-pill);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
        white-space: nowrap;
      }
      /* each segment is a live jarvis/camera_location write: full tap height on narrow */
      :host([narrow]) .seg button {
        min-height: var(--jv-tap);
      }
      .seg button:hover {
        background: var(--jv-hover);
      }
      .seg button[aria-checked="true"] {
        background: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .seg button:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
      .seg button[aria-checked="true"]:disabled {
        color: var(--jv-on-accent);
        opacity: 0.6;
      }
      .err {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--jv-danger-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .sw {
        display: inline-flex;
        align-items: center;
        min-height: var(--jv-tap);
      }
      .sw input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      h3 {
        margin: var(--jv-space-4) 0 var(--jv-space-1);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
      }
      .related button {
        appearance: none;
        display: block;
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0;
        border: 0;
        border-top: 1px solid var(--jv-divider);
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .related li:first-child button {
        border-top: 0;
      }
      .related button:hover {
        background: var(--jv-hover);
      }
      .related jv-kv {
        pointer-events: none;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  private _emit(type: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  // ── name field ────────────────────────────────────────────────────────────

  private _commitName(cam: Camera, el: ValueEl): void {
    const next = String(el.value ?? "").trim();
    const saved = this.names[cam.entity_id] ?? "";
    if (next === saved.trim()) return;
    if (this.rows[cam.entity_id]?.saving) return;
    this._emit("jarvis-cam-rename", { entity_id: cam.entity_id, name: next });
  }

  private _onNameKey(e: KeyboardEvent, cam: Camera): void {
    const el = e.currentTarget as ValueEl;
    if (e.key === "Enter") {
      e.preventDefault();
      this._commitName(cam, el);
    } else if (e.key === "Escape") {
      e.preventDefault();
      el.value = this.names[cam.entity_id] ?? "";
    }
  }

  // ── location segmented control ────────────────────────────────────────────

  private _setMode(cam: Camera, mode: LocationMode): void {
    if (mode === cam.location_mode || this.rows[cam.entity_id]?.saving) return;
    this._emit("jarvis-cam-location", { entity_id: cam.entity_id, mode });
  }

  private _onSegKey(e: KeyboardEvent, cam: Camera, index: number): void {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % MODES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + MODES.length) % MODES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = MODES.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const group = (e.currentTarget as HTMLElement).parentElement;
    this._setMode(cam, MODES[next]);
    group?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }

  private _modeLabel(cam: Camera, mode: LocationMode): string {
    if (mode === "auto") return t("Auto ({resolved})", { resolved: resolvedLabel(cam) });
    return mode === "indoor" ? t("Indoor") : t("Outdoor");
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _renderSwitch(cam: Camera, busy: boolean) {
    const label = t("Use {name}", { name: cam.name });
    const onChange = (e: Event) => {
      const el = e.target as ValueEl;
      this._emit("jarvis-cam-toggle", { entity_id: cam.entity_id, enabled: !!el.checked });
    };
    if (haDefined("ha-switch")) {
      return html`<ha-switch .checked=${live(cam.enabled)} ?disabled=${busy} aria-label=${label} title=${label} @change=${onChange}></ha-switch>`;
    }
    return html`
      <label class="sw" title=${label}>
        <input type="checkbox" role="switch" aria-label=${label} .checked=${live(cam.enabled)} ?disabled=${busy} @change=${onChange} />
      </label>
    `;
  }

  private _renderName(cam: Camera, st: RowStatus | undefined) {
    const value = this.names[cam.entity_id] ?? "";
    const placeholder = cam.raw_name || cam.entity_id;
    const aria = t("JARVIS name for {entity}", { entity: cam.entity_id });
    const blur = (e: Event) => this._commitName(cam, e.currentTarget as ValueEl);
    const key = (e: KeyboardEvent) => this._onNameKey(e, cam);
    const field = haDefined("ha-textfield")
      ? html`<ha-textfield
          .value=${live(value)}
          .label=${t("Name")}
          .placeholder=${placeholder}
          aria-label=${aria}
          ?disabled=${!!st?.saving}
          @keydown=${key}
          @focusout=${blur}
        ></ha-textfield>`
      : html`<input
          type="text"
          .value=${live(value)}
          placeholder=${placeholder}
          aria-label=${aria}
          ?disabled=${!!st?.saving}
          @keydown=${key}
          @blur=${blur}
        />`;
    const status = st?.saving ? t("Saving…") : st?.saved ? t("Saved") : "";
    return html`
      <div class="name-field">
        ${field}
        ${status ? html`<span class="status ${st?.saved ? "ok" : ""}" role="status">${status}</span>` : nothing}
      </div>
    `;
  }

  private _renderSeg(cam: Camera, st: RowStatus | undefined) {
    return html`
      <div class="seg" role="radiogroup" aria-label=${t("Location")}>
        ${MODES.map((mode, i) => {
          const checked = cam.location_mode === mode;
          return html`
            <button
              type="button"
              role="radio"
              aria-checked=${checked ? "true" : "false"}
              tabindex=${checked ? "0" : "-1"}
              ?disabled=${!!st?.saving}
              @click=${() => this._setMode(cam, mode)}
              @keydown=${(e: KeyboardEvent) => this._onSegKey(e, cam, i)}
            >
              ${this._modeLabel(cam, mode)}
            </button>
          `;
        })}
      </div>
    `;
  }

  private _renderRow(cam: Camera) {
    const st = this.rows[cam.entity_id];
    const ov = this.overrides[cam.entity_id];
    return html`
      <li class="cam ${cam.enabled ? "" : "off"}">
        ${this._renderSwitch(cam, this.bulkBusy || !!st?.saving)}
        <div class="ident">
          <div class="name">${cam.name}</div>
          <div class="id">
            <span>${cam.entity_id}</span>
            ${ov && ov !== cam.entity_id && ov.includes(".") ? html`<span class="ovr" title=${t("Frames come from this entity (camera_overrides)")}>→ ${ov}</span>` : nothing}
          </div>
        </div>
        <div class="fields">${this._renderName(cam, st)} ${this._renderSeg(cam, st)}</div>
        ${st?.error ? html`<p class="err" role="alert">${st.error}</p>` : nothing}
      </li>
    `;
  }

  private _renderRelated() {
    const rows = relatedSettings(this.values);
    return html`
      <h3>${t("Related settings")}</h3>
      <ul class="related">
        ${rows.map(
          (r) => html`
            <li>
              <button type="button" @click=${() => this._emit("jarvis-navigate", { view: "settings", path: `cameras/${r.key}` })}>
                <jv-kv .label=${r.label} .value=${r.value}></jv-kv>
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }

  override render() {
    const total = this.cameras.length;
    const inUse = this.cameras.filter((c) => c.enabled).length;
    if (!total) {
      return html`
        <jv-empty
          icon="mdi:cctv-off"
          .heading=${t("No camera entities in Home Assistant.")}
          .message=${t("Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.")}
        ></jv-empty>
        ${this._renderRelated()}
      `;
    }
    return html`
      <div class="head">
        <p class="count" aria-live="polite">${t("{n} of {total} cameras in use", { n: inUse, total })}</p>
        <div class="btns">
          <button type="button" class="jv-btn" ?disabled=${this.bulkBusy || inUse === total} @click=${() => this._emit("jarvis-cam-all", { enabled: true })}>
            ${t("Enable all")}
          </button>
          <button type="button" class="jv-btn" ?disabled=${this.bulkBusy || inUse === 0} @click=${() => this._emit("jarvis-cam-all", { enabled: false })}>
            ${t("Disable all")}
          </button>
        </div>
      </div>
      <ul>
        ${this.cameras.map((c) => this._renderRow(c))}
      </ul>
      ${this._renderRelated()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-cam-list": JarvisCamList;
  }
}
