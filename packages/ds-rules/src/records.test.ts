import { describe, expect, it } from "vitest";

import { STRUCTURAL, VENDORED_SCOPES as RUNTIME_VENDORED } from "../rulecheck.mjs";
import { LOCAL_RULES, VENDORED_SCOPES } from "./local";
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

describe("structural routing", () => {
  it("every STRUCTURAL id has a heuristic record (an entry routing to nothing is drift)", () => {
    for (const id of Object.keys(STRUCTURAL)) {
      const rule = LOCAL_RULES.find((r) => r.id === id);
      expect(rule, `${id} is in STRUCTURAL but has no record`).toBeDefined();
      expect(rule?.detect.method).toBe("heuristic");
    }
    expect(Object.keys(STRUCTURAL).sort()).toEqual(["TOK-4", "TOK-5"]);
  });

  it("rulecheck's vendored-scope mirror equals the source of truth", () => {
    expect(RUNTIME_VENDORED).toEqual(VENDORED_SCOPES);
  });
});
