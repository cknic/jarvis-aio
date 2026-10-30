/**
 * <jarvis-editor-pins> - the Cameras & pins tab of the floor-plan editor, plus
 * the "cameras" and "pins" canvas layers (editor.md sections 2.6, 2.7, 3.6,
 * 3.8, 4.2 #7-8, 5 "Cameras & pins", 6 C1-C9).
 *
 * Cameras layer: per camera the line-of-sight cone (clipped by the floor's
 * walls for indoor cameras, bleeding through window / door gaps; the raw
 * sector for outdoor ones), a focusable dot with its CAM n label and - for the
 * selected camera in this tab - an aim knob at the end of the cone: drag it to
 * set the direction and the range (arrow keys on the focused knob rotate it).
 * The dot drags (snapped) in this tab; right-click / long-press offers
 * Toggle indoor/outdoor and Delete; on the background, Add camera here.
 *
 * Pins layer: one dot per pinned entity coloured by its live state
 * (pinState(hass.states) -> badge level token), its name above and its value
 * below. A tap on an already selected pin (or Enter on it) opens HA's
 * more-info dialog; pins drag in this tab; right-click: Open controls, Remove.
 *
 * Tab: + Camera, Compute coverage for this floor (sequential
 * jarvis/compute_camera_coverage calls, progress, per-camera inline errors),
 * the camera list (CAM n, entity, aim / FOV / range summary, signed still,
 * geometric "sees:" line, the AI line from the stored coverage, and for the
 * selected camera the full form: Camera, Aim, Field of view, Range,
 * INDOOR / OUTDOOR, Compute coverage, Delete), then Devices on plan: an
 * entity picker + Add (validated: known id, not already on this floor) and
 * one chip per pin with its live badge, Open controls and Remove.
 */
