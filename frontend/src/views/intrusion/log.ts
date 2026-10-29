/**
 * <jv-intrusion-log .hass=${hass}> - the "Intrusion Log" card.
 *
 * Fetches `jarvis/intrusion {action:"log", limit}` and renders every event
 * with its kind, time, breach/reason, zones, signed snapshot thumbnail and
 * the REAL / FALSE ALARM / Clear label buttons. Labelling patches the one
 * event from the `label` response (no full re-fetch, so images are not
 * re-signed) and replaces the learning summary. Dispatches
 * "jv-intrusion-log" {events, learning} after every load so the status card
 * can fall back to the newest event's still.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { ws } from "../../ws";
import { t, onLanguageChange } from "../../i18n";
import type { Hass } from "../../types";
import "../../components";
import "./snapshot";
import {
  EMPTY_LEARNING,
  cameraName,
  errorMessage,
  formatTime,
  kindLabel,
  kindLevel,
  normaliseLearning,
  notify,
  relativeTime,
  type IntrusionEvent,
  type IntrusionLogResponse,
  type LabelResponse,
  type LearningSummary,
} from "./shared";

const PAGE = 40;
const MAX = 200;

@customElement("jv-intrusion-log")
export class JvIntrusionLog extends LitElement {
  @property({ attribute: false }) hass?: Hass;

  @state() private _events: IntrusionEvent[] | null = null;
  @state() private _learning: LearningSummary = EMPTY_LEARNING;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _limit = PAGE;
  @state() private _pending = new Set<string>();

  private _loaded = false;
  private _unsubLang?: () => void;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .banner {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        font-size: var(--jv-font-size-s);
      }
      .banner ha-icon {
        color: var(--jv-info);
        flex: none;
        --mdc-icon-size: 18px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        container-type: inline-size;
      }
      li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li:first-child {
        border-top: 0;
        padding-top: 0;
      }
      li .thumb {
        grid-column: 2;
        grid-row: 1 / span 2;
        align-self: start;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .time {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .what {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .extra {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .labels {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
      }
      /* no overflow: hidden here - it would clip the (outer) focus ring; the
         end buttons round their own corners instead */
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      .seg .jv-btn {
        border: 0;
        border-radius: 0;
      }
      .seg .jv-btn:first-child {
        border-radius: calc(var(--jv-radius-sm) - var(--jv-border-width)) 0 0 calc(var(--jv-radius-sm) - var(--jv-border-width));
      }
      .seg .jv-btn:last-child {
        border-radius: 0 calc(var(--jv-radius-sm) - var(--jv-border-width)) calc(var(--jv-radius-sm) - var(--jv-border-width)) 0;
      }
      .seg .jv-btn + .jv-btn {
        border-left: var(--jv-border-width) solid var(--jv-border);
      }
      /* pressed: the state colour carries in the ring, the text stays readable */
      .seg .jv-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
        box-shadow: inset 0 0 0 1px var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"].real {
        background: var(--jv-danger-soft);
        color: var(--jv-danger-text);
        box-shadow: inset 0 0 0 1px var(--jv-danger);
      }
      .seg .jv-btn[aria-pressed="true"]:focus-visible {
        box-shadow: var(--jv-focus-ring), inset 0 0 0 1px var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"].real:focus-visible {
        box-shadow: var(--jv-focus-ring), inset 0 0 0 1px var(--jv-danger);
      }
      .labelled {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .more {
        margin-top: var(--jv-space-3);
        display: flex;
        justify-content: center;
      }
      .skeleton-row {
        display: grid;
        gap: var(--jv-space-2);
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      .skeleton-row:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .skeleton-row .jv-skeleton:nth-child(2) {
        width: 60%;
      }
      .count {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      @container (max-width: 599px) {
        li {
          grid-template-columns: minmax(0, 1fr);
        }
        li .thumb {
          grid-column: 1;
          grid-row: auto;
          --jv-thumb-width: 100%;
          --jv-thumb-height: auto;
          --jv-thumb-ratio: 4 / 3;
        }
        .seg {
          width: 100%;
        }
        .seg .jv-btn {
          flex: 1 1 0;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon", "ha-icon-button"]);
    this._unsubLang = onLanguageChange(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubLang?.();
    this._unsubLang = undefined;
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("hass") && this.hass && !this._loaded) {
      this._loaded = true;
      void this.load();
    }
  }

  /** (Re)fetch the log; keeps the old rows visible while a refresh runs. */
  async load(limit: number = this._limit): Promise<void> {
    if (this._loading) return;
    this._loading = true;
    this._error = null;
    this._limit = limit;
    try {
      const res = await ws<IntrusionLogResponse>(this.hass, "jarvis/intrusion", { action: "log", limit });
      const events = Array.isArray(res?.events) ? res.events : [];
      this._events = events;
      this._learning = normaliseLearning(res?.learning);
      this.dispatchEvent(
        new CustomEvent("jv-intrusion-log", {
          detail: { events, learning: this._learning },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._loading = false;
    }
  }

  private async _label(ev: IntrusionEvent, label: "real" | "false" | ""): Promise<void> {
    if (this._pending.has(ev.id)) return;
    if ((label === "" && ev.label == null) || (label !== "" && ev.label === label)) return; // no-op
    this._pending = new Set([...this._pending, ev.id]);
    try {
      const res = await ws<LabelResponse>(this.hass, "jarvis/intrusion", { action: "label", event_id: ev.id, label });
      if (res && res.ok === false) {
        notify(this, res.error || t("Could not save the label"));
        if (res.learning) this._learning = normaliseLearning(res.learning);
        // "event not found": the log was truncated between fetch and click
        void this.load();
        return;
      }
      const next: IntrusionEvent["label"] =
        res && "label" in res && (res.label === "real" || res.label === "false" || res.label === null)
          ? res.label
          : label === ""
            ? null
            : label;
      this._events = (this._events ?? []).map((e) =>
        e.id === ev.id ? { ...e, label: next, labeled_ts: Date.now() / 1000 } : e,
      );
      if (res?.learning) this._learning = normaliseLearning(res.learning);
      else this._learning = { ...this._learning, labeled: this._events.filter((e) => e.label).length };
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      const p = new Set(this._pending);
      p.delete(ev.id);
      this._pending = p;
    }
  }

  private _renderRefresh() {
    const label = t("Refresh");
    if (haDefined("ha-icon-button")) {
      return html`
        <ha-icon-button slot="actions" .label=${label} ?disabled=${this._loading} @click=${() => void this.load()}>
          ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:refresh"></ha-icon>` : nothing}
        </ha-icon-button>
      `;
    }
    return html`
      <button slot="actions" class="jv-icon-btn" type="button" aria-label=${label} ?disabled=${this._loading} @click=${() => void this.load()}>
        ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:refresh"></ha-icon>` : html`<span aria-hidden="true">↻</span>`}
      </button>
    `;
  }

  private _renderEvent(ev: IntrusionEvent) {
    const pending = this._pending.has(ev.id);
    const cam = cameraName(this.hass, ev.camera);
    const who = ev.breach || cam || t("activity");
    const abs = formatTime(this.hass, ev.ts);
    const extras: string[] = [];
    if (Array.isArray(ev.zones) && ev.zones.length) extras.push(ev.zones.join(", "));
    if (ev.max_depth != null && Number.isFinite(Number(ev.max_depth))) extras.push(t("depth {n}", { n: ev.max_depth }));
    return html`
      <li>
        <div class="meta">
          <jv-state-badge level=${kindLevel(ev.kind)} .label=${kindLabel(ev.kind)}></jv-state-badge>
          <time class="time" datetime=${new Date(Number(ev.ts) * 1000).toISOString()} title=${abs}>${relativeTime(ev.ts)}</time>
        </div>
        ${ev.snapshot_url
          ? html`<jv-intrusion-snapshot
              class="thumb"
              variant="thumb"
              .hass=${this.hass}
              .path=${ev.snapshot_url}
              .alt=${t("Intrusion snapshot")}
              .caption=${""}
            ></jv-intrusion-snapshot>`
          : nothing}
        <div>
          <p class="what">${who}${ev.reason ? html` — <span class="jv-muted">${ev.reason}</span>` : nothing}</p>
          ${extras.length ? html`<p class="extra">${extras.join(" · ")}</p>` : nothing}
        </div>
        <div class="labels" role="group" aria-label=${t("Label this event")}>
          <span class="seg">
            <button
              class="jv-btn real"
              type="button"
              aria-pressed=${ev.label === "real" ? "true" : "false"}
              ?disabled=${pending}
              @click=${() => void this._label(ev, "real")}
            >
              ${t("REAL")}
            </button>
            <button
              class="jv-btn"
              type="button"
              aria-pressed=${ev.label === "false" ? "true" : "false"}
              ?disabled=${pending}
              @click=${() => void this._label(ev, "false")}
            >
              ${t("FALSE ALARM")}
            </button>
          </span>
          ${ev.label
            ? html`<button class="jv-btn text" type="button" ?disabled=${pending} @click=${() => void this._label(ev, "")}>
                ${t("Clear label")}
              </button>`
            : nothing}
          ${ev.labeled_ts && ev.label
            ? html`<span class="labelled">${t("labelled {time}", { time: formatTime(this.hass, ev.labeled_ts) })}</span>`
            : nothing}
        </div>
      </li>
    `;
  }

  private _renderBody() {
    if (this._events === null) {
      if (this._error) {
        return html`
          <jv-empty compact kind="error" icon="mdi:alert-circle-outline" .heading=${t("Could not load the log.")} .message=${this._error}>
            <button slot="action" class="jv-btn" type="button" @click=${() => void this.load()}>${t("Retry")}</button>
          </jv-empty>
        `;
      }
      return html`
        <div role="status" aria-live="polite" aria-label=${t("Loading...")}>
          ${[0, 1, 2].map(
            () => html`<div class="skeleton-row"><div class="jv-skeleton"></div><div class="jv-skeleton"></div></div>`,
          )}
        </div>
      `;
    }
    if (!this._events.length) {
      return html`<jv-empty compact icon="mdi:shield-check-outline" .message=${t("No intrusion events recorded yet.")}></jv-empty>`;
    }
    const canMore = this._events.length >= this._limit && this._limit < MAX;
    return html`
      ${this._error
        ? html`<div class="banner" role="alert">${t("Could not load the log.")} ${this._error}</div>`
        : nothing}
      <ul>
        ${this._events.map((ev) => this._renderEvent(ev))}
      </ul>
      ${canMore
        ? html`<div class="more">
            <button class="jv-btn text" type="button" ?disabled=${this._loading} @click=${() => void this.load(MAX)}>
              ${t("Show more")}
            </button>
          </div>`
        : nothing}
    `;
  }

  override render() {
    const l = this._learning;
    // spec: loading "…", loaded "n/m LABELLED", first-load error -> hidden
    // (a stale count stays while a refresh of existing rows fails)
    const count = this._events === null ? (this._error ? "" : "…") : `${l.labeled}/${l.events} ${t("LABELLED")}`;
    const damped = l.damped_patterns.length;
    return html`
      <jv-section .heading=${t("Intrusion Log")} icon="mdi:format-list-bulleted-type" ?loading=${this._loading && this._events !== null}>
        ${count ? html`<span slot="actions" class="count" aria-live="polite">${count}</span>` : nothing}
        ${this._renderRefresh()}
        <p class="intro">
          ${t(
            "Every intrusion event with its snapshot. Mark each one real or false alarm — JARVIS learns from your labels and stops firing the low-confidence alerts for patterns you keep calling false. A confirmed intrusion always alerts, no matter what it has learned.",
          )}
        </p>
        ${damped > 0
          ? html`<div class="banner" role="status">
              ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:school-outline" aria-hidden="true"></ha-icon>` : nothing}
              <span>
                ${damped === 1
                  ? t("JARVIS has learned {n} benign pattern — low-confidence alerts for these stay quiet.", { n: damped })
                  : t("JARVIS has learned {n} benign patterns — low-confidence alerts for these stay quiet.", { n: damped })}
              </span>
            </div>`
          : nothing}
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-intrusion-log": JvIntrusionLog;
  }
}
