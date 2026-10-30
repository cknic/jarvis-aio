/**
 * EditorStore - the one place the editor's state lives.
 *
 *   working copy (EditorDoc)  <- load(data) from the snapshot, section 4.8 sync rules
 *   history                   <- every change() that is not transient
 *   dirty                     <- serialised doc !== the baseline (per plan key)
 *   save()                    -> jarvis/update_config, one changed key at a time, then jarvis-refresh
 *   writeSetting()            -> the immediate-save keys (units, opacity, door mapping, house keys)
 *   writeFloorBackground()    -> one floor's background image / alignment (jarvis/set_floor_background)
 *   floor / tab / selection   <- shared UI state (canvas, inspector, tabs all read it)
 *   toasts                    <- the editor renders them (role="status")
 *
 * It is a plain observable: `subscribe(fn)` is called (microtask-batched) after
 * every state change; Lit elements call `requestUpdate()` from it. Nothing
 * here renders. All mutation of the doc goes through `change()`: never mutate
 * `store.doc` in place.
 */
import type { FloorBackgroundResult, Hass, PanelData } from "../../../types";
import { t } from "../../../i18n";
import { ws, WsError } from "../../../ws";
import { History } from "./history";
import {
  PLAN_KEYS, cloneDoc, describeSelection, floorEnabled, floorLabel, floorOf, isCanonical, mergeFloorBackground, moveSelection, parseDoc, parseSettings,
  removeSelection, selectionExists, serializeAll, stableJson, syncFloors, areaNames as areaNamesOf,
  type CameraPin, type EditorDoc, type EditorSettings, type EntityPin, type Floor, type FloorBackgroundPatch, type FloorKey, type Opening, type PlanKey, type Room,
  type Selection,
} from "./model";
import type { JvPlanCanvas } from "./canvas";

export type EditorTab = "rooms" | "openings" | "doors" | "pins" | "import";
/** The sub-tabs: route tail `editor/<id>`, English label (t() key), the element the Build agents define. */
export const EDITOR_TABS: ReadonlyArray<{ id: EditorTab; label: string; element: string; icon: string }> = [
  { id: "rooms", label: "Rooms", element: "jarvis-editor-rooms", icon: "mdi:floor-plan" },
  { id: "openings", label: "Openings", element: "jarvis-editor-openings", icon: "mdi:window-closed-variant" },
  { id: "doors", label: "Doors", element: "jarvis-editor-doors", icon: "mdi:door" },
  { id: "pins", label: "Cameras & pins", element: "jarvis-editor-pins", icon: "mdi:cctv" },
  { id: "import", label: "Import", element: "jarvis-editor-import", icon: "mdi:import" },
];
export function isEditorTab(v: unknown): v is EditorTab {
  return EDITOR_TABS.some((t) => t.id === v);
}

export interface SettingStatus {
  level: "saving" | "saved" | "error";
  /** error message (WsError.message) */
  message?: string;
}
export interface SaveKeyResult {
  key: PlanKey;
  ok: boolean;
  error?: string;
  code?: string;
}
export interface SaveResult {
  ok: boolean;
  /** one row per key that needed writing, in save order; stops after the first failure */
  results: SaveKeyResult[];
  /** the failing message, if any */
  error?: string;
  code?: string;
}
export interface ToastAction {
  label: string;
  run: () => void;
}
export interface Toast {
  id: number;
  message: string;
  /** dropped as soon as the history moves on (an "Undo" must undo THIS change, not a later one) */
  action?: ToastAction;
  /** the history revision the toast was shown at */
  rev: number;
}
export interface ChangeOptions {
  /** a drag frame: replaces the doc without a history entry (the release pushes one) */
  transient?: boolean;
  /** merge into the previous history entry when it has the same key (arrow nudges, slider frames) */
  coalesce?: string;
}

const emptyDoc = (): EditorDoc => ({ floors: [], openings: {}, cameras: {}, pins: {}, property: { points: [] } });
type Baseline = Record<PlanKey, string>;
const SAVED_STATUS_MS = 2500;
const TOAST_MS = 4000;
/**
 * HA's websocket accepts messages up to aiohttp's default 4 MiB; a bigger
 * frame is rejected and the connection drops. Writes are refused client-side
 * below this (the margin covers the id / envelope). Backgrounds go one floor
 * per message (jarvis/set_floor_background), so the limit is per image.
 */
