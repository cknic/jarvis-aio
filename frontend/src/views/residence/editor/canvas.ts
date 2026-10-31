/**
 * <jv-plan-canvas> - the SVG editing surface.
 *
 * One <svg> (touch-action: none, focusable, role="application") whose content
 * is a stack of LAYERS. The canvas owns the viewBox (fit / pan / zoom with
 * wheel, pinch and keys), the grid, the background image, the ghost of the
 * floor below, the overlay (snap guides, rubber band, polygon draft,
 * measurement tooltip), hover / focus / selection bookkeeping, the Pointer
 * Events controller (capture, 4 px drag threshold, tap vs drag, long-press
 * context menu, multi-touch pinch), keyboard nudging and the aria-live
 * announcements. Everything about rooms, openings, cameras, pins and the lot
 * comes from layers the tab modules register with `registerLayer()`, so the
 * Build agents add behaviour without touching this file (see ./README.md).
 *
 * Hits: an interactive SVG element carries `data-hit="<kind>:<id>[:<sub>]"`
 * (e.g. room:r1a2, vtx:r1a2:3, camera:c9x, pin:binary_sensor.front_door).
 * The canvas parses it into a Hit and routes pointer / key events to the
 * layer that owns that kind. A tap on room / opening / camera / pin / vtx /
 * prop-vtx selects by default; everything else is up to the layer.
 */
import { LitElement, html, svg, css, nothing, type CSSResult, type PropertyValues, type SVGTemplateResult } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import type { Hass } from "../../../types";
import type { EditorStore, EditorTab } from "./store";
import {
  EMPTY_FLOOR_BOX, GRID_MAJOR, GRID_MINOR, SNAP_EDGE_TOL, SNAP_GRID, bboxOfPoints, cloneDoc, contentBBox, dim, findRoom, floorBelow, floorOf,
  roomPoints, unionBBox, type BBox, type EditorDoc, type Floor, type FloorKey, type Pt2, type Room, type Selection, type Units,
} from "./model";

// ── public types ────────────────────────────────────────────────────────────
export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Hit {
  kind: string;
  id: string;
  sub?: number;
  /** the raw data-hit value */
  raw: string;
}

/** Build a data-hit value. */
export function hitOf(kind: string, id: string, sub?: number): string {
  return sub == null ? `${kind}:${id}` : `${kind}:${id}:${sub}`;
}
/** Parse a data-hit value ("kind:id[:sub]"); ids may contain dots but no colons. */
export function parseHit(raw: string | null | undefined): Hit | null {
  if (!raw) return null;
  const i = raw.indexOf(":");
  if (i <= 0) return null;
  const kind = raw.slice(0, i);
  let rest = raw.slice(i + 1);
  let sub: number | undefined;
  const j = rest.lastIndexOf(":");
  if (j > 0 && /^\d+$/.test(rest.slice(j + 1))) {
    sub = Number(rest.slice(j + 1));
    rest = rest.slice(0, j);
  }
  if (!rest) return null;
  return sub == null ? { kind, id: rest, raw } : { kind, id: rest, sub, raw };
}

export interface CanvasPointerEvent {
  hit: Hit | null;
  /** pointer position in plan units (unrounded) */
  plan: Pt2;
  client: Pt2;
  event: PointerEvent | MouseEvent | KeyboardEvent;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  button: number;
  pointerType: string;
}
export interface CanvasDragEvent extends CanvasPointerEvent {
  /** where the pointer went down (plan units) */
  start: Pt2;
  /** plan delta since the press, unsnapped */
  delta: Pt2;
  /** snapper for this frame (grid + room edges; disabled while Alt is held) */
  snap: Snapper;
}
export interface DragHandler {
  /** CSS cursor while dragging (default "move") */
  cursor?: string;
  onMove(ev: CanvasDragEvent): void;
  onEnd(ev: CanvasDragEvent): void;
  /** pointercancel / a second finger: the canvas has already restored the doc to its pre-drag state */
  onCancel?(): void;
}
export interface Guide {
  axis: "x" | "y";
  v: number;
}
export interface Snapper {
  enabled: boolean;
  x(v: number): number;
  y(v: number): number;
  point(p: Pt2): Pt2;
  /** edge guides produced by x()/y() (the canvas draws them after onMove) */
  guides: Guide[];
}
export interface SnapOptions {
  /** room ids whose edges are NOT snap targets (the room being dragged) */
  exclude?: Iterable<string>;
  grid?: number;
  edgeTol?: number;
  /** override the toolbar toggle (Alt held -> false) */
  enabled?: boolean;
}
export interface Tooltip {
  x: number;
  y: number;
  text: string;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayerContext {
  canvas: JvPlanCanvas;
  store: EditorStore;
  doc: EditorDoc;
  floor: FloorKey;
  floorDef: Floor | undefined;
  rooms: readonly Room[];
  units: Units;
  hass?: Hass;
  selection: Selection | null;
  /** the active sub-tab */
  mode: EditorTab;
  viewBox: ViewBox;
  /** CSS px per plan unit at the current zoom (sizes that must stay constant on screen divide by it) */
  pxPerUnit: number;
  hover: Hit | null;
  focus: Hit | null;
  snapEnabled: boolean;
  /** "is-selected is-hover is-focus" for a data-hit value */
  classes(hit: string): string;
  isSelected(kind: string, id: string, sub?: number): boolean;
}

export interface Layer {
  /** unique; a registered layer replaces a built-in one with the same id ("rooms") */
  id: string;
  /** stacking order, bottom to top: grid 1, background 2, ghost 3, property 4, rooms 5, openings 6, cameras 7, pins 8, overlay 9 */
  order: number;
  /** hit kinds this layer owns (default [id]); "*" also receives background events (hit === null) */
  hits?: string[];
  /** CSS adopted by the canvas for this layer's elements (tokens only) */
  styles?: CSSResult;
  render(ctx: LayerContext): SVGTemplateResult | typeof nothing;
  /** pointer released without a drag; return true when handled (else the default select applies) */
  onTap?(ev: CanvasPointerEvent, ctx: LayerContext): boolean | void;
  onDoubleClick?(ev: CanvasPointerEvent, ctx: LayerContext): boolean | void;
  /** the pointer moved 4 px after the press: return a handler to own the drag, null to decline (then the canvas pans) */
  onDragStart?(ev: CanvasPointerEvent, ctx: LayerContext): DragHandler | null | void;
  /** right-click / long-press / Shift+F10; return true when handled, else the canvas dispatches "plan-context" */
  onContextMenu?(ev: CanvasPointerEvent, ctx: LayerContext): boolean | void;
  /** keydown while the canvas (or something in it) is focused; return true when handled */
  onKey?(ev: KeyboardEvent, ctx: LayerContext): boolean | void;
}

export const LAYER_ORDER = { grid: 1, background: 2, ghost: 3, property: 4, rooms: 5, openings: 6, cameras: 7, pins: 8, tool: 8.5, overlay: 9 } as const;

/** hit kinds a tap selects when no layer handles it */
export const SELECTABLE_KINDS: ReadonlySet<string> = new Set(["room", "opening", "camera", "pin", "vtx", "prop-vtx"]);

const DRAG_THRESHOLD_PX = 4;
const LONG_PRESS_MS = 500;
const ZOOM_IN = 0.85;
const ZOOM_OUT = 1.18;
const MIN_VB_W = 60;
const MAX_VB_W = 8000;
const SNAP_LS_KEY = "jarvis.editor.snap";

// ── layer registry ──────────────────────────────────────────────────────────
const _registry = new Map<string, Layer>();
const _registryListeners = new Set<() => void>();
function _notifyRegistry(): void {
  for (const fn of _registryListeners) fn();
}
/** Register (or replace, by id) a layer for every canvas. Returns the unregister function. */
export function registerLayer(layer: Layer): () => void {
  _registry.set(layer.id, layer);
  _notifyRegistry();
  return () => {
    if (_registry.get(layer.id) === layer) {
      _registry.delete(layer.id);
      _notifyRegistry();
    }
  };
}
export function registeredLayers(): Layer[] {
  return [..._registry.values()];
}

// ── helpers ─────────────────────────────────────────────────────────────────
export function pathOf(pts: readonly Pt2[]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + " Z";
}
/** Touch-first layout (narrow, or a device without hover): hints say "long-press" instead of "right-click". */
export function isTouchFirst(narrow: boolean): boolean {
  if (narrow) return true;
  try {
    return typeof matchMedia === "function" && matchMedia("(hover: none)").matches;
  } catch {
    return false;
  }
}
const fmt = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1));

