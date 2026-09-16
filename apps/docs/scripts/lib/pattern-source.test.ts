import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadPattern, patternModulePath, patternSlugs } from "./pattern-source";

// The first module of the launch set. Until it lands the probe is skipped
// rather than deleted, so the wave turns this test live without editing it.
const first = "attach-context-to-a-prompt";
const onDisk = existsSync(resolve(__dirname, patternModulePath(first)));

describe("pattern-source", () => {
  it("spells the module path the way the glob keys it", () => {
    expect(patternModulePath("x")).toBe("../../content/patterns/x.pattern.tsx");
  });

  it("throws, naming the slug, for a module that does not exist", async () => {
    await expect(loadPattern("no-such-pattern")).rejects.toThrow("no-such-pattern: no pattern module");
  });

  it.skipIf(!onDisk)("lists the first launch module and loads its export", async () => {
    expect(patternSlugs()).toContain(first);
    const docs = await loadPattern(first);
    expect(docs.stage).toBe("ask");
    expect(docs.status).toBe("shipped");
  });
});
