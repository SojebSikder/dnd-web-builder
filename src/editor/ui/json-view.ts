import { escapeHtml } from "../../core/html";
import { h } from "./dom";

/** Syntax highlighted JSON with line numbers (safe: input is escaped before highlighting). */
export function highlightJson(json: string): string {
  const escaped = escapeHtml(json).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const highlighted = escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "wbe-json-number";
      if (match.startsWith('"')) cls = /:$/.test(match) ? "wbe-json-key" : "wbe-json-string";
      else if (match === "true" || match === "false") cls = "wbe-json-boolean";
      else if (match === "null") cls = "wbe-json-null";
      return `<span class="${cls}">${match}</span>`;
    },
  );
  return highlighted
    .split("\n")
    .map((line, i) => `<span class="wbe-json-line"><span class="wbe-json-ln">${i + 1}</span>${line}</span>`)
    .join("\n");
}

export function jsonView(value: unknown): HTMLElement {
  const json = JSON.stringify(value, null, 2) ?? "null";
  return h("pre", { class: "wbe-json", html: highlightJson(json) });
}
