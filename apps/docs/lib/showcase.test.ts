import { describe, expect, it } from "vitest";

import { MANIFEST } from "./catalog.manifest";
import {
  SHOWCASE_BLOCKS,
  SHOWCASE_PRIMITIVES,
  SHOWCASE_SECTIONS,
  type SectionId,
} from "./showcase";

const shipped = MANIFEST.filter((i) => i.status === "shipped");

describe("the showcase spine", () => {
  it("has seven sections in tab order", () => {
    expect(SHOWCASE_SECTIONS.map((s) => s.id)).toEqual([
      "shell",
      "compose",
      "generate",
      "results",
      "knowledge",
      "trust",
      "account",
    ] satisfies SectionId[]);
  });

  it("gives every section the count the spec claims", () => {
    const counts = Object.fromEntries(SHOWCASE_SECTIONS.map((s) => [s.id, s.items.length]));
    expect(counts).toEqual({
      shell: 13,
      compose: 7,
      generate: 17,
      results: 12,
      knowledge: 17,
      trust: 18,
      account: 7,
    });
  });

  // The property that matters: the seven sections partition the component
  // layer. Not a subset, not an overlap — a partition. If a new family is
  // added to the manifest and not mapped, this fails rather than silently
  // dropping its components off the page.
  it("partitions every shipped component-layer item exactly once", () => {
    const componentNames = shipped.filter((i) => i.layer === "component").map((i) => i.name);
    const placed = SHOWCASE_SECTIONS.flatMap((s) => s.items.map((i) => i.name));

    expect(placed.length).toBe(componentNames.length);
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual([...componentNames].sort());
  });

  it("keeps the other two layers out of the sections and in their own lists", () => {
    expect(SHOWCASE_PRIMITIVES).toHaveLength(12);
    expect(SHOWCASE_BLOCKS).toHaveLength(13);

    const placed = new Set(SHOWCASE_SECTIONS.flatMap((s) => s.items.map((i) => i.name)));
    for (const item of [...SHOWCASE_PRIMITIVES, ...SHOWCASE_BLOCKS]) {
      expect(placed.has(item.name)).toBe(false);
    }
  });

  it("adds up to the manifest's shipped total", () => {
    const sectioned = SHOWCASE_SECTIONS.reduce((n, s) => n + s.items.length, 0);
    expect(sectioned + SHOWCASE_PRIMITIVES.length + SHOWCASE_BLOCKS.length).toBe(shipped.length);
  });

  it("gives every section a title and a blurb", () => {
    for (const section of SHOWCASE_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.blurb.length).toBeGreaterThan(0);
    }
  });
});
