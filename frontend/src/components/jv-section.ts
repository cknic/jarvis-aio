/**
 * <jv-section heading="Areas" subheading="4 monitored" icon="mdi:home">
 *   ...content...
 *   <ha-icon-button slot="actions" ...></ha-icon-button>
 * </jv-section>
 *
 * A titled card: wraps <ha-card> when HA has defined it, otherwise a div
 * styled with the card tokens (same look). `flush` removes the content
 * padding (for lists / tables that run edge to edge). `loading` shows a thin
 * progress line under the header.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../theme/base";
import { haDefined, watchDefinitions } from "../ha";

@customElement("jv-section")
export class JvSection extends LitElement {
  @property({ type: String }) heading = "";
  @property({ type: String }) subheading = "";
  @property({ type: String }) icon = "";
  @property({ type: Boolean, reflect: true }) flush = false;
  @property({ type: Boolean, reflect: true }) loading = false;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        padding: var(--jv-space-4) var(--jv-space-4) 0;
        min-height: 24px;
      }
      :host([flush]) .head {
        padding-bottom: var(--jv-space-3);
      }
      .head ha-icon {
        color: var(--jv-text-2);
        --mdc-icon-size: 22px;
        flex: none;
      }
      .titles {
        flex: 1 1 auto;
        min-width: 0;
      }
      h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sub {
        margin: 2px 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--jv-space-1);
        margin-right: calc(-1 * var(--jv-space-2));
        flex: none;
      }
      .progress {
        height: 2px;
        margin: var(--jv-space-2) var(--jv-space-4) 0;
        background: var(--jv-accent-soft);
        overflow: hidden;
        border-radius: 1px;
      }
      .progress::after {
        content: "";
        display: block;
        width: 40%;
        height: 100%;
        background: var(--jv-accent);
      }
      .body {
        padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
      }
      :host([flush]) .body {
        padding: 0;
      }
      .head:empty + .body {
        padding-top: var(--jv-space-4);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-card", "ha-icon"]);
  }

  private _inner() {
    const hasHead = !!(this.heading || this.subheading || this.icon);
    return html`
      ${hasHead
        ? html`
            <div class="head">
              ${this.icon && haDefined("ha-icon") ? html`<ha-icon .icon=${this.icon}></ha-icon>` : nothing}
              <div class="titles">
                ${this.heading ? html`<h2>${this.heading}</h2>` : nothing}
                ${this.subheading ? html`<p class="sub">${this.subheading}</p>` : nothing}
              </div>
              <div class="actions"><slot name="actions"></slot></div>
            </div>
          `
        : nothing}
      ${this.loading ? html`<div class="progress" role="progressbar" aria-busy="true"></div>` : nothing}
      <div class="body"><slot></slot></div>
    `;
  }

  override render() {
    return haDefined("ha-card")
      ? html`<ha-card>${this._inner()}</ha-card>`
      : html`<div class="jv-card">${this._inner()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-section": JvSection;
  }
}
