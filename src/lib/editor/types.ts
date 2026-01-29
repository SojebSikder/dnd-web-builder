import type { Editor } from "./editor";

export type Block = {
  id: string;
  type: string;
  settings: Record<string, any>;
};

export type Section = {
  id: string;
  type: string;
  settings: Record<string, any>;
  blocks?: Block[];
};

export type PageJSON = {
  order: string[];
  sections: Record<string, Section>;
};

export type BlockRenderer = (block: Block) => HTMLElement;
export type SectionRenderer = (
  section: Section,
  editor?: Editor,
) => HTMLElement;

//
export type SettingType = "text" | "number" | "boolean" | "select" | "color";

export type SettingSchema = {
  key: string; // The settings key in the block/section
  label: string; // Label to show in the panel
  type: SettingType; // Type of input
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number; // For number type
  step?: number; // For number type
};
