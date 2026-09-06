import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MANIFEST } from "../../lib/catalog.manifest"; // match check-contract.mts's exact import
import { pascal } from "./scaffold-templates";
import {
  CASE_STORY_NAMES,
  collectUnmet,
  deriveObligations,
  nextBaseline,
  readStoryFacts,
  unmetObligations,
} from "./story-coverage";

/** Story coverage, ratcheted (story-conventions.md "Scope today"; the
 *  ds-architecture ladder's stage 06). Obligations derive from the manifest —
 *  eight case-story names per shipped item, present-or-`case-skip`, and a
 *  JSDoc description above every declared-state export. The committed
 *  baseline is the adoption-time debt; it may only shrink. */

const BASELINE = "scripts/lib/story-coverage.baseline.json";
const storyFor = (name: string) => `../storybook/src/stories/super-ai/${pascal(name)}.stories.tsx`;

describe("deriveObligations", () => {
  it("derives the eight case names and one described obligation per declared state", () => {
    const obligations = deriveObligations([{ name: "run-button", states: ["idle", "insufficient-credits"] }]);
    const keys = obligations.map((o) => o.key);
    for (const n of CASE_STORY_NAMES) expect(keys).toContain(`run-button:case:${n}`);
    expect(keys).toContain("run-button:described:Idle");
    expect(keys).toContain("run-button:described:InsufficientCredits");
    expect(obligations).toHaveLength(8 + 2);
  });

  it("gives a block (no declared states) the eight case obligations and nothing else", () => {
    const obligations = deriveObligations([{ name: "home-shell", states: [] }]);
    expect(obligations.filter((o) => o.kind === "case")).toHaveLength(8);
    expect(obligations.filter((o) => o.kind === "described")).toHaveLength(0);
  });
});

describe("readStoryFacts", () => {
  it("sees a story export in either of the two shapes the repo writes", () => {
    const facts = readStoryFacts(`export const RTL: Story = {\n};\nexport const Mobile = {\n};\n`);
    expect(facts.exports.has("RTL")).toBe(true);
    expect(facts.exports.has("Mobile")).toBe(true);
  });

  it("does not count a commented-out export", () => {
    const facts = readStoryFacts(`// export const Boundary: Story = {};\n`);
    expect(facts.exports.has("Boundary")).toBe(false);
  });

  it("parses a case-skip line in the convention's grammar, with its leading asterisk", () => {
    const facts = readStoryFacts(` * // case-skip: RTL — no directional layout, icons or motion\n`);
    expect(facts.skips.get("RTL")).toBe("no directional layout, icons or motion");
  });

  it("parses a case-skip line written as a plain line comment", () => {
    const facts = readStoryFacts(`// case-skip: Controlled — no value/onChange pair\n`);
    expect(facts.skips.get("Controlled")).toBe("no value/onChange pair");
  });

  it("treats a case-skip with no reason as silence, not a skip", () => {
    const facts = readStoryFacts(` * // case-skip: RTL —\n * // case-skip: Mobile — \n`);
    expect(facts.skips.has("RTL")).toBe(false);
    expect(facts.skips.has("Mobile")).toBe(false);
  });

  it("marks an export described when the line above it closes a JSDoc block", () => {
    const facts = readStoryFacts(`/**\n * The idle form.\n */\nexport const Idle: Story = {};\n`);
    expect(facts.described.has("Idle")).toBe(true);
  });

  it("allows blank lines between the JSDoc block and the export", () => {
    const facts = readStoryFacts(`/**\n * The idle form.\n */\n\n\nexport const Idle: Story = {};\n`);
    expect(facts.described.has("Idle")).toBe(true);
  });

  it("does not mark an export described when something else sits between the block and the export", () => {
    const facts = readStoryFacts(
      `/**\n * A harness.\n */\nconst harness = 1;\nexport const Idle: Story = {};\n`,
    );
    expect(facts.exports.has("Idle")).toBe(true);
    expect(facts.described.has("Idle")).toBe(false);
  });

  it("does not mark a first-line export described", () => {
    const facts = readStoryFacts(`export const Idle: Story = {};\n`);
    expect(facts.described.has("Idle")).toBe(false);
  });
});

