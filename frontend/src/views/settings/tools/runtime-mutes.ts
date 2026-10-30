/**
 * <jarvis-tool-mutes> - Muted Announcements (settings-tools.md §4.15):
 * the entities and categories JARVIS has been told to stop announcing
 * (jarvis/mutes list / mute / unmute / clear). Every mutating call answers
 * the full list, so the card replaces its state with the response.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { html as staticHtml, literal } from "lit/static-html.js";
import { t } from "../../../i18n";
import { haDefined } from "../../../ha";
import { WsError } from "../../../ws";
import { confirmDialog } from "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail } from "../../../components/jv-picker";
import { JarvisToolCard, friendlyName, wsMessage } from "./runtime-base";

export interface MuteList {
  entities: string[];
  categories: string[];
  all: boolean;
}

/** services.yaml `shush` categories */
export const MUTE_CATEGORIES = ["appliances", "doors_windows", "presence", "energy", "security", "climate", "lights", "schedule"];

@customElement("jarvis-tool-mutes")
export class JarvisToolMutes extends JarvisToolCard {
  @state() private _list: MuteList | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;
  @state() private _busy = false;
  @state() private _entity = "";
  @state() private _category = "";

  static override styles = [
    ...JarvisToolCard.styles,
    css`
      ul.chips {
        list-style: none;
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        max-width: 100%;
        min-height: 32px;
        padding: 0 var(--jv-space-1) 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface-2);
        font-size: var(--jv-font-size-s);
      }
      .chip .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chip .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px 0;
        font-size: var(--jv-font-size-l);
        line-height: 1;
      }
      .add {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-2);
        align-items: end;
      }
      @media (min-width: 600px) {
        :host(:not([narrow])) .add {
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
        }
      }
      .add label {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        min-width: 0;
      }
      .add select,
      .add ha-select {
        width: 100%;
      }
      .jv-btn.text.danger-text {
        color: var(--jv-danger-text);
      }
    `,
  ];

  protected override onFirstActive(): void {
    void this._load();
  }

  private _take(res: unknown): MuteList {
    const o = (res && typeof res === "object" ? res : {}) as Partial<MuteList>;
    const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    return { entities: strs(o.entities), categories: strs(o.categories), all: !!o.all };
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = null;
    try {
      this._list = this._take(await this.ws("jarvis/mutes", { action: "list" }));
    } catch (err) {
      this._error = wsMessage(WsError.from("jarvis/mutes", err));
    } finally {
      this._loading = false;
    }
  }

  private async _mutate(payload: Record<string, unknown>): Promise<boolean> {
    this._busy = true;
    try {
      this._list = this._take(await this.ws("jarvis/mutes", payload));
      return true;
    } catch (err) {
      this.toast(t("Mute change failed — {message}", { message: wsMessage(WsError.from("jarvis/mutes", err)) }));
      return false;
    } finally {
      this._busy = false;
    }
  }

  private async _mute(): Promise<void> {
    const entity = this._entity.trim();
    const category = this._category;
    if (!entity && !category) return;
    let ok = true;
    if (entity) ok = await this._mutate({ action: "mute", entity_id: entity });
    if (ok && category) ok = await this._mutate({ action: "mute", category });
    if (ok) {
      this._entity = "";
      this._category = "";
    }
  }

  private async _clear(): Promise<void> {
    const ok = await confirmDialog({
      heading: t("Clear every mute?"),
      message: t("This also unmutes every entity and category below."),
      confirmLabel: t("Clear all"),
      destructive: true,
    });
    if (!ok) return;
    await this._mutate({ action: "clear" });
  }

  private _onPick(e: CustomEvent<PickerChangeDetail>): void {
    e.stopPropagation();
    const v = e.detail?.value;
    this._entity = Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  }

  private _onCategory(e: Event): void {
    const el = e.target as HTMLSelectElement & { value?: string };
    this._category = String(el.value ?? "");
  }

  // ── render ──────────────────────────────────────────────────────────────

