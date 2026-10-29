/**
 * <jarvis-view-memory> - what JARVIS remembers, and the controls to curate it.
 *
 * Three cards (frontend/specs/memory.md):
 *   - What JARVIS Knows: curated facts (jarvis/get_knowledge) with a teach form
 *     (jarvis/add_knowledge) and a per-fact forget button (jarvis/forget_knowledge).
 *   - Person Routines: read-only habits per person (jarvis/get_person_routines).
 *   - Recent Briefings: read-only full text, newest first (jarvis/briefings).
 *
 * The three reads run once when hass arrives (and on Retry); nothing polls.
 * All state is local to this element so the panel's 20 s snapshot refresh can
 * never wipe a half-typed teach form.
 */
import { html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { confirmDialog } from "../components";
import "../components";
import { memoryStyles } from "./memory/styles";
import {
  idle,
  type AddKnowledgeResult,
  type Briefing,
  type BriefingsResult,
  type Fact,
  type ForgetKnowledgeResult,
  type GetKnowledgeResult,
  type Loadable,
  type PersonRoutine,
  type PersonRoutinesResult,
  type TeachSubject,
} from "./memory/types";
import {
  errorMessage,
  groupFacts,
  groupRoutines,
  hedgeTitle,
  humanizeId,
  isHedged,
  isoUtcToLocale,
  epochToLocale,
  occurrencesLabel,
  pct,
  subjectLabel,
} from "./memory/format";

const HA_TAGS = ["ha-card", "ha-icon", "ha-icon-button", "ha-textfield", "ha-alert"];
const BRIEFINGS_LIMIT = 10;

@customElement("jarvis-view-memory")
export class JarvisViewMemory extends JarvisView {
  static override styles = [base, memoryStyles];

  @state() private _facts: Loadable<Fact[]> = idle();
  @state() private _routines: Loadable<Record<string, PersonRoutine[]>> = idle();
  @state() private _briefings: Loadable<Briefing[]> = idle();

  @state() private _teachKey = "";
  @state() private _teachValue = "";
  @state() private _teachSubject: TeachSubject = "household";
  @state() private _teachPending = false;
  @state() private _teachError: string | null = null;
  @state() private _teachNotice: string | null = null;
  @state() private _forgetting = new Set<number>();
  @state() private _forgetError: string | null = null;

  private _started = false;
  private _noticeTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._noticeTimer) clearTimeout(this._noticeTimer);
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    // The base class does not reflect `narrow`; mirror it so :host([narrow]) styles apply.
    if (changed.has("narrow")) this.toggleAttribute("narrow", this.narrow);
    // Fetch once, as soon as hass is available (it may arrive after mount).
    if (!this._started && this.hass) {
      this._started = true;
      void this._loadAll();
    }
  }

  // ── data ───────────────────────────────────────────────────────────────

  private _loadAll(): Promise<void> {
    return Promise.all([this._loadFacts(), this._loadRoutines(), this._loadBriefings()]).then(() => undefined);
  }

  private async _loadFacts(): Promise<void> {
    this._facts = { status: "loading", data: this._facts.data, error: null };
    try {
      const res = await this.ws<GetKnowledgeResult>("jarvis/get_knowledge");
      this._facts = { status: "loaded", data: Array.isArray(res?.facts) ? res.facts : [], error: null };
    } catch (err) {
      this._facts = { status: "error", data: this._facts.data, error: errorMessage(err) };
    }
  }

  private async _loadRoutines(): Promise<void> {
    this._routines = { status: "loading", data: this._routines.data, error: null };
    try {
      const res = await this.ws<PersonRoutinesResult>("jarvis/get_person_routines");
      const routines = res?.routines && typeof res.routines === "object" ? res.routines : {};
      this._routines = { status: "loaded", data: routines, error: null };
    } catch (err) {
      this._routines = { status: "error", data: this._routines.data, error: errorMessage(err) };
    }
  }

  private async _loadBriefings(): Promise<void> {
    this._briefings = { status: "loading", data: this._briefings.data, error: null };
    try {
      const res = await this.ws<BriefingsResult>("jarvis/briefings", { limit: BRIEFINGS_LIMIT });
      this._briefings = { status: "loaded", data: Array.isArray(res?.briefings) ? res.briefings : [], error: null };
    } catch (err) {
      this._briefings = { status: "error", data: this._briefings.data, error: errorMessage(err) };
    }
  }

  private _applyFacts(facts: unknown): void {
    if (Array.isArray(facts)) this._facts = { status: "loaded", data: facts as Fact[], error: null };
  }

  // ── actions ────────────────────────────────────────────────────────────

  private get _canTeach(): boolean {
    return !this._teachPending && !!this._teachKey.trim() && !!this._teachValue.trim();
  }

  private async _teach(e?: Event): Promise<void> {
    e?.preventDefault();
    if (!this._canTeach) return;
    const key = this._teachKey.trim();
    const value = this._teachValue.trim();
    const subject = this._teachSubject;
    this._teachPending = true;
    this._teachError = null;
    this._setNotice(null);
    try {
      const res = await this.ws<AddKnowledgeResult>("jarvis/add_knowledge", {
        key,
        value,
        subject,
        kind: subject === "primary" ? "preference" : "fact",
      });
      this._applyFacts(res?.facts);
      if (res?.ok) {
        this._teachKey = "";
        this._teachValue = "";
        this._setNotice(t("Got it - JARVIS will remember that."));
        this.refresh(); // the snapshot's knowledge stats changed
        await this.updateComplete;
        this.renderRoot.querySelector<HTMLElement>("#teach-key")?.focus();
      } else {
        this._teachError = t("Couldn't save that fact");
      }
    } catch (err) {
      const msg = errorMessage(err);
      this._teachError = msg ? `${t("Couldn't save that fact")} — ${msg}` : t("Couldn't save that fact");
    } finally {
      this._teachPending = false;
    }
  }

  private async _forget(f: Fact): Promise<void> {
    if (this._forgetting.has(f.id)) return;
    const ok = await confirmDialog({
      heading: t("Forget this fact?"),
      message: `${f.key}: ${f.value}`,
      confirmLabel: t("Forget"),
      destructive: true,
    });
    if (!ok) return;
    this._forgetting = new Set([...this._forgetting, f.id]);
    this._forgetError = null;
    try {
      // Keep this a flat literal: tests/unit/test_ws_id_field.py greps the
      // bundle for "jarvis/forget_knowledge" followed by fact_id.
      const res = await this.ws<ForgetKnowledgeResult>("jarvis/forget_knowledge", { fact_id: f.id });
      this._applyFacts(res?.facts);
      this.refresh();
    } catch (err) {
      const msg = errorMessage(err);
      this._forgetError = msg ? `${t("Couldn't forget that")} — ${msg}` : t("Couldn't forget that");
    } finally {
      const next = new Set(this._forgetting);
      next.delete(f.id);
      this._forgetting = next;
    }
  }

  private _setNotice(text: string | null): void {
    if (this._noticeTimer) clearTimeout(this._noticeTimer);
    this._noticeTimer = null;
    this._teachNotice = text;
    if (text) {
      this._noticeTimer = setTimeout(() => {
        this._teachNotice = null;
        this._noticeTimer = null;
      }, 4000);
    }
  }

  private _onTeachKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      void this._teach();
    }
  }

  private _locale(): string | undefined {
    return this.hass?.locale?.language || this.hass?.language || undefined;
  }

  // ── shared bits ────────────────────────────────────────────────────────

  private _loading(): TemplateResult {
    return html`
      <div class="loading" role="status" aria-live="polite" aria-label=${t("Loading...")}>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
      </div>
    `;
  }

  private _error(title: string, message: string | null, retry: () => void): TemplateResult {
    const btn = html`<button class="jv-btn" type="button" slot="action" @click=${retry}>${t("Retry")}</button>`;
    if (haDefined("ha-alert")) {
      return html`<ha-alert alert-type="error" .title=${title}>${message || ""}${btn}</ha-alert>`;
    }
    return html`
      <div class="alert" role="alert">
        <div class="body"><strong>${title}</strong><span>${message || ""}</span></div>
        ${btn}
      </div>
    `;
  }

  private _empty(message: string, icon: string): TemplateResult {
    return html`<jv-empty compact .icon=${icon} .message=${message}></jv-empty>`;
  }

  private _icon(icon: string, fallback: string): TemplateResult {
    return haDefined("ha-icon")
      ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>`
      : html`<span aria-hidden="true">${fallback}</span>`;
  }

  // ── knowledge card ─────────────────────────────────────────────────────

  private _renderKnowledge(): TemplateResult {
    const st = this._facts;
    const facts = st.data ?? [];
    const n = facts.length;
    const badge =
      st.status === "loaded" || st.data
        ? html`<jv-state-badge slot="actions" level="accent" nodot .label=${`${n} ${t(n === 1 ? "fact" : "facts")}`}></jv-state-badge>`
        : nothing;
    return html`
      <jv-section
        icon="mdi:brain"
        .heading=${t("What JARVIS Knows")}
        .subheading=${t("Durable facts & preferences JARVIS recalls in conversation. Teach it something, or forget anything with ✕.")}
        ?loading=${st.status === "loading" && !!st.data}
      >
        ${badge}
        ${this._renderTeachForm()}
        ${this._forgetError ? html`<p class="form-msg error" role="alert">${this._forgetError}</p>` : nothing}
        ${st.status === "error"
          ? this._error(t("Couldn't load memory"), st.error, () => void this._loadFacts())
          : st.status === "loaded" || st.data
            ? n === 0
              ? this._empty(t('Nothing yet. Say "remember that…" to JARVIS, or teach it above.'), "mdi:brain")
              : this._renderFactGroups(facts)
            : this._loading()}
      </jv-section>
    `;
  }

  private _renderTeachForm(): TemplateResult {
    const disabled = this._teachPending;
    const keyLabel = t("what  (e.g. trash day)");
    const valueLabel = t("is  (e.g. Tuesday)");
    const textField = (id: string, label: string, value: string, onInput: (v: string) => void) =>
      haDefined("ha-textfield")
        ? html`<ha-textfield
            id=${id}
            .label=${label}
            .value=${value}
            .disabled=${disabled}
            autocomplete="off"
            @input=${(e: Event) => onInput((e.target as HTMLInputElement).value)}
            @keydown=${this._onTeachKeydown}
          ></ha-textfield>`
        : html`<label class="visually-hidden" for=${id}>${label}</label>
            <input
              id=${id}
              type="text"
              autocomplete="off"
              placeholder=${label}
              .value=${value}
              ?disabled=${disabled}
              @input=${(e: Event) => onInput((e.target as HTMLInputElement).value)}
              @keydown=${this._onTeachKeydown}
            />`;
    return html`
      <form class="teach" @submit=${this._teach} aria-label=${t("Teach")}>
        <div class="field">${textField("teach-key", keyLabel, this._teachKey, (v) => (this._teachKey = v))}</div>
        <div class="field">${textField("teach-value", valueLabel, this._teachValue, (v) => (this._teachValue = v))}</div>
        <div class="field subject">
          <label for="teach-subject">${t("Subject")}</label>
          <select
            id="teach-subject"
            .value=${this._teachSubject}
            ?disabled=${disabled}
            @change=${(e: Event) => (this._teachSubject = (e.target as HTMLSelectElement).value === "primary" ? "primary" : "household")}
          >
            <option value="household" ?selected=${this._teachSubject === "household"}>${t("Household")}</option>
            <option value="primary" ?selected=${this._teachSubject === "primary"}>${t("About me")}</option>
          </select>
        </div>
        <button class="jv-btn primary submit" type="submit" ?disabled=${!this._canTeach}>${t("Teach")}</button>
      </form>
      ${this._teachError ? html`<p class="form-msg error" role="alert">${this._teachError}</p>` : nothing}
      ${this._teachNotice ? html`<p class="form-msg ok" role="status" aria-live="polite">${this._teachNotice}</p>` : nothing}
    `;
  }

  private _renderFactGroups(facts: Fact[]): TemplateResult {
    const locale = this._locale();
    return html`
      ${groupFacts(facts).map(
        ([subject, list]) => html`
          <section class="group" aria-label=${subjectLabel(subject)}>
            <h3 class="group-head">${subjectLabel(subject)}</h3>
            <ul>
              ${list.map((f) => this._renderFact(f, locale))}
            </ul>
          </section>
        `,
      )}
    `;
  }

  private _renderFact(f: Fact, locale?: string): TemplateResult {
    const busy = this._forgetting.has(f.id);
    const forgetLabel = t("Forget");
    const forgetTitle = t("Forget this");
    const forget = () => void this._forget(f);
    const updated = epochToLocale(f.updated_at, locale);
    return html`
      <li class="fact ${busy ? "busy" : ""}">
        <div class="text">
          <span class="key">${f.key}</span>
          <span class="value" title=${updated}>${f.value}</span>
        </div>
        ${isHedged(f) ? html`<span class="marker" role="img" title=${hedgeTitle(f)} aria-label=${hedgeTitle(f)}>~</span>` : nothing}
        ${f.expires_at !== null && f.expires_at !== undefined
          ? html`<span class="marker" role="img" title=${`${t("expires")} ${epochToLocale(f.expires_at, locale)}`} aria-label=${t("expires")}>⌛</span>`
          : nothing}
        ${haDefined("ha-icon-button")
          ? html`<ha-icon-button .label=${forgetLabel} title=${forgetTitle} .disabled=${busy} @click=${forget}>
              ${this._icon("mdi:close", "✕")}
            </ha-icon-button>`
          : html`<button class="jv-icon-btn" type="button" aria-label=${forgetLabel} title=${forgetTitle} ?disabled=${busy} @click=${forget}>
              ${this._icon("mdi:close", "✕")}
            </button>`}
      </li>
    `;
  }

  // ── routines card ──────────────────────────────────────────────────────

  private _renderRoutines(): TemplateResult {
    const st = this._routines;
    const groups = st.data ? groupRoutines(st.data) : [];
    return html`
      <jv-section
        icon="mdi:account-clock-outline"
        .heading=${t("Person Routines")}
        .subheading=${t("Habits JARVIS has confidently attributed to one person, from 30 days of sole-occupant activity — separate from household-wide facts above.")}
        ?loading=${st.status === "loading" && !!st.data}
      >
        <jv-state-badge slot="actions" level="info" nodot .label=${t("Learned")}></jv-state-badge>
        ${st.status === "error"
          ? this._error(t("Couldn't load routines"), st.error, () => void this._loadRoutines())
          : st.status === "loaded" || st.data
            ? groups.length === 0
              ? this._empty(
                  t("Nothing person-specific learned yet — JARVIS needs a few weeks of sole-occupant data before routines are confidently individual."),
                  "mdi:account-clock-outline",
                )
              : groups.map(
                  ([person, items]) => html`
                    <section class="group" aria-label=${humanizeId(person)}>
                      <h3 class="group-head">${humanizeId(person)}</h3>
                      <ul>
                        ${items.map((r) => this._renderRoutine(r))}
                      </ul>
                    </section>
                  `,
                )
            : this._loading()}
      </jv-section>
    `;
  }

  private _renderRoutine(r: PersonRoutine): TemplateResult {
    const p = pct(r.confidence);
    return html`
      <li class="routine">
        <p class="desc">${r.description || r.pattern_type || "—"}</p>
        <div class="meta">
          <div class="bar" role="img" aria-label=${`${p}%`}><span style=${`width:${p}%`}></span></div>
          <span class="pct">${p}% · ${occurrencesLabel(r.occurrences)}</span>
        </div>
      </li>
    `;
  }

  // ── briefings card ─────────────────────────────────────────────────────

  private _renderBriefings(): TemplateResult {
    const st = this._briefings;
    const list = st.data ?? [];
    const locale = this._locale();
    return html`
      <jv-section
        icon="mdi:newspaper-variant-outline"
        .heading=${t("Recent Briefings")}
        .subheading=${t("The full briefings JARVIS delivered — read here when a phone notification truncated a long one.")}
        ?loading=${st.status === "loading" && !!st.data}
      >
        <jv-state-badge slot="actions" level="neutral" nodot .label=${t("Full text")}></jv-state-badge>
        ${st.status === "error"
          ? this._error(t("Couldn't load briefings"), st.error, () => void this._loadBriefings())
          : st.status === "loaded" || st.data
            ? list.length === 0
              ? this._empty(t("No briefings yet — they appear here once JARVIS has delivered one."), "mdi:newspaper-variant-outline")
              : html`<ol>
                  ${list.map((b, i) => {
                    const when = isoUtcToLocale(b.timestamp, locale);
                    const label = i === 0 ? (when ? `${when} · ${t("latest")}` : t("latest")) : when;
                    return html`
                      <li class="briefing ${i === 0 ? "latest" : ""}">
                        ${label ? html`<span class="when">${label}</span>` : nothing}
                        <p>${String(b.text ?? "")}</p>
                      </li>
                    `;
                  })}
                </ol>`
            : this._loading()}
      </jv-section>
    `;
  }

  // ── render ─────────────────────────────────────────────────────────────

  override render() {
    return html`
      <div class="layout">
        <div class="col">${this._renderKnowledge()}</div>
        <div class="col">${this._renderRoutines()} ${this._renderBriefings()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-memory": JarvisViewMemory;
  }
}
