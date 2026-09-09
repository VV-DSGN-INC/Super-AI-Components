import { defineConfig } from "@playwright/test";

// See harnessDir() in baseline.ts: this file is CommonJS under Playwright, so
// __dirname is the one location the spec and teardown can trust.
process.env.HARNESS_DIR = __dirname;

// Separate from ../playwright.config.ts (the smoke gate): no webServer here,
// consumer-test.sh starts the scaffolded app and passes HARNESS_URL.
export default defineConfig({
  testDir: ".",
  testMatch: "harness.spec.ts",
  outputDir: "./out/test-results",
  globalTeardown: "./global-teardown.ts",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"]],
  use: {
    baseURL: process.env.HARNESS_URL ?? "http://127.0.0.1:4849",
    viewport: { width: 1280, height: 900 },
    // The Storybook gate's posture (apps/storybook/vitest.config.ts): every
    // animated component branches on this media feature, so axe measures a
    // settled frame instead of a mid-fade one.
    contextOptions: { reducedMotion: "reduce" },
  },
});
