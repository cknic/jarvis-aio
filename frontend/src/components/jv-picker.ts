/**
 * <jv-picker kind="entity|area|domain|label|device" [multiple] .hass .value .label>
 *
 * One picker for ids that come from live Home Assistant data. It prefers HA's
 * own elements when they are defined in the page (`ha-selector`, then
 * `ha-entity-picker` / `ha-entities-picker` / `ha-area-picker` /
 * `ha-areas-picker`) and otherwise renders a token-styled searchable list of
 * its own, built from `hass.states` (entities, domains), `hass.areas` /
 * `data.areas` / `config/area_registry/list` (areas), `data.config.available_labels`
 * / `config/label_registry/list` (labels) and `hass.devices` /
 * `config/device_registry/list` (devices). Both branches emit the same event:
 *
 *   "value-changed"  detail.value: string[]            (multiple)
 *                                 string | undefined   (single; undefined = cleared)
 *
 * Properties: `kind`, `multiple`, `value` (string | string[]), `hass`, `data`
 * (the panel snapshot, optional), `label` (aria), `placeholder`, `disabled`,
 * `allowCustom` (accept a typed value that is not in the list), `domains`
 * (entity kind: include filter, e.g. ["media_player"]) and `items` (an
 * explicit `{value, label}[]` or a function returning one, which replaces the
 * built-in source for any kind). Selected values render as removable chips
 * (44 x 44 px remove target); ids that no longer resolve are kept and marked
 * "not found"; an entity id prefixed "!" (the voice-confirm exemption marker)
 * resolves its name from the bare id and shows an "exempt" tag.
 *
 * Keyboard (fallback): type to filter, ArrowUp/ArrowDown to move, Enter to
 * pick (or add a custom value), Escape to close, Backspace on an empty input
 * removes the last chip (multiple).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import type { Hass, PanelData } from "../types";

export type PickerKind = "entity" | "area" | "domain" | "label" | "device";

export interface PickerItem {
  value: string;
  label: string;
  /** shown in code font next to the label when it differs (entity ids) */
  secondary?: string;
}

export interface PickerChangeDetail {
  value: string | string[] | undefined;
}

const HA_TAGS = ["ha-selector", "ha-entity-picker", "ha-entities-picker", "ha-area-picker", "ha-areas-picker"];
const MAX_SHOWN = 50;
const REGISTRY_TTL_MS = 60_000;
const REGISTRY_COMMANDS: Record<PickerKind, string | null> = {
  area: "config/area_registry/list",
  label: "config/label_registry/list",
  device: "config/device_registry/list",
  entity: null,
  domain: null,
};
const THING: Record<PickerKind, string> = {
  entity: "entity id",
  area: "area",
  domain: "domain",
  label: "label",
  device: "device",
};

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function registryItem(kind: PickerKind, row: Row): PickerItem | null {
  if (kind === "area") {
    const id = str(row.area_id) || str(row.id);
    return id ? { value: id, label: str(row.name) || id } : null;
  }
  if (kind === "label") {
    const id = str(row.label_id) || str(row.id);
    return id ? { value: id, label: str(row.name) || id } : null;
  }
  if (kind === "device") {
    const id = str(row.id);
    return id ? { value: id, label: str(row.name_by_user) || str(row.name) || id } : null;
  }
  return null;
}

function byLabel(a: PickerItem, b: PickerItem): number {
  return a.label.localeCompare(b.label, undefined, { sensitivity: "base" }) || a.value.localeCompare(b.value);
}

// Registry lists are shared by every picker on the page for a minute.
const _registry = new Map<string, { at: number; items: Promise<PickerItem[]> }>();

function loadRegistry(hass: Hass, kind: PickerKind): Promise<PickerItem[]> | null {
  const cmd = REGISTRY_COMMANDS[kind];
  if (!cmd || typeof hass.callWS !== "function") return null;
  const hit = _registry.get(cmd);
  if (hit && Date.now() - hit.at < REGISTRY_TTL_MS) return hit.items;
  const items = hass
    .callWS<unknown>({ type: cmd })
    .then((rows) => (Array.isArray(rows) ? rows.map((r) => registryItem(kind, (r ?? {}) as Row)).filter((x): x is PickerItem => !!x).sort(byLabel) : []))
    .catch(() => [] as PickerItem[]);
  _registry.set(cmd, { at: Date.now(), items });
  return items;
}

