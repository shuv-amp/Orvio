import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "tests/rules/**", "node_modules/**", ".git/**"],
    coverage: {
      reporter: ["text", "json-summary"],
      thresholds: { statements: 80, branches: 60, functions: 95, lines: 80 },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
