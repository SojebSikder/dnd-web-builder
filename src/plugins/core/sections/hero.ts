import { escapeAttr } from "../../../core/html";
import type { SectionDefinition } from "../../../core/types";
import { button, heading, img, mediaPlaceholder, num, paragraph, pick, str, withCommon } from "../shared";

export const heroSection: SectionDefinition = {
  type: "hero",
  label: "Hero",
  icon: "🌄",
  category: "Banners",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "Welcome to our store" },
    { key: "subheading", label: "Subheading", type: "textarea", default: "Tell your visitors what makes you special." },
    { key: "image", label: "Background image", type: "image" },
    { key: "imageAlt", label: "Image alt text", type: "text", visibleIf: (s) => !!s.image },
    {
      key: "overlayOpacity",
      label: "Overlay opacity",
      type: "range",
      min: 0,
      max: 90,
      step: 5,
      unit: "%",
      default: 40,
      visibleIf: (s) => !!s.image,
    },
    { key: "buttonLabel", label: "Button label", type: "text", default: "Shop now" },
    { key: "buttonLink", label: "Button link", type: "url", default: "/" },
    {
      key: "height",
      label: "Height",
      type: "select",
      default: "medium",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
    {
      key: "alignment",
      label: "Content alignment",
      type: "select",
      default: "center",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const height = pick(s.height, ["small", "medium", "large"] as const, "medium");
    const align = pick(s.alignment, ["left", "center", "right"] as const, "center");
    // the first section of the page is above the fold: load its image eagerly with high priority
    const eager = (ctx.sectionIndex ?? 1) === 0;
    const media = img(s.image, s.imageAlt, { className: "wb-hero__media", eager, sizes: "100vw" });
    const opacity = num(s.overlayOpacity, 0, 90, 40) / 100;
    const hasMedia = !!media;
    return (
      `<div class="wb-hero wb-hero--${height} wb-hero--align-${align}${hasMedia ? " wb-hero--has-media" : ""}">` +
      (media || mediaPlaceholder(ctx, "Add a background image", "wb-hero__placeholder")) +
      (hasMedia ? `<div class="wb-hero__overlay" style="opacity: ${escapeAttr(opacity)}"></div>` : "") +
      `<div class="wb-container wb-hero__content">` +
      heading(s.heading, "h1", "wb-hero__heading") +
      paragraph(s.subheading, "wb-hero__subheading") +
      (str(s.buttonLabel) ? `<div class="wb-actions">${button(s.buttonLabel, s.buttonLink, "primary")}</div>` : "") +
      `</div></div>`
    );
  },
};
