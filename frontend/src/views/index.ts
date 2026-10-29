/**
 * The view registry. Importing a view module registers its custom element;
 * VIEWS drives the tab bar / bottom nav and route matching (/jarvis/<key>).
 * Order here is display order. Titles are English keys for t().
 */
import "./overview";
import "./intrusion";
import "./suggestions";
import "./memory";
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
  { key: "suggestions", title: "Suggestions", icon: "mdi:lightbulb-on-outline", element: "jarvis-view-suggestions" },
  { key: "memory", title: "Memory", icon: "mdi:brain", element: "jarvis-view-memory" },
  { key: "residence", title: "Residence", icon: "mdi:floor-plan", element: "jarvis-view-residence" },
  { key: "logs", title: "Logs", icon: "mdi:text-box-search-outline", element: "jarvis-view-logs" },
  { key: "settings", title: "Settings", icon: "mdi:cog-outline", element: "jarvis-view-settings" },
];

export const DEFAULT_VIEW = "overview";

export function findView(key: string | undefined | null): ViewDef | undefined {
  return VIEWS.find((v) => v.key === key);
}
