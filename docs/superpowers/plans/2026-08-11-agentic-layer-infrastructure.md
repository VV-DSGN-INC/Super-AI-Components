# Agentic Layer — Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert this repo's prose operational rules into executable gates, hooks and agent definitions, closing five documented gate gaps without adding a single CI step.

**Architecture:** Three layers. **Gates** extend the two existing scripts — `check-tokens.mjs` gets `cva`-awareness, `check-contract.mts` absorbs three new assertions — so `ci.yml`'s eleven steps stay eleven. **Hooks** in a checked-in `.claude/settings.json` deny the documented footguns at the moment of attempt. **Skills and agents** in `.claude/` encode the build sequence and, critically, restrict what a fan-out agent may write.

**Tech Stack:** Node 24 · pnpm 11.1.0 · Turborepo · Vitest 4 (jsdom for `apps/docs`, browser+Playwright for `apps/storybook`) · tsx for `.mts` gates · plain `node` for `.mjs` gates.

**Source spec:** [`docs/superpowers/specs/2026-08-11-agentic-layer-design.md`](../specs/2026-08-11-agentic-layer-design.md)

## Global Constraints

- **Do not add a step to `ci.yml`.** Eleven steps exist; new assertions fold into `check:tokens` or `check:contract`. (CLAUDE.md: "Do not add a step that duplicates one of these.")
- **Never run `pnpm format`.** The tree is not prettier-clean at HEAD and it breaks `check:contract`'s guidance regexes. Format only touched files: `pnpm exec prettier --write <paths>`.
- **`check-tokens.mjs` stays `.mjs`.** It imports `globSync` from `node:fs`, which exists at runtime on Node 22+ but is absent from `@types/node@20`. Converting it to `.mts` fails typecheck — this trap is documented in CONTINUE.md §4. Shared logic therefore lives in a `.mjs` module with a hand-written `.d.mts` beside it.
- **The a11y and contrast exemption lists may only shrink.** No task here adds an entry to either.
- **Commit author must be** `weeeha <1083934+weeeha@users.noreply.github.com>` — GitHub rejects the default email for this account. Use `git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit`.
- **Branch per task; never commit to `main`.** Work on `claude/design-system-agentic-flows-52db02` or a branch cut from it.
- **A gate verified only by passing has proved nothing.** Every new gate in this plan has an explicit step that makes it fail on a deliberately introduced instance of its bug, then reverts. This is CONTINUE.md §1's lesson about the console-error assertion.
- **Vitest include for gate tests** is already `scripts/**/*.test.{ts,tsx}` (`apps/docs/vitest.config.ts`). New gate tests go there and are picked up by `pnpm test` with no config change.

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/docs/scripts/lib/token-rules.mjs` | **Create.** Pure, dependency-free token-contract predicates. No `fs`, so it stays typecheck-safe and unit-testable |
| `apps/docs/scripts/lib/token-rules.d.mts` | **Create.** Hand-written types for the above, so `.test.ts` imports typecheck |
| `apps/docs/scripts/lib/token-rules.test.ts` | **Create.** Unit tests for the predicates |
| `apps/docs/scripts/check-tokens.mjs` | **Modify.** Delegates to `token-rules.mjs`; gains `cva` awareness and a widened glob |
| `apps/docs/scripts/lib/scaffold-templates.ts:3` | **Modify.** Export the existing `pascal` helper so the contract gate can build the registry-component name set |
| `apps/docs/scripts/lib/contract-rules.ts` | **Create.** Pure predicates for G2/G3/G4, unit-testable without running the gate |
| `apps/docs/scripts/lib/contract-rules.test.ts` | **Create.** Unit tests for the above |
| `apps/docs/scripts/check-contract.mts` | **Modify.** Calls the three new predicates; no new CI step |
| `apps/docs/vitest.setup.ts` | **Modify.** Adds the `getAnimations` shim next to the `ResizeObserver` stub |
| `.claude/settings.json` | **Create.** Five hooks |
| `.claude/skills/gate-run/SKILL.md` | **Create.** Eleven `ci.yml` steps in order |
| `.claude/skills/build-component/SKILL.md` | **Create.** The §3 loop |
| `.claude/skills/integrate-batch/SKILL.md` | **Create.** The §3.5 reconciliation |
| `.claude/agents/component-builder.md` | **Create.** Fan-out agent, restricted tools |
| `.claude/agents/retrofit-builder.md` | **Create.** Narrower variant for the 25 |
| `apps/docs/scripts/reconcile-deps.mts` | **Create.** CONTINUE.md §3.5's shell loop as a script |
| `apps/docs/lib/test-utils.ts` | **Create.** `expectAccessibleName` — G5's helper. In `lib/`, never `registry/super-ai/`, because the registry is the published product |
| `apps/docs/lib/test-utils.test.tsx` | **Create.** Pins the sr-only fusion case |
| `docs/design-system/component-build-brief.md` | **Modify.** One bullet pointing builders at the helper |
| `docs/design-system/vendored-token-findings.md` | **Create.** Triage of what the widened token glob surfaces in vendored `ui/` |

---

### Task 1: DEFERRED — G6 moved to Task 13

**Do not implement this task.** Attempted 2026-08-11 and reverted; the work is now Task 13, with the scope its first attempt revealed.

The shim itself is two lines and correct. What the attempt found is that it is not a two-line *change*: Base UI branches on whether `Element.prototype.getAnimations` exists, so defining it moves every overlay in the library — popups, dialogs, tab panels — onto the async exit-animation path at once. Five shipped components' tests broke together, and the failure count varied between runs (4, then 5), which means at least one of them is genuinely racing rather than deterministically async.

Attempt-1 diff preserved at `.superpowers/sdd/2026-08-11-agentic-layer-infrastructure/g6-attempt-1.diff`.

Tasks 2–12 do not depend on the shim, so they proceed on a clean base: `pnpm vitest run` from `apps/docs` is **1387/1387 across 137 files** at the plan's base commit.

### Task 2: Extract token rules into a testable module

`check-tokens.mjs` today is one script with its predicates inline, so nothing about it is unit-testable and Task 3 would have to be verified by running the whole gate. Extract first, behaviour unchanged, with tests pinning the current behaviour — including the two subtleties the existing comments protect.

**Files:**
- Create: `apps/docs/scripts/lib/token-rules.mjs`
- Create: `apps/docs/scripts/lib/token-rules.d.mts`
- Create: `apps/docs/scripts/lib/token-rules.test.ts`
- Modify: `apps/docs/scripts/check-tokens.mjs:52-79`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `MUTED_FG: string`
  - `MUTED_BG_RE: RegExp`
  - `CONTRAST_EXEMPT_FILES: string[]`
  - `isExempt(file: string): boolean`
  - `findSingleStringViolations(file: string, source: string): string[]`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/lib/token-rules.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/docs && pnpm vitest run scripts/lib/token-rules.test.ts
```

Expected: FAIL — `Failed to resolve import "./token-rules.mjs"`.

- [ ] **Step 3: Create the module**

Create `apps/docs/scripts/lib/token-rules.mjs`. This is a straight lift of `check-tokens.mjs:52-79`; the comments there explain *why* each subtlety exists and must move with the code:

```js
// Pure token-contract predicates. Deliberately free of `node:fs` — check-tokens
// runs under plain `node` as .mjs (globSync is absent from @types/node@20, so
// the entry point cannot become .mts), and keeping this module fs-free is what
// lets it be unit-tested from a .ts test file.

export const MUTED_FG = "text-muted-foreground";
export const MUTED_BG_RE = /^bg-(?:muted|accent|secondary)(?:\/\d{1,3})?$/;

// May only shrink, never grow. See docs/design-system/a11y-baseline.md.
// preview-tile.tsx's violations are a different defect (text-destructive on the
// default surface, and label text over unpredictable image content), not the
// muted-on-muted pairing this module looks for.
export const CONTRAST_EXEMPT_FILES = ["preview-tile.tsx"];

// Exactly the original predicate — do not widen it. This is a
// behaviour-preserving refactor, and `isExempt` guards an exemption list that
// may only shrink; a looser matcher is a loosening even when inert today.
export function isExempt(file) {
  return CONTRAST_EXEMPT_FILES.some((name) => file.endsWith(`/${name}`));
}

// `.filter(Boolean)` is intentional and is the one deliberate departure from
// the original `segment.split(/\s+/)`. It is inert for the single-string rule
// (an empty token matches neither MUTED_FG nor MUTED_BG_RE), and Task 3 needs
// it: cva base strings are multi-line and carry leading indentation, which
// yields empty tokens the original never had to handle.
function classTokens(segment) {
  return segment.split(/\s+/).filter(Boolean);
}

/**
 * The single-element shape: muted text and a muted background inside one
 * quoted class-list literal.
 *
 * Each quoted segment is checked on its own, not merged with the rest of the
 * line — a ternary's two branches are mutually exclusive at runtime and must
 * not be treated as one combined class list.
 *
 * Variant-prefixed backgrounds (`hover:bg-accent`, `dark:bg-muted`) do not
 * match MUTED_BG_RE, which is anchored: the hover rule that introduces the
 * background normally swaps the text token too, so the pairing never renders.
 */
export function findSingleStringViolations(file, source) {
  if (isExempt(file)) return [];

  const found = [];
  source.split("\n").forEach((line, i) => {
    for (const match of line.matchAll(/"([^"]*)"|'([^']*)'/g)) {
      const tokens = classTokens(match[1] ?? match[2] ?? "");
      const mutedBgToken = tokens.find((t) => MUTED_BG_RE.test(t));
      if (tokens.includes(MUTED_FG) && mutedBgToken) {
        found.push(
          `${file}:${i + 1} — text-muted-foreground paired with ${mutedBgToken} in one class list (4.34:1 against a 4.5:1 minimum): ${line.trim()}`,
        );
      }
    }
  });
  return found;
}
```

- [ ] **Step 4: Create the type declaration**

Create `apps/docs/scripts/lib/token-rules.d.mts`:

