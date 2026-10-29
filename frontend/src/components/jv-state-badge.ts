/**
 * <jv-state-badge level="ok|warn|danger|info|neutral|accent" label="Online" pulse>
 *
 * A pill with a status dot. Colour comes ONLY from the semantic tokens, so it
 * follows the HA theme. `pulse` animates the dot (motion-safe) - use it for a
 * live occupancy indicator, nothing else. The text can also be slotted.
 * `fromLevel()` maps the backend's "live|warn|off" status levels.
 */
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { base } from "../theme/base";

export type BadgeLevel = "ok" | "warn" | "danger" | "info" | "neutral" | "accent";

export function fromLevel(level: string | undefined | null): BadgeLevel {
  switch (level) {
    case "live":
    case "ok":
      return "ok";
    case "warn":
      return "warn";
    case "danger":
    case "error":
      return "danger";
    case "info":
      return "info";
    case "accent":
      return "accent";
    default:
      return "neutral";
  }
}

@customElement("jv-state-badge")
export class JvStateBadge extends LitElement {
  @property({ type: String, reflect: true }) level: BadgeLevel = "neutral";
  @property({ type: String }) label = "";
  @property({ type: Boolean, reflect: true }) pulse = false;
  /** hide the dot (text-only chip) */
  @property({ type: Boolean, reflect: true }) nodot = false;

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        --_c: var(--jv-neutral);
        --_bg: var(--jv-neutral-soft);
      }
      :host([level="ok"]) {
        --_c: var(--jv-ok);
        --_bg: var(--jv-ok-soft);
      }
      :host([level="warn"]) {
        --_c: var(--jv-warn);
        --_bg: var(--jv-warn-soft);
      }
      :host([level="danger"]) {
        --_c: var(--jv-danger);
        --_bg: var(--jv-danger-soft);
      }
      :host([level="info"]) {
        --_c: var(--jv-info);
        --_bg: var(--jv-info-soft);
      }
      :host([level="accent"]) {
        --_c: var(--jv-accent);
        --_bg: var(--jv-accent-soft);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        padding: 2px var(--jv-space-2) 2px var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--_bg);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        line-height: 20px;
        white-space: nowrap;
      }
      .dot {
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--_c);
      }
      :host([nodot]) .dot {
        display: none;
      }
      .text {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  override render() {
    return html`
      <span class="pill">
        <span class="dot ${this.pulse ? "jv-pulse" : ""}" aria-hidden="true"></span>
        <span class="text"><slot>${this.label}</slot></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-state-badge": JvStateBadge;
  }
}
