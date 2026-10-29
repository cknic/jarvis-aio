/**
 * <jarvis-suggestions-list .hass .suggestions> - the primary card: pending
 * automation suggestions with approve / dismiss and the payload preview.
 * Expanded / busy / done state is keyed by suggestion id so a snapshot poll
 * re-render never collapses an open preview (spec D1 "live-refresh guard").
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws } from "../../ws";
import { watchDefinitions } from "../../ha";
import { confirmDialog } from "../../components";
import type { Hass } from "../../types";
import type { Suggestion, SuggestionActionResult } from "./types";
import {
  cardStyles,
  patternLabel,
  patternLevel,
  confidencePct,
  confidenceLevel,
  parsePayload,
  asInt,
  errorMessage,
  toast,
} from "./format";

@customElement("jarvis-suggestions-list")
export class JarvisSuggestionsList extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** null = snapshot not loaded yet */
  @property({ attribute: false }) suggestions: Suggestion[] | null = null;

  @state() private _expanded = new Set<number>();
  @state() private _busy = new Set<number>();
  /** acted on (approved / dismissed); stays faded until the snapshot drops it */
  @state() private _done = new Set<number>();

  static override styles = [
    base,
    cardStyles,
    css`
      .top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--jv-space-3);
        flex-wrap: wrap;
      }
      .conf {
        flex: 0 1 160px;
        min-width: 120px;
        display: grid;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        text-align: right;
      }
      .conf.ok {
        color: var(--jv-ok-text);
      }
      .conf.warn {
        color: var(--jv-warn-text);
      }
      .headline {
        margin: var(--jv-space-3) 0 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .desc {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .evidence {
        margin: var(--jv-space-3) 0 0;
      }
      .evidence .label {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        margin: 0 0 var(--jv-space-1);
      }
      .evidence ul {
        list-style: disc;
        padding-left: 20px;
        display: grid;
        gap: 2px;
      }
      .evidence li {
        overflow-wrap: anywhere;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        margin-top: var(--jv-space-3);
      }
      .chip {
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        padding: 2px var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .seen {
        margin: var(--jv-space-2) 0 0;
      }
      .preview {
        margin-top: var(--jv-space-3);
      }
      .advisory {
        margin: 0 0 var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
        font-size: var(--jv-font-size-s);
      }
      pre {
        margin: 0;
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-s);
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: 60vh;
        overflow: auto;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon"]);
  }

  private _toggle(id: number): void {
    const next = new Set(this._expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this._expanded = next;
  }

  private _setBusy(id: number, on: boolean): void {
    const next = new Set(this._busy);
    if (on) next.add(id);
    else next.delete(id);
    this._busy = next;
  }

  private _markDone(id: number): void {
    this._done = new Set(this._done).add(id);
    this.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  }

  private async _approve(s: Suggestion): Promise<void> {
    const id = asInt(s.id);
    if (this._busy.has(id) || this._done.has(id)) return;
    if (s.pattern_type === "confirm_sequence") {
      const ok = await confirmDialog({
        heading: t("Create automation"),
        message: t("This automation closes a cover automatically when a confirmation sensor fires. Install it?"),
        confirmLabel: t("Install"),
        cancelLabel: t("Cancel"),
      });
      if (!ok) return;
    }
    this._setBusy(id, true);
    try {
      const res = await ws<SuggestionActionResult>(this.hass, "jarvis/suggestion_action", {
        suggestion_id: id,
        action: "approve",
      });
      if (res && res.ok) {
        if (res.installed) {
          toast(this, t('Installed — "{alias}" is now live in Home Assistant', { alias: res.alias ?? "" }), "ok");
        } else {
          toast(this, t("Approved — advisory only ({reason})", { reason: res.reason ?? t("not installable") }), "neutral");
        }
        this._markDone(id);
      } else {
        toast(this, t("Could not approve suggestion"), "danger");
      }
    } catch (err) {
      toast(this, t("Suggestion failed — {error}", { error: errorMessage(err) }), "danger");
    } finally {
      this._setBusy(id, false);
    }
  }

  private async _dismiss(s: Suggestion): Promise<void> {
    const id = asInt(s.id);
    if (this._busy.has(id) || this._done.has(id)) return;
    this._setBusy(id, true);
    try {
      const res = await ws<SuggestionActionResult>(this.hass, "jarvis/suggestion_action", {
        suggestion_id: id,
        action: "dismiss",
      });
      if (res && res.ok) {
        toast(this, t("Dismissed"), "neutral");
        this._markDone(id);
      } else {
        toast(this, t("Could not dismiss suggestion"), "danger");
      }
    } catch (err) {
      toast(this, t("Suggestion failed — {error}", { error: errorMessage(err) }), "danger");
    } finally {
      this._setBusy(id, false);
    }
  }

  private _friendlyName(entityId: string): string {
    const name = this.hass?.states?.[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? `${name} (${entityId})` : entityId;
  }

  private _renderItem(s: Suggestion) {
    const id = asInt(s.id);
    const pct = confidencePct(s.confidence);
    const tone = confidenceLevel(pct);
    const expanded = this._expanded.has(id);
    const busy = this._busy.has(id);
    const done = this._done.has(id);
    const disabled = busy || done;
    const payload = parsePayload(s.yaml);
    const evidence = Array.isArray(s.evidence) ? s.evidence.filter((e) => typeof e === "string" && e) : [];
    const entities = Array.isArray(s.entities) ? s.entities.filter((e) => typeof e === "string" && e) : [];
    const count = asInt(s.count);
    const preId = `pre-${id}`;
    return html`
      <li class="item ${done ? "faded" : ""}" aria-busy=${busy ? "true" : "false"}>
        <div class="top">
          <jv-state-badge nodot level=${patternLevel(s.pattern_type)} .label=${patternLabel(s.pattern_type)}></jv-state-badge>
          <div class="conf ${tone}">
            <span>${t("{pct}% confident", { pct })}</span>
            <div class="bar ${tone}" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100" aria-label=${t("{pct}% confident", { pct })}>
              <span style="width:${pct}%"></span>
            </div>
          </div>
        </div>
        ${s.why_headline ? html`<p class="headline">${s.why_headline}</p>` : nothing}
        ${s.description ? html`<p class="desc">${s.description}</p>` : nothing}
        ${evidence.length
          ? html`
              <div class="evidence">
                <p class="label">${t("What JARVIS observed")}</p>
                <ul>
                  ${evidence.map((e) => html`<li>${e}</li>`)}
                </ul>
              </div>
            `
          : nothing}
        ${entities.length
          ? html`<div class="chips">${entities.map((e) => html`<span class="chip" title=${this._friendlyName(e)}>${e}</span>`)}</div>`
          : nothing}
        ${count > 0 ? html`<p class="seen jv-muted">${t("Seen {count}× in 30 days", { count })}</p>` : nothing}
        <div class="actions">
          <button class="jv-btn primary" type="button" ?disabled=${disabled} @click=${() => void this._approve(s)}>
            ${payload.advisory ? t("Acknowledge") : t("Create automation")}
          </button>
          <button class="jv-btn" type="button" ?disabled=${disabled} @click=${() => void this._dismiss(s)}>${t("Dismiss")}</button>
          <button
            class="jv-btn text"
            type="button"
            aria-expanded=${expanded ? "true" : "false"}
            aria-controls=${expanded ? preId : nothing}
            @click=${() => this._toggle(id)}
          >
            ${expanded ? t("Hide automation") : t("Show automation")}
          </button>
        </div>
        ${expanded
          ? html`
              <div class="preview" id=${preId}>
                ${payload.advisory
                  ? html`<p class="advisory">${t("Advisory only — approving records your acknowledgement but installs nothing.")}</p>`
                  : nothing}
                ${payload.text ? html`<pre>${payload.text}</pre>` : html`<p class="jv-muted">${t("No automation payload.")}</p>`}
              </div>
            `
          : nothing}
      </li>
    `;
  }

  override render() {
    const list = this.suggestions;
    const n = list ? list.length : 0;
    return html`
      <jv-section .heading=${t("Suggestions")} icon="mdi:lightbulb-on-outline" flush>
        ${n > 0
          ? html`<jv-state-badge slot="actions" nodot level="accent" .label=${t("{n} to review", { n })}></jv-state-badge>`
          : nothing}
        ${list === null
          ? html`<div class="skeleton-rows" role="status" aria-label=${t("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`
          : n === 0
            ? html`
                <jv-empty
                  compact
                  icon="mdi:lightbulb-outline"
                  .heading=${t("No suggestions right now")}
                  .message=${t(
                    "JARVIS proposes automations as it notices routines repeat — a light you turn on each evening, a scene after a button press, the heat when it's cold. As patterns build up, they'll appear here for you to review and approve. Nothing is ever created without your say-so.",
                  )}
                ></jv-empty>
              `
            : html`
                <p class="intro">
                  ${t(
                    "Automations JARVIS has learned from watching your routines. Approve to create one in Home Assistant, or dismiss it. Nothing runs until you approve.",
                  )}
                </p>
                <ul>
                  ${list.map((s) => this._renderItem(s))}
                </ul>
              `}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-suggestions-list": JarvisSuggestionsList;
  }
}

