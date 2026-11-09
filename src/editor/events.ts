/** Minimal typed event emitter. */
export class Emitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<(e: never) => void>>();

  on<K extends keyof Events>(event: K, cb: (e: Events[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as (e: never) => void);
    return () => {
      set.delete(cb as (e: never) => void);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of [...set]) {
      try {
        (cb as (e: Events[K]) => void)(payload);
      } catch (err) {
        console.error(`[dnd-web-builder] Error in "${String(event)}" listener`, err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** Collects teardown functions; `listen()` registers DOM listeners that are removed on `dispose()`. */
export class Disposer {
  private fns: (() => void)[] = [];

  add(fn: () => void): void {
    this.fns.push(fn);
  }

  listen<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K | (string & {}),
    fn: (e: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions | boolean,
  ): void {
    const handler = fn as unknown as EventListener;
    target.addEventListener(type, handler, opts);
    this.fns.push(() => target.removeEventListener(type, handler, opts));
  }

  dispose(): void {
    const fns = this.fns.splice(0).reverse();
    for (const fn of fns) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }
}