import { html, css, svg, nothing, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { watchDefinitions } from "../../../../ha";
import { ws, WsError, signPath } from "../../../../ws";
import { keepRowFocus, type RowFocus } from "../../../../focus";
import "../../../../components";
import "../../../../components/jv-picker";
import type { PickerChangeDetail } from "../../../../components/jv-picker";
import { JarvisEditorTab } from "../tab-base";
import { registerLayer, hitOf, LAYER_ORDER, type Layer, type LayerContext, type CanvasDragEvent, type DragHandler } from "../canvas";
import type { EditorStore } from "../store";
import { COVERAGE_FULL, clippedCone, coverage, coverageContext, planGeometry } from "../geometry";
import {
  cameraCandidates, clamp, dim, entityExists, findCamera, findPin, floorBBox, friendlyName, fromReal, listFor, newStoredId, pinState, ri, toReal, unitLabel,
  type CameraCoverage, type CameraPin, type EditorDoc, type EntityPin, type FloorKey, type Pt2,
} from "../model";
import { showPlanMenu } from "./rooms-menu";
import {
  HA_FORM_TAGS, annexStyles, attrQuote, canvasHover, floorCentre, glowId, icon, numberField, onCanvasHover, rangeField, relativeTime, reportCanvasHover, revealRow, selectField, setGlow,
} from "./openings-doors-pins-shared";

// ── shared helpers ──────────────────────────────────────────────────────────
const CMD = "jarvis/compute_camera_coverage";
const BADGE_LEVELS = new Set(["ok", "warn", "danger", "info", "neutral", "accent"]);
const norm360 = (a: number): number => ((Math.round(a) % 360) + 360) % 360;
const trunc = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}…` : s);
/** A camera's Remove / Delete hands keyboard focus to the next / previous camera's Remove, else + Camera. */
const CAMERA_FOCUS: RowFocus = { row: ".rows > .row", key: "data-key", control: "[data-remove]", fallback: [".toolbar .jv-btn"] };
/** A pin's Remove hands keyboard focus to the next / previous pin's Remove, else the add picker. */
const PIN_FOCUS: RowFocus = { row: ".chips > .chip", key: "data-key", control: "[data-remove]", fallback: [".add-pin jv-picker"] };

/** "CAM 2" - the 1-based index of the camera on its floor. */
function camLabel(doc: EditorDoc, floor: FloorKey, id: string): string {
  const i = (doc.cameras[floor] || []).findIndex((c) => c.id === id);
  return t("CAM {n}", { n: i >= 0 ? i + 1 : "?" });
}

/** Open HA's more-info dialog for an entity. */
function moreInfo(target: EventTarget, entityId: string): void {
  target.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
}

/** Add a camera (section 3.6 defaults) at `at` or the centre of the floor's rooms; selects it. */
function addCamera(store: EditorStore, at?: Pt2): string | null {
  const floor = store.floor;
  const [x, y] = at ? [ri(at[0]), ri(at[1])] : floorCentre(floorBBox(store.rooms(floor)));
  let id = "";
  store.change(t("Add camera"), (d) => {
    id = newStoredId("c", Object.values(d.cameras).flat().map((c) => c.id));
    listFor(d.cameras, floor).push({ id, x, y, angle: 270, fov: 90, range: 55, entity: "", indoor: true, extra: {} });
  });
  if (!id) return null;
  store.select({ kind: "camera", id });
  store.canvas?.announce(t("{name} selected", { name: camLabel(store.doc, floor, id) }));
  return id;
}

function removeCamera(store: EditorStore, id: string): void {
  const label = store.changeWith((d) => {
    const hit = findCamera(d, id);
    if (!hit) return null;
    const name = hit.camera.entity ? friendlyName(store.hass, hit.camera.entity) : camLabel(d, hit.floor, id);
    d.cameras[hit.floor].splice(hit.index, 1);
    return t("Removed {name}", { name });
  });
  if (!label) return;
  setGlow(null, store);
  store.toast(label, { label: t("Undo"), run: () => store.undo() });
  store.canvas?.announce(label);
}

function toggleIndoor(store: EditorStore, id: string): void {
  store.change(t("Toggle indoor/outdoor"), (d) => {
    const c = findCamera(d, id)?.camera;
    if (c) c.indoor = !c.indoor;
  });
}

function removePin(store: EditorStore, e: string, floor: FloorKey): void {
  const name = friendlyName(store.hass, e);
  const label = store.changeWith((d) => {
    const hit = findPin(d, e, floor);
    if (!hit) return null;
    d.pins[hit.floor].splice(hit.index, 1);
    return t("Removed {name}", { name });
  });
  if (!label) return;
  setGlow(null, store);
  store.toast(label, { label: t("Undo"), run: () => store.undo() });
  store.canvas?.announce(label);
}

/** The stored coverage dict from a compute_camera_coverage result (null when the shape is unusable). */
function parseCoverage(raw: unknown): CameraCoverage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.covered)) return null;
  return {
    covered: r.covered.filter((x): x is string => typeof x === "string"),
    reason: typeof r.reason === "string" ? r.reason : "",
    source: typeof r.source === "string" ? r.source : "geometry",
    ts: typeof r.ts === "number" && Number.isFinite(r.ts) ? r.ts : Math.round(Date.now() / 1000),
  };
}

/** Constant on-screen size (CSS px) expressed in plan units, clamped. */
const px = (ctx: LayerContext, v: number, lo: number, hi: number): number => clamp(v / (ctx.pxPerUnit || 1), lo, hi);

/** Drag a camera dot or a pin (snapped to the grid / room edges, integer coordinates). */
function dragPoint(ctx: LayerContext, orig: Pt2, name: string, write: (d: EditorDoc, p: Pt2) => void): DragHandler {
  const u = ctx.units;
  const label = t("Move {name}", { name });
  const at = (ev: CanvasDragEvent): Pt2 => {
    const p = ev.snap.point([orig[0] + ev.delta[0], orig[1] + ev.delta[1]]);
    return [ri(p[0]), ri(p[1])];
  };
  const place = (p: Pt2, transient: boolean) => ctx.store.change(label, (d) => write(d, p), { transient });
  return {
    cursor: "grabbing",
    onMove: (ev) => {
      const p = at(ev);
      place(p, true);
      ctx.canvas.tooltip = { x: p[0], y: p[1] - px(ctx, 14, 4, 14), text: `${dim(p[0], u)}, ${dim(p[1], u)}` };
    },
    onEnd: (ev) => {
      const p = at(ev);
      place(p, false);
      ctx.canvas.tooltip = null;
      ctx.canvas.announce(t("{name} moved to {x}, {y}", { name, x: dim(p[0], u), y: dim(p[1], u) }));
    },
    onCancel: () => {
      ctx.canvas.tooltip = null;
    },
  };
}

/** Drag the aim knob: direction = pointer bearing (5 degree steps while snapping), range = distance. */
function dragAim(ctx: LayerContext, id: string): DragHandler | null {
  const found = findCamera(ctx.doc, id);
  if (!found) return null;
  const cx = found.camera.x, cy = found.camera.y;
  const name = camLabel(ctx.doc, found.floor, id);
  const label = t("Aim {name}", { name });
  const u = ctx.units;
  const aimAt = (ev: CanvasDragEvent): { angle: number; range: number } => {
    const dx = ev.plan[0] - cx, dy = ev.plan[1] - cy;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angle = ev.snap.enabled ? norm360(Math.round(deg / 5) * 5) : norm360(deg);
    return { angle, range: Math.max(5, ri(Math.hypot(dx, dy))) };
  };
  const apply = (a: { angle: number; range: number }, transient: boolean) =>
    ctx.store.change(
      label,
      (d) => {
        const c = findCamera(d, id)?.camera;
        if (!c) return;
        c.angle = a.angle;
        c.range = a.range;
      },
      { transient },
    );
  ctx.store.select({ kind: "camera", id });
  return {
    cursor: "crosshair",
    onMove: (ev) => {
      const a = aimAt(ev);
      apply(a, true);
      ctx.canvas.tooltip = { x: ev.plan[0], y: ev.plan[1] - px(ctx, 14, 4, 14), text: `${a.angle}° · ${dim(a.range, u)}` };
    },
    onEnd: (ev) => {
      const a = aimAt(ev);
      apply(a, false);
      ctx.canvas.tooltip = null;
      ctx.canvas.announce(t("{name} aimed at {angle}°, range {range}", { name, angle: a.angle, range: dim(a.range, u) }));
    },
    onCancel: () => {
      ctx.canvas.tooltip = null;
    },
  };
}

const layerText = css`
  .cam-label,
  .pin-name,
  .pin-val {
    text-anchor: middle;
    paint-order: stroke;
    /* the canvas backdrop (jv-plan-canvas paints the svg with --jv-surface) */
    stroke: var(--jv-surface);
    stroke-linejoin: round;
  }
  .hitarea {
    fill: transparent;
    stroke: none;
  }
