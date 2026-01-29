import type { BlockRenderer, SectionRenderer, SettingSchema } from "../types";

export type BlockPlugin = {
  type: string;
  renderer: BlockRenderer;
  defaultSettings?: Record<string, any>;
  settingsSchema?: SettingSchema[];
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
