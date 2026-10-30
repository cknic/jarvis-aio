/**
 * <jarvis-cam-watch> - the "Camera Watch" card (spec §3.1): camera picker
 * chips, the live tile with its frame chain, the source strip, the action
 * row (DIAG / Analyze now / Announce / Open in Settings) and the collapsible
 * diagnostics panel.
 *
 * Frame chain (spec §2.3), per selected camera:
 *   ha-stream  HA's own <ha-camera-stream> when it is defined (HLS / WebRTC /
 *              MJPEG, the only tier that plays WebRTC-only Nest cams live);
 *              8 s watchdog on decoded pixels in its shadow tree
 *   stream     signed /api/camera_proxy_stream/<src> MJPEG; 6 s watchdog
 *              (no decoded pixels or a black frame escalates)
 *   still      signed /api/camera_proxy/<src>?_=<ts> every 2 s (the cache
 *              buster is INSIDE the signed path, HA signs query params);
 *              5 s watchdog after the first still
 *   jarvis     jarvis/camera_snapshot every 6 s (base64 JPEG); remembered per
 *              entity for the session so re-selecting skips tiers 1-3
 * Every timer carries the chain sequence it was armed for and is a no-op once
 * the camera, the source or the connection changed. Still / snapshot polling
 * pauses while the document is hidden.
 */
import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { t } from "../../i18n";
import { ws, signPath } from "../../ws";
import { confirmDialog } from "../../components";
import type { Hass, HassEntityState } from "../../types";
import {
  BLACK_LUMA,
  type Camera,
  type Diagnostics,
  type FocusEvent,
  type SnapshotResult,
  decodedInTree,
  decodedSizeInTree,
  entityTail,
  errCode,
  errMsg,
  frameLuma,
  hasService,
  normaliseDiagnostics,
  resolveSource,
  toast,
} from "./model";

type Tier = "none" | "unavailable" | "ha-stream" | "stream" | "still" | "jarvis";

const HA_STREAM_WATCHDOG_MS = 8000;
const STREAM_WATCHDOG_MS = 6000;
const STILL_INTERVAL_MS = 2000;
const STILL_WATCHDOG_MS = 5000;
const STILL_SIGN_EXPIRES_S = 30;
const SNAP_INTERVAL_MS = 6000;
const FRAME_POLL_MS = 1500;
const HA_TAGS = ["ha-icon", "ha-switch", "ha-formfield", "ha-alert", "ha-camera-stream", "ha-card"];

/** Cameras that reached the JARVIS-snapshot tier this session (the old _camModeByEntity). */
const remembered = new Map<string, "jarvis">();

type SwitchEl = HTMLElement & { checked: boolean };

