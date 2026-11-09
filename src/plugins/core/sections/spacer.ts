import type { SectionDefinition } from "../../../core/types";
import { num, withCommon } from "../shared";

export const spacerSection: SectionDefinition = {
  type: "spacer",
  label: "Spacer",
  icon: "↕",
  category: "Layout",
  schema: withCommon([
    { key: "height", label: "Height", type: "range", min: 0, max: 320, step: 4, unit: "px", default: 48 },
  ]),
  render(section) {
    return `<div class="wb-spacer" style="height: ${num(section.settings.height, 0, 320, 48)}px" aria-hidden="true"></div>`;
  },
};
