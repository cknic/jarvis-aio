/**
 * <jarvis-panel> - the shell Home Assistant mounts for the JARVIS sidebar
 * panel (panel_register.py: webcomponent "jarvis-panel", url /jarvis,
 * admin-only, embed_iframe=False, so HA's own elements are available).
 *
 * HA sets the properties `hass`, `narrow`, `route` ({prefix, path}) and
 * `panel` ({config}). The shell:
 *   - draws the app bar with HA's header tokens (+ ha-menu-button on narrow),
 *     a horizontally scrollable tab row on wide screens (never wraps; the
 *     selected tab is scrolled into view, the overflowing edges fade) and a
 *     bottom nav on narrow ones (the PRIMARY_NAV views plus a "More" item
 *     that opens a focus-trapped bottom sheet with the other views),
 *   - maps /jarvis/<view>[/<sub>] to the view element from views/index.ts
 *     (default overview; the view sees <sub> as JarvisView.subPath),
 *     navigating with pushState + "location-changed" so deep links and the
 *     back button work,
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
import {
  VIEWS,
  DEFAULT_VIEW,
  PRIMARY_NAV,
  findView,
  isPrimaryNav,
  parseRoute,
  secondaryViews,
  type ViewDef,
} from "./views/index";
import { fromLevel } from "./components";
import type { Hass, PanelData, PanelInfo, Route, JarvisNavigateDetail } from "./types";
import "./components";

const REFRESH_MS = 20_000;
const REFRESH_DEBOUNCE_MS = 250;
const LANG_GATE_MS = 1500;
const HA_TAGS = ["ha-icon", "ha-icon-button", "ha-menu-button", "ha-alert"];
/** room kept between the selected tab and the fading edge of the tab row */
const TAB_REVEAL_PAD = 24;
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  /** the narrow "More" bottom sheet */
  @state() private _moreOpen = false;
  /** the wide tab row overflows on that side (drives the fade edges) */
  @state() private _fadeStart = false;
  @state() private _fadeEnd = false;

  private _timer: ReturnType<typeof setInterval> | null = null;
  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _lastFetch = 0;
  private _inFlight: Promise<void> | null = null;
  private _tags = new Map<string, StaticValue>();
  private _tabsObserver: ResizeObserver | null = null;
  private _observedTabs: HTMLElement | null = null;
  /** the element to give focus back to when the More sheet closes */
  private _moreReturnFocus: HTMLElement | null = null;

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
        /* the panel's own width drives the bottom-nav label rule below; the
           inline-size containment also makes the host the containing block
           of the fixed More sheet, so it never escapes the panel */
        container: jv-panel / inline-size;
        /* The height of the stuck app bar (56 px, plus the 48 px tab row
           when it takes its own line). Views inherit it for their own sticky
           offsets, and scroll-padding keeps a focused control or a
           scrollIntoView target from landing underneath the header / the
           bottom nav. A container query cannot restyle its own container,
           so the host keeps the two-line value for scroll-padding (a little
           extra room when the tabs sit inline) and main gets the exact one
           from the same panel-width query the tab row uses. */
        --jv-sticky-top: calc(var(--jv-header-height) + 48px);
        scroll-padding-top: var(--jv-sticky-top);
      }
      @container jv-panel (min-width: 1560px) {
        main {
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
      /* Ten tabs never wrap: the row scrolls horizontally (scrollbar
         hidden, the selected tab is scrolled into view by _revealTab) and
         .tabs-wrap paints a header-coloured fade over the edge that still
         has tabs behind it, with a chevron button on it for mouse users
         (a vertical wheel over the row scrolls it sideways too, see
         _onTabWheel; keyboard users have the arrow keys). The breakpoint is
         the panel's own width (a container query, so HA's open sidebar
         counts): below 1560px - roughly where brand, ten icon + label tabs
         and the actions fit on one line - the row takes a full second line
         under the brand; above it sits inline between brand and actions,
         centred while it fits (the auto margins on the first / last tab
         collapse to 0 once it overflows, so every tab stays reachable). */
      .tabs-wrap {
        position: relative;
        display: flex;
        flex: 1 1 100%;
        min-width: 0;
        order: 10;
        margin: 0 calc(-1 * var(--jv-space-2));
      }
      @container jv-panel (min-width: 1560px) {
        .tabs-wrap {
          flex: 1 1 auto;
          order: 0;
          margin: 0;
        }
      }
      [role="tablist"] {
        position: relative;
        display: flex;
        align-items: stretch;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        padding: 0 var(--jv-space-2);
        /* room for the inset focus ring at the scroll edges */
        scroll-padding: 0 var(--jv-space-5);
      }
      [role="tablist"]::-webkit-scrollbar {
        display: none;
      }
      @container jv-panel (min-width: 1560px) {
        [role="tablist"] {
          padding: 0;
        }
        .tab:first-child {
          margin-left: auto;
        }
        .tab:last-child {
          margin-right: auto;
        }
      }
      .tabs-wrap::before,
      .tabs-wrap::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: var(--jv-space-5);
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--jv-ease);
      }
      .tabs-wrap::before {
        left: 0;
        background: linear-gradient(to right, var(--jv-header-bg), transparent);
      }
      .tabs-wrap::after {
        right: 0;
        background: linear-gradient(to left, var(--jv-header-bg), transparent);
      }
      .tabs-wrap.fade-start::before,
      .tabs-wrap.fade-end::after {
        opacity: 1;
      }
      /* Mouse affordance on a faded edge: one click pages the row by most
         of its width. Hidden from assistive tech and out of the tab order
         (the tabs themselves are reachable with the arrow keys). */
      .tabs-wrap .tab-scroll {
        appearance: none;
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 1;
        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        padding: 0;
        border: 0;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      .tabs-wrap .tab-scroll.start {
        left: 0;
        background: linear-gradient(to right, var(--jv-header-bg) 60%, transparent);
      }
      .tabs-wrap .tab-scroll.end {
        right: 0;
        background: linear-gradient(to left, var(--jv-header-bg) 60%, transparent);
      }
      .tabs-wrap.fade-start .tab-scroll.start,
      .tabs-wrap.fade-end .tab-scroll.end {
        display: flex;
      }
      .tabs-wrap .tab-scroll svg {
        width: 20px;
        height: 20px;
        opacity: 0.72;
        transition: opacity var(--jv-ease);
      }
      .tabs-wrap .tab-scroll:hover svg {
        opacity: 1;
      }
      .tab {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
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
      /* Five destinations (four primary views + More) fit labelled down to
         about 380 px (an item is 76 px at 380 px; "Einstellungen" needs
         ~70 px at 10 px). When the panel itself is narrower than that (a
         container query on :host, so the harness frame and HA's narrow
         layout measure the same thing) only the current item keeps its
         label and gets twice the room - Material's "selected" label mode;
         the others are icon-only with their aria-label. */
      @container jv-panel (max-width: 379px) {
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

      /* ── "More" bottom sheet (narrow) ─────────────────────────────── */
      .scrim {
        position: fixed;
        inset: 0;
        z-index: 4;
        border: 0;
        padding: 0;
        margin: 0;
        background: var(--jv-scrim);
        cursor: default;
      }
      .sheet {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5;
        max-height: 70%;
        overflow-y: auto;
        padding-bottom: env(safe-area-inset-bottom);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        border-top: 1px solid var(--jv-divider);
        box-shadow: var(--jv-shadow);
      }
      .sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-2) 0 var(--jv-space-4);
      }
      .sheet h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
      }
      .sheet-list {
        list-style: none;
        margin: 0;
        padding: var(--jv-space-2) var(--jv-space-2) var(--jv-space-3);
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--jv-space-1);
      }
      .sheet-item {
        appearance: none;
        width: 100%;
        min-height: 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--jv-space-1);
        padding: var(--jv-space-2) var(--jv-space-1);
        border: 0;
        border-radius: var(--jv-radius-sm);
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-s);
        text-align: center;
        cursor: pointer;
        --mdc-icon-size: 24px;
      }
      .sheet-item span {
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .sheet-item:hover {
        background: var(--jv-hover);
      }
      .sheet-item[aria-current="page"] {
        color: var(--jv-accent-text);
        background: var(--jv-accent-soft);
      }
      .sheet-item:focus-visible,
      .sheet .jv-icon-btn:focus-visible {
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
    this._tabsObserver?.disconnect();
    this._tabsObserver = null;
    this._observedTabs = null;
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
    // the sheet only exists in the narrow layout
    if (changed.has("narrow") && !this.narrow && this._moreOpen) this._moreOpen = false;
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("_view") && changed.get("_view") !== undefined) {
      // new view: start at the top and move focus to the content region
      this.scrollTop = 0;
      const main = this.renderRoot.querySelector<HTMLElement>("main");
      main?.focus({ preventScroll: true });
    }
    this._watchTabs();
    if (changed.has("_view") || changed.has("narrow")) this._revealTab();
    if (changed.has("_moreOpen")) {
      if (this._moreOpen) this._focusSheet();
      else if (changed.get("_moreOpen")) this._restoreMoreFocus();
    }
  }

  // ── routing ───────────────────────────────────────────────────────────────

  private get _prefix(): string {
    return this.route?.prefix || "/jarvis";
  }

  private _syncViewFromRoute(): void {
    this._view = parseRoute(this.route?.path).view.key;
  }

  private _syncViewFromLocation(): void {
    const prefix = this._prefix;
    const path = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : "";
    this._view = parseRoute(path).view.key;
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
    this._moreOpen = false;
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
      this.renderRoot.querySelector<HTMLElement>(`[role="tab"][data-view="${target.key}"]`)?.focus({ preventScroll: true });
      this._revealTab();
    });
  }

  // ── scrollable tab row ────────────────────────────────────────────────────

  private _tablist(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('[role="tablist"]');
  }

  /**
   * (Re)attach the ResizeObserver to the current tablist element and to each
   * tab: the row's content grows without the row itself resizing when
   * ha-icon upgrades after the first render or the language changes, and the
   * fades / chevrons must follow that too.
   */
  private _watchTabs(): void {
    const list = this._tablist();
    if (list === this._observedTabs) return;
    this._tabsObserver?.disconnect();
    this._observedTabs = list;
    if (!list) {
      this._fadeStart = this._fadeEnd = false;
      return;
    }
    if (!this._tabsObserver && typeof ResizeObserver === "function") {
      this._tabsObserver = new ResizeObserver(() => this._updateFades());
    }
    if (this._tabsObserver) {
      this._tabsObserver.observe(list);
      for (const tab of list.querySelectorAll<HTMLElement>('[role="tab"]')) this._tabsObserver.observe(tab);
    }
    this._updateFades();
  }

  /** Scroll the selected tab into view horizontally (never moves the page). */
  private _revealTab(): void {
    const list = this._tablist();
    const tab = list?.querySelector<HTMLElement>(`[role="tab"][data-view="${this._view}"]`);
    if (!list || !tab || !list.clientWidth) {
      // no layout yet (or jsdom): nothing to reveal
      this._updateFades();
      return;
    }
    const start = tab.offsetLeft;
    const end = start + tab.offsetWidth;
    const visibleStart = list.scrollLeft;
    const visibleEnd = visibleStart + list.clientWidth;
    let target = visibleStart;
    if (start - TAB_REVEAL_PAD < visibleStart) target = start - TAB_REVEAL_PAD;
    else if (end + TAB_REVEAL_PAD > visibleEnd) target = end + TAB_REVEAL_PAD - list.clientWidth;
    target = Math.max(0, Math.min(target, list.scrollWidth - list.clientWidth));
    // Instant, not smooth: in real HA the new view's first render can hold
    // the main thread for over a second, so a smooth scroll started here
    // lands late and the next _revealTab measures a stale scrollLeft (the
    // row then ended up showing the previously selected tab).
    if (target !== visibleStart) list.scrollLeft = target;
    this._updateFades();
  }

  /** Chevron on a faded edge: page the row by most of its visible width. */
  private _scrollTabs(dir: 1 | -1): void {
    const list = this._tablist();
    if (!list) return;
    const left = Math.max(0, Math.min(list.scrollLeft + dir * Math.max(80, list.clientWidth * 0.8), list.scrollWidth - list.clientWidth));
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof list.scrollTo === "function") list.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
    else list.scrollLeft = left;
    this._updateFades();
  }

  /**
   * A plain vertical mouse wheel over an overflowing row scrolls it
   * sideways. Horizontal input (trackpads, Shift+wheel) keeps its native
   * behaviour, and at either end the wheel falls through to the page.
   */
  private _onTabWheel(e: WheelEvent): void {
    const list = e.currentTarget as HTMLElement;
    if (e.shiftKey || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = list.scrollWidth - list.clientWidth;
    if (max <= 1) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? list.clientWidth : 1;
    const delta = e.deltaY * unit;
    if ((delta < 0 && list.scrollLeft <= 0) || (delta > 0 && list.scrollLeft >= max - 1)) return;
    e.preventDefault();
    list.scrollLeft = Math.max(0, Math.min(list.scrollLeft + delta, max));
  }

  private _updateFades(): void {
    const list = this._tablist();
    if (!list) {
      this._fadeStart = this._fadeEnd = false;
      return;
    }
    const max = list.scrollWidth - list.clientWidth;
    this._fadeStart = list.scrollLeft > 1;
    this._fadeEnd = max > 1 && list.scrollLeft < max - 1;
  }

  // ── "More" bottom sheet ───────────────────────────────────────────────────

  private _openMore(): void {
    this._moreReturnFocus = this.renderRoot.querySelector<HTMLElement>(".nav-item.more");
    this._moreOpen = true;
  }

  private _closeMore(): void {
    this._moreOpen = false;
  }

  private _sheet(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(".sheet");
  }

  private _sheetFocusables(): HTMLElement[] {
    const sheet = this._sheet();
    return sheet ? [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
  }

  private _focusSheet(): void {
    this.updateComplete.then(() => {
      const sheet = this._sheet();
      if (!sheet) return;
      const current = sheet.querySelector<HTMLElement>('.sheet-item[aria-current="page"]');
      const first = sheet.querySelector<HTMLElement>(".sheet-item");
      (current ?? first ?? sheet).focus({ preventScroll: true });
    });
  }

  private _restoreMoreFocus(): void {
    const target = this._moreReturnFocus;
    this._moreReturnFocus = null;
    this.updateComplete.then(() => {
      if (target?.isConnected) target.focus({ preventScroll: true });
    });
  }

  /** Escape closes; Tab / Shift+Tab cycle inside the sheet. */
  private _onSheetKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this._closeMore();
      return;
    }
    if (e.key !== "Tab") return;
    const items = this._sheetFocusables();
    if (!items.length) return;
    const active = (this.renderRoot as ShadowRoot).activeElement as HTMLElement | null;
    const idx = active ? items.indexOf(active) : -1;
    let next: HTMLElement | undefined;
    if (e.shiftKey && (idx <= 0 || idx === -1)) next = items[items.length - 1];
    else if (!e.shiftKey && (idx === items.length - 1 || idx === -1)) next = items[0];
    if (next) {
      e.preventDefault();
      next.focus({ preventScroll: true });
    }
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
    const cls = `tabs-wrap${this._fadeStart ? " fade-start" : ""}${this._fadeEnd ? " fade-end" : ""}`;
    return html`
      <div class=${cls}>
        ${this._renderTabScroll(-1)}
        <div
          role="tablist"
          aria-label=${t("Sections")}
          @keydown=${this._onTabKeydown}
          @scroll=${this._updateFades}
          @wheel=${this._onTabWheel}
        >
          ${VIEWS.map((v) => this._renderTab(v))}
        </div>
        ${this._renderTabScroll(1)}
      </div>
    `;
  }

  private _renderTabScroll(dir: 1 | -1) {
    // mousedown is cancelled so the click never moves focus off the tabs
    return html`
      <button
        class="tab-scroll ${dir < 0 ? "start" : "end"}"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        @mousedown=${(e: Event) => e.preventDefault()}
        @click=${() => this._scrollTabs(dir)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d=${dir < 0 ? "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" : "M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"} fill="currentColor" />
        </svg>
      </button>
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

  private _renderNavItem(v: ViewDef) {
    return html`
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
    `;
  }

  /**
   * The fifth item: "More" opens the sheet. When the active view is not a
   * primary one the item shows that view (icon, label, aria-current), so the
   * current section is always visible in the bar; tapping it still opens
   * the sheet to switch to another secondary view.
   */
  private _renderMoreItem() {
    const current = isPrimaryNav(this._view) ? undefined : findView(this._view);
    const more = t("More");
    return html`
      <button
        class="nav-item more"
        type="button"
        data-more
        data-view=${current?.key ?? nothing}
        aria-current=${current ? "page" : nothing}
        aria-haspopup="dialog"
        aria-expanded=${this._moreOpen ? "true" : "false"}
        aria-label=${current ? `${t(current.title)} (${more})` : more}
        @click=${this._openMore}
      >
        ${this._icon(current?.icon ?? "mdi:dots-horizontal")}
        <span class="label">${current ? t(current.title) : more}</span>
      </button>
    `;
  }

  private _renderBottomNav() {
    const primary = PRIMARY_NAV.map((k) => findView(k)).filter((v): v is ViewDef => !!v);
    return html`
      <nav class="bottom ${haDefined("ha-icon") ? "" : "no-icons"}" aria-label=${t("Sections")} ?inert=${this._moreOpen}>
        ${primary.map((v) => this._renderNavItem(v))}
        ${this._renderMoreItem()}
      </nav>
    `;
  }

  private _renderMoreSheet() {
    if (!this.narrow || !this._moreOpen) return nothing;
    return html`
      <button class="scrim" type="button" tabindex="-1" aria-label=${t("Close")} @click=${this._closeMore}></button>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1" @keydown=${this._onSheetKeydown}>
        <div class="sheet-head">
          <h2 id="sheet-title">${t("More sections")}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${t("Close")} @click=${this._closeMore}>
            ${haDefined("ha-icon") ? this._icon("mdi:close") : html`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        <ul class="sheet-list">
          ${secondaryViews().map(
            (v) => html`
              <li>
                <button
                  class="sheet-item"
                  type="button"
                  data-view=${v.key}
                  aria-current=${v.key === this._view ? "page" : nothing}
                  @click=${() => this.navigate(v.key)}
                >
                  ${this._icon(v.icon)}
                  <span>${t(v.title)}</span>
                </button>
              </li>
            `,
          )}
        </ul>
      </div>
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
    const sheetOpen = this.narrow && this._moreOpen;
    return html`
      <header ?inert=${sheetOpen}>
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
      <main id="main" tabindex="-1" role="tabpanel" aria-labelledby=${this.narrow ? nothing : `tab-${this._view}`} ?inert=${sheetOpen}>
        ${this._renderError()}
        ${this._renderView()}
      </main>
      ${this.narrow ? this._renderBottomNav() : nothing}
      ${this._renderMoreSheet()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-panel": JarvisPanel;
  }
}
