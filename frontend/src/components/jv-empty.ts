/**
 * <jv-empty icon="mdi:inbox-outline" heading="Nothing yet" message="...">
 *   <button slot="action">Add one</button>
 * </jv-empty>
 *
 * The empty / loading / error state block. `kind="loading"` shows a skeleton
 * and `kind="error"` tints the icon with --jv-danger. Pass translated strings.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../theme/base";
import { haDefined, watchDefinitions } from "../ha";

@customElement("jv-empty")
export class JvEmpty extends LitElement {
  @property({ type: String }) icon = "mdi:inbox-outline";
  @property({ type: String }) heading = "";
  @property({ type: String }) message = "";
  @property({ type: String, reflect: true }) kind: "empty" | "loading" | "error" = "empty";
  /** compact variant for inside a card */
  @property({ type: Boolean, reflect: true }) compact = false;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: var(--jv-space-2);
        padding: var(--jv-space-5) var(--jv-space-4);
        color: var(--jv-text-2);
        min-height: 160px;
      }
      :host([compact]) {
        min-height: 0;
        padding: var(--jv-space-4);
      }
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        --mdc-icon-size: 28px;
      }
      :host([kind="error"]) .icon {
        background: var(--jv-danger-soft);
        color: var(--jv-danger);
      }
      :host([compact]) .icon {
        width: 40px;
        height: 40px;
        --mdc-icon-size: 22px;
      }
      .heading {
        margin: 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
      }
      .message {
        margin: 0;
        max-width: 42ch;
        font-size: var(--jv-font-size-m);
      }
      .skeleton {
        width: min(100%, 280px);
        display: grid;
        gap: var(--jv-space-2);
      }
      .skeleton .jv-skeleton:nth-child(2) {
        width: 70%;
      }
      ::slotted([slot="action"]) {
        margin-top: var(--jv-space-2);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon"]);
  }

  override render() {
    if (this.kind === "loading") {
      return html`
        <div class="skeleton" role="status" aria-live="polite" aria-label=${this.heading || this.message || "…"}>
          <div class="jv-skeleton"></div>
          <div class="jv-skeleton"></div>
        </div>
        ${this.message ? html`<p class="message">${this.message}</p>` : nothing}
      `;
    }
    return html`
      <div class="icon" aria-hidden="true">
        ${haDefined("ha-icon") ? html`<ha-icon .icon=${this.icon}></ha-icon>` : nothing}
      </div>
      ${this.heading ? html`<h3 class="heading">${this.heading}</h3>` : nothing}
      ${this.message ? html`<p class="message">${this.message}</p>` : nothing}
      <slot name="action"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-empty": JvEmpty;
  }
}
