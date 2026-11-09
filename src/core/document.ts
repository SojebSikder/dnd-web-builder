import type { BlockNode, PageDocument, SectionNode, Settings } from "./types";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
let idCounter = 0;

/** Short unique id, e.g. `s_k3j9x2`. Safe in Node and browsers. */
export function createId(prefix: "s" | "b"): string {
  let out = "";
  const c = (
    globalThis as {
      crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array };
    }
  ).crypto;
  if (c && typeof c.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(6));
    for (const b of bytes) out += ID_ALPHABET[b % ID_ALPHABET.length];
  } else {
    for (let i = 0; i < 6; i++)
      out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  // a rolling counter makes collisions within one process practically impossible
  idCounter = (idCounter + 1) % 1296;
  return `${prefix}_${out}${idCounter.toString(36).padStart(2, "0")}`;
}

export function createEmptyDocument(): PageDocument {
  return { version: 2, order: [], sections: {} };
}

export function isEmptyDocument(doc: PageDocument): boolean {
  return !doc || !Array.isArray(doc.order) || doc.order.length === 0;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep clone of JSON-like data; drops functions/undefined, breaks cycles. */
export function cloneJson<T>(value: T): T {
  const seen = new WeakSet<object>();
  const walk = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") {
      if (
        typeof v === "function" ||
        typeof v === "symbol" ||
        typeof v === "bigint"
      )
        return undefined;
      if (typeof v === "number" && !Number.isFinite(v)) return null;
      return v;
    }
    if (seen.has(v)) return undefined;
    seen.add(v);
    let out: unknown;
    if (Array.isArray(v)) {
      out = v.map((x) => {
        const r = walk(x);
        return r === undefined ? null : r;
      });
    } else {
      const o: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        const r = walk(x);
        if (r !== undefined) o[k] = r;
      }
      out = o;
    }
    seen.delete(v);
    return out;
  };
  return walk(value) as T;
}

function normalizeSettings(v: unknown): Settings {
  return isPlainObject(v) ? (cloneJson(v) as Settings) : {};
}

function validId(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= 128;
}

/**
 * Accepts v1 (old PageJSON without `version`, optional `blocks`), v2, null, {} or garbage
 * and always returns a valid, self-consistent v2 document (deep copy, never the input).
 *
 * - section ids are the keys of `sections` (a mismatching inner `id` is corrected)
 * - `order` is de-duplicated and filtered to existing sections; if `order` is missing,
 *   all sections are used in key order. Sections not referenced by a present `order` are dropped.
 * - invalid blocks are dropped; missing/duplicate block ids are regenerated.
 */
export function normalizeDocument(input: unknown): PageDocument {
  const doc = createEmptyDocument();
  if (!isPlainObject(input)) return doc;

  let rawSections: Record<string, unknown> = {};
  if (isPlainObject(input.sections)) {
    rawSections = input.sections;
  } else if (Array.isArray(input.sections)) {
    // tolerate an array of sections with ids
    for (const s of input.sections) {
      if (isPlainObject(s) && validId(s.id)) rawSections[s.id] = s;
    }
  }

  const order: string[] = Array.isArray(input.order)
    ? input.order.filter((x): x is string => typeof x === "string")
    : Object.keys(rawSections);

  const usedBlockIds = new Set<string>();

  for (const id of order) {
    if (doc.sections[id] || !validId(id)) continue;
    if (!Object.prototype.hasOwnProperty.call(rawSections, id)) continue;
    const raw = rawSections[id];
    if (!isPlainObject(raw) || typeof raw.type !== "string" || !raw.type)
      continue;

    const blocks: BlockNode[] = [];
    if (Array.isArray(raw.blocks)) {
      for (const b of raw.blocks) {
        if (!isPlainObject(b) || typeof b.type !== "string" || !b.type)
          continue;
        let bid = validId(b.id) ? b.id : createId("b");
        while (usedBlockIds.has(bid)) bid = createId("b");
        usedBlockIds.add(bid);
        blocks.push({
          id: bid,
          type: b.type,
          settings: normalizeSettings(b.settings),
        });
      }
    }

    const section: SectionNode = {
      id,
      type: raw.type,
      settings: normalizeSettings(raw.settings),
      blocks,
    };
    if (raw.hidden === true) section.hidden = true;
    doc.sections[id] = section;
    doc.order.push(id);
  }

  return doc;
}
