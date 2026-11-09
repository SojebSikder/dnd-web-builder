import { advancedFields, styleFields } from "../../core/fields";
import { escapeAttr, escapeHtml, safeUrl, sanitizeHtml } from "../../core/html";
import type { FieldSchema, RenderContext } from "../../core/types";

/** content fields + shared style + advanced fields */
export function withCommon(fields: FieldSchema[]): FieldSchema[] {
  return [...fields, ...styleFields, ...advancedFields];
}

export function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

export function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const s = str(v);
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

export function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const isEditor = (ctx: RenderContext) => ctx.mode === "editor";

const PLACEHOLDER_SVG =
  '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L5 20"/></svg>';

/** Neutral media placeholder, only rendered in editor mode. */
export function mediaPlaceholder(ctx: RenderContext, label = "Add an image", className = ""): string {
  if (!isEditor(ctx)) return "";
  return `<div class="wb-media-placeholder ${escapeAttr(className)}" data-wb-editor-only="">${PLACEHOLDER_SVG}<span>${escapeHtml(label)}</span></div>`;
}

export interface ImgOptions {
  className?: string;
  eager?: boolean;
  style?: string;
  sizes?: string;
}

/** `<img>` with lazy loading (or eager + fetchpriority=high). Empty string when the URL is unsafe/empty. */
export function img(src: unknown, alt: unknown, opts: ImgOptions = {}): string {
  const url = safeUrl(src, "");
  if (!url || url === "#") return "";
  const loading = opts.eager ? ` fetchpriority="high" decoding="async"` : ` loading="lazy" decoding="async"`;
  return (
    `<img src="${escapeAttr(url)}" alt="${escapeAttr(str(alt))}"` +
    (opts.className ? ` class="${escapeAttr(opts.className)}"` : "") +
    (opts.style ? ` style="${escapeAttr(opts.style)}"` : "") +
    (opts.sizes ? ` sizes="${escapeAttr(opts.sizes)}"` : "") +
    `${loading}>`
  );
}

export type ButtonStyle = "primary" | "secondary" | "link";

export function button(label: unknown, link: unknown, style: ButtonStyle = "primary"): string {
  const text = str(label).trim();
  if (!text) return "";
  return `<a class="wb-button wb-button--${style}" href="${escapeAttr(safeUrl(link))}">${escapeHtml(text)}</a>`;
}

export function richText(html: unknown, className = "wb-richtext"): string {
  const clean = sanitizeHtml(str(html));
  if (!clean.trim()) return "";
  return `<div class="${escapeAttr(className)}">${clean}</div>`;
}

export function heading(text: unknown, tag: "h1" | "h2" | "h3" | "h4" = "h2", className = "wb-heading"): string {
  const t = str(text).trim();
  if (!t) return "";
  return `<${tag} class="${escapeAttr(className)}">${escapeHtml(t)}</${tag}>`;
}

export function paragraph(text: unknown, className = "wb-text"): string {
  const t = str(text).trim();
  if (!t) return "";
  return `<p class="${escapeAttr(className)}">${escapeHtml(t).replace(/\r?\n/g, "<br>")}</p>`;
}

const YT_RE =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{5,})/i;
const FILE_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[?#]|$)/i;

export type VideoSource =
  | { kind: "youtube"; id: string; embed: string }
  | { kind: "vimeo"; id: string; embed: string }
  | { kind: "file"; src: string }
  | null;

export function parseVideoUrl(url: unknown): VideoSource {
  const u = safeUrl(url, "");
  if (!u || u === "#") return null;
  const yt = YT_RE.exec(u);
  if (yt) return { kind: "youtube", id: yt[1]!, embed: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = VIMEO_RE.exec(u);
  if (vm) return { kind: "vimeo", id: vm[1]!, embed: `https://player.vimeo.com/video/${vm[1]}` };
  if (FILE_RE.test(u)) return { kind: "file", src: u };
  return null;
}

/** Responsive 16:9 video embed (YouTube / Vimeo / video file). */
export function videoEmbed(url: unknown, title: unknown, ctx: RenderContext): string {
  const v = parseVideoUrl(url);
  if (!v) return mediaPlaceholder(ctx, "Paste a YouTube, Vimeo or .mp4 URL", "wb-video__placeholder");
  const t = escapeAttr(str(title, "Video") || "Video");
  if (v.kind === "file") {
    return `<div class="wb-video"><video src="${escapeAttr(v.src)}" controls playsinline preload="metadata" title="${t}"></video></div>`;
  }
  return (
    `<div class="wb-video"><iframe src="${escapeAttr(v.embed)}" title="${t}" loading="lazy" ` +
    `allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen ` +
    `referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
  );
}

export const ASPECTS = ["auto", "1/1", "4/3", "3/2", "16/9", "3/4"] as const;
export type Aspect = (typeof ASPECTS)[number];
