import { describe, expect, it } from "vitest";

import { CATALOG_ITEMS, groupFor } from "./catalog";
import { MANIFEST } from "./catalog.manifest";

describe("groupFor", () => {
  it("maps every layer to its own group", () => {
    expect(groupFor("primitive")).toBe("Primitives");
    expect(groupFor("component")).toBe("Components");
    expect(groupFor("block")).toBe("Blocks");
  });
});

describe("CATALOG_ITEMS", () => {
  it("assigns each shipped item the group its layer maps to", () => {
    const shipped = MANIFEST.filter((i) => i.status === "shipped");
    expect(shipped.length).toBeGreaterThan(0);
    for (const item of shipped) {
      expect(CATALOG_ITEMS.find((i) => i.name === item.name)?.group).toBe(groupFor(item.layer));
    }
  });
});
