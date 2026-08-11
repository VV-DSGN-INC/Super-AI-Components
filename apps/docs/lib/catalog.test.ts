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
