import { safeUrl, sanitizeHtml } from "../../core/html";
import { h, icon } from "../ui/dom";

export interface RichTextOptions {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
}

type Cmd = "bold" | "italic" | "link" | "list";

/**
 * Minimal contenteditable rich text control (bold / italic / link / bullet list).
 * Output is always passed through `sanitizeHtml`.
 */
export function richTextControl(opts: RichTextOptions): HTMLElement {
  const editable = h("div", {
    class: "wbe-richtext__area",
    attrs: {
      id: opts.id,
      contenteditable: "true",
      role: "textbox",
      "aria-multiline": "true",
      "data-placeholder": opts.placeholder ?? "Write something…",
    },
    html: sanitizeHtml(opts.value),
  });

  const emit = () => {
    const clean = sanitizeHtml(editable.innerHTML);
    opts.onChange(clean.replace(/^(<p><\/p>|<br>)$/, ""));
  };

  const exec = (cmd: Cmd) => {
    editable.focus();
    // execCommand is deprecated but universally supported and keeps this control tiny
    const doc = editable.ownerDocument;
    if (cmd === "bold") doc.execCommand("bold");
    else if (cmd === "italic") doc.execCommand("italic");
    else if (cmd === "list") doc.execCommand("insertUnorderedList");
    else if (cmd === "link") {
      const raw = typeof window !== "undefined" ? window.prompt("Link URL (leave empty to remove)", "https://") : null;
      if (raw === null) return;
      const url = safeUrl(raw.trim(), "");
      if (!url || url === "https://") doc.execCommand("unlink");
      else doc.execCommand("createLink", false, url);
    }
    emit();
  };

  const btn = (cmd: Cmd, iconName: string, label: string) =>
    h("button", {
      class: "wbe-richtext__btn",
      attrs: { type: "button", title: label, "aria-label": label },
      html: icon(iconName, 14),
      on: {
        // keep the text selection inside the editable
        mousedown: (e) => e.preventDefault(),
        click: () => exec(cmd),
      },
    });

  editable.addEventListener("input", emit);
  editable.addEventListener("blur", () => opts.onBlur?.());
  editable.addEventListener("paste", (e) => {
    const data = e.clipboardData;
    if (!data) return;
    e.preventDefault();
    const html = data.getData("text/html");
    const text = data.getData("text/plain");
    const clean = html
      ? sanitizeHtml(html)
      : text
          .split(/\r?\n/)
          .map((l) => l.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;")))
          .join("<br>");
    editable.ownerDocument.execCommand("insertHTML", false, clean);
  });
  editable.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "b" || k === "i") {
      e.preventDefault();
      exec(k === "b" ? "bold" : "italic");
    } else if (k === "k") {
      e.preventDefault();
      exec("link");
    }
  });

  return h(
    "div",
    { class: "wbe-richtext" },
    h(
      "div",
      { class: "wbe-richtext__toolbar", attrs: { role: "toolbar", "aria-label": "Formatting" } },
      btn("bold", "bold", "Bold (Ctrl+B)"),
      btn("italic", "italic", "Italic (Ctrl+I)"),
      btn("link", "link", "Link (Ctrl+K)"),
      btn("list", "list", "Bullet list"),
    ),
    editable,
  );
}
