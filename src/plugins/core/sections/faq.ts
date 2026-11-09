import { escapeHtml, parseList } from "../../../core/html";
import type { SectionDefinition } from "../../../core/types";
import { heading, withCommon } from "../shared";

export const faqSection: SectionDefinition = {
  type: "faq",
  label: "FAQ",
  icon: "❓",
  category: "Text",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Frequently asked questions" },
    {
      key: "items",
      label: "Questions",
      type: "list",
      help: "One per line: Question | Answer",
      placeholder: "How long does shipping take? | 3–5 business days.",
      default:
        "How long does shipping take? | Orders usually arrive within 3–5 business days.\nCan I return an item? | Yes, within 30 days of delivery.\nDo you ship internationally? | We ship to most countries worldwide.",
    },
  ]),
  render(section) {
    const s = section.settings;
    const items = parseList(s.items)
      .filter(([q]) => !!q)
      .map(([q, ...rest]) => {
        const answer = rest.join(" | ");
        return (
          `<details class="wb-faq__item"><summary class="wb-faq__question">${escapeHtml(q)}</summary>` +
          `<div class="wb-faq__answer">${escapeHtml(answer)}</div></details>`
        );
      })
      .join("");
    return `<div class="wb-container wb-faq">${heading(s.heading, "h2", "wb-heading wb-section-heading")}${items}</div>`;
  },
};
