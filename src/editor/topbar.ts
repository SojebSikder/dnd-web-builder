import type { Device, EditorHost } from "./types";
import { h, icon, iconButton } from "./ui/dom";

const DEVICES: { id: Device; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
];

/** Top bar: title + dirty dot, device switcher, undo/redo, JSON, host toolbar actions. */
export class Topbar {
  readonly el: HTMLElement;
  private readonly host: EditorHost;
  private readonly undoBtn: HTMLButtonElement;
  private readonly redoBtn: HTMLButtonElement;
  private readonly dirtyDot: HTMLElement;
  private readonly deviceBtns: Map<Device, HTMLButtonElement> = new Map();

  constructor(host: EditorHost) {
    this.host = host;
    const ed = host.editor;
    this.undoBtn = iconButton("undo", "Undo (Ctrl+Z)", () => ed.undo());
    this.redoBtn = iconButton("redo", "Redo (Ctrl+Shift+Z)", () => ed.redo());
    this.dirtyDot = h("span", { class: "wbe-dirty", attrs: { title: "Unsaved changes", hidden: true } });
    const devices = h(
      "div",
      { class: "wbe-segmented", attrs: { role: "group", "aria-label": "Preview device" } },
      DEVICES.map((d) => {
        const b = h("button", {
          class: "wbe-segmented__btn",
          attrs: { type: "button", title: d.label, "aria-label": `${d.label} preview`, "aria-pressed": "false" },
          html: icon(d.id),
          on: { click: () => ed.setDevice(d.id) },
        });
        this.deviceBtns.set(d.id, b);
        return b;
      }),
    );
    const actions = (host.options.toolbarActions ?? []).map((a) =>
      h("button", {
        class: `wbe-btn${a.primary ? " wbe-btn--primary" : ""}`,
        attrs: { type: "button", "data-action-id": a.id },
        text: a.label,
        on: {
          click: () => {
            try {
              a.onClick(ed);
            } catch (err) {
              console.error(`[dnd-web-builder] toolbar action "${a.id}" failed`, err);
            }
          },
        },
      }),
    );
    this.el = h(
      "header",
      { class: "wbe-topbar" },
      h(
        "div",
        { class: "wbe-topbar__left" },
        h("span", { class: "wbe-topbar__title", text: host.options.title ?? "Page editor" }),
        this.dirtyDot,
      ),
      h("div", { class: "wbe-topbar__center" }, devices),
      h(
        "div",
        { class: "wbe-topbar__right" },
        h("div", { class: "wbe-row wbe-row--tight" }, this.undoBtn, this.redoBtn),
        iconButton("code", "View JSON", () => host.openJson()),
        h("span", { class: "wbe-divider-v", attrs: { "aria-hidden": "true" } }),
        actions,
      ),
    );
    this.update();
  }

  update(): void {
    const ed = this.host.editor;
    this.undoBtn.disabled = !ed.canUndo();
    this.redoBtn.disabled = !ed.canRedo();
    this.dirtyDot.hidden = !ed.dirty;
    const device = this.host.device();
    for (const [id, b] of this.deviceBtns) {
      b.setAttribute("aria-pressed", String(id === device));
      b.classList.toggle("is-active", id === device);
    }
  }
}
