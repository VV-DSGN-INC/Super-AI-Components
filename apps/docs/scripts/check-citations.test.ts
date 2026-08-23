import { describe, expect, it } from "vitest";

import { ALLOWED_TERMS, classifySpan, extractCitations, slotTargets } from "./lib/citation-scan";

describe("classifySpan", () => {
  it("labels tailwind-prefixed and slash-step spans utilities", () => {
    expect(classifySpan("text-muted-foreground")).toBe("utility");
    expect(classifySpan("text-foreground/60")).toBe("utility");
    expect(classifySpan("focus-visible")).toBe("utility");
    expect(classifySpan("pointer-events-none")).toBe("utility");
    expect(classifySpan("line-clamp-2")).toBe("utility");
  });
  it("labels bare kebab spans names", () => {
    expect(classifySpan("entity-row")).toBe("name");
    expect(classifySpan("account-menu-item")).toBe("name");
  });
  it("passes allow-listed vocabulary and ignores runtime attributes", () => {
    expect(classifySpan("scrollable-region-focusable")).toBe("allowed");
    expect(classifySpan("nested-interactive")).toBe("allowed");
    expect(classifySpan("aria-pressed")).toBe("ignored");
    expect(classifySpan("data-state")).toBe("ignored");
    expect(classifySpan("kbd")).toBe("ignored"); // single word, no hyphen
  });
});

describe("extractCitations", () => {
  it("walks claim fields and skips donts/pitfalls", () => {
    const docs = {
      whatItIs: "uses `text-foreground/60` captions",
      usage: "compose with `entity-row` rows",
      dos: [{ text: "keep `size-icon` glyphs" }],
      donts: [{ text: "never `text-muted-foreground` here" }],
      pitfalls: ["reaching for `bg-muted` under this"],
      accessibility: { keyboard: ["`focus-visible` ring on tab"], screenReader: [] },
      anatomy: [{ slot: "x", note: "shows a `preview-tile` child" }],
    };
    const spans = extractCitations(docs).map((c) => c.span);
    expect(spans).toContain("text-foreground/60");
    expect(spans).toContain("entity-row");
    expect(spans).toContain("preview-tile");
    expect(spans).not.toContain("text-muted-foreground");
    expect(spans).not.toContain("bg-muted");
  });
});

describe("slotTargets", () => {
  it("collects literal and template-prefix data-slots", () => {
    const src = 'a data-slot="approval-card" b data-slot={`approval-card-${verb}`} c';
    const t = slotTargets(src);
    expect(t.literals.has("approval-card")).toBe(true);
    expect(t.prefixes).toContain("approval-card-");
  });
  it("collects data-region literals for the shell convention", () => {
    const t = slotTargets('<div data-region="sidebar" /> <div data-region="topbar" />');
    expect(t.regions.has("sidebar")).toBe(true);
    expect(t.regions.has("topbar")).toBe(true);
  });
  it("collects ternary literals and slot props", () => {
    const src =
      'x data-slot={thumbnail ? "chip-thumbnail" : "chip-icon"} y <Track slot="mixer-volume" />';
    const t = slotTargets(src);
    expect(t.literals.has("chip-thumbnail")).toBe(true);
    expect(t.literals.has("chip-icon")).toBe(true);
    expect(t.literals.has("mixer-volume")).toBe(true);
  });
});

describe("the allow-list is deliberate", () => {
  it("holds only reviewed vocabulary", () => {
    expect([...ALLOWED_TERMS]).toEqual([
      "scrollable-region-focusable",
      "nested-interactive",
      "landmark-unique",
      "ew-resize",
      "in-out",
    ]);
  });
});
