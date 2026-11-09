import type { EditorHost } from "./types";
import { isTypingTarget } from "./ui/dom";

/**
 * Global shortcuts. Only active when focus is inside the editor (or on <body>) so a host page
 * with other inputs is not hijacked.
 */
export function bindKeyboard(host: EditorHost, root: HTMLElement): void {
  if (typeof document === "undefined") return;
  host.disposer.listen(document, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.defaultPrevented || e.isComposing) return;
    const target = e.target as Node | null;
    const inEditor = !target || target === document.body || target === document.documentElement || root.contains(target);
    if (!inEditor) return;
    // ignore while a modal is open
    if (document.querySelector(".wbe-modal")) return;
    const typing = isTypingTarget(e.target);
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    const ed = host.editor;

    if (mod && !e.altKey && (key === "z" || key === "y")) {
      if (typing) return; // let inputs use their native undo
      e.preventDefault();
      if (key === "y" || e.shiftKey) ed.redo();
      else ed.undo();
      return;
    }
    if (typing) return;
    const sel = host.selection();
    if (mod && key === "d") {
      if (!sel) return;
      e.preventDefault();
      ed.duplicate(sel.kind, sel.id);
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && !mod) {
      if (!sel) return;
      e.preventDefault();
      ed.remove(sel.kind, sel.id);
      return;
    }
    if (e.key === "Escape" && sel) {
      e.preventDefault();
      ed.select(null);
    }
  });
}
