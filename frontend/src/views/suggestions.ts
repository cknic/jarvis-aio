/**
 * <jarvis-view-suggestions> - what JARVIS has learned and is working toward:
 * pending automation suggestions (approve / dismiss / preview), goals, and the
 * routine-learning status with "Analyze Now". Spec: frontend/specs/suggestions.md.
 *
 * The view is a thin layout over three cards in src/views/suggestions/; it owns
 * the toast region (aria-live) the cards report into via "jv-toast" and the
 * footer link to the learning settings.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined } from "../ha";
import "../components";
import "./suggestions/suggestion-list";
import "./suggestions/goals-card";
import "./suggestions/learning-card";
import type { Suggestion, Goal, ToastDetail } from "./suggestions/types";

const TOAST_MS = 6000;

@customElement("jarvis-view-suggestions")
export class JarvisViewSuggestions extends JarvisView {
  @state() private _toast: ToastDetail | null = null;
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  static override styles = [
    base,
    css`
      :host {
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      /* Two columns when the VIEW (not the viewport) is wide enough and HA
         does not consider the screen narrow. */
      @container (min-width: 900px) {
        .layout:not(.narrow) {
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        }
      }
      .col {
        display: grid;
        gap: var(--jv-space-4);
        min-width: 0;
      }
      .footer {
        padding: var(--jv-space-2) 0 0;
      }
      .footer button {
        appearance: none;
        border: 0;
        background: transparent;
        padding: var(--jv-space-2) 0;
        min-height: var(--jv-tap);
        font: inherit;
        color: var(--jv-accent);
        cursor: pointer;
        text-decoration: underline;
      }
      .toast {
        position: sticky;
        bottom: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .toast > div {
        pointer-events: auto;
        max-width: min(100%, 560px);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-left: 4px solid var(--jv-info);
        box-shadow: var(--jv-shadow);
        overflow-wrap: anywhere;
      }
      /* on narrow the panel's sticky bottom nav (56px + safe area) sits over
         the end of the scroll area; keep the toast above it */
      .toast.narrow {
        bottom: calc(var(--jv-tap) + var(--jv-space-3) + var(--jv-space-4) + env(safe-area-inset-bottom, 0px));
      }
      .toast.ok > div {
        border-left-color: var(--jv-ok);
      }
      .toast.danger > div {
        border-left-color: var(--jv-danger);
      }
    `,
  ];

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = null;
  }

  private _onToast(e: Event): void {
    const detail = (e as CustomEvent<ToastDetail>).detail;
    if (!detail || !detail.message) return;
    e.stopPropagation();
    // Inside Home Assistant the root element shows its own toast for this event;
    // elsewhere (harness, tests) fall back to the inline live region.
    if (haDefined("home-assistant")) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", { detail: { message: detail.message }, bubbles: true, composed: true }),
      );
      return;
    }
    this._toast = detail;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toastTimer = null;
      this._toast = null;
    }, TOAST_MS);
  }

  private get _suggestions(): Suggestion[] | null {
    if (!this.data) return null;
    const list = this.data.suggestions;
    return Array.isArray(list) ? (list as unknown as Suggestion[]) : [];
  }

  private get _goals(): Goal[] | null {
    if (!this.data) return null;
    const list = this.data.goals;
    return Array.isArray(list) ? (list as unknown as Goal[]) : [];
  }

  override render() {
    return html`
      <div class="layout ${this.narrow ? "narrow" : ""}" @jv-toast=${this._onToast}>
        <div class="col">
          <jarvis-suggestions-list .hass=${this.hass} .suggestions=${this._suggestions}></jarvis-suggestions-list>
          <jarvis-suggestions-goals .hass=${this.hass} .goals=${this._goals}></jarvis-suggestions-goals>
        </div>
        <div class="col">
          <jarvis-suggestions-learning .hass=${this.hass} .data=${this.data}></jarvis-suggestions-learning>
          <div class="footer">
            <button type="button" @click=${() => this.navigate("settings", "learning")}>${t("Learning settings")}</button>
          </div>
        </div>
      </div>
      <div class="toast ${this._toast?.tone ?? ""} ${this.narrow ? "narrow" : ""}" role="status" aria-live="polite" aria-atomic="true">
        ${this._toast ? html`<div>${this._toast.message}</div>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-suggestions": JarvisViewSuggestions;
  }
}
