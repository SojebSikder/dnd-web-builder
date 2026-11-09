import type { EditorHost } from "../types";
import { h, icon } from "../ui/dom";
import { AddPanel } from "./add-panel";
import { LayersPanel } from "./layers";

type Tab = "add" | "layers";

/** Left sidebar with the Add and Layers tabs. */
export class Sidebar {
  readonly el: HTMLElement;
  private readonly add: AddPanel;
  private readonly layers: LayersPanel;
  private readonly tabs: Record<Tab, HTMLButtonElement>;
  private tab: Tab = "add";

  constructor(host: EditorHost) {
    this.add = new AddPanel(host);
    this.layers = new LayersPanel(host);
    const tabBtn = (t: Tab, label: string, iconName: string) =>
      h("button", {
        class: "wbe-tab",
        attrs: { type: "button", role: "tab", id: `wbe-tab-${t}`, "aria-selected": "false" },
        html: `${icon(iconName, 14)}<span>${label}</span>`,
        on: { click: () => this.show(t) },
      });
    this.tabs = { add: tabBtn("add", "Add", "plus"), layers: tabBtn("layers", "Layers", "layers") };
    this.el = h(
      "aside",
      { class: "wbe-sidebar", attrs: { "aria-label": "Sections and layers" } },
      h("div", { class: "wbe-tabs", attrs: { role: "tablist" } }, this.tabs.add, this.tabs.layers),
      h("div", { class: "wbe-sidebar__panel", attrs: { role: "tabpanel" } }, this.add.el, this.layers.el),
    );
    this.show("add");
  }

  show(tab: Tab): void {
    this.tab = tab;
    for (const t of Object.keys(this.tabs) as Tab[]) {
      this.tabs[t].setAttribute("aria-selected", String(t === tab));
      this.tabs[t].classList.toggle("is-active", t === tab);
    }
    this.add.el.hidden = tab !== "add";
    this.layers.el.hidden = tab !== "layers";
    this.update();
  }

  /** Re-render the visible panel (cheap; called on document/selection changes). */
  update(): void {
    if (this.tab === "add") this.add.update();
    else this.layers.render();
  }
}
