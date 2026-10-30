/**
 * <jarvis-docs-search .hass .libraryEmpty> - "Search documents": the same
 * retrieval JARVIS uses in conversation (jarvis/documents {action: "search"},
 * k fixed at 5 server-side). Read-only; keeps its own query / results / error
 * state so a library refresh never wipes a typed question.
 */
import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws } from "../../ws";
import { watchDefinitions } from "../../ha";
import type { Hass } from "../../types";
import "../../components";
import "./clamp";
import { cardStyles } from "./styles";
import { renderAlert } from "./alerts";
import { renderQueryForm } from "./query-form";
import { errorMessage, num, scorePct } from "./format";
import type { DocHit, DocSearchResult } from "./types";

@customElement("jarvis-docs-search")
export class JarvisDocsSearch extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** true once `status` reported no sources; null while unknown */
  @property({ attribute: false }) libraryEmpty: boolean | null = null;

  @state() private _query = "";
  @state() private _pending = false;
  @state() private _results: DocHit[] | null = null;
  @state() private _lastQuery = "";
  @state() private _error: string | null = null;

  static override styles = [base, cardStyles];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-textfield", "ha-alert", "ha-icon"]);
  }

  private async _search(): Promise<void> {
    const q = this._query.trim();
    if (!q || this._pending) return;
    this._pending = true;
    this._error = null;
    try {
      const res = await ws<DocSearchResult>(this.hass, "jarvis/documents", { action: "search", query: q });
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

  private _renderHit(h: DocHit): TemplateResult {
    const semantic = h.engine === "semantic";
    const showScore = semantic && h.score !== null && h.score !== undefined && num(h.score) > 0;
    const chunk = h.chunk === null || h.chunk === undefined || h.chunk === "" ? null : num(h.chunk);
    return html`
      <li class="hit">
        <div class="meta">
          <span class="source">${String(h.source ?? "")}</span>
          ${showScore ? html`<span class="score">${t("{pct}% match", { pct: scorePct(h.score) })}</span>` : nothing}
          ${chunk !== null ? html`<span class="chunk">${t("chunk {n}", { n: chunk })}</span>` : nothing}
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
    if (this._results === null) {
      return html`<p class="hint">
        ${this.libraryEmpty ? t("Add a document first.") : t("Type a question to see which passages JARVIS would use.")}
      </p>`;
    }
    const n = this._results.length;
    const header = n === 1 ? t("1 result for “{query}”", { query: this._lastQuery }) : t("{count} results for “{query}”", { count: n, query: this._lastQuery });
    const first = this._results[0];
    const badge =
      n > 0 && first
        ? first.engine === "semantic"
          ? html`<jv-state-badge level="accent" nodot .label=${t("Semantic")}></jv-state-badge>`
          : html`<jv-state-badge level="neutral" nodot .label=${t("Keyword")}></jv-state-badge>`
        : nothing;
    return html`
      <div class="results-head" role="status" aria-live="polite"><span>${header}</span>${badge}</div>
      ${n === 0
        ? html`<jv-empty compact icon="mdi:text-search" .heading=${t("No matches")} .message=${t("Try different words, or index more documents.")}></jv-empty>`
        : html`<ul>
            ${this._results.map((h) => this._renderHit(h))}
          </ul>`}
    `;
  }

  override render() {
    return html`
      <jv-section icon="mdi:text-search" .heading=${t("Search documents")} .subheading=${t("The same retrieval JARVIS uses when you ask it a question.")} ?loading=${this._pending}>
        ${renderQueryForm({
          id: "doc-query",
          label: t("Search documents"),
          placeholder: t("e.g. furnace filter size"),
          value: this._query,
          pending: this._pending,
          disabled: this.libraryEmpty === true,
          hasResults: this._results !== null,
          onInput: (v) => (this._query = v),
          onSubmit: () => void this._search(),
          onClear: () => this._clear(),
        })}
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-docs-search": JarvisDocsSearch;
  }
}
