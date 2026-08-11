import { describe, expect, it } from "vitest";

import { findSlotErasures } from "./contract-rules";

const REGISTRY = new Set(["EntityRow", "CostChip", "StatReadout"]);

describe("findSlotErasures", () => {
  it("flags data-slot passed to a registry component", () => {
    const out = findSlotErasures("x.tsx", `<StatReadout data-slot="asset-detail-params" />`, REGISTRY);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("StatReadout");
  });

  it("flags it across a multi-line opening tag", () => {
    const src = ["<EntityRow", `  title="a"`, `  data-slot="row"`, "/>"].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toHaveLength(1);
  });

  it("allows data-slot on a vendored ui/ primitive", () => {
    // House idiom: result-card on Card, tool-panel on Tabs. Nothing keys on these.
    expect(findSlotErasures("x.tsx", `<Card data-slot="result-card" />`, REGISTRY)).toEqual([]);
  });

  it("allows a registry component with no data-slot", () => {
    expect(findSlotErasures("x.tsx", `<EntityRow title="a" />`, REGISTRY)).toEqual([]);
  });

  it("ignores a data-slot on a plain DOM element", () => {
    expect(findSlotErasures("x.tsx", `<div data-slot="wrapper" />`, REGISTRY)).toEqual([]);
  });

  it("does not attribute nested JSX's data-slot to the outer registry component", () => {
    // The real frame-strip shape. Badge is a vendored ui/ primitive and its
    // own data-slot is legal; attributing it to PreviewTile is a false
    // positive, and false positives make people contort working code.
    const src = [
      `<EntityRow`,
      `  title="a"`,
      `  badge={<Badge data-slot="frame-strip-mark">In</Badge>}`,
      `/>`,
    ].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toEqual([]);
  });

  it("still flags the outer component when its own data-slot precedes nested JSX", () => {
    const src = [
      `<EntityRow`,
      `  data-slot="mine"`,
      `  badge={<Badge data-slot="theirs">x</Badge>}`,
      `/>`,
    ].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toHaveLength(1);
  });
});
