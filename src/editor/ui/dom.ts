type Child = Node | string | number | false | null | undefined | Child[];

export interface HProps {
  class?: string;
  /** attributes (null/false skip, true → empty attribute) */
  attrs?: Record<string, string | number | boolean | null | undefined>;
  dataset?: Record<string, string>;
  style?: Partial<CSSStyleDeclaration> | Record<string, string>;
  on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void };
  text?: string;
  html?: string;
  [prop: string]: unknown;
}

const RESERVED = new Set(["class", "attrs", "dataset", "style", "on", "text", "html"]);

/** Tiny element factory: `h("button", { class: "x", on: { click } }, "Label")`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: HProps | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    if (props.class) el.className = props.class;
    if (props.attrs) {
      for (const [k, v] of Object.entries(props.attrs)) {
        if (v === null || v === undefined || v === false) continue;
        el.setAttribute(k, v === true ? "" : String(v));
      }
    }
    if (props.dataset) Object.assign(el.dataset, props.dataset);
    if (props.style) Object.assign(el.style, props.style);
    if (props.on) {
      for (const [type, fn] of Object.entries(props.on)) {
        if (fn) el.addEventListener(type, fn as EventListener);
      }
    }
    if (props.text !== undefined) el.textContent = props.text;
    if (props.html !== undefined) el.innerHTML = props.html;
    for (const [k, v] of Object.entries(props)) {
      if (RESERVED.has(k) || v === undefined) continue;
      (el as unknown as Record<string, unknown>)[k] = v;
    }
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
}

/** Parses an HTML string and returns its first element. */
export function htmlToElement(html: string): HTMLElement | null {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement | null;
}

let uid = 0;
export function uniqueId(prefix = "wbe"): string {
  uid += 1;
  return `${prefix}-${uid.toString(36)}`;
}

/** Inline SVG icons (stroke = currentColor). */
const ICON_PATHS: Record<string, string> = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  desktop: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  tablet: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>',
  mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/>',
  drag: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/>',
  italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L5 20"/>',
};

export function icon(name: keyof typeof ICON_PATHS | string, size = 16): string {
  const p = ICON_PATHS[name] ?? "";
  return `<svg class="wbe-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
}

/** Icon-only button with aria-label + title. */
export function iconButton(
  name: string,
  label: string,
  onClick?: (e: MouseEvent) => void,
  extraClass = "",
): HTMLButtonElement {
  return h("button", {
    class: `wbe-icon-btn ${extraClass}`.trim(),
    attrs: { type: "button", "aria-label": label, title: label },
    html: icon(name),
    on: onClick ? { click: onClick } : undefined,
  });
}

export function isTypingTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (t as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "range", "color", "reset"].includes(type);
  }
  return false;
}

/** `CSS.escape` with a fallback for environments that lack it. */
export function cssEscape(value: string): string {
  const g = globalThis as { CSS?: { escape?: (s: string) => string } };
  if (g.CSS && typeof g.CSS.escape === "function") return g.CSS.escape(value);
  return value.replace(/[^\w-]/g, (c) => `\\${c}`);
}
