import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Lightweight shims so Next.js-flavored imports resolve in a Vite/Storybook context.
      "next/image": resolve(__dirname, "./src/shims/next-image.tsx"),
      "next/link": resolve(__dirname, "./src/shims/next-link.tsx"),
    },
  },
});