```ts
export declare const MUTED_FG: string;
export declare const MUTED_BG_RE: RegExp;
export declare const CONTRAST_EXEMPT_FILES: string[];
export declare function isExempt(file: string): boolean;
export declare function findSingleStringViolations(file: string, source: string): string[];
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/docs && pnpm vitest run scripts/lib/token-rules.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Rewire `check-tokens.mjs`**

In `apps/docs/scripts/check-tokens.mjs`, delete lines 18–79 (the comment block, the three constants, and `findMutedOnMutedViolations`) and add this import below line 1:

```js
import { findSingleStringViolations } from "./lib/token-rules.mjs";
```

Then change line 106 from `findMutedOnMutedViolations(file, source)` to:

```js
  for (const message of findSingleStringViolations(file, source)) {
```

- [ ] **Step 7: Verify the gate is unchanged**

```bash
cd apps/docs && pnpm check:tokens && pnpm typecheck
```

Expected: `check:tokens — 130 file(s) clean.` and a clean typecheck. If the file count differs from 130, stop — the glob changed and it should not have in this task.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/scripts/lib/token-rules.mjs apps/docs/scripts/lib/token-rules.d.mts \
        apps/docs/scripts/lib/token-rules.test.ts apps/docs/scripts/check-tokens.mjs
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "refactor(check:tokens): extract predicates into a unit-testable module"
```

---

### Task 3: G1 — `cva` base↔variant pairing

`components/ui/tabs.tsx:19` puts `text-muted-foreground` in `tabsListVariants`' base string and `bg-muted` in its `default` variant. The gate written specifically to catch this pairing cannot see it, because it tests one quoted segment at a time. CONTINUE.md §4 records this as unresolved.

**The rule is deliberately narrow: pair the base string with each variant value string *individually*.** Do not union every string in the call. Two values of the same variant group are mutually exclusive, and merging them would resurrect exactly the ternary false-positive Task 2's third test pins.

**Files:**
- Modify: `apps/docs/scripts/lib/token-rules.mjs`
- Modify: `apps/docs/scripts/lib/token-rules.d.mts`
- Modify: `apps/docs/scripts/lib/token-rules.test.ts`
- Modify: `apps/docs/scripts/check-tokens.mjs`

**Interfaces:**
- Consumes: `MUTED_FG`, `MUTED_BG_RE`, `isExempt` from Task 2
- Produces:
  - `extractCvaCalls(source: string): { body: string; index: number }[]`
  - `findCvaViolations(file: string, source: string): string[]`

- [ ] **Step 1: Write the failing test**

Append to `apps/docs/scripts/lib/token-rules.test.ts`:

```ts
import { extractCvaCalls, findCvaViolations } from "./token-rules.mjs";

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

    const templateBase = "cva(`p-2 ${x}`, { variants: { v: { a: \"text-muted-foreground\", b: \"bg-muted\" } } })";
    expect(findCvaViolations("x.tsx", templateBase)).toEqual([]);
  });

  it("reports both of two cva calls sharing one physical line", () => {
    const src = `const a = cva("text-muted-foreground", { variants: { v: { x: "bg-muted" } } }); const b = cva("text-muted-foreground", { variants: { v: { y: "bg-accent" } } });`;
    expect(findCvaViolations("x.tsx", src)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/docs && pnpm vitest run scripts/lib/token-rules.test.ts
```

Expected: FAIL — `extractCvaCalls is not a function`.

- [ ] **Step 3: Implement**

Append to `apps/docs/scripts/lib/token-rules.mjs`:

```js
/**
 * Find every `cva(` call and return its body by balanced-paren scan. A regex
 * cannot do this: variant bodies routinely contain nested calls.
 */
export function extractCvaCalls(source) {
  const calls = [];
  const re = /\bcva\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    let quote = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      const next = source[i + 1];
      // Parens inside strings and comments must not move the depth counter.
      // Tailwind arbitrary values are full of them — `[&:not(:first-child)]`,
      // `color-mix(...)`, `max-w-(--x)` — and those happen to self-balance, so
      // a naive scan survives them by luck rather than by design. A single
      // unbalanced paren in a comment (`// TODO (see GH-123`) would either
      // truncate the body early, losing detections, or run the scan to some
      // unrelated `)` later in the file and swallow foreign code into it.
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
      } else if (ch === "/" && next === "/") {
        while (i < source.length && source[i] !== "\n") i++;
        continue;
      } else if (ch === "/" && next === "*") {
        i += 2;
        while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
        i += 2;
        continue;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      i++;
    }
    if (depth === 0) calls.push({ body: source.slice(start, i - 1), index: m.index });
  }
  return calls;
}

/**
 * Returns the offending background token when muted text and a muted
 * background are split ACROSS the two argument lists — never when they sit
 * together in one (findSingleStringViolations owns that case) and never
 * between two variant values (mutually exclusive at runtime).
 */
function crossPairViolation(baseTokens, variantTokens) {
  const bgInBase = baseTokens.find((t) => MUTED_BG_RE.test(t));
  const bgInVariant = variantTokens.find((t) => MUTED_BG_RE.test(t));
  if (baseTokens.includes(MUTED_FG) && bgInVariant) return bgInVariant;
  if (variantTokens.includes(MUTED_FG) && bgInBase) return bgInBase;
  return null;
}

/**
 * The cva shape: a base class string that always applies, paired with each
 * variant value string that may apply alongside it.
 *
 * This is the gap that let components/ui/tabs.tsx ship the exact pairing this
 * gate exists to catch — text-muted-foreground in tabsListVariants' base,
 * bg-muted in its `default` variant. Recorded as unresolved in CONTINUE.md §4.
 */
