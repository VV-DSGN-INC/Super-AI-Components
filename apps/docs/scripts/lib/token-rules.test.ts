import { describe, expect, it } from "vitest";

import { findSingleStringViolations, isExempt } from "./token-rules.mjs";

describe("findSingleStringViolations", () => {
  it("flags muted text and a muted background in one class string", () => {
    const out = findSingleStringViolations("x.tsx", `<p className="text-muted-foreground bg-muted" />`);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("bg-muted");
  });

  it("flags opacity variants of the background", () => {
    const out = findSingleStringViolations("x.tsx", `<p className="text-muted-foreground bg-accent/50" />`);
    expect(out).toHaveLength(1);
  });

  it("does not merge the two branches of a ternary", () => {
    // Mutually exclusive at runtime — sidebar-nav.tsx's active vs. inactive rows.
    const src = `className={active ? "bg-muted" : "text-muted-foreground"}`;
    expect(findSingleStringViolations("x.tsx", src)).toEqual([]);
  });

  it("ignores variant-prefixed backgrounds", () => {
    // filter-bar.tsx pairs bare muted text with hover:bg-accent, but the same
    // hover rule swaps the text too — they are never on screen together.
    const src = `className="text-muted-foreground hover:bg-accent"`;
    expect(findSingleStringViolations("x.tsx", src)).toEqual([]);
  });

  it("treats preview-tile.tsx as contrast-exempt", () => {
    expect(isExempt("registry/super-ai/preview-tile.tsx")).toBe(true);
    expect(isExempt("registry/super-ai/entity-row.tsx")).toBe(false);
  });
});