`;

// ── the cameras layer ───────────────────────────────────────────────────────
export const camerasLayer: Layer = {
  id: "cameras",
  order: LAYER_ORDER.cameras,
  // "*" for the background context menu ("Add camera here") in this tab
  hits: ["camera", "cam-aim", "*"],
  styles: css`
    ${layerText}
    .cone {
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .cone.indoor {
      fill: var(--jv-danger-soft);
      stroke: var(--jv-danger);
    }
    .cone.outdoor {
      fill: var(--jv-warn-soft);
      stroke: var(--jv-warn);
      stroke-dasharray: 4 3;
    }
    .cone.is-selected,
    .cone.is-glow {
      stroke-width: 2;
    }
    .cam .dot {
      fill: var(--jv-danger);
      stroke: var(--jv-surface);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .cam.outdoor .dot {
      fill: var(--jv-warn);
    }
    .cam.is-hover .dot,
    .cam.is-glow .dot {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .cam.is-selected .dot {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .cam.is-focus .dot,
    .cam:focus-visible .dot {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .cam .cam-label {
      fill: var(--jv-text);
      font-weight: var(--jv-font-weight-medium);
    }
    .aim-line {
      stroke: var(--jv-accent);
      stroke-width: 1;
      stroke-dasharray: 3 2;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .cam-aim .knob {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .cam-aim.is-hover .knob {
      fill: var(--jv-accent-soft);
    }
    .cam-aim.is-focus .knob,
    .cam-aim:focus-visible .knob {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .cam-aim {
      cursor: crosshair;
    }
  `,
  render(ctx) {
    reportCanvasHover(ctx.hover);
    const cams = ctx.doc.cameras[ctx.floor] || [];
    if (!cams.length) return nothing;
    const geo = planGeometry(ctx.rooms, ctx.doc.openings[ctx.floor] || []);
    const r = px(ctx, 7, 2.5, 7);
    const hitR = px(ctx, 14, r, 18);
    const fs = px(ctx, 11, 3, 12);
    const glow = glowId();
    const editable = ctx.mode === "pins";
    return svg`${repeat(
      cams,
      (c) => c.id,
      (c, i) => {
        const hit = hitOf("camera", c.id);
        const selected = ctx.isSelected("camera", c.id);
        const env = c.indoor ? "indoor" : "outdoor";
        const glowing = glow === c.id ? "is-glow" : "";
        const name = t("CAM {n}", { n: i + 1 });
        const who = c.entity ? friendlyName(ctx.hass, c.entity) : t("— camera —");
        let aim: TemplateResult | typeof nothing = nothing;
        if (selected && editable) {
          const a = (c.angle * Math.PI) / 180;
          const rng = Math.max(5, c.range);
          const kx = c.x + rng * Math.cos(a), ky = c.y + rng * Math.sin(a);
          const ahit = hitOf("cam-aim", c.id);
          aim = svg`
            <line class="aim-line" x1=${c.x} y1=${c.y} x2=${kx} y2=${ky}></line>
            <g data-hit=${ahit} tabindex="0" role="slider" class="cam-aim ${ctx.classes(ahit)}"
               aria-label=${t("Aim {name}", { name })} aria-valuemin="0" aria-valuemax="359" aria-valuenow=${Math.round(c.angle)}
               aria-valuetext=${`${Math.round(c.angle)}° · ${dim(rng, ctx.units)}`}>
              <circle class="hitarea" cx=${kx} cy=${ky} r=${hitR}></circle>
              <circle class="knob" cx=${kx} cy=${ky} r=${r * 0.85}></circle>
            </g>
          `;
        }
        return svg`
          <path class="cone ${env} ${selected ? "is-selected" : ""} ${glowing}" d=${clippedCone(c, geo)}></path>
          <g data-hit=${hit} tabindex="0" role="button" class="cam ${env} ${ctx.classes(hit)} ${glowing}"
             aria-label=${`${name}, ${who}, ${c.indoor ? t("INDOOR") : t("OUTDOOR")}, ${Math.round(c.angle)}°, ${t("Field of view")} ${c.fov}°, ${t("Range")} ${dim(c.range, ctx.units)}`}>
            <circle class="hitarea" cx=${c.x} cy=${c.y} r=${hitR}></circle>
            <circle class="dot" cx=${c.x} cy=${c.y} r=${r}></circle>
            <text class="cam-label" x=${c.x} y=${c.y - r - fs * 0.35} font-size=${fs} stroke-width=${fs * 0.28}>${name}</text>
          </g>
          ${aim}
        `;
      },
    )}`;
  },
  onTap(ev, ctx) {
    if (ev.hit?.kind !== "cam-aim") return false;
    ctx.store.select({ kind: "camera", id: ev.hit.id });
    return true;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "pins" || ctx.canvas.tool || !ev.hit) return null;
    if (ev.hit.kind === "cam-aim") return dragAim(ctx, ev.hit.id);
    if (ev.hit.kind !== "camera") return null;
    const id = ev.hit.id;
    const found = findCamera(ctx.doc, id);
    if (!found) return null;
    ctx.store.select({ kind: "camera", id });
    return dragPoint(ctx, [found.camera.x, found.camera.y], camLabel(ctx.doc, found.floor, id), (d, p) => {
      const c = findCamera(d, id)?.camera;
      if (!c) return;
      c.x = p[0];
      c.y = p[1];
    });
  },
  onContextMenu(ev, ctx) {
    if (ctx.mode !== "pins" || ctx.canvas.tool) return false;
    const store = ctx.store;
    const hit = ev.hit;
    if (!hit) {
      showPlanMenu({ at: ev.client, label: t("Plan"), items: [{ label: t("Add camera here"), icon: "mdi:cctv", run: () => void addCamera(store, ev.plan) }] });
      return true;
    }
    if (hit.kind !== "camera" && hit.kind !== "cam-aim") return false;
    const id = hit.id;
    const found = findCamera(ctx.doc, id);
    if (!found) return false;
    store.select({ kind: "camera", id });
    showPlanMenu({
      at: ev.client,
      label: camLabel(ctx.doc, found.floor, id),
      items: [
        { label: t("Toggle indoor/outdoor"), icon: "mdi:home-switch-outline", run: () => toggleIndoor(store, id) },
        { label: t("Delete"), icon: "mdi:delete-outline", danger: true, run: () => removeCamera(store, id) },
      ],
    });
    return true;
  },
  onKey(e, ctx) {
    const f = ctx.focus;
    if (!f || f.kind !== "cam-aim" || e.ctrlKey || e.metaKey || e.altKey) return false;
    const step = e.shiftKey ? 15 : 5;
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? step : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -step : 0;
    if (!delta) return false;
    const found = findCamera(ctx.doc, f.id);
    if (!found) return false;
    const name = camLabel(ctx.doc, found.floor, f.id);
    const next = norm360(found.camera.angle + delta);
    ctx.store.change(
      t("Aim {name}", { name }),
      (d) => {
        const c = findCamera(d, f.id)?.camera;
        if (c) c.angle = next;
      },
      { coalesce: `aim:${f.id}` },
    );
    ctx.canvas.announce(`${next}°`);
    return true;
  },
};
registerLayer(camerasLayer);

// ── the pins layer ──────────────────────────────────────────────────────────
export const pinsLayer: Layer = {
  id: "pins",
  order: LAYER_ORDER.pins,
  hits: ["pin"],
  styles: css`
    ${layerText}
    .pin .dot {
      fill: var(--jv-neutral);
      stroke: var(--jv-surface);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .pin.lvl-ok .dot {
      fill: var(--jv-ok);
    }
    .pin.lvl-warn .dot {
      fill: var(--jv-warn);
    }
    .pin.lvl-danger .dot {
      fill: var(--jv-danger);
    }
    .pin.lvl-info .dot {
      fill: var(--jv-info);
    }
    .pin.lvl-accent .dot {
      fill: var(--jv-accent);
    }
    .pin .pin-name {
      fill: var(--jv-text);
      font-weight: var(--jv-font-weight-medium);
    }
    .pin .pin-val {
      fill: var(--jv-text-2);
    }
    .pin.lvl-ok .pin-val {
      fill: var(--jv-ok-text);
    }
    .pin.lvl-warn .pin-val {
      fill: var(--jv-warn-text);
    }
    .pin.lvl-danger .pin-val {
      fill: var(--jv-danger-text);
    }
    .pin.lvl-info .pin-val {
      fill: var(--jv-info-text);
    }
    .pin.is-hover .dot,
    .pin.is-glow .dot {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .pin.is-selected .dot {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .pin.is-focus .dot,
    .pin:focus-visible .dot {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
  `,
  render(ctx) {
    const pins = ctx.doc.pins[ctx.floor] || [];
    if (!pins.length) return nothing;
    const r = px(ctx, 6, 2, 6);
    const hitR = px(ctx, 14, r, 18);
    const fs = px(ctx, 10, 2.5, 10);
    const glow = glowId();
    return svg`${repeat(
      pins,
      (p) => p.e,
      (p) => {
        const st = pinState(ctx.hass, p.e);
        const level = BADGE_LEVELS.has(st.level) ? st.level : "neutral";
        const value = t(st.value);
        const hit = hitOf("pin", p.e);
        return svg`
          <g data-hit=${hit} tabindex="0" role="button" class="pin lvl-${level} ${ctx.classes(hit)} ${glow === p.e ? "is-glow" : ""}"
             aria-label=${`${st.name}, ${value}`}>
            <circle class="hitarea" cx=${p.x} cy=${p.y} r=${hitR}></circle>
            <circle class="dot" cx=${p.x} cy=${p.y} r=${r}></circle>
            <text class="pin-name" x=${p.x} y=${p.y - r - fs * 0.35} font-size=${fs} stroke-width=${fs * 0.28}>${trunc(st.name, 16)}</text>
            <text class="pin-val" x=${p.x} y=${p.y + r + fs * 0.95} font-size=${fs * 0.9} stroke-width=${fs * 0.25}>${value}</text>
          </g>
        `;
      },
    )}`;
  },
  onTap(ev, ctx) {
    // a first tap selects (default); a tap on the selected pin opens its controls
    if (ev.hit?.kind !== "pin" || !ctx.isSelected("pin", ev.hit.id)) return false;
    moreInfo(ctx.canvas, ev.hit.id);
    return true;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "pins" || ctx.canvas.tool || ev.hit?.kind !== "pin") return null;
    const e = ev.hit.id;
    const floor = ctx.floor;
    const found = findPin(ctx.doc, e, floor);
    if (!found) return null;
    ctx.store.select({ kind: "pin", id: e });
    return dragPoint(ctx, [found.pin.x, found.pin.y], friendlyName(ctx.hass, e), (d, p) => {
      const pin = findPin(d, e, floor)?.pin;
      if (!pin) return;
      pin.x = p[0];
      pin.y = p[1];
    });
  },
  onContextMenu(ev, ctx) {
    if (ctx.mode !== "pins" || ctx.canvas.tool || ev.hit?.kind !== "pin") return false;
    const e = ev.hit.id;
    const store = ctx.store;
    const floor = ctx.floor;
    const canvas = ctx.canvas;
    store.select({ kind: "pin", id: e });
    showPlanMenu({
      at: ev.client,
      label: friendlyName(ctx.hass, e),
      items: [
        { label: t("Open controls"), icon: "mdi:open-in-new", run: () => moreInfo(canvas, e) },
        { label: t("Remove"), icon: "mdi:close", danger: true, run: () => removePin(store, e, floor) },
      ],
    });
    return true;
  },
  onKey(e, ctx) {
    const f = ctx.focus;
    if (e.key !== "Enter" || !f || f.kind !== "pin" || !ctx.isSelected("pin", f.id)) return false;
    moreInfo(ctx.canvas, f.id);
    return true;
  },
};
registerLayer(pinsLayer);

// ── the tab ─────────────────────────────────────────────────────────────────
let _seq = 0;
const THUMB_RESIGN_MS = 60_000;

@customElement("jarvis-editor-pins")
export class JarvisEditorPins extends JarvisEditorTab {
  static override styles = [
    base,
    annexStyles,
    css`
      section + section {
        margin-top: var(--jv-space-5);
      }
      .sec-title {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
      }
      .row-head .who {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .xs {
        font-size: var(--jv-font-size-xs);
      }
      .row-body {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: flex-start;
        margin-top: var(--jv-space-2);
      }
      .row-body .lines {
        flex: 1 1 160px;
        min-width: 0;
      }
      .thumb {
        flex: none;
        width: 96px;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: var(--jv-radius-sm);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-bg-2);
      }
      .sees,
      .ai {
        margin: 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .ai {
        margin-top: var(--jv-space-1);
        color: var(--jv-text);
      }
      .sees .full {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-bold);
      }
      .sees .zone {
        display: inline-block;
        margin-left: var(--jv-space-1);
        padding: 0 var(--jv-space-1);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-ok-soft);
        color: var(--jv-ok-text);
        font-size: var(--jv-font-size-xs);
      }
      .ai .ok {
        color: var(--jv-ok-text);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        grid-column: 1 / -1;
      }
      .env {
        display: flex;
        align-items: flex-end;
        min-width: 0;
      }
      .env .seg {
        flex-wrap: wrap;
        min-width: 0;
      }
      .env .pill {
        padding: 0 var(--jv-space-2);
      }
      .aim {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 96px;
        gap: var(--jv-space-2);
        align-items: end;
      }
      /* the numeric twin of the Aim slider: its label stays for screen readers only */
      .aim > label.field:last-child > .lbl {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .add-pin {
        display: flex;
        gap: var(--jv-space-2);
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .add-pin jv-picker {
        flex: 1 1 200px;
        min-width: 0;
      }
      .add-pin .jv-btn {
        flex: none;
      }
      .chips {
        list-style: none;
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .chip {
        display: flex;
        align-items: center;
        gap: var(--jv-space-1);
        min-width: 0;
        padding-left: var(--jv-space-1);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        transition: border-color var(--jv-ease), background-color var(--jv-ease);
      }
      .chip.is-glow {
        background: var(--jv-hover);
      }
      .chip.is-selected {
        border-color: var(--jv-accent);
        box-shadow: inset 2px 0 0 var(--jv-accent);
      }
      .chip-main {
        appearance: none;
        flex: 1 1 auto;
        min-width: 0;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-2);
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        border-radius: var(--jv-radius-sm);
      }
      .chip-main:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
        outline: none;
      }
      .chip-main .who {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .chip .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
      }
      jv-state-badge {
        flex: none;
      }
    `,
  ];

  /** coverage run in flight: {i, n} */
  @state() private _busy: { i: number; n: number } | null = null;
  /** per-camera coverage failure (translated message) */
  @state() private _covErr: Record<string, string> = {};
  @state() private _pinPick = "";
  @state() private _pinErr = "";
  /** entity_id -> signed camera_proxy URL */
  @state() private _thumbs: Record<string, string> = {};

  private readonly _uid = `jep${++_seq}`;
  private _thumbAt = new Map<string, number>();
  private _thumbFail = new Set<string>();
  private _unsubHover: (() => void) | null = null;
  private _lastSel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, [...HA_FORM_TAGS, "jv-picker"]);
    this._unsubHover = onCanvasHover(() => this.requestUpdate());
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubHover?.();
    this._unsubHover = null;
    setGlow(null, this.store);
  }

  protected override updated(): void {
    this._ensureThumbs();
    // a camera / pin selected on the canvas brings its row into view (wide layout, after release)
    const sel = this.store?.selection;
    const key = sel && (sel.kind === "camera" || sel.kind === "pin") ? `${sel.kind}:${sel.id}` : null;
    if (key && key !== this._lastSel) revealRow(this, this.renderRoot.querySelector<HTMLElement>(`[data-key="${attrQuote(key)}"]`), this.canvas);
    this._lastSel = key;
  }

  /** Sign a camera_proxy still per placed camera (re-signed every minute; ws.ts caches for 240 s). */
  private _ensureThumbs(): void {
    const hass = this.hass;
    const s = this.store;
    if (!hass || !s) return;
    const now = Date.now();
    for (const c of s.cameras()) {
      const e = c.entity;
      if (!e || !e.startsWith("camera.") || !entityExists(hass, e) || this._thumbFail.has(e)) continue;
      if (now - (this._thumbAt.get(e) ?? 0) < THUMB_RESIGN_MS) continue;
      this._thumbAt.set(e, now);
      void signPath(hass, `/api/camera_proxy/${e}`).then((url) => {
        // only ever render a SIGNED /api/ path (signPath falls back to the raw path on failure)
        if (!/[?&]authSig=/.test(url)) return;
        if (this._thumbs[e] !== url) this._thumbs = { ...this._thumbs, [e]: url };
      });
    }
  }

  // ── actions ───────────────────────────────────────────────────────────
  private _edit(id: string, label: string, apply: (c: CameraPin) => void, transient = false): void {
    this.store?.change(
      label,
      (d) => {
        const c = findCamera(d, id)?.camera;
        if (c) apply(c);
      },
      { transient },
    );
  }

  /** C5: sequential jarvis/compute_camera_coverage per camera; failures inline, the loop continues. */
  private async _compute(ids: readonly string[]): Promise<void> {
    const s = this.store;
    if (!s || this._busy || !ids.length) return;
    const floor = this.floor;
    const errs = { ...this._covErr };
    for (const id of ids) delete errs[id];
    this._covErr = errs;
    let done = 0;
    try {
      for (let k = 0; k < ids.length; k++) {
        const id = ids[k];
        this._busy = { i: k + 1, n: ids.length };
        const cam = findCamera(s.doc, id)?.camera;
        if (!cam) continue;
        try {
          const res = await ws<unknown>(this.hass ?? s.hass, CMD, { camera: coverageContext(s.doc, floor, cam) });
          const cov = parseCoverage(res);
          if (!cov) throw new WsError(CMD, "invalid_response", t("Unexpected response from Home Assistant"));
          s.change(t("Compute coverage"), (d) => {
            const c = findCamera(d, id)?.camera;
            if (c) c.coverage = cov;
          });
          done++;
        } catch (err) {
          this._covErr = { ...this._covErr, [id]: WsError.from(CMD, err).message };
        }
      }
    } finally {
      this._busy = null;
    }
    if (done) s.toast(t("Coverage computed — Save to keep it"));
  }

  private _addPin(): void {
    const s = this.store;
    if (!s) return;
    const e = this._pinPick.trim();
    if (!e) return;
    const floor = this.floor;
    if (!entityExists(this.hass, e)) {
      this._pinErr = t('"{id}" is not a known entity id', { id: e });
      return;
    }
    if (findPin(s.doc, e, floor)) {
      this._pinErr = t("Already placed on this floor");
      return;
    }
    const [cx, cy] = floorCentre(floorBBox(s.rooms(floor)));
    // pins added in a row fan out around the centre so they don't hide each other
    const n = s.pins(floor).length;
    const x = n ? ri(cx + 10 * Math.cos(n * 0.9)) : cx;
    const y = n ? ri(cy + 10 * Math.sin(n * 0.9)) : cy;
    const name = friendlyName(this.hass, e);
    s.change(t("Add {name}", { name }), (d) => {
      const pin: EntityPin = { e, x, y, extra: {} };
      listFor(d.pins, floor).push(pin);
    });
    s.select({ kind: "pin", id: e });
    this._pinPick = "";
    this._pinErr = "";
    this.canvas?.announce(t("Added {name} — drag to position, then Save", { name }));
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const s = this.store;
    if (!s) return nothing;
    return html`${this._renderCameras(s)} ${this._renderPins(s)}`;
  }

  private _renderCameras(s: EditorStore) {
    const floor = this.floor;
    const cams = s.cameras(floor);
    const rooms = s.rooms(floor);
    const geo = planGeometry(rooms, s.openings(floor));
    const zones = new Set(rooms.filter((r) => r.type === "outdoor").map((r) => r.name));
    const busy = this._busy;
    const hover = canvasHover();
    const hid = `${this._uid}-cams`;
    return html`
      <section aria-labelledby=${hid}>
        <h3 class="sec-title" id=${hid}>${t("Cameras")}</h3>
        <div class="toolbar">
          <button type="button" class="jv-btn" @click=${() => addCamera(s)}>+ ${t("Camera")}</button>
          <button type="button" class="jv-btn" ?disabled=${!cams.length || !!busy} aria-busy=${busy ? "true" : "false"} @click=${() => void this._compute(cams.map((c) => c.id))}>
            ${busy ? t("Computing… {i}/{n}", { i: busy.i, n: busy.n }) : t("Compute coverage for this floor")}
          </button>
        </div>
        <p class="hint">${t("indoor = bounded by walls, outdoor = by range")}</p>
        ${cams.length
          ? html`<ul class="rows" aria-label=${t("Cameras")}>
              ${repeat(
                cams,
                (c) => c.id,
                (c, i) => this._cameraRow(s, c, i, coverage(rooms, c, geo), zones, hover === hitOf("camera", c.id) || hover === hitOf("cam-aim", c.id)),
              )}
            </ul>`
          : html`<jv-empty class="empty" compact icon="mdi:cctv" .message=${t("No cameras placed on this floor yet — add one above.")}></jv-empty>`}
      </section>
    `;
  }

  private _seesLine(fractions: Record<string, number>, zones: ReadonlySet<string>) {
    const list = Object.entries(fractions).sort((a, b) => b[1] - a[1]);
    if (!list.length) return html`<p class="sees">${t("nothing in view — aim it, widen the FOV, or extend the range")}</p>`;
    return html`<p class="sees">
      ${t("sees:")}
      ${list.map(
        ([name, f], i) => html`${i ? " · " : " "}${f >= COVERAGE_FULL ? html`<span class="full">${name} ${Math.round(f * 100)}%</span>` : html`${name} ${Math.round(f * 100)}%`}${zones.has(name) ? html`<span class="zone">${t("zone")}</span>` : nothing}`,
      )}
    </p>`;
  }

  private _aiLine(c: CameraPin) {
    const cov = c.coverage;
    if (!cov) return nothing;
    const when = relativeTime(cov.ts, this.hass);
    const prefix = cov.source === "geometry" ? `${t("(geometry)")} ` : "";
    return html`<p class="ai">
      <span class="ok" aria-hidden="true">✓</span>
      ${prefix}${cov.covered.length ? t("confirms {rooms}", { rooms: cov.covered.join(", ") }) : ""}${cov.covered.length && cov.reason ? " — " : ""}${cov.reason}
      ${when ? html`<span class="jv-muted xs"> · ${when}</span>` : nothing}
    </p>`;
  }

  private _cameraRow(s: EditorStore, c: CameraPin, i: number, fractions: Record<string, number>, zones: ReadonlySet<string>, hovered: boolean) {
    const u = this.units;
    const id = c.id;
    const uid = `${this._uid}-${id}`;
    const name = t("CAM {n}", { n: i + 1 });
    const selected = s.selection?.kind === "camera" && s.selection.id === id;
    const who = c.entity ? friendlyName(this.hass, c.entity) : t("— camera —");
    const thumb = c.entity ? this._thumbs[c.entity] : undefined;
    const err = this._covErr[id];
    const busy = !!this._busy;
    const glowOn = () => setGlow(id, s);
    const glowOff = () => setGlow(null, s);
    const summary = `${t("Aim")} ${Math.round(c.angle)}° · ${t("Field of view")} ${c.fov}° · ${t("Range")} ${dim(c.range, u)}`;
    return html`
      <li class="row ${selected ? "is-selected" : ""} ${hovered ? "is-glow" : ""}" data-key=${`camera:${id}`} @pointerenter=${glowOn} @pointerleave=${glowOff} @focusin=${glowOn} @focusout=${glowOff}>
        <div class="row-head">
          <button type="button" class="tag jv-hit" aria-pressed=${String(selected)} aria-expanded=${String(selected)} aria-controls=${`${uid}-form`} @click=${() => s.select(selected ? null : { kind: "camera", id })}>
            ${name}
          </button>
          <span class="grow who">
            <span class="jv-truncate">${who}</span>
            <span class="jv-muted xs">${summary}</span>
          </span>
          <button type="button" class="jv-icon-btn" data-remove aria-label=${t("Remove {name}", { name })} title=${t("Remove")} @click=${(e: Event) => keepRowFocus(e, this, CAMERA_FOCUS, () => removeCamera(s, id))}>${icon("mdi:close", "×")}</button>
        </div>
        <div class="row-body">
          ${thumb
            ? html`<img
                class="thumb"
                src=${thumb}
                alt=${who}
                loading="lazy"
                @error=${() => {
                  if (c.entity) this._thumbFail.add(c.entity);
                  const next = { ...this._thumbs };
                  delete next[c.entity];
                  this._thumbs = next;
                }}
              />`
            : nothing}
          <div class="lines">
            ${this._seesLine(fractions, zones)} ${this._aiLine(c)}
            ${err ? html`<p class="err" role="alert">${t("Coverage failed — {message}", { message: err })}</p>` : nothing}
          </div>
        </div>
        ${selected ? this._cameraForm(s, c, name, uid, busy) : nothing}
      </li>
    `;
  }

  private _cameraForm(s: EditorStore, c: CameraPin, name: string, uid: string, busy: boolean) {
    const u = this.units;
    const id = c.id;
    const edit = t("Edit {name}", { name });
    const aimLabel = t("Aim {name}", { name });
    const camOpts = [{ value: "", label: t("— camera —") }, ...cameraCandidates(this.hass, c.entity).map((e) => ({ value: e, label: friendlyName(this.hass, e) }))];
    return html`
      <div class="row-fields" id=${`${uid}-form`}>
        <div class="wide">
          ${selectField({
            id: `${uid}-ent`,
            label: t("Camera"),
            value: c.entity,
            options: camOpts,
            onChange: (v) => this._edit(id, edit, (x) => {
              x.entity = v;
            }),
          })}
        </div>
        <div class="wide aim">
          ${rangeField({
            id: `${uid}-aim`,
            label: t("Aim"),
            value: Math.round(c.angle),
            min: 0,
            max: 359,
            step: 1,
            display: `${Math.round(c.angle)}°`,
            onInput: (v) => this._edit(id, aimLabel, (x) => {
              x.angle = norm360(v);
            }, true),
            onChange: (v) => this._edit(id, aimLabel, (x) => {
              x.angle = norm360(v);
            }),
          })}
          ${numberField({
            id: `${uid}-aimn`,
            label: t("Aim"),
            value: String(Math.round(c.angle)),
            min: 0,
            max: 359,
            step: 1,
            suffix: "°",
            onChange: (raw) => {
              const v = Number(raw);
              if (raw.trim() === "" || !Number.isFinite(v)) {
                this.requestUpdate();
                return;
              }
              this._edit(id, aimLabel, (x) => {
                x.angle = norm360(v);
              });
            },
          })}
        </div>
        <div class="wide">
          ${rangeField({
            id: `${uid}-fov`,
            label: t("Field of view"),
            value: c.fov,
            min: 20,
            max: 170,
            step: 5,
            display: `${c.fov}°`,
            onInput: (v) => this._edit(id, edit, (x) => {
              x.fov = clamp(Math.round(v / 5) * 5, 20, 170);
            }, true),
            onChange: (v) => this._edit(id, edit, (x) => {
              x.fov = clamp(Math.round(v / 5) * 5, 20, 170);
            }),
          })}
        </div>
        ${numberField({
          id: `${uid}-rng`,
          label: t("Range"),
          value: String(toReal(c.range, u)),
          min: 1,
          step: 1,
          suffix: unitLabel(u),
          onChange: (raw) => this._edit(id, edit, (x) => {
            // blank / 0: 50 u (10 ft) in either unit system (a real-unit literal would be read as metres in metric)
            const v = Number(raw);
            x.range = Number.isFinite(v) && v > 0 ? Math.max(5, fromReal(v, u, 5)) : 50;
          }),
        })}
        <div class="env">
          <div class="seg" role="group" aria-label=${t("indoor = bounded by walls, outdoor = by range")}>
            <button type="button" class="pill jv-hit" aria-pressed=${String(c.indoor)} @click=${() => !c.indoor && this._edit(id, edit, (x) => {
              x.indoor = true;
            })}>${t("INDOOR")}</button>
            <button type="button" class="pill jv-hit" aria-pressed=${String(!c.indoor)} @click=${() => c.indoor && this._edit(id, edit, (x) => {
              x.indoor = false;
            })}>${t("OUTDOOR")}</button>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${busy} @click=${() => void this._compute([id])}>
            ${this._busy && this._busy.n === 1 ? t("Computing… {i}/{n}", { i: 1, n: 1 }) : t("Compute coverage")}
          </button>
          <button type="button" class="jv-btn danger" @click=${(e: Event) => keepRowFocus(e, this, CAMERA_FOCUS, () => removeCamera(s, id))}>${t("Delete")}</button>
        </div>
      </div>
    `;
  }

  private _renderPins(s: EditorStore) {
    const floor = this.floor;
    const pins = s.pins(floor);
    const hover = canvasHover();
    const hid = `${this._uid}-pins`;
    const eid = `${this._uid}-pinerr`;
    return html`
      <section aria-labelledby=${hid}>
        <h3 class="sec-title" id=${hid}>${t("Devices on plan")}</h3>
        <div class="add-pin">
          <jv-picker
            kind="entity"
            allow-custom
            .hass=${this.hass}
            .data=${s.data}
            .label=${t("Devices on plan")}
            .placeholder=${t("type to find an entity…")}
            .value=${this._pinPick}
            aria-describedby=${this._pinErr ? eid : nothing}
            @value-changed=${(e: CustomEvent<PickerChangeDetail>) => {
              e.stopPropagation();
              const v = e.detail?.value;
              this._pinPick = typeof v === "string" ? v : "";
              this._pinErr = "";
            }}
          ></jv-picker>
          <button type="button" class="jv-btn primary" ?disabled=${!this._pinPick.trim()} @click=${() => this._addPin()}>+ ${t("Add")}</button>
        </div>
        ${this._pinErr ? html`<p class="err" id=${eid} role="alert">${this._pinErr}</p>` : nothing}
        <p class="hint">${t("add a device, then drag its pin on the plan · tap a pin to open its controls")}</p>
        ${pins.length
          ? html`<ul class="chips" aria-label=${t("Devices on plan")}>
              ${repeat(
                pins,
                (p) => p.e,
                (p) => this._pinChip(s, p, floor, hover === hitOf("pin", p.e)),
              )}
            </ul>`
          : html`<jv-empty class="empty" compact icon="mdi:map-marker-outline" .message=${t("No devices placed on this floor yet.")}></jv-empty>`}
      </section>
    `;
  }

  private _pinChip(s: EditorStore, p: EntityPin, floor: FloorKey, hovered: boolean) {
    const st = pinState(this.hass, p.e);
    const level = BADGE_LEVELS.has(st.level) ? st.level : "neutral";
    const selected = s.selection?.kind === "pin" && s.selection.id === p.e;
    const glowOn = () => setGlow(p.e, s);
    const glowOff = () => setGlow(null, s);
    return html`
      <li class="chip ${selected ? "is-selected" : ""} ${hovered ? "is-glow" : ""}" data-key=${`pin:${p.e}`} @pointerenter=${glowOn} @pointerleave=${glowOff} @focusin=${glowOn} @focusout=${glowOff}>
        <button type="button" class="chip-main" aria-pressed=${String(selected)} @click=${() => s.select(selected ? null : { kind: "pin", id: p.e })}>
          <span class="who">
            <span class="jv-truncate">${st.name}</span>
            ${selected && st.name !== p.e ? html`<span class="jv-mono jv-muted xs jv-truncate">${p.e}</span>` : nothing}
          </span>
          <jv-state-badge level=${level} .label=${t(st.value)}></jv-state-badge>
        </button>
        <button type="button" class="jv-icon-btn" aria-label=${t("Open controls")} title=${t("Open controls")} @click=${() => moreInfo(this, p.e)}>${icon("mdi:open-in-new", "↗")}</button>
        <button type="button" class="jv-icon-btn" data-remove aria-label=${t("Remove {name}", { name: st.name })} title=${t("Remove")} @click=${(e: Event) => keepRowFocus(e, this, PIN_FOCUS, () => removePin(s, p.e, floor))}>${icon("mdi:close", "×")}</button>
      </li>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-pins": JarvisEditorPins;
  }
}
