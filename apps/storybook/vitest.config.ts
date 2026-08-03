import { defineConfig, mergeConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import viteConfig from "./vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Vitest ignores vite.config.ts entirely once a sibling vitest.config.ts
// exists, but the stories rely on vite.config.ts's `@/...` aliases (they
// re-export the 14 super-ai components/demos from apps/docs — see the
// storybook-aliases refactor). Without merging it in, every aliased story
// import 404s and every story file fails with "Failed to resolve import".
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: resolve(__dirname, ".storybook") })],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        // Vitest 4.x moved the browser provider from a string id to a factory
        // package (@vitest/browser-playwright) — the plan's `provider: "playwright"`
        // string throws "The `browser.provider` configuration was changed to
        // accept a factory instead of a string" against installed vitest@4.x.
        provider: playwright(),
        headless: true,
        instances: [{ browser: "chromium" }],
      },
      setupFiles: [".storybook/vitest.setup.ts"],
    },
  }),
);
