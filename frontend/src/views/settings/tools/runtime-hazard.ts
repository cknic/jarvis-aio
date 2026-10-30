/**
 * <jarvis-tool-hazard> - Hazard Monitor (settings-tools.md §4.14): the
 * monitor's resolved status (jarvis/hazard status) and an on-demand, read-only
 * scan of USGS / NWS / NASA EONET (jarvis/hazard scan). Scan results are not
 * persisted. The status is re-read when a hazard_* key changes elsewhere on
 * the page.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { t } from "../../../i18n";
import { WsError } from "../../../ws";
import { confirmDialog } from "../../../components";
import { JarvisToolCard, wsMessage } from "./runtime-base";

export interface HazardStatus {
  enabled: boolean;
  center: [number, number] | null;
  using_override: boolean;
  quake_radius_km: number;
  quake_min_mag: number;
  disaster_radius_km: number;
  feeds: { earthquakes: boolean; weather: boolean; disasters: boolean };
}

export interface HazardScan {
  ok: boolean;
  error?: string;
  center?: [number, number];
  earthquakes?: Array<{ mag: number; place: string; dist_km: number }>;
  weather?: Array<{ severity: string; event: string; area?: string }>;
  disasters?: Array<{ category: string; title: string; dist_km: number }>;
  counts?: { earthquakes: number; weather: number; disasters: number };
}

const HAZARD_KEYS = [
  "hazard_monitor_enabled", "hazard_lat", "hazard_lon", "hazard_quakes_on", "hazard_weather_on", "hazard_disasters_on",
  "hazard_quake_radius_km", "hazard_quake_min_mag", "hazard_disaster_radius_km",
];
/** §9 R11: after 30 s the button is re-enabled and the note says the scan is still running. */
const SCAN_GUARD_MS = 30_000;

const fmt3 = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : String(n));
const km = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0);

@customElement("jarvis-tool-hazard")
export class JarvisToolHazard extends JarvisToolCard {
  @state() private _status: HazardStatus | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;
  @state() private _scanning = false;
  @state() private _slow = false;
  @state() private _scan: HazardScan | null = null;
  @state() private _scanError: string | null = null;

  private _sig = "";
  private _scanSeq = 0;
  private _guard: ReturnType<typeof setTimeout> | undefined;

