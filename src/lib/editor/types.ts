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
export type SectionRenderer = (section: Section) => HTMLElement;