interface Gesture {
  pointerId: number;
  startClient: Pt2;
  startPlan: Pt2;
  hit: Hit | null;
  button: number;
  pointerType: string;
  dragging: boolean;
  handler: DragHandler | null;
  pan: boolean;
  panStart: ViewBox;
  consumed: boolean;
  base: EditorDoc | null;
  /** px per plan unit when the gesture started: deltas use it so a layout shift mid-drag cannot throw the object */
  s: number;
}
interface Pinch {
  d0: number;
  vb0: ViewBox;
  midPlan: Pt2;
}

// ── the element ─────────────────────────────────────────────────────────────
@customElement("jv-plan-canvas")
export class JvPlanCanvas extends LitElement {
  @property({ attribute: false }) store?: EditorStore;
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;
  /** extra layers for this canvas only (a transient review overlay, say) */
  @property({ attribute: false }) layers: Layer[] = [];

  @state() private _vb: ViewBox = { x: 0, y: 0, w: 320, h: 150 };
  /** the last auto-fit viewBox: its aspect ratio sizes the narrow canvas (pan / zoom never resize it) */
  @state() private _fitVb: ViewBox | null = null;
  @state() private _hover: Hit | null = null;
  @state() private _focus: Hit | null = null;
  @state() private _live = "";
  @state() private _snap = true;
  @state() private _panning = false;

  /** overlay state layers / tools may set (call requestRender() after changing them) */
  guides: Guide[] = [];
  tooltip: Tooltip | null = null;
  band: Rect | null = null;
  draft: Pt2[] | null = null;
  /** cursor while a tool is active (e.g. "crosshair") */
  cursor: string | null = null;

  @query("svg") private _svg?: SVGSVGElement;

  private _tool: Layer | null = null;
  private _gesture: Gesture | null = null;
  private _pointers = new Map<number, Pt2>();
  private _pinch: Pinch | null = null;
  private _longPress: ReturnType<typeof setTimeout> | null = null;
  private _spaceDown = false;
  private _unsubStore: (() => void) | null = null;
  private _unsubRegistry: (() => void) | null = null;
  private _fittedFloor: FloorKey | null = null;
  private _liveToggle = false;
  private readonly _onWheelBound = (e: WheelEvent) => this._onWheel(e);
  /** handle / vertex / hit-pad sizes depend on the rendered size (pxPerUnit): re-render when the svg is resized */
  private _resizeObs: ResizeObserver | null = null;

  constructor() {
    super();
    try {
      const v = localStorage.getItem(SNAP_LS_KEY);
      if (v === "0") this._snap = false;
    } catch {
      /* storage unavailable */
    }
  }

