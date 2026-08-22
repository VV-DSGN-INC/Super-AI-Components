# ds-rules Retrofit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move this repo's design rules into one typed-record package (`packages/ds-rules`) that generates the detector, keeps CI's eleven steps unchanged, makes the two prose ratchets mechanical, and scores the repo against the vendored ds-architecture conformance checker.

**Architecture:** A new pnpm workspace holds zod-validated rule records (harvested core + local TOK rules), emits `rules/*.json`, and ships a dependency-free `rulecheck.mjs` CLI that the existing `check:tokens` task, write-time hook, and unslop skill all consume. Structural checks that patterns can't express (`token-rules.mjs`) move into the package and are routed by rule id. Ratchets (a11y exclusions, cssVars liveness) are baseline-JSON subset tests in `apps/docs`.

**Tech Stack:** Node ≥ 20 ESM, pnpm workspaces + turbo, vitest, zod, tsx. No new CI steps.

**Spec:** `docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md` — read it first; this plan implements it PR by PR.

## Global Constraints

- **pnpm, never npm.** CI installs `--frozen-lockfile`; run `pnpm install` after any package.json change so the lockfile updates in the same commit.
- **Run gates from the REPO ROOT** (`pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test`). Root covers all workspaces; running from `apps/docs` has bitten twice.
- **CI (`.github/workflows/ci.yml`) must not change** — same eleven steps, same order, in every PR of this plan.
- **Branch per PR; never commit to `main`.** Branch names are given per PR section. Remote is `VV-DSGN-INC/Super-AI-Components` — confirm with `git remote -v` before any push.
- **The archive** is `~/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip` (quote the path — it contains a space). Tasks extract from it with `unzip`; never hand-retype harvested content.
- **Behavior parity is sacred in PR 2.** Migrate the old gate's patterns byte-for-byte. Improvements are out of scope for this plan.
- **CLAUDE.md is a map, not a rulebook.** When a task updates it, change pointers only; never paste rule content into it.
- **No `pnpm build:registry` needed** unless a task edits `apps/docs/registry/**` (only the PR 3 liveness triage might). If it does, run it and commit the regenerated output in the same commit.
- Commit messages: conventional style (`feat(ds-rules): …`, `docs(o): …`), each ending with the Claude co-author trailer used in this repo.

---

# PR 1 — `feat/ds-rules-package`: the package, records, fixtures (no CI consumer yet)

### Task 1: Scaffold `packages/ds-rules` with the harvested schema

**Files:**
- Create: `packages/ds-rules/package.json`
- Create: `packages/ds-rules/tsconfig.json`
- Create: `packages/ds-rules/vitest.config.ts`
- Create: `packages/ds-rules/src/schema.ts` (harvested + one-line edit)
- Create: `packages/ds-rules/src/schema.test.ts`

**Interfaces:**
- Consumes: archive file `ds-architecture/starter-kit/02-rules/schema.ts`.
- Produces: `ruleSchema` (zod), `detectSchema`, `RULE_ID_PATTERN`, `CATALOGUE_VERSION`, `type Rule` — exactly the harvested exports. Later tasks import `type Rule` and `ruleSchema` from `./schema`.

- [ ] **Step 1: Extract the harvested schema**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p packages/ds-rules/src
unzip -p "$HOME/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip" \
  "ds-architecture/starter-kit/02-rules/schema.ts" > packages/ds-rules/src/schema.ts
```

- [ ] **Step 2: Make the one deliberate edit — allow the TOK prefix**

In `packages/ds-rules/src/schema.ts`, change the `RULE_ID_PATTERN` line:

```ts
// Old:
export const RULE_ID_PATTERN = /^(COL|TYP|LAY|CMP|ICO|MOT|CPY|CHT|STA|SYS)-\d+$/
// New (TOK added for this repo's token-contract rules; the only edit to the harvested file):
export const RULE_ID_PATTERN = /^(COL|TYP|LAY|CMP|ICO|MOT|CPY|CHT|STA|SYS|TOK)-\d+$/
```

- [ ] **Step 3: Write the package manifest and configs**

`packages/ds-rules/package.json` — the three devDependency versions below are working defaults; before writing the file, print `apps/docs`'s versions (`node -e "const d=require('./apps/docs/package.json').devDependencies;console.log(d.typescript,d.vitest,d.zod)"` from the repo root) and use those wherever they exist — a vitest major that differs from `apps/docs`'s would fork test infrastructure:

```json
{
  "name": "ds-rules",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./schema": "./src/schema.ts",
    "./core": "./src/core.ts",
    "./local": "./src/local.ts",
    "./token-rules": "./src/token-rules.mjs"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "rules:emit": "RULES_EMIT=1 vitest run src/emit.test.ts"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "zod": "^3.23.0"
  }
}
```

`packages/ds-rules/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "rulecheck.mjs"]
}
```

If `tsc` then complains about missing node types, add `"@types/node"` to devDependencies at the same version `apps/docs` uses.

`packages/ds-rules/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Write the failing schema test**

`packages/ds-rules/src/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RULE_ID_PATTERN, ruleSchema } from "./schema";

const valid = {
  id: "TOK-1",
  title: "No raw hex colours",
  severity: "blocker",
  detect: {
    method: "heuristic",
    pattern: "#[0-9a-fA-F]{3,8}\\b",
    flags: "",
    scope: ["apps/docs/registry/super-ai"],
    include: [".tsx"],
    exempt: [],
    falsePositives: "Issue refs like #1234 in comments.",
  },
  fix: "Use a shadcn CSS variable.",
};

describe("ruleSchema", () => {
  it("accepts a TOK-prefixed heuristic record", () => {
    expect(ruleSchema.parse(valid).id).toBe("TOK-1");
  });

  it("rejects a heuristic without falsePositives — an uncharacterised heuristic cannot gate", () => {
    const { falsePositives: _dropped, ...detect } = valid.detect;
    expect(() => ruleSchema.parse({ ...valid, detect })).toThrow();
  });

  it("rejects a record without a fix — bans without substitutions are banned", () => {
    const { fix: _dropped, ...rest } = valid;
    expect(() => ruleSchema.parse(rest)).toThrow();
  });

  it("TOK is a legal prefix and BOGUS is not", () => {
    expect(RULE_ID_PATTERN.test("TOK-7")).toBe(true);
    expect(RULE_ID_PATTERN.test("BOGUS-1")).toBe(false);
  });
});
```

- [ ] **Step 5: Install and run — expect FAIL before install, PASS after**

```bash
pnpm install
pnpm --filter ds-rules test
```

Expected: 4 tests PASS. If the TOK test fails, Step 2's edit was missed.

- [ ] **Step 6: Root gates, then commit**

```bash
pnpm lint && pnpm typecheck && pnpm --filter ds-rules test
git add packages/ds-rules pnpm-lock.yaml
git commit -m "feat(ds-rules): scaffold rules package with harvested schema (+TOK prefix)"
```

---

### Task 2: Local rule records TOK-1/2/3/6/7, emission, drift gate, fixtures

**Files:**
- Create: `packages/ds-rules/src/local.ts`
- Create: `packages/ds-rules/src/emit.test.ts`
- Create: `packages/ds-rules/rules/local.json` (emitted, committed)
- Create: `packages/ds-rules/__fixtures__/<id>/bad/case.tsx` and `__fixtures__/<id>/good/case.tsx` for TOK-1, TOK-2, TOK-3, TOK-7
- Create: `packages/ds-rules/src/records.test.ts`

**Interfaces:**
- Consumes: `ruleSchema`, `type Rule`, `CATALOGUE_VERSION` from Task 1.
- Produces: `LOCAL_RULES: Rule[]`, `CATALOG_SCOPES: string[]`, `VENDORED_SCOPES: string[]` from `./local`; emitted `rules/local.json` with shape `{ version, rules }` (the shape `loadRules` in Task 4 reads). TOK-4/5 are **not** in this task — they need the structural functions (Task 3).

- [ ] **Step 1: Write `packages/ds-rules/src/local.ts`**

The three patterns are copied byte-for-byte from `apps/docs/scripts/check-tokens.mjs` (only JSON-escaped). Do not "improve" them.

