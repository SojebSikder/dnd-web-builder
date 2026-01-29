import { pageData } from "./example-data";
import { Editor } from "./lib/editor/editor";
import CoreBlocksPlugin from "./lib/plugins/core-blocks.plugin";
import CoreSectionsPlugin from "./lib/plugins/core-sections.plugin";
import QuoteBlockPlugin from "./lib/plugins/quote-block.plugin";
import { registerPlugin } from "./lib/editor/plugin/registry";

const toolbar = document.getElementById("toolbar");
const editorContainer = document.getElementById("editor");
const SettingsContainer = document.getElementById("settings-panel");

const editor = new Editor(toolbar, editorContainer, SettingsContainer);
// core plugins
registerPlugin(CoreSectionsPlugin);
registerPlugin(CoreBlocksPlugin);
registerPlugin(QuoteBlockPlugin);
// load page data
editor.load(pageData);
