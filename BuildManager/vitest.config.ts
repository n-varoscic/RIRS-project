import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

// Testi uporabljajo iste nastavitve kot Vite (npr. bližnjico @ za mapo src)
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // jsdom je lažen brskalnik, v katerem se komponente izrišejo brez pravega brskalnika
      environment: "jsdom",
      include: ["tests/**/*.test.tsx"],
      setupFiles: ["tests/setup.ts"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/components/ui/**", "src/main.tsx"],
        reporter: ["text", "html"],
        reportsDirectory: "coverage",
      },
    },
  }),
);
