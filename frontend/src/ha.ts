/**
 * Feature detection for Home Assistant's own elements.
 *
 * With embed_iframe=False the panel runs in HA's main window, so <ha-card>,
 * <ha-icon>, <ha-icon-button>, <ha-alert>, <ha-dialog> ... are registered
 * there - but some are loaded lazily. Always ask `haDefined()` at render time
 * and fall back to a plain element styled with tokens. `watchDefinitions()`
 * re-renders the host once a lazily loaded element shows up.
 */
import type { ReactiveControllerHost } from "lit";

export function haDefined(tag: string): boolean {
  try {
    return typeof customElements !== "undefined" && !!customElements.get(tag);
  } catch {
    return false;
  }
}

const _watched = new WeakMap<object, Set<string>>();

/** Re-render `host` when any of `tags` becomes defined later. Idempotent. */
export function watchDefinitions(host: ReactiveControllerHost & object, tags: string[]): void {
  if (typeof customElements === "undefined") return;
  let seen = _watched.get(host);
  if (!seen) {
    seen = new Set();
    _watched.set(host, seen);
  }
  for (const tag of tags) {
    if (seen.has(tag) || haDefined(tag)) continue;
    seen.add(tag);
    customElements
      .whenDefined(tag)
      .then(() => host.requestUpdate())
      .catch(() => undefined);
  }
}

/** Tell HA to open/close the sidebar drawer (what ha-menu-button does). */
export function toggleHaMenu(target: EventTarget = window): void {
  target.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
}

/** HA-style navigation: pushState + the location-changed event HA listens to. */
export function navigateHa(url: string, replace = false): void {
  if (replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true, detail: { replace } }));
}
