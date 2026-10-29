/**
 * <jv-logs-governance> - the Governance card: the kernel's enforce
 * kill-switches (jarvis/get_enforcement, read by the view) with a confirmed
 * toggle (jarvis/set_enforcement, written here). Turning a safety guard OFF
 * or an opt-in capability ON asks first; the other direction does not.
 * After a successful write the card fires "jv-logs-enforcement-changed" so
 * the view re-reads the list, and "hass-notification" {message} for HA's
 * toast.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws, WsError } from "../../ws";
import { haDefined, watchDefinitions } from "../../ha";
import type { Hass } from "../../types";
import { confirmDialog } from "../../components";
import "../../components";
import { cardStyles } from "./format";
import type { EnforcementSwitch, SetEnforcementResponse } from "./types";

@customElement("jv-logs-governance")
export class JvLogsGovernance extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** null until the first load */
  @property({ attribute: false }) switches: EnforcementSwitch[] | null = null;
  @property({ type: String }) error: string | null = null;

  /** optimistic / post-write values until the next get_enforcement */
  @state() private _local: Record<string, boolean> = {};
  @state() private _busy: Record<string, boolean> = {};
  @state() private _status = "";

  static override styles = [
    base,
    cardStyles,
    css`
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
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
      .switches {
        list-style: none;
        margin: var(--jv-space-2) 0 0;
        padding: 0;
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
        font-weight: var(--jv-font-weight-bold);
        overflow-wrap: anywhere;
      }
      .tag {
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
      }
      .tag.over {
        background: var(--jv-warn-soft);
        color: var(--jv-text);
      }
      .sw .exp {
        grid-column: 1;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      /* a <label>: the whole 48 x 44 block toggles the native fallback switch */
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
      .status {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-switch", "ha-alert"]);
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    // a fresh list from the backend is authoritative
    if (changed.has("switches") && this.switches) this._local = {};
  }

  private _enabled(sw: EnforcementSwitch): boolean {
    return sw.key in this._local ? this._local[sw.key] : !!sw.enabled;
  }

  private _notify(message: string): void {
    this._status = message;
    this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } }));
  }

  private async _toggle(sw: EnforcementSwitch, next: boolean): Promise<void> {
    if (this._busy[sw.key]) return;
    const prev = this._enabled(sw);
    if (next === prev) return;
    let ok = true;
    if (sw.category === "safety" && !next) {
      ok = await confirmDialog({
        heading: t('Turn OFF the safety enforcement "{name}"?', { name: sw.name }),
        message: t("This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging."),
        confirmLabel: t("Turn off"),
        cancelLabel: t("Cancel"),
        destructive: true,
      });
    } else if (sw.category === "capability" && next) {
      ok = await confirmDialog({
        heading: t('Enable "{name}"?', { name: sw.name }),
        message: t("This makes the kernel authoritative for that capability."),
        confirmLabel: t("Enable"),
        cancelLabel: t("Cancel"),
      });
    }
    if (!ok) {
      // snap the control back (live() re-applies the unchanged value)
      this._local = { ...this._local, [sw.key]: prev };
      return;
    }
    this._busy = { ...this._busy, [sw.key]: true };
    this._local = { ...this._local, [sw.key]: next };
    try {
      const res = await ws<SetEnforcementResponse>(this.hass, "jarvis/set_enforcement", { key: sw.key, enabled: next });
      const written = res?.switch && res.switch.key === sw.key ? !!res.switch.enabled : next;
      this._local = { ...this._local, [sw.key]: written };
      this._notify(t(written ? "✓ {name} → ON" : "✓ {name} → OFF", { name: sw.name }));
      this.dispatchEvent(new CustomEvent("jv-logs-enforcement-changed", { bubbles: true, composed: true }));
    } catch (err) {
      const e = WsError.from("jarvis/set_enforcement", err);
      this._local = { ...this._local, [sw.key]: prev };
      this._notify(t("✗ {name} — {message}", { name: sw.name, message: e.message || e.code }));
    } finally {
      const { [sw.key]: _done, ...rest } = this._busy;
      this._busy = rest;
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _renderControl(sw: EnforcementSwitch) {
    const on = this._enabled(sw);
    const busy = !!this._busy[sw.key];
    const onChange = (e: Event) => void this._toggle(sw, !!(e.target as HTMLInputElement).checked);
    return html`
      <label class="ctl">
        ${haDefined("ha-switch")
          ? html`<ha-switch .checked=${live(on)} .disabled=${busy} aria-label=${sw.name} @change=${onChange}></ha-switch>`
          : html`<input type="checkbox" role="switch" .checked=${live(on)} ?disabled=${busy} aria-label=${sw.name} @change=${onChange} />`}
        <span class="lbl" aria-hidden="true">${on ? t("ON") : t("OFF")}</span>
      </label>
    `;
  }

  private _renderGroup(heading: string, sub: string, items: EnforcementSwitch[]) {
    if (!items.length) return nothing;
    return html`
      <fieldset>
        <legend>${heading}</legend>
        <p class="sub">${sub}</p>
        <ul class="switches">
          ${items.map(
            (sw) => html`
              <li class="sw">
                <div class="head">
                  <span class="name">${sw.name}</span>
                  ${sw.phase ? html`<span class="tag">${sw.phase}</span>` : nothing}
                  ${sw.overridden ? html`<span class="tag over">${t("overridden")}</span>` : nothing}
                </div>
                ${this._renderControl(sw)}
                ${sw.explanation ? html`<p class="exp">${sw.explanation}</p>` : nothing}
              </li>
            `,
          )}
        </ul>
      </fieldset>
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
    const other = this.switches.filter((s) => s.category !== "capability" && s.category !== "safety");
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
      ${other.length ? this._renderGroup(t("Enforcement"), "", other) : nothing}
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Governance")} icon="mdi:shield-check-outline" .loading=${this.switches === null && !this.error}>
        <jv-state-badge slot="actions" nodot level="accent" .label=${t("Enforcement")}></jv-state-badge>
        <p class="intro">
          ${t(
            "JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and survive a restart.",
          )}
        </p>
        ${this._renderBody()}
        <p class="status" role="status" aria-live="polite">${this._status}</p>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-governance": JvLogsGovernance;
  }
}
