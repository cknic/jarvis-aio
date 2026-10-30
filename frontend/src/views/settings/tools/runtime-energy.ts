/**
 * <jarvis-tool-energy> - Energy Management (settings-tools.md §4.13): the
 * whole-home power picture from jarvis/energy {action:"status"} plus the
 * agency chips, which save `energy_agency` through the host (never the
 * legacy set_agency branch) and then re-read the status.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { t } from "../../../i18n";
import { WsError } from "../../../ws";
import { enumLabel } from "../presentation";
import { JarvisToolCard, wsMessage } from "./runtime-base";

export interface EnergyStatus {
  watts: number | null;
  kw: number | null;
  meter: string;
  peak_watts: number;
  over_peak: boolean;
  agency: string;
  configured_agency: string;
  running: Array<{ name: string; entity: string; watts: number; shed_ok: boolean }>;
  advice: string[];
}

const AGENCIES = ["advisory", "opt_in", "autonomous"];
const ENERGY_KEYS = ["energy_agency", "energy_peak_watts", "energy_mode_bump"];

@customElement("jarvis-tool-energy")
export class JarvisToolEnergy extends JarvisToolCard {
  @state() private _status: EnergyStatus | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;
  @state() private _saving = false;

  private _sig = "";

  static override styles = [
    ...JarvisToolCard.styles,
    css`
      fieldset {
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        border: 0;
        min-width: 0;
      }
      legend {
        padding: 0;
        margin-bottom: var(--jv-space-2);
        font-weight: var(--jv-font-weight-medium);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .chip {
        appearance: none;
        position: relative;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
      }
      .chip::before {
        content: "";
        position: absolute;
        inset: calc((var(--jv-tap) - 100%) / -2) 0;
      }
      .chip[aria-pressed="true"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
      }
      .chip[disabled] {
        cursor: default;
        opacity: 0.6;
      }
      .advice p {
        margin: 0 0 var(--jv-space-2);
        overflow-wrap: anywhere;
      }
      .footer {
        margin-top: var(--jv-space-3);
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-4);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
    `,
  ];

  protected override onFirstActive(): void {
    this._sig = this._signature();
    void this._load();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    // energy_* saved elsewhere on the page (the generic rows) -> re-read once the catalogue reflects it
    if (this._status && (changed.has("data") || changed.has("hass"))) {
      const sig = this._signature();
      if (sig !== this._sig) {
        this._sig = sig;
        void this._load();
      }
    }
  }

  private _signature(): string {
    return JSON.stringify(ENERGY_KEYS.map((k) => this.value(k) ?? null));
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = null;
    try {
      const res = await this.ws<Partial<EnergyStatus>>("jarvis/energy", { action: "status" });
      const o = res && typeof res === "object" ? res : {};
      this._status = {
        watts: typeof o.watts === "number" ? o.watts : null,
        kw: typeof o.kw === "number" ? o.kw : null,
        meter: typeof o.meter === "string" ? o.meter : "",
        peak_watts: typeof o.peak_watts === "number" ? o.peak_watts : Number(this.value("energy_peak_watts")) || 0,
        over_peak: !!o.over_peak,
        agency: typeof o.agency === "string" ? o.agency : "",
        configured_agency: typeof o.configured_agency === "string" ? o.configured_agency : "",
        running: Array.isArray(o.running) ? o.running : [],
        advice: Array.isArray(o.advice) ? o.advice.filter((a): a is string => typeof a === "string") : [],
      };
    } catch (err) {
      this._error = wsMessage(WsError.from("jarvis/energy", err));
    } finally {
      this._loading = false;
    }
  }

  private async _setAgency(value: string): Promise<void> {
    if (!this.host || this._saving) return;
    this._saving = true;
    try {
      const r = await this.host.save("energy_agency", value);
      if (r.ok) {
        this._sig = this._signature();
        await this._load();
      }
    } finally {
      this._saving = false;
    }
  }

  private _fmtKw(kw: number): string {
    return Number.isInteger(kw) ? String(kw) : kw.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  private _renderBadge() {
    const s = this._status;
    if (!s || s.kw == null) return html`<jv-state-badge slot="actions" level="neutral" .label=${t("No meter")}></jv-state-badge>`;
    const kw = this._fmtKw(s.kw);
    return s.over_peak
      ? html`<jv-state-badge slot="actions" level="warn" .label=${t("{kw} kW · over peak", { kw })}></jv-state-badge>`
      : html`<jv-state-badge slot="actions" level="ok" .label=${`${kw} kW`}></jv-state-badge>`;
  }

  private _renderAgency() {
    const configured = String(this.value("energy_agency") ?? this._status?.configured_agency ?? "advisory");
    const effective = this._status?.agency ?? "";
    const off = this.offline || this._saving || !this.host;
    return html`
      <fieldset>
        <legend>${t("Agency")}</legend>
        <div class="chips" role="group">
          ${AGENCIES.map(
            (a) => html`
              <button type="button" class="chip" aria-pressed=${configured === a ? "true" : "false"} ?disabled=${off} @click=${() => void this._setAgency(a)}>
                ${t(enumLabel("energy_agency", a))}
              </button>
            `,
          )}
        </div>
        ${effective && this._status && effective !== this._status.configured_agency
          ? html`<p class="note">${t("Effective now: {agency} (raised by the current mode)", { agency: t(enumLabel("energy_agency", effective)) })}</p>`
          : nothing}
      </fieldset>
    `;
  }

  private _renderBody() {
    if (this._error) return this.renderError(t("Couldn't load energy data — {message}", { message: this._error }), () => void this._load());
    const s = this._status;
    if (!s) return html`<jv-empty kind="loading" .heading=${t("Loading…")}></jv-empty>`;
    return html`
      ${this._renderAgency()}
      ${s.advice.length ? html`<div class="advice">${s.advice.map((a) => html`<p>${a}</p>`)}</div>` : nothing}
      ${s.running.length
        ? html`
            <h3>${t("Running now")}</h3>
            ${s.running.map(
              (r) => html`
                <jv-kv .label=${r.name || r.entity}>
                  <span class="badges">
                    <span class="jv-mono">${`${Math.round(r.watts)} W`}</span>
                    ${r.shed_ok === false ? html`<jv-state-badge level="neutral" nodot .label=${t("protected")}></jv-state-badge>` : nothing}
                  </span>
                </jv-kv>
              `,
            )}
          `
        : nothing}
      <div class="footer">
        ${s.meter ? html`<span class="jv-mono">${t("Meter: {entity}", { entity: s.meter })}</span>` : nothing}
        <span>${t("Peak threshold: {watts} W", { watts: Math.round(s.peak_watts) })}</span>
      </div>
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Energy Management")} icon="mdi:flash-outline" .loading=${this._loading}>
        ${this._renderBadge()}
        ${this.renderIconButton("mdi:refresh", t("Refresh"), () => void this._load(), this.offline || this._loading, "actions")}
        <p class="intro">${t("Whole-home power, peak awareness, and load advice. Pick how much JARVIS may act — it never sheds critical loads (fridge, medical, network).")}</p>
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-energy": JarvisToolEnergy;
  }
}
