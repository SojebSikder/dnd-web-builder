import type { SectionDefinition } from "../../../core/types";
import { num, pick, withCommon } from "../shared";

export const dividerSection: SectionDefinition = {
  type: "divider",
  label: "Divider",
  icon: "—",
  category: "Layout",
  schema: withCommon([
    { key: "lineStyle", label: "Line style", type: "select", default: "solid", options: ["solid", "dashed", "dotted"] },
    { key: "thickness", label: "Thickness", type: "range", min: 1, max: 8, step: 1, unit: "px", default: 1 },
  ]),
  render(section) {
    const s = section.settings;
    const style = pick(s.lineStyle, ["solid", "dashed", "dotted"] as const, "solid");
    const t = num(s.thickness, 1, 8, 1);
    return `<div class="wb-container"><hr class="wb-divider" style="border-top-style: ${style}; border-top-width: ${t}px"></div>`;
  },
};
