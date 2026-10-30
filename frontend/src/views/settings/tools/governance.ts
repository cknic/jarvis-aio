/**
 * <jarvis-tool-governance> - the kernel's enforcement kill-switches as a
 * Settings › Governance tool card (settings-tools.md §4.12; the decision that
 * Settings hosts the switches). jarvis/get_enforcement on first active /
 * Refresh / after each write; jarvis/set_enforcement with the confirm rules:
 * safety ON→OFF and capability OFF→ON ask first, the other direction does not.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { t } from "../../../i18n";
import { haDefined } from "../../../ha";
import { WsError } from "../../../ws";
import { confirmDialog } from "../../../components";
import { registerToolCard } from "../registry";
import { JarvisToolCard, wsMessage } from "./runtime-base";

export interface EnforcementSwitch {
  key: string;
  name: string;
  explanation: string;
  category: "capability" | "safety" | string;
  phase: string;
  default: boolean;
  enabled: boolean;
  overridden: boolean;
}

/** First sentence of a paragraph (the <details> summary on narrow). */
function firstSentence(s: string): string {
  const m = /^(.*?[.!?])(\s|$)/.exec(s.trim());
  return m ? m[1] : s;
}

@customElement("jarvis-tool-governance")
export class JarvisToolGovernance extends JarvisToolCard {
  @state() private _switches: EnforcementSwitch[] | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;
  @state() private _busy: Record<string, boolean> = {};

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
        font-weight: var(--jv-font-weight-medium);
      }
      .sw {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-1) var(--jv-space-3);
        align-items: start;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
      }
      .sw .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .sw .name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .phase {
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
      }
      .exp {
        grid-column: 1;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      details.exp summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
      }
      details.exp p {
        margin: 0 0 var(--jv-space-2);
      }
      /* a <label>: the whole block toggles the native fallback switch */
      .ctl {
        grid-row: 1 / span 2;
        grid-column: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 48px;
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .ctl .lbl {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .ctl input {
        width: 40px;
        height: 24px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
    `,
  ];

  protected override onFirstActive(): void {
    void this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = null;
    try {
      const res = await this.ws<{ switches?: EnforcementSwitch[] }>("jarvis/get_enforcement");
      this._switches = Array.isArray(res?.switches) ? res.switches : [];
    } catch (err) {
      this._error = wsMessage(WsError.from("jarvis/get_enforcement", err));
    } finally {
      this._loading = false;
    }
  }

  private async _toggle(sw: EnforcementSwitch, next: boolean): Promise<void> {
    if (this._busy[sw.key] || next === !!sw.enabled) return;
    let ok = true;
    if (sw.category === "safety" && !next) {
      ok = await confirmDialog({
        heading: t('Turn OFF the safety enforcement "{name}"?', { name: sw.name }),
        message: t("This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging."),
        confirmLabel: t("Turn off"),
        destructive: true,
      });
    } else if (sw.category === "capability" && next) {
      ok = await confirmDialog({
        heading: t('Enable "{name}"?', { name: sw.name }),
        message: t("This makes the kernel authoritative for that capability."),
        confirmLabel: t("Enable"),
      });
    }
    if (!ok) {
      this.requestUpdate(); // live() snaps the control back
      return;
    }
    this._busy = { ...this._busy, [sw.key]: true };
    try {
      const res = await this.ws<{ switch?: EnforcementSwitch }>("jarvis/set_enforcement", { key: sw.key, enabled: next });
      const written = res?.switch && res.switch.key === sw.key ? res.switch : { ...sw, enabled: next, overridden: true };
      this._switches = (this._switches ?? []).map((s) => (s.key === sw.key ? written : s));
      this.toast(t("{name} → {state}", { name: sw.name, state: written.enabled ? t("ON") : t("OFF") }));
      void this._load();
    } catch (err) {
      const e = WsError.from("jarvis/set_enforcement", err);
      this.toast(t("{name} — {message}", { name: sw.name, message: wsMessage(e) }));
      this.requestUpdate();
    } finally {
      const { [sw.key]: _done, ...rest } = this._busy;
      this._busy = rest;
    }
  }

  // ── render ──────────────────────────────────────────────────────────────

  private _renderControl(sw: EnforcementSwitch) {
    const on = !!sw.enabled;
    const disabled = this.offline || !!this._busy[sw.key];
    const onChange = (e: Event) => void this._toggle(sw, !!(e.target as HTMLInputElement).checked);
    return html`
      <label class="ctl">
        ${haDefined("ha-switch")
          ? html`<ha-switch .checked=${live(on)} .disabled=${disabled} aria-label=${sw.name} @change=${onChange}></ha-switch>`
          : html`<input type="checkbox" role="switch" .checked=${live(on)} ?disabled=${disabled} aria-label=${sw.name} @change=${onChange} />`}
        <span class="lbl" aria-hidden="true">${on ? t("ON") : t("OFF")}</span>
      </label>
    `;
  }

  private _renderExplanation(sw: EnforcementSwitch) {
    if (!sw.explanation) return nothing;
    if (!this.narrow) return html`<p class="exp">${sw.explanation}</p>`;
    return html`
      <details class="exp">
        <summary>${firstSentence(sw.explanation)}</summary>
        <p>${sw.explanation}</p>
      </details>
    `;
  }

  private _renderGroup(heading: string, sub: string, items: EnforcementSwitch[]) {
    if (!items.length) return nothing;
    return html`
      <fieldset>
        <legend>${heading}</legend>
        ${sub ? html`<p class="note">${sub}</p>` : nothing}
        <ul class="plain">
          ${items.map(
            (sw) => html`
              <li class="sw">
                <div class="head">
                  <span class="name">${sw.name}</span>
                  ${sw.phase ? html`<span class="phase jv-mono">${sw.phase}</span>` : nothing}
                  ${sw.overridden ? html`<jv-state-badge level="warn" nodot .label=${t("overridden")}></jv-state-badge>` : nothing}
                  ${!!sw.enabled !== !!sw.default
                    ? html`<jv-state-badge level="neutral" nodot .label=${sw.default ? t("default: ON") : t("default: OFF")}></jv-state-badge>`
                    : nothing}
                </div>
                ${this._renderControl(sw)}
                ${this._renderExplanation(sw)}
              </li>
            `,
          )}
        </ul>
      </fieldset>
    `;
  }

  private _renderBody() {
    if (this._error) return this.renderError(t("Couldn't load governance switches — {message}", { message: this._error }), () => void this._load());
    const list = this._switches;
    if (!list) return html`<jv-empty kind="loading" .heading=${t("Loading governance switches…")}></jv-empty>`;
    if (!list.length) return html`<p class="note">${t("No governance switches reported.")}</p>`;
    const caps = list.filter((s) => s.category === "capability");
    const safety = list.filter((s) => s.category === "safety");
    const other = list.filter((s) => s.category !== "capability" && s.category !== "safety");
    return html`
      ${this._renderGroup(
        t("Owner opt-in capabilities"),
        t("These ship OFF. Turning one ON makes the kernel authoritative for that capability — your choice, behaviour-changing."),
        caps,
      )}
      ${this._renderGroup(
        t("Safety & governance — kill-switches (keep ON)"),
        t("These ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only) — only for debugging."),
        safety,
      )}
      ${this._renderGroup(t("Enforcement"), "", other)}
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Governance")} .subheading=${t("Enforcement")} icon="mdi:shield-check-outline" .loading=${this._loading}>
        ${this.renderIconButton("mdi:refresh", t("Refresh"), () => void this._load(), this.offline || this._loading, "actions")}
        <p class="intro">${t("JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and survive a restart.")}</p>
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

registerToolCard("governance", {
  id: "governance",
  title: "Governance",
  element: "jarvis-tool-governance",
  icon: "mdi:shield-check-outline",
  keywords: ["enforcement", "kill-switch", "kernel", "capability", "safety"],
});

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-governance": JarvisToolGovernance;
  }
}
