import type { BlockDefinition } from "../../../core/types";
import { button, pick, withCommon } from "../shared";

export const buttonBlock: BlockDefinition = {
  type: "button",
  label: "Button",
  icon: "⏺",
  category: "Actions",
  schema: withCommon([
    { key: "label", label: "Label", type: "text", default: "Learn more" },
    { key: "link", label: "Link", type: "url", default: "/" },
    {
      key: "style",
      label: "Style",
      type: "select",
      default: "primary",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Link", value: "link" },
      ],
    },
  ]),
  render(block) {
    const s = block.settings;
    return button(s.label, s.link, pick(s.style, ["primary", "secondary", "link"] as const, "primary"));
  },
};
