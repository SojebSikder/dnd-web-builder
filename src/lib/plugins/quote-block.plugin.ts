import type { EditorPlugin } from "../editor";
import type { Block } from "../editor/types";

const QuoteBlockPlugin: EditorPlugin = {
  name: "Quote Block",

  blocks: [
    {
      type: "quote",
      settingsSchema: [
        {
          key: "text",
          label: "Text",
          type: "text",
        },
      ],
      renderer: (block: Block) => {
        const el = document.createElement("blockquote");
        el.textContent = block.settings.text || "Quote...";
        el.style.borderLeft = "4px solid #000";
        el.style.paddingLeft = "12px";
        el.style.opacity = "0.8";
        return el;
      },
      defaultSettings: {
        text: "This is a quote",
      },
    },
  ],
};

export default QuoteBlockPlugin;
