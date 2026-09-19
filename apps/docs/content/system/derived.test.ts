import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DERIVED_ROWS } from "./derived";

const REPO = resolve(__dirname, "../../../..");
const isPattern = (path: string) => /[*<]/.test(path);

describe("DERIVED_ROWS", () => {
  it("cites a source and a holder that exist", () => {
    for (const row of DERIVED_ROWS) {
      expect(existsSync(join(REPO, row.source)), row.source).toBe(true);
      expect(existsSync(join(REPO, row.heldBy)), row.heldBy).toBe(true);
    }
  });

  it("lists committed outputs that exist, and skips patterns and uncommitted ones", () => {
    for (const row of DERIVED_ROWS) {
      if (!row.committed) continue;
      for (const path of row.derived.filter((candidate) => !isPattern(candidate))) {
        expect(existsSync(join(REPO, path)), path).toBe(true);
      }
    }
  });

  it("includes the facts file these pages read", () => {
    expect(DERIVED_ROWS.flatMap((row) => row.derived)).toContain("apps/docs/content/system/facts.json");
  });
});
