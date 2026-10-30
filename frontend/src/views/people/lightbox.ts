/**
 * <jarvis-people-lightbox> - the enlarged face image (spec §3.7).
 * `open(src, caption)` shows it in <ha-dialog> when HA has defined it, else a
 * native <dialog> (focus trapped, Escape / scrim / Close button close it).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { t } from "../../i18n";

@customElement("jarvis-people-lightbox")
export class JarvisPeopleLightbox extends LitElement {
  @state() private _open = false;
  @state() private _src = "";
  @state() private _caption = "";

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
        width: auto;
        max-width: min(96vw, 1100px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .head h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      img {
        display: block;
        max-width: 96vw;
        max-height: 80vh;
        width: auto;
        height: auto;
        object-fit: contain;
        margin: 0 auto;
      }
      ha-dialog img {
        max-height: 70vh;
      }
      @media (max-width: 599px) {
        dialog {
          max-width: 100vw;
          width: 100vw;
          margin: auto 0 0;
          border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-dialog", "ha-icon"]);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._open = false;
  }

  override updated(): void {
    if (this._open && !haDefined("ha-dialog")) {
      const d = this._native;
      if (d && !d.open) {
        try {
          d.showModal();
        } catch {
          d.setAttribute("open", "");
        }
      }
    }
  }

  open(src: string, caption: string): void {
    this._src = src;
    this._caption = caption;
    this._open = true;
  }

  close(): void {
    this._open = false;
    const d = this._native;
    if (d?.open) d.close();
  }

  override render() {
    if (!this._open || !this._src) return nothing;
    const heading = this._caption || t("Snapshot");
    const img = html`<img src=${this._src} alt=${heading} @error=${() => this.close()} />`;
    if (haDefined("ha-dialog")) {
      return html`
        <ha-dialog open hideActions .heading=${heading} @closed=${() => this.close()} escapeKeyAction="close" scrimClickAction="close">
          ${img}
        </ha-dialog>
      `;
    }
    return html`
      <dialog
        aria-labelledby="lb-h"
        @cancel=${(e: Event) => {
          e.preventDefault();
          this.close();
        }}
        @click=${(e: MouseEvent) => {
          if (e.target === this._native) this.close();
        }}
      >
        <div class="head">
          <h2 id="lb-h">${heading}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${t("Close")} @click=${() => this.close()}>
            ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:close" aria-hidden="true"></ha-icon>` : html`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        ${img}
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-people-lightbox": JarvisPeopleLightbox;
  }
}
