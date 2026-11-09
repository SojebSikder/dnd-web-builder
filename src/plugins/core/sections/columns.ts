import type { SectionDefinition } from "../../../core/types";
import { heading, num, pick, withCommon } from "../shared";

export const columnsSection: SectionDefinition = {
  type: "columns",
  label: "Columns",
  icon: "▥",
  category: "Layout",
  allowedBlocks: "*",
  presetBlocks: [
    { type: "icon-text", settings: { icon: "🚚", title: "Free shipping", text: "On all orders over $50." } },
    { type: "icon-text", settings: { icon: "↩️", title: "Easy returns", text: "30 days to change your mind." } },
    { type: "icon-text", settings: { icon: "🔒", title: "Secure checkout", text: "Your data is always protected." } },
  ],
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "" },
    { key: "columns", label: "Columns", type: "select", default: "3", options: ["2", "3", "4"] },
    { key: "gap", label: "Gap", type: "range", min: 0, max: 96, step: 4, unit: "px", default: 24 },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const cols = pick(s.columns, ["2", "3", "4"] as const, "3");
    const gap = num(s.gap, 0, 96, 24);
    return (
      `<div class="wb-container">${heading(s.heading, "h2", "wb-heading wb-section-heading")}` +
      `<div class="wb-columns wb-columns--${cols}" style="--wb-columns: ${cols}; --wb-gap: ${gap}px">` +
      ctx.renderBlocks(section) +
      `</div></div>`
    );
  },
};
