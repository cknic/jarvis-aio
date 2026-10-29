/**
 * <jv-logs-system> - the System Log card (jarvis/get_debug_log, newest
 * first). Category chips and a 200 ms debounced search filter the cached
 * entries client-side. On a background refresh the scroll offset is kept
 * unless the reader is at the top (or changed the filter), in which case the
 * list scrolls to the newest entry.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { haDefined, watchDefinitions } from "../../ha";
import "../../components";
import { ALL, cardStyles, catTone, isErrorRow, keyed, matches, orderCategories } from "./format";
import type { DebugEntry } from "./types";

const TOP_PX = 40;
const DEBOUNCE_MS = 200;

@customElement("jv-logs-system")
export class JvLogsSystem extends LitElement {
  /** oldest -> newest as the backend sends it; null until the first load */
  @property({ attribute: false }) entries: DebugEntry[] | null = null;
  @property({ type: String }) error: string | null = null;
  @property({ type: Boolean, reflect: true }) narrow = false;

  @state() private _cat = ALL;
  @state() private _query = "";
  @query(".scroll") private _scroll?: HTMLElement;

  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _prevTop = 0;
  private _prevHeight = 0;
  private _pendingScroll: "top" | "keep" | null = null;
  private _newest: DebugEntry[] = [];
  private _newestSrc: DebugEntry[] | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .scroll {
        max-height: max(320px, calc(100vh - 300px));
        overflow: auto;
        overscroll-behavior: contain;
        border-top: 1px solid var(--jv-divider);
      }
      :host([narrow]) .scroll {
        max-height: 55vh;
      }
      .cat {
        flex: none;
        min-width: 56px;
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        font-weight: var(--jv-font-weight-medium);
        line-height: 18px;
        text-align: center;
      }
      .cat.danger {
        background: var(--jv-danger-soft);
        color: var(--jv-danger-text);
      }
      .cat.accent {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
      }
      .cat.muted {
        opacity: 0.7;
      }
      .row .msg {
        font-family: var(--jv-font-code);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-alert"]);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = null;
  }

  // ── derived data ──────────────────────────────────────────────────────────

  private get _all(): DebugEntry[] {
    const src = this.entries ?? [];
    if (src !== this._newestSrc) {
      this._newestSrc = src;
      this._newest = [...src].reverse();
    }
    return this._newest;
  }

  private _filtered(): DebugEntry[] {
    const cat = this._cat;
    const q = this._query.trim();
    return this._all.filter((e) => (cat === ALL || e.cat === cat) && matches(q, e.msg, e.cat));
  }

  // ── scroll preservation ───────────────────────────────────────────────────

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const filterChanged = changed.has("_cat") || changed.has("_query");
    if (!filterChanged && !changed.has("entries")) return;
    const el = this._scroll;
    this._prevTop = el?.scrollTop ?? 0;
    this._prevHeight = el?.scrollHeight ?? 0;
    this._pendingScroll = filterChanged || this._prevTop <= TOP_PX ? "top" : "keep";
  }

  protected override updated(): void {
    const mode = this._pendingScroll;
    this._pendingScroll = null;
    const el = this._scroll;
    if (!mode || !el) return;
    if (mode === "top") {
      if (el.scrollTop !== 0) el.scrollTop = 0;
      return;
    }
    const delta = el.scrollHeight - this._prevHeight;
    if (delta) el.scrollTop = this._prevTop + delta;
  }

  // ── events ────────────────────────────────────────────────────────────────

  private _onSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._debounce = null;
      this._query = value;
    }, DEBOUNCE_MS);
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _emptyText(total: number, q: string): string {
    if (total === 0) return t("No entries yet. Talk to JARVIS to generate log entries.");
    let s = t("No entries match");
    if (q) s += ` "${q}"`;
    if (this._cat !== ALL) s += ` in ${this._cat}`;
    return `${s}.`;
  }

  private _renderError() {
    if (!this.error) return nothing;
    const text = `${t("Error loading logs:")} ${this.error}`;
    return haDefined("ha-alert")
      ? html`<ha-alert alert-type="error">${text}</ha-alert>`
      : html`<div class="banner" role="alert">${text}</div>`;
  }

  private _renderRows(rows: DebugEntry[]) {
    let lastDate = "";
    return repeat(
      keyed(rows, (e) => `${e.date} ${e.ts} ${e.cat} ${e.msg}`),
      (k) => k.key,
      ({ item: e }) => {
        const sep = e.date && e.date !== lastDate ? html`<li class="day" role="presentation">${e.date}</li>` : nothing;
        lastDate = e.date;
        return html`
          ${sep}
          <li class="row ${isErrorRow(e) ? "err" : ""}" title=${e.date || nothing}>
            <time>${e.ts}</time>
            <span class="cat ${catTone(e.cat)}">${e.cat}</span>
            <span class="msg">${e.msg}</span>
          </li>
        `;
      },
    );
  }

  override render() {
    const loaded = this.entries !== null;
    const all = this._all;
    const q = this._query.trim();
    const rows = this._filtered();
    const filtered = q !== "" || this._cat !== ALL;
    const badge = !loaded
      ? ""
      : filtered
        ? t("{shown} of {total}", { shown: rows.length, total: all.length })
        : t("{n} entries", { n: all.length });
    const cats = [ALL, ...orderCategories(all)];
    return html`
      <jv-section .heading=${t("System Log")} icon="mdi:text-box-search-outline" flush .loading=${!loaded && !this.error}>
        ${badge ? html`<jv-state-badge slot="actions" nodot level="neutral" .label=${badge}></jv-state-badge>` : nothing}
        <div class="controls">
          <label class="visually-hidden" for="q">${t("Search log…")}</label>
          <input id="q" class="search" type="search" placeholder=${t("Search log…")} autocomplete="off" @input=${this._onSearch} />
          <div class="chips" role="group" aria-label=${t("Filter by category")}>
            ${cats.map(
              (c) => html`
                <button
                  class="chip"
                  type="button"
                  aria-pressed=${c === this._cat ? "true" : "false"}
                  @click=${() => {
                    this._cat = c;
                  }}
                >
                  ${c === ALL ? t("All") : c}
                </button>
              `,
            )}
          </div>
        </div>
        ${this._renderError()}
        <div class="scroll" role="region" tabindex="0" aria-label=${t("System Log")}>
          ${!loaded && !this.error
            ? html`<div class="state" role="status">${t("Loading...")}</div>`
            : rows.length === 0
              ? html`<div class="state">${this._emptyText(all.length, q)}</div>`
              : html`<ul class="list jv-mono">${this._renderRows(rows)}</ul>`}
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-system": JvLogsSystem;
  }
}