  static override styles = [
    base,
    css`
      :host {
        display: block;
        position: relative;
        padding: 4px; /* room for the outer focus ring */
        min-width: 0;
      }
      svg {
        display: block;
        width: 100%;
        height: clamp(360px, 65vh, 820px);
        /* the card surface: the text tokens' contrast guarantees hold on it (text-2 on bg-2 is ~3.8:1 in HA light) */
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
        cursor: default;
      }
      /* narrow: as tall as the fitted plan is at this width (a landscape plan gets no empty bands above
         and below it), at least a touch-editable 260 px, at most the old cap; --jv-plan-ratio is the
         auto-fit viewBox's w / h (set on the svg by render) */
      :host([narrow]) svg {
        height: auto;
        aspect-ratio: var(--jv-plan-ratio, 4 / 3);
        min-height: 260px;
        max-height: min(70vh, 520px);
      }
      svg:focus-visible {
        box-shadow: var(--jv-focus-ring);
      }
      svg.panning {
        cursor: grabbing;
      }
      text {
        font-family: var(--jv-font);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }
      [data-hit] {
        outline: none;
        cursor: pointer;
      }
      /* grid */
      .grid-minor {
        fill: none;
        stroke: var(--jv-border);
        stroke-width: 1;
        opacity: 0.35;
        vector-effect: non-scaling-stroke;
      }
      .grid-major {
        fill: none;
        stroke: var(--jv-border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .grid-label {
        fill: var(--jv-text-2);
      }
      /* ghost floor below */
      .ghost {
        fill: none;
        stroke: var(--jv-danger);
        stroke-dasharray: 4 3;
        stroke-width: 1;
        opacity: 0.45;
        vector-effect: non-scaling-stroke;
      }
      .ghost-cap {
        fill: var(--jv-danger-text);
      }
      /* overlay */
      .guide {
        stroke: var(--jv-accent);
        stroke-width: 1;
        stroke-dasharray: 3 3;
        opacity: 0.8;
        vector-effect: non-scaling-stroke;
      }
      .band {
        fill: var(--jv-accent);
        fill-opacity: 0.08;
        stroke: var(--jv-accent);
        stroke-width: 1;
        stroke-dasharray: 4 2;
        vector-effect: non-scaling-stroke;
      }
      .draft {
        fill: var(--jv-accent);
        fill-opacity: 0.06;
        stroke: var(--jv-accent);
        stroke-width: 1.5;
        stroke-dasharray: 4 2;
        vector-effect: non-scaling-stroke;
      }
      .draft-vtx {
        fill: var(--jv-surface);
        stroke: var(--jv-accent);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .draft-close {
        fill: none;
        stroke: var(--jv-ok);
        stroke-width: 1;
        stroke-dasharray: 2 2;
        vector-effect: non-scaling-stroke;
      }
      .tip rect {
        fill: var(--jv-surface);
        stroke: var(--jv-border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .tip text {
        fill: var(--jv-text);
      }
      .plan-label {
        fill: var(--jv-text-2);
      }
      /* the basic rooms layer (replaced by the Rooms tab's layer when it registers) */
      .room .shape {
        fill: var(--jv-accent);
        fill-opacity: 0.06;
        stroke: var(--jv-text-2);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .room.t-bath .shape,
      .room.t-stairs .shape {
        fill: var(--jv-info);
      }
      .room.t-outdoor .shape {
        fill: var(--jv-ok);
        stroke-dasharray: 4 3;
      }
      .room.is-hover .shape {
        fill-opacity: 0.12;
      }
      .room.is-selected .shape {
        stroke: var(--jv-accent);
        stroke-width: 2;
      }
      .room.is-focus .shape,
      .room:focus-visible .shape {
        stroke: var(--jv-focus);
        stroke-width: 2;
      }
      .room .name {
        fill: var(--jv-text);
        text-anchor: middle;
        dominant-baseline: middle;
        font-weight: var(--jv-font-weight-medium);
      }
      .room .dims {
        fill: var(--jv-text-2);
        text-anchor: middle;
        dominant-baseline: middle;
      }
    `,
  ];

