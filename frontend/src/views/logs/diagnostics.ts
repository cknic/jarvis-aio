/**
 * <jv-logs-diagnostics> - System Diagnostics (jarvis/diagnostics +
 * jarvis/get_calibration). The probe is expensive (live LLM / embedding
 * pings), so it runs once when `hass` arrives and then only on "Run check";
 * the view's Refresh button leaves it alone.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws, WsError } from "../../ws";
import { haDefined, watchDefinitions } from "../../ha";
import type { Hass } from "../../types";
import type { BadgeLevel } from "../../components";
import "../../components";
import { cardStyles, num, pct } from "./format";
import type { CalibrationResponse, DiagnosticsResponse, ServiceRow } from "./types";

function overallLevel(overall: string | undefined): BadgeLevel {
  switch (overall) {
    case "ok":
      return "ok";
    case "warn":
      return "warn";
    case "down":
      return "danger";
    default:
      return "neutral";
  }
}

function statusPill(status: string): { label: string; level: BadgeLevel } {
  switch (status) {
    case "ok":
      return { label: t("OK"), level: "ok" };
    case "idle":
      return { label: t("IDLE"), level: "neutral" };
    case "warn":
      return { label: t("WARN"), level: "warn" };
    case "down":
      return { label: t("DOWN"), level: "danger" };
    case "off":
      return { label: t("OFF"), level: "neutral" };
    default:
      return { label: "?", level: "neutral" };
  }
}

@customElement("jv-logs-diagnostics")
export class JvLogsDiagnostics extends LitElement {
  @property({ attribute: false }) hass?: Hass;

  @state() private _diag: DiagnosticsResponse | null = null;
  @state() private _calib: CalibrationResponse | null = null;
  @state() private _error: string | null = null;
  @state() private _running = false;
  private _ran = false;

  static override styles = [
    base,
    cardStyles,
    css`
      .services {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .service {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0 var(--jv-space-3);
        padding: var(--jv-space-2) 0;
        border-bottom: 1px solid var(--jv-divider);
      }
      .service:last-child {
        border-bottom: 0;
      }
      .service .name {
        font-weight: var(--jv-font-weight-medium);
      }
      .service .detail {
        grid-column: 1 / -1;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: var(--jv-space-3);
      }
      .meta {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .bins {
        display: grid;
        gap: var(--jv-space-1);
        margin: var(--jv-space-2) 0;
      }
      .bin {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
      }
      .bin .label {
        font-family: var(--jv-font-code);
        font-variant-numeric: tabular-nums;
        color: var(--jv-text-2);
      }
      .bar {
        height: 8px;
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        overflow: hidden;
      }
      .bar .fill {
        height: 100%;
        border-radius: inherit;
        background: var(--jv-ok);
      }
      .line {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .line strong {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .error {
        color: var(--jv-text);
      }
      .error .detail {
        display: block;
        margin-top: var(--jv-space-1);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon"]);
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("hass") && this.hass && !this._ran) void this.run();
  }

  /** Run the health probe + calibration read. Public for the view / tests. */
  async run(): Promise<void> {
    if (!this.hass || this._running) return;
    this._ran = true;
    this._running = true;
    const [diag, calib] = await Promise.allSettled([
      ws<DiagnosticsResponse>(this.hass, "jarvis/diagnostics"),
      ws<CalibrationResponse>(this.hass, "jarvis/get_calibration"),
    ]);
    if (diag.status === "fulfilled") {
      this._diag = diag.value ?? {};
      this._error = null;
    } else {
      const e = WsError.from("jarvis/diagnostics", diag.reason);
      this._error = e.message || e.code;
    }
    this._calib = calib.status === "fulfilled" ? (calib.value ?? {}) : { error: String(calib.reason) };
    this._running = false;
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _renderBadge() {
    if (this._error) return html`<jv-state-badge slot="actions" nodot level="neutral" label="—"></jv-state-badge>`;
    const d = this._diag;
    if (!d) return nothing;
    const label = d.summary || (d.overall || "").toUpperCase();
    return label
      ? html`<jv-state-badge slot="actions" level=${overallLevel(d.overall)} .label=${label}></jv-state-badge>`
      : nothing;
  }

  private _renderServices(d: DiagnosticsResponse) {
    const services: ServiceRow[] = Array.isArray(d.services) ? d.services : [];
    if (services.length === 0) return html`<p class="sub">${d.summary || ""}</p>`;
    return html`
      <ul class="services">
        ${services.map((s) => {
          const pill = statusPill(String(s.status));
          return html`
            <li class="service">
              <span class="name">${s.name}</span>
              <jv-state-badge level=${pill.level} .label=${pill.label}></jv-state-badge>
              ${s.detail ? html`<span class="detail">${s.detail}</span>` : nothing}
            </li>
          `;
        })}
      </ul>
    `;
  }

  private _renderCalibration(c: CalibrationResponse | null) {
    if (!c) return nothing;
    const cal = c.calibration ?? {};
    const n = cal.n ?? 0;
    const heading = html`<h3>${t("Judgment calibration")}</h3>`;
    if (c.error || n === 0) {
      return html`${heading}
        <p class="sub">${t("No judged decisions yet — this appears once JARVIS's decisions accrue outcomes.")}</p>`;
    }
    const bins = (cal.bins ?? []).filter((b) => (b.count ?? 0) > 0);
    const budget = c.interruption_budget ?? {};
    const judged = budget.judged ?? 0;
    const thr = c.suggestion_threshold;
    const fmt = (v: number | null | undefined) => (typeof v === "number" ? v.toFixed(3) : "—");
    return html`
      ${heading}
      <div class="meta">${t("Brier {brier} · ECE {ece} · n={n}", { brier: fmt(cal.brier), ece: fmt(cal.ece), n })}</div>
      ${bins.length
        ? html`<div class="bins">
            ${bins.map(
              (b) => html`
                <div class="bin">
                  <span class="label">${pct(b.lo)}–${pct(b.hi)}</span>
                  <div class="bar" role="img" aria-label=${pct(b.good_rate)}>
                    <div class="fill" style="width:${Math.round((b.good_rate ?? 0) * 100)}%"></div>
                  </div>
                  <span class="meta">${t("{rate} good · n={count}", { rate: pct(b.good_rate), count: num(b.count) })}</span>
                </div>
              `,
            )}
          </div>`
        : nothing}
      <p class="line">
        ${judged > 0
          ? html`${t("Interruption budget: {assessment} — {rate} of {judged} recent decisions dismissed (cap ×{multiplier}).", {
              assessment: t(budget.assessment || "no data"),
              rate: pct(budget.unwelcome_rate),
              judged,
              multiplier: num(budget.multiplier ?? 1),
            })}`
          : t("Interruption budget: no recent judged decisions.")}
      </p>
      ${thr && Math.abs(thr.learned_delta) > 0.001
        ? html`<p class="line">
            ${t("Suggestion bar {dir} to {effective} (from {base}) based on recent usefulness.", {
              dir: thr.learned_delta > 0 ? t("raised") : t("lowered"),
              effective: pct(thr.effective),
              base: pct(thr.base),
            })}
          </p>`
        : nothing}
    `;
  }

  override render() {
    const busy = this._running;
    const first = !this._diag && !this._error;
    return html`
      <jv-section
        .heading=${t("System Diagnostics")}
        .subheading=${t('Health of the core services JARVIS calls — LLM, embeddings, speech. A quick "is everything up?" check.')}
        icon="mdi:stethoscope"
        .loading=${busy}
      >
        ${this._renderBadge()}
        ${first && busy
          ? html`<div class="state" role="status">${t("Loading...")}</div>`
          : this._error
            ? html`<div class="error" role="alert">
                ${t("Couldn't run diagnostics — restart Home Assistant after updating.")}
                <span class="detail">${this._error}</span>
              </div>`
            : this._diag
              ? this._renderServices(this._diag)
              : nothing}
        ${this._renderCalibration(this._calib)}
        <div class="actions">
          <button class="jv-btn" type="button" ?disabled=${busy || !this.hass} @click=${() => void this.run()}>
            ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>` : nothing}
            ${busy ? html`<span>${t("Checking…")}</span>` : html`<span class="sentence">${t("RUN CHECK")}</span>`}
          </button>
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-diagnostics": JvLogsDiagnostics;
  }
}
