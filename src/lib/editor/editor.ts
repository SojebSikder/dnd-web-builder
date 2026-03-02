import type { PageJSON, Section, Block, SettingSchema } from "./types";
import {
  blockRenderers,
  getAllBlockPlugins,
  getAllSectionPlugins,
  getBlockPlugin,
  getSectionPlugin,
  sectionRenderers,
} from "./plugin/registry";
import type { BlockPlugin, SectionPlugin } from "./plugin";
import { UI } from "./ui/ui";

export class Editor {
  // toolbar element
  private app: HTMLElement;
  private editor: HTMLElement;
  private settingsContainer: HTMLElement;
  private _ui: UI;

  // track diff of section/block
  private selected:
    | { type: "section"; id: string }
    | { type: "block"; id: string }
    | null = null;

  private designMode = true; // toggle this
  private pageData: PageJSON;

  constructor(app: HTMLElement) {
    this.app = app;
    this.buildUI();

    // handle design mode events
    this.editor.addEventListener("click", (e) => {
      if (!this.designMode) return;

      const target = e.target as HTMLElement;

      // Prevent link navigation
      if (target.closest("a")) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Prevent button actions
      if (target.closest("button")) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    this.editor.addEventListener("submit", (e) => {
      if (!this.designMode) return;

      e.preventDefault();
      e.stopPropagation();
    });
  }

  // Predefined UI interface
  ui(): UI {
    if (!this._ui) {
      this._ui = new UI();
    }
    return this._ui;
  }

  buildUI() {
    //
    // build ui
    //
    const layoutEl = document.createElement("div");
    layoutEl.classList.add("layout");

    // create aside
    const asideEl = document.createElement("aside");
    asideEl.id = "sidebar";

    // create sections
    const sectionh3El = document.createElement("h3");
    sectionh3El.textContent = "Sections";
    const sectionlistEl = document.createElement("div");
    sectionlistEl.id = "section-list";
    sectionlistEl.classList.add("section-list");

    // create blocks
    const blockh3El = document.createElement("h3");
    blockh3El.textContent = "Blocks";
    const blocklistEl = document.createElement("div");
    blocklistEl.id = "block-list";
    blocklistEl.classList.add("section-list");

    const toolbarEl = document.createElement("div");
    toolbarEl.id = "toolbar";

    // create delete button
    const deleteEl = document.createElement("button");
    deleteEl.classList.add("btn");
    deleteEl.id = "delete-btn";
    deleteEl.textContent = "Delete Selected";

    // create designMode button
    const designModeEl = document.createElement("button");
    designModeEl.classList.add("btn");
    designModeEl.id = "design-mode-btn";
    designModeEl.textContent = "Design Mode";

    // create designMode button
    const showJsonBtnEl = document.createElement("button");
    showJsonBtnEl.classList.add("btn");
    showJsonBtnEl.id = "show-json-btn";
    showJsonBtnEl.textContent = "Show JSON";

    const mainContentEl = document.createElement("div");
    mainContentEl.classList.add("main-content");

    // create editor element
    const editorEl = document.createElement("div");
    editorEl.id = "editor";

    // create settings panel element
    const settingsContainerEl = document.createElement("div");
    settingsContainerEl.id = "settings-panel";

    mainContentEl.appendChild(editorEl);
    mainContentEl.appendChild(settingsContainerEl);

    toolbarEl.appendChild(deleteEl);
    toolbarEl.appendChild(designModeEl);
    toolbarEl.appendChild(showJsonBtnEl);
    asideEl.appendChild(toolbarEl);
    asideEl.appendChild(sectionh3El);
    asideEl.appendChild(sectionlistEl);
    asideEl.appendChild(blockh3El);
    asideEl.appendChild(blocklistEl);
    layoutEl.appendChild(asideEl);
    layoutEl.appendChild(mainContentEl);
    this.app.appendChild(layoutEl);

    this.editor = editorEl;
    this.settingsContainer = settingsContainerEl;

    designModeEl.addEventListener("click", () => {
      this.setDesignMode(!this.designMode);
      designModeEl.textContent = this.designMode
        ? "Design Mode"
        : "Preview Mode";
    });

    deleteEl.addEventListener("click", () => {
      this.deleteSelected();
    });

    showJsonBtnEl.addEventListener("click", () => {
      this.showJSONModal();
    });
  }

  getJSON() {
    return JSON.stringify(this.pageData, null, 2);
  }

  // create show modal panel to show json source code
  showJSONModal() {
    const json = this.getJSON();

    const pre = document.createElement("pre");
    pre.classList.add("json-modal");
    pre.innerHTML = this.syntaxHighlightWithLineNumbers(json);

    this.ui().createModal({
      title: "JSON Viewer",
      content: pre,
      width: "50%",
      actions: [
        {
          label: "Copy",
          className: "btn-secondary",
          onClick: async () => {
            await navigator.clipboard.writeText(json);
          },
        },
      ],
    });
  }

  // syntax highlight for json source view with line numbers
  syntaxHighlightWithLineNumbers(json: string) {
    // pretty print
    json = JSON.stringify(JSON.parse(json), null, 2);

    // escape HTML
    json = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // add syntax highlighting
    const highlighted = json.replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";

        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }

        return `<span class="${cls}">${match}</span>`;
      },
    );