  // ── lifecycle ─────────────────────────────────────────────────────────
  override connectedCallback(): void {
    super.connectedCallback();
    this._unsubRegistry = (() => {
      const fn = () => this.requestUpdate();
      _registryListeners.add(fn);
      return () => _registryListeners.delete(fn);
    })();
    window.addEventListener("keydown", this._onWindowKey);
    window.addEventListener("keyup", this._onWindowKey);
    if (this.store) this._bindStore(this.store);
    if (this.hasUpdated) this._observeSize();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubRegistry?.();
    this._unsubRegistry = null;
    window.removeEventListener("keydown", this._onWindowKey);
    window.removeEventListener("keyup", this._onWindowKey);
    this._svg?.removeEventListener("wheel", this._onWheelBound);
    this._resizeObs?.disconnect();
    this._resizeObs = null;
    this._unsubStore?.();
    this._unsubStore = null;
    if (this.store && this.store.canvas === this) this.store.canvas = null;
    this._clearLongPress();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("store") && this.store && this.isConnected) this._bindStore(this.store);
  }

  protected override firstUpdated(): void {
    this._svg?.addEventListener("wheel", this._onWheelBound, { passive: false });
    this._observeSize();
    this._autoFit();
  }

  private _observeSize(): void {
    if (this._resizeObs || !this._svg || typeof ResizeObserver !== "function") return;
    this._resizeObs = new ResizeObserver(() => this.requestUpdate());
    this._resizeObs.observe(this._svg);
  }

  private _bindStore(store: EditorStore): void {
    this._unsubStore?.();
    this._unsubStore = store.subscribe(() => {
      this._autoFit();
      this.requestUpdate();
    });
    store.canvas = this;
    this._autoFit();
  }

  /** Fit once per floor (first load and every floor change); the user's zoom is kept otherwise. */
  private _autoFit(): void {
    const s = this.store;
    if (!s || !s.loaded) return;
    if (this._fittedFloor !== s.floor) {
      this._fittedFloor = s.floor;
      this.fit();
    }
  }

  // ── public API for layers and the editor ──────────────────────────────
  get viewBox(): ViewBox {
    return this._vb;
  }
  get snap(): boolean {
    return this._snap;
  }
  setSnap(on: boolean): void {
    this._snap = on;
    try {
      localStorage.setItem(SNAP_LS_KEY, on ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }
  get tool(): Layer | null {
    return this._tool;
  }
  /** Activate a transient top-priority layer (draw rectangle / polygon ...); null ends it. */
  setTool(tool: Layer | null): void {
    this._tool = tool;
    this.cursor = tool ? this.cursor : null;
    if (!tool) {
      this.band = null;
      this.draft = null;
    }
    this.requestUpdate();
  }
  requestRender(): void {
    this.requestUpdate();
  }
  /** Polite screen-reader announcement. */
  announce(text: string): void {
    this._liveToggle = !this._liveToggle;
    this._live = text + (this._liveToggle ? "​" : "");
  }
  /** Focus the canvas itself (e.g. after the focused object was removed, so focus does not fall to <body>). */
  focusSurface(): void {
    try {
      this._svg?.focus({ preventScroll: true });
    } catch {
      /* focus is a nicety */
    }
  }
  /** Move DOM focus to the element with this data-hit (after the next render). */
  async focusHit(raw: string): Promise<void> {
    await this.updateComplete;
    const sel = `[data-hit="${raw.replace(/"/g, '\\"')}"]`;
    // the focusable element, not the invisible touch pad drawn under a handle with the same data-hit
    const el = this._svg?.querySelector<SVGGraphicsElement>(`${sel}[tabindex]`) ?? this._svg?.querySelector<SVGGraphicsElement>(sel);
    el?.focus?.();
  }

  /** Client -> plan coordinates (unrounded). */
  toPlan(clientX: number, clientY: number): Pt2 {
    const m = this._metrics();
    return [this._vb.x + (clientX - m.left - m.ox) / m.s, this._vb.y + (clientY - m.top - m.oy) / m.s];
  }
  /** CSS px per plan unit at the current zoom. */
  get pxPerUnit(): number {
    return this._metrics().s;
  }
  /**
   * The plan rectangle the svg actually shows: the viewBox plus the bands `meet` letterboxes around it
   * when the element's shape differs from the viewBox's (the viewBox itself before layout).
   */
  get visibleBox(): ViewBox {
    const vb = this._vb;
    const m = this._metrics();
    if (!m.W || !m.H) return vb;
    return { x: vb.x - m.ox / m.s, y: vb.y - m.oy / m.s, w: m.W / m.s, h: m.H / m.s };
  }
  /** The auto-fit viewBox (fit()), null before the first fit; the narrow canvas takes its aspect ratio. */
  get fittedViewBox(): ViewBox | null {
    return this._fitVb;
  }

  /** The auto viewBox: content bbox padded by max(120, 25 %) with a 200 x 140 minimum. */
  fit(): void {
    const s = this.store;
    let bb: BBox | null = s ? contentBBox(s.doc, s.floor) : null;
    if (!bb) bb = { ...EMPTY_FLOOR_BOX };
    const w0 = bb.x1 - bb.x0, h0 = bb.y1 - bb.y0;
    const pad = Math.max(120, 0.25 * Math.max(w0, h0));
    let x = bb.x0 - pad, y = bb.y0 - pad, w = w0 + 2 * pad, h = h0 + 2 * pad;
    if (w < 200) {
      x -= (200 - w) / 2;
      w = 200;
    }
    if (h < 140) {
      y -= (140 - h) / 2;
      h = 140;
    }
    this._vb = { x, y, w, h };
    this._fitVb = { x, y, w, h };
  }

  /** Zoom by `factor` (< 1 in) about a client point (default: the centre). */
  zoomBy(factor: number, aboutClient?: Pt2): void {
    const vb = this._vb;
    const w = Math.min(MAX_VB_W, Math.max(MIN_VB_W, vb.w * factor));
    const f = w / vb.w;
    const h = vb.h * f;
    if (!aboutClient) {
      this._vb = { x: vb.x + (vb.w - w) / 2, y: vb.y + (vb.h - h) / 2, w, h };
      return;
    }
    const plan = this.toPlan(aboutClient[0], aboutClient[1]);
    const m = this._metrics({ x: 0, y: 0, w, h });
    this._vb = { x: plan[0] - (aboutClient[0] - m.left - m.ox) / m.s, y: plan[1] - (aboutClient[1] - m.top - m.oy) / m.s, w, h };
  }
  /** Pan by CSS pixels. */
  panBy(dxPx: number, dyPx: number): void {
    const s = this._metrics().s;
    this._vb = { ...this._vb, x: this._vb.x - dxPx / s, y: this._vb.y - dyPx / s };
  }

  /** A snapper for this gesture: 5 u grid + other rooms' edges within 3 u (edge hits produce guides). */
  snapper(opts: SnapOptions = {}): Snapper {
    const enabled = opts.enabled ?? this._snap;
    const grid = opts.grid ?? SNAP_GRID;
    const tol = opts.edgeTol ?? SNAP_EDGE_TOL;
    const exclude = new Set(opts.exclude ?? []);
    const xs: number[] = [], ys: number[] = [];
    if (enabled && this.store) {
      for (const r of this.store.rooms()) {
        if (exclude.has(r.id)) continue;
        for (const p of roomPoints(r)) {
          xs.push(p[0]);
          ys.push(p[1]);
        }
      }
    }
    const guides: Guide[] = [];
    const one = (v: number, cands: number[], axis: "x" | "y"): number => {
      if (!enabled) return Math.round(v);
      let best = Math.round(v / grid) * grid;
      let bd = Math.abs(v - best);
      let edge = false;
      for (const c of cands) {
        const d = Math.abs(v - c);
        if (d <= tol && d < bd) {
          best = c;
          bd = d;
          edge = true;
        }
      }
      if (edge && !guides.some((g) => g.axis === axis && g.v === best)) guides.push({ axis, v: best });
      return best;
    };
    return {
      enabled,
      guides,
      x: (v) => one(v, xs, "x"),
      y: (v) => one(v, ys, "y"),
      point: (p) => [one(p[0], xs, "x"), one(p[1], ys, "y")],
    };
  }

  /** The context passed to layers (also handy for the editor's inspector). */
  context(): LayerContext {
    const store = this.store as EditorStore;
    const doc = store?.doc ?? { floors: [], openings: {}, cameras: {}, pins: {}, property: { points: [] } };
    const floor = store?.floor ?? "1f";
    const selection = store?.selection ?? null;
    const hover = this._hover, focus = this._focus;
    const selRaw = selection ? hitOf(selection.kind, selection.id, selection.sub) : null;
    return {
      canvas: this,
      store,
      doc,
      floor,
      floorDef: floorOf(doc, floor),
      rooms: floorOf(doc, floor)?.rooms || [],
      units: store?.settings.units ?? "imperial",
      hass: this.hass,
      selection,
      mode: store?.tab ?? "rooms",
      viewBox: this._vb,
      pxPerUnit: this.pxPerUnit,
      hover,
      focus,
      snapEnabled: this._snap,
      classes: (hit) => [hit === selRaw ? "is-selected" : "", hit === hover?.raw ? "is-hover" : "", hit === focus?.raw ? "is-focus" : ""].filter(Boolean).join(" "),
      isSelected: (kind, id, sub) => !!selection && selection.kind === kind && selection.id === id && (sub == null || selection.sub === sub),
    };
  }

  // ── rendering ─────────────────────────────────────────────────────────
  private _allLayers(): Layer[] {
    const map = new Map<string, Layer>();
    for (const l of BUILTIN_LAYERS) map.set(l.id, l);
    if (!_registry.has("rooms")) map.set("rooms", basicRoomsLayer);
    for (const l of _registry.values()) map.set(l.id, l);
    for (const l of this.layers) map.set(l.id, l);
    if (this._tool) map.set(`tool:${this._tool.id}`, this._tool);
    return [...map.values()].sort((a, b) => a.order - b.order);
  }
  /** top-most first, filtered to those that own `hit` (or "*") */
  private _handlersFor(hit: Hit | null): Layer[] {
    const list = this._allLayers().reverse();
    return list.filter((l) => {
      const hits = l.hits ?? [l.id];
      return hits.includes("*") || (hit != null && hits.includes(hit.kind));
    });
  }

  override render() {
    const vb = this._vb;
    const layers = this._allLayers();
    const ctx = this.context();
    const cursor = this._panning ? "grabbing" : this._gesture?.handler?.cursor || this.cursor || "";
    const fitted = this._fitVb;
    const style = [cursor ? `cursor:${cursor}` : "", fitted ? `--jv-plan-ratio:${(fitted.w / fitted.h).toFixed(4)}` : ""].filter(Boolean).join(";");
    return html`
      ${layers.map((l) => (l.styles ? html`<style>${l.styles.cssText}</style>` : nothing))}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class=${this._panning ? "panning" : ""}
        viewBox="${fmt(vb.x)} ${fmt(vb.y)} ${fmt(vb.w)} ${fmt(vb.h)}"
        preserveAspectRatio="xMidYMid meet"
        tabindex="0"
        role="application"
        aria-label=${t("Floor plan canvas")}
        aria-describedby="instructions"
        style=${style}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerCancel}
        @lostpointercapture=${this._onLostCapture}
        @pointerover=${this._onPointerOver}
        @pointerout=${this._onPointerOut}
        @dblclick=${this._onDblClick}
        @contextmenu=${this._onContextMenu}
        @keydown=${this._onKeyDown}
        @focusin=${this._onFocusIn}
        @focusout=${this._onFocusOut}
      >
        ${layers.map((l) => svg`<g data-layer=${l.id}>${this._renderLayer(l, ctx)}</g>`)}
      </svg>
      <p id="instructions" class="visually-hidden">
        ${t("Drag a room to move it, its corner handle to resize. Right-click or long-press for more. Arrow keys nudge the selection, Delete removes it, R draws a room, P a polygon, 0 fits the view, Ctrl+Z undoes.")}
        ${t("Without a pointer: press R then Enter, or use Place Room, to add a room at the centre of the view; arrow keys on a focused corner handle resize it, Enter on an edge midpoint adds a corner.")}
      </p>
      <div class="visually-hidden" aria-live="polite" aria-atomic="true">${this._live}</div>
    `;
  }

  private _renderLayer(l: Layer, ctx: LayerContext) {
    try {
      return l.render(ctx);
    } catch (err) {
      console.warn(`[jv-plan-canvas] layer "${l.id}" failed to render`, err);
      return nothing;
    }
  }

  // ── geometry of the element ───────────────────────────────────────────
  private _metrics(vb: ViewBox = this._vb): { left: number; top: number; s: number; ox: number; oy: number; W: number; H: number } {
    let r: DOMRect | undefined;
    try {
      r = this._svg?.getBoundingClientRect();
    } catch {
      r = undefined;
    }
    const left = r?.left || 0, top = r?.top || 0, W = r?.width || 0, H = r?.height || 0;
    if (!W || !H || !vb.w || !vb.h) return { left, top, s: 1, ox: 0, oy: 0, W, H };
    const s = Math.min(W / vb.w, H / vb.h);
    return { left, top, s, ox: (W - vb.w * s) / 2, oy: (H - vb.h * s) / 2, W, H };
  }

  private _hitFrom(target: EventTarget | null): Hit | null {
    const el = target instanceof Element ? target.closest<Element>("[data-hit]") : null;
    return parseHit(el?.getAttribute("data-hit"));
  }

  private _pev(e: PointerEvent | MouseEvent | KeyboardEvent, hit: Hit | null, plan: Pt2, client: Pt2): CanvasPointerEvent {
    const pe = e as PointerEvent;
    return {
      hit,
      plan,
      client,
      event: e,
      shiftKey: !!e.shiftKey,
      altKey: !!e.altKey,
      ctrlKey: !!e.ctrlKey,
      metaKey: !!e.metaKey,
      button: typeof (e as MouseEvent).button === "number" ? (e as MouseEvent).button : 0,
      pointerType: typeof pe.pointerType === "string" ? pe.pointerType : "mouse",
    };
  }

  // ── pointer controller ────────────────────────────────────────────────
  private _onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;
    this._pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (this._pointers.size === 2) {
      // a second finger cancels any object drag and starts a pinch
      if (this._gesture) this._cancelGesture();
      this._startPinch();
      return;
    }
    if (this._pointers.size > 2 || this._pinch) return;
    const plan = this.toPlan(e.clientX, e.clientY);
    const hit = this._hitFrom(e.target);
    this._gesture = {
      pointerId: e.pointerId,
      startClient: [e.clientX, e.clientY],
      startPlan: plan,
      hit,
      button: e.button,
      pointerType: e.pointerType,
      dragging: false,
      handler: null,
      pan: false,
      panStart: this._vb,
      consumed: false,
      base: null,
      s: this._metrics().s,
    };
    try {
      this._svg?.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
    this._clearLongPress();
    if (e.pointerType !== "mouse") {
      this._longPress = setTimeout(() => {
        const g = this._gesture;
        if (!g || g.dragging) return;
        g.consumed = true;
        this._contextMenuAt(this._pev(e, g.hit, g.startPlan, g.startClient));
      }, LONG_PRESS_MS);
    }
  }

  private _onPointerMove(e: PointerEvent): void {
    if (this._pointers.has(e.pointerId)) this._pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (this._pinch) {
      this._movePinch();
      return;
    }
    const g = this._gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    // the long-press opened the context menu: the finger drifting while it lifts must not drag the object behind it
    if (g.consumed) return;
    const client: Pt2 = [e.clientX, e.clientY];
    if (!g.dragging) {
      if (Math.hypot(client[0] - g.startClient[0], client[1] - g.startClient[1]) < DRAG_THRESHOLD_PX) return;
      this._clearLongPress();
      g.dragging = true;
      const ctx = this.context();
      const ev = this._pev(e, g.hit, g.startPlan, g.startClient);
      if (!this._spaceDown && g.button !== 1) {
        for (const l of this._handlersFor(g.hit)) {
          const h = l.onDragStart?.(ev, ctx);
          if (h) {
            g.handler = h;
            g.base = cloneDoc(ctx.doc);
            break;
          }
        }
      }
      if (!g.handler) {
        g.pan = true;
        g.panStart = this._vb;
        this._panning = true;
      }
    }
    if (g.pan) {
      this._vb = { ...g.panStart, x: g.panStart.x - (client[0] - g.startClient[0]) / g.s, y: g.panStart.y - (client[1] - g.startClient[1]) / g.s };
      return;
    }
    if (g.handler) {
      const ev = this._dragEvent(e, g, client);
      g.handler.onMove(ev);
      this.guides = ev.snap.guides;
      this.requestUpdate();
    }
  }

  private _dragEvent(e: PointerEvent, g: Gesture, client: Pt2): CanvasDragEvent {
    // plan position from the CLIENT delta at the gesture's start scale: the page may reflow during a
    // drag (the dirty badge appears, the header wraps) and a re-derived position would jump with it
    const plan: Pt2 = [g.startPlan[0] + (client[0] - g.startClient[0]) / g.s, g.startPlan[1] + (client[1] - g.startClient[1]) / g.s];
    const exclude = g.hit && (g.hit.kind === "room" || g.hit.kind === "vtx" || g.hit.kind === "handle" || g.hit.kind === "mid") ? [g.hit.id] : [];
    return {
      ...this._pev(e, g.hit, plan, client),
      start: g.startPlan,
      delta: [plan[0] - g.startPlan[0], plan[1] - g.startPlan[1]],
      snap: this.snapper({ exclude, enabled: this._snap && !e.altKey }),
    };
  }

  private _onPointerUp(e: PointerEvent): void {
    this._pointers.delete(e.pointerId);
    if (this._pinch) {
      if (this._pointers.size < 2) this._pinch = null;
      return;
    }
    const g = this._gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    this._clearLongPress();
    this._gesture = null;
    this._panning = false;
    try {
      this._svg?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (g.dragging) {
      if (g.handler) {
        const ev = this._dragEvent(e, g, [e.clientX, e.clientY]);
        try {
          g.handler.onEnd(ev);
        } finally {
          this.guides = [];
          this.tooltip = null;
        }
      }
      this.requestUpdate();
      return;
    }
    if (g.consumed) return;
    this._tap(this._pev(e, g.hit, this.toPlan(e.clientX, e.clientY), [e.clientX, e.clientY]));
  }

  private _onPointerCancel(e: PointerEvent): void {
    this._pointers.delete(e.pointerId);
    if (this._pinch && this._pointers.size < 2) this._pinch = null;
    if (this._gesture && e.pointerId === this._gesture.pointerId) this._cancelGesture();
  }

  private _onLostCapture(e: PointerEvent): void {
    if (this._gesture && e.pointerId === this._gesture.pointerId) this._cancelGesture();
  }

  /** Abort the current gesture: restore the doc to its pre-drag state and tell the handler. */
  private _cancelGesture(): void {
    const g = this._gesture;
    this._gesture = null;
    this._panning = false;
    this._clearLongPress();
    if (!g) return;
    if (g.dragging && g.handler) {
      const base = g.base;
      if (base && this.store) this.store.change("", (d) => Object.assign(d, cloneDoc(base)), { transient: true });
      try {
        g.handler.onCancel?.();
      } catch {
        /* ignore */
      }
    }
    this.guides = [];
    this.tooltip = null;
    this.requestUpdate();
  }

  private _tap(ev: CanvasPointerEvent): void {
    const ctx = this.context();
    for (const l of this._handlersFor(ev.hit)) {
      if (l.onTap?.(ev, ctx)) return;
    }
    const store = this.store;
    if (!store) return;
    if (ev.hit && SELECTABLE_KINDS.has(ev.hit.kind)) {
      store.select({ kind: ev.hit.kind, id: ev.hit.id, sub: ev.hit.sub });
      this._announceSelection();
    } else if (!ev.hit && !this._tool) {
      store.select(null);
      this.announce(t("Nothing selected"));
    }
  }

  private _startPinch(): void {
    const [a, b] = [...this._pointers.values()];
    if (!a || !b) return;
    const mid: Pt2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    this._pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, vb0: this._vb, midPlan: this.toPlan(mid[0], mid[1]) };
  }

  private _movePinch(): void {
    const p = this._pinch;
    const [a, b] = [...this._pointers.values()];
    if (!p || !a || !b) return;
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    const mid: Pt2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const w = Math.min(MAX_VB_W, Math.max(MIN_VB_W, (p.vb0.w * p.d0) / d));
    const h = p.vb0.h * (w / p.vb0.w);
    const m = this._metrics({ x: 0, y: 0, w, h });
    this._vb = { x: p.midPlan[0] - (mid[0] - m.left - m.ox) / m.s, y: p.midPlan[1] - (mid[1] - m.top - m.oy) / m.s, w, h };
  }

  private _onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (e.shiftKey && !e.ctrlKey) {
      this.panBy(-(e.deltaY || e.deltaX), 0);
      return;
    }
    // a sideways trackpad swipe / tilt wheel (deltaY 0 or mostly horizontal) pans; only a vertical delta zooms
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.panBy(-e.deltaX, 0);
      return;
    }
    if (!e.deltaY) return;
    const zoomIn = e.deltaY < 0;
    this.zoomBy(zoomIn ? ZOOM_IN : ZOOM_OUT, [e.clientX, e.clientY]);
  }

  private _onPointerOver(e: PointerEvent): void {
    const hit = this._hitFrom(e.target);
    if (hit?.raw !== this._hover?.raw) this._hover = hit;
  }
  private _onPointerOut(e: PointerEvent): void {
    const hit = this._hitFrom(e.target);
    if (hit && hit.raw === this._hover?.raw) this._hover = null;
  }
  private _onFocusIn(e: FocusEvent): void {
    this._focus = this._hitFrom(e.target);
  }
  private _onFocusOut(): void {
    this._focus = null;
  }

  private _onDblClick(e: MouseEvent): void {
    const hit = this._hitFrom(e.target);
    const ev = this._pev(e, hit, this.toPlan(e.clientX, e.clientY), [e.clientX, e.clientY]);
    const ctx = this.context();
    for (const l of this._handlersFor(hit)) if (l.onDoubleClick?.(ev, ctx)) return;
  }

  private _onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    const hit = this._hitFrom(e.target);
    this._contextMenuAt(this._pev(e, hit, this.toPlan(e.clientX, e.clientY), [e.clientX, e.clientY]));
  }

  /** Route a context request to the layers; unhandled -> "plan-context" event {detail: CanvasPointerEvent}. */
  private _contextMenuAt(ev: CanvasPointerEvent): void {
    const ctx = this.context();
    for (const l of this._handlersFor(ev.hit)) if (l.onContextMenu?.(ev, ctx)) return;
    this.dispatchEvent(new CustomEvent<CanvasPointerEvent>("plan-context", { detail: ev, bubbles: true, composed: true }));
  }

  // ── keyboard ──────────────────────────────────────────────────────────
  private readonly _onWindowKey = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.key === " ") this._spaceDown = e.type === "keydown";
  };

  private _onKeyDown(e: KeyboardEvent): void {
    const ctx = this.context();
    const store = this.store;
    for (const l of [...(this._tool ? [this._tool] : []), ...this._allLayers().reverse()]) {
      if (l.onKey?.(e, ctx)) {
        e.preventDefault();
        return;
      }
    }
    if (e.ctrlKey || e.metaKey) return; // the editor owns the shortcuts
    const focusHit = this._hitFrom(e.target);
    switch (e.key) {
      case "Enter":
      case " ":
        if (focusHit && SELECTABLE_KINDS.has(focusHit.kind) && store) {
          store.select({ kind: focusHit.kind, id: focusHit.id, sub: focusHit.sub });
          this._announceSelection();
          e.preventDefault();
        }
        return;
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown": {
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (store?.selection) {
          if (store.nudgeSelection(dx, dy)) this._announceSelection();
        } else {
          this._vb = { ...this._vb, x: this._vb.x + (dx * this._vb.w) / 10, y: this._vb.y + (dy * this._vb.h) / 10 };
        }
        e.preventDefault();
        return;
      }
      case "Delete":
      case "Backspace": {
        if (!store?.selection) return;
        const desc = store.describeSelection();
        const label = store.removeSelection();
        if (label) {
          const name = desc?.name || label;
          store.toast(t("Removed {name}", { name }), { label: t("Undo"), run: () => store.undo() });
          this.announce(t("Removed {name}", { name }));
          // the focused object is about to leave the DOM: keep focus on the canvas instead of <body>
          if (focusHit) this.focusSurface();
        }
        e.preventDefault();
        return;
      }
      case "Escape":
        if (this._tool) this.setTool(null);
        else store?.select(null);
        e.preventDefault();
        return;
      case "+":
      case "=":
        this.zoomBy(ZOOM_IN);
        e.preventDefault();
        return;
      case "-":
      case "_":
        this.zoomBy(ZOOM_OUT);
        e.preventDefault();
        return;
      case "0":
        this.fit();
        e.preventDefault();
        return;
      case "F10":
      case "ContextMenu":
        if (e.key === "ContextMenu" || e.shiftKey) {
          const vb = this._vb;
          const m = this._metrics();
          const plan: Pt2 = [vb.x + vb.w / 2, vb.y + vb.h / 2];
          this._contextMenuAt(this._pev(e, focusHit, plan, [m.left + m.W / 2, m.top + m.H / 2]));
          e.preventDefault();
        }
        return;
      default:
        return;
    }
  }

  private _announceSelection(): void {
    const s = this.store;
    const d = s?.describeSelection();
    if (!s || !d) {
      this.announce(t("Nothing selected"));
      return;
    }
    const u = s.settings.units;
    this.announce(d.w != null && d.h != null ? t("{name} selected · {w} × {h}", { name: d.name, w: dim(d.w, u), h: dim(d.h, u) }) : t("{name} selected", { name: d.name }));
  }

  private _clearLongPress(): void {
    if (this._longPress) clearTimeout(this._longPress);
    this._longPress = null;
  }
}

