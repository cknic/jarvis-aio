/**
 * <jarvis-docs-clamp .text=${chunk}> - a passage rendered as text (never
 * HTML), pre-wrapped, clamped to 4 lines with a Show more / Show less toggle.
 * The clamp (overflow: hidden) is only applied while the toggle is visible, so
 * text is never clipped without a way to read it (DESIGN.md §3).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { isLongText } from "./format";

@customElement("jarvis-docs-clamp")
export class JarvisDocsClamp extends LitElement {
  @property({ type: String }) text = "";
  @state() private _expanded = false;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      p {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      p.clamped {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        overflow: hidden;
      }
      .toggle {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin-top: var(--jv-space-1);
        color: var(--jv-accent-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
      }
    `,
  ];

  override render() {
    const long = isLongText(this.text);
    const clamped = long && !this._expanded;
    return html`
      <p class=${clamped ? "clamped" : ""}>${this.text}</p>
      ${long
        ? html`<button
            class="toggle jv-hit"
            type="button"
            aria-expanded=${this._expanded ? "true" : "false"}
            @click=${() => (this._expanded = !this._expanded)}
          >
            ${this._expanded ? t("Show less") : t("Show more")}
          </button>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-docs-clamp": JarvisDocsClamp;
  }
}
