import { describe, expect, it } from "vitest";

import { CATALOG, CATALOG_ITEMS } from "./catalog";
import { MANIFEST } from "./catalog.manifest";

describe("CATALOG_ITEMS", () => {
  it("contains exactly the shipped manifest items", () => {
    expect(CATALOG.sort()).toEqual(
      MANIFEST.filter((i) => i.status === "shipped").map((i) => i.name).sort(),
    );
  });

  it("groups primitives and components by manifest layer", () => {
    const kbd = CATALOG_ITEMS.find((i) => i.name === "kbd")!;
    const threadList = CATALOG_ITEMS.find((i) => i.name === "thread-list")!;
    expect(kbd.group).toBe("Primitives");
    expect(threadList.group).toBe("Components");
  });

  it("keeps sidebar ordering stable — primitives before components", () => {
    const firstComponent = CATALOG_ITEMS.findIndex((i) => i.group === "Components");
    const lastPrimitive = CATALOG_ITEMS.map((i) => i.group).lastIndexOf("Primitives");
    expect(lastPrimitive).toBeLessThan(firstComponent);
  });
});