```ts
import type { Rule } from "./schema";

/** This repo's own rules, migrated from their four previous homes:
 *  check-tokens.mjs PATTERNS (TOK-1..3), token-rules.mjs (TOK-4..5, added in
 *  the same PR by rulecheck's STRUCTURAL routing), a11y-baseline.md's
 *  cross-component warning (TOK-6), and anti-slop.md Phase 2 (TOK-7, the one
 *  ban the old gate never mechanised). Spec:
 *  docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md §4. */

export const CATALOG_SCOPES = [
  "apps/docs/registry/super-ai",
  "apps/docs/registry/marketing",
  "apps/docs/components/ui",
];

/** Findings under these scopes report as warnings, never blockers: vendored
 *  shadcn ports, where fixing means diverging from upstream — a decision
 *  nobody has made. Triaged in docs/design-system/vendored-token-findings.md.
 *  rulecheck.mjs mirrors this list; records.test.ts pins the two equal. */
export const VENDORED_SCOPES = ["apps/docs/components/ui"];

const catalogGrep = { flags: "", scope: CATALOG_SCOPES, include: [".tsx"], exempt: [".test."] };

export const LOCAL_RULES: Rule[] = [
  {
    id: "TOK-1",
    title: "No raw hex colours in registry sources",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "#[0-9a-fA-F]{3,8}\\b",
      ...catalogGrep,
      falsePositives:
        "Issue references like #1234 in comments — the documented repo convention is to write GH-1234 in registry sources instead (carried from check-tokens.mjs).",
    },
    fix: "Use a shadcn CSS variable (bg-background, text-foreground, …) or the item's own cssVars entry.",
    why: "A raw hex is unreachable by the token system: no theme or axis can re-map it.",
  },
  {
    id: "TOK-2",
    title: "No raw oklch() in registry sources",
    severity: "blocker",
    detect: { method: "grep", pattern: "\\boklch\\s*\\(", ...catalogGrep, flags: "i" },
    fix: "Use a shadcn CSS variable; oklch literals belong only in globals.css token definitions.",
    why: "Same as TOK-1 — a colour literal bypasses the contract.",
  },
  {
    id: "TOK-3",
    title: "No Tailwind palette classes in registry sources",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern:
        "\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b",
      ...catalogGrep,
    },
    fix: "Use the semantic shadcn variable for the role (bg-muted, text-destructive, border-input, …).",
    why: "A palette class hardcodes a hue the theme cannot re-map (design spec §6).",
  },
  {
    id: "TOK-6",
    title: "No muted text under a composed muted surface",
    severity: "blocker",
    detect: {
      method: "rendered",
      how: "Static rules cannot see a child's text-muted-foreground under an ancestor's bg-muted/accent/secondary — every instance that actually shipped broken was this shape. The checker for this rule is the Storybook axe gate: pnpm test:stories.",
    },
    fix: "Rebind the variable on the surface-painting element — [--muted-foreground:var(--accent-foreground)] — never restyle composed children's slots.",
    why: "bg-muted/accent/secondary against text-muted-foreground is 4.34:1 against a 4.5:1 minimum (a11y-baseline.md); the cross-component shape is invisible to single-file analysis.",
  },
  {
    id: "TOK-7",
    title: "No raw rgb()/rgba()/hsl() in registry sources",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "\\b(?:rgba?|hsla?)\\s*\\(",
      ...catalogGrep,
      falsePositives:
        "A string that discusses a colour function (docs copy, comments) rather than applying one. None known in the current tree; every hit needs a look before dismissal.",
    },
    fix: "Use a shadcn CSS variable; if a computed colour is genuinely needed, color-mix() over variables inside globals.css.",
    why: "anti-slop.md Phase 2 bans raw colour functions in components when a token system exists; the old gate covered hex and oklch but not these.",
  },
];
```

- [ ] **Step 2: Write the failing records + emission tests**

`packages/ds-rules/src/records.test.ts` (TOK-4/5 assertions arrive in Task 4; this file starts with what exists now):

```ts
import { describe, expect, it } from "vitest";

import { LOCAL_RULES } from "./local";
import { ruleSchema } from "./schema";

const all = () => [...LOCAL_RULES];

describe("rule records", () => {
  it("every record is schema-valid", () => {
    for (const rule of all()) expect(() => ruleSchema.parse(rule)).not.toThrow();
  });

  it("ids are unique", () => {
    const ids = all().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every grep/heuristic pattern compiles", () => {
    for (const rule of all()) {
      const d = rule.detect;
      if (d.method === "grep" || d.method === "heuristic") {
        expect(() => new RegExp(d.pattern, d.flags)).not.toThrow();
      }
    }
  });

  it("every grep/heuristic rule has a known-bad and a known-good fixture", async () => {
    const { existsSync } = await import("node:fs");
    for (const rule of all()) {
      if (rule.detect.method === "rendered" || rule.detect.method === "judgment") continue;
      for (const kind of ["bad", "good"]) {
        const dir = new URL(`../__fixtures__/${rule.id}/${kind}/`, import.meta.url);
        expect(existsSync(dir), `${rule.id} missing __fixtures__/${rule.id}/${kind}/`).toBe(true);
      }
    }
  });
});
```

`packages/ds-rules/src/emit.test.ts` — the drift gate that doubles as the emitter:

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LOCAL_RULES } from "./local";
import { CATALOGUE_VERSION } from "./schema";

/** rules/*.json is what the dependency-free detector reads. It is generated,
 *  never hand-edited; this test is the drift gate, and RULES_EMIT=1 makes it
 *  the emitter (pnpm --filter ds-rules rules:emit). */
const EMISSIONS: Array<[string, unknown[]]> = [["local.json", LOCAL_RULES]];

describe("emitted rules", () => {
  for (const [name, rules] of EMISSIONS) {
    it(`rules/${name} matches its TypeScript source`, () => {
      const want = `${JSON.stringify({ version: CATALOGUE_VERSION, rules }, null, 2)}\n`;
      const file = fileURLToPath(new URL(`../rules/${name}`, import.meta.url));
      if (process.env.RULES_EMIT) {
        mkdirSync(fileURLToPath(new URL("../rules/", import.meta.url)), { recursive: true });
        writeFileSync(file, want);
      }
      expect(existsSync(file), `${name} missing — run: pnpm --filter ds-rules rules:emit`).toBe(true);
      expect(readFileSync(file, "utf8")).toBe(want);
    });
  }
});
```

- [ ] **Step 3: Run to verify the right failures**

```bash
pnpm --filter ds-rules test
```

Expected: FAIL — fixture-existence test (no fixtures yet) and emit test (`local.json missing`).

- [ ] **Step 4: Create the fixtures**

Each bad fixture breaks exactly its own rule; each good fixture is the same shape done correctly. Create these six files verbatim:

`__fixtures__/TOK-1/bad/case.tsx`
```tsx
export const Swatch = () => <div style={{ background: "#1a2b3c" }} />;
```
`__fixtures__/TOK-1/good/case.tsx`
```tsx
export const Swatch = () => <div className="bg-muted" />; {/* see GH-1234 */}
```
`__fixtures__/TOK-2/bad/case.tsx`
```tsx
export const Swatch = () => <div style={{ background: "oklch(0.7 0.1 200)" }} />;
```
`__fixtures__/TOK-2/good/case.tsx`
```tsx
export const Swatch = () => <div className="bg-accent" />;
```
`__fixtures__/TOK-3/bad/case.tsx`
```tsx
export const Chip = () => <span className="bg-zinc-400 text-blue-600">hi</span>;
```
`__fixtures__/TOK-3/good/case.tsx`
```tsx
export const Chip = () => <span className="bg-secondary text-secondary-foreground">hi</span>;
```
`__fixtures__/TOK-7/bad/case.tsx`
```tsx
export const Veil = () => <div style={{ background: "rgba(0, 0, 0, 0.4)" }} />;
```
`__fixtures__/TOK-7/good/case.tsx`
```tsx
export const Veil = () => <div className="bg-background/40" />;
```

The good fixtures are the negative half of each rule's claim — without them you can see a rule fire but never see it stay quiet.

Two notes that apply to every fixture in this plan (including Task 4's and Task 5's): a `\n` inside a table cell means a real newline in the file; and if root `pnpm lint` objects to fixture files, add `packages/ds-rules/__fixtures__/` to the root eslint ignore list in the same commit — fixtures are deliberately rule-breaking code and linting them is noise.

- [ ] **Step 5: Emit, then run to green**

```bash
pnpm --filter ds-rules rules:emit
pnpm --filter ds-rules test
```

Expected: PASS. Open `packages/ds-rules/rules/local.json` once and confirm it holds 5 rules.

- [ ] **Step 6: Commit**

```bash
git add packages/ds-rules
git commit -m "feat(ds-rules): local TOK records, emission drift gate, per-rule fixtures"
```

---

### Task 3: Move `token-rules.mjs` (and its test) into the package; repoint importers

**Files:**
- Move: `apps/docs/scripts/lib/token-rules.mjs` → `packages/ds-rules/src/token-rules.mjs`
- Move: `apps/docs/scripts/lib/token-rules.test.ts` → `packages/ds-rules/src/token-rules.test.ts`
- Modify: `apps/docs/scripts/check-contract.mts` (import line ~31)
- Modify: `apps/docs/scripts/lib/contract-rules.ts` (its token-rules import — find with grep)
- Modify: `apps/docs/scripts/check-tokens.mjs` (line 3 relative import — temporary until PR 2 deletes the file)
- Modify: `apps/docs/package.json` (add workspace dep)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ds-rules/token-rules` package export exposing `MUTED_FG`, `MUTED_BG_RE`, `CONTRAST_EXEMPT_FILES`, `isExempt(file)`, `findSingleStringViolations(file, source): string[]`, `extractCvaCalls(source)`, `findCvaViolations(file, source): string[]` — unchanged signatures; only the module's address changes.

