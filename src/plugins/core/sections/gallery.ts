import { parseList } from "../../../core/html";
import type { SectionDefinition } from "../../../core/types";
import { heading, img, mediaPlaceholder, num, pick, withCommon } from "../shared";

export const gallerySection: SectionDefinition = {
  type: "gallery",
  label: "Gallery",
  icon: "▦",
  category: "Media",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Gallery" },
    {
      key: "images",
      label: "Images",
      type: "list",
      placeholder: "https://example.com/a.jpg | Alt text",
      help: "One image per line: URL | alt text",
      default: "",
    },
    { key: "columns", label: "Columns", type: "select", default: "3", options: ["2", "3", "4"] },
    { key: "gap", label: "Gap", type: "range", min: 0, max: 48, step: 2, unit: "px", default: 12 },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const cols = pick(s.columns, ["2", "3", "4"] as const, "3");
    const gap = num(s.gap, 0, 48, 12);
    const items = parseList(s.images)
      .map(([url, alt]) => img(url, alt ?? "", { className: "wb-gallery__img" }))
      .filter(Boolean)
      .map((i) => `<figure class="wb-gallery__item">${i}</figure>`)
      .join("");
    const body =
      items ||
      (ctx.mode === "editor"
        ? Array.from(
            { length: Number(cols) },
            () => `<figure class="wb-gallery__item">${mediaPlaceholder(ctx, "Add image URLs")}</figure>`,
          ).join("")
        : "");
    if (!body) return "";
    return (
      `<div class="wb-container">${heading(s.heading, "h2", "wb-heading wb-section-heading")}` +
      `<div class="wb-gallery" style="--wb-columns: ${cols}; --wb-gap: ${gap}px">${body}</div></div>`
    );
  },
};