export const WS_FRAME_LIMIT = 4 * 1024 * 1024 - 8 * 1024;

/** UTF-8 size of the websocket message `{id, type, ...payload}`. */
function frameBytes(type: string, payload: Record<string, unknown>): number {
  const text = JSON.stringify({ id: 1e9, type, ...payload });
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    return text.length * 3;
  }
}

/** UTF-8 size of the jarvis/update_config message that would carry `value`. */
export function updateFrameBytes(key: string, value: unknown): number {
  return frameBytes("jarvis/update_config", { key, value });
}

/** UTF-8 size of the jarvis/set_floor_background message for `floor` + `patch`. */
export function floorBackgroundFrameBytes(floor: FloorKey, patch: FloorBackgroundPatch): number {
  return frameBytes("jarvis/set_floor_background", { floor, ...patch });
}
const mb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(2);

export class EditorStore {
  /** set by the editor on every hass change (never cached elsewhere) */
  hass?: Hass;
  /** where `jarvis-refresh` is dispatched (the editor element) */
  host?: EventTarget;
  /** the mounted canvas (set by <jv-plan-canvas> itself); null until it connects */
  canvas: JvPlanCanvas | null = null;
  /** the latest snapshot (for `data.areas`, `data.doors`, ...) */
  data: PanelData | null = null;

  readonly history = new History<EditorDoc>();

  private _doc: EditorDoc = emptyDoc();
  private _config: Record<string, unknown> = {};
  private _overlay: Record<string, unknown> = {};
  private _settingsCache: EditorSettings | null = null;
  private _baseline: Baseline = this._emptyBaseline();
  private _baselineText = "";
  private _dirtyKeys: PlanKey[] = [];
  private _pendingRemote: { parsed: ReturnType<typeof parseDoc>; baseline: Baseline } | null = null;
  private _dismissedRemote = "";
  private _floor: FloorKey = "1f";
  private _tab: EditorTab = "rooms";
  private _selection: Selection | null = null;
  private _listeners = new Set<() => void>();
  private _queued = false;
  private _toastSeq = 0;
  /** bumped on every history mutation (push, undo, redo, reset) */
  private _historyRev = 0;
  private _timers = new Map<string, ReturnType<typeof setTimeout>>();

  /** true after the first snapshot was parsed */
  loaded = false;
  /** false while the sample home is shown (floor_plan_rooms unset) */
  configured = true;
  warnings: string[] = [];
  saving = false;
  saveError: string | null = null;
  saveErrorCode: string | null = null;
  /** another client changed the plan while this one is dirty (banner: Reload / Keep mine) */
  remoteChanged = false;
  settingStatus: Record<string, SettingStatus> = {};
  toasts: Toast[] = [];

  constructor() {
    this.history.subscribe(() => {
      this._historyRev += 1;
      // an Undo offered by a toast belongs to the change it announced: once the history moves on, drop it
      if (this.toasts.some((x) => x.action && x.rev !== this._historyRev)) {
        this.toasts = this.toasts.map((x) => (x.action && x.rev !== this._historyRev ? { ...x, action: undefined } : x));
      }
      this._notify();
    });
  }

