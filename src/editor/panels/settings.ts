import { resolveSettings } from "../../core/fields";
import { sectionAcceptsBlocks, sectionAllowsBlock } from "../../core/registry";
import type { BlockDefinition, FieldGroup, FieldSchema, SectionDefinition, Settings } from "../../core/types";
import { moveOrAct } from "../canvas/overlay";
import { findBlock } from "../state/operations";
import type { EditorHost, Selection } from "../types";
import { h, icon, uniqueId } from "../ui/dom";
import { renderField } from "./fields";

const GROUP_LABELS: Record<FieldGroup, string> = { content: "Content", style: "Style", advanced: "Advanced" };
const GROUP_ORDER: FieldGroup[] = ["content", "style", "advanced"];

interface FieldRow {
  field: FieldSchema;
  row: HTMLElement;
}

/**
 * Right panel: settings of the current selection. It is rebuilt only when the selection changes or
 * the selected node is changed from outside the panel (undo/redo, API), so typing never loses focus.
 */
export class SettingsPanel {
  readonly el: HTMLElement;
  private readonly host: EditorHost;
  private shown: { sel: Selection; node: unknown } | null = null;
  private rows: FieldRow[] = [];
  private readonly collapsed: Record<FieldGroup, boolean> = { content: false, style: true, advanced: true };

  constructor(host: EditorHost) {
    this.host = host;
    this.el = h("aside", { class: "wbe-settings", attrs: { "aria-label": "Settings" } });
  }

  private nodeOf(sel: Selection | null) {
    if (!sel) return null;
    const doc = this.host.doc();
    if (sel.kind === "section") return doc.sections[sel.id] ?? null;
    return findBlock(doc, sel.id)?.block ?? null;
  }

  /** Rebuild if the selection or the selected node changed. */
  refresh(force = false): void {
    const sel = this.host.selection();
    const node = this.nodeOf(sel);
    if (
      !force &&
      this.shown &&
      sel &&
      this.shown.sel.kind === sel.kind &&
      this.shown.sel.id === sel.id &&
      this.shown.node === node
    ) {
      this.updateActions();
      return;
    }
    if (!force && !this.shown && !sel && this.el.childElementCount > 0) return;
    this.render(sel, node);
  }

  /** After an edit made in this panel: remember the new node identity and update visibility/actions. */
  syncAfterOwnEdit(): void {
    const sel = this.host.selection();
    const node = this.nodeOf(sel);
    if (this.shown && sel) this.shown.node = node;
    this.updateVisibility();
    this.updateActions();
  }

  private settingsOf(def: SectionDefinition | BlockDefinition | undefined, node: { settings: Settings }) {
    return resolveSettings(def?.schema ?? [], def?.defaults, node.settings);
  }