- [ ] **Step 1: Move with history**

```bash
git mv apps/docs/scripts/lib/token-rules.mjs packages/ds-rules/src/token-rules.mjs
git mv apps/docs/scripts/lib/token-rules.test.ts packages/ds-rules/src/token-rules.test.ts
```

The test's own `./token-rules.mjs` relative import survives the move unchanged. If the test file imports anything else from `apps/docs` (check its imports), keep the file in `apps/docs` instead and import `ds-rules/token-rules` there — but inspection shows it tests pure predicates, so the move is expected to be clean.

- [ ] **Step 2: Add the workspace dependency**

In `apps/docs/package.json` `devDependencies`, add `"ds-rules": "workspace:*"`, then `pnpm install`.

- [ ] **Step 3: Repoint the three importers**

- `apps/docs/scripts/check-contract.mts`: `import { CONTRAST_EXEMPT_FILES } from "./lib/token-rules.mjs";` → `from "ds-rules/token-rules";`
- `apps/docs/scripts/lib/contract-rules.ts`: run `grep -n "token-rules" apps/docs/scripts/lib/contract-rules.ts` and repoint the same way.
- `apps/docs/scripts/check-tokens.mjs` line 3: `from "./lib/token-rules.mjs"` → `from "../../packages/ds-rules/src/token-rules.mjs"` (this file dies in PR 2; the relative path is a bridge, not a pattern).

- [ ] **Step 4: Verify everything still runs**

```bash
pnpm --filter ds-rules test        # moved unit tests pass in their new home
pnpm check:tokens                  # old gate still green through the bridge import
pnpm check:contract                # G3 still reads CONTRAST_EXEMPT_FILES
pnpm typecheck && pnpm lint
```

Expected: all PASS with zero behavior change.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(ds-rules): move token-rules predicates into the package; repoint importers"
```

---

### Task 4: `rulecheck.mjs` — the detector CLI, with TOK-4/5 structural routing

**Files:**
- Create: `packages/ds-rules/rulecheck.mjs`
- Modify: `packages/ds-rules/src/local.ts` (append TOK-4, TOK-5)
- Modify: `packages/ds-rules/src/records.test.ts` (STRUCTURAL + vendored-mirror assertions)
- Create: `packages/ds-rules/__fixtures__/TOK-4/{bad,good}/case.tsx`, `__fixtures__/TOK-5/{bad,good}/case.tsx`
- Create: `packages/ds-rules/src/rulecheck.test.ts`

**Interfaces:**
- Consumes: `rules/*.json` (Task 2 shape), `findSingleStringViolations` / `findCvaViolations` (Task 3).
- Produces: CLI `node packages/ds-rules/rulecheck.mjs [--files <repo-relative>…] [--severity blocker|review|warning] [--json]`. Report shape `{ violations: [{id, severity, method, confidence, file, line, snippet, fix}], unchecked: [{id, reason, how?}], summary: {blocker, review, warning, filesScanned} }`. Exit 0 = no blockers, 1 = ≥1 post-demotion blocker, 2 = the script itself failed. Also exports `loadRules`, `walk`, `scan`, `VENDORED_SCOPES` for tests. Env `DS_RULES_DIR` overrides the rules directory (test seam for the exit-2 control test).

- [ ] **Step 1: Append TOK-4 and TOK-5 to `LOCAL_RULES` in `src/local.ts`**

```ts
  {
    id: "TOK-4",
    title: "No muted text paired with a muted background in one class string",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "text-muted-foreground",
      ...catalogGrep,
      falsePositives:
        "The pattern alone matches every legitimate muted-text usage — it is only a pre-filter. Findings come exclusively from the structural single-string check in token-rules.mjs; rulecheck routes this id there and never runs the pattern generically.",
    },
    fix: "Rebind the variable on the painted surface — [--muted-foreground:var(--accent-foreground)] — rather than swapping the text class.",
    why: "bg-muted/accent/secondary with text-muted-foreground is 4.34:1 against a 4.5:1 minimum (a11y-baseline.md).",
  },
  {
    id: "TOK-5",
    title: "No muted text/background split across a cva() base and a variant value",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "text-muted-foreground",
      ...catalogGrep,
      falsePositives:
        "Same pre-filter as TOK-4; findings come exclusively from the balanced-paren cva scan in token-rules.mjs (the shape that let components/ui/tabs.tsx ship the exact pairing this gate exists to catch).",
    },
    fix: "Rebind [--muted-foreground:var(--accent-foreground)] on the variant that paints the surface.",
    why: "A base class and a variant value render together at runtime; the single-string rule cannot see the pair.",
  },
```

Run `pnpm --filter ds-rules rules:emit` after editing (the drift gate fails until you do).

- [ ] **Step 2: Create the TOK-4/5 fixtures**

`__fixtures__/TOK-4/bad/case.tsx`
```tsx
export const Meta = () => <p className="bg-muted text-muted-foreground">3 items</p>;
```
`__fixtures__/TOK-4/good/case.tsx`
```tsx
export const Meta = () => (
  <p className="bg-muted [--muted-foreground:var(--accent-foreground)] text-muted-foreground">3 items</p>
);
```
`__fixtures__/TOK-5/bad/case.tsx`
```tsx
import { cva } from "class-variance-authority";

export const listVariants = cva("text-muted-foreground", {
  variants: { tone: { plain: "bg-muted" } },
});
```
`__fixtures__/TOK-5/good/case.tsx`
```tsx
import { cva } from "class-variance-authority";

export const listVariants = cva("text-muted-foreground", {
  variants: { tone: { plain: "bg-card" } },
});
```

- [ ] **Step 3: Write `packages/ds-rules/rulecheck.mjs`**

This is the harvested detector plus five deliberate divergences, each numbered in the header. Full file:

```js
#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findCvaViolations, findSingleStringViolations } from "./src/token-rules.mjs";

/** Forked from the ds-architecture starter kit's 02-rules/rulecheck.mjs
 *  (provenance: packages/ds-rules/README.md). Reads the emitted rules and
 *  reports violations plus what it could not check. node:* and relative
 *  imports only — it runs from a hook, from vitest, and from a shell.
 *
 *  Deliberate divergences from the harvested original:
 *   1. Roots: rules load from this package, file paths are repo-root-relative,
 *      and the CLI works from any cwd (the old gate was cwd-dependent).
 *   2. STRUCTURAL: TOK-4/TOK-5 route to token-rules.mjs instead of the
 *      generic per-line scan — their pattern is only a pre-filter, and
 *      scanning it generically would flag every legitimate muted-text usage.
 *   3. Vendored demotion: findings under VENDORED_SCOPES report as severity
 *      "warning" (upstream shadcn ports; fixing means diverging, a decision
 *      nobody has made — docs/design-system/vendored-token-findings.md).
 *   4. Exit 1 only on a post-demotion blocker (the original exits on any
 *      violation; demotion requires the distinction).
 *   5. A scan over zero files warns loudly on stderr — a gate with no
 *      coverage must say so (carried from check-tokens.mjs). */

const PKG_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(PKG_ROOT, "..", "..");

const SEVERITY_RANK = { blocker: 0, review: 1, warning: 2 };

/** Exported so records.test.ts can assert every structural id has a record —
 *  a STRUCTURAL entry routing to a nonexistent record is drift. */
export const STRUCTURAL = {
  "TOK-4": findSingleStringViolations,
  "TOK-5": findCvaViolations,
};

/** Mirrors VENDORED_SCOPES in src/local.ts — this runtime must stay free of
 *  TypeScript imports, so the value is duplicated and records.test.ts pins
 *  the two lists equal. */
export const VENDORED_SCOPES = ["apps/docs/components/ui"];

export function loadRules(dir = process.env.DS_RULES_DIR ?? path.join(PKG_ROOT, "rules")) {
  if (!existsSync(dir)) throw new Error(`rules dir not found (${dir}) — run: pnpm --filter ds-rules rules:emit`);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")).rules);
}

export function walk(root, scopes, extensions) {
  const out = [];
  const visit = (rel) => {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const childRel = path.join(rel, entry);
      if (statSync(path.join(root, childRel)).isDirectory()) visit(childRel);
      else if (extensions.includes(path.extname(entry))) out.push(childRel);
    }
  };
  scopes.forEach(visit);
  return out.sort();
}

function structuralFindings(rule, targets, root) {
  const out = [];
  for (const file of targets) {
    const source = readFileSync(path.join(root, file), "utf8");
    for (const message of STRUCTURAL[rule.id](file, source)) {
      // token-rules messages are `${file}:${line} — ${prose}`.
      const sep = message.indexOf(" — ");
      const head = message.slice(0, sep);
      out.push({
        id: rule.id,
        severity: rule.severity,
        method: "heuristic",
        confidence: "high",
        file,
        line: Number(head.slice(head.lastIndexOf(":") + 1)) || 1,
        snippet: message.slice(sep + 3).trim().slice(0, 120),
        fix: rule.fix,
      });
    }
  }
  return out;
}

