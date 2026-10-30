/**
 * <jarvis-face-card .hass .model .cache .residents .cameras ?busy>
 *
 * One tile of the Household / Recently-seen galleries (spec §3.6): a square
 * thumbnail (signed pinned frame -> reference photo -> live camera frame ->
 * initial avatar; each failure falls to the next and is remembered), the
 * relation / LLM-guess badge, name, meta line and the controls. The card
 * never calls a mutating command itself: it dispatches "face-action"
 * (bubbles, composed, detail: FaceActionDetail) and the view does the work.
 */
import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { haDefined, watchDefinitions } from "../../ha";
import { t } from "../../i18n";
import type { Hass } from "../../types";
import { isApiPath } from "../../ws";
import type { BadgeLevel } from "../../components";
import "../../components";
import { formatAge, rememberedCamera } from "./format";
import type { ThumbCache } from "./image";
import type { CameraOption, FaceActionDetail, FaceCardModel } from "./types";

type Stage = "pinned" | "reference" | "camera" | "avatar";

const HA_TAGS = ["ha-icon", "ha-textfield"];

@customElement("jarvis-face-card")
export class JarvisFaceCard extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) model!: FaceCardModel;
  @property({ attribute: false }) cache?: ThumbCache;
  @property({ attribute: false }) residents: string[] = [];
  @property({ attribute: false }) cameras: CameraOption[] = [];
  @property({ type: Boolean, reflect: true }) busy = false;

  @state() private _src: string | null = null;
  @state() private _stage: Stage = "avatar";
  @state() private _label = "";
  @state() private _snapCam = "";

  private _resolveKey = "";
  private _seq = 0;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .thumb {
        appearance: none;
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        padding: 0;
        border: 0;
        border-radius: var(--jv-radius);
        background: var(--jv-surface-2);
        color: var(--jv-text-2);
        cursor: zoom-in;
        overflow: hidden;
      }
      .thumb:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .thumb img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb .initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: var(--jv-font-size-2xl);
        font-weight: var(--jv-font-weight-medium);
        text-transform: uppercase;
      }
      .frame {
        position: relative;
      }
      /* Outside the button (its aria-label would hide the relation from
         screen readers) and on an opaque backing, since the soft badge tint
         would otherwise sit straight on photo pixels. */
      .frame .badge {
        position: absolute;
        left: var(--jv-space-2);
        bottom: var(--jv-space-2);
        display: inline-flex;
        max-width: calc(100% - 2 * var(--jv-space-2));
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        pointer-events: none;
      }
      .name {
        margin: var(--jv-space-2) 0 0;
        font-weight: var(--jv-font-weight-medium);
      }
      .meta {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-2);
        margin-top: var(--jv-space-2);
      }
      .controls .jv-btn {
        min-height: 32px;
        padding: 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
      }
      .controls .jv-btn.text {
        padding: 0 var(--jv-space-1);
      }
      .controls .jv-btn.text.danger-text {
        color: var(--jv-danger-text);
      }
      label.file {
        display: inline-flex;
        cursor: pointer;
      }
      label.file input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
      }
      label.file:has(input:focus-visible) .jv-btn {
        box-shadow: var(--jv-focus-ring);
      }
      :host([busy]) .controls,
      :host([busy]) .row {
        opacity: 0.6;
        pointer-events: none;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
        margin-top: var(--jv-space-2);
        min-width: 0;
      }
      .row > input,
      .row > select {
        flex: 1 1 8em;
        min-width: 0;
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
      }
      .row > input::placeholder {
        color: var(--jv-text-3);
      }
      .row > ha-textfield {
        flex: 1 1 auto;
        min-width: 0;
      }
      .row > .jv-btn {
        flex: 0 0 auto;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    if (!this._snapCam) this._snapCam = rememberedCamera();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has("model") || changed.has("hass") || changed.has("cache")) {
      const m = this.model;
      const gen = m && this.cache ? this.cache.referenceGeneration(m.name) : 0;
      const key = m ? `${m.name}|${m.snapshotUrl ?? ""}|${m.hasReference ? 1 : 0}|${gen}|${m.cameraEntity}` : "";
      if (key && key !== this._resolveKey && this.hass && this.cache) {
        this._resolveKey = key;
        void this._resolve("pinned");
      }
    }
  }

  /** The image the card currently shows (null = avatar). */
  currentSrc(): string | null {
    return this._src;
  }

  // ── thumbnail chain ───────────────────────────────────────────────────

  private async _resolve(from: Stage): Promise<void> {
    const seq = ++this._seq;
    const m = this.model;
    const cache = this.cache;
    const hass = this.hass;
    if (!m || !cache || !hass) return;
    const order: Stage[] = ["pinned", "reference", "camera", "avatar"];
    for (const stage of order.slice(order.indexOf(from))) {
      let src: string | null = null;
      if (stage === "pinned") {
        if (m.snapshotUrl && !cache.hasFailed(m.snapshotUrl)) {
          const signed = await cache.signed(hass, m.snapshotUrl);
          // never render an unsigned /api/ src (signPath hands the raw path back when signing fails)
          if (signed && (!isApiPath(signed) || /[?&]authSig=/.test(signed))) src = signed;
        }
      } else if (stage === "reference") {
        if (m.hasReference) src = await cache.reference(hass, m.name);
      } else if (stage === "camera") {
        if (m.cameraEntity) src = await cache.camera(hass, m.cameraEntity);
      }
      if (seq !== this._seq) return; // superseded
      if (stage === "avatar" || src) {
        this._stage = stage;
        this._src = src;
        return;
      }
    }
  }

  private _onImgError(): void {
    if (this._src) this.cache?.markFailed(this._src);
    const next: Stage = this._stage === "pinned" ? "reference" : this._stage === "reference" ? "camera" : "avatar";
    this._src = null;
    void this._resolve(next);
  }

  // ── events ────────────────────────────────────────────────────────────

  private _emit(detail: FaceActionDetail): void {
    this.dispatchEvent(new CustomEvent<FaceActionDetail>("face-action", { detail, bubbles: true, composed: true }));
  }

  private _onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    this._emit({ action: "set_photo", name: this.model.name, file });
  }

  private _submitLabel(): void {
    const name = this._label.trim();
    if (!name || this.busy) return;
    this._emit({ action: "label", name, src: this._src, cameraEntity: this.model.cameraEntity });
  }

  /** The view calls this after a successful label so the field clears. */
  clearLabel(): void {
    this._label = "";
  }

  private _enlarge(): void {
    const m = this.model;
    const age = formatAge(m.ageSeconds);
    const caption = [m.name, m.cameraLabel, age].filter(Boolean).join(" · ");
    this._emit({ action: "enlarge", name: m.name, src: this._src, cameraEntity: m.cameraEntity, caption });
  }

  // ── render ────────────────────────────────────────────────────────────

  private _icon(icon: string): TemplateResult | typeof nothing {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  private _badge(): TemplateResult {
    const m = this.model;
    let level: BadgeLevel = "neutral";
    let label = t("Unknown");
    if (m.lowConf) {
      level = "warn";
      label = t("LLM guess");
    } else if (m.relation === "resident") {
      level = "accent";
      label = t("Resident");
    } else if (m.relation === "guest") {
      level = "info";
      label = t("Guest");
    }
    return html`<jv-state-badge nodot .level=${level} .label=${label}></jv-state-badge>`;
  }

  private _meta(): string {
    const m = this.model;
    const parts: string[] = [];
    if (m.cameraLabel) parts.push(m.cameraLabel);
    if (m.relation !== "unknown" && !m.lowConf && m.confidence > 0) parts.push(`${Math.round(m.confidence * 10) / 10}%`);
    const age = formatAge(m.ageSeconds);
    if (age) parts.push(age);
    if (!parts.length && m.relation === "resident") return t("Not seen recently");
    return parts.join(" · ");
  }

  private _renderControls(): TemplateResult | typeof nothing {
    const m = this.model;
    const bits: TemplateResult[] = [];
    if (m.actions.includes("make_resident")) {
      bits.push(html`<button class="jv-btn jv-hit" type="button" @click=${() => this._emit({ action: "make_resident", name: m.name })}>
        ${this._icon("mdi:account-plus-outline")}${t("Make resident")}
      </button>`);
    }
    if (m.relation === "resident") {
      bits.push(html`<label class="file jv-hit">
        <input type="file" accept="image/*" @change=${this._onFile} aria-label=${m.hasReference ? t("Change photo") : t("Set photo")} />
        <span class="jv-btn" aria-hidden="true">${this._icon("mdi:camera-outline")}${m.hasReference ? t("Change photo") : t("Set photo")}</span>
      </label>`);
      if (m.canCaptureFromSighting) {
        bits.push(html`<button
          class="jv-btn text jv-hit"
          type="button"
          @click=${() => this._emit({ action: "from_sighting", name: m.name, src: this._src, cameraEntity: m.cameraEntity })}
        >
          ${t("From sighting")}
        </button>`);
      }
      if (m.hasReference) {
        bits.push(html`<button class="jv-btn text danger-text jv-hit" type="button" @click=${() => this._emit({ action: "remove_photo", name: m.name })}>
          ${t("Remove photo")}
        </button>`);
      }
    }
    if (m.actions.includes("remove_resident")) {
      bits.push(html`<button class="jv-btn text danger-text jv-hit" type="button" @click=${() => this._emit({ action: "remove_resident", name: m.name })}>
        ${t("Remove")}
      </button>`);
    }
    if (!bits.length) return nothing;
    return html`<div class="controls">${bits}</div>`;
  }

  private _renderSnapshotRow(): TemplateResult | typeof nothing {
    const m = this.model;
    if (m.relation !== "resident" || !this.cameras.length) return nothing;
    const selected = this.cameras.some((c) => c.entity === this._snapCam) ? this._snapCam : "";
    return html`
      <div class="row">
        <select
          aria-label=${t("Camera to snapshot {name} from", { name: m.name })}
          .value=${selected}
          ?disabled=${this.busy}
          @change=${(e: Event) => (this._snapCam = (e.target as HTMLSelectElement).value)}
        >
          <option value="" ?selected=${!selected}>${t("— camera —")}</option>
          ${this.cameras.map((c) => html`<option value=${c.entity} ?selected=${c.entity === selected}>${c.label}</option>`)}
        </select>
        <button class="jv-btn" type="button" ?disabled=${this.busy} @click=${() => this._emit({ action: "snapshot_now", name: m.name, cameraEntity: selected })}>
          ${this._icon("mdi:camera-plus-outline")}${t("Snapshot now")}
        </button>
      </div>
    `;
  }

  private _renderLabelRow(): TemplateResult | typeof nothing {
    if (!this.model.labelable) return nothing;
    const label = t("Name this face…");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        this._submitLabel();
      }
    };
    return html`
      <div class="row">
        <input
          type="text"
          autocomplete="off"
          list="face-names"
          placeholder=${label}
          aria-label=${label}
          .value=${this._label}
          ?disabled=${this.busy}
          @input=${(e: Event) => (this._label = (e.target as HTMLInputElement).value)}
          @keydown=${onKey}
        />
        <datalist id="face-names">${this.residents.map((n) => html`<option value=${n}></option>`)}</datalist>
        <button class="jv-btn primary" type="button" ?disabled=${this.busy || !this._label.trim()} @click=${this._submitLabel}>${t("Label")}</button>
      </div>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const initial = (m.name.trim()[0] ?? "?").toUpperCase();
    return html`
      <div class="frame">
        <button class="thumb" type="button" aria-label=${t("Enlarge {name}", { name: m.name })} @click=${this._enlarge}>
          ${this._src
            ? html`<img src=${this._src} alt="" loading="lazy" @error=${this._onImgError} />`
            : html`<span class="initial" aria-hidden="true">${initial}</span>`}
        </button>
        <span class="badge">${this._badge()}</span>
      </div>
      <p class="name jv-truncate" title=${m.name}>${m.name}</p>
      <p class="meta">${this._meta()}</p>
      ${this._renderLabelRow()} ${this._renderControls()} ${this._renderSnapshotRow()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-face-card": JarvisFaceCard;
  }
}
