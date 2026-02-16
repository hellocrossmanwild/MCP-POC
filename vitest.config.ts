import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/tools.ts", "src/auth.ts", "src/db.ts"],
      exclude: ["src/seed.ts", "src/pdf.ts", "src/index.ts"],
      thresholds: {
        "src/tools.ts": {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
      reporter: ["text", "text-summary", "lcov"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
