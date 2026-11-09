import { escapeAttr, safeUrl } from "../../../core/html";
import type { BlockDefinition } from "../../../core/types";
import { ASPECTS, img, mediaPlaceholder, pick, str, withCommon } from "../shared";

export const imageBlock: BlockDefinition = {
  type: "image",
  label: "Image",
  icon: "🖼️",
  category: "Media",
  schema: withCommon([
    { key: "src", label: "Image", type: "image" },
    { key: "alt", label: "Alt text", type: "text", help: "Describe the image for screen readers." },
    { key: "link", label: "Link", type: "url" },
    {
      key: "aspect",
      label: "Aspect ratio",
      type: "select",
      default: "auto",
      options: [
        { label: "Original", value: "auto" },
        { label: "Square (1:1)", value: "1/1" },
        { label: "Landscape (4:3)", value: "4/3" },
        { label: "Landscape (3:2)", value: "3/2" },
        { label: "Wide (16:9)", value: "16/9" },
        { label: "Portrait (3:4)", value: "3/4" },
      ],
    },
  ]),
  render(block, ctx) {
    const s = block.settings;
    const aspect = pick(s.aspect, ASPECTS, "auto");
    const style = aspect === "auto" ? "" : `aspect-ratio: ${aspect}; object-fit: cover`;
    const image = img(s.src, s.alt, { className: "wb-image__img", style });
    if (!image) return mediaPlaceholder(ctx);
    const link = str(s.link).trim() ? safeUrl(s.link, "") : "";
    const inner = link ? `<a class="wb-image__link" href="${escapeAttr(link)}">${image}</a>` : image;
    return `<figure class="wb-image">${inner}</figure>`;
  },
};