export function findCvaViolations(file, source) {
  if (isExempt(file)) return [];

  const found = [];
  const seen = new Set();
  for (const call of extractCvaCalls(source)) {
    // The base MUST be cva's first argument and MUST be a plain string
    // literal. Taking "the first quoted string anywhere in the body" instead
    // is wrong for a call whose first argument is a template literal, an
    // array, or a variable: the first *variant value* would be promoted to
    // base and then paired against its own siblings — precisely the
    // union-across-mutually-exclusive-values this rule exists to avoid.
    // Skipping such a call under-reports; promoting a variant value
    // false-positives. Under-reporting is the safe direction for a gate
    // whose failures block CI.
    const baseMatch = /^\s*(["'])((?:\\.|[^\\])*?)\1/.exec(call.body);
    if (!baseMatch) continue;

    const base = classTokens(baseMatch[2]);
    const rest = call.body.slice(baseMatch[0].length);
    const line = source.slice(0, call.index).split("\n").length;

    for (const m of rest.matchAll(/"([^"]*)"|'([^']*)'/g)) {
      const bg = crossPairViolation(base, classTokens(m[1] ?? m[2] ?? ""));
      // Keyed on the call's offset, not its line: two cva() calls can share a
      // physical line, and a line-based key would silently drop the second's
      // finding. `format:check` is not in CI, so one-line source is possible.
      const key = `${call.index}:${bg}`;
      if (bg && !seen.has(key)) {
        seen.add(key);
        found.push(
          `${file}:${line} — cva() pairs text-muted-foreground with ${bg} across its base and a variant value (4.34:1 against a 4.5:1 minimum)`,
        );
      }
    }
  }
  return found;
}
```

- [ ] **Step 4: Extend the type declaration**

Append to `apps/docs/scripts/lib/token-rules.d.mts`:

```ts
export declare function extractCvaCalls(source: string): { body: string; index: number }[];
export declare function findCvaViolations(file: string, source: string): string[];
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/docs && pnpm vitest run scripts/lib/token-rules.test.ts
```

Expected: PASS, 11 tests.

- [ ] **Step 6: Wire into the gate**

In `apps/docs/scripts/check-tokens.mjs`, extend the import:

```js
import { findCvaViolations, findSingleStringViolations } from "./lib/token-rules.mjs";
```

and add directly below the existing `findSingleStringViolations` loop:

```js
  for (const message of findCvaViolations(file, source)) {
    violations++;
    console.error(message);
  }
```

- [ ] **Step 7: Verify the gate still passes on the current glob**

```bash
cd apps/docs && pnpm check:tokens
```

Expected: `check:tokens — 130 file(s) clean.` No registry file uses the offending cva shape; `ui/tabs.tsx` is not yet in scope. That happens in Task 4.

- [ ] **Step 8: Prove the gate fails on a real instance**

Temporarily append to `apps/docs/registry/super-ai/kbd.tsx`:

```tsx
const probeVariants = cva("text-muted-foreground", {
  variants: { tone: { quiet: "bg-muted" } },
});
```

Run `cd apps/docs && pnpm check:tokens`. Expected: **exit 1**, one violation naming `bg-muted`. Then revert:

```bash
git checkout -- apps/docs/registry/super-ai/kbd.tsx
```

A gate verified only by passing has proved nothing. Do not skip this step.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/scripts/lib/token-rules.mjs apps/docs/scripts/lib/token-rules.d.mts \
        apps/docs/scripts/lib/token-rules.test.ts apps/docs/scripts/check-tokens.mjs
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(check:tokens): catch muted-on-muted split across a cva base and variant"
```

---

### Task 4: G1b — widen the glob to vendored primitives

The `cva` rule alone does not catch the real bug, because `check-tokens.mjs:3` globs `registry/{super-ai,marketing}/**` and `components/ui/tabs.tsx` is not scanned at all. CONTINUE.md §8 describes it as "sitting outside its scan scope where any consumer taking the default variant will hit it."

**The spec commits to reporting, not fixing, whatever else falls out** (§8.1). Diverging from vendored upstream is an open question this task does not settle.

**Files:**
- Modify: `apps/docs/scripts/check-tokens.mjs:3`
- Create: `docs/design-system/vendored-token-findings.md`

**Interfaces:**
- Consumes: `findCvaViolations`, `findSingleStringViolations` from Task 3
- Produces: a findings document; no behavioural interface

- [ ] **Step 1: Widen the glob and see what falls out**

Change `apps/docs/scripts/check-tokens.mjs:3-5` to:

```js
const FILES = globSync("{registry/{super-ai,marketing},components/ui}/**/*.tsx", {
  exclude: (f) => f.includes(".test."),
});
```

- [ ] **Step 2: Run the gate and capture the findings**

```bash
cd apps/docs && pnpm check:tokens 2>&1 | tee /tmp/vendored-findings.txt; echo "exit=$?"
```

Expected: **exit 1**, with at least `components/ui/tabs.tsx:19` reported by the new cva rule. This is the confirmation that Task 3's rule catches the real, documented instance — not just the synthetic probe.

- [ ] **Step 3: Write the findings document**

Create `docs/design-system/vendored-token-findings.md` with a header explaining the scope decision, then paste the captured violations under it, one per bullet, each annotated with whether it is (a) the muted-on-muted pairing, (b) a palette class, or (c) a raw colour. Header text:

```markdown
# Token findings in vendored `components/ui/**`

`check:tokens` now scans vendored shadcn primitives as well as this repo's own
registry. It previously did not, which is how `ui/tabs.tsx` shipped the exact
`text-muted-foreground` / `bg-muted` pairing the gate exists to catch — the
finding CONTINUE.md §8 records as sitting outside the scan scope.

**These are reported, not fixed.** Fixing them means diverging from upstream,
which is the same open question `a11y-baseline.md` parks for the a11y
exclusions, and nobody has decided it. Each entry below is triaged only.

Anything a consumer hits by taking a primitive's **default** variant is marked
`CONSUMER-FACING` — those are the ones worth deciding about first.
```

- [ ] **Step 4: Make vendored findings warn-only**

The gate cannot both scan `components/ui/**` and stay green while those findings exist. **Do not add a baseline exemption list.** A third list would carry exactly the drift risk G3 exists to police, would not itself be covered by G3, and CLAUDE.md is explicit that adding a file to silence a failure defeats the gate.

Instead, vendored files **warn and never fail**. There is then no list, so nothing can grow.

In `apps/docs/scripts/check-tokens.mjs`, wrap the per-file reporting so that findings in `components/ui/**` print to stdout as warnings and are not counted toward `violations`:

```js
const isVendored = (f) => f.startsWith("components/ui/");
```

Then, at each of the three reporting sites (the `PATTERNS` loop, the `findSingleStringViolations` loop, and the `findCvaViolations` loop), branch:

```js
    if (isVendored(file)) {
      warnings++;
      warnedFiles.add(file);
      console.warn(`WARN ${message}`);
    } else {
      violations++;
      console.error(message);
    }
```

Declare `let warnings = 0;` and `const warnedFiles = new Set();` beside `let violations = 0;`, and extend the closing summary:

```js
if (warnings) {
  console.warn(
    `\ncheck:tokens — ${warnings} warning(s) across ${warnedFiles.size} vendored file(s) in components/ui/. Triaged in docs/design-system/vendored-token-findings.md; not gated, because fixing them means diverging from upstream and nobody has decided that.`,
  );
}
```

**The final success line must not call a warned file clean.** Replace the existing
`console.log(\`check:tokens — ${FILES.length} file(s) clean.\`)` with:

```js
const clean = FILES.length - warnedFiles.size;
console.log(
  warnedFiles.size
    ? `check:tokens — ${clean} of ${FILES.length} file(s) clean, ${warnedFiles.size} vendored file(s) warned.`
    : `check:tokens — ${FILES.length} file(s) clean.`,
);
```

This matters more than it looks: the last line is what a human skims and what a CI dashboard surfaces. Printing "169 file(s) clean" directly beneath two WARN lines naming two of those files is a gate that overstates its own result.

**Accepted trade-off, state it in the commit body:** a genuinely new violation in a vendored file also only warns, so it cannot block a PR. That is the price of not creating an exemption list, and it is the cheaper of the two risks — vendored files change only when someone deliberately re-vendors them.

- [ ] **Step 5: Verify green, with warnings printed**

```bash
cd apps/docs && pnpm check:tokens; echo "exit=$?"
```

Expected: `exit=0`; at least one `WARN` line naming `components/ui/tabs.tsx:19`; a total scanned count well above 130, since the glob now includes `components/ui/**`; and a final line that reports clean and warned counts **separately**, never describing a warned file as clean. Check the arithmetic in the output adds up — total scanned = clean + warned — and use those same figures if you cite them in the commit body.

- [ ] **Step 6: Prove registry files still fail**

Widening the glob must not weaken the gate where it already worked. Temporarily add `className="text-muted-foreground bg-muted"` to `apps/docs/registry/super-ai/kbd.tsx`. Run `pnpm check:tokens`; expected **exit 1**. Revert with `git checkout -- apps/docs/registry/super-ai/kbd.tsx`.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/scripts/check-tokens.mjs docs/design-system/vendored-token-findings.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(check:tokens): scan vendored ui/ primitives as warnings"
```

---

### Task 5: G2 — `data-slot` erasure

Every component here spreads `...props` *after* its own attributes, so a `data-slot` passed from a call site silently replaces the component's own and every test or style keyed to it misses. `DateSection`, `CostChip`, `StatReadout` and `EntityRow` have each been erased this way — three of them in a single batch.

Passing `data-slot` to a **vendored `ui/` primitive** stays legal: that is house idiom (`result-card` on `Card`, `frame-strip` on `Carousel`, `tool-panel` on `Tabs`) and nothing keys on those values. The gate encodes CONTINUE.md §4's refined rule exactly.

This lives in `check-contract.mts`, not `check-tokens.mjs`, because it needs `MANIFEST` — and that keeps `ci.yml` at eleven steps.

**Files:**
- Modify: `apps/docs/scripts/lib/scaffold-templates.ts:3`
- Create: `apps/docs/scripts/lib/contract-rules.ts`
- Create: `apps/docs/scripts/lib/contract-rules.test.ts`
- Modify: `apps/docs/scripts/check-contract.mts`

**Interfaces:**
- Consumes: `MANIFEST` from `apps/docs/lib/catalog.manifest`, `pascal` from `scaffold-templates`
- Produces: `findSlotErasures(file: string, source: string, registryComponents: Set<string>): string[]`

- [ ] **Step 1: Export the `pascal` helper**

`apps/docs/scripts/lib/scaffold-templates.ts:3` currently reads `const pascal = (name: string) =>`. Change it to:

```ts
export const pascal = (name: string) =>
```

- [ ] **Step 2: Write the failing test**

Create `apps/docs/scripts/lib/contract-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { findSlotErasures } from "./contract-rules";

const REGISTRY = new Set(["EntityRow", "CostChip", "StatReadout"]);

describe("findSlotErasures", () => {
  it("flags data-slot passed to a registry component", () => {
    const out = findSlotErasures("x.tsx", `<StatReadout data-slot="asset-detail-params" />`, REGISTRY);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("StatReadout");
  });

  it("flags it across a multi-line opening tag", () => {
    const src = ["<EntityRow", `  title="a"`, `  data-slot="row"`, "/>"].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toHaveLength(1);
  });

  it("allows data-slot on a vendored ui/ primitive", () => {
    // House idiom: result-card on Card, tool-panel on Tabs. Nothing keys on these.
    expect(findSlotErasures("x.tsx", `<Card data-slot="result-card" />`, REGISTRY)).toEqual([]);
  });

  it("allows a registry component with no data-slot", () => {
    expect(findSlotErasures("x.tsx", `<EntityRow title="a" />`, REGISTRY)).toEqual([]);
  });

  it("ignores a data-slot on a plain DOM element", () => {
    expect(findSlotErasures("x.tsx", `<div data-slot="wrapper" />`, REGISTRY)).toEqual([]);
  });

  it("does not attribute nested JSX's data-slot to the outer registry component", () => {
    // The real frame-strip shape. Badge is a vendored ui/ primitive and its
    // own data-slot is legal; attributing it to PreviewTile is a false
    // positive, and false positives make people contort working code.
    const src = [
      `<EntityRow`,
      `  title="a"`,
      `  badge={<Badge data-slot="frame-strip-mark">In</Badge>}`,
      `/>`,
    ].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toEqual([]);
  });

  it("still flags the outer component when its own data-slot precedes nested JSX", () => {
    const src = [
      `<EntityRow`,
      `  data-slot="mine"`,
      `  badge={<Badge data-slot="theirs">x</Badge>}`,
      `/>`,
    ].join("\n");
    expect(findSlotErasures("x.tsx", src, REGISTRY)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: FAIL — `Failed to resolve import "./contract-rules"`.

- [ ] **Step 4: Implement**

Create `apps/docs/scripts/lib/contract-rules.ts`:

```ts
// Pure predicates for the contract gate. Kept separate from check-contract.mts
// so each can be unit-tested without running the whole gate.

/**
 * A `data-slot` passed to a registry component silently replaces that
 * component's own — every component here spreads `...props` after its own
 * attributes — and every test or style keyed to the original slot then misses.
 * DateSection, CostChip, StatReadout and EntityRow have all been erased this
 * way; three of them in one batch.
 *
 * Overriding a *vendored* ui/ primitive's slot is house idiom and stays legal:
 * nothing keys on those values, and it is what makes the composition visible
 * in the DOM. Only registry components are protected.
 *
 * The attribute scan stops at the first `<` OR `>`, which matters more than it
 * looks. Stopping only at `>` was tried first and produced false positives:
 * a multi-line tag with nested JSX in a prop —
 * `<PreviewTile badge={<Badge data-slot="frame-strip-mark">…} />` — has the
 * NESTED element's `>` terminate the match, and the nested element's
 * attributes land in the outer tag's attribute region. The gate then
 * attributes a vendored `Badge`'s perfectly legal `data-slot` to
 * `PreviewTile`. That cost two false positives out of seven on the first
 * real run, and nearly cost ~97 lines of shipped component being restructured
 * to satisfy the regex rather than the regex being fixed.
 *
 * KNOWN LIMITATION, and it is the safe direction: because the scan stops at a
 * nested `<`, a `data-slot` written AFTER nested JSX in the same tag is not
 * seen. That under-reports. Under-reporting is what a gate should do when it
 * cannot parse — a false positive forces someone to contort working code.
 */
export function findSlotErasures(
  file: string,
  source: string,
  registryComponents: Set<string>,
): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^<>]*)/g)) {
    const [, tag, attrs] = m;
    if (!registryComponents.has(tag)) continue;
    if (!/\bdata-slot\s*=/.test(attrs)) continue;
    const line = source.slice(0, m.index).split("\n").length;
    found.push(
      `${file}:${line} — data-slot passed to registry component <${tag}>, which erases its own slot. Use data-<thing>-id to address rows instead.`,
    );
  }
  return found;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Wire into `check-contract.mts`**

