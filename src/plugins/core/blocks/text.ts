import type { BlockDefinition } from "../../../core/types";
import { richText, withCommon } from "../shared";

export const textBlock: BlockDefinition = {
  type: "text",
  label: "Text",
  icon: "¶",
  category: "Text",
  schema: withCommon([
    { key: "body", label: "Text", type: "richtext", default: "<p>Write something great.</p>" },
  ]),
  render(block) {
    return richText(block.settings.body);
  },
};