describe("unmetObligations", () => {
  const obligations = deriveObligations([{ name: "kbd", states: ["single", "chord"] }]);

  it("satisfies a case obligation by export or by skip, and nothing else", () => {
    const facts = readStoryFacts(
      `/**\n * doc\n */\nexport const Single: Story = {};\nexport const RTL: Story = {};\n * // case-skip: Mobile — fixed-width chords\n`,
    );
    const unmet = unmetObligations(obligations, facts).map((o) => o.key);
    expect(unmet).not.toContain("kbd:case:RTL");
    expect(unmet).not.toContain("kbd:case:Mobile");
    expect(unmet).toContain("kbd:case:Boundary");
    expect(unmet.filter((k) => k.includes(":case:"))).toHaveLength(6);
  });

  it("satisfies a described obligation only when the export carries a description", () => {
    const facts = readStoryFacts(
      `/**\n * doc\n */\nexport const Single: Story = {};\nexport const Chord: Story = {};\n`,
    );
    const unmet = unmetObligations(obligations, facts).map((o) => o.key);
    expect(unmet).not.toContain("kbd:described:Single");
    expect(unmet).toContain("kbd:described:Chord");
  });

  it("leaves every obligation unmet when the story file is missing", () => {
    expect(unmetObligations(obligations, null)).toHaveLength(obligations.length);
  });
});

describe("nextBaseline", () => {
  it("writes the live unmet set, sorted and deduplicated, when no baseline exists yet", () => {
    expect(nextBaseline(null, ["b:case:RTL", "a:case:RTL", "b:case:RTL"])).toEqual({
      grown: [],
      baseline: ["a:case:RTL", "b:case:RTL"],
    });
  });

  it("shrinks freely", () => {
    expect(nextBaseline(["a:case:RTL", "b:case:RTL"], ["a:case:RTL"])).toEqual({
      grown: [],
      baseline: ["a:case:RTL"],
    });
  });

  it("names every entry that would grow the baseline so the caller can refuse", () => {
    const next = nextBaseline(["a:case:RTL"], ["a:case:RTL", "c:described:Idle"]);
    expect(next.grown).toEqual(["c:described:Idle"]);
  });
});

describe("story coverage ratchet", () => {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const obligations = deriveObligations(shipped);
  const readSource = (name: string) =>
    existsSync(storyFor(name)) ? readFileSync(storyFor(name), "utf8") : null;
  const unmet = collectUnmet(obligations, readSource).map((o) => o.key);
  const baseline: string[] = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : [];

  it("derives obligations of both kinds — a kind that derives zero is a broken rule, not a clean tree", () => {
    expect(obligations.filter((o) => o.kind === "case").length).toBeGreaterThan(0);
    expect(obligations.filter((o) => o.kind === "described").length).toBeGreaterThan(0);
  });

  it("no obligation is newly unmet (the baseline may only shrink)", () => {
    const fresh = unmet.filter((k) => !baseline.includes(k));
    expect(
      fresh,
      "Newly unmet story obligations. Write the case story, or record why it does not apply as `// case-skip: <Name> — <reason>` (story-conventions.md); a declared-state export needs a JSDoc description above it. The baseline is adoption-time debt and may only shrink — never add to it to go green.",
    ).toEqual([]);
  });

  it("the committed baseline holds no resolved entries (progress is locked in)", () => {
    const stale = baseline.filter((k) => !unmet.includes(k));
    expect(
      stale,
      "Baseline entries now pass — run `pnpm story-coverage:baseline` from apps/docs to lock the progress in.",
    ).toEqual([]);
  });
});
