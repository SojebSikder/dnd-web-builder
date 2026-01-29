import type { Section } from "../editor/types";
import { Editor, type EditorPlugin } from "../editor";

const CoreSectionsPlugin: EditorPlugin = {
  name: "Core Sections",
  sections: [
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
      renderer: (section: Section): HTMLElement => {
        const el = document.createElement("section");
        el.className = "featured-collection";

        const h2 = document.createElement("h2");
        h2.textContent = section.settings.title || "Featured Collection";
        el.appendChild(h2);

        const placeholder = document.createElement("div");
        placeholder.textContent = "🛒 Product preview (editor only)";
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

        const h2 = document.createElement("h2");
        h2.textContent = section.settings.heading || "Contact Us";
        el.appendChild(h2);

        const form = document.createElement("form");
        form.innerHTML = `
          <input type="text" placeholder="${section.settings.namePlaceholder || "Name"}" /><br/>
          <input type="email" placeholder="${section.settings.emailPlaceholder || "Email"}" /><br/>
          <textarea placeholder="${section.settings.messagePlaceholder || "Message"}"></textarea><br/>
          <button type="submit"
          style="background-color: ${section.settings.buttonBackgroundColor || "#007bff"};
          border-color: ${section.settings.buttonBorderColor || "#007bff"};">
          ${section.settings.buttonText || "Send"}
          </button>
        `;

        el.appendChild(form);
        return el;
      },
    },
  ],
};

export default CoreSectionsPlugin;
