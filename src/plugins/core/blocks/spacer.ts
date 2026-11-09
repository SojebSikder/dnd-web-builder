import type { BlockDefinition } from "../../../core/types";
import { num, withCommon } from "../shared";

export const spacerBlock: BlockDefinition = {
  type: "spacer",
  label: "Spacer",
  icon: "↕",
  category: "Layout",
  schema: withCommon([
    { key: "height", label: "Height", type: "range", min: 0, max: 200, step: 4, unit: "px", default: 24 },
  ]),
  render(block) {
    return `<div class="wb-spacer" style="height: ${num(block.settings.height, 0, 200, 24)}px" aria-hidden="true"></div>`;
  },
};
