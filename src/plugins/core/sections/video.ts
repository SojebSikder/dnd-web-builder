import type { SectionDefinition } from "../../../core/types";
import { heading, videoEmbed, withCommon } from "../shared";

export const videoSection: SectionDefinition = {
  type: "video",
  label: "Video",
  icon: "▶️",
  category: "Media",
  schema: withCommon([
    { key: "heading", label: "Heading", type: "text", default: "" },
    {
      key: "url",
      label: "Video URL",
      type: "url",
      placeholder: "https://www.youtube.com/watch?v=…",
      help: "YouTube, Vimeo or a direct .mp4/.webm link",
    },
    { key: "title", label: "Accessible title", type: "text", default: "Video" },
  ]),
  render(section, ctx) {
    const s = section.settings;
    const embed = videoEmbed(s.url, s.title, ctx);
    if (!embed) return "";
    return `<div class="wb-container">${heading(s.heading, "h2", "wb-heading wb-section-heading")}${embed}</div>`;
  },
};
