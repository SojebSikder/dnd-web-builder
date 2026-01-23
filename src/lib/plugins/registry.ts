import type { EditorPlugin } from "./types";
import type { BlockRenderer, SectionRenderer } from "../editor/types";

export const blockRenderers: Record<string, BlockRenderer> = {};
export const sectionRenderers: Record<string, SectionRenderer> = {};

export function registerPlugin(plugin: EditorPlugin) {
  plugin.blocks?.forEach((block) => {
    if (blockRenderers[block.type]) {
      console.warn(`Block already registered: ${block.type}`);
      return;
    }
    blockRenderers[block.type] = block.renderer;
  });

  plugin.sections?.forEach((section) => {
    if (sectionRenderers[section.type]) {
      console.warn(`Section already registered: ${section.type}`);
      return;
    }
    sectionRenderers[section.type] = section.renderer;
  });

  console.log(`Plugin loaded: ${plugin.name}`);
}
