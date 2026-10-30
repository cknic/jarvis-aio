/**
 * <jarvis-tool-briefing> - Briefings / "Brief me now" (settings-tools.md
 * §4.16): a schedule summary from the briefing_* catalogue values and the
 * jarvis.briefing service call behind the client-side speaker guard (the
 * service returns {announced: false} silently when no speaker is set).
 */
import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { t } from "../../../i18n";
import { JarvisToolCard } from "./runtime-base";

const STATUS_CLEAR_MS = 6000;

/** The speaker guard shared with the Diagnostics "Briefing — manual trigger" row. */
export function hasBriefingSpeakers(value: (key: string) => unknown): boolean {
  const speakers = value("announcement_speakers");
  if (Array.isArray(speakers) && speakers.some((s) => typeof s === "string" && s.trim())) return true;
  const group = value("broadcast_group");
  return typeof group === "string" && group.trim() !== "";
}

@customElement("jarvis-tool-briefing")
export class JarvisToolBriefing extends JarvisToolCard {
  @state() private _busy = false;
  @state() private _status = "";
  @state() private _error: string | null = null;
  @state() private _noSpeakers = false;

  private _timer: ReturnType<typeof setTimeout> | undefined;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  private async _briefNow(): Promise<void> {
    if (this._busy) return;
    this._error = null;
    this._status = "";
    if (!hasBriefingSpeakers((k) => this.value(k))) {
      this._noSpeakers = true;
      return;
    }
    this._noSpeakers = false;
    const hass = this.hass;
    if (!hass || typeof hass.callService !== "function") {
      this._error = t("Home Assistant connection not available");
      return;
    }
    this._busy = true;
    try {
      await hass.callService("jarvis", "briefing", { announce: true });
      this._status = t("Briefing requested — listen for it.");
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        this._status = "";
      }, STATUS_CLEAR_MS);
    } catch (err) {
      const e = err as { message?: unknown } | null;
      this._error = String(e?.message ?? err ?? "jarvis.briefing failed");
    } finally {
      this._busy = false;
    }
  }

  private _schedule() {
    const lines: string[] = [];
    if (this.value("briefing_morning_enabled") === true) lines.push(t("Morning {time}", { time: String(this.value("briefing_morning_time") ?? "") }));
    if (this.value("briefing_evening_enabled") === true) lines.push(t("Evening {time}", { time: String(this.value("briefing_evening_time") ?? "") }));
    return lines;
  }

  override render() {
    const lines = this._schedule();
    const scheduled = lines.length > 0;
    return html`
      <jv-section .heading=${t("Briefings")} icon="mdi:weather-sunset-up">
        <jv-state-badge slot="actions" level=${scheduled ? "ok" : "neutral"} .label=${scheduled ? t("Scheduled") : t("Off")}></jv-state-badge>
        <p class="intro">
          ${scheduled ? lines.join(" · ") : t("No briefing scheduled.")}
          ${this.renderLink(t("Edit schedule"), () => this.navigate("settings", "core/briefing_morning_enabled"))}
        </p>
        ${this._noSpeakers
          ? this.renderAlert(
              "warning",
              t("No announcement speakers set — choose them under Voice & Audio › Announcement Speakers."),
              html`<button type="button" class="jv-btn" @click=${() => this.navigate("settings", "voice/announcement_speakers")}>${t("Choose speakers")}</button>`,
            )
          : nothing}
        ${this._error ? this.renderAlert("error", this._error) : nothing}
        <div class="actions-row">
          <button type="button" class="jv-btn primary" ?disabled=${this.offline || this._busy} @click=${() => void this._briefNow()}>
            ${this._busy ? t("Briefing…") : t("Brief me now")}
          </button>
        </div>
        <p class="status ok" role="status" aria-live="polite">${this._status}</p>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-briefing": JarvisToolBriefing;
  }
}
