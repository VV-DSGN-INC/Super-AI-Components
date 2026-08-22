import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CORE_RULES } from "./core";
import { LOCAL_RULES } from "./local";
import { CATALOGUE_VERSION } from "./schema";

/** rules/*.json is what the dependency-free detector reads. It is generated,
 *  never hand-edited; this test is the drift gate, and RULES_EMIT=1 makes it
 *  the emitter (pnpm --filter ds-rules rules:emit). */
const EMISSIONS: Array<[string, unknown[]]> = [
  ["core.json", CORE_RULES],
  ["local.json", LOCAL_RULES],
];

describe("emitted rules", () => {
  for (const [name, rules] of EMISSIONS) {
    it(`rules/${name} matches its TypeScript source`, () => {
      const want = `${JSON.stringify({ version: CATALOGUE_VERSION, rules }, null, 2)}\n`;
      const file = fileURLToPath(new URL(`../rules/${name}`, import.meta.url));
      if (process.env.RULES_EMIT) {
        mkdirSync(fileURLToPath(new URL("../rules/", import.meta.url)), { recursive: true });
        writeFileSync(file, want);
      }
      expect(existsSync(file), `${name} missing — run: pnpm --filter ds-rules rules:emit`).toBe(
        true,
      );
      expect(readFileSync(file, "utf8")).toBe(want);
    });
  }
});
