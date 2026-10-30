/**
 * Optional base class for the editor's sub-tab elements
 * (<jarvis-editor-rooms>, -openings, -doors, -pins, -import).
 *
 * The editor sets `store`, `canvas`, `hass` and `narrow` on the tab element
 * and re-sets `hass` on every HA state change. Extending this class is
 * optional - any element with those four properties works - but it gives
 * you the store subscription (re-render on every store change), `ctx()`
 * (the same LayerContext the layers get) and `floor` / `units` shortcuts.
 */
import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { Hass } from "../../../types";
import type { EditorStore } from "./store";
import type { JvPlanCanvas, LayerContext } from "./canvas";
import type { FloorKey, Units } from "./model";

export class JarvisEditorTab extends LitElement {
  @property({ attribute: false }) store?: EditorStore;
  /** null until the canvas has mounted (the editor re-sets it) */
  @property({ attribute: false }) canvas: JvPlanCanvas | null = null;
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Boolean, reflect: true }) narrow = false;

  private _unsub: (() => void) | null = null;
  private _bound: EditorStore | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._bind();
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsub?.();
    this._unsub = null;
    this._bound = null;
  }
  protected override willUpdate(): void {
    if (this.store !== this._bound) this._bind();
  }
  private _bind(): void {
    this._unsub?.();
    this._unsub = null;
    this._bound = this.store ?? null;
    if (this.store) this._unsub = this.store.subscribe(() => this.requestUpdate());
  }

  get floor(): FloorKey {
    return this.store?.floor ?? "1f";
  }
  get units(): Units {
    return this.store?.settings.units ?? "imperial";
  }
  /** The canvas's LayerContext (null before the canvas mounts). */
  ctx(): LayerContext | null {
    return this.canvas?.context() ?? null;
  }
}
