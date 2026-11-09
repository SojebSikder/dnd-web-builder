import { blockDropAllowed, performDrop, type DropTarget } from "../canvas/dnd";
import type { DragPayload, EditorHost } from "../types";
import { h, icon } from "../ui/dom";

function preview(settings: Record<string, unknown>): string {
  for (const k of ["heading", "title", "text", "label"]) {
    const v = settings[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 40);
  }
  return "";
}

/** "Layers" tab: section → block tree. Click selects, drag reorders, eye toggles hidden. */
export class LayersPanel {
  readonly el: HTMLElement;
  private readonly host: EditorHost;
  private readonly tree: HTMLElement;
  private readonly indicator: HTMLElement;

  constructor(host: EditorHost) {
    this.host = host;
    this.tree = h("ul", { class: "wbe-layers__tree", attrs: { role: "tree", "aria-label": "Page layers" } });
    this.indicator = h("div", { class: "wbe-drop-indicator wbe-drop-indicator--layers", attrs: { hidden: true } });
    this.el = h("div", { class: "wbe-layers" }, this.tree, this.indicator);
    const d = host.disposer;
    d.listen(this.tree, "click", (e) => this.onClick(e as MouseEvent));
    d.listen(this.tree, "keydown", (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key !== "Enter" && ke.key !== " ") return;
      const row = ke.target instanceof HTMLElement && ke.target.classList.contains("wbe-layers__row") ? ke.target : null;
      if (!row) return;
      ke.preventDefault();
      host.editor.select(row.dataset.kind === "block" ? "block" : "section", row.dataset.id ?? null);
    });
    d.listen(this.tree, "dragstart", (e) => this.onDragStart(e as DragEvent));
    d.listen(this.tree, "dragend", () => {
      host.drag.payload = null;
      this.indicator.hidden = true;
    });
    d.listen(this.el, "dragover", (e) => this.onDragOver(e as DragEvent));
    d.listen(this.el, "dragleave", (e) => {
      const rel = (e as DragEvent).relatedTarget as Node | null;
      if (!rel || !this.el.contains(rel)) this.indicator.hidden = true;
    });
    d.listen(this.el, "drop", (e) => this.onDrop(e as DragEvent));
  }

  render(): void {
    const doc = this.host.doc();
    const sel = this.host.selection();
    const reg = this.host.registry;
    this.tree.textContent = "";
    if (!doc.order.length) {
      this.tree.append(h("li", { class: "wbe-muted wbe-pad", text: "No sections yet." }));
      return;
    }
    for (const id of doc.order) {
      const s = doc.sections[id];
      if (!s) continue;
      const def = reg.section(s.type);
      const selected = sel?.kind === "section" && sel.id === id;
      const eye = h("button", {
        class: "wbe-icon-btn wbe-icon-btn--sm wbe-layers__eye",
        attrs: {
          type: "button",
          "data-action": "toggle-hidden",
          title: s.hidden ? "Show section" : "Hide section",
          "aria-label": s.hidden ? "Show section" : "Hide section",
          "aria-pressed": String(!!s.hidden),
        },
        html: icon(s.hidden ? "eyeOff" : "eye", 14),
      });
      const row = h(
        "div",
        {
          class: `wbe-layers__row wbe-layers__row--section${selected ? " is-selected" : ""}${s.hidden ? " is-hidden" : ""}`,
          attrs: { draggable: "true", role: "treeitem", "aria-selected": String(selected), tabindex: "0" },
          dataset: { kind: "section", id },
        },
        h("span", { class: "wbe-layers__icon", text: def?.icon ?? "▭", attrs: { "aria-hidden": "true" } }),
        h("span", { class: "wbe-layers__label", text: def?.label ?? s.type }),
        h("span", { class: "wbe-layers__preview", text: preview(s.settings) }),
        eye,
      );
      const blocks = h(
        "ul",
        { class: "wbe-layers__blocks", attrs: { role: "group" }, dataset: { sectionId: id } },
        s.blocks.map((b) => {
          const bdef = reg.block(b.type);
          const bsel = sel?.kind === "block" && sel.id === b.id;
          return h(
            "li",
            null,
            h(
              "div",
              {
                class: `wbe-layers__row wbe-layers__row--block${bsel ? " is-selected" : ""}`,
                attrs: { draggable: "true", role: "treeitem", "aria-selected": String(bsel), tabindex: "0" },
                dataset: { kind: "block", id: b.id, sectionId: id },
              },
              h("span", { class: "wbe-layers__icon", text: bdef?.icon ?? "▪", attrs: { "aria-hidden": "true" } }),
              h("span", { class: "wbe-layers__label", text: bdef?.label ?? b.type }),
              h("span", { class: "wbe-layers__preview", text: preview(b.settings) }),
            ),
          );
        }),
      );
      this.tree.append(h("li", { class: "wbe-layers__section", dataset: { sectionId: id } }, row, blocks));
    }
  }

  private onClick(e: MouseEvent): void {
    const target = e.target as Element;
    const row = target.closest<HTMLElement>(".wbe-layers__row");
    if (!row) return;
    const { kind, id } = row.dataset;
    if (!id) return;
    if (target.closest('[data-action="toggle-hidden"]')) {
      e.stopPropagation();
      this.host.editor.toggleHidden(id);
      return;
    }
    this.host.editor.select(kind === "block" ? "block" : "section", id);
  }

  private onDragStart(e: DragEvent): void {
    const row = (e.target as Element).closest<HTMLElement>(".wbe-layers__row");
    if (!row?.dataset.id) return;
    const payload: DragPayload =
      row.dataset.kind === "block" ? { kind: "block", id: row.dataset.id } : { kind: "section", id: row.dataset.id };
    this.host.drag.payload = payload;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `wbe:${payload.kind}:${row.dataset.id}`);
    }
  }

  private rel(el: Element) {
    const r = el.getBoundingClientRect();
    const c = this.el.getBoundingClientRect();
    return { top: r.top - c.top + this.el.scrollTop, left: r.left - c.left, width: r.width, height: r.height };
  }

  private target(e: DragEvent): DropTarget | null {
    const p = this.host.drag.payload;
    if (!p) return null;
    const groups = Array.from(this.tree.querySelectorAll<HTMLElement>(":scope > .wbe-layers__section"));
    if (p.kind === "section" || p.kind === "new-section") {
      for (let i = 0; i < groups.length; i++) {
        const r = groups[i]!.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) {
          const rr = this.rel(groups[i]!);
          return { kind: "section", index: i, line: { top: rr.top - 1, left: rr.left, width: rr.width, height: 2 } };
        }
      }
      const last = groups[groups.length - 1];
      const rr = last ? this.rel(last) : { top: 0, left: 0, width: this.el.clientWidth, height: 0 };
      return { kind: "section", index: groups.length, line: { top: rr.top + rr.height - 1, left: rr.left, width: rr.width, height: 2 } };
    }
    // blocks: find the section group under the pointer
    const group =
      (e.target as Element).closest?.<HTMLElement>(".wbe-layers__section") ??
      groups.find((g) => {
        const r = g.getBoundingClientRect();
        return e.clientY >= r.top && e.clientY <= r.bottom;
      });
    const sectionId = group?.dataset.sectionId;
    if (!group || !sectionId || !blockDropAllowed(this.host, p, sectionId)) return null;
    const rows = Array.from(group.querySelectorAll<HTMLElement>(".wbe-layers__row--block"));
    const sectionRow = group.querySelector<HTMLElement>(".wbe-layers__row--section")!;
    let index = rows.length;
    let anchor: HTMLElement = rows[rows.length - 1] ?? sectionRow;
    let after = true;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) {
        index = i;
        anchor = rows[i]!;
        after = false;
        break;
      }
    }
    const rr = this.rel(anchor);
    const indent = 20;
    return {
      kind: "block",
      sectionId,
      index,
      line: { top: after ? rr.top + rr.height - 1 : rr.top - 1, left: rr.left + (anchor === sectionRow ? indent : 0), width: rr.width - (anchor === sectionRow ? indent : 0), height: 2 },
    };
  }

  private onDragOver(e: DragEvent): void {
    if (!this.host.drag.payload) return;
    const t = this.target(e);
    if (!t) {
      this.indicator.hidden = true;
      return;
    }
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = this.host.drag.payload.kind.startsWith("new-") ? "copy" : "move";
    Object.assign(this.indicator.style, {
      top: `${t.line.top}px`,
      left: `${t.line.left}px`,
      width: `${t.line.width}px`,
      height: `${t.line.height}px`,
    });
    this.indicator.hidden = false;
  }

  private onDrop(e: DragEvent): void {
    const p = this.host.drag.payload;
    if (!p) return;
    e.preventDefault();
    const t = this.target(e);
    this.indicator.hidden = true;
    this.host.drag.payload = null;
    if (t) performDrop(this.host, p, t);
  }
}
