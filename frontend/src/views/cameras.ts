/**
 * <jarvis-view-cameras> - everything camera-shaped (frontend/specs/cameras.md):
 *
 *   Camera Watch       <jarvis-cam-watch>    live tile + frame chain, DIAG, Analyze now
 *   Cameras            <jarvis-cam-list>     use switches, JARVIS names, location, related settings
 *   Doorbell Training  <jarvis-cam-doorbell> backlog scan + the training dataset
 *
 * The view owns the selection (persisted in localStorage["jarvis_active_cam"]),
 * the event focus (jarvis_camera_event / confident jarvis_face_recognized,
 * 25 s revert), every camera write (disabled_cameras, rename, location) with
 * an optimistic overlay over the snapshot (R11), and the toast region.
 */
import { html, css, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { haDefined } from "../ha";
import { t } from "../i18n";
import { confirmDialog } from "../components";
import "../components";
import "./cameras/watch";
import "./cameras/list";
import "./cameras/doorbell";
import type { RowStatus } from "./cameras/list";
import {
  type Camera,
  type CameraConfig,
  type FocusEvent,
  type LocationMode,
  type LocationResult,
  type RenameResult,
  errMsg,
  focusFromCameraEvent,
  focusFromFaceEvent,
  normaliseCameras,
  normaliseTraining,
  pickConfig,
  readActiveCam,
  resolvedLabel,
  stringMapOf,
  writeActiveCam,
} from "./cameras/model";

const FOCUS_MS = 25_000;
const SAVED_MS = 2000;
const TOAST_MS = 5000;
const EVENTS = ["jarvis_camera_event", "jarvis_face_recognized"] as const;

type Unsub = () => Promise<void> | void;

interface Patch {
  cameras?: unknown;
  names?: Record<string, string>;
  disabled?: string[];
}

@customElement("jarvis-view-cameras")
export class JarvisViewCameras extends JarvisView {
  static override styles = [
    base,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      .watch {
        grid-column: 1 / -1;
        width: 100%;
        max-width: 960px;
        justify-self: center;
      }
      @container (min-width: 1100px) {
        .layout {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .toast {
        position: sticky;
        bottom: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .toast > div {
        pointer-events: auto;
        max-width: min(100%, 560px);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-left: 4px solid var(--jv-info);
        box-shadow: var(--jv-shadow);
        overflow-wrap: anywhere;
      }
      .toast-link {
        margin-inline-start: var(--jv-space-2);
      }
      :host([narrow]) .toast {
        bottom: calc(var(--jv-tap) + var(--jv-space-3) + var(--jv-space-4) + env(safe-area-inset-bottom, 0px));
      }
    `,
  ];

  /** the user's explicit pick */
  @state() private _selected = "";
  @state() private _focus: FocusEvent | null = null;
  @state() private _patch: Patch | null = null;
  @state() private _rows: Record<string, RowStatus> = {};
  @state() private _bulkBusy = false;
  @state() private _toast = "";
  @state() private _toastLink: "logs" | undefined = undefined;

  private _cfg: CameraConfig = pickConfig(null);
  private _pending = 0;
  private _unsubs: Array<Promise<Unsub | undefined>> = [];
  private _subscribedTo: unknown = null;
  private _focusTimer: ReturnType<typeof setTimeout> | undefined;
  private _toastTimer: ReturnType<typeof setTimeout> | undefined;
  private _savedTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ── lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe();
    if (this._focusTimer) clearTimeout(this._focusTimer);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._focusTimer = undefined;
    this._toastTimer = undefined;
    this._focus = null;
    for (const timer of this._savedTimers.values()) clearTimeout(timer);
    this._savedTimers.clear();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("data") && this._pending === 0) this._patch = null;
    if (changed.has("data") || (changed as Map<string, unknown>).has("_patch")) this._cfg = this._effective();
    this._ensureSelection();
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has("hass")) this._subscribe();
  }

  // ── config overlay ────────────────────────────────────────────────────────

  private _effective(): CameraConfig {
    const cfg = pickConfig(this.data);
    const p = this._patch;
    if (!p) return cfg;
    const disabled = p.disabled ?? cfg.disabled;
    let cameras = p.cameras !== undefined ? normaliseCameras(p.cameras, disabled) : cfg.cameras;
    if (p.cameras === undefined && !cameras.length) cameras = cfg.cameras;
    if (p.disabled) cameras = cameras.map((c) => ({ ...c, enabled: !disabled.includes(c.entity_id) }));
    return { ...cfg, cameras, disabled, names: p.names ?? cfg.names };
  }

  private _applyPatch(next: Patch): void {
    this._patch = { ...(this._patch ?? {}), ...next };
  }

  private _enabled(): Camera[] {
    return this._cfg.cameras.filter((c) => c.enabled !== false);
  }

  private _ensureSelection(): void {
    const enabled = this._enabled();
    if (!enabled.length) {
      if (this._selected) this._selected = "";
    } else if (!enabled.some((c) => c.entity_id === this._selected)) {
      const stored = readActiveCam();
      this._selected = enabled.some((c) => c.entity_id === stored) ? stored : enabled[0].entity_id;
    }
    if (this._focus && !enabled.some((c) => c.entity_id === this._focus?.entity_id)) this._clearFocus();
  }

  // ── bus events (§2.9) ─────────────────────────────────────────────────────

  private _subscribe(): void {
    if (!this.isConnected) return;
    const conn = this.hass?.connection;
    if (!conn?.subscribeEvents || this._subscribedTo === conn) return;
    this._unsubscribe();
    this._subscribedTo = conn;
    for (const type of EVENTS) {
      const sub = conn
        .subscribeEvents<{ data?: unknown }>((ev) => this._onBusEvent(type, ev?.data), type)
        .catch(() => undefined);
      this._unsubs.push(sub);
    }
  }

  private _unsubscribe(): void {
    for (const p of this._unsubs) {
      void p.then((fn) => {
        try {
          void fn?.();
        } catch {
          /* already gone */
        }
      });
    }
    this._unsubs = [];
    this._subscribedTo = null;
  }

  private _onBusEvent(type: (typeof EVENTS)[number], data: unknown): void {
    if (!this.isConnected) return;
    const f = type === "jarvis_camera_event" ? focusFromCameraEvent(data) : focusFromFaceEvent(data);
    if (!f) return;
    // R10: ignore cameras that are disabled or not in the snapshot
    const cam = this._enabled().find((c) => c.entity_id === f.entity_id);
    if (!cam) return;
    this._focus = f;
    if (this._focusTimer) clearTimeout(this._focusTimer);
    this._focusTimer = setTimeout(() => {
      this._focusTimer = undefined;
      this._focus = null;
    }, FOCUS_MS);
    if (!this.narrow) this._showToast(t("Event · {camera} — camera focused", { camera: cam.name }));
  }

  private _clearFocus(): void {
    if (this._focusTimer) clearTimeout(this._focusTimer);
    this._focusTimer = undefined;
    this._focus = null;
  }

  // ── selection ─────────────────────────────────────────────────────────────

  private _onSelect(e: Event): void {
    const id = (e as CustomEvent<{ entity_id: string }>).detail?.entity_id;
    if (!id) return;
    e.stopPropagation();
    this._clearFocus();
    this._selected = id;
    writeActiveCam(id);
  }

  // ── toasts ────────────────────────────────────────────────────────────────

  private _onToast(e: Event): void {
    const detail = (e as CustomEvent<{ message: string; link?: "logs" }>).detail;
    if (!detail?.message) return;
    e.stopPropagation();
    this._showToast(detail.message, detail.link);
  }

  private _showToast(message: string, link?: "logs"): void {
    // Inside Home Assistant the root element shows its own toast; elsewhere
    // (harness, tests) the view's live region does.
    if (haDefined("home-assistant")) {
      const action = link ? { text: t("Logs"), action: () => this.navigate(link) } : undefined;
      this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message, action }, bubbles: true, composed: true }));
      return;
    }
    this._toast = message;
    this._toastLink = link;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toastTimer = undefined;
      this._toast = "";
    }, TOAST_MS);
  }

  // ── row status ────────────────────────────────────────────────────────────

  private _setRow(entity: string, st: RowStatus | null): void {
    const next = { ...this._rows };
    if (st) next[entity] = st;
    else delete next[entity];
    this._rows = next;
  }

  private _flashSaved(entity: string): void {
    this._setRow(entity, { saved: true });
    const old = this._savedTimers.get(entity);
    if (old) clearTimeout(old);
    this._savedTimers.set(
      entity,
      setTimeout(() => {
        this._savedTimers.delete(entity);
        if (this._rows[entity]?.saved) this._setRow(entity, null);
      }, SAVED_MS),
    );
  }

  private async _write<T>(fn: () => Promise<T>): Promise<T> {
    this._pending++;
    try {
      return await fn();
    } finally {
      this._pending--;
    }
  }

  // ── writes (§2.5–2.7) ─────────────────────────────────────────────────────

  /** Optimistic disabled_cameras write; resolves to the error message, or "" on success. */
  private async _saveDisabled(next: string[], prev: string[], okMsg: string): Promise<string> {
    this._applyPatch({ disabled: next });
    try {
      await this._write(() => this.ws("jarvis/update_config", { key: "disabled_cameras", value: next }));
      this._showToast(okMsg);
      this.refresh();
      return "";
    } catch (err) {
      const msg = errMsg(err) || t("Couldn't save —");
      this._applyPatch({ disabled: prev });
      this._showToast(`${t("Couldn't save —")} ${msg}`);
      return msg;
    }
  }

  private async _onToggle(e: Event): Promise<void> {
    const { entity_id, enabled } = (e as CustomEvent<{ entity_id: string; enabled: boolean }>).detail;
    e.stopPropagation();
    if (this._rows[entity_id]?.saving || this._bulkBusy) return;
    const prev = this._cfg.disabled;
    const next = enabled ? prev.filter((x) => x !== entity_id) : prev.includes(entity_id) ? prev : [...prev, entity_id];
    this._setRow(entity_id, { saving: true });
    const error = await this._saveDisabled(next, prev, enabled ? t("Camera enabled") : t("Camera disabled"));
    this._setRow(entity_id, error ? { error } : null);
  }

  private async _onAll(e: Event): Promise<void> {
    const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail;
    e.stopPropagation();
    if (this._bulkBusy) return;
    if (!enabled) {
      const ok = await confirmDialog({
        heading: t("Disable all cameras?"),
        message: t("JARVIS will stop watching every camera — doorbell analysis, package detection and intrusion confirmation go blind until you enable one again."),
        confirmLabel: t("Disable all"),
        cancelLabel: t("Cancel"),
      });
      if (!ok) return;
    }
    const prev = this._cfg.disabled;
    const next = enabled ? [] : this._cfg.cameras.map((c) => c.entity_id);
    this._bulkBusy = true;
    try {
      await this._saveDisabled(next, prev, enabled ? t("All cameras enabled") : t("All cameras disabled"));
    } finally {
      this._bulkBusy = false;
    }
  }

  private async _onRename(e: Event): Promise<void> {
    const { entity_id, name } = (e as CustomEvent<{ entity_id: string; name: string }>).detail;
    e.stopPropagation();
    if (this._rows[entity_id]?.saving) return;
    const trimmed = name.trim();
    this._setRow(entity_id, { saving: true });
    try {
      const res = await this._write(() => this.ws<RenameResult>("jarvis/rename_camera", { entity_id, name: trimmed }));
      const patch: Patch = {};
      if (Array.isArray(res?.cameras)) patch.cameras = res.cameras;
      if (res?.camera_names && typeof res.camera_names === "object") patch.names = stringMapOf(res.camera_names);
      else {
        const names = { ...this._cfg.names };
        if (trimmed) names[entity_id] = trimmed;
        else delete names[entity_id];
        patch.names = names;
      }
      this._applyPatch(patch);
      this._flashSaved(entity_id);
      this._showToast(trimmed ? t('Renamed to "{name}"', { name: trimmed }) : t("Name reverted"));
      this.refresh();
    } catch (err) {
      const msg = errMsg(err);
      this._setRow(entity_id, { error: msg });
      // re-render the field with the saved value (live() resets the input)
      this.requestUpdate();
      this._showToast(`${t("Rename failed —")} ${msg}`);
    }
  }

  private async _onLocation(e: Event): Promise<void> {
    const { entity_id, mode } = (e as CustomEvent<{ entity_id: string; mode: LocationMode }>).detail;
    e.stopPropagation();
    if (this._rows[entity_id]?.saving) return;
    this._setRow(entity_id, { saving: true });
    try {
      // the backend writes indoor_/outdoor_entities through config_apply.async_apply_many (runtime_config,
      // config.json, coordinator, config-changed signal): Settings › Cameras shows the new lists from the
      // next jarvis/config_schema read, the snapshot from the refresh() below
      const res = await this._write(() => this.ws<LocationResult>("jarvis/camera_location", { entity_id, mode }));
      if (Array.isArray(res?.cameras)) this._applyPatch({ cameras: res.cameras });
      else {
        // older backend without the list: patch the mode locally
        const cameras = this._cfg.cameras.map((c) => (c.entity_id === entity_id ? { ...c, location_mode: mode } : c));
        this._applyPatch({ cameras });
      }
      this._setRow(entity_id, null);
      const cam = this._effective().cameras.find((c) => c.entity_id === entity_id);
      const name = cam?.name || entity_id;
      const label = mode === "auto" ? t("auto ({resolved})", { resolved: cam ? resolvedLabel(cam) : t("indoor") }) : mode === "indoor" ? t("indoor") : t("outdoor");
      this._showToast(t("{name} → {mode}", { name, mode: label }));
      this.refresh();
    } catch (err) {
      const msg = errMsg(err);
      this._setRow(entity_id, { error: msg });
      this._showToast(`${t("Couldn't save —")} ${msg}`);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _renderLoading() {
    return html`
      <div class="layout">
        <jv-section class="watch" loading .heading=${t("Camera Watch")} icon="mdi:cctv">
          <jv-empty kind="loading" compact .heading=${t("Loading…")}></jv-empty>
        </jv-section>
        <jv-section loading .heading=${t("Cameras")} icon="mdi:camera-outline"></jv-section>
        <jv-section loading .heading=${t("Doorbell Training")} icon="mdi:doorbell-video"></jv-section>
      </div>
    `;
  }

  private _renderWatchEmpty(total: number) {
    return total === 0
      ? html`<jv-empty
          slot="empty"
          icon="mdi:cctv-off"
          .heading=${t("No camera entities in Home Assistant.")}
          .message=${t("Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.")}
        ></jv-empty>`
      : html`<jv-empty
          slot="empty"
          icon="mdi:cctv-off"
          .heading=${t("All cameras are disabled")}
          .message=${t("Enable at least one camera below to watch it here.")}
        ></jv-empty>`;
  }

  override render() {
    if (!this.data) return this._renderLoading();
    const cfg = this._cfg;
    const enabled = this._enabled();
    const training = normaliseTraining(this.data.doorbell_training);
    return html`
      <div
        class="layout"
        @jarvis-cam-toast=${this._onToast}
        @jarvis-cam-select=${this._onSelect}
        @jarvis-cam-toggle=${(e: Event) => void this._onToggle(e)}
        @jarvis-cam-all=${(e: Event) => void this._onAll(e)}
        @jarvis-cam-rename=${(e: Event) => void this._onRename(e)}
        @jarvis-cam-location=${(e: Event) => void this._onLocation(e)}
      >
        <jarvis-cam-watch
          class="watch"
          .hass=${this.hass}
          .narrow=${this.narrow}
          .cameras=${enabled}
          .overrides=${cfg.overrides}
          .selected=${this._selected}
          .focusCamera=${this._focus}
        >
          ${enabled.length ? nothing : this._renderWatchEmpty(cfg.cameras.length)}
        </jarvis-cam-watch>
        <jv-section
          .heading=${t("Cameras")}
          icon="mdi:camera-outline"
          .subheading=${t("Names are JARVIS-only (HA untouched; blank reverts). Location governs intrusion + outdoor-event filtering — AUTO shows what the heuristics resolve.")}
        >
          <jarvis-cam-list
            .narrow=${this.narrow}
            .cameras=${cfg.cameras}
            .overrides=${cfg.overrides}
            .names=${cfg.names}
            .values=${cfg.values}
            .rows=${this._rows}
            .bulkBusy=${this._bulkBusy}
          ></jarvis-cam-list>
        </jv-section>
        <jv-section
          .heading=${t("Doorbell Training")}
          icon="mdi:doorbell-video"
          .subheading=${t("Analysed doorbell events — JARVIS's visitor training data. Each press is logged automatically; run a backlog scan to mine the Nest recorded-event history into the dataset.")}
        >
          <jarvis-cam-doorbell .hass=${this.hass} .narrow=${this.narrow} .training=${training}></jarvis-cam-doorbell>
        </jv-section>
      </div>
      <div class="toast" role="status" aria-live="polite" aria-atomic="true">${this._toast
        ? html`<div>
            ${this._toast}
            ${this._toastLink
              ? html`<button class="jv-btn text toast-link" type="button" @click=${() => this.navigate(this._toastLink ?? "logs")}>${t("Logs")}</button>`
              : nothing}
          </div>`
        : nothing}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-cameras": JarvisViewCameras;
  }
}
