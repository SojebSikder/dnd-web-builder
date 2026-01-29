import type { BlockRenderer, SectionRenderer } from "../types";
import type { BlockPlugin, EditorPlugin, SectionPlugin } from "./types";

const blockPlugins: Record<string, BlockPlugin> = {};
const sectionPlugins: Record<string, SectionPlugin> = {};

export const blockRenderers: Record<string, BlockRenderer> = {};
export const sectionRenderers: Record<string, SectionRenderer> = {};

export function registerPlugin(plugin: EditorPlugin) {
  plugin.blocks?.forEach((block) => {
    if (blockRenderers[block.type]) {
      console.warn(`Block already registered: ${block.type}`);
      return;
    }

    // Save renderer
    blockRenderers[block.type] = block.renderer;
    // Save full plugin for settings lookup
    blockPlugins[block.type] = block;
  });

  plugin.sections?.forEach((section) => {
    if (sectionRenderers[section.type]) {
      console.warn(`Section already registered: ${section.type}`);
      return;
    }

    // Save renderer
    sectionRenderers[section.type] = section.renderer;
    // Save full plugin for settings lookup
    sectionPlugins[section.type] = section;
  });

  console.log(`Plugin loaded: ${plugin.name}`);
}

// Utility to get plugin by type (optional)
export function getBlockPlugin(type: string) {
  return blockPlugins[type];
}

export function getSectionPlugin(type: string) {
  return sectionPlugins[type];
}

export function getAllSectionPlugins(): SectionPlugin[] {
  return Object.values(sectionPlugins);
}

export function getAllBlockPlugins(): BlockPlugin[] {
  return Object.values(blockPlugins);
}
