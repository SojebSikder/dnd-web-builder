import { findBlock } from "../state/operations";
import type { EditorHost, Selection } from "../types";
import { cssEscape, h, icon } from "../ui/dom";

/** Finds the canvas element of a section/block. */
export function nodeElement(
  page: HTMLElement,
  sel: Selection | null,
): HTMLElement | null {
  if (!sel) return null;
  const attr = sel.kind === "section" ? "data-section-id" : "data-block-id";
  return page.querySelector<HTMLElement>(`[${attr}="${cssEscape(sel.id)}"]`);
}

/**
 * Hover outline + label chip, selected outline + floating mini toolbar.
 * Lives inside the canvas stage (absolute positioning), so it scrolls with the content.
 */
export class Overlay {
  readonly el: HTMLElement;
  private hoverBox: HTMLElement;
  private hoverLabel: HTMLElement;
  private selectBox: HTMLElement;
  private bar: HTMLElement;
  private barLabel: HTMLElement;
  private handle: HTMLElement;
  private hover: Selection | null = null;
  private raf = 0;
  private readonly host: EditorHost;
  private readonly stage: HTMLElement;
  private readonly page: HTMLElement;

  constructor(host: EditorHost, stage: HTMLElement, page: HTMLElement) {
    this.host = host;
    this.stage = stage;
    this.page = page;
    this.hoverLabel = h("div", { class: "wbe-chip wbe-chip--hover" });
    this.hoverBox = h(
      "div",
      { class: "wbe-box wbe-box--hover", attrs: { hidden: true } },
      this.hoverLabel,
    );
    this.selectBox = h("div", {
      class: "wbe-box wbe-box--selected",
      attrs: { hidden: true },
    });
    this.handle = h("span", {
      class: "wbe-bar__handle",
      attrs: {
        draggable: "true",
        title: "Drag to move",
        "aria-label": "Drag to move",
        role: "button",
        tabindex: "-1",
      },
      html: icon("drag", 14),
    });
    this.barLabel = h("span", { class: "wbe-bar__label" });

    const btn = (action: string, iconName: string, label: string) =>
      h("button", {
        class: "wbe-bar__btn",
        attrs: {
          type: "button",
          "data-action": action,
          title: label,
          "aria-label": label,
        },
        html: icon(iconName, 14),
      });

    this.bar = h(
      "div",
      {
        class: "wbe-bar",
        attrs: {
          hidden: true,
          role: "toolbar",
          "aria-label": "Selection actions",
        },
      },
      h(
        "div",
        { class: "wbe-chip wbe-chip--selected" },
        this.handle,
        this.barLabel,
      ),
      h(
        "div",
        { class: "wbe-bar__actions" },
        btn("up", "up", "Move up"),
        btn("down", "down", "Move down"),
        btn("duplicate", "copy", "Duplicate"),
        btn("remove", "trash", "Delete"),
      ),
    );
    this.el = h(
      "div",
      { class: "wbe-overlay" },
      this.hoverBox,
      this.selectBox,
      this.bar,
    );

    const d = host.disposer;
    d.listen(this.bar, "click", (e) => this.onBarClick(e as MouseEvent));
    d.listen(this.handle, "dragstart", (e) =>
      this.onHandleDragStart(e as DragEvent),
    );
    d.listen(this.handle, "dragend", () =>
      this.page
        .querySelector(".wbe-drag-source")
        ?.classList.remove("wbe-drag-source"),
    );
  }

  /** Coordinates of `el` relative to the stage. */
  rectOf(el: Element): {
    top: number;
    left: number;
    width: number;
    height: number;
  } {
    const r = el.getBoundingClientRect();
    const s = this.stage.getBoundingClientRect();
    return {
      top: r.top - s.top,
      left: r.left - s.left,
      width: r.width,
      height: r.height,
    };
  }

  setHover(sel: Selection | null): void {
    if (sel?.id === this.hover?.id && sel?.kind === this.hover?.kind) return;
    this.hover = sel;
    this.schedule();
  }

  schedule(): void {
    if (this.raf) return;
    const raf =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (cb: () => void) => setTimeout(cb, 16);

    this.raf = raf(() => {
      this.raf = 0;
      this.update();
    }) as unknown as number;
  }

