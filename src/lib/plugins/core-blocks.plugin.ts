import { PluginHelper, type EditorPlugin } from "../editor";
import type { Block } from "../editor/types";

const CoreBlocksPlugin: EditorPlugin = {
  name: "Core Blocks",
  blocks: [
    {
      defaultSettings: {
        text: "Your text here",
      },
      settingsSchema: [
        ...PluginHelper.BaseStyleSchema,
        {
          key: "text",
          label: "Text",
          type: "text",
        },
      ],
      type: "text",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("p");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.textContent = block.settings.text || "Text block";
        return el;
      },
    },
    {
      type: "image",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("img");
        el.src = block.settings.src;
        el.alt = block.settings.alt || "";
        el.style.maxWidth = "40%";
        return el;
      },
      defaultSettings: {
        src: "",
        alt: "",
      },
    },
    {
      type: "link",
      settingsSchema: [
        {
          key: "label",
          label: "Text",
          type: "text",
        },
      ],
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("a");
        el.textContent = block.settings.label || "Button";
        el.href = block.settings.href || "#";
        el.className = "link";
        return el;
      },
      defaultSettings: {
        label: "Click me",
        href: "#",
      },
    },
    {
      type: "button",
      settingsSchema: [
        {
          key: "label",
          label: "Text",
          type: "text",
        },
      ],
      defaultSettings: {
        label: "Click me",
      },
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("button");
        el.textContent = block.settings.label || "Button";
        el.className = "btn";
        return el;
      },
    },
  ],
};

export default CoreBlocksPlugin;
