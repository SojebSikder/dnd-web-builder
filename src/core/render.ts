import { resolveSettings, styleAttr } from "./fields";
import { classNames, escapeAttr, escapeHtml, safeClassList } from "./html";
import { sectionAcceptsBlocks, type Registry } from "./registry";
import type {
  BlockNode,
  DataRequest,
  PageDocument,
  RenderContext,
  RenderOptions,
  ResolvedSection,
  SectionNode,
} from "./types";

const LOG_PREFIX = "[dnd-web-builder]";

function typeClass(type: string): string {
  return String(type)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
}

/** Wraps custom CSS in a `<style>` scoped to the given attribute selector; `</style` is neutralised. */
export function scopedStyle(
  attr: "data-section-id" | "data-block-id",
  id: string,
  css: unknown,
): string {
  if (typeof css !== "string" || !css.trim()) return "";
  // CSS-escape anything that is not [A-Za-z0-9_-] (also keeps "<" out of the style element)
  const safeId = String(id).replace(
    /[^\w-]/g,
    (c) => `\\${c.codePointAt(0)!.toString(16)} `,
  );
  // "<" never needs to appear in CSS; escaping every one also neutralises "</style"
  const body = css.replace(/</g, "\\3c ").replace(/-->/g, "");
  return `<style>[${attr}="${safeId}"] { ${body} }</style>`;
}

function createContext(
  registry: Registry,
  opts: RenderOptions | undefined,
): RenderContext {
  const mode = opts?.mode === "editor" ? "editor" : "live";
  const ctx: RenderContext = {
    mode,
    data: opts?.data ?? {},
    globals: opts?.globals ?? {},
    registry,
    renderBlocks: (section: SectionNode) => renderBlocks(section, ctx),
  };
  if (typeof opts?.index === "number") ctx.sectionIndex = opts.index;
  return ctx;
}

function editorBox(kind: "unknown" | "error", text: string): string {
  return `<div class="wb-editor-placeholder wb-editor-placeholder--${kind}" role="note">${escapeHtml(text)}</div>`;
}

function renderBlock(block: BlockNode, ctx: RenderContext): string {
  const def = ctx.registry.block(block.type);
  const idAttr = escapeAttr(block.id);
  const typeAttr = escapeAttr(block.type);

  if (!def) {
    if (ctx.mode !== "editor") return "";
    return `<div class="wb-block wb-block--unknown" data-block-id="${idAttr}" data-block-type="${typeAttr}">${editorBox(
      "unknown",
      `Unknown block type "${block.type}"`,
    )}</div>`;
  }

  const settings = resolveSettings(
    def.schema,
    def.defaults,
    block.settings ?? {},
  );

  let inner: string;
  try {
    inner = def.render({ ...block, settings }, ctx);
    if (typeof inner !== "string") inner = "";
  } catch (err) {
    console.error(
      `${LOG_PREFIX} Error rendering block "${block.type}" (${block.id})`,
      err,
    );
    if (ctx.mode !== "editor") return "";
    inner = editorBox("error", `Error rendering block "${def.label}"`);
  }

  const style = styleAttr(settings);
  const cls = classNames(
    "wb-block",
    `wb-block--${typeClass(block.type)}`,
    safeClassList(settings.cssClass),
  );
  return (
    `<div class="${escapeAttr(cls)}" data-block-id="${idAttr}" data-block-type="${typeAttr}"` +
    (style ? ` style="${escapeAttr(style)}"` : "") +
    `>${scopedStyle("data-block-id", block.id, settings.customCss)}${inner}</div>`
  );
}

function renderBlocks(section: SectionNode, ctx: RenderContext): string {
  const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
  const inner = blocks.map((b) => renderBlock(b, ctx)).join("");
  const empty = blocks.length === 0;
  const hint =
    empty &&
    ctx.mode === "editor" &&
    sectionAcceptsBlocks(ctx.registry.section(section.type))
      ? `<div class="wb-blocks-empty" data-wb-editor-only="">Drop blocks here</div>`
      : "";
  return `<div class="${empty ? "wb-blocks wb-blocks--empty" : "wb-blocks"}" data-blocks-for="${escapeAttr(section.id)}">${inner}${hint}</div>`;
}

