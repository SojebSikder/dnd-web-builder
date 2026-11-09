/**
 * DOM-free HTML helpers. Everything here is safe to run in Node (SSR).
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
    return String(value);
  return "";
}

/** Escapes `& < > " '`. Non-primitive values become "". */
export function escapeHtml(value: unknown): string {
  return toText(value).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]!);
}

/** Escape for use inside a double- or single-quoted attribute value. */
export function escapeAttr(value: unknown): string {
  return toText(value).replace(/[&<>"'`]/g, (c) =>
    c === "`" ? "&#96;" : ESCAPE_MAP[c]!,
  );
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  colon: ":",
  tab: "\t",
  newline: "\n",
  sol: "/",
  lpar: "(",
  rpar: ")",
};

/** Decodes the entities that matter for security checks (numeric + a small named set). */
export function decodeEntities(s: string): string {
  return s.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);?/gi,
    (m, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
        try {
          return String.fromCodePoint(code);
        } catch {
          return "";
        }
      }
      const named = NAMED_ENTITIES[body.toLowerCase()];
      return named !== undefined ? named : m;
    },
  );
}

const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

/**
 * Returns the (trimmed) url when it is http(s), mailto, tel, relative or a #fragment;
 * otherwise `fallback` (default "#"). The result is NOT escaped — escape it for the context you use it in.
 */
export function safeUrl(url: unknown, fallback = "#"): string {
  if (typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  // Browsers ignore control chars and whitespace inside the scheme, so remove them before checking.
  // eslint-disable-next-line no-control-regex
  const compact = trimmed.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  if (compact.startsWith("\\") || compact.startsWith("/\\")) return fallback;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  if (scheme) {
    return SAFE_SCHEMES.has(scheme[1]!.toLowerCase()) ? trimmed : fallback;
  }
  // a ":" before any "/", "?" or "#" would be an (unrecognised) scheme
  const firstColon = compact.indexOf(":");
  if (firstColon !== -1) {
    const firstDelim = compact.search(/[/?#]/);
    if (firstDelim === -1 || firstColon < firstDelim) return fallback;
  }
  return trimmed;
}

/** `JSON.stringify` safe to embed in `<script type="application/json">`. */
export function jsonForScript(value: unknown): string {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch {
    json = undefined;
  }
  if (json === undefined) json = "null";
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function classNames(
  ...v: (string | false | null | undefined)[]
): string {
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .join(" ");
}

/** Splits newline separated lines on `|`, trimming each cell. empty lines are skipped. */
export function parseList(value: unknown): string[][] {
  let lines: string[] = [];
  if (typeof value === "string") lines = value.split(/\r?\n/);
  else if (Array.isArray(value))
    lines = value.filter((x): x is string => typeof x === "string");

  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split("|").map((c) => c.trim()));
}

/** Keeps only safe CSS class tokens (letters, digits, `-`, `_`). */
export function safeClassList(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .split(/\s+/)
    .filter((t) => /^-?[A-Za-z_][\w-]*$/.test(t) && t.length <= 64)
    .join(" ");
}

// ---------------------------------------------------------------------------
// sanitizeHtml - tokenizer based allowlist sanitizer (no DOM required)
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "span",
]);
const VOID_TAGS = new Set(["br"]);
/** Elements whose content is dropped together with the element. */
const DROP_CONTENT_TAGS = [
  "script",
  "style",
  "template",
  "noscript",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "textarea",
  "title",
  "xmp",
  "noembed",
  "noframes",
  "select",
  "head",
  "plaintext",
];
const DROP_CONTENT_RE = new RegExp(
  `<(${DROP_CONTENT_TAGS.join("|")})\\b[^>]*>[\\s\\S]*?(?:<\\/\\1\\s*>|$)`,
  "gi",
);
const ALLOWED_REL = new Set([
  "nofollow",
  "noopener",
  "noreferrer",
  "ugc",
  "sponsored",
]);
const TAG_RE =
  /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?|\s*\/)*)\s*\/?>/y;
const ATTR_RE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function escapeText(text: string): string {
  return text
    .replace(
      /&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g,
      "&amp;",
    )
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeAnchorAttrs(rawAttrs: string): string {
  let href = "";
  let target = "";
  const rel = new Set<string>();
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = ATTR_RE.exec(rawAttrs))) {
    const name = m[1]!.toLowerCase();
    const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");

    if (name === "href") href = safeUrl(value, "");
    else if (name === "target")
      target = value === "_blank" || value === "_self" ? value : "";
    else if (name === "rel")
      value
        .toLowerCase()
        .split(/\s+/)
        .forEach((r) => ALLOWED_REL.has(r) && rel.add(r));
  }

  if (target === "_blank") {
    rel.add("noopener");
    rel.add("noreferrer");
  }

  let out = "";
  if (href) out += ` href="${escapeAttr(href)}"`;
  if (target) out += ` target="${target}"`;
  if (rel.size) out += ` rel="${[...rel].join(" ")}"`;
  return out;
}

/**
 * Allowlist sanitizer: p br b strong i em u a(href,target,rel) ul ol li h2 h3 h4 blockquote span.
 * Other tags are removed (their text kept), script/style/etc. are removed with their content,
 * comments are stripped, all other attributes (incl. `on*`, `style`) are dropped and URLs are checked
 * with `safeUrl`. Output is always well-formed (unclosed tags closed, stray closers removed).
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== "string" || !html) return "";
  let src = html
    .replace(/\u0000/g, "")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/gi, "")
    .replace(/<![^>]*>?/g, "")
    .replace(/<\?[^>]*>?/g, "");
  // repeat until stable so nested tricks like <scr<script></script>ipt> can't reassemble
  let prev: string;
  do {
    prev = src;
    src = src.replace(DROP_CONTENT_RE, "");
  } while (src !== prev);

  let out = "";
  const stack: string[] = [];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt === -1) {
      out += escapeText(src.slice(i));
      break;
    }
    out += escapeText(src.slice(i, lt));
    TAG_RE.lastIndex = lt;
    const m = TAG_RE.exec(src);
    if (!m) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }

    i = lt + m[0].length;
    const closing = m[1] === "/";
    const name = m[2]!.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) continue;
    if (closing) {
      if (VOID_TAGS.has(name)) continue;
      const idx = stack.lastIndexOf(name);
      if (idx === -1) continue;
      while (stack.length > idx) out += `</${stack.pop()}>`;
      continue;
    }

    if (VOID_TAGS.has(name)) {
      out += `<${name}>`;
      continue;
    }
    out += name === "a" ? `<a${sanitizeAnchorAttrs(m[3] ?? "")}>` : `<${name}>`;
    stack.push(name);
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}
