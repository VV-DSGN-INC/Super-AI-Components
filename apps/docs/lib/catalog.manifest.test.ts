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
