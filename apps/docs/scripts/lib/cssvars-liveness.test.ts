import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MANIFEST } from "../../lib/catalog.manifest"; // match check-contract.mts's exact import
import { stripComments } from "./contract-rules";

/** Liveness, both directions (spec §5). Forward: every CSS variable a shipped
 *  component READS must resolve somewhere real — otherwise `npx shadcn add`
 *  ships a colourless component (manifest-types.ts documents exactly this
 *  failure). Reverse: a declared cssVars key nobody reads is dead weight. */

const STOCK_CSS = ["app/globals.css", "app/marketing.css"];
const BASELINE = "cssvars-liveness.baseline.json";

const stockVars = new Set<string>(
  STOCK_CSS.flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]),
  ),
);

const fileFor = (name: string) => `registry/super-ai/${name}.tsx`;
const shipped = MANIFEST.filter((i) => i.status === "shipped");
const byName = new Map(shipped.map((i) => [i.name, i]));

function sourcesOf(item: (typeof shipped)[number]): string[] {
  const extra = (item.files ?? []).map((f) => f.path);
  return [fileFor(item.name), ...extra].filter((p) => existsSync(p));
}

function readsOf(source: string): Set<string> {
  const out = new Set<string>();
  for (const m of source.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) out.add(m[1]);
  for (const m of source.matchAll(/(?<!var)\((--[a-zA-Z0-9-]+)\)/g)) out.add(m[1]); // text-(--x) shorthand
  return out;
}

function declaresOf(source: string): Set<string> {
  const out = new Set<string>();
  for (const m of source.matchAll(/\[(--[a-zA-Z0-9-]+):/g)) out.add(m[1]); // [--x:...] arbitrary property
  for (const m of source.matchAll(/["'](--[a-zA-Z0-9-]+)["']\s*:/g)) out.add(m[1]); // style={{ "--x": … }}
  return out;
}

function cssVarKeys(item: (typeof shipped)[number] | undefined): string[] {
  if (!item?.cssVars) return [];
  return Object.values(item.cssVars).flatMap((group) => Object.keys(group ?? {}));
}

function transitiveConsumes(name: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  const item = byName.get(name);
  return (item?.consumes ?? []).flatMap((c) => [c, ...transitiveConsumes(c, seen)]);
}

const baseline: string[] = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : [];

/** Computed once, at module scope — both `it`s below read this same result
 *  instead of the first populating shared mutable state the second depends
 *  on having run after it (order-dependent before this change). */
function computeFailures(): string[] {
  const out: string[] = [];
  for (const item of shipped) {
    const sources = sourcesOf(item).map((p) => readFileSync(p, "utf8"));
    const reads = new Set(sources.flatMap((s) => [...readsOf(s)]));
    const declares = new Set(sources.flatMap((s) => [...declaresOf(s)]));
    const resolvable = new Set([
      ...stockVars,
      ...declares,
      ...cssVarKeys(item),
      ...transitiveConsumes(item.name).flatMap((c) => cssVarKeys(byName.get(c))),
    ]);
    for (const v of reads) {
      if (!resolvable.has(v)) out.push(`${item.name}:${v} (read, resolves nowhere)`);
    }
    for (const key of cssVarKeys(item)) {
      // Boundary-guarded: `--warning` must not count as read just because
      // `--warning-foreground` appears. Comment-stripped: a `--key` mentioned
      // only in a comment (not live code) is not a read either.
      const keyRe = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
      const referenced = sources.some((s) => keyRe.test(stripComments(s)));
      if (!referenced) out.push(`${item.name}:${key} (declared in cssVars, read by nothing)`);
    }
  }
  return out;
}

const failures = computeFailures();

describe("cssVars liveness", () => {
  it("every var a shipped item reads resolves; every declared cssVars key is read", () => {
    const fresh = failures.filter((f) => !baseline.includes(f));
    expect(
      fresh,
      "cssVars liveness failures. Real bug → fix the component or its manifest cssVars. Pre-existing and deferred → hand-add to cssvars-liveness.baseline.json in a reviewed commit (shrink-only thereafter).",
    ).toEqual([]);
  });

  it("the committed baseline holds no resolved entries (it may only shrink)", () => {
    const stale = baseline.filter((b) => !failures.includes(b));
    expect(stale, "Baseline entries now pass — remove them (the ratchet locks progress in)").toEqual([]);
  });
});
