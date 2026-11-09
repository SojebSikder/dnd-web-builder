import type { BlockDefinition } from "../../../core/types";
import { videoEmbed, withCommon } from "../shared";

export const videoBlock: BlockDefinition = {
  type: "video",
  label: "Video",
  icon: "▶️",
  category: "Media",
  schema: withCommon([
    { key: "url", label: "Video URL", type: "url", help: "YouTube, Vimeo or a direct .mp4/.webm link" },
    { key: "title", label: "Accessible title", type: "text", default: "Video" },
  ]),
  render(block, ctx) {
    return videoEmbed(block.settings.url, block.settings.title, ctx);
  },
};
