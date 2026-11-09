import type { Registry } from "./registry";

/** Arbitrary, JSON-serialisable settings of a section or block. */
export type Settings = Record<string, unknown>;

export interface BlockNode {
  id: string;
  type: string;
  settings: Settings;
}

export interface SectionNode {
  id: string;
  type: string;
  settings: Settings;
  blocks: BlockNode[];
  hidden?: boolean;
}

export interface PageDocument {
  version: 2;
  order: string[];
  sections: Record<string, SectionNode>;
}

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "range"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "url"
  | "product"
  | "collection"
  | "list";

export interface FieldOption {
  label: string;
  value: string;
}

export type FieldGroup = "content" | "style" | "advanced";

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  /** default "content"; the editor renders collapsible groups */
  group?: FieldGroup;
  default?: unknown;
  placeholder?: string;
  help?: string;
  /** select */
  options?: (FieldOption | string)[];
  /** number / range */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  visibleIf?: (settings: Settings) => boolean;
}

export interface DataRequest {
  key: string;
  type: string;
  params: Record<string, unknown>;
}

export type RenderMode = "editor" | "live";

export interface RenderContext {
  mode: RenderMode;
  /** resolved data, keyed by DataRequest.key */
  data: Record<string, unknown>;
  /** host globals, e.g. { store, product, collection, formatMoney } */
  globals: Record<string, unknown>;
  registry: Registry;
  /** render the blocks of a section (handles wrappers + data attributes). */
  renderBlocks(section: SectionNode): string;
  /**
   * Index of the section currently being rendered within the document's visible order
   * (set by `renderDocument`, or `RenderOptions.index` for `renderSection`). Additive to the spec.
   */
  sectionIndex?: number;
}

interface BaseDefinition {
  /** unique, kebab-case */
  type: string;
  label: string;
  /** single emoji or short text */
  icon?: string;
  /** chooser grouping, e.g. "Layout", "Text", "Commerce" */
  category?: string;
  schema: FieldSchema[];
  defaults?: Settings;
}

export type ResolvedBlock = BlockNode & { settings: Settings };
export type ResolvedSection = SectionNode & { settings: Settings };

export interface BlockDefinition extends BaseDefinition {
  render(block: ResolvedBlock, ctx: RenderContext): string;
}

export interface SectionDefinition extends BaseDefinition {
  /** default "none" */
  allowedBlocks?: string[] | "*" | "none";
  maxBlocks?: number;
  /** added when inserted from the chooser */
  presetBlocks?: { type: string; settings?: Settings }[];
  /** Restrict where the section can be used, e.g. ["product"]. Default: all templates. */
  templates?: string[];
  render(section: ResolvedSection, ctx: RenderContext): string;
  /** declare remote data this section needs; resolved by the host before rendering */
  data?(
    section: ResolvedSection,
    globals: Record<string, unknown>,
  ): DataRequest[];
}

export interface Plugin {
  name: string;
  sections?: SectionDefinition[];
  blocks?: BlockDefinition[];
}

export interface RenderOptions {
  /** default "live" */
  mode?: RenderMode;
  data?: Record<string, unknown>;
  globals?: Record<string, unknown>;
  /** Position of the section in the page (only used by `renderSection`). Additive to the spec. */
  index?: number;
}
