import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { deriveFacts } from "@/scripts/lib/system-facts";

import { claimedNumber, CLAIMS } from "./claims";

const REPO = resolve(__dirname, "../../../..");

describe("claimedNumber", () => {
  it("reads digits and number words, any case", () => {
    expect(claimedNumber("116")).toBe(116);
    expect(claimedNumber("Twelve")).toBe(12);
    expect(claimedNumber("eleven")).toBe(11);
  });

  it("returns -1 for a word it does not know", () => {
    expect(claimedNumber("several")).toBe(-1);
  });
});

describe("CLAIMS", () => {
  const facts = deriveFacts(REPO);

  for (const claim of CLAIMS) {
    it(`${claim.file}: ${claim.note}`, () => {
      const text = readFileSync(join(REPO, claim.file), "utf8");
      const match = claim.pattern.exec(text);
      expect(
        match,
        `pattern ${claim.pattern} matches nothing in ${claim.file}. Update or remove the claim.`,
      ).not.toBeNull();
      expect(
        claimedNumber(match![1]),
        `${claim.file} says "${match![0]}" and the tree says ${facts[claim.fact]}`,
      ).toBe(facts[claim.fact]);
    });
  }
});
