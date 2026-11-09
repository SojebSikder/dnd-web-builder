import type { SectionDefinition } from "../../../core/types";
import { heading, richText, withCommon } from "../shared";

export const richTextSection: SectionDefinition = {
  type: "rich-text",
  label: "Rich text",
  icon: "¶",
  category: "Text",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Talk about your brand" },
    {
      key: "body",
      label: "Text",
      type: "richtext",
      default:
        "<p>Share information about your brand with your customers. Describe a product, make announcements, or welcome customers to your store.</p>",
    },
  ]),
  render(section) {
    const s = section.settings;
    return `<div class="wb-container wb-rich-text">${heading(s.heading, "h2")}${richText(s.body)}</div>`;
  },
};