    // split by lines and add line numbers
    return highlighted
      .split("\n")
      .map(
        (line, idx) =>
          `<span class="json-line"><span class="line-number">${idx + 1}</span> ${line}</span>`,
      )
      .join("\n");
  }

  setDesignMode(enabled: boolean) {
    this.designMode = enabled;

    if (enabled) {
      this.editor.classList.add("design-mode");
    } else {
      this.editor.classList.remove("design-mode");
    }
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

    // enable dragging
    sectionEl.draggable = true;

    this.setupSectionDrag(sectionEl);
    this.editor.addEventListener("dragover", (e) => {
      e.preventDefault();

      const dragging = this.editor.querySelector(".dragging") as HTMLElement;
      if (!dragging) return;

      // Find section under cursor
      const afterElement = this.getDragAfterElement(this.editor, e.clientY);
      if (afterElement == null) {
        this.editor.appendChild(dragging);
      } else {
        this.editor.insertBefore(dragging, afterElement);
      }
    });

    this.editor.addEventListener("drop", (e) => {
      e.preventDefault();

      // Update pageData.order based on new DOM order
      const sectionIds = Array.from(this.editor.children)
        .filter((el) => el.classList.contains("editor-section"))
        .map((el: HTMLElement) => el.dataset.sectionId!);

      this.pageData.order = sectionIds;
    });
    // end dragging

    sectionEl.addEventListener("click", () => {
      this.selected = { type: "section", id: section.id };

      const plugin = getSectionPlugin(section.type);
      if (plugin) this.showSettings(plugin, section.settings);
    });
  }

  getDragAfterElement(
    container: HTMLElement,
    y: number,
    selector = "editor-section",
  ): HTMLElement | null {
    const draggableElements = [
      ...container.querySelectorAll(`.${selector}:not(.dragging)`),
    ] as HTMLElement[];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null },
    ).element;
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

      blockEl.draggable = true;

      this.setupSectionDrag(blockEl);

      wrapper.addEventListener("dragover", (e) => {
        e.preventDefault();

        const dragging = wrapper.querySelector(".dragging") as HTMLElement;
        if (!dragging) return;

        const afterElement = this.getDragAfterElement(
          wrapper,
          e.clientY,
          "editor-block",
        );
        if (afterElement == null) {
          wrapper.appendChild(dragging);
        } else {
          wrapper.insertBefore(dragging, afterElement);
        }
      });

      wrapper.addEventListener("drop", (e) => {
        e.preventDefault();

        const sectionId = blockEl.dataset.sectionId!;
        const section = this.pageData.sections[sectionId];
        if (!section) return;

        const blockIds = Array.from(wrapper.children)
          .filter((el) => el.classList.contains("editor-block"))
          .map((el: HTMLElement) => el.dataset.blockId!);

        section.blocks = blockIds.map(
          (id) => section.blocks!.find((b) => b.id === id)!,
        );
      });
    });

    return wrapper;
  }

  private setupSectionDrag(sectionEl: HTMLElement) {
    sectionEl.draggable = true;

    sectionEl.addEventListener("dragstart", (e) => {
      sectionEl.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", sectionEl.dataset.sectionId!);
    });

    sectionEl.addEventListener("dragend", () => {
      sectionEl.classList.remove("dragging");
    });
  }

  showSettings(
    plugin: BlockPlugin | SectionPlugin,
    settings: Record<string, any>,
  ) {
    this.settingsContainer.innerHTML = "";
    const panel = this.renderSettingsPanel(
      settings,
      plugin.settingsSchema,
      plugin.defaultSettings,
    );
    this.settingsContainer.appendChild(panel);
  }

  renderSettingsPanel(
    settings: Record<string, any>,
    schema?: SettingSchema[],
    defaultSettings?: Record<string, any>,
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

      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

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
          input.value =
            settings[field.key] ?? defaultSettings?.[field.key] ?? "";
          break;

        case "textarea":
          input = document.createElement("textarea");
          input.value =
            settings[field.key] ?? defaultSettings?.[field.key] ?? "";
          break;

        case "boolean":
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(
            settings[field.key] ?? defaultSettings?.[field.key] ?? false,
          );
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

      this.refreshSelected();
    });

    return panel;
  }

  refreshSelected() {
    if (!this.selected) return;

    const refreshSection = (sectionData: Section, sectionEl: HTMLElement) => {
      const plugin = getSectionPlugin(sectionData.type);
      if (!plugin) return;

      // Render new section element
      const newEl = plugin.renderer(sectionData, this);
      newEl.classList.add("editor-section");
      newEl.dataset.sectionId = sectionData.id;
      newEl.dataset.sectionType = sectionData.type;

      // Re-attach drag events
      this.setupSectionDrag(newEl);

      // Re-attach click to select section
      newEl.addEventListener("click", () => {
        this.selected = { type: "section", id: sectionData.id };
        this.showSettings(plugin, sectionData.settings);
      });

      // Refresh all blocks inside this section
      const blockWrapper = newEl.querySelector(".editor-blocks");
      if (sectionData.blocks && blockWrapper) {
        blockWrapper.innerHTML = ""; // clear old blocks
        sectionData.blocks.forEach((block) => {
          const blockPlugin = getBlockPlugin(block.type);
          if (!blockPlugin) return;

          const blockEl = blockPlugin.renderer(block);
          blockEl.classList.add("editor-block");
          blockEl.dataset.blockId = block.id;
          blockEl.dataset.blockType = block.type;

          // Re-attach drag for block
          this.setupSectionDrag(blockEl);

          // Click to select block
          blockEl.addEventListener("click", (e) => {
            e.stopPropagation();
            this.selected = { type: "block", id: block.id };
            this.showSettings(blockPlugin, block.settings);
          });

          blockWrapper.appendChild(blockEl);
        });
      }

      sectionEl.replaceWith(newEl);
    };

    if (this.selected.type === "section") {
      const el = this.editor.querySelector(
        `[data-section-id="${this.selected.id}"]`,
      ) as HTMLElement | null;
      if (!el) return;

      const sectionData = this.findSectionById(this.selected.id);
      if (!sectionData) return;

      refreshSection(sectionData, el);
    }

    if (this.selected.type === "block") {
      // Find the section containing this block
      for (const section of Object.values(this.pageData.sections)) {
        const block = section.blocks?.find((b) => b.id === this.selected!.id);
        if (!block) continue;

        const sectionEl = this.editor.querySelector(
          `[data-section-id="${section.id}"]`,
        ) as HTMLElement;
        if (!sectionEl) return;

        const blockWrapper = sectionEl.querySelector(".editor-blocks");
        if (!blockWrapper) return;

        const oldEl = blockWrapper.querySelector(
          `[data-block-id="${block.id}"]`,
        ) as HTMLElement;
        if (!oldEl) return;

        const blockPlugin = getBlockPlugin(block.type);
        if (!blockPlugin) return;

        if (blockPlugin?.isDynamic) return; // skip re-render

        // Render new block element
        const newEl = blockPlugin.renderer(block);
        newEl.classList.add("editor-block");
        newEl.dataset.blockId = block.id;
        newEl.dataset.blockType = block.type;

        // Re-attach drag & click
        this.setupSectionDrag(newEl);
        newEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selected = { type: "block", id: block.id };
          this.showSettings(blockPlugin, block.settings);
        });

        oldEl.replaceWith(newEl);
        break; // block found and refreshed, stop looping
      }
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

  /**
   * This used to add section/block elements to editor
   */
  initChooser() {
    const sectionList = document.getElementById("section-list")!;
    const blockList = document.getElementById("block-list")!;

    // Clear existing
    sectionList.innerHTML = "";
    blockList.innerHTML = "";

    // Sections
    getAllSectionPlugins().forEach((plugin) => {
      const item = this.createPluginItem("section", plugin.type);
      sectionList.appendChild(item);
    });

    // Blocks
    getAllBlockPlugins().forEach((plugin) => {
      const item = this.createPluginItem("block", plugin.type);
      blockList.appendChild(item);
    });

    this.setupDropZones();
  }

  private createPluginItem(
    kind: "section" | "block",
    pluginType: string,
  ): HTMLElement {
    const item = document.createElement("div");
    item.className = "plugin-item";
    item.textContent = pluginType.replace(/-/g, " ");

    item.draggable = true;

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("type", kind);
      e.dataTransfer?.setData("plugin", pluginType);
    });

    return item;
  }
  private setupDropZones() {
    this.editor.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    this.editor.addEventListener("drop", (e) => {
      e.preventDefault();

      const type = e.dataTransfer?.getData("type");
      const pluginType = e.dataTransfer?.getData("plugin");

      if (!type || !pluginType) return;

      if (type === "section") {
        this.addSection(pluginType);
        return;
      }

      if (type === "block") {
        const target = e.target as HTMLElement;
        const sectionEl = target.closest(
          "[data-section-id]",
        ) as HTMLElement | null;

        if (!sectionEl) return;

        const sectionId = sectionEl.dataset.sectionId!;
        this.addBlock(sectionId, pluginType);
      }
    });
  }

  addSection(type: string) {
    const plugin = getSectionPlugin(type);
    if (!plugin) return;

    // Generate a unique ID
    const id = `section-${Date.now()}`;

    const newSection: Section = {
      id,
      type: plugin.type,
      settings: {},
      blocks: [],
    };

    // Add to pageData
    this.pageData.sections[id] = newSection;
    this.pageData.order.push(id);

    // Render and append
    const el = plugin.renderer(newSection, this);
    el.classList.add("editor-section");
    el.dataset.sectionId = id;
    el.dataset.sectionType = plugin.type;

    this.editor.appendChild(el);

    // Select newly added section
    this.selected = { type: "section", id };
    this.showSettings(plugin, newSection.settings);

    this.setupSectionDrag(el);
  }

  addBlock(sectionId: string, type: string) {
    const plugin = getBlockPlugin(type);
    if (!plugin) return;

    const section = this.pageData.sections[sectionId];
    if (!section) return;

    const id = `block-${Date.now()}`;

    const newBlock: Block = {
      id,
      type: plugin.type,
      settings: {},
    };

    section.blocks = section.blocks || [];
    section.blocks.push(newBlock);

    const blockEl = plugin.renderer(newBlock);

    blockEl.classList.add("editor-block");
    blockEl.dataset.blockId = id;
    blockEl.dataset.blockType = plugin.type;

    blockEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selected = { type: "block", id };
      this.showSettings(plugin, newBlock.settings);
    });

    this.setupSectionDrag(blockEl);

    const sectionEl = this.editor.querySelector(
      `[data-section-id="${sectionId}"]`,
    ) as HTMLElement;

    let wrapper = sectionEl.querySelector(
      ".editor-blocks",
    ) as HTMLElement | null;

    if (!wrapper) {
      wrapper = this.renderBlocks({ blocks: [] });
      sectionEl.appendChild(wrapper);
    }

    wrapper.appendChild(blockEl);

    // Select new block
    this.selected = { type: "block", id };
    this.showSettings(plugin, newBlock.settings);
  }

  /**
   * Delete a section by ID
   */
  deleteSection(sectionId: string) {
    const sectionEl = this.editor.querySelector(
      `[data-section-id="${sectionId}"]`,
    ) as HTMLElement | null;
    if (sectionEl) sectionEl.remove();

    // Remove from pageData
    delete this.pageData.sections[sectionId];
    this.pageData.order = this.pageData.order.filter((id) => id !== sectionId);

    // Clear selection if it was the deleted section
    if (this.selected?.type === "section" && this.selected.id === sectionId) {
      this.selected = null;
      this.settingsContainer.innerHTML = "";
    }
  }

  /**
   * Delete a block by ID
   */
  deleteBlock(blockId: string) {
    // Find the section containing this block
    for (const section of Object.values(this.pageData.sections)) {
      const blockIndex = section.blocks?.findIndex((b) => b.id === blockId);
      if (blockIndex === undefined || blockIndex === -1) continue;

      // Remove block from pageData
      section.blocks!.splice(blockIndex, 1);

      // Remove block element from DOM
      const sectionEl = this.editor.querySelector(
        `[data-section-id="${section.id}"]`,
      ) as HTMLElement | null;
      if (!sectionEl) return;

      const blockEl = sectionEl.querySelector(
        `[data-block-id="${blockId}"]`,
      ) as HTMLElement | null;
      if (blockEl) blockEl.remove();

      // Clear selection if it was the deleted block
      if (this.selected?.type === "block" && this.selected.id === blockId) {
        this.selected = null;
        this.settingsContainer.innerHTML = "";
      }

      break; // block found and deleted
    }
  }

  /**
   * Delete the currently selected section or block
   */
  deleteSelected() {
    if (!this.selected) return;

    if (this.selected.type === "section") {
      this.deleteSection(this.selected.id);
    } else if (this.selected.type === "block") {
      this.deleteBlock(this.selected.id);
    }
  }
}
