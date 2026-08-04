import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    // RTL auto-cleanup needs a global afterEach
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "registry/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "content/**/*.test.{ts,tsx}",
      "scripts/**/*.test.{ts,tsx}",
    ],
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
