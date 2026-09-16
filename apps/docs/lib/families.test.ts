import { describe, expect, it } from "vitest";

import { MANIFEST } from "./catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "./families";

describe("families", () => {
  it("labels every family a shipped item belongs to, in catalog order", () => {
    const shipped = new Set(MANIFEST.filter((i) => i.status === "shipped").map((i) => i.family));
    for (const f of shipped) expect(FAMILY_LABELS[f], `family ${f}`).toBeTruthy();
    expect(FAMILY_ORDER).toEqual(["A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "N", "O", "P"]);
  });
});
