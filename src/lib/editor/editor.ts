import type { PageJSON, Section, Block, SettingSchema } from "./types";
import {
  blockRenderers,
  getBlockPlugin,
  getSectionPlugin,
  sectionRenderers,
} from "./plugin/registry";
import type { BlockPlugin, SectionPlugin } from "./plugin";

export class Editor {
  // toolbar element
  private toolbar: HTMLElement;
  private editor: HTMLElement;
  private settingsContainer: HTMLElement;

  // track diff of section/block
  private selected:
    | { type: "section"; id: string }
    | { type: "block"; id: string }
    | null = null;

  private pageData: PageJSON;

  constructor(
    toolbar: HTMLElement,
    editor: HTMLElement,
    settingsContainer: HTMLElement,
  ) {
    this.toolbar = toolbar;
    this.editor = editor;
    this.settingsContainer = settingsContainer;
  }

  load(jsonData: PageJSON) {
    this.pageData = jsonData;
    this.editor.innerHTML = "";

    this.pageData.order.forEach((sectionId) => {
      const section = this.pageData.sections[sectionId];
      if (!section) return;

      this.loadSection(section, this);
    });
  }

  private loadSection(section: Section, editor: Editor) {
    const renderer = sectionRenderers[section.type];
    if (!renderer) {
      console.warn(`No renderer for section: ${section.type}`);
      return;
    }

    const sectionEl = renderer(section, editor);
    sectionEl.classList.add("editor-section");
    sectionEl.dataset.sectionId = section.id;
    sectionEl.dataset.sectionType = section.type;

    this.editor.appendChild(sectionEl);

    sectionEl.addEventListener("click", () => {
      this.selected = { type: "section", id: section.id };

      const plugin = getSectionPlugin(section.type);
      if (plugin) this.showSettings(plugin, section.settings);
    });
  }

  renderBlocks({ blocks }: { blocks?: Block[] }): HTMLElement {
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

      blockEl.addEventListener("click", (e) => {
        e.stopPropagation();

        this.selected = { type: "block", id: block.id };

        const plugin = getBlockPlugin(block.type);
        if (plugin) this.showSettings(plugin, block.settings);
      });
    });

    return wrapper;
  }

  showSettings(
    plugin: BlockPlugin | SectionPlugin,
    settings: Record<string, any>,
  ) {
    this.settingsContainer.innerHTML = "";
    const panel = this.renderSettingsPanel(settings, plugin.settingsSchema);
    this.settingsContainer.appendChild(panel);
  }

  renderSettingsPanel(
    settings: Record<string, any>,
    schema?: SettingSchema[],
  ): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "editor-settings-panel";

    if (!schema) return panel;

    schema.forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className = "editor-settings-field";

      const label = document.createElement("label");
      label.textContent = field.label;
      label.htmlFor = field.key;

      let input: HTMLInputElement | HTMLSelectElement;

      switch (field.type) {
        case "text":
        case "number":
        case "color":
          input = document.createElement("input");
          input.type = field.type;
          if (field.type === "number") {
            if (field.min !== undefined) input.min = String(field.min);
            if (field.max !== undefined) input.max = String(field.max);
            if (field.step !== undefined) input.step = String(field.step);
          }
          input.value = settings[field.key] ?? "";
          break;

        case "boolean":
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(settings[field.key]);
          break;

        case "select":
          input = document.createElement("select");
          field.options?.forEach((opt) => {
            const optionEl = document.createElement("option");
            optionEl.value = opt;
            optionEl.textContent = opt;
            if (settings[field.key] === opt) optionEl.selected = true;
            input.appendChild(optionEl);
          });
          break;
      }

      input.addEventListener("input", () => {
        let value: any;

        if (field.type === "boolean") {
          value = (input as HTMLInputElement).checked;
        } else if (field.type === "number") {
          value = Number(input.value);
        } else {
          value = input.value;
        }

        settings[field.key] = value;

        this.refreshSelected();
      });

      input.id = field.key;

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      panel.appendChild(wrapper);
    });

    return panel;
  }

  refreshSelected() {
    if (!this.selected) return;

    if (this.selected.type === "section") {
      const el = this.editor.querySelector(
        `[data-section-id="${this.selected.id}"]`,
      ) as HTMLElement | null;
      if (!el) return;

      const sectionType = el.dataset.sectionType!;
      const plugin = getSectionPlugin(sectionType);
      if (!plugin) return;

      const sectionData = this.findSectionById(this.selected.id);
      if (!sectionData) return;

      const newEl = plugin.renderer(sectionData, this);
      newEl.classList.add("editor-section");
      newEl.dataset.sectionId = sectionData.id;
      newEl.dataset.sectionType = sectionData.type;

      el.replaceWith(newEl);
    }

    if (this.selected.type === "block") {
      const el = this.editor.querySelector(
        `[data-block-id="${this.selected.id}"]`,
      ) as HTMLElement | null;
      if (!el) return;

      const blockType = el.dataset.blockType!;
      const plugin = getBlockPlugin(blockType);
      if (!plugin) return;

      const blockData = this.findBlockById(this.selected.id);
      if (!blockData) return;

      const newEl = plugin.renderer(blockData);
      newEl.classList.add("editor-block");
      newEl.dataset.blockId = blockData.id;
      newEl.dataset.blockType = blockData.type;

      el.replaceWith(newEl);
    }
  }

  findSectionById(id: string) {
    return Object.values(this.pageData.sections).find((s) => s.id === id);
  }

  findBlockById(id: string) {
    for (const section of Object.values(this.pageData.sections)) {
      const block = section.blocks?.find((b) => b.id === id);
      if (block) return block;
    }
  }
}
