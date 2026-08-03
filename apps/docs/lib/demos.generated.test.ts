import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { demos } from "./demos.generated";

describe("generated demo map", () => {
  it("has a demo for every catalog entry", () => {
    for (const name of CATALOG) expect(demos[name]).toBeDefined();
  });

  it("has no demo that is not in the catalog", () => {
    for (const name of Object.keys(demos)) expect(CATALOG).toContain(name);
  });

  it("maps every catalog entry to an actual component, not a broken import", () => {
    for (const name of CATALOG) expect(typeof demos[name]).toBe("function");
  });
});