Add to the imports at the top of `apps/docs/scripts/check-contract.mts`:

```ts
import { findSlotErasures } from "./lib/contract-rules";
import { pascal } from "./lib/scaffold-templates";
```

Then, after the manifest loop completes and before the catalog-count reconciliation, add:

```ts
// G2 — a data-slot passed to a registry component erases that component's own.
const registryComponents = new Set(manifest.map((i) => pascal(i.name)));
for (const item of manifest) {
  if (item.status !== "shipped") continue;
  const path = fileFor.component(item.name);
  if (!existsSync(path)) continue;
  errors.push(...findSlotErasures(path, readFileSync(path, "utf8"), registryComponents));
}
```

- [ ] **Step 7: Run the gate**

```bash
cd apps/docs && pnpm check:contract
```

**It did not pass — and the outcome is now part of this task.** The gate reported seven real erasures on its first run:

| Call site | Composed component | Overriding slot | Referenced by |
| --- | --- | --- | --- |
| `thread-list.tsx:33` | `DateSection` | `thread-list-section` | nothing |
| `generation-panel.tsx:209` | `PreviewTile` | expression form — inspect | — |
| `voice-clone-recorder.tsx:190` | `DisclaimerNote` | `voice-clone-recorder-disclaimer` | its own docs `anatomy` |
| `frame-strip.tsx:141` | `PreviewTile` | expression form — inspect | — |
| `template-detail.tsx:354` | `FieldRow` | `template-detail-option` | its own docs `anatomy` |
| `task-tray.tsx:102` | `EntityRow` | `task-tray-task` | its own test |
| `explore-shell.tsx:330` | `ChoiceChips` | `explore-shell-types` | nothing |

Three are *documented* — the overriding slot appears in the component's own guidance `anatomy`, so a builder deliberately re-labelled a composed primitive and wrote the new name down as public API. That is not the silent erasure §4 describes.

**Ruling: fix all seven; the gate enforces.** The harm the rule guards against still occurs regardless of intent — a consumer styling `[data-slot="date-section"]` gets nothing on a `ThreadListSection`, because the composed primitive's identity is gone from the DOM. Let the composed component keep its slot; that is also what makes the composition visible.

**Do not weaken the rule to get green.** No exemption list, no narrowed tag match, no skipped files.

- [ ] **Step 7a: Fix the seven call sites**

For each, remove the overriding `data-slot`. Where the wrapper genuinely needs a handle on the element, use `data-<thing>-id` instead — that is the documented alternative and it does not collide with the slot.

Then update what referenced the removed names: two guidance `anatomy` lists (`voice-clone-recorder.docs.tsx`, `template-detail.docs.tsx`) must document the composed component's real slot, and `task-tray.test.tsx` must query the real slot.

Inspect `generation-panel.tsx:209` and `frame-strip.tsx:141` individually — their `data-slot` is an expression, not a literal, so the right fix may differ.

**If removing an override would break a behavioural assertion** — as opposed to renaming a selector — stop and report it rather than weakening the test.

- [ ] **Step 8: Prove the gate fails on a real instance**

Temporarily change one `<EntityRow ... />` call site in `apps/docs/registry/super-ai/` to include `data-slot="probe"`. Run `pnpm check:contract`; expected **exit 1** naming that file and line. Revert with `git checkout -- <file>`.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/scripts/lib/contract-rules.ts apps/docs/scripts/lib/contract-rules.test.ts \
        apps/docs/scripts/lib/scaffold-templates.ts apps/docs/scripts/check-contract.mts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(check:contract): reject data-slot passed to a registry component"
```

---

### Task 6: G3 — exemption-list coherence

Two exemption lists exist for one component, in two files, with no link between them: `CONTRAST_EXEMPT_FILES = ["preview-tile.tsx"]` (now in `token-rules.mjs`) and `"**/stories/super-ai/PreviewTile.stories.tsx"` in `apps/storybook/vitest.config.ts`. Both are governed by "may only shrink, never grow", and nothing asserts they agree or that either has held.

**Files:**
- Modify: `apps/docs/scripts/lib/contract-rules.ts`
- Modify: `apps/docs/scripts/lib/contract-rules.test.ts`
- Modify: `apps/docs/scripts/check-contract.mts`

**Interfaces:**
- Consumes: `pascal` from `scaffold-templates`
- Produces: `parseStorybookExclusions(source: string): string[]` and `compareExemptionLists(contrast: string[], stories: string[]): string[]`

- [ ] **Step 1: Write the failing test**

Append to `apps/docs/scripts/lib/contract-rules.test.ts`:

```ts
import { compareExemptionLists, parseStorybookExclusions } from "./contract-rules";

