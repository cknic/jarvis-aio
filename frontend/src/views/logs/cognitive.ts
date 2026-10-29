/**
 * <jv-logs-cognitive> - the Cognitive Core card (jarvis/get_cognitive_status):
 * learning counters, a secondary row of runtime counters and the last
 * pattern-analysis result. The payload never rejects; `error` is shown as
 * secondary text and every number defaults to 0.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import "../../components";
import { ago, cardStyles, num } from "./format";
import type { CognitiveStatus } from "./types";

@customElement("jv-logs-cognitive")
export class JvLogsCognitive extends LitElement {
  /** null until the first load */
  @property({ attribute: false }) status: CognitiveStatus | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
        gap: var(--jv-space-2);
      }
      .tile {
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        min-width: 0;
      }
      .tile .v {
        display: block;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      .tile .k {
        display: block;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .secondary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-4);
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        list-style: none;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .secondary b {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .line {
        margin: var(--jv-space-3) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
    `,
  ];

  private _tile(label: string, value: string) {
    return html`<div class="tile"><span class="v">${value}</span><span class="k">${label}</span></div>`;
  }

  override render() {
    const s = this.status;
    const loaded = s !== null;
    const running = !!s?.running && !s?.error;
    const learning = s?.learning ?? {};
    const last = s?.last_analysis ?? {};
    return html`
      <jv-section .heading=${t("Cognitive Core")} icon="mdi:brain" .loading=${!loaded}>
        ${loaded
          ? html`<jv-state-badge
              slot="actions"
              level=${running ? "ok" : "neutral"}
              .label=${running ? t("Running") : t("Stopped")}
            ></jv-state-badge>`
          : nothing}
        ${!loaded
          ? html`<div class="state" role="status">${t("Loading...")}</div>`
          : html`
              <div class="grid">
                ${this._tile(t("Data"), `${num(learning.days_of_data)}d`)}
                ${this._tile(t("States"), num(learning.state_changes))}
                ${this._tile(t("Cmds"), num(learning.commands))}
                ${this._tile(t("Suggestions"), num(learning.suggestions))}
                ${this._tile(t("Ignores"), num(s?.ignore_rules))}
              </div>
              <ul class="secondary">
                <li>${t("Uptime")} <b>${num(s?.uptime_hours)}h</b></li>
                <li>${t("Ticks")} <b>${num(s?.tick_count)}</b></li>
                <li>${t("Autonomous")} <b>${num(s?.autonomous_actions)}</b></li>
                <li>${t("Offers")} <b>${num(s?.offers_made)}</b></li>
              </ul>
              <p class="line">
                ${last.ts
                  ? t("Last analysis: {ago} · {found} found, {stored} stored", {
                      ago: ago(last.ts),
                      found: num(last.patterns_found),
                      stored: num(last.new_suggestions),
                    })
                  : t("Last analysis: not yet this session")}
              </p>
              ${s?.error ? html`<p class="sub">${s.error}</p>` : nothing}
            `}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-cognitive": JvLogsCognitive;
  }
}
