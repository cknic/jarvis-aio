/**
 * <jv-logs-governance> - the Governance card on the Logs view: a READ-ONLY
 * summary of the kernel's enforce kill-switches (jarvis/get_enforcement, read
 * by the view): how many opt-in capabilities are ON, how many safety guards
 * are ON, how many switches carry an owner override, and by name every
 * switch that is not at its shipped default. The switches themselves are
 * written in one place only, Settings › Governance (<jarvis-tool-governance>,
 * settings-tools.md §4.12); the "Change in Settings" button deep-links there.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { haDefined, watchDefinitions } from "../../ha";
import type { Hass } from "../../types";
import "../../components";
import { cardStyles } from "./format";
import type { EnforcementSwitch } from "./types";

@customElement("jv-logs-governance")
export class JvLogsGovernance extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** null until the first load */
  @property({ attribute: false }) switches: EnforcementSwitch[] | null = null;
  @property({ type: String }) error: string | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .counts {
        list-style: none;
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .counts li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        border-top: 1px solid var(--jv-divider);
        padding-top: var(--jv-space-2);
      }
      .counts .lbl {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .changed {
        margin: 0 0 var(--jv-space-3);
        padding-left: var(--jv-space-4);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .changed li {
        overflow-wrap: anywhere;
      }
      .changed .name {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-alert"]);
  }

  private _openSettings(): void {
    this.dispatchEvent(
      new CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail: { view: "settings", path: "governance/tool:governance" } }),
    );
  }

  private _renderCount(label: string, on: number, total: number, level: "ok" | "warn" | "neutral") {
    if (!total) return nothing;
    return html`
      <li>
        <span class="lbl">${label}</span>
        <jv-state-badge nodot .level=${level} .label=${t("{on} of {total} ON", { on, total })}></jv-state-badge>
      </li>
    `;
  }

  private _renderBody() {
    if (this.error) {
      const text = t("Couldn't load governance switches — {message}", { message: this.error });
      return haDefined("ha-alert")
        ? html`<ha-alert alert-type="error">${text}</ha-alert>`
        : html`<div class="banner" role="alert">${text}</div>`;
    }
    if (this.switches === null) return html`<div class="state" role="status">${t("Loading governance switches…")}</div>`;
    if (this.switches.length === 0) return html`<p class="sub">${t("No governance switches reported.")}</p>`;
    const caps = this.switches.filter((s) => s.category === "capability");
    const safety = this.switches.filter((s) => s.category === "safety");
    const onCount = (list: EnforcementSwitch[]) => list.filter((s) => !!s.enabled).length;
    const overridden = this.switches.filter((s) => s.overridden).length;
    const safetyOff = safety.length - onCount(safety);
    // a switch away from its shipped default is what an admin reading the log needs to know about
    const changed = this.switches.filter((s) => !!s.enabled !== !!s.default);
    return html`
      <ul class="counts">
        ${this._renderCount(t("Owner opt-in capabilities"), onCount(caps), caps.length, "neutral")}
        ${this._renderCount(t("Safety & governance — kill-switches (keep ON)"), onCount(safety), safety.length, safetyOff ? "warn" : "ok")}
        <li>
          <span class="lbl">${t("Owner overrides")}</span>
          <jv-state-badge nodot .level=${overridden ? "warn" : "neutral"} .label=${String(overridden)}></jv-state-badge>
        </li>
      </ul>
      ${changed.length
        ? html`
            <p class="sub">${t("Not at the shipped default:")}</p>
            <ul class="changed">
              ${changed.map(
                (s) => html`<li><span class="name">${s.name}</span> — ${s.enabled ? t("ON") : t("OFF")} (${s.default ? t("default: ON") : t("default: OFF")})</li>`,
              )}
            </ul>
          `
        : html`<p class="sub">${t("Every switch is at its shipped default.")}</p>`}
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Governance")} icon="mdi:shield-check-outline" .loading=${this.switches === null && !this.error}>
        <jv-state-badge slot="actions" nodot level="accent" .label=${t("Enforcement")}></jv-state-badge>
        <p class="intro">${t("The kernel's enforcement kill-switches, read-only here. Turn them on or off in Settings › Governance.")}</p>
        ${this._renderBody()}
        <div class="actions">
          <button type="button" class="jv-btn" @click=${() => this._openSettings()}>${t("Change in Settings")}</button>
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-governance": JvLogsGovernance;
  }
}
