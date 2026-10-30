/**
 * Alert rendering shared by the documents cards: <ha-alert> when Home
 * Assistant has defined it, otherwise a token-styled block with the right
 * role. Styles for the fallback live in styles.ts (`.alert`).
 */
import { html, nothing, type TemplateResult } from "lit";
import { haDefined } from "../../ha";
import { t } from "../../i18n";
import type { AlertTone } from "./types";

export interface AlertOptions {
  tone: AlertTone;
  title?: string;
  /** body content (text or a template) */
  body?: unknown;
  /** rendered after the body (buttons, a <details>) */
  extra?: unknown;
  /** when set, a dismiss control is shown */
  onDismiss?: () => void;
  /** a button rendered in the action area, e.g. Retry */
  action?: { label: string; run: () => void };
}

function iconFor(tone: AlertTone): string {
  switch (tone) {
    case "success":
      return "✓";
    case "warning":
      return "!";
    case "error":
      return "×";
    default:
      return "i";
  }
}

export function renderAlert(opts: AlertOptions): TemplateResult {
  const actionBtn = opts.action
    ? html`<button class="jv-btn" type="button" slot="action" @click=${opts.action.run}>${opts.action.label}</button>`
    : nothing;
  if (haDefined("ha-alert")) {
    return html`
      <ha-alert
        alert-type=${opts.tone}
        .title=${opts.title ?? ""}
        ?dismissable=${!!opts.onDismiss}
        @alert-dismissed-clicked=${() => opts.onDismiss?.()}
      >
        ${opts.body ?? nothing}${opts.extra ?? nothing}${actionBtn}
      </ha-alert>
    `;
  }
  const role = opts.tone === "error" || opts.tone === "warning" ? "alert" : "status";
  return html`
    <div class="alert ${opts.tone}" role=${role}>
      <span class="alert-icon" aria-hidden="true">${iconFor(opts.tone)}</span>
      <div class="alert-body">
        ${opts.title ? html`<strong>${opts.title}</strong>` : nothing}
        ${opts.body !== undefined && opts.body !== null ? html`<div>${opts.body}</div>` : nothing}
        ${opts.extra ?? nothing}
      </div>
      ${actionBtn}
      ${opts.onDismiss
        ? html`<button class="jv-icon-btn alert-dismiss" type="button" aria-label=${t("Dismiss")} @click=${opts.onDismiss}>
            <span aria-hidden="true">×</span>
          </button>`
        : nothing}
    </div>
  `;
}
