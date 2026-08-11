import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
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
        //
        // reducedMotion: "reduce" emulates `prefers-reduced-motion: reduce`
        // for every test in this project (Playwright's BrowserContext option,
        // threaded through unchanged by PlaywrightProviderOptions#contextOptions).
        // Without it, axe runs mid-animation on any story that animates on
        // mount (fade/blur-in text, typing, number tickers…) and intermittently
        // catches a transient sub-4.5:1 frame — e.g. TextAnimate's blurIn
        // preset at opacity:0 partway through its fade. Every animated
        // component in this repo already branches on this exact media
        // feature (see marketing.css's `@media (prefers-reduced-motion:
        // reduce)` blocks and the `matchMedia("(prefers-reduced-motion:
        // reduce)")` checks in text-animate.tsx, number-ticker.tsx,
        // typing-animation.tsx, terminal.tsx, ripple-button.tsx, confetti.tsx,
        // hero-video-dialog.tsx) so this setting makes them settle instantly
        // under test — fixing the flake class, not one story — and it's a
        // real accessibility posture: it's what a reduced-motion user's
        // browser actually renders.
        provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
        headless: true,
        instances: [{ browser: "chromium" }],
      },
      setupFiles: [".storybook/vitest.setup.ts"],
      // storybookTest() sets `test.include` itself (every file matched by the
      // `stories` glob in .storybook/main.ts) but reads `test.exclude` back
      // out of this config and merges it into its own — see
      // node_modules/@storybook/addon-vitest/dist/vitest-plugin/index.mjs,
      // the plugin's `config()` hook spreads
      // `nonMutableInputConfig.test?.exclude` into the exclude list it
      // returns. So excluding by story path here is the supported mechanism,
      // not a workaround.
      //
      // The gate covers what this repo owns and publishes (super-ai,
      // marketing), not vendored ports it merely displays. Full audit,
      // rationale, and the per-story rule breakdown:
      // docs/design-system/a11y-baseline.md — read that before touching this
      // list. It may only shrink, never grow.
      exclude: [
        ...configDefaults.exclude,
        // Vendored upstream, excluded by directory: shadcn/ui ports and AI
        // Elements ports. We didn't author these; fixing their axe
        // violations means diverging from upstream, a separate decision
        // nobody has made. 44 of 47 pre-existing a11y-violation files (plus
        // 2 of the 3 mount-crash files) live here.
        "**/stories/ui/**",
        "**/stories/ai-elements/**",
        // Legacy exempt, excluded by name: this repo's own components, but
        // real pre-existing bugs the wave's spec explicitly defers.
        "**/stories/ai-elements/Context.stories.tsx", // mount crash (also covered by the ai-elements/** exclude above)
        "**/stories/ui/DropdownMenu.stories.tsx", // mount crash (also covered by the ui/** exclude above)
        "**/stories/ui/MessageScroller.stories.tsx", // mount crash (also covered by the ui/** exclude above)
        // CostChip (A2) and EntityRow (A9) were here for color-contrast and are
        // now retrofitted and enforced — the list shrank, as it may.
        "**/stories/super-ai/PreviewTile.stories.tsx", // color-contrast x2 — contractExempt: true (A8)
      ],
    },
  }),
);
