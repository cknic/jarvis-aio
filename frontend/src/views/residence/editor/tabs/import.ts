/**
 * <jarvis-editor-import> - the Import tab of the floor-plan editor
 * (frontend/specs/editor.md sections 5 "Import", 6 I1-I12, 6.1, 6.2, 7).
 *
 *   Map / vacuum entity  jarvis/floorplan_sources -> jarvis/import_floorplan (background)
 *                        or jarvis/segment_floorplan_rooms (room detection) -> a review
 *                        step (canvas overlay + checklist) before rooms are added or
 *                        replace the floor's rooms
 *   Background image     upload (downscaled, <= 1.5 MB), opacity, alignment (scale /
 *                        offset, numerically or by dragging on the plan), remove
 *   SweetHome3D          .sh3d / Home.xml / JSON -> rooms with level -> floor mapping,
 *                        scale, rotate, mirror, origin; add to or replace the plan
 *   Plan file            JSON export / import of the whole plan (section 6.2)
 *   Reset                floor_plan_rooms = {} (the sample home)
 *
 * Plan changes go through store.change() (undoable, saved with Save); the
 * opacity, units and door mapping are immediate writes (store.writeSetting),
 * the background image / alignment one floor per message
 * (store.writeFloorBackground). The canvas side is in ./import-layers.ts.
 */
