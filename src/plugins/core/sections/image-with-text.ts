import type { SectionDefinition } from "../../../core/types";
import { button, heading, img, mediaPlaceholder, pick, richText, str, withCommon } from "../shared";

export const imageWithTextSection: SectionDefinition = {
  type: "image-with-text",
  label: "Image with text",
  icon: "🖼️",
  category: "Media",
  schema: withCommon([
    { key: "image", label: "Image", type: "image" },
    { key: "imageAlt", label: "Image alt text", type: "text" },
    { key: "heading", label: "Heading", type: "text", default: "Image with text" },
    {
      key: "body",
      label: "Text",
      type: "richtext",
      default: "<p>Pair text with an image to focus on your chosen product, collection, or story.</p>",
    },
    { key: "buttonLabel", label: "Button label", type: "text", default: "" },
    { key: "buttonLink", label: "Button link", type: "url" },
    {
      key: "imagePosition",
      label: "Image position",
      type: "select",
      default: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const pos = pick(s.imagePosition, ["left", "right"] as const, "left");
    const media = img(s.image, s.imageAlt, { className: "wb-image-with-text__img" }) || mediaPlaceholder(ctx);
    return (
      `<div class="wb-container"><div class="wb-image-with-text wb-image-with-text--image-${pos}">` +
      `<div class="wb-image-with-text__media">${media}</div>` +
      `<div class="wb-image-with-text__content">` +
      heading(s.heading, "h2") +
      richText(s.body) +
      (str(s.buttonLabel) ? `<div class="wb-actions">${button(s.buttonLabel, s.buttonLink)}</div>` : "") +
      `</div></div></div>`
    );
  },
};
