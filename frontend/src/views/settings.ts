/**
 * <jarvis-view-settings> - "settings as data" (frontend/specs/settings.md).
 *
 * Fetches the typed catalogue + current values from `jarvis/config_schema`,
 * renders one <jarvis-config-field> per entry grouped by category (left rail
 * on desktop, chip row on narrow) with a search box across all categories,
 * and writes each change through `jarvis/update_config {key, value}` with
 * per-row saving / saved / failed feedback. The view knows no setting key by
 * hand; the only per-key knowledge is the presentation maps in
 * ./settings/presentation.ts. Deep links: /jarvis/settings/<category>[/<key>].
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t, loadLanguage, resolveLanguage } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { WsError } from "../ws";
import type { ConfigField, ConfigSchema } from "../types";
import { confirmDialog } from "../components";
import "../components";
import "./settings/field";
import type { JarvisConfigField, FieldStatus, FieldChangeDetail } from "./settings/field";
import { coerceForSave, matchesQuery, optionValue } from "./settings/coerce";
import {
  CATEGORY_NAMES, DEFAULT_CATEGORIES, LABEL_OVERRIDE, APPLIANCE_RELOAD_KEYS, CONFIRM_ON_ENABLE, NOT_PORTED,
  PLACEHOLDER, helpFor, enumLabel, suggestionsFor, hasSuggestionSource, pairingHint, isHidden,
} from "./settings/presentation";

const REFETCH_DEBOUNCE_MS = 300;
const SAVED_CLEAR_MS = 2000;
const WARN_CLEAR_MS = 6000;
const FLASH_MS = 1600;

@customElement("jarvis-view-settings")
export class JarvisViewSettings extends JarvisView {
  @state() private _schema: ConfigSchema | null = null;
  @state() private _error: WsError | null = null;
  @state() private _loading = false;
  @state() private _query = "";
  @state() private _searchOpen = false;
  @state() private _showKeys = false;
  @state() private _status = new Map<string, FieldStatus>();
  @state() private _flashKey = "";

  private _inflight = new Set<string>();
  private _queued = new Map<string, unknown>();
  private _refetchTimer: ReturnType<typeof setTimeout> | undefined;
  private _statusTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _flashTimer: ReturnType<typeof setTimeout> | undefined;
  private _lastDeepLink = "";

  static override styles = [
    base,
    css`
      .toolbar {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-4);
        min-width: 0;
      }
      .search {
        flex: 1 1 auto;
        min-width: 0;
        max-width: 480px;
      }
      .wrap.narrow .search {
        max-width: none;
        flex-basis: 100%;
      }
      .toolbar.row2 {
        flex-wrap: wrap;
      }
      ha-textfield.search,
      input.search {
        width: 100%;
        display: block;
      }
      input.search {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 900px) {
        .wrap:not(.narrow) .layout {
          grid-template-columns: 220px minmax(0, 1fr);
        }
      }
      /* the rail sticks below the panel's app bar while the fields scroll;
         the nav must be as tall as the grid row for the sticky ul to travel */
      nav.rail {
        align-self: stretch;
      }
      nav.rail ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        position: sticky;
        top: calc(var(--jv-sticky-top, 0px) + var(--jv-space-4));
      }
      nav.rail.dim {
        opacity: 0.55;
      }
      .rail-btn {
        appearance: none;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-sm);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .rail-btn:hover {
        background: var(--jv-hover);
      }
      .rail-btn[aria-current="page"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .count {
        flex: none;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        background: var(--jv-neutral-soft);
        border-radius: var(--jv-radius-pill);
        padding: 0 var(--jv-space-2);
        min-width: 24px;
        line-height: 20px;
        text-align: center;
      }
      /* overflow-x: auto clips in both axes, so leave a 4 px gutter all round
         for the chips' focus ring (the negative margin keeps the layout) */
      .chips-row {
        display: flex;
        gap: var(--jv-space-2);
        overflow-x: auto;
        scrollbar-width: thin;
        flex: 1 1 auto;
        min-width: 0;
        padding: var(--jv-space-1);
        margin: calc(-1 * var(--jv-space-1));
      }
      .chip {
        appearance: none;
        flex: none;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .chip[aria-current="page"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
      }
      .jv-icon-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
      }
      .fields {
        display: flex;
        flex-direction: column;
      }
      .fields hr.jv-divider {
        margin: var(--jv-space-1) 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-4);
      }
      .ports {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .ports li {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      details summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
        font-weight: var(--jv-font-weight-medium);
      }
      details[open] summary {
        margin-bottom: var(--jv-space-2);
      }
      .offline {
        margin-bottom: var(--jv-space-4);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-textfield", "ha-icon", "ha-icon-button", "ha-alert"]);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._refetchTimer);
    clearTimeout(this._flashTimer);
    for (const tm of this._statusTimers.values()) clearTimeout(tm);
    this._statusTimers.clear();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("hass") && this.hass && !this._schema && !this._loading && (!this._error || this._error.code === "no_connection")) {
      void this._load();
    }
    if (changed.has("route")) void this._handleDeepLink();
  }

  // ── data ──────────────────────────────────────────────────────────────
  private async _load(silent = false): Promise<void> {
    if (!this.hass) return;
    if (!silent) {
      this._loading = true;
      this._error = null;
    }
    try {
      const raw = await this.ws<Partial<ConfigSchema>>("jarvis/config_schema");
      const fields = Array.isArray(raw?.fields) ? raw.fields : [];
      const values: Record<string, unknown> = { ...(raw?.values ?? {}) };
      const categories = Array.isArray(raw?.categories) && raw.categories.length
        ? raw.categories
        : [...new Set(fields.map((f) => f.category))];
      if (silent && this._schema) {
        // keep what the user is still editing / what is still in flight
        const keep = new Set([...this._inflight, ...this._queued.keys()]);
        const focused = this._focusedKey();
        if (focused) keep.add(focused);
        for (const k of keep) if (k in this._schema.values) values[k] = this._schema.values[k];
      }
      this._schema = { fields, values, categories };
      this._error = null;
    } catch (err) {
      const e = WsError.from("jarvis/config_schema", err);
      if (!silent) this._error = e;
    } finally {
      this._loading = false;
    }
    void this._handleDeepLink();
  }

  private _focusedKey(): string | undefined {
    const el = this.shadowRoot?.activeElement as (HTMLElement & { field?: ConfigField }) | null;
    const host = el?.tagName?.toLowerCase() === "jarvis-config-field" ? el : el?.closest?.("jarvis-config-field");
    return (host as JarvisConfigField | null | undefined)?.field?.key;
  }

  private _scheduleRefetch(): void {
    clearTimeout(this._refetchTimer);
    this._refetchTimer = setTimeout(() => void this._load(true), REFETCH_DEBOUNCE_MS);
  }

  private _setStatus(key: string, status: FieldStatus | null, clearAfter?: number): void {
    const next = new Map(this._status);
    clearTimeout(this._statusTimers.get(key));
    this._statusTimers.delete(key);
    if (status) next.set(key, status);
    else next.delete(key);
    this._status = next;
    if (status && clearAfter) {
      this._statusTimers.set(
        key,
        setTimeout(() => {
          if (this._status.get(key) === status) this._setStatus(key, null);
        }, clearAfter),
      );
    }
  }

  private _toast(message: string): void {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  private _field(key: string): ConfigField | undefined {
    return this._schema?.fields.find((f) => f.key === key);
  }

  private _labelFor(f: ConfigField): string {
    return t(LABEL_OVERRIDE[f.key] ?? f.label ?? f.key);
  }

  private async _change(key: string, value: unknown, row?: JarvisConfigField | null): Promise<void> {
    const field = this._field(key);
    if (!field) return;
    if (field.kind === "bool" && value === true && CONFIRM_ON_ENABLE[key]) {
      const ok = await confirmDialog({
        heading: this._labelFor(field),
        message: t(CONFIRM_ON_ENABLE[key]),
        confirmLabel: t("Enable"),
        destructive: true,
      });
      if (!ok) {
        row?.requestUpdate();
        return;
      }
    }
    if (key === "ui_language") {
      // strings must switch before the re-render (old panel issue #55)
      try {
        await loadLanguage(resolveLanguage(value, this.hass?.language));
      } catch {
        /* a missing dictionary is not a reason to refuse the save */
      }
    }
    await this._save(key, value);
  }

  private async _save(key: string, value: unknown): Promise<void> {
    const field = this._field(key);
    if (!field) return;
    if (this._inflight.has(key)) {
      this._queued.set(key, value);
      return;
    }
    this._inflight.add(key);
    this._setStatus(key, { level: "saving", message: t("Saving…") });
    try {
      await this.ws("jarvis/update_config", { key, value });
      if (this._schema) this._schema = { ...this._schema, values: { ...this._schema.values, [key]: value } };
      let level: FieldStatus["level"] = "saved";
      let message = field.kind === "list" && Array.isArray(value)
        ? t("Saved ✓ ({count} items)", { count: value.length })
        : t("Saved ✓");
      if (APPLIANCE_RELOAD_KEYS.has(key)) {
        try {
          await this.ws("jarvis/reload_appliances");
          message = t("Saved — appliance monitor reloaded");
        } catch (err) {
          level = "warn";
          message = t("Saved — appliance monitor reload failed: {message}", { message: WsError.from("jarvis/reload_appliances", err).message });
        }
      }
      this._setStatus(key, { level, message }, level === "saved" ? SAVED_CLEAR_MS : WARN_CLEAR_MS);
      this._scheduleRefetch();
      this.refresh();
    } catch (err) {
      const e = WsError.from("jarvis/update_config", err);
      const message = t("Save failed — {message}", { message: e.message });
      this._setStatus(key, { level: "error", message });
      this._toast(message);
    } finally {
      this._inflight.delete(key);
      if (this._queued.has(key)) {
        const next = this._queued.get(key);
        this._queued.delete(key);
        void this._save(key, next);
      }
    }
  }

  private _onFieldChange(e: CustomEvent<FieldChangeDetail>): void {
    void this._change(e.detail.key, e.detail.value, e.target as JarvisConfigField);
  }

  private _onFieldReset(e: CustomEvent<{ key: string }>): void {
    const field = this._field(e.detail.key);
    if (field) void this._change(field.key, coerceForSave(field, field.default), e.target as JarvisConfigField);
  }

  // ── routing ───────────────────────────────────────────────────────────
  private get _categories(): string[] {
    if (!this._schema) return DEFAULT_CATEGORIES;
    return this._schema.categories.filter((c) => c !== "Other" || this._fieldsIn(c).length > 0);
  }

  private get _activeCategory(): string {
    const cats = this._categories;
    const [cat] = this.subPath.split("/");
    return cat && cats.includes(cat) ? cat : cats[0] ?? "core";
  }

  private _go(category: string): void {
    this._query = "";
    this.navigate("settings", category);
  }

  private async _handleDeepLink(): Promise<void> {
    const [cat, key] = this.subPath.split("/");
    if (!key || !this._schema) return;
    const id = `${cat}/${key}`;
    if (id === this._lastDeepLink) return;
    this._lastDeepLink = id;
    this._query = "";
    await this.updateComplete;
    const el = this.renderRoot.querySelector<HTMLElement>(`jarvis-config-field[data-key="${key}"]`);
    if (!el) return;
    // Chromium does not suppress a programmatic smooth scroll under
    // prefers-reduced-motion, so choose the behaviour here (DESIGN.md §5).
    let reduced = false;
    try {
      reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    el.scrollIntoView?.({ block: "center", behavior: reduced ? "auto" : "smooth" });
    this._flashKey = key;
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      if (this._flashKey === key) this._flashKey = "";
    }, FLASH_MS);
  }

  // ── field selection ───────────────────────────────────────────────────
  private _fieldsIn(category: string, query = ""): ConfigField[] {
    if (!this._schema) return [];
    const q = query.trim();
    return this._schema.fields.filter((f) => {
      if (f.category !== category) return false;
      if (!q) return !isHidden(f);
      const optionLabels = (f.options ?? []).map((o) => t(enumLabel(f.key, optionValue(o))));
      return matchesQuery(q, f.key, this._labelFor(f), t(helpFor(f.key)), optionLabels);
    });
  }

  private _value(f: ConfigField): unknown {
    const values = this._schema?.values ?? {};
    return f.key in values ? values[f.key] : f.default;
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const narrow = this.narrow;
    const offline = !this.hass;
    return html`
      <div class="wrap ${narrow ? "narrow" : ""}">
        ${offline ? this._renderOffline() : nothing}
        ${narrow ? this._renderNarrowToolbar() : this._renderToolbar()}
        <div class="layout">
          ${narrow ? nothing : this._renderRail()}
          <div class="content">${this._renderContent()}</div>
        </div>
      </div>
    `;
  }

  private _renderOffline() {
    const msg = t("Reconnecting to Home Assistant…");
    return haDefined("ha-alert")
      ? html`<ha-alert class="offline" alert-type="warning">${msg}</ha-alert>`
      : html`<div class="offline" role="status">${msg}</div>`;
  }

  private _onSearchInput(e: Event): void {
    this._query = String((e.target as HTMLInputElement).value ?? "");
  }
  private _onSearchKey(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this._query = "";
      (e.target as HTMLInputElement).value = "";
    }
  }

  private _renderSearch() {
    const label = t("Search settings…");
    return haDefined("ha-textfield")
      ? html`<ha-textfield class="search" type="search" .label=${label} .value=${live(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey}></ha-textfield>`
      : html`<input class="search" type="search" placeholder=${label} aria-label=${label} .value=${live(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey} />`;
  }

  private _renderToolbar() {
    return html`<div class="toolbar">${this._renderSearch()}</div>`;
  }

  private _iconBtn(icon: string, label: string, pressed: boolean | undefined, onClick: () => void) {
    const ariaPressed = pressed === undefined ? nothing : pressed ? "true" : "false";
    return html`
      <button type="button" class="jv-icon-btn" aria-label=${label} title=${label} aria-pressed=${ariaPressed} @click=${onClick}>
        ${haDefined("ha-icon") ? html`<ha-icon .icon=${icon}></ha-icon>` : html`<span aria-hidden="true">${icon === "mdi:magnify" ? "⌕" : "</>"}</span>`}
      </button>
    `;
  }

  private _renderNarrowToolbar() {
    const active = this._activeCategory;
    return html`
      <div class="toolbar row2">
        <div class="chips-row" role="group" aria-label=${t("Settings sections")}>
          ${this._categories.map(
            (c) => html`<button type="button" class="chip jv-hit" aria-current=${c === active && !this._query ? "page" : nothing} @click=${() => this._go(c)}>${t(CATEGORY_NAMES[c] ?? c)}</button>`,
          )}
        </div>
        ${this._iconBtn("mdi:magnify", t("Search settings…"), this._searchOpen || !!this._query, () => {
          this._searchOpen = !this._searchOpen;
          if (!this._searchOpen) this._query = "";
        })}
        ${this._iconBtn("mdi:code-tags", t("Show keys"), this._showKeys, () => (this._showKeys = !this._showKeys))}
        ${this._searchOpen || this._query ? this._renderSearch() : nothing}
      </div>
    `;
  }

  private _renderRail() {
    const active = this._activeCategory;
    const loaded = !!this._schema;
    return html`
      <nav class="rail ${this._query ? "dim" : ""}" aria-label=${t("Settings sections")}>
        <ul>
          ${this._categories.map((c) => {
            const n = this._fieldsIn(c).length;
            return html`
              <li>
                <button type="button" class="rail-btn" aria-current=${c === active && !this._query ? "page" : nothing} @click=${() => this._go(c)}>
                  <span class="jv-truncate">${t(CATEGORY_NAMES[c] ?? c)}</span>
                  ${loaded ? html`<span class="count" aria-label=${t("{count} settings", { count: n })}>${n}</span>` : nothing}
                </button>
              </li>
            `;
          })}
        </ul>
      </nav>
    `;
  }

  private _renderContent() {
    if (this._error) return this._renderError(this._error);
    if (!this._schema) {
      return html`<jv-section .heading=${t("Settings")} loading><jv-empty kind="loading" .heading=${t("Loading settings…")}></jv-empty></jv-section>`;
    }
    if (this._query.trim()) return this._renderSearchResults();
    const cat = this._activeCategory;
    const fields = this._fieldsIn(cat);
    const ports = NOT_PORTED[cat] ?? [];
    return html`
      <div class="stack">
        <jv-section .heading=${t(CATEGORY_NAMES[cat] ?? cat)} .subheading=${t("{count} settings", { count: fields.length })}>
          ${fields.length
            ? this._renderFields(fields)
            : html`<jv-empty compact icon="mdi:cog-off-outline" .message=${t("No settings in this section.")}></jv-empty>`}
        </jv-section>
        ${ports.length ? this._renderNotPorted(ports) : nothing}
      </div>
    `;
  }

  private _renderError(err: WsError) {
    let message = err.message;
    if (err.code === "unknown_command") message = t("The backend does not provide jarvis/config_schema yet — update the JARVIS integration.");
    else if (err.code === "unauthorized") message = t("Administrator access is required.");
    return html`
      <jv-section>
        <jv-empty kind="error" icon="mdi:alert-circle-outline" .heading=${t("Couldn't load the settings catalogue")} .message=${message}>
          <button slot="action" type="button" class="jv-btn primary" @click=${() => void this._load()}>${t("Retry")}</button>
        </jv-empty>
      </jv-section>
    `;
  }

  private _renderSearchResults() {
    const q = this._query;
    const groups = this._categories
      .map((c) => ({ c, fields: this._fieldsIn(c, q) }))
      .filter((g) => g.fields.length > 0);
    if (!groups.length) {
      return html`
        <jv-section>
          <jv-empty compact icon="mdi:magnify" .heading=${t("No settings match “{query}”.", { query: q.trim() })}>
            <button slot="action" type="button" class="jv-btn" @click=${() => (this._query = "")}>${t("Clear search")}</button>
          </jv-empty>
        </jv-section>
      `;
    }
    return html`
      <div class="stack">
        ${groups.map(
          (g) => html`
            <jv-section .heading=${t(CATEGORY_NAMES[g.c] ?? g.c)} .subheading=${t("{count} matches", { count: g.fields.length })}>
              ${this._renderFields(g.fields)}
            </jv-section>
          `,
        )}
      </div>
    `;
  }

  private _renderFields(fields: ConfigField[]) {
    const offline = !this.hass;
    let prevPrefix = "";
    return html`
      <div class="fields">
        ${fields.map((f, i) => {
          const prefix = f.key.split("_")[0];
          const divider = i > 0 && prefix !== prevPrefix;
          prevPrefix = prefix;
          const help = helpFor(f.key);
          const pairing = f.key === "satellite_pairings" ? pairingHint(this.data) : null;
          const hint = pairing ? t("Keys: {satellites}; values: {speakers}", pairing) : "";
          const suggest = hasSuggestionSource(f.key) ? () => suggestionsFor(f.key, this.data, this.hass) : undefined;
          return html`
            ${divider ? html`<hr class="jv-divider" />` : nothing}
            <jarvis-config-field
              data-key=${f.key}
              .field=${f}
              .value=${this._value(f)}
              .label=${this._labelFor(f)}
              .help=${help ? t(help) : ""}
              .hint=${hint}
              .placeholder=${PLACEHOLDER[f.key] ?? ""}
              .suggest=${suggest}
              .status=${this._status.get(f.key) ?? null}
              .showKey=${!this.narrow || this._showKeys}
              .narrow=${this.narrow}
              ?disabled=${offline}
              ?flash=${this._flashKey === f.key}
              @field-change=${this._onFieldChange}
              @field-reset=${this._onFieldReset}
            ></jarvis-config-field>
          `;
        })}
      </div>
    `;
  }

  private _renderNotPorted(rows: Array<{ name: string; why: string }>) {
    const list = html`
      <ul class="ports">
        ${rows.map((r) => html`<li>${t(r.name)} — ${t(r.why)} — ${t("Phase 3")}</li>`)}
      </ul>
    `;
    const heading = t("Not yet ported");
    return this.narrow
      ? html`<jv-section><details><summary>${heading}</summary>${list}</details></jv-section>`
      : html`<jv-section .heading=${heading} icon="mdi:progress-wrench">${list}</jv-section>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-settings": JarvisViewSettings;
  }
}
