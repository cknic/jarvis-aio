/**
 * Snapshot-based undo / redo.
 *
 * The history holds a list of STATES (deep copies the caller makes) and an
 * index into it; entry 0 is the baseline (`reset()`), every later entry is
 * the state AFTER a change with the label of that change. One entry per
 * gesture: drag frames do not push at all (the store applies them as
 * "transient" changes) and the release pushes the final state once. Repeated
 * small changes of the same kind (arrow-key nudges, slider `input` frames)
 * can be coalesced into the previous entry with `{coalesce: key}`.
 *
 *   const h = new History<Doc>();
 *   h.reset(doc);                       // baseline
 *   h.push("Move Kitchen", nextDoc);    // after a change
 *   h.undo() -> previous state | null;  h.redo() -> next state | null
 *   h.undoLabel / h.redoLabel           // "Move Kitchen" for the tooltips
 */
export interface HistoryEntry<T> {
  label: string;
  state: T;
  /** coalescing key of the change that produced this state */
  key?: string;
  at: number;
}

export interface PushOptions {
  /** merge into the previous entry when it has the same key and is younger than `within` ms */
  coalesce?: string;
  /** default 800 ms */
  within?: number;
}

export class History<T> {
  private _entries: HistoryEntry<T>[] = [];
  private _index = -1;
  private _listeners = new Set<() => void>();

  constructor(private readonly max = 100) {}

  /** Replace everything with a single baseline state. */
  reset(initial: T): void {
    this._entries = [{ label: "", state: initial, at: Date.now() }];
    this._index = 0;
    this._emit();
  }

  /** Drop all entries (the store calls reset() right after). */
  clear(): void {
    this._entries = [];
    this._index = -1;
    this._emit();
  }

  /** Record the state after a change. Clears the redo stack. */
  push(label: string, state: T, opts: PushOptions = {}): void {
    const now = Date.now();
    const top = this._entries[this._index];
    if (opts.coalesce && this._index > 0 && top && top.key === opts.coalesce && now - top.at <= (opts.within ?? 800)) {
      top.state = state;
      top.at = now;
      top.label = label;
      this._entries.length = this._index + 1;
      this._emit();
      return;
    }
    this._entries.length = this._index + 1;
    this._entries.push({ label, state, key: opts.coalesce, at: now });
    if (this._entries.length > this.max) this._entries.splice(0, this._entries.length - this.max);
    this._index = this._entries.length - 1;
    this._emit();
  }

  /** Overwrite the current entry's state without creating one (e.g. after a save normalised the doc). */
  replaceCurrent(state: T): void {
    const top = this._entries[this._index];
    if (top) top.state = state;
  }

  undo(): T | null {
    if (!this.canUndo) return null;
    this._index -= 1;
    this._emit();
    return this._entries[this._index].state;
  }

  redo(): T | null {
    if (!this.canRedo) return null;
    this._index += 1;
    this._emit();
    return this._entries[this._index].state;
  }

  get canUndo(): boolean {
    return this._index > 0;
  }
  get canRedo(): boolean {
    return this._index >= 0 && this._index < this._entries.length - 1;
  }
  /** Label of the change undo() would revert ("" at the baseline). */
  get undoLabel(): string {
    return this.canUndo ? this._entries[this._index].label : "";
  }
  /** Label of the change redo() would re-apply. */
  get redoLabel(): string {
    return this.canRedo ? this._entries[this._index + 1].label : "";
  }
  get current(): T | null {
    return this._entries[this._index]?.state ?? null;
  }
  get length(): number {
    return this._entries.length;
  }
  get index(): number {
    return this._index;
  }

  /** Called after every mutation of the stack. */
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => {
      this._listeners.delete(fn);
    };
  }

  private _emit(): void {
    for (const fn of this._listeners) {
      try {
        fn();
      } catch {
        /* a listener must never break the stack */
      }
    }
  }
}
