/**
 * <jv-intrusion-snapshot .hass=${hass} path="/api/jarvis/snapshot/intrusion/x.jpg"
 *                        caption="Front Door · 12:04" variant="hero|thumb">
 *
 * A signed intrusion still. The <img> is only rendered once auth/sign_path
 * has answered (an unsigned /api/ src would 401 and fail the smoke test); a
 * skeleton reserves the space meanwhile. A 404 (pruned still) hides the image
 * and shows "Snapshot no longer available". Tapping the picture opens it
 * full-size in <ha-dialog> (or a native <dialog>), re-signing first so a long
 * open view never shows an expired URL.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { signPath } from "../../ws";
import { t, onLanguageChange } from "../../i18n";
import type { Hass } from "../../types";

@customElement("jv-intrusion-snapshot")
export class JvIntrusionSnapshot extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ type: String }) path = "";
  @property({ type: String }) caption = "";
  @property({ type: String }) alt = "";
  @property({ type: String, reflect: true }) variant: "hero" | "thumb" = "hero";

  @state() private _src = "";
  @state() private _failed = false;
  @state() private _open = false;
  @state() private _openSrc = "";

  @query("dialog") private _native?: HTMLDialogElement;

  private _signedFor = "";
  private _seq = 0;
  private _unsubLang?: () => void;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .frame {
        appearance: none;
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: var(--jv-bg-2);
        border-radius: var(--jv-radius-sm);
        overflow: hidden;
        cursor: zoom-in;
        color: inherit;
      }
      :host([variant="hero"]) .frame {
        aspect-ratio: 16 / 9;
        max-height: 280px;
      }
      /* the parent sets --jv-thumb-* when its column is too narrow for a side thumbnail */
      :host([variant="thumb"]) .frame {
        width: var(--jv-thumb-width, 160px);
        height: var(--jv-thumb-height, 120px);
        aspect-ratio: var(--jv-thumb-ratio, auto);
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .skeleton {
        width: 100%;
        height: 100%;
        min-height: 100%;
        border-radius: 0;
      }
      .caption {
        margin: var(--jv-space-1) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .gone {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      :host([variant="thumb"]) .gone {
        width: var(--jv-thumb-width, 160px);
        height: var(--jv-thumb-height, 120px);
        min-height: var(--jv-tap);
        justify-content: center;
        text-align: center;
        padding: var(--jv-space-2);
        background: var(--jv-bg-2);
        border-radius: var(--jv-radius-sm);
      }
      dialog {
        border: 0;
        padding: 0;
        max-width: min(96vw, 1100px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .full {
        display: block;
        max-width: 96vw;
        max-height: 80vh;
        width: auto;
        height: auto;
        object-fit: contain;
        margin: 0 auto;
      }
      .dlg-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .dlg-head h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      ha-dialog img {
        max-height: 70vh;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-dialog", "ha-icon", "ha-icon-button"]);
    this._unsubLang = onLanguageChange(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubLang?.();
    this._unsubLang = undefined;
    this._open = false;
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("path") && !this.path) {
      this._seq++;
      this._signedFor = "";
      this._src = "";
      this._failed = false;
      return;
    }
    if ((changed.has("path") || changed.has("hass")) && this.hass && this.path && this.path !== this._signedFor) {
      void this._sign();
    }
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

  private async _sign(): Promise<void> {
    const path = this.path;
    const seq = ++this._seq;
    this._signedFor = path;
    this._failed = false;
    this._src = "";
    if (!path || !this.hass) return;
    const url = await signPath(this.hass, path);
    if (seq !== this._seq) return; // superseded
    this._src = url;
  }

  private _onError(): void {
    this._failed = true;
    this._open = false;
  }

  private async _openFull(): Promise<void> {
    if (!this._src || this._failed) return;
    // signPath caches for 240 s and re-signs after that, so this is cheap
    const url = this.hass ? await signPath(this.hass, this.path) : this._src;
    this._openSrc = url || this._src;
    this._open = true;
  }

  private _close(): void {
    this._open = false;
    const d = this._native;
    if (d?.open) d.close();
  }

  private _renderDialog() {
    if (!this._open || !this._openSrc) return nothing;
    const heading = this.caption || t("Intrusion snapshot");
    const img = html`<img class="full" src=${this._openSrc} alt=${this.alt || t("Intrusion snapshot")} @error=${this._onError} />`;
    if (haDefined("ha-dialog")) {
      return html`
        <ha-dialog open hideActions .heading=${heading} @closed=${this._close} escapeKeyAction="close" scrimClickAction="close">
          ${img}
        </ha-dialog>
      `;
    }
    return html`
      <dialog
        aria-labelledby="snap-h"
        @cancel=${(e: Event) => {
          e.preventDefault();
          this._close();
        }}
        @click=${(e: MouseEvent) => {
          if (e.target === this._native) this._close();
        }}
      >
        <div class="dlg-head">
          <h2 id="snap-h">${heading}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${t("Close")} @click=${this._close}>
            ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:close" aria-hidden="true"></ha-icon>` : html`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        ${img}
      </dialog>
    `;
  }

  override render() {
    if (!this.path) return nothing;
    if (this._failed) {
      return html`<p class="gone">
        ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:image-off-outline" aria-hidden="true"></ha-icon>` : nothing}
        <span>${t("Snapshot no longer available")}</span>
      </p>`;
    }
    const alt = this.alt || t("Intrusion snapshot");
    return html`
      <button
        class="frame"
        type="button"
        aria-label=${t("Open snapshot")}
        ?disabled=${!this._src}
        @click=${() => void this._openFull()}
      >
        ${this._src
          ? html`<img src=${this._src} alt=${alt} loading="lazy" @error=${this._onError} />`
          : html`<div class="jv-skeleton skeleton" role="img" aria-label=${t("Loading...")}></div>`}
      </button>
      ${this.caption ? html`<p class="caption">${this.caption}</p>` : nothing}
      ${this._renderDialog()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-intrusion-snapshot": JvIntrusionSnapshot;
  }
}
