/**
 * <jarvis-docs-memory .hass .stats> - "Conversation memory": a query box over
 * the long-term conversation memory (jarvis/search_memory {query, k: 8}).
 * `stats` is data.config.memory_stats from the snapshot (undefined while the
 * snapshot has not loaded); a missing backend or an empty store shows the
 * hint instead of the form. Scores are shown only for vector backends.
 */
import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws } from "../../ws";
import { watchDefinitions } from "../../ha";
import type { Hass, JarvisNavigateDetail } from "../../types";
import "../../components";
import "./clamp";
import { cardStyles } from "./styles";
import { renderAlert } from "./alerts";
import { renderQueryForm } from "./query-form";
import { tRich } from "./rich";
import { errorMessage, isVectorBackend, num, scorePct, tsToLocale } from "./format";
import type { MemoryHit, MemorySearchResult, MemoryStats } from "./types";

const MEMORY_K = 8;

@customElement("jarvis-docs-memory")
export class JarvisDocsMemory extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** undefined = snapshot not loaded; null = snapshot without memory_stats */
  @property({ attribute: false }) stats: MemoryStats | null | undefined = undefined;

  @state() private _query = "";
  @state() private _pending = false;
  @state() private _results: MemoryHit[] | null = null;
  @state() private _lastQuery = "";
  @state() private _error: string | null = null;

  static override styles = [base, cardStyles];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-textfield", "ha-alert", "ha-icon"]);
  }

  private get _available(): boolean {
    const s = this.stats;
    if (!s) return false;
    const backend = typeof s.backend === "string" ? s.backend : "";
    if (backend === "none" || backend === "unavailable") return false;
    return num(s.total_memories) > 0;
  }

  private async _search(): Promise<void> {
    const q = this._query.trim();
    if (!q || this._pending) return;
    this._pending = true;
    this._error = null;
    try {
      const res = await ws<MemorySearchResult>(this.hass, "jarvis/search_memory", { query: q, k: MEMORY_K });
      this._results = Array.isArray(res?.results) ? res.results : [];
      this._lastQuery = q;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._pending = false;
    }
  }

  private _clear(): void {
    this._query = "";
    this._results = null;
    this._lastQuery = "";
    this._error = null;
  }

  private _goMemory(): void {
    const detail: JarvisNavigateDetail = { view: "memory" };
    this.dispatchEvent(new CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail }));
  }

  private _locale(): string | undefined {
    return this.hass?.locale?.language || this.hass?.language || undefined;
  }

  private _renderHit(h: MemoryHit, vector: boolean, locale?: string): TemplateResult {
    const role = h.role === "user" ? t("You") : h.role === "assistant" ? t("JARVIS") : "";
    const when = tsToLocale(h.timestamp, locale);
    const showScore = vector && num(h.score) > 0;
    return html`
      <li class="hit">
        <div class="meta">
          ${role ? html`<span class="role">${role}</span>` : nothing}
          ${when ? html`<span class="when">${when}</span>` : nothing}
          ${showScore ? html`<span class="score">${t("{pct}% match", { pct: scorePct(h.score) })}</span>` : nothing}
        </div>
        <jarvis-docs-clamp .text=${String(h.text ?? "")}></jarvis-docs-clamp>
      </li>
    `;
  }

  private _renderBody(): TemplateResult {
    if (this._error !== null) {
      return renderAlert({
        tone: "error",
        body: t("Search failed — {message}", { message: this._error }),
        action: { label: t("Retry"), run: () => void this._search() },
      });
    }
    if (this._results === null) return html``;
    const n = this._results.length;
    const header = n === 1 ? t("1 result for “{query}”", { query: this._lastQuery }) : t("{count} results for “{query}”", { count: n, query: this._lastQuery });
    const vector = isVectorBackend(this.stats?.backend);
    const locale = this._locale();
    return html`
      <div class="results-head" role="status" aria-live="polite"><span>${header}</span></div>
      ${n === 0
        ? html`<jv-empty compact icon="mdi:brain" .message=${t("No matching conversations.")}></jv-empty>`
        : html`<ul>
            ${this._results.map((h) => this._renderHit(h, vector, locale))}
          </ul>`}
    `;
  }

  override render() {
    const loading = this.stats === undefined;
    const s = this.stats;
    const subheading =
      !loading && s ? t("{count} memories · {backend}", { count: num(s.total_memories), backend: String(s.backend ?? "—") }) : "";
    const memoryLink = html`<button class="link jv-hit" type="button" @click=${this._goMemory}>${t("Memory")}</button>`;
    return html`
      <jv-section icon="mdi:brain" .heading=${t("Conversation memory")} .subheading=${subheading} ?loading=${loading || this._pending}>
        ${loading
          ? html`<div class="loading" role="status" aria-live="polite" aria-label=${t("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`
          : !this._available
            ? html`<jv-empty
                compact
                icon="mdi:brain"
                .heading=${t("No conversation memory yet")}
                .message=${t("JARVIS stores conversations once a memory backend is available; see Settings → Learning.")}
              ></jv-empty>`
            : html`
                <p class="caption">${tRich("Searches what was said in past conversations. The facts JARVIS has been taught live on the {memory} page.", { memory: memoryLink })}</p>
                ${renderQueryForm({
                  id: "memory-query",
                  label: t("Search conversations"),
                  placeholder: t("e.g. when did we buy the dishwasher"),
                  value: this._query,
                  pending: this._pending,
                  disabled: false,
                  hasResults: this._results !== null,
                  onInput: (v) => (this._query = v),
                  onSubmit: () => void this._search(),
                  onClear: () => this._clear(),
                })}
                ${this._renderBody()}
              `}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-docs-memory": JarvisDocsMemory;
  }
}