function renderSectionWithContext(
  section: SectionNode,
  ctx: RenderContext,
): string {
  if (!section || typeof section !== "object") return "";
  const editor = ctx.mode === "editor";
  if (section.hidden && !editor) return "";
  const idAttr = escapeAttr(section.id);
  const typeAttr = escapeAttr(section.type);
  const def = ctx.registry.section(section.type);

  if (!def) {
    if (!editor) return "";
    return `<section class="wb-section wb-section--unknown${section.hidden ? " wb-section--hidden" : ""}" data-section-id="${idAttr}" data-section-type="${typeAttr}">${editorBox(
      "unknown",
      `Unknown section type "${section.type}"`,
    )}</section>`;
  }

  const settings = resolveSettings(
    def.schema,
    def.defaults,
    section.settings ?? {},
  );

  const resolved: ResolvedSection = { ...section, settings };
  let inner: string;
  try {
    inner = def.render(resolved, ctx);
    if (typeof inner !== "string") inner = "";
  } catch (err) {
    console.error(
      `${LOG_PREFIX} Error rendering section "${section.type}" (${section.id})`,
      err,
    );
    if (!editor) return "";
    inner = editorBox("error", `Error rendering section "${def.label}"`);
  }

  const cls = classNames(
    "wb-section",
    `wb-section--${typeClass(section.type)}`,
    section.hidden && "wb-section--hidden",
    safeClassList(settings.cssClass),
  );
  const style = styleAttr(settings);
  return (
    `<section class="${escapeAttr(cls)}" data-section-id="${idAttr}" data-section-type="${typeAttr}"` +
    (style ? ` style="${escapeAttr(style)}"` : "") +
    `>${scopedStyle("data-section-id", section.id, settings.customCss)}${inner}</section>`
  );
}

/** Renders a single section (including its `<section>` wrapper). */
export function renderSection(
  section: SectionNode,
  registry: Registry,
  opts?: RenderOptions,
): string {
  return renderSectionWithContext(section, createContext(registry, opts));
}

/** Renders the whole document inside `<div class="wb-page">`. */
export function renderDocument(
  doc: PageDocument,
  registry: Registry,
  opts?: RenderOptions,
): string {
  const ctx = createContext(registry, { ...opts, index: undefined });
  let html = "";
  let index = 0;
  const order = Array.isArray(doc?.order) ? doc.order : [];

  for (const id of order) {
    const section = doc.sections?.[id];
    if (!section) continue;
    ctx.sectionIndex = index;
    const out = renderSectionWithContext(section, ctx);
    if (out) index++;
    html += out;
  }
  return `<div class="wb-page">${html}</div>`;
}

/** Data requests declared by one section (empty for hidden/unknown sections or on error). Additive to the spec. */
export function sectionDataRequests(
  section: SectionNode,
  registry: Registry,
  globals: Record<string, unknown> = {},
): DataRequest[] {
  if (!section || section.hidden) return [];
  const def = registry.section(section.type);
  if (!def || typeof def.data !== "function") return [];

  try {
    const settings = resolveSettings(
      def.schema,
      def.defaults,
      section.settings ?? {},
    );
    const reqs = def.data({ ...section, settings }, globals);
    return Array.isArray(reqs)
      ? reqs.filter(
          (r): r is DataRequest =>
            !!r && typeof r.key === "string" && typeof r.type === "string",
        )
      : [];
  } catch (err) {
    console.error(
      `${LOG_PREFIX} Error collecting data for section "${section.type}" (${section.id})`,
      err,
    );
    return [];
  }
}

/** All data requests of visible sections, de-duplicated by key (first occurrence wins). */
export function collectDataRequests(
  doc: PageDocument,
  registry: Registry,
  globals: Record<string, unknown> = {},
): DataRequest[] {
  const seen = new Set<string>();
  const out: DataRequest[] = [];

  for (const id of doc?.order ?? []) {
    const section = doc.sections?.[id];
    if (!section) continue;

    for (const req of sectionDataRequests(section, registry, globals)) {
      if (seen.has(req.key)) continue;
      seen.add(req.key);
      out.push({ key: req.key, type: req.type, params: req.params ?? {} });
    }
  }
  return out;
}
