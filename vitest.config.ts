import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // core tests run in plain Node (proves SSR safety); editor tests opt into happy-dom per file
    environment: "node",
  },
});
