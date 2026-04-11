import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/*.d.ts",
        "node_modules/**",
        "**/*.test.ts",
        "lib/spec/orchestrator-port.ts",
        "lib/llm/types.ts",
        "lib/roundtable/session-types.ts",
        "lib/skills/types.ts",
        "lib/spec/index.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/shims/server-only.ts"),
    },
  },
});