import { html, css, nothing, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { live } from "lit/directives/live.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { watchDefinitions } from "../../../../ha";
import { ws, WsError } from "../../../../ws";
import { confirmDialog } from "../../../../components";
import "../../../../components";
import { JarvisEditorTab } from "../tab-base";
import { WS_FRAME_LIMIT, floorBackgroundFrameBytes } from "../store";
import {
  CANONICAL_FLOORS, FT_PER_UNIT, M_PER_FT, bboxOfPoints, dim, ensureFloor, newRoomId, parsePoints, r1, ri, roomPoints, toReal, unionBBox, unitLabel,
  type FloorKey, type Pt2, type Room, type Units,
} from "../model";
import { isAxisAlignedRect } from "./rooms-layers";
import { HA_CONTROL_TAGS, controlStyles, jvAlert, jvIcon, jvNumber, jvSelect, jvSwitch, type SelectOption } from "./rooms-controls";
import { compressImage, ensureImageSize, imageSize, ImageImportError } from "./import-image";
import {
  SH3D_REAL_SCALE, Sh3dError, convertSweetHome, countRooms, defaultLevelFloors, levelsWithRooms, readSweetHome,
  type Mirror, type NewRoom, type Rotation, type SweetHome,
} from "./import-sh3d";
import { PLAN_FILE_NAME, PlanFileError, applyPlanFile, buildBundle, downloadText, importableBackgrounds, parsePlanFile } from "./import-plan";
import {
  aligning, alignDraft, cancelAlignTool, clearAlignPreview, effectiveAlign, finishAlignTool, initialOffset, onAlignChange, onReviewChange,
  parseAlign, placedPoints, resolveBackgroundHref, reviewOf, roundAlign, setOpacityPreview, setReview, startAlignTool, updateReview,
  type BgAlign, type Candidate,
} from "./import-layers";

interface Source {
  entity_id: string;
  name: string;
  domain: string;
}
interface SegmentRoom {
  name?: unknown;
  x?: unknown;
  y?: unknown;
  w?: unknown;
  h?: unknown;
  type?: unknown;
  points?: unknown;
}
type Busy = "" | "import" | "detect" | "bg" | "align" | "reset";
interface Notice {
  level: "error" | "warning" | "info";
  text: string;
}

const DEFAULT_SPAN = 60;
/** SH3D_REAL_SCALE rounded for the Scale field (5 decimals is well under 1 mm on a house) */
const REAL_SCALE_SHOWN = Math.round(SH3D_REAL_SCALE * 1e5) / 1e5;

/** ft / m -> editor units, unclamped (positions may be negative), 1 decimal. */
function unitsOf(real: number, u: Units): number {
  const ft = u === "metric" ? real / M_PER_FT : real;
  return r1(ft / FT_PER_UNIT);
}

function errMessage(command: string, err: unknown): string {
  return WsError.from(command, err).message;
}

@customElement("jarvis-editor-import")
export class JarvisEditorImport extends JarvisEditorTab {
  // map / vacuum entity
  @state() private _sources: Source[] | null = null;
  @state() private _sourcesError: string | null = null;
  @state() private _entity = "";
  /** null = follow the floor (its rooms' larger dimension, else 60) */
  @state() private _span: number | null = null;
  @state() private _busy: Busy = "";
  @state() private _mapNotice: Notice | null = null;
  // background
  @state() private _bgNotice: Notice | null = null;
  @state() private _opacityDraft: number | null = null;
  // SweetHome3D
  @state() private _sh: { file: string; home: SweetHome; floors: Record<string, FloorKey> } | null = null;
  @state() private _shNotice: Notice | null = null;
  @state() private _shScale = REAL_SCALE_SHOWN;
  @state() private _shRotate: Rotation = 0;
  @state() private _shMirror: Mirror = "none";
  @state() private _shOrigin = true;
  @state() private _shReading = false;
  // plan file / reset
  @state() private _includeBg = false;
  @state() private _planNotice: Notice | null = null;
  @state() private _resetNotice: Notice | null = null;

  private _sourcesRequested = false;
  private _unsubs: Array<() => void> = [];

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
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 0;
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      h3 ha-icon {
        --mdc-icon-size: 20px;
        color: var(--jv-text-2);
        flex: none;
      }
      h4 {
        margin: 0;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
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
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .actions .jv-btn {
        max-width: 100%;
      }
      .sub {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .thumb {
        display: block;
        max-width: 100%;
        max-height: 160px;
        object-fit: contain;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
      }
      .range-row {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-width: 0;
      }
      .range-row input[type="range"] {
        flex: 1 1 auto;
        min-width: 0;
      }
      .range-row output {
        flex: none;
        min-width: 4ch;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      details.adv > summary {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        list-style: none;
      }
      details.adv > summary::-webkit-details-marker {
        display: none;
      }
      details.adv > summary::before {
        content: "▸";
      }
      details.adv[open] > summary::before {
        content: "▾";
      }
      details.adv > summary:focus-visible {
        box-shadow: var(--jv-focus-ring);
        border-radius: var(--jv-radius-sm);
      }
      details.adv[open] > summary {
        margin-bottom: var(--jv-space-2);
      }
      ul.cands {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      ul.cands li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      ul.cands li + li {
        border-top: var(--jv-border-width) solid var(--jv-divider);
      }
      ul.cands input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin: 0;
        flex: none;
        accent-color: var(--jv-accent);
      }
      ul.cands input[type="text"] {
        box-sizing: border-box;
        flex: 1 1 140px;
        min-width: 0;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      ul.cands .size {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
      }
      .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .note > span {
        flex: 1 1 160px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .levels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--jv-space-3);
      }
      .jv-btn.danger-text {
        color: var(--jv-danger-text);
      }
      .file {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, [...HA_CONTROL_TAGS, "jv-empty", "jv-state-badge"]);
    this._unsubs.push(onReviewChange(() => this.requestUpdate()), onAlignChange(() => this.requestUpdate()));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const u of this._unsubs) u();
    this._unsubs = [];
    // the align tool belongs to this tab; leaving discards an uncommitted drag
    if (this.store && aligning(this.store)) cancelAlignTool(this.store);
    if (this.store && this._opacityDraft != null) setOpacityPreview(this.store, null);
  }

  protected override updated(): void {
    // I1: load the sources the first time the tab is shown with a connection
    const hass = this.store?.hass ?? this.hass;
    if (!this._sourcesRequested && hass) {
      this._sourcesRequested = true;
      void this._loadSources();
    }
  }

  private get _hass() {
    return this.store?.hass ?? this.hass;
  }
  private get _u(): Units {
    return this.units;
  }
  private _floorName(key: FloorKey = this.floor): string {
    return t(this.store?.floorLabel(key) ?? key);
  }
  private _icon(name: string, fallback = ""): TemplateResult | typeof nothing {
    return jvIcon(name, fallback);
  }
  private _notice(n: Notice | null) {
    return n ? jvAlert(n.level, html`<span>${n.text}</span>`) : nothing;
  }
  private _pickFile(id: string): void {
    this.renderRoot.querySelector<HTMLInputElement>(`#${id}`)?.click();
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const s = this.store;
    if (!s) return nothing;
    if (!s.loaded) return html`<jv-empty kind="loading" compact .message=${t("Loading...")}></jv-empty>`;
    return html`
      <div class="stack">
        ${this._renderMap()}
        ${this._renderBackground()}
        ${this._renderSweetHome()}
        ${this._renderPlanFile()}
        ${this._renderReset()}
      </div>
    `;
  }

  // ── Map / vacuum entity (I1-I4) ───────────────────────────────────────
  private async _loadSources(): Promise<void> {
    this._sources = null;
    this._sourcesError = null;
    try {
      const res = await ws<{ sources?: unknown }>(this._hass, "jarvis/floorplan_sources");
      const list = Array.isArray(res?.sources) ? res.sources : [];
      this._sources = list
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && typeof (x as Record<string, unknown>).entity_id === "string")
        .map((x) => ({ entity_id: String(x.entity_id), name: String(x.name || x.entity_id), domain: String(x.domain || "") }));
      if (!this._sources.some((x) => x.entity_id === this._entity)) this._entity = this._sources[0]?.entity_id ?? "";
    } catch (err) {
      this._sources = [];
      this._sourcesError = errMessage("jarvis/floorplan_sources", err);
    }
  }

  private _renderMap() {
    const s = this.store!;
    const sources = this._sources;
    const loading = sources === null && !this._sourcesError;
    const empty = !!sources && !sources.length && !this._sourcesError;
    let options: SelectOption[];
    if (loading) options = [{ value: "", label: t("Loading...") }];
    else if (empty || this._sourcesError) options = [{ value: "", label: t("No map or image entities found") }];
    else options = sources!.map((x) => ({ value: x.entity_id, label: `${x.name} (${x.entity_id})` }));
    const canAct = !!this._entity && !this._busy && !!sources?.length;
    const review = reviewOf(s);
    return html`
      <section class="card" aria-labelledby="imp-map-h">
        <h3 id="imp-map-h">${this._icon("mdi:robot-vacuum")}${t("Map / vacuum entity")}</h3>
        ${jvSelect({
          id: "imp-source",
          label: t("Map / vacuum entity"),
          value: loading || empty || this._sourcesError ? "" : this._entity,
          options,
          disabled: loading || empty || !!this._sourcesError || !!this._busy,
          onChange: (v) => {
            this._entity = v;
            this._mapNotice = null;
          },
        })}
        ${this._sourcesError
          ? jvAlert(
              "error",
              html`<span>${t("Couldn't list image entities — {message}", { message: this._sourcesError })}</span>
                <button type="button" class="jv-btn" @click=${() => void this._loadSources()}>${t("Retry")}</button>`,
            )
          : nothing}
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${!canAct} aria-busy=${String(this._busy === "import")} @click=${() => void this._importEntity()}>
            ${this._icon("mdi:image-move")}<span>${this._busy === "import" ? t("Importing…") : t("Import as background")}</span>
          </button>
          <button type="button" class="jv-btn" ?disabled=${!canAct} aria-busy=${String(this._busy === "detect")} @click=${() => void this._detect()}>
            ${this._icon("mdi:auto-fix")}<span>${this._busy === "detect" ? t("Detecting…") : t("Detect Rooms")}</span>
          </button>
        </div>
        ${this._busy === "detect" ? html`<p class="sub" role="status">${t("Detecting rooms in {entity} — this can take a few seconds.", { entity: this._entityName(this._entity) })}</p>` : nothing}
        <details class="adv">
          <summary>${t("Advanced")}</summary>
          ${jvNumber({
            id: "imp-span",
            label: t("Fit detected layout to {n} units wide", { n: this._spanValue }),
            value: this._spanValue,
            min: 10,
            max: 2000,
            step: 5,
            onChange: (v) => {
              this._span = v == null ? null : Math.round(v);
            },
          })}
          <p class="hint">≈ ${dim(this._spanValue, this._u)}${this._span == null ? html` · ${t("matches the rooms on this floor")}` : nothing}</p>
        </details>
        ${this._notice(this._mapNotice)}
        ${review ? this._renderReview() : nothing}
      </section>
    `;
  }

  /** target_span: what the user typed, else the floor's enclosed rooms' larger side (so a detection lands at house scale). */
  private get _spanValue(): number {
    if (this._span != null) return this._span;
    const s = this.store;
    let bb = null as ReturnType<typeof bboxOfPoints>;
    for (const r of s?.rooms() || []) if (r.type !== "outdoor") bb = unionBBox(bb, bboxOfPoints(roomPoints(r)));
    if (!bb) return DEFAULT_SPAN;
    return Math.min(2000, Math.max(10, Math.round(Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 5) * 5));
  }

  private _entityName(id: string): string {
    return this._sources?.find((x) => x.entity_id === id)?.name || id;
  }

  private async _importEntity(): Promise<void> {
    const s = this.store;
    const entity = this._entity;
    if (!s || !entity || this._busy) return;
    const floor = s.floor;
    if (s.settings.bg[floor]) {
      const ok = await confirmDialog({ heading: t("Replace the background of {floor}?", { floor: this._floorName(floor) }), confirmLabel: t("Replace") });
      if (!ok) return;
    }
    this._busy = "import";
    this._mapNotice = null;
    try {
      const res = await ws<{ floor?: string; entity_id?: string; bytes?: number }>(this._hass, "jarvis/import_floorplan", { entity_id: entity, floor });
      const kb = Math.max(1, Math.round((Number(res?.bytes) || 0) / 1024));
      s.toast(t("Floor plan imported from {entity} ({kb} KB)", { entity: this._entityName(entity), kb }));
      s.refresh(); // the backend wrote floor_plan_bg itself: re-read it from the next snapshot
    } catch (err) {
      this._mapNotice = { level: "error", text: t("Import failed — {message}", { message: errMessage("jarvis/import_floorplan", err) }) };
    } finally {
      this._busy = "";
    }
  }

  private async _detect(): Promise<void> {
    const s = this.store;
    const entity = this._entity;
    if (!s || !entity || this._busy) return;
    const floor = s.floor;
    this._busy = "detect";
    this._mapNotice = null;
    try {
      const res = await ws<{ rooms?: unknown; count?: number }>(this._hass, "jarvis/segment_floorplan_rooms", { entity_id: entity, target_span: this._spanValue });
      const rows = (Array.isArray(res?.rooms) ? res.rooms : []) as SegmentRoom[];
      const cands: Candidate[] = [];
      rows.forEach((r, i) => {
        if (!r || typeof r !== "object") return;
        let pts = parsePoints(r.points);
        if (!pts) {
          const x = Number(r.x), y = Number(r.y), w = Number(r.w), h = Number(r.h);
          if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return;
          pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        }
        cands.push({ key: `d${i}`, name: String(r.name || "").trim() || t("Room {n}", { n: i + 1 }), type: typeof r.type === "string" && r.type ? r.type : "room", points: pts, checked: true });
      });
      if (!cands.length) {
        this._mapNotice = { level: "warning", text: t("No rooms detected in that map") };
        return;
      }
      const [dx, dy] = initialOffset(s, floor, cands);
      setReview(s, { floor, entity, candidates: cands, dx, dy });
      s.toast(t("Detected {n} room(s) — review, rename, position, then Save", { n: cands.length }));
      s.canvas?.announce(t("Detected {n} room(s) — review, rename, position, then Save", { n: cands.length }));
    } catch (err) {
      const e = WsError.from("jarvis/segment_floorplan_rooms", err);
      // the backend's messages (needs numpy, no rooms ...) are shown verbatim
      this._mapNotice = { level: e.code === "needs_numpy" || e.code === "no_rooms" ? "warning" : "error", text: e.message };
    } finally {
      this._busy = "";
    }
  }

  private _renderReview() {
    const s = this.store!;
    const r = reviewOf(s)!;
    const u = this._u;
    const areas = s.areaNames();
    const n = r.candidates.filter((c) => c.checked).length;
    const here = r.floor === s.floor;
    const existing = s.rooms(r.floor).length;
    return html`
      <div class="card" role="group" aria-labelledby="imp-rev-h">
        <h4 id="imp-rev-h">${t("Detected rooms")} · ${this._floorName(r.floor)}</h4>
        <p class="hint">${t("Tap a room on the plan to include or skip it; drag any of them to move the whole layout into place. Nothing changes until you add them.")}</p>
        ${here
          ? nothing
          : html`<div class="note"><span>${t("The detected rooms are for {floor}.", { floor: this._floorName(r.floor) })}</span>
              <button type="button" class="jv-btn" @click=${() => s.setFloor(r.floor)}>${t("Show {floor}", { floor: this._floorName(r.floor) })}</button></div>`}
        <ul class="cands">
          ${repeat(
            r.candidates,
            (c) => c.key,
            (c) => {
              const bb = bboxOfPoints(c.points)!;
              return html`<li>
                <input type="checkbox" id=${`cand-${c.key}`} .checked=${live(c.checked)} aria-label=${t("Include {name}", { name: c.name })}
                  @change=${(e: Event) => updateReview(s, (rv) => { const x = rv.candidates.find((k) => k.key === c.key); if (x) x.checked = (e.target as HTMLInputElement).checked; })} />
                <input type="text" .value=${live(c.name)} list="imp-areas" autocomplete="off" aria-label=${t("Name")}
                  @change=${(e: Event) => updateReview(s, (rv) => { const x = rv.candidates.find((k) => k.key === c.key); const v = (e.target as HTMLInputElement).value.trim(); if (x && v) x.name = v; })} />
                <span class="size">${dim(bb.x1 - bb.x0, u)} × ${dim(bb.y1 - bb.y0, u)}</span>
              </li>`;
            },
          )}
        </ul>
        <datalist id="imp-areas">${areas.map((a) => html`<option value=${a}></option>`)}</datalist>
        <div class="actions">
          <button type="button" class="jv-btn primary" ?disabled=${!n} @click=${() => void this._addDetected(false)}>${t("Add selected")}</button>
          ${existing
            ? html`<button type="button" class="jv-btn" ?disabled=${!n} @click=${() => void this._addDetected(true)}>${t("Replace rooms on {floor}", { floor: this._floorName(r.floor) })}</button>`
            : nothing}
          <button type="button" class="jv-btn text" @click=${() => setReview(s, null)}>${t("Cancel")}</button>
        </div>
      </div>
    `;
  }

  private async _addDetected(replace: boolean): Promise<void> {
    const s = this.store;
    const r = reviewOf(s);
    if (!s || !r) return;
    const picked = r.candidates.filter((c) => c.checked);
    if (!picked.length) return;
    const floor = r.floor;
    if (replace) {
      const ok = await confirmDialog({
        heading: t("Replace the {n} rooms on {floor} with the detected ones?", { n: s.rooms(floor).length, floor: this._floorName(floor) }),
        message: t("Openings, cameras and pins stay. Undo brings the old rooms back."),
        confirmLabel: t("Replace"),
        destructive: true,
      });
      if (!ok) return;
    }
    const rooms: Room[] = picked.map((c) => {
      const pts = placedPoints(r, c);
      const bb = bboxOfPoints(pts)!;
      const room: Room = { id: newRoomId(), name: c.name, type: c.type, x: ri(bb.x0), y: ri(bb.y0), w: Math.max(1, ri(bb.x1 - bb.x0)), h: Math.max(1, ri(bb.y1 - bb.y0)), extra: {} };
      if (!isAxisAlignedRect(pts)) room.points = pts;
      return room;
    });
    s.change(replace ? t("Replace rooms on {floor}", { floor: this._floorName(floor) }) : t("Add {n} detected rooms", { n: rooms.length }), (d) => {
      const f = ensureFloor(d, floor);
      if (replace) f.rooms = [];
      f.rooms.push(...rooms);
    });
    setReview(s, null);
    if (s.floor !== floor) s.setFloor(floor);
    s.toast(t("Added {n} rooms", { n: rooms.length }), { label: t("Undo"), run: () => s.undo() });
  }

  // ── Background image (I5-I7 + alignment) ──────────────────────────────
  private _renderBackground() {
    const s = this.store!;
    const floor = s.floor;
    const raw = s.settings.bg[floor];
    const busy = this._busy === "bg";
    const bgStatus = s.settingStatus.floor_plan_bg;
    const opStatus = s.settingStatus.floor_plan_bg_opacity;
    const opacity = this._opacityDraft ?? s.settings.bgOpacity;
    const href = raw ? resolveBackgroundHref(raw, this._hass, () => this.requestUpdate()) : null;
    return html`
      <section class="card" aria-labelledby="imp-bg-h">
        <h3 id="imp-bg-h">${this._icon("mdi:image-outline")}${t("Background image")} · ${this._floorName(floor)}</h3>
        ${href ? html`<img class="thumb" src=${href} alt=${t("Background image of {floor}", { floor: this._floorName(floor) })} @error=${(e: Event) => { (e.target as HTMLElement).hidden = true; }} />` : html`<p class="hint">${t("upload a floor-plan image, then set its opacity here")}</p>`}
        <input class="file" id="imp-bg-file" type="file" accept="image/*" tabindex="-1" aria-hidden="true" @change=${(e: Event) => void this._onBgFile(e)} />
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${busy || bgStatus?.level === "saving"} aria-busy=${String(busy)} @click=${() => this._pickFile("imp-bg-file")}>
            ${this._icon("mdi:upload")}<span>${busy ? t("Saving…") : raw ? t("Replace image…") : t("Choose image…")}</span>
          </button>
          ${raw
            ? html`<button type="button" class="jv-btn text danger-text" ?disabled=${busy || bgStatus?.level === "saving"} @click=${() => void this._removeBg()}>${this._icon("mdi:image-remove")}<span>${t("Remove background")}</span></button>`
            : nothing}
        </div>
        <div class="field">
          <label class="field-label" for="imp-opacity">${t("Opacity")}</label>
          <div class="range-row">
            <input id="imp-opacity" type="range" min="0" max="1" step="0.05" .value=${live(String(opacity))} ?disabled=${!raw}
              aria-valuetext=${`${Math.round(opacity * 100)}%`}
              @input=${(e: Event) => this._previewOpacity(Number((e.target as HTMLInputElement).value))}
              @change=${(e: Event) => void this._writeOpacity(Number((e.target as HTMLInputElement).value))} />
            <output for="imp-opacity">${Math.round(opacity * 100)}%</output>
          </div>
          ${opStatus ? html`<span class="status ${opStatus.level}" role=${opStatus.level === "error" ? "alert" : "status"}>${opStatus.level === "saving" ? t("Saving…") : opStatus.level === "saved" ? t("Saved") : opStatus.message}</span>` : nothing}
        </div>
        ${raw ? this._renderAlign(raw, href) : nothing}
        ${bgStatus?.level === "error" && !this._bgNotice ? jvAlert("error", html`<span>${t("Image import failed — {message}", { message: bgStatus.message || "" })}</span>`) : nothing}
        ${this._notice(this._bgNotice)}
      </section>
    `;
  }

  private _renderAlign(raw: string, href: string | null) {
    const s = this.store!;
    const floor = s.floor;
    const u = this._u;
    const size = imageSize(raw);
    // loaded from the drawable URL (a signed /api/ path), cached under the stored value
    if (size === undefined && href) void ensureImageSize(raw, href).then(() => this.requestUpdate());
    const stored = parseAlign(s.config)[floor];
    const active = aligning(s);
    const a = (active ? alignDraft(s) : null) ?? effectiveAlign(s, floor);
    const saving = this._busy === "align";
    if (!size || !a) {
      return html`<p class="sub">${size === null ? t("This image can't be aligned (its size is unknown).") : t("Loading...")}</p>`;
    }
    const h = (a.w * size.h) / size.w;
    const set = (patch: Partial<BgAlign>) => void this._writeAlign(floor, { ...a, ...patch });
    return html`
      <details class="adv" ?open=${active || !!stored}>
        <summary>${t("Alignment")}${stored ? html` · ${t("calibrated")}` : nothing}</summary>
        <p class="hint">${t("Line the image up with your rooms: drag it on the plan, or type where its top-left corner sits and how wide it is.")}</p>
        <div class="form">
          ${jvNumber({ id: "imp-al-x", label: t("Left"), suffix: unitLabel(u), value: toReal(a.x, u), step: 0.5, disabled: active || saving, onChange: (v) => { if (v != null) set({ x: unitsOf(v, u) }); } })}
          ${jvNumber({ id: "imp-al-y", label: t("Top"), suffix: unitLabel(u), value: toReal(a.y, u), step: 0.5, disabled: active || saving, onChange: (v) => { if (v != null) set({ y: unitsOf(v, u) }); } })}
          ${jvNumber({ id: "imp-al-w", label: t("Image width"), suffix: unitLabel(u), value: toReal(a.w, u), min: 1, step: 0.5, disabled: active || saving, onChange: (v) => { if (v != null && v > 0) set({ w: Math.max(5, unitsOf(v, u)) }); } })}
        </div>
        <p class="sub">${t("Image height: {h}", { h: dim(h, u) })}</p>
        <div class="actions">
          ${active
            ? html`
                <button type="button" class="jv-btn primary" @click=${() => finishAlignTool(s)}>${t("Done")}</button>
                <button type="button" class="jv-btn text" @click=${() => cancelAlignTool(s)}>${t("Cancel")}</button>
              `
            : html`
                <button type="button" class="jv-btn" ?disabled=${saving || !s.canvas} @click=${() => this._startAlign()}>${this._icon("mdi:cursor-move")}<span>${t("Align on the plan")}</span></button>
                ${stored ? html`<button type="button" class="jv-btn text" ?disabled=${saving} @click=${() => void this._writeAlign(floor, null)}>${t("Reset alignment")}</button>` : nothing}
              `}
        </div>
        ${active ? html`<p class="hint" role="status">${t("Drag the image to move it, its corner handle to scale it. Arrow keys nudge, Page Up / Page Down scale, Enter finishes, Escape cancels.")}</p>` : nothing}
      </details>
    `;
  }

  private _startAlign(): void {
    const s = this.store;
    if (!s) return;
    if (!startAlignTool(s, (floor, value) => void this._writeAlign(floor, value))) return;
    try {
      (s.canvas?.shadowRoot?.querySelector("svg") as SVGSVGElement | null)?.focus({ preventScroll: true });
    } catch {
      /* focus is a nicety */
    }
  }

  private async _writeAlign(floor: FloorKey, value: BgAlign | null): Promise<void> {
    const s = this.store;
    if (!s) return;
    this._busy = "align";
    this._bgNotice = null;
    // only this floor's alignment travels: the images stay on the backend
    const ok = await s.writeFloorBackground(floor, { align: roundAlign(value) });
    clearAlignPreview(s);
    this._busy = "";
    if (ok) s.toast(value ? t("Background aligned on {floor}", { floor: this._floorName(floor) }) : t("Background fitted to the rooms again"));
    else this._bgNotice = { level: "error", text: t("Image import failed — {message}", { message: s.settingStatus.floor_plan_bg?.message || "" }) };
  }

  private _previewOpacity(v: number): void {
    if (!Number.isFinite(v) || !this.store) return;
    this._opacityDraft = v;
    setOpacityPreview(this.store, v);
  }

  private async _writeOpacity(v: number): Promise<void> {
    const s = this.store;
    if (!s || !Number.isFinite(v)) return;
    const value = Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
    this._opacityDraft = value;
    await s.writeSetting("floor_plan_bg_opacity", value);
    // the store's optimistic overlay (or the revert after an error) takes over from here
    setOpacityPreview(s, null);
    this._opacityDraft = null;
  }

  private async _onBgFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    const s = this.store;
    if (!s || !file) return;
    const floor = s.floor;
    if (s.settings.bg[floor]) {
      const ok = await confirmDialog({ heading: t("Replace the background of {floor}?", { floor: this._floorName(floor) }), confirmLabel: t("Replace") });
      if (!ok) return;
    }
    this._busy = "bg";
    this._bgNotice = null;
    try {
      // one jarvis/set_floor_background message per floor (HA caps a message at 4 MiB): the image
      // may use what the envelope leaves (base64 is 4/3 of the decoded size), at most BG_MAX_BYTES
      const budget = Math.floor(((WS_FRAME_LIMIT - floorBackgroundFrameBytes(floor, { image: "" }) - 64) * 3) / 4);
      const img = await compressImage(file, budget);
      const ok = await s.writeFloorBackground(floor, { image: img.url });
      if (ok) s.toast(t("Background image set for {floor}", { floor: this._floorName(floor) }));
      else this._bgNotice = { level: "error", text: t("Image import failed — {message}", { message: s.settingStatus.floor_plan_bg?.message || "" }) };
    } catch (err) {
      this._bgNotice =
        err instanceof ImageImportError && err.code === "too_large"
          ? { level: "error", text: t("Image too large after compression — use a smaller image") }
          : { level: "error", text: t("Image import failed — {message}", { message: err instanceof Error ? err.message : String(err) }) };
    } finally {
      this._busy = "";
    }
  }

  private async _removeBg(): Promise<void> {
    const s = this.store;
    if (!s) return;
    const floor = s.floor;
    const ok = await confirmDialog({ heading: t("Remove the background image of {floor}?", { floor: this._floorName(floor) }), confirmLabel: t("Remove"), destructive: true });
    if (!ok) return;
    if (aligning(s)) cancelAlignTool(s);
    this._busy = "bg";
    this._bgNotice = null;
    const done = await s.writeFloorBackground(floor, { image: null, align: null });
    this._busy = "";
    if (done) s.toast(t("Background image removed from {floor}", { floor: this._floorName(floor) }));
    else this._bgNotice = { level: "error", text: t("Image import failed — {message}", { message: s.settingStatus.floor_plan_bg?.message || "" }) };
  }

  // ── SweetHome3D (I8-I9) ───────────────────────────────────────────────
  private _shMessage(err: unknown): Notice {
    if (err instanceof Sh3dError) {
      switch (err.code) {
        case "no_inflate":
          return { level: "warning", text: t("This browser can't unpack .sh3d files — export Home.xml from SweetHome3D or run scripts/sweethome3d_to_floorplan.py") };
        case "legacy_binary":
          return { level: "error", text: t("This .sh3d was saved in SweetHome3D's legacy binary format. Turn on File → Preferences → \"Save homes in XML format\", re-save, and try again.") };
        case "no_rooms":
          return { level: "error", text: t("No room polygons found — draw rooms in SweetHome3D (Plan → Create rooms) and use the native .sh3d file.") };
        default:
          return { level: "error", text: t("Couldn't read that file — {message}", { message: err.message }) };
      }
    }
    return { level: "error", text: t("Couldn't read that file — {message}", { message: err instanceof Error ? err.message : String(err) }) };
  }

  private async _onShFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    this._sh = null;
    this._shNotice = null;
    this._shReading = true;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const home = await readSweetHome(bytes);
      if (!home.rooms.some((r) => r.points.length >= 3)) throw new Sh3dError("no_rooms", "no room polygons");
      this._sh = { file: file.name, home, floors: defaultLevelFloors(home) };
    } catch (err) {
      this._shNotice = this._shMessage(err);
    } finally {
      this._shReading = false;
    }
  }

  private _shConverted(): Record<FloorKey, NewRoom[]> {
    const sh = this._sh;
    if (!sh) return {};
    return convertSweetHome(sh.home, { scale: this._shScale, rotate: this._shRotate, mirror: this._shMirror, origin: this._shOrigin, floors: sh.floors });
  }

  private _floorChoices(): SelectOption[] {
    const s = this.store!;
    const keys: FloorKey[] = CANONICAL_FLOORS.map((f) => f.key);
    for (const f of s.floors) if (!keys.includes(f.key)) keys.push(f.key);
    return [...keys.map((k) => ({ value: k, label: this._floorName(k) })), { value: "", label: t("— none —") }];
  }

  private _renderSweetHome() {
    const sh = this._sh;
    const u = this._u;
    let body: TemplateResult | typeof nothing = nothing;
    if (sh) {
      const levels = levelsWithRooms(sh.home);
      const polys = sh.home.rooms.filter((r) => r.points.length >= 3).length;
      const plan = this._shConverted();
      const n = countRooms(plan);
      const all = Object.values(plan).flat();
      const bb = bboxOfPoints(all.flatMap((r): Pt2[] => [[r.x, r.y], [r.x + r.w, r.y + r.h]]));
      const perFloor = Object.keys(plan).map((k) => `${this._floorName(k)}: ${plan[k].length}`).join(" · ");
      const choices = this._floorChoices();
      body = html`
        <p class="sub">${sh.file} — ${t("{n} rooms on {m} levels", { n: polys, m: Math.max(1, sh.home.levels.length) })}</p>
        ${levels.length
          ? html`<div class="levels">
              ${levels.map((l) =>
                jvSelect({
                  id: `sh-level-${l.id || "none"}`,
                  label: t("Level {name} →", { name: l.name || "—" }),
                  value: sh.floors[l.id] ?? "",
                  options: choices,
                  onChange: (v) => {
                    this._sh = { ...sh, floors: { ...sh.floors, [l.id]: v } };
                  },
                }),
              )}
            </div>`
          : nothing}
        <div class="form">
          <div>
            ${jvNumber({ id: "sh-scale", label: t("Scale"), value: this._shScale, min: 0.0001, step: "any", onChange: (v) => { this._shScale = v != null && v > 0 ? v : SH3D_REAL_SCALE; } })}
            <button type="button" class="jv-btn text" @click=${() => { this._shScale = REAL_SCALE_SHOWN; }}>${t("Real size (cm → plan)")}</button>
          </div>
          ${jvSelect({
            id: "sh-rotate",
            label: t("Rotate"),
            value: String(this._shRotate),
            options: [0, 90, 180, 270].map((d) => ({ value: String(d), label: `${d}°` })),
            onChange: (v) => {
              this._shRotate = Number(v) as Rotation;
            },
          })}
          ${jvSelect({
            id: "sh-mirror",
            label: t("Mirror"),
            value: this._shMirror,
            options: [
              { value: "none", label: t("None") },
              { value: "x", label: t("Left/right") },
              { value: "y", label: t("Front/back") },
            ],
            onChange: (v) => {
              this._shMirror = (v === "x" || v === "y" ? v : "none") as Mirror;
            },
          })}
          <div class="wide">${jvSwitch({ id: "sh-origin", label: t("Move to origin"), checked: this._shOrigin, onChange: (v) => { this._shOrigin = v; } })}</div>
        </div>
        <p class="sub" role="status">
          ${n ? html`${t("{n} rooms to import", { n })} · ${perFloor}${bb ? html` · ${dim(bb.x1 - bb.x0, u)} × ${dim(bb.y1 - bb.y0, u)}` : nothing}` : t("No rooms to import with this level mapping.")}
        </p>
        <div class="actions">
          <button type="button" class="jv-btn primary" ?disabled=${!n} @click=${() => void this._applySh(false)}>${t("Add to plan")}</button>
          <button type="button" class="jv-btn" ?disabled=${!n} @click=${() => void this._applySh(true)}>${t("Replace plan")}</button>
          <button type="button" class="jv-btn text" @click=${() => { this._sh = null; }}>${t("Cancel")}</button>
        </div>
      `;
    }
    return html`
      <section class="card" aria-labelledby="imp-sh-h">
        <h3 id="imp-sh-h">${this._icon("mdi:home-import-outline")}${t("SweetHome3D")}</h3>
        <p class="hint">${t("Choose a .sh3d, Home.xml or JSON export")}</p>
        <input class="file" id="imp-sh-file" type="file" accept=".sh3d,.xml,.json,application/xml,text/xml,application/json" tabindex="-1" aria-hidden="true" @change=${(e: Event) => void this._onShFile(e)} />
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${this._shReading} aria-busy=${String(this._shReading)} @click=${() => this._pickFile("imp-sh-file")}>
            ${this._icon("mdi:file-upload-outline")}<span>${this._shReading ? t("Reading…") : t("Choose file…")}</span>
          </button>
        </div>
        ${this._notice(this._shNotice)}
        ${body}
      </section>
    `;
  }

  private async _applySh(replace: boolean): Promise<void> {
    const s = this.store;
    if (!s || !this._sh) return;
    const plan = this._shConverted();
    const n = countRooms(plan);
    if (!n) {
      this._shNotice = this._shMessage(new Sh3dError("no_rooms", "no rooms"));
      return;
    }
    if (replace) {
      const ok = await confirmDialog({ heading: t("Replace every room on every floor?"), message: t("Openings, cameras and pins stay. Undo brings the old rooms back."), confirmLabel: t("Replace plan"), destructive: true });
      if (!ok) return;
    }
    s.change(t("Import {n} rooms from SweetHome3D", { n }), (d) => {
      if (replace) for (const f of d.floors) f.rooms = [];
      for (const key of Object.keys(plan)) {
        const f = ensureFloor(d, key);
        for (const r of plan[key]) {
          const room: Room = { id: newRoomId(), name: r.name, type: r.type, x: r.x, y: r.y, w: r.w, h: r.h, extra: {} };
          if (r.points) room.points = r.points.map((p): Pt2 => [p[0], p[1]]);
          f.rooms.push(room);
        }
      }
    });
    const order = [...CANONICAL_FLOORS.map((f) => f.key), ...Object.keys(plan)];
    const first = order.find((k) => plan[k]?.length);
    if (first && first !== s.floor) s.setFloor(first);
    s.canvas?.fit();
    this._sh = null;
    s.toast(t("Imported {n} rooms — review, then Save", { n }), { label: t("Undo"), run: () => s.undo() });
  }

  // ── Plan file (I10-I11) ───────────────────────────────────────────────
  private _renderPlanFile() {
    return html`
      <section class="card" aria-labelledby="imp-file-h">
        <h3 id="imp-file-h">${this._icon("mdi:code-json")}${t("Plan file")}</h3>
        ${jvSwitch({ id: "imp-include-bg", label: t("Include background images"), checked: this._includeBg, onChange: (v) => { this._includeBg = v; } })}
        <input class="file" id="imp-plan-file" type="file" accept=".json,application/json" tabindex="-1" aria-hidden="true" @change=${(e: Event) => void this._onPlanFile(e)} />
        <div class="actions">
          <button type="button" class="jv-btn" @click=${() => this._export()}>${this._icon("mdi:download")}<span>${t("Export JSON")}</span></button>
          <button type="button" class="jv-btn" @click=${() => this._pickFile("imp-plan-file")}>${this._icon("mdi:upload")}<span>${t("Import JSON…")}</span></button>
        </div>
        ${this._notice(this._planNotice)}
      </section>
    `;
  }

  private _export(): void {
    const s = this.store;
    if (!s) return;
    this._planNotice = null;
    try {
      downloadText(PLAN_FILE_NAME, JSON.stringify(buildBundle(s, this._includeBg), null, 2) + "\n");
      s.toast(t("Floor plan exported"));
    } catch (err) {
      this._planNotice = { level: "error", text: t("Export failed — {message}", { message: err instanceof Error ? err.message : String(err) }) };
    }
  }

  private async _onPlanFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    const s = this.store;
    if (!s || !file) return;
    this._planNotice = null;
    let pf;
    try {
      pf = parsePlanFile(await file.text());
    } catch (err) {
      const reason = err instanceof PlanFileError ? t(err.reason) : err instanceof Error ? err.message : String(err);
      this._planNotice = { level: "error", text: t("Invalid layout file — {reason}", { reason }) };
      return;
    }
    const plan = pf;
    if (Object.keys(plan.sections).length) {
      s.change(t("Import layout"), (d) => {
        applyPlanFile(d, plan, s.config);
      });
      if (!s.floors.some((f) => f.key === s.floor) && s.floors[0]) s.setFloor(s.floors[0].key);
      s.canvas?.fit();
      s.toast(t("Layout imported — review, then Save"), { label: t("Undo"), run: () => s.undo() });
    }
    // immediate-save sections: offered, never applied silently
    const cur = s.settings;
    const unitsDiffer = !!plan.units && plan.units !== cur.units;
    const doorsDiffer = !!plan.doorMapping && JSON.stringify(plan.doorMapping) !== JSON.stringify(cur.doorMapping);
    if (unitsDiffer || doorsDiffer) {
      const ok = await confirmDialog({ heading: t("Also apply the units and door mapping from the file? They save immediately."), confirmLabel: t("Apply") });
      if (ok) {
        if (unitsDiffer) await s.writeSetting("floor_plan_units", plan.units);
        if (doorsDiffer) await s.writeSetting("door_mapping", plan.doorMapping);
      }
    }
    if (plan.backgrounds) {
      // only inline images (data:image/, <= 1.5 MB each) of this home's floors, and only their alignments:
      // the confirm count is exactly what gets written
      const floorKeys = new Set<FloorKey>([...CANONICAL_FLOORS.map((f) => f.key), ...s.floors.map((f) => f.key)]);
      const pick = importableBackgrounds(plan.backgrounds, floorKeys);
      const n = Object.keys(pick.images).length;
      if (pick.skipped) this._planNotice = { level: "warning", text: t("Skipped {n} background entries that are not inline floor images of this home", { n: pick.skipped }) };
      if (n) {
        const ok = await confirmDialog({ heading: t("Also import {n} background images? They save immediately.", { n }), confirmLabel: t("Import") });
        if (ok) {
          // one message per floor: the file's image replaces the current one, its alignment (if any)
          // replaces that floor's; a failed floor does not stop the others, and is reported
          const failed: FloorKey[] = [];
          let message = "";
          for (const [floor, image] of Object.entries(pick.images)) {
            const align = pick.align[floor];
            const done = await s.writeFloorBackground(floor, align ? { image, align } : { image });
            if (!done) {
              failed.push(floor);
              message ||= s.settingStatus.floor_plan_bg?.message || "";
            }
          }
          if (failed.length === n) this._planNotice = { level: "error", text: t("Image import failed — {message}", { message }) };
          else if (failed.length)
            this._planNotice = {
              level: "error",
              text: t("Imported {done} of {n} background images; {floors} failed — {message}", { done: n - failed.length, n, floors: failed.map((f) => this._floorName(f)).join(", "), message }),
            };
        }
      }
    }
  }

  // ── Reset (I12) ───────────────────────────────────────────────────────
  private _renderReset() {
    const s = this.store!;
    const busy = this._busy === "reset";
    return html`
      <section class="card" aria-labelledby="imp-reset-h">
        <h3 id="imp-reset-h">${this._icon("mdi:restore")}${t("Reset Default")}</h3>
        <p class="hint">${s.dirty ? t("Save or discard your unsaved changes first.") : t("Replaces your rooms with the sample home. Openings, cameras and pins stay.")}</p>
        <div class="actions">
          <button type="button" class="jv-btn danger" ?disabled=${busy || s.dirty || !!this._busy} aria-busy=${String(busy)} @click=${() => void this._reset()}>${busy ? t("Saving…") : t("Reset Default")}</button>
        </div>
        ${this._notice(this._resetNotice)}
      </section>
    `;
  }

  private async _reset(): Promise<void> {
    const s = this.store;
    if (!s || s.dirty || this._busy) return;
    const ok = await confirmDialog({
      heading: t("Reset the floor plan to the sample home? Your rooms are removed; openings, cameras and pins stay."),
      confirmLabel: t("Reset Default"),
      destructive: true,
    });
    if (!ok) return;
    this._busy = "reset";
    this._resetNotice = null;
    try {
      await ws(this._hass, "jarvis/update_config", { key: "floor_plan_rooms", value: {} });
      s.toast(t("Floor plan reset to the sample home"));
      s.refresh(); // the next snapshot carries floor_plan_rooms = {} -> the sample plan (the clean doc follows it)
    } catch (err) {
      this._resetNotice = { level: "error", text: t("Save failed — {message}", { message: errMessage("jarvis/update_config", err) }) };
    } finally {
      this._busy = "";
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-import": JarvisEditorImport;
  }
}
