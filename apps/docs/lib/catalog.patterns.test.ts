import { describe, expect, it } from "vitest";
import { MANIFEST } from "./catalog.manifest";
import { SHAPE_OF_AI_PATTERNS } from "./manifest-types";

const VOCABULARY = new Set(
  Object.entries(SHAPE_OF_AI_PATTERNS).flatMap(([category, names]) =>
    names.map((name) => `${category}/${name}`),
  ),
);

// Every catalog item shape-of-ai-board-analysis.md §3 names in a "Covered" row.
// Written out rather than derived, so dropping a mapping from the manifest
// fails here instead of passing silently. Contracts and AI Elements components
// the same rows cite (the Dialog contract, L1 `Question`) are not catalog items
// and are not listed.
const COVERED_ITEMS = [
  // Wayfinders
  "J3",
  "J6",
  "O8",
  "D7",
  "C1",
  "L2",
  "L3",
  "I3",
  "B5",
  "F3",
  "A10",
  "C2",
  "C3",
  "E8",
  // Inputs
  "I4",
  "K4",
  "D6",
  "K2",
  "D5",
  "I5",
  "D1",
  "K1",
  "F7",
  "E9",
  "F4",
  "E4",
  "K7",
  "O13",
  "H4",
  // Tuners
  "D2",
  "D3",
  "M7",
  "N7",
  "K5",
  "J2",
  "A5",
  "K8",
  "E2",
  "A7",
  "D4",
  "E3",
  "A6",
  // Governors
  "F2",
  "K6",
  "E5",
  "E6",
  "N12",
  "A2",
  "E1",
  "N4",
  "F5",
  "N8",
  "N2",
  // Trust builders
  "N3",
];

describe("MANIFEST patterns (Shape of AI cross-reference, D27)", () => {
  it("only uses values from the typed vocabulary", () => {
    const unknown = MANIFEST.flatMap((i) => (i.patterns ?? []).map((p) => [i.id, p] as const)).filter(
      ([, p]) => !VOCABULARY.has(p),
    );
    expect(unknown).toEqual([]);
  });

  it("lists each pattern once per item", () => {
    for (const i of MANIFEST) {
      expect(new Set(i.patterns).size, i.id).toBe((i.patterns ?? []).length);
    }
  });

  it("is set only on shipped items", () => {
    const stray = MANIFEST.filter((i) => i.patterns && i.status !== "shipped").map((i) => i.id);
    expect(stray).toEqual([]);
  });

  it("gives every item in the analysis's Covered rows at least one pattern", () => {
    const byId = new Map(MANIFEST.map((i) => [i.id, i]));
    const missing = COVERED_ITEMS.filter((id) => {
      const item = byId.get(id);
      return !item || item.status !== "shipped" || !item.patterns?.length;
    });
    expect(missing).toEqual([]);
  });

  it("answers the motivating question: Caveat is disclaimer-note", () => {
    const names = MANIFEST.filter((i) => i.patterns?.includes("trust-builders/caveat")).map((i) => i.name);
    expect(names).toEqual(["disclaimer-note"]);
  });
});
