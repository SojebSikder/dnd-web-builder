import { cloneJson, normalizeDocument } from "../core/document";
import type { Registry } from "../core/registry";
import { collectDataRequests, renderSection, sectionDataRequests } from "../core/render";
import type { PageDocument, SectionNode, Settings } from "../core/types";
import { Canvas } from "./canvas/canvas";
import { Disposer, Emitter } from "./events";
import { bindKeyboard } from "./keyboard";
import { SettingsPanel } from "./panels/settings";
import { Sidebar } from "./panels/sidebar";
import * as ops from "./state/operations";
import { Store } from "./state/store";
import { Topbar } from "./topbar";
import {
  DragState,
  type Device,
  type EditorEvents,
  type EditorHost,
  type EditorOptions,
  type Selection,
  type SelectionKind,
} from "./types";
import { h } from "./ui/dom";
import { jsonView } from "./ui/json-view";
import { openModal, type ModalHandle } from "./ui/modal";

const DATA_DEBOUNCE_MS = 300;

interface CommitOptions {
  coalesceKey?: string;
  /** edit originated in the settings panel → don't rebuild the panel */
  fromPanel?: boolean;
  select?: Selection | null;
}

/**
 * Visual page editor. Wiring only: state lives in `Store`, document changes are pure functions in
 * `state/operations`, rendering lives in `Canvas`, panels render themselves.
 */