// ── built-in layers ─────────────────────────────────────────────────────────
function labelStep(vbWidth: number): number {
  let step = GRID_MAJOR;
  while (vbWidth / step > 16) step *= 2;
  return step;
}

export const gridLayer: Layer = {
  id: "grid",
  order: LAYER_ORDER.grid,
  hits: [],
  render(ctx) {
    // label spacing and size follow the zoom (the viewBox); the grid covers everything the svg shows,
    // including the bands `meet` leaves when the canvas and the plan differ in shape
    const step = labelStep(ctx.viewBox.w);
    const fs = Math.max(3, ctx.viewBox.w / 150);
    const vb = ctx.canvas.visibleBox;
    const labels: SVGTemplateResult[] = [];
    const x0 = Math.ceil(vb.x / step) * step, y0 = Math.ceil(vb.y / step) * step;
    for (let x = x0; x <= vb.x + vb.w; x += step) labels.push(svg`<text class="grid-label" x=${x + fs * 0.3} y=${vb.y + fs * 1.2} font-size=${fs}>${x}</text>`);
    for (let y = y0; y <= vb.y + vb.h; y += step) if (y !== y0 || x0 !== vb.x) labels.push(svg`<text class="grid-label" x=${vb.x + fs * 0.3} y=${y - fs * 0.3} font-size=${fs}>${y}</text>`);
    return svg`
      <defs>
        <pattern id="jvpc-minor" width=${GRID_MINOR} height=${GRID_MINOR} patternUnits="userSpaceOnUse">
          <path class="grid-minor" d="M ${GRID_MINOR} 0 L 0 0 0 ${GRID_MINOR}"></path>
        </pattern>
        <pattern id="jvpc-major" width=${GRID_MAJOR} height=${GRID_MAJOR} patternUnits="userSpaceOnUse">
          <rect width=${GRID_MAJOR} height=${GRID_MAJOR} fill="url(#jvpc-minor)"></rect>
          <path class="grid-major" d="M ${GRID_MAJOR} 0 L 0 0 0 ${GRID_MAJOR}"></path>
        </pattern>
      </defs>
      <rect x=${vb.x} y=${vb.y} width=${vb.w} height=${vb.h} fill="url(#jvpc-major)" pointer-events="none"></rect>
      ${labels}
    `;
  },
};

