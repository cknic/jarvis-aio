/**
 * <jarvis-suggestions-learning .hass .data> - routine-learning status
 * (jarvis/get_cognitive_status) and the "Analyze Now" trigger
 * (jarvis/run_analysis). Status is fetched when hass first arrives and again
 * after each snapshot change (cheap: two sqlite counts) and after every run.
 */
import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws } from "../../ws";
import { watchDefinitions } from "../../ha";
import type { Hass, PanelData } from "../../types";
import type { CognitiveStatus, AnalysisResult, NearMiss } from "./types";
import { cardStyles, asInt, agoText, pad2, errorMessage } from "./format";

@customElement("jarvis-suggestions-learning")
export class JarvisSuggestionsLearning extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;

  @state() private _status: CognitiveStatus | null = null;
  @state() private _statusError = "";
  @state() private _loading = false;
  @state() private _running = false;
  @state() private _result: AnalysisResult | null = null;
  @state() private _runError = "";

  private _inFlight: Promise<void> | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .rows {
        padding: 0 var(--jv-space-4);
      }
      .foot {
        padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
        display: grid;
        gap: var(--jv-space-2);
      }
      .foot .jv-btn {
        width: 100%;
      }
      @container (min-width: 480px) {
        .foot .jv-btn {
          width: auto;
          justify-self: start;
        }
      }
      .result {
        display: grid;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .result p {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .result .lead {
        color: var(--jv-text);
      }
      .result.error .lead {
        color: var(--jv-danger);
      }
      .result ul {
        list-style: disc;
        padding-left: 20px;
      }
      .note {
        padding: 0 var(--jv-space-4) var(--jv-space-2);
      }
      .mono {
        font-family: var(--jv-font-code);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-alert"]);
  }

  override updated(changed: PropertyValues<this>): void {
    if ((changed.has("hass") && !this._status && !this._inFlight) || (changed.has("data") && this.data)) {
      if (this.hass) void this._fetchStatus();
    }
  }

  private _fetchStatus(): Promise<void> {
    if (this._inFlight) return this._inFlight;
    if (!this.hass) return Promise.resolve();
    if (!this._status) this._loading = true;
    this._inFlight = (async () => {
      try {
        const res = await ws<CognitiveStatus>(this.hass, "jarvis/get_cognitive_status");
        this._status = res && typeof res === "object" ? res : {};
        this._statusError = "";
      } catch (err) {
        this._statusError = errorMessage(err) || t("Learning status unavailable");
        if (!this._status) this._status = {};
      } finally {
        this._loading = false;
        this._inFlight = null;
      }
    })();
    return this._inFlight;
  }

  private async _analyze(): Promise<void> {
    if (this._running) return;
    this._running = true;
    this._runError = "";
    try {
      const res = await ws<AnalysisResult>(this.hass, "jarvis/run_analysis");
      this._result = res && typeof res === "object" ? res : { ran: false };
    } catch (err) {
      this._result = null;
      this._runError = errorMessage(err) || t("Analysis did not run.");
    } finally {
      this._running = false;
    }
    await this._fetchStatus();
    this.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  }

  private _renderResult() {
    if (this._runError) {
      return html`<div class="result error" role="status"><p class="lead">${this._runError}</p></div>`;
    }
    const r = this._result;
    if (!r) return nothing;
    const backfill = r.backfill && asInt(r.backfill.imported) > 0
      ? html`<p>${t("Imported {n} past events from history for {m} new entities.", { n: asInt(r.backfill.imported), m: asInt(r.backfill.entities) })}</p>`
      : nothing;
    if (!r.ran) {
      return html`
        <div class="result error" role="status">
          <p class="lead">${r.reason || r.error || t("Analysis did not run.")}</p>
          ${backfill}
        </div>
      `;
    }
    const found = asInt(r.patterns_found);
    const fresh = asInt(r.new_suggestions);
    const diag = r.diagnostic ?? {};
    const cand = Array.isArray(diag.candidates) ? diag.candidates[0] : undefined;
    const top = Array.isArray(diag.top_sources) ? diag.top_sources[0] : undefined;
    const misses: NearMiss[] = Array.isArray(r.near_misses) ? r.near_misses.slice(0, 5) : [];
    return html`
      <div class="result" role="status">
        <p class="lead">
          ${t("Found {n} patterns, {m} new suggestions.", { n: found, m: fresh })}
          ${fresh > 0 ? t("They're listed above.") : t("Nothing cleared the confidence bar this pass.")}
        </p>
        ${fresh > 0
          ? nothing
          : html`
              ${cand
                ? html`<p>${t("Closest routine: {entity} → {state} ~{hh}:00, seen {days}/{total} days (needs {min}).", {
                    entity: cand.entity_id,
                    state: cand.state,
                    hh: pad2(cand.hour),
                    days: asInt(cand.days),
                    total: asInt(diag.total_days),
                    min: asInt(diag.min_days),
                  })}</p>`
                : nothing}
              ${top ? html`<p>${t("Busiest source: {entity} ({changes} changes).", { entity: top.entity_id, changes: asInt(top.changes) })}</p>` : nothing}
              ${misses.length
                ? html`
                    <p>${t("Building toward suggestions:")}</p>
                    <ul>
                      ${misses.map(
                        (m) => html`<li>
                          ${m.description || m.type || ""}
                          ${m.needed == null ? `(${asInt(m.occurrences)}×)` : `(${asInt(m.occurrences)}/${asInt(m.needed)})`}
                        </li>`,
                      )}
                    </ul>
                  `
                : nothing}
            `}
        ${backfill}
      </div>
    `;
  }

  private _renderStatus() {
    const s = this._status ?? {};
    const learning = s.learning ?? {};
    const last = s.last_analysis ?? {};
    const ago = agoText(last.ts);
    const lastText = ago
      ? `${ago} · ${t("{n} found, {m} stored", { n: asInt(last.patterns_found), m: asInt(last.new_suggestions) })}`
      : t("Not yet this session");
    const unavailable = this._statusError || s.error;
    return html`
      ${unavailable
        ? html`<p class="note jv-muted">${t("Learning status unavailable")}${s.error ? html` — <span class="mono">${s.error}</span>` : nothing}</p>`
        : s.running === false
          ? html`<p class="note jv-muted">${t("Cognitive core is not running")}</p>`
          : nothing}
      <div class="rows">
        <jv-kv .label=${t("Data")} .value=${t("{n} days", { n: asInt(learning.days_of_data) })}></jv-kv>
        <jv-kv .label=${t("State changes")} .value=${String(asInt(learning.state_changes))} mono></jv-kv>
        <jv-kv .label=${t("Commands")} .value=${String(asInt(learning.commands))} mono></jv-kv>
        <jv-kv .label=${t("Pending suggestions")} .value=${String(asInt(learning.suggestions))} mono></jv-kv>
        <jv-kv .label=${t("Ignore rules")} .value=${String(asInt(s.ignore_rules))} mono></jv-kv>
        <jv-kv .label=${t("Last analysis")} .value=${lastText} stacked></jv-kv>
      </div>
    `;
  }

  override render() {
    const busy = this._running;
    return html`
      <jv-section .heading=${t("Routine Learning")} icon="mdi:school-outline" flush .loading=${busy}>
        ${this._loading && !this._status
          ? html`<div class="skeleton-rows" role="status" aria-label=${t("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`
          : this._renderStatus()}
        <div class="foot">
          <button class="jv-btn" type="button" ?disabled=${busy} aria-busy=${busy ? "true" : "false"} @click=${() => void this._analyze()}>
            ${busy ? t("Analyzing…") : t("Analyze Now")}
          </button>
          ${busy ? html`<p class="jv-muted" role="status">${t("Running pattern analysis over your history…")}</p>` : this._renderResult()}
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-suggestions-learning": JarvisSuggestionsLearning;
  }
}

