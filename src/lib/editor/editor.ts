import type { PageJSON, Section, Block } from "./types";
import { blockRenderers, sectionRenderers } from "./plugin/registry";

export class Editor {
  toolbar: HTMLElement;
  editor: HTMLElement;

  constructor(toolbar: HTMLElement, editor: HTMLElement) {
    this.toolbar = toolbar;
    this.editor = editor;
  }

  load(jsonData: PageJSON) {
    this.editor.innerHTML = "";

    jsonData.order.forEach((sectionId) => {
      const section = jsonData.sections[sectionId];
      if (!section) return;

      this.loadSection(section);
    });
  }

  private loadSection(section: Section) {
    const renderer = sectionRenderers[section.type];
    if (!renderer) {
      console.warn(`No renderer for section: ${section.type}`);
      return;
    }

    const sectionEl = renderer(section);
    sectionEl.classList.add("editor-section");
    sectionEl.dataset.sectionId = section.id;
    sectionEl.dataset.sectionType = section.type;

    this.editor.appendChild(sectionEl);
  }
}

export function renderBlocks(blocks?: Block[]): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "editor-blocks";

  blocks?.forEach((block) => {
    const renderer = blockRenderers[block.type];
    if (!renderer) {
      console.warn(`No block renderer for: ${block.type}`);
      return;
    }

    const blockEl = renderer(block);
    blockEl.classList.add("editor-block");
    blockEl.dataset.blockId = block.id;
    blockEl.dataset.blockType = block.type;

    wrapper.appendChild(blockEl);
  });

  return wrapper;
}