export const backgroundLayer: Layer = {
  id: "background",
  order: LAYER_ORDER.background,
  hits: [],
  render(ctx) {
    const href = ctx.store?.settings.bg[ctx.floor];
    if (!href) return nothing;
    let bb: BBox | null = null;
    for (const r of ctx.rooms) bb = unionBBox(bb, bboxOfPoints(roomPoints(r)));
    if (!bb) bb = EMPTY_FLOOR_BOX;
    return svg`<image href=${href} x=${bb.x0} y=${bb.y0} width=${bb.x1 - bb.x0} height=${bb.y1 - bb.y0} opacity=${ctx.store.settings.bgOpacity} preserveAspectRatio="xMidYMid meet" pointer-events="none"></image>`;
  },
};

export const ghostLayer: Layer = {
  id: "ghost",
  order: LAYER_ORDER.ghost,
  hits: [],
  render(ctx) {
    const below = floorBelow(ctx.floor);
    const rooms = below ? (floorOf(ctx.doc, below)?.rooms || []).filter((r) => r.type !== "outdoor") : [];
    if (!below || !rooms.length) return nothing;
    let bb: BBox | null = null;
    for (const r of rooms) bb = unionBBox(bb, bboxOfPoints(roomPoints(r)));
    return svg`
      ${rooms.map((r) => svg`<path class="ghost" d=${pathOf(roomPoints(r))}></path>`)}
      <text class="ghost-cap" x=${(bb?.x0 ?? 0) + 2} y=${(bb?.y0 ?? 0) - 2} font-size="4">${t("↓ {floor} below (stay within)", { floor: t(ctx.store.floorLabel(below)) })}</text>
    `;
  },
};

