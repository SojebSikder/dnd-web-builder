import { escapeHtml } from "../../../core/html";
import type { BlockDefinition } from "../../../core/types";
import { heading, paragraph, str, withCommon } from "../shared";

export const iconTextBlock: BlockDefinition = {
  type: "icon-text",
  label: "Icon with text",
  icon: "✨",
  category: "Text",
  schema: withCommon([
    { key: "icon", label: "Icon (emoji)", type: "text", default: "✨" },
    { key: "title", label: "Title", type: "text", default: "Feature" },
    { key: "text", label: "Text", type: "textarea", default: "Describe a feature or benefit." },
  ]),
  render(block) {
    const s = block.settings;
    const icon = Array.from(str(s.icon).trim()).slice(0, 4).join("");
    return (
      `<div class="wb-icon-text">` +
      (icon ? `<div class="wb-icon-text__icon" aria-hidden="true">${escapeHtml(icon)}</div>` : "") +
      heading(s.title, "h3", "wb-icon-text__title") +
      paragraph(s.text, "wb-icon-text__text") +
      `</div>`
    );
  },
};
