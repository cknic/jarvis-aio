/**
 * <jarvis-cam-doorbell> - the "Doorbell Training" card body (spec §3.3):
 * Scan backlog (jarvis.train_doorbell_backlog, blocking, R5) with its Max
 * events field, the optional Run doorbell diagnostics button
 * (jarvis.diagnose_doorbell; result goes to the HA log), the stats line and
 * the recent-events list (newest first; model.normaliseTraining already
 * reversed the snapshot's oldest-first order).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { t } from "../../i18n";
import type { Hass } from "../../types";
import type { BadgeLevel } from "../../components/jv-state-badge";
import { confirmDialog } from "../../components";
import { type DoorbellTraining, clampLimit, errCode, errMsg, fmtDate, fmtDateTime, hasService, requestRefresh, toast } from "./model";

const HA_TAGS = ["ha-textfield"];
const RE_REFRESH_MS = 4000;

type ValueEl = HTMLElement & { value?: string };

function sourceLevel(src: string): BadgeLevel {
  if (src === "live") return "ok";
  if (src === "event-media") return "info";
  return "neutral";
}

@customElement("jarvis-cam-doorbell")
export class JarvisCamDoorbell extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ attribute: false }) training: DoorbellTraining | null = null;

  @state() private _scanning = false;
  @state() private _diagRunning = false;
  @state() private _limit = "40";

  private _timer: ReturnType<typeof setTimeout> | undefined;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
      }
      :host([narrow]) .controls .jv-btn {
        flex: 1 1 100%;
      }
      .limit {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .limit input {
        width: 6em;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      ha-textfield {
        width: 9em;
      }
      .stats {
        margin: var(--jv-space-3) 0 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .stats .muted {
        display: block;
        color: var(--jv-text-2);
      }
      ul {
        list-style: none;
        margin: var(--jv-space-3) 0 0;
        padding: 0;
      }
      li {
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
        min-width: 0;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
      }
      .ts {
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .cat {
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        font-size: var(--jv-font-size-xs);
        line-height: 20px;
      }
      .notable {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-warn-text);
      }
      .notable::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--jv-warn);
      }
      .text {
        margin: var(--jv-space-1) 0 0;
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .cam {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      jv-empty {
        margin-top: var(--jv-space-3);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) clearTimeout(this._timer);
    this._timer = undefined;
  }

  private _lang(): string | undefined {
    return this.hass?.locale?.language || this.hass?.language;
  }

  private async _scan(): Promise<void> {
    if (this._scanning) return;
    const h = this.hass;
    if (!hasService(h)) {
      toast(this, t("Home Assistant connection not available"));
      return;
    }
    const limit = clampLimit(this._limit);
    this._limit = String(limit);
    // each recorded event is one paid vision call — confirm like Analyze now does
    const ok = await confirmDialog({
      heading: t("Scan the doorbell backlog?"),
      message: t("Analyse up to {limit} recorded doorbell events? Each one is a vision LLM call, so this uses LLM credits and can take minutes.", { limit }),
      confirmLabel: t("Scan backlog"),
      cancelLabel: t("Cancel"),
    });
    if (!ok || this._scanning) return;
    this._scanning = true;
    toast(this, t("Scanning doorbell backlog (up to {limit})…", { limit }));
    try {
      await h.callService("jarvis", "train_doorbell_backlog", { limit });
      toast(this, t("Backlog scan finished — see Logs for the report"), "logs");
    } catch (err) {
      if (errCode(err) === "timeout") toast(this, t("Scan still running — the dataset updates when it finishes"));
      else toast(this, `${t("Backlog scan failed —")} ${errMsg(err)}`);
    } finally {
      this._scanning = false;
      requestRefresh(this);
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        this._timer = undefined;
        if (this.isConnected) requestRefresh(this);
      }, RE_REFRESH_MS);
    }
  }

  private async _diagnose(): Promise<void> {
    if (this._diagRunning) return;
    const h = this.hass;
    if (!hasService(h)) {
      toast(this, t("Home Assistant connection not available"));
      return;
    }
    this._diagRunning = true;
    try {
      await h.callService("jarvis", "diagnose_doorbell", {});
      toast(this, t("Doorbell diagnostics ran — see the Home Assistant log"));
    } catch (err) {
      toast(this, `${t("Doorbell diagnostics failed —")} ${errMsg(err)}`);
    } finally {
      this._diagRunning = false;
    }
  }

  private _onLimit(e: Event): void {
    this._limit = String((e.target as ValueEl).value ?? "");
  }

  private _onLimitBlur(): void {
    this._limit = String(clampLimit(this._limit));
  }

  private _renderLimit() {
    const label = t("Max events");
    if (haDefined("ha-textfield")) {
      return html`<ha-textfield
        type="number"
        min="1"
        max="500"
        step="1"
        .value=${this._limit}
        .label=${label}
        ?disabled=${this._scanning}
        @input=${this._onLimit}
        @change=${this._onLimitBlur}
      ></ha-textfield>`;
    }
    return html`
      <label class="limit">
        <span>${label}</span>
        <input
          type="number"
          min="1"
          max="500"
          step="1"
          inputmode="numeric"
          .value=${this._limit}
          ?disabled=${this._scanning}
          @input=${this._onLimit}
          @change=${this._onLimitBlur}
        />
      </label>
    `;
  }

  private _renderStats(tr: DoorbellTraining) {
    const s = tr.stats;
    const sources = Object.entries(s.by_source)
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ");
    const lang = this._lang();
    return html`
      <p class="stats" aria-live="polite">
        ${t("{total} analysed · {notable} notable", { total: s.total, notable: s.notable })} · ${sources || t("none yet")}
        ${s.first && s.last ? html`<span class="muted">${fmtDate(s.first, lang)} – ${fmtDate(s.last, lang)}</span>` : nothing}
      </p>
    `;
  }

  private _renderList(tr: DoorbellTraining) {
    if (!tr.recent.length) {
      return html`<jv-empty compact icon="mdi:doorbell-video" .message=${t("No analysed doorbell events yet. Run a backlog scan, or wait for the next doorbell press.")}></jv-empty>`;
    }
    const lang = this._lang();
    return html`
      <ul>
        ${tr.recent.map((e) => {
          const text = e.summary || e.analysis;
          return html`
            <li>
              <div class="meta">
                <span class="ts">${fmtDateTime(e.ts, lang)}</span>
                <jv-state-badge nodot level=${sourceLevel(e.image_source)} .label=${e.image_source}></jv-state-badge>
                ${e.category ? html`<span class="cat">${e.category}</span>` : nothing}
                ${e.notable ? html`<span class="notable">${t("Notable")}</span>` : nothing}
                ${e.camera ? html`<span class="cam">${e.camera}</span>` : nothing}
              </div>
              ${text ? html`<p class="text" title=${text}>${text}</p>` : nothing}
            </li>
          `;
        })}
      </ul>
    `;
  }

  override render() {
    const tr = this.training;
    return html`
      <div class="controls">
        <button type="button" class="jv-btn primary" ?disabled=${this._scanning} @click=${() => void this._scan()}>
          ${this._scanning ? t("Scanning…") : t("Scan backlog")}
        </button>
        ${this._renderLimit()}
        <button type="button" class="jv-btn" ?disabled=${this._diagRunning} @click=${() => void this._diagnose()}>
          ${t("Run doorbell diagnostics")}
        </button>
      </div>
      ${tr ? html`${this._renderStats(tr)} ${this._renderList(tr)}` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-cam-doorbell": JarvisCamDoorbell;
  }
}
