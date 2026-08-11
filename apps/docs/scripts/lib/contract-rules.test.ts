import { describe, expect, it } from "vitest";

import { compareExemptionLists, findSlotErasures, parseStorybookExclusions } from "./contract-rules";

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

describe("parseStorybookExclusions", () => {
  it("extracts only this repo's own super-ai story exclusions", () => {
    const src = `exclude: [
      ...configDefaults.exclude,
      "**/stories/ui/**",
      "**/stories/ai-elements/**",
      "**/stories/super-ai/PreviewTile.stories.tsx",
    ],`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("does not count a commented-out exclusion as live", () => {
    // How a human "removes" an entry. Counting it as live means G3 reports no
    // mismatch and stops catching the drift it exists to catch.
    const src = `exclude: [
      // "**/stories/super-ai/Foo.stories.tsx", // removed 2026-01
      "**/stories/super-ai/PreviewTile.stories.tsx",
    ],`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("does not count an entry inside a block comment that contains no glob", () => {
    // Deliberately glob-free. A block comment containing one of these globs is
    // a SYNTAX ERROR — the glob's own `**/` closes the comment — so it cannot
    // occur in a loadable config, and a test built on one would assert
    // behaviour on source that could never exist.
    const src = `/* PreviewTile was removed here, see the retrofit note */
      "**/stories/super-ai/PreviewTile.stories.tsx",`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("strips a multi-line block comment without eating the entry after it", () => {
    const src = [`/*`, `  a long`, `  explanation`, `*/`, `"**/stories/super-ai/PreviewTile.stories.tsx",`].join("\n");
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("keeps a live entry that has a trailing comment", () => {
    const src = `"**/stories/super-ai/PreviewTile.stories.tsx", // color-contrast x2`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("is not confused by a URL on the same line", () => {
    const src = `// see https://example.com/x
      "**/stories/super-ai/PreviewTile.stories.tsx",`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });
});

describe("compareExemptionLists", () => {
  it("passes when the two lists name the same components", () => {
    expect(compareExemptionLists(["preview-tile.tsx"], ["PreviewTile"])).toEqual([]);
  });

  it("reports a component exempt from contrast but not from the a11y gate", () => {
    const out = compareExemptionLists(["preview-tile.tsx", "kbd.tsx"], ["PreviewTile"]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("kbd");
  });

  it("reports a component excluded from the a11y gate but not from contrast", () => {
    const out = compareExemptionLists(["preview-tile.tsx"], ["PreviewTile", "EntityRow"]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("EntityRow");
  });
});
