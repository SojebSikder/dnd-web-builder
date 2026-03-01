import "./lib/style.css";
import { pageData } from "./pages/page-data";
import { Editor } from "./lib/editor/editor";
import CoreBlocksPlugin from "./lib/plugins/core-blocks.plugin";
import CoreSectionsPlugin from "./lib/plugins/core-sections.plugin";
import QuoteBlockPlugin from "./lib/plugins/quote-block.plugin";
import { registerPlugin } from "./lib/editor/plugin/registry";

const editor = new Editor(document.getElementById("app"));
// core plugins
registerPlugin(CoreSectionsPlugin);
registerPlugin(CoreBlocksPlugin);
registerPlugin(QuoteBlockPlugin);
// load page data
editor.load(pageData);
editor.initChooser();
