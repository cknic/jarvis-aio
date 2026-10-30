/**
 * <jarvis-plan-editor> - the floor-plan editor shell, mounted by the
 * Residence view at /jarvis/residence/editor[/<tab>].
 *
 * Owns: the EditorStore (working copy, history, dirty state, save), the
 * header row (Back, title, dirty badge, floor pills, undo / redo, snap, fit,
 * preview, units, Save / Discard), the banners (sample home, remote change,
 * save error), the Plan card (sub-tab chips + <jv-plan-canvas> + hint), the
 * side card that hosts the active sub-tab element, the collapsible 3D
 * preview rendered from the SERIALISED working copy, the toasts, the keyboard
 * shortcuts and the leave guards (beforeunload while dirty, confirm on Back).
 *
 * The sub-tabs are separate elements (jarvis-editor-rooms, -openings, -doors,
 * -pins, -import) that receive {store, canvas, hass, narrow}; see ./README.md.
 */
import { html, css, nothing, type PropertyValues } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { JarvisView } from "../../view-base";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { haDefined, watchDefinitions } from "../../../ha";
import { keepRowFocus, type RowFocus } from "../../../focus";
import { confirmDialog } from "../../../components";
import "../../../components";
import { fixedBox, renderSVG, type Box } from "../house3d";
import { buildPalette, paletteKey } from "../palette";
import { garageBays, houseSpec } from "../plan";
import { EditorStore, EDITOR_TABS, isEditorTab, type EditorTab } from "./store";
import { docElementsToFeet, docToFeet, rendererFloor, type FloorKey, type Units } from "./model";
import { isTouchFirst, type JvPlanCanvas } from "./canvas";
import "./canvas";
import "./tabs";

const PRESETS: ReadonlyArray<{ label: string; theta: number }> = [
  { label: "FRONT", theta: 0 },
  { label: "RIGHT", theta: 90 },
  { label: "REAR", theta: 180 },
  { label: "LEFT", theta: 270 },
  { label: "ISO", theta: 35 },
];
const PREVIEW_LS_KEY = "jarvis.editor.preview";
const PREVIEW_DEBOUNCE_MS = 120;
const HA_TAGS = ["ha-icon", "ha-alert", "ha-icon-button"];
/** A toast's Undo / Dismiss takes the toast away: focus goes to the next / previous toast, else the current editor tab. */
const TOAST_FOCUS: RowFocus = { row: ".toasts > .toast", key: "data-toast", control: "[data-dismiss]", fallback: ['[role="tab"][aria-selected="true"]'] };

@customElement("jarvis-plan-editor")
export class JarvisPlanEditor extends JarvisView {
  readonly store = new EditorStore();

  @state() private _previewOpen = false;
  @state() private _previewAll = false;
  @state() private _preset: number | null = 35;
  @state() private _dragging = false;
  @state() private _canvasEl: JvPlanCanvas | null = null;
  @state() private _previewVersion = 0;

  @query("jv-plan-canvas") private _canvasQuery?: JvPlanCanvas;

  private _theta = 35;
  private _raf = 0;
  private _drag: { id: number; x: number } | null = null;
  private _unsub: (() => void) | null = null;
  private _previewTimer: ReturnType<typeof setTimeout> | null = null;
  /** `${_previewVersion}|floor|palette` the preview's plan inputs were last built for */
  private _inputsKey = "";
  private _inputs: { spec: ReturnType<typeof houseSpec>; plan: ReturnType<typeof docToFeet>; elements: ReturnType<typeof docElementsToFeet>; garage: ReturnType<typeof garageBays>; floor: ReturnType<typeof rendererFloor>; boxKey: string } | null = null;
  private _boxKey = "";
  private _box: Box | undefined;
  private _svgKey = "";
  private _svg = "";
  private _previewError: string | null = null;

