import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// This workspace's lint script was `echo "no lint"` until 2026-09-07, so the
// 221 story files here — roughly 83,000 lines, and the only place several
// components are exercised at all — had never been linted. Root `pnpm lint`
// fanned out to this package and got the echo.
// Scope: what this workspace AUTHORS. The excluded trees are vendored or
// copied, and their canonical home is elsewhere:
//
//   components/ui/**          shadcn ports, upstream
//   components/ai-elements/** AI Elements ports, upstream
//   components/marketing/**   byte-identical copies of apps/docs/registry/
//                             marketing/**, already linted there with the Next
//                             plugin that makes their disable directives valid
//   shims/**                  next/image and next/link stand-ins that exist
//                             only so Next-flavoured imports resolve under Vite
//
// This is the same line the a11y gate draws in vitest.config.ts, for the same
// reason: fixing a vendored file's findings means diverging from upstream, and
// editing a copy forks it from the registry that owns it. Fourteen of the 25
// findings on the first run were in these trees.
//
// **This list may only shrink.** Adding a directory to silence a new finding
// defeats the gate; fix the file instead.
export default defineConfig([
  globalIgnores([
    "storybook-static/**",
    "node_modules/**",
    "src/components/ui/**",
    "src/components/ai-elements/**",
    "src/components/marketing/**",
    "src/shims/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Stories bind an element for readability before asserting on a subset,
      // and destructure story args they do not all use. An underscore prefix is
      // the opt-out, which keeps the rule useful for genuine dead bindings.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);
