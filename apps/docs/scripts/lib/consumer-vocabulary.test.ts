import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MANIFEST } from "../../lib/catalog.manifest";
import { MARKETING_ITEMS } from "../../lib/marketing-catalog";
import { CONSUMER_STOCK_COLORS, CONSUMER_STOCK_VARS } from "./consumer-stock";
import {
  colorReads,
  customPropNames,
  marketingBlockNames,
  themeColorNames,
  varReads,
  vocabularyViolations,
} from "./consumer-vocabulary";

/** TOK-9, the consumer vocabulary. A registry source may reference a theme
 *  colour name only if a consumer's own `shadcn init` declares it (stock) or
 *  the item ships it in cssVars, transitively through `consumes`. Everything
 *  is resolved against the names the docs stylesheet declares: a name the
 *  docs app does not declare either is colourless here too and is somebody
 *  else's rule. The gap this closes: cssvars-liveness resolves reads against
 *  the docs stylesheet, which carries `--warning`, so `bg-warning` in an item
 *  that does not ship it passed liveness and shipped colourless. */

const docsCss = readFileSync("app/globals.css", "utf8");
const marketingCss = readFileSync("app/marketing.css", "utf8");
const declaredColors = themeColorNames(docsCss + marketingCss);
const declaredVars = customPropNames(docsCss + marketingCss);
const stockColors = new Set<string>(CONSUMER_STOCK_COLORS);
const stockVars = new Set<string>(CONSUMER_STOCK_VARS);

const shipped = MANIFEST.filter((i) => i.status === "shipped");
const byName = new Map(shipped.map((i) => [i.name, i]));

function cssVarNames(item: (typeof shipped)[number] | undefined): { colors: string[]; vars: string[] } {
  if (!item?.cssVars) return { colors: [], vars: [] };
  const colors: string[] = [];
  const vars: string[] = [];
  for (const [group, entries] of Object.entries(item.cssVars)) {
    for (const key of Object.keys(entries ?? {})) {
      vars.push(`--${key}`);
      if (group === "theme" && key.startsWith("color-")) colors.push(key.slice("color-".length));
    }
  }
  return { colors, vars };
}

function transitiveConsumes(name: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  const item = byName.get(name);
  return (item?.consumes ?? []).flatMap((c) => [c, ...transitiveConsumes(c, seen)]);
}

function allowedFor(name: string): { colors: Set<string>; vars: Set<string> } {
  const colors = new Set(stockColors);
  const vars = new Set(stockVars);
  for (const n of [name, ...transitiveConsumes(name)]) {
    const own = cssVarNames(byName.get(n));
    own.colors.forEach((c) => colors.add(c));
    own.vars.forEach((v) => vars.add(v));
  }
  return { colors, vars };
}

function sourcesOf(item: (typeof shipped)[number]): string[] {
  const extra = (item.files ?? []).map((f) => f.path);
  return [`registry/super-ai/${item.name}.tsx`, ...extra].filter((p) => existsSync(p));
}

describe("consumer vocabulary (TOK-9)", () => {
  it("every shipped super-ai item reads only stock names or names it ships", () => {
    const failures: string[] = [];
    for (const item of shipped) {
      const allowed = allowedFor(item.name);
      for (const file of sourcesOf(item)) {
        const source = readFileSync(file, "utf8");
        const reads = [...colorReads(source, declaredColors), ...varReads(source, declaredVars)];
        for (const v of vocabularyViolations(reads, allowed)) failures.push(`${file}:${v.line} ${v.name}`);
      }
    }
    expect(
      failures,
      "names a consumer's shadcn init will not declare (ship them via cssVars on the item)",
    ).toEqual([]);
  });

  it("every marketing item reads only stock names or the shared block it ships", () => {
    const shared = marketingBlockNames(marketingCss, "shared");
    const failures: string[] = [];
    for (const item of MARKETING_ITEMS) {
      const file = `registry/marketing/${item.name}.tsx`;
      if (!existsSync(file)) continue;
      const source = readFileSync(file, "utf8");
      const ships = new RegExp(`^/\\* == ${item.name} == \\*/$`, "m").test(marketingCss);
      const allowed = {
        colors: new Set(stockColors),
        vars: new Set([...stockVars, ...(ships ? shared : [])]),
      };
      const reads = [...colorReads(source, declaredColors), ...varReads(source, declaredVars)];
      for (const v of vocabularyViolations(reads, allowed)) failures.push(`${file}:${v.line} ${v.name}`);
    }
    expect(failures, "marketing names ship only with an item that has its own css block").toEqual([]);
  });

  it("CONTROL: a docs-declared, non-stock stem in an item that does not ship it is a violation", () => {
    const source = `export function X() { return <div className="bg-warning text-warning-foreground" /> }`;
    const reads = colorReads(source, declaredColors);
    const v = vocabularyViolations(reads, { colors: stockColors, vars: stockVars });
    expect(v.map((x) => x.name).sort()).toEqual(["warning", "warning-foreground"]);
  });

  it("CONTROL: the same stem passes when the item ships it", () => {
    const source = `export function X() { return <div className="bg-warning" /> }`;
    const reads = colorReads(source, declaredColors);
    const v = vocabularyViolations(reads, { colors: new Set([...stockColors, "warning"]), vars: stockVars });
    expect(v).toEqual([]);
  });

  it("CONTROL: a name the docs stylesheet does not declare is not this rule's business", () => {
    const source = `export function X() { return <div className="bg-surface-card" /> }`;
    expect(colorReads(source, declaredColors)).toEqual([]);
  });

  it("CONTROL: var() reads resolve the same way, including the text-(--x) shorthand", () => {
    const source = `const s = "text-(--warning) [background:var(--marketing-pulse-color)] bg-(--background)"`;
    const reads = varReads(source, declaredVars);
    const v = vocabularyViolations(reads, { colors: stockColors, vars: stockVars });
    expect(v.map((x) => x.name).sort()).toEqual(["--marketing-pulse-color", "--warning"]);
  });
});
