/**
 * <jarvis-plan-menu> - the floor-plan canvas context menu (right-click,
 * long-press, Shift+F10): a small popover anchored at a client point,
 * `role="menu"` with arrow-key navigation, Escape / outside tap / blur close
 * it, focus returns to where it was. One menu is open at a time.
 *
 *   showPlanMenu({ at: ev.client, label: t("Room"), items: [{ label: t("Delete"), danger: true, run }] });
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { base } from "../../../../theme/base";
import { haDefined } from "../../../../ha";

export interface MenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  run?: () => void;
}
export interface MenuOptions {
  items: MenuItem[];
  /** client (viewport) coordinates */
  at: [number, number];
  /** aria-label of the menu */
  label?: string;
}

let _current: JarvisPlanMenu | null = null;

/** The element that really has focus: document.activeElement descended through every open shadow root. */
function deepActiveElement(): Element | null {
  let a: Element | null = document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

@customElement("jarvis-plan-menu")
export class JarvisPlanMenu extends LitElement {
  items: MenuItem[] = [];
  at: [number, number] = [0, 0];
  label = "";

  @state() private _active = 0;
  @state() private _pos: [number, number] = [0, 0];

  private _prevFocus: Element | null = null;

  static override styles = [
    base,
    css`
      :host {
        display: contents;
      }
      .menu {
        position: fixed;
        z-index: 1000;
        min-width: 180px;
        max-width: min(92vw, 320px);
        margin: 0;
        padding: var(--jv-space-1) 0;
        list-style: none;
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        box-shadow: var(--jv-shadow);
      }
      .item {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-4);
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .item:hover,
      .item.is-active {
        background: var(--jv-hover);
      }
      .item:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .item[aria-disabled="true"] {
        color: var(--jv-text-3);
        cursor: default;
      }
      .item.danger {
        color: var(--jv-danger-text);
      }
      .item ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .item span {
        min-width: 0;
        overflow-wrap: anywhere;
      }
    `,
  ];

  /** Mount in document.body and open. */
  open(opts: MenuOptions): void {
    _current?.close();
    _current = this;
    this.items = opts.items;
    this.at = opts.at;
    this._pos = opts.at;
    this.label = opts.label ?? "";
    // the canvas object sits several shadow roots deep (panel > residence > editor > canvas): remember IT, not a host
    this._prevFocus = deepActiveElement();
    this._active = Math.max(0, this.items.findIndex((i) => !i.disabled));
    document.body.appendChild(this);
    document.addEventListener("pointerdown", this._onDocPointer, true);
    window.addEventListener("resize", this._closeBound);
    window.addEventListener("scroll", this._closeBound, true);
    window.addEventListener("blur", this._closeBound);
    void this.updateComplete.then(() => {
      this._clamp();
      this._focusActive();
    });
  }

  close(): void {
    if (_current === this) _current = null;
    document.removeEventListener("pointerdown", this._onDocPointer, true);
    window.removeEventListener("resize", this._closeBound);
    window.removeEventListener("scroll", this._closeBound, true);
    window.removeEventListener("blur", this._closeBound);
    const prev = this._prevFocus as HTMLElement | null;
    this._prevFocus = null;
    this.remove();
    try {
      if (prev?.isConnected) prev.focus?.({ preventScroll: true });
    } catch {
      /* ignore */
    }
  }

  private readonly _closeBound = (): void => this.close();

  private readonly _onDocPointer = (e: PointerEvent): void => {
    const path = e.composedPath();
    if (!path.includes(this)) this.close();
  };

  private _clamp(): void {
    const el = this.renderRoot.querySelector<HTMLElement>(".menu");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth || 0, vh = window.innerHeight || 0;
    let [x, y] = this.at;
    if (vw && x + r.width > vw - 8) x = Math.max(8, vw - r.width - 8);
    if (vh && y + r.height > vh - 8) y = Math.max(8, vh - r.height - 8);
    this._pos = [x, y];
  }

  private _focusActive(): void {
    const els = this.renderRoot.querySelectorAll<HTMLElement>(".item");
    els[this._active]?.focus();
  }

  private _run(i: number): void {
    const item = this.items[i];
    if (!item || item.disabled) return;
    this.close();
    try {
      item.run?.();
    } catch {
      /* a menu action must never break the canvas */
    }
  }

  private _onKey(e: KeyboardEvent): void {
    const n = this.items.length;
    const step = (dir: 1 | -1) => {
      if (!n) return;
      let i = this._active;
      for (let k = 0; k < n; k++) {
        i = (i + dir + n) % n;
        if (!this.items[i].disabled) break;
      }
      this._active = i;
      void this.updateComplete.then(() => this._focusActive());
    };
    switch (e.key) {
      case "ArrowDown":
        step(1);
        break;
      case "ArrowUp":
        step(-1);
        break;
      case "Home":
        this._active = Math.max(0, this.items.findIndex((i) => !i.disabled));
        void this.updateComplete.then(() => this._focusActive());
        break;
      case "End": {
        let i = n - 1;
        while (i > 0 && this.items[i].disabled) i--;
        this._active = i;
        void this.updateComplete.then(() => this._focusActive());
        break;
      }
      case "Enter":
      case " ":
        this._run(this._active);
        break;
      case "Escape":
      case "Tab":
        this.close();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  private _onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget as Node | null;
    if (to && this.renderRoot.contains(to)) return;
    // give a pointerdown on an item a chance to run first
    setTimeout(() => {
      if (this.isConnected && !this.shadowRoot?.activeElement && !this.matches(":focus-within")) this.close();
    }, 0);
  }

  override render() {
    const [x, y] = this._pos;
    const icons = haDefined("ha-icon");
    return html`
      <ul class="menu" role="menu" aria-label=${this.label || nothing} style=${`left:${x}px;top:${y}px`} @keydown=${this._onKey} @focusout=${this._onFocusOut}>
        ${this.items.map(
          (it, i) => html`<li role="none">
            <button
              type="button"
              class="item ${it.danger ? "danger" : ""} ${i === this._active ? "is-active" : ""}"
              role="menuitem"
              tabindex=${i === this._active ? "0" : "-1"}
              aria-disabled=${it.disabled ? "true" : "false"}
              @click=${() => this._run(i)}
              @pointerenter=${() => { this._active = i; }}
            >
              ${it.icon && icons ? html`<ha-icon .icon=${it.icon}></ha-icon>` : nothing}
              <span>${it.label}</span>
            </button>
          </li>`,
        )}
      </ul>
    `;
  }
}

/** Open the plan context menu at a client point. Returns the element (close() to dismiss). */
export function showPlanMenu(opts: MenuOptions): JarvisPlanMenu {
  const el = document.createElement("jarvis-plan-menu") as JarvisPlanMenu;
  el.open(opts);
  return el;
}

/** Close any open plan menu. */
export function closePlanMenu(): void {
  _current?.close();
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-plan-menu": JarvisPlanMenu;
  }
}
