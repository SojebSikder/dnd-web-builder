import { escapeAttr, escapeHtml } from "../../../core/html";
import type { SectionDefinition } from "../../../core/types";
import { heading, paragraph, str, withCommon } from "../shared";

export const contactFormSection: SectionDefinition = {
  type: "contact-form",
  label: "Contact form",
  icon: "📨",
  category: "Forms",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Contact us" },
    { key: "text", label: "Text", type: "textarea", default: "" },
    { key: "buttonLabel", label: "Button label", type: "text", default: "Send message" },
  ]),
  render(section) {
    const s = section.settings;
    const id = (name: string) => escapeAttr(`wb-cf-${section.id}-${name}`);
    const field = (name: string, label: string, control: string) =>
      `<div class="wb-field"><label class="wb-label" for="${id(name)}">${escapeHtml(label)}</label>${control}</div>`;
    return (
      `<div class="wb-container wb-contact-form">` +
      heading(s.heading, "h2") +
      paragraph(s.text) +
      `<form class="wb-form" data-wb-form="contact" method="post">` +
      `<div class="wb-form__row">` +
      field("name", "Name", `<input class="wb-input" id="${id("name")}" name="name" type="text" autocomplete="name">`) +
      field(
        "email",
        "Email",
        `<input class="wb-input" id="${id("email")}" name="email" type="email" required autocomplete="email">`,
      ) +
      `</div>` +
      field(
        "message",
        "Message",
        `<textarea class="wb-input wb-textarea" id="${id("message")}" name="message" rows="5" required></textarea>`,
      ) +
      `<div class="wb-actions"><button class="wb-button wb-button--primary" type="submit">${escapeHtml(
        str(s.buttonLabel) || "Send",
      )}</button></div>` +
      `</form></div>`
    );
  },
};
