/**
 * <jarvis-suggestions-goals .hass .goals> - goals JARVIS pursues autonomously:
 * add (text field + Add / Enter), cancel an active goal, delete a finished one
 * (confirmed: hard delete). The goal_action response carries the fresh list,
 * which overrides the snapshot's until the next snapshot arrives.
 */
import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { ws } from "../../ws";
import { haDefined, watchDefinitions } from "../../ha";
import { confirmDialog, type BadgeLevel } from "../../components";
import type { Hass } from "../../types";
import type { Goal, GoalActionResult } from "./types";
import { cardStyles, asInt, capitalise, relativeTime, errorMessage, errorCode, toast } from "./format";

const MAX_OUTCOME = 240;

@customElement("jarvis-suggestions-goals")
export class JarvisSuggestionsGoals extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  /** null = snapshot not loaded yet */
  @property({ attribute: false }) goals: Goal[] | null = null;

  @state() private _draft = "";
  @state() private _creating = false;
  @state() private _fieldError = "";
  @state() private _busy = new Set<number>();
  /** list returned by the last goal_action; wins over `goals` until the snapshot changes */
  @state() private _override: Goal[] | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .add {
        display: flex;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-4) var(--jv-space-3);
        align-items: flex-start;
      }
      .add .field {
        flex: 1 1 auto;
        min-width: 0;
      }
      .add input {
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      .add input::placeholder {
        color: var(--jv-text-3);
      }
      .add ha-textfield {
        width: 100%;
      }
      .add .jv-btn {
        flex: none;
      }
      .goal {
        display: flex;
        gap: var(--jv-space-3);
        align-items: flex-start;
      }
      .goal .main {
        flex: 1 1 auto;
        min-width: 0;
      }
      .goal .trail {
        flex: none;
        margin-top: calc(-1 * var(--jv-space-2));
      }
      .goal .head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .outcome {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .progress {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-2);
      }
      .when {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .empty {
        padding: var(--jv-space-2) var(--jv-space-4) var(--jv-space-4);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-icon", "ha-icon-button", "ha-textfield"]);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("goals") && changed.get("goals") !== undefined) this._override = null;
  }

  private get _list(): Goal[] | null {
    return this._override ?? this.goals;
  }

  private _setBusy(id: number, on: boolean): void {
    const next = new Set(this._busy);
    if (on) next.add(id);
    else next.delete(id);
    this._busy = next;
  }

  private _applyResult(res: GoalActionResult | undefined): void {
    if (res && Array.isArray(res.goals)) this._override = res.goals;
    this.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  }

  private _onInput(e: Event): void {
    const el = e.target as HTMLInputElement & { value?: string };
    this._draft = String(el.value ?? "").slice(0, MAX_OUTCOME);
    if (this._fieldError) this._fieldError = "";
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      void this._create();
    }
  }

  private async _create(): Promise<void> {
    if (this._creating) return;
    const outcome = this._draft.trim();
    if (!outcome) {
      this._fieldError = t("Enter what JARVIS should work toward");
      return;
    }
    this._creating = true;
    try {
      const res = await ws<GoalActionResult>(this.hass, "jarvis/goal_action", { action: "create", outcome });
      toast(this, t("Goal added"), "ok");
      this._draft = "";
      this._fieldError = "";
      this._applyResult(res);
    } catch (err) {
      const code = errorCode(err);
      if (code === "empty_outcome") this._fieldError = t("Enter what JARVIS should work toward");
      else toast(this, t("Could not add goal — {error}", { error: errorMessage(err) }), "danger");
    } finally {
      this._creating = false;
    }
  }

  private async _cancel(g: Goal): Promise<void> {
    const id = asInt(g.id);
    if (this._busy.has(id)) return;
    this._setBusy(id, true);
    try {
      const res = await ws<GoalActionResult>(this.hass, "jarvis/goal_action", { action: "cancel", goal_id: id });
      toast(this, res && res.ok ? t("Goal cancelled") : t("Goal was already closed"), res && res.ok ? "ok" : "neutral");
      this._applyResult(res);
    } catch (err) {
      toast(this, t("Cancel failed — {error}", { error: errorMessage(err) }), "danger");
    } finally {
      this._setBusy(id, false);
    }
  }

  private async _delete(g: Goal): Promise<void> {
    const id = asInt(g.id);
    if (this._busy.has(id)) return;
    const ok = await confirmDialog({
      heading: t("Delete this goal from history?"),
      message: g.title || g.outcome || "",
      confirmLabel: t("Delete"),
      cancelLabel: t("Cancel"),
      destructive: true,
    });
    if (!ok) return;
    this._setBusy(id, true);
    try {
      const res = await ws<GoalActionResult>(this.hass, "jarvis/goal_action", { action: "delete", goal_id: id });
      toast(this, t("Goal deleted"), "ok");
      this._applyResult(res);
    } catch (err) {
      toast(this, t("Delete failed — {error}", { error: errorMessage(err) }), "danger");
    } finally {
      this._setBusy(id, false);
    }
  }

  private _status(status: string | undefined): { label: string; level: BadgeLevel } {
    switch (status) {
      case "active":
        return { label: t("Active"), level: "accent" };
      case "done":
        return { label: t("Done"), level: "ok" };
      case "failed":
        return { label: t("Failed"), level: "danger" };
      case "cancelled":
        return { label: t("Cancelled"), level: "neutral" };
      default:
        return { label: capitalise(String(status ?? "")), level: "neutral" };
    }
  }

  private _iconButton(icon: string, label: string, disabled: boolean, onClick: () => void) {
    if (haDefined("ha-icon-button") && haDefined("ha-icon")) {
      return html`
        <ha-icon-button .label=${label} title=${label} .disabled=${disabled} @click=${onClick}>
          <ha-icon .icon=${icon}></ha-icon>
        </ha-icon-button>
      `;
    }
    return html`<button class="jv-btn text" type="button" title=${label} ?disabled=${disabled} @click=${onClick}>${label}</button>`;
  }

  private _renderGoal(g: Goal) {
    const id = asInt(g.id);
    const active = g.status === "active";
    const st = this._status(g.status);
    const total = asInt(g.steps_total);
    const done = asInt(g.steps_done);
    const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
    const busy = this._busy.has(id);
    let when = "";
    if (active) {
      const dl = relativeTime(g.deadline_ts);
      const nx = relativeTime(g.next_check_ts);
      if (g.deadline_ts && dl) when = t("Deadline {rel}", { rel: dl });
      else if (nx) when = t("Next check {rel}", { rel: nx });
    } else if (g.last_result) {
      when = g.last_result;
    }
    return html`
      <li class="item ${active ? "" : "dim"}" aria-busy=${busy ? "true" : "false"}>
        <div class="goal">
          <div class="main">
            <div class="head">
              <jv-state-badge level=${st.level} .label=${st.label}></jv-state-badge>
              ${g.title ? html`<p class="title">${g.title}</p>` : nothing}
            </div>
            ${g.outcome && g.outcome !== g.title ? html`<p class="outcome">${g.outcome}</p>` : nothing}
            ${total > 0
              ? html`
                  <div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100" aria-label=${t("{done}/{total} steps", { done, total })}>
                      <span style="width:${pct}%"></span>
                    </div>
                    <span class="jv-muted">${t("{done}/{total} steps", { done, total })}</span>
                  </div>
                `
              : nothing}
            ${when ? html`<p class="when jv-muted">${when}</p>` : nothing}
          </div>
          <div class="trail">
            ${active
              ? this._iconButton("mdi:close", t("Cancel this goal"), busy, () => void this._cancel(g))
              : this._iconButton("mdi:delete-outline", t("Delete this goal"), busy, () => void this._delete(g))}
          </div>
        </div>
      </li>
    `;
  }

  private _renderInput() {
    const placeholder = t("Give JARVIS a goal to work toward…");
    const field = haDefined("ha-textfield")
      ? html`
          <ha-textfield
            .label=${placeholder}
            .value=${this._draft}
            .disabled=${this._creating}
            .maxLength=${MAX_OUTCOME}
            .errorMessage=${this._fieldError}
            .invalid=${!!this._fieldError}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          ></ha-textfield>
        `
      : html`
          <label class="visually-hidden" for="goal-input">${placeholder}</label>
          <input
            id="goal-input"
            type="text"
            .value=${this._draft}
            placeholder=${placeholder}
            maxlength=${MAX_OUTCOME}
            ?disabled=${this._creating}
            aria-invalid=${this._fieldError ? "true" : "false"}
            aria-describedby=${this._fieldError ? "goal-error" : nothing}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          />
          ${this._fieldError ? html`<p class="inline-error" id="goal-error" role="alert">${this._fieldError}</p>` : nothing}
        `;
    return html`
      <div class="add">
        <div class="field">${field}</div>
        <button class="jv-btn primary" type="button" ?disabled=${this._creating} @click=${() => void this._create()}>${t("Add")}</button>
      </div>
    `;
  }

  override render() {
    const list = this._list;
    const activeCount = list ? list.filter((g) => g.status === "active").length : 0;
    return html`
      <jv-section .heading=${t("Goals")} icon="mdi:flag-checkered" flush>
        ${list && activeCount > 0
          ? html`<jv-state-badge slot="actions" nodot level="accent" .label=${t("{n} active", { n: activeCount })}></jv-state-badge>`
          : nothing}
        ${this._renderInput()}
        ${list === null
          ? html`<div class="skeleton-rows" role="status" aria-label=${t("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`
          : list.length === 0
            ? html`<p class="empty jv-muted">${t("No goals yet. Add one above, or ask JARVIS to set one.")}</p>`
            : html`<ul>${list.map((g) => this._renderGoal(g))}</ul>`}
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-suggestions-goals": JarvisSuggestionsGoals;
  }
}