  // ── observable ──────────────────────────────────────────────────────────
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => {
      this._listeners.delete(fn);
    };
  }

  private _notify(): void {
    this._settingsCache = null;
    if (this._queued) return;
    this._queued = true;
    queueMicrotask(() => {
      this._queued = false;
      for (const fn of this._listeners) {
        try {
          fn();
        } catch {
          /* a listener must never break the others */
        }
      }
    });
  }

  // ── state reads ─────────────────────────────────────────────────────────
  /** The working copy. READ ONLY - mutate through change(). */
  get doc(): EditorDoc {
    return this._doc;
  }
  /** Snapshot config overlaid with in-flight optimistic setting values. */
  get config(): Record<string, unknown> {
    return { ...this._config, ...this._overlay };
  }
  /** units / background / opacity / door mapping, parsed from `config`. */
  get settings(): EditorSettings {
    return (this._settingsCache ??= parseSettings(this.config));
  }
  get floor(): FloorKey {
    return this._floor;
  }
  get tab(): EditorTab {
    return this._tab;
  }
  get selection(): Selection | null {
    return this._selection;
  }
  get dirty(): boolean {
    return this._dirtyKeys.length > 0;
  }
  /** The plan keys whose serialised value differs from the baseline (what save() will write). */
  get dirtyKeys(): readonly PlanKey[] {
    return this._dirtyKeys;
  }
  get canUndo(): boolean {
    return this.history.canUndo;
  }
  get canRedo(): boolean {
    return this.history.canRedo;
  }
  get undoLabel(): string {
    return this.history.undoLabel;
  }
  get redoLabel(): string {
    return this.history.redoLabel;
  }
  get floors(): readonly Floor[] {
    return this._doc.floors;
  }
  get currentFloor(): Floor | undefined {
    return floorOf(this._doc, this._floor);
  }
  rooms(floor: FloorKey = this._floor): readonly Room[] {
    return floorOf(this._doc, floor)?.rooms || [];
  }
  openings(floor: FloorKey = this._floor): readonly Opening[] {
    return this._doc.openings[floor] || [];
  }
  cameras(floor: FloorKey = this._floor): readonly CameraPin[] {
    return this._doc.cameras[floor] || [];
  }
  pins(floor: FloorKey = this._floor): readonly EntityPin[] {
    return this._doc.pins[floor] || [];
  }
  /** Stored label, canonical English label, or the key - pass through t(). */
  floorLabel(key: FloorKey = this._floor): string {
    const f = floorOf(this._doc, key);
    return floorLabel(f ?? key);
  }
  /** Not shown on the Residence tab: a non-canonical key, or a canonical floor disabled by home_stories / has_basement. */
  floorHidden(key: FloorKey): boolean {
    return !isCanonical(key) || !floorEnabled(this.config, key);
  }
  /** Area names from the snapshot (what a room name should match). */
  areaNames(): string[] {
    return areaNamesOf(this.data);
  }
  /** `{name, w, h}` of the selection for announcements, null when nothing is selected. */
  describeSelection(): { name: string; w?: number; h?: number } | null {
    return describeSelection(this._doc, this._selection, this._floor);
  }

  // ── UI state writes ─────────────────────────────────────────────────────
  setFloor(key: FloorKey): void {
    if (key === this._floor) return;
    this._floor = key;
    this._selection = null;
    this._notify();
  }
  setTab(tab: EditorTab): void {
    if (tab === this._tab) return;
    this._tab = tab;
    this._notify();
  }
  select(sel: Selection | null): void {
    const next = sel && selectionExists(this._doc, sel, this._floor) ? { kind: sel.kind, id: sel.id, ...(sel.sub != null ? { sub: sel.sub } : {}) } : null;
    if (stableJson(next) === stableJson(this._selection)) return;
    this._selection = next;
    this._notify();
  }

  // ── doc mutation ────────────────────────────────────────────────────────
  /**
   * Apply a change to a clone of the doc and (unless transient) push it to the
   * history under `label` (English, e.g. "Move Kitchen"; it feeds the undo tooltip).
   */
  change(label: string, apply: (doc: EditorDoc) => void, opts: ChangeOptions = {}): void {
    this.changeWith((doc) => {
      apply(doc);
      return label;
    }, opts);
  }

  /**
   * Like change(), but `apply` returns the label - or null to abandon the
   * change (nothing is recorded, the doc stays as it was). Returns the label.
   */
  changeWith(apply: (doc: EditorDoc) => string | null, opts: ChangeOptions = {}): string | null {
    const next = cloneDoc(this._doc);
    const label = apply(next);
    if (label == null) return null;
    this._doc = next;
    if (!opts.transient) this.history.push(label, next, { coalesce: opts.coalesce });
    this._afterDocChange();
    return label;
  }

  undo(): boolean {
    const s = this.history.undo();
    if (!s) return false;
    this._doc = s;
    this._afterDocChange();
    return true;
  }
  redo(): boolean {
    const s = this.history.redo();
    if (!s) return false;
    this._doc = s;
    this._afterDocChange();
    return true;
  }

  /** Move the selection by (dx, dy) units; repeated calls within 800 ms coalesce into one history entry. */
  nudgeSelection(dx: number, dy: number): string | null {
    const sel = this._selection;
    if (!sel) return null;
    const floor = this._floor;
    return this.changeWith((doc) => moveSelection(doc, sel, dx, dy, floor), { coalesce: `nudge:${floor}:${sel.kind}:${sel.id}:${sel.sub ?? ""}` });
  }

  /** Remove the selection (a room takes its anchored openings along). Returns the label ("Removed Kitchen") or null. */
  removeSelection(): string | null {
    const sel = this._selection;
    if (!sel) return null;
    const floor = this._floor;
    const label = this.changeWith((doc) => removeSelection(doc, sel, floor));
    if (label) this.select(null);
    return label;
  }

  private _afterDocChange(): void {
    this._syncFloors();
    if (this._selection && !selectionExists(this._doc, this._selection, this._floor)) this._selection = null;
    this._recomputeDirty();
    this._notify();
  }

  /**
   * The floor list follows home_stories / has_basement (live config, overlay
   * included) even while the doc is kept: synthesised empty floors never
   * serialise, so the snapshot text cannot tell the doc that they changed.
   */
  private _syncFloors(): void {
    const next = syncFloors(this._doc, this.config);
    if (next) this._doc = next;
    if (!floorOf(this._doc, this._floor) && this._doc.floors.length) {
      this._floor = this._doc.floors[0].key;
      this._selection = null;
    }
  }

  // ── snapshot sync (section 4.8) ─────────────────────────────────────────
  /** Feed every new snapshot here (the editor does it from willUpdate). */
  load(data: PanelData | null): void {
    if (!data) return;
    this.data = data;
    this._config = data.config || {};
    for (const key of Object.keys(this._overlay)) if (this.settingStatus[key]?.level !== "saving") delete this._overlay[key];
    const parsed = parseDoc(this._config);
    const baseline = this._baselineOf(parsed.doc);
    const text = this._joinBaseline(baseline);
    if (!this.loaded) {
      this._adopt(parsed, baseline);
      this._floor = this._initialFloor(parsed.doc);
      this.loaded = true;
    } else if (text !== this._baselineText) {
      if (!this.dirty) this._adopt(parsed, baseline);
      else if (text !== this._dismissedRemote) {
        this._pendingRemote = { parsed, baseline };
        this.remoteChanged = true;
      }
    } else if (!this.dirty) {
      this.configured = parsed.configured;
      this.warnings = parsed.warnings;
    }
    this._syncFloors();
    this._notify();
  }

  /** Banner "Reload": take the remote plan, dropping local changes. */
  adoptRemote(): void {
    if (!this._pendingRemote) return;
    const { parsed, baseline } = this._pendingRemote;
    this._adopt(parsed, baseline);
    this._notify();
  }
  /** Banner "Keep mine": hide the banner until the remote plan changes again. */
  dismissRemote(): void {
    if (this._pendingRemote) this._dismissedRemote = this._joinBaseline(this._pendingRemote.baseline);
    this._pendingRemote = null;
    this.remoteChanged = false;
    this._notify();
  }
  /** Toolbar "Discard": re-parse the latest snapshot and clear the history. */
  discard(): void {
    if (this._pendingRemote) {
      this.adoptRemote();
      return;
    }
    const parsed = parseDoc(this._config);
    this._adopt(parsed, this._baselineOf(parsed.doc));
    this._notify();
  }

  private _adopt(parsed: ReturnType<typeof parseDoc>, baseline: Baseline): void {
    this._doc = syncFloors(parsed.doc, this.config) ?? parsed.doc;
    this.configured = parsed.configured;
    this.warnings = parsed.warnings;
    this._baseline = baseline;
    this._baselineText = this._joinBaseline(baseline);
    this._dirtyKeys = [];
    this._selection = null;
    this._pendingRemote = null;
    this._dismissedRemote = "";
    this.remoteChanged = false;
    this.saveError = null;
    this.saveErrorCode = null;
    if (!floorOf(this._doc, this._floor) && this._doc.floors.length) this._floor = this._doc.floors[0].key;
    this.history.reset(this._doc);
  }

  private _initialFloor(doc: EditorDoc): FloorKey {
    const first = doc.floors.find((f) => f.key === "1f") ?? doc.floors[0];
    if (first && (first.rooms.length || !doc.floors.some((f) => f.rooms.length))) return first.key;
    return doc.floors.find((f) => f.rooms.length)?.key ?? first?.key ?? "1f";
  }

  private _emptyBaseline(): Baseline {
    const out = {} as Baseline;
    for (const k of PLAN_KEYS) out[k] = "";
    return out;
  }
  private _baselineOf(doc: EditorDoc): Baseline {
    const all = serializeAll(doc);
    const out = {} as Baseline;
    for (const k of PLAN_KEYS) out[k] = stableJson(all[k]);
    return out;
  }
  private _joinBaseline(b: Baseline): string {
    return PLAN_KEYS.map((k) => b[k]).join("\n");
  }
  private _recomputeDirty(): void {
    const all = serializeAll(this._doc);
    this._dirtyKeys = PLAN_KEYS.filter((k) => stableJson(all[k]) !== this._baseline[k]);
  }

  // ── persistence ─────────────────────────────────────────────────────────
  /**
   * Write every changed plan key sequentially (rooms, elements, cameras,
   * entities, property). Stops at the first failure and keeps the rest dirty;
   * `results` says what happened per key. Dispatches `jarvis-refresh` when
   * everything succeeded. The history is kept (undo still works).
   */
  async save(): Promise<SaveResult> {
    if (this.saving) return { ok: false, results: [], error: "A save is already in progress", code: "busy" };
    this.saving = true;
    this.saveError = null;
    this.saveErrorCode = null;
    this._notify();
    const results: SaveKeyResult[] = [];
    let error: string | undefined;
    let code: string | undefined;
    try {
      for (const key of PLAN_KEYS) {
        const value = serializeAll(this._doc)[key];
        const text = stableJson(value);
        if (text === this._baseline[key]) continue;
        try {
          const bytes = updateFrameBytes(key, value);
          if (bytes > WS_FRAME_LIMIT) throw new WsError("jarvis/update_config", "too_large", t("This change is {size} MB; Home Assistant accepts at most {max} MB at once", { size: mb(bytes), max: mb(WS_FRAME_LIMIT) }));
          await ws(this.hass, "jarvis/update_config", { key, value });
          this._baseline[key] = text;
          this._baselineText = this._joinBaseline(this._baseline);
          results.push({ key, ok: true });
        } catch (err) {
          const e = WsError.from("jarvis/update_config", err);
          results.push({ key, ok: false, error: e.message, code: e.code });
          error = e.message;
          code = e.code;
          break;
        }
      }
    } finally {
      this.saving = false;
      this._recomputeDirty();
      this._notify();
    }
    if (error) {
      this.saveError = error;
      this.saveErrorCode = code ?? null;
      this._notify();
      return { ok: false, results, error, code };
    }
    this.configured = true;
    this.refresh();
    return { ok: true, results };
  }

  /** Clear the save error banner (Retry calls save() again). */
  clearSaveError(): void {
    this.saveError = null;
    this.saveErrorCode = null;
    this._notify();
  }

  /**
   * Immediate-save path for the non-plan keys (floor_plan_units,
   * floor_plan_bg_opacity, door_mapping and the house keys): optimistic
   * overlay, per-key status (saving -> saved, auto-cleared; error reverts),
   * `jarvis-refresh` on success. Resolves true on success. floor_plan_bg is
   * NOT written whole: use writeFloorBackground().
   */
  async writeSetting(key: string, value: unknown): Promise<boolean> {
    // a frame over HA's websocket limit would drop the connection: refuse it here with a clear message
    const bytes = updateFrameBytes(key, value);
    if (bytes > WS_FRAME_LIMIT) {
      this._setStatus(key, { level: "error", message: t("This change is {size} MB; Home Assistant accepts at most {max} MB at once", { size: mb(bytes), max: mb(WS_FRAME_LIMIT) }) });
      return false;
    }
    this._overlay[key] = value;
    this._syncFloors();
    this._setStatus(key, { level: "saving" });
    try {
      await ws(this.hass, "jarvis/update_config", { key, value });
      this._setStatus(key, { level: "saved" }, SAVED_STATUS_MS);
      this.refresh();
      return true;
    } catch (err) {
      delete this._overlay[key];
      this._syncFloors();
      this._setStatus(key, { level: "error", message: WsError.from("jarvis/update_config", err).message });
      return false;
    }
  }

  /**
   * Set / remove ONE floor's background image and / or alignment
   * (jarvis/set_floor_background merges that floor server-side, so only this
   * floor's image travels and each image - not all of them together - has to
   * fit WS_FRAME_LIMIT). Same UX as writeSetting under the status key
   * `floor_plan_bg`: the merged dict is the optimistic overlay, an error
   * restores the previous overlay. Resolves true on success.
   */
  async writeFloorBackground(floor: FloorKey, patch: FloorBackgroundPatch): Promise<boolean> {
    const key = "floor_plan_bg";
    const bytes = floorBackgroundFrameBytes(floor, patch);
    if (bytes > WS_FRAME_LIMIT) {
      const message = patch.image
        ? t("This image is {size} MB; Home Assistant accepts at most {max} MB per image", { size: mb(bytes), max: mb(WS_FRAME_LIMIT) })
        : t("This change is {size} MB; Home Assistant accepts at most {max} MB at once", { size: mb(bytes), max: mb(WS_FRAME_LIMIT) });
      this._setStatus(key, { level: "error", message });
      return false;
    }
    const had = key in this._overlay;
    const prev = this._overlay[key];
    this._overlay[key] = mergeFloorBackground(this.config[key], floor, patch);
    this._setStatus(key, { level: "saving" });
    try {
      await ws<FloorBackgroundResult>(this.hass, "jarvis/set_floor_background", { floor, ...patch });
      this._setStatus(key, { level: "saved" }, SAVED_STATUS_MS);
      this.refresh();
      return true;
    } catch (err) {
      if (had) this._overlay[key] = prev;
      else delete this._overlay[key];
      this._setStatus(key, { level: "error", message: WsError.from("jarvis/set_floor_background", err).message });
      return false;
    }
  }

  private _setStatus(key: string, status: SettingStatus | null, clearAfter = 0): void {
    clearTimeout(this._timers.get(key));
    this._timers.delete(key);
    const next = { ...this.settingStatus };
    if (status) next[key] = status;
    else delete next[key];
    this.settingStatus = next;
    this._notify();
    if (status && clearAfter > 0) {
      this._timers.set(
        key,
        setTimeout(() => {
          if (this.settingStatus[key]?.level === status.level) this._setStatus(key, null);
        }, clearAfter),
      );
    }
  }

  /** Ask the panel to re-fetch the snapshot now. */
  refresh(): void {
    this.host?.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  }

  // ── toasts (rendered by the editor as a role="status" strip) ────────────
  /** `message` is already translated; an optional action (e.g. Undo). Returns the toast id. */
  toast(message: string, action?: ToastAction, ms = TOAST_MS): number {
    const id = ++this._toastSeq;
    this.toasts = [...this.toasts, { id, message, action, rev: this._historyRev }];
    this._notify();
    if (ms > 0) this._timers.set(`toast:${id}`, setTimeout(() => this.dismissToast(id), ms));
    return id;
  }
  /** The toast's button: runs its action only while the history is still where the toast was shown, then dismisses it. */
  runToastAction(id: number): void {
    const toast = this.toasts.find((x) => x.id === id);
    this.dismissToast(id);
    if (toast?.action && toast.rev === this._historyRev) toast.action.run();
  }
  dismissToast(id: number): void {
    clearTimeout(this._timers.get(`toast:${id}`));
    this._timers.delete(`toast:${id}`);
    if (!this.toasts.some((t) => t.id === id)) return;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this._notify();
  }

  /** Stop timers (the editor calls it on disconnect). */
  dispose(): void {
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
    this.toasts = [];
  }
}
