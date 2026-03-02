import { PluginHelper, type EditorPlugin } from "../editor";
import type { Block } from "../editor/types";

const CoreBlocksPlugin: EditorPlugin = {
  name: "Core Blocks",
  blocks: [
    {
      settingsSchema: [
        {
          key: "text",
          label: "Text",
          type: "text",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "text",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("p");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.textContent = block.settings.text || "Text block";
        return el;
      },
    },
    {
      defaultSettings: {
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        controls: true,
      },
      settingsSchema: [
        {
          key: "src",
          label: "Source",
          type: "text",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "iframe",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("iframe");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.src =
          block.settings.src || "https://www.w3schools.com/html/mov_bbb.mp4";
        return el;
      },
    },
    {
      defaultSettings: {
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        controls: true,
      },
      settingsSchema: [
        {
          key: "src",
          label: "Source",
          type: "text",
        },
        {
          key: "controls",
          label: "Controls",
          type: "boolean",
        },
        {
          key: "autoplay",
          label: "Autoplay",
          type: "boolean",
        },
        {
          key: "muted",
          label: "Muted",
          type: "boolean",
        },
        {
          key: "loop",
          label: "Loop",
          type: "boolean",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "video",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("video");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.src =
          block.settings.src || "https://www.w3schools.com/html/mov_bbb.mp4";
        el.controls = block.settings.controls || true;
        el.autoplay = block.settings.autoplay || false;
        el.muted = block.settings.muted || false;
        el.loop = block.settings.loop || false;
        return el;
      },
    },
    {
      defaultSettings: {
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        controls: true,
      },
      settingsSchema: [
        {
          key: "src",
          label: "Source",
          type: "text",
        },
        {
          key: "controls",
          label: "Controls",
          type: "boolean",
        },
        {
          key: "autoplay",
          label: "Autoplay",
          type: "boolean",
        },
        {
          key: "muted",
          label: "Muted",
          type: "boolean",
        },
        {
          key: "loop",
          label: "Loop",
          type: "boolean",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "audio",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("audio");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.src =
          block.settings.src || "https://www.w3schools.com/html/mov_bbb.mp4";
        el.controls = block.settings.controls || true;
        el.autoplay = block.settings.autoplay || false;
        el.muted = block.settings.muted || false;
        el.loop = block.settings.loop || false;
        return el;
      },
    },
    {
      settingsSchema: [
        {
          key: "placeholder",
          label: "Placeholder",
          type: "text",
        },
        {
          key: "value",
          label: "Value",
          type: "text",
        },
        {
          key: "disabled",
          label: "Disabled",
          type: "boolean",
        },
        {
          key: "required",
          label: "Required",
          type: "boolean",
        },
        {
          key: "autofocus",
          label: "Autofocus",
          type: "boolean",
        },

        {
          key: "minlength",
          label: "Min Length",
          type: "number",
        },
        {
          key: "maxlength",
          label: "Max Length",
          type: "number",
        },
        {
          key: "cols",
          label: "Columns",
          type: "number",
        },
        {
          key: "rows",
          label: "Rows",
          type: "number",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "textarea",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("textarea");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.placeholder = block.settings.placeholder || "Write something...";
        el.value = block.settings.value || "";
        el.disabled = block.settings.disabled || false;
        el.required = block.settings.required || false;
        el.autofocus = block.settings.autofocus || false;
        el.minLength = block.settings.minlength || 0;
        el.maxLength = block.settings.maxlength || Infinity;
        el.cols = block.settings.cols || 30;
        el.rows = block.settings.rows || 10;
        return el;
      },
    },
    {
      settingsSchema: [
        {
          key: "placeholder",
          label: "Placeholder",
          type: "text",
        },
        {
          key: "value",
          label: "Value",
          type: "text",
        },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: [
            "text",
            "email",
            "password",
            "number",
            "date",
            "time",
            "datetime-local",
            "color",
            "range",
            "file",
            "search",
            "tel",
            "url",
            "week",
            "month",
            "hidden",
            "image",
            "submit",
            "reset",
            "button",
          ],
        },
        {
          key: "disabled",
          label: "Disabled",
          type: "boolean",
        },
        {
          key: "required",
          label: "Required",
          type: "boolean",
        },
        {
          key: "autofocus",
          label: "Autofocus",
          type: "boolean",
        },

        {
          key: "minlength",
          label: "Min Length",
          type: "number",
        },
        {
          key: "maxlength",
          label: "Max Length",
          type: "number",
        },

        ...PluginHelper.BaseStyleSchema,
      ],
      type: "input",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("input");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.placeholder = block.settings.placeholder || "Placeholder";
        el.value = block.settings.value || "";
        el.type = block.settings.type || "text";
        el.disabled = block.settings.disabled || false;
        el.required = block.settings.required || false;
        el.autofocus = block.settings.autofocus || false;
        el.minLength = block.settings.minlength || 0;
        el.maxLength = block.settings.maxlength || 50;
        return el;
      },
    },
    {
      defaultSettings: {
        src: "https://download.logo.wine/logo/Rust_(video_game)/Rust_(video_game)-Logo.wine.png",
      },
      settingsSchema: [
        {
          key: "src",
          label: "Source",
          type: "text",
        },
        {
          key: "alt",
          label: "Alternative Text",
          type: "text",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "image",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("img");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.src =
          block.settings.src ||
          "https://download.logo.wine/logo/Rust_(video_game)/Rust_(video_game)-Logo.wine.png";
        el.alt = block.settings.alt || "";
        el.style.maxWidth = "40%";
        return el;
      },
    },
    {
      type: "link",
      defaultSettings: {
        label: "Click me",
        href: "#",
      },
      settingsSchema: [
        {
          key: "label",
          label: "Text",
          type: "text",
        },
        {
          key: "href",
          label: "URL",
          type: "text",
        },
        {
          key: "target",
          label: "Target",
          type: "select",
          options: ["_self", "_blank", "_parent", "_top"],
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("a");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.textContent = block.settings.label ?? "Click me";
        el.href = block.settings.href || "#";
        el.target = block.settings.target || "_self";
        el.className = "link";
        return el;
      },
    },
    {
      type: "button",
      settingsSchema: [
        {
          key: "label",
          label: "Text",
          type: "text",
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      defaultSettings: {
        label: "Click me",
      },
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("button");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.textContent = block.settings.label || "Button";
        el.className = "btn";
        return el;
      },
    },
  ],
};

export default CoreBlocksPlugin;
