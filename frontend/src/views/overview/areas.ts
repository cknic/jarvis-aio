/**
 * <jarvis-ov-areas .hass .areas .lightControl>
 *
 * The area tile grid of the overview plus its two modals: the area detail
 * dialog and the per-area lights popover (jarvis/area_lights, light.turn_on /
 * turn_off). Self-contained: it toasts through "hass-notification" and asks
 * the panel to refetch with "jarvis-refresh" (both bubble past the view).
 * `openArea(id)` lets the view open the detail dialog (dominant-area card).
 */
import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { haDefined, watchDefinitions } from "../../ha";
import { ws } from "../../ws";
import type { AreaRow, Hass } from "../../types";
import "../../components";
import "./ov-dialog";
import { CAP_ICONS, type AreaLight, type AreaLightsResult, capLabel, dash, errMsg, requestRefresh, toast } from "./model";

const MAX_CAP_ICONS = 5;
const LIGHT_SETTLE_MS = 500;

interface LightsPanel {
  areaId: string;
  name: string;
  loading: boolean;
  items: AreaLight[];
}

@customElement("jarvis-ov-areas")
export class JarvisOvAreas extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) areas: AreaRow[] = [];
  @property({ type: Boolean }) lightControl = true;

  @state() private _expandedId: string | null = null;
  @state() private _lights: LightsPanel | null = null;
  @state() private _allOffBusy = false;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--jv-space-2);
      }
      .tile {
        position: relative;
        min-width: 0;
      }
      .open {
        appearance: none;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
        width: 100%;
        min-height: 96px;
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .open:hover {
        background: var(--jv-hover);
      }
      .tile.active .open {
        border-color: var(--jv-ok);
        background: var(--jv-ok-soft);
      }
      .caps {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        color: var(--jv-text-2);
        --mdc-icon-size: 18px;
        min-height: 18px;
      }
      .cap {
        display: inline-flex;
        align-items: center;
        font-size: var(--jv-font-size-xs);
      }
      .readings {
        display: flex;
        gap: var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
      }
      .foot {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: auto;
        min-width: 0;
        width: 100%;
        padding-right: 52px;
      }
      .dot {
        flex: none;
        width: 8px;
        height: 8px;
        margin-top: 7px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .dot.on {
        background: var(--jv-ok);
      }
      .name {
        flex: 1 1 auto;
        min-width: 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .bed {
        flex: 0 1 auto;
        margin-top: 2px;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        --mdc-icon-size: 16px;
      }
      .pill {
        position: absolute;
        right: var(--jv-space-2);
        bottom: var(--jv-space-2);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 28px;
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-variant-numeric: tabular-nums;
        --mdc-icon-size: 14px;
      }
      .pill.inline {
        position: relative;
      }
      button.pill {
        cursor: pointer;
      }
      /* the pill stays 28 px tall but its hit box is the 44 px tap target
         (it is layered over the tile button, so a thumb must not miss it) */
      button.pill::before {
        content: "";
        position: absolute;
        inset: calc((var(--jv-tap) - 100%) / -2) calc(-1 * var(--jv-space-1));
      }
      button.pill:hover {
        background: var(--jv-hover);
      }
      .pill.lit {
        border-color: var(--jv-warn);
        background: var(--jv-warn-soft);
        color: var(--jv-text);
      }
      /* dialog bodies */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-2);
      }
      .lights {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .lights button {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-1);
        border: 0;
        border-bottom: 1px solid var(--jv-divider);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .lights li:last-child button {
        border-bottom: 0;
      }
      .lights button:hover {
        background: var(--jv-hover);
      }
      .lights .state {
        margin-left: auto;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .lights .dot.on {
        background: var(--jv-warn);
      }
      p.msg {
        margin: 0;
        color: var(--jv-text-2);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon"]);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("areas")) {
      // The snapshot was refreshed: close modals whose area disappeared.
      if (this._expandedId && !this._find(this._expandedId)) this._expandedId = null;
      if (this._lights && !this._find(this._lights.areaId)) this._lights = null;
    }
    if (changed.has("lightControl") && !this.lightControl) this._lights = null;
  }

  /** Open the detail dialog for an area id (no-op when it is not listed). */
  openArea(id: string): void {
    if (this._find(id)) this._expandedId = id;
  }

  private _find(id: string): AreaRow | undefined {
    return this.areas.find((a) => a.id === id);
  }

  private _icon(icon: string, title: string) {
    return haDefined("ha-icon")
      ? html`<ha-icon .icon=${icon} .title=${title} aria-label=${title} role="img"></ha-icon>`
      : html`<span aria-label=${title} title=${title}>${title}</span>`;
  }

  // ── lights popover ──────────────────────────────────────────────────────

  private async _openLights(a: AreaRow): Promise<void> {
    if (!this.lightControl) return;
    this._lights = { areaId: a.id, name: a.name, loading: true, items: [] };
    try {
      const res = await ws<AreaLightsResult>(this.hass, "jarvis/area_lights", { area_id: a.id });
      if (this._lights?.areaId !== a.id) return; // closed or switched meanwhile
      this._lights = {
        areaId: a.id,
        name: res?.name || a.name,
        loading: false,
        items: Array.isArray(res?.lights) ? res.lights : [],
      };
    } catch (err) {
      if (this._lights?.areaId !== a.id) return;
      this._lights = { ...this._lights, loading: false, items: [] };
      toast(this, `${t("Couldn't load lights —")} ${errMsg(err)}`);
    }
  }

  private _callService(domain: string, service: string, data: Record<string, unknown>, target?: Record<string, unknown>) {
    const h = this.hass;
    if (!h || typeof h.callService !== "function") {
      return Promise.reject(new Error(t("Home Assistant connection not available")));
    }
    return h.callService(domain, service, data, target);
  }

  private _setLight(entityId: string, on: boolean): void {
    if (!this._lights) return;
    this._lights = { ...this._lights, items: this._lights.items.map((l) => (l.entity_id === entityId ? { ...l, on } : l)) };
  }

  private async _toggleLight(l: AreaLight): Promise<void> {
    const areaId = this._lights?.areaId;
    this._setLight(l.entity_id, !l.on);
    try {
      await this._callService("light", l.on ? "turn_off" : "turn_on", { entity_id: l.entity_id });
      requestRefresh(this, LIGHT_SETTLE_MS);
    } catch (err) {
      if (this._lights?.areaId === areaId) this._setLight(l.entity_id, l.on);
      toast(this, `${t("Light failed —")} ${errMsg(err)}`);
    }
  }

  private async _allOff(): Promise<void> {
    const panel = this._lights;
    if (!panel || this._allOffBusy) return;
    this._allOffBusy = true;
    try {
      await this._callService("light", "turn_off", {}, { area_id: panel.areaId });
      if (this._lights?.areaId === panel.areaId) {
        this._lights = { ...this._lights, items: this._lights.items.map((l) => ({ ...l, on: false })) };
      }
      toast(this, t("{name} lights off", { name: panel.name }));
      this._lights = null;
      requestRefresh(this, LIGHT_SETTLE_MS);
    } catch (err) {
      toast(this, `${panel.name} ${t("lights")} — ${errMsg(err)}`);
    } finally {
      this._allOffBusy = false;
    }
  }

  // ── render ──────────────────────────────────────────────────────────────

  private _pill(a: AreaRow, inline = false) {
    const lit = a.lights_on > 0;
    const label = `${a.lights_on}/${a.lights_total} ${t("lights on")}`;
    const cls = `pill ${lit ? "lit" : ""} ${inline ? "inline" : ""}`;
    const icon = haDefined("ha-icon") ? html`<ha-icon icon="mdi:lightbulb" aria-hidden="true"></ha-icon>` : nothing;
    if (!this.lightControl) {
      return html`<span class=${cls} title=${label} aria-label=${label}>${icon}${a.lights_on}/${a.lights_total}</span>`;
    }
    const title = `${label} ${t("— tap to toggle")}`;
    return html`
      <button
        type="button"
        class=${cls}
        title=${title}
        aria-label=${title}
        @click=${(e: Event) => {
          e.stopPropagation();
          void this._openLights(a);
        }}
      >
        ${icon}${a.lights_on}/${a.lights_total}
      </button>
    `;
  }

  private _tile(a: AreaRow) {
    const caps = a.caps ?? [];
    const shown = caps.slice(0, MAX_CAP_ICONS);
    const more = caps.length - shown.length;
    const temp = dash(a.temp);
    const hum = dash(a.humidity);
    // aria-label replaces the name from content, so the state and the
    // readings are folded into it (spec: "<name> details").
    const label = [
      t("{name} details", { name: a.name }),
      a.active ? t("Occupied") : t("Vacant"),
      a.bedroom ? t("Bedroom") : "",
      temp ?? "",
      hum ?? "",
    ]
      .filter(Boolean)
      .join(", ");
    return html`
      <div class="tile ${a.active ? "active" : ""}">
        <button
          type="button"
          class="open"
          aria-label=${label}
          @click=${() => {
            this._expandedId = a.id;
          }}
        >
          <div class="caps" aria-hidden="true">
            ${shown.map((c) => html`<span class="cap">${this._icon(CAP_ICONS[c] ?? "mdi:help-circle-outline", capLabel(c))}</span>`)}
            ${more > 0 ? html`<span class="cap">+${more}</span>` : nothing}
          </div>
          ${temp || hum
            ? html`<div class="readings">${temp ? html`<span>${temp}</span>` : nothing}${hum ? html`<span>${hum}</span>` : nothing}</div>`
            : nothing}
          <div class="foot">
            <span class="dot ${a.active ? "on jv-pulse" : ""}" aria-hidden="true"></span>
            <span class="name">${a.name}</span>
            ${a.bedroom && haDefined("ha-icon") ? html`<span class="bed">${this._icon("mdi:bed", t("Bedroom"))}</span>` : nothing}
          </div>
        </button>
        ${a.lights_total > 0 ? this._pill(a) : nothing}
      </div>
    `;
  }

  private _detail() {
    const a = this._expandedId ? this._find(this._expandedId) : undefined;
    const close = () => {
      this._expandedId = null;
    };
    return html`
      <jarvis-ov-dialog .open=${!!a} .heading=${a?.name ?? ""} @ov-close=${close}>
        ${a
          ? html`
              <div class="chips">
                <jv-state-badge
                  level=${a.active ? "ok" : "neutral"}
                  ?pulse=${a.active}
                  .label=${a.active ? t("Occupied") : t("Vacant")}
                ></jv-state-badge>
                ${a.bedroom ? html`<jv-state-badge level="info" nodot .label=${t("Bedroom")}></jv-state-badge>` : nothing}
              </div>
              ${dash(a.temp) ? html`<jv-kv .label=${t("Temperature")} .value=${a.temp ?? ""}></jv-kv>` : nothing}
              ${dash(a.humidity) ? html`<jv-kv .label=${t("Humidity")} .value=${a.humidity ?? ""}></jv-kv>` : nothing}
              ${a.lights_total > 0 ? html`<jv-kv .label=${t("Lights")}>${this._pill(a, true)}</jv-kv>` : nothing}
              ${dash(a.last_motion) ? html`<jv-kv .label=${t("Last motion")} .value=${a.last_motion ?? ""}></jv-kv>` : nothing}
              <jv-kv .label=${t("Capabilities")} .value=${(a.caps ?? []).map(capLabel).join(", ") || "—"}></jv-kv>
            `
          : nothing}
        <button slot="actions" type="button" class="jv-btn" @click=${close}>${t("Close")}</button>
      </jarvis-ov-dialog>
    `;
  }

  private _lightsDialog() {
    const L = this._lights;
    const close = () => {
      this._lights = null;
    };
    const anyOn = !!L?.items.some((l) => l.on);
    return html`
      <jarvis-ov-dialog .open=${!!L} .heading=${L?.name ?? ""} @ov-close=${close}>
        ${!L
          ? nothing
          : L.loading
            ? html`<p class="msg" role="status" aria-live="polite">${t("Loading lights…")}</p>`
            : L.items.length === 0
              ? html`<p class="msg">${t("No controllable lights in this room.")}</p>`
              : html`
                  <ul class="lights">
                    ${L.items.map(
                      (l) => html`
                        <li>
                          <button type="button" aria-pressed=${l.on ? "true" : "false"} @click=${() => void this._toggleLight(l)}>
                            <span class="dot ${l.on ? "on" : ""}" aria-hidden="true"></span>
                            <span class="jv-truncate" title=${l.entity_id}>${l.name}</span>
                            <span class="state">${l.on ? t("On") : t("Off")}</span>
                          </button>
                        </li>
                      `,
                    )}
                  </ul>
                `}
        <button slot="actions" type="button" class="jv-btn" ?disabled=${!anyOn || this._allOffBusy} @click=${() => void this._allOff()}>
          ${t("Turn all off")}
        </button>
        <button slot="actions" type="button" class="jv-btn" @click=${close}>${t("Close")}</button>
      </jarvis-ov-dialog>
    `;
  }

  override render() {
    return html`
      <div class="grid" role="list">
        ${this.areas.map((a) => html`<div role="listitem">${this._tile(a)}</div>`)}
      </div>
      ${this._detail()} ${this._lightsDialog()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-ov-areas": JarvisOvAreas;
  }
}
