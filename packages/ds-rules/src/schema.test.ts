import { describe, expect, it } from "vitest";

import { RULE_ID_PATTERN, ruleSchema } from "./schema";

const valid = {
  id: "TOK-1",
  title: "No raw hex colours",
  severity: "blocker",
  detect: {
    method: "heuristic",
    pattern: "#[0-9a-fA-F]{3,8}\\b",
    flags: "",
    scope: ["apps/docs/registry/super-ai"],
    include: [".tsx"],
    exempt: [],
    falsePositives: "Issue refs like #1234 in comments.",
  },
  fix: "Use a shadcn CSS variable.",
};

describe("ruleSchema", () => {
  it("accepts a TOK-prefixed heuristic record", () => {
    expect(ruleSchema.parse(valid).id).toBe("TOK-1");
  });

  it("rejects a heuristic without falsePositives — an uncharacterised heuristic cannot gate", () => {
    const { falsePositives: _dropped, ...detect } = valid.detect;
    expect(() => ruleSchema.parse({ ...valid, detect })).toThrow();
  });

  it("rejects a record without a fix — bans without substitutions are banned", () => {
    const { fix: _dropped, ...rest } = valid;
    expect(() => ruleSchema.parse(rest)).toThrow();
  });

  it("TOK is a legal prefix and BOGUS is not", () => {
    expect(RULE_ID_PATTERN.test("TOK-7")).toBe(true);
    expect(RULE_ID_PATTERN.test("BOGUS-1")).toBe(false);
  });
});