  private render(sel: Selection | null, node: ReturnType<SettingsPanel["nodeOf"]>): void {
    const scroll = this.el.scrollTop;
    const keepScroll = !!(this.shown && sel && this.shown.sel.id === sel.id);
    this.el.textContent = "";
    this.rows = [];
    if (!sel || !node) {
      this.shown = null;
      this.el.append(
        h(
          "div",
          { class: "wbe-hint" },
          h("div", { class: "wbe-hint__icon", html: icon("layers", 22) }),
          h("p", { class: "wbe-hint__title", text: "Nothing selected" }),
          h("p", { text: "Click a section or block on the canvas, or in Layers, to edit its settings." }),
        ),
      );
      return;
    }
    this.shown = { sel, node };
    const reg = this.host.registry;
    const def = sel.kind === "section" ? reg.section(node.type) : reg.block(node.type);

    this.el.append(this.header(sel, def?.label ?? node.type, def?.icon));
    this.el.append(this.actions(sel));

    if (!def) {
      this.el.append(h("p", { class: "wbe-muted wbe-pad", text: `Unknown ${sel.kind} type "${node.type}". It is not rendered on the live site.` }));
      return;
    }

    const settings = this.settingsOf(def, node);
    const groups = new Map<FieldGroup, FieldSchema[]>();
    for (const f of def.schema) {
      const g = f.group ?? "content";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    for (const g of GROUP_ORDER) {
      const fields = groups.get(g);
      if (!fields?.length) continue;
      this.el.append(this.group(g, fields, settings, sel));
    }

    if (sel.kind === "section" && sectionAcceptsBlocks(def as SectionDefinition)) {
      this.el.append(this.addBlockRow(sel.id, def as SectionDefinition));
    }
    this.updateVisibility();
    if (keepScroll) this.el.scrollTop = scroll;
  }

  private header(sel: Selection, label: string, iconText?: string): HTMLElement {
    return h(
      "div",
      { class: "wbe-settings__header" },
      h("span", { class: "wbe-type-icon", text: iconText ?? (sel.kind === "section" ? "▭" : "▪"), attrs: { "aria-hidden": "true" } }),
      h(
        "div",
        { class: "wbe-settings__titles" },
        h("div", { class: "wbe-settings__title", text: label }),
        h("div", { class: "wbe-settings__kind", text: sel.kind === "section" ? "Section" : "Block" }),
      ),
      h("button", {
        class: "wbe-icon-btn",
        attrs: { type: "button", title: "Close", "aria-label": "Close settings" },
        html: icon("close"),
        on: { click: () => this.host.editor.select(null) },
      }),
    );
  }

  private actions(sel: Selection): HTMLElement {
    const btn = (action: string, iconName: string, label: string, danger = false) =>
      h("button", {
        class: `wbe-icon-btn${danger ? " wbe-icon-btn--danger" : ""}`,
        attrs: { type: "button", title: label, "aria-label": label, "data-action": action },
        html: icon(iconName),
        on: { click: () => moveOrAct(this.host, sel, action) },
      });
    const bar = h(
      "div",
      { class: "wbe-settings__actions" },
      btn("up", "up", "Move up"),
      btn("down", "down", "Move down"),
      btn("duplicate", "copy", "Duplicate"),
      sel.kind === "section" ? btn("hide", "eye", "Hide / show") : null,
      h("span", { class: "wbe-spacer" }),
      btn("remove", "trash", "Delete", true),
    );
    queueMicrotask(() => this.updateActions());
    return bar;
  }

  private updateActions(): void {
    const sel = this.host.selection();
    if (!sel) return;
    const doc = this.host.doc();
    let index = -1;
    let count = 0;
    let hidden = false;
    if (sel.kind === "section") {
      index = doc.order.indexOf(sel.id);
      count = doc.order.length;
      hidden = !!doc.sections[sel.id]?.hidden;
    } else {
      const loc = findBlock(doc, sel.id);
      if (loc) {
        index = loc.index;
        count = loc.section.blocks.length;
      }
    }
    const q = (a: string) => this.el.querySelector<HTMLButtonElement>(`.wbe-settings__actions [data-action="${a}"]`);
    const up = q("up");
    const down = q("down");
    const hide = q("hide");
    if (up) up.disabled = index <= 0;
    if (down) down.disabled = index === -1 || index >= count - 1;
    if (hide) {
      hide.innerHTML = icon(hidden ? "eyeOff" : "eye");
      hide.setAttribute("aria-pressed", String(hidden));
      hide.title = hidden ? "Show section" : "Hide section";
    }
  }

  private group(g: FieldGroup, fields: FieldSchema[], settings: Settings, sel: Selection): HTMLElement {
    const bodyId = uniqueId("wbe-group");
    const body = h("div", { class: "wbe-group__body", attrs: { id: bodyId, hidden: this.collapsed[g] } });
    const toggle = h(
      "button",
      {
        class: "wbe-group__toggle",
        attrs: { type: "button", "aria-expanded": String(!this.collapsed[g]), "aria-controls": bodyId },
        on: {
          click: () => {
            this.collapsed[g] = !this.collapsed[g];
            body.hidden = this.collapsed[g];
            toggle.setAttribute("aria-expanded", String(!this.collapsed[g]));
          },
        },
      },
      h("span", { class: "wbe-group__chevron", html: icon("chevron", 14) }),
      GROUP_LABELS[g],
    );
    for (const field of fields) body.append(this.fieldRow(field, settings, sel));
    return h("section", { class: `wbe-group wbe-group--${g}` }, toggle, body);
  }

  private fieldRow(field: FieldSchema, settings: Settings, sel: Selection): HTMLElement {
    const id = uniqueId("wbe-field");
    const control = renderField({
      field,
      value: settings[field.key],
      id,
      pickers: this.host.options.pickers,
      onChange: (value) => this.host.updateFromPanel(sel.kind, sel.id, { [field.key]: value }, field.key),
      onCommitBoundary: () => this.host.breakCoalescing(),
    });
    const inline = field.type === "boolean";
    const labelEl =
      field.type === "richtext"
        ? h("span", { class: "wbe-label", text: field.label, attrs: { id: `${id}-label` } })
        : h("label", { class: "wbe-label", text: field.label, attrs: { for: id } });
    if (field.type === "richtext") control.querySelector(`#${id}`)?.setAttribute("aria-labelledby", `${id}-label`);
    const row = h(
      "div",
      { class: `wbe-field wbe-field--${field.type}${inline ? " wbe-field--inline" : ""}`, dataset: { key: field.key } },
      labelEl,
      control,
      field.help ? h("p", { class: "wbe-help", text: field.help }) : null,
    );
    this.rows.push({ field, row });
    return row;
  }

  private updateVisibility(): void {
    const sel = this.host.selection();
    const node = this.nodeOf(sel);
    if (!sel || !node) return;
    const reg = this.host.registry;
    const def = sel.kind === "section" ? reg.section(node.type) : reg.block(node.type);
    const settings = this.settingsOf(def, node);
    for (const { field, row } of this.rows) {
      if (!field.visibleIf) continue;
      let visible = true;
      try {
        visible = field.visibleIf(settings);
      } catch {
        visible = true;
      }
      row.hidden = !visible;
    }
  }

  private addBlockRow(sectionId: string, def: SectionDefinition): HTMLElement {
    const blocks = this.host.registry.blocks().filter((b) => sectionAllowsBlock(def, b.type));
    const selectEl = h(
      "select",
      { class: "wbe-input wbe-select", attrs: { "aria-label": "Add block" } },
      h("option", { attrs: { value: "" }, text: "Add block…" }),
      blocks.map((b) => h("option", { attrs: { value: b.type }, text: `${b.icon ? `${b.icon}  ` : ""}${b.label}` })),
    );
    selectEl.addEventListener("change", () => {
      const type = selectEl.value;
      selectEl.value = "";
      if (type && !this.host.editor.addBlock(sectionId, type)) {
        selectEl.setCustomValidity("This section cannot take more blocks");
        selectEl.reportValidity?.();
      }
    });
    return h(
      "div",
      { class: "wbe-pad wbe-add-block" },
      h("div", { class: "wbe-label", text: `Blocks${typeof def.maxBlocks === "number" ? ` (max ${def.maxBlocks})` : ""}` }),
      selectEl,
    );
  }
}
