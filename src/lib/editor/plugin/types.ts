import type { BlockRenderer, SectionRenderer } from "../types";

export type BlockPlugin = {
  type: string;
  renderer: BlockRenderer;
  defaultSettings?: Record<string, any>;
};

export type SectionPlugin = {
  type: string;
  renderer: SectionRenderer;
  defaultSettings?: Record<string, any>;
};

export type EditorPlugin = {
  name: string;
  blocks?: BlockPlugin[];
  sections?: SectionPlugin[];
};