  cancel(): void {
    if (!this.raf) return;
    if (typeof cancelAnimationFrame === "function")
      cancelAnimationFrame(this.raf);
    else clearTimeout(this.raf);
    this.raf = 0;
  }

  update(): void {
    const sel = this.host.selection();
    const selEl = nodeElement(this.page, sel);
    const showHover =
      this.hover && !(sel && sel.id === this.hover.id)
        ? nodeElement(this.page, this.hover)
        : null;

    if (showHover && this.hover) {
      this.place(this.hoverBox, showHover);
      this.hoverLabel.textContent = this.host.labelOf(
        this.hover.kind,
        this.hover.id,
      );
      this.hoverBox.hidden = false;
      this.hoverBox.classList.toggle(
        "wbe-box--block",
        this.hover.kind === "block",
      );
    } else {
      this.hoverBox.hidden = true;
    }

    if (sel && selEl) {
      const r = this.place(this.selectBox, selEl);
      this.selectBox.hidden = false;
      this.selectBox.classList.toggle("wbe-box--block", sel.kind === "block");
      this.barLabel.textContent = this.host.labelOf(sel.kind, sel.id);
      this.bar.hidden = false;

      const above = r.top >= 30;
      Object.assign(this.bar.style, {
        top: `${above ? r.top - 28 : r.top + 2}px`,
        left: `${Math.max(0, r.left)}px`,
        width: `${Math.max(180, r.width)}px`,
      });

      this.bar.classList.toggle("wbe-bar--inside", !above);
      this.updateButtons(sel);
    } else {
      this.selectBox.hidden = true;
      this.bar.hidden = true;
    }
  }

  private place(box: HTMLElement, target: Element) {
    const r = this.rectOf(target);
    Object.assign(box.style, {
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    });
    return r;
  }

  private updateButtons(sel: Selection): void {
    const doc = this.host.doc();
    let index = -1;
    let count = 0;

    if (sel.kind === "section") {
      index = doc.order.indexOf(sel.id);
      count = doc.order.length;
    } else {
      const loc = findBlock(doc, sel.id);
      if (loc) {
        index = loc.index;
        count = loc.section.blocks.length;
      }
    }

    const up = this.bar.querySelector<HTMLButtonElement>('[data-action="up"]');
    const down = this.bar.querySelector<HTMLButtonElement>(
      '[data-action="down"]',
    );
    if (up) up.disabled = index <= 0;
    if (down) down.disabled = index === -1 || index >= count - 1;
  }

  private onBarClick(e: MouseEvent): void {
    const btn = (e.target as Element).closest<HTMLButtonElement>(
      "[data-action]",
    );
    const sel = this.host.selection();
    if (!btn || !sel || btn.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    moveOrAct(this.host, sel, btn.dataset.action ?? "");
  }

  private onHandleDragStart(e: DragEvent): void {
    const sel = this.host.selection();
    if (!sel) return;

    this.host.drag.payload =
      sel.kind === "section"
        ? { kind: "section", id: sel.id }
        : { kind: "block", id: sel.id };

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `wbe:${sel.kind}:${sel.id}`);
      const el = nodeElement(this.page, sel);

      if (el && typeof e.dataTransfer.setDragImage === "function") {
        el.classList.add("wbe-drag-source");
        const r = el.getBoundingClientRect();
        e.dataTransfer.setDragImage(
          el,
          Math.min(24, r.width / 2),
          Math.min(24, r.height / 2),
        );
      }
    }
  }
}

/** Shared action handler for the mini toolbar and the settings panel. */
export function moveOrAct(
  host: EditorHost,
  sel: Selection,
  action: string,
): void {
  const ed = host.editor;
  const doc = host.doc();

  switch (action) {
    case "up":
    case "down": {
      const delta = action === "up" ? -1 : 1;
      if (sel.kind === "section") {
        const i = doc.order.indexOf(sel.id);
        if (i !== -1) ed.moveSection(sel.id, i + delta);
      } else {
        const loc = findBlock(doc, sel.id);
        if (loc) ed.moveBlock(sel.id, loc.section.id, loc.index + delta);
      }
      break;
    }
    case "duplicate":
      ed.duplicate(sel.kind, sel.id);
      break;
    case "remove":
      ed.remove(sel.kind, sel.id);
      break;
    case "hide":
      if (sel.kind === "section") ed.toggleHidden(sel.id);
      break;
  }
}
