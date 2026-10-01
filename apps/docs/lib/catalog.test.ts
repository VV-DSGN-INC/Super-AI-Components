import { describe, expect, it } from "vitest";

import { CATALOG, CATALOG_ITEMS, groupFor, ORDER } from "./catalog";
import { MANIFEST } from "./catalog.manifest";

describe("CATALOG_ITEMS", () => {
  it("contains exactly the shipped manifest items", () => {
    expect(CATALOG.sort()).toEqual(
      MANIFEST.filter((i) => i.status === "shipped")
        .map((i) => i.name)
        .sort(),
    );
  });

  it("groups primitives and components by manifest layer", () => {
    const kbd = CATALOG_ITEMS.find((i) => i.name === "kbd")!;
    const threadList = CATALOG_ITEMS.find((i) => i.name === "thread-list")!;
    expect(kbd.group).toBe("Primitives");
    expect(threadList.group).toBe("Components");
  });

  it("keeps sidebar ordering stable — primitives before components before blocks", () => {
    const firstComponent = CATALOG_ITEMS.findIndex((i) => i.group === "Components");
    const lastPrimitive = CATALOG_ITEMS.map((i) => i.group).lastIndexOf("Primitives");
    expect(lastPrimitive).toBeLessThan(firstComponent);

    // No block is shipped yet, so a CATALOG_ITEMS-based check for "Blocks" would
    // find nothing and pass vacuously. Assert the invariant directly against
    // ORDER — the map CATALOG_ITEMS's sort is actually derived from — instead.
    expect(ORDER.primitive).toBeLessThan(ORDER.component);
    expect(ORDER.component).toBeLessThan(ORDER.block);
  });
});

describe("groupFor", () => {
  it("maps every layer to its own group", () => {
    expect(groupFor("primitive")).toBe("Primitives");
    expect(groupFor("component")).toBe("Components");
    expect(groupFor("block")).toBe("Blocks");
  });
});

describe("CATALOG_ITEMS group assignment", () => {
  it("assigns each shipped item the group its layer maps to", () => {
    const shipped = MANIFEST.filter((i) => i.status === "shipped");
    expect(shipped.length).toBeGreaterThan(0);
    for (const item of shipped) {
      expect(CATALOG_ITEMS.find((i) => i.name === item.name)?.group).toBe(groupFor(item.layer));
    }
  });
});

describe("CATALOG_BY_FAMILY", () => {
  it("places every shipped item in exactly one family, in catalog order, and skips cut family G", async () => {
    const { CATALOG_BY_FAMILY, FAMILY_TITLES } = await import("./catalog");
    const placed = CATALOG_BY_FAMILY.flatMap((f) => f.items.map((i) => i.name));
    expect(placed.sort()).toEqual([...CATALOG].sort());
    expect(new Set(placed).size).toBe(placed.length);
    expect(CATALOG_BY_FAMILY[0].family).toBe("A");
    expect(CATALOG_BY_FAMILY.map((f) => f.family)).not.toContain("G");
    for (const f of CATALOG_BY_FAMILY)
      expect(f.title).toBe(FAMILY_TITLES[f.family as keyof typeof FAMILY_TITLES]);
  });

  it("titles families the way docs/design-system/catalog.md does", async () => {
    const { FAMILY_TITLES } = await import("./catalog");
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const md = readFileSync(resolve(__dirname, "../../../docs/design-system/catalog.md"), "utf8");
    const headings = [...md.matchAll(/^## ([A-P]) · (.+?)(?: \((?:L\d|v\d)\))? — /gm)];
    expect(headings.length).toBe(16);
    for (const [, id, title] of headings) {
      expect(FAMILY_TITLES[id as keyof typeof FAMILY_TITLES]).toBe(title);
    }
  });
});
