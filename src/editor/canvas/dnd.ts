import {
  canAcceptBlock,
  findBlock,
  insertionToFinalIndex,
} from "../state/operations";
import type { DragPayload, EditorHost } from "../types";

export interface IndicatorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type DropTarget =
  | { kind: "section"; index: number; line: IndicatorRect }
  | { kind: "block"; sectionId: string; index: number; line: IndicatorRect };

/** Type of the block being dragged (new or existing). */
export function draggedBlockType(
  host: EditorHost,
  p: DragPayload,
): string | null {
  if (p.kind === "new-block") return p.type;
  if (p.kind === "block")
    return findBlock(host.doc(), p.id)?.block.type ?? null;
  return null;
}

/** Can the dragged block go into `sectionId`? */
export function blockDropAllowed(
  host: EditorHost,
  p: DragPayload,
  sectionId: string,
): boolean {
  const type = draggedBlockType(host, p);
  if (!type) return false;
  const doc = host.doc();
  const section = doc.sections[sectionId];
  if (!section) return false;
  if (p.kind === "block" && findBlock(doc, p.id)?.section.id === sectionId)
    return true;

  return canAcceptBlock(
    host.registry,
    section,
    type,
    p.kind === "block" ? p.id : undefined,
  );
}

/** Applies a drop through the public editor API. */
export function performDrop(
  host: EditorHost,
  p: DragPayload,
  t: DropTarget,
): void {
  const ed = host.editor;
  const doc = host.doc();
  if (t.kind === "section") {
    if (p.kind === "new-section") ed.addSection(p.type, t.index);
    else if (p.kind === "section")
      ed.moveSection(
        p.id,
        insertionToFinalIndex(doc.order.indexOf(p.id), t.index),
      );
    return;
  }

  if (p.kind === "new-block") {
    ed.addBlock(t.sectionId, p.type, t.index);
  } else if (p.kind === "block") {
    const loc = findBlock(doc, p.id);
    if (!loc) return;
    const from = loc.section.id === t.sectionId ? loc.index : -1;
    ed.moveBlock(p.id, t.sectionId, insertionToFinalIndex(from, t.index));
  }
}

type RectFn = (el: Element) => IndicatorRect;

/** Insertion point among vertically stacked elements. */
export function verticalInsertion(
  els: Element[],
  clientY: number,
  rectOf: RectFn,
  boundsLeft: number,
  boundsWidth: number,
) {
  for (let i = 0; i < els.length; i++) {
    const r = els[i]!.getBoundingClientRect();
    if (clientY < r.top + r.height / 2) {
      const rr = rectOf(els[i]!);
      return {
        index: i,
        line: {
          top: rr.top - 1,
          left: boundsLeft,
          width: boundsWidth,
          height: 2,
        },
      };
    }
  }

  const last = els[els.length - 1];
  const rr = last ? rectOf(last) : { top: 0, height: 0 };

  return {
    index: els.length,
    line: {
      top: rr.top + rr.height - 1,
      left: boundsLeft,
      width: boundsWidth,
      height: 2,
    },
  };
}

/** Insertion point among block elements, handling row/grid layouts (vertical indicator). */
export function blockInsertion(
  container: Element,
  children: Element[],
  e: { clientX: number; clientY: number },
  rectOf: RectFn,
) {
  const cr = rectOf(container);
  if (children.length === 0) {
    return {
      index: 0,
      line: { top: cr.top + 2, left: cr.left, width: cr.width, height: 2 },
    };
  }

  const rects = children.map((c) => c.getBoundingClientRect());
  const row =
    rects.length > 1 &&
    rects.some((r, i) => i > 0 && Math.abs(r.top - rects[0]!.top) < 4);
  let best = 0;
  let bestDist = Infinity;

  rects.forEach((r, i) => {
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });

  const r = rects[best]!;
  const rr = rectOf(children[best]!);
  if (row) {
    const before = e.clientX < r.left + r.width / 2;
    return {
      index: best + (before ? 0 : 1),
      line: {
        top: rr.top,
        left: before ? rr.left - 2 : rr.left + rr.width,
        width: 2,
        height: rr.height,
      },
    };
  }

  const before = e.clientY < r.top + r.height / 2;

  return {
    index: best + (before ? 0 : 1),
    line: {
      top: before ? rr.top - 1 : rr.top + rr.height - 1,
      left: rr.left,
      width: rr.width,
      height: 2,
    },
  };
}

