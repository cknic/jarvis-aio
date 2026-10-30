/**
 * <jarvis-view-residence> - the home as a rotatable axonometric 3D model whose
 * rooms light from live occupancy, plus the mmWave presence card and the
 * dominant-room strip. See frontend/specs/residence.md.
 *
 * Renderer: ./residence/house3d.ts (ported JARVIS3D geometry) with a palette
 * built from the HA theme tokens (./residence/palette.ts). Plan / spec / lit
 * map preparation lives in ./residence/plan.ts.
 */
import { html, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { WsError } from "../ws";
import "../components";
import "./residence/editor/editor";
import { fixedBox, renderSVG, type Box, type Floor, type PlanFeet } from "./residence/house3d";
import { buildPalette, paletteKey } from "./residence/palette";
import { residenceStyles } from "./residence/styles";
import {
  STYLES, styleOf, parsePlan, parseElements, planToFeet, elementsToFeet, garageBays, houseSpec, litMap, estimateSqft, num,
  type FloorKey, type FloorPlan, type MmwaveOverview,
} from "./residence/plan";

const PRESETS: ReadonlyArray<{ label: string; theta: number }> = [
  { label: "FRONT", theta: 0 },
  { label: "RIGHT", theta: 90 },
  { label: "REAR", theta: 180 },
  { label: "LEFT", theta: 270 },
  { label: "ISO", theta: 35 },
];
const DOCS_URL = "https://github.com/sam3gp8/jarvis-aio/blob/main/docs/floor-plan-import.md";
const GAUGE_R = 26;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

@customElement("jarvis-view-residence")
export class JarvisViewResidence extends JarvisView {
  @state() private _floor: FloorKey = "all";
  @state() private _preset: number | null = 35;
  @state() private _dragging = false;
  @state() private _mm: MmwaveOverview | null = null;
  @state() private _mmLoading = false;
  @state() private _mmError: string | null = null;
  @state() private _styleBusy = false;
  @state() private _styleOverride: string | null = null;
  @state() private _styleError: string | null = null;

  private _theta = 35;
  private _raf = 0;
  private _drag: { id: number; x: number } | null = null;
  private _plan: PlanFeet = {};
  private _editorPlan: FloorPlan = {};
  private _planJson = "";
  private _planConfigured = true;
  private _boxKey = "";
  private _box: Box | undefined;
  private _svgKey = "";
  private _svg = "";
  private _mq: MediaQueryList[] = [];
  private readonly _onMq = () => this.requestUpdate();

  static override styles = [base, residenceStyles];

  // ── lifecycle ─────────────────────────────────────────────────────────
  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-select", "ha-list-item", "ha-alert", "ha-icon"]);
    if (typeof matchMedia === "function") {
      this._mq = [matchMedia("(prefers-color-scheme: dark)"), matchMedia("(prefers-reduced-motion: reduce)")];
      for (const mq of this._mq) mq.addEventListener?.("change", this._onMq);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const mq of this._mq) mq.removeEventListener?.("change", this._onMq);
    this._mq = [];
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("data")) {
      const cfg = this.data?.config || {};
      const { plan, configured } = parsePlan(cfg.floor_plan_rooms);
      this._editorPlan = plan;
      this._planConfigured = configured;
      this._plan = planToFeet(plan);
      this._planJson = JSON.stringify(this._plan);
      if (!this._styleBusy) this._styleOverride = null; // the snapshot is the truth again (unless a write is in flight)
      if (this._floor !== "all" && !this._floorAvailable(this._floor)) this._floor = "all";
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("data") && this.data && this.hass) this._fetchMmwave();
    else if (changed.has("hass") && this.hass && this.data && !this._mm && !this._mmLoading) this._fetchMmwave();
  }

  // ── data ──────────────────────────────────────────────────────────────
  private async _fetchMmwave(): Promise<void> {
    if (this._mmLoading) return;
    this._mmLoading = true;
    try {
      const res = await this.ws<MmwaveOverview>("jarvis/mmwave_overview");
      this._mm = { rooms: Array.isArray(res?.rooms) ? res.rooms : [], summary: res?.summary || { rooms_with_mmwave: 0, rooms_detecting: 0, total_sensors: 0 } };
      this._mmError = null;
    } catch (err) {
      this._mmError = WsError.from("jarvis/mmwave_overview", err).message;
    } finally {
      this._mmLoading = false;
    }
  }

  private get _config(): Record<string, unknown> {
    return this.data?.config || {};
  }
  private get _styleId(): string {
    return this._styleOverride ?? styleOf(this._config.residence_style).id;
  }

  private _floorAvailable(f: FloorKey): boolean {
    if (f === "all") return true;
    const cfg = this._config;
    if (f === "2f" && String(cfg.home_stories ?? "1.5") === "1") return false;
    if (f === "bsmt" && cfg.has_basement === false) return false;
    return (this._plan[f] || []).length > 0;
  }

  private _reducedMotion(): boolean {
    try {
      return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }

  /** The SVG for the current frame, memoised on everything that can change it. */
  private _sceneSvg(): string {
    const cfg: Record<string, unknown> = { ...this._config, residence_style: this._styleId };
    const spec = houseSpec(cfg);
    const elements = elementsToFeet(parseElements(cfg.floor_plan_elements), this.hass);
    const garage = garageBays(cfg, this.hass);
    const floor: Floor = this._floor === "bsmt" ? "b" : this._floor;
    const palette = buildPalette(this);
    const stat = JSON.stringify(spec) + "|" + JSON.stringify(elements) + "|" + JSON.stringify(garage);
    const boxKey = floor + "|" + stat + "|" + this._planJson;
    if (boxKey !== this._boxKey) {
      this._box = fixedBox({ floor, spec, plan: this._plan, elements, garage, palette });
      this._boxKey = boxKey;
    }
    const lit = litMap(this.data, this._mm);
    const animate = !this._reducedMotion();
    const key = [this._theta.toFixed(1), boxKey, JSON.stringify(lit), paletteKey(this), animate].join("|");
    if (key !== this._svgKey) {
      this._svg = renderSVG({ theta: this._theta, floor, lit, box: this._box, spec, plan: this._plan, elements, garage, palette, idPrefix: "j3d", animate });
      this._svgKey = key;
    }
    return this._svg;
  }

  // ── actions ───────────────────────────────────────────────────────────
  private _setFloor(f: FloorKey): void {
    this._floor = f;
  }
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

  private _onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this._drag = { id: e.pointerId, x: e.clientX };
    this._dragging = true;
    const el = e.currentTarget as HTMLElement | null;
    try {
      el?.setPointerCapture?.(e.pointerId);
    } catch {
      /* not supported */
    }
  }
  private _onPointerMove(e: PointerEvent): void {
    if (!this._drag || e.pointerId !== this._drag.id) return;
    const dx = e.clientX - this._drag.x;
    this._drag.x = e.clientX;
    if (dx) this._rotateBy(dx * 0.5);
  }
  private _onPointerUp(e: PointerEvent): void {
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

  private async _onStyleChange(value: string): Promise<void> {
    const id = styleOf(value).id;
    if (!value || id === this._styleId || this._styleBusy) return;
    const previous = this._styleId;
    this._styleOverride = id;
    this._styleBusy = true;
    this._styleError = null;
    try {
      await this.ws("jarvis/update_config", { key: "residence_style", value: id });
      this._toast(t("Home style → {label}", { label: t(styleOf(id).label) }));
      this.refresh();
    } catch (err) {
      this._styleOverride = previous;
      this._styleError = `residence_style — ${WsError.from("jarvis/update_config", err).message}`;
    } finally {
      this._styleBusy = false;
    }
  }

  private _toast(message: string): void {
    this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } }));
  }

  // ── render ────────────────────────────────────────────────────────────
  override render() {
    // /jarvis/residence/editor[/<tab>] -> the floor-plan editor instead of the overview cards
    if (this.subPath.split("/")[0] === "editor") {
      return html`<jarvis-plan-editor .hass=${this.hass} .narrow=${this.narrow} .data=${this.data} .route=${this.route}></jarvis-plan-editor>`;
    }
    if (!this.data) {
      return html`
        <div class="res">
          <jv-section .heading=${t("Residence Overview")} icon="mdi:floor-plan" loading>
            <jv-empty kind="loading" .message=${t("Loading...")}></jv-empty>
          </jv-section>
          <jv-section .heading=${t("mmWave Presence")} icon="mdi:motion-sensor" loading>
            <jv-empty kind="loading" .message=${t("Reading sensors…")}></jv-empty>
          </jv-section>
        </div>
      `;
    }
    return html`
      <div class="res">
        ${this._renderOverview()}
        ${this._renderMmwave()}
      </div>
    `;
  }

  private _renderOverview() {
    const areas = this.data?.areas || [];
    const occ = areas.filter((a) => a.active).length;
    const tot = areas.length;
    return html`
      <jv-section .heading=${t("Residence Overview")} icon="mdi:floor-plan">
        <jv-state-badge slot="actions" level=${occ > 0 ? "ok" : "neutral"} .label=${`${occ}/${tot} ${t("OCCUPIED")}`}></jv-state-badge>
        <div class="wrap">
        ${this._styleError ? html`<div class="err" role="alert">✗ ${this._styleError}</div>` : nothing}
        <div class="controls">
          ${this._renderStyleSelect()}
          <fieldset class="seg" aria-label=${t("Floor")}>
            ${(["all", "1f", "2f", "bsmt"] as FloorKey[]).filter((f) => this._floorAvailable(f)).map(
              (f) => html`<button type="button" class="jv-hit" aria-pressed=${String(this._floor === f)} @click=${() => this._setFloor(f)}>${t(FLOOR_LABELS[f])}</button>`,
            )}
          </fieldset>
          <fieldset class="seg" aria-label=${t("View")}>
            ${PRESETS.map(
              (p) => html`<button type="button" class="jv-hit" aria-pressed=${String(this._preset === p.theta)} @click=${() => this._setPreset(p.theta)}>${t(p.label)}</button>`,
            )}
          </fieldset>
          <span class="hint" aria-hidden="true">${t("drag to rotate")}</span>
          <button type="button" class="jv-btn" @click=${() => this.navigate("residence", "editor")}>${t("Edit floor plan")}</button>
          <span class="visually-hidden" id="drag-hint">${t("Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.")}</span>
        </div>
        ${this._renderScene()}
        ${this._planConfigured
          ? nothing
          : html`<p class="planhint">
              <span>${t("No floor plan yet — the model shows a sample home. Import your plan to see your rooms.")}</span>
              <a href=${DOCS_URL} target="_blank" rel="noopener noreferrer">${t("Import a floor plan")}</a>
            </p>`}
        ${this._renderDominant()}
        </div>
      </jv-section>
    `;
  }

  private _renderStyleSelect() {
    const value = this._styleId;
    const label = t("HOME STYLE");
    if (haDefined("ha-select") && haDefined("ha-list-item")) {
      return html`
        <ha-select
          .label=${label}
          .value=${value}
          .disabled=${this._styleBusy}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${(e: Event) => this._onStyleChange(String((e.target as HTMLSelectElement).value))}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          ${STYLES.map((s) => html`<ha-list-item .value=${s.id}>${t(s.label)}</ha-list-item>`)}
        </ha-select>
      `;
    }
    return html`
      <label class="field">
        <span>${label}</span>
        <select .value=${value} ?disabled=${this._styleBusy} @change=${(e: Event) => this._onStyleChange((e.target as HTMLSelectElement).value)}>
          ${STYLES.map((s) => html`<option value=${s.id} ?selected=${s.id === value}>${t(s.label)}</option>`)}
        </select>
      </label>
    `;
  }

  private _renderScene() {
    const hc = (this.hass?.config || {}) as { location_name?: unknown; latitude?: unknown; longitude?: unknown };
    const lat = num(hc.latitude), lon = num(hc.longitude);
    const location = (typeof hc.location_name === "string" && hc.location_name) || (lat != null && lon != null ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : t("ADDRESS NOT SET"));
    const cfg = this._config;
    const areas = this.data?.areas || [];
    const sqft = estimateSqft(cfg, this._editorPlan);
    const bedsCfg = num(cfg.home_bedrooms), bathsCfg = num(cfg.home_bathrooms);
    const beds = bedsCfg != null ? bedsCfg : areas.filter((a) => a.bedroom).length || this.data?.meta?.bedrooms || 0;
    const baths = bathsCfg != null ? bathsCfg : areas.filter((a) => /bath/i.test(a.name || "")).length;
    const occ = areas.filter((a) => a.active).length;
    const styleLabel = t(styleOf(this._styleId).label).toUpperCase();
    return html`
      <div
        class="scene ${this._dragging ? "dragging" : ""}"
        role="group"
        tabindex="0"
        aria-label=${t("3D model of the home")}
        aria-describedby="drag-hint"
        aria-keyshortcuts="ArrowLeft ArrowRight Home"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @keydown=${this._onSceneKey}
      >
        ${unsafeHTML(this._sceneSvg())}
        <div class="overlay banner">${t("PROPERTY")} · <strong>${location}</strong></div>
        <div class="overlay stats">
          <div class="stat sqft"><div class="k">${t("EST SQ FT")}</div><div class="v">${sqft ? `~${sqft.toLocaleString()}` : "—"}</div></div>
          <div class="stat"><div class="k">${t("BED / BATH")}</div><div class="v">${beds} / ${baths || "—"}</div></div>
          <div class="stat style"><div class="k">${t("STYLE")}</div><div class="v">${styleLabel}</div></div>
          <div class="stat"><div class="k">${t("OCCUPIED")}</div><div class="v">${occ} / ${areas.length}</div></div>
        </div>
      </div>
    `;
  }

  private _renderDominant() {
    const d = this.data?.dominant;
    if (!d) return nothing;
    const tv = parseFloat(String(d.temp));
    const hv = parseFloat(String(d.humidity));
    const tempF = Number.isFinite(tv) ? Math.max(0, Math.min(1, (tv - 50) / 40)) : 0;
    const humF = Number.isFinite(hv) ? Math.max(0, Math.min(1, hv / 100)) : 0;
    const lightsOn = /on|^[1-9]/i.test(String(d.lights || ""));
    const gauge = (cls: string, frac: number, value: string, label: string, dim: boolean, stroke?: string) => html`
      <div class="gauge ${cls} ${dim ? "dim" : ""}" role="img" aria-label=${`${label}: ${value}`}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle class="track" cx="32" cy="32" r=${GAUGE_R}></circle>
          <circle
            class="arc"
            cx="32"
            cy="32"
            r=${GAUGE_R}
            transform="rotate(-90 32 32)"
            stroke-dasharray=${GAUGE_C.toFixed(1)}
            stroke-dashoffset=${(GAUGE_C * (1 - frac)).toFixed(1)}
            style=${stroke ? `stroke:${stroke}` : ""}
          ></circle>
        </svg>
        <div class="val">${value}</div>
        <div>${label}</div>
      </div>
    `;
    const tempStroke = `color-mix(in srgb, var(--jv-warn) ${Math.round(tempF * 100)}%, var(--jv-accent))`;
    return html`
      <div class="dom" aria-live="polite">
        <div>
          <div class="name">${t(d.name || "—")}</div>
          <div class="jv-muted">${t(d.subtitle || "")}</div>
        </div>
        <div class="gauges">
          ${gauge("temp", tempF, d.temp || "—", t("Temp"), false, tempStroke)}
          ${gauge("hum", humF, d.humidity || "—", t("Humidity"), false)}
          ${gauge("lite", lightsOn ? 1 : 0.04, lightsOn ? t("ON") : t("OFF"), t("Lights"), !lightsOn)}
        </div>
      </div>
    `;
  }

  private _renderMmwave() {
    const mm = this._mm;
    const s = mm?.summary;
    const chip = this._mmLoading && !mm ? t("SCAN") : s && s.rooms_with_mmwave ? `${s.rooms_detecting || 0}/${s.rooms_with_mmwave} ${t("OCCUPIED")}` : t("NONE");
    const level = s && s.rooms_detecting ? "ok" : "neutral";
    let body;
    if (this._mmError && !mm) {
      body = html`
        <jv-empty kind="error" compact icon="mdi:motion-sensor-off" .heading=${t("Couldn't read sensors — restart Home Assistant after updating, then reopen.")} .message=${this._mmError}>
          <button slot="action" class="jv-btn" type="button" @click=${() => this._fetchMmwave()}>${t("Retry")}</button>
        </jv-empty>
      `;
    } else if (!mm) {
      body = html`<jv-empty kind="loading" compact .message=${t("Reading sensors…")}></jv-empty>`;
    } else if (!mm.rooms.length) {
      body = html`<jv-empty compact icon="mdi:motion-sensor" .message=${t("No presence, motion, or mmWave sensors found. Assign occupancy sensors to areas in Home Assistant and they'll appear here.")}></jv-empty>`;
    } else {
      body = html`
        <ul class="mm-list">
          ${mm.rooms.map((r) => {
            const on = r.detecting_count > 0;
            const sensorLine = r.sensor_count > 1 ? t("{n}/{m} sensors", { n: r.detecting_count, m: r.sensor_count }) : t("{n} sensor", { n: r.sensor_count });
            const meta = `${on ? t("OCCUPIED") : t("clear")} · ${sensorLine} · ${on ? t("now") : r.freshest || "—"}`;
            const row = html`
              <span class="mm-dot ${on ? "jv-pulse" : ""}" aria-hidden="true"></span>
              <span class="mm-body">
                <span class="mm-name">${r.name} ${r.outdoor ? html`<jv-state-badge level="info" nodot .label=${t("OUT")}></jv-state-badge>` : nothing}</span>
                <div class="mm-meta">${meta}</div>
              </span>
            `;
            return html`<li class="mm-room ${on ? "on" : ""}">
              ${r.sensors?.length
                ? html`<details>
                    <summary>${row}</summary>
                    <ul class="mm-sensors">
                      ${r.sensors.map((sn) => html`<li><span class=${sn.detecting ? "on" : ""}>${sn.name}</span><span class="jv-mono">${sn.detecting ? t("now") : sn.age}</span></li>`)}
                    </ul>
                  </details>`
                : html`<div class="row">${row}</div>`}
            </li>`;
          })}
        </ul>
        ${this._mmError ? html`<p class="mm-state" role="status">${this._mmError}</p>` : nothing}
      `;
    }
    return html`
      <jv-section .heading=${t("mmWave Presence")} icon="mdi:motion-sensor" ?loading=${this._mmLoading}>
        <jv-state-badge slot="actions" level=${level} .label=${chip} ?pulse=${level === "ok"}></jv-state-badge>
        <p class="subtext">${t("Live occupancy per room from presence / motion / mmWave sensors — the ground truth behind the floor-plan glow.")}</p>
        ${body}
      </jv-section>
    `;
  }
}

const FLOOR_LABELS: Record<FloorKey, string> = { all: "All", "1f": "1st Floor", "2f": "2nd Floor", bsmt: "Basement" };

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-residence": JarvisViewResidence;
  }
}
