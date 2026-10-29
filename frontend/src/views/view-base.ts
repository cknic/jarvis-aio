/**
 * Optional base class for views. A view is a Lit element named
 * <jarvis-view-<key>> with the properties the panel sets on it:
 *
 *   hass    - HA's hass object (changes on every state change)
 *   narrow  - true when HA considers the viewport narrow (bottom nav shown);
 *             reflected as the `narrow` attribute so :host([narrow]) works
 *   data    - the jarvis/get_panel_data snapshot (null until loaded,
 *             refreshed every 20 s and on "jarvis-refresh")
 *   route   - {prefix: "/jarvis", path: "/<key>[/sub]"}
 *
 * Views talk back with two bubbling, composed events:
 *   "jarvis-refresh"               - ask the panel to re-fetch the snapshot now
 *   "jarvis-navigate" {view, path} - go to another view (the panel pushes state)
 *
 * Extending JarvisView is optional - any element with those four properties
 * works - but it gives you `refresh()`, `navigate()`, `ws()` and `subPath`.
 */
import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { Hass, PanelData, Route, JarvisNavigateDetail } from "../types";
import { ws as wsCall } from "../ws";

export class JarvisView extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ attribute: false }) route?: Route;

  /** The part of the route after the view key, e.g. "cameras" for /jarvis/settings/cameras. */
  get subPath(): string {
    const parts = (this.route?.path || "").split("/").filter(Boolean);
    return parts.slice(1).join("/");
  }

  /** Ask the panel to refresh the snapshot now. */
  refresh(): void {
    this.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  }

  /** Navigate to another view (and optional sub-path). */
  navigate(view: string, path?: string): void {
    const detail: JarvisNavigateDetail = { view, path };
    this.dispatchEvent(new CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail }));
  }

  /** Typed WebSocket call bound to this view's hass. */
  ws<T = unknown>(type: string, payload?: Record<string, unknown>): Promise<T> {
    return wsCall<T>(this.hass, type, payload);
  }
}