/**
 * Canvas drop handling: sections between sections, blocks into sections that allow them.
 * Uses a single absolutely positioned indicator line inside the stage.
 */
export class CanvasDnd {
  private readonly host: EditorHost;
  private readonly page: HTMLElement;
  private readonly indicator: HTMLElement;
  private readonly rectOf: RectFn;

  constructor(
    host: EditorHost,
    stage: HTMLElement,
    page: HTMLElement,
    indicator: HTMLElement,
    rectOf: RectFn,
  ) {
    this.host = host;
    this.page = page;
    this.indicator = indicator;
    this.rectOf = rectOf;
    const d = host.disposer;
    d.listen(stage, "dragover", (e) => this.onDragOver(e as DragEvent));
    d.listen(stage, "drop", (e) => this.onDrop(e as DragEvent));
    d.listen(stage, "dragleave", (e) => {
      const rel = (e as DragEvent).relatedTarget as Node | null;
      if (!rel || !stage.contains(rel)) this.hide();
    });
    // native drags of content (images, links) inside the canvas would confuse our DnD
    d.listen(page, "dragstart", (e) => {
      if (!host.drag.payload) e.preventDefault();
    });
  }

  hide(): void {
    this.indicator.hidden = true;
  }

  private target(e: DragEvent): DropTarget | null {
    const p = this.host.drag.payload;
    if (!p) return null;
    if (p.kind === "new-section" || p.kind === "section") {
      const els = Array.from(
        this.page.querySelectorAll(":scope > [data-section-id]"),
      );
      const pr = this.rectOf(this.page);
      const ins = verticalInsertion(
        els,
        e.clientY,
        this.rectOf,
        pr.left,
        pr.width,
      );
      return { kind: "section", ...ins };
    }

    const t = e.target instanceof Element ? e.target : null;
    if (!t || !this.page.contains(t)) return null;
    let container = t.closest<HTMLElement>("[data-blocks-for]");
    if (!container) {
      const sectionEl = t.closest<HTMLElement>("[data-section-id]");
      container =
        sectionEl?.querySelector<HTMLElement>("[data-blocks-for]") ?? null;
    }
    if (!container) return null;
    const sectionId = container.dataset.blocksFor ?? "";
    if (!blockDropAllowed(this.host, p, sectionId)) return null;
    const children = Array.from(
      container.querySelectorAll(":scope > [data-block-id]"),
    );
    const ins = blockInsertion(container, children, e, this.rectOf);
    return { kind: "block", sectionId, ...ins };
  }

  private onDragOver(e: DragEvent): void {
    const p = this.host.drag.payload;
    if (!p) return;
    const t = this.target(e);
    if (!t) {
      this.hide();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }
    e.preventDefault();
    if (e.dataTransfer)
      e.dataTransfer.dropEffect = p.kind.startsWith("new-") ? "copy" : "move";

    Object.assign(this.indicator.style, {
      top: `${t.line.top}px`,
      left: `${t.line.left}px`,
      width: `${t.line.width}px`,
      height: `${t.line.height}px`,
    });
    this.indicator.classList.toggle(
      "wbe-drop-indicator--vertical",
      t.line.height > t.line.width,
    );
    this.indicator.hidden = false;
  }

  private onDrop(e: DragEvent): void {
    const p = this.host.drag.payload;
    if (!p) return;

    e.preventDefault();

    const t = this.target(e);
    this.hide();
    this.host.drag.payload = null;
    if (t) performDrop(this.host, p, t);
  }
}
