/**
 * <jarvis-view-settings> - "settings as data" (frontend/specs/settings.md).
 *
 * Fetches the typed catalogue + current values from `jarvis/config_schema`,
 * renders one <jarvis-config-field> per entry grouped by category (left rail
 * on desktop, chip row on narrow) with a search box across all categories,
 * and writes each change through `jarvis/update_config {key, value}` with
 * per-row saving / saved / failed feedback. The view knows no setting key by
 * hand; the only per-key knowledge is the presentation maps in
 * ./settings/presentation.ts and whatever plug-ins register in
 * ./settings/registry.ts (field editors per key, tool cards per category;
 * see ./settings/README.md). Deep links: /jarvis/settings/<category>[/<key>]
 * and /jarvis/settings/<category>/tool:<id>.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
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
  CATEGORY_NAMES, DEFAULT_CATEGORIES, LABEL_OVERRIDE, APPLIANCE_RELOAD_KEYS, CONFIRM_ON_ENABLE, ELSEWHERE,
  PLACEHOLDER, helpFor, enumLabel, suggestionsFor, hasSuggestionSource, pairingHint, isHidden, type Elsewhere,
} from "./settings/presentation";
import {
  findFieldEditor, consumedKeys, toolCardsFor, toolCardMatches,
  type SettingsHost, type SaveResult, type ToolCard,
} from "./settings/registry";
// ── plug-ins: one import line per editor / tool-card module (they register
//    themselves on import; see ./settings/README.md). The built-in picker
//    editor lives in registry.ts itself. ──
import "./settings/tools";

const REFETCH_DEBOUNCE_MS = 300;
const SAVED_CLEAR_MS = 2000;
const WARN_CLEAR_MS = 6000;
const FLASH_MS = 1600;

/** Quote a value for an attribute selector (jsdom has no CSS.escape). */
const attrEsc = (s: string) => s.replace(/["\\]/g, "\\$&");

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
  private _queued = new Map<string, { value: unknown; waiters: Array<(r: SaveResult) => void> }>();
  private _refetchTimer: ReturnType<typeof setTimeout> | undefined;
  private _statusTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _flashTimer: ReturnType<typeof setTimeout> | undefined;
  private _lastDeepLink = "";

  /** What field editors (ctx.host) and tool cards (.host) write through (./settings/registry.ts). */
  private readonly _host: SettingsHost = {
    value: (key) => {
      const f = this._field(key);
      return f ? this._value(f) : undefined;
    },
    field: (key) => this._field(key),
    save: (key, value) => {
      const f = this._field(key);
      return this._change(key, f ? coerceForSave(f, value) : value);
    },
    saveMany: async (entries) => {
      for (const [key, value] of entries) {
        const r = await this._host.save(key, value);
        if (!r.ok) return r;
      }
      return { ok: true };
    },
    refetch: () => this._scheduleRefetch(),
    refreshSnapshot: () => this.refresh(),
    toast: (message) => this._toast(message),
  };

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
      .port-link {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 0;
        font: inherit;
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-accent-text);
        text-decoration: underline;
        cursor: pointer;
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

  private async _change(key: string, value: unknown, row?: JarvisConfigField | null): Promise<SaveResult> {
    const field = this._field(key);
    if (!field) return { ok: false, error: new WsError("jarvis/update_config", "invalid_key", `${key} is not in the catalogue`) };
    if (field.kind === "bool" && value === true && CONFIRM_ON_ENABLE[key]) {
      const ok = await confirmDialog({
        heading: this._labelFor(field),
        message: t(CONFIRM_ON_ENABLE[key]),
        confirmLabel: t("Enable"),
        destructive: true,
      });
      if (!ok) {
        row?.requestUpdate();
        return { ok: false };
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
    return this._save(key, value);
  }

  private async _save(key: string, value: unknown): Promise<SaveResult> {
    const field = this._field(key);
    if (!field) return { ok: false };
    if (this._inflight.has(key)) {
      // a second write to the same key waits for the first; only the latest value is sent
      return new Promise<SaveResult>((resolve) => {
        const q = this._queued.get(key);
        if (q) {
          q.value = value;
          q.waiters.push(resolve);
        } else this._queued.set(key, { value, waiters: [resolve] });
      });
    }
    this._inflight.add(key);
    this._setStatus(key, { level: "saving", message: t("Saving…") });
    let result: SaveResult = { ok: true };
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
      result = { ok: false, error: e };
    } finally {
      this._inflight.delete(key);
      const q = this._queued.get(key);
      if (q) {
        this._queued.delete(key);
        void this._save(key, q.value).then((r) => q.waiters.forEach((w) => w(r)));
      }
    }
    return result;
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
    const [cat, sub] = this.subPath.split("/");
    if (!sub || !this._schema) return;
    const id = `${cat}/${sub}`;
    if (id === this._lastDeepLink) return;
    this._lastDeepLink = id;
    this._query = "";
    await this.updateComplete;
    // /settings/<cat>/tool:<id> targets a tool card; a consumed key targets its owner's row
    const toolId = sub.startsWith("tool:") ? sub.slice(5) : "";
    const key = toolId ? sub : this._consumed.get(sub) ?? sub;
    const el = toolId
      ? this.renderRoot.querySelector<HTMLElement>(`[data-tool-id="${attrEsc(toolId)}"]`)
      : this.renderRoot.querySelector<HTMLElement>(`jarvis-config-field[data-key="${attrEsc(key)}"]`);
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
  /** consumed key -> owner key, for the current catalogue (registry editors with `consumes`). */
  private get _consumed(): Map<string, string> {
    return this._schema ? consumedKeys(this._schema.fields) : new Map();
  }

  private _matches(f: ConfigField, q: string): boolean {
    const optionLabels = (f.options ?? []).map((o) => t(enumLabel(f.key, optionValue(o))));
    return matchesQuery(q, f.key, this._labelFor(f), t(helpFor(f.key)), optionLabels);
  }

  /**
   * The rows of a category: hidden keys only when searched for, consumed keys
   * never (a search hit on a consumed key shows its owner's row instead).
   */
  private _fieldsIn(category: string, query = ""): ConfigField[] {
    if (!this._schema) return [];
    const q = query.trim();
    const consumed = this._consumed;
    const byKey = new Map(this._schema.fields.map((f) => [f.key, f]));
    const out: ConfigField[] = [];
    const seen = new Set<string>();
    for (const f of this._schema.fields) {
      if (f.category !== category) continue;
      const owner = consumed.get(f.key);
      if (!q) {
        if (owner || isHidden(f)) continue;
        out.push(f);
        continue;
      }
      if (!this._matches(f, q)) continue;
      const target = owner ? byKey.get(owner) : f;
      if (!target || seen.has(target.key)) continue;
      seen.add(target.key);
      out.push(target);
    }
    return out;
  }

  private _toolsIn(category: string, query = ""): ToolCard[] {
    const cards = toolCardsFor(category);
    const q = query.trim();
    return q ? cards.filter((c) => toolCardMatches(c, q, t)) : cards;
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
    const elsewhere = ELSEWHERE[cat] ?? [];
    return html`
      <div class="stack">
        ${this._renderToolCards(this._toolsIn(cat))}
        <jv-section .heading=${t(CATEGORY_NAMES[cat] ?? cat)} .subheading=${t("{count} settings", { count: fields.length })}>
          ${fields.length
            ? this._renderFields(fields)
            : html`<jv-empty compact icon="mdi:cog-off-outline" .message=${t("No settings in this section.")}></jv-empty>`}
        </jv-section>
        ${elsewhere.length ? this._renderElsewhere(elsewhere) : nothing}
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

  /** Tool cards (registry) for one category: <tag data-tool-id .hass .data .narrow .host .active ?flash>. */
  private _renderToolCards(cards: ToolCard[]) {
    if (!cards.length) return nothing;
    return cards.map((card) => {
      const tag = unsafeStatic(card.element);
      return staticHtml`<${tag}
        data-tool-id=${card.id}
        .hass=${this.hass}
        .data=${this.data}
        .narrow=${this.narrow}
        .host=${this._host}
        .active=${true}
        ?flash=${this._flashKey === `tool:${card.id}`}
      ></${tag}>`;
    });
  }

  private _renderSearchResults() {
    const q = this._query;
    const groups = this._categories
      .map((c) => ({ c, fields: this._fieldsIn(c, q), tools: this._toolsIn(c, q) }))
      .filter((g) => g.fields.length > 0 || g.tools.length > 0);
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
            ${this._renderToolCards(g.tools)}
            ${g.fields.length
              ? html`
                  <jv-section .heading=${t(CATEGORY_NAMES[g.c] ?? g.c)} .subheading=${t("{count} matches", { count: g.fields.length + g.tools.length })}>
                    ${this._renderFields(g.fields)}
                  </jv-section>
                `
              : nothing}
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
          const editor = findFieldEditor(f);
          // an editor's row also carries the help and the status of the keys it consumes
          const consumes = editor?.consumes.filter((k) => k !== f.key && !!this._field(k)) ?? [];
          const help = [helpFor(f.key), ...consumes.map((k) => helpFor(k))].filter(Boolean).map((h) => t(h)).join("\n");
          const statuses = consumes.map((k) => this._status.get(k)).filter((s): s is FieldStatus => !!s);
          const pairing = f.key === "satellite_pairings" && !editor ? pairingHint(this.data) : null;
          const hint = pairing ? t("Keys: {satellites}; values: {speakers}", pairing) : "";
          const suggest = !editor && hasSuggestionSource(f.key) ? () => suggestionsFor(f.key, this.data, this.hass) : undefined;
          return html`
            ${divider ? html`<hr class="jv-divider" />` : nothing}
            <jarvis-config-field
              data-key=${f.key}
              .field=${f}
              .value=${this._value(f)}
              .label=${this._labelFor(f)}
              .help=${help}
              .hint=${hint}
              .placeholder=${PLACEHOLDER[f.key] ?? ""}
              .suggest=${suggest}
              .hass=${this.hass}
              .data=${this.data}
              .host=${this._host}
              .statuses=${statuses}
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

  /** Old Settings cards that moved to another view, each with a link there. */
  private _renderElsewhere(rows: Elsewhere[]) {
    const list = html`
      <ul class="ports">
        ${rows.map(
          (r) => html`<li>
            <button type="button" class="port-link jv-hit" @click=${() => this.navigate(r.view, r.path)}>${t(r.name)}</button>
            — ${t(r.why)}
          </li>`,
        )}
      </ul>
    `;
    const heading = t("Elsewhere in the panel");
    return this.narrow
      ? html`<jv-section><details><summary>${heading}</summary>${list}</details></jv-section>`
      : html`<jv-section .heading=${heading} icon="mdi:arrow-top-right">${list}</jv-section>`;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-settings": JarvisViewSettings;
  }
}
