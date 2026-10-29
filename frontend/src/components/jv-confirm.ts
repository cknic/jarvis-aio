/**
 * Confirmation dialog.
 *
 *   const ok = await confirmDialog({
 *     heading: t("Forget this fact?"),
 *     message: t("This cannot be undone."),
 *     confirmLabel: t("Forget"),
 *     destructive: true,
 *   });
 *
 * Or declaratively: <jv-confirm heading=... message=...> then
 * `await el.show()` -> boolean. Uses <ha-dialog> when HA has defined it, else
 * a native <dialog> styled with tokens. Fires "jv-confirm" / "jv-cancel".
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { base } from "../theme/base";
import { haDefined } from "../ha";
import { t } from "../i18n";

export interface ConfirmOptions {
  heading: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface HaDialogLike extends HTMLElement {
  open?: boolean;
  close?: () => void;
}

@customElement("jv-confirm")
export class JvConfirm extends LitElement {
  @property({ type: String }) heading = "";
  @property({ type: String }) message = "";
  @property({ type: String, attribute: "confirm-label" }) confirmLabel = "";
  @property({ type: String, attribute: "cancel-label" }) cancelLabel = "";
  @property({ type: Boolean, reflect: true }) destructive = false;
  @state() private _open = false;

  @query("dialog") private _native?: HTMLDialogElement;
  @query("ha-dialog") private _haDialog?: HaDialogLike;

  private _resolve: ((v: boolean) => void) | null = null;

  static override styles = [
    base,
    css`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        max-width: min(92vw, 440px);
        width: 100%;
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .box {
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-4);
      }
      h2 {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
      }
      p {
        margin: 0;
        color: var(--jv-text-2);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-3) var(--jv-space-3);
      }
      @media (max-width: 599px) {
        .actions {
          flex-direction: column-reverse;
        }
        .actions .jv-btn {
          width: 100%;
        }
      }
    `,
  ];

  /** Open the dialog; resolves true on confirm, false on cancel/dismiss. */
  show(): Promise<boolean> {
    if (this._resolve) this._finish(false);
    this._open = true;
    return new Promise<boolean>((resolve) => {
      this._resolve = resolve;
      this.updateComplete.then(() => {
        const native = this._native;
        if (native && !native.open) {
          try {
            if (typeof native.showModal === "function") native.showModal();
            else native.setAttribute("open", "");
          } catch {
            native.setAttribute("open", "");
          }
        }
        const focus = this.renderRoot.querySelector<HTMLElement>("[data-autofocus]");
        focus?.focus();
      });
    });
  }

  private _finish(result: boolean): void {
    const r = this._resolve;
    this._resolve = null;
    this._open = false;
    const native = this._native;
    if (native?.open) {
      // jsdom's HTMLDialogElement has no close(); browsers always do.
      if (typeof native.close === "function") native.close();
      else native.removeAttribute("open");
    }
    this.dispatchEvent(new CustomEvent(result ? "jv-confirm" : "jv-cancel", { bubbles: true, composed: true }));
    r?.(result);
  }

  private _onHaClosed(e: Event): void {
    const action = (e as CustomEvent<{ action?: string }>).detail?.action;
    if (this._resolve) this._finish(action === "confirm");
  }

  private _onNativeCancel(e: Event): void {
    e.preventDefault();
    this._finish(false);
  }

  override render() {
    if (!this._open) return nothing;
    const confirmLabel = this.confirmLabel || t("Confirm");
    const cancelLabel = this.cancelLabel || t("Cancel");
    if (haDefined("ha-dialog")) {
      return html`
        <ha-dialog open .heading=${this.heading} @closed=${this._onHaClosed} scrimClickAction="" escapeKeyAction="cancel">
          ${this.message ? html`<p>${this.message}</p>` : nothing}
          <button class="jv-btn" slot="secondaryAction" dialogAction="cancel">${cancelLabel}</button>
          <button
            class="jv-btn ${this.destructive ? "danger" : "primary"}"
            slot="primaryAction"
            dialogAction="confirm"
            data-autofocus
          >
            ${confirmLabel}
          </button>
        </ha-dialog>
      `;
    }
    return html`
      <dialog aria-labelledby="h" @cancel=${this._onNativeCancel}>
        <div class="box">
          <h2 id="h">${this.heading}</h2>
          ${this.message ? html`<p>${this.message}</p>` : nothing}
        </div>
        <div class="actions">
          <button class="jv-btn" type="button" @click=${() => this._finish(false)}>${cancelLabel}</button>
          <button
            class="jv-btn ${this.destructive ? "danger" : "primary"}"
            type="button"
            data-autofocus
            @click=${() => this._finish(true)}
          >
            ${confirmLabel}
          </button>
        </div>
      </dialog>
    `;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._resolve) this._finish(false);
    this._haDialog?.close?.();
  }
}

/** Imperative helper: mounts a <jv-confirm> in document.body, removes it after. */
export async function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  const el = document.createElement("jv-confirm") as JvConfirm;
  el.heading = opts.heading;
  el.message = opts.message ?? "";
  el.confirmLabel = opts.confirmLabel ?? "";
  el.cancelLabel = opts.cancelLabel ?? "";
  el.destructive = !!opts.destructive;
  document.body.appendChild(el);
  try {
    return await el.show();
  } finally {
    el.remove();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-confirm": JvConfirm;
  }
}
