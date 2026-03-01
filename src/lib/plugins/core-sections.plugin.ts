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
        // padding
        {
          key: "paddingTop",
          label: "Padding Top",
          type: "text",
        },
        {
          key: "paddingRight",
          label: "Padding Right",
          type: "text",
        },
        {
          key: "paddingBottom",
          label: "Padding Bottom",
          type: "text",
        },
        {
          key: "paddingLeft",
          label: "Padding Left",
          type: "text",
        },
        // margin
        {
          key: "marginTop",
          label: "Margin Top",
          type: "text",
        },
        {
          key: "marginRight",
          label: "Margin Right",
          type: "text",
        },
        {
          key: "marginBottom",
          label: "Margin Bottom",
          type: "text",
        },
        {
          key: "marginLeft",
          label: "Margin Left",
          type: "text",
        },
        // border
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
          type: "select",
          options: ["block", "flex", "inline", "inline-block", "none"],
        },
        // position
        {
          key: "position",
          label: "Position",
          type: "select",
          options: ["static", "relative", "absolute", "fixed", "sticky"],
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
        // float
        {
          key: "float",
          label: "Float",
          type: "select",
          options: ["none", "left", "right"],
        },
        // font
        {
          key: "font",
          label: "Font",
          type: "select",
          options: ["none", "Arial", "Helvetica", "Times New Roman"],
        },
        // font size
        {
          key: "fontSize",
          label: "Font Size",
          type: "select",
          options: ["none", "12px", "14px", "16px", "18px", "20px"],
        },
        // font weight
        {
          key: "fontWeight",
          label: "Font Weight",
          type: "select",
          options: ["none", "normal", "bold", "bolder", "lighter"],
        },
        // font style
        {
          key: "fontStyle",
          label: "Font Style",
          type: "select",
          options: ["none", "normal", "italic", "oblique"],
        },
        // line height
        {
          key: "lineHeight",
          label: "Line Height",
          type: "select",
          options: ["none", "1", "1.5", "2", "2.5"],
        },
        // text align
        {
          key: "textAlign",
          label: "Text Align",
          type: "select",
          options: ["none", "left", "center", "right"],
        },
        // text decoration
        {
          key: "textDecoration",
          label: "Text Decoration",
          type: "select",
          options: ["none", "underline", "overline", "line-through"],
        },
        // text transform
        {
          key: "textTransform",
          label: "Text Transform",
          type: "select",
          options: ["none", "uppercase", "lowercase", "capitalize"],
        },
        // letter spacing
        {
          key: "letterSpacing",
          label: "Letter Spacing",
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
        // padding
        if (section.settings.paddingTop) {
          el.style.paddingTop = `${section.settings.paddingTop}`;
        }
        if (section.settings.paddingRight) {
          el.style.paddingRight = `${section.settings.paddingRight}`;
        }
        if (section.settings.paddingBottom) {
          el.style.paddingBottom = `${section.settings.paddingBottom}`;
        }
        if (section.settings.paddingLeft) {
          el.style.paddingLeft = `${section.settings.paddingLeft}`;
        }
        // margin
        if (section.settings.marginTop) {
          el.style.marginTop = `${section.settings.marginTop}`;
        }
        if (section.settings.marginRight) {
          el.style.marginRight = `${section.settings.marginRight}`;
        }
        if (section.settings.marginBottom) {
          el.style.marginBottom = `${section.settings.marginBottom}`;
        }
        if (section.settings.marginLeft) {
          el.style.marginLeft = `${section.settings.marginLeft}`;
        }
        // border
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
        if (section.settings.right) {
          el.style.right = section.settings.right;
        }
        if (section.settings.left) {
          el.style.left = section.settings.left;
        }
        if (section.settings.bottom) {
          el.style.bottom = section.settings.bottom;
        }
        // font
        if (section.settings.font) {
          el.style.fontFamily = section.settings.font;
        }
        if (section.settings.fontSize) {
          el.style.fontSize = section.settings.fontSize;
        }
        // font weight
        if (section.settings.fontWeight) {
          el.style.fontWeight = section.settings.fontWeight;
        }
        // text decoration
        if (section.settings.textDecoration) {
          el.style.textDecoration = section.settings.textDecoration;
        }
        // text transform
        if (section.settings.textTransform) {
          el.style.textTransform = section.settings.textTransform;
        }
        // letter spacing
        if (section.settings.letterSpacing) {
          el.style.letterSpacing = section.settings.letterSpacing;
        }
        // line height
        if (section.settings.lineHeight) {
          el.style.lineHeight = section.settings.lineHeight;
        }
        // text alignment
        if (section.settings.textAlign) {
          el.style.textAlign = section.settings.textAlign;
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
