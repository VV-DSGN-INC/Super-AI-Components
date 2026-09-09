# Preset Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove every registry item renders and passes axe under shadcn presets it has never seen, and gate the two source-level couplings that make that fail silently.

**Architecture:** The consumer install test becomes row-driven: a row is a `{ base, preset values }` record whose code the shadcn CLI's own `encodePreset` derives, and the script scaffolds a consumer on that preset, installs everything, mounts the docs demos on `/harness/<name>` routes, builds, and runs Playwright + axe in light and dark with screenshots. Failures are baselined shrink-only. Two rule records land beside it: `TOK-9` (consumer vocabulary, a vitest gate the record delegates to) and `LAY-2` (numeric arbitrary radius, a grep blocker).

**Tech Stack:** pnpm 11.1.0, Node 24, turbo, tsx, vitest 4, Playwright 1.60, `@axe-core/playwright` 4.13.0, shadcn CLI 4.11.0 (`shadcn/preset`), Next.js 16 (consumer scaffold via create-next-app).

**Spec:** [`docs/superpowers/specs/2026-09-09-preset-harness-design.md`](../specs/2026-09-09-preset-harness-design.md)

## Global Constraints

- Run every gate **from the repo root**; the per-workspace scripts skip two workspaces.
- `apps/docs/lib/catalog.manifest.ts` is the one shared file. Only the integrator edits it, and only to add `cssVars` where Task 4 finds a real violation.
- Baselines may only shrink. `apps/docs/harness/baseline.json` joins that rule; its first write per row is the one exception.
- Never pair a bare `text-muted-foreground` with a bare `bg-muted` / `bg-accent` / `bg-secondary` in one class string.
- Write `GH-1234`, never `#1234`, in registry sources.
- Branch per task; the branch is `claude/preset-harness`, cut from `origin/main` at `578ca17`. Never commit to `main`.
- Gate order, which any gate list must mirror: `install --frozen-lockfile` → `lint` → `format:check` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke → Storybook a11y → consumer install test (row `default`) → **preset rows** (new, Task 8).
- The repo is `VV-DSGN-INC/Super-AI-Components`. Say the remote and branch out loud before any push.
- `packages/ds-rules/` is prettier-ignored (harvested provenance). Everything else must pass `pnpm format:check`.

---

### Task 1: Declare `registry.json` as a `build:registry` output

A turbo cache hit restores `public/r/**` and not `apps/docs/registry.json`, which `consumer-test.sh` reads. Warm local runs fail with "derived zero items".

**Files:**

- Modify: `turbo.json` (the `build:registry` task)

**Interfaces:**

- Consumes: nothing.
- Produces: nothing. Leaf task; Task 6's script depends on the file existing after a cache hit.

- [ ] **Step 1: Watch the bug**

```bash
pnpm exec turbo run build:registry --force >/dev/null && rm apps/docs/registry.json && pnpm exec turbo run build:registry | tail -3 && ls apps/docs/registry.json
```

Expected: turbo prints `FULL TURBO` (cache hit) and `ls` fails: `No such file or directory`.

- [ ] **Step 2: Add the output**

In `turbo.json`, change the `build:registry` task's `outputs` from `["public/r/**"]` to `["public/r/**", "registry.json"]`.

- [ ] **Step 3: Watch it pass**

```bash
pnpm exec turbo run build:registry --force >/dev/null && rm apps/docs/registry.json && pnpm exec turbo run build:registry | tail -3 && ls apps/docs/registry.json
```

Expected: `FULL TURBO` and `apps/docs/registry.json` listed.

- [ ] **Step 4: Commit**

```bash
git add turbo.json
git commit -m "fix(turbo): declare registry.json as a build:registry output

A cache hit restored public/r and not registry.json, which consumer-test.sh
reads to derive the item list; a warm local run failed with 'derived zero
items'. CI never caches, which is why it never showed there."
```

---

### Task 2: The `delegated` detection method

A rule whose detector needs TypeScript (the manifest) cannot run in `rulecheck.mjs`. `delegated` names the gate file that enforces it; the detector reports it as unchecked with that pointer, and the records test asserts the file exists.

**Files:**

- Modify: `packages/ds-rules/src/schema.ts`
- Modify: `packages/ds-rules/rulecheck.mjs:112-116`
- Modify: `packages/ds-rules/src/rulecheck.test.ts:17`
- Modify: `packages/ds-rules/src/records.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `detect: { method: "delegated"; gate: string; how: string }` on `Rule`, consumed by Task 4's `TOK-9` record. `scan()` reports it as `{ id, reason: "delegated", how, gate }` in `unchecked`.

- [ ] **Step 1: Write the failing records test**

Append to `packages/ds-rules/src/records.test.ts`, inside `describe("rule records")`:

```ts
it("every delegated rule names a gate file that exists", async () => {
  const { existsSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const delegated = all().filter((r) => r.detect.method === "delegated");
  for (const rule of delegated) {
    const d = rule.detect as { method: "delegated"; gate: string };
    const abs = fileURLToPath(new URL(`../../../${d.gate}`, import.meta.url));
    expect(existsSync(abs), `${rule.id} delegates to ${d.gate}, which does not exist`).toBe(true);
  }
});
```

And in the same file's "every grep/heuristic rule has a known-bad and a known-good fixture" test, extend the skip line to:

```ts
if (
  rule.detect.method === "rendered" ||
  rule.detect.method === "judgment" ||
  rule.detect.method === "delegated"
)
  continue;
```

- [ ] **Step 2: Run it and watch it fail on the type**

```bash
pnpm --filter ds-rules typecheck
```

Expected: an error on `r.detect.method === "delegated"` — `This comparison appears to be unintentional` — because the union has no such member yet.

- [ ] **Step 3: Extend the schema**

In `packages/ds-rules/src/schema.ts`, bump `CATALOGUE_VERSION` from `1` to `2`, add after `judgmentDetect`:

```ts
const delegatedDetect = z.object({
  method: z.literal("delegated"),
  /** Repo-relative path of the test file whose assertions are this rule's
   *  teeth. Exists because a detector that needs TypeScript (the manifest)
   *  cannot run inside the dependency-free rulecheck; records.test.ts asserts
   *  the file is there, so a rule cannot delegate into a void. */
  gate: z.string().min(1),
  /** What the gate checks, printed on every run's unchecked line. */
  how: z.string().min(1),
});
```

and add `delegatedDetect` to the `detectSchema` discriminated union.

- [ ] **Step 4: Teach the detector**

In `packages/ds-rules/rulecheck.mjs`, replace the rendered/judgment branch in `scan()` with:

```js
    if (d.method === "rendered" || d.method === "judgment" || d.method === "delegated") {
      unchecked.push({ id: rule.id, reason: d.method, how: d.how, ...(d.gate ? { gate: d.gate } : {}) });
      continue;
    }
```

And in `main()`'s text output, change the unchecked line to:

```js
if (u.how) process.stdout.write(`unchecked ${u.id} (${u.reason}${u.gate ? `: ${u.gate}` : ""}): ${u.how}\n`);
```

In `packages/ds-rules/src/rulecheck.test.ts`, extend the fixture-suite filter:

```ts
const rules = loadRules().filter(
  (r) => r.detect.method !== "rendered" && r.detect.method !== "judgment" && r.detect.method !== "delegated",
);
```

and the control test's map to leave delegated rules untouched as well:

```ts
      r.detect.method === "rendered" || r.detect.method === "judgment" || r.detect.method === "delegated"
        ? r
        : { ...r, detect: { ...r.detect, scope: [FIXTURES] } },
```

- [ ] **Step 5: Re-emit and run the package suite**

```bash
pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules typecheck && pnpm --filter ds-rules test
```

Expected: PASS. The emit test rewrites both JSON files with `"version": 2`. If `hook-mirror.test.ts` pins a rule list, it is unchanged by this task (no rule was added yet).

- [ ] **Step 6: Commit**

```bash
git add packages/ds-rules
git commit -m "feat(ds-rules): delegated detection method

A rule whose detector needs the manifest cannot run in the dependency-free
rulecheck. delegated names the vitest gate that enforces it; scan() reports
it unchecked with that pointer, and records.test.ts asserts the file exists.
Same method Super Mobile DS carries; first schema convergence step."
```

---

### Task 3: `LAY-2`, numeric arbitrary radius, and the three sites

**Files:**

- Modify: `packages/ds-rules/src/local.ts` (append a record)
- Create: `packages/ds-rules/__fixtures__/LAY-2/bad/case.tsx`
- Create: `packages/ds-rules/__fixtures__/LAY-2/good/case.tsx`
- Modify: `apps/docs/registry/super-ai/time-ruler.tsx:184,375`
- Modify: `apps/docs/registry/super-ai/coach-mark.tsx:256`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing downstream. Leaf task.

- [ ] **Step 1: Write the fixtures**

`packages/ds-rules/__fixtures__/LAY-2/bad/case.tsx`:

```tsx
export function Bad() {
  return <span className="bg-primary size-2 rotate-45 rounded-[2px]" />;
}
```

`packages/ds-rules/__fixtures__/LAY-2/good/case.tsx`:

```tsx
export function Good() {
  return (
    <>
      <span className="bg-primary size-2 rotate-45 rounded-xs" />
      <span className="rounded-[inherit] bg-card" />
    </>
  );
}
```

- [ ] **Step 2: Run the fixture suite and watch it fail on the missing record**

```bash
pnpm --filter ds-rules test
```

Expected: PASS still — a fixture directory without a record is not itself a failure. This step exists so the next one is the first red.

- [ ] **Step 3: Add the record**

Append to `LOCAL_RULES` in `packages/ds-rules/src/local.ts`, after `LAY-1`:

```ts
  {
    id: "LAY-2",
    title: "No numeric arbitrary radius in registry sources",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: "\\brounded(?:-[a-z]{1,2})?-\\[\\d",
      ...catalogGrep,
    },
    fix: "Snap to a scale step. rounded-xs (Tailwind's 2px, which shadcn's theme leaves untouched) for hairline marks; rounded-sm/md/lg for surfaces, so the consumer's radius setting reaches them. rounded-[inherit] stays legal: it defers to the parent.",
    why: "A consumer picks a radius on the create page and every shadcn surface follows it; a literal pixel radius is the one corner that does not. LAY-1 is judgment and never mechanised this case (preset-harness design §3.7).",
  },
