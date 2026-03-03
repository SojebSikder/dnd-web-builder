// Not implemented yet
import { getBlockPlugin, getSectionPlugin } from "./plugin/registry";
import { StateManager } from "./StateManager";
import { SettingsPanel } from "./SettingsPanel";

export type SelectedItem =
  | { type: "section"; id: string }
  | { type: "block"; id: string }
  | null;

export class SelectionManager {
  private selected: SelectedItem = null;
  private listeners: Array<(selected: SelectedItem) => void> = [];
  private stateManager: StateManager;
  private settingsPanel: SettingsPanel;

  constructor(stateManager: StateManager, settingsPanel: SettingsPanel) {
    this.stateManager = stateManager;
    this.settingsPanel = settingsPanel;
  }

  getSelected(): SelectedItem {
    return this.selected;
  }

  selectSection(id: string): void {
    this.selected = { type: "section", id };
    this.notifyListeners();

    const section = this.stateManager.getSection(id);
    if (section) {
      const plugin = getSectionPlugin(section.type);
      if (plugin) {
        this.settingsPanel.showSettings(plugin, section.settings);
      }
    }
  }

  selectBlock(id: string): void {
    this.selected = { type: "block", id };
    this.notifyListeners();

    const result = this.stateManager.findSectionByBlockId(id);
    if (result) {
      const plugin = getBlockPlugin(result.block.type);
      if (plugin) {
        this.settingsPanel.showSettings(plugin, result.block.settings);
      }
    }
  }

  clearSelection(): void {
    this.selected = null;
    this.notifyListeners();
    this.settingsPanel.clear();
  }

  isSelected(id: string, type: "section" | "block"): boolean {
    return this.selected?.type === type && this.selected.id === id;
  }

  onSelectionChange(callback: (selected: SelectedItem) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.selected));
  }
}
