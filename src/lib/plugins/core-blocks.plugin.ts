import { PluginHelper, type EditorPlugin } from "../editor";
import type { Block } from "../editor/types";

const CoreBlocksPlugin: EditorPlugin = {
  name: "Core Blocks",
  blocks: [
    {
      settingsSchema: [
        {
          key: "type",
          label: "Type",
          type: "select",
          options: ["label", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6"],
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "text",
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement(block.settings.type || "label");
        PluginHelper.applyBaseStyles(el, block.settings);
        el.textContent = block.settings.text || "Text block";
        return el;
      },
    },
    {
      settingsSchema: [
        {
          key: "tableData",
          label: "Table Data",
          type: "textarea",
          hidden: true,
        },
        ...PluginHelper.BaseStyleSchema,
      ],
      type: "table",
      isDynamic: true,
      renderer: (block: Block): HTMLElement => {
        const el = document.createElement("div"); // container
        PluginHelper.applyBaseStyles(el, block.settings);

        const table = document.createElement("table");
        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        // Store table data for persistence
        let tableData: string[][] = block.settings.tableData
          ? JSON.parse(JSON.stringify(block.settings.tableData))
          : [[""]];

        let columnCount = 1;

        // Helper to render the table from tableData
        const renderTable = () => {
          // Clear tbody
          tbody.innerHTML = "";
          tableData.forEach((row) => {
            const tr = document.createElement("tr");
            row.forEach((cellText) => {
              const td = document.createElement("td");
              td.contentEditable = "true";
              td.textContent = cellText;
              td.style.border = "1px solid #ccc";
              td.style.padding = "4px 8px";

              // Save changes to tableData on input
              td.addEventListener("input", () => {
                const rowIndex = Array.from(tbody.rows).indexOf(tr);
                const colIndex = Array.from(tr.cells).indexOf(td);
                tableData[rowIndex][colIndex] = td.textContent || "";
              });

              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
        };

        renderTable();

        // Buttons container
        const controls = document.createElement("div");
        controls.style.marginTop = "8px";
        controls.style.display = "flex";
        controls.style.gap = "8px";

        // Add Row
        const addRowBtn = document.createElement("button");
        addRowBtn.textContent = "Add Row";
        addRowBtn.addEventListener("click", () => {
          const newRow = Array(columnCount).fill("");
          tableData.push(newRow);
          renderTable();
        });

        // Remove Row
        const removeRowBtn = document.createElement("button");
        removeRowBtn.textContent = "Remove Row";
        removeRowBtn.addEventListener("click", () => {
          if (tableData.length > 1) {
            tableData.pop();
            renderTable();
          }
        });

        // Add Column
        const addColBtn = document.createElement("button");
        addColBtn.textContent = "Add Column";
        addColBtn.addEventListener("click", () => {
          columnCount++;
          tableData.forEach((row) => row.push(""));
          renderTable();
        });

        // Remove Column
        const removeColBtn = document.createElement("button");
        removeColBtn.textContent = "Remove Column";
        removeColBtn.addEventListener("click", () => {
          if (columnCount > 1) {
            columnCount--;
            tableData.forEach((row) => row.pop());
            renderTable();
          }
        });

        // Append buttons
        controls.append(addRowBtn, removeRowBtn, addColBtn, removeColBtn);

        el.appendChild(table);
        el.appendChild(controls);

        // Table styling
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        // Persist to block settings
        block.settings.tableData = tableData;

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
