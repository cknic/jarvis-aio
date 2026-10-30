/**
 * <jarvis-tool-wellbeing> - Wellbeing Context pointer (Home & Extras). The
 * wearable-context switch and the discovered-wearables list live on the
 * People view (specs/people.md §3.4, jarvis/biometrics); this card only shows
 * the catalogue switch state and links there, so the old Settings card's
 * place is not a dead end.
 */
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { t } from "../../../i18n";
import { JarvisToolCard } from "./runtime-base";

@customElement("jarvis-tool-wellbeing")
export class JarvisToolWellbeing extends JarvisToolCard {
  override render() {
    const on = this.value("biometrics_enabled") === true;
    return html`
      <jv-section .heading=${t("Wellbeing Context")} icon="mdi:heart-pulse">
        <jv-state-badge slot="actions" level=${on ? "ok" : "neutral"} .label=${on ? t("ON") : t("OFF")}></jv-state-badge>
        <p class="intro">${t("The discovered wearables and the wearable-context switch are on the People view. Context only — never medical.")}</p>
        <div class="actions-row">
          <button type="button" class="jv-btn" @click=${() => this.navigate("people")}>${t("Open People")}</button>
          ${this.renderLink(t("Map a kind to an entity"), () => this.navigate("settings", "core/biometric_entities"))}
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-tool-wellbeing": JarvisToolWellbeing;
  }
}
