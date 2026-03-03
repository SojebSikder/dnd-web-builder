// Not implemented yet
import type { PageJSON, Section, Block } from "./types";

export class StateManager {
  private pageData: PageJSON;

  constructor(initialData?: PageJSON) {
    if (initialData) {
      this.pageData = initialData;
    } else {
      this.pageData = {
        sections: {},
        order: [],
      };
    }
  }

  getPageData(): PageJSON {
    return this.pageData;
  }

  setPageData(data: PageJSON) {
    this.pageData = data;
  }

  getSection(id: string): Section | undefined {
    return this.pageData.sections[id];
  }

  getSections(): Section[] {
    return this.pageData.order.map((id) => this.pageData.sections[id]);
  }

  addSection(section: Section): void {
    this.pageData.sections[section.id] = section;
    this.pageData.order.push(section.id);
  }

  updateSection(id: string, updates: Partial<Section>): void {
    const section = this.pageData.sections[id];
    if (section) {
      Object.assign(section, updates);
    }
  }

  deleteSection(id: string): void {
    delete this.pageData.sections[id];
    this.pageData.order = this.pageData.order.filter(
      (sectionId) => sectionId !== id,
    );
  }

  getBlock(sectionId: string, blockId: string): Block | undefined {
    const section = this.pageData.sections[sectionId];
    return section?.blocks?.find((b) => b.id === blockId);
  }

  addBlock(sectionId: string, block: Block): void {
    const section = this.pageData.sections[sectionId];
    if (section) {
      if (!section.blocks) section.blocks = [];
      section.blocks.push(block);
    }
  }

  updateBlock(
    sectionId: string,
    blockId: string,
    updates: Partial<Block>,
  ): void {
    const section = this.pageData.sections[sectionId];
    if (section?.blocks) {
      const index = section.blocks.findIndex((b) => b.id === blockId);
      if (index !== -1) {
        Object.assign(section.blocks[index], updates);
      }
    }
  }

  deleteBlock(sectionId: string, blockId: string): void {
    const section = this.pageData.sections[sectionId];
    if (section?.blocks) {
      section.blocks = section.blocks.filter((b) => b.id !== blockId);
    }
  }

  findSectionByBlockId(
    blockId: string,
  ): { section: Section; block: Block } | undefined {
    for (const section of Object.values(this.pageData.sections)) {
      const block = section.blocks?.find((b) => b.id === blockId);
      if (block) {
        return { section, block };
      }
    }
    return undefined;
  }

  reorderSections(newOrder: string[]): void {
    this.pageData.order = newOrder;
  }

  reorderBlocks(sectionId: string, newBlockIds: string[]): void {
    const section = this.pageData.sections[sectionId];
    if (section?.blocks) {
      const blockMap = new Map(section.blocks.map((b) => [b.id, b]));
      section.blocks = newBlockIds.map((id) => blockMap.get(id)!);
    }
  }

  syncFromDOM(editor: HTMLElement): void {
    const sectionIds = Array.from(
      editor.querySelectorAll(".editor-section"),
    ).map((el) => (el as HTMLElement).dataset.sectionId!);

    this.pageData.order = sectionIds;

    sectionIds.forEach((sectionId) => {
      const sectionEl = editor.querySelector(
        `[data-section-id="${sectionId}"]`,
      ) as HTMLElement;

      const blockIds = Array.from(
        sectionEl.querySelectorAll(".editor-block"),
      ).map((el) => (el as HTMLElement).dataset.blockId!);

      const section = this.pageData.sections[sectionId];
      if (!section) return;

      section.blocks = blockIds.map(
        (id) => section.blocks!.find((b) => b.id === id)!,
      );
    });
  }

  toJSON(): string {
    return JSON.stringify(this.pageData, null, 2);
  }
}