/** Drop the cached registry lists (e.g. after the user renamed an area). */
export function clearPickerRegistryCache(): void {
  _registry.clear();
}

let _uid = 0;

@customElement("jv-picker")
export class JvPicker extends LitElement {
  @property({ type: String, reflect: true }) kind: PickerKind = "entity";
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ attribute: false }) value: string | string[] | undefined = undefined;
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ type: String }) label = "";
  @property({ type: String }) placeholder = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, attribute: "allow-custom" }) allowCustom = false;
  @property({ attribute: false }) domains?: string[];
  @property({ attribute: false }) items?: PickerItem[] | (() => PickerItem[]);

  @state() private _query = "";
  @state() private _open = false;
  @state() private _active = 0;
  @state() private _note = "";
  @state() private _registryItems: PickerItem[] | null = null;
  @state() private _registryLoading = false;

  private _mode: "selector" | "entity" | "area" | "fallback" | null = null;
  private readonly _uid = `jvp${++_uid}`;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      :host([disabled]) {
        opacity: 0.6;
      }
      ha-selector,
      ha-entity-picker,
      ha-entities-picker,
      ha-area-picker,
      ha-areas-picker {
        display: block;
        width: 100%;
      }
      .chips {
        list-style: none;
        margin: 0 0 var(--jv-space-2);
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
      .chips:empty {
        display: none;
      }
      /* 32 px chip; the × button is a 44 x 44 px target (negative block
         margin keeps the chip 32 px tall), so the chip itself must not
         clip - the label span truncates instead */
      .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        max-width: 100%;
        min-width: 0;
        min-height: 32px;
        padding: 0 var(--jv-space-1) 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .chip.missing {
        border-style: dashed;
      }
      .chip-text {
        display: inline-flex;
        align-items: baseline;
        gap: var(--jv-space-2);
        min-width: 0;
        overflow: hidden;
      }
      .chip-text .sec {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tag {
        flex: none;
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        color: var(--jv-text);
      }
      .tag.warn {
        background: var(--jv-warn-soft);
      }
      .x {
        appearance: none;
        flex: none;
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px calc(var(--jv-space-1) * -1) -6px 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-l);
        line-height: 1;
        cursor: pointer;
      }
      .x:hover {
        background: var(--jv-hover);
        color: var(--jv-text);
      }
      .x:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
      .combo {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .combo input {
        flex: 1 1 160px;
      }
      .combo .add {
        flex: none;
      }
      .combo .list {
        flex-basis: 100%;
      }
      input {
        width: 100%;
        display: block;
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      input::placeholder {
        color: var(--jv-text-2);
      }
      input:disabled {
        color: var(--jv-text-3);
      }
      .list {
        list-style: none;
        margin: var(--jv-space-1) 0 0;
        padding: var(--jv-space-1) 0;
        max-height: 240px;
        overflow-y: auto;
        scrollbar-width: thin;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        box-shadow: var(--jv-shadow);
      }
      .opt {
        display: flex;
        align-items: baseline;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        cursor: pointer;
        min-width: 0;
      }
      .opt:hover {
        background: var(--jv-hover);
      }
      .opt[aria-selected="true"] {
        background: var(--jv-accent-soft);
      }
      .opt .name {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .opt .sec {
        flex: none;
        max-width: 50%;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meta {
        padding: var(--jv-space-2) var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .note {
        margin: var(--jv-space-1) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-warn-text);
        overflow-wrap: anywhere;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  /** Focus the picker's input (fallback) or HA element. */
  override focus(): void {
    this.renderRoot.querySelector<HTMLElement>("input, ha-selector, ha-entity-picker, ha-entities-picker, ha-area-picker, ha-areas-picker")?.focus();
  }

  // ── value helpers ─────────────────────────────────────────────────────
  private _selected(): string[] {
    const v = this.value;
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x !== "");
    return typeof v === "string" && v !== "" ? [v] : [];
  }

  private _emit(next: string[]): void {
    const clean = [...new Set(next.map((s) => s.trim()).filter(Boolean))];
    const value: PickerChangeDetail["value"] = this.multiple ? clean : clean[0];
    this._note = "";
    this.dispatchEvent(new CustomEvent<PickerChangeDetail>("value-changed", { detail: { value }, bubbles: true, composed: true }));
  }

  private _pick(v: string): void {
    if (this.disabled || !v) return;
    const cur = this._selected();
    if (this.multiple) {
      if (!cur.includes(v)) this._emit([...cur, v]);
    } else {
      this._emit([v]);
      this._open = false;
    }
    this._query = "";
    this._active = 0;
  }

  private _remove(v: string): void {
    if (this.disabled) return;
    this._emit(this._selected().filter((x) => x !== v));
  }

  // ── item sources ──────────────────────────────────────────────────────
  private _states() {
    return Object.values(this.hass?.states ?? {});
  }

  private _friendly(id: string): string | undefined {
    const n = this.hass?.states?.[id]?.attributes?.friendly_name;
    return typeof n === "string" && n ? n : undefined;
  }

  /** The complete item list, or null when a registry fetch is needed first. */
  private _source(): PickerItem[] | null {
    if (this.items) {
      const list = typeof this.items === "function" ? this.items() : this.items;
      return Array.isArray(list) ? list : [];
    }
    switch (this.kind) {
      case "entity": {
        const domains = this.domains?.length ? new Set(this.domains) : null;
        return this._states()
          .filter((s) => !domains || domains.has(s.entity_id.split(".")[0]))
          .map((s) => {
            const name = this._friendly(s.entity_id);
            return { value: s.entity_id, label: name ?? s.entity_id, secondary: name ? s.entity_id : undefined };
          })
          .sort(byLabel);
      }
      case "domain":
        return [...new Set(this._states().map((s) => s.entity_id.split(".")[0]))].sort().map((d) => ({ value: d, label: d }));
      case "area": {
        const reg = this.hass?.areas;
        if (reg && typeof reg === "object") {
          return Object.values(reg as Record<string, Row>).map((r) => registryItem("area", r)).filter((x): x is PickerItem => !!x).sort(byLabel);
        }
        const snap = this.data?.areas;
        if (Array.isArray(snap) && snap.length) return snap.map((a) => ({ value: a.id, label: a.name || a.id })).sort(byLabel);
        return null;
      }
      case "label": {
        const snap = this.data?.config?.available_labels;
        if (Array.isArray(snap) && snap.length) {
          return snap.map((r) => registryItem("label", (r ?? {}) as Row)).filter((x): x is PickerItem => !!x).sort(byLabel);
        }
        return null;
      }
      case "device": {
        const reg = this.hass?.devices;
        if (reg && typeof reg === "object") {
          return Object.values(reg as Record<string, Row>).map((r) => registryItem("device", r)).filter((x): x is PickerItem => !!x).sort(byLabel);
        }
        return null;
      }
    }
    return [];
  }

  private _all(): PickerItem[] {
    return this._source() ?? this._registryItems ?? [];
  }

  private _ensureRegistry(): void {
    if (this._registryItems !== null || this._registryLoading || this._source() !== null || !this.hass) return;
    const p = loadRegistry(this.hass, this.kind);
    if (!p) {
      this._registryItems = [];
      return;
    }
    this._registryLoading = true;
    void p.then((items) => {
      this._registryItems = items;
      this._registryLoading = false;
    });
  }

  /** Label, secondary text and flags for a stored value (never throws for a stale id). */
  private _describe(v: string): { label: string; secondary?: string; missing: boolean; exempt: boolean } {
    const exempt = this.kind === "entity" && v.startsWith("!");
    const bare = exempt ? v.slice(1) : v;
    const all = this._all();
    const item = all.find((i) => i.value === bare) ?? (this.kind === "label" ? all.find((i) => i.label === bare) : undefined);
    if (item) return { label: item.label, secondary: item.secondary ?? (item.value !== item.label && this.kind !== "domain" ? item.value : undefined), missing: false, exempt };
    if (this.kind === "entity") {
      const name = this._friendly(bare);
      if (name) return { label: name, secondary: bare, missing: false, exempt };
    }
    return { label: bare, missing: this.kind !== "domain" && !(this._registryLoading || (this._source() === null && this._registryItems === null)), exempt };
  }

  private _filtered(): { shown: PickerItem[]; more: number } {
    const chosen = new Set(this._selected().map((v) => (v.startsWith("!") ? v.slice(1) : v)));
    const q = this._query.trim().toLowerCase();
    const pool = this._all().filter((i) => !chosen.has(i.value) && (!q || i.value.toLowerCase().includes(q) || i.label.toLowerCase().includes(q)));
    return { shown: pool.slice(0, MAX_SHOWN), more: Math.max(0, pool.length - MAX_SHOWN) };
  }

  // ── HA branch ─────────────────────────────────────────────────────────
  private _detectMode(): "selector" | "entity" | "area" | "fallback" {
    if (haDefined("ha-selector")) return "selector";
    if (this.kind === "entity" && haDefined(this.multiple ? "ha-entities-picker" : "ha-entity-picker")) return "entity";
    if (this.kind === "area" && haDefined(this.multiple ? "ha-areas-picker" : "ha-area-picker")) return "area";
    return "fallback";
  }

  private _focused(): boolean {
    try {
      return this.matches(":focus-within");
    } catch {
      return false;
    }
  }

  private _selector(): Record<string, unknown> {
    switch (this.kind) {
      case "entity":
        return { entity: { multiple: this.multiple, ...(this.domains?.length ? { filter: { domain: this.domains } } : {}) } };
      case "area":
        return { area: { multiple: this.multiple } };
      case "label":
        return { label: { multiple: this.multiple } };
      case "device":
        return { device: { multiple: this.multiple } };
      case "domain":
        return { select: { multiple: this.multiple, custom_value: true, mode: "dropdown", options: this._all().map((i) => ({ value: i.value, label: i.label })) } };
    }
    return {};
  }

  private _onHaChange(e: Event): void {
    e.stopPropagation();
    const raw = (e as CustomEvent<{ value?: unknown }>).detail?.value;
    const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : typeof raw === "string" && raw ? [raw] : [];
    this._emit(list);
  }

  private _renderHa(mode: "selector" | "entity" | "area") {
    const sel = this._selected();
    const value = this.multiple ? sel : sel[0] ?? "";
    if (mode === "selector") {
      return html`<ha-selector .hass=${this.hass} .selector=${this._selector()} .value=${value} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-selector>`;
    }
    if (mode === "entity") {
      return this.multiple
        ? html`<ha-entities-picker .hass=${this.hass} .value=${sel} .label=${this.label} .includeDomains=${this.domains ?? []} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-entities-picker>`
        : html`<ha-entity-picker .hass=${this.hass} .value=${value} .label=${this.label} .includeDomains=${this.domains ?? []} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-entity-picker>`;
    }
    return this.multiple
      ? html`<ha-areas-picker .hass=${this.hass} .value=${sel} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-areas-picker>`
      : html`<ha-area-picker .hass=${this.hass} .value=${value} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-area-picker>`;
  }

  // ── fallback ──────────────────────────────────────────────────────────
  private _onInput(e: Event): void {
    this._query = String((e.target as HTMLInputElement).value ?? "");
    this._active = 0;
    this._open = true;
    this._note = "";
  }

  private _onFocus(): void {
    this._ensureRegistry();
    this._open = true;
  }

  private _onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget as Node | null;
    if (to && this.renderRoot.contains(to)) return;
    this._open = false;
  }

  private _onKey(e: KeyboardEvent): void {
    const { shown } = this._filtered();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this._open = true;
        this._active = Math.min(this._active + 1, Math.max(0, shown.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        this._active = Math.max(this._active - 1, 0);
        break;
      case "Enter": {
        e.preventDefault();
        const typed = this._query.trim();
        if (this._open && shown[this._active]) {
          this._pick(shown[this._active].value);
        } else if (typed) {
          const exact = this._all().find((i) => i.value === typed || i.label.toLowerCase() === typed.toLowerCase());
          if (exact) this._pick(exact.value);
          else if (this.allowCustom) this._pick(typed);
          else this._note = t('"{value}" is not a known {thing}', { value: typed, thing: t(THING[this.kind]) });
        }
        break;
      }
      case "Escape":
        if (this._open) {
          e.stopPropagation();
          this._open = false;
        } else if (this._query) {
          e.stopPropagation();
          this._query = "";
        }
        break;
      case "Backspace": {
        const sel = this._selected();
        if (this.multiple && !this._query && sel.length) {
          e.preventDefault();
          this._remove(sel[sel.length - 1]);
        }
        break;
      }
    }
  }

  private _onAdd(): void {
    const typed = this._query.trim();
    if (!typed) {
      this.focus();
      this._open = true;
      return;
    }
    const exact = this._all().find((i) => i.value === typed || i.label.toLowerCase() === typed.toLowerCase());
    if (exact) this._pick(exact.value);
    else if (this.allowCustom) this._pick(typed);
    else this._note = t('"{value}" is not a known {thing}', { value: typed, thing: t(THING[this.kind]) });
  }

  private _renderChips() {
    const sel = this._selected();
    if (!sel.length) return nothing;
    return html`
      <ul class="chips" aria-label=${t("Selected")}>
        ${sel.map((v) => {
          const d = this._describe(v);
          return html`
            <li class="chip ${d.missing ? "missing" : ""}" title=${v}>
              <span class="chip-text">
                <span class="jv-truncate">${d.label}</span>
                ${d.secondary ? html`<span class="sec jv-mono">${d.secondary}</span>` : nothing}
                ${d.exempt ? html`<span class="tag">${t("exempt")}</span>` : nothing}
                ${d.missing ? html`<span class="tag warn">${t("not found")}</span>` : nothing}
              </span>
              <button type="button" class="x" aria-label=${t("Remove {name}", { name: d.label })} ?disabled=${this.disabled} @click=${() => this._remove(v)}>×</button>
            </li>
          `;
        })}
      </ul>
    `;
  }

  private _renderFallback() {
    const listId = `${this._uid}-list`;
    const { shown, more } = this._filtered();
    const open = this._open && !this.disabled;
    const activeId = open && shown[this._active] ? `${this._uid}-o${this._active}` : undefined;
    const single = !this.multiple && this._selected().length > 0;
    const placeholder = this.placeholder || (this.multiple || !single ? t("Search…") : t("Replace…"));
    const loading = this._registryLoading;
    return html`
      ${this._renderChips()}
      <div class="combo" @focusout=${this._onFocusOut}>
        <input
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-autocomplete="list"
          aria-expanded=${open ? "true" : "false"}
          aria-controls=${listId}
          aria-activedescendant=${activeId ?? nothing}
          aria-label=${this.label || t(THING[this.kind])}
          placeholder=${placeholder}
          .value=${live(this._query)}
          ?disabled=${this.disabled}
          @input=${this._onInput}
          @keydown=${this._onKey}
          @focus=${this._onFocus}
          @click=${this._onFocus}
        />
        ${this.allowCustom && this._query.trim()
          ? html`<button type="button" class="jv-btn add" ?disabled=${this.disabled} @click=${this._onAdd}>${t("Add")}</button>`
          : nothing}
        ${open
          ? html`
              <ul id=${listId} class="list" role="listbox" aria-label=${this.label || t(THING[this.kind])} @mousedown=${(e: Event) => e.preventDefault()}>
                ${shown.map(
                  (it, i) => html`
                    <li id="${this._uid}-o${i}" class="opt" role="option" aria-selected=${i === this._active ? "true" : "false"} @click=${() => this._pick(it.value)} @mousemove=${() => (this._active = i)}>
                      <span class="name">${it.label}</span>
                      ${it.secondary ? html`<span class="sec jv-mono">${it.secondary}</span>` : nothing}
                    </li>
                  `,
                )}
                ${loading ? html`<li class="meta" role="presentation">${t("Loading…")}</li>` : nothing}
                ${!loading && !shown.length
                  ? html`<li class="meta" role="presentation">${this._query.trim() && this.allowCustom ? t("Press Enter to add “{value}”", { value: this._query.trim() }) : t("No matches")}</li>`
                  : nothing}
                ${more ? html`<li class="meta" role="presentation">${t("{count} more — type to filter", { count: more })}</li>` : nothing}
              </ul>
            `
          : nothing}
      </div>
      ${this._note ? html`<p class="note" role="alert">${this._note}</p>` : nothing}
    `;
  }

  override willUpdate(): void {
    // Swap between the HA branch and the fallback only while unfocused, so
    // a lazily arriving HA element never steals the caret mid-typing.
    if (this._mode === null || !this._focused()) this._mode = this._detectMode();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("_active") && this._open) {
      const el = this.renderRoot.querySelector<HTMLElement>(`#${this._uid}-o${this._active}`);
      el?.scrollIntoView?.({ block: "nearest" });
    }
    if (changed.has("hass") && this._registryItems === null && this._open) this._ensureRegistry();
  }

  override render() {
    const mode = this._mode ?? this._detectMode();
    return mode === "fallback" ? this._renderFallback() : this._renderHa(mode);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-picker": JvPicker;
  }
}
