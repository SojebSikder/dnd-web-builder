import type { BlockDefinition, Plugin, SectionDefinition } from "./types";

/** Holds section & block definitions. No global state: create as many registries as you like. */
export class Registry {
  private readonly sectionDefs = new Map<string, SectionDefinition>();
  private readonly blockDefs = new Map<string, BlockDefinition>();
  private readonly pluginNames: string[] = [];

  use(plugin: Plugin): this {
    if (!plugin || typeof plugin !== "object") return this;
    this.pluginNames.push(plugin.name);
    for (const def of plugin.sections ?? []) {
      if (
        !def ||
        typeof def.type !== "string" ||
        typeof def.render !== "function"
      ) {
        console.warn(
          `[dnd-web-builder] Invalid section definition in plugin "${plugin.name}"`,
        );
        continue;
      }
      if (this.sectionDefs.has(def.type)) {
        console.warn(
          `[dnd-web-builder] Section type "${def.type}" already registered; ignoring duplicate from "${plugin.name}"`,
        );
        continue;
      }
      this.sectionDefs.set(def.type, def);
    }

    for (const def of plugin.blocks ?? []) {
      if (
        !def ||
        typeof def.type !== "string" ||
        typeof def.render !== "function"
      ) {
        console.warn(
          `[dnd-web-builder] Invalid block definition in plugin "${plugin.name}"`,
        );
        continue;
      }
      if (this.blockDefs.has(def.type)) {
        console.warn(
          `[dnd-web-builder] Block type "${def.type}" already registered; ignoring duplicate from "${plugin.name}"`,
        );
        continue;
      }
      this.blockDefs.set(def.type, def);
    }
    return this;
  }

  section(type: string): SectionDefinition | undefined {
    return this.sectionDefs.get(type);
  }

  block(type: string): BlockDefinition | undefined {
    return this.blockDefs.get(type);
  }

  /** All sections, or only those usable in `template` (sections without `templates` are usable everywhere). */
  sections(template?: string): SectionDefinition[] {
    const all = [...this.sectionDefs.values()];
    if (template === undefined) return all;
    return all.filter(
      (d) =>
        !d.templates ||
        d.templates.length === 0 ||
        d.templates.includes(template),
    );
  }

  blocks(): BlockDefinition[] {
    return [...this.blockDefs.values()];
  }

  /** Names of plugins registered with `use()`, in order. */
  plugins(): string[] {
    return [...this.pluginNames];
  }
}

export function createRegistry(...plugins: Plugin[]): Registry {
  const r = new Registry();
  for (const p of plugins) r.use(p);
  return r;
}

/** Whether `section` (by definition) accepts a block of `blockType`. Ignores maxBlocks. */
export function sectionAllowsBlock(
  def: SectionDefinition | undefined,
  blockType: string,
): boolean {
  if (!def) return false;
  const allowed = def.allowedBlocks ?? "none";
  if (allowed === "none") return false;
  if (allowed === "*") return true;
  return Array.isArray(allowed) && allowed.includes(blockType);
}

/** Whether the section definition accepts any blocks at all. */
export function sectionAcceptsBlocks(
  def: SectionDefinition | undefined,
): boolean {
  if (!def) return false;
  const allowed = def.allowedBlocks ?? "none";
  return allowed === "*" || (Array.isArray(allowed) && allowed.length > 0);
}