describe("parseStorybookExclusions", () => {
  it("extracts only this repo's own super-ai story exclusions", () => {
    const src = `exclude: [
      ...configDefaults.exclude,
      "**/stories/ui/**",
      "**/stories/ai-elements/**",
      "**/stories/super-ai/PreviewTile.stories.tsx",
    ],`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("does not count a commented-out exclusion as live", () => {
    // How a human "removes" an entry. Counting it as live means G3 reports no
    // mismatch and stops catching the drift it exists to catch.
    const src = `exclude: [
      // "**/stories/super-ai/Foo.stories.tsx", // removed 2026-01
      "**/stories/super-ai/PreviewTile.stories.tsx",
    ],`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("does not count an entry inside a block comment that contains no glob", () => {
    // Deliberately glob-free. A block comment containing one of these globs is
    // a SYNTAX ERROR — the glob's own `**/` closes the comment — so it cannot
    // occur in a loadable config, and a test built on one would assert
    // behaviour on source that could never exist.
    const src = `/* PreviewTile was removed here, see the retrofit note */
      "**/stories/super-ai/PreviewTile.stories.tsx",`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("strips a multi-line block comment without eating the entry after it", () => {
    const src = [`/*`, `  a long`, `  explanation`, `*/`, `"**/stories/super-ai/PreviewTile.stories.tsx",`].join("\n");
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("keeps a live entry that has a trailing comment", () => {
    const src = `"**/stories/super-ai/PreviewTile.stories.tsx", // color-contrast x2`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });

  it("is not confused by a URL on the same line", () => {
    const src = `// see https://example.com/x
      "**/stories/super-ai/PreviewTile.stories.tsx",`;
    expect(parseStorybookExclusions(src)).toEqual(["PreviewTile"]);
  });
});

describe("compareExemptionLists", () => {
  it("passes when the two lists name the same components", () => {
    expect(compareExemptionLists(["preview-tile.tsx"], ["PreviewTile"])).toEqual([]);
  });

  it("reports a component exempt from contrast but not from the a11y gate", () => {
    const out = compareExemptionLists(["preview-tile.tsx", "kbd.tsx"], ["PreviewTile"]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("kbd");
  });

  it("reports a component excluded from the a11y gate but not from contrast", () => {
    const out = compareExemptionLists(["preview-tile.tsx"], ["PreviewTile", "EntityRow"]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("EntityRow");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: FAIL — `parseStorybookExclusions is not a function`.

- [ ] **Step 3: Implement**

Append to `apps/docs/scripts/lib/contract-rules.ts`:

```ts
import { pascal } from "./scaffold-templates";

/**
 * Pull this repo's own super-ai story exclusions out of
 * apps/storybook/vitest.config.ts. Vendored directory excludes
 * (stories/ui/**, stories/ai-elements/**) are out of scope — they are a
 * different decision, documented in a11y-baseline.md, and are not per-component.
 */
export function parseStorybookExclusions(source: string): string[] {
  // Strip comments before matching, and note this is load-bearing rather than
  // tidy. The exclusion list is edited by hand, and commenting a line out is
  // how people "remove" an entry — `// "**/stories/super-ai/Foo.stories.tsx"`.
  // A parser that still counts that as live reports no mismatch, and G3
  // silently stops catching the drift it exists to catch. The file's own
  // comments narrate exactly that retrofit ("CostChip and EntityRow were here
  // … the list shrank"), so this is the editing pattern, not a hypothetical.
  //
  // Stripping must be QUOTE-AWARE, not a regex. A naive
  // `source.replace(/\/\*[\s\S]*?\*\//g, "")` is broken here, and not
  // subtly: the glob `"**/stories/ui/**"` ends in `/**`, which contains
  // `/*`, so the regex opens a phantom block comment inside a string literal
  // and swallows everything up to the next `*/`. Measured against the real
  // `vitest.config.ts`, that returns `[]` instead of `["PreviewTile"]` — the
  // gate would then report a phantom mismatch and turn CI red on a
  // non-problem. Use the character scan below, which mirrors
  // `extractCvaCalls` in `token-rules.mjs`.
  const live = stripComments(source);

  return [...live.matchAll(/["']\*\*\/stories\/super-ai\/([A-Za-z0-9]+)\.stories\.tsx["']/g)].map(
    (m) => m[1],
  );
}

/** Strip `//` and block comments, leaving string literals untouched. */
function stripComments(source: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      // Terminates at the FIRST `*/`, deliberately, including one that falls
      // inside what looks like a string. That is exactly what a JavaScript
      // parser does, so this is faithful rather than sloppy — and it is worth
      // stating because it looks like the bug that condemned the regex above.
      //
      // The consequence: you cannot block-comment one of these globs at all.
      // `/* "**/stories/super-ai/Foo.stories.tsx" */` is a SYNTAX ERROR,
      // because the glob's own `**/` closes the comment (verified with
      // `new Function(src)`). A vitest.config.ts containing one would not
      // load and Storybook would fail long before G3 had an opinion. Line
      // comments are the only way to comment an entry out, and those are
      // handled above.
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i++; // land on the closing `/`; the loop's i++ advances past it
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Two exemption lists, in two files, both governed by "may only shrink, never
 * grow", with nothing linking them. A component silenced in one and enforced in
 * the other is either an unnoticed regression or an exemption that outlived its
 * reason — and until now neither was visible.
 */
export function compareExemptionLists(contrastFiles: string[], storyComponents: string[]): string[] {
  const pascalOf = (f: string) => pascal(f.replace(/\.tsx$/, ""));
  const fromContrastNames = new Set(contrastFiles.map(pascalOf));
  const fromStories = new Set(storyComponents);
  const errors: string[] = [];

  // Each direction names the entry as it appears in ITS OWN list — the
  // filename for token-rules.mjs, the Pascal component name for
  // vitest.config.ts. A reader chasing a mismatch needs the literal string to
  // search for, and the two lists spell the same component differently.
  for (const file of contrastFiles) {
    if (!fromStories.has(pascalOf(file))) {
      errors.push(
        `${file} is contrast-exempt in token-rules.mjs but not excluded from the a11y gate (vitest.config.ts) — one of the two lists is stale`,
      );
    }
  }
  for (const name of fromStories) {
    if (!fromContrastNames.has(name)) {
      errors.push(
        `${name} is excluded from the a11y gate (vitest.config.ts) but not contrast-exempt in token-rules.mjs — one of the two lists is stale`,
      );
    }
  }
  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: PASS, 9 tests total in this file.

- [ ] **Step 5: Wire into `check-contract.mts`**

Extend the `contract-rules` import to include `compareExemptionLists` and `parseStorybookExclusions`, add `CONTRAST_EXEMPT_FILES` from `./lib/token-rules.mjs`, and append after the G2 block:

```ts
// G3 — the contrast exemption list and the a11y exclusion list must agree.
const storybookConfig = readFileSync("../storybook/vitest.config.ts", "utf8");
errors.push(
  ...compareExemptionLists(CONTRAST_EXEMPT_FILES, parseStorybookExclusions(storybookConfig)),
);
```

- [ ] **Step 6: Run the gate**

```bash
cd apps/docs && pnpm check:contract && pnpm typecheck
```

Expected: passes — both lists currently name only `preview-tile` / `PreviewTile`.

- [ ] **Step 7: Prove the gate fails when the lists diverge**

Temporarily add `"kbd.tsx"` to `CONTRAST_EXEMPT_FILES` in `token-rules.mjs`. Run `pnpm check:contract`; expected **exit 1** naming `Kbd`. Revert with `git checkout -- apps/docs/scripts/lib/token-rules.mjs`.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/scripts/lib/contract-rules.ts apps/docs/scripts/lib/contract-rules.test.ts \
        apps/docs/scripts/check-contract.mts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(check:contract): assert the contrast and a11y exemption lists agree"
```

---

### Task 7: G4 — story-export name collisions

`statePascal("meta")` is `Meta`, which collides with `import type { Meta } from "@storybook/react"` in every generated story. `record-list` had to alias it. The gate greps for `export const Meta`, which is present either way, so it passed throughout. `Default` and `Story` collide the same way.

**Files:**
- Modify: `apps/docs/scripts/lib/contract-rules.ts`
- Modify: `apps/docs/scripts/lib/contract-rules.test.ts`
- Modify: `apps/docs/scripts/check-contract.mts`

**Interfaces:**
- Consumes: `statePascal` from `scaffold-templates`
- Produces: `findReservedStateNames(name: string, states: string[]): string[]`

- [ ] **Step 1: Write the failing test**

Append to `apps/docs/scripts/lib/contract-rules.test.ts`:

```ts
import { findReservedStateNames } from "./contract-rules";

describe("findReservedStateNames", () => {
  it("rejects a state whose Pascal form collides with the Meta import", () => {
    const out = findReservedStateNames("record-list", ["meta", "compact"]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("Meta");
  });

  it("rejects `default`, which produces the forbidden Default export", () => {
    expect(findReservedStateNames("x", ["default"])).toHaveLength(1);
  });

  it("rejects `story`", () => {
    expect(findReservedStateNames("x", ["story"])).toHaveLength(1);
  });

  it("accepts ordinary state names", () => {
    expect(findReservedStateNames("x", ["text-only", "plain", "with-footer"])).toEqual([]);
  });

  it("catches multi-word states that normalise onto a reserved name", () => {
    // statePascal strips separators and lowercases the tail: "Meta".
    expect(findReservedStateNames("x", ["META"])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: FAIL — `findReservedStateNames is not a function`.

- [ ] **Step 3: Implement**

Append to `apps/docs/scripts/lib/contract-rules.ts` (extend the existing `scaffold-templates` import to include `statePascal`):

```ts
/**
 * Story files import `Meta` and `Story` from @storybook/react, and `Default` is
 * the export the house style forbids. A state whose Pascal form is any of the
 * three produces a story file that either shadows its own import or violates
 * the naming rule.
 *
 * check:contract's existing story-state assertion cannot catch this: it greps
 * for `export const <Name>`, which is present whether or not the name collides.
 * record-list shipped with `Meta as StorybookMeta` and the gate stayed green.
 */
const RESERVED_STATE_EXPORTS = new Set(["Meta", "Story", "Default"]);

export function findReservedStateNames(name: string, states: string[]): string[] {
  const errors: string[] = [];
  for (const state of states) {
    const exported = statePascal(state);
    if (RESERVED_STATE_EXPORTS.has(exported)) {
      errors.push(
        `${name}: state "${state}" produces the reserved story export ${exported}. Rename it in catalog.manifest.ts — see CONTINUE.md §3.2.`,
      );
    }
  }
  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/docs && pnpm vitest run scripts/lib/contract-rules.test.ts
```

Expected: PASS, 14 tests total in this file.

- [ ] **Step 5: Wire into `check-contract.mts`**

Add `findReservedStateNames` to the `contract-rules` import, then inside the existing per-item manifest loop — **before** the `contractExempt` early-`continue` at line 112, so the 25 legacy items are checked too — add:

```ts
  // G4 — a state whose Pascal form collides with the story file's own imports.
  errors.push(...findReservedStateNames(item.name, item.states));
```

- [ ] **Step 6: Run the gate**

```bash
cd apps/docs && pnpm check:contract
```

**Outcome, measured:** exactly **one** item in the 114-item catalog declares a reserved state, and it is not a legacy one — `record-list`, non-exempt, wave 7, declaring `"meta"`.

The expectation that legacy items would fail was wrong, and the reason is worth recording. The 14 pre-Wave-1.5 stories that export `Default` do so because they were **hand-written**, not scaffolded from declared states. `check:contract`'s story assertion and this gate both read `states` from the manifest, so a hand-written `Default` export is invisible to both. G4 therefore binds new work and says nothing about the legacy set — which means the check can sit **before** the `contractExempt` continue with no consequence, and will simply start applying when the retrofit lands.

- [ ] **Step 6a: Rename `record-list`'s `meta` state**

This is the exact case the gate was built for. `record-list` ships today by aliasing its *import* (`import type { Meta as StorybookMeta }`) so its `export const Meta` can coexist — a workaround for a name that should never have been declared.

Rename the state to **`"metadata"`** (`statePascal` → `Metadata`, not reserved):

1. `apps/docs/lib/catalog.manifest.ts` — `record-list`'s `states`, `"meta"` → `"metadata"`. **This is the one authorised write to the manifest in this plan.**
2. `apps/storybook/src/stories/super-ai/RecordList.stories.tsx` — rename `export const Meta` to `export const Metadata`, and restore the plain `import type { Meta, StoryObj }`, dropping the `StorybookMeta` alias and updating its uses.
3. Check `apps/docs/content/components/record-list.docs.tsx` and the component's tests for references to the old state name.

The alias disappearing is the point: it existed only to work around the collision.

- [ ] **Step 7: Prove the gate fails on a real instance**

Temporarily rename any non-exempt component's first declared state to `"meta"` in `apps/docs/lib/catalog.manifest.ts`. Run `pnpm check:contract`; expected **exit 1** naming `Meta`. Revert with `git checkout -- apps/docs/lib/catalog.manifest.ts`.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/scripts/lib/contract-rules.ts apps/docs/scripts/lib/contract-rules.test.ts \
        apps/docs/scripts/check-contract.mts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(check:contract): reject state names that collide with story imports"
```

---

### Task 8: Hooks

Five hooks in a checked-in `.claude/settings.json`. Git-write denial is deliberately **not** here — hooks apply session-wide and cannot distinguish a subagent from the integrator, and the integrator must commit. That denial lives in Task 9's agent definitions, where it is precise.

**Files:**
- Create: `.claude/settings.json`
- Create: `.claude/hooks/deny-dangerous-bash.sh`
- Create: `.claude/hooks/check-tokens-on-edit.sh`
- Create: `.claude/hooks/session-baselines.sh`

**Interfaces:**
- Consumes: nothing
- Produces: hook enforcement for every session in this repo

- [ ] **Step 1: Write the Bash-denial hook**

Create `.claude/hooks/deny-dangerous-bash.sh` (`chmod +x`):

```bash
#!/usr/bin/env bash
# PreToolUse/Bash. Reads the tool input on stdin; exit 2 denies with the
# message on stderr. Each rule here is a CONTINUE.md §4 trap that has cost a
# real debugging session.
set -euo pipefail
cmd=$(jq -r '.tool_input.command // ""')

if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])pnpm[[:space:]]+format([[:space:]]|$)' \
   || printf '%s' "$cmd" | grep -Eq 'prettier[[:space:]]+--write[[:space:]]+\.[[:space:]]*$'; then
  echo "Repo-wide format is denied. The tree is not prettier-clean at HEAD, so this rewrites ~300 unrelated files — and it breaks check:contract, whose guidance regexes (whatItIs:\\s*\"...\") do not survive re-wrapping. Format only what you touched: pnpm exec prettier --write <paths>" >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -Eq 'shadcn[[:space:]]+add[[:space:]]+https?://'; then
  echo "npx shadcn add <third-party URL> is denied in this repo. It resolves the item's own registryDependencies against the default Radix registry, offers to overwrite this repo's Base UI primitives, and then writes no component files. Vendor the file by hand — see CONTINUE.md §5.1." >&2
  exit 2
fi

exit 0
```

- [ ] **Step 2: Verify the denial hook by hand**

```bash
echo '{"tool_input":{"command":"pnpm format"}}' | .claude/hooks/deny-dangerous-bash.sh; echo "exit=$?"
```

Expected: the explanatory message on stderr and `exit=2`.

```bash
echo '{"tool_input":{"command":"pnpm test"}}' | .claude/hooks/deny-dangerous-bash.sh; echo "exit=$?"
```

Expected: no output, `exit=0`.

- [ ] **Step 3: Write the post-edit token check**

Create `.claude/hooks/check-tokens-on-edit.sh` (`chmod +x`):

```bash
#!/usr/bin/env bash
# PostToolUse/Write|Edit. Turns a CI-time token failure into an edit-time one.
# Advisory: exit 0 always, so a failure surfaces without blocking the edit that
# is often mid-way through a legitimate multi-step change.
set -euo pipefail
path=$(jq -r '.tool_input.file_path // ""')
case "$path" in
  *apps/docs/registry/super-ai/*.tsx) ;;
  *) exit 0 ;;
esac
cd "$(git rev-parse --show-toplevel)/apps/docs" || exit 0
if ! out=$(node scripts/check-tokens.mjs 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^registry/|^components/' >&2 || true
fi
exit 0
```

- [ ] **Step 4: Write the session-start hook**

Create `.claude/hooks/session-baselines.sh` (`chmod +x`):

```bash
#!/usr/bin/env bash
# SessionStart. CONTINUE.md §1 keeps these numbers by hand and §6 already
# contradicts it. Printing them live lets the doc stop being a dashboard.
set -euo pipefail
root=$(git rev-parse --show-toplevel)
exempt=$(grep -c 'contractExempt' "$root/apps/docs/lib/catalog.manifest.ts" || echo "?")
items=$(grep -c '"name":' "$root/apps/docs/public/r/registry.json" 2>/dev/null || echo "?")
echo "super-ai-components — contractExempt items: $exempt · registry items: $items"
echo "Worktree: $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)"
echo "If this is an isolated worktree for a fan-out, CHECK ITS BASE COMMIT — twelve agents were once cut from main and none saw the integration branch's prep (CONTINUE.md §1). Take your own dev-server port too."
```

- [ ] **Step 5: Wire them up**

Create `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/deny-dangerous-bash.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check-tokens-on-edit.sh" }]
      }
    ],
    "SessionStart": [
      {
        "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-baselines.sh" }]
      }
    ]
  }
}
```

The `catalog.manifest.ts` write confirmation from spec §5 is **not** implemented as a hook: `.claude/settings.json` is checked in and applies to the integrator too, for whom writing that file is the job. The agent definitions in Task 9 deny it instead, which is where the distinction actually exists.

- [ ] **Step 6: Verify the hooks load**

Restart the session, or start a new one in this repo, and confirm the `SessionStart` line prints. Then attempt `pnpm format` via Bash and confirm it is denied with the explanatory message.

- [ ] **Step 7: Commit**

```bash
git add .claude/settings.json .claude/hooks/
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(claude): enforce the format, shadcn-add and token traps as hooks"
```

---

### Task 9: Agents

The `component-builder` prompt is deliberately thin — it *points at* `component-build-brief.md` rather than restating it, honouring the repo's own no-second-copy rule (§3.4). Its value over a pasted prompt is tool configuration, which converts three prose rules into impossibilities.

**Files:**
- Create: `.claude/agents/component-builder.md`
- Create: `.claude/agents/retrofit-builder.md`

**Interfaces:**
- Consumes: hooks from Task 8 (they apply to subagents too)
- Produces: two `subagent_type` values usable from the Agent tool and from Task 10's skills

- [ ] **Step 1: Write `component-builder`**

Create `.claude/agents/component-builder.md`:

```markdown
---
name: component-builder
description: Builds one component in the super-ai registry, filling its five scaffolded files. Dispatched one per component during a parallel wave; not for direct invocation.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You build exactly one component in this registry.

**Read `docs/design-system/component-build-brief.md` before writing anything.**
It is the house contract and it is not summarised here — one copy, on purpose.
Then read your component's entry in `docs/design-system/component-specs.md`.

## Your write scope

Only these files, for your component's `<name>`:

- `apps/docs/registry/super-ai/<name>.tsx`
- `apps/docs/registry/super-ai/<name>.test.tsx`
- `apps/docs/components/demos/<name>-demo.tsx`
- `apps/docs/content/components/<name>.docs.tsx`
- `apps/docs/content/components/<name>.examples.tsx` (optional)
- `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`

Write nothing else. Other components are being built concurrently in sibling
worktrees.

**Never write `apps/docs/lib/catalog.manifest.ts`.** The integrator owns it and
reconciles your declared dependencies against your real imports afterwards.

## Commands

Run, from `apps/docs`:
- `pnpm vitest run registry/super-ai/<name>.test.tsx`
- `pnpm typecheck`
- `pnpm check:tokens`

**Never run** any `git` write command (`commit`, `add`, `checkout`, `stash`,
`reset`). `refs/stash` is shared across worktrees and an agent has already lost
work that way. To read a file from history use
`git show HEAD:<path> > /tmp/copy`.

**Never run** `pnpm build`, the full `pnpm test`, or anything in
`apps/storybook`. The integrator runs the full gates centrally.

## Report

Terse. Status; props signature; test counts (fail → pass); typecheck and
check:tokens results; what you composed; and anything in the spec you could not
honour, with the reason.

Flag judgment calls rather than burying them. Several of this system's best
decisions came from a builder saying "the spec is ambiguous here and I chose X".
If a component you were told to compose does not fit, **say so — do not fork
it.** A reimplemented row passes every gate and is still wrong.
```

- [ ] **Step 2: Write `retrofit-builder`**

Create `.claude/agents/retrofit-builder.md`:

```markdown
---
name: retrofit-builder
description: Brings one pre-Wave-1.5 contractExempt component up to the story-state and guidance contracts. The component file already exists and must not change. Dispatched one per component; not for direct invocation.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You retrofit exactly one already-shipped component so it satisfies the full
contract and can lose its `contractExempt: true` flag.

**Read `docs/design-system/component-build-brief.md` first** — specifically its
"Guidance" and "Story" sections. It is not summarised here.

## Your write scope

Only these two files, for your component's `<name>`:

- `apps/docs/content/components/<name>.docs.tsx` (usually does not exist yet —
  `check-contract.mts` skips the existence check for exempt items, so all 25
  ship with no guidance module at all)
- `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`

Plus, optionally, `apps/docs/content/components/<name>.examples.tsx`.

**Do not modify `apps/docs/registry/super-ai/<name>.tsx`.** This component is
shipped and installed by consumers. If you believe it must change to satisfy
the contract, stop and report that instead — it is a decision for the
integrator, not a change for you to make.

**Never write `apps/docs/lib/catalog.manifest.ts`.** If a declared state needs
renaming — `default`, `meta` and `story` all produce reserved story exports —
report the rename you need. The integrator applies it.

## What "done" means

- One story export per declared state, with real `args`. No bare `Default`.
- `componentDocsPage(<Pascal>Docs)` as `parameters.docs.page`.
- Every guidance field filled: `whatItIs`, `whyItMatters`, `evidence`,
  `anatomy` (your component's **real** `data-slot` names — read the source),
  `usage`, ≥2 `dos` and ≥2 `donts` each with a live example, ≥2 `pitfalls`.
- Never invent Evidence products. If the spec has none, use `evidence: []`.

## Commands

From `apps/docs`: `pnpm typecheck`, `pnpm check:tokens`.

**Never run** any `git` write command, `pnpm build`, the full `pnpm test`, or
anything in `apps/storybook`.

## Report

Terse. Which states you wrote stories for; any manifest state rename you need
and why; anything in the component that blocked the retrofit; and any pitfall
you found in the source that is not yet written down anywhere.
```

- [ ] **Step 3: Verify the agents are registered**

Restart the session and confirm `component-builder` and `retrofit-builder` appear in the available agent types.

- [ ] **Step 4: Smoke-test the write restriction**

Dispatch `retrofit-builder` with: *"Report the current contents of `apps/docs/lib/catalog.manifest.ts`'s entry for `kbd`. Do not modify anything."* Confirm it reads and reports without writing.

- [ ] **Step 5: Commit**

```bash
git add .claude/agents/
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(claude): add component-builder and retrofit-builder agents"
```

---

### Task 10: `gate-run` skill

The highest value-per-line item in this plan. CONTINUE.md §1 records the Playwright smoke gate going unrun for an entire phase because a hand-written gate list omitted it — and because GitHub Actions stops at the first failure, its absence also hid the Storybook a11y gate and the consumer install test, the two that verify the phase's most novel work.

**Files:**
- Create: `.claude/skills/gate-run/SKILL.md`
- Create: `.claude/skills/gate-run/run-gates.sh`

**Interfaces:**
- Consumes: `ci.yml`'s eleven steps
- Produces: a `gate-run` skill invocable by name

- [ ] **Step 1: Write the runner**

Create `.claude/skills/gate-run/run-gates.sh` (`chmod +x`). The order must mirror `.github/workflows/ci.yml`'s `verify` job exactly:

```bash
#!/usr/bin/env bash
# Runs every gate in .github/workflows/ci.yml's order. Stops at the first
# failure, exactly as GitHub Actions does — which is precisely why order
# matters: a red gate early in the pipeline hides every gate behind it, and
# that has already happened here (CONTINUE.md §1).
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

run() {
  printf '\n=== %s ===\n' "$1"
  shift
  if ! "$@"; then
    printf '\nFAILED: %s\n' "$*" >&2
    printf 'Every gate after this one is UNRUN. Fix and re-run from the top.\n' >&2
    exit 1
  fi
}

run "lint"           pnpm lint
run "typecheck"      pnpm typecheck
run "check:tokens"   pnpm check:tokens
run "check:contract" pnpm check:contract
run "test"           pnpm test
run "build:registry" pnpm build:registry
run "build"          pnpm build
run "playwright smoke" pnpm --filter docs exec playwright test

# Not optional: Vite's dep optimiser invalidates mid-run after components are
# added and produces a wall of fake failures that look like a11y errors but say
# "Failed to fetch dynamically imported module" (CONTINUE.md §3.5).
rm -rf apps/storybook/node_modules/.cache/storybook
run "storybook a11y" pnpm --filter storybook test:stories

run "consumer install" apps/docs/scripts/consumer-test.sh

printf '\nAll gates green.\n'
```

- [ ] **Step 2: Write the skill**

Create `.claude/skills/gate-run/SKILL.md`:

```markdown
---
name: gate-run
description: Run every CI gate locally in ci.yml's exact order. Use before claiming a batch is done, before opening a PR, or whenever you need to know whether this tree is actually green.
---

# Running the gates

```bash
.claude/skills/gate-run/run-gates.sh
```

Eleven steps, in `.github/workflows/ci.yml`'s order. It stops at the first
failure, as CI does.

## Why the order is the point

CI stops at the first failing step, so **a red gate early in the pipeline hides
every gate behind it.** That is not hypothetical here: the Playwright smoke gate
was missing from a phase plan's gate list, went unrun for the whole phase, and
its eventual failure silently prevented the Storybook a11y gate and the consumer
install test from ever running — the two that verified that phase's most novel
work.

**Never hand-write a gate list.** If you need one, run this. If `ci.yml` gains a
step, add it here in the same position, and nowhere else.

## Before you trust a green run

- **`next start` serves the prebuilt output.** Editing source without rebuilding
  tests a stale app, and the Playwright smoke gate will pass against it. This
  script runs `build` before `playwright`, so a full run is safe — a partial one
  is not.
- **A gate that has only ever passed has proved nothing.** When you add one,
  make it fail on a deliberate instance of the bug first.

## First run on a fresh clone

`pnpm test:stories` fails with `Executable doesn't exist` rather than anything
a11y-shaped if Playwright's browsers are missing:

```bash
cd apps/storybook && pnpm exec playwright install chromium
```
```

- [ ] **Step 3: Run it**

```bash
.claude/skills/gate-run/run-gates.sh
```

Expected: all eleven green. This is also the integration check for Tasks 1–7 — every gate change so far must survive a full run.

- [ ] **Step 4: Verify it stops correctly**

Temporarily break lint (add an unescaped `'` to a JSX text node in any demo). Re-run; expected: it fails at `lint` and explicitly says the remaining gates are unrun. Revert.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/gate-run/
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(claude): add gate-run skill mirroring ci.yml's eleven steps"
```

---

### Task 11: `build-component` and `integrate-batch` skills

**Files:**
- Create: `apps/docs/scripts/reconcile-deps.mts`
- Create: `.claude/skills/build-component/SKILL.md`
- Create: `.claude/skills/integrate-batch/SKILL.md`

**Interfaces:**
- Consumes: the agents from Task 9, the `gate-run` skill from Task 10
- Produces: `pnpm reconcile:deps` in `apps/docs/package.json`

- [ ] **Step 1: Write the reconciliation script**

Create `apps/docs/scripts/reconcile-deps.mts` — CONTINUE.md §3.5's shell loop, made a script that diffs against the manifest instead of only printing:

```ts
// Reconciles each shipped component's DECLARED dependencies against its REAL
// imports. Never trust the catalog's assumed bases: it names primitives this
// repo does not vendor, and never trust a builder's own declared list either.
import { existsSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";

const RELEVANT = /^(@\/components\/ui\/|@\/registry\/super-ai\/|lucide-react|@base-ui)/;

const names = process.argv.slice(2);
const items = names.length ? MANIFEST.filter((i) => names.includes(i.name)) : MANIFEST;

let drift = 0;
for (const item of items) {
  const path = `registry/super-ai/${item.name}.tsx`;
  if (!existsSync(path)) continue;

  const imports = [...readFileSync(path, "utf8").matchAll(/from\s+"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => RELEVANT.test(s));

  const realShadcn = [...new Set(imports.filter((s) => s.startsWith("@/components/ui/")))]
    .map((s) => s.replace("@/components/ui/", ""))
    .sort();
  const realConsumes = [...new Set(imports.filter((s) => s.startsWith("@/registry/super-ai/")))]
    .map((s) => s.replace("@/registry/super-ai/", ""))
    .sort();

  const declaredShadcn = [...item.shadcn].sort();
  const declaredConsumes = [...item.consumes].sort();

  const diff = (a: string[], b: string[]) => JSON.stringify(a) !== JSON.stringify(b);
  if (diff(realShadcn, declaredShadcn) || diff(realConsumes, declaredConsumes)) {
    drift++;
    console.log(`${item.name}`);
    if (diff(realShadcn, declaredShadcn)) {
      console.log(`  shadcn   declared ${JSON.stringify(declaredShadcn)} · real ${JSON.stringify(realShadcn)}`);
    }
    if (diff(realConsumes, declaredConsumes)) {
      console.log(`  consumes declared ${JSON.stringify(declaredConsumes)} · real ${JSON.stringify(realConsumes)}`);
    }
  }
}

// @base-ui/react is normally omitted from `npm`: it arrives as a peer of any
// vendored ui/ primitive the component also imports. The exception is a
// component importing NO ui/ primitive at all — time-ruler uses only
// @base-ui/react/slider, so nothing else would drag the package in.
console.log(
  drift
    ? `\n${drift} item(s) drifted. Update catalog.manifest.ts from the REAL column, then re-run.`
    : `\n${items.length} item(s) reconciled, no drift.`,
);
process.exit(drift ? 1 : 0);
```

- [ ] **Step 2: Add the script entry**

In `apps/docs/package.json`, add to `"scripts"`:

```json
    "reconcile:deps": "tsx scripts/reconcile-deps.mts",
```

- [ ] **Step 3: Run it against the whole catalog**

```bash
cd apps/docs && pnpm reconcile:deps
```

Expected: `no drift` — `check:contract` already asserts the derived form of this, so any drift reported here is a genuine finding worth recording in the task report.

- [ ] **Step 4: Write `build-component`**

Create `.claude/skills/build-component/SKILL.md`:

```markdown
---
name: build-component
description: Build a batch of registry components end to end — manifest prep, scaffold, parallel fan-out, integration, gates. Use when adding components to the super-ai catalog or retrofitting existing ones.
---

# Building a batch

The full reasoning is in `docs/CONTINUE.md` §3. This is the sequence.

## 1. Prepare the manifest — you do this, not the agents

`apps/docs/lib/catalog.manifest.ts` is the single source of truth and the one
shared file. Set `status: "building"` and normalise each item's `states` into
clean kebab-case identifiers — the raw values came from a markdown table and
contain prose like `"8–14 items"`.

Three naming traps, all of which have bitten:

- **`default`, `meta` and `story` are reserved.** Their Pascal forms are the
  forbidden `Default` export and the story file's own `Meta`/`Story` imports.
  `check:contract` now rejects them (G4) — but rename them here rather than
  discovering it three steps later.
- **Two states that normalise to the same identifier silently collide.**
- Use meaningful names: `text-only`, `plain`.

## 2. Scaffold

```bash
cd apps/docs && pnpm new:component <name>
```

Five files per item, with deliberately failing tests.

## 3. Fan out — one agent per component

Dispatch `component-builder` (or `retrofit-builder` for a `contractExempt`
item), one per component, in parallel. Concurrency above ~16 just queues.

Give each agent **only**: its spec anchor, its declared states, and
component-specific steering — which shipped primitive it must compose, which
a11y trap applies to its shape, which prior component solved the same problem.

**Do not paste the house rules into the prompt.** The agent is pointed at
`component-build-brief.md`; a second copy is how instructions drift, which is
the reason the brief exists.

### Worktrees

Give each agent its own git worktree — they otherwise share a working tree and
each runs a repo-root `pnpm typecheck`, racing on `tsbuildinfo` and typechecking
against each other's half-written files.

Two things that have gone wrong anyway:

- **Check the worktree's base commit.** An isolated worktree may be cut from
  `main` rather than your integration branch, so it will not carry your manifest
  prep. Twelve agents once all reported "the five files were not scaffolded".
- **Take your own port and browser tab.** A sibling worktree's dev server on the
  same port will serve *its* build while your preview reports success.

## 4. Integrate

Use the `integrate-batch` skill.

## 5. Gates

Use the `gate-run` skill. Never hand-write a gate list.
```

- [ ] **Step 5: Write `integrate-batch`**

Create `.claude/skills/integrate-batch/SKILL.md`:

```markdown
---
name: integrate-batch
description: Land a finished batch of components — reconcile declared dependencies against real imports, regenerate wiring, run the gates. Use after a parallel build fan-out completes.
---

# Integrating a batch

You do this centrally. Agents never touch the manifest.

## 1. Reconcile declared deps against real imports

```bash
cd apps/docs && pnpm reconcile:deps <name> <name> ...
```

Omit the names to check the whole catalog. It prints `declared` vs `real` for
`shadcn` and `consumes`.

**Never take these from the catalog's assumed bases** — it names primitives this
repo does not vendor — **and never from a builder's own declared list.** Only
real imports.

### `@base-ui/react` in `npm`

Normally omitted: it arrives as a peer of any vendored `ui/` primitive the
component also imports, which is why `parameter-panel`, `run-button` and
`compare-viewer` all declare `[]`. The exception is a component importing **no**
`ui/` primitive at all — `time-ruler` uses only `@base-ui/react/slider`, so
nothing would drag the package in and it declares `npm: ["@base-ui/react"]`.
Check rather than assuming.

## 2. Update the manifest and regenerate

Set `shadcn` / `consumes` / `npm` from the real column, flip `status` to
`"shipped"`, then:

```bash
cd apps/docs && pnpm gen:wiring && pnpm check:contract
```

## 3. Run every gate

Use the `gate-run` skill.

## 4. Commit

Every component ships with its story and its registry entry **in the same
commit**. Keep a batch in one PR so the family reads as a set.

```bash
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit
```

GitHub rejects the default email for this account.
```

- [ ] **Step 6: Verify the skills load**

Restart the session and confirm `build-component`, `integrate-batch` and `gate-run` appear in the available skills list.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/build-component/ .claude/skills/integrate-batch/ \
        apps/docs/scripts/reconcile-deps.mts apps/docs/package.json
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(claude): add build-component and integrate-batch skills"
```

---

### Task 12: G5 — `expectAccessibleName` helper (not a gate)

Independent of Tasks 1–11; can be done at any point.

`<span>In</span><span class="sr-only"> point at 3s</span>` computes as **"Inpoint at 3s"** — accname concatenates name-from-content chunks with whitespace trimmed and no separator. Two agents hit this independently in one afternoon (`frame-strip`, `transcript-editor`) and it broke three tests before either worked out why.

**Spec §6 G5 decides deliberately against a static gate.** A detector for "element with visible text plus an `sr-only` sibling" fires on every legitimate use of the pattern, and a noisy gate gets excluded or ignored — the failure mode this whole plan exists to avoid. This ships a test helper and a brief entry instead, and the spec records it as the weaker option.

**Files:**
- Create: `apps/docs/lib/test-utils.ts`
- Create: `apps/docs/lib/test-utils.test.tsx`
- Modify: `docs/design-system/component-build-brief.md`

**Location matters and is not negotiable.** This helper does **not** go under `registry/super-ai/` — that directory is the published product, installed verbatim by `npx shadcn add`, and a test helper must never be installable. `apps/docs/lib/` is already covered by `vitest.config.ts`'s `lib/**/*.test.{ts,tsx}` include and by the `@/` alias, so component tests import it as `@/lib/test-utils`.

**Interfaces:**
- Consumes: `@testing-library/dom`'s `computeAccessibleName` via `dom-accessibility-api` (already present transitively through `@testing-library/jest-dom`)
- Produces: `expectAccessibleName(el: Element, expected: string): void`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/lib/test-utils.test.tsx` (`.tsx` — it contains JSX):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectAccessibleName } from "./test-utils";

describe("expectAccessibleName", () => {
  it("passes when the computed name matches", () => {
    render(<button>Save</button>);
    expect(() => expectAccessibleName(screen.getByRole("button"), "Save")).not.toThrow();
  });

  it("catches sr-only text fusing with the visible text", () => {
    // The real frame-strip / transcript-editor bug: this computes as
    // "Inpoint at 3s", not "In point at 3s".
    render(
      <button>
        <span>In</span>
        <span className="sr-only"> point at 3s</span>
      </button>,
    );
    expect(() => expectAccessibleName(screen.getByRole("button"), "In point at 3s")).toThrow(
      /Inpoint at 3s/,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/docs && pnpm vitest run lib/test-utils.test.tsx
```

Expected: FAIL — `Failed to resolve import "./test-utils"`.

- [ ] **Step 3: Implement**

Create `apps/docs/lib/test-utils.ts`:

```ts
import { computeAccessibleName } from "dom-accessibility-api";

/**
 * Assert an element's COMPUTED accessible name, not its text content.
 *
 * accname concatenates name-from-content chunks with whitespace trimmed and no
 * separator, so `<span>In</span><span class="sr-only"> point at 3s</span>`
 * computes as "Inpoint at 3s". Two components shipped that bug on the same
 * afternoon and it broke three tests before anyone worked out why.
 *
 * The fix at the component is either an outright `aria-label`, or marking the
 * visual half `aria-hidden` and putting the COMPLETE phrase in the sr-only span.
 *
 * This is deliberately a helper rather than a static gate: a detector for
 * "visible text plus an sr-only sibling" fires on every legitimate use of the
 * pattern, and a noisy gate gets excluded. See the design spec §6 G5.
 *
 * Lives in lib/, not registry/super-ai/ — the registry is the published
 * product and a test helper must never be installable by `shadcn add`.
 */
export function expectAccessibleName(el: Element, expected: string): void {
  const actual = computeAccessibleName(el);
  if (actual !== expected) {
    throw new Error(
      `accessible name mismatch — expected "${expected}", computed "${actual}". ` +
        `If the two differ only by a missing space, an sr-only span has fused with the visible text.`,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/docs && pnpm vitest run lib/test-utils.test.tsx
```

Expected: PASS, 2 tests. If `dom-accessibility-api` does not resolve, add it explicitly: `pnpm --filter docs add -D dom-accessibility-api`.

- [ ] **Step 5: Confirm it is nowhere near the published registry**

```bash
cd apps/docs && pnpm build:registry && pnpm check:contract
grep -c 'test-utils' public/r/registry.json || echo "absent, as required"
```

Expected: both gates pass and `test-utils` is **absent** from `registry.json`. Living in `lib/` is what guarantees this — `gen-registry.mts` only walks `registry/super-ai/`, so there is no orphan-file question and no ignore list to extend.

- [ ] **Step 6: Document it in the brief**

In `docs/design-system/component-build-brief.md`, under "## Accessibility is a blocking gate", append a bullet:

```markdown
- **An `sr-only` suffix fuses with the visible text in the accessible name.**
  `<span>In</span><span class="sr-only"> point at 3s</span>` computes as
  **"Inpoint at 3s"** — accname concatenates name-from-content chunks with
  whitespace trimmed and no separator. Two components shipped this on the same
  afternoon. Either set an outright `aria-label`, or mark the visual half
  `aria-hidden` and put the *complete* phrase in the sr-only span. Assert it
  with `expectAccessibleName` from `@/lib/test-utils`, not with
  `toHaveTextContent` — text content will not show you the bug.
```

- [ ] **Step 7: Commit**

```bash
git add apps/docs/lib/test-utils.ts apps/docs/lib/test-utils.test.tsx \
        docs/design-system/component-build-brief.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "test: add expectAccessibleName helper for sr-only name fusion"
```

---

### Task 13: G6 — the jsdom animation shim, at its real size

Do this **last**, and only after Tasks 2–12 are green. It is independent of all of them, and unlike them it changes behaviour across the whole `apps/docs` suite.

**What the first attempt established** (diff preserved at `.superpowers/sdd/2026-08-11-agentic-layer-infrastructure/g6-attempt-1.diff`):

- The shim is correct and two lines: `Element.prototype.getAnimations ??= () => [];` in `apps/docs/vitest.setup.ts`.
- Base UI branches on whether that method **exists**. Undefined → overlays unmount synchronously. Defined, even returning `[]` → they take the exit-animation path and unmount asynchronously.
- So the shim is a suite-wide behavioural switch, not a stub. Five shipped components' tests assert synchronous unmounting: `inline-generate-popup.test.tsx:65`, `recommendation-card.test.tsx:57`, `selection-toolbar.test.tsx:106`, `settings-dialog.test.tsx:206`, `tool-panel.test.tsx:151`.
- **The failure count varied between runs — 4, then 5.** That is the open question this task must answer, and it must be answered before any assertion is rewritten.

**Files:**
- Modify: `apps/docs/vitest.setup.ts`
- Modify: up to five test files named above
- Modify: `docs/CONTINUE.md` (§4 traps)

**Interfaces:**
- Consumes: nothing
- Produces: `Element.prototype.getAnimations` in every `apps/docs` jsdom test

- [ ] **Step 1: Reproduce and quantify the variance**

Apply the shim only (not the assertion fixes):

```bash
cd apps/docs && git apply ../../.superpowers/sdd/2026-08-11-agentic-layer-infrastructure/g6-attempt-1.diff
```

Then run the five files ten times, recording the failing-test count each run:

```bash
for i in $(seq 1 10); do
  pnpm vitest run registry/super-ai/{inline-generate-popup,recommendation-card,selection-toolbar,settings-dialog,tool-panel}.test.tsx 2>&1 | grep -E '^ *Tests '
done
```

- [ ] **Step 2: Branch on what Step 1 shows**

**If all ten runs give the same count** — the variance was cross-file interference in the full-suite run, not a race. Proceed to Step 3 and rewrite all five assertions with `waitFor`.

**If the count varies** — at least one component's unmount is genuinely racing, and `waitFor` would hide it rather than fix it. Stop and report: identify which test varies, and whether the race exists in the component or only under jsdom's fake timing. A racing unmount in a shipped component is a real defect and belongs in its own fix, not buried in a test-infrastructure task.

- [ ] **Step 3: Rewrite the assertions (only if Step 2 says the count is stable)**

For each of the five, wrap the close/unmount assertion in `waitFor`, matching each file's existing style. Do not weaken any assertion — a count of 1 stays 1, an absent element stays absent. Add a comment at the first one naming the Base UI branch, so nobody "simplifies" the await away.

- [ ] **Step 4: Verify**

```bash
cd apps/docs && pnpm vitest run
```

Expected: **1387/1387 across 137 files** — the same baseline the branch started from, now with the shim in place. Any other number is a finding, not a pass. Run it three times before believing it.

- [ ] **Step 5: Record the trap**

Add to `docs/CONTINUE.md` §4, which is where this repo keeps traps that have cost real time:

```markdown
**Defining `Element.getAnimations` in jsdom switches every Base UI overlay to
its async exit path.** Base UI branches on the method's existence, not its
return value, so a two-line `vitest.setup.ts` shim moves popups, dialogs and
tab panels from synchronous unmount to awaited unmount all at once — and five
components' tests asserted the synchronous behaviour. The shim is right (every
real browser defines it, so the async path is what ships); the assertions were
passing only because jsdom lacked an API browsers have. If you add a jsdom
shim, check it against the base commit before calling any new failure
pre-existing.
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/vitest.setup.ts apps/docs/registry/super-ai/*.test.tsx docs/CONTINUE.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "test: shim Element.getAnimations, and await Base UI's async unmount"
```

---

## Definition of done

- [ ] `.claude/skills/gate-run/run-gates.sh` passes all eleven steps.
- [ ] `ci.yml` still has exactly eleven steps — no new ones were added.
- [ ] Each of G1, G2, G3, G4 has been observed **failing** on a deliberately introduced instance of its bug, and passing after revert.
- [ ] `pnpm check:tokens` scans `components/ui/**` and `docs/design-system/vendored-token-findings.md` records what that surfaced, `CONSUMER-FACING` items marked.
- [ ] `pnpm format` is denied by hook, with the explanation.
- [ ] `component-builder` and `retrofit-builder` are registered and cannot write `catalog.manifest.ts`.
- [ ] The G4 run's list of reserved legacy state names is recorded — it is direct input to Plan 2's manifest prep.
- [ ] `expectAccessibleName` exists and the build brief points at it (G5's deliberately weaker alternative to a gate).
- [ ] G6 (Task 13) is either complete with the suite at 1387/1387, or reported out with the racing-unmount finding from its Step 2. Task 1 is deferred and must not be implemented.
- [ ] `pnpm vitest run` from `apps/docs` is **1387/1387 across 137 files** — the branch's base baseline. Any deviation is a finding; never describe one as pre-existing without checking it against the base commit.

## What this plan does not do

Plan 2 — the 25-item `contractExempt` retrofit (spec §7) — is written **after** this lands, because its manifest-prep step depends on G4's actual findings and its fan-out depends on `retrofit-builder` existing. Spec §9's other exclusions (the §8 composition gaps, the three §5.11 promotions, any consumer-facing cookbook) stay out of scope.
