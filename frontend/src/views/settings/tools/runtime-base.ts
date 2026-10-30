/**
 * Shared base for the Settings tool cards (frontend/specs/settings-tools.md
 * §3.3, ./README.md "Tool cards"): the properties the view sets (`hass`,
 * `data`, `narrow`, `host`, `active`, the `flash` attribute), the
 * fetch-on-first-active hook, HA-element fallbacks (alert, icon button,
 * select) and the common styles. Each tool renders its own <jv-section> and
 * owns its loading / empty / error states (DESIGN.md §6).
 */
import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { haDefined, watchDefinitions } from "../../../ha";
import { ws as wsCall, WsError } from "../../../ws";
import type { Hass, PanelData, JarvisNavigateDetail } from "../../../types";
import type { SettingsHost, ToolCardElement } from "../registry";
import "../../../components";

export type AlertType = "error" | "warning" | "info" | "success";

/** HA tags every tool card may render; re-render when one arrives lazily. */
export const TOOL_HA_TAGS = ["ha-icon", "ha-icon-button", "ha-alert", "ha-switch", "ha-select", "ha-list-item", "mwc-list-item"];

/** The user-facing text for a failed command (unknown_command gets the spec's fixed line). */
export function wsMessage(err: WsError): string {
  if (err.code === "unknown_command") return t("Not available on this backend — update the JARVIS integration.");
  return err.message || err.code;
}

/** `hass.states[id].friendly_name`, the id when unknown (never throws for a stale id). */
export function friendlyName(hass: Hass | undefined, id: string): string {
  const name = hass?.states?.[id]?.attributes?.friendly_name;
  return typeof name === "string" && name ? name : id;
}

export const toolStyles = css`
  :host {
    display: block;
    min-width: 0;
    border-radius: var(--jv-radius);
    transition: box-shadow var(--jv-ease);
  }
  :host([flash]) {
    box-shadow: 0 0 0 var(--jv-space-2) var(--jv-accent-soft);
  }
  .intro,
  .note {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .note {
    margin: var(--jv-space-2) 0 0;
  }
  .status {
    margin: var(--jv-space-2) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .status.err {
    color: var(--jv-danger-text);
  }
  .status.ok {
    color: var(--jv-ok-text);
  }
  .alert {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-2);
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    border-left: 4px solid var(--jv-info);
    background: var(--jv-info-soft);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .alert.error {
    border-left-color: var(--jv-danger);
    background: var(--jv-danger-soft);
  }
  .alert.warning {
    border-left-color: var(--jv-warn);
    background: var(--jv-warn-soft);
  }
  .alert.success {
    border-left-color: var(--jv-ok);
    background: var(--jv-ok-soft);
  }
  .alert .actions,
  ha-alert .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
  }
  ha-alert {
    display: block;
    margin: 0 0 var(--jv-space-3);
  }
  .actions-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    margin-top: var(--jv-space-3);
  }
  :host([narrow]) .actions-row .jv-btn.primary {
    width: 100%;
  }
  .link {
    appearance: none;
    display: inline-flex;
    align-items: center;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-2);
    border: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-size: var(--jv-font-size-s);
    text-decoration: underline;
    cursor: pointer;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
  }
  .head-meta {
    display: inline-flex;
    align-items: center;
    gap: var(--jv-space-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  h3 {
    margin: var(--jv-space-4) 0 var(--jv-space-2);
    font-size: var(--jv-font-size-m);
    font-weight: var(--jv-font-weight-medium);
  }
  ul.plain {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  select {
    min-height: var(--jv-tap);
    max-width: 100%;
    padding: 0 var(--jv-space-2);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .sr-status {
    margin: var(--jv-space-2) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
`;

export class JarvisToolCard extends LitElement implements ToolCardElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ attribute: false }) host?: SettingsHost;
  /** true while the card's category is on screen; fetch on the first true */
  @property({ type: Boolean }) active = false;
  @property({ type: Boolean, reflect: true }) flash = false;

  static override styles = [base, toolStyles];

  private _activated = false;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, TOOL_HA_TAGS);
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (!this._activated && this.active && this.hass) {
      this._activated = true;
      this.onFirstActive();
    }
  }

  /** Called once, the first time the card is active with a live `hass`. */
  protected onFirstActive(): void {
    /* override */
  }

  /** every control is disabled while hass is missing (the view shows its offline banner) */
  protected get offline(): boolean {
    return !this.hass;
  }

  protected ws<T = unknown>(type: string, payload?: Record<string, unknown>): Promise<T> {
    return wsCall<T>(this.hass, type, payload);
  }

  protected value(key: string): unknown {
    return this.host?.value(key);
  }

  protected toast(message: string): void {
    if (this.host) this.host.toast(message);
    else this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  protected navigate(view: string, path?: string): void {
    const detail: JarvisNavigateDetail = { view, path };
    this.dispatchEvent(new CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail }));
  }

  // ── shared render helpers ────────────────────────────────────────────────

  protected renderAlert(type: AlertType, body: unknown, actions?: TemplateResult | typeof nothing) {
    const acts = actions && actions !== nothing ? html`<div class="actions">${actions}</div>` : nothing;
    if (haDefined("ha-alert")) {
      return html`<ha-alert alert-type=${type}>${body}${acts}</ha-alert>`;
    }
    const role = type === "error" || type === "warning" ? "alert" : "status";
    return html`<div class="alert ${type}" role=${role}><span>${body}</span>${acts}</div>`;
  }

  protected renderError(message: string, retry?: () => void) {
    const btn = retry ? html`<button type="button" class="jv-btn" @click=${retry}>${t("Retry")}</button>` : nothing;
    return this.renderAlert("error", message, btn);
  }

  protected renderIconButton(icon: string, label: string, onClick: () => void, disabled = false, slot?: string) {
    if (haDefined("ha-icon-button")) {
      return html`<ha-icon-button slot=${slot ?? nothing} .label=${label} title=${label} .disabled=${disabled} @click=${onClick}>
        ${haDefined("ha-icon") ? html`<ha-icon .icon=${icon}></ha-icon>` : html`<span aria-hidden="true">↻</span>`}
      </ha-icon-button>`;
    }
    return html`<button slot=${slot ?? nothing} type="button" class="jv-icon-btn" aria-label=${label} title=${label} ?disabled=${disabled} @click=${onClick}>
      ${haDefined("ha-icon") ? html`<ha-icon .icon=${icon}></ha-icon>` : html`<span aria-hidden="true">↻</span>`}
    </button>`;
  }

  protected renderLink(label: string, onClick: () => void) {
    return html`<button type="button" class="link" @click=${onClick}>${label}</button>`;
  }
}
