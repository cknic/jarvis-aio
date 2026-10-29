/**
 * <jv-kv label="Uptime" value="6m"></jv-kv>
 * <jv-kv label="Observer"><jv-state-badge level="ok" label="Running"></jv-state-badge></jv-kv>
 *
 * One key/value row (label left, value right, wraps on narrow). `mono`
 * renders the value in the code font with tabular numbers; `stacked` puts
 * the value under the label (for long values).
 */
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../theme/base";

@customElement("jv-kv")
export class JvKv extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) value = "";
  @property({ type: Boolean, reflect: true }) mono = false;
  @property({ type: Boolean, reflect: true }) stacked = false;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        min-height: 40px;
        padding: var(--jv-space-1) 0;
        border-bottom: 1px solid var(--jv-divider);
      }
      :host(:last-of-type),
      :host([nodivider]) {
        border-bottom: 0;
      }
      :host([stacked]) {
        flex-direction: column;
        align-items: stretch;
        gap: 2px;
      }
      .label {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        flex: 1 1 auto;
        min-width: 0;
      }
      .value {
        color: var(--jv-text);
        text-align: right;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      :host([stacked]) .value {
        text-align: left;
      }
      :host([mono]) .value {
        font-family: var(--jv-font-code);
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  override render() {
    return html`
      <span class="label">${this.label}</span>
      <span class="value"><slot>${this.value}</slot></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-kv": JvKv;
  }
}
