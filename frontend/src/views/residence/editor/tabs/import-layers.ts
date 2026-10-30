/**
 * Import tab - the canvas side (frontend/specs/editor.md sections 4.2 layer 2,
 * 5 "Import", 6 I3-I7; section 10 R6 "calibrate image").
 *
 *   background layer   replaces the canvas's built-in one: the floor's image drawn
 *                      over the floor's rooms (as before) OR at a stored alignment
 *                      {x, y, w} in plan units (height from the image's aspect
 *                      ratio), with a live opacity / alignment preview
 *   align tool         drag the image to move it, its corner handle to scale it,
 *                      arrow keys nudge (Shift x10), Enter = done, Esc = cancel
 *   review layer       the rooms detected in a vacuum map (jarvis/segment_floorplan_rooms)
 *                      as a dashed overlay: tap toggles a candidate, dragging moves
 *                      the whole detected layout; nothing is in the doc until added
 *
 * Alignment is stored INSIDE floor_plan_bg under the "_align" key
 * ({"1f": "data:...", "_align": {"1f": {"x": 0, "y": 0, "w": 320}}}): the model's
 * parseBackground keeps only string image values, the backend's
 * floorplan_import.merge_floor_background keeps unknown keys, so old readers are
 * unaffected and a re-imported vacuum map keeps its calibration. It is written
 * one floor at a time (store.writeFloorBackground -> jarvis/set_floor_background).
 */
import { svg, nothing, css } from "lit";
import { t } from "../../../../i18n";
import { isApiPath, signPath } from "../../../../ws";
import type { Hass } from "../../../../types";
import {
  BG_ALIGN_KEY, EMPTY_FLOOR_BOX, asRecord, bboxOfPoints, dim, parseJsonish, r1, ri, roomPoints, unionBBox,
  type BBox, type FloorKey, type Pt2,
} from "../model";
import { registerLayer, hitOf, pathOf, LAYER_ORDER, type CanvasDragEvent, type Layer, type LayerContext } from "../canvas";
import type { EditorStore } from "../store";
import { ensureImageSize, imageSize } from "./import-image";
import { hitPad } from "./rooms-layers";

// ── alignment storage ───────────────────────────────────────────────────────
export const ALIGN_KEY = BG_ALIGN_KEY;
export interface BgAlign {
  /** top-left corner, plan units */
  x: number;
  y: number;
  /** drawn width, plan units (height follows the image's aspect ratio) */
  w: number;
}

function parseOneAlign(v: unknown): BgAlign | null {
  const o = asRecord(v);
  if (!o) return null;
  const x = Number(o.x), y = Number(o.y), w = Number(o.w);
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && w > 0 ? { x, y, w } : null;
}

/** floor -> alignment, from config.floor_plan_bg._align (tolerant). */
export function parseAlign(config: Record<string, unknown>): Record<FloorKey, BgAlign> {
  const rec = asRecord(parseJsonish(config.floor_plan_bg));
  const al = asRecord(rec?.[ALIGN_KEY]);
  const out: Record<FloorKey, BgAlign> = {};
  if (!al) return out;
  for (const k of Object.keys(al)) {
    const a = parseOneAlign(al[k]);
    if (a) out[k] = a;
  }
  return out;
}

/** An alignment as it is stored: 1 decimal (null stays null = remove it). */
export function roundAlign(align: BgAlign | null): BgAlign | null {
  return align ? { x: r1(align.x), y: r1(align.y), w: r1(align.w) } : null;
}

// ── live preview state (per editor store) ───────────────────────────────────
interface Preview {
  /** slider `input` frames before the `change` write */
  opacity?: number;
  /** the align tool's working rectangle; `committing` keeps it drawn until the write lands */
  align?: { floor: FloorKey; value: BgAlign; committing?: boolean };
}
const _preview = new WeakMap<EditorStore, Preview>();
function previewOf(store: EditorStore): Preview {
  let p = _preview.get(store);
  if (!p) {
    p = {};
    _preview.set(store, p);
  }
  return p;
}
export function setOpacityPreview(store: EditorStore, v: number | null): void {
  const p = previewOf(store);
  if (v == null) delete p.opacity;
  else p.opacity = v;
  store.canvas?.requestRender();
}

