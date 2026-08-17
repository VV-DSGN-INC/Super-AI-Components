import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/registry\/(.*)/, replacement: resolve(__dirname, "../docs/registry/$1") },
      { find: /^@\/components\/demos\/(.*)/, replacement: resolve(__dirname, "../docs/components/demos/$1") },
      { find: /^@\/content\/(.*)/, replacement: resolve(__dirname, "../docs/content/$1") },
      { find: /^@\/lib\/component-docs$/, replacement: resolve(__dirname, "../docs/lib/component-docs.ts") },
      { find: /^@\/components\/component-docs$/, replacement: resolve(__dirname, "../docs/components/component-docs.tsx") },
      // component-docs.tsx pulls in the docs workspace's i18n helpers; without its own
      // rule the catch-all below would send `@/lib/i18n/*` into this workspace's own
      // `src/lib/i18n/`, which doesn't exist.
      { find: /^@\/lib\/i18n\/(.*)/, replacement: resolve(__dirname, "../docs/lib/i18n/$1") },
      { find: /^@\/(.*)/, replacement: resolve(__dirname, "./src/$1") },
      // Lightweight shims so Next.js-flavored imports resolve in a Vite/Storybook context.
      { find: "next/image", replacement: resolve(__dirname, "./src/shims/next-image.tsx") },
      { find: "next/link", replacement: resolve(__dirname, "./src/shims/next-link.tsx") },
    ],
  },
});
