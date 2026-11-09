import type { SectionDefinition } from "../../../core/types";
import { heading, num, withCommon } from "../shared";

export const containerSection: SectionDefinition = {
  type: "container",
  label: "Container",
  icon: "▭",
  category: "Layout",
  allowedBlocks: "*",
  presetBlocks: [
    { type: "heading", settings: { text: "A flexible container", level: "h2" } },
    { type: "text", settings: { body: "<p>Add any blocks you like: text, images, buttons, quotes and more.</p>" } },
  ],
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "" },
    { key: "gap", label: "Space between blocks", type: "range", min: 0, max: 96, step: 4, unit: "px", default: 16 },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const gap = num(s.gap, 0, 96, 16);
    return (
      `<div class="wb-container wb-stack" style="--wb-gap: ${gap}px">` +
      heading(s.heading, "h2", "wb-heading wb-section-heading") +
      ctx.renderBlocks(section) +
      `</div>`
    );
  },
};
