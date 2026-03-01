import type { Section } from "../editor/types";
import { Editor, type EditorPlugin } from "../editor";

const CoreSectionsPlugin: EditorPlugin = {
  name: "Core Sections",
  sections: [
    {
      type: "container",
      settingsSchema: [
        {
          key: "backgroundColor",
          label: "Background Color",
          type: "color",
        },
        {
          key: "height",
          label: "Height",
          type: "text",
        },
        {
          key: "width",
          label: "Width",
          type: "text",
        },
        {
          key: "padding",
          label: "Padding",
          type: "text",
        },
        {
          key: "margin",
          label: "Margin",
          type: "text",
        },
        {
          key: "borderRadius",
          label: "Border Radius",
          type: "text",
        },
        {
          key: "borderWidth",
          label: "Border Width",
          type: "text",
        },
        {
          key: "borderColor",
          label: "Border Color",
          type: "color",
        },
        {
          key: "display",
          label: "Display",
          type: "text",
        },
        // position
        {
          key: "position",
          label: "Position",
          type: "text",
        },
        {
          key: "top",
          label: "Top",
          type: "text",
        },
        {
          key: "right",
          label: "Right",
          type: "text",
        },
        {
          key: "left",
          label: "Left",
          type: "text",
        },
        {
          key: "bottom",
          label: "Bottom",
          type: "text",
        },
      ],
      renderer: (section: Section, editor: Editor): HTMLElement => {
        const el = document.createElement("section");
        el.className = "container";

        if (section.settings.backgroundColor) {
          el.style.backgroundColor = section.settings.backgroundColor;
        }
        if (section.settings.height) {
          el.style.height = `${section.settings.height}`;
        }
        if (section.settings.width) {
          el.style.width = `${section.settings.width}`;
        }
        if (section.settings.padding) {
          el.style.padding = `${section.settings.padding}`;
        }
        if (section.settings.margin) {
          el.style.margin = `${section.settings.margin}`;
        }
        if (section.settings.borderRadius) {
          el.style.borderRadius = `${section.settings.borderRadius}`;
        }
        if (section.settings.borderWidth) {
          el.style.borderWidth = `${section.settings.borderWidth}`;
        }
        if (section.settings.borderColor) {
          el.style.borderColor = section.settings.borderColor;
        }
        // display
        if (section.settings.display) {
          el.style.display = section.settings.display;
        }
        // positions
        if (section.settings.position) {
          el.style.position = section.settings.position;
        }
        if (section.settings.top) {
          el.style.top = section.settings.top;
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