export function scan(rules, files, root = REPO_ROOT) {
  const violations = [];
  const unchecked = [];

  for (const rule of rules) {
    const d = rule.detect;

    if (d.method === "rendered" || d.method === "judgment") {
      unchecked.push({ id: rule.id, reason: d.method, how: d.how });
      continue;
    }

    const targets = files.filter(
      (f) =>
        d.scope.some((s) => f === s || f.startsWith(`${s}/`)) &&
        d.include.includes(path.extname(f)) &&
        !d.exempt.some((e) => f.includes(e)),
    );

    if (targets.length === 0) {
      unchecked.push({ id: rule.id, reason: "out-of-scope" });
      continue;
    }

    if (STRUCTURAL[rule.id]) {
      violations.push(...structuralFindings(rule, targets, root));
      continue;
    }

    // Strip `g`: re.test(line) with a global regex advances lastIndex across
    // calls and returns false on every other matching line.
    const re = new RegExp(d.pattern, d.flags.replace(/g/g, ""));
    for (const file of targets) {
      const lines = readFileSync(path.join(root, file), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!re.test(line)) return;
        violations.push({
          id: rule.id,
          severity: rule.severity,
          method: d.method,
          confidence: d.method === "heuristic" ? "medium" : "high",
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
          fix: rule.fix,
        });
      });
    }
  }

  for (const v of violations) {
    if (VENDORED_SCOPES.some((s) => v.file === s || v.file.startsWith(`${s}/`))) {
      v.severity = "warning";
    }
  }

  violations.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.id.localeCompare(b.id),
  );

  const summary = { blocker: 0, review: 0, warning: 0, filesScanned: files.length };
  for (const v of violations) summary[v.severity] += 1;

  return { violations, unchecked, summary };
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const list = (name) => {
    const i = argv.indexOf(name);
    if (i === -1) return null;
    const out = [];
    for (let j = i + 1; j < argv.length && !argv[j].startsWith("--"); j += 1) out.push(argv[j]);
    return out;
  };

  let rules = loadRules();
  const severity = arg("--severity");
  if (severity) rules = rules.filter((r) => r.severity === severity);

  const explicit = list("--files"); // repo-root-relative paths
  const scopes = [...new Set(rules.flatMap((r) => r.detect.scope ?? []))];
  const extensions = [...new Set(rules.flatMap((r) => r.detect.include ?? []))];
  const files = explicit ?? walk(REPO_ROOT, scopes, extensions);

  if (files.length === 0) {
    process.stderr.write("rulecheck — WARNING: no files matched any rule scope. Gate has no coverage.\n");
  }

  const report = scan(rules, files, REPO_ROOT);

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const v of report.violations) {
      const tag = v.severity === "warning" ? "WARN " : "";
      process.stdout.write(`${tag}${v.file}:${v.line}  ${v.id} [${v.severity}]  ${v.snippet}\n    fix: ${v.fix}\n`);
    }
    for (const u of report.unchecked) {
      if (u.how) process.stdout.write(`unchecked ${u.id} (${u.reason}): ${u.how}\n`);
    }
    const ids = report.unchecked.map((u) => `${u.id}(${u.reason})`).join(" ");
    process.stdout.write(`\n${report.violations.length} violation(s). unchecked: ${ids || "none"}\n`);
  }

  return report.violations.some((v) => v.severity === "blocker") ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    // Exit 2 is "I could not tell" — distinct from "nothing wrong". Callers
    // that block must treat it as non-blocking.
    process.stderr.write(`rulecheck: ${error.message}\n`);
    process.exit(2);
  }
}
```

- [ ] **Step 4: Extend `records.test.ts` with the routing and mirror pins**

Extend `packages/ds-rules/src/records.test.ts` — the import lines join the imports at the top of the file; the describe block goes at the bottom:

```ts
import { STRUCTURAL, VENDORED_SCOPES as RUNTIME_VENDORED } from "../rulecheck.mjs";
import { VENDORED_SCOPES } from "./local";

describe("structural routing", () => {
  it("every STRUCTURAL id has a heuristic record (an entry routing to nothing is drift)", () => {
    for (const id of Object.keys(STRUCTURAL)) {
      const rule = LOCAL_RULES.find((r) => r.id === id);
      expect(rule, `${id} is in STRUCTURAL but has no record`).toBeDefined();
      expect(rule?.detect.method).toBe("heuristic");
    }
    expect(Object.keys(STRUCTURAL).sort()).toEqual(["TOK-4", "TOK-5"]);
  });

  it("rulecheck's vendored-scope mirror equals the source of truth", () => {
    expect(RUNTIME_VENDORED).toEqual(VENDORED_SCOPES);
  });
});
```

- [ ] **Step 5: Write the failing CLI test**

`packages/ds-rules/src/rulecheck.test.ts`:

```ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadRules, scan } from "../rulecheck.mjs";

const CLI = fileURLToPath(new URL("../rulecheck.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const FIXTURES = "packages/ds-rules/__fixtures__";

/** Runs every grep/heuristic rule against its own fixtures by rescoping the
 *  record at the fixture directory — the pattern/method under test is real,
 *  only `scope` is redirected. */
describe("every rule against its fixtures", () => {
  const rules = loadRules().filter((r) => r.detect.method !== "rendered" && r.detect.method !== "judgment");

  for (const rule of rules) {
    const at = (kind: string) => ({ ...rule, detect: { ...rule.detect, scope: [`${FIXTURES}/${rule.id}/${kind}`] } });

    it(`${rule.id} fires on its known-bad fixture`, () => {
      const files = [`${FIXTURES}/${rule.id}/bad/case.tsx`];
      const report = scan([at("bad")], files, REPO_ROOT);
      expect(report.violations.length, `${rule.id} stayed silent on known-bad`).toBeGreaterThan(0);
      expect(report.violations[0].id).toBe(rule.id);
    });

    it(`${rule.id} stays quiet on its known-good fixture`, () => {
      const files = [`${FIXTURES}/${rule.id}/good/case.tsx`];
      const report = scan([at("good")], files, REPO_ROOT);
      expect(report.violations, `${rule.id} false-positived on known-good`).toEqual([]);
    });
  }
});

describe("CLI contract", () => {
  it("TOK-6 lands in unchecked on every run, naming its discharge", () => {
    const out = spawnSync("node", [CLI, "--json"], { encoding: "utf8" });
    const report = JSON.parse(out.stdout);
    const tok6 = report.unchecked.find((u: { id: string }) => u.id === "TOK-6");
    expect(tok6?.reason).toBe("rendered");
    expect(tok6?.how).toContain("test:stories");
  });

  it("exit 0 and zero blockers on the current tree (the tree-clean gate)", () => {
    const out = spawnSync("node", [CLI, "--severity", "blocker", "--json"], { encoding: "utf8" });
    expect(out.status, out.stdout + out.stderr).toBe(0);
    expect(JSON.parse(out.stdout).summary.blocker).toBe(0);
  });

  it("exit 1 when blockers exist (control test: the gate CAN fail)", () => {
    // The live tree is clean, so failability is proven by re-emitting the
    // real rules with scopes redirected at the fixture corpus and pointing
    // the CLI at that one-off rules dir via the DS_RULES_DIR test seam.
    const dir = fileURLToPath(new URL("./__control__/", import.meta.url));
    const rules = loadRules().map((r) =>
      r.detect.method === "rendered" || r.detect.method === "judgment"
        ? r
        : { ...r, detect: { ...r.detect, scope: [FIXTURES] } },
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "control.json"), JSON.stringify({ version: 1, rules }, null, 2));
    const out = spawnSync("node", [CLI, "--severity", "blocker"], {
      encoding: "utf8",
      env: { ...process.env, DS_RULES_DIR: dir },
    });
    expect(out.status, out.stdout + out.stderr).toBe(1);
  });

  it("exit 2 when the rules dir is missing — could-not-tell never collapses into clean", () => {
    const out = spawnSync("node", [CLI], {
      encoding: "utf8",
      env: { ...process.env, DS_RULES_DIR: "/nonexistent-ds-rules" },
    });
    expect(out.status).toBe(2);
  });
});
```

The exit-1 control test writes its one-off rules dir under `src/__control__/` at runtime. Create `packages/ds-rules/.gitignore` with the single line `src/__control__/` so it never lands in a commit.

- [ ] **Step 6: Run to green**

```bash
pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules test
```

Expected: PASS, including 2×7 fixture tests, the tree-clean gate, and all three exit codes. If the tree-clean test fails, a TOK rule found a real violation in the live tree — that is a finding, not a test bug: fix the component (build brief rules apply) or, if it is vendored, confirm the demotion path put it at `warning`.

- [ ] **Step 7: Root gates, commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(ds-rules): rulecheck CLI with structural TOK-4/5 routing, vendored demotion, exit-code contract"
```

---

### Task 5: Adopt the harvested core rules, reconciled and triaged

**Files:**
- Create: `packages/ds-rules/src/core.ts` (harvested + edits below)
- Modify: `packages/ds-rules/src/emit.test.ts` (add core.json emission)
- Modify: `packages/ds-rules/src/records.test.ts` (`all()` gains CORE_RULES)
- Create: `packages/ds-rules/rules/core.json` (emitted)
- Create: `packages/ds-rules/__fixtures__/<id>/{bad,good}/case.tsx` for each adopted rule

**Interfaces:**
- Consumes: archive `ds-architecture/starter-kit/02-rules/core.ts`; `type Rule` from Task 1.
- Produces: `CORE_RULES: Rule[]` from `./core`; `rules/core.json`.

- [ ] **Step 1: Extract, then make exactly these edits**

```bash
unzip -p "$HOME/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip" \
  "ds-architecture/starter-kit/02-rules/core.ts" > packages/ds-rules/src/core.ts
```

The harvested file holds ten records: COL-1, COL-6, ICO-2, MOT-1, MOT-2, CPY-1, CPY-2, CHT-1, CHT-3, STA-3. Edits:

1. **Every `scope` array** (`["src/components", "prototypes/proto-oleh/src", "prototypes/proto-timur/src"]`) becomes:
   ```ts
   scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
   ```
   Core rules deliberately exclude `components/ui` — vendored shadcn is only in scope for the TOK token rules.
2. **ICO-2's `fix`** (names pegbo's icon adapter) becomes:
   ```ts
   fix: "Use lucide-react at the size the component already imports (16/20/24), or drop the glyph — emoji live only inside user-generated content, never in chrome.",
   ```
   The ban itself is untouched.