  private _renderChips(list: MuteList) {
    const off = this.offline || this._busy;
    const chip = (name: string, id: string, isCategory: boolean, unmute: Record<string, unknown>) => html`
      <li class="chip" title=${id}>
        <span class="name ${!isCategory && name === id ? "jv-mono" : ""}">${name}</span>
        ${isCategory
          ? html`<jv-state-badge level="info" nodot .label=${t("category")}></jv-state-badge>`
          : name !== id
            ? html`<span class="jv-mono jv-muted jv-truncate">${id}</span>`
            : nothing}
        <button type="button" class="jv-icon-btn" aria-label=${t("Unmute {name}", { name })} ?disabled=${off} @click=${() => void this._mutate({ action: "unmute", ...unmute })}>
          <span aria-hidden="true">×</span>
        </button>
      </li>
    `;
    return html`
      <ul class="chips">
        ${list.entities.map((id) => chip(friendlyName(this.hass, id), id, false, { entity_id: id }))}
        ${list.categories.map((c) => chip(c, c, true, { category: c }))}
      </ul>
    `;
  }

  private _renderCategorySelect() {
    const label = t("category");
    const none = t("— none —");
    if (haDefined("ha-select")) {
      const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
      return html`
        <ha-select .label=${label} .value=${live(this._category)} ?disabled=${this.offline} naturalMenuWidth fixedMenuPosition @selected=${this._onCategory} @closed=${(e: Event) => e.stopPropagation()}>
          ${staticHtml`<${item} value="">${none}</${item}>`}
          ${MUTE_CATEGORIES.map((c) => staticHtml`<${item} value=${c}>${c}</${item}>`)}
        </ha-select>
      `;
    }
    return html`
      <label>
        <span>${label}</span>
        <select .value=${live(this._category)} ?disabled=${this.offline} @change=${this._onCategory}>
          <option value="">${none}</option>
          ${MUTE_CATEGORIES.map((c) => html`<option value=${c}>${c}</option>`)}
        </select>
      </label>
    `;
  }

  private _renderAdd() {
    const canMute = !this.offline && !this._busy && (!!this._entity.trim() || !!this._category);
    return html`
      <div class="add">
        <jv-picker
          kind="entity"
          allow-custom
          .hass=${this.hass}
          .data=${this.data}
          .value=${this._entity || undefined}
          .label=${t("entity id")}
          ?disabled=${this.offline}
          @value-changed=${this._onPick}
        ></jv-picker>
        ${this._renderCategorySelect()}
        <button type="button" class="jv-btn primary" ?disabled=${!canMute} @click=${() => void this._mute()}>${t("Mute")}</button>
      </div>
    `;
  }

  private _renderBody() {
    if (this._error) return this.renderError(t("Couldn't load the mute list — {message}", { message: this._error }), () => void this._load());
    const list = this._list;
    if (!list) return html`<jv-empty kind="loading" .heading=${t("Loading…")}></jv-empty>`;
    const any = list.all || list.entities.length > 0 || list.categories.length > 0;
    return html`
      ${list.all
        ? this.renderAlert(
            "warning",
            t("Blanket mute is ON — all announcements are suppressed."),
            html`<button type="button" class="jv-btn" ?disabled=${this.offline || this._busy} @click=${() => void this._clear()}>${t("Turn off")}</button>`,
          )
        : nothing}
      ${list.entities.length || list.categories.length
        ? this._renderChips(list)
        : list.all
          ? nothing
          : html`<p class="intro">${t("Nothing muted. JARVIS announces about everything it observes. Mute an entity below (or run jarvis.shush) to silence announcements about it without excluding it.")}</p>`}
      ${this._renderAdd()}
      ${any
        ? html`<div class="actions-row">
            <button type="button" class="jv-btn text danger-text" ?disabled=${this.offline || this._busy} @click=${() => void this._clear()}>${t("Clear all")}</button>
          </div>`
        : nothing}
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Muted Announcements")} .subheading=${t("Shush")} icon="mdi:volume-mute" .loading=${this._loading || this._busy}>
        ${this.renderIconButton("mdi:refresh", t("Refresh"), () => void this._load(), this.offline || this._loading, "actions")}
        <p class="intro">
          ${t("Things JARVIS has been told to stop announcing — a window that's often open, a decorative light, etc. Muting an entity silences announcements about it while JARVIS keeps observing it normally (not the same as excluding it). Persists across restarts.")}
        </p>
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-mutes": JarvisToolMutes;
  }
}
