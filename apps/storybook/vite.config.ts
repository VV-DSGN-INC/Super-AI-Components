import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docs = resolve(__dirname, "../docs");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Array form: order matters. The registry and demo aliases must be matched
    // before the general "@/" rule, so Storybook renders the docs app's real
    // sources instead of copies that silently drift from the registry.
    alias: [
      { find: /^@\/registry\//, replacement: `${docs}/registry/` },
      { find: /^@\/components\/demos\//, replacement: `${docs}/components/demos/` },
      // Lightweight shims so Next.js-flavored imports resolve in a Vite/Storybook context.
      { find: /^next\/image$/, replacement: resolve(__dirname, "./src/shims/next-image.tsx") },
      { find: /^next\/link$/, replacement: resolve(__dirname, "./src/shims/next-link.tsx") },
      { find: /^@\//, replacement: `${resolve(__dirname, "./src")}/` },
    ],
  },
});
