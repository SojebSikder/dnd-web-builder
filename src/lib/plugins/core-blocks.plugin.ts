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
    },
    {
      type: "image",
      renderer: (block: Block): HTMLElement => {
        const img = document.createElement("img");
        img.src = block.settings.src;
        img.alt = block.settings.alt || "";
        img.style.maxWidth = "100%";
        return img;
      },
      defaultSettings: {
        src: "",
        alt: "",
      },
    },
    {
      type: "button",
      renderer: (block: Block): HTMLElement => {
        const a = document.createElement("a");
        a.textContent = block.settings.label || "Button";
        a.href = block.settings.href || "#";
        a.className = "btn";
        return a;
      },
      defaultSettings: {
        label: "Click me",
        href: "#",
      },
    },
  ],
};

export default CoreBlocksPlugin;
