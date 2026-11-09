import type { BlockDefinition } from "../../../core/types";
import { heading, pick, withCommon } from "../shared";

export const headingBlock: BlockDefinition = {
  type: "heading",
  label: "Heading",
  icon: "H",
  category: "Text",
  schema: withCommon([
    { key: "text", label: "Text", type: "text", default: "Heading" },
    { key: "level", label: "Level", type: "select", default: "h2", options: ["h1", "h2", "h3", "h4"] },
  ]),
  render(block) {
    const level = pick(block.settings.level, ["h1", "h2", "h3", "h4"] as const, "h2");
    return heading(block.settings.text, level);
  },
};
