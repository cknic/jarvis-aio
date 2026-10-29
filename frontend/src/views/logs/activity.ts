/**
 * <jv-logs-activity> - the Activity Feed card (jarvis/get_activity_log,
 * newest first). A debounced search filters `msg` and `tag` client-side; the
 * urgency is shown as a left border colour plus the tag text.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../theme/base";
import { t } from "../../i18n";
import { haDefined, watchDefinitions } from "../../ha";
import "../../components";
import { cardStyles, keyed, matches } from "./format";
import type { ActivityEntry } from "./types";

const DEBOUNCE_MS = 200;

function urgencyClass(u: string | undefined): string {
  switch ((u || "").toLowerCase()) {
    case "critical":
      return "u-critical";
    case "high":
      return "u-high";
    case "medium":
      return "u-medium";
    case "muted":
      return "u-muted";
    default:
      return "u-low";
  }
}

@customElement("jv-logs-activity")
export class JvLogsActivity extends LitElement {
  /** newest first, as the backend sends it; null until the first load */
  @property({ attribute: false }) entries: ActivityEntry[] | null = null;
  @property({ type: String }) error: string | null = null;

  @state() private _query = "";
  private _debounce: ReturnType<typeof setTimeout> | null = null;

  static override styles = [
    base,
    cardStyles,
    css`
      .scroll {
        max-height: 420px;
        overflow: auto;
        border-top: 1px solid var(--jv-divider);
      }
      .row {
        align-items: flex-start;
        min-height: 36px;
        padding-top: var(--jv-space-2);
        padding-bottom: var(--jv-space-2);
      }
      .row.u-critical {
        border-left-color: var(--jv-danger);
      }
      .row.u-high {
        border-left-color: var(--jv-warn);
      }
      .row.u-medium {
        border-left-color: var(--jv-accent);
      }
      .row.u-low {
        border-left-color: var(--jv-neutral);
      }
      .row.u-muted {
        border-left-color: var(--jv-neutral);
        opacity: 0.6;
      }
      .tag {
        flex: none;
        max-width: 40%;
        font-weight: var(--jv-font-weight-bold);
        font-size: var(--jv-font-size-xs);
        letter-spacing: 0.02em;
        overflow-wrap: anywhere;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, ["ha-alert"]);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = null;
  }

  private _onSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._debounce = null;
      this._query = value;
    }, DEBOUNCE_MS);
  }

  private _renderError() {
    if (!this.error) return nothing;
    const text = t("Could not load the log.");
    return haDefined("ha-alert")
      ? html`<ha-alert alert-type="error" .title=${text}>${this.error}</ha-alert>`
      : html`<div class="banner" role="alert" title=${this.error}>${text} ${this.error}</div>`;
  }

  override render() {
    const loaded = this.entries !== null;
    const all = this.entries ?? [];
    const q = this._query.trim();
    const rows = q ? all.filter((e) => matches(q, e.msg, e.tag)) : all;
    const badge = !loaded
      ? ""
      : q
        ? t("{shown} of {total}", { shown: rows.length, total: all.length })
        : t("Last {total}", { total: all.length });
    return html`
      <jv-section .heading=${t("Activity Feed")} icon="mdi:history" flush .loading=${!loaded && !this.error}>
        ${badge ? html`<jv-state-badge slot="actions" nodot level="neutral" .label=${badge}></jv-state-badge>` : nothing}
        <div class="controls">
          <label class="visually-hidden" for="q">${t("Search activity…")}</label>
          <input id="q" class="search" type="search" placeholder=${t("Search activity…")} autocomplete="off" @input=${this._onSearch} />
        </div>
        ${this._renderError()}
        <div class="scroll">
          ${!loaded && !this.error
            ? html`<div class="state" role="status">${t("Loading...")}</div>`
            : rows.length === 0
              ? html`<div class="state">
                  ${all.length === 0
                    ? t("No activity yet. Enable announcements or observer to see events here.")
                    : t('No events match "{q}".', { q })}
                </div>`
              : html`
                  <ul class="list">
                    ${repeat(
                      keyed(rows, (e) => `${e.ts} ${e.tag ?? ""} ${e.msg ?? ""}`),
                      (k) => k.key,
                      ({ item: e }) => html`
                        <li class="row ${urgencyClass(e.urgency)}" title=${e.source || nothing}>
                          <time>${e.ts}</time>
                          ${e.tag ? html`<span class="tag">${e.tag}</span>` : nothing}
                          <span class="msg">${e.msg || ""}</span>
                        </li>
                      `,
                    )}
                  </ul>
                `}
        </div>
      </jv-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jv-logs-activity": JvLogsActivity;
  }
}