// signed /api/ backgrounds (the backend writes data: URLs; a hand-edited path still renders).
// A signature lasts 300 s (ws.ts signs with expires=300 and hands the same URL out for 240 s):
// re-ask signPath every 30 s so a re-mounted <image> / <img> never gets an expired authSig,
// and only ever render a SIGNED URL (signPath returns the raw path when signing fails).
const SIGN_RECHECK_MS = 30_000;
/** older than this the URL may be past its 300 s expiry: render nothing until re-signed */
const SIGN_MAX_AGE_MS = 270_000;
const _signed = new Map<string, { url: string; at: number }>();
const _signing = new Set<string>();
/** The URL to draw a background with: data: / http(s) as-is, an /api/ path signed (null while signing or unsigned). */
export function resolveBackgroundHref(href: string, hass: Hass | undefined, rerender: () => void): string | null {
  return resolveHref(href, hass, rerender);
}
function resolveHref(href: string, hass: Hass | undefined, rerender: () => void): string | null {
  if (!isApiPath(href)) return href;
  const hit = _signed.get(href);
  const now = Date.now();
  if (hass && (!hit || now - hit.at >= SIGN_RECHECK_MS) && !_signing.has(href)) {
    _signing.add(href);
    void signPath(hass, href).then((url) => {
      _signing.delete(href);
      if (!/[?&]authSig=/.test(url)) return;
      const prev = _signed.get(href);
      // keep the first-seen time of an unchanged URL (ws.ts re-signs only after 240 s): its age is the signature's age
      _signed.set(href, prev && prev.url === url ? prev : { url, at: Date.now() });
      if (!prev || prev.url !== url) rerender();
    });
  }
  return hit && now - hit.at < SIGN_MAX_AGE_MS ? hit.url : null;
}

/** Where the image is drawn by default: over the floor's rooms (or the empty-floor box), letterboxed. */
export function defaultBgBox(rooms: LayerContext["rooms"]): BBox {
  let bb: BBox | null = null;
  for (const r of rooms) bb = unionBBox(bb, bboxOfPoints(roomPoints(r)));
  return bb ?? EMPTY_FLOOR_BOX;
}

/** The rectangle the image actually occupies with the default placement (preserveAspectRatio meet). */
export function defaultAlign(rooms: LayerContext["rooms"], size: { w: number; h: number }): BgAlign {
  const bb = defaultBgBox(rooms);
  const bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0;
  const k = Math.min(bw / size.w, bh / size.h);
  const w = size.w * k, h = size.h * k;
  return { x: bb.x0 + (bw - w) / 2, y: bb.y0 + (bh - h) / 2, w };
}

/** The effective alignment of `floor` (preview > stored > default), null while the image size is unknown. */
export function effectiveAlign(store: EditorStore, floor: FloorKey): BgAlign | null {
  const href = store.settings.bg[floor];
  if (!href) return null;
  const size = imageSize(href);
  if (!size) return null;
  const p = livePreview(store);
  if (p && p.floor === floor) return p.value;
  return parseAlign(store.config)[floor] ?? defaultAlign(store.rooms(floor), size);
}

/** The preview rectangle while the align tool is active or its write is in flight. */
function livePreview(store: EditorStore): Preview["align"] | null {
  const a = previewOf(store).align;
  return a && (a.committing || store.canvas?.tool?.id === "bg-align") ? a : null;
}

export const calibratedBackgroundLayer: Layer = {
  id: "background",
  order: LAYER_ORDER.background,
  hits: [],
  styles: css`
    .bg-frame {
      fill: none;
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      stroke-dasharray: 6 4;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
  `,
  render(ctx) {
    const store = ctx.store;
    const raw = store?.settings.bg[ctx.floor];
    if (!raw) return nothing;
    const href = resolveHref(raw, ctx.hass, () => ctx.canvas.requestRender());
    if (!href) return nothing;
    const prev = previewOf(store);
    const opacity = prev.opacity ?? store.settings.bgOpacity;
    const size = imageSize(raw);
    // keyed by the stored value (what imageSize() is asked with), loaded from the drawable URL
    if (size === undefined) void ensureImageSize(raw, href).then(() => ctx.canvas.requestRender());
    const live = livePreview(store);
    const align = live && live.floor === ctx.floor ? live.value : parseAlign(store.config)[ctx.floor];
    if (align && size) {
      const h = (align.w * size.h) / size.w;
      return svg`<image href=${href} x=${align.x} y=${align.y} width=${align.w} height=${h} opacity=${opacity} preserveAspectRatio="none" pointer-events="none"></image>`;
    }
    const bb = defaultBgBox(ctx.rooms);
    return svg`<image href=${href} x=${bb.x0} y=${bb.y0} width=${bb.x1 - bb.x0} height=${bb.y1 - bb.y0} opacity=${opacity} preserveAspectRatio="xMidYMid meet" pointer-events="none"></image>`;
  },
};