export const overlayLayer: Layer = {
  id: "overlay",
  order: LAYER_ORDER.overlay,
  hits: [],
  render(ctx) {
    const c = ctx.canvas, vb = ctx.viewBox;
    const parts: SVGTemplateResult[] = [];
    for (const g of c.guides) {
      parts.push(
        g.axis === "x"
          ? svg`<line class="guide" x1=${g.v} y1=${vb.y} x2=${g.v} y2=${vb.y + vb.h}></line>`
          : svg`<line class="guide" x1=${vb.x} y1=${g.v} x2=${vb.x + vb.w} y2=${g.v}></line>`,
      );
    }
    if (c.band) parts.push(svg`<rect class="band" x=${c.band.x} y=${c.band.y} width=${c.band.w} height=${c.band.h} pointer-events="none"></rect>`);
    if (c.draft && c.draft.length) {
      const d = c.draft.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
      parts.push(svg`<path class="draft" d=${d} pointer-events="none"></path>`);
      parts.push(svg`<circle class="draft-close" cx=${c.draft[0][0]} cy=${c.draft[0][1]} r="6" pointer-events="none"></circle>`);
      for (const p of c.draft) parts.push(svg`<circle class="draft-vtx" cx=${p[0]} cy=${p[1]} r="2" pointer-events="none"></circle>`);
    }
    if (c.tooltip) {
      const fs = Math.max(3.5, vb.w / 90);
      const w = c.tooltip.text.length * fs * 0.6 + fs;
      parts.push(svg`
        <g class="tip" pointer-events="none">
          <rect x=${c.tooltip.x - w / 2} y=${c.tooltip.y - fs * 1.6} width=${w} height=${fs * 1.8} rx=${fs * 0.3}></rect>
          <text x=${c.tooltip.x} y=${c.tooltip.y - fs * 0.35} font-size=${fs} text-anchor="middle">${c.tooltip.text}</text>
        </g>
      `);
    }
    return parts.length ? svg`${parts}` : nothing;
  },
};

