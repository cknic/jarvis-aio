/**
 * <jarvis-view-logs> - "what has JARVIS been doing, and is it healthy?"
 *
 * Cards (src/views/logs/): System Log (jarvis/get_debug_log), Activity Feed
 * (jarvis/get_activity_log), System Diagnostics (jarvis/diagnostics +
 * get_calibration, on demand), Cognitive Core (jarvis/get_cognitive_status)
 * and Governance (jarvis/get_enforcement / set_enforcement).
 *
 * This element owns the polling: the log, activity and cognitive status are
 * re-read every 20 s while the document is visible, the governance list on
 * enter / Refresh / after a write. Diagnostics is expensive and only runs on
 * its own "Run check" button. Nothing here touches the snapshot (`data`).
 * Spec: frontend/specs/logs.md.
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { WsError } from "../ws";
import { haDefined, watchDefinitions } from "../ha";
import "../components";
import "./logs/system-log";
import "./logs/activity";
import "./logs/diagnostics";
import "./logs/cognitive";
import "./logs/governance";
import { clock } from "./logs/format";
import type {
  ActivityEntry,
  ActivityResponse,
  CognitiveStatus,
  DebugEntry,
  DebugLogResponse,
  EnforcementResponse,
  EnforcementSwitch,
} from "./logs/types";

const POLL_MS = 20_000;
const ACTIVITY_QUERY = { hours: 24, limit: 100 };

@customElement("jarvis-view-logs")
export class JarvisViewLogs extends JarvisView {
  @state() private _debug: DebugEntry[] | null = null;
  @state() private _debugError: string | null = null;
  @state() private _activity: ActivityEntry[] | null = null;
  @state() private _activityError: string | null = null;
  @state() private _cognitive: CognitiveStatus | null = null;
  @state() private _switches: EnforcementSwitch[] | null = null;
  @state() private _switchesError: string | null = null;
  @state() private _refreshing = false;
  @state() private _updated: Date | null = null;

  private _timer: ReturnType<typeof setInterval> | null = null;
  private _started = false;
  private _lastFetch = 0;
  private _inFlight: Promise<void> | null = null;

  static override styles = [
    base,
    css`
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      .toolbar .updated {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        font-variant-numeric: tabular-nums;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 1000px) {
        :host(:not([narrow])) .layout {
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        }
      }
      .side {
        display: grid;
        gap: var(--jv-space-4);
        min-width: 0;
      }
    `,
  ];

  // ── lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon"]);
    document.addEventListener("visibilitychange", this._onVisibility);
    this.addEventListener("jv-logs-enforcement-changed", this._onEnforcementChanged);
    this._timer = setInterval(() => {
      if (document.visibilityState === "visible") void this._poll();
    }, POLL_MS);
    if (this.hass) void this._loadAll();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.removeEventListener("jv-logs-enforcement-changed", this._onEnforcementChanged);
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("hass") && this.hass && !this._started) void this._loadAll();
  }

  private _onVisibility = (): void => {
    if (document.visibilityState === "visible" && Date.now() - this._lastFetch > POLL_MS) void this._poll();
  };

  private _onEnforcementChanged = (): void => {
    void this._loadEnforcement();
  };

  // ── data ──────────────────────────────────────────────────────────────────

  private _fail(command: string, err: unknown): string {
    const e = WsError.from(command, err);
    return e.message || e.code;
  }

  private async _loadDebug(): Promise<void> {
    try {
      const res = await this.ws<DebugLogResponse>("jarvis/get_debug_log");
      this._debug = Array.isArray(res?.entries) ? res.entries : [];
      this._debugError = null;
    } catch (err) {
      this._debugError = this._fail("jarvis/get_debug_log", err);
    }
  }

  private async _loadActivity(): Promise<void> {
    try {
      const res = await this.ws<ActivityResponse>("jarvis/get_activity_log", ACTIVITY_QUERY);
      this._activity = Array.isArray(res?.entries) ? res.entries : [];
      this._activityError = null;
    } catch (err) {
      this._activityError = this._fail("jarvis/get_activity_log", err);
    }
  }

  private async _loadCognitive(): Promise<void> {
    try {
      const res = await this.ws<CognitiveStatus>("jarvis/get_cognitive_status");
      this._cognitive = res && typeof res === "object" ? res : {};
    } catch (err) {
      // the handler never rejects; treat a transport failure like its fallback payload
      this._cognitive = { running: false, error: this._fail("jarvis/get_cognitive_status", err), learning: {} };
    }
  }

  private async _loadEnforcement(): Promise<void> {
    try {
      const res = await this.ws<EnforcementResponse>("jarvis/get_enforcement");
      this._switches = Array.isArray(res?.switches) ? res.switches : [];
      this._switchesError = null;
    } catch (err) {
      this._switchesError = this._fail("jarvis/get_enforcement", err);
    }
  }

  /** The 20 s poll: log, activity and cognitive status (not governance). */
  private _poll(): Promise<void> {
    return this._run([() => this._loadDebug(), () => this._loadActivity(), () => this._loadCognitive()]);
  }

  /** Enter / Refresh: everything except Diagnostics (its own button). */
  private _loadAll(): Promise<void> {
    return this._run([
      () => this._loadDebug(),
      () => this._loadActivity(),
      () => this._loadCognitive(),
      () => this._loadEnforcement(),
    ]);
  }

  private _run(jobs: Array<() => Promise<void>>): Promise<void> {
    if (!this.hass) return Promise.resolve();
    if (this._inFlight) return this._inFlight;
    this._started = true;
    this._refreshing = true;
    this._inFlight = (async () => {
      try {
        await Promise.allSettled(jobs.map((job) => job()));
        this._lastFetch = Date.now();
        this._updated = new Date(this._lastFetch);
      } finally {
        this._refreshing = false;
        this._inFlight = null;
      }
    })();
    return this._inFlight;
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _renderToolbar() {
    const lang = this.hass?.locale?.language || this.hass?.language;
    return html`
      <div class="toolbar">
        <span class="updated" role="status" aria-live="polite">
          ${this._updated ? t("Last updated {time}", { time: clock(this._updated, lang) }) : nothing}
        </span>
        <button class="jv-btn" type="button" ?disabled=${this._refreshing || !this.hass} @click=${() => void this._loadAll()}>
          ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>` : nothing}
          <span>${t("Refresh")}</span>
        </button>
      </div>
    `;
  }

  override render() {
    return html`
      ${this._renderToolbar()}
      <div class="layout">
        <jv-logs-system .entries=${this._debug} .error=${this._debugError} .narrow=${this.narrow}></jv-logs-system>
        <div class="side">
          <jv-logs-activity .entries=${this._activity} .error=${this._activityError}></jv-logs-activity>
          <jv-logs-diagnostics .hass=${this.hass}></jv-logs-diagnostics>
          <jv-logs-cognitive .status=${this._cognitive}></jv-logs-cognitive>
          <jv-logs-governance .hass=${this.hass} .switches=${this._switches} .error=${this._switchesError}></jv-logs-governance>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-logs": JarvisViewLogs;
  }
}
