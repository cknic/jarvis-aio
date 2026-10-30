/**
 * <jarvis-tool-diagnostics> - Diagnostics service buttons (settings-tools.md
 * §4.18): seven test calls (hass.callService), each with its own
 * in-flight / done / failed state, no toast. Six are harmless and run at
 * once; the camera row spends LLM credits and speaks the result, so it asks
 * first, like Cameras > Analyze now (deviation from §4.18's "no
 * confirmation").
 */
import { html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { html as staticHtml, literal } from "lit/static-html.js";
import { t } from "../../../i18n";
import { haDefined } from "../../../ha";
import { confirmDialog } from "../../../components";
import { JarvisToolCard } from "./runtime-base";
import { hasBriefingSpeakers } from "./runtime-briefing";

const DONE_CLEAR_MS = 4000;

interface DiagRow {
  id: string;
  /** a function so the t() key stays a literal (npm run i18n:keys) and follows the live language */
  label: () => string;
  service: string;
  data?: Record<string, unknown>;
}

const ROWS: DiagRow[] = [
  { id: "tts", label: () => t("TTS — JARVIS voice test"), service: "test_tts" },
  { id: "observer", label: () => t("Observer — fire status event"), service: "observer_status" },
  { id: "briefing", label: () => t("Briefing — manual trigger"), service: "briefing" },
  { id: "doorbell", label: () => t("Doorbell — run diagnostics"), service: "diagnose_doorbell" },
  { id: "notify", label: () => t("Notification — test phone push"), service: "test_notify" },
  { id: "routing", label: () => t("Routing — dump routing state to log"), service: "test_routing" },
  { id: "camera", label: () => t("Camera — analyze now (vision → reasoning)"), service: "analyze_camera" },
];

interface CameraRow {
  entity_id: string;
  name?: string;
  enabled?: boolean;
}

@customElement("jarvis-tool-diagnostics")
export class JarvisToolDiagnostics extends JarvisToolCard {
  @state() private _busy: Record<string, boolean> = {};
  @state() private _done: Record<string, boolean> = {};
  @state() private _errors: Record<string, string> = {};
  @state() private _camera = "";
  @state() private _briefingGuard = false;

  private _timers = new Map<string, ReturnType<typeof setTimeout>>();

  static override styles = [
    ...JarvisToolCard.styles,
    css`
      ul.rows {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li.row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-1) var(--jv-space-3);
        align-items: center;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li.row:first-child {
        border-top: 0;
      }
      :host([narrow]) li.row {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([narrow]) li.row .jv-btn {
        width: 100%;
      }
      .label {
        overflow-wrap: anywhere;
      }
      .msg {
        grid-column: 1 / -1;
        margin: 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .msg.err {
        color: var(--jv-danger-text);
      }
      .cam {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
        min-width: 0;
      }
      .cam select,
      .cam ha-select {
        min-width: 0;
        flex: 1 1 160px;
      }
    `,
  ];

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const tm of this._timers.values()) clearTimeout(tm);
    this._timers.clear();
  }

  private _cameras(): CameraRow[] {
    const raw = (this.data?.config as Record<string, unknown> | undefined)?.cameras;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c): c is CameraRow => !!c && typeof c === "object" && typeof (c as CameraRow).entity_id === "string")
      .filter((c) => c.enabled !== false);
  }

  private _selectedCamera(): string {
    const cams = this._cameras();
    if (this._camera && cams.some((c) => c.entity_id === this._camera)) return this._camera;
    return cams[0]?.entity_id ?? "";
  }

  private async _run(row: DiagRow): Promise<void> {
    if (this._busy[row.id]) return;
    const hass = this.hass;
    const { [row.id]: _e, ...restErr } = this._errors;
    this._errors = restErr;
    const { [row.id]: _d, ...restDone } = this._done;
    this._done = restDone;
    if (row.id === "briefing") {
      if (!hasBriefingSpeakers((k) => this.value(k))) {
        this._briefingGuard = true;
        return;
      }
      this._briefingGuard = false;
    }
    if (!hass || typeof hass.callService !== "function") {
      this._errors = { ...this._errors, [row.id]: t("Home Assistant connection not available") };
      return;
    }
    let data: Record<string, unknown> = { ...(row.data ?? {}) };
    if (row.id === "camera") {
      const cam = this._selectedCamera();
      if (!cam) return;
      const name = this._cameras().find((c) => c.entity_id === cam)?.name || cam;
      const ok = await confirmDialog({
        heading: t("Analyze {name} now?", { name }),
        message: t("JARVIS runs one vision → reasoning pass on this camera and announces the result. It uses LLM credits and takes a few seconds."),
        confirmLabel: t("Analyze now"),
        cancelLabel: t("Cancel"),
      });
      if (!ok || this._busy[row.id]) return;
      data = { entity_id: cam, announce: true };
    }
    this._busy = { ...this._busy, [row.id]: true };
    try {
      await hass.callService("jarvis", row.service, data);
      this._done = { ...this._done, [row.id]: true };
      clearTimeout(this._timers.get(row.id));
      this._timers.set(
        row.id,
        setTimeout(() => {
          const { [row.id]: _x, ...rest } = this._done;
          this._done = rest;
        }, DONE_CLEAR_MS),
      );
    } catch (err) {
      const e = err as { message?: unknown } | null;
      this._errors = { ...this._errors, [row.id]: String(e?.message ?? err ?? `jarvis.${row.service} failed`) };
    } finally {
      const { [row.id]: _b, ...rest } = this._busy;
      this._busy = rest;
    }
  }

  private _onCamera(e: Event): void {
    this._camera = String((e.target as HTMLSelectElement & { value?: string }).value ?? "");
  }

  private _renderCameraSelect(cams: CameraRow[]) {
    const label = t("Camera — analyze now (vision → reasoning)");
    const value = this._selectedCamera();
    if (!cams.length) {
      return html`<select aria-label=${label} disabled><option>${t("— no cameras —")}</option></select>`;
    }
    if (haDefined("ha-select")) {
      const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
      return html`
        <ha-select .label=${t("Camera")} .value=${live(value)} ?disabled=${this.offline} naturalMenuWidth fixedMenuPosition @selected=${this._onCamera} @closed=${(e: Event) => e.stopPropagation()}>
          ${cams.map((c) => staticHtml`<${item} value=${c.entity_id}>${c.name || c.entity_id}</${item}>`)}
        </ha-select>
      `;
    }
    return html`
      <select aria-label=${label} .value=${live(value)} ?disabled=${this.offline} @change=${this._onCamera}>
        ${cams.map((c) => html`<option value=${c.entity_id}>${c.name || c.entity_id}</option>`)}
      </select>
    `;
  }

  private _renderRow(row: DiagRow) {
    const busy = !!this._busy[row.id];
    let disabled = this.offline || busy;
    let note: unknown = nothing;
    if (row.id === "notify" && String(this.value("notify_service") ?? "") === "") {
      disabled = true;
      note = html`<p class="msg">${t("No notify service set")}</p>`;
    }
    const cams = row.id === "camera" ? this._cameras() : [];
    if (row.id === "camera" && !cams.length) disabled = true;
    const err = this._errors[row.id];
    return html`
      <li class="row">
        ${row.id === "camera"
          ? html`<div class="cam"><span class="label">${row.label()}</span>${this._renderCameraSelect(cams)}</div>`
          : html`<span class="label">${row.label()}</span>`}
        <button type="button" class="jv-btn" ?disabled=${disabled} @click=${() => void this._run(row)}>${busy ? t("Running…") : t("Run")}</button>
        ${note}
        ${this._done[row.id] ? html`<p class="msg" role="status">${t("Done — check the speakers / log.")}</p>` : nothing}
        ${err ? html`<p class="msg err" role="alert">${err}</p>` : nothing}
        ${row.id === "briefing" && this._briefingGuard
          ? html`<p class="msg">${t("No announcement speakers set — choose them under Voice & Audio › Announcement Speakers.")}
              ${this.renderLink(t("Choose speakers"), () => this.navigate("settings", "voice/announcement_speakers"))}</p>`
          : nothing}
      </li>
    `;
  }

  override render() {
    return html`
      <jv-section .heading=${t("Diagnostics")} .subheading=${t("Test")} icon="mdi:stethoscope">
        <ul class="rows">${ROWS.map((r) => this._renderRow(r))}</ul>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-diagnostics": JarvisToolDiagnostics;
  }
}