export class Editor {
  private readonly options: EditorOptions;
  private readonly registry: Registry;
  private readonly store: Store;
  private readonly emitter = new Emitter<EditorEvents>();
  private readonly disposer = new Disposer();
  private readonly host: EditorHost;
  private readonly root: HTMLElement;
  private readonly canvas: Canvas;
  private readonly sidebar: Sidebar;
  private readonly settingsPanel: SettingsPanel;
  private readonly topbar: Topbar;
  private selection: Selection | null = null;
  private device: Device = "desktop";
  private destroyed = false;
  private modal: ModalHandle | null = null;
  // data
  private dataCache: Record<string, unknown> = {};
  private inflight = new Set<string>();
  private dataGeneration = 0;
  private dataTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: EditorOptions) {
    if (!options || !options.container) throw new Error("[dnd-web-builder] EditorOptions.container is required");
    if (!options.registry) throw new Error("[dnd-web-builder] EditorOptions.registry is required");
    this.options = options;
    this.registry = options.registry;
    this.store = new Store(normalizeDocument(options.document), { limit: options.historyLimit ?? 100 });

    this.host = this.createHost();
    this.topbar = new Topbar(this.host);
    this.sidebar = new Sidebar(this.host);
    this.canvas = new Canvas(this.host);
    this.settingsPanel = new SettingsPanel(this.host);
    this.root = h(
      "div",
      { class: "wbe-root", attrs: { "data-wbe-editor": "" } },
      this.topbar.el,
      h("div", { class: "wbe-body" }, this.sidebar.el, this.canvas.el, this.settingsPanel.el),
    );
    options.container.appendChild(this.root);

    // a drag that ends anywhere (or is cancelled) clears the drag state
    this.disposer.listen(document, "dragend", () => {
      this.host.drag.payload = null;
      this.canvas.hideIndicator();
    });
    this.disposer.listen(document, "drop", () => {
      this.host.drag.payload = null;
      this.canvas.hideIndicator();
    });
    bindKeyboard(this.host, this.root);

    this.canvas.setDevice();
    this.canvas.renderAll(this.store.doc);
    this.settingsPanel.refresh(true);
    this.sidebar.update();
    this.topbar.update();
    void this.fetchData();

    Promise.resolve().then(() => {
      if (!this.destroyed) this.emitter.emit("ready", {});
    });
  }

  private createHost(): EditorHost {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      editor: this,
      registry: this.registry,
      options: this.options,
      drag: new DragState(),
      disposer: this.disposer,
      doc: () => self.store.doc,
      selection: () => self.selection,
      device: () => self.device,
      renderSectionHtml: (section: SectionNode, index: number) =>
        renderSection(section, self.registry, {
          mode: "editor",
          data: self.dataCache,
          globals: self.options.globals ?? {},
          index,
        }),
      updateFromPanel: (kind, id, patch, field) => {
        self.commit(ops.updateSettings(self.store.doc, kind, id, patch), {
          coalesceKey: `${kind}:${id}:${field}`,
          fromPanel: true,
        });
      },
      breakCoalescing: () => self.store.breakCoalescing(),
      labelOf: (kind: SelectionKind, id: string) => self.labelOf(kind, id),
      openJson: () => self.openJson(),
    };
  }

  // ---------------------------------------------------------------------------
  // state
  // ---------------------------------------------------------------------------

  private commit(next: PageDocument, opts: CommitOptions = {}): boolean {
    if (this.destroyed) return false;
    const prev = this.store.doc;
    if (!this.store.commit(next, opts.coalesceKey)) return false;
    this.afterChange(prev, opts);
    return true;
  }

  private afterChange(prev: PageDocument, opts: CommitOptions = {}): void {
    const doc = this.store.doc;
    this.canvas.patch(prev, doc);
    if (opts.select !== undefined) this.setSelection(opts.select, false);
    else if (this.selection && !this.exists(this.selection)) this.setSelection(null, false);
    if (opts.fromPanel) this.settingsPanel.syncAfterOwnEdit();
    else this.settingsPanel.refresh();
    this.sidebar.update();
    this.topbar.update();
    this.canvas.refreshOverlay();
    this.scheduleData();
    this.emitter.emit("change", { document: cloneJson(doc), dirty: this.store.dirty });
  }

  private exists(sel: Selection): boolean {
    const doc = this.store.doc;
    return sel.kind === "section" ? !!doc.sections[sel.id] : !!ops.findBlock(doc, sel.id);
  }

  private setSelection(sel: Selection | null, refreshPanels = true): void {
    const prev = this.selection;
    const same = prev?.kind === sel?.kind && prev?.id === sel?.id;
    this.selection = sel && this.exists(sel) ? sel : null;
    if (refreshPanels) {
      this.settingsPanel.refresh();
      this.sidebar.update();
      this.canvas.refreshOverlay();
    }
    if (!same) {
      this.emitter.emit("select", { kind: this.selection?.kind ?? null, id: this.selection?.id ?? null });
    }
  }

  private labelOf(kind: SelectionKind, id: string): string {
    const doc = this.store.doc;
    if (kind === "section") {
      const s = doc.sections[id];
      return s ? (this.registry.section(s.type)?.label ?? s.type) : "";
    }
    const loc = ops.findBlock(doc, id);
    return loc ? (this.registry.block(loc.block.type)?.label ?? loc.block.type) : "";
  }

  // ---------------------------------------------------------------------------
  // data
  // ---------------------------------------------------------------------------

  private scheduleData(): void {
    if (!this.options.dataProvider) return;
    if (this.dataTimer) clearTimeout(this.dataTimer);
    this.dataTimer = setTimeout(() => {
      this.dataTimer = null;
      void this.fetchData();
    }, DATA_DEBOUNCE_MS);
  }

  private async fetchData(): Promise<void> {
    const provider = this.options.dataProvider;
    if (!provider || this.destroyed) return;
    const globals = this.options.globals ?? {};
    const missing = collectDataRequests(this.store.doc, this.registry, globals).filter(
      (r) => !(r.key in this.dataCache) && !this.inflight.has(r.key),
    );
    if (!missing.length) return;
    const generation = this.dataGeneration;
    missing.forEach((r) => this.inflight.add(r.key));
    let result: Record<string, unknown> = {};
    try {
      result = (await provider(missing)) ?? {};
    } catch (err) {
      console.error("[dnd-web-builder] dataProvider failed", err);
    }
    if (this.destroyed || generation !== this.dataGeneration) return;
    const keys = new Set<string>();
    for (const r of missing) {
      this.inflight.delete(r.key);
      this.dataCache[r.key] = result[r.key];
      keys.add(r.key);
    }
    const doc = this.store.doc;
    const affected = doc.order.filter((id) => {
      const s = doc.sections[id];
      return !!s && sectionDataRequests(s, this.registry, globals).some((r) => keys.has(r.key));
    });
    if (affected.length) this.canvas.rerender(affected);
  }

  // ---------------------------------------------------------------------------
  // public API
  // ---------------------------------------------------------------------------

  /** Deep clone of the current document. */
  getDocument(): PageDocument {
    return cloneJson(this.store.doc);
  }

  /**
   * Replace the document. By default (`resetHistory: true`) history is cleared and the new
   * document counts as saved; with `resetHistory: false` the replacement is an undoable change.
   */
  setDocument(doc: unknown, opts: { resetHistory?: boolean } = {}): void {
    if (this.destroyed) return;
    const next = normalizeDocument(doc);
    if (opts.resetHistory === false) {
      this.commit(next, { select: null });
      return;
    }
    const prev = this.store.doc;
    this.store.reset(next);
    this.afterChange(prev, { select: null });
  }

  markSaved(): void {
    this.store.markSaved();
    this.topbar.update();
  }

  get dirty(): boolean {
    return this.store.dirty;
  }

  undo(): void {
    if (this.destroyed) return;
    const prev = this.store.doc;
    if (this.store.undo()) this.afterChange(prev);
  }

  redo(): void {
    if (this.destroyed) return;
    const prev = this.store.doc;
    if (this.store.redo()) this.afterChange(prev);
  }

  canUndo(): boolean {
    return this.store.canUndo();
  }

  canRedo(): boolean {
    return this.store.canRedo();
  }

  select(kind: "section" | "block" | null, id: string | null = null): void {
    if (this.destroyed) return;
    this.setSelection(kind && id ? { kind, id } : null);
    if (this.selection) this.canvas.reveal(this.selection);
  }

  /** Adds a section (with its preset blocks) and selects it. Returns the new id, or "" for unknown types. */
  addSection(type: string, index?: number): string {
    const res = ops.addSection(this.store.doc, this.registry, type, index);
    if (!res) {
      console.warn(`[dnd-web-builder] Unknown section type "${type}"`);
      return "";
    }
    this.commit(res.doc, { select: { kind: "section", id: res.id } });
    this.canvas.reveal(this.selection);
    return res.id;
  }

  /** Adds a block if the section allows it; selects it. Returns the new id or null. */
  addBlock(sectionId: string, type: string, index?: number): string | null {
    const res = ops.addBlock(this.store.doc, this.registry, sectionId, type, index);
    if (!res) return null;
    this.commit(res.doc, { select: { kind: "block", id: res.id } });
    return res.id;
  }

  /** `toIndex` is the final index of the section. */
  moveSection(id: string, toIndex: number): void {
    this.commit(ops.moveSection(this.store.doc, id, toIndex));
  }

  /** `toIndex` is the final index within the target section. */
  moveBlock(blockId: string, toSectionId: string, toIndex: number): void {
    this.commit(ops.moveBlock(this.store.doc, blockId, toSectionId, toIndex, this.registry));
  }

  duplicate(kind: "section" | "block", id: string): void {
    const res =
      kind === "section" ? ops.duplicateSection(this.store.doc, id) : ops.duplicateBlock(this.store.doc, id, this.registry);
    if (res) this.commit(res.doc, { select: { kind, id: res.id } });
  }

  remove(kind: "section" | "block", id: string): void {
    const next = kind === "section" ? ops.removeSection(this.store.doc, id) : ops.removeBlock(this.store.doc, id);
    this.commit(next);
  }

  toggleHidden(sectionId: string): void {
    this.commit(ops.toggleHidden(this.store.doc, sectionId));
  }

  /** Shallow-merge settings (`undefined` deletes a key). Rapid edits of the same keys coalesce into one undo step. */
  updateSettings(kind: "section" | "block", id: string, patch: Settings): void {
    const key = `${kind}:${id}:${Object.keys(patch).sort().join(",")}`;
    this.commit(ops.updateSettings(this.store.doc, kind, id, patch), { coalesceKey: key });
  }

  setDevice(device: Device): void {
    if (this.destroyed || !["desktop", "tablet", "mobile"].includes(device)) return;
    this.device = device;
    this.canvas.setDevice();
    this.topbar.update();
  }

  /** Clears the data cache, refetches and re-renders sections that declare data. */
  async refreshData(): Promise<void> {
    if (this.destroyed) return;
    this.dataGeneration++;
    this.dataCache = {};
    this.inflight.clear();
    if (this.dataTimer) {
      clearTimeout(this.dataTimer);
      this.dataTimer = null;
    }
    const doc = this.store.doc;
    const globals = this.options.globals ?? {};
    const withData = doc.order.filter((id) => {
      const s = doc.sections[id];
      return !!s && sectionDataRequests(s, this.registry, globals).length > 0;
    });
    if (withData.length) this.canvas.rerender(withData);
    await this.fetchData();
  }

  on<K extends keyof EditorEvents>(event: K, cb: (e: EditorEvents[K]) => void): () => void {
    return this.emitter.on(event, cb);
  }

  /** Removes the editor DOM and every listener it registered (including on document/window). */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.dataTimer) clearTimeout(this.dataTimer);
    this.dataTimer = null;
    this.modal?.close();
    this.modal = null;
    this.disposer.dispose();
    this.emitter.clear();
    this.root.remove();
  }

  private openJson(): void {
    this.modal?.close();
    const doc = this.getDocument();
    this.modal = openModal({
      title: "Document JSON",
      width: "min(860px, 92vw)",
      content: jsonView(doc),
      onClose: () => {
        this.modal = null;
      },
      actions: [
        {
          label: "Copy",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
            } catch (err) {
              console.warn("[dnd-web-builder] Clipboard unavailable", err);
            }
          },
        },
      ],
    });
  }
}

export function createEditor(options: EditorOptions): Editor {
  return new Editor(options);
}
