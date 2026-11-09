// tsc emits dist/editor/index.d.ts; the "./editor" export expects dist/editor.d.ts next to dist/editor.js.
import { existsSync, writeFileSync } from "node:fs";

if (!existsSync("dist/editor/index.d.ts")) {
  console.error("postbuild: dist/editor/index.d.ts is missing (did tsc run?)");
  process.exit(1);
}
writeFileSync("dist/editor.d.ts", 'export * from "./editor/index";\n');
console.log("postbuild: wrote dist/editor.d.ts");
