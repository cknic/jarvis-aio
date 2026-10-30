/**
 * <jarvis-tool-voice-confirm-test> - Voice Confirmation test (settings-tools.md
 * §4.17): fires jarvis/voice_confirm_test (assist_satellite.announce) so the
 * user can hear whether the satellite speaks on its own (native) or needs the
 * room speaker (gated). The result stays until the next test.
 */
import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { t } from "../../../i18n";
import { WsError } from "../../../ws";
import { enumLabel } from "../presentation";
import { JarvisToolCard, wsMessage } from "./runtime-base";

export interface VoiceConfirmTestResult {
  ok: boolean;
  satellite?: string;
  note?: string;
  error?: string;
}

@customElement("jarvis-tool-voice-confirm-test")
export class JarvisToolVoiceConfirmTest extends JarvisToolCard {
  @state() private _busy = false;
  @state() private _result: VoiceConfirmTestResult | null = null;
  @state() private _error: string | null = null;

  private async _test(): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    this._result = null;
    this._error = null;
    try {
      const res = await this.ws<VoiceConfirmTestResult>("jarvis/voice_confirm_test");
      this._result = res && typeof res === "object" ? res : { ok: false, note: "" };
    } catch (err) {
      this._error = wsMessage(WsError.from("jarvis/voice_confirm_test", err));
    } finally {
      this._busy = false;
    }
  }

  private _renderResult() {
    if (this._error) return this.renderAlert("error", this._error);
    const r = this._result;
    if (!r) return nothing;
    if (r.ok) {
      return this.renderAlert(
        "success",
        html`${r.note ?? ""}${r.satellite ? html` <span class="jv-mono">${r.satellite}</span>` : nothing}`,
      );
    }
    return this.renderAlert("warning", html`${r.note ?? ""}${r.error ? html`<br />${r.error}` : nothing}`);
  }

  override render() {
    const enabled = this.value("voice_confirm_enabled") === true;
    const mode = String(this.value("voice_confirm_mode") ?? "");
    return html`
      <jv-section .heading=${t("Voice Confirmation")} icon="mdi:microphone-question" .loading=${this._busy}>
        <span slot="actions" class="head-meta">
          ${mode ? html`<span>${t(enumLabel("voice_confirm_mode", mode))}</span>` : nothing}
          <jv-state-badge level=${enabled ? "ok" : "neutral"} .label=${enabled ? t("ON") : t("OFF")}></jv-state-badge>
        </span>
        <p class="intro">${t("Run the test to see whether your satellite can speak on its own (native mode) or needs the room speaker (gated mode).")}</p>
        <div class="actions-row">
          <button type="button" class="jv-btn primary" ?disabled=${this.offline || this._busy} @click=${() => void this._test()}>
            ${this._busy ? t("Playing…") : t("Test satellite audio")}
          </button>
        </div>
        <p class="sr-status" role="status" aria-live="polite">${this._busy ? t("Firing announce to your satellite — listen for it…") : nothing}</p>
        ${this._renderResult()}
        ${this.renderLink(t("Change mode"), () => this.navigate("settings", "voice/voice_confirm_mode"))}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-voice-confirm-test": JarvisToolVoiceConfirmTest;
  }
}
