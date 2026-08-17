import { describe, expect, it } from "vitest";

import type { ComponentDocs } from "@/lib/component-docs";
import { canonicalJson, extractStrings, hashStrings } from "./i18n-extract";

const EN: ComponentDocs = {
  whatItIs: "A.",
  whyItMatters: "B.",
  evidence: ["NotebookLM", "Claude"],
  anatomy: [
    { slot: "empty-state", note: "Root." },
    { slot: "empty-state-header", note: "Header." },
  ],
  usage: "C.",
  dos: [{ text: "Do one.", example: <span>x</span> }, { text: "Do two." }],
  donts: [{ text: "Don't one." }],
  accessibility: { keyboard: ["K."], screenReader: ["S."] },
  pitfalls: ["P."],
};

describe("extractStrings", () => {
  it("keys anatomy by slot so slot names are never values", () => {
    expect(extractStrings(EN).anatomy).toEqual({
      "empty-state": "Root.",
      "empty-state-header": "Header.",
    });
  });

  it("reduces dos and donts to their text, dropping the React nodes", () => {
    const out = extractStrings(EN);
    expect(out.dos).toEqual(["Do one.", "Do two."]);
    expect(out.donts).toEqual(["Don't one."]);
    expect(JSON.stringify(out)).not.toContain("example");
  });

  it("omits evidence entirely — product names must never reach a translator", () => {
    expect(JSON.stringify(extractStrings(EN))).not.toContain("NotebookLM");
  });

  it("omits an absent focus arm rather than emitting undefined", () => {
    expect("focus" in extractStrings(EN).accessibility).toBe(false);
  });
});

describe("canonicalJson", () => {
  it("is stable across key order", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it("preserves array order, which is meaningful", () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });
});

describe("hashStrings", () => {
  it("is stable for equal content", () => {
    expect(hashStrings(extractStrings(EN))).toBe(hashStrings(extractStrings(EN)));
  });

  it("does not change when a non-extracted field changes", () => {
    const before = hashStrings(extractStrings(EN));
    const after = hashStrings(extractStrings({ ...EN, evidence: ["Something else"] }));
    expect(after).toBe(before);
  });

  it("changes when prose changes", () => {
    const before = hashStrings(extractStrings(EN));
    const after = hashStrings(extractStrings({ ...EN, usage: "C, revised." }));
    expect(after).not.toBe(before);
  });

  it("is 16 hex characters", () => {
    expect(hashStrings(extractStrings(EN))).toMatch(/^[0-9a-f]{16}$/);
  });
});
