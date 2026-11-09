/**
 * dnd-web-builder — core entry.
 * SSR safe: nothing in this module graph touches `document` / `window`.
 */
export type {
  Settings,
  BlockNode,
  SectionNode,
  PageDocument,
  FieldType,
  FieldOption,
  FieldGroup,
  FieldSchema,
  DataRequest,
  RenderMode,
  RenderContext,
  RenderOptions,
  BlockDefinition,
  SectionDefinition,
  ResolvedBlock,
  ResolvedSection,
  Plugin,
} from "./core/types";

export { createEmptyDocument, normalizeDocument, isEmptyDocument, createId, cloneJson } from "./core/document";
export {
  styleFields,
  advancedFields,
  styleAttr,
  resolveSettings,
  normalizeOptions,
  cssColor,
  cssLength,
} from "./core/fields";
export { Registry, createRegistry, sectionAllowsBlock, sectionAcceptsBlocks } from "./core/registry";
export {
  renderDocument,
  renderSection,
  collectDataRequests,
  sectionDataRequests,
  scopedStyle,
} from "./core/render";
export {
  escapeHtml,
  escapeAttr,
  safeUrl,
  sanitizeHtml,
  jsonForScript,
  classNames,
  parseList,
  safeClassList,
  decodeEntities,
} from "./core/html";
export { corePlugin } from "./plugins/core";
