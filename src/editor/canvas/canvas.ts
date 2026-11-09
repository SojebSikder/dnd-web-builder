import type { PageDocument } from "../../core/types";
import { DEVICE_WIDTHS, type EditorHost, type Selection } from "../types";
import { h, htmlToElement, icon } from "../ui/dom";
import { CanvasDnd } from "./dnd";
import { Overlay } from "./overlay";

/**
 * The canvas: renders sections as HTML strings into a `.wb-page`, patches only changed sections,
 * and handles selection/hover via event delegation.
 */
export class Canvas {
  readonly el: HTMLElement;
  readonly stage: HTMLElement;
  readonly page: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly overlay: Overlay;
  private readonly indicator: HTMLElement;
  private readonly dnd: CanvasDnd;
  private readonly host: EditorHost;
  private resizeObserver: ResizeObserver | null = null;

  constructor(host: EditorHost) {
    this.host = host;
    this.page = h("div", { class: "wb-page" });
    this.empty = h(
      "div",
      { class: "wbe-empty", attrs: { hidden: true } },
      h("div", { class: "wbe-empty__icon", html: icon("plus", 22) }),
      h("p", { class: "wbe-empty__title", text: "Start building your page" }),
      h("p", {
        class: "wbe-empty__text",
        text: "Drag a section here, or click one in the Add panel.",
      }),
    );
    this.indicator = h("div", {
      class: "wbe-drop-indicator",
      attrs: { hidden: true },
    });
    this.stage = h("div", { class: "wbe-stage" }, this.page, this.empty);
    this.overlay = new Overlay(host, this.stage, this.page);
    this.stage.append(this.overlay.el, this.indicator);
    this.el = h(
      "div",
      {
        class: "wbe-canvas",
        attrs: { role: "region", "aria-label": "Page canvas" },
      },
      this.stage,
    );
    const rectOf = (el: Element) => this.overlay.rectOf(el);
    this.dnd = new CanvasDnd(
      host,
      this.stage,
      this.page,
      this.indicator,
      rectOf,
    );

    const d = host.disposer;
    d.listen(this.page, "click", (e) => this.onClick(e as MouseEvent));
    // never navigate / submit from inside the canvas
    d.listen(this.page, "submit", (e) => e.preventDefault(), true);
    d.listen(this.page, "auxclick", (e) => e.preventDefault());
    d.listen(this.page, "mouseover", (e) =>
      this.overlay.setHover(this.hitTest(e.target)),
    );
    d.listen(this.page, "mouseleave", () => this.overlay.setHover(null));
    d.listen(this.page, "load", () => this.overlay.schedule(), true);
    d.listen(this.page, "toggle", () => this.overlay.schedule(), true);
    d.listen(this.el, "click", (e) => {
      if (e.target === this.el || e.target === this.stage)
        host.editor.select(null);
    });
    if (typeof window !== "undefined")
      d.listen(window, "resize", () => this.overlay.schedule());
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.overlay.schedule());
      this.resizeObserver.observe(this.page);
      this.resizeObserver.observe(this.el);
      d.add(() => this.resizeObserver?.disconnect());
    }
    d.add(() => this.overlay.cancel());
  }

  /** Full render (initial mount / setDocument). */
  renderAll(doc: PageDocument): void {
    this.page.textContent = "";
    this.patch(null, doc);
  }

  /**
   * Reconciles the canvas with `next`: re-renders sections whose node changed (or listed in `force`),
   * reorders/removes nodes, keeps untouched section DOM as-is.
   */
  patch(
    prev: PageDocument | null,
    next: PageDocument,
    force?: Iterable<string>,
  ): void {
    const forced = new Set(force ?? []);
    const existing = new Map<string, HTMLElement>();

    for (const child of Array.from(this.page.children) as HTMLElement[]) {
      const id = child.dataset.sectionId;
      if (id && !existing.has(id)) existing.set(id, child);
      else child.remove();
    }

    const nodes: HTMLElement[] = [];
    next.order.forEach((id, index) => {
      const section = next.sections[id];
      if (!section) return;
      const old = existing.get(id);
      const changed =
        !old || !prev || prev.sections[id] !== section || forced.has(id);
      let node = old;
      if (changed) {
        node = this.renderSectionEl(id, index, next) ?? undefined;
        if (old) old.remove();
      }
      if (node) {
        nodes.push(node);
        existing.delete(id);
      }
    });

    for (const leftover of existing.values()) leftover.remove();
    nodes.forEach((node, i) => {
      const at = this.page.children[i] ?? null;
      if (at !== node) this.page.insertBefore(node, at);
    });
    this.empty.hidden = next.order.length > 0;
    this.overlay.schedule();
  }

  /** Re-renders specific sections (e.g. when their data arrived). */
  rerender(ids: Iterable<string>): void {
    const doc = this.host.doc();
    this.patch(doc, doc, ids);
  }

  private renderSectionEl(
    id: string,
    index: number,
    doc: PageDocument,
  ): HTMLElement | null {
    const section = doc.sections[id];
    if (!section) return null;
    const html = this.host.renderSectionHtml(section, index);
    const el = htmlToElement(html);
    if (el && el.dataset.sectionId === id) return el;
    // defensive: always keep a selectable wrapper
    const fallback = h("section", { class: "wb-section wb-section--empty" });
    fallback.dataset.sectionId = id;
    fallback.dataset.sectionType = section.type;
    return fallback;
  }

  setDevice(): void {
    const device = this.host.device();
    this.stage.style.width = DEVICE_WIDTHS[device];
    this.el.dataset.device = device;
    this.overlay.schedule();
  }

  refreshOverlay(): void {
    this.overlay.schedule();
  }

  /** Scrolls the selected element into view if it is off-screen. */
  reveal(sel: Selection | null): void {
    if (!sel) return;

    const attr = sel.kind === "section" ? "data-section-id" : "data-block-id";
    const el = Array.from(
      this.page.querySelectorAll<HTMLElement>(`[${attr}]`),
    ).find((x) => x.getAttribute(attr) === sel.id);

    if (!el) return;

    const r = el.getBoundingClientRect();
    const c = this.el.getBoundingClientRect();

    if (r.bottom < c.top || r.top > c.bottom)
      el.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }

  hideIndicator(): void {
    this.dnd.hide();
  }

  private hitTest(target: EventTarget | null): Selection | null {
    if (!(target instanceof Element) || !this.page.contains(target))
      return null;
    const block = target.closest<HTMLElement>("[data-block-id]");

    if (block && this.page.contains(block))
      return { kind: "block", id: block.dataset.blockId ?? "" };

    const section = target.closest<HTMLElement>("[data-section-id]");

    if (section && this.page.contains(section))
      return { kind: "section", id: section.dataset.sectionId ?? "" };

    return null;
  }

  private onClick(e: MouseEvent): void {
    // links/buttons inside the canvas never navigate
    e.preventDefault();
    const hit = this.hitTest(e.target);
    this.host.editor.select(hit?.kind ?? null, hit?.id ?? null);
  }
}
