import { defineConfig } from "@playwright/test";

// SMOKE_PORT moves the smoke server off 3100 when another process holds it.
// CI leaves it unset. An empty value counts as unset.
const PORT = Number(process.env.SMOKE_PORT || 3100);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`SMOKE_PORT must be a port number, got "${process.env.SMOKE_PORT}"`);
}
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: ORIGIN },
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
  },
});
