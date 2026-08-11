import { describe, expect, it } from "vitest";

import { extractCvaCalls, findCvaViolations, findSingleStringViolations, isExempt } from "./token-rules.mjs";

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

describe("extractCvaCalls", () => {
  it("captures a call body across nested parentheses", () => {
    const calls = extractCvaCalls(`const v = cva("base", { variants: { a: { b: fn(1) } } });`);
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toContain("fn(1)");
  });
});

describe("findCvaViolations", () => {
  it("flags muted text in the base string against a muted bg in a variant value", () => {
    // The real ui/tabs.tsx shape.
    const src = [
      `const tabsListVariants = cva(`,
      `  "inline-flex text-muted-foreground rounded-lg",`,
      `  { variants: { variant: { default: "bg-muted", line: "bg-transparent" } } },`,
      `);`,
    ].join("\n");
    const out = findCvaViolations("tabs.tsx", src);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("bg-muted");
  });

  it("flags the inverse — muted bg in the base, muted text in a variant value", () => {
    const src = `cva("bg-muted p-2", { variants: { tone: { quiet: "text-muted-foreground" } } })`;
    expect(findCvaViolations("x.tsx", src)).toHaveLength(1);
  });

  it("does not pair two variant values with each other", () => {
    // Mutually exclusive: `default` and `line` never both apply.
    const src = `cva("p-2", { variants: { v: { default: "bg-muted", line: "text-muted-foreground" } } })`;
    expect(findCvaViolations("x.tsx", src)).toEqual([]);
  });

  it("does not double-report what the single-string rule already catches", () => {
    const src = `cva("text-muted-foreground bg-muted", { variants: { v: { a: "p-2" } } })`;
    expect(findCvaViolations("x.tsx", src)).toEqual([]);
  });

  it("reports each offending background once, not once per variant value", () => {
    const src = `cva("text-muted-foreground", { variants: { v: { a: "bg-muted", b: "bg-muted" } } })`;
    expect(findCvaViolations("x.tsx", src)).toHaveLength(1);
  });

  it("survives parentheses inside class strings", () => {
    // Idiomatic Tailwind arbitrary values are full of parens. These happen to
    // self-balance, but the scan must not depend on that.
    const src = `cva("text-muted-foreground [&:not(:first-child)]:mt-2", { variants: { v: { a: "bg-muted" } } })`;
    expect(findCvaViolations("x.tsx", src)).toHaveLength(1);
  });

  it("survives an unbalanced parenthesis in a comment inside the call", () => {
    const src = [
      `cva("text-muted-foreground", {`,
      `  // TODO (see GH-123`,
      `  variants: { v: { a: "bg-muted" } },`,
      `})`,
    ].join("\n");
    expect(findCvaViolations("x.tsx", src)).toHaveLength(1);
  });

  it("skips a call whose first argument is not a plain string literal", () => {
    // Promoting the first variant value to "base" would pair it against its
    // own mutually-exclusive siblings. Under-report instead.
    const arrayBase = `cva(["p-2"], { variants: { v: { a: "text-muted-foreground", b: "bg-muted" } } })`;
    expect(findCvaViolations("x.tsx", arrayBase)).toEqual([]);

    const templateBase =
      'cva(`p-2 ${x}`, { variants: { v: { a: "text-muted-foreground", b: "bg-muted" } } })';
    expect(findCvaViolations("x.tsx", templateBase)).toEqual([]);
  });

  it("reports both of two cva calls sharing one physical line", () => {
    const src = `const a = cva("text-muted-foreground", { variants: { v: { x: "bg-muted" } } }); const b = cva("text-muted-foreground", { variants: { v: { y: "bg-accent" } } });`;
    expect(findCvaViolations("x.tsx", src)).toHaveLength(2);
  });
});