  constructor() {
    super();
    this.store.host = this;
    let open: boolean | null = null;
    try {
      const v = localStorage.getItem(PREVIEW_LS_KEY);
      if (v === "1") open = true;
      else if (v === "0") open = false;
    } catch {
      /* storage unavailable */
    }
    if (open == null) {
      try {
        open = typeof matchMedia === "function" ? matchMedia("(min-width: 1100px)").matches : false;
      } catch {
        open = false;
      }
    }
    this._previewOpen = open;
  }

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-2) 0;
        margin-bottom: var(--jv-space-2);
        position: sticky;
        top: var(--jv-sticky-top, 0px);
        z-index: 2;
        background: var(--jv-bg);
      }
      :host([narrow]) .head {
        position: static;
      }
      .head .jv-title {
        margin: 0;
        white-space: nowrap;
      }
      .spacer {
        flex: 1 1 auto;
      }
      /* keeps its box so the header never reflows (and the canvas never jumps) when the plan becomes dirty */
      .ghost {
        visibility: hidden;
      }
      .back {
        padding-left: var(--jv-space-2);
        padding-right: var(--jv-space-2);
      }
      .group {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1);
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      }
      .pill,
      .chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color var(--jv-ease);
      }
      .pill:hover,
      .chip:hover {
        background: var(--jv-hover);
      }
      .pill[aria-pressed="true"],
      .chip[aria-selected="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .pill ha-icon {
        --mdc-icon-size: 16px;
        color: var(--jv-warn-text);
      }
      .tools .jv-btn {
        min-height: 36px;
        padding: 0 var(--jv-space-3);
      }
      .tools .jv-icon-btn {
        width: 36px;
        height: 36px;
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface);
      }
      .tools .jv-icon-btn[disabled] {
        opacity: 0.45;
        cursor: default;
      }
      .tools .jv-icon-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .tools ha-icon {
        --mdc-icon-size: 20px;
      }
      .editor-grid .plan,
      .editor-grid .preview {
        grid-column: 1 / -1;
      }
      @media (min-width: 1100px) {
        .editor-grid .plan {
          grid-column: span 2;
        }
      }
      .tabs {
        display: flex;
        gap: var(--jv-space-1);
        overflow-x: auto;
        padding: var(--jv-space-1) 0 var(--jv-space-2);
        margin-bottom: var(--jv-space-2);
        scrollbar-width: thin;
      }
      .tabs .chip {
        flex: none;
      }
      .tabs .chip:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .canvas-wrap {
        position: relative;
      }
      .empty-hint {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .empty-hint jv-empty {
        background: var(--jv-surface);
        border-radius: var(--jv-radius-sm);
        pointer-events: none;
      }
      .hint {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .alert {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-4);
        margin-bottom: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        color: var(--jv-text);
      }
      .alert.info {
        background: var(--jv-info-soft);
      }
      .alert.warning {
        background: var(--jv-warn-soft);
      }
      .alert.error {
        background: var(--jv-danger-soft);
      }
      .alert > span {
        flex: 1 1 auto;
        min-width: 0;
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-3);
      }
      .alert-actions {
        display: inline-flex;
        gap: var(--jv-space-2);
      }
      .toasts {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        margin-bottom: var(--jv-space-3);
      }
      .toast {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        padding: var(--jv-space-1) var(--jv-space-2) var(--jv-space-1) var(--jv-space-3);
        background: var(--jv-surface-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        font-size: var(--jv-font-size-s);
      }
      .toast > span {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      /* narrow only: sticks ABOVE the panel's bottom nav (56 px items + its 1 px border + the safe area),
         which is sticky at bottom 0 in the same scroller and would cover it; it carries the toasts too */
      .sticky-bar {
        position: sticky;
        bottom: calc(57px + env(safe-area-inset-bottom, 0px));
        z-index: 2;
        padding: var(--jv-space-2) 0;
        margin-top: var(--jv-space-3);
        background: var(--jv-bg);
        border-top: 1px solid var(--jv-divider);
      }
      .sticky-bar .toasts {
        margin-bottom: var(--jv-space-2);
      }
      .sticky-bar .toasts:empty {
        margin-bottom: 0;
      }
      .sticky-bar .row {
        display: flex;
        gap: var(--jv-space-2);
      }
      .sticky-bar .primary {
        flex: 1 1 auto;
      }
      details.warnings {
        margin-bottom: var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      details.warnings summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
      }
      /* preview */
      .preview-controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2) var(--jv-space-4);
        align-items: center;
        margin-bottom: var(--jv-space-3);
      }
      .scene {
        position: relative;
        height: clamp(280px, 50vh, 480px);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
        border: var(--jv-border-width) solid var(--jv-border);
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }
      .scene.dragging {
        cursor: grabbing;
      }
      .scene svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .scene svg text {
        font-family: var(--jv-font-code);
      }
      .visually-hidden {
        position: absolute;
      }
    `,
  ];

  // ── lifecycle ─────────────────────────────────────────────────────────
  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, [...HA_TAGS, ...EDITOR_TABS.map((tab) => tab.element)]);
    this._unsub = this.store.subscribe(() => this._onStore());
    this.addEventListener("keydown", this._onKey);
    window.addEventListener("beforeunload", this._onBeforeUnload);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsub?.();
    this._unsub = null;
    this.removeEventListener("keydown", this._onKey);
    window.removeEventListener("beforeunload", this._onBeforeUnload);
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (this._previewTimer) clearTimeout(this._previewTimer);
    this._previewTimer = null;
    this.store.dispose();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass")) {
      this.store.hass = this.hass;
      // open / closed states and garage bays come from hass: refresh the preview, debounced like a plan change
      this._schedulePreview();
    }
    if (changed.has("data")) this.store.load(this.data);
    if (changed.has("route")) this.store.setTab(this._tabFromRoute());
  }

  protected override updated(): void {
    const c = this._canvasQuery ?? null;
    if (c !== this._canvasEl) this._canvasEl = c;
  }

  private _onStore(): void {
    this._schedulePreview();
    this.requestUpdate();
  }

  /**
   * The 3D preview is the expensive part: its plan inputs (and fixedBox) are rebuilt only when
   * _previewVersion moves, 120 ms after the last change - renders in between (every drag frame)
   * reuse the last SVG.
   */
  private _schedulePreview(): void {
    if (!this._previewOpen) {
      this._inputsKey = ""; // rebuilt when the preview opens
      return;
    }
    if (this._previewTimer) clearTimeout(this._previewTimer);
    this._previewTimer = setTimeout(() => {
      this._previewTimer = null;
      this._previewVersion += 1;
    }, PREVIEW_DEBOUNCE_MS);
  }

  private _tabFromRoute(): EditorTab {
    const parts = this.subPath.split("/").filter(Boolean);
    const tab = parts[0] === "editor" ? parts[1] : undefined;
    return isEditorTab(tab) ? tab : "rooms";
  }

  // ── guards & shortcuts ────────────────────────────────────────────────
  private readonly _onBeforeUnload = (e: BeforeUnloadEvent): void => {
    if (!this.store.dirty) return;
    e.preventDefault();
    e.returnValue = "";
  };

  private readonly _onKey = (e: KeyboardEvent): void => {
    const target = e.composedPath()[0] as HTMLElement | undefined;
    const tag = target?.tagName?.toLowerCase() || "";
    if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable || tag.startsWith("ha-textfield") || tag.startsWith("ha-select")) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === "s") {
      e.preventDefault();
      void this._save();
    } else if (mod && key === "z") {
      e.preventDefault();
      if (e.shiftKey) this.store.redo();
      else this.store.undo();
    } else if (mod && key === "y") {
      e.preventDefault();
      this.store.redo();
    } else if (e.altKey && !mod) {
      // e.code: on macOS Option+1 types "¡", so e.key never is a digit there
      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || "")?.[1] ?? (/^[1-9]$/.test(e.key) ? e.key : null);
      const f = digit ? this.store.floors[Number(digit) - 1] : undefined;
      if (f) {
        e.preventDefault();
        this.store.setFloor(f.key);
      }
    }
  };

  // ── actions ───────────────────────────────────────────────────────────
  private async _back(): Promise<void> {
    if (this.store.dirty) {
      const ok = await confirmDialog({ heading: t("Leave without saving?"), confirmLabel: t("Leave"), cancelLabel: t("Keep editing"), destructive: true });
      if (!ok) return;
    }
    this.navigate("residence");
  }

  private async _save(): Promise<void> {
    const s = this.store;
    if (!s.dirty || s.saving) return;
    const res = await s.save();
    if (res.ok) s.toast(t("Floor plan saved"));
  }

  private async _discard(): Promise<void> {
    const ok = await confirmDialog({ heading: t("Discard unsaved changes?"), confirmLabel: t("Discard"), destructive: true });
    if (!ok) return;
    this.store.discard();
    this.store.toast(t("Changes discarded"));
  }

  private async _reloadRemote(): Promise<void> {
    if (this.store.dirty) {
      const ok = await confirmDialog({ heading: t("Discard unsaved changes?"), confirmLabel: t("Discard"), destructive: true });
      if (!ok) return;
    }
    this.store.adoptRemote();
  }

  private _setFloor(key: FloorKey): void {
    this.store.setFloor(key);
  }

  private async _setUnits(u: Units): Promise<void> {
    if (u === this.store.settings.units) return;
    const ok = await this.store.writeSetting("floor_plan_units", u);
    if (ok) this.store.toast(u === "metric" ? t("Units: Metric (m)") : t("Units: Imperial (ft)"));
  }

  private _togglePreview(): void {
    this._previewOpen = !this._previewOpen;
    try {
      localStorage.setItem(PREVIEW_LS_KEY, this._previewOpen ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }

  private _selectTab(id: EditorTab): void {
    this.navigate("residence", `editor/${id}`);
  }

  private _onTabsKey(e: KeyboardEvent): void {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    const idx = EDITOR_TABS.findIndex((tab) => tab.id === this.store.tab);
    const n = EDITOR_TABS.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (idx + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    e.preventDefault();
    this._selectTab(EDITOR_TABS[next].id);
    this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>(`#tab-${EDITOR_TABS[next].id}`)?.focus());
  }

  // ── 3D preview ────────────────────────────────────────────────────────
  private _setPreset(theta: number): void {
    this._theta = theta;
    this._preset = theta;
    this.requestUpdate();
  }
  private _rotateBy(deg: number): void {
    this._theta -= deg;
    this._preset = null;
    if (!this._raf) {
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        this.requestUpdate();
      });
    }
  }
  private _onScenePointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this._drag = { id: e.pointerId, x: e.clientX };
    this._dragging = true;
    try {
      (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    } catch {
      /* not supported */
    }
  }
  private _onScenePointerMove(e: PointerEvent): void {
    if (!this._drag || e.pointerId !== this._drag.id) return;
    const dx = e.clientX - this._drag.x;
    this._drag.x = e.clientX;
    if (dx) this._rotateBy(dx * 0.6);
  }
  private _onScenePointerUp(e: PointerEvent): void {
    if (!this._drag || e.pointerId !== this._drag.id) return;
    this._drag = null;
    this._dragging = false;
  }
  private _onSceneKey(e: KeyboardEvent): void {
    if (e.key === "ArrowLeft") this._rotateBy(-15);
    else if (e.key === "ArrowRight") this._rotateBy(15);
    else if (e.key === "Home") this._setPreset(35);
    else return;
    e.preventDefault();
  }

  /** The preview SVG from the SERIALISED working copy (memoised; the model build is cached per plan/spec). */
  private _previewSvg(): string {
    const s = this.store;
    try {
      const floorKey = this._previewAll ? "all" : rendererFloor(s.floor);
      const inputsKey = `${this._previewVersion}|${floorKey}`;
      if (inputsKey !== this._inputsKey || !this._inputs) {
        // serialising the doc + JSON keys is what a drag frame must not pay for: once per debounced version
        this._inputsKey = inputsKey;
        const cfg = s.config;
        const spec = houseSpec(cfg), plan = docToFeet(s.doc), elements = docElementsToFeet(s.doc, this.hass), garage = garageBays(cfg, this.hass);
        const boxKey = [floorKey, JSON.stringify(spec), JSON.stringify(elements), JSON.stringify(garage), JSON.stringify(plan)].join("|");
        this._inputs = { spec, plan, elements, garage, floor: floorKey, boxKey };
      }
      const { spec, plan, elements, garage, floor, boxKey } = this._inputs;
      const palette = buildPalette(this);
      if (boxKey !== this._boxKey) {
        this._box = fixedBox({ floor, spec, plan, elements, garage, palette });
        this._boxKey = boxKey;
      }
      const key = [this._theta.toFixed(1), boxKey, paletteKey(this)].join("|");
      if (key !== this._svgKey) {
        this._svg = renderSVG({ theta: this._theta, floor, lit: {}, box: this._box, spec, plan, elements, garage, palette, idPrefix: "j3de", animate: false });
        this._svgKey = key;
      }
      this._previewError = null;
    } catch (err) {
      this._previewError = err instanceof Error ? err.message : String(err);
    }
    return this._svg;
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    const s = this.store;
    if (!this.data || !s.loaded) {
      return html`
        <div class="jv-grid editor-grid">
          <jv-section class="plan" .heading=${t("Plan")} icon="mdi:floor-plan" loading>
            <jv-empty kind="loading" .message=${t("Loading...")}></jv-empty>
          </jv-section>
          <jv-section .heading=${t("Rooms")} loading>
            <jv-empty kind="loading" compact .message=${t("Loading...")}></jv-empty>
          </jv-section>
        </div>
      `;
    }
    const tab = EDITOR_TABS.find((x) => x.id === s.tab) ?? EDITOR_TABS[0];
    return html`
      ${this._renderHeader()}
      ${this._renderBanners()}
      ${this.narrow ? nothing : this._renderToasts()}
      <div class="jv-grid editor-grid">
        <jv-section class="plan" .heading=${t("Plan")} .subheading=${t(s.floorLabel())} icon="mdi:floor-plan">
          ${this._renderTabs()}
          <div class="canvas-wrap">
            <jv-plan-canvas .store=${s} .hass=${this.hass} ?narrow=${this.narrow}></jv-plan-canvas>
            ${s.rooms().length === 0
              ? html`<div class="empty-hint"><jv-empty compact icon="mdi:floor-plan" .message=${t("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty></div>`
              : nothing}
          </div>
          <p class="hint">${isTouchFirst(this.narrow) ? t("Drag to move · corner handle to resize · long-press for more") : t("Drag to move · corner handle to resize · right-click for more")}</p>
        </jv-section>
        <jv-section class="side" .heading=${t(tab.label)} icon=${tab.icon}>
          <div role="tabpanel" id="tabpanel" aria-labelledby=${`tab-${tab.id}`}>${this._renderTab(tab)}</div>
        </jv-section>
        ${this._renderPreview()}
      </div>
      ${this.narrow ? this._renderStickyBar() : nothing}
    `;
  }

  private _icon(icon: string, fallback: string) {
    return haDefined("ha-icon") ? html`<ha-icon icon=${icon}></ha-icon>` : html`<span aria-hidden="true">${fallback}</span>`;
  }

  private _renderHeader() {
    const s = this.store;
    const units = s.settings.units;
    const canvas = this._canvasEl;
    const unitsBusy = s.settingStatus.floor_plan_units?.level === "saving";
    return html`
      <div class="head">
        <button type="button" class="jv-btn text back" @click=${this._back}>← ${t("Residence")}</button>
        <h2 class="jv-title">${t("Floor Plan Editor")}</h2>
        <jv-state-badge class=${s.dirty ? "" : "ghost"} level="accent" .label=${t("Unsaved changes")}></jv-state-badge>
        <span class="spacer"></span>
        <fieldset class="group" aria-label=${t("Floor")}>
          ${s.floors.map((f) => {
            const hidden = s.floorHidden(f.key);
            return html`<button type="button" class="pill jv-hit" aria-pressed=${String(s.floor === f.key)} @click=${() => this._setFloor(f.key)}>
              ${t(s.floorLabel(f.key))}
              ${hidden ? html`<span title=${t("Hidden on the Residence tab")}>${this._icon("mdi:eye-off-outline", "·")}<span class="visually-hidden">${t("Hidden on the Residence tab")}</span></span>` : nothing}
            </button>`;
          })}
        </fieldset>
        ${this.narrow
          ? nothing
          : html`
              <div class="group tools">
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${t("Undo")} title=${s.undoLabel ? t("Undo: {label}", { label: s.undoLabel }) : t("Undo")} ?disabled=${!s.canUndo} @click=${() => s.undo()}>${this._icon("mdi:undo", "↶")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${t("Redo")} title=${s.redoLabel ? t("Redo: {label}", { label: s.redoLabel }) : t("Redo")} ?disabled=${!s.canRedo} @click=${() => s.redo()}>${this._icon("mdi:redo", "↷")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${t("Snap to grid")} title=${t("Snap to grid")} aria-pressed=${String(canvas?.snap ?? true)} @click=${() => { canvas?.setSnap(!canvas.snap); this.requestUpdate(); }}>${this._icon("mdi:magnet", "⌗")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${t("Fit")} title=${t("Fit")} @click=${() => canvas?.fit()}>${this._icon("mdi:fit-to-screen-outline", "⤢")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${t("Preview")} title=${t("Preview")} aria-pressed=${String(this._previewOpen)} @click=${this._togglePreview}>${this._icon("mdi:cube-outline", "3D")}</button>
                <fieldset class="group" aria-label=${t("Units")}>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(units === "imperial")} ?disabled=${unitsBusy} @click=${() => this._setUnits("imperial")}>${t("Imperial (ft)")}</button>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(units === "metric")} ?disabled=${unitsBusy} @click=${() => this._setUnits("metric")}>${t("Metric (m)")}</button>
                </fieldset>
                <button type="button" class="jv-btn text jv-hit ${s.dirty ? "" : "ghost"}" ?disabled=${!s.dirty} @click=${this._discard}>${t("Discard")}</button>
                <button type="button" class="jv-btn primary jv-hit" ?disabled=${!s.dirty || s.saving} @click=${this._save}>${s.saving ? t("Saving…") : t("Save Layout")}</button>
              </div>
            `}
      </div>
    `;
  }

  private _alert(type: "info" | "warning" | "error", body: unknown) {
    if (haDefined("ha-alert")) return html`<ha-alert alert-type=${type}>${body}</ha-alert>`;
    return html`<div class="alert ${type}" role=${type === "error" ? "alert" : "status"}>${body}</div>`;
  }

  private _renderBanners() {
    const s = this.store;
    return html`
      ${s.saveError
        ? this._alert(
            "error",
            html`<span>${s.saveErrorCode === "unauthorized" ? t("Administrator access is required to edit the floor plan.") : t("Save failed — {message}", { message: s.saveError })}</span>
              <span class="alert-actions">
                <button type="button" class="jv-btn" ?disabled=${s.saving} @click=${this._save}>${t("Retry")}</button>
                <button type="button" class="jv-btn text" @click=${() => s.clearSaveError()}>${t("Dismiss")}</button>
              </span>`,
          )
        : nothing}
      ${s.remoteChanged
        ? this._alert(
            "warning",
            html`<span>${t("The plan changed elsewhere.")}</span>
              <span class="alert-actions">
                <button type="button" class="jv-btn" @click=${this._reloadRemote}>${t("Reload")}</button>
                <button type="button" class="jv-btn text" @click=${() => s.dismissRemote()}>${t("Keep mine")}</button>
              </span>`,
          )
        : nothing}
      ${!s.configured ? this._alert("info", html`<span>${t("This is the sample home. Change anything and Save to make it yours, or import your plan.")}</span>`) : nothing}
      ${s.warnings.length
        ? html`<details class="warnings">
            <summary>${t("Plan warnings ({n})", { n: s.warnings.length })}</summary>
            <ul>${s.warnings.map((w) => html`<li>${w}</li>`)}</ul>
          </details>`
        : nothing}
    `;
  }

  private _renderToasts() {
    const s = this.store;
    if (!s.toasts.length) return html`<div class="toasts" role="status" aria-live="polite"></div>`;
    return html`
      <div class="toasts" role="status" aria-live="polite">
        ${s.toasts.map(
          (toast) => html`<div class="toast" data-toast=${toast.id}>
            <span>${toast.message}</span>
            ${toast.action
              ? html`<button type="button" class="jv-btn text" @click=${(e: Event) => keepRowFocus(e, this, TOAST_FOCUS, () => s.runToastAction(toast.id))}>${toast.action.label}</button>`
              : nothing}
            <button type="button" class="jv-icon-btn" data-dismiss aria-label=${t("Dismiss")} @click=${(e: Event) => keepRowFocus(e, this, TOAST_FOCUS, () => s.dismissToast(toast.id))}>${this._icon("mdi:close", "×")}</button>
          </div>`,
        )}
      </div>
    `;
  }

  private _renderTabs() {
    const s = this.store;
    return html`
      <div class="tabs" role="tablist" aria-label=${t("Editor sections")} @keydown=${this._onTabsKey}>
        ${EDITOR_TABS.map(
          (tab) => html`<button
            type="button"
            role="tab"
            id=${`tab-${tab.id}`}
            class="chip jv-hit"
            aria-selected=${String(s.tab === tab.id)}
            aria-controls="tabpanel"
            tabindex=${s.tab === tab.id ? "0" : "-1"}
            @click=${() => this._selectTab(tab.id)}
          >
            ${this._icon(tab.icon, "")} ${t(tab.label)}
          </button>`,
        )}
      </div>
    `;
  }

  private _renderTab(tab: (typeof EDITOR_TABS)[number]) {
    const tag = unsafeStatic(tab.element);
    const defined = haDefined(tab.element);
    return html`
      ${staticHtml`<${tag} .store=${this.store} .canvas=${this._canvasEl} .hass=${this.hass} .narrow=${this.narrow}></${tag}>`}
      ${defined ? nothing : html`<jv-empty compact icon=${tab.icon} .heading=${t(tab.label)} .message=${t("This section is not available yet.")}></jv-empty>`}
    `;
  }

  private _renderPreview() {
    const s = this.store;
    const open = this._previewOpen;
    return html`
      <jv-section class="preview" .heading=${t("Preview")} icon="mdi:cube-outline">
        <button slot="actions" type="button" class="jv-btn text" aria-expanded=${String(open)} aria-controls="preview-body" @click=${this._togglePreview}>
          ${open ? t("Hide") : t("Show")}
        </button>
        ${open
          ? html`<div id="preview-body" data-version=${this._previewVersion}>
              <div class="preview-controls">
                <fieldset class="group" aria-label=${t("View")}>
                  ${PRESETS.map((p) => html`<button type="button" class="pill jv-hit" aria-pressed=${String(this._preset === p.theta)} @click=${() => this._setPreset(p.theta)}>${t(p.label)}</button>`)}
                </fieldset>
                <fieldset class="group" aria-label=${t("Floor")}>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(!this._previewAll)} @click=${() => { this._previewAll = false; }}>${t(s.floorLabel())}</button>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(this._previewAll)} @click=${() => { this._previewAll = true; }}>${t("All")}</button>
                </fieldset>
                <span class="hint">${t("drag to rotate")}</span>
              </div>
              ${this._renderScene()}
            </div>`
          : nothing}
      </jv-section>
    `;
  }

  private _renderScene() {
    const svgText = this._previewSvg();
    if (this._previewError) {
      return html`<jv-empty kind="error" compact icon="mdi:cube-off-outline" .heading=${t("Preview unavailable")} .message=${this._previewError}></jv-empty>`;
    }
    return html`
      <div
        class="scene ${this._dragging ? "dragging" : ""}"
        role="group"
        tabindex="0"
        aria-label=${t("3D model of the home")}
        aria-describedby="preview-hint"
        aria-keyshortcuts="ArrowLeft ArrowRight Home"
        @pointerdown=${this._onScenePointerDown}
        @pointermove=${this._onScenePointerMove}
        @pointerup=${this._onScenePointerUp}
        @pointercancel=${this._onScenePointerUp}
        @keydown=${this._onSceneKey}
      >
        ${unsafeHTML(svgText)}
      </div>
      <span class="visually-hidden" id="preview-hint">${t("Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.")}</span>
    `;
  }

  private _renderStickyBar() {
    const s = this.store;
    return html`
      <div class="sticky-bar">
        ${this._renderToasts()}
        <div class="row">
          <button type="button" class="jv-icon-btn" aria-label=${t("Undo")} ?disabled=${!s.canUndo} @click=${() => s.undo()}>${this._icon("mdi:undo", "↶")}</button>
          <button type="button" class="jv-icon-btn" aria-label=${t("Redo")} ?disabled=${!s.canRedo} @click=${() => s.redo()}>${this._icon("mdi:redo", "↷")}</button>
          ${s.dirty ? html`<button type="button" class="jv-btn text" @click=${this._discard}>${t("Discard")}</button>` : nothing}
          <button type="button" class="jv-btn primary" ?disabled=${!s.dirty || s.saving} @click=${this._save}>${s.saving ? t("Saving…") : t("Save Layout")}</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-plan-editor": JarvisPlanEditor;
  }
}
