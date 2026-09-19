import { describe, expect, it } from "vitest";

import {
  FACT_KEYS,
  factKeysIn,
  pageStrings,
  resolveFacts,
  type SystemFacts,
  type SystemPage,
} from "./system-page";

const FACTS = Object.fromEntries(FACT_KEYS.map((key, index) => [key, index + 1])) as SystemFacts;

const PAGE: SystemPage = {
  slug: "harness",
  title: "Title",
  description: "Description",
  lede: ["Lede one", "Lede two"],
  sections: [
    {
      id: "s",
      heading: "Heading",
      blocks: [
        { kind: "p", text: "Paragraph" },
        { kind: "quote", text: "Quote" },
        { kind: "list", items: ["Item"] },
        { kind: "table", columns: ["Col"], rows: [["Cell"]] },
        { kind: "figure", figure: "loops", caption: "Caption" },
        { kind: "gates" },
        { kind: "derived" },
        { kind: "links", items: [{ label: "Label", href: "/x" }] },
      ],
    },
  ],
};

describe("FACT_KEYS", () => {
  it("is sorted, so facts.json diffs stay stable", () => {
    expect([...FACT_KEYS]).toEqual([...FACT_KEYS].sort());
  });
});

describe("resolveFacts", () => {
  it("replaces every placeholder with its number", () => {
    expect(resolveFacts("{facts.ciSteps} steps, {facts.contracts} contracts", FACTS)).toBe(
      "1 steps, 2 contracts",
    );
  });

  it("leaves text without placeholders alone", () => {
    expect(resolveFacts("no numbers here", FACTS)).toBe("no numbers here");
  });

  it("throws on a key that is not a fact", () => {
    expect(() => resolveFacts("{facts.nope}", FACTS)).toThrow("unknown fact placeholder {facts.nope}");
  });
});

describe("factKeysIn", () => {
  it("lists the keys a string uses, in order, repeats included", () => {
    expect(factKeysIn("{facts.rules} and {facts.skills} and {facts.rules}")).toEqual([
      "rules",
      "skills",
      "rules",
    ]);
  });
});

describe("pageStrings", () => {
  it("returns every prose string and nothing for the data blocks", () => {
    expect(pageStrings(PAGE)).toEqual([
      "Title",
      "Description",
      "Lede one",
      "Lede two",
      "Heading",
      "Paragraph",
      "Quote",
      "Item",
      "Col",
      "Cell",
      "Caption",
      "Label",
    ]);
  });
});
