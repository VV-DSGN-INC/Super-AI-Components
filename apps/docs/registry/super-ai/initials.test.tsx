import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Google Sheets")).toBe("GS");
  });

  it("stops at two, however many words there are", () => {
    expect(initials("Northwind Trading Company Limited")).toBe("NT");
  });

  it("handles a single word", () => {
    expect(initials("Notion")).toBe("N");
  });

  it("uppercases", () => {
    expect(initials("acme corp")).toBe("AC");
  });

  // The three copies this replaces disagreed here on paper: one trimmed and one
  // did not. They agreed in practice only because `.filter(Boolean)` dropped the
  // empty leading segment. Pinned so the surviving copy cannot regress.
  it("survives leading, trailing and repeated whitespace", () => {
    expect(initials("  John   Smith  ")).toBe("JS");
  });

  it("returns an empty string for an empty name", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });
});
