// Not implemented yet

export class DragManager {
  private editor: HTMLElement;
  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.setupGlobalDragHandlers();
  }

  private setupGlobalDragHandlers(): void {
    this.editor.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    this.editor.addEventListener("drop", (e) => {
      e.preventDefault();
    });
  }

  makeDraggable(el: HTMLElement): void {
    el.draggable = true;

    el.addEventListener("dragstart", (e) => {
      el.classList.add("dragging");
      e.dataTransfer?.setData(
        "text/plain",
        el.dataset.sectionId || el.dataset.blockId || "",
      );
      e.dataTransfer?.setData(
        "type",
        el.classList.contains("editor-section") ? "section" : "block",
      );
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
    });
  }

  setupSectionDropZone(
    container: HTMLElement,
    onReorder: (newOrder: string[]) => void,
  ): void {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();

      const dragging = container.querySelector(".dragging") as HTMLElement;
      if (!dragging || !dragging.classList.contains("editor-section")) return;

      const afterElement = this.getDragAfterElement(
        container,
        e.clientY,
        "editor-section",
      );

      if (!afterElement) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }
    });

    container.addEventListener("drop", () => {
      const sectionIds = Array.from(
        container.querySelectorAll(".editor-section"),
      ).map((el) => (el as HTMLElement).dataset.sectionId!);

      onReorder(sectionIds);
    });
  }

  setupBlockDropZone(wrapper: HTMLElement): void {
    wrapper.addEventListener("dragover", (e) => {
      e.preventDefault();

      const dragging = wrapper.querySelector(".dragging") as HTMLElement;
      if (!dragging) return;

      const afterElement = this.getDragAfterElement(
        wrapper,
        e.clientY,
        "editor-block",
      );

      if (afterElement == null) {
        wrapper.appendChild(dragging);
      } else {
        wrapper.insertBefore(dragging, afterElement);
      }
    });

    wrapper.addEventListener("drop", (e) => {
      e.preventDefault();

      const sectionEl = wrapper.closest("[data-section-id]") as HTMLElement;
      if (!sectionEl) return;

      const blockIds = Array.from(wrapper.children)
        .filter((el) => el.classList.contains("editor-block"))
        .map((el: HTMLElement) => el.dataset.blockId!);

      // Custom event for block reorder
      const event = new CustomEvent("blockreorder", {
        detail: { sectionId: sectionEl.dataset.sectionId, blockIds },
      });
      wrapper.dispatchEvent(event);
    });
  }

  getDragAfterElement(
    container: HTMLElement,
    y: number,
    selector = "editor-section",
  ): HTMLElement | null {
    const draggableElements = [
      ...container.querySelectorAll(`.${selector}:not(.dragging)`),
    ] as HTMLElement[];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null },
    ).element;
  }
}
