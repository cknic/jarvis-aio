/**
 * <jarvis-view-intrusion> - the Intrusion view (frontend/specs/intrusion.md).
 *
 * Card 1 "Intrusion": live status chip (CONFIRMED / INVESTIGATING from the
 * panel snapshot, CALLED OFF / ARMED from `jarvis/intrusion status`), the
 * active breach and lockdown lines, the last snapshot (signed), the false-
 * alarm count, the two response buttons (call off = confirmed, destructive;
 * acknowledge = hold) and the four intrusion settings
 * (<jv-intrusion-settings>, src/views/intrusion/settings.ts).
 * Card 2 "Intrusion Log": <jv-intrusion-log> (src/views/intrusion/log.ts).
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { confirmDialog } from "../components";
import "../components";
import "./intrusion/snapshot";
import "./intrusion/log";
import "./intrusion/settings";
import {
  cameraName,
  errorMessage,
  formatTime,
  notify,
  type IntrusionEvent,
  type IntrusionSnapshotRef,
  type IntrusionStatus,
} from "./intrusion/shared";

const HA_TAGS = ["ha-icon", "ha-alert"];
const STATUS_MIN_INTERVAL_MS = 5_000;

@customElement("jarvis-view-intrusion")
export class JarvisViewIntrusion extends JarvisView {
  @state() private _status: IntrusionStatus | null = null;
  @state() private _statusError: string | null = null;
  @state() private _statusLoading = false;
  @state() private _pending: "dismiss" | "acknowledge" | null = null;
  @state() private _notice = "";
  @state() private _latestEventSnap: IntrusionSnapshotRef | null = null;

  private _statusAt = 0;
  private _started = false;
  private _tick: ReturnType<typeof setInterval> | null = null;
  private _noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private _unsubs: Array<() => unknown> = [];

  static override styles = [
    base,
    css`
      :host {
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      /* container, not viewport: the harness phone frame and a docked HA sidebar both shrink the panel, not the window */
      @container (min-width: 1024px) {
        .layout {
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        }
      }
      @container (max-width: 599px) {
        .actions {
          flex-direction: column;
        }
        .actions .jv-btn {
          width: 100%;
        }
      }
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-2);
        min-width: 0;
      }
      .line.muted {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .line ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .banner {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        font-size: var(--jv-font-size-s);
      }
      .banner.ok {
        background: var(--jv-ok-soft);
      }
      .banner.ok ha-icon {
        color: var(--jv-ok);
      }
      .banner.danger {
        background: var(--jv-danger-soft);
      }
      .banner.danger ha-icon {
        color: var(--jv-danger);
      }
      .banner.warn {
        background: var(--jv-warn-soft);
      }
      .banner.warn ha-icon {
        color: var(--jv-warn);
      }
      .banner ha-icon {
        flex: none;
        --mdc-icon-size: 18px;
      }
      .banner .jv-btn {
        margin-left: auto;
      }
      .hero {
        margin: var(--jv-space-2) 0 var(--jv-space-3);
      }
      .count {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-3);
      }
      .actions .jv-btn {
        flex: 1 1 auto;
      }
      .notice {
        min-height: 1.5em;
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .zones {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
    `,
  ];

  // ── lifecycle ────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    this.addEventListener("jv-intrusion-log", this._onLogLoaded as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("jv-intrusion-log", this._onLogLoaded as EventListener);
    this._stopTick();
    if (this._noticeTimer) clearTimeout(this._noticeTimer);
    for (const u of this._unsubs) {
      try {
        void u();
      } catch {
        /* ignore */
      }
    }
    this._unsubs = [];
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("hass") && this.hass && !this._started) {
      this._started = true;
      void this._loadStatus();
      void this._subscribe();
    }
    // every snapshot tick (20 s) re-reads status so `suppressed_for` stays honest
    if (changed.has("data") && changed.get("data") && this.data && this.hass) {
      if (Date.now() - this._statusAt > STATUS_MIN_INTERVAL_MS) void this._loadStatus(true);
    }
  }

  private _onLogLoaded = (e: CustomEvent<{ events?: IntrusionEvent[] }>): void => {
    const ev = (e.detail?.events ?? []).find((x) => x && x.snapshot_url);
    this._latestEventSnap = ev ? { url: ev.snapshot_url, camera: ev.camera, ts: ev.ts } : null;
  };

  private async _subscribe(): Promise<void> {
    const conn = this.hass?.connection;
    const sub = conn?.subscribeEvents;
    if (!conn || typeof sub !== "function" || this._unsubs.length) return;
    for (const type of ["jarvis_intrusion_confirmed", "jarvis_intrusion_unresolved"]) {
      try {
        const un = await sub.call(conn, () => this._onBusEvent(), type);
        if (typeof un === "function") this._unsubs.push(un);
      } catch {
        /* polling still covers it */
      }
    }
  }

  private _onBusEvent(): void {
    void this._loadStatus(true);
    this.renderRoot.querySelector("jv-intrusion-log")?.load();
    this.refresh();
  }

  // ── status ───────────────────────────────────────────────────────────────

  private async _loadStatus(silent = false): Promise<void> {
    if (this._statusLoading) return;
    this._statusLoading = true;
    if (!silent) this._statusError = null;
    try {
      const res = await this.ws<IntrusionStatus>("jarvis/intrusion", { action: "status" });
      this._applyStatus(res);
      this._statusError = null;
    } catch (err) {
      if (!silent || !this._status) this._statusError = errorMessage(err);
    } finally {
      this._statusLoading = false;
    }
  }

  private _applyStatus(res: IntrusionStatus | null | undefined): void {
    const r = res && typeof res === "object" ? res : ({} as Partial<IntrusionStatus>);
    this._status = {
      last_snapshot: r.last_snapshot && r.last_snapshot.url ? r.last_snapshot : null,
      called_off: !!r.called_off,
      acknowledged: !!r.acknowledged,
      suppressed_for: Math.max(0, Number(r.suppressed_for) || 0),
      false_alarms_24h: Math.max(0, Number(r.false_alarms_24h) || 0),
    };
    this._statusAt = Date.now();
    if (this._status.called_off && this._status.suppressed_for > 0) this._startTick();
    else this._stopTick();
  }

  /** Seconds left on the call-off window, counted down locally between fetches. */
  private _suppressedLeft(): number {
    if (!this._status) return 0;
    return Math.max(0, this._status.suppressed_for - Math.floor((Date.now() - this._statusAt) / 1000));
  }

  private _startTick(): void {
    if (this._tick) return;
    this._tick = setInterval(() => {
      if (this._suppressedLeft() <= 0) this._stopTick();
      this.requestUpdate();
    }, 1000);
  }

  private _stopTick(): void {
    if (this._tick) clearInterval(this._tick);
    this._tick = null;
  }

  private _say(message: string): void {
    notify(this, message);
    this._notice = message;
    if (this._noticeTimer) clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => {
      this._notice = "";
      this._noticeTimer = null;
    }, 5000);
  }

  // ── actions ──────────────────────────────────────────────────────────────

  private async _callOff(): Promise<void> {
    if (this._pending) return;
    const ok = await confirmDialog({
      heading: t("Call off this intrusion as a false alarm?"),
      message: t("Escalation stays quiet for 10 minutes and the event is recorded as a false alarm."),
      confirmLabel: t("CALL OFF (FALSE ALARM)"),
      destructive: true,
    });
    if (!ok) return;
    this._pending = "dismiss";
    try {
      const res = await this.ws<IntrusionStatus>("jarvis/intrusion", { action: "dismiss", reason: "panel" });
      this._applyStatus(res);
      this._say(t("Intrusion called off"));
      this.refresh(); // snapshot.intrusion.active flips on the next poll
      this.renderRoot.querySelector("jv-intrusion-log")?.load();
    } catch (err) {
      this._say(errorMessage(err));
    } finally {
      this._pending = null;
    }
  }

  private async _acknowledge(): Promise<void> {
    if (this._pending) return;
    this._pending = "acknowledge";
    try {
      const res = await this.ws<IntrusionStatus>("jarvis/intrusion", { action: "acknowledge", reason: "panel" });
      this._applyStatus(res);
      this._say(t("Acknowledged — holding escalation"));
    } catch (err) {
      this._say(errorMessage(err));
    } finally {
      this._pending = null;
    }
  }

  // ── status card ──────────────────────────────────────────────────────────

  private _icon(icon: string) {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  private _chip() {
    const intr = this.data?.intrusion;
    const st = this._status;
    if (intr?.confirmed) return html`<jv-state-badge level="danger" pulse .label=${t("CONFIRMED")}></jv-state-badge>`;
    if (intr?.active) return html`<jv-state-badge level="warn" pulse .label=${t("INVESTIGATING")}></jv-state-badge>`;
    if (st?.called_off) {
      const left = this._suppressedLeft();
      return html`<jv-state-badge level="warn" .label=${left > 0 ? `${t("CALLED OFF")} · ${left}s` : t("CALLED OFF")}></jv-state-badge>`;
    }
    if (st) return html`<jv-state-badge level="ok" .label=${t("ARMED")}></jv-state-badge>`;
    if (this._statusError) return html`<jv-state-badge level="neutral" label="—"></jv-state-badge>`;
    return html`<jv-state-badge level="neutral" .label=${t("Loading...")}></jv-state-badge>`;
  }

  private _renderInvestigation() {
    const intr = this.data?.intrusion;
    if (!intr?.active) return nothing;
    const name = typeof intr.breach_name === "string" && intr.breach_name ? intr.breach_name : (intr.breach_area as string) || "";
    const zones = Array.isArray(intr.zones) ? (intr.zones as string[]) : [];
    const path = Array.isArray(intr.path) ? (intr.path as string[]) : [];
    const trail = zones.length ? zones : path;
    return html`
      <p class="line">
        ${this._icon("mdi:door-open")}
        <span><strong>${t("Breach")}:</strong> ${name || t("activity")}</span>
        ${trail.length ? html`<span class="zones jv-muted">${trail.join(" → ")}</span>` : nothing}
      </p>
    `;
  }

  private _renderLockdown() {
    const ld = this.data?.lockdown;
    if (!ld?.active) return nothing;
    const time = formatTime(this.hass, ld.since);
    const text = ld.auto ? t("Lockdown engaged automatically since {time}", { time }) : t("Lockdown engaged since {time}", { time });
    return html`
      <div class="banner danger" role="status">
        ${this._icon("mdi:lock-alert-outline")}
        <span>${text}${ld.reason ? html` — ${ld.reason}` : nothing}</span>
      </div>
    `;
  }

  private _renderHero() {
    const snap = this._status?.last_snapshot ?? this._latestEventSnap;
    if (snap?.url) {
      const cam = cameraName(this.hass, snap.camera);
      const when = formatTime(this.hass, snap.ts);
      return html`
        <jv-intrusion-snapshot
          class="hero"
          variant="hero"
          .hass=${this.hass}
          .path=${snap.url}
          .alt=${t("Intrusion snapshot")}
          .caption=${[cam, when].filter(Boolean).join(" · ")}
        ></jv-intrusion-snapshot>
      `;
    }
    if (!this._status) return nothing;
    return html`
      <jv-empty
        compact
        icon="mdi:camera-off-outline"
        .message=${t("No intrusion snapshots captured. This stays empty unless JARVIS confirms an intruder on camera.")}
      ></jv-empty>
    `;
  }

  private _renderStatusBody() {
    const st = this._status;
    if (!st && this._statusError) {
      return html`
        <div class="banner danger" role="alert">
          ${this._icon("mdi:alert-circle-outline")}
          <span>${t("Couldn't load — restart Home Assistant after updating.")} ${this._statusError}</span>
          <button class="jv-btn text" type="button" @click=${() => void this._loadStatus()}>${t("Retry")}</button>
        </div>
      `;
    }
    if (!st) {
      return html`<jv-empty compact kind="loading" .message=${t("Loading...")}></jv-empty>`;
    }
    const n = st.false_alarms_24h;
    return html`
      ${st.acknowledged
        ? html`<div class="banner ok" role="status">
            ${this._icon("mdi:check-circle-outline")}
            <span>${t("Acknowledged — automatic escalation held (you're handling it)")}</span>
          </div>`
        : nothing}
      ${this._renderHero()}
      ${n > 0
        ? html`<p class="count">
            ${n === 1
              ? t("{n} false alarm called off in the last 24h", { n })
              : t("{n} false alarms called off in the last 24h", { n })}
          </p>`
        : nothing}
    `;
  }

  override render() {
    if (!this.hass) return html`<jv-empty kind="loading" .message=${t("Loading...")}></jv-empty>`;
    const busy = this._pending !== null;
    return html`
      <div class="layout">
        <jv-section .heading=${t("Intrusion")} icon="mdi:shield-home-outline" ?loading=${this._statusLoading && !!this._status}>
          <span slot="actions" aria-live="polite">${this._chip()}</span>
          <p class="intro">
            ${t(
              'Last intrusion snapshot and false-alarm call-off. When JARVIS confirms an intruder on camera it grabs a still; if it\'s not real, call it off here or say "it\'s a false alarm".',
            )}
          </p>
          ${this._renderInvestigation()} ${this._renderLockdown()} ${this._renderStatusBody()}
          <div class="actions">
            <button class="jv-btn danger" type="button" ?disabled=${busy} @click=${() => void this._callOff()}>
              ${this._icon("mdi:close-circle-outline")} ${t("CALL OFF (FALSE ALARM)")}
            </button>
            <button class="jv-btn" type="button" ?disabled=${busy} @click=${() => void this._acknowledge()}>
              ${this._icon("mdi:eye-check-outline")} ${t("I'M LOOKING")}
            </button>
          </div>
          <p class="notice" role="status" aria-live="polite">${this._notice}</p>
          <jv-intrusion-settings .hass=${this.hass} .config=${this.data?.config ?? null}></jv-intrusion-settings>
        </jv-section>
        <jv-intrusion-log .hass=${this.hass}></jv-intrusion-log>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-intrusion": JarvisViewIntrusion;
  }
}
