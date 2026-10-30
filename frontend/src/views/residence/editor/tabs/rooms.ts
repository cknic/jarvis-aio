/**
 * <jarvis-editor-rooms> - the Rooms tab of the floor-plan editor
 * (frontend/specs/editor.md sections 5 "Rooms" / "Inspector", 6 R1-R19).
 *
 *   inspector   the selected room (name with the HA area datalist, type, floor,
 *               size, position, reshape / duplicate / delete), a selected
 *               polygon corner or lot corner; a hint when nothing is selected
 *   tools       draw a rectangle (R) / polygon (P), place a room (the touch
 *               path), outdoor zone, property line; while a draw tool is active:
 *               Finish / Remove last corner / Cancel (touch has no Enter / Esc);
 *               on narrow also Snap and Fit (the editor header hides them there)
 *   room list   one row per room of the floor; selecting pans the canvas to it
 *   House       the house-shape keys and the units toggle - immediate saves
 *
 * Canvas behaviour (layers, drags, handles, menus, keys) is in ./rooms-layers.ts;
 * this element is the form side. Every plan change goes through the store.
 */
import { html, css, nothing, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { watchDefinitions } from "../../../../ha";
import { keepFocus } from "../../../../focus";
import { confirmDialog } from "../../../../components";
import "../../../../components";
import { num } from "../../plan";
import { JarvisEditorTab } from "../tab-base";
import { hitOf, isTouchFirst } from "../canvas";
import {
  FT_PER_UNIT, HOUSE_KEYS, MIN_ROOM_H, MIN_ROOM_W, M_PER_FT, ROOM_TYPES, area, dim, findRoom, fromReal, isCanonical, r1, ri, roomHasArea, roomPoints,
  toReal, unitLabel, type HouseKeySpec, type Pt2, type Room, type Units,
} from "../model";
import {
  addOutdoorZone, addPropertyLine, cancelDrawTool, clearPropertyLine, convertToRect, deleteRoom, drawMode, duplicateRoom, lotAreaLabel, moveFloorToFirst,
  moveRoomTo, moveRoomToFloor, onDrawChange, placeRoom, polygonControls, removeCorner, removePropertyCorner, renameRoomTo, reshapeRoom, resizeRoom,
  roomTypeLabel, setRoomType, startPolygonTool, startRectTool,
} from "./rooms-layers";
import { HA_CONTROL_TAGS, controlStyles, jvIcon, jvNumber, jvSelect, jvSwitch, jvText, type SelectOption } from "./rooms-controls";

/** ft / m -> editor units WITHOUT the >= 1 clamp of fromReal (positions may be negative). */
function unitsOf(real: number, u: Units): number {
  const ft = u === "metric" ? real / M_PER_FT : real;
  return ri(ft / FT_PER_UNIT);
}
/** editor units -> ft / m with 1 decimal (polygon vertices keep 1 decimal in units, so show 2 there). */
function realOf(units: number, u: Units): number {
  return toReal(units, u);
}

/** Catalogue defaults (config_apply.CONFIG_FIELDS) shown while a house key is unset. */
const HOUSE_DEFAULTS: Record<string, string> = {
  residence_style: "cape_cod",
  home_stories: "1.5",
  chimney_side: "right",
  basement_entrance: "bulkhead",
};
const HOUSE_PLACEHOLDERS: Record<string, string> = {
  dormers_front: "2",
  dormers_rear: "1",
  garage_bays: "3",
  chimney_count: "1",
};

@customElement("jarvis-editor-rooms")
export class JarvisEditorRooms extends JarvisEditorTab {
  @state() private _houseOpen = false;

  private _unsubDraw: (() => void) | null = null;

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-4);
        min-width: 0;
      }
      .block {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 0;
      }
      h3 {
        margin: 0;
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
        overflow-wrap: anywhere;
      }
      .sub {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: var(--jv-space-3);
        min-width: 0;
      }
      .form .wide {
        grid-column: 1 / -1;
      }
      .actions,
      .tools {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .actions .jv-btn,
      .tools .jv-btn {
        flex: 0 1 auto;
        max-width: 100%;
      }
      .tools .jv-btn span {
        overflow-wrap: anywhere;
      }
      .drawing {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-accent-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .drawing > span {
        flex: 1 1 160px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .warn-line {
        display: flex;
        gap: var(--jv-space-2);
        align-items: flex-start;
        font-size: var(--jv-font-size-s);
        color: var(--jv-warn-text);
        overflow-wrap: anywhere;
      }
      .warn-line ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .lot {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .floor-note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
      }
      ul.rooms {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      ul.rooms li + li {
        border-top: var(--jv-border-width) solid var(--jv-divider);
      }
      .row {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        border: 0;
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .row:hover {
        background: var(--jv-hover);
      }
      .row:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .row[aria-current="true"] {
        background: var(--jv-accent-soft);
      }
      .dot {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--jv-accent);
      }
      .dot.t-bath,
      .dot.t-stairs {
        background: var(--jv-info);
      }
      .dot.t-outdoor {
        background: var(--jv-ok);
      }
      .dot.t-door {
        background: var(--jv-text-2);
      }
      .row .name {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .row .name strong {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .row .name small {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .row .size {
        flex: none;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .row .flag {
        flex: none;
        color: var(--jv-warn-text);
        display: inline-flex;
      }
      .row .flag ha-icon {
        --mdc-icon-size: 18px;
      }
      details.house {
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      details.house > summary {
        display: flex;
        align-items: center;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        cursor: pointer;
        font-weight: var(--jv-font-weight-medium);
        list-style: none;
        gap: var(--jv-space-2);
      }
      details.house > summary::-webkit-details-marker {
        display: none;
      }
      details.house > summary::before {
        content: "▸";
        color: var(--jv-text-2);
      }
      details.house[open] > summary::before {
        content: "▾";
      }
      details.house > summary:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      details.house > .body {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3) var(--jv-space-3);
        min-width: 0;
      }
      .house-row {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        min-width: 0;
      }
      .house-row.wide {
        grid-column: 1 / -1;
      }
      fieldset.seg {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        border: 0;
        margin: 0;
        padding: 0;
        min-width: 0;
      }
      fieldset.seg legend {
        padding: 0;
        margin-bottom: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        font-weight: var(--jv-font-weight-medium);
      }
      .seg .jv-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"]:focus-visible {
        box-shadow: var(--jv-focus-ring);
      }
      .jv-btn.danger-text {
        color: var(--jv-danger-text);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, [...HA_CONTROL_TAGS, "jv-state-badge", "jv-empty"]);
    this._unsubDraw = onDrawChange(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubDraw?.();
    this._unsubDraw = null;
    // a draw tool belongs to this tab: end it when the tab goes away
    if (this.store && drawMode(this.store.canvas)) cancelDrawTool(this.store);
  }

  // ── helpers ───────────────────────────────────────────────────────────
  private get _u(): Units {
    return this.units;
  }

  private _selectedRoom(): Room | null {
    const s = this.store;
    const sel = s?.selection;
    if (!s || !sel || (sel.kind !== "room" && sel.kind !== "vtx")) return null;
    const hit = findRoom(s.doc, sel.id);
    return hit && hit.floor.key === s.floor ? hit.room : null;
  }

  /** Select a room from the list and pan the canvas so it is in view. */
  private _pick(r: Room): void {
    const s = this.store;
    if (!s) return;
    s.select({ kind: "room", id: r.id });
    const c = this.canvas ?? s.canvas;
    if (!c) return;
    const vb = c.viewBox;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const inside = r.x >= vb.x && r.y >= vb.y && r.x + r.w <= vb.x + vb.w && r.y + r.h <= vb.y + vb.h;
    if (!inside) {
      const s2 = c.pxPerUnit || 1;
      c.panBy(-(cx - (vb.x + vb.w / 2)) * s2, -(cy - (vb.y + vb.h / 2)) * s2);
    }
    c.requestRender();
    const d = s.describeSelection();
    if (d) c.announce(t("{name} selected · {w} × {h}", { name: d.name, w: dim(d.w ?? 0, this._u), h: dim(d.h ?? 0, this._u) }));
  }

  private _focusCanvasHit(raw: string): void {
    void this.store?.canvas?.focusHit(raw);
  }

  /** Where a Remove corner hands focus once its block is gone: the room's inspector heading, else (a lot corner) the plan. */
  private _focusAfterCorner(): HTMLElement | SVGElement | null {
    return this.renderRoot.querySelector<HTMLElement>("#insp-h") ?? (this.canvas ?? this.store?.canvas)?.shadowRoot?.querySelector<SVGSVGElement>("svg") ?? null;
  }

  private _icon(name: string, fallback = ""): TemplateResult | typeof nothing {
    return jvIcon(name, fallback);
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const s = this.store;
    if (!s) return nothing;
    if (!s.loaded) return html`<jv-empty kind="loading" compact .message=${t("Loading...")}></jv-empty>`;
    return html`
      <div class="stack">
        ${this._renderDrawing()}
        ${this._renderInspector()}
        ${this._renderTools()}
        ${this._renderFloorNote()}
        ${this._renderList()}
        ${this._renderHouse()}
      </div>
    `;
  }

  // ── inspector ─────────────────────────────────────────────────────────
  private _renderInspector() {
    const s = this.store!;
    const sel = s.selection;
    if (sel?.kind === "prop-vtx" && sel.sub != null) return this._renderLotCorner(sel.sub);
    const r = this._selectedRoom();
    if (!r) {
      return html`<p class="hint">${isTouchFirst(this.narrow)
        ? t("Select a room on the plan, or in the list below, to edit it. Drag to move · corner handle to resize · long-press for more.")
        : t("Select a room on the plan, or in the list below, to edit it. Drag to move · corner handle to resize · right-click for more.")}</p>`;
    }
    const u = this._u;
    const id = r.id;
    const poly = !!r.points && r.points.length >= 3;
    const areas = s.areaNames();
    const matched = r.type === "outdoor" || roomHasArea(r.name, areas);
    const floorOptions: SelectOption[] = s.floors.map((f) => ({ value: f.key, label: t(s.floorLabel(f.key)) }));
    const typeOptions: SelectOption[] = ROOM_TYPES.map((rt) => ({ value: rt.value, label: t(rt.label) }));
    const vtx = sel?.kind === "vtx" && sel.sub != null && r.points?.[sel.sub] ? sel.sub : null;
    return html`
      <section class="block" aria-labelledby="insp-h">
        <div>
          <h3 id="insp-h" tabindex="-1">${r.name || t("Room")}</h3>
          <span class="sub">${t(roomTypeLabel(r.type))} · ${dim(r.w, u)} × ${dim(r.h, u)} · ${area(roomPoints(r), u)}</span>
        </div>
        <div class="form">
          <div class="wide">
            ${jvText({
              id: "room-name",
              label: t("Name"),
              value: r.name,
              suggestions: areas,
              onChange: (v) => this._rename(id, v),
            })}
            <p class="hint">${t("Use the Home Assistant area name so occupancy lights this room")}</p>
            ${matched
              ? nothing
              : html`<p class="warn-line">${this._icon("mdi:alert-circle-outline", "!")}<span>${t("No Home Assistant area has this name — occupancy won't light it.")}</span></p>`}
            ${/garage/i.test(r.name) && s.floor === "1f" ? html`<p class="hint">${t("The 3D model gives this room the garage roof.")}</p>` : nothing}
          </div>
          ${jvSelect({ id: "room-type", label: t("Type"), value: r.type, options: typeOptions, onChange: (v) => setRoomType(s, id, v) })}
          ${jvSelect({ id: "room-floor", label: t("Floor"), value: s.floor, options: floorOptions, onChange: (v) => moveRoomToFloor(s, id, v) })}
          ${jvNumber({
            id: "room-w",
            label: t("Width"),
            suffix: unitLabel(u),
            value: realOf(r.w, u),
            min: 1,
            step: 0.5,
            disabled: poly,
            onChange: (v) => {
              if (v != null) resizeRoom(s, id, fromReal(v, u, MIN_ROOM_W), r.h);
            },
          })}
          ${jvNumber({
            id: "room-h",
            label: t("Depth"),
            suffix: unitLabel(u),
            value: realOf(r.h, u),
            min: 1,
            step: 0.5,
            disabled: poly,
            onChange: (v) => {
              if (v != null) resizeRoom(s, id, r.w, fromReal(v, u, MIN_ROOM_H));
            },
          })}
          ${jvNumber({
            id: "room-x",
            label: t("X"),
            suffix: unitLabel(u),
            value: realOf(r.x, u),
            step: 0.5,
            onChange: (v) => {
              if (v != null) moveRoomTo(s, id, unitsOf(v, u), r.y);
            },
          })}
          ${jvNumber({
            id: "room-y",
            label: t("Y"),
            suffix: unitLabel(u),
            value: realOf(r.y, u),
            step: 0.5,
            onChange: (v) => {
              if (v != null) moveRoomTo(s, id, r.x, unitsOf(v, u));
            },
          })}
        </div>
        ${poly ? html`<p class="sub">${t("Corners: {n}", { n: r.points!.length })}</p>` : nothing}
        ${vtx != null ? this._renderCorner(r, vtx) : nothing}
        <div class="actions">
          ${poly
            ? html`<button type="button" class="jv-btn" @click=${() => convertToRect(s, id)}>${this._icon("mdi:vector-square")}<span>${t("Convert to rectangle")}</span></button>`
            : html`<button type="button" class="jv-btn" @click=${() => { reshapeRoom(s, id); this._focusCanvasHit(hitOf("room", id)); }}>${this._icon("mdi:vector-polygon")}<span>${t("Reshape (edit corners)")}</span></button>`}
          <button type="button" class="jv-btn" @click=${() => duplicateRoom(s, id)}>${this._icon("mdi:content-copy")}<span>${t("Duplicate")}</span></button>
          <button type="button" class="jv-btn text danger-text" @click=${() => deleteRoom(s, id)}>${this._icon("mdi:delete-outline")}<span>${t("Delete")}</span></button>
        </div>
      </section>
    `;
  }

  /** A selected polygon corner: its position and Remove corner. */
  private _renderCorner(r: Room, i: number) {
    const s = this.store!;
    const u = this._u;
    const p = r.points![i];
    const setPt = (next: Pt2) =>
      s.change(t("Reshape {name}", { name: r.name || t("Room") }), (d) => {
        const room = findRoom(d, r.id)?.room;
        if (!room?.points?.[i]) return;
        room.points[i] = [r1(next[0]), r1(next[1])];
        const xs = room.points.map((q) => q[0]), ys = room.points.map((q) => q[1]);
        room.x = ri(Math.min(...xs));
        room.y = ri(Math.min(...ys));
        room.w = ri(Math.max(...xs) - Math.min(...xs));
        room.h = ri(Math.max(...ys) - Math.min(...ys));
      });
    return html`
      <div class="block" role="group" aria-labelledby="corner-h">
        <h3 id="corner-h">${t("Corner {i} of {name}", { i: i + 1, name: r.name || t("Room") })}</h3>
        <div class="form">
          ${jvNumber({ id: "vtx-x", label: t("X"), suffix: unitLabel(u), value: realOf(p[0], u), step: 0.1, onChange: (v) => { if (v != null) setPt([this._preciseUnits(v, u), p[1]]); } })}
          ${jvNumber({ id: "vtx-y", label: t("Y"), suffix: unitLabel(u), value: realOf(p[1], u), step: 0.1, onChange: (v) => { if (v != null) setPt([p[0], this._preciseUnits(v, u)]); } })}
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${r.points!.length <= 3} @click=${(e: Event) => keepFocus(e, this, () => removeCorner(s, r.id, i), () => this._focusAfterCorner())}>${this._icon("mdi:vector-point-minus")}<span>${t("Remove corner")}</span></button>
        </div>
      </div>
    `;
  }

  /** ft / m -> units with 1 decimal (polygon vertices). */
  private _preciseUnits(real: number, u: Units): number {
    const ft = u === "metric" ? real / M_PER_FT : real;
    return r1(ft / FT_PER_UNIT);
  }

  private _renderLotCorner(i: number) {
    const s = this.store!;
    const u = this._u;
    const pts = s.doc.property.points;
    const p = pts[i];
    if (!p) return nothing;
    const setPt = (next: Pt2) =>
      s.change(t("Move property corner"), (d) => {
        if (d.property.points[i]) d.property.points[i] = [ri(next[0]), ri(next[1])];
      });
    return html`
      <section class="block" aria-labelledby="lot-h">
        <div>
          <h3 id="lot-h">${t("Property corner {i}", { i: i + 1 })}</h3>
          <span class="sub">${lotAreaLabel(pts, u)}</span>
        </div>
        <div class="form">
          ${jvNumber({ id: "lot-x", label: t("X"), suffix: unitLabel(u), value: realOf(p[0], u), step: 0.5, onChange: (v) => { if (v != null) setPt([unitsOf(v, u), p[1]]); } })}
          ${jvNumber({ id: "lot-y", label: t("Y"), suffix: unitLabel(u), value: realOf(p[1], u), step: 0.5, onChange: (v) => { if (v != null) setPt([p[0], unitsOf(v, u)]); } })}
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${pts.length <= 3} @click=${(e: Event) => keepFocus(e, this, () => removePropertyCorner(s, i), () => this._focusAfterCorner())}>${this._icon("mdi:vector-point-minus")}<span>${t("Remove corner")}</span></button>
          <button type="button" class="jv-btn text" @click=${() => s.select(null)}>${t("Done")}</button>
        </div>
      </section>
    `;
  }

  // ── tools ─────────────────────────────────────────────────────────────
  /** While a draw tool is active: what to do, plus Finish / Remove last corner / Cancel (touch has no keys). */
  private _renderDrawing() {
    const s = this.store!;
    const canvas = this.canvas ?? s.canvas;
    const mode = drawMode(canvas);
    if (!mode) return nothing;
    const poly = polygonControls(canvas);
    return html`<div class="drawing" role="status">
      <span>${mode === "rect"
        ? t("Drag on the plan to draw a room. Escape cancels.")
        : t("Tap the plan to add corners ({n} so far), then Finish.", { n: poly?.count() ?? 0 })}</span>
      ${poly
        ? html`
            <button type="button" class="jv-btn primary" ?disabled=${poly.count() < 3} @click=${() => poly.close()}>${t("Finish")}</button>
            <button type="button" class="jv-btn" ?disabled=${poly.count() === 0} @click=${() => poly.undo()}>${t("Remove last corner")}</button>
          `
        : nothing}
      <button type="button" class="jv-btn text" @click=${() => cancelDrawTool(s)}>${t("Cancel")}</button>
    </div>`;
  }

  private _renderTools() {
    const s = this.store!;
    const canvas = this.canvas ?? s.canvas;
    const mode = drawMode(canvas);
    const lot = s.doc.property.points;
    const noCanvas = !canvas;
    return html`
      <div class="block">
        <div class="tools" role="toolbar" aria-label=${t("Room tools")}>
          <button type="button" class="jv-btn" aria-keyshortcuts="R" aria-pressed=${String(mode === "rect")} ?disabled=${noCanvas}
            @click=${() => (mode === "rect" ? cancelDrawTool(s) : this._startTool("rect"))}>${this._icon("mdi:vector-rectangle", "+")}<span>${t("Add Room")}</span></button>
          <button type="button" class="jv-btn" aria-keyshortcuts="P" aria-pressed=${String(mode === "poly")} ?disabled=${noCanvas}
            @click=${() => (mode === "poly" ? cancelDrawTool(s) : this._startTool("poly"))}>${this._icon("mdi:vector-polygon", "+")}<span>${t("Add Room (polygon)")}</span></button>
          <button type="button" class="jv-btn" @click=${() => void placeRoom(s)}>${this._icon("mdi:plus-box-outline", "+")}<span>${t("Place Room")}</span></button>
          <button type="button" class="jv-btn" @click=${() => void addOutdoorZone(s)}>${this._icon("mdi:pine-tree", "+")}<span>${t("Outdoor Zone")}</span></button>
          ${lot.length >= 3
            ? html`<button type="button" class="jv-btn" @click=${() => void clearPropertyLine(s)}>${this._icon("mdi:border-none-variant", "×")}<span>${t("Clear Property Line")}</span></button>`
            : html`<button type="button" class="jv-btn" @click=${() => addPropertyLine(s)}>${this._icon("mdi:border-outside", "+")}<span>${t("Property Line")}</span></button>`}
          ${this.narrow && canvas
            ? html`
                <button type="button" class="jv-btn" aria-pressed=${String(canvas.snap)} @click=${() => { canvas.setSnap(!canvas.snap); this.requestUpdate(); }}>${this._icon("mdi:magnet", "⌗")}<span>${t("Snap to grid")}</span></button>
                <button type="button" class="jv-btn" @click=${() => canvas.fit()}>${this._icon("mdi:fit-to-screen-outline", "⤢")}<span>${t("Fit")}</span></button>
              `
            : nothing}
        </div>
        ${lot.length >= 3 ? html`<p class="lot">${lotAreaLabel(lot, this._u)}</p>` : nothing}
      </div>
    `;
  }

  private _startTool(kind: "rect" | "poly"): void {
    const s = this.store;
    if (!s?.canvas) return;
    if (kind === "rect") startRectTool(s);
    else startPolygonTool(s);
    // keyboard users continue on the canvas (Enter / Backspace / Escape work there)
    try {
      (s.canvas.shadowRoot?.querySelector("svg") as SVGSVGElement | null)?.focus({ preventScroll: true });
    } catch {
      /* focus is a nicety */
    }
  }

  // ── floor note (non-canonical / hidden floors) ────────────────────────
  private _renderFloorNote() {
    const s = this.store!;
    const key = s.floor;
    if (!s.floorHidden(key)) return nothing;
    const n = s.rooms(key).length;
    return html`
      <div class="floor-note">
        <jv-state-badge level="warn" .label=${t("Hidden on the Residence tab")}></jv-state-badge>
        ${!isCanonical(key) && n
          ? html`<button type="button" class="jv-btn" @click=${() => void moveFloorToFirst(s, key)}>${t("Move rooms to 1st Floor")}</button>`
          : nothing}
      </div>
    `;
  }

  // ── room list ─────────────────────────────────────────────────────────
  private _renderList() {
    const s = this.store!;
    const rooms = s.rooms();
    const u = this._u;
    const areas = s.areaNames();
    const sel = s.selection;
    const selId = sel && (sel.kind === "room" || sel.kind === "vtx") ? sel.id : null;
    if (!rooms.length) {
      return html`<jv-empty compact icon="mdi:floor-plan" .message=${t("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty>`;
    }
    return html`
      <div class="block">
        <h3 id="room-list-h">${t("Rooms on {floor}", { floor: t(s.floorLabel()) })} <span class="sub">(${rooms.length})</span></h3>
        <ul class="rooms" aria-labelledby="room-list-h">
          ${repeat(
            rooms,
            (r) => r.id,
            (r) => {
              const unmatched = r.type !== "outdoor" && !roomHasArea(r.name, areas);
              const cls = /^[a-z]+$/.test(r.type) ? r.type : "room";
              return html`<li>
                <button type="button" class="row" aria-current=${selId === r.id ? "true" : "false"} @click=${() => this._pick(r)}>
                  <span class="dot t-${cls}" aria-hidden="true"></span>
                  <span class="name">
                    <strong>${r.name || t("Room")}</strong>
                    <small>${t(roomTypeLabel(r.type))}${r.points ? html` · ${t("Corners: {n}", { n: r.points.length })}` : nothing}</small>
                  </span>
                  <span class="size">${dim(r.w, u)} × ${dim(r.h, u)}</span>
                  ${unmatched
                    ? html`<span class="flag" title=${t("No Home Assistant area has this name — occupancy won't light it.")}>
                        ${this._icon("mdi:alert-circle-outline", "!")}<span class="visually-hidden">${t("No Home Assistant area has this name — occupancy won't light it.")}</span>
                      </span>`
                    : nothing}
                </button>
              </li>`;
            },
          )}
        </ul>
      </div>
    `;
  }

  // ── House (immediate saves) ───────────────────────────────────────────
  private _renderHouse() {
    const s = this.store!;
    const units = s.settings.units;
    const unitsStatus = s.settingStatus.floor_plan_units;
    return html`
      <details class="house" ?open=${this._houseOpen} @toggle=${(e: Event) => { this._houseOpen = (e.target as HTMLDetailsElement).open; }}>
        <summary>${t("House")}</summary>
        <div class="body">
          <div class="house-row wide">
            <fieldset class="seg">
              <legend>${t("Units")}</legend>
              <button type="button" class="jv-btn" aria-pressed=${String(units === "imperial")} ?disabled=${unitsStatus?.level === "saving"} @click=${() => this._setUnits("imperial")}>${t("Imperial (ft)")}</button>
              <button type="button" class="jv-btn" aria-pressed=${String(units === "metric")} ?disabled=${unitsStatus?.level === "saving"} @click=${() => this._setUnits("metric")}>${t("Metric (m)")}</button>
            </fieldset>
            ${this._status("floor_plan_units")}
          </div>
          ${HOUSE_KEYS.map((spec) => this._houseField(spec))}
        </div>
      </details>
    `;
  }

  private _status(key: string) {
    const st = this.store?.settingStatus[key];
    if (!st) return html`<span class="status" aria-live="polite"></span>`;
    const text = st.level === "saving" ? t("Saving…") : st.level === "saved" ? t("Saved") : st.message || t("Save failed");
    return html`<span class="status ${st.level}" aria-live="polite" role=${st.level === "error" ? "alert" : "status"}>${text}</span>`;
  }

  private _houseField(spec: HouseKeySpec) {
    const s = this.store!;
    const cfg = s.config;
    const raw = cfg[spec.key];
    const busy = s.settingStatus[spec.key]?.level === "saving";
    const id = `house-${spec.key}`;
    const label = t(spec.label);
    let control: TemplateResult;
    if (spec.kind === "bool") {
      control = jvSwitch({ id, label, checked: raw !== false && raw !== "false", disabled: busy, onChange: (v) => void this._writeHouse(spec, v) });
    } else if (spec.kind === "int") {
      control = jvNumber({
        id,
        label,
        value: num(raw),
        min: spec.min,
        max: spec.max,
        step: 1,
        placeholder: spec.key === "floor_plan_sqft" ? t("blank = estimated from the plan") : HOUSE_PLACEHOLDERS[spec.key] ?? "",
        disabled: busy,
        onChange: (v) => {
          if (v == null) {
            if (spec.nullable) void this._writeHouse(spec, null);
            else this.requestUpdate();
            return;
          }
          void this._writeHouse(spec, Math.round(v));
        },
      });
    } else {
      const options: SelectOption[] = (spec.options || []).map((o) => ({ value: o.value, label: t(o.label) }));
      const value = raw == null || raw === "" ? HOUSE_DEFAULTS[spec.key] ?? "" : String(spec.key === "home_stories" ? (num(raw) ?? raw) : raw);
      control = jvSelect({ id, label, value, options, disabled: busy, onChange: (v) => void this._writeHouse(spec, v) });
    }
    return html`<div class="house-row">${control}${this._status(spec.key)}</div>`;
  }

  private async _writeHouse(spec: HouseKeySpec, value: unknown): Promise<void> {
    const s = this.store;
    if (!s) return;
    // hiding a floor that still has rooms: confirm (the rooms stay saved)
    if (spec.key === "has_basement" && value === false && s.rooms("bsmt").length) {
      const ok = await confirmDialog({ heading: t("Hide the basement? Its rooms stay saved."), confirmLabel: t("Hide") });
      if (!ok) {
        this.requestUpdate();
        return;
      }
    }
    if (spec.key === "home_stories" && value === "1" && s.rooms("2f").length) {
      const ok = await confirmDialog({ heading: t("Hide the 2nd floor? Its rooms stay saved."), confirmLabel: t("Hide") });
      if (!ok) {
        this.requestUpdate();
        return;
      }
    }
    await s.writeSetting(spec.key, value);
  }

  private async _setUnits(u: Units): Promise<void> {
    const s = this.store;
    if (!s || u === s.settings.units) return;
    const ok = await s.writeSetting("floor_plan_units", u);
    if (ok) s.toast(u === "metric" ? t("Units: Metric (m)") : t("Units: Imperial (ft)"));
  }

  // ── actions ───────────────────────────────────────────────────────────
  private _rename(id: string, name: string): void {
    const s = this.store;
    const r = s ? findRoom(s.doc, id)?.room : null;
    if (!s || !r) return;
    const next = name.trim();
    if (!next) {
      this.requestUpdate();
      return;
    }
    if (next === r.name) return;
    s.change(t("Rename {name}", { name: r.name || t("Room") }), (d) => {
      renameRoomTo(d, id, next);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-rooms": JarvisEditorRooms;
  }
}