  static override styles = [
    ...JarvisToolCard.styles,
    css`
      .loc {
        margin: 0 0 var(--jv-space-3);
        overflow-wrap: anywhere;
      }
      .feeds {
        margin-bottom: var(--jv-space-3);
      }
      ul.results {
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      ul.results li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: 28px;
        overflow-wrap: anywhere;
      }
      .clear {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-3);
        flex-wrap: wrap;
      }
    `,
  ];

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._guard);
  }

  protected override onFirstActive(): void {
    this._sig = this._signature();
    void this._load();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (this._status && (changed.has("data") || changed.has("hass"))) {
      const sig = this._signature();
      if (sig !== this._sig) {
        this._sig = sig;
        void this._load();
      }
    }
  }

  private _signature(): string {
    return JSON.stringify(HAZARD_KEYS.map((k) => this.value(k) ?? null));
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = null;
    try {
      const o = (await this.ws<Partial<HazardStatus>>("jarvis/hazard", { action: "status" })) ?? {};
      const c = o.center;
      const feeds = o.feeds && typeof o.feeds === "object" ? o.feeds : { earthquakes: false, weather: false, disasters: false };
      this._status = {
        enabled: !!o.enabled,
        center: Array.isArray(c) && c.length >= 2 && typeof c[0] === "number" && typeof c[1] === "number" ? [c[0], c[1]] : null,
        using_override: !!o.using_override,
        quake_radius_km: km(o.quake_radius_km),
        quake_min_mag: typeof o.quake_min_mag === "number" ? o.quake_min_mag : 0,
        disaster_radius_km: km(o.disaster_radius_km),
        feeds: { earthquakes: !!feeds.earthquakes, weather: !!feeds.weather, disasters: !!feeds.disasters },
      };
    } catch (err) {
      this._error = wsMessage(WsError.from("jarvis/hazard", err));
    } finally {
      this._loading = false;
    }
  }

  private async _runScan(): Promise<void> {
    // a scan past the 30 s guard may be re-run; only the latest one's answer is shown
    if ((this._scanning && !this._slow) || !this.hass) return;
    // the scan fans out to three external services on demand: ask first (not destructive)
    const go = await confirmDialog({
      heading: t("Scan for hazards now?"),
      message: t("JARVIS checks USGS, NWS and NASA EONET around your location once. Read-only — it never announces or alerts."),
      confirmLabel: t("Scan now"),
    });
    if (!go || !this.hass) return;
    const seq = ++this._scanSeq;
    this._scanning = true;
    this._slow = false;
    this._scan = null;
    this._scanError = null;
    clearTimeout(this._guard);
    this._guard = setTimeout(() => {
      if (seq === this._scanSeq) this._slow = true;
    }, SCAN_GUARD_MS);
    try {
      const res = await this.ws<HazardScan>("jarvis/hazard", { action: "scan" });
      if (seq !== this._scanSeq) return;
      this._scan = res && typeof res === "object" ? res : { ok: false, error: t("Scan failed: {message}", { message: "empty response" }) };
    } catch (err) {
      if (seq !== this._scanSeq) return;
      this._scanError = wsMessage(WsError.from("jarvis/hazard", err));
    } finally {
      if (seq === this._scanSeq) {
        clearTimeout(this._guard);
        this._scanning = false;
        this._slow = false;
      }
    }
  }

  // ── render ──────────────────────────────────────────────────────────────

  private _renderLocation(s: HazardStatus) {
    if (!s.center) return html`<p class="loc">${t("Location: no home coordinates set in Home Assistant.")}</p>`;
    const vars = { lat: fmt3(s.center[0]), lon: fmt3(s.center[1]) };
    return html`<p class="loc">${s.using_override ? t("Location: override {lat}, {lon}.", vars) : t("Location: home {lat}, {lon}.", vars)}</p>`;
  }

  private _renderFeeds(s: HazardStatus) {
    const badge = (on: boolean, label: string, detail: string) => html`
      <jv-state-badge nodot level=${on ? "ok" : "neutral"}>${label}${detail ? ` · ${detail}` : ""}</jv-state-badge>
    `;
    return html`
      <div class="badges feeds">
        ${badge(s.feeds.earthquakes, t("Earthquakes"), t("{km} km, M ≥ {mag}", { km: s.quake_radius_km, mag: s.quake_min_mag }))}
        ${badge(s.feeds.weather, t("Severe weather"), "")}
        ${badge(s.feeds.disasters, t("Disasters"), t("{km} km", { km: s.disaster_radius_km }))}
      </div>
    `;
  }

  private _renderScanResult() {
    if (this._scanError) return this.renderAlert("error", t("Scan failed: {message}", { message: this._scanError }));
    const r = this._scan;
    if (!r) return nothing;
    if (!r.ok) return this.renderAlert("warning", r.error || t("Scan failed: {message}", { message: "" }));
    const quakes = Array.isArray(r.earthquakes) ? r.earthquakes : [];
    const weather = Array.isArray(r.weather) ? r.weather : [];
    const disasters = Array.isArray(r.disasters) ? r.disasters : [];
    const center = r.center ?? this._status?.center ?? [0, 0];
    if (!quakes.length && !weather.length && !disasters.length) {
      return html`
        <div class="clear" role="status">
          <jv-state-badge level="ok" nodot .label=${t("All clear")}></jv-state-badge>
          <span>${t("All clear near {lat}, {lon} — no active earthquakes, severe weather, or disasters.", { lat: fmt3(center[0]), lon: fmt3(center[1]) })}</span>
        </div>
      `;
    }
    return html`
      <ul class="results">
        ${quakes.map(
          (q) => html`<li>
            <jv-state-badge level="danger" nodot .label=${`M${Number(q.mag ?? 0).toFixed(1)}`}></jv-state-badge>
            <span>${t("{place} — {km} km away", { place: q.place ?? "", km: km(q.dist_km) })}</span>
          </li>`,
        )}
        ${weather.map(
          (w) => html`<li>
            <jv-state-badge level="warn" nodot .label=${w.severity ?? ""}></jv-state-badge>
            <span>${w.event ?? ""}${w.area ? ` — ${w.area}` : ""}</span>
          </li>`,
        )}
        ${disasters.map(
          (d) => html`<li>
            <jv-state-badge level="warn" nodot .label=${d.category ?? ""}></jv-state-badge>
            <span>${t("{place} — {km} km away", { place: d.title ?? "", km: km(d.dist_km) })}</span>
          </li>`,
        )}
      </ul>
    `;
  }

  private _subheading(): string {
    const r = this._scan;
    if (!r || !r.ok) return "";
    const c = r.counts ?? {
      earthquakes: r.earthquakes?.length ?? 0,
      weather: r.weather?.length ?? 0,
      disasters: r.disasters?.length ?? 0,
    };
    return t("{quakes} quakes · {weather} warnings · {disasters} events", { quakes: c.earthquakes, weather: c.weather, disasters: c.disasters });
  }

  private _renderBody() {
    if (this._error) return this.renderError(t("Couldn't load hazard status — {message}", { message: this._error }), () => void this._load());
    const s = this._status;
    if (!s) return html`<jv-empty kind="loading" .heading=${t("Loading…")}></jv-empty>`;
    const canScan = !this.offline && (!this._scanning || this._slow) && s.center !== null;
    return html`
      ${this._renderLocation(s)}
      ${this._renderFeeds(s)}
      <div class="actions-row">
        <button type="button" class="jv-btn primary" ?disabled=${!canScan} @click=${() => void this._runScan()}>
          ${this._scanning && !this._slow ? t("Scanning…") : t("Scan now")}
        </button>
      </div>
      <p class="sr-status" role="status" aria-live="polite">
        ${this._scanning ? t("Checking USGS, NWS and NASA EONET…") : nothing}
        ${this._slow ? html` ${t("still scanning in the background")}` : nothing}
      </p>
      ${this._renderScanResult()}
    `;
  }

  override render() {
    const s = this._status;
    return html`
      <jv-section .heading=${t("Hazard Monitor")} .subheading=${this._subheading()} icon="mdi:earth" .loading=${this._loading}>
        ${s
          ? html`<jv-state-badge slot="actions" level=${s.enabled ? "ok" : "neutral"} .label=${s.enabled ? t("ON") : t("OFF")}></jv-state-badge>`
          : nothing}
        ${this.renderIconButton("mdi:refresh", t("Refresh"), () => void this._load(), this.offline || this._loading, "actions")}
        ${this._renderBody()}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-hazard": JarvisToolHazard;
  }
}
