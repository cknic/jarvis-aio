/**
 * The view registry. Importing a view module registers its custom element;
 * VIEWS drives the tab bar / bottom nav and route matching (/jarvis/<key>).
 * Order here is display order. Titles are English keys for t().
 *
 * Navigation shape (src/panel.ts):
 *   wide    - one tab per view in VIEWS order, a horizontally scrollable
 *             tablist (never wraps; the selected tab is scrolled into view)
 *   narrow  - a bottom nav with the PRIMARY_NAV views plus a "More" item
 *             that opens a bottom sheet listing secondaryViews(); when the
 *             active view is not primary the More item shows it as the
 *             current item.
 * Routing: parseRoute() maps /<view>[/<sub...>] to a ViewDef and the sub
 * path; a view reads the sub path as JarvisView.subPath (e.g.
 * /jarvis/residence/editor -> jarvis-view-residence, subPath "editor").
 */
import "./overview";
import "./intrusion";
import "./cameras";
import "./people";
import "./suggestions";
import "./memory";
import "./documents";
import "./residence";
import "./logs";
import "./settings";

export interface ViewDef {
  /** route segment and the key view agents own */
  key: string;
  /** English title; render with t(title) */
  title: string;
  /** mdi icon for ha-icon */
  icon: string;
  /** custom element tag the panel mounts */
  element: string;
}

export const VIEWS: readonly ViewDef[] = [
  { key: "overview", title: "Overview", icon: "mdi:view-dashboard-outline", element: "jarvis-view-overview" },
  { key: "intrusion", title: "Intrusion", icon: "mdi:shield-home-outline", element: "jarvis-view-intrusion" },
  { key: "cameras", title: "Cameras", icon: "mdi:cctv", element: "jarvis-view-cameras" },
  { key: "people", title: "People", icon: "mdi:account-group-outline", element: "jarvis-view-people" },
  { key: "suggestions", title: "Suggestions", icon: "mdi:lightbulb-on-outline", element: "jarvis-view-suggestions" },
  { key: "memory", title: "Memory", icon: "mdi:brain", element: "jarvis-view-memory" },
  { key: "documents", title: "Documents", icon: "mdi:file-document-multiple-outline", element: "jarvis-view-documents" },
  { key: "residence", title: "Residence", icon: "mdi:floor-plan", element: "jarvis-view-residence" },
  { key: "logs", title: "Logs", icon: "mdi:text-box-search-outline", element: "jarvis-view-logs" },
  { key: "settings", title: "Settings", icon: "mdi:cog-outline", element: "jarvis-view-settings" },
];

export const DEFAULT_VIEW = "overview";

/**
 * The views that get their own item in the narrow bottom nav (in nav order).
 * Everything else is reached through the "More" sheet.
 */
export const PRIMARY_NAV: readonly string[] = ["overview", "intrusion", "residence", "settings"];

export function findView(key: string | undefined | null): ViewDef | undefined {
  return VIEWS.find((v) => v.key === key);
}

export function isPrimaryNav(key: string): boolean {
  return PRIMARY_NAV.includes(key);
}

/** The views listed in the narrow "More" sheet, in VIEWS order. */
export function secondaryViews(): ViewDef[] {
  return VIEWS.filter((v) => !isPrimaryNav(v.key));
}

export interface ParsedRoute {
  /** the matched view, or the default view when the first segment is unknown */
  view: ViewDef;
  /** everything after the view segment, "/"-joined and without leading slash ("" when none) */
  sub: string;
  /** false when the path named no known view (the shell then shows DEFAULT_VIEW) */
  known: boolean;
}

/**
 * Split a route path relative to the panel prefix ("/residence/editor",
 * "residence/editor" and "/residence/editor/" are equivalent) into the view
 * that owns it and the sub path the view sees as `subPath`.
 */
export function parseRoute(path: string | undefined | null): ParsedRoute {
  const parts = (path || "").split("/").filter(Boolean);
  const def = findView(parts[0]);
  if (!def) return { view: findView(DEFAULT_VIEW)!, sub: "", known: false };
  return { view: def, sub: parts.slice(1).join("/"), known: true };
}
