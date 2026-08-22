import { describe, expect, it } from "vitest";

import { LOCAL_RULES } from "./local";
import { ruleSchema } from "./schema";

const all = () => [...LOCAL_RULES];

describe("rule records", () => {
  it("every record is schema-valid", () => {
    for (const rule of all()) expect(() => ruleSchema.parse(rule)).not.toThrow();
  });

  it("ids are unique", () => {
    const ids = all().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every grep/heuristic pattern compiles", () => {
    for (const rule of all()) {
      const d = rule.detect;
      if (d.method === "grep" || d.method === "heuristic") {
        expect(() => new RegExp(d.pattern, d.flags)).not.toThrow();
      }
    }
  });

  it("every grep/heuristic rule has a known-bad and a known-good fixture", async () => {
    const { existsSync } = await import("node:fs");
    for (const rule of all()) {
      if (rule.detect.method === "rendered" || rule.detect.method === "judgment") continue;
      for (const kind of ["bad", "good"]) {
        const dir = new URL(`../__fixtures__/${rule.id}/${kind}/`, import.meta.url);
        expect(existsSync(dir), `${rule.id} missing __fixtures__/${rule.id}/${kind}/`).toBe(true);
      }
    }
  });
});
