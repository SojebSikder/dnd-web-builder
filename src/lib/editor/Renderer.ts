// Not implemented yet
import { DragManager } from "./DragManager";
import { SelectionManager } from "./SelectionManager";
import { SettingsPanel } from "./SettingsPanel";
import type { Block, Section } from "./types";

export class Renderer {
  private editor: HTMLElement;
  private dragManager: DragManager;
  private selectionManager: SelectionManager;
  private settingsPanel: SettingsPanel;
  private getSectionPlugin: (type: string) => any;
  private getBlockPlugin: (type: string) => any;
  constructor(
    editor: HTMLElement,
    dragManager: DragManager,
    selectionManager: SelectionManager,
    settingsPanel: SettingsPanel,
    getSectionPlugin: (type: string) => any,
    getBlockPlugin: (type: string) => any,
  ) {
    this.editor = editor;
    this.dragManager = dragManager;
    this.selectionManager = selectionManager;
    this.settingsPanel = settingsPanel;
    this.getSectionPlugin = getSectionPlugin;
    this.getBlockPlugin = getBlockPlugin;
  }

  renderSection(section: Section): HTMLElement {
    const plugin = this.getSectionPlugin(section.type);
    if (!plugin?.renderer) {
      console.warn(`No renderer for section: ${section.type}`);
      const fallback = document.createElement("div");
      fallback.textContent = `Unknown section: ${section.type}`;
      fallback.classList.add("editor-section");
      fallback.dataset.sectionId = section.id;
      fallback.dataset.sectionType = section.type;
      return fallback;
    }

    const sectionEl = plugin.renderer(section, this.getEditorContext());
    sectionEl.classList.add("editor-section");
    sectionEl.dataset.sectionId = section.id;
    sectionEl.dataset.sectionType = section.type;

    this.dragManager.makeDraggable(sectionEl);
    this.attachSectionEvents(sectionEl, section);

    return sectionEl;
  }

  renderBlock(block: Block, sectionId: string): HTMLElement {
    const plugin = this.getBlockPlugin(block.type);
    if (!plugin?.renderer) {
      console.warn(`No block renderer for: ${block.type}`);
      const fallback = document.createElement("div");
      fallback.textContent = `Unknown block: ${block.type}`;
      fallback.classList.add("editor-block");
      fallback.dataset.blockId = block.id;
      fallback.dataset.blockType = block.type;
      fallback.dataset.sectionId = sectionId;
      return fallback;
    }

    const blockEl = plugin.renderer(block);
    blockEl.classList.add("editor-block");
    blockEl.dataset.blockId = block.id;
    blockEl.dataset.blockType = block.type;
    blockEl.dataset.sectionId = sectionId;

    this.dragManager.makeDraggable(blockEl);
    this.attachBlockEvents(blockEl, block);

    return blockEl;
  }

  renderBlocks(blocks: Block[] = [], sectionId: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-blocks";

    blocks.forEach((block) => {
      const blockEl = this.renderBlock(block, sectionId);
      wrapper.appendChild(blockEl);
    });

    this.dragManager.setupBlockDropZone(wrapper);

    // Listen for block reorder events
    wrapper.addEventListener("blockreorder", ((e: CustomEvent) => {
      const { sectionId, blockIds } = e.detail;
      // This will be handled by the Editor class via event bubbling
      const event = new CustomEvent("blockreorder", {
        detail: { sectionId, blockIds },
        bubbles: true,
      });
      wrapper.dispatchEvent(event);
    }) as EventListener);

    return wrapper;
  }

  private getEditorContext(): any {
    return {
      renderBlocks: (blocks?: Block[]) => this.renderBlocks(blocks || [], ""),
    };
  }

  private attachSectionEvents(el: HTMLElement, section: Section): void {
    el.addEventListener("click", () => {
      this.selectionManager.selectSection(section.id);
    });
  }

  private attachBlockEvents(el: HTMLElement, block: Block): void {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectionManager.selectBlock(block.id);
    });
  }

  refreshSection(section: Section, oldEl: HTMLElement): HTMLElement {
    const newEl = this.renderSection(section);
    oldEl.replaceWith(newEl);
    return newEl;
  }

  refreshBlock(
    block: Block,
    sectionId: string,
    oldEl: HTMLElement,
  ): HTMLElement {
    const newEl = this.renderBlock(block, sectionId);
    oldEl.replaceWith(newEl);
    return newEl;
  }
}
