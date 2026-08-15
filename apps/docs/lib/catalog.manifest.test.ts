import { describe, expect, it } from "vitest";
import { MANIFEST } from "./catalog.manifest";
import { LIB_MANIFEST } from "./lib.manifest";
import { shippedItems } from "./manifest-types";

describe("MANIFEST", () => {
  it("carries every catalog row, including the cut records", () => {
    // 116 active + family G's 10 cut rows + the cut O5 `flow-shell` = 127.
    // (107 + family G/O5 = 118 before PR #14 / D14-D17 added 7 rows: D7
    // `slot-summary`, K7 `answer-block`, K8 `source-cards`, N9
    // `autonomy-selector`, N10 `safety-block`, N11 `escalation-handoff`, N12
    // `task-tray`. D18 then added family P's two items.)
    expect(MANIFEST).toHaveLength(127);
  });

  it("holds the A–O freeze at 114 while family P grows separately", () => {
    // The freeze that matters is per-family, not the grand total: D18 added
    // family P from the second reference board, and the catalog-completion
    // spec's ruling was that such a family is counted alongside A–O rather
    // than reopening them. Asserting the two halves separately is what keeps
    // "the 114 is frozen" a checkable claim instead of a comment.
    const active = MANIFEST.filter((i) => i.status !== "cut");
    expect(active.filter((i) => i.family !== "P")).toHaveLength(114);
    expect(active.filter((i) => i.family === "P")).toHaveLength(2);
    expect(active).toHaveLength(116);
  });

  // The 14 components that shipped before Wave 1.5. They were exempt from the
  // story-state and documentation contracts until a retrofit covered them —
  // wave 0 batch B of the story-guarantees program
  // (docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md).
  // All 14 now carry normalized states, per-state stories, case stories and a
  // guidance module. The list survives as a ratchet: re-exempting any of these
  // must fail loudly.
  const LEGACY = [
    "choice-chips",
    "cost-chip",
    "date-section",
    "entity-row",
    "field-row",
    "filter-bar",
    "gen-settings-bar",
    "kbd",
    "preview-tile",
    "reset-affordance",
    "section-header",
    "shortcuts-sheet",
    "stat-readout",
    "thread-list",
  ];

  // The 11 components PR #14 (main) shipped straight to `main` using the old
  // hand-wired demos/catalog/registry-extras approach, merged into this
  // branch's generated pipeline after the fact. They predated this branch's
  // Dialog-contract retrofit (per-state stories + guidance modules) and were
  // exempt alongside LEGACY until a retrofit covered them.
  //
  // That retrofit is wave 0 batch A of the story-guarantees program
  // (docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md):
  // all 11 now carry normalized states, per-state stories, case stories and a
  // guidance module, so their exemption is gone. They keep their own list here
  // because "no longer exempt" is itself a property worth pinning — the set is
  // a ratchet, and re-exempting one of these must fail loudly.
  const MAIN_PR14 = [
    "answer-block",
    "autonomy-selector",
    "citation-ref",
    "credits-indicator",
    "escalation-handoff",
    "pricing-table",
    "quota-meter",
    "safety-block",
    "slot-summary",
    "source-cards",
    "task-tray",
  ];

  it("keeps every pre-Wave-1.5 component shipped", () => {
    const shipped = new Set(shippedItems(MANIFEST).map((i) => i.name));
    for (const name of LEGACY) expect(shipped.has(name)).toBe(true);
  });

  it("keeps every PR #14 component shipped", () => {
    const shipped = new Set(shippedItems(MANIFEST).map((i) => i.name));
    for (const name of MAIN_PR14) expect(shipped.has(name)).toBe(true);
  });

  it("exempts nothing at all", () => {
    // Exemption is a closed set that may only shrink, and wave 0 shrank it to
    // zero: batch A retrofitted the 11 PR #14 components, batch B the legacy
    // 14. Every shipped component now meets the story-state and documentation
    // contracts in full, so `contractExempt` has no members left.
    //
    // Keep this assertion even though the flag is unused. A new component must
    // never be born exempt — that is how a gate quietly stops gating — and an
    // empty expectation is what makes the next `contractExempt: true` fail
    // loudly instead of passing as "one more legacy item".
    expect(MANIFEST.filter((i) => i.contractExempt).map((i) => i.name)).toEqual([]);
  });

  it("never re-exempts a component the retrofit already freed", () => {
    // The ratchet. Wave 0 brought all 25 up to the full contract; restoring
    // `contractExempt` to any of them would silently un-gate a component that
    // already has the stories and guidance the flag excuses.
    const exempt = new Set(MANIFEST.filter((i) => i.contractExempt).map((i) => i.name));
    for (const name of [...LEGACY, ...MAIN_PR14]) expect(exempt.has(name)).toBe(false);
  });

  it("holds every newly shipped component to the full contract", () => {
    // Blocks are excluded here, not exempted: a shell is a layout, not a state
    // machine, so it declares `regions` where a component declares `states` —
    // and check-contract.mts's block branch asserts the regions instead. Split
    // out when O2 `chat-shell` shipped and this assertion, which predates the
    // block layer having any shipped members, failed on `states: []`.
    const newlyShipped = shippedItems(MANIFEST).filter((i) => !i.contractExempt && i.layer !== "block");
    expect(newlyShipped.length).toBeGreaterThan(0);
    for (const item of newlyShipped) {
      expect(item.states.length).toBeGreaterThan(0);
    }

    // specAnchor is static data pointing at a spec file — it must be correct
    // for every manifest row regardless of status. A `planned` or `cut` row
    // with a wrong anchor is exactly the bug this suite exists to catch, so
    // this checks the full MANIFEST, not just shipped items. Guarded against
    // a vacuous pass: fail loudly if the manifest is empty or the block
    // layer disappears, rather than passing over an empty set.
    expect(MANIFEST.length).toBeGreaterThan(0);
    const blocks = MANIFEST.filter((i) => i.layer === "block");
    expect(blocks.length).toBeGreaterThan(0);
    for (const item of MANIFEST) {
      if (item.layer === "block") {
        expect(item.specAnchor).toMatch(/^block-specs\.md#/);
      } else {
        expect(item.specAnchor).toMatch(/^component-specs\.md#/);
      }
    }
  });

  it("holds every shipped block to the region contract instead", () => {
    // The other half of the split above, so excluding blocks from the `states`
    // assertion cannot become a hole a shell slips through declaring nothing.
    const shippedBlocks = shippedItems(MANIFEST).filter((i) => i.layer === "block");
    expect(shippedBlocks.length).toBeGreaterThan(0);
    for (const item of shippedBlocks) {
      expect(item.regions ?? [], `${item.name} regions`).not.toHaveLength(0);
      // A block that composes nothing reimplemented its parts.
      expect(item.consumes, `${item.name} consumes`).not.toHaveLength(0);
      // Regions replace states; carrying both would mean two contracts.
      expect(item.states, `${item.name} states`).toHaveLength(0);
    }
  });

  it("cuts family G", () => {
    expect(MANIFEST.filter((i) => i.family === "G").every((i) => i.status === "cut")).toBe(true);
  });

  it("has unique names", () => {
    const names = MANIFEST.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("declares only consumable dependencies that exist", () => {
    // registry:lib contracts (LIB_MANIFEST) are installable registry items in
    // the same directory, so they are legal `consumes` targets even though
    // they are not catalog components — see LibManifestItem in
    // manifest-types.ts for why they are held in a separate manifest.
    const names = new Set([...MANIFEST.map((i) => i.name), ...LIB_MANIFEST.map((i) => i.name)]);
    for (const item of MANIFEST) {
      for (const dep of item.consumes) expect(names.has(dep), `${item.name} consumes ${dep}`).toBe(true);
    }
  });
});

// Pins the wave assignment against decisions.md §5 ("Revised sequencing
// proposal"), where each wave ships a family's components plus the one block
// that proves them — so a block's wave is almost never its family's wave, and
// family N is split (N1/N3 land with D in wave 3; N4-N6 land with
// `records-shell` in wave 11).
describe("MANIFEST wave assignment (decisions.md §5)", () => {
  const byId = (id: string) => MANIFEST.find((i) => i.id === id)!;

  it("places each block in the wave whose components it proves", () => {
    const wavesById: Record<string, number> = {
      O1: 2, // home-shell — wave 2 (B + C)
      O2: 3, // chat-shell — wave 3 (D)
      O3: 6, // studio-shell — wave 6 (I + H)
      O4: 6, // timeline-shell — wave 6 (I + H)
      O6: 4, // generation-shell — wave 4 (E + F)
      O7: 7, // library-shell — wave 7 (J)
      O8: 7, // explore-shell — wave 7 (J)
      O9: 7, // artifact-shell — wave 7 (J)
      O10: 11, // records-shell — wave 11 (N4-N6)
      O11: 8, // docs-shell — wave 8 (K)
      O12: 10, // settings-shell — wave 10 (M)
      O13: 8, // notebook-shell — wave 8 (K)
      O14: 12, // auth-shell — wave 12
    };
    for (const [id, wave] of Object.entries(wavesById)) {
      expect(byId(id).wave).toBe(wave);
    }
  });

  it("places N1 `feedback` and N3 `disclaimer-note` in wave 3 with D, not family N's default", () => {
    expect(byId("N1").wave).toBe(3);
    expect(byId("N3").wave).toBe(3);
  });

  it("gives every cut item wave 0, regardless of family or id", () => {
    expect(MANIFEST.filter((i) => i.status === "cut").every((i) => i.wave === 0)).toBe(true);
  });
});
