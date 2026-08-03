import { describe, expect, it } from "vitest";
import { MANIFEST } from "./catalog.manifest";
import { shippedItems } from "./manifest-types";

describe("MANIFEST", () => {
  it("carries every catalog row, including the cut records", () => {
    // 107 active + family G's 10 cut rows + the cut O5 `flow-shell` = 118.
    expect(MANIFEST).toHaveLength(118);
  });

  it("has 107 active items, matching catalog.md's totals table", () => {
    expect(MANIFEST.filter((i) => i.status !== "cut")).toHaveLength(107);
  });

  it("has exactly the 14 already-registered components as shipped", () => {
    expect(shippedItems(MANIFEST).map((i) => i.name).sort()).toEqual(
      [
        "choice-chips", "cost-chip", "date-section", "entity-row", "field-row",
        "filter-bar", "gen-settings-bar", "kbd", "preview-tile", "reset-affordance",
        "section-header", "shortcuts-sheet", "stat-readout", "thread-list",
      ].sort(),
    );
  });

  it("marks every shipped item as contract-exempt legacy", () => {
    expect(shippedItems(MANIFEST).every((i) => i.contractExempt === true)).toBe(true);
  });

  it("cuts family G", () => {
    expect(MANIFEST.filter((i) => i.family === "G").every((i) => i.status === "cut")).toBe(true);
  });

  it("has unique names", () => {
    const names = MANIFEST.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("declares only consumable dependencies that exist", () => {
    const names = new Set(MANIFEST.map((i) => i.name));
    for (const item of MANIFEST) {
      for (const dep of item.consumes) expect(names.has(dep)).toBe(true);
    }
  });
});

// Pins the wave assignment against decisions.md §5 ("Revised sequencing
// proposal"), where each wave ships a family's components plus the one block
// that proves them — so a block's wave is almost never its family's wave, and
// family N is split (N1/N3 land with D in wave 3; N4-N6 land with
// `records-shell` in wave 11).
describe("MANIFEST wave assignment (decisions.md §5)", () => {
  const byId = (id: string) => MANIFEST.find((i) => i.id === id)!;

  it("places each block in the wave whose components it proves", () => {
    const wavesById: Record<string, number> = {
      O1: 2, // home-shell — wave 2 (B + C)
      O2: 3, // chat-shell — wave 3 (D)
      O3: 6, // studio-shell — wave 6 (I + H)
      O4: 6, // timeline-shell — wave 6 (I + H)
      O6: 4, // generation-shell — wave 4 (E + F)
      O7: 7, // library-shell — wave 7 (J)
      O8: 7, // explore-shell — wave 7 (J)
      O9: 7, // artifact-shell — wave 7 (J)
      O10: 11, // records-shell — wave 11 (N4-N6)
      O11: 8, // docs-shell — wave 8 (K)
      O12: 10, // settings-shell — wave 10 (M)
      O13: 8, // notebook-shell — wave 8 (K)
      O14: 12, // auth-shell — wave 12
    };
    for (const [id, wave] of Object.entries(wavesById)) {
      expect(byId(id).wave).toBe(wave);
    }
  });

  it("places N1 `feedback` and N3 `disclaimer-note` in wave 3 with D, not family N's default", () => {
    expect(byId("N1").wave).toBe(3);
    expect(byId("N3").wave).toBe(3);
  });

  it("gives every cut item wave 0, regardless of family or id", () => {
    expect(MANIFEST.filter((i) => i.status === "cut").every((i) => i.wave === 0)).toBe(true);
  });
});