3. Update the file header comment's first line to name this repo and the provenance:
   ```ts
   /** Harvested from ds-architecture starter-kit 02-rules/core.ts (pegbo-inc/
    *  design-system-rebuild via the 2026-08-21 archive). Scopes repointed to
    *  this repo's registry; ICO-2's fix repointed to lucide-react. Everything
    *  else is verbatim — improve upstream, not here. */
   ```

- [ ] **Step 2: Wire core into emission and record tests**

In `emit.test.ts`: `import { CORE_RULES } from "./core";` and change `EMISSIONS` to
```ts
const EMISSIONS: Array<[string, unknown[]]> = [
  ["core.json", CORE_RULES],
  ["local.json", LOCAL_RULES],
];
```
In `records.test.ts`: `import { CORE_RULES } from "./core";` and `const all = () => [...CORE_RULES, ...LOCAL_RULES];`

- [ ] **Step 3: Run to see the fixture test fail, then create ten fixture pairs**

```bash
pnpm --filter ds-rules test
```

Expected: FAIL on missing fixtures for the ten core ids. Create each pair; one-line contents:

| id | `bad/case.tsx` content | `good/case.tsx` content |
|---|---|---|
| COL-1 | `export const X = () => <div className="bg-gradient-to-r from-primary to-accent" />;` | `export const X = () => <div className="bg-accent" />;` |
| COL-6 | `export const X = () => <div className="bg-indigo-500" />;` | `export const X = () => <div className="bg-[var(--chart-4)]" />;` |
| ICO-2 | `export const X = () => <button>✨ Generate</button>;` | `import { Sparkles } from "lucide-react";\nexport const X = () => <button><Sparkles className="size-4" /> Generate</button>;` |
| MOT-1 | `export const X = () => <div className="animate-bounce" />;` | `export const X = ({ loading }: { loading: boolean }) => <div className={loading ? "animate-spin" : ""} />;` |
| MOT-2 | `export const X = () => <div className="transition-all" />;` | `export const X = () => <div className="transition-colors" />;` |
| CPY-1 | `export const X = () => <button>Get Started</button>;` | `export const X = () => <button>Create workspace</button>;` |
| CPY-2 | `export const X = () => <p>Seamless, effortless workflows</p>;` | `export const X = () => <p>Runs the export in the background</p>;` |
| CHT-1 | `export const X = () => <line stroke="#8884d8" />;` | `export const X = () => <line stroke="var(--chart-1)" />;` |
| CHT-3 | `export const X = () => <g strokeDasharray="3 3" />;` | `export const X = () => <g />;` |
| STA-3 | `export const X = () => <button className="outline-none">go</button>;` | `export const X = () => <button className="outline-none focus-visible:ring-2">go</button>;` |

- [ ] **Step 4: Emit and run to green**

```bash
pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules test
```

Expected: fixture tests pass. If the **tree-clean gate** (Task 4's test) now fails, a core rule fired on the live registry. This is the audit moment the manual promises — for each finding, exactly one of:
- a real violation → fix the component (then `pnpm build:registry`, commit the fix separately with the finding id in the message);
- a legitimate usage the rule cannot distinguish → per spec §9, downgrade that rule's `severity` to `"warning"` **with the reason appended to its `why`**, re-emit, and note it in the PR body. (Likely candidate: CPY-1/CPY-2 on `registry/marketing` demo copy.)

Never delete a rule to get green, and never add an `exempt` entry without a reason comment beside it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ds-rules): adopt harvested core rules (scopes repointed, ICO-2 fix → lucide-react)"
```

---

### Task 6: The no-deps gate, the provenance README, and PR 1

**Files:**
- Create: `packages/ds-rules/src/no-deps.test.ts`
- Create: `packages/ds-rules/README.md`

**Interfaces:**
- Consumes: archive `ds-architecture/scripts/lib/no-deps.test.ts` (the four-form specifier discipline).
- Produces: nothing consumed later; this is the portability gate.

- [ ] **Step 1: Write the failing no-deps test**

`packages/ds-rules/src/no-deps.test.ts` — adapted from the archive's four-form check (bare import, static from, dynamic import, require):

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** rulecheck.mjs and token-rules.mjs run from a hook and a bare shell in any
 *  checkout — node:* and relative imports only. Four specifier forms, because
 *  in the source system one form was the whole gate and the other three
 *  walked straight past it. */
const SPECIFIER_RES = [
  /import\s+[^"']*?from\s+["']([^"']+)["']/g,
  /import\s+["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
];

const PKG = fileURLToPath(new URL("..", import.meta.url));

function mjsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...mjsFiles(full));
    else if (entry.endsWith(".mjs")) out.push(full);
  }
  return out;
}

describe("runtime files are dependency-free", () => {
  it("every .mjs imports only node:* or relative paths", () => {
    for (const file of mjsFiles(PKG)) {
      const source = readFileSync(file, "utf8");
      for (const re of SPECIFIER_RES) {
        for (const m of source.matchAll(re)) {
          const spec = m[1];
          const ok = spec.startsWith("node:") || spec.startsWith("./") || spec.startsWith("../");
          expect(ok, `${path.relative(PKG, file)} imports "${spec}"`).toBe(true);
        }
      }
    }
  });

  it("control: the gate can fail (feed it a known-bad specifier)", () => {
    const bad = 'import { z } from "zod"';
    const hits = SPECIFIER_RES.flatMap((re) => [...bad.matchAll(re)]).map((m) => m[1]);
    expect(hits).toContain("zod");
  });
});
```

- [ ] **Step 2: Run — expect PASS (rulecheck and token-rules are already clean); the control test proves it can fail**

```bash
pnpm --filter ds-rules test
```

- [ ] **Step 3: Write `packages/ds-rules/README.md`**

```markdown
# ds-rules

One typed record per design rule; the detector, the docs, and the audit skill
all derive from it. Spec: `docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md`.

## Run

    node packages/ds-rules/rulecheck.mjs --severity blocker   # the check:tokens gate
    node packages/ds-rules/rulecheck.mjs --json               # full report, all severities
    node packages/ds-rules/rulecheck.mjs --files apps/docs/registry/super-ai/foo.tsx

Exit 0 no blockers · 1 blockers found · 2 the script itself failed. Warnings
never gate; findings under `apps/docs/components/ui/` demote to warnings
(vendored shadcn — see docs/design-system/vendored-token-findings.md).

## Provenance and drift

| piece | origin | local changes |
|---|---|---|
| `src/schema.ts` | ds-architecture starter kit (pegbo-inc/design-system-rebuild) | `TOK` added to RULE_ID_PATTERN |
| `src/core.ts` | same, harvested | scopes repointed; ICO-2 fix → lucide-react |
| `src/local.ts` | this repo (check-tokens.mjs, token-rules.mjs, a11y-baseline.md, anti-slop.md) | — |
| `rulecheck.mjs` | same starter kit | five divergences, numbered in its header |
| `src/token-rules.mjs` | this repo, moved verbatim | — |

`rules/*.json` is generated (`pnpm --filter ds-rules rules:emit`); the emit
test is the drift gate. Every grep/heuristic rule carries a known-bad AND a
known-good fixture under `__fixtures__/<id>/`. TOK-6 is `rendered` and appears
in `unchecked` on every run — its checker is `pnpm test:stories`.
```

- [ ] **Step 4: Full root gates, push, open PR 1**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
git add -A && git commit -m "feat(ds-rules): no-deps gate and provenance README"
git push -u origin feat/ds-rules-package
gh pr create --repo VV-DSGN-INC/Super-AI-Components --title "feat: ds-rules package — rules as records (PR 1/5)" --body "<summarise: package, 17 records, fixtures both directions, drift gate, no CI consumer yet. Note any Task 5 triage outcomes. Spec + plan paths.>"
```

`check:tokens` here is still the OLD gate — untouched and green. That is the point of PR 1: the package lands complete with zero consumers.

---

# PR 2 — `feat/check-tokens-swap`: parity, then swap (branch from PR 1's branch or from main after merge)

### Task 7: The temporary parity test

**Files:**
- Create: `packages/ds-rules/src/parity.test.ts`

**Interfaces:**
- Consumes: `apps/docs/scripts/check-tokens.mjs` (spawned), `rulecheck.mjs` CLI (spawned).
- Produces: proof for the swap commit. **This file is deleted in Task 8, in the same commit that deletes the old gate.**

- [ ] **Step 1: Write the test**

```ts
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** TEMPORARY (deleted with check-tokens.mjs in the swap commit). Runs the old
 *  gate and the new detector against the live tree and asserts the TOK-family
 *  finding sets are identical. Old-gate line shapes:
 *    `registry/super-ai/x.tsx:12 — raw hex color: …`      (stderr, blocker)
 *    `WARN components/ui/x.tsx:3 — tailwind palette …`    (stderr, vendored)
 *  New-detector findings carry repo-root-relative paths; strip the
 *  `apps/docs/` prefix to compare. */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const DOCS = `${REPO_ROOT}apps/docs`;

