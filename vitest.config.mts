import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "tests/rules/**", "node_modules/**", ".git/**"],
    coverage: {
      reporter: ["text", "json-summary"],
      /*
       * Coverage is scoped to the layers unit tests are responsible for: the
       * domain and server logic, and the route handlers. React views are
       * exercised end to end by Playwright instead, so counting them here
       * would report a number that no unit test is trying to move.
       *
       * `all` includes files no test imported, so an untested module shows up
       * as a zero rather than disappearing from the report, and `skipFull`
       * keeps fully covered files visible.
       */
      all: true,
      skipFull: false,
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["**/*.test.ts", "src/lib/domain/types.ts"],
      thresholds: {
        statements: 88,
        branches: 76,
        functions: 95,
        lines: 88,
      },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