```

- [ ] **Step 4: Emit, run, watch the tree-clean gate fail**

```bash
pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules test 2>&1 | tail -20
```

Expected: the fixture pair passes; "exit 0 and zero blockers on the current tree" FAILS with three `LAY-2` findings: `time-ruler.tsx:184`, `time-ruler.tsx:375`, `coach-mark.tsx:256`.

- [ ] **Step 5: Fix the three sites**

In `apps/docs/registry/super-ai/time-ruler.tsx` line 184, replace `rounded-[1px]` with `rounded-xs`. Line 375, replace `rounded-[2px]` with `rounded-xs`. In `apps/docs/registry/super-ai/coach-mark.tsx` line 256, replace `rounded-[2px]` with `rounded-xs`.

Then check nothing asserts the old strings:

```bash
grep -rn "rounded-\[" apps/docs/registry apps/storybook/src --include='*.tsx' | grep -v "rounded-\[inherit\]"
```

Expected: no output.

- [ ] **Step 6: Run the gates this touches**

```bash
pnpm --filter ds-rules test && pnpm check:tokens && pnpm --filter docs test
```

Expected: PASS; `check:tokens` prints `0 violation(s)`.

- [ ] **Step 7: Commit**

```bash
git add packages/ds-rules apps/docs/registry/super-ai/time-ruler.tsx apps/docs/registry/super-ai/coach-mark.tsx
git commit -m "feat(ds-rules): LAY-2 bans numeric arbitrary radius; three sites to rounded-xs

A consumer's radius setting reaches every shadcn surface except a literal
pixel corner. rounded-[inherit] stays legal by construction. The playhead
diamond, the slider thumb and the coach-mark arrow move to Tailwind's 2px
step, which shadcn's theme does not override, so nothing changes visually."
```

---

### Task 4: `TOK-9`, the consumer vocabulary gate

**Files:**

- Create: `apps/docs/scripts/lib/consumer-stock.ts`
- Create: `apps/docs/scripts/lib/consumer-vocabulary.ts`
- Create: `apps/docs/scripts/lib/consumer-vocabulary.test.ts`
- Modify: `packages/ds-rules/src/local.ts` (append the `TOK-9` record)
- Modify (only if the gate finds a real violation): `apps/docs/lib/catalog.manifest.ts`

**Interfaces:**

- Consumes: `delegated` from Task 2.
- Produces: `CONSUMER_STOCK_COLORS: readonly string[]` and `CONSUMER_STOCK_VARS: readonly string[]` from `consumer-stock.ts`, consumed by Task 6's `assert-stock.mts`. `themeColorNames(css)`, `customPropNames(css)`, `colorReads(source, declared)`, `varReads(source, declared)`, `vocabularyViolations(reads, allowed)` from `consumer-vocabulary.ts`.

- [ ] **Step 1: Write the stock list**

`apps/docs/scripts/lib/consumer-stock.ts`:

```ts
/** The colour roles every `shadcn init` writes, whatever the preset. Measured
 *  from the docs app's own generated stylesheet at 578ca17 (33 names, of
 *  which `warning` and `warning-foreground` are this registry's additions)
 *  and re-checked by the preset harness against every scaffolded consumer's
 *  globals.css (harness/assert-stock.mts), so a shadcn release that drops one
 *  fails there by name rather than shipping a colourless component.
 *
 *  `destructive-foreground` is deliberately absent: shadcn v4 removed it. */
export const CONSUMER_STOCK_COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

/** Custom properties a consumer's stylesheet is guaranteed to declare: the
 *  colour roles above as `--<role>`, plus `--radius`. Fonts are not listed
 *  because no registry source references a font family (design §2.1). */
export const CONSUMER_STOCK_VARS: readonly string[] = [
  ...CONSUMER_STOCK_COLORS.map((c) => `--${c}`),
  "--radius",
];
```

- [ ] **Step 2: Write the failing test**

`apps/docs/scripts/lib/consumer-vocabulary.test.ts`:

```ts
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
```

- [ ] **Step 3: Run it and watch it fail on the missing module**

```bash
pnpm --filter docs exec vitest run scripts/lib/consumer-vocabulary.test.ts
```

Expected: FAIL, `Failed to resolve import "./consumer-vocabulary"`.

- [ ] **Step 4: Write the detector**

`apps/docs/scripts/lib/consumer-vocabulary.ts`:

```ts
/** Detector half of TOK-9. Pure functions over source text; the test file
 *  owns the manifest lookups. Kept separate so harness/assert-stock.mts can
 *  reuse customPropNames on a scaffolded consumer's stylesheet. */

export interface Read {
  /** A colour stem (`warning`) or a custom property (`--warning`). */
  name: string;
  line: number;
  kind: "color" | "var";
}

export interface Allowed {
  colors: Set<string>;
  vars: Set<string>;
}

