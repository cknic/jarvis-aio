/**
 * <jarvis-editor-openings> - the Openings tab of the floor-plan editor, plus
 * the "openings" canvas layer (editor.md sections 4.2 #6, 5, 6 O1-O6).
 *
 * Tab: add buttons (window, interior window, exterior / balcony / cellar /
 * interior door, cased opening, dormers on 2f), one row per opening on the
 * current floor (type badge, Room for room-anchored kinds, Wall or Roof
 * slope, Position, Width, Sensor, Remove). Hovering / focusing a row glows
 * its marker and vice-versa; selecting a marker scrolls its row into view.
 *
 * Layer: a 4 u bar on the opening's wall (dormers an 8 x 6 block), coloured by
 * kind, selectable in every mode, draggable along its wall in the Openings
 * tab (the pointer projects onto the wall -> `pos`). In the Doors tab the
 * markers whose sensor is mapped to a door slot are outlined.
 */
import { html, css, svg, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { watchDefinitions } from "../../../../ha";
import "../../../../components";
import { JarvisEditorTab } from "../tab-base";
import { registerLayer, hitOf, LAYER_ORDER, type Layer, type CanvasDragEvent } from "../canvas";
import { markerRect, posOnWall } from "../geometry";
import {
  OPENING_PRESETS, ROOM_ANCHORED_KINDS, clamp, doorEntityCandidates, findOpening, findRoom, floorBBox, friendlyName, fromReal, listFor, newStoredId, toReal, unitLabel,
  type EditorDoc, type Opening, type Room, type Wall,
} from "../model";
import {
  HA_FORM_TAGS, WALL_LABELS, annexStyles, attrQuote, canvasHover, glowId, icon, numberField, onCanvasHover, openingKindClass, openingLabel, rangeField, reportCanvasHover,
  revealRow, selectField, setGlow, wallOptions,
} from "./openings-doors-pins-shared";

type Preset = (typeof OPENING_PRESETS)[number];

const pct = (pos: number): string => `${Math.round(pos * 100)}%`;

/** Where the opening sits, for aria-labels and row summaries: "Kitchen · Left · 50%". */
function placement(o: Opening): string {
  const parts: string[] = [];
  if (o.room) parts.push(o.room);
  if (o.type === "dormer") parts.push(o.slope === "rear" ? t("Rear slope") : t("Front slope"));
  else parts.push(t(WALL_LABELS[o.wall] ?? "Front"));
  parts.push(pct(o.pos));
  return parts.join(" · ");
}

// ── the canvas layer ────────────────────────────────────────────────────────
export const openingsLayer: Layer = {
  id: "openings",
  order: LAYER_ORDER.openings,
  hits: ["opening"],
  styles: css`
    .opening .hitbox {
      fill: transparent;
      stroke: none;
    }
    .opening .marker {
      fill: var(--jv-warn);
      stroke: var(--jv-surface);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .opening .pane {
      stroke: var(--jv-surface);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .opening.k-window .marker {
      fill: var(--jv-accent);
    }
    .opening.k-interior .marker {
      fill: var(--jv-text-2);
    }
    .opening.k-cellar .marker {
      fill: var(--jv-warn);
    }
    .opening.k-cased .marker {
      fill: var(--jv-info);
    }
    .opening.k-french .marker {
      fill: var(--jv-ok);
    }
    .opening.k-exterior .marker {
      fill: var(--jv-warn);
    }
    .opening.k-dormer .marker {
      fill: var(--jv-neutral);
    }
    .opening.is-hover .marker,
    .opening.is-glow .marker {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .opening.is-selected .marker {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .opening.is-focus .marker,
    .opening:focus-visible .marker {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .opening.is-mapped .marker {
      stroke: var(--jv-ok);
      stroke-width: 3;
    }
    @media (prefers-reduced-motion: no-preference) {
      .opening.is-mapped .marker {
        animation: jv-opening-pulse 1.2s ease-out 1;
      }
    }
    @keyframes jv-opening-pulse {
      0% {
        stroke-width: 8;
      }
      100% {
        stroke-width: 3;
      }
    }
  `,
  render(ctx) {
    reportCanvasHover(ctx.hover);
    const list = ctx.doc.openings[ctx.floor] || [];
    if (!list.length) return nothing;
    const mapped = ctx.mode === "doors" ? new Set(Object.values(ctx.store.settings.doorMapping)) : null;
    const glow = glowId();
    const pad = Math.max(2, 6 / (ctx.pxPerUnit || 1));
    return svg`${repeat(
      list,
      (o) => o.id,
      (o) => {
        const mr = markerRect(o, ctx.rooms);
        if (!mr) return nothing;
        const hit = hitOf("opening", o.id);
        const cls = ["opening", `k-${openingKindClass(o)}`, ctx.classes(hit), glow === o.id ? "is-glow" : "", mapped && o.entity && mapped.has(o.entity) ? "is-mapped" : ""]
          .filter(Boolean)
          .join(" ");
        const pane =
          o.type === "window"
            ? mr.horizontal
              ? svg`<line class="pane" x1=${mr.x + 1} y1=${mr.cy} x2=${mr.x + mr.w - 1} y2=${mr.cy}></line>`
              : svg`<line class="pane" x1=${mr.cx} y1=${mr.y + 1} x2=${mr.cx} y2=${mr.y + mr.h - 1}></line>`
            : nothing;
        return svg`
          <g data-hit=${hit} tabindex="0" role="button" class=${cls} aria-label=${`${t(openingLabel(o))} · ${placement(o)}`}>
            <rect class="hitbox" x=${mr.x - pad} y=${mr.y - pad} width=${mr.w + 2 * pad} height=${mr.h + 2 * pad}></rect>
            <rect class="marker" x=${mr.x} y=${mr.y} width=${mr.w} height=${mr.h} rx="0.8"></rect>
            ${pane}
          </g>
        `;
      },
    )}`;
  },
  onDragStart(ev, ctx) {
    if (ctx.mode !== "openings" || !ev.hit || ev.hit.kind !== "opening") return null;
    const id = ev.hit.id;
    const found = findOpening(ctx.doc, id);
    if (!found || found.floor !== ctx.floor) return null;
    const rooms = ctx.rooms;
    const name = t(openingLabel(found.opening));
    const label = t("Move {name}", { name });
    ctx.store.select({ kind: "opening", id });
    const apply = (pos: number, transient: boolean) =>
      ctx.store.change(
        label,
        (d) => {
          const o = findOpening(d, id)?.opening;
          if (o) o.pos = pos;
        },
        { transient },
      );
    const posAt = (ev2: CanvasDragEvent): number | null => {
      const o = findOpening(ctx.store.doc, id)?.opening;
      return o ? posOnWall(o, rooms, ev2.plan) : null;
    };
    const tip = (pos: number) => {
      const o = findOpening(ctx.store.doc, id)?.opening;
      const mr = o ? markerRect(o, rooms) : null;
      ctx.canvas.tooltip = mr ? { x: mr.cx, y: mr.cy - 4, text: pct(pos) } : null;
    };
    return {
      cursor: "grabbing",
      onMove: (ev2) => {
        const p = posAt(ev2);
        if (p == null) return;
        apply(p, true);
        tip(p);
      },
      onEnd: (ev2) => {
        const p = posAt(ev2);
        ctx.canvas.tooltip = null;
        if (p == null) return;
        apply(p, false);
        ctx.canvas.announce(t("{name} moved to {pos}", { name, pos: pct(p) }));
      },
      onCancel: () => {
        ctx.canvas.tooltip = null;
      },
    };
  },
};
registerLayer(openingsLayer);

// ── the tab ─────────────────────────────────────────────────────────────────
let _seq = 0;

@customElement("jarvis-editor-openings")
export class JarvisEditorOpenings extends JarvisEditorTab {
  static override styles = [
    base,
    annexStyles,
    css`
      .tag.k-window .dot {
        background: var(--jv-accent);
      }
      .tag.k-interior .dot {
        background: var(--jv-text-2);
      }
      .tag.k-cellar .dot,
      .tag.k-exterior .dot {
        background: var(--jv-warn);
      }
      .tag.k-cased .dot {
        background: var(--jv-info);
      }
      .tag.k-french .dot {
        background: var(--jv-ok);
      }
      .tag.k-dormer .dot {
        background: var(--jv-neutral);
      }
      .where {
        font-size: var(--jv-font-size-xs);
      }
    `,
  ];

  private readonly _uid = `jeo${++_seq}`;
  private _unsubHover: (() => void) | null = null;
  private _lastSel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_FORM_TAGS);
    this._unsubHover = onCanvasHover(() => this.requestUpdate());
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubHover?.();
    this._unsubHover = null;
    setGlow(null, this.store);
  }

  /** Selecting a marker (canvas or keyboard) brings its row into view (wide layout only, after the pointer is released). */
  protected override updated(): void {
    const sel = this.store?.selection;
    const id = sel?.kind === "opening" ? sel.id : null;
    if (id && id !== this._lastSel) revealRow(this, this.renderRoot.querySelector<HTMLElement>(`.row[data-id="${attrQuote(id)}"]`), this.canvas);
    this._lastSel = id;
  }

  // ── actions ───────────────────────────────────────────────────────────
  private _defaultRoom(d: EditorDoc): string | undefined {
    const sel = this.store?.selection;
    if (sel?.kind === "room") {
      const r = findRoom(d, sel.id)?.room;
      if (r && r.type !== "outdoor" && r.name) return r.name;
    }
    const rooms = d.floors.find((f) => f.key === this.floor)?.rooms || [];
    return rooms.find((r) => r.type !== "outdoor" && r.name)?.name;
  }

  private _add(p: Preset): void {
    const s = this.store;
    if (!s) return;
    const floor = this.floor;
    const name = t(p.label);
    let id = "";
    s.change(t("Add {name}", { name }), (d) => {
      id = newStoredId("e", Object.values(d.openings).flat().map((o) => o.id));
      const o: Opening = { id, type: p.type, kind: p.kind, wall: "front", pos: 0.5, w: 20, entity: "", extra: {} };
      if (p.slope) o.slope = p.slope;
      if (p.kind && ROOM_ANCHORED_KINDS.has(p.kind)) {
        const room = this._defaultRoom(d);
        if (room) o.room = room;
      }
      listFor(d.openings, floor).push(o);
    });
    if (!id) return;
    s.select({ kind: "opening", id });
    this.canvas?.announce(t("Added {name} — drag to position, then Save", { name }));
  }

  private _remove(o: Opening): void {
    const s = this.store;
    if (!s) return;
    const name = t(openingLabel(o));
    const id = o.id;
    const label = s.changeWith((d) => {
      const hit = findOpening(d, id);
      if (!hit) return null;
      d.openings[hit.floor].splice(hit.index, 1);
      return t("Removed {name}", { name });
    });
    if (!label) return;
    setGlow(null, s);
    s.toast(label, { label: t("Undo"), run: () => s.undo() });
    this.canvas?.announce(label);
  }

  private _edit(id: string, apply: (o: Opening) => void, label: string, transient = false): void {
    this.store?.change(
      label,
      (d) => {
        const o = findOpening(d, id)?.opening;
        if (o) apply(o);
      },
      { transient },
    );
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const s = this.store;
    if (!s) return nothing;
    const floor = this.floor;
    const rooms = s.rooms(floor);
    const enclosed = floorBBox(rooms) != null;
    const list = s.openings(floor);
    const presets = OPENING_PRESETS.filter((p) => !p.floors || p.floors.includes(floor));
    const hover = canvasHover();
    const hoverId = hover && hover.startsWith("opening:") ? hover.slice("opening:".length) : null;
    return html`
      <p class="help">
        ${t("Interior windows, interior / balcony doors and cased openings attach to a room's wall — pick the room, then the wall. A balcony door is full-height glass; a cased opening is a doorway with no door; dormers go on the 2nd floor.")}
      </p>
      <div class="toolbar" role="group" aria-label=${t("Openings")}>
        ${presets.map((p) => html`<button type="button" class="jv-btn" ?disabled=${!enclosed} @click=${() => this._add(p)}>+ ${t(p.label)}</button>`)}
      </div>
      ${!enclosed
        ? html`<jv-empty class="empty" compact icon="mdi:floor-plan" .message=${t("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty>`
        : list.length === 0
          ? html`<jv-empty class="empty" compact icon="mdi:window-closed-variant" .message=${t("No openings placed on this floor yet — add one above.")}></jv-empty>`
          : html`<ul class="rows" aria-label=${t("Openings")}>
              ${repeat(
                list,
                (o) => o.id,
                (o) => this._row(o, rooms, hoverId),
              )}
            </ul>`}
    `;
  }

  private _row(o: Opening, rooms: readonly Room[], hoverId: string | null) {
    const s = this.store as NonNullable<typeof this.store>;
    const u = this.units;
    const id = o.id;
    const uid = `${this._uid}-${id}`;
    const selected = s.selection?.kind === "opening" && s.selection.id === id;
    const isDormer = o.type === "dormer";
    const roomAnchored = !!o.kind && ROOM_ANCHORED_KINDS.has(o.kind);
    const cased = o.kind === "cased";
    const name = t(openingLabel(o));
    const editLabel = t("Edit {name}", { name });
    const moveLabel = t("Move {name}", { name });
    const roomOpts = [{ value: "", label: t("— room —") }, ...rooms.filter((r) => r.type !== "outdoor" && r.name).map((r) => ({ value: r.name, label: r.name }))];
    const sensorOpts = [{ value: "", label: t("— none —") }, ...doorEntityCandidates(this.hass, o.entity).map((e) => ({ value: e, label: friendlyName(this.hass, e) }))];
    const glowOn = () => setGlow(id, s);
    const glowOff = () => setGlow(null, s);
    return html`
      <li class="row ${selected ? "is-selected" : ""} ${hoverId === id ? "is-glow" : ""}" data-id=${id} @pointerenter=${glowOn} @pointerleave=${glowOff} @focusin=${glowOn} @focusout=${glowOff}>
        <div class="row-head">
          <button type="button" class="tag k-${openingKindClass(o)} jv-hit" aria-pressed=${String(selected)} @click=${() => s.select({ kind: "opening", id })}>
            <span class="dot" aria-hidden="true"></span>${name}
          </button>
          <span class="grow jv-muted jv-truncate where">${placement(o)}</span>
          <button type="button" class="jv-icon-btn" aria-label=${t("Remove {name}", { name })} title=${t("Remove")} @click=${() => this._remove(o)}>${icon("mdi:close", "×")}</button>
        </div>
        <div class="row-fields">
          ${roomAnchored
            ? selectField({
                id: `${uid}-room`,
                label: t("Room"),
                value: o.room ?? "",
                options: roomOpts,
                onChange: (v) =>
                  this._edit(
                    id,
                    (x) => {
                      if (v) x.room = v;
                      else delete x.room;
                    },
                    editLabel,
                  ),
              })
            : nothing}
          ${isDormer
            ? selectField({
                id: `${uid}-slope`,
                label: t("Roof slope"),
                value: o.slope === "rear" ? "rear" : "front",
                options: [
                  { value: "front", label: t("Front slope") },
                  { value: "rear", label: t("Rear slope") },
                ],
                onChange: (v) =>
                  this._edit(
                    id,
                    (x) => {
                      x.slope = v === "rear" ? "rear" : "front";
                    },
                    editLabel,
                  ),
              })
            : selectField({
                id: `${uid}-wall`,
                label: t("Wall"),
                value: o.wall,
                options: wallOptions(),
                onChange: (v) =>
                  this._edit(
                    id,
                    (x) => {
                      x.wall = v as Wall;
                    },
                    editLabel,
                  ),
              })}
          ${rangeField({
            id: `${uid}-pos`,
            label: t("Position"),
            value: o.pos,
            min: 0,
            max: 1,
            step: 0.02,
            display: pct(o.pos),
            onInput: (v) =>
              this._edit(
                id,
                (x) => {
                  x.pos = clamp(v, 0, 1);
                },
                moveLabel,
                true,
              ),
            onChange: (v) =>
              this._edit(
                id,
                (x) => {
                  x.pos = clamp(v, 0, 1);
                },
                moveLabel,
              ),
          })}
          ${isDormer
            ? nothing
            : numberField({
                id: `${uid}-w`,
                label: t("Width"),
                value: String(toReal(o.w, u)),
                min: 1,
                step: 0.5,
                suffix: unitLabel(u),
                onChange: (raw) =>
                  this._edit(
                    id,
                    (x) => {
                      // blank / 0: the default 20 u (4 ft) - a real-unit literal would be read as metres in metric
                      const v = Number(raw);
                      x.w = Number.isFinite(v) && v > 0 ? fromReal(v, u, 1) : 20;
                    },
                    editLabel,
                  ),
              })}
          ${cased
            ? html`<span class="field"><span class="lbl">${t("Sensor")}</span><span class="jv-muted">${t("open passage · no sensor")}</span></span>`
            : selectField({
                id: `${uid}-ent`,
                label: t("Sensor"),
                value: o.entity,
                options: sensorOpts,
                onChange: (v) =>
                  this._edit(
                    id,
                    (x) => {
                      x.entity = v;
                    },
                    editLabel,
                  ),
              })}
        </div>
      </li>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-openings": JarvisEditorOpenings;
  }
}
