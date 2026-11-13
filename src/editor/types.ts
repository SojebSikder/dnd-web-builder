import type { Registry } from "../core/registry";
import type { DataRequest, PageDocument, SectionNode, Settings } from "../core/types";
import type { Editor } from "./editor";
import type { Disposer } from "./events";

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export interface ToolbarAction {
  id: string;
  label: string;
  primary?: boolean;
  onClick: (editor: Editor) => void;
}

export interface EditorPickers {
  image?: () => Promise<string | null>;
  /** returns a product handle */
  product?: () => Promise<string | null>;
  /** returns a collection handle */
  collection?: () => Promise<string | null>;
  /** returns a category handle */
  category?: () => Promise<string | null>;
}

export interface EditorOptions {
  /** editor mounts full-size inside this element */
  container: HTMLElement;
  registry: Registry;
  /** normalized via normalizeDocument */
  document?: unknown;
  /** e.g. "home" | "product" — filters sections by `templates` */
  template?: string;
  globals?: Record<string, unknown>;
  /** results are cached by key in the editor */
  dataProvider?: (requests: DataRequest[]) => Promise<Record<string, unknown>>;
  pickers?: EditorPickers;
  /** shown in the top bar */
  title?: string;
  /** e.g. Save / Back */
  toolbarActions?: ToolbarAction[];
  /** default 100 */
  historyLimit?: number;
}

export type EditorEvents = {
  change: { document: PageDocument; dirty: boolean };
  select: { kind: "section" | "block" | null; id: string | null };
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ready: {};
};

export type SelectionKind = "section" | "block";
export interface Selection {
  kind: SelectionKind;
  id: string;
}

export type DragPayload =
  | { kind: "new-section"; type: string }
  | { kind: "new-block"; type: string }
  | { kind: "section"; id: string }
  | { kind: "block"; id: string };

/** Shared, per-editor drag state (HTML5 DnD can't read dataTransfer during dragover). */
export class DragState {
  payload: DragPayload | null = null;
}

/** Internal surface the editor exposes to its sub-components. */
export interface EditorHost {
  readonly editor: Editor;
  readonly registry: Registry;
  readonly options: EditorOptions;
  readonly drag: DragState;
  readonly disposer: Disposer;
  doc(): PageDocument;
  selection(): Selection | null;
  device(): Device;
  /** editor-mode HTML of one section, using the data cache */
  renderSectionHtml(section: SectionNode, index: number): string;
  /** settings update coming from the settings panel (does not rebuild the panel) */
  updateFromPanel(kind: SelectionKind, id: string, patch: Settings, field: string): void;
  /** ends the current undo coalescing run (e.g. on input blur) */
  breakCoalescing(): void;
  /** human readable label for a node */
  labelOf(kind: SelectionKind, id: string): string;
  openJson(): void;
}