// ── the align tool ──────────────────────────────────────────────────────────
const _alignListeners = new Set<() => void>();
function notifyAlign(): void {
  for (const fn of _alignListeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
export function onAlignChange(fn: () => void): () => void {
  _alignListeners.add(fn);
  return () => {
    _alignListeners.delete(fn);
  };
}
export function aligning(store: EditorStore | undefined): boolean {
  return store?.canvas?.tool?.id === "bg-align";
}
/** The align tool's working rectangle (null when the tool is not active). */
export function alignDraft(store: EditorStore): BgAlign | null {
  return aligning(store) ? previewOf(store).align?.value ?? null : null;
}

/** Start dragging the background into place; `commit(value)` saves it (Done / Enter). */
export function startAlignTool(store: EditorStore, commit: (floor: FloorKey, value: BgAlign) => void): boolean {
  const canvas = store.canvas;
  const floor = store.floor;
  const href = store.settings.bg[floor];
  const size = href ? imageSize(href) : null;
  const start = effectiveAlign(store, floor);
  if (!canvas || !href || !size || !start) return false;
  const p = previewOf(store);
  p.align = { floor, value: { ...start } };
  const aspect = size.h / size.w;
  const set = (v: BgAlign) => {
    p.align = { floor, value: { x: r1(v.x), y: r1(v.y), w: Math.max(5, r1(v.w)) } };
    canvas.requestRender();
    notifyAlign();
  };
  const current = (): BgAlign => p.align?.value ?? start;
  const u = () => store.settings.units;
  const tool: Layer = {
    id: "bg-align",
    order: LAYER_ORDER.tool,
    hits: ["*"],
    render(ctx) {
      const a = current();
      const h = a.w * aspect;
      const hs = Math.max(3, 11 / Math.max(ctx.pxPerUnit, 0.01));
      const hh = hitOf("bg-handle", "bg");
      return svg`
        <rect class="bg-frame" x=${a.x} y=${a.y} width=${a.w} height=${h}></rect>
        ${hitPad(hh, a.x + a.w, a.y + h, ctx.pxPerUnit)}
        <rect class="handle ${ctx.classes(hh)}" data-hit=${hh} tabindex="0" role="button" aria-label=${t("Scale the background image")}
              x=${a.x + a.w - hs / 2} y=${a.y + h - hs / 2} width=${hs} height=${hs}></rect>
      `;
    },
    onTap: () => true,
    onDragStart(ev) {
      // (no button check: onDragStart gets the pointermove, whose `button` is -1; the canvas already routes only primary / touch drags here)
      const a0 = { ...current() };
      const h0 = a0.w * aspect;
      if (ev.hit?.kind === "bg-handle") {
        return {
          cursor: "nwse-resize",
          onMove(e: CanvasDragEvent) {
            // scale about the top-left corner, keeping the aspect ratio; the larger axis drives it
            const wx = a0.w + e.delta[0];
            const wy = (h0 + e.delta[1]) / aspect;
            const w = Math.abs(wx - a0.w) >= Math.abs(wy - a0.w) ? wx : wy;
            set({ ...a0, w });
            canvas.tooltip = { x: a0.x + current().w / 2, y: a0.y - 3, text: `${dim(current().w, u())} × ${dim(current().w * aspect, u())}` };
          },
          onEnd() {
            canvas.tooltip = null;
          },
          onCancel() {
            set(a0);
          },
        };
      }
      const [px, py] = ev.plan;
      if (px < a0.x || py < a0.y || px > a0.x + a0.w || py > a0.y + h0) return null; // outside the image: pan
      return {
        cursor: "move",
        onMove(e: CanvasDragEvent) {
          const x = e.snap.enabled ? e.snap.x(a0.x + e.delta[0]) : a0.x + e.delta[0];
          const y = e.snap.enabled ? e.snap.y(a0.y + e.delta[1]) : a0.y + e.delta[1];
          set({ ...a0, x, y });
          canvas.tooltip = { x: x + a0.w / 2, y: y - 3, text: `${dim(x, u())}, ${dim(y, u())}` };
        },
        onEnd() {
          canvas.tooltip = null;
        },
        onCancel() {
          set(a0);
        },
      };
    },
    onKey(e) {
      const a = current();
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case "ArrowLeft":
          set({ ...a, x: a.x - step });
          return true;
        case "ArrowRight":
          set({ ...a, x: a.x + step });
          return true;
        case "ArrowUp":
          set({ ...a, y: a.y - step });
          return true;
        case "ArrowDown":
          set({ ...a, y: a.y + step });
          return true;
        case "PageUp":
          set({ ...a, w: a.w * (e.shiftKey ? 1.1 : 1.01) });
          return true;
        case "PageDown":
          set({ ...a, w: a.w / (e.shiftKey ? 1.1 : 1.01) });
          return true;
        case "Enter":
          finishAlignTool(store, commit);
          return true;
        case "Escape":
          cancelAlignTool(store);
          return true;
        default:
          return false;
      }
    },
  };
  _commit = commit;
  canvas.setTool(tool);
  canvas.announce(t("Drag the image to move it, its corner handle to scale it. Arrow keys nudge, Page Up / Page Down scale, Enter finishes, Escape cancels."));
  notifyAlign();
  return true;
}
let _commit: ((floor: FloorKey, value: BgAlign) => void) | null = null;

/** Commit the working rectangle (Done). */
export function finishAlignTool(store: EditorStore, commit?: (floor: FloorKey, value: BgAlign) => void): void {
  const p = previewOf(store);
  const draft = p.align;
  if (draft) draft.committing = true;
  if (store.canvas?.tool?.id === "bg-align") store.canvas.setTool(null);
  const fn = commit ?? _commit;
  _commit = null;
  if (draft && fn) fn(draft.floor, draft.value);
  notifyAlign();
}
/** Drop the working rectangle (keeps the preview until the write lands, see clearAlignPreview). */
export function cancelAlignTool(store: EditorStore): void {
  if (store.canvas?.tool?.id === "bg-align") store.canvas.setTool(null);
  _commit = null;
  delete previewOf(store).align;
  store.canvas?.requestRender();
  notifyAlign();
}
/** Forget the preview rectangle (after the write landed or failed). */
export function clearAlignPreview(store: EditorStore): void {
  delete previewOf(store).align;
  store.canvas?.requestRender();
}

// ── detected-rooms review ───────────────────────────────────────────────────
export interface Candidate {
  key: string;
  name: string;
  type: string;
  points: Pt2[];
  checked: boolean;
}
export interface Review {
  floor: FloorKey;
  entity: string;
  candidates: Candidate[];
  /** offset applied to every candidate (the user drags the detected layout into place) */
  dx: number;
  dy: number;
}
const _reviews = new WeakMap<EditorStore, Review>();
const _reviewListeners = new Set<() => void>();
function notifyReview(): void {
  for (const fn of _reviewListeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
export function onReviewChange(fn: () => void): () => void {
  _reviewListeners.add(fn);
  return () => {
    _reviewListeners.delete(fn);
  };
}
export function reviewOf(store: EditorStore | undefined): Review | null {
  return (store && _reviews.get(store)) || null;
}
export function setReview(store: EditorStore, review: Review | null): void {
  if (review) _reviews.set(store, review);
  else _reviews.delete(store);
  store.canvas?.requestRender();
  notifyReview();
}
export function updateReview(store: EditorStore, patch: (r: Review) => void): void {
  const r = _reviews.get(store);
  if (!r) return;
  patch(r);
  store.canvas?.requestRender();
  notifyReview();
}
/** A candidate's points with the review offset applied (1 decimal). */
export function placedPoints(r: Review, c: Candidate): Pt2[] {
  return c.points.map((p): Pt2 => [r1(p[0] + r.dx), r1(p[1] + r.dy)]);
}

/**
 * Where a fresh detection lands: its top-left on the floor's enclosed rooms'
 * top-left (when there are rooms) so it overlays the plan it will replace,
 * else where the backend put it.
 */
export function initialOffset(store: EditorStore, floor: FloorKey, cands: readonly Candidate[]): [number, number] {
  const bb = bboxOfPoints(cands.flatMap((c) => c.points));
  let target: BBox | null = null;
  for (const r of store.rooms(floor)) if (r.type !== "outdoor") target = unionBBox(target, bboxOfPoints(roomPoints(r)));
  if (!bb || !target) return [0, 0];
  return [ri(target.x0 - bb.x0), ri(target.y0 - bb.y0)];
}

export const reviewLayer: Layer = {
  id: "import-review",
  order: LAYER_ORDER.pins + 0.3,
  hits: ["cand"],
  styles: css`
    .cand .shape {
      fill: var(--jv-info);
      fill-opacity: 0.12;
      stroke: var(--jv-info);
      stroke-width: 1.5;
      stroke-dasharray: 5 3;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .cand.off .shape {
      fill-opacity: 0.02;
      stroke: var(--jv-text-3);
    }
    .cand.is-hover .shape {
      fill-opacity: 0.2;
    }
    .cand.is-focus .shape,
    .cand:focus-visible .shape {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .cand .cand-name {
      fill: var(--jv-info-text);
      text-anchor: middle;
      dominant-baseline: middle;
      font-weight: var(--jv-font-weight-medium);
    }
    .cand.off .cand-name {
      fill: var(--jv-text-2);
      text-decoration: line-through;
    }
  `,
  render(ctx) {
    const r = reviewOf(ctx.store);
    if (!r || ctx.mode !== "import" || r.floor !== ctx.floor) return nothing;
    return svg`${r.candidates.map((c) => {
      const pts = placedPoints(r, c);
      const bb = bboxOfPoints(pts)!;
      const hit = hitOf("cand", c.key);
      const w = bb.x1 - bb.x0;
      const fs = w > 80 ? 6 : w > 40 ? 4.5 : 3;
      return svg`
        <g data-hit=${hit} tabindex="0" role="button" class="cand ${c.checked ? "" : "off"} ${ctx.classes(hit)}"
           aria-pressed=${String(c.checked)} aria-label=${t("Detected room {name}", { name: c.name })}>
          <path class="shape" d=${pathOf(pts)}></path>
          <text class="cand-name" x=${(bb.x0 + bb.x1) / 2} y=${(bb.y0 + bb.y1) / 2} font-size=${fs}>${c.name}</text>
        </g>`;
    })}`;
  },
  onTap(ev, ctx) {
    if (ev.hit?.kind !== "cand" || ctx.mode !== "import") return false;
    const key = ev.hit.id;
    updateReview(ctx.store, (r) => {
      const c = r.candidates.find((x) => x.key === key);
      if (c) c.checked = !c.checked;
    });
    return true;
  },
  onDragStart(ev, ctx) {
    const r = reviewOf(ctx.store);
    if (!r || ev.hit?.kind !== "cand" || ctx.mode !== "import") return null;
    const bb = bboxOfPoints(r.candidates.flatMap((c) => c.points));
    if (!bb) return null;
    const d0: Pt2 = [r.dx, r.dy];
    const u = ctx.units;
    const move = (e: CanvasDragEvent) => {
      // snap the layout's top-left corner (grid / room edges), then derive the offset
      const x0 = bb.x0 + d0[0] + e.delta[0], y0 = bb.y0 + d0[1] + e.delta[1];
      const sx = e.snap.enabled ? e.snap.x(x0) : r1(x0);
      const sy = e.snap.enabled ? e.snap.y(y0) : r1(y0);
      updateReview(ctx.store, (rv) => {
        rv.dx = r1(sx - bb.x0);
        rv.dy = r1(sy - bb.y0);
      });
      ctx.canvas.tooltip = { x: sx + (bb.x1 - bb.x0) / 2, y: sy - 3, text: `${dim(sx, u)}, ${dim(sy, u)}` };
    };
    return {
      cursor: "move",
      onMove: move,
      onEnd(e) {
        move(e);
        ctx.canvas.tooltip = null;
        ctx.canvas.announce(t("Detected layout moved"));
      },
      onCancel() {
        updateReview(ctx.store, (rv) => {
          rv.dx = d0[0];
          rv.dy = d0[1];
        });
        ctx.canvas.tooltip = null;
      },
    };
  },
  onKey(e, ctx) {
    const f = ctx.focus;
    if (!f || f.kind !== "cand" || ctx.mode !== "import" || e.ctrlKey || e.metaKey || e.altKey) return false;
    const step = e.shiftKey ? 10 : 1;
    const move = (dx: number, dy: number) => {
      updateReview(ctx.store, (r) => {
        r.dx = r1(r.dx + dx);
        r.dy = r1(r.dy + dy);
      });
      return true;
    };
    switch (e.key) {
      case "ArrowLeft":
        return move(-step, 0);
      case "ArrowRight":
        return move(step, 0);
      case "ArrowUp":
        return move(0, -step);
      case "ArrowDown":
        return move(0, step);
      case "Enter":
      case " ":
        updateReview(ctx.store, (r) => {
          const c = r.candidates.find((x) => x.key === f.id);
          if (c) c.checked = !c.checked;
        });
        return true;
      default:
        return false;
    }
  },
};

registerLayer(calibratedBackgroundLayer);
registerLayer(reviewLayer);
