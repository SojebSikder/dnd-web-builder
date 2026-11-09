import { escapeHtml } from "../../../core/html";
import type { BlockDefinition } from "../../../core/types";
import { paragraph, str, withCommon } from "../shared";

export const quoteBlock: BlockDefinition = {
  type: "quote",
  label: "Quote",
  icon: "❝",
  category: "Text",
  schema: withCommon([
    { key: "text", label: "Quote", type: "textarea", default: "This is the best purchase I have made all year." },
    { key: "author", label: "Author", type: "text", default: "Happy customer" },
  ]),
  render(block) {
    const s = block.settings;
    const author = str(s.author).trim();
    return (
      `<blockquote class="wb-quote">${paragraph(s.text, "wb-quote__text")}` +
      (author ? `<footer class="wb-quote__author">— ${escapeHtml(author)}</footer>` : "") +
      `</blockquote>`
    );
  },
};
