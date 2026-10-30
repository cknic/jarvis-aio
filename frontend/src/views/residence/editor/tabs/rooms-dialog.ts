/**
 * <jarvis-room-dialog> - the "name this room" dialog of the floor-plan
 * editor (new room, rename): a Name field with a <datalist> of the Home
 * Assistant area names and a Type select. Uses <ha-dialog> when HA has
 * defined it, else a native <dialog> styled with tokens (same pattern as
 * jv-confirm). Resolves `{name, type}` or null when dismissed.
 *
 *   const res = await roomDialog({ heading: t("Add Room"), name: "", type: "room", areas: store.areaNames() });
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { base } from "../../../../theme/base";
import { haDefined } from "../../../../ha";
import { t } from "../../../../i18n";
import { ROOM_TYPES } from "../model";
import { controlStyles } from "./rooms-controls";

export interface RoomDialogOptions {
  heading: string;
  name?: string;
  type?: string;
  areas: readonly string[];
  confirmLabel?: string;
  /** hide the Type select (rename only) */
  nameOnly?: boolean;
}
export interface RoomDialogResult {
  name: string;
  type: string;
}

interface HaDialogLike extends HTMLElement {
  close?: () => void;
}

@customElement("jarvis-room-dialog")
export class JarvisRoomDialog extends LitElement {
  @state() private _open = false;
  @state() private _opts: RoomDialogOptions = { heading: "", areas: [] };
  @state() private _name = "";
  @state() private _type = "room";

  @query("dialog") private _native?: HTMLDialogElement;
  @query("ha-dialog") private _haDialog?: HaDialogLike;

  private _resolve: ((v: RoomDialogResult | null) => void) | null = null;

  static override styles = [
    base,
    controlStyles,
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
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-3);
      }
      h2 {
        margin: 0 0 var(--jv-space-3);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 260px;
      }
      ha-dialog .form {
        padding-top: var(--jv-space-2);
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

  show(opts: RoomDialogOptions): Promise<RoomDialogResult | null> {
    if (this._resolve) this._finish(false);
    this._opts = opts;
    this._name = opts.name ?? "";
    this._type = opts.type ?? "room";
    this._open = true;
    return new Promise<RoomDialogResult | null>((resolve) => {
      this._resolve = resolve;
      void this.updateComplete.then(() => {
        const native = this._native;
        if (native && !native.open) {
          try {
            if (typeof native.showModal === "function") native.showModal();
            else native.setAttribute("open", "");
          } catch {
            native.setAttribute("open", "");
          }
        }
        const input = this.renderRoot.querySelector<HTMLInputElement>("input[name=name]");
        input?.focus();
        input?.select?.();
      });
    });
  }

  private _finish(ok: boolean): void {
    const r = this._resolve;
    this._resolve = null;
    this._open = false;
    const native = this._native;
    if (native?.open) {
      if (typeof native.close === "function") native.close();
      else native.removeAttribute("open");
    }
    const name = this._name.trim() || this._opts.name?.trim() || t("Room");
    r?.(ok ? { name, type: this._type || "room" } : null);
  }

  private _onHaClosed(e: Event): void {
    const action = (e as CustomEvent<{ action?: string }>).detail?.action;
    if (this._resolve) this._finish(action === "confirm");
  }

  private _onNativeCancel(e: Event): void {
    e.preventDefault();
    this._finish(false);
  }

  private _onKey(e: KeyboardEvent): void {
    if (e.key === "Enter" && (e.target as HTMLElement | null)?.tagName === "INPUT") {
      e.preventDefault();
      this._finish(true);
    }
  }

  private _form() {
    const o = this._opts;
    return html`
      <div class="form" @keydown=${this._onKey}>
        <div class="field">
          <label class="field-label" for="rd-name">${t("Name")}</label>
          <input id="rd-name" name="name" type="text" autocomplete="off" list="rd-areas" .value=${live(this._name)} @input=${(e: Event) => { this._name = (e.target as HTMLInputElement).value; }} />
          <datalist id="rd-areas">${o.areas.map((a) => html`<option value=${a}></option>`)}</datalist>
          <p class="hint">${t("Use the Home Assistant area name so occupancy lights this room")}</p>
        </div>
        ${o.nameOnly
          ? nothing
          : html`<div class="field">
              <label class="field-label" for="rd-type">${t("Type")}</label>
              <select id="rd-type" .value=${live(this._type)} @change=${(e: Event) => { this._type = (e.target as HTMLSelectElement).value; }}>
                ${ROOM_TYPES.map((rt) => html`<option value=${rt.value} ?selected=${rt.value === this._type}>${t(rt.label)}</option>`)}
                ${ROOM_TYPES.some((rt) => rt.value === this._type) ? nothing : html`<option value=${this._type} selected>${this._type}</option>`}
              </select>
            </div>`}
      </div>
    `;
  }

  override render() {
    if (!this._open) return nothing;
    const confirmLabel = this._opts.confirmLabel || t("Confirm");
    const cancelLabel = t("Cancel");
    if (haDefined("ha-dialog")) {
      return html`
        <ha-dialog open .heading=${this._opts.heading} @closed=${this._onHaClosed} scrimClickAction="" escapeKeyAction="cancel">
          ${this._form()}
          <button class="jv-btn" slot="secondaryAction" dialogAction="cancel">${cancelLabel}</button>
          <button class="jv-btn primary" slot="primaryAction" dialogAction="confirm">${confirmLabel}</button>
        </ha-dialog>
      `;
    }
    return html`
      <dialog aria-labelledby="rd-h" @cancel=${this._onNativeCancel}>
        <div class="box">
          <h2 id="rd-h">${this._opts.heading}</h2>
          ${this._form()}
        </div>
        <div class="actions">
          <button class="jv-btn" type="button" @click=${() => this._finish(false)}>${cancelLabel}</button>
          <button class="jv-btn primary" type="button" @click=${() => this._finish(true)}>${confirmLabel}</button>
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

/** Imperative helper: mounts the dialog in document.body, removes it after. */
export async function roomDialog(opts: RoomDialogOptions): Promise<RoomDialogResult | null> {
  const el = document.createElement("jarvis-room-dialog") as JarvisRoomDialog;
  document.body.appendChild(el);
  try {
    return await el.show(opts);
  } finally {
    el.remove();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-room-dialog": JarvisRoomDialog;
  }
}
