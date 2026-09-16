import { describe, expect, it } from "vitest";

import type { PatternDocs } from "@/lib/pattern-docs";

import { SLUG_RE, validatePattern } from "./pattern-schema";

const shipped = new Set(["media-prompt-bar", "context-chips", "kbd"]);
const why = "a reason long enough to pass the twenty character floor";
const base: PatternDocs = {
  title: "Attach context to a prompt",
  stage: "ask",
  definition: why,
  whyItMatters: why,
  components: ["media-prompt-bar", "context-chips"],
  anatomy: [{ slot: "composer", note: "The prompt bar." }],
  pitfalls: [],
  status: "shipped",
};

describe("validatePattern", () => {
  it("passes a shipped pattern with resolving components and a demo", () => {
    expect(validatePattern("attach-context", base, shipped, true)).toEqual([]);
  });

  it("fails a component that is not a shipped registry name", () => {
    const errors = validatePattern("x", { ...base, components: ["draft-mode"] }, shipped, true);
    expect(errors).toEqual(['x: components[0] "draft-mode" is not a shipped manifest item']);
  });

  it("fails a shipped pattern with no components or no demo", () => {
    expect(validatePattern("x", { ...base, components: [] }, shipped, true)).toContain(
      "x: a shipped pattern composes at least one component",
    );
    expect(validatePattern("x", base, shipped, false)).toContain(
      "x: a shipped pattern has a composition at components/demos/patterns/x-demo.tsx",
    );
  });

  it("holds an unfilled pattern to D26: no components, no demo, evidence, and a reason", () => {
    const unfilled: PatternDocs = { ...base, components: [], status: "unfilled" };
    const errors = validatePattern("x", unfilled, shipped, false);
    expect(errors).toContain("x: an unfilled pattern names at least one product in evidence");
    expect(errors).toContain("x: unfilledBecause needs a reason of at least 20 characters");
    expect(
      validatePattern("x", { ...unfilled, evidence: ["Perplexity"], unfilledBecause: why }, shipped, false),
    ).toEqual([]);
    expect(
      validatePattern("x", { ...unfilled, evidence: ["Perplexity"], unfilledBecause: why }, shipped, true),
    ).toContain(
      "x: an unfilled pattern has no composition; delete components/demos/patterns/x-demo.tsx or ship it",
    );
  });

  it("refuses a title that is a registry name under another spelling, and a bad stage or slug", () => {
    expect(validatePattern("kbd", { ...base, title: "Kbd" }, shipped, true)).toContain(
      'kbd: title "Kbd" is the registry item kbd; a pattern names a behaviour, not a component (D26)',
    );
    expect(validatePattern("x", { ...base, stage: "flow" as never }, shipped, true)).toContain(
      'x: stage "flow" is not one of start, ask, tune, watch, review, keep, trust',
    );
    expect(validatePattern("Bad Slug", base, shipped, true)).toContain(
      "Bad Slug: slug must match /^[a-z0-9]+(-[a-z0-9]+)*$/",
    );
    expect(SLUG_RE.test("attach-context-to-a-prompt")).toBe(true);
  });

  it("requires a definition, a why, and at least one anatomy slot", () => {
    const errors = validatePattern(
      "x",
      { ...base, definition: "short", whyItMatters: "", anatomy: [] },
      shipped,
      true,
    );
    expect(errors).toContain("x: definition needs at least 20 characters");
    expect(errors).toContain("x: whyItMatters needs at least 20 characters");
    expect(errors).toContain("x: anatomy names at least one slot");
  });
});
