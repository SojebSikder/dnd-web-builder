import type { EditorPlugin } from "../editor";
import type { Block } from "../editor/types";

const CoreBlocksPlugin: EditorPlugin = {
  name: "Core Blocks",
  blocks: [
    {
      type: "text",
      renderer: (block: Block): HTMLElement => {
        const p = document.createElement("p");
        p.textContent = block.settings.text || "Text block";
        return p;
      },
      defaultSettings: {
        text: "Your text here",
      },
      settingsSchema: [
        {
          key: "text",
          label: "Text",
          type: "text",
        },
      ],
    },
    {
      type: "image",
      renderer: (block: Block): HTMLElement => {
        const img = document.createElement("img");
        img.src = block.settings.src;
        img.alt = block.settings.alt || "";
        img.style.maxWidth = "40%";
        return img;
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
