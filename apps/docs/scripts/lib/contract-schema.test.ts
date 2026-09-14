import type { ComponentDocs } from "@/lib/component-docs";

import { MIN_REASON, axisKey, isNone, validateContract } from "./contract-schema";

const shipped = new Set(["kbd", "mode-tabs", "model-picker", "shortcuts-sheet"]);
const why = "a reason long enough to pass the floor";

// Only the two contract fields are under test; the nine prose fields keep
// their needle rules in contract-rules.ts and are filled with empties here.
const base: ComponentDocs = {
  whatItIs: "x",
  whyItMatters: "x",
  evidence: [],
  anatomy: [],
  usage: "x",
  dos: [],
  donts: [],
  accessibility: { keyboard: [], screenReader: [] },
  pitfalls: [],
};

describe("validateContract", () => {
  it("accepts a written contract with one axis and one redirect", () => {
    const docs: ComponentDocs = {
      ...base,
      variants: [{ prop: "variant", default: "default", values: [{ value: "default", intent: why }] }],
      insteadUse: [{ component: "model-picker", when: why }],
    };
    expect(validateContract("mode-tabs", docs, shipped)).toEqual([]);
  });

  it("accepts { none } on both fields when the reason clears the floor", () => {
    const docs: ComponentDocs = { ...base, variants: { none: why }, insteadUse: { none: why } };
    expect(validateContract("kbd", docs, shipped)).toEqual([]);
  });

  it("treats an absent field as unwritten, not invalid (the baseline owns it)", () => {
    expect(validateContract("kbd", base, shipped)).toEqual([]);
  });

  it("rejects a none whose reason is under the floor", () => {
    const docs: ComponentDocs = { ...base, variants: { none: "short" } };
    expect(validateContract("kbd", docs, shipped)).toEqual([
      `kbd: variants.none needs a reason of at least ${MIN_REASON} characters`,
    ]);
  });

  it("rejects an empty list: silence is not a decision", () => {
    const docs: ComponentDocs = { ...base, variants: [], insteadUse: [] };
    const errors = validateContract("kbd", docs, shipped);
    expect(errors).toContain("kbd: variants must be a non-empty list or { none: <why> }");
    expect(errors).toContain("kbd: insteadUse must be a non-empty list or { none: <why> }");
  });

  it("rejects a short intent, a repeated value, and a default that is not a value", () => {
    const docs: ComponentDocs = {
      ...base,
      variants: [
        {
          prop: "variant",
          default: "ghost",
          values: [
            { value: "default", intent: "too short" },
            { value: "default", intent: why },
          ],
        },
      ],
    };
    const errors = validateContract("mode-tabs", docs, shipped);
    expect(errors).toContain(
      `mode-tabs: variants[0] value "default" needs an intent of at least ${MIN_REASON} characters`,
    );
    expect(errors).toContain('mode-tabs: variants[0] repeats value "default"');
    expect(errors).toContain('mode-tabs: variants[0].default "ghost" is not one of its values');
  });

  it("requires propName when prop is not a bare identifier, and accepts it when given", () => {
    const axis = { prop: "ToolHeader · state", values: [{ value: "idle", intent: why }] };
    expect(validateContract("mode-tabs", { ...base, variants: [axis] }, shipped)).toEqual([
      'mode-tabs: variants[0] needs propName as a bare identifier when prop "ToolHeader · state" is not one',
    ]);
    expect(
      validateContract("mode-tabs", { ...base, variants: [{ ...axis, propName: "state" }] }, shipped),
    ).toEqual([]);
  });

  it("rejects a redirect to itself or to an item that is not shipped", () => {
    const docs: ComponentDocs = {
      ...base,
      insteadUse: [
        { component: "kbd", when: why },
        { component: "ghost-item", when: why },
      ],
    };
    expect(validateContract("kbd", docs, shipped)).toEqual([
      "kbd: insteadUse points at itself",
      'kbd: insteadUse "ghost-item" is not a shipped manifest item',
    ]);
  });
});

describe("helpers", () => {
  it("isNone tells the none shape from a list and from junk", () => {
    expect(isNone({ none: "x" })).toBe(true);
    expect(isNone([])).toBe(false);
    expect(isNone(null)).toBe(false);
  });

  it("axisKey prefers propName and falls back to prop", () => {
    expect(axisKey({ prop: "variant", values: [] })).toBe("variant");
    expect(axisKey({ prop: "A · b", propName: "b", values: [] })).toBe("b");
  });
});
