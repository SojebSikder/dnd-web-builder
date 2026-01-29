import type { PageJSON, Section, Block, SettingSchema } from "./types";
import {
  blockRenderers,
  getBlockPlugin,
  getSectionPlugin,
  sectionRenderers,
} from "./plugin/registry";
import type { BlockPlugin, SectionPlugin } from "./plugin";

export class Editor {
  toolbar: HTMLElement;
  editor: HTMLElement;
  settingsContainer: HTMLElement;

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
    this.editor.innerHTML = "";

    jsonData.order.forEach((sectionId) => {
      const section = jsonData.sections[sectionId];
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
      });

      input.id = field.key;

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      panel.appendChild(wrapper);
    });

    return panel;
  }
}
