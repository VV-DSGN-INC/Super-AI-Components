import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // A rest element exists to drop its named siblings; `const { a: _a, ...rest }`
    // is the idiom, not an unused binding.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // `next/image` is a docs-app concern. Registry sources ship into apps that
    // own their image pipeline; demos, examples and tests never ship at all.
    files: ["registry/**", "components/demos/**", "content/**", "**/*.test.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    // Vendored from registry.ai-sdk.dev (see the file header). Not ours to
    // restyle: the next re-vendor overwrites any local fix.
    files: ["components/ai-elements/**"],
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
