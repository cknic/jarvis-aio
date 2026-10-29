/**
 * <jv-intrusion-settings .hass=${hass} .config=${data?.config}> - the
 * "Response settings" fieldset of the Intrusion card: the auto-escalate
 * timeout select and the three intrusion switches, each written with
 * `jarvis/update_config {key, value}` (a real Number / boolean, never a
 * string). Optimistic update from the echoed value, roll back + toast on
 * failure, and `jarvis-refresh` after a successful write so the snapshot
 * catches up. Controls stay disabled until the snapshot (`config`) exists.
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { ws } from "../../ws";
import { t, onLanguageChange } from "../../i18n";
import type { Hass } from "../../types";
import { TIMEOUT_OPTIONS, errorMessage, notify } from "./shared";

export type IntrusionSettingKey =
  | "intrusion_response_timeout"
  | "intrusion_vision_confirm"
  | "intrusion_vision_veto"
  | "intrusion_requires_confinement";

@customElement("jv-intrusion-settings")
export class JvIntrusionSettings extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) config: Record<string, unknown> | null | undefined = null;

  @state() private _pending = new Set<string>();
  @state() private _override: Record<string, unknown> = {};

  private _unsubLang?: () => void;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      fieldset {
        border: 0;
        margin: var(--jv-space-3) 0 0;
        padding: var(--jv-space-3) 0 0;
        border-top: 1px solid var(--jv-divider);
        min-width: 0;
      }
      legend {
        padding: 0;
        margin-bottom: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text-2);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        margin: 0 0 var(--jv-space-3);
      }
      .field > span {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      select {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        max-width: 100%;
      }
      ha-select {
        display: block;
        margin: 0 0 var(--jv-space-3);
      }
      .switch {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
        min-height: var(--jv-tap);
        padding: var(--jv-space-1) 0;
        cursor: pointer;
      }
      .switch input {
        flex: none;
        width: 20px;
        height: 20px;
        margin: 2px 0 0;
        accent-color: var(--jv-accent);
      }
      .switch span {
        font-size: var(--jv-font-size-s);
        line-height: 1.4;
      }
      ha-formfield {
        display: block;
        margin: 0 0 var(--jv-space-2);
        --ha-formfield-align-items: flex-start;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-switch", "ha-formfield", "ha-select", "ha-list-item"]);
    this._unsubLang = onLanguageChange(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubLang?.();
    this._unsubLang = undefined;
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("config") && this.config && Object.keys(this._override).length) {
      // drop optimistic overrides once the snapshot agrees with them
      const next = { ...this._override };
      let dirty = false;
      for (const k of Object.keys(next)) {
        if (String(this.config[k]) === String(next[k])) {
          delete next[k];
          dirty = true;
        }
      }
      if (dirty) this._override = next;
    }
  }

  private _cfg(key: IntrusionSettingKey): unknown {
    if (key in this._override) return this._override[key];
    return this.config?.[key];
  }

  private async _write(key: IntrusionSettingKey, value: number | boolean): Promise<void> {
    if (this._pending.has(key)) return;
    this._pending = new Set([...this._pending, key]);
    this._override = { ...this._override, [key]: value }; // optimistic
    try {
      const res = await ws<{ key?: string; value?: unknown }>(this.hass, "jarvis/update_config", { key, value });
      const echoed = res && typeof res === "object" && "value" in res ? res.value : value;
      this._override = { ...this._override, [key]: echoed ?? value };
      notify(this, t("Saved"));
      this.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
    } catch (err) {
      const next = { ...this._override };
      delete next[key];
      this._override = next; // roll back
      notify(this, `${key} — ${errorMessage(err)}`);
    } finally {
      const p = new Set(this._pending);
      p.delete(key);
      this._pending = p;
    }
  }

  private _onTimeout(e: Event): void {
    const raw = (e.target as HTMLSelectElement | null)?.value;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return;
    const current = Number(this._cfg("intrusion_response_timeout")) || 120;
    if (v === current) return;
    void this._write("intrusion_response_timeout", v);
  }

  private _renderTimeout(disabled: boolean) {
    const current = Number(this._cfg("intrusion_response_timeout")) || 120;
    const opts = TIMEOUT_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }));
    if (!opts.some((o) => o.value === current)) {
      // a value set via the HA number entity (e.g. 90) is shown, never snapped
      opts.push({ value: current, label: t("{n} s", { n: current }) });
      opts.sort((a, b) => a.value - b.value);
    }
    const label = t("Auto-escalate if no response after");
    const busy = disabled || this._pending.has("intrusion_response_timeout");
    if (haDefined("ha-select") && haDefined("ha-list-item")) {
      return html`
        <ha-select
          .label=${label}
          .value=${String(current)}
          ?disabled=${busy}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onTimeout}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          ${opts.map((o) => html`<ha-list-item .value=${String(o.value)}>${o.label}</ha-list-item>`)}
        </ha-select>
      `;
    }
    return html`
      <label class="field">
        <span>${label}</span>
        <select ?disabled=${busy} @change=${this._onTimeout}>
          ${opts.map((o) => html`<option value=${String(o.value)} .selected=${o.value === current}>${o.label}</option>`)}
        </select>
      </label>
    `;
  }

  private _renderSwitch(key: IntrusionSettingKey, checked: boolean, label: string, disabled: boolean) {
    const busy = disabled || this._pending.has(key);
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (!el || !!el.checked === checked) return;
      void this._write(key, !!el.checked);
    };
    if (haDefined("ha-switch") && haDefined("ha-formfield")) {
      return html`
        <ha-formfield .label=${label}>
          <ha-switch .checked=${checked} ?disabled=${busy} @change=${onChange}></ha-switch>
        </ha-formfield>
      `;
    }
    return html`
      <label class="switch">
        <input type="checkbox" role="switch" .checked=${checked} ?disabled=${busy} @change=${onChange} />
        <span>${label}</span>
      </label>
    `;
  }

  override render() {
    const disabled = !this.config;
    return html`
      <fieldset>
        <legend>${t("Response settings")}</legend>
        ${this._renderTimeout(disabled)}
        ${this._renderSwitch(
          "intrusion_vision_confirm",
          this._cfg("intrusion_vision_confirm") !== false,
          t("Confirm Frigate person with JARVIS vision before alarming"),
          disabled,
        )}
        ${this._renderSwitch(
          "intrusion_vision_veto",
          this._cfg("intrusion_vision_veto") !== false,
          t(
            "Stay silent when JARVIS's own cameras clearly show no one (recommended) — turn OFF to stay ever-vigilant and alert on any unanswered activity",
          ),
          disabled,
        )}
        ${this._renderSwitch(
          "intrusion_requires_confinement",
          this._cfg("intrusion_requires_confinement") === true,
          t("Require confinement (Lockdown or armed alarm) for intrusion monitoring"),
          disabled,
        )}
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-intrusion-settings": JvIntrusionSettings;
  }
}
