/**
 * Keyboard focus that survives a row leaving a list (DESIGN.md section 8).
 *
 * When a row's own control (Remove, Delete ...) takes the row out of a Lit
 * list, the focused button leaves the DOM and focus falls to <body>: a
 * keyboard or screen-reader user is thrown back to the top of the page.
 * `keepRowFocus()` wraps the removal: after the host has re-rendered it
 * focuses the same control in the row that took the removed row's place (the
 * next one), else in the previous row, else the first usable fallback (the
 * list's Add button, a heading with tabindex="-1"). Rows are found again by a
 * stable key attribute read BEFORE the removal (never by index), in the
 * control's own shadow root; focus is read through every open shadow root.
 *
 * A removal that answers later (a websocket write: the list re-renders from
 * the reply, or its controls are disabled while it saves) returns its
 * Promise: focus is placed once that has settled, success or failure, so the
 * neighbouring row's control is enabled again by then and a row that came
 * back after a failed write gets its own control back.
 *
 * Focus only moves when the activated control had it, and never away from
 * somewhere else the user has gone in the meantime. A mouse click in a
 * browser that does not focus buttons changes nothing; where it does, the
 * programmatic focus that follows a click shows no ring (:focus-visible).
 */

/** The element that really has focus: document.activeElement descended through every open shadow root. */
export function deepActiveElement(): Element | null {
  let a: Element | null = typeof document === "undefined" ? null : document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

/**
 * The element inside `el` that really takes focus: the first tabbable element at or under `el`,
 * searching open shadow roots before light children, else the first host that delegates focus.
 * HA's own wrappers (ha-selector > ha-selector-entity > ha-entity-picker) neither delegate nor
 * forward focus(), and the picker they end in delegates to a host whose button sits one shadow root
 * deeper still - so the tabbable element itself is what gets focus.
 */
export function focusableWithin(el: Element): HTMLElement | null {
  let delegate: HTMLElement | null = null;
  const walk = (node: Element, depth: number): HTMLElement | null => {
    if (depth > 16 || !(node instanceof HTMLElement)) return null;
    if (node.matches(":disabled") || (node as HTMLElement & { disabled?: boolean }).disabled === true || node.hidden) return null;
    if (node.tabIndex >= 0 && !node.shadowRoot?.delegatesFocus) return node;
    if (node.shadowRoot?.delegatesFocus) delegate ??= node;
    for (const kid of [...(node.shadowRoot?.children ?? []), ...node.children]) {
      const hit = walk(kid, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  return walk(el, 0) ?? delegate;
}

/** `node` is `ancestor` or inside it, crossing shadow roots (an ha-icon-button's inner button counts). */
export function within(node: Node | null, ancestor: Node): boolean {
  for (let n: Node | null = node; n; n = n.parentNode ?? (n instanceof ShadowRoot ? n.host : null)) {
    if (n === ancestor) return true;
  }
  return false;
}

/** Focusable right now: connected and not disabled (a native :disabled or an HA element's `disabled`). */
function usable(el: Element | null | undefined): el is HTMLElement | SVGElement {
  return (el instanceof HTMLElement || el instanceof SVGElement) && el.isConnected && !el.matches(":disabled") && (el as Element & { disabled?: boolean }).disabled !== true;
}

/** Anything with Lit's updateComplete (the element that renders the list). */
export interface FocusHost {
  readonly updateComplete: Promise<boolean>;
}

/** Wait until the removal has rendered: a batched store notify, the host's update, a parent handing it a new value. */
async function settled(host: FocusHost): Promise<void> {
  await Promise.resolve();
  await host.updateComplete;
  // a Settings field row re-renders first and only then gives its editor the new value
  await new Promise((r) => setTimeout(r, 0));
  await host.updateComplete;
}

/**
 * What a pick hands back: the element to focus, a function that focuses
 * something itself (`canvas.focusSurface()`, which keeps the scroll position),
 * or null to leave focus alone.
 */
export type FocusTarget = Element | (() => void) | null;

/**
 * Run `remove` (the activated control's action) and, once it has settled
 * (when it returns a Promise) and `host` has re-rendered, give focus to
 * `pick()` if focus was on the control and has fallen to <body> since.
 */
export function keepFocus(e: Event, host: FocusHost, remove: () => unknown, pick: () => FocusTarget): void {
  const from = e.currentTarget instanceof Element ? e.currentTarget : null;
  const had = !!from && within(deepActiveElement(), from);
  const done = remove();
  if (!had) return;
  const place = () => {
    const now = deepActiveElement();
    // still on the control (nothing was removed, or Lit reused the element) or somewhere the user went since
    if (now && now !== document.body && now.isConnected) return;
    const target = pick();
    if (typeof target === "function") target();
    else if (usable(target)) target.focus();
  };
  // finally: a rejected removal still places focus, and its rejection is still reported
  void Promise.resolve(done).finally(() => settled(host).then(place));
}

export interface RowFocus {
  /** selector of one row: the activated control's closest() match, and its siblings */
  row: string;
  /** attribute that names a row across renders (an id, an entity id - never its index) */
  key: string;
  /** what to focus in the neighbouring row, first usable match wins */
  control: string | readonly string[];
  /** tried in order when no row with a usable control is left */
  fallback?: readonly string[];
}

/**
 * `keepFocus()` for a list row's Remove: call it from the control's click
 * handler with the removal as `remove` (return its Promise when it answers
 * later). The keys are read now; after the render the first of [the row
 * itself (back after a failed write), next rows ..., previous rows nearest
 * first] that still exists and has a usable `control` gets focus, else
 * `fallback`.
 */
export function keepRowFocus(e: Event, host: FocusHost, spec: RowFocus, remove: () => unknown): void {
  const from = e.currentTarget instanceof Element ? e.currentTarget : null;
  const row = from?.closest(spec.row) ?? null;
  const root = from?.getRootNode() ?? null;
  const peers = row?.parentElement ? [...row.parentElement.children].filter((el) => el.matches(spec.row)) : [];
  const at = row ? peers.indexOf(row) : -1;
  const keyOf = (el: Element) => el.getAttribute(spec.key);
  const keys = at < 0 ? [] : [...peers.slice(at), ...peers.slice(0, at).reverse()].map(keyOf).filter((k): k is string => k != null);
  const controls = typeof spec.control === "string" ? [spec.control] : spec.control;
  keepFocus(e, host, remove, () => {
    if (!(root instanceof ShadowRoot || root instanceof Document)) return null;
    const rows = [...root.querySelectorAll(spec.row)];
    for (const k of keys) {
      const r = rows.find((el) => keyOf(el) === k);
      if (!r) continue;
      for (const sel of controls) {
        const c = [...r.querySelectorAll(sel)].find(usable);
        if (c) return c;
      }
    }
    for (const sel of spec.fallback ?? []) {
      const c = [...root.querySelectorAll(sel)].find(usable);
      if (c) return c;
    }
    return null;
  });
}
