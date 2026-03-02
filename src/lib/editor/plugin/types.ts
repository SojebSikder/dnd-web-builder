import type { BlockRenderer, SectionRenderer, SettingSchema } from "../types";

export type BlockPlugin = {
  type: string;
  renderer: BlockRenderer;
  defaultSettings?: Record<string, any>;
  settingsSchema?: SettingSchema[];
  // isDynamic: if true, the editor will not re-render this block on settings changes.
  // Useful for blocks with internal DOM state or interactive elements (like tables, charts, etc.),
  // where re-rendering would break event listeners or user input.
  isDynamic?: boolean;
};

export type SectionPlugin = {
  type: string;
  renderer: SectionRenderer;
  defaultSettings?: Record<string, any>;
  settingsSchema?: SettingSchema[];
};

export type EditorPlugin = {
  name: string;
  blocks?: BlockPlugin[];
  sections?: SectionPlugin[];
};