function typeClass(type: string): string {
  return /^[a-z]+$/.test(type) ? type : "room";
}

/**
 * The basic rooms layer: outlines, names, dimension captions, tap to select,
 * drag to move (Rooms tab) with snapping and a measurement tooltip. It is
 * used only until a layer with id "rooms" is registered (the Rooms tab's) and
 * doubles as the reference implementation of the Layer / DragHandler API.
 */
export const basicRoomsLayer: Layer = {
  id: "rooms",
  order: LAYER_ORDER.rooms,
  hits: ["room"],
  render(ctx) {
    const u = ctx.units;
    const labels = ctx.floorDef?.labels || [];
    return svg`
      ${repeat(
        ctx.rooms,
        (r) => r.id,
        (r) => {
          const hit = hitOf("room", r.id);
          const fs = r.w > 80 ? 7 : r.w > 50 ? 5.5 : r.w > 25 ? 4 : 3;
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          const typeLabel = t(ROOM_TYPE_LABEL[r.type] || r.type);
          return svg`
            <g data-hit=${hit} tabindex="0" role="button" class="room t-${typeClass(r.type)} ${ctx.classes(hit)}"
               aria-label=${`${r.name || t("Room")}, ${typeLabel}, ${dim(r.w, u)} × ${dim(r.h, u)}`}>
              <path class="shape" d=${pathOf(roomPoints(r))}></path>
              <text class="name" x=${cx} y=${cy} font-size=${fs}>${r.name}</text>
              ${r.w > 30 && r.h > 24 ? svg`<text class="dims" x=${cx} y=${cy + fs * 1.15} font-size=${fs * 0.62}>${dim(r.w, u)} × ${dim(r.h, u)}</text>` : nothing}
            </g>
          `;
        },
      )}
      ${labels.map((l) => svg`<text class="plan-label" x=${l.x} y=${l.y} font-size="4" text-anchor="middle">${l.text}</text>`)}
    `;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "rooms" || !ev.hit || ev.hit.kind !== "room") return null;
    const id = ev.hit.id;
    const found = findRoom(ctx.doc, id);
    if (!found) return null;
    const orig = { x: found.room.x, y: found.room.y, w: found.room.w, h: found.room.h };
    const name = found.room.name || t("Room");
    ctx.store.select({ kind: "room", id });
    const u = ctx.units;
    const place = (nx: number, ny: number, transient: boolean) =>
      ctx.store.change(t("Move {name}", { name }), (d) => {
        const r = findRoom(d, id)?.room;
        if (!r) return;
        const dx = nx - r.x, dy = ny - r.y;
        if (r.points) {
          r.points = r.points.map((p): Pt2 => [Math.round((p[0] + dx) * 10) / 10, Math.round((p[1] + dy) * 10) / 10]);
          r.x = nx;
          r.y = ny;
        } else {
          r.x = nx;
          r.y = ny;
        }
      }, { transient });
    const snapped = (ev2: CanvasDragEvent): Pt2 => {
      const rx = orig.x + ev2.delta[0], ry = orig.y + ev2.delta[1];
      const s = ev2.snap;
      const guides: Guide[] = [];
      const pick = (v: number, span: number, f: (n: number) => number) => {
        const a = f(v), ga = s.guides.splice(0);
        const b = f(v + span) - span, gb = s.guides.splice(0);
        const useA = Math.abs(a - v) <= Math.abs(b - v);
        guides.push(...(useA ? ga : gb));
        return useA ? a : b;
      };
      const nx = pick(rx, orig.w, s.x), ny = pick(ry, orig.h, s.y);
      s.guides.push(...guides);
      return [nx, ny];
    };
    return {
      cursor: "move",
      onMove: (ev2) => {
        const [nx, ny] = snapped(ev2);
        place(nx, ny, true);
        ctx.canvas.tooltip = { x: nx + orig.w / 2, y: ny - 3, text: `${dim(nx, u)}, ${dim(ny, u)}` };
      },
      onEnd: (ev2) => {
        const [nx, ny] = snapped(ev2);
        place(nx, ny, false);
        ctx.canvas.tooltip = null;
        ctx.canvas.announce(t("{name} moved to {x}, {y}", { name, x: dim(nx, u), y: dim(ny, u) }));
      },
      onCancel: () => {
        ctx.canvas.tooltip = null;
      },
    };
  },
};

const ROOM_TYPE_LABEL: Record<string, string> = { room: "Room", bath: "Bathroom", stairs: "Stairs", door: "Door", outdoor: "Outdoor zone" };

const BUILTIN_LAYERS: readonly Layer[] = [gridLayer, backgroundLayer, ghostLayer, overlayLayer];

declare global {
  interface HTMLElementTagNameMap {
    "jv-plan-canvas": JvPlanCanvas;
  }
  interface HTMLElementEventMap {
    "plan-context": CustomEvent<CanvasPointerEvent>;
  }
}
