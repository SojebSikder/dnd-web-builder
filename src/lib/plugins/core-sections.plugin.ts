import type { Section } from "../editor/types";
import { Editor, type EditorPlugin } from "../editor";
import { applyBaseStyles, BaseStyleSchema } from "../editor/plugin/plugin";

const CoreSectionsPlugin: EditorPlugin = {
  name: "Core Sections",
  sections: [
    {
      type: "container",
      settingsSchema: [
        ...BaseStyleSchema, // inherit all base styles
        { key: "customTitle", label: "Custom Title", type: "text" }, // add plugin-specific fields
      ],
      renderer: (section: Section, editor: Editor) => {
        const el = document.createElement("section");
        el.className = "container";

        applyBaseStyles(el, section.settings);

        // plugin-specific content
        if (section.settings.customTitle) {
          const h2 = document.createElement("h2");
          h2.textContent = section.settings.customTitle;
          el.appendChild(h2);
        }

        el.appendChild(editor.renderBlocks({ blocks: section.blocks }));
        return el;
      },
    },
    {
      type: "rich-text",
      settingsSchema: [
        {
          key: "heading",
          label: "Heading",
          type: "text",
        },
      ],
      renderer: (section: Section, editor: Editor): HTMLElement => {
        const el = document.createElement("section");
        el.className = "rich-text";

        if (section.settings.heading) {
          const h2 = document.createElement("h2");
          h2.textContent = section.settings.heading;
          el.appendChild(h2);
        }

        el.appendChild(editor.renderBlocks({ blocks: section.blocks }));
        return el;
      },
    },
    {
      type: "featured-collection",
      settingsSchema: [
        {
          key: "title",
          label: "Title",
          type: "text",
        },
        {
          key: "textContent",
          label: "Description",
          type: "text",
        },
      ],
      renderer: (section: Section): HTMLElement => {
        const el = document.createElement("section");
        el.className = "featured-collection";

        const h2 = document.createElement("h2");
        h2.textContent = section.settings.title || "Featured Collection";
        el.appendChild(h2);

        const placeholder = document.createElement("div");
        placeholder.textContent =
          section.settings.textContent || "🛒 Product preview (editor only)";
        placeholder.style.opacity = "0.6";
        el.appendChild(placeholder);

        return el;
      },
    },
    {
      type: "contact-form",
      settingsSchema: [
        {
          key: "heading",
          label: "Text",
          type: "text",
        },
        {
          key: "buttonText",
          label: "Button Text",
          type: "text",
        },
        {
          key: "namePlaceholder",
          label: "Name Placeholder",
          type: "text",
        },
        {
          key: "emailPlaceholder",
          label: "Email Placeholder",
          type: "text",
        },
        {
          key: "messagePlaceholder",
          label: "Message Placeholder",
          type: "text",
        },
        {
          key: "buttonColor",
          label: "Button Color",
          type: "color",
        },
        {
          key: "buttonBackgroundColor",
          label: "Button Background Color",
          type: "color",
        },
        {
          key: "buttonBorderColor",
          label: "Button Border Color",
          type: "color",
        },
      ],
      renderer: (section: Section): HTMLElement => {
        const el = document.createElement("section");
        el.className = "contact-form";

        // Heading
        const h2 = document.createElement("h2");
        h2.textContent = section.settings.heading || "Contact Us";
        el.appendChild(h2);

        // Form
        const form = document.createElement("form");

        // Name input
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = section.settings.namePlaceholder || "Name";
        form.appendChild(nameInput);
        form.appendChild(document.createElement("br"));

        // Email input
        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.placeholder = section.settings.emailPlaceholder || "Email";
        form.appendChild(emailInput);
        form.appendChild(document.createElement("br"));

        // Message textarea
        const messageTextarea = document.createElement("textarea");
        messageTextarea.placeholder =
          section.settings.messagePlaceholder || "Message";
        form.appendChild(messageTextarea);
        form.appendChild(document.createElement("br"));

        // Submit button
        const button = document.createElement("button");
        button.type = "submit";
        button.textContent = section.settings.buttonText || "Send";
        button.style.color = section.settings.buttonColor || "#fff";
        button.style.backgroundColor =
          section.settings.buttonBackgroundColor || "#007bff";
        button.style.borderColor =
          section.settings.buttonBorderColor || "#007bff";
        form.appendChild(button);

        el.appendChild(form);

        return el;
      },
    },
  ],
};

export default CoreSectionsPlugin;
