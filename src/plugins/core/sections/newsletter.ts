import { escapeAttr, escapeHtml } from "../../../core/html";
import type { SectionDefinition } from "../../../core/types";
import { heading, paragraph, str, withCommon } from "../shared";

export const newsletterSection: SectionDefinition = {
  type: "newsletter",
  label: "Newsletter",
  icon: "✉️",
  category: "Forms",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Subscribe to our emails" },
    {
      key: "text",
      label: "Text",
      type: "textarea",
      default: "Be the first to know about new collections and exclusive offers.",
    },
    { key: "placeholder", label: "Input placeholder", type: "text", default: "Email address" },
    { key: "buttonLabel", label: "Button label", type: "text", default: "Subscribe" },
  ]),
  render(section) {
    const s = section.settings;
    const inputId = escapeAttr(`wb-nl-${section.id}`);
    return (
      `<div class="wb-container wb-newsletter">` +
      heading(s.heading, "h2") +
      paragraph(s.text) +
      `<form class="wb-form wb-form--inline" data-wb-form="newsletter" method="post">` +
      `<label class="wb-visually-hidden" for="${inputId}">${escapeHtml(str(s.placeholder) || "Email")}</label>` +
      `<input class="wb-input" id="${inputId}" type="email" name="email" required autocomplete="email" placeholder="${escapeAttr(str(s.placeholder))}">` +
      `<button class="wb-button wb-button--primary" type="submit">${escapeHtml(str(s.buttonLabel) || "Subscribe")}</button>` +
      `</form></div>`
    );
  },
};
