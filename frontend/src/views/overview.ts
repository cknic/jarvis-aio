/**
 * <jarvis-view-overview> - status at a glance for the JARVIS admin.
 *
 * Cards: lockdown switch (header row), System Status tiles + meta footer,
 * Operational Mode (chips + auto switch), Right now (dominant area), Quick
 * Actions (nap / unshush) and the Areas grid (src/views/overview/areas.ts).
 * The snapshot comes from the panel as `data`; this view fetches only
 * `jarvis/mode status` itself and nudges a snapshot refetch (throttled) on
 * relevant `state_changed` events. See frontend/specs/overview.md.
 */
import { html, nothing, type PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import type { PanelData } from "../types";
import { confirmDialog } from "../components";
import "../components";
import "./overview/areas";
import { overviewStyles } from "./overview/styles";
import type { JarvisOvAreas } from "./overview/areas";
import {
  EMPTY_LOCKDOWN,
  NUDGE_DOMAINS,
  type LockdownState,
  type ModeInfo,
  type ModeSetResult,
  type OverviewConfig,
  type SetLockdownResult,
  capitalize,
  dash,
  errMsg,
  normalizeLockdown,
  pickConfig,
  pickMode,
  relTime,
  requestRefresh,
  statusTiles,
  toast,
} from "./overview/model";

const NUDGE_THROTTLE_MS = 2000;
const SERVICE_SETTLE_MS = 500;
const HA_TAGS = ["ha-icon", "ha-switch", "ha-formfield", "ha-card", "ha-dialog"];

type SwitchEl = HTMLElement & { checked: boolean };
interface StateChangedEvent {
  data?: { entity_id?: string };
}

@customElement("jarvis-view-overview")
export class JarvisViewOverview extends JarvisView {
  @state() private _mode: ModeInfo | null = null;
  @state() private _modeError = false;
  @state() private _lockdown: LockdownState = EMPTY_LOCKDOWN;
  @state() private _auto = true;
  @state() private _cfg: OverviewConfig = pickConfig(null);
  @state() private _busy = new Set<string>();

  @query("jarvis-ov-areas") private _areasEl?: JarvisOvAreas;

  private _modeInFlight: Promise<void> | null = null;
  private _unsub: Promise<(() => unknown) | undefined> | null = null;
  private _nudgeTimer: ReturnType<typeof setTimeout> | undefined;

  static override styles = [base, overviewStyles];

  // ── lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    this._subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._nudgeTimer) clearTimeout(this._nudgeTimer);
    this._nudgeTimer = undefined;
    const p = this._unsub;
    this._unsub = null;
    void p?.then((u) => u?.()).catch(() => undefined);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("data") && this.data) {
      this._lockdown = normalizeLockdown(this.data.lockdown);
      this._cfg = pickConfig(this.data.config);
      this._auto = this._cfg.autoMode;
      void this._fetchMode();
    }
    if (changed.has("hass") && this.hass) {
      this._subscribe();
      if (!this._mode && !this._modeError) void this._fetchMode();
    }
  }

  // ── realtime nudge (spec 2.1 step 3) ──────────────────────────────────────

  private _subscribe(): void {
    if (this._unsub || !this.isConnected) return;
    const conn = this.hass?.connection;
    if (!conn?.subscribeEvents) return;
    this._unsub = conn
      .subscribeEvents<StateChangedEvent>((ev) => this._onStateChanged(ev), "state_changed")
      .catch(() => {
        this._unsub = null;
        return undefined;
      });
  }

  private _onStateChanged(ev: StateChangedEvent): void {
    const id = ev?.data?.entity_id;
    if (!id || !NUDGE_DOMAINS.has(id.split(".")[0])) return;
    if (this._nudgeTimer || document.visibilityState !== "visible") return;
    this._nudgeTimer = setTimeout(() => {
      this._nudgeTimer = undefined;
      if (this.isConnected) this.refresh();
    }, NUDGE_THROTTLE_MS);
  }

  // ── data ──────────────────────────────────────────────────────────────────

  private _fetchMode(): Promise<void> {
    if (!this.hass) return Promise.resolve();
    if (this._modeInFlight) return this._modeInFlight;
    this._modeInFlight = (async () => {
      try {
        const res = await this.ws<ModeInfo>("jarvis/mode", { action: "status" });
        const info = pickMode(res);
        this._modeError = !info;
        if (info) this._mode = info;
      } catch {
        this._modeError = true;
      } finally {
        this._modeInFlight = null;
      }
    })();
    return this._modeInFlight;
  }

  private _setBusy(key: string, on: boolean): void {
    const next = new Set(this._busy);
    if (on) next.add(key);
    else next.delete(key);
    this._busy = next;
  }

  // ── actions (spec 4) ─────────────────────────────────────────────────────

  private async _onLockToggle(e: Event): Promise<void> {
    const el = e.target as SwitchEl;
    const want = !!el.checked;
    const prev = this._lockdown.active;
    if (want === prev || this._busy.has("lock")) return;
    if (want) {
      const ok = await confirmDialog({
        heading: t("Engage lockdown?"),
        message: t("JARVIS will lock every lock and close every open door. Windows already open are left as they are."),
        confirmLabel: t("Engage"),
        cancelLabel: t("Cancel"),
        destructive: true,
      });
      if (!ok) {
        el.checked = prev;
        return;
      }
    }
    this._setBusy("lock", true);
    try {
      const res = await this.ws<SetLockdownResult>("jarvis/set_lockdown", { on: want });
      this._lockdown = res?.lockdown ? normalizeLockdown(res.lockdown) : { ...this._lockdown, active: want };
      if (res?.ok === false) toast(this, t("Lockdown request was not accepted"));
      else toast(this, want ? t("Lockdown engaged") : t("Lockdown lifted"));
      this.refresh();
    } catch (err) {
      toast(this, `${t("Lockdown failed —")} ${errMsg(err)}`);
    } finally {
      this._setBusy("lock", false);
      el.checked = this._lockdown.active;
    }
  }

  private async _setMode(name: string): Promise<void> {
    if (this._busy.has("mode") || name === this._mode?.active) return;
    this._setBusy("mode", true);
    try {
      const res = await this.ws<ModeSetResult>("jarvis/mode", { action: "set", mode: name, reason: "requested from panel" });
      if (res?.ok === false) {
        toast(this, `${t("Mode change failed —")} ${res.error || ""}`.trim());
        return;
      }
      const info = pickMode(res);
      if (info) this._mode = info;
      toast(this, t("{mode} mode", { mode: capitalize(res?.mode || info?.active || name) }));
      this.refresh();
    } catch (err) {
      toast(this, `${t("Mode change failed —")} ${errMsg(err)}`);
    } finally {
      this._setBusy("mode", false);
    }
  }

  private async _onAutoToggle(e: Event): Promise<void> {
    const el = e.target as SwitchEl;
    const want = !!el.checked;
    if (want === this._auto || this._busy.has("auto")) return;
    this._setBusy("auto", true);
    try {
      const res = await this.ws<{ key?: string; value?: unknown }>("jarvis/update_config", {
        key: "operational_mode_auto",
        value: want,
      });
      this._auto = typeof res?.value === "boolean" ? res.value : want;
      toast(this, this._auto ? t("Automatic mode on") : t("Automatic mode off"));
      this.refresh();
    } catch (err) {
      toast(this, `${t("Couldn't save —")} ${errMsg(err)}`);
    } finally {
      this._setBusy("auto", false);
      el.checked = this._auto;
    }
  }

  private async _service(key: string, service: string, data: Record<string, unknown>, okMsg: string, failPrefix: string) {
    if (this._busy.has(key)) return;
    const h = this.hass;
    this._setBusy(key, true);
    try {
      if (!h || typeof h.callService !== "function") throw new Error(t("Home Assistant connection not available"));
      await h.callService("jarvis", service, data);
      toast(this, okMsg);
      requestRefresh(this, SERVICE_SETTLE_MS);
    } catch (err) {
      toast(this, `${failPrefix} ${errMsg(err)}`);
    } finally {
      this._setBusy(key, false);
    }
  }

  // ── render helpers ───────────────────────────────────────────────────────

  private _icon(icon: string) {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  /** ha-switch (in ha-formfield when the label is visible) or a native checkbox switch. */
  private _switch(opts: { checked: boolean; disabled: boolean; label: string; title?: string; hideLabel?: boolean; onChange: (e: Event) => void }) {
    if (haDefined("ha-switch")) {
      const sw = html`
        <ha-switch
          .checked=${opts.checked}
          .disabled=${opts.disabled}
          aria-label=${opts.label}
          title=${opts.title ?? nothing}
          @change=${opts.onChange}
        ></ha-switch>
      `;
      return !opts.hideLabel && haDefined("ha-formfield") ? html`<ha-formfield .label=${opts.label}>${sw}</ha-formfield>` : sw;
    }
    return html`
      <label class="switch" title=${opts.title ?? nothing}>
        <input
          type="checkbox"
          role="switch"
          aria-label=${opts.label}
          .checked=${opts.checked}
          ?disabled=${opts.disabled}
          @change=${opts.onChange}
        />
        ${opts.hideLabel ? nothing : html`<span>${opts.label}</span>`}
      </label>
    `;
  }

  private _renderLockbar(ready: boolean) {
    const L = this._lockdown;
    const subs: string[] = [];
    if (L.active && L.since) subs.push(t("since {time}", { time: relTime(L.since) }));
    if (L.active && L.auto) subs.push(t("engaged automatically (alarm armed)"));
    if (L.active && L.reason) subs.push(L.reason);
    return html`
      <div class="lockbar ${L.active ? "on" : ""}" aria-live="polite">
        ${this._icon(L.active ? "mdi:shield-lock" : "mdi:shield-lock-open-outline")}
        <div class="text">
          <span>${t("Lockdown")}: <strong>${L.active ? t("Engaged") : t("Off")}</strong></span>
          ${subs.length ? html`<span class="sub">${subs.join(" · ")}</span>` : nothing}
        </div>
        ${this._switch({
          checked: L.active,
          disabled: !ready || this._busy.has("lock"),
          label: t("Lockdown"),
          hideLabel: true,
          title: L.active ? t("Lockdown engaged — tap to lift") : t("Tap to engage lockdown"),
          onChange: (e) => void this._onLockToggle(e),
        })}
      </div>
    `;
  }

  private _renderStatus(d: PanelData) {
    const tiles = statusTiles(d, this._lockdown, this._cfg);
    const m = d.meta ?? ({} as PanelData["meta"]);
    const meta = [
      `${t("Bedrooms")} ${m.bedrooms ?? "—"}`,
      `${t("Areas Monitored")} ${m.areas_monitored ?? d.areas?.length ?? "—"}`,
      `${t("Announcements Today")} ${m.announcements_today ?? "—"}`,
      `${t("Uptime")} ${dash(m.uptime) ?? "—"}`,
      `v${d.version ?? "?"}`,
    ];
    if (dash(m.est_cost)) meta.push(`${t("Est. cost")} ${m.est_cost}`);
    return html`
      <jv-section .heading=${t("System Status")} icon="mdi:heart-pulse">
        <div class="tiles" aria-live="polite">
          ${tiles.map(
            (x) => html`
              <div class="tile" data-key=${x.key}>
                <span class="dot" data-level=${x.level} aria-hidden="true"></span>
                <div>
                  <div class="label">${x.label}</div>
                  <div class="value ${x.key === "notify" ? "jv-mono small" : ""}">${x.value}</div>
                  ${x.secondary ? html`<div class="sec">${x.secondary}</div>` : nothing}
                </div>
              </div>
            `,
          )}
        </div>
        <p class="meta">${meta.join(" · ")}</p>
      </jv-section>
    `;
  }

  private _renderMode() {
    const M = this._mode;
    const busy = this._busy.has("mode");
    const since = M?.since ? relTime(M.since) : "";
    const subs = [since ? t("since {time}", { time: since }) : "", M?.reason ?? ""].filter(Boolean);
    return html`
      <jv-section .heading=${t("Operational Mode")} icon="mdi:tune-variant">
        ${M ? html`<jv-state-badge slot="actions" level="accent" nodot .label=${capitalize(M.active)}></jv-state-badge>` : nothing}
        ${this._modeError
          ? html`<p class="desc">${t("Couldn't load modes — restart Home Assistant after updating.")}</p>`
          : !M
            ? html`<jv-empty kind="loading" compact .message=${t("Loading...")}></jv-empty>`
            : html`
                ${M.description ? html`<p class="desc">${M.description}</p>` : nothing}
                ${subs.length ? html`<p class="desc">${subs.join(" · ")}</p>` : nothing}
                <div class="chips" role="group" aria-label=${t("Mode")}>
                  ${M.available.map(
                    (m) => html`
                      <button
                        type="button"
                        class="chip jv-hit"
                        aria-pressed=${m.name === M.active ? "true" : "false"}
                        title=${m.description || nothing}
                        ?disabled=${busy}
                        @click=${() => void this._setMode(m.name)}
                      >
                        ${capitalize(m.name)}
                      </button>
                    `,
                  )}
                </div>
              `}
        <div class="toggle-row">
          <div>
            <div>${t("Follow occupancy automatically")}</div>
            <p class="help">
              ${t("Switches between Away and Normal as the home empties and fills. Party, Movie, Lab, Guest and Focus are always manual.")}
            </p>
          </div>
          ${this._switch({
            checked: this._auto,
            disabled: this._busy.has("auto"),
            label: t("Follow occupancy automatically"),
            hideLabel: true,
            onChange: (e) => void this._onAutoToggle(e),
          })}
        </div>
      </jv-section>
    `;
  }

  private _renderNow(d: PanelData) {
    const D = d.dominant;
    const nobody = !D || D.area_id === null || D.area_id === undefined;
    const name = !D ? "—" : nobody ? (D.name === "AWAY" ? t("Nobody home") : D.name === "AT HOME" ? t("Someone is home") : D.name) : D.name;
    const subtitle = !D ? "" : D.subtitle === "no presence detected" ? t("No presence detected") : D.subtitle;
    const stats: Array<[string, string]> = [
      [t("Temperature"), dash(D?.temp) ?? "—"],
      [t("Humidity"), dash(D?.humidity) ?? "—"],
      [t("Lights"), dash(D?.lights) ?? "—"],
      [t("Last motion"), dash(D?.last_motion) ?? "—"],
    ];
    if (dash(D?.satellite)) stats.push([t("Satellite"), D!.satellite]);
    const body = html`
      <div class="big">${name}</div>
      ${subtitle ? html`<div class="jv-muted">${subtitle}</div>` : nothing}
      <div class="stats">
        ${stats.map(([k, v]) => html`<div><div class="k">${k}</div><div class="v">${v}</div></div>`)}
      </div>
    `;
    return html`
      <jv-section .heading=${t("Right now")} icon="mdi:map-marker-radius-outline">
        ${nobody
          ? html`<div class="now">${body}</div>`
          : html`
              <button
                type="button"
                class="now"
                aria-label=${t("{name} details", { name })}
                @click=${() => this._areasEl?.openArea(D!.area_id as string)}
              >
                ${body}
              </button>
            `}
      </jv-section>
    `;
  }

  private _renderActions(d: PanelData) {
    const napping = d.status?.sleep?.state === "ASLEEP" && (d.sleep_reason || "").startsWith("manual nap");
    const napTitle = (n: number) =>
      t("Mute JARVIS's non-critical announcements for {n} minutes. Does not change lights, covers or locks. Safety alerts still come through.", { n });
    return html`
      <jv-section .heading=${t("Quick Actions")} icon="mdi:gesture-tap-button">
        <div class="actions">
          <button type="button" class="jv-btn" title=${napTitle(30)} ?disabled=${this._busy.has("nap30")}
            @click=${() => void this._service("nap30", "nap", { duration_minutes: 30 }, t("Napping for 30 minutes"), t("Nap failed —"))}>
            ${this._icon("mdi:sleep")} ${t("Nap 30 min")}
          </button>
          <button type="button" class="jv-btn" title=${napTitle(60)} ?disabled=${this._busy.has("nap60")}
            @click=${() => void this._service("nap60", "nap", { duration_minutes: 60 }, t("Napping for 60 minutes"), t("Nap failed —"))}>
            ${this._icon("mdi:sleep")} ${t("Nap 60 min")}
          </button>
          <button type="button" class="jv-btn" title=${t("Cancel any active nap or shush and resume normal announcements.")}
            ?disabled=${this._busy.has("unshush")}
            @click=${() => void this._service("unshush", "unshush", {}, t("Announcements resumed"), t("Unshush failed —"))}>
            ${this._icon("mdi:volume-high")} ${t("Unshush All")}
          </button>
        </div>
        ${napping ? html`<p class="nap" role="status">${d.sleep_reason}</p>` : nothing}
      </jv-section>
    `;
  }

  private _renderAreas(d: PanelData) {
    const areas = Array.isArray(d.areas) ? d.areas : [];
    const occupied = areas.filter((a) => a.active).length;
    return html`
      <jv-section
        class="jv-span-all"
        .heading=${t("Areas")}
        icon="mdi:floor-plan"
        .subheading=${areas.length ? t("{occupied} occupied · {total}", { occupied, total: areas.length }) : ""}
      >
        ${areas.length === 0
          ? html`<jv-empty compact icon="mdi:home-search-outline" .heading=${t("No areas yet")}
              .message=${t("No areas with JARVIS-relevant devices yet. Assign satellites, speakers, presence sensors or lights to Home Assistant areas.")}></jv-empty>`
          : html`<jarvis-ov-areas .hass=${this.hass} .areas=${areas} .lightControl=${this._cfg.lightControl}></jarvis-ov-areas>`}
      </jv-section>
    `;
  }

  private _renderSkeleton() {
    const sk = html`<div class="sk" role="status" aria-label=${t("Loading...")}>
      <div class="jv-skeleton"></div><div class="jv-skeleton"></div><div class="jv-skeleton"></div>
    </div>`;
    return html`
      <div class="jv-grid">
        <jv-section .heading=${t("System Status")} loading>${sk}</jv-section>
        <jv-section .heading=${t("Operational Mode")} loading>${sk}</jv-section>
        <jv-section .heading=${t("Right now")} loading>${sk}</jv-section>
        <jv-section class="jv-span-all" .heading=${t("Areas")} loading>${sk}</jv-section>
      </div>
    `;
  }

  override render() {
    const d = this.data;
    return html`
      <div class=${this.narrow ? "narrow" : ""}>
        ${this._renderLockbar(!!d)}
        ${d
          ? html`
              <div class="jv-grid">
                ${this._renderStatus(d)} ${this._renderMode()} ${this._renderNow(d)} ${this._renderActions(d)} ${this._renderAreas(d)}
              </div>
            `
          : this._renderSkeleton()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-overview": JarvisViewOverview;
  }
}