/** Stems of every `--color-<stem>:` declaration, wherever it sits. */
export function themeColorNames(css: string): Set<string> {
  return new Set([...css.matchAll(/--color-([a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
}

/** Every `--x:` declaration, `--` included. */
export function customPropNames(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
}

/** Custom properties declared inside one `/* == name == *\/` block of
 *  marketing.css — the slicing gen-registry.mts does to build cssVars. */
export function marketingBlockNames(css: string, block: string): Set<string> {
  const marker = /^\/\* == ([\w-]+) == \*\/$/gm;
  const starts: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(css))) starts.push({ name: m[1], index: m.index });
  const i = starts.findIndex((s) => s.name === block);
  if (i === -1) return new Set();
  const end = i + 1 < starts.length ? starts[i + 1].index : css.length;
  return customPropNames(css.slice(starts[i].index, end));
}

const COLOR_UTILITY =
  /(?<![\w-])(?:bg|text|border|ring|inset-ring|outline|fill|stroke|divide|decoration|caret|placeholder|accent|shadow|from|via|to)-([a-z][a-z0-9-]*)/g;

/** Colour-utility stems that resolve against `declared`. A stem the docs
 *  stylesheet does not declare (`text-left`, `bg-transparent`, `bg-surface-x`)
 *  is filtered out: it is either a Tailwind built-in or colourless everywhere. */
export function colorReads(source: string, declared: Set<string>): Read[] {
  const out: Read[] = [];
  source.split("\n").forEach((text, i) => {
    for (const m of text.matchAll(COLOR_UTILITY)) {
      if (declared.has(m[1])) out.push({ name: m[1], line: i + 1, kind: "color" });
    }
  });
  return out;
}

/** `var(--x)` and Tailwind's `(--x)` shorthand, filtered to `declared`. */
export function varReads(source: string, declared: Set<string>): Read[] {
  const out: Read[] = [];
  source.split("\n").forEach((text, i) => {
    for (const m of text.matchAll(/\((--[a-zA-Z0-9-]+)\)/g)) {
      if (declared.has(m[1])) out.push({ name: m[1], line: i + 1, kind: "var" });
    }
  });
  return out;
}

export function vocabularyViolations(reads: Read[], allowed: Allowed): Read[] {
  return reads.filter((r) => (r.kind === "color" ? !allowed.colors.has(r.name) : !allowed.vars.has(r.name)));
}
```

- [ ] **Step 5: Run the test against the live tree**

```bash
pnpm --filter docs exec vitest run scripts/lib/consumer-vocabulary.test.ts
```

Expected: the four CONTROL tests pass. The two tree tests either pass or list `file:line name` entries. Each listed entry is a real consumer bug: an item using `warning` without shipping it. Fix by attaching `WARNING_CSS_VARS` to that item's manifest entry (`cssVars: WARNING_CSS_VARS`, the shape the three quota components already carry), then `pnpm --filter docs build:registry` so the registry carries it, and re-run. If the entry is inside a component that `consumes` an item that ships the name, the transitive allowance covers it and nothing is listed.

- [ ] **Step 6: Add the record**

Append to `LOCAL_RULES` in `packages/ds-rules/src/local.ts`, after `LAY-2`:

```ts
  {
    id: "TOK-9",
    title: "Registry sources read only stock shadcn colour names or names their item ships",
    severity: "blocker",
    detect: {
      method: "delegated",
      gate: "apps/docs/scripts/lib/consumer-vocabulary.test.ts",
      how: "Every colour-utility stem and var(--x) read that resolves against the docs stylesheet must be stock shadcn (CONSUMER_STOCK_COLORS) or a cssVars key of the item, transitively through consumes. Needs the manifest, so it runs under pnpm test, not here.",
    },
    fix: "Ship the name with the item (cssVars on its manifest entry, the WARNING_CSS_VARS shape), or use the stock role it stands in for.",
    why: "Tailwind v4 emits nothing for an undefined utility. A name the docs app declares and a consumer's shadcn init does not ships a colourless component with a green build; cssvars-liveness resolves against the docs stylesheet and cannot see it (preset-harness design §1, §3.7).",
  },
```

- [ ] **Step 7: Emit and run every gate this touches**

```bash
pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules test && pnpm check:tokens && pnpm --filter docs test && pnpm typecheck && pnpm lint
```

Expected: PASS. `check:tokens` prints `unchecked TOK-9 (delegated: apps/docs/scripts/lib/consumer-vocabulary.test.ts): …` and `0 violation(s)`.

- [ ] **Step 8: Commit**

```bash
git add packages/ds-rules apps/docs/scripts/lib/consumer-stock.ts apps/docs/scripts/lib/consumer-vocabulary.ts apps/docs/scripts/lib/consumer-vocabulary.test.ts apps/docs/lib/catalog.manifest.ts
git commit -m "feat(gates): TOK-9, the consumer vocabulary

A registry source may reference a theme colour name only if a consumer's own
shadcn init declares it or the item ships it via cssVars. cssvars-liveness
resolves against the docs stylesheet, which carries --warning, so bg-warning
in an item that does not ship it passed and shipped colourless. Delegated
record; the teeth are a vitest gate under pnpm test."
```

(Drop `catalog.manifest.ts` from the `git add` if Step 5 found nothing.)

---

### Task 5: The preset rows

**Files:**

- Create: `apps/docs/harness/presets.ts`
- Create: `apps/docs/harness/presets.test.ts`
- Create: `apps/docs/harness/preset-code.mts`
- Create: `apps/docs/harness/items.ts`
- Modify: `apps/docs/vitest.config.ts` (add `harness/**/*.test.{ts,tsx}` to `include`)
- Modify: `apps/docs/package.json` (add `@axe-core/playwright` devDependency)

**Interfaces:**

- Consumes: nothing.
- Produces: `HARNESS_ROWS: readonly HarnessRow[]`, `rowById(id): HarnessRow`, `configFor(row): PresetConfig`, `codeFor(row): string`, `HARNESS_ITEMS: HarnessItem[]` (`{ name, kind: "super-ai" | "marketing" }`). `preset-code.mts <row>` prints `HARNESS_BASE=…`, `HARNESS_CODE=…`, `HARNESS_ROW=…` for `eval`; `preset-code.mts --list` prints row ids one per line.

- [ ] **Step 1: Add the dependency and the vitest glob**

```bash
pnpm --filter docs add -D @axe-core/playwright@4.13.0
```

In `apps/docs/vitest.config.ts`, add `"harness/**/*.test.{ts,tsx}",` to `test.include`.

- [ ] **Step 2: Write the failing test**

`apps/docs/harness/presets.test.ts`:

```ts
import { readFileSync } from "node:fs";

import {
  PRESET_BASES,
  PRESET_BASE_COLORS,
  PRESET_ICON_LIBRARIES,
  PRESET_RADII,
  PRESET_STYLES,
  PRESET_THEMES,
  decodePreset,
} from "shadcn/preset";
import { describe, expect, it } from "vitest";

import { HARNESS_ROWS, codeFor, configFor, rowById } from "./presets";

describe("preset rows", () => {
  it("ids are unique and filesystem-safe", () => {
    const ids = HARNESS_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("the default row is what `shadcn init --defaults` produces", () => {
    expect(codeFor(rowById("default"))).toBe("b0");
  });

  it("every row's code round-trips through the CLI's own decoder", () => {
    for (const row of HARNESS_ROWS) expect(decodePreset(codeFor(row))).toEqual(configFor(row));
  });

  it("every row value is in the CLI's vocabulary (a shadcn upgrade that renames one fails here by name)", () => {
    const vocab = {
      style: PRESET_STYLES,
      baseColor: PRESET_BASE_COLORS,
      theme: PRESET_THEMES,
      iconLibrary: PRESET_ICON_LIBRARIES,
      radius: PRESET_RADII,
    } as const;
    for (const row of HARNESS_ROWS) {
      expect(PRESET_BASES, `${row.id} base`).toContain(row.base);
      for (const [key, values] of Object.entries(vocab)) {
        const v = row.values[key as keyof typeof vocab];
        if (v !== undefined) expect(values as readonly string[], `${row.id} ${key}`).toContain(v);
      }
    }
  });

  it("the matrix moves every axis it exists to move", () => {
    const configs = HARNESS_ROWS.map(configFor);
    expect(new Set(HARNESS_ROWS.map((r) => r.base))).toEqual(new Set(["base", "radix"]));
    for (const key of ["style", "baseColor", "theme", "iconLibrary", "radius"] as const) {
      expect(new Set(configs.map((c) => c[key])).size, `no row moves ${key}`).toBeGreaterThan(1);
    }
  });

  it("ci.yml's presets matrix is exactly the non-default rows (a hand-written mirror that drifts is a gate that never runs)", () => {
    const ci = readFileSync("../../.github/workflows/ci.yml", "utf8");
    const m = ci.match(/row:\s*\[([^\]]+)\]/);
    expect(m, "no `row: [...]` matrix in ci.yml").not.toBeNull();
    const inCi = m![1]
      .split(",")
      .map((s) => s.trim())
      .sort();
    const expected = HARNESS_ROWS.map((r) => r.id)
      .filter((id) => id !== "default")
      .sort();
    expect(inCi).toEqual(expected);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
pnpm --filter docs exec vitest run harness/presets.test.ts
```

Expected: FAIL, `Failed to resolve import "./presets"`.

- [ ] **Step 4: Write the rows**

`apps/docs/harness/presets.ts`:

```ts
import { DEFAULT_PRESET_CONFIG, encodePreset, type PresetConfig } from "shadcn/preset";

/** A preset the harness scaffolds a consumer on. Rows are values, not codes:
 *  the code is derived with the CLI's own encoder, so a shadcn release that
 *  changes the encoding cannot leave a stale code here, and presets.test.ts
 *  pins every value to the CLI's vocabulary so a renamed option fails by
 *  name. The base library is not part of the code — shadcn keeps it as
 *  `init --base` — so it is a field of its own. */
export interface HarnessRow {
  /** The CI matrix key, the screenshot directory, the baseline key prefix. */
  id: string;
  base: "base" | "radix";
  /** Axes moved off DEFAULT_PRESET_CONFIG. */
  values: Partial<PresetConfig>;
  why: string;
}

export const HARNESS_ROWS: readonly HarnessRow[] = [
  {
    id: "default",
    base: "base",
    values: {},
    why: "What `shadcn init --defaults` produces; the row the consumer install test always ran.",
  },
  {
    id: "radix-violet-large",
    base: "radix",
    values: { theme: "violet", radius: "large" },
    why: "Radix primitives beside the registry's direct Base UI imports, a coloured accent, and a radius the components do not draw themselves.",
  },
  {
    id: "vega-stone-emerald-tabler-small",
    base: "base",
    values: { style: "vega", baseColor: "stone", theme: "emerald", iconLibrary: "tabler", radius: "small" },
    why: "A second component style, a warm neutral, a second colour, a non-Lucide icon set for the consumer's own ui files, and a tight radius.",
  },
];

export function configFor(row: HarnessRow): PresetConfig {
  return { ...DEFAULT_PRESET_CONFIG, ...row.values };
}

export function codeFor(row: HarnessRow): string {
  return encodePreset(configFor(row));
}

export function rowById(id: string): HarnessRow {
  const row = HARNESS_ROWS.find((r) => r.id === id);
  if (!row)
    throw new Error(`unknown harness row "${id}" — known: ${HARNESS_ROWS.map((r) => r.id).join(", ")}`);
  return row;
}
```

`apps/docs/harness/preset-code.mts`:

```ts
// Shell seam for consumer-test.sh: `eval "$(pnpm exec tsx harness/preset-code.mts <row>)"`
// exports HARNESS_BASE / HARNESS_CODE / HARNESS_ROW; `--list` prints row ids.
import { HARNESS_ROWS, codeFor, rowById } from "./presets";

const arg = process.argv[2];
if (arg === "--list") {
  for (const r of HARNESS_ROWS) console.log(r.id);
} else {
  const row = rowById(arg ?? "default");
  console.log(`HARNESS_BASE=${row.base}`);
  console.log(`HARNESS_CODE=${codeFor(row)}`);
  console.log(`HARNESS_ROW=${row.id}`);
}
```

`apps/docs/harness/items.ts`:

```ts
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

export interface HarnessItem {
  name: string;
  kind: "super-ai" | "marketing";
}

const demoFor = (name: string) =>
  fileURLToPath(new URL(`../components/demos/${name}-demo.tsx`, import.meta.url));

/** Every item the docs app can demo. Lib items (cost, initials, use-view-mode)
 *  have no demo and nothing to render; they are installed but not visited. */
export const HARNESS_ITEMS: HarnessItem[] = [
  ...CATALOG_ITEMS.filter((i) => existsSync(demoFor(i.name))).map((i) => ({
    name: i.name,
    kind: "super-ai" as const,
  })),
  ...MARKETING_ITEMS.filter((i) => existsSync(demoFor(i.name))).map((i) => ({
    name: i.name,
    kind: "marketing" as const,
  })),
];
```

- [ ] **Step 5: Run the test; the ci.yml assertion is expected red until Task 8**

```bash
pnpm --filter docs exec vitest run harness/presets.test.ts
```

Expected: five pass, one fails: `no row: [...] matrix in ci.yml`. That is Task 8's job; leave it red, it is the reminder.

- [ ] **Step 6: Check the shell seam and the item count**

```bash
cd apps/docs && pnpm exec tsx harness/preset-code.mts radix-violet-large && pnpm exec tsx harness/preset-code.mts --list && pnpm exec tsx -e "import('./harness/items.ts').then(m => console.log(m.HARNESS_ITEMS.length))" && cd ../..
```

Expected: `HARNESS_BASE=radix`, `HARNESS_CODE=b5ONXM`, `HARNESS_ROW=radix-violet-large`, then three ids, then `131`.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/harness/presets.ts apps/docs/harness/presets.test.ts apps/docs/harness/preset-code.mts apps/docs/harness/items.ts apps/docs/vitest.config.ts apps/docs/package.json pnpm-lock.yaml
git commit -m "feat(harness): preset rows as values, codes from the CLI's own encoder

Three rows span base library, style, base colour, theme, icon library and
radius. A coverage test keeps every axis moved; a vocabulary test pins each
value to shadcn/preset's own lists so an upgrade that renames one fails by
name. The ci.yml mirror test stays red until the matrix job lands."
```

---

### Task 6: The row-driven scaffold

`consumer-test.sh` keeps its name and gains a `ROW` argument, a stock-vocabulary assertion on the generated stylesheet, the demo routes, and the build. Playwright comes in Task 7; this task ends with a consumer that builds with every demo mounted.

**Files:**

- Rewrite: `apps/docs/scripts/consumer-test.sh`
- Create: `apps/docs/harness/assert-stock.mts`
- Create: `apps/docs/harness/scaffold-consumer.mts`
- Modify: `.gitignore` (add `apps/docs/harness/out/`)

**Interfaces:**

- Consumes: `preset-code.mts` (Task 5), `CONSUMER_STOCK_VARS` (Task 4), `HARNESS_ITEMS` (Task 5).
- Produces: a consumer app under `$TMP/consumer` with `/harness` (index) and `/harness/<name>` routes, each wrapping its demo in `<main data-harness-item="<name>">`; the server on `127.0.0.1:4849` is Task 7's target. `KEEP_CONSUMER=1` leaves the directory in place and prints its path.

- [ ] **Step 1: Write the stock assertion**

`apps/docs/harness/assert-stock.mts`:

```ts
// Fails when a scaffolded consumer's stylesheet lacks a name CONSUMER_STOCK_VARS
// promises. This is what keeps the list honest: TOK-9 trusts it, and a shadcn
// release that drops a role would otherwise turn a passing gate into a lie.
import { readFileSync } from "node:fs";

import { CONSUMER_STOCK_VARS } from "../scripts/lib/consumer-stock";
import { customPropNames } from "../scripts/lib/consumer-vocabulary";

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx harness/assert-stock.mts <consumer>/app/globals.css");
  process.exit(2);
}
const declared = customPropNames(readFileSync(file, "utf8"));
const missing = CONSUMER_STOCK_VARS.filter((v) => !declared.has(v));
if (missing.length > 0) {
  console.error(
    `CONSUMER STOCK: FAIL — ${file} does not declare ${missing.join(", ")}. Either shadcn changed its stock roles (shrink CONSUMER_STOCK_VARS and re-audit TOK-9) or the init step did not run.`,
  );
  process.exit(1);
}
console.log(`CONSUMER STOCK: ${CONSUMER_STOCK_VARS.length} promised names all declared in ${file}`);
```

- [ ] **Step 2: Write the scaffold**

`apps/docs/harness/scaffold-consumer.mts`:

```ts
// Mounts the docs demos inside a scaffolded consumer so the harness can render
// every item against the installed copies, not the docs sources.
//
// Three moves:
//  1. Copy components/demos/<name>-demo.tsx into <consumer>/harness/demos/.
//  2. Map every registry source path to its installed target in the consumer's
//     tsconfig `paths`, so a demo's `@/registry/super-ai/x` import resolves to
//     `components/super-ai/x` (or `lib/x` for lib items) — exact keys, listed
//     before `@/*`, one per registry file, read from registry.json.
//  3. Write app/harness/[name]/page.tsx (one static route per demo, wrapped in
//     <main data-harness-item>) and app/harness/page.tsx (an index).
// It also prints the `@/components/ui/*` names the demos import, one per line,
// on stdout's last block, so the shell can `shadcn add` the ones no item
// pulled in.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { HARNESS_ITEMS } from "./items";

const consumer = process.argv[2];
if (!consumer) {
  console.error("usage: tsx harness/scaffold-consumer.mts <consumerDir>");
  process.exit(2);
}
const docs = fileURLToPath(new URL("../", import.meta.url));
const registry = JSON.parse(readFileSync(join(docs, "registry.json"), "utf8")) as {
  items: { files?: { path: string; target?: string }[] }[];
};

// 1. demos
const demosDir = join(consumer, "harness", "demos");
mkdirSync(demosDir, { recursive: true });
const uiImports = new Set<string>();
for (const item of HARNESS_ITEMS) {
  const src = join(docs, "components", "demos", `${item.name}-demo.tsx`);
  copyFileSync(src, join(demosDir, `${item.name}-demo.tsx`));
  for (const m of readFileSync(src, "utf8").matchAll(/from "@\/components\/ui\/([a-z0-9-]+)"/g))
    uiImports.add(m[1]);
}
const pascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
writeFileSync(
  join(consumer, "harness", "demos.generated.ts"),
  [
    "// GENERATED by scaffold-consumer.mts. Do not edit.",
    'import type { ComponentType } from "react";',
    ...HARNESS_ITEMS.map((i) => `import ${pascal(i.name)}Demo from "./demos/${i.name}-demo";`),
    "",
    "export const demos: Record<string, ComponentType> = {",
    ...HARNESS_ITEMS.map((i) => `  "${i.name}": ${pascal(i.name)}Demo,`),
    "};",
    "export const names = Object.keys(demos);",
    "",
  ].join("\n"),
);

// 2. tsconfig paths
const tsconfigPath = join(consumer, "tsconfig.json");
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
const strip = (p: string) => p.replace(/\.(tsx|ts)$/, "");
const itemPaths: Record<string, string[]> = {};
for (const item of registry.items) {
  for (const f of item.files ?? []) {
    if (!f.target) continue;
    itemPaths[`@/${strip(f.path)}`] = [`./${strip(f.target)}`];
  }
}
tsconfig.compilerOptions.paths = { ...itemPaths, ...(tsconfig.compilerOptions.paths ?? {}) };
writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

// 3. routes
mkdirSync(join(consumer, "app", "harness", "[name]"), { recursive: true });
writeFileSync(
  join(consumer, "app", "harness", "[name]", "page.tsx"),
  `import { notFound } from "next/navigation";

import { demos, names } from "@/harness/demos.generated";

export const dynamicParams = false;

export function generateStaticParams() {
  return names.map((name) => ({ name }));
}

export default async function HarnessPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const Demo = demos[name];
  if (!Demo) notFound();
  return (
    <main data-harness-item={name} className="min-h-svh p-8">
      <Demo />
    </main>
  );
}
`,
);
writeFileSync(
  join(consumer, "app", "harness", "page.tsx"),
  `import Link from "next/link";

import { names } from "@/harness/demos.generated";

export default function HarnessIndex() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-lg font-medium">Preset harness</h1>
      <ul className="columns-3 text-sm">
        {names.map((name) => (
          <li key={name}>
            <Link className="underline" href={\`/harness/\${name}\`}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`,
);

console.log(
  `scaffold-consumer: ${HARNESS_ITEMS.length} demos, ${Object.keys(itemPaths).length} path aliases`,
);
console.log("UI_IMPORTS_BEGIN");
for (const name of [...uiImports].sort()) console.log(name);
console.log("UI_IMPORTS_END");
```

- [ ] **Step 3: Rewrite the script**

`apps/docs/scripts/consumer-test.sh`:

```bash
#!/usr/bin/env bash
# Proves the registry installs into a fresh app AND renders under a preset —
# the product-proving test. One row per run; `default` is what it always did
# plus rendering and axe. Rows: apps/docs/harness/presets.ts.
#
#   apps/docs/scripts/consumer-test.sh                # row `default`
#   apps/docs/scripts/consumer-test.sh radix-violet-large
#   KEEP_CONSUMER=1 apps/docs/scripts/consumer-test.sh   # leave the scaffold for a look
set -euo pipefail

ROW="${1:-default}"
DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT=4848
APP_PORT=4849
TMP="$(mktemp -d)"
SERVE_PID=""
APP_PID=""
cleanup() {
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  if [ "${KEEP_CONSUMER:-}" = "1" ]; then
    echo "KEEP_CONSUMER=1: consumer left at $TMP/consumer"
  else
    rm -rf "$TMP"
  fi
}
trap cleanup EXIT

# The row's preset, from the same record the tests pin.
eval "$(cd "$DOCS_DIR" && pnpm exec tsx harness/preset-code.mts "$ROW")"
echo "==> Row $HARNESS_ROW: base=$HARNESS_BASE preset=$HARNESS_CODE"

echo "==> Building registry against http://127.0.0.1:$PORT"
(cd "$DOCS_DIR" && REGISTRY_URL="http://127.0.0.1:$PORT" pnpm build:registry)

echo "==> Serving registry"
npx --yes serve "$DOCS_DIR/public" -l "$PORT" --no-clipboard &
SERVE_PID=$!
sleep 2

echo "==> Scaffolding consumer app"
cd "$TMP"
# Skip install so we can inject .npmrc before pnpm runs.
# pnpm 11 requires explicit allow-build for packages with postinstall scripts (sharp, unrs-resolver).
pnpm dlx create-next-app@latest consumer --ts --tailwind --app --no-src-dir --import-alias "@/*" --eslint --turbopack --use-pnpm --yes --skip-install
cd consumer
CONSUMER_DIR="$PWD"
# pnpm 11 requires allowBuilds in pnpm-workspace.yaml to run postinstall scripts.
# create-next-app's template owns this file and has already changed shape once:
# it used to emit an empty file, and now emits its own allowBuilds block with
# these same packages set to false. Appending blindly produced a second
# allowBuilds key, which pnpm rejects as a duplicate mapping key before install
# even starts. So: drop whatever block it wrote, then write ours.
if [ -f pnpm-workspace.yaml ]; then
  awk '
    /^allowBuilds:[[:space:]]*$/ { in_block = 1; next }
    in_block && /^([[:space:]]+|[[:space:]]*$)/ { next }
    { in_block = 0; print }
  ' pnpm-workspace.yaml > pnpm-workspace.yaml.next
  mv pnpm-workspace.yaml.next pnpm-workspace.yaml
fi
cat >> pnpm-workspace.yaml <<'WSEOF'

allowBuilds:
  sharp: true
  unrs-resolver: true
  esbuild: true
WSEOF
# Fail by name rather than letting pnpm report a line number, so the next time
# the template changes shape this says which assumption broke.
KEY_COUNT="$(grep -c '^allowBuilds:' pnpm-workspace.yaml || true)"
if [ "$KEY_COUNT" -ne 1 ]; then
  echo "CONSUMER INSTALL TEST: FAIL — pnpm-workspace.yaml has $KEY_COUNT allowBuilds keys, expected 1" >&2
  cat pnpm-workspace.yaml >&2
  exit 1
fi
pnpm install

echo "==> shadcn init on the row's preset"
pnpm dlx shadcn@latest init --base "$HARNESS_BASE" --preset "$HARNESS_CODE" --yes

echo "==> Deriving installed item list from registry.json"
ITEMS=()
while IFS= read -r name; do
  ITEMS+=("$name")
done < <(node -e "
const fs = require('fs');
const registry = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
for (const item of registry.items) console.log(item.name);
" "$DOCS_DIR/registry.json")
if [ "${#ITEMS[@]}" -eq 0 ]; then
  echo "CONSUMER INSTALL TEST: FAIL — derived zero items from $DOCS_DIR/registry.json" >&2
  exit 1
fi
echo "==> Installing all ${#ITEMS[@]} items from the local registry: ${ITEMS[*]}"
URLS=()
for item in "${ITEMS[@]}"; do URLS+=("http://127.0.0.1:$PORT/r/$item.json"); done
pnpm dlx shadcn@latest add --yes --overwrite "${URLS[@]}"

echo "==> Verifying marketing css landed in the consumer app's global stylesheet"
GLOBAL_CSS="app/globals.css"
if [ ! -f "$GLOBAL_CSS" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — expected shadcn's global stylesheet at $GLOBAL_CSS, not found" >&2
  exit 1
fi
if ! grep -qF -e ".marketing-dot-fade" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing .marketing-dot-fade (dot-pattern's css block did not install)" >&2
  exit 1
fi
echo "  found .marketing-dot-fade in $GLOBAL_CSS"
if ! grep -qF -e "--marketing-rainbow-1" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --marketing-rainbow-1 (dot-pattern's cssVars did not install)" >&2
  exit 1
fi
echo "  found --marketing-rainbow-1 in $GLOBAL_CSS"

# Tailwind v4 emits no CSS for an undefined utility instead of failing the build, so
# a missing --warning would ship a colourless near-limit state and still go green.
# Only an explicit assertion catches it.
if ! grep -qF -e "--warning" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --warning (quota-meter's cssVars did not install)" >&2
  exit 1
fi
echo "  found --warning in $GLOBAL_CSS"
if ! grep -qF -e "--color-warning" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --color-warning (@theme mapping absent; bg-warning would emit nothing)" >&2
  exit 1
fi
echo "  found --color-warning in $GLOBAL_CSS"

echo "==> Asserting the preset declares every stock name TOK-9 trusts"
(cd "$DOCS_DIR" && pnpm exec tsx harness/assert-stock.mts "$CONSUMER_DIR/$GLOBAL_CSS")

echo "==> Mounting the docs demos on /harness/<name>"
SCAFFOLD_OUT="$(cd "$DOCS_DIR" && pnpm exec tsx harness/scaffold-consumer.mts "$CONSUMER_DIR")"
echo "$SCAFFOLD_OUT" | head -1
UI_DEPS=()
while IFS= read -r name; do
  [ -n "$name" ] && [ ! -f "components/ui/$name.tsx" ] && UI_DEPS+=("$name")
done < <(echo "$SCAFFOLD_OUT" | sed -n '/^UI_IMPORTS_BEGIN$/,/^UI_IMPORTS_END$/p' | sed '1d;$d')
if [ "${#UI_DEPS[@]}" -gt 0 ]; then
  echo "==> Demos import ${#UI_DEPS[@]} ui primitive(s) no item pulled in; adding from the consumer's own registry: ${UI_DEPS[*]}"
  pnpm dlx shadcn@latest add --yes "${UI_DEPS[@]}"
fi

echo "==> Building consumer app"
pnpm build

echo "==> Serving consumer app on :$APP_PORT"
pnpm start --port "$APP_PORT" &
APP_PID=$!
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$APP_PORT/harness" >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -fsS "http://127.0.0.1:$APP_PORT/harness" >/dev/null 2>&1; then
  echo "CONSUMER INSTALL TEST: FAIL — consumer app did not come up on :$APP_PORT" >&2
  exit 1
fi

echo "==> Rendering every demo under $HARNESS_ROW, light and dark, with axe"
(cd "$DOCS_DIR" && HARNESS_ROW="$HARNESS_ROW" HARNESS_URL="http://127.0.0.1:$APP_PORT" pnpm exec playwright test --config harness/playwright.config.ts)

echo "CONSUMER INSTALL TEST ($HARNESS_ROW): PASS"
```

Add `apps/docs/harness/out/` to the root `.gitignore`, after `playwright-report/`.

- [ ] **Step 4: Run the scaffold through the build, with Playwright stubbed**

Task 7 writes the Playwright config. To prove the scaffold alone, run the script with the final Playwright step temporarily neutralised:

```bash
KEEP_CONSUMER=1 bash -c 'sed "s|pnpm exec playwright test --config harness/playwright.config.ts|true|" apps/docs/scripts/consumer-test.sh > /tmp/ct-nopw.sh && bash /tmp/ct-nopw.sh default'
```

Expected: `==> shadcn init on the row's preset` succeeds against the existing app; `CONSUMER STOCK: 32 promised names all declared`; `scaffold-consumer: 131 demos, 137 path aliases` (the alias count is the number of registry files; accept what it prints and record it in the spec's §5 if it differs); `pnpm build` succeeds with 131 `/harness/[name]` pages; `CONSUMER INSTALL TEST (default): PASS`; the consumer path is printed.

If `pnpm build` fails on a demo import, the failing module name says which of the three moves missed: a `@/registry/...` path (check `itemPaths` covers that file), a `@/components/ui/...` primitive (check `UI_DEPS` was added), or a demo-only dependency (a package a demo imports that no item lists; add it to the row's scaffold with `pnpm add`, and record it in §5 as a finding about that demo).

- [ ] **Step 5: Look at one page**

With the consumer kept, start it and open two routes:

```bash
cd "$(ls -d /private/var/folders/*/*/T/tmp.*/consumer 2>/dev/null | tail -1)" && (pnpm start --port 4849 & sleep 5; curl -s http://127.0.0.1:4849/harness/thread-list | grep -o 'data-harness-item="[^"]*"'; curl -s http://127.0.0.1:4849/harness/dot-pattern | grep -o 'data-harness-item="[^"]*"'; kill %1) ; cd -
```

Expected: `data-harness-item="thread-list"` and `data-harness-item="dot-pattern"`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/scripts/consumer-test.sh apps/docs/harness/assert-stock.mts apps/docs/harness/scaffold-consumer.mts .gitignore
git commit -m "feat(harness): row-driven consumer scaffold with every demo mounted

consumer-test.sh takes a row, inits shadcn on that row's preset and base,
installs everything, asserts the generated stylesheet declares every stock
name TOK-9 trusts, then mounts the docs demos on /harness/<name> against the
installed copies via tsconfig paths from registry.json, and builds."
```

---

### Task 7: Playwright + axe, screenshots, and the shrink-only baseline

**Files:**

- Create: `apps/docs/harness/playwright.config.ts`
- Create: `apps/docs/harness/harness.spec.ts`
- Create: `apps/docs/harness/baseline.ts`
- Create: `apps/docs/harness/global-teardown.ts`
- Create: `apps/docs/harness/baseline-write.mts`
- Create: `apps/docs/harness/baseline.json` (written by the first run)
- Modify: `apps/docs/package.json` (add `harness:baseline` script)

**Interfaces:**

- Consumes: `HARNESS_ITEMS` (Task 5); the server from Task 6; `nextBaseline` from `apps/docs/scripts/lib/story-coverage.ts`.
- Produces: `out/<row>/<theme>/<item>.png` and `.json` (`HarnessResult`), `baseline.json` keys `row/theme/item:axe-rule`.

- [ ] **Step 1: Write the baseline helpers**

`apps/docs/harness/baseline.ts`:

```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"];

export interface HarnessResult {
  row: string;
  theme: Theme;
  item: string;
  /** axe rule ids that fired, deduplicated and sorted. */
  violations: string[];
  /** page errors and console.error lines. */
  errors: string[];
}

export const BASELINE_FILE = fileURLToPath(new URL("./baseline.json", import.meta.url));
export const OUT_DIR = fileURLToPath(new URL("./out/", import.meta.url));

export const keyFor = (row: string, theme: Theme, item: string, rule: string) =>
  `${row}/${theme}/${item}:${rule}`;

export function readBaseline(): string[] {
  return existsSync(BASELINE_FILE) ? (JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as string[]) : [];
}

/** Every result file a row's run wrote. */
export function readResults(row: string): HarnessResult[] {
  const out: HarnessResult[] = [];
  for (const theme of THEMES) {
    const dir = `${OUT_DIR}${row}/${theme}/`;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      out.push(JSON.parse(readFileSync(dir + f, "utf8")) as HarnessResult);
    }
  }
  return out;
}

export function liveKeys(results: HarnessResult[]): string[] {
  return results.flatMap((r) => r.violations.map((v) => keyFor(r.row, r.theme, r.item, v)));
}
```

`apps/docs/harness/global-teardown.ts`:

```ts
// Runs once after the row's tests. A baselined key that no longer fires is a
// stale entry, and the run fails on it: the baseline may only shrink, and the
// shrinking is a commit, not something that happens silently.
import { keyFor, liveKeys, readBaseline, readResults } from "./baseline";

export default async function globalTeardown() {
  const row = process.env.HARNESS_ROW ?? "default";
  const results = readResults(row);
  if (results.length === 0) return; // nothing ran; never certify an empty run
  const live = new Set(liveKeys(results));
  const tested = new Set(results.map((r) => `${r.row}/${r.theme}/${r.item}`));
  const stale = readBaseline().filter((k) => {
    const [pair] = k.split(":");
    return k.startsWith(`${row}/`) && tested.has(pair) && !live.has(k);
  });
  if (stale.length > 0) {
    throw new Error(
      `harness/baseline.json carries ${stale.length} entr${stale.length === 1 ? "y" : "ies"} for row "${row}" that no longer fire${stale.length === 1 ? "s" : ""}:\n  ${stale.join("\n  ")}\nShrink it: pnpm --filter docs harness:baseline ${row}`,
    );
  }
  void keyFor;
}
```

- [ ] **Step 2: Write the config and the spec**

`apps/docs/harness/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

// Separate from ../playwright.config.ts (the smoke gate): no webServer here,
// consumer-test.sh starts the scaffolded app and passes HARNESS_URL.
export default defineConfig({
  testDir: ".",
  testMatch: "harness.spec.ts",
  outputDir: "./out/test-results",
  globalTeardown: "./global-teardown.ts",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"]],
  use: {
    baseURL: process.env.HARNESS_URL ?? "http://127.0.0.1:4849",
    viewport: { width: 1280, height: 900 },
    // The Storybook gate's posture (apps/storybook/vitest.config.ts): every
    // animated component branches on this media feature, so axe measures a
    // settled frame instead of a mid-fade one.
    reducedMotion: "reduce",
  },
});
```

`apps/docs/harness/harness.spec.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { type HarnessResult, OUT_DIR, THEMES, keyFor, readBaseline } from "./baseline";
import { HARNESS_ITEMS } from "./items";

const ROW = process.env.HARNESS_ROW ?? "default";
const baseline = new Set(readBaseline());

// WCAG 2.x A/AA only. Narrower than the Storybook gate's axe defaults on
// purpose: best-practice rules about page structure would fire on the harness
// page's own chrome, not on the item (design §3.6).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const theme of THEMES) {
  for (const item of HARNESS_ITEMS) {
    test(`${ROW} · ${theme} · ${item.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });

      await page.goto(`/harness/${item.name}`);
      if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
      const root = page.locator(`[data-harness-item="${item.name}"]`);
      await expect(root).toBeVisible();
      await page.waitForLoadState("networkidle");

      const dir = `${OUT_DIR}${ROW}/${theme}/`;
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}${item.name}.png`, fullPage: true });

      const axe = await new AxeBuilder({ page })
        .include(`[data-harness-item="${item.name}"]`)
        .withTags(TAGS)
        .analyze();
      const ids = [...new Set(axe.violations.map((v) => v.id))].sort();
      const record: HarnessResult = { row: ROW, theme, item: item.name, violations: ids, errors };
      writeFileSync(`${dir}${item.name}.json`, JSON.stringify(record));

      const fresh = ids.filter((id) => !baseline.has(keyFor(ROW, theme, item.name, id)));
      const detail = axe.violations
        .filter((v) => fresh.includes(v.id))
        .map((v) => `${v.id} (${v.impact}): ${v.nodes[0]?.html.slice(0, 140) ?? ""}`)
        .join("\n");
      expect(errors, "console errors").toEqual([]);
      expect(fresh, `new axe violations, not in harness/baseline.json:\n${detail}`).toEqual([]);
    });
  }
}
```

`apps/docs/harness/baseline-write.mts`:

```ts
// Regenerates harness/baseline.json for one row from that row's last run.
// Shrink-only, by design: refuses to write a key the committed baseline does
// not already carry for that row. The first run of a row is the exception —
// same discipline as story-coverage-baseline.mts.
import { writeFileSync } from "node:fs";

import { nextBaseline } from "../scripts/lib/story-coverage";
import { BASELINE_FILE, liveKeys, readBaseline, readResults } from "./baseline";

const row = process.argv[2];
if (!row) {
  console.error("usage: tsx harness/baseline-write.mts <row>");
  process.exit(2);
}
const results = readResults(row);
if (results.length === 0) {
  console.error(
    `harness:baseline — no results under harness/out/${row}/; run apps/docs/scripts/consumer-test.sh ${row} first`,
  );
  process.exit(1);
}
const prevAll = readBaseline();
const prevRow = prevAll.filter((k) => k.startsWith(`${row}/`));
const next = nextBaseline(prevRow.length > 0 ? prevRow : null, liveKeys(results));
if (next.grown.length > 0) {
  console.error(
    `harness:baseline — refusing to grow row "${row}" by ${next.grown.length} (${next.grown.slice(0, 5).join(", ")}${next.grown.length > 5 ? ", …" : ""}). The regenerate command may only shrink it; growth is a hand edit in a reviewed commit.`,
  );
  process.exit(1);
}
const merged = [...prevAll.filter((k) => !k.startsWith(`${row}/`)), ...next.baseline].sort();
writeFileSync(BASELINE_FILE, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `harness:baseline — row "${row}": ${next.baseline.length} baselined violation(s); file holds ${merged.length}.`,
);
```

In `apps/docs/package.json` scripts, add `"harness:baseline": "tsx harness/baseline-write.mts"`.

- [ ] **Step 3: Typecheck and lint the new files**

```bash
pnpm --filter docs typecheck && pnpm --filter docs lint && pnpm format:check
```

Expected: PASS. If prettier objects to a generated-looking file, run `pnpm format` and re-check; nothing under `apps/docs/harness/` is prettier-ignored.

- [ ] **Step 4: First full run of the default row, and watch new failures land**

```bash
apps/docs/scripts/consumer-test.sh default 2>&1 | tail -60
```

Expected: 262 tests; some fail with `new axe violations, not in harness/baseline.json` (dark contrast is the likely class, since nothing audits dark today). The run exits 1. That is the harness proving it can fail on the real tree.

- [ ] **Step 5: Write the first baseline and re-run**

```bash
pnpm --filter docs harness:baseline default && cat apps/docs/harness/baseline.json | head -20 && apps/docs/scripts/consumer-test.sh default 2>&1 | tail -5
```

Expected: `harness:baseline — row "default": N baselined violation(s)`; the second run prints `CONSUMER INSTALL TEST (default): PASS`.

- [ ] **Step 6: CONTROL, the teardown catches a stale entry**

```bash
node -e "
const fs=require('fs');const f='apps/docs/harness/baseline.json';const b=JSON.parse(fs.readFileSync(f,'utf8'));
b.push('default/light/thread-list:color-contrast');fs.writeFileSync(f,JSON.stringify(b.sort(),null,2)+'\n');" && apps/docs/scripts/consumer-test.sh default 2>&1 | grep -A3 "no longer fire"; git checkout apps/docs/harness/baseline.json
```

Expected: the teardown error names `default/light/thread-list:color-contrast` and `pnpm --filter docs harness:baseline default`; the run exits non-zero. The `git checkout` restores the real baseline.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/harness apps/docs/package.json
git commit -m "feat(harness): render every demo under a preset, light and dark, with axe

Playwright visits /harness/<name> for all 131 demos in both themes, scopes
axe (WCAG 2.x A/AA) to the demo's own container, screenshots each page, and
fails on any violation not in harness/baseline.json. The teardown fails on a
baselined key that stopped firing, so the file only shrinks; harness:baseline
regenerates a row and refuses to grow it."
```

---

### Task 8: The foreign rows, CI, the mirror, and the docs

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.claude/skills/gate-run/run-gates.sh`
- Modify: `.claude/skills/gate-run/SKILL.md`
- Modify: `CLAUDE.md` (Commands table, CI section)
- Modify: `README.md:37`
- Modify: `docs/CONTINUE.md` §4 (one trap)
- Modify: `docs/superpowers/specs/2026-09-09-preset-harness-design.md` §5
- Modify: `apps/docs/harness/baseline.json` (the two foreign rows' first write)

**Interfaces:**

- Consumes: everything above.
- Produces: the `presets` job; `run-gates.sh` loops `preset-code.mts --list` minus `default`.

- [ ] **Step 1: Run the two foreign rows and baseline them**

```bash
apps/docs/scripts/consumer-test.sh radix-violet-large 2>&1 | tail -40
```

Expected: either PASS, or failures of two kinds. Axe failures under the violet theme or dark: baseline them (`pnpm --filter docs harness:baseline radix-violet-large`) and note the count. A build failure is a finding, not a baseline entry: if a Base UI import breaks beside Radix, the error names the module; record it verbatim in §5 and stop to decide with the human, because that is the open question the row exists to measure.

Then the same for `vega-stone-emerald-tabler-small`.

- [ ] **Step 2: Fill the spec's §5**

Replace `_Filled in by the plan's last task._` in `docs/superpowers/specs/2026-09-09-preset-harness-design.md` with a table, one line per row: whether install and build passed, the baselined violation count per theme, the axe rule ids that fired (deduplicated), and one sentence each on the two measured questions: did the 14 direct Base UI imports build and pass under Radix, and what did a Tabler consumer look like next to Lucide icons (name two screenshots under `harness/out/`). Counts come from `baseline.json`, not memory:

```bash
node -e "const b=require('./apps/docs/harness/baseline.json');const t={};for(const k of b){const [p]=k.split(':');const [row,theme]=p.split('/');t[row+'/'+theme]=(t[row+'/'+theme]||0)+1}console.log(t);console.log([...new Set(b.map(k=>k.split(':')[1]))].sort())"
```

- [ ] **Step 3: The CI job**

In `.github/workflows/ci.yml`, after the `Consumer install test` step of `verify`, add:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: preset-harness-default
    path: apps/docs/harness/out/default
    if-no-files-found: ignore
```

and after the `verify` job, add:

```yaml
presets:
  # The registry's promise is "plug into whatever theme you have"; verify
  # proves the default preset, these rows prove the axes a consumer can move
  # on ui.shadcn.com/create. Rows: apps/docs/harness/presets.ts, and
  # presets.test.ts fails if this list drifts from it.
  needs: verify
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      row: [radix-violet-large, vega-stone-emerald-tabler-small]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 11.1.0 }
    - uses: actions/setup-node@v4
      with: { node-version: 24, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter docs exec playwright install --with-deps chromium
    - name: Preset harness (${{ matrix.row }})
      run: apps/docs/scripts/consumer-test.sh ${{ matrix.row }}
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: preset-harness-${{ matrix.row }}
        path: apps/docs/harness/out/${{ matrix.row }}
        if-no-files-found: ignore
```

- [ ] **Step 4: The mirror**

In `.claude/skills/gate-run/run-gates.sh`, after `run "consumer install" apps/docs/scripts/consumer-test.sh`, add:

```bash
# The presets job: every non-default row, derived from the record rather than
# listed here, so this mirror cannot drift from apps/docs/harness/presets.ts.
# PRESET_ROWS="radix-violet-large" narrows it while iterating; the full loop is
# the gate.
for row in ${PRESET_ROWS:-$(cd apps/docs && pnpm exec tsx harness/preset-code.mts --list | grep -v '^default$')}; do
  run "preset harness: $row" apps/docs/scripts/consumer-test.sh "$row"
done
```

- [ ] **Step 5: The docs**

`.claude/skills/gate-run/SKILL.md`: change "Eleven steps" to "Twelve steps, then one preset-harness run per non-default row", and add under "Before you trust a green run":

```markdown
- **The preset rows scaffold a fresh app each.** Three to five minutes per row.
  `PRESET_ROWS="radix-violet-large" .claude/skills/gate-run/run-gates.sh`
  narrows the loop while you iterate; the unnarrowed run is the gate.
```

`CLAUDE.md`, Commands table, replace the per-workspace sentence's last clause with:

```markdown
`apps/docs/scripts/consumer-test.sh [row]` installs everything into a fresh app on a shadcn preset and renders every demo under axe, light and dark (rows: `apps/docs/harness/presets.ts`; `default` when omitted).
```

`CLAUDE.md`, CI section, after the "Twelve steps." paragraph, add:

```markdown
A second job, `presets`, runs after `verify`: a matrix of the non-default preset rows (Radix base, a coloured theme, a second style, Tabler icons, moved radii), each scaffolding a consumer on that preset and running the same render-and-axe pass. Screenshots upload as artifacts named `preset-harness-<row>`. Axe findings live in `apps/docs/harness/baseline.json`, which may only shrink. Design: `docs/superpowers/specs/2026-09-09-preset-harness-design.md`.
```

`README.md` line 37: change the comment to `# install everything into a fresh app on a preset, render every demo under axe`.

`docs/CONTINUE.md` §4, append:

```markdown
**Turbo restores only declared outputs.** `build:registry` declared
`public/r/**` and not `registry.json`, so a cache hit left `consumer-test.sh`
with zero items. Any file a later step reads must be in the task's `outputs`.
```

- [ ] **Step 6: Run the tests that pin the mirror, and format**

```bash
pnpm --filter docs exec vitest run harness/presets.test.ts && pnpm format:check
```

Expected: PASS, including the ci.yml matrix assertion that was red since Task 5.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci.yml .claude/skills/gate-run CLAUDE.md README.md docs/CONTINUE.md docs/superpowers apps/docs/harness/baseline.json
git commit -m "ci(harness): presets matrix job, gate mirror, and the first-run findings

verify keeps its twelve steps and uploads the default row's screenshots; a
presets job runs the non-default rows as a matrix. run-gates.sh derives the
rows from the record. Spec §5 records what the foreign presets found."
```

---

### Task 9: Every gate, then the PR

**Files:** none new.

- [ ] **Step 1: Confirm the target out loud**

```bash
git remote -v && git branch --show-current && git config user.name && git config user.email
```

Expected: `origin` is `VV-DSGN-INC/Super-AI-Components`, branch `claude/preset-harness`, author `weeeha` with the GitHub noreply address. If the author is wrong, set it for this repo only: `git config user.name weeeha && git config user.email 1083934+weeeha@users.noreply.github.com`, and amend nothing — fix the author on the commits with `git rebase` is forbidden here; recommit if needed.

- [ ] **Step 2: The whole gate list, in order**

```bash
.claude/skills/gate-run/run-gates.sh 2>&1 | tail -30
```

Expected: `All gates green.` This includes both foreign rows. If the Storybook gate fails with geometry-shaped diffs on macOS, run `scripts/linux-gate.sh` for that one gate (CONTINUE.md documents why) and record the result.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin claude/preset-harness
gh pr create --repo VV-DSGN-INC/Super-AI-Components --base main --head claude/preset-harness --title "Preset harness: render every item under shadcn presets, plus TOK-9 and LAY-2" --body-file - <<'EOF'
## What

The consumer install test now takes a shadcn preset row, scaffolds a consumer on it, installs everything, mounts every docs demo on `/harness/<name>`, and runs axe in light and dark with screenshots. Three rows span base library, style, base colour, theme, icon library and radius. Findings are baselined shrink-only.

Two rules land with it:
- `TOK-9` consumer vocabulary: a registry source may reference a theme colour name only if a consumer's own `shadcn init` declares it or the item ships it via cssVars. Delegated record; teeth are a vitest gate.
- `LAY-2` numeric arbitrary radius: blocker grep; three sites moved to `rounded-xs`.

Also: `registry.json` is now a declared turbo output (a cache hit used to leave the consumer test with zero items).

## Findings from the first run

See spec §5: `docs/superpowers/specs/2026-09-09-preset-harness-design.md`.

## Schema note for the sibling repo

`packages/ds-rules` gains a `delegated` detection method (`gate` + `how`), CATALOGUE_VERSION 2. Minimal Design System's rules schema does not have it yet; Super Mobile DS does.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

- [ ] **Step 4: Report**

Give the PR URL, the CI status once the first run completes, the row table from spec §5, and the path to two screenshots that show a foreign preset (one Radix + violet, one Vega + Tabler).
