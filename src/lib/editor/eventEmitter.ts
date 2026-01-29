export type EditorEventMap = {
  input: { html: string };
  change: { html: string };
  selectionchange: { range: Range | null };
  pluginInit: { pluginName: string };
  pluginDestroy: { pluginName: string };
  execCommand: { command: string };
  contentChange: { html: string };
  commandRegistered: { name: string };
};

export type EditorEventName = keyof EditorEventMap;

export type EditorEventCallback<K extends EditorEventName> = (
  e: EditorEventMap[K],
) => void;

export class EditorEventEmitter {
  private listeners: { [K in EditorEventName]?: EditorEventCallback<K>[] } = {};

  on<K extends EditorEventName>(event: K, listener: EditorEventCallback<K>) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(listener);
  }

  off<K extends EditorEventName>(event: K, listener: EditorEventCallback<K>) {
    // @ts-ignore
    this.listeners[event] = this.listeners[event]?.filter(
      (fn) => fn !== listener,
    );
  }

  emit<K extends EditorEventName>(event: K, payload: EditorEventMap[K]) {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}
