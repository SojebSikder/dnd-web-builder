import type { PageDocument } from "../../core/types";

export interface StoreOptions {
  /** max undo steps (default 100) */
  limit?: number;
  /** edits with the same coalesce key within this window merge into one undo step (default 500 ms) */
  coalesceMs?: number;
  /** injectable clock for tests */
  now?: () => number;
}

/**
 * Immutable document state with undo/redo history.
 * The store never mutates documents; it only swaps references.
 */
export class Store {
  private current: PageDocument;
  private saved: PageDocument;
  private past: PageDocument[] = [];
  private future: PageDocument[] = [];
  private lastKey: string | null = null;
  private lastTime = 0;
  private readonly limit: number;
  private readonly coalesceMs: number;
  private readonly now: () => number;

  constructor(doc: PageDocument, opts: StoreOptions = {}) {
    this.current = doc;
    this.saved = doc;
    this.limit = Math.max(1, opts.limit ?? 100);
    this.coalesceMs = opts.coalesceMs ?? 500;
    this.now = opts.now ?? (() => Date.now());
  }

  get doc(): PageDocument {
    return this.current;
  }

  get dirty(): boolean {
    return this.current !== this.saved;
  }

  /**
   * Replace the current document. Returns false when `next` is the same reference (no-op).
   * Consecutive commits with the same `coalesceKey` within `coalesceMs` share one undo step.
   */
  commit(next: PageDocument, coalesceKey?: string): boolean {
    if (next === this.current) return false;
    const t = this.now();
    const coalesce =
      coalesceKey !== undefined &&
      coalesceKey === this.lastKey &&
      t - this.lastTime < this.coalesceMs &&
      this.past.length > 0;
    if (!coalesce) {
      this.past.push(this.current);
      if (this.past.length > this.limit) this.past.splice(0, this.past.length - this.limit);
    }
    this.future = [];
    this.current = next;
    this.lastKey = coalesceKey ?? null;
    this.lastTime = t;
    return true;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): boolean {
    const prev = this.past.pop();
    if (!prev) return false;
    this.future.push(this.current);
    this.current = prev;
    this.lastKey = null;
    return true;
  }

  redo(): boolean {
    const next = this.future.pop();
    if (!next) return false;
    this.past.push(this.current);
    this.current = next;
    this.lastKey = null;
    return true;
  }

  /** Replace the document and clear history (the new document counts as saved). */
  reset(doc: PageDocument): void {
    this.current = doc;
    this.saved = doc;
    this.past = [];
    this.future = [];
    this.lastKey = null;
  }

  markSaved(): void {
    this.saved = this.current;
    this.lastKey = null;
  }

  /** Stops the current coalescing run so the next edit starts a new undo step. */
  breakCoalescing(): void {
    this.lastKey = null;
  }
}
