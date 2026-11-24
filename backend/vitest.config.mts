import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Pred vsakim testom se odgovori lažne baze pobrišejo, da testi ne vplivajo drug na drugega
    mockReset: true,
    coverage: {
      provider: "v8",
      include: ["src/controllers/**", "src/middleware/**", "src/models/**"],
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
  },
});
