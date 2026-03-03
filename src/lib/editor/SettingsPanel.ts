// Not implemented yet
import type { SettingSchema } from "./types";
import type { BlockPlugin, SectionPlugin } from "./plugin";

export class SettingsPanel {
  public container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }

  showSettings(
    plugin: BlockPlugin | SectionPlugin,
    settings: Record<string, any>,
    onChange?: () => void,
  ): void {
    this.container.innerHTML = "";
    const panel = this.renderSettingsPanel(
      settings,
      plugin.settingsSchema,
      plugin.defaultSettings,
    );
    this.container.appendChild(panel);
  }

  clear(): void {
    this.container.innerHTML = "";
  }

  private renderSettingsPanel(
    settings: Record<string, any>,
    schema?: SettingSchema[],
    defaultSettings?: Record<string, any>,
  ): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "editor-settings-panel";

    if (!schema) return panel;

    schema.forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className = "editor-settings-field";

      const label = document.createElement("label");
      label.textContent = field.label;
      label.htmlFor = field.key;

      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

      if (field.hidden) {
        wrapper.style.display = "none";
      }

      switch (field.type) {
        case "text":
        case "number":
        case "color":
          input = document.createElement("input");
          input.type = field.type;
          if (field.type === "number") {
            if (field.min !== undefined) input.min = String(field.min);
            if (field.max !== undefined) input.max = String(field.max);
            if (field.step !== undefined) input.step = String(field.step);
          }
          input.value =
            settings[field.key] ?? defaultSettings?.[field.key] ?? "";
          break;

        case "textarea":
          input = document.createElement("textarea");
          input.value =
            settings[field.key] ?? defaultSettings?.[field.key] ?? "";
          break;

        case "boolean":
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(
            settings[field.key] ?? defaultSettings?.[field.key] ?? false,
          );
          break;

        case "select":
          input = document.createElement("select");
          field.options?.forEach((opt) => {
            const optionEl = document.createElement("option");
            optionEl.value = opt;
            optionEl.textContent = opt;
            if (settings[field.key] === opt) optionEl.selected = true;
            input.appendChild(optionEl);
          });
          break;
      }

      input.addEventListener("input", () => {
        let value: any;

        if (field.type === "boolean") {
          value = (input as HTMLInputElement).checked;
        } else if (field.type === "number") {
          value = Number(input.value);
        } else {
          value = input.value;
        }

        settings[field.key] = value;

        // Dispatch custom event for settings change
        const event = new CustomEvent("settingschange", {
          detail: { key: field.key, value },
        });
        panel.dispatchEvent(event);
      });

      input.id = field.key;

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      panel.appendChild(wrapper);
    });

    return panel;
  }
}