function oldFindings(): Set<string> {
  const out = spawnSync("node", ["scripts/check-tokens.mjs"], { cwd: DOCS, encoding: "utf8" });
  const text = `${out.stdout}\n${out.stderr}`;
  const found = new Set<string>();
  for (const m of text.matchAll(/^(WARN )?((?:registry|components)\/[^\s:]+):(\d+) — /gm)) {
    found.add(`${m[1] ? "warn:" : "block:"}${m[2]}:${m[3]}`);
  }
  return found;
}

function newFindings(): Set<string> {
  const out = spawnSync("node", [`${REPO_ROOT}packages/ds-rules/rulecheck.mjs`, "--json"], {
    encoding: "utf8",
  });
  const report = JSON.parse(out.stdout);
  const found = new Set<string>();
  for (const v of report.violations) {
    if (!v.id.startsWith("TOK-")) continue;
    const rel = v.file.replace(/^apps\/docs\//, "");
    found.add(`${v.severity === "warning" ? "warn:" : "block:"}${rel}:${v.line}`);
  }
  return found;
}

describe("old gate vs rulecheck on the live tree", () => {
  it("TOK-family findings are identical", () => {
    const a = oldFindings();
    const b = newFindings();
    expect([...b].filter((x) => !a.has(x)), "new-only findings").toEqual([]);
    expect([...a].filter((x) => !b.has(x)), "old-only findings").toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

```bash
pnpm --filter ds-rules test
```

Expected: PASS. If sets differ, the migration broke parity — diff the two outputs by hand (`node apps/docs/scripts/check-tokens.mjs` vs `node packages/ds-rules/rulecheck.mjs`), fix the record or the routing, never the test.

- [ ] **Step 3: Commit**

```bash
git add packages/ds-rules/src/parity.test.ts
git commit -m "test(ds-rules): temporary live-tree parity between check-tokens.mjs and rulecheck"
```

### Task 8: The swap — delegate, repoint the hook, delete the old gate

**Files:**
- Modify: `apps/docs/package.json` (one script line)
- Modify: `.claude/hooks/check-tokens-on-edit.sh` (the invocation block)
- Delete: `apps/docs/scripts/check-tokens.mjs`
- Delete: `packages/ds-rules/src/parity.test.ts`
- Modify: `CLAUDE.md` ("The token gate" section — pointer update)
- Modify: any `CONTINUE.md` / docs lines naming `check-tokens.mjs` (find with grep)

**Interfaces:**
- Consumes: everything PR 1 built.
- Produces: root `pnpm check:tokens` now runs rulecheck; the CI step name and position are untouched.

- [ ] **Step 1: Delegate the script**

In `apps/docs/package.json`:

```json
"check:tokens": "node ../../packages/ds-rules/rulecheck.mjs --severity blocker"
```

- [ ] **Step 2: Repoint the hook's invocation block**

In `.claude/hooks/check-tokens-on-edit.sh`, replace the final block

```bash
cd "$root/apps/docs" || exit 0
if ! out=$(node scripts/check-tokens.mjs 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^registry/|^components/' >&2 || true
fi
exit 0
```

with

```bash
if ! out=$(node "$root/packages/ds-rules/rulecheck.mjs" --severity blocker 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^(WARN )?apps/' >&2 || true
fi
exit 0
```

Everything above the block (path filter, root resolution, advisory framing) stays. Verify the hook stays advisory:

```bash
echo '{"tool_input":{"file_path":"'"$(git rev-parse --show-toplevel)"'/apps/docs/registry/super-ai/kbd.tsx"}}' \
  | bash .claude/hooks/check-tokens-on-edit.sh; echo "exit=$?"
```

Expected: `exit=0`, no failure text (tree is clean).

- [ ] **Step 3: Delete the old gate and the parity test together**

```bash
git rm apps/docs/scripts/check-tokens.mjs packages/ds-rules/src/parity.test.ts
```

- [ ] **Step 4: Update the maps**

- `CLAUDE.md` section "## The token gate": change the opening line to point at the package — `apps/docs/scripts/check-tokens.mjs` → `packages/ds-rules/rulecheck.mjs` (invoked by `pnpm check:tokens`), and add one sentence: "Rules are typed records in `packages/ds-rules/src/`; the emitted `rules/*.json` is drift-gated, and every rule ships bad+good fixtures." Keep the two documented limitations — they are still true (GH-1234 lives in TOK-1's `falsePositives`; the cross-component case is TOK-6, now printed as `unchecked` on every run).
- Run `grep -rn "check-tokens.mjs" CLAUDE.md docs .claude apps/docs --include="*.md" --include="*.sh"` and update every remaining pointer to the new path. Pointers only; no rule prose moves.

- [ ] **Step 5: Full gates from root — the swap must be invisible**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
```

Expected: all green; `check:tokens` output now ends with the rulecheck summary line including `unchecked: TOK-6(rendered)`.

- [ ] **Step 6: Commit, push, PR 2**

```bash
git add -A
git commit -m "feat(ds-rules): swap check:tokens to rulecheck; retire check-tokens.mjs

Parity was proven by a temporary live-tree test (deleted here with its
subject). CI shape unchanged. Portability note: the token gate is now a
self-contained package — carry packages/ds-rules to sibling repos instead
of the old single script."
git push -u origin feat/check-tokens-swap
gh pr create --repo VV-DSGN-INC/Super-AI-Components --title "feat: check:tokens runs from rule records (PR 2/5)" --body "<parity story, hook repoint, map updates; call out the portability change per CLAUDE.md>"
```

---

# PR 3 — `feat/ratchets-d20`: mechanical ratchets and the contractExempt decision

### Task 9: a11y exclusion baseline (shrink-only)

**Files:**
- Create: `apps/docs/scripts/lib/a11y-ratchet.ts`
- Create: `apps/docs/scripts/lib/a11y-ratchet.test.ts`
- Create: `apps/storybook/a11y-exclusions.baseline.json`
- Create: `apps/docs/scripts/a11y-baseline.mts` + package script `a11y:baseline`

**Interfaces:**
- Consumes: `apps/storybook/vitest.config.ts` source text (same file G3 already reads).
- Produces: `parseRawExclusions(source: string): string[]` — every quoted entry of the `exclude: [...]` array (globs and filenames alike; the `...configDefaults.exclude` spread is unquoted and self-excludes).

- [ ] **Step 1: Write the failing test**

`apps/docs/scripts/lib/a11y-ratchet.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseRawExclusions } from "./a11y-ratchet";

const CONFIG = "../storybook/vitest.config.ts";
const BASELINE = "../storybook/a11y-exclusions.baseline.json";

describe("a11y exclusion ratchet", () => {
  it("the live exclusion list is a subset of the committed baseline (it may only shrink)", () => {
    const live = parseRawExclusions(readFileSync(CONFIG, "utf8"));
    const baseline: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
    const grown = live.filter((e) => !baseline.includes(e));
    expect(
      grown,
      "New a11y exclusions. The list may only shrink (CLAUDE.md, a11y-baseline.md). Fix the story instead; a genuine new exemption is a hand edit to a11y-exclusions.baseline.json in a reviewed commit, with its reason in a11y-baseline.md.",
    ).toEqual([]);
  });

  it("control: the parser sees a seeded entry", () => {
    const seeded = `exclude: [\n...configDefaults.exclude,\n"**/stories/super-ai/Seeded.stories.tsx",\n]`;
    expect(parseRawExclusions(seeded)).toContain("**/stories/super-ai/Seeded.stories.tsx");
  });

  it("control: a commented-out entry does not count as live", () => {
    const seeded = `exclude: [\n// "**/stories/super-ai/Seeded.stories.tsx",\n"**/stories/ui/**",\n]`;
    expect(parseRawExclusions(seeded)).toEqual(["**/stories/ui/**"]);
  });
});
```

- [ ] **Step 2: Run — FAIL (module and baseline missing). Implement the parser**

`apps/docs/scripts/lib/a11y-ratchet.ts` — comment-stripping matters (commenting a line out is how entries are removed; the G3 parser in `contract-rules.ts` documents this exact editing pattern). Check whether `contract-rules.ts` exports its `stripComments`; if yes import it, if not:

```ts
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** Every quoted entry of the storybook a11y `exclude: [...]` array — globs
 *  and filenames alike. Complements G3 (which parses only super-ai names):
 *  G3 catches the two lists disagreeing; this catches the list growing. */
export function parseRawExclusions(source: string): string[] {
  const live = stripComments(source);
  const block = /exclude:\s*\[([\s\S]*?)\]/.exec(live)?.[1] ?? "";
  return [...block.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}
```

- [ ] **Step 3: Generate the baseline via the shrink-only script**

`apps/docs/scripts/a11y-baseline.mts`:

```ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { parseRawExclusions } from "./lib/a11y-ratchet";

const CONFIG = "../storybook/vitest.config.ts";
const BASELINE = "../storybook/a11y-exclusions.baseline.json";

const live = parseRawExclusions(readFileSync(CONFIG, "utf8"));

if (existsSync(BASELINE)) {
  const prev: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
  const grown = live.filter((e) => !prev.includes(e));
  if (grown.length > 0) {
    console.error(
      `a11y:baseline — refusing to grow the baseline (${grown.join(", ")}). The regenerate command may only shrink it; growth is a hand edit in a reviewed commit.`,
    );
    process.exit(1);
  }
}
writeFileSync(BASELINE, `${JSON.stringify(live, null, 2)}\n`);
console.log(`a11y:baseline — wrote ${live.length} entr${live.length === 1 ? "y" : "ies"}.`);
```

Add to `apps/docs/package.json` scripts: `"a11y:baseline": "tsx scripts/a11y-baseline.mts"`, then:

```bash
cd apps/docs && pnpm a11y:baseline && cd ../..
```

Expected: baseline written with the current entries (the two vendored globs + three legacy names).

- [ ] **Step 4: Run to green, control-test the ratchet by hand once**

```bash
pnpm --filter docs test
```

Then temporarily add `"**/stories/super-ai/Fake.stories.tsx",` to the vitest.config exclude array, run the test again, watch it FAIL naming the entry, revert. (This is the gate's must-fail control; do not skip it.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(a11y): shrink-only exclusion baseline — the prose rule becomes a gate"
```

### Task 10: cssVars liveness gate

**Files:**
- Create: `apps/docs/scripts/lib/cssvars-liveness.test.ts`
- Possibly create: `apps/docs/cssvars-liveness.baseline.json` (only if the first run finds pre-existing gaps)

**Interfaces:**
- Consumes: `MANIFEST` (import it exactly as `check-contract.mts` line ~1–30 does — copy that import line), registry sources, `apps/docs/app/globals.css` + `apps/docs/app/marketing.css`.
- Produces: the gate. Resolution rule: a var a component **writes** must be declared by stock CSS ∪ own `cssVars` ∪ transitive `consumes`' `cssVars` ∪ its own inline declarations; a declared `cssVars` key must be referenced by the item's own sources.

- [ ] **Step 1: Write the test**

```ts
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MANIFEST } from "../../lib/catalog.manifest"; // match check-contract.mts's exact import

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

describe("cssVars liveness", () => {
  const failures: string[] = [];

  it("every var a shipped item reads resolves; every declared cssVars key is read", () => {
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
        if (!resolvable.has(v)) failures.push(`${item.name}:${v} (read, resolves nowhere)`);
      }
      for (const key of cssVarKeys(item)) {
        // Boundary-guarded: `--warning` must not count as read just because
        // `--warning-foreground` appears.
        const keyRe = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
        const referenced = sources.some((s) => keyRe.test(s));
        if (!referenced) failures.push(`${item.name}:${key} (declared in cssVars, read by nothing)`);
      }
    }
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
```

- [ ] **Step 2: Run it — this first run is the audit**

```bash
pnpm --filter docs test -- cssvars-liveness
```

Triage every failure (the survey predicts candidates around `--time-ruler-playhead-height`, `--marketing-marquee-gap`, `--color-spend`, `--accent-foreground` chains — most should resolve via inline declarations or stock CSS; genuine finds are manifest `cssVars` gaps):
- Real gap → add the missing `cssVars` entry to the manifest item (or fix the component), run `pnpm build:registry`, commit that fix on its own with the item name in the message.
- Deliberate deferral → create `apps/docs/cssvars-liveness.baseline.json` with exactly those strings and a matching note in the PR body.

- [ ] **Step 3: Green, then commit**

```bash
pnpm --filter docs test && pnpm check:contract
git add -A
git commit -m "feat(liveness): cssVars gate — declared↔read, both directions, baseline-ratcheted"
```

### Task 11: Delete `contractExempt` (decision D20)

**Files:**
- Modify: `apps/docs/lib/manifest-types.ts` (remove the field, lines ~90–94)
- Modify: `apps/docs/scripts/check-contract.mts` (lines ~10–12 comment, ~36 counter, ~113 docs-skip, ~118–121 skip block, ~368 summary)
- Modify: `docs/design-system/decisions.md` (append D20)
- Modify: `CLAUDE.md` (remove the open-decision bullet; trim the two mentions)

**Interfaces:** none — pure deletion plus a decision record.

- [ ] **Step 1: Delete the field and every honoring site**

In `manifest-types.ts` remove the `contractExempt?: true;` member and its jsdoc. In `check-contract.mts`: remove the header-comment sentence about it (lines ~10–12), `let exempt = 0;`, the `if (kind === "docs" && item.contractExempt) continue;` clause, the `if (item.contractExempt) { exempt++; continue; }` block, and change the summary line to:

```ts
console.log(`check:contract — ${checked} item(s) checked.`);
```

- [ ] **Step 2: Verify nothing else references it**

```bash
grep -rn "contractExempt" apps packages docs CLAUDE.md | grep -v node_modules
```

Expected: only CLAUDE.md and historical docs/spec mentions. Update CLAUDE.md: delete the "Open decisions" bullet about `contractExempt` and rewrite the "Catalog status" sentence's clause to past tense ("the flag has since been deleted — D20"). Historical docs (decisions, CONTINUE history) stay as they are.

- [ ] **Step 3: Append D20 to `docs/design-system/decisions.md`** (use the actual date of the commit)

```markdown
### D20 · contractExempt is deleted — <YYYY-MM-DD>

The Wave-1.5 retrofit drove the field to zero users, and the pattern it encoded — a
boolean that quietly waives contract assertions — is superseded by explicit,
baseline-ratcheted exemption lists (the a11y exclusion baseline, the cssVars liveness
baseline): a future legacy import gets a reviewed baseline entry carrying its reason,
not a flag. Field removed from manifest-types.ts and its honoring branches from
check-contract.mts in the ds-rules retrofit
(docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md).
```

- [ ] **Step 4: Gates, commit, push, PR 3**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
git add -A && git commit -m "feat(contract): delete contractExempt (D20); ratchets supersede the valve"
git push -u origin feat/ratchets-d20
gh pr create --repo VV-DSGN-INC/Super-AI-Components --title "feat: mechanical ratchets + D20 (PR 3/5)" --body "<a11y baseline, liveness triage outcomes, D20>"
```

---

# PR 4 — `feat/hook-and-skill`: single-file hook, promotion criterion, skill slimming

### Task 12: Hook `--files` optimization and the written promotion criterion

**Files:**
- Modify: `.claude/hooks/check-tokens-on-edit.sh`

- [ ] **Step 1: Make the hook scan only the edited file, and write the criterion**

Replace the invocation block (from Task 8) with:

```bash
# Promotion criterion (do not flip this hook to blocking on a hunch): blocking
# mode requires every blocker-severity rule to hold a passing known-good
# fixture in packages/ds-rules/__fixtures__/, plus two weeks of advisory-mode
# sessions with no false positive. Until then: always exit 0.
rel="${path#"$root"/}"
if ! out=$(node "$root/packages/ds-rules/rulecheck.mjs" --files "$rel" --severity blocker 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^(WARN )?apps/' >&2 || true
fi
exit 0
```

- [ ] **Step 2: Test both directions by hand**

```bash
root="$(git rev-parse --show-toplevel)"
# clean file → silence, exit 0
echo '{"tool_input":{"file_path":"'"$root"'/apps/docs/registry/super-ai/kbd.tsx"}}' | bash .claude/hooks/check-tokens-on-edit.sh; echo "exit=$?"
# seeded violation → finding on stderr, still exit 0 (advisory)
cp apps/docs/registry/super-ai/kbd.tsx /tmp/kbd-backup.tsx
printf '\nexport const Bad = () => <i className="bg-zinc-400" />;\n' >> apps/docs/registry/super-ai/kbd.tsx
echo '{"tool_input":{"file_path":"'"$root"'/apps/docs/registry/super-ai/kbd.tsx"}}' | bash .claude/hooks/check-tokens-on-edit.sh; echo "exit=$?"
mv /tmp/kbd-backup.tsx apps/docs/registry/super-ai/kbd.tsx
```

Expected: first run silent exit 0; second run prints the TOK-3 finding and still exits 0; the file is restored (verify with `git status`).

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/check-tokens-on-edit.sh
git commit -m "feat(hook): single-file rulecheck with written promotion criterion"
```

### Task 13: Slim unslop and anti-slop.md to consume the detector

**Files:**
- Modify: `.claude/skills/unslop/SKILL.md`
- Modify: `docs/design-system/anti-slop.md`

- [ ] **Step 1: Rewire unslop's Phase 0 and Phase 2**

In `SKILL.md` Phase 0, update the bindings line naming `check-tokens.mjs` to name `packages/ds-rules` (`rulecheck.mjs` via `pnpm check:tokens`). Replace Phase 2's opening grep paragraph ("Greps over the project's component/source dirs … in copy.") with:

```markdown
Mechanical rules first — run the detector, do not re-grep what it owns:

    node packages/ds-rules/rulecheck.mjs --json

Violations are findings; apply each record's own `fix`. Then work the
`unchecked` list: TOK-6 discharges via `pnpm test:stories`; `judgment`-method
rules are the reading work below. The rendered passes (squint, counts,
contrast, keyboard, 375px, hostile fixtures, ratchet) remain this skill's own.
```

Keep the rendered-pass paragraph and all of Phase 1 and Phase 3 — those are judgment and fix content, which is exactly what stays in prose.

- [ ] **Step 2: Point anti-slop.md at the records**

At the top of `docs/design-system/anti-slop.md` (after its title), insert:

```markdown
> **Mechanical detection moved to code.** Every grep-expressible ban below is a
> typed record in `packages/ds-rules/src/{core,local}.ts` — the record, not
> this prose, is what `pnpm check:tokens`, the write-time hook, and the unslop
> skill execute. This document keeps the taxonomy, the reasoning, and the fix
> ladder; when prose and record disagree, the record wins and this file has
> drifted.
```

Then remove only the literal grep patterns from the audit section (the taxonomy names, whys, and fix ladder stay).

- [ ] **Step 3: Gates, commit, push, PR 4**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add -A && git commit -m "docs(unslop): skill and taxonomy consume the detector; bans leave prose"
git push -u origin feat/hook-and-skill
gh pr create --repo VV-DSGN-INC/Super-AI-Components --title "feat: hook + audit skill consume rulecheck (PR 4/5)" --body "<hook optimization, promotion criterion, skill slimming>"
```

---

# PR 5 — `feat/vendored-ladder`: the conformance checker and the first score

### Task 14: Vendor the checker runtime

**Files:**
- Create: `tools/ds-architecture/**` (from the archive: `scripts/`, `src/`, `stages/`, `LADDER.md`, `package.json`, `tsconfig.json`, `vitest.config.ts`)
- Create: `tools/ds-architecture/VENDOR.md`
- Modify: root `.gitignore` (add `tools/ds-architecture/node_modules/`)

- [ ] **Step 1: Extract runtime only**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p tools && cd tools
unzip -q "$HOME/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip" \
  "ds-architecture/scripts/*" "ds-architecture/src/*" "ds-architecture/stages/*" \
  "ds-architecture/LADDER.md" "ds-architecture/package.json" \
  "ds-architecture/tsconfig.json" "ds-architecture/vitest.config.ts"
cd ..
```

Deliberately not vendored: `MANUAL.md`, `DESIGN.md`, `plans/`, `ARCHIVE.md`, `starter-kit/` (consumed into `packages/ds-rules` already). The rule book lives in one copy; theirs is the archive.

- [ ] **Step 2: The @types/node fix**

In `tools/ds-architecture/package.json` devDependencies add `"@types/node": "^22.0.0"` (verified during the archive check: its `typecheck` fails without it; its tests pass either way).

- [ ] **Step 3: Write `tools/ds-architecture/VENDOR.md`**

```markdown
# Vendored: ds-architecture conformance checker

- **Source:** `pegbo-inc/design-system-rebuild` (PR #115 there), via the local
  archive `ds-architecture-archive-2026-08-21.zip`; archive stamp
  `design-spec@1d7cf45 (2026-08-21)`.
- **Vendored here:** 2026-08-22, runtime only (scripts/, src/, stages/,
  LADDER.md). MANUAL.md and DESIGN.md stay in the archive — one copy of the
  rule book.
- **Local changes:** `@types/node` added to devDependencies (its typecheck
  fails without it; found while verifying the archive).
- **Inherited open questions** (upstream's, deliberately not fixed here):
  1. A stage directory missing its probe reports `unchecked` but the run still
     exits 0 — "could not tell" collapses into "conformant" for a structurally
     broken stage.
  2. `highestContiguous` counts a stage as reached when only some of its
     claims were determined.
- **Known archive erratum:** its ARCHIVE.md counts the starter kit as 17 files
  / 11 harvested; the kit's own README correctly enumerates 16 / 10.
- **Not wired into CI.** `pnpm check:ladder` is informational; only stage 00
  is scoreable today. This directory is not a pnpm workspace; to run its own
  test suite: `cd tools/ds-architecture && npm install && npm test` (130
  tests; node_modules is gitignored).
```

Add `tools/ds-architecture/node_modules/` to the root `.gitignore`.

- [ ] **Step 4: Verify the vendored runtime runs with zero installs**

```bash
node tools/ds-architecture/scripts/conformance.mjs tools/ds-architecture/stages/00-architecture-map/__fixtures__/conformant
echo "exit=$?"
```

Expected: `met: 00.1 … 00.6`, `exit=0` (the checker runtime is node-only; this was verified against the archive on 2026-08-21).

- [ ] **Step 5: Commit**

```bash
git add tools .gitignore
git commit -m "chore(tools): vendor ds-architecture conformance checker runtime (stage 00)"
```

### Task 15: Stage-00 config, `check:ladder`, first score

**Files:**
- Create: `ds-architecture.config.json` (repo root)
- Modify: root `package.json` (add `check:ladder` script — plain script, NOT a turbo task, NOT a CI step)
- Possibly create: `AGENTS.md` (thin pointer — only if the probe requires that filename; see Step 2)

- [ ] **Step 1: Read the probe's contract, then write the config**

Read `tools/ds-architecture/stages/00-architecture-map/SPEC.md` and `reference/ds-architecture.config.example.json` — the config keys below mirror the example; adjust only if SPEC.md names different required keys:

```json
{
  "profile": "component-library",
  "adoption": "retrofit",
  "scopeRoles": {
    "components": ["apps/docs/registry/super-ai/**", "apps/docs/registry/marketing/**"],
    "styles": ["apps/docs/app/**"]
  },
  "paths": {
    "nameContract": "packages/ds-rules/src/local.ts",
    "styleEntry": ["apps/docs/app/globals.css"]
  },
  "axes": [{ "attribute": "class", "values": ["light", "dark"] }],
  "commands": {
    "test": "pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test"
  }
}
```

If `validate-config` rejects `"adoption": "retrofit"` (check the enum: `grep -n "adoption" tools/ds-architecture/scripts/lib/validate-config.mjs`), use the allowed value and note it in the PR body.

- [ ] **Step 2: Add the script and run the first score**

Root `package.json` scripts: `"check:ladder": "node tools/ds-architecture/scripts/conformance.mjs ."`.

```bash
pnpm check:ladder; echo "exit=$?"
```

Read the output claim by claim. Handle the two likely findings:
- If a claim requires an `AGENTS.md` instructions file by that exact name (the stage-00 fixtures use it), create a root `AGENTS.md` that is a pointer, not a copy:
  ```markdown
  # Agent instructions

  This repo's agent instructions live in [CLAUDE.md](CLAUDE.md) — the map — and
  the contracts it links under docs/design-system/. Definition of done:
  `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test`.
  ```
- Any other unmet claim: fix the config value it names (the probe's `fix:` line says how). The goal state is all six 00.x claims `met`, `highestContiguous=00`, exit 0.

- [ ] **Step 3: Gates, commit, push, PR 5**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
pnpm check:ladder
git add -A && git commit -m "feat(ladder): stage-00 config and check:ladder — first recorded score"
git push -u origin feat/vendored-ladder
gh pr create --repo VV-DSGN-INC/Super-AI-Components --title "feat: vendored conformance checker + stage-00 score (PR 5/5)" --body "<paste the check:ladder output verbatim as the first recorded score; note the config decisions>"
```

---

## Done means

All five PRs merged; from the repo root: `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test` green with `check:tokens` printing `unchecked: TOK-6(rendered)`; `pnpm check:ladder` exits 0 with all six stage-00 claims met; `ci.yml` byte-identical to before PR 1; and `grep -rn "contractExempt" apps` returns nothing.
