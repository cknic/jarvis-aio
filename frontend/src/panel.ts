/**
 * <jarvis-panel> - the shell Home Assistant mounts for the JARVIS sidebar
 * panel (panel_register.py: webcomponent "jarvis-panel", url /jarvis,
 * admin-only, embed_iframe=False, so HA's own elements are available).
 *
 * HA sets the properties `hass`, `narrow`, `route` ({prefix, path}) and
 * `panel` ({config}). The shell:
 *   - draws the app bar with HA's header tokens (+ ha-menu-button on narrow),
 *     a tab bar on wide screens and a bottom nav on narrow ones,
 *   - maps /jarvis/<view> to the view element from views/index.ts (default
 *     overview), navigating with pushState + "location-changed" so deep links
 *     and the back button work,
 *   - loads the jarvis/get_panel_data snapshot once, refreshes it every 20 s
 *     while the tab is visible and whenever a view fires "jarvis-refresh",
 *   - passes hass / narrow / data / route to the active view and handles
 *     "jarvis-navigate" {view, path} from it,
 *   - shows an ha-alert (or a styled fallback) when the WebSocket fails,
 *   - bootstraps translations from hass.language / config.ui_language.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic, type StaticValue } from "lit/static-html.js";
import { base } from "./theme/base";
import { ws, WsError } from "./ws";
import { t, loadLanguage, resolveLanguage, currentLanguage } from "./i18n";
import { haDefined, watchDefinitions, toggleHaMenu, navigateHa } from "./ha";
import { VIEWS, DEFAULT_VIEW, findView, type ViewDef } from "./views/index";
import { fromLevel } from "./components";
import type { Hass, PanelData, PanelInfo, Route, JarvisNavigateDetail } from "./types";
import "./components";

const REFRESH_MS = 20_000;
const REFRESH_DEBOUNCE_MS = 250;
const LANG_GATE_MS = 1500;
const HA_TAGS = ["ha-icon", "ha-icon-button", "ha-menu-button", "ha-alert"];

@customElement("jarvis-panel")
class JarvisPanel extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ attribute: false }) route?: Route;
  @property({ attribute: false }) panel?: PanelInfo;

  @state() private _data: PanelData | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;
  @state() private _langReady = false;
  @state() private _view: string = DEFAULT_VIEW;

  private _timer: ReturnType<typeof setInterval> | null = null;
  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _lastFetch = 0;
  private _inFlight: Promise<void> | null = null;
  private _tags = new Map<string, StaticValue>();

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--jv-bg);
        color: var(--jv-text);
        overflow-y: auto;
        overscroll-behavior: contain;
        /* the panel's own width drives the bottom-nav label rule below */
        container: jv-panel / inline-size;
        /* The height of the stuck app bar (56 px, plus the 48 px tab row
           below 1100 px). Views inherit it for their own sticky offsets, and
           scroll-padding keeps a focused control or a scrollIntoView target
           from landing underneath the header / the bottom nav. */
        --jv-sticky-top: calc(var(--jv-header-height) + 48px);
        scroll-padding-top: var(--jv-sticky-top);
      }
      @media (min-width: 1100px) {
        :host {
          --jv-sticky-top: var(--jv-header-height);
        }
      }
      :host([narrow]) {
        --jv-sticky-top: var(--jv-header-height);
        scroll-padding-bottom: calc(56px + env(safe-area-inset-bottom));
      }

      /* ── app bar ──────────────────────────────────────────────────── */
      /* Everything drawn on the header uses the --jv-header-* tokens
         (HA's --app-header-*), never the page palette: a theme may paint
         the header in its primary colour. */
      header {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 var(--jv-space-2);
        padding: env(safe-area-inset-top) var(--jv-space-2) 0 var(--jv-space-2);
        background: var(--jv-header-bg);
        color: var(--jv-header-text);
        border-bottom: var(--jv-header-border);
      }
      :host([narrow]) header {
        flex-wrap: nowrap;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-height: var(--jv-header-height);
        padding-left: var(--jv-space-1);
        min-width: 0;
      }
      :host([narrow]) .brand {
        padding-left: 0;
        flex: 1 1 auto;
      }
      /* the mark is an inline SVG drawn in currentColor (the header text) */
      .logo {
        width: 28px;
        height: 28px;
        flex: none;
        color: inherit;
      }
      h1 {
        margin: 0;
        min-width: 0;
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-normal);
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ver {
        margin-left: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        opacity: 0.7;
      }
      /* keep the narrow app bar one 56 px row; the version is in Overview */
      :host([narrow]) .ver {
        display: none;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .bar-actions {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-header-height);
        flex: none;
      }
      .menu-btn,
      ha-menu-button {
        flex: none;
        color: inherit;
      }
      header .jv-icon-btn:hover {
        background: var(--jv-header-hover);
      }
      header .jv-icon-btn:focus-visible {
        box-shadow: var(--jv-header-focus-ring);
      }
      header jv-state-badge {
        --jv-text: var(--jv-header-text);
        --jv-surface: var(--jv-header-bg);
      }

      /* ── tabs (wide) ──────────────────────────────────────────────── */
      /* Below 1100px the tabs take a full second row under the brand;
         above it they sit inline, centred between brand and actions. */
      [role="tablist"] {
        display: flex;
        align-items: stretch;
        flex: 1 1 100%;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
        order: 10;
        margin: 0 calc(-1 * var(--jv-space-2));
        padding: 0 var(--jv-space-2);
      }
      [role="tablist"]::-webkit-scrollbar {
        display: none;
      }
      @media (min-width: 1100px) {
        [role="tablist"] {
          flex: 1 1 auto;
          order: 0;
          justify-content: center;
          margin: 0;
          padding: 0;
        }
      }
      .tab {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--jv-space-2);
        min-height: 48px;
        padding: 0 var(--jv-space-4);
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: inherit;
        opacity: 0.72;
        font: inherit;
        font-weight: var(--jv-font-weight-medium);
        white-space: nowrap;
        cursor: pointer;
        transition: opacity var(--jv-ease), background-color var(--jv-ease);
        --mdc-icon-size: 20px;
      }
      .tab:hover {
        opacity: 1;
        background: var(--jv-header-hover);
      }
      .tab[aria-selected="true"] {
        opacity: 1;
        border-bottom-color: var(--jv-header-indicator);
      }
      .tab:focus-visible {
        box-shadow: var(--jv-header-focus-ring);
      }

      /* ── content ──────────────────────────────────────────────────── */
      main {
        flex: 1 0 auto;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: var(--jv-space-4);
        outline: none;
      }
      :host([narrow]) main {
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .alert {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-4);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        border-left: 4px solid var(--jv-danger);
        background: var(--jv-danger-soft);
      }
      .alert .body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .alert strong {
        display: block;
        font-weight: var(--jv-font-weight-medium);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-4);
      }
      .gate {
        padding: var(--jv-space-5);
        text-align: center;
        color: var(--jv-text-2);
      }

      /* ── bottom nav (narrow) ──────────────────────────────────────── */
      nav.bottom {
        position: sticky;
        bottom: 0;
        z-index: 3;
        display: flex;
        padding-bottom: env(safe-area-inset-bottom);
        background: var(--jv-surface);
        border-top: 1px solid var(--jv-divider);
      }
      .nav-item {
        appearance: none;
        flex: 1 1 0;
        min-width: 0;
        min-height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: var(--jv-space-1) 2px;
        border: 0;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-xs);
        cursor: pointer;
        --mdc-icon-size: 24px;
      }
      .nav-item[aria-current="page"] {
        color: var(--jv-accent-text);
      }
      .nav-item .label {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      /* Seven destinations do not fit labelled on a phone (an item is ~55 px
         at 412 px; "Suggestions" / "Einstellungen" need 60-70 px). When the
         panel itself is narrower than 520 px (a container query on :host, so
         the harness frame and HA's narrow layout measure the same thing)
         only the current view keeps its label and gets twice the room -
         Material's "selected" label mode; the others are icon-only with
         their aria-label. */
      @container jv-panel (max-width: 519px) {
        nav.bottom:not(.no-icons) .nav-item[aria-current="page"] {
          flex-grow: 2;
        }
        /* only when there is an icon to leave behind (ha-icon undefined =
           the harness / a very early HA load) */
        nav.bottom:not(.no-icons) .nav-item:not([aria-current="page"]) .label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
      }
      .nav-item:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
    `,
  ];

  // ── lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    window.addEventListener("location-changed", this._onLocationChanged);
    window.addEventListener("popstate", this._onLocationChanged);
    document.addEventListener("visibilitychange", this._onVisibility);
    this.addEventListener("jarvis-refresh", this._onRefreshRequest);
    this.addEventListener("jarvis-navigate", this._onNavigateRequest as EventListener);
    if (!this.route) this._syncViewFromLocation();
    this._startTimer();
    this._gateLanguage();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("location-changed", this._onLocationChanged);
    window.removeEventListener("popstate", this._onLocationChanged);
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.removeEventListener("jarvis-refresh", this._onRefreshRequest);
    this.removeEventListener("jarvis-navigate", this._onNavigateRequest as EventListener);
    this._stopTimer();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("route")) this._syncViewFromRoute();
    if (changed.has("hass") && this.hass) {
      if (!changed.get("hass")) {
        // first hass: fetch now and resolve the UI language
        void this._load();
      }
      void this._ensureLanguage();
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("_view") && changed.get("_view") !== undefined) {
      // new view: start at the top and move focus to the content region
      this.scrollTop = 0;
      const main = this.renderRoot.querySelector<HTMLElement>("main");
      main?.focus({ preventScroll: true });
    }
  }

  // ── routing ───────────────────────────────────────────────────────────────

  private get _prefix(): string {
    return this.route?.prefix || "/jarvis";
  }

  private _syncViewFromRoute(): void {
    const seg = (this.route?.path || "").split("/").filter(Boolean)[0];
    this._view = findView(seg)?.key ?? DEFAULT_VIEW;
  }

  private _syncViewFromLocation(): void {
    const prefix = this._prefix;
    const path = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : "";
    const seg = path.split("/").filter(Boolean)[0];
    this._view = findView(seg)?.key ?? DEFAULT_VIEW;
    if (!this.route) this.route = { prefix, path: path || `/${this._view}` };
  }

  private _onLocationChanged = (): void => {
    // In HA the host updates `route`; standalone (harness without a router,
    // tests) we derive it from the URL ourselves.
    const prefix = this._prefix;
    if (!location.pathname.startsWith(prefix)) return;
    const path = location.pathname.slice(prefix.length);
    if (!this.route || this.route.path !== path) {
      this.route = { prefix, path };
    }
  };

  /** Navigate to a view (pushState + location-changed, like HA's navigate()). */
  navigate(view: string, subPath?: string, replace = false): void {
    const def = findView(view) ?? findView(DEFAULT_VIEW)!;
    const sub = subPath ? `/${subPath.replace(/^\/+/, "")}` : "";
    const url = `${this._prefix}/${def.key}${sub}`;
    if (location.pathname === url && this._view === def.key) return;
    navigateHa(url, replace);
  }

  private _onNavigateRequest = (e: CustomEvent<JarvisNavigateDetail>): void => {
    e.stopPropagation();
    const d = e.detail || ({} as JarvisNavigateDetail);
    if (d.view) this.navigate(d.view, d.path);
  };

  // ── data ──────────────────────────────────────────────────────────────────

  private _startTimer(): void {
    if (this._timer) return;
    this._timer = setInterval(() => {
      if (document.visibilityState === "visible") void this._load();
    }, REFRESH_MS);
  }

  private _stopTimer(): void {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = null;
  }

  private _onVisibility = (): void => {
    if (document.visibilityState === "visible" && Date.now() - this._lastFetch > REFRESH_MS) {
      void this._load();
    }
  };

  private _onRefreshRequest = (e: Event): void => {
    e.stopPropagation();
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._debounce = null;
      void this._load();
    }, REFRESH_DEBOUNCE_MS);
  };

  /** Fetch the snapshot. Public so the harness / tests can force a refresh. */
  async refresh(): Promise<void> {
    return this._load();
  }

  private _load(): Promise<void> {
    if (!this.hass) return Promise.resolve();
    if (this._inFlight) return this._inFlight;
    this._loading = true;
    this._inFlight = (async () => {
      try {
        const data = await ws<PanelData>(this.hass, "jarvis/get_panel_data");
        this._data = data;
        this._error = null;
        this._lastFetch = Date.now();
        void this._ensureLanguage();
      } catch (err) {
        const e = err instanceof WsError ? err : WsError.from("jarvis/get_panel_data", err);
        this._error = e.message || e.code;
      } finally {
        this._loading = false;
        this._inFlight = null;
      }
    })();
    return this._inFlight;
  }

  // ── i18n ──────────────────────────────────────────────────────────────────

  private _gateLanguage(): void {
    // Never block the UI on a slow translation fetch.
    if (this._langReady) return;
    setTimeout(() => {
      this._langReady = true;
    }, LANG_GATE_MS);
  }

  private async _ensureLanguage(): Promise<void> {
    const lang = resolveLanguage(this._data?.config?.ui_language, this.hass?.language);
    if (lang.toLowerCase() === currentLanguage() && this._langReady) return;
    const changed = await loadLanguage(lang);
    this._langReady = true;
    if (changed) {
      this.requestUpdate();
      this.renderRoot
        .querySelectorAll<LitElement>("[data-jv-view]")
        .forEach((v) => v.requestUpdate?.());
    }
  }

  // ── keyboard tabs ─────────────────────────────────────────────────────────

  private _onTabKeydown(e: KeyboardEvent): void {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const idx = VIEWS.findIndex((v) => v.key === this._view);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % VIEWS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + VIEWS.length) % VIEWS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = VIEWS.length - 1;
    const target = VIEWS[next];
    this.navigate(target.key);
    this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLElement>(`[role="tab"][data-view="${target.key}"]`)?.focus();
    });
  }

  // ── render ────────────────────────────────────────────────────────────────

  private _tag(name: string): StaticValue {
    let v = this._tags.get(name);
    if (!v) {
      v = unsafeStatic(name);
      this._tags.set(name, v);
    }
    return v;
  }

  private _icon(icon: string) {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  private _renderMenuButton() {
    if (haDefined("ha-menu-button")) {
      return html`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`;
    }
    return html`
      <button class="jv-icon-btn menu-btn" type="button" aria-label=${t("Menu")} @click=${() => toggleHaMenu(this)}>
        ${haDefined("ha-icon") ? this._icon("mdi:menu") : html`<span aria-hidden="true">≡</span>`}
      </button>
    `;
  }

  private _renderRefreshButton() {
    const label = t("Refresh");
    if (haDefined("ha-icon-button")) {
      return html`
        <ha-icon-button .label=${label} .disabled=${this._loading} @click=${() => void this._load()}>
          ${this._icon("mdi:refresh")}
        </ha-icon-button>
      `;
    }
    return html`
      <button class="jv-icon-btn" type="button" aria-label=${label} ?disabled=${this._loading} @click=${() => void this._load()}>
        ${haDefined("ha-icon") ? this._icon("mdi:refresh") : html`<span aria-hidden="true">↻</span>`}
      </button>
    `;
  }

  private _renderTabs() {
    return html`
      <div role="tablist" aria-label=${t("Sections")} @keydown=${this._onTabKeydown}>
        ${VIEWS.map((v) => this._renderTab(v))}
      </div>
    `;
  }

  private _renderTab(v: ViewDef) {
    const selected = v.key === this._view;
    return html`
      <button
        class="tab"
        type="button"
        role="tab"
        id="tab-${v.key}"
        data-view=${v.key}
        aria-selected=${selected ? "true" : "false"}
        aria-controls="main"
        tabindex=${selected ? 0 : -1}
        @click=${() => this.navigate(v.key)}
      >
        ${this._icon(v.icon)}
        <span>${t(v.title)}</span>
      </button>
    `;
  }

  private _renderBottomNav() {
    return html`
      <nav class="bottom ${haDefined("ha-icon") ? "" : "no-icons"}" aria-label=${t("Sections")}>
        ${VIEWS.map(
          (v) => html`
            <button
              class="nav-item"
              type="button"
              data-view=${v.key}
              aria-current=${v.key === this._view ? "page" : nothing}
              aria-label=${t(v.title)}
              @click=${() => this.navigate(v.key)}
            >
              ${this._icon(v.icon)}
              <span class="label">${t(v.title)}</span>
            </button>
          `,
        )}
      </nav>
    `;
  }

  private _renderError() {
    if (!this._error) return nothing;
    const title = t("Could not load JARVIS data");
    const retry = html`
      <button class="jv-btn text" type="button" slot="action" @click=${() => void this._load()}>${t("Retry")}</button>
    `;
    if (haDefined("ha-alert")) {
      return html`<ha-alert alert-type="error" .title=${title}>${this._error}${retry}</ha-alert>`;
    }
    return html`
      <div class="alert" role="alert">
        <div class="body"><strong>${title}</strong><span>${this._error}</span></div>
        ${retry}
      </div>
    `;
  }

  private _renderView() {
    if (!this.hass || !this._langReady) {
      return html`<div class="gate" role="status" aria-live="polite">${t("Loading...")}</div>`;
    }
    const def = findView(this._view) ?? VIEWS[0];
    const tag = this._tag(def.element);
    const route: Route = this.route ?? { prefix: this._prefix, path: `/${def.key}` };
    return staticHtml`
      <${tag}
        data-jv-view=${def.key}
        .hass=${this.hass}
        .narrow=${this.narrow}
        .data=${this._data}
        .route=${route}
      ></${tag}>
    `;
  }

  override render() {
    const lockdown = !!this._data?.lockdown?.active;
    const intrusion = !!this._data?.intrusion?.active;
    const version = this._data?.version;
    return html`
      <header>
        <div class="brand">
          ${this.narrow ? this._renderMenuButton() : nothing}
          <svg class="logo" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M17.6 7.5v8.4a4.4 4.4 0 0 1-8.8 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>
          <h1>
            JARVIS
            ${version ? html`<span class="ver jv-mono">v${version}</span>` : nothing}
          </h1>
        </div>
        ${this.narrow ? nothing : this._renderTabs()}
        <div class="spacer"></div>
        <div class="bar-actions">
          ${lockdown
            ? html`<jv-state-badge level="danger" .label=${t("Lockdown")}></jv-state-badge>`
            : intrusion
              ? html`<jv-state-badge level="warn" pulse .label=${t("Intrusion")}></jv-state-badge>`
              : this._data
                ? html`<jv-state-badge
                    level=${fromLevel(this._data.status?.observer?.level)}
                    .label=${t("Observer")}
                  ></jv-state-badge>`
                : nothing}
          ${this._renderRefreshButton()}
        </div>
      </header>
      <main id="main" tabindex="-1" role="tabpanel" aria-labelledby=${this.narrow ? nothing : `tab-${this._view}`}>
        ${this._renderError()}
        ${this._renderView()}
      </main>
      ${this.narrow ? this._renderBottomNav() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-panel": JarvisPanel;
  }
}
