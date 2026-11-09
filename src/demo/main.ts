import "../style.css";
import "../editor.css";
import "./demo.css";
import { corePlugin, createRegistry, isEmptyDocument, normalizeDocument, renderDocument } from "../index";
import { createEditor } from "../editor/index";
import { demoDataProvider, demoPlugin } from "./demo-plugin";
import { homeDocument } from "./sample-docs";

const STORAGE_KEY = "dnd-web-builder:demo:v2";

function loadSaved(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const saved = loadSaved();
const initial = saved && !isEmptyDocument(normalizeDocument(saved)) ? saved : homeDocument;

const registry = createRegistry(corePlugin, demoPlugin);
const container = document.getElementById("app")!;

const editor = createEditor({
  container,
  registry,
  document: initial,
  title: "Home page",
  template: "home",
  dataProvider: demoDataProvider,
  pickers: {
    image: async () => window.prompt("Image URL", "https://picsum.photos/seed/picked/1200/800"),
  },
  toolbarActions: [
    {
      id: "reset",
      label: "Reset demo",
      onClick: (ed) => {
        localStorage.removeItem(STORAGE_KEY);
        ed.setDocument(homeDocument);
      },
    },
    {
      id: "preview",
      label: "Preview",
      onClick: async (ed) => {
        const doc = ed.getDocument();
        // live render, exactly like a server would do it
        const { collectDataRequests } = await import("../index");
        const data = await demoDataProvider(collectDataRequests(doc, registry));
        const html = renderDocument(doc, registry, { data });
        const w = window.open("", "_blank");
        if (!w) return;
        // dev injects <style> tags, the demo build uses <link> tags: carry over both
        const css = Array.from(document.querySelectorAll("style"))
          .map((s) => s.textContent)
          .join("\n");
        const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
          .map((l) => `<link rel="stylesheet" href="${l.href}">`)
          .join("");
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title>${links}<style>body{margin:0}${css}</style></head><body>${html}</body></html>`);
        w.document.close();
      },
    },
    {
      id: "save",
      label: "Save",
      primary: true,
      onClick: (ed) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ed.getDocument()));
        ed.markSaved();
      },
    },
  ],
});

editor.on("change", ({ dirty }) => {
  document.title = `${dirty ? "• " : ""}dnd-web-builder demo`;
});

// handy for poking around in devtools
(window as unknown as { editor: typeof editor }).editor = editor;
