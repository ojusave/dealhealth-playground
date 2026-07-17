import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "services/**/*.test.ts", "web/**/*.test.ts"],
    exclude: ["**/dist/**", "**/node_modules/**"],
  },
});
