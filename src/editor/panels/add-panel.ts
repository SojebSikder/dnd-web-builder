import { sectionAllowsBlock } from "../../core/registry";
import type { BlockDefinition, SectionDefinition } from "../../core/types";
import { canAcceptBlock, findBlock } from "../state/operations";
import type { DragPayload, EditorHost } from "../types";
import { h, icon } from "../ui/dom";

/** "Add" tab: searchable, categorised sections and blocks; click to add, drag onto the canvas. */
export class AddPanel {
  readonly el: HTMLElement;
  private readonly host: EditorHost;
  private readonly list: HTMLElement;
  private readonly search: HTMLInputElement;
  private note: HTMLElement | null = null;

  constructor(host: EditorHost) {
    this.host = host;
    this.search = h("input", {
      class: "wbe-input wbe-search__input",
      attrs: {
        type: "search",
        placeholder: "Search sections and blocks",
        "aria-label": "Search sections and blocks",
      },
    });
    this.list = h("div", { class: "wbe-add__list" });
    this.el = h(
      "div",
      { class: "wbe-add" },
      h(
        "div",
        { class: "wbe-search" },
        h("span", { class: "wbe-search__icon", html: icon("search", 14) }),
        this.search,
      ),
      this.list,
    );

    const d = host.disposer;
    d.listen(this.search, "input", () => this.render());
    d.listen(this.list, "click", (e) => this.activate(e.target));
    d.listen(this.list, "keydown", (e) => {
      const k = (e as KeyboardEvent).key;
      if (k !== "Enter" && k !== " ") return;
      e.preventDefault();
      this.activate(e.target);
    });
    d.listen(this.list, "dragstart", (e) => this.onDragStart(e as DragEvent));
    d.listen(this.list, "dragend", () => {
      host.drag.payload = null;
    });
    this.render();
  }

  /** Target section for click-to-add blocks: the selected section, or the selected block's section. */
  private blockTarget(): { sectionId: string; index?: number } | null {
    const sel = this.host.selection();
    const doc = this.host.doc();
    if (!sel) return null;
    if (sel.kind === "section")
      return doc.sections[sel.id] ? { sectionId: sel.id } : null;
    const loc = findBlock(doc, sel.id);
    return loc ? { sectionId: loc.section.id, index: loc.index + 1 } : null;
  }

  render(): void {
    const q = this.search.value.trim().toLowerCase();
    const match = (d: SectionDefinition | BlockDefinition) =>
      !q ||
      `${d.label} ${d.type} ${d.category ?? ""}`.toLowerCase().includes(q);
    const sections = this.host.registry
      .sections(this.host.options.template)
      .filter(match);
    const blocks = this.host.registry.blocks().filter(match);
    this.list.textContent = "";

    const byCat = new Map<string, SectionDefinition[]>();
    for (const s of sections) {
      const c = s.category ?? "Other";
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c)!.push(s);
    }
    if (sections.length)
      this.list.append(
        h("div", { class: "wbe-add__heading", text: "Sections" }),
      );
    for (const [cat, defs] of byCat) {
      this.list.append(
        h(
          "div",
          { class: "wbe-add__group" },
          h("div", { class: "wbe-add__category", text: cat }),
          h(
            "div",
            { class: "wbe-add__grid" },
            defs.map((d) => this.item("section", d, false)),
          ),
        ),
      );
    }

    if (blocks.length) {
      this.note = h("p", { class: "wbe-add__note" });
      this.list.append(
        h("div", { class: "wbe-add__heading", text: "Blocks" }),
        this.note,
        h(
          "div",
          { class: "wbe-add__grid" },
          blocks.map((b) => this.item("block", b, true)),
        ),
      );
    } else {
      this.note = null;
    }
    if (!sections.length && !blocks.length) {
      this.list.append(
        h("p", { class: "wbe-muted wbe-pad", text: "No matches." }),
      );
    }
    this.update();
  }

  /**
   * Cheap refresh after document/selection changes: only the click-to-add state of block items
   * changes, so items are never rebuilt (keeps focus and avoids detaching nodes mid-interaction).
   */
  update(): void {
    const target = this.blockTarget();
    const section = target
      ? this.host.doc().sections[target.sectionId]
      : undefined;
    const targetDef = section
      ? this.host.registry.section(section.type)
      : undefined;
    if (this.note) {
      this.note.textContent = section
        ? `Click to add to “${targetDef?.label ?? section.type}”, or drag into any section that accepts blocks.`
        : "Drag into a section that accepts blocks, or select such a section and click.";
    }

    for (const el of this.list.querySelectorAll<HTMLElement>(
      '.wbe-add__item[data-kind="block"]',
    )) {
      const type = el.dataset.type ?? "";
      const ok =
        !!section &&
        sectionAllowsBlock(targetDef, type) &&
        canAcceptBlock(this.host.registry, section, type);

      const label = this.host.registry.block(type)?.label ?? type;
      el.classList.toggle("wbe-add__item--drag-only", !ok);
      if (ok) el.removeAttribute("aria-disabled");
      else el.setAttribute("aria-disabled", "true");
      el.title = ok ? `Add ${label}` : `Drag “${label}” into a section`;
    }
  }

  private item(
    kind: "section" | "block",
    def: SectionDefinition | BlockDefinition,
    clickDisabled: boolean,
  ): HTMLElement {
    return h(
      "div",
      {
        class: `wbe-add__item${clickDisabled ? " wbe-add__item--drag-only" : ""}`,
        attrs: {
          role: "button",
          tabindex: "0",
          draggable: "true",
          title: clickDisabled
            ? `Drag “${def.label}” into a section`
            : `Add ${def.label}`,
          "aria-label": `Add ${kind} ${def.label}`,
          "aria-disabled": clickDisabled ? "true" : null,
        },
        dataset: { kind, type: def.type },
      },
      h("span", {
        class: "wbe-add__icon",
        text: def.icon ?? "▪",
        attrs: { "aria-hidden": "true" },
      }),
      h("span", { class: "wbe-add__label", text: def.label }),
    );
  }

  private activate(eventTarget: EventTarget | null): void {
    const item =
      eventTarget instanceof Element
        ? eventTarget.closest<HTMLElement>(".wbe-add__item")
        : null;
    if (!item) return;
    const { kind, type } = item.dataset;
    if (!type) return;
    if (kind === "section") {
      this.host.editor.addSection(type);
      return;
    }
    const target = this.blockTarget();
    if (target) this.host.editor.addBlock(target.sectionId, type, target.index);
  }

  private onDragStart(e: DragEvent): void {
    const item = (e.target as Element).closest<HTMLElement>(".wbe-add__item");
    if (!item?.dataset.type) return;
    const payload: DragPayload =
      item.dataset.kind === "section"
        ? { kind: "new-section", type: item.dataset.type }
        : { kind: "new-block", type: item.dataset.type };
    this.host.drag.payload = payload;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData(
        "text/plain",
        `wbe:${payload.kind}:${item.dataset.type}`,
      );
    }
  }
}
