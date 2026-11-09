/**
 * Pure, immutable document operations. Every function returns a NEW document (structural sharing:
 * untouched sections keep their identity, which the canvas uses to re-render only what changed)
 * or the SAME document when nothing changed / the operation is invalid.
 *
 * Index semantics: `toIndex` is always the FINAL index of the moved/inserted item (after removal).
 */
import { cloneJson, createId } from "../../core/document";
import { sectionAllowsBlock, type Registry } from "../../core/registry";
import type { BlockNode, PageDocument, SectionNode, Settings } from "../../core/types";

export interface BlockLocation {
  section: SectionNode;
  block: BlockNode;
  index: number;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return max;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function withSection(doc: PageDocument, section: SectionNode): PageDocument {
  return { ...doc, sections: { ...doc.sections, [section.id]: section } };
}

export function findBlock(doc: PageDocument, blockId: string): BlockLocation | null {
  for (const sid of doc.order) {
    const section = doc.sections[sid];
    if (!section) continue;
    const index = section.blocks.findIndex((b) => b.id === blockId);
    if (index !== -1) return { section, block: section.blocks[index]!, index };
  }
  return null;
}

/** Converts an insertion point (0..n, counted with the dragged item still in place) into a final index. */
export function insertionToFinalIndex(fromIndex: number, insertionIndex: number): number {
  return fromIndex !== -1 && insertionIndex > fromIndex ? insertionIndex - 1 : insertionIndex;
}

/** Can `section` take one more block of `blockType` (allowedBlocks + maxBlocks)? */
export function canAcceptBlock(
  registry: Registry,
  section: SectionNode | undefined,
  blockType: string,
  movingBlockId?: string,
): boolean {
  if (!section) return false;
  const def = registry.section(section.type);
  if (!def || !sectionAllowsBlock(def, blockType)) return false;
  if (typeof def.maxBlocks === "number") {
    const count = section.blocks.filter((b) => b.id !== movingBlockId).length;
    if (count >= def.maxBlocks) return false;
  }
  return true;
}

export function createSectionNode(registry: Registry, type: string): SectionNode | null {
  const def = registry.section(type);
  if (!def) return null;
  const blocks: BlockNode[] = [];
  for (const preset of def.presetBlocks ?? []) {
    if (!registry.block(preset.type)) continue;
    if (typeof def.maxBlocks === "number" && blocks.length >= def.maxBlocks) break;
    blocks.push({ id: createId("b"), type: preset.type, settings: cloneJson(preset.settings ?? {}) });
  }
  return { id: createId("s"), type, settings: {}, blocks };
}

export function addSection(
  doc: PageDocument,
  registry: Registry,
  type: string,
  index?: number,
): { doc: PageDocument; id: string } | null {
  const section = createSectionNode(registry, type);
  if (!section) return null;
  return { doc: insertSection(doc, section, index), id: section.id };
}

export function insertSection(doc: PageDocument, section: SectionNode, index?: number): PageDocument {
  const order = doc.order.filter((id) => id !== section.id);
  const at = index === undefined ? order.length : clamp(index, 0, order.length);
  order.splice(at, 0, section.id);
  return { ...doc, order, sections: { ...doc.sections, [section.id]: section } };
}

export function addBlock(
  doc: PageDocument,
  registry: Registry,
  sectionId: string,
  type: string,
  index?: number,
): { doc: PageDocument; id: string } | null {
  const section = doc.sections[sectionId];
  if (!section || !registry.block(type) || !canAcceptBlock(registry, section, type)) return null;
  const block: BlockNode = { id: createId("b"), type, settings: {} };
  const blocks = [...section.blocks];
  const at = index === undefined ? blocks.length : clamp(index, 0, blocks.length);
  blocks.splice(at, 0, block);
  return { doc: withSection(doc, { ...section, blocks }), id: block.id };
}

export function moveSection(doc: PageDocument, id: string, toIndex: number): PageDocument {
  const from = doc.order.indexOf(id);
  if (from === -1) return doc;
  const order = doc.order.filter((x) => x !== id);
  const at = clamp(toIndex, 0, order.length);
  if (at === from) return doc;
  order.splice(at, 0, id);
  return { ...doc, order };
}

export function moveBlock(
  doc: PageDocument,
  blockId: string,
  toSectionId: string,
  toIndex: number,
  registry?: Registry,
): PageDocument {
  const loc = findBlock(doc, blockId);
  const target = doc.sections[toSectionId];
  if (!loc || !target) return doc;
  const same = loc.section.id === toSectionId;
  if (!same && registry && !canAcceptBlock(registry, target, loc.block.type, blockId)) return doc;
  if (same) {
    const blocks = loc.section.blocks.filter((b) => b.id !== blockId);
    const at = clamp(toIndex, 0, blocks.length);
    if (at === loc.index) return doc;
    blocks.splice(at, 0, loc.block);
    return withSection(doc, { ...loc.section, blocks });
  }
  const fromBlocks = loc.section.blocks.filter((b) => b.id !== blockId);
  const toBlocks = [...target.blocks];
  toBlocks.splice(clamp(toIndex, 0, toBlocks.length), 0, loc.block);
  return {
    ...doc,
    sections: {
      ...doc.sections,
      [loc.section.id]: { ...loc.section, blocks: fromBlocks },
      [target.id]: { ...target, blocks: toBlocks },
    },
  };
}

export function duplicateSection(doc: PageDocument, id: string): { doc: PageDocument; id: string } | null {
  const section = doc.sections[id];
  if (!section) return null;
  const copy: SectionNode = {
    ...cloneJson(section),
    id: createId("s"),
    blocks: section.blocks.map((b) => ({ id: createId("b"), type: b.type, settings: cloneJson(b.settings) })),
  };
  return { doc: insertSection(doc, copy, doc.order.indexOf(id) + 1), id: copy.id };
}

export function duplicateBlock(
  doc: PageDocument,
  blockId: string,
  registry?: Registry,
): { doc: PageDocument; id: string } | null {
  const loc = findBlock(doc, blockId);
  if (!loc) return null;
  if (registry && !canAcceptBlock(registry, loc.section, loc.block.type)) return null;
  const copy: BlockNode = { id: createId("b"), type: loc.block.type, settings: cloneJson(loc.block.settings) };
  const blocks = [...loc.section.blocks];
  blocks.splice(loc.index + 1, 0, copy);
  return { doc: withSection(doc, { ...loc.section, blocks }), id: copy.id };
}

export function removeSection(doc: PageDocument, id: string): PageDocument {
  if (!doc.sections[id]) return doc;
  const sections = { ...doc.sections };
  delete sections[id];
  return { ...doc, order: doc.order.filter((x) => x !== id), sections };
}

export function removeBlock(doc: PageDocument, blockId: string): PageDocument {
  const loc = findBlock(doc, blockId);
  if (!loc) return doc;
  return withSection(doc, { ...loc.section, blocks: loc.section.blocks.filter((b) => b.id !== blockId) });
}

export function toggleHidden(doc: PageDocument, sectionId: string): PageDocument {
  const section = doc.sections[sectionId];
  if (!section) return doc;
  const next: SectionNode = { ...section };
  if (section.hidden) delete next.hidden;
  else next.hidden = true;
  return withSection(doc, next);
}

function mergeSettings(settings: Settings, patch: Settings): Settings | null {
  let changed = false;
  const out: Settings = { ...settings };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) {
      if (k in out) {
        delete out[k];
        changed = true;
      }
    } else if (out[k] !== v) {
      out[k] = cloneJson(v);
      changed = true;
    }
  }
  return changed ? out : null;
}

/** Shallow-merges `patch` into the node settings; `undefined` values delete keys. */
export function updateSettings(
  doc: PageDocument,
  kind: "section" | "block",
  id: string,
  patch: Settings,
): PageDocument {
  if (kind === "section") {
    const section = doc.sections[id];
    if (!section) return doc;
    const settings = mergeSettings(section.settings, patch);
    return settings ? withSection(doc, { ...section, settings }) : doc;
  }
  const loc = findBlock(doc, id);
  if (!loc) return doc;
  const settings = mergeSettings(loc.block.settings, patch);
  if (!settings) return doc;
  const blocks = [...loc.section.blocks];
  blocks[loc.index] = { ...loc.block, settings };
  return withSection(doc, { ...loc.section, blocks });
}

/** Ids of sections whose node identity differs between two documents (added or changed). */
export function changedSectionIds(prev: PageDocument, next: PageDocument): string[] {
  return next.order.filter((id) => prev.sections[id] !== next.sections[id]);
}
