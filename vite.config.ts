import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Emits the stand-alone CSS files (they are not imported by the JS entries). */
function emitCss(files: Record<string, string>): Plugin {
  return {
    name: "wb-emit-css",
    apply: "build",
    generateBundle() {
      for (const [fileName, src] of Object.entries(files)) {
        this.emitFile({ type: "asset", fileName, source: readFileSync(resolve(root, src), "utf8") });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      publicDir: false,
      plugins: [emitCss({ "style.css": "src/style.css", "editor.css": "src/editor.css" })],
      build: {
        outDir: "dist",
        emptyOutDir: true,
        target: "es2022",
        minify: false,
        sourcemap: true,
        lib: {
          entry: {
            index: resolve(root, "src/index.ts"),
            editor: resolve(root, "src/editor/index.ts"),
          },
          formats: ["es"],
          fileName: (_format, name) => `${name}.js`,
        },
        rollupOptions: {
          output: { chunkFileNames: "chunks/[name]-[hash].js" },
        },
      },
    };
  }

  // dev server + gh-pages demo build (base path only for the demo build)
  return {
    base: mode === "demo" ? "/dnd-web-builder/" : "/",
    build: { outDir: "dist-demo", emptyOutDir: true },
  };
});