@customElement("jarvis-cam-watch")
export class JarvisCamWatch extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;
  /** the ENABLED cameras in snapshot order */
  @property({ attribute: false }) cameras: Camera[] = [];
  @property({ attribute: false }) overrides: Record<string, string> = {};
  /** the user's pick (entity id) */
  @property({ type: String }) selected = "";
  /** the event focus, when active */
  @property({ attribute: false }) focusCamera: FocusEvent | null = null;

  @state() private _tier: Tier = "none";
  @state() private _src = "";
  @state() private _hasFrame = false;
  @state() private _snapNull = false;
  @state() private _snapError: unknown = null;
  @state() private _diagOpen = false;
  @state() private _diagBusy = false;
  @state() private _diag: Diagnostics | null = null;
  @state() private _diagError: unknown = null;
  @state() private _analyzing = false;
  @state() private _announce = true;

  @query("img.frame") private _img?: HTMLImageElement;
  @query("ha-camera-stream") private _haStream?: HTMLElement;

  private _seq = 0;
  private _chainKey = "";
  private _watchdog: ReturnType<typeof setTimeout> | undefined;
  private _poll: ReturnType<typeof setInterval> | undefined;
  private _tick: ReturnType<typeof setTimeout> | undefined;
  private _snapInFlight = false;
  private _onVis = () => this._visibility();

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .picker {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-3);
      }
      .chip {
        appearance: none;
        position: relative;
        min-height: 32px;
        max-width: 100%;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
        transition: background-color var(--jv-ease);
        overflow-wrap: anywhere;
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .chip[aria-checked="true"] {
        background: var(--jv-accent);
        border-color: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .chip.event {
        box-shadow: 0 0 0 2px var(--jv-danger);
      }
      .chip.event:focus-visible {
        box-shadow:
          0 0 0 2px var(--jv-danger),
          var(--jv-focus-ring);
      }
      .tile {
        position: relative;
        width: 100%;
        max-width: 960px;
        margin: 0 auto;
        aspect-ratio: 16 / 9;
        background: var(--jv-surface-2);
        border-radius: var(--jv-radius-sm);
        overflow: hidden;
      }
      .tile img.frame,
      .tile ha-camera-stream {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .tile ha-camera-stream {
        --video-max-height: 100%;
      }
      .tile .placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--jv-space-4);
        text-align: center;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        pointer-events: none;
      }
      .pill {
        position: absolute;
        top: var(--jv-space-2);
        max-width: calc(100% - 2 * var(--jv-space-2));
        padding: 1px var(--jv-space-2);
        border: 1px solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        /* opaque: the backdrop is arbitrary camera pixels, not a surface */
        background: var(--jv-surface);
        color: var(--jv-text);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pill.id {
        left: var(--jv-space-2);
        font-family: var(--jv-font-code);
      }
      .pill.event {
        right: var(--jv-space-2);
        border-color: var(--jv-danger);
        box-shadow: inset 0 0 0 1px var(--jv-danger);
        font-weight: var(--jv-font-weight-medium);
      }
      .strip {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .strip .k {
        font-weight: var(--jv-font-weight-medium);
      }
      .strip code {
        font-family: var(--jv-font-code);
        font-size: inherit;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .actions .spacer {
        flex: 1 1 auto;
      }
      :host([narrow]) .actions .jv-btn {
        flex: 1 1 40%;
      }
      .switch {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      .diag {
        margin-top: var(--jv-space-3);
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-s);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .diag p {
        margin: 0;
      }
      .diag p.pre {
        white-space: pre-wrap;
      }
      .diag .ok {
        color: var(--jv-ok-text);
      }
      .diag .bad {
        color: var(--jv-danger-text);
      }
      .diag .verdict {
        font-weight: var(--jv-font-weight-bold);
        margin-top: var(--jv-space-1);
      }
      .diag .section {
        margin-top: var(--jv-space-2);
      }
      .diag .foot {
        margin-top: var(--jv-space-2);
        font-family: var(--jv-font);
        color: var(--jv-text-2);
      }
      .diag .foot button {
        appearance: none;
        border: 0;
        padding: 0;
        background: none;
        font: inherit;
        color: var(--jv-accent-text);
        text-decoration: underline;
        cursor: pointer;
      }
      .alert {
        margin: 0 0 var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-left: 4px solid var(--jv-danger);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-danger-soft);
        font-family: var(--jv-font);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-2);
      }
    `,
  ];

  // ── lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    try {
      document.addEventListener("visibilitychange", this._onVis);
    } catch {
      /* no document */
    }
    // a reconnect restarts the chain for the current camera
    this._chainKey = "";
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    try {
      document.removeEventListener("visibilitychange", this._onVis);
    } catch {
      /* no document */
    }
    this._seq++;
    this._clearTimers();
    this._src = "";
  }

  /** The camera the tile shows: the event focus wins over the user's pick. */
  get shown(): string {
    return this.focusCamera?.entity_id || this.selected;
  }

  private _cam(entity: string): Camera | undefined {
    return this.cameras.find((c) => c.entity_id === entity);
  }

  private _source(): string {
    return this.shown ? resolveSource(this.shown, this.overrides, this.hass?.states) : "";
  }

  private _stateObj(): HassEntityState | undefined {
    const src = this._source();
    return src ? this.hass?.states?.[src] : undefined;
  }

  private _available(): boolean {
    const st = this._stateObj();
    return !!st && st.state !== "unavailable";
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") || changed.has("selected") || changed.has("focusCamera") || changed.has("cameras") || changed.has("overrides")) {
      const key = `${this.shown}|${this._source()}|${this._available() ? 1 : 0}|${this.hass ? 1 : 0}`;
      if (key !== this._chainKey) {
        this._chainKey = key;
        this._restart();
      }
    }
  }

  // ── the chain ─────────────────────────────────────────────────────────────

  private _clearTimers(): void {
    if (this._watchdog) clearTimeout(this._watchdog);
    if (this._poll) clearInterval(this._poll);
    if (this._tick) clearTimeout(this._tick);
    this._watchdog = undefined;
    this._poll = undefined;
    this._tick = undefined;
  }

  private _restart(): void {
    this._clearTimers();
    const seq = ++this._seq;
    this._src = "";
    this._hasFrame = false;
    this._snapNull = false;
    this._snapError = null;
    this._diag = null;
    this._diagError = null;
    const shown = this.shown;
    if (!shown || !this.hass) {
      this._tier = "none";
      return;
    }
    if (!this._available()) {
      this._tier = "unavailable";
      return;
    }
    if (remembered.get(shown) === "jarvis") {
      this._startJarvis(seq);
      return;
    }
    if (haDefined("ha-camera-stream")) {
      this._tier = "ha-stream";
      this._armFramePoll(seq);
      this._watchdog = setTimeout(() => this._decide(seq), HA_STREAM_WATCHDOG_MS);
      return;
    }
    void this._startStream(seq);
  }

  private _stale(seq: number): boolean {
    return seq !== this._seq || !this.isConnected;
  }

  private async _startStream(seq: number): Promise<void> {
    this._tier = "stream";
    const src = this._source();
    const url = await signPath(this.hass, `/api/camera_proxy_stream/${src}`);
    if (this._stale(seq)) return;
    this._src = url;
    this._armFramePoll(seq);
    this._watchdog = setTimeout(() => this._decide(seq), STREAM_WATCHDOG_MS);
  }

  private _startStill(seq: number): void {
    this._tier = "still";
    this._src = "";
    this._hasFrame = false;
    void this._stillTick(seq, true);
  }

  private async _stillTick(seq: number, first = false): Promise<void> {
    if (this._stale(seq) || this._tier !== "still") return;
    if (this._hidden()) return; // resumed by visibilitychange
    const src = this._source();
    const path = `/api/camera_proxy/${src}?_=${Date.now()}`;
    let url = path;
    try {
      const res = await this.hass!.callWS<{ path?: string }>({ type: "auth/sign_path", path, expires: STILL_SIGN_EXPIRES_S });
      url = res?.path || path;
    } catch {
      url = path; // 401s and the chain escalates
    }
    if (this._stale(seq) || this._tier !== "still") return;
    this._src = url;
    if (first) {
      this._armFramePoll(seq);
      this._watchdog = setTimeout(() => this._decide(seq), STILL_WATCHDOG_MS);
    }
    this._tick = setTimeout(() => void this._stillTick(seq), STILL_INTERVAL_MS);
  }

  private _startJarvis(seq: number): void {
    this._tier = "jarvis";
    this._src = "";
    this._hasFrame = false;
    remembered.set(this.shown, "jarvis");
    void this._snapTick(seq);
  }

  private async _snapTick(seq: number): Promise<void> {
    if (this._stale(seq) || this._tier !== "jarvis") return;
    if (this._hidden()) return; // resumed by visibilitychange
    if (this._snapInFlight) {
      this._tick = setTimeout(() => void this._snapTick(seq), SNAP_INTERVAL_MS);
      return;
    }
    const entity = this.shown;
    this._snapInFlight = true;
    try {
      const res = await ws<SnapshotResult>(this.hass, "jarvis/camera_snapshot", { entity_id: entity });
      if (this._stale(seq)) return;
      const image = typeof res?.image === "string" && res.image ? res.image : null;
      this._snapError = null;
      if (image) {
        this._src = `data:image/jpeg;base64,${image}`;
        this._hasFrame = true;
        this._snapNull = false;
      } else {
        this._snapNull = true;
      }
    } catch (err) {
      if (this._stale(seq)) return;
      this._snapError = err;
    } finally {
      this._snapInFlight = false;
    }
    if (this._stale(seq) || this._tier !== "jarvis") return;
    this._tick = setTimeout(() => void this._snapTick(seq), SNAP_INTERVAL_MS);
  }

  /** Flip `_hasFrame` as soon as pixels decode (MJPEG never fires `load`). */
  private _armFramePoll(seq: number): void {
    if (this._poll) clearInterval(this._poll);
    this._poll = setInterval(() => {
      if (this._stale(seq)) {
        if (this._poll) clearInterval(this._poll);
        this._poll = undefined;
        return;
      }
      if (!this._hasFrame && this._decoded() === true) this._hasFrame = true;
    }, FRAME_POLL_MS);
  }

  /** Decoded pixels for the current tier: true / false / null (cannot tell). */
  private _decoded(): boolean | null {
    try {
      if (this._tier === "ha-stream") return decodedInTree(this._haStream?.shadowRoot ?? null);
      const img = this._img;
      if (!img) return false;
      return img.naturalWidth > 0;
    } catch {
      return null;
    }
  }

  /** Watchdog: no decoded pixels or a black frame escalates. */
  private _decide(seq: number): void {
    if (this._stale(seq)) return;
    this._watchdog = undefined;
    const decoded = this._decoded();
    // ha-camera-stream that rendered no media element at all after 8 s failed too
    if (decoded === false || (decoded === null && this._tier === "ha-stream")) {
      this._escalate(seq);
      return;
    }
    if (decoded === true && this._tier !== "ha-stream") {
      const luma = frameLuma(this._img);
      if (luma !== null && luma <= BLACK_LUMA) {
        this._escalate(seq);
        return;
      }
    }
    if (decoded === true) this._hasFrame = true;
  }

  private _escalate(seq: number): void {
    if (this._stale(seq)) return;
    this._clearTimers();
    switch (this._tier) {
      case "ha-stream":
        this._startStill(seq);
        break;
      case "stream":
        this._startStill(seq);
        break;
      case "still":
        this._startJarvis(seq);
        break;
      default:
        break;
    }
  }

  private _onImgLoad(): void {
    if (this._tier === "stream" || this._tier === "still" || this._tier === "jarvis") {
      if (this._decoded() === true) this._hasFrame = true;
    }
  }

  private _onImgError(): void {
    if (this._tier === "stream" || this._tier === "still") this._escalate(this._seq);
  }

  private _hidden(): boolean {
    try {
      return typeof document !== "undefined" && document.visibilityState === "hidden";
    } catch {
      return false;
    }
  }

  private _visibility(): void {
    if (this._hidden()) {
      if (this._tick) clearTimeout(this._tick);
      this._tick = undefined;
      return;
    }
    if (this._tick) return;
    const seq = this._seq;
    if (this._tier === "still") void this._stillTick(seq);
    else if (this._tier === "jarvis") void this._snapTick(seq);
  }

  // ── actions ───────────────────────────────────────────────────────────────

  private _pick(entity: string): void {
    this.dispatchEvent(new CustomEvent("jarvis-cam-select", { detail: { entity_id: entity }, bubbles: true, composed: true }));
  }

  private _onChipKey(e: KeyboardEvent, index: number): void {
    const n = this.cameras.length;
    if (!n) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    const cam = this.cameras[next];
    this._pick(cam.entity_id);
    this.updateComplete.then(() => {
      this.renderRoot.querySelectorAll<HTMLButtonElement>(".chip")[next]?.focus();
    });
  }

  private async _runDiag(): Promise<void> {
    if (this._diagBusy) return;
    if (this._diagOpen) {
      this._diagOpen = false;
      return;
    }
    const entity = this.shown;
    if (!entity) {
      toast(this, t("No camera selected"));
      return;
    }
    this._diagOpen = true;
    this._diagBusy = true;
    this._diagError = null;
    this._diag = null;
    try {
      const res = await ws<unknown>(this.hass, "jarvis/camera_diagnostics", { entity_id: entity });
      this._diag = normaliseDiagnostics(res);
    } catch (err) {
      this._diagError = err;
    } finally {
      this._diagBusy = false;
    }
  }

  private async _analyze(): Promise<void> {
    if (this._analyzing) return;
    const entity = this.shown;
    if (!entity) {
      toast(this, t("No camera selected"));
      return;
    }
    const name = this._cam(entity)?.name || entity;
    const ok = await confirmDialog({
      heading: t("Analyze {name} now?", { name }),
      message: t("JARVIS runs one vision → reasoning pass on this camera. It uses LLM credits and takes a few seconds."),
      confirmLabel: t("Analyze now"),
      cancelLabel: t("Cancel"),
    });
    if (!ok) return;
    const h = this.hass;
    if (!hasService(h)) {
      toast(this, t("Home Assistant connection not available"));
      return;
    }
    this._analyzing = true;
    try {
      await h.callService("jarvis", "analyze_camera", { entity_id: entity, announce: this._announce });
      toast(this, t("Camera review ran — check Logs for the result"), "logs");
    } catch (err) {
      toast(this, `${t("Analysis failed —")} ${errMsg(err)}`);
    } finally {
      this._analyzing = false;
    }
  }

  private _onAnnounce(e: Event): void {
    this._announce = !!(e.target as SwitchEl).checked;
  }

  private _nav(view: string, path?: string): void {
    this.dispatchEvent(new CustomEvent("jarvis-navigate", { detail: { view, path }, bubbles: true, composed: true }));
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _icon(icon: string) {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  private _badge() {
    const live = this._tier === "ha-stream" || this._tier === "stream" || this._tier === "still";
    if (this._tier === "unavailable") return html`<jv-state-badge slot="actions" level="neutral" nodot .label=${t("Unavailable")}></jv-state-badge>`;
    if (this._tier === "none") return nothing;
    if (this.focusCamera) return html`<jv-state-badge slot="actions" level="danger" pulse .label=${t("Event")}></jv-state-badge>`;
    if (this._tier === "jarvis") {
      return this._snapNull || this._snapError
        ? html`<jv-state-badge slot="actions" level="neutral" .label=${t("No signal")}></jv-state-badge>`
        : html`<jv-state-badge slot="actions" level="warn" .label=${t("Snapshot")}></jv-state-badge>`;
    }
    if (live && this._hasFrame) return html`<jv-state-badge slot="actions" level="ok" pulse .label=${t("Live")}></jv-state-badge>`;
    return html`<jv-state-badge slot="actions" level="neutral" nodot .label=${t("Connecting…")}></jv-state-badge>`;
  }

  private _placeholder(): string {
    switch (this._tier) {
      case "none":
        return t("No camera selected");
      case "unavailable":
        return t("Unavailable in Home Assistant");
      case "jarvis": {
        if (this._src) return "";
        if (this._snapError) {
          return errCode(this._snapError) === "unknown_command"
            ? t("JARVIS snapshot unavailable — restart Home Assistant to load the updated integration, then refresh.")
            : t("JARVIS snapshot error — {message}", { message: errMsg(this._snapError).slice(0, 120) });
        }
        if (this._snapNull)
          return t("No frame — camera idle or unreachable. For Nest: verify the Google Nest integration is loaded and events are enabled.");
        return t("Connecting…");
      }
      default:
        return this._hasFrame ? "" : t("Connecting…");
    }
  }

  private _tierLabel(): string {
    switch (this._tier) {
      case "ha-stream":
      case "stream":
        return t("Stream");
      case "still":
        return t("Stills");
      case "jarvis":
        return t("JARVIS snapshot");
      default:
        return "";
    }
  }

  private _renderPicker() {
    const shown = this.shown;
    return html`
      <div class="picker" role="radiogroup" aria-label=${t("Camera")}>
        ${this.cameras.map(
          (c, i) => html`
            <button
              type="button"
              class="chip jv-hit ${this.focusCamera?.entity_id === c.entity_id ? "event" : ""}"
              role="radio"
              aria-checked=${c.entity_id === shown ? "true" : "false"}
              tabindex=${c.entity_id === shown || (!shown && i === 0) ? "0" : "-1"}
              title=${c.entity_id}
              @click=${() => this._pick(c.entity_id)}
              @keydown=${(e: KeyboardEvent) => this._onChipKey(e, i)}
            >
              ${c.name}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderTile() {
    const shown = this.shown;
    const cam = this._cam(shown);
    const name = cam?.name || shown;
    const placeholder = this._placeholder();
    const stateObj = this._stateObj();
    const f = this.focusCamera;
    return html`
      <div class="tile">
        ${this._tier === "ha-stream" && stateObj
          ? html`<ha-camera-stream .hass=${this.hass} .stateObj=${stateObj} .muted=${true} .controls=${false} .allowExoPlayer=${true}></ha-camera-stream>`
          : this._src
            ? html`<img class="frame" src=${this._src} alt=${t("Live view of {name}", { name })} @load=${this._onImgLoad} @error=${this._onImgError} />`
            : nothing}
        ${shown ? html`<span class="pill id">${shown}</span>` : nothing}
        ${f ? html`<span class="pill event">${t("EVENT · {label}", { label: f.label })}${f.confidence !== null ? ` · ${f.confidence}%` : ""}</span>` : nothing}
        ${placeholder ? html`<div class="placeholder" role="status">${placeholder}</div>` : nothing}
      </div>
    `;
  }

  private _renderStrip() {
    const shown = this.shown;
    if (!shown) return nothing;
    const cam = this._cam(shown);
    const name = cam?.name || shown;
    const src = this._source();
    const f = this.focusCamera;
    return html`
      <p class="strip" aria-live="polite">
        <span><span class="k">${t("Source")}</span> ${name}${src !== shown ? html` → <code>${entityTail(src)}</code>` : nothing}</span>
        ${this._tierLabel() ? html`<span>${this._tierLabel()}</span>` : nothing}
        <span>
          ${f
            ? html`<span class="k">${t("Target")}</span> ${f.label}${f.confidence !== null ? ` [${f.confidence}%]` : ""}`
            : t("Streaming")}
        </span>
      </p>
    `;
  }

  private _renderAnnounce() {
    const label = t("Announce result");
    if (haDefined("ha-switch")) {
      const sw = html`<ha-switch .checked=${this._announce} aria-label=${label} @change=${this._onAnnounce}></ha-switch>`;
      return haDefined("ha-formfield") ? html`<ha-formfield .label=${label}>${sw}</ha-formfield>` : sw;
    }
    return html`
      <label class="switch">
        <input type="checkbox" role="switch" .checked=${this._announce} @change=${this._onAnnounce} />
        <span>${label}</span>
      </label>
    `;
  }

  private _renderActions() {
    const none = !this.shown;
    return html`
      <div class="actions">
        <button
          type="button"
          class="jv-btn"
          title=${t("Probe this camera's frame sources end-to-end")}
          aria-expanded=${this._diagOpen ? "true" : "false"}
          ?disabled=${this._diagBusy || none}
          @click=${() => void this._runDiag()}
        >
          ${this._icon("mdi:stethoscope")} ${t("DIAG")}
        </button>
        <button type="button" class="jv-btn primary" ?disabled=${this._analyzing || none} @click=${() => void this._analyze()}>
          ${this._icon("mdi:eye-check-outline")} ${this._analyzing ? t("Analyzing…") : t("Analyze now")}
        </button>
        ${this._renderAnnounce()}
        <span class="spacer"></span>
        <button type="button" class="jv-btn text" @click=${() => this._nav("settings", "cameras")}>
          ${t("Open in Settings")} ${this._icon("mdi:chevron-right")}
        </button>
      </div>
    `;
  }

  private _renderDiag() {
    if (!this._diagOpen) return nothing;
    const shown = this.shown;
    const err = this._diagError;
    const d = this._diag;
    let body: unknown = nothing;
    if (this._diagBusy) {
      body = html`<p>${t("Probing {entity}… may take up to 30 s (stream wake)", { entity: shown })}</p>`;
    } else if (err) {
      const msg = errCode(err) === "unknown_command" ? t("Restart Home Assistant to load the updated integration, then refresh.") : errMsg(err);
      body = haDefined("ha-alert")
        ? html`<ha-alert alert-type="error" .title=${t("Diagnostics")}>${msg}</ha-alert>`
        : html`<div class="alert" role="alert">${msg}</div>`;
    } else if (d) {
      body = this._renderDiagLines(d);
    }
    return html`
      <div class="diag" aria-live="polite">
        ${body}
        <p class="foot">
          ${t("Tap DIAG again to close · the verdict is also in the Logs view")}
          <button type="button" @click=${() => this._nav("logs")}>${t("Logs")}</button>
        </p>
      </div>
    `;
  }

  private _probeHead(p: NonNullable<Diagnostics["probe"]>): string {
    const bits = [`state=${p.state || "?"}`, `platform=${p.platform || "?"}`];
    if (p.attrs?.frontend_stream_type) bits.push(`stream=${p.attrs.frontend_stream_type}`);
    if (p.override) bits.push(`override=${p.override}`);
    return `  ${bits.join("  ")}`;
  }

  private _renderDiagLines(d: Diagnostics) {
    // TILE: the client half of the story
    const img = this._tier === "ha-stream" ? null : this._img;
    const streamSize = this._tier === "ha-stream" ? decodedSizeInTree(this._haStream?.shadowRoot ?? null) : null;
    const w = streamSize?.width ?? img?.naturalWidth ?? 0;
    const h = streamSize?.height ?? img?.naturalHeight ?? 0;
    const luma = frameLuma(img);
    const tileBits = [
      `mode=${this._tier}`,
      w && h ? t("decoded {width}×{height}", { width: w, height: h }) : t("no decoded pixels"),
      luma !== null ? `lum ${luma.toFixed(1)}${luma <= BLACK_LUMA ? ` ${t("BLACK STREAM (decodes fine, shows nothing)")}` : ""}` : "",
    ].filter(Boolean);
    const platforms = Object.entries(d.platforms)
      .map(([k, n]) => `${k}×${n}`)
      .join("  ");
    const hasNest = Object.keys(d.platforms).some((k) => k.toLowerCase().includes("nest"));
    const p = d.probe;
    return html`
      <p class="pre"><strong>${t("Tile")}</strong> ${tileBits.join("  ")}</p>
      <p class="section pre"><strong>${t("HA cameras")}</strong> ${platforms || "—"}</p>
      ${hasNest
        ? nothing
        : html`<p class="bad">
            ${t("No nest-platform entities: the Google Nest integration isn't delivering cameras to HA. Fix that first (SDM credentials / integration setup); JARVIS can only consume what HA has.")}
          </p>`}
      ${p
        ? html`<p class="section pre"><strong>${p.entity_id}</strong>${this._probeHead(p)}</p>
            ${p.tiers.map((x) => html`<p class="pre ${x.detail.startsWith("OK") ? "ok" : "bad"}">  ${x.tier}: ${x.detail}</p>`)}
            <p class="verdict">${p.verdict}${p.elapsed_ms !== null ? ` (${p.elapsed_ms} ms)` : ""}</p>`
        : nothing}
    `;
  }

  override render() {
    const empty = this.cameras.length === 0;
    return html`
      <jv-section .heading=${t("Camera Watch")} icon="mdi:cctv">
        ${empty ? nothing : this._badge()}
        ${empty
          ? html`<slot name="empty"></slot>`
          : html`${this._renderPicker()} ${this._renderTile()} ${this._renderStrip()} ${this._renderActions()} ${this._renderDiag()}`}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-cam-watch": JarvisCamWatch;
  }
}
