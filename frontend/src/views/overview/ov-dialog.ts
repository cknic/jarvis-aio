/**
 * <jarvis-ov-dialog open heading="Living Room" @ov-close>
 *   ...content...
 *   <button slot="actions">Close</button>
 * </jarvis-ov-dialog>
 *
 * A small modal used by the overview for the area detail and the lights
 * popover. Wraps <ha-dialog> when HA has defined it (lazy-loaded), otherwise
 * a native <dialog> styled with tokens: focus is trapped by the browser,
 * Escape and a backdrop click close it. Closing is always reported with the
 * "ov-close" event; the owner flips `open` back to false.
 */
import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";

@customElement("jarvis-ov-dialog")
export class JarvisOvDialog extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) heading = "";

  @query("dialog") private _native?: HTMLDialogElement;

  static override styles = [
    base,
    css`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        width: 100%;
        max-width: min(92vw, 480px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .box {
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-3);
      }
      h2 {
        margin: 0 0 var(--jv-space-3);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-3) var(--jv-space-3);
      }
      ha-dialog {
        --mdc-dialog-max-width: 520px;
      }
      @media (max-width: 599px) {
        dialog {
          max-width: 100vw;
          margin: auto 0 0;
          border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        }
        .actions ::slotted(*) {
          flex: 1 1 auto;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-dialog"]);
  }

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has("open") || haDefined("ha-dialog")) return;
    const d = this._native;
    if (!d) return;
    if (this.open && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute("open", "");
      }
    } else if (!this.open && d.open) {
      d.close();
    }
  }

  private _requestClose(): void {
    if (!this.open) return;
    this.dispatchEvent(new CustomEvent("ov-close", { bubbles: true, composed: true }));
  }

  private _onBackdrop(e: MouseEvent): void {
    if (e.target === this._native) this._requestClose();
  }

  override render() {
    if (!this.open) return nothing;
    if (haDefined("ha-dialog")) {
      return html`
        <ha-dialog
          open
          .heading=${this.heading}
          scrimClickAction="close"
          escapeKeyAction="close"
          @closed=${(e: Event) => {
            e.stopPropagation();
            this._requestClose();
          }}
        >
          <div class="content"><slot></slot></div>
          <slot name="actions" slot="primaryAction"></slot>
        </ha-dialog>
      `;
    }
    return html`
      <dialog
        aria-labelledby="h"
        @cancel=${(e: Event) => {
          e.preventDefault();
          this._requestClose();
        }}
        @click=${this._onBackdrop}
      >
        <div class="box">
          <h2 id="h">${this.heading}</h2>
          <div class="content"><slot></slot></div>
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </dialog>
    `;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    const d = this._native;
    if (d?.open) d.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-ov-dialog": JarvisOvDialog;
  }
}
