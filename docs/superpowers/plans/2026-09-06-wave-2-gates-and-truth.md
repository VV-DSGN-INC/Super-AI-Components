# Wave 2: Gates and Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every written claim in the repo true, turn on the three gates that exist but never run, and leave the tree prettier-clean with `format:check` in CI.

**Architecture:** Eight independent tasks. Tasks 1–5 change tooling and each ends with a test that fails before the fix. Tasks 6–8 change prose and end with a grep that proves the old claim is gone. Task 2 rewrites 531 files and must land **last among the source-touching tasks**, so it is ordered after 1 and 3–5; wave 3 must not start until this plan is complete.

**Tech Stack:** pnpm 11.1.0, Node 24, turbo, tsx, vitest 4, eslint 9, prettier 3.8.4.

**Spec:** [`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`](../specs/2026-09-06-post-case-story-remediation-design.md)

## Global Constraints

- Run every gate **from the repo root**. `pnpm lint` and `pnpm typecheck` at the root are turbo tasks fanning out across docs, storybook and ds-rules; the identically named script inside a workspace is a different command and skips two of them.
- `apps/docs/lib/catalog.manifest.ts` is the one shared file. A subagent never writes it; the integrator prepares it centrally.
- The a11y exclusion list (`apps/storybook/vitest.config.ts`), `apps/storybook/a11y-exclusions.baseline.json` and `apps/docs/scripts/lib/story-coverage.baseline.json` **may only shrink, never grow.**
- Never pair a bare `text-muted-foreground` with a bare `bg-muted` / `bg-accent` / `bg-secondary` in one quoted class string. They are the same lightness in this token set: 4.34:1 against a 4.5:1 minimum.
- Branch per task. Never commit to `main`.
- Write `GH-1234`, never `#1234`, in registry sources: the token gate reads `#` followed by hex digits as a raw colour.
- Gate order, which any gate list must mirror: `install --frozen-lockfile` → `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke → Storybook a11y → consumer install test.

---

### Task 1: Fix the session-start hook's stray output line

`grep -c` exits 1 when it matches nothing, so the `|| echo "?"` fallback fires **in addition to** grep's own `0`. The variable becomes two lines and the hook prints a stray `?`. The `contractExempt` half is also dead: D20 deleted the flag, so it counts zero by construction.

**Files:**

- Modify: `.claude/hooks/session-baselines.sh:25-28`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing. This is a leaf task.

- [ ] **Step 1: Watch the bug**

```bash
CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/session-baselines.sh
```

Expected: four lines, the second being a bare `? contractExempt`, because `$exempt` expanded to `0\n?`.

- [ ] **Step 2: Replace both counts**

In `.claude/hooks/session-baselines.sh`, replace the two `grep -c` assignments and the `echo` that uses them:

```bash
# grep -c exits 1 on zero matches and still prints "0", so `|| echo "?"` fires
# on top of it and the variable becomes two lines. Validate the output instead
# of trusting the exit code: a number is a number, anything else is unknown.
numeric_or_unknown() {
  case "$1" in '' | *[!0-9]*) printf '?' ;; *) printf '%s' "$1" ;; esac
}

shipped=$(numeric_or_unknown "$(grep -c 'status: "shipped"' "$manifest" 2>/dev/null)")

# contractExempt was deleted by D20, so counting it always reported 0. The
# story-coverage baseline is the live ratchet worth surfacing in its place:
# empty is the guarantee, and any non-zero number is a regression in progress.
baseline_file="$root/apps/docs/scripts/lib/story-coverage.baseline.json"
if [ -f "$baseline_file" ]; then
  baseline=$(numeric_or_unknown "$(node -e '
    const fs = require("fs");
    try { process.stdout.write(String(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).length)); }
    catch { process.stdout.write(""); }
  ' "$baseline_file" 2>/dev/null)")
else
  baseline="?"
fi

echo "super-ai-components — $shipped shipped · story-coverage baseline: $baseline"
```

- [ ] **Step 3: Verify the fix**

```bash
CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/session-baselines.sh
```

Expected: exactly three lines. The first reads `super-ai-components — 116 shipped · story-coverage baseline: 0`. No `?` anywhere.

- [ ] **Step 4: Verify it degrades rather than crashes**

```bash
CLAUDE_PROJECT_DIR=/nonexistent .claude/hooks/session-baselines.sh; echo "exit=$?"
```

Expected: the "baselines unavailable" line and `exit=0`. A SessionStart hook that can exit non-zero prints an error at every session start forever.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/session-baselines.sh
git commit -m "fix(hooks): session baselines printed a stray ? line

grep -c exits 1 on zero matches while still printing 0, so the || echo \"?\"
fallback fired on top of it. Swapped the contractExempt count, dead since D20,
for the story-coverage baseline, which is the live ratchet."
```

---

### Task 2: Make reconcile-deps correct, then gate it

`pnpm reconcile:deps` exits 1 today on four items and runs in no gate, so its output reads as noise rather than signal. All four are the script's blind spots, not real drift.

- `data-views` and `detail-view-shell` are **multi-file items**. The script reads only `registry/super-ai/<name>.tsx`, so the siblings bundled by the row's own `files` array read as undeclared `consumes`.
- `suggestion-chips` declares `scroll-area` because AI Elements' `suggestion` renders one. That import lives in a vendored file the script never opens, and the row already carries `external`.
- `field-row` declares `consumes: ["reset-affordance"]` and imports only `react` and `cn`. The reference is a JSDoc sentence about a slot the consumer fills, so **the manifest is wrong here and the script is right.**

**Files:**

- Modify: `apps/docs/scripts/reconcile-deps.mts`
- Create: `apps/docs/scripts/reconcile-deps.test.ts`
- Modify: `apps/docs/lib/catalog.manifest.ts` (integrator only — the `field-row` row)
- Modify: `apps/docs/package.json:9` (the `check:contract` script)

**Interfaces:**

- Consumes: `MANIFEST` from `../lib/catalog.manifest`, and `ManifestItem["files"]` typed as `{ path: string; type: string; target: string }[]`.
- Produces: `reconcileItem(item: ManifestItem, readFile: (path: string) => string | undefined): { shadcn: string[]; consumes: string[]; drifted: boolean }` — exported so the test can drive it without touching disk.

- [ ] **Step 1: Watch the four drifts**

```bash
cd apps/docs && pnpm reconcile:deps; echo "exit=$?"
```

Expected: `4 item(s) drifted.` and `exit=1`, naming `field-row`, `suggestion-chips`, `data-views` and `detail-view-shell`.

- [ ] **Step 2: Write the failing test**

Create `apps/docs/scripts/reconcile-deps.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { reconcileItem } from "./reconcile-deps.mts";
import type { ManifestItem } from "../lib/manifest-types";

const base: ManifestItem = {
  id: "X1",
  name: "widget",
  title: "Widget",
  description: "",
  family: "A",
  layer: "component",
  status: "shipped",
  wave: 1,
  base: [],
  shadcn: [],
  consumes: [],
  npm: [],
  states: ["plain"],
  specAnchor: "component-specs.md#x1-widget",
};

describe("reconcileItem", () => {
  it("unions imports across a multi-file item and excludes its own bundled files", () => {
    const item: ManifestItem = {
      ...base,
      consumes: ["use-view-mode"],
      files: ["table-view", "feed-view"].map((n) => ({
        path: `registry/super-ai/${n}.tsx`,
        type: "registry:component",
        target: `components/super-ai/${n}.tsx`,
      })),
    };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx":
        'import { TableView } from "./table-view";\nimport { useViewMode } from "./use-view-mode";',
      "registry/super-ai/table-view.tsx": 'import { Button } from "@/components/ui/button";',
      "registry/super-ai/feed-view.tsx": 'import { useViewMode } from "./use-view-mode";',
    };
    const result = reconcileItem(item, (p) => files[p]);
    // table-view and feed-view are this item's own files, so they are not consumes.
    expect(result.consumes).toEqual(["use-view-mode"]);
    // A bundled file's shadcn import still belongs to the item.
    expect(result.shadcn).toEqual(["button"]);
  });

  it("does not flag a declared shadcn dep an external item pulls in", () => {
    const item: ManifestItem = {
      ...base,
      shadcn: ["button", "scroll-area"],
      external: ["https://registry.ai-sdk.dev/suggestion.json"],
    };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": 'import { Button } from "@/components/ui/button";',
    };
    // scroll-area lives in the external item's tree, which this script cannot read.
    expect(reconcileItem(item, (p) => files[p]).drifted).toBe(false);
  });

  it("still flags a declared dep the source does not import", () => {
    const item: ManifestItem = { ...base, consumes: ["reset-affordance"] };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": 'import * as React from "react";',
    };
    expect(reconcileItem(item, (p) => files[p]).drifted).toBe(true);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd apps/docs && pnpm exec vitest run scripts/reconcile-deps.test.ts
```

Expected: FAIL with `reconcileItem is not a function` — the script has no export today.

- [ ] **Step 4: Rewrite the script around an exported, injectable function**

Replace the body of `apps/docs/scripts/reconcile-deps.mts` between the imports and the final summary with:

```ts
const RELEVANT = /^(@\/components\/ui\/|@\/registry\/super-ai\/|\.\/|lucide-react|@base-ui)/;

const bare = (spec: string) => spec.replace(/^@\/registry\/super-ai\//, "").replace(/^\.\//, "");

/**
 * Reconciles one item's declared deps against its real imports.
 *
 * `readFile` is injected so the test can drive this without a fixture tree,
 * and returns undefined for a path that does not exist.
 *
 * Two rules the naive version got wrong, each of which produced a standing
 * false positive that made the whole report read as noise:
 *
 * 1. A multi-file item's `files` are PART OF the item, not things it consumes.
 *    Their imports count toward the item; their own names do not.
 * 2. An item with `external` composes another registry's item, whose imports
 *    are not on this disk. It may legitimately declare shadcn deps this script
 *    cannot see, so declared-beyond-real is not drift for those items.
 */
export function reconcileItem(item: ManifestItem, readFile: (path: string) => string | undefined) {
  const ownPaths = [`registry/super-ai/${item.name}.tsx`, ...(item.files ?? []).map((f) => f.path)];
  const ownNames = new Set((item.files ?? []).map((f) => f.path.replace(/^.*\//, "").replace(/\.tsx$/, "")));

  const specs = ownPaths
    .flatMap((path) => {
      const source = readFile(path);
      if (source === undefined) return [];
      return [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    })
    .filter((s) => RELEVANT.test(s));

  const shadcn = [
    ...new Set(
      specs.filter((s) => s.startsWith("@/components/ui/")).map((s) => s.replace("@/components/ui/", "")),
    ),
  ].sort();

  const consumes = [
    ...new Set(
      specs
        .filter((s) => s.startsWith("@/registry/super-ai/") || s.startsWith("./"))
        .map(bare)
        .filter((name) => !ownNames.has(name)),
    ),
  ].sort();

  const declaredShadcn = [...item.shadcn].sort();
  const declaredConsumes = [...item.consumes].sort();

  // An external item's own imports are invisible here, so only flag shadcn
  // deps the source declares FEWER of than it really imports.
  const shadcnDrifted = item.external
    ? shadcn.some((real) => !declaredShadcn.includes(real))
    : JSON.stringify(shadcn) !== JSON.stringify(declaredShadcn);
  const consumesDrifted = JSON.stringify(consumes) !== JSON.stringify(declaredConsumes);

  return { shadcn, consumes, drifted: shadcnDrifted || consumesDrifted };
}
```

Then rewrite the loop to call it, keeping the existing printing shape:

```ts
for (const item of items) {
  const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : undefined);
  if (!existsSync(`registry/super-ai/${item.name}.tsx`)) continue;
  const { shadcn, consumes, drifted: itemDrifted } = reconcileItem(item, read);
  if (!itemDrifted) continue;
  drift++;
  console.log(`${item.name}`);
  if (JSON.stringify(shadcn) !== JSON.stringify([...item.shadcn].sort())) {
    console.log(
      `  shadcn   declared ${JSON.stringify([...item.shadcn].sort())} · real ${JSON.stringify(shadcn)}`,
    );
  }
  if (JSON.stringify(consumes) !== JSON.stringify([...item.consumes].sort())) {
    console.log(
      `  consumes declared ${JSON.stringify([...item.consumes].sort())} · real ${JSON.stringify(consumes)}`,
    );
  }
}
```

Add `import type { ManifestItem } from "../lib/manifest-types";` to the imports.

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd apps/docs && pnpm exec vitest run scripts/reconcile-deps.test.ts
```

Expected: 3 passed.

- [ ] **Step 6: Fix the one real drift (integrator only)**

In `apps/docs/lib/catalog.manifest.ts`, on the `field-row` row, change `consumes: ["reset-affordance"]` to `consumes: []` and add above it:

```ts
// `reset-affordance` is a SLOT this component documents, not an import —
// the consumer puts one in the trailing slot. `consumes` is reconciled from
// real imports, so it does not belong here; field-row.tsx imports only
// react and cn. The docs module tells a consumer to install A11 alongside.
```

- [ ] **Step 7: Verify the report is clean**

```bash
cd apps/docs && pnpm reconcile:deps; echo "exit=$?"
```

Expected: `116 item(s) reconciled, no drift.` and `exit=0`.

- [ ] **Step 8: Extend it to `npm` dependencies**

`RELEVANT` matches only intra-registry and shadcn specifiers, so a bare package import is invisible to it. `recharts` reaches `registry/super-ai/usage-dashboard.tsx`, and `motion`, `canvas-confetti`, `embla-carousel-react`, `cmdk`, `react-resizable-panels`, `streamdown`, `ai` and `use-stick-to-bottom` reach the marketing and vendored trees. Each becomes an `npm` entry a consumer must install, and nothing checks that the manifest lists it.

In `reconcileItem`, collect bare specifiers alongside the relevant ones and compare against `item.npm`:

```ts
const BUILTIN = /^(node:|react$|react-dom$|react\/|react-dom\/)/;

const bareSpecs = ownPaths
  .flatMap((path) => {
    const source = readFile(path);
    if (source === undefined) return [];
    return [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  })
  .filter((s) => !s.startsWith(".") && !s.startsWith("@/") && !BUILTIN.test(s));

// A scoped package keeps its scope; a subpath does not survive ("motion/react"
// is the package `motion`).
const npm = [
  ...new Set(
    bareSpecs.map((s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0])),
  ),
].sort();
```

Report `npm` drift the same way as the other two. Expect this to surface real findings on first run: fix the manifest from the REAL column, and treat any case where the real import genuinely should not ship as a comment on that row explaining why.

- [ ] **Step 9: Chain it into the contract gate**

In `apps/docs/package.json`, change the `check:contract` script to:

```json
"check:contract": "tsx scripts/check-contract.mts && tsx scripts/check-citations.mts && tsx scripts/reconcile-deps.mts",
```

- [ ] **Step 10: Run the gate from the repo root**

```bash
pnpm check:contract
```

Expected: 116 items checked, 273 citations reachable, 116 reconciled with no drift.

- [ ] **Step 11: Commit**

```bash
git add apps/docs/scripts/reconcile-deps.mts apps/docs/scripts/reconcile-deps.test.ts \
        apps/docs/lib/catalog.manifest.ts apps/docs/package.json
git commit -m "feat(contract): reconcile:deps understands multi-file and external items, and now gates

All four standing drifts were the script's blind spots rather than real drift,
which is why a report that exits 1 has been ignored. A multi-file item's own
files are part of it; an external item's imports are not on this disk. The one
real finding, field-row declaring a slot it never imports, is fixed in the
manifest. Chained into check:contract so it cannot rot again."
```

---

### Task 3: Make a dead `specAnchor` fail

E9 `tts-composer` and E10 `voice-clone-recorder` carry `specAnchor` values pointing at headings that have never existed. `gen-manifest.mts` synthesises the string from the catalog row rather than from a real heading, and nothing resolves it.

**Files:**

- Modify: `apps/docs/scripts/lib/contract-rules.ts`
- Modify: `apps/docs/scripts/lib/contract-rules.test.ts`
- Modify: `apps/docs/scripts/check-contract.mts`

**Interfaces:**

- Consumes: `MANIFEST` and the existing contract-rule helpers.
- Produces: `anchorErrors(items: ManifestItem[], readDoc: (file: string) => string | undefined): string[]` — one message per unresolvable anchor, empty when all resolve.

- [ ] **Step 1: Write the failing test**

Append to `apps/docs/scripts/lib/contract-rules.test.ts`:

```ts
describe("anchorErrors", () => {
  const item = (name: string, specAnchor: string) => ({ name, specAnchor }) as unknown as ManifestItem;

  it("resolves an anchor that matches a real heading", () => {
    const docs = { "component-specs.md": "## A1 · Kbd\n\ntext\n" };
    expect(anchorErrors([item("kbd", "component-specs.md#a1-kbd")], (f) => docs[f])).toEqual([]);
  });

  it("reports an anchor whose heading does not exist", () => {
    const docs = { "component-specs.md": "## A1 · Kbd\n" };
    const errors = anchorErrors([item("tts-composer", "component-specs.md#e9-tts-composer")], (f) => docs[f]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("tts-composer");
    expect(errors[0]).toContain("e9-tts-composer");
  });

  it("reports an anchor whose file does not exist", () => {
    const errors = anchorErrors([item("kbd", "missing.md#a1-kbd")], () => undefined);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("missing.md");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd apps/docs && pnpm exec vitest run scripts/lib/contract-rules.test.ts
```

Expected: FAIL with `anchorErrors is not defined`.

- [ ] **Step 3: Implement the rule**

Add to `apps/docs/scripts/lib/contract-rules.ts`:

```ts
/**
 * GitHub's heading-anchor algorithm, restricted to what this repo's headings
 * actually contain: lowercase, strip anything that is not a word character,
 * a space or a hyphen, then collapse spaces to hyphens. The `·` separator in
 * "## E9 · TTS Composer" drops out under the strip, and the double space it
 * leaves collapses with the rest.
 */
export function headingSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Every `specAnchor` must resolve to a heading that exists. This is the gate
 * the E9/E10 dead links slipped through: gen-manifest synthesises the anchor
 * from the catalog row rather than from a heading, so an item whose spec
 * section was never written still carries a confident-looking link.
 */
export function anchorErrors(items: ManifestItem[], readDoc: (file: string) => string | undefined): string[] {
  const slugCache = new Map<string, Set<string> | undefined>();
  const slugsFor = (file: string) => {
    if (!slugCache.has(file)) {
      const source = readDoc(file);
      slugCache.set(
        file,
        source === undefined
          ? undefined
          : new Set([...source.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => headingSlug(m[1]))),
      );
    }
    return slugCache.get(file);
  };

  const errors: string[] = [];
  for (const item of items) {
    const [file, anchor] = item.specAnchor.split("#");
    const slugs = slugsFor(file);
    if (slugs === undefined) {
      errors.push(`${item.name}: specAnchor names ${file}, which does not exist`);
    } else if (!slugs.has(anchor)) {
      errors.push(`${item.name}: specAnchor #${anchor} resolves to no heading in ${file}`);
    }
  }
  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/docs && pnpm exec vitest run scripts/lib/contract-rules.test.ts
```

Expected: all pass.

- [ ] **Step 5: Wire it into the gate and watch it catch the two real ones**

In `apps/docs/scripts/check-contract.mts`, after the existing per-item loop, add:

```ts
const docsDir = resolve(import.meta.dirname, "../../../docs/design-system");
errors.push(
  ...anchorErrors(shippedItems(MANIFEST), (file) => {
    const path = resolve(docsDir, file);
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  }),
);
```

Then run:

```bash
cd apps/docs && pnpm exec tsx scripts/check-contract.mts; echo "exit=$?"
```

Expected: FAIL naming exactly `tts-composer` and `voice-clone-recorder`, and `exit=1`. **Two failures and no more.** If a third appears, the slug function disagrees with GitHub on a heading that does resolve; fix `headingSlug`, not the manifest.

- [ ] **Step 6: Write the two missing spec sections**

This is a design act, not a mechanical one: the sections bless what already shipped. Write `## E9 · TTS Composer` and `## E10 · Voice Clone Recorder` into `docs/design-system/component-specs.md`, sourced from the `catalog.md` E9/E10 rows, `gaps.md` §2 R6 and R7, and each component's shipped docs module. Each carries an explicit **Evidence** line saying it is a restored consolidation error rather than a board sample, and instructs implementations to use `evidence: []`. Do not invent product names; the screenshots were never collected.

- [ ] **Step 7: Verify the gate is green**

```bash
pnpm check:contract
```

Expected: 116 items checked, no anchor errors.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/scripts/lib/contract-rules.ts apps/docs/scripts/lib/contract-rules.test.ts \
        apps/docs/scripts/check-contract.mts docs/design-system/component-specs.md
git commit -m "feat(contract): a specAnchor must resolve to a real heading

gen-manifest synthesises the anchor from the catalog row, so an item whose spec
section was never written still carries a confident-looking link. E9 and E10
have had dead anchors since they shipped and nothing could see it. Adds the
rule, then writes the two sections it finds."
```

---

### Task 4: Turn on Storybook lint

`apps/storybook`'s lint script is `echo "no lint"`, so 221 story files, roughly 83,000 lines, have never been linted. Root `pnpm lint` fans out to this workspace and gets the echo.

**Files:**

- Create: `apps/storybook/eslint.config.mjs`
- Modify: `apps/storybook/package.json:7`

**Interfaces:**

- Consumes: `eslint` and `typescript-eslint`, already present transitively; declare them explicitly.
- Produces: a real `lint` script that root `pnpm lint` picks up.

- [ ] **Step 1: Watch the gate do nothing**

```bash
cd apps/storybook && pnpm lint
```

Expected: `no lint`.

- [ ] **Step 2: Add the config**

Create `apps/storybook/eslint.config.mjs`:

```js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["storybook-static/**", "node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Stories destructure story args they do not all use, and the play
      // functions bind elements for readability before asserting on a subset.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);
```

- [ ] **Step 3: Declare the dependencies and the script**

In `apps/storybook/package.json`, set `"lint": "eslint ."` and add to `devDependencies`:

```json
"@eslint/js": "^9.0.0",
"eslint": "^9",
"globals": "^15.0.0",
"typescript-eslint": "^8.0.0"
```

Then `pnpm install` from the repo root.

- [ ] **Step 4: Run it and read the findings**

```bash
cd apps/storybook && pnpm lint 2>&1 | tail -40
```

Expected: a real finding count. **Do not silence a rule to get to zero.** Fix the findings, or if a rule is genuinely wrong for story files, disable that rule in the config with a comment saying why. Record the starting count in the commit message.

- [ ] **Step 5: Verify from the root**

```bash
pnpm lint
```

Expected: three workspaces linted, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/storybook/eslint.config.mjs apps/storybook/package.json pnpm-lock.yaml
git commit -m "feat(storybook): lint 221 story files that were never linted

The lint script was echo \"no lint\", so root pnpm lint fanned out to this
workspace and got nothing. 83,000 lines of story code have never been checked."
```

---

### Task 5: Make the tree prettier-clean and gate it

630 files are not prettier-clean, and a repo-wide format is hook-denied. **The stated reason for that denial is false and was measured to be false:** formatting all 531 source files leaves `check:tokens`, `lint` and `typecheck` green. `check:contract` fails for one reason only — prettier reformats the two files `gen-wiring.mts` generates, so they stop byte-matching what the generator emits. Ignoring the generated files fixes it.

**This task must land after tasks 1–4** and before wave 3, because it touches 531 files and will conflict with anything concurrent.

**Files:**

- Modify: `.prettierignore`
- Modify: `.claude/hooks/deny-dangerous-bash.sh:31-36`
- Modify: `.github/workflows/ci.yml`
- Modify: 531 source files, by prettier

**Interfaces:**

- Consumes: nothing.
- Produces: a tree where `pnpm format:check` exits 0.

- [ ] **Step 1: Reproduce the real failure**

```bash
pnpm exec prettier --write apps/docs/content apps/docs/registry apps/docs/components \
                            apps/docs/lib apps/docs/scripts apps/storybook/src
cd apps/docs && pnpm exec tsx scripts/check-contract.mts
```

Expected: `gen:wiring --check — .../lib/demos.generated.ts is stale` and `docs.generated.ts is stale`. **Not** a guidance-field failure. Confirm no other error appears.

- [ ] **Step 2: Ignore the generated files**

Add to `.prettierignore`:

```
# Generated by scripts/gen-wiring.mts, byte-compared by check:contract. Prettier
# reformats them, the byte comparison then fails, and running gen:wiring to fix
# that re-emits files prettier wants to reformat. The generator owns their shape.
apps/docs/lib/demos.generated.ts
apps/docs/lib/docs.generated.ts
```

- [ ] **Step 3: Restore the generated files and verify the gate**

```bash
cd apps/docs && pnpm gen:wiring && pnpm exec tsx scripts/check-contract.mts
```

Expected: `wiring is current.` and `116 item(s) checked.`

- [ ] **Step 4: Format the whole tree**

```bash
pnpm exec prettier --write .
```

This is the one sanctioned repo-wide format. Then:

```bash
pnpm format:check
```

Expected: `All matched files use Prettier code style!`

- [ ] **Step 5: Run every gate that could notice**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
```

Expected: all green. `check:tokens` still reports its 5 known vendored warnings and `unchecked: TOK-6(rendered)`.

- [ ] **Step 6: Retire the hook's denial**

In `.claude/hooks/deny-dangerous-bash.sh`, delete the `pnpm format` / `prettier --write .` denial block entirely, including its comment. Its premise was that the tree is not prettier-clean; it now is, and `format:check` in CI keeps it that way. Leave every other rule in the file untouched.

- [ ] **Step 7: Add the gate to CI**

In `.github/workflows/ci.yml`, add immediately after the `pnpm lint` step:

```yaml
- run: pnpm format:check
```

Then update `CLAUDE.md`'s CI section to a twelve-step list in the new order, and delete the sentence saying `format:check` is not in CI.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: make the tree prettier-clean and gate it

The hook denied repo-wide format on the grounds that check:contract's guidance
regexes do not survive re-wrapping. Measured: they do — \\s* spans newlines and
prettier never splits a string literal. The real and only breakage was the two
gen-wiring outputs being reformatted out of byte-agreement with their generator,
so they are now prettier-ignored. 630 files formatted, format:check added to CI,
the denial retired."
```

---

### Task 6: Make the docs true

Every claim below was measured at `24d4140` and is wrong today.

**Files:**

- Modify: `README.md:13-14,38`
- Modify: `docs/design-system/README.md:3,7,9,17,28,37,38,39`
- Modify: `docs/CONTINUE.md:7,19,21,26,665,668-669`
- Modify: `CLAUDE.md:102`

**Interfaces:**

- Consumes: the counts in this plan's spec §2.
- Produces: nothing. Prose only.

- [ ] **Step 1: Establish the true numbers**

```bash
grep -c 'status: "shipped"' apps/docs/lib/catalog.manifest.ts   # shipped items
grep -c 'status: "cut"' apps/docs/lib/catalog.manifest.ts       # cut items
grep -c 'name:' apps/docs/lib/marketing-catalog.ts              # marketing items
node -e 'console.log(require("./apps/docs/registry.json").items.length)'  # registry items
git log --oneline -1                                            # the real HEAD
git branch --show-current                                       # the real branch
```

Run `pnpm --filter docs build:registry` first if `registry.json` does not exist; it is a gitignored build artifact.

Use what these print, not what this plan says.

- [ ] **Step 2: Fix `README.md`**

Replace "99-item catalog" at `:38` with the measured shipped count, and replace the Wave 0 paragraph at `:13-14` with a sentence describing the current catalog rather than the first wave. The install example's host is correct and stays.

- [ ] **Step 3: Fix `docs/design-system/README.md`**

It carries four totals in one file — 99, 109, 110, and 86+14 — none of which is 116, and it never mentions family P. Reconcile every one against the manifest, and add family P.

- [ ] **Step 4: Fix `docs/CONTINUE.md` §1 and §5**

- `:7` the "Last updated" date, and `:19-21` the branch, PR number and pushed/merged state, all of which describe a state three weeks and sixteen PRs old while the file's own body runs to 2026-09-06.
- `:26` "114 of 114" against the checker's 116.
- `:665` §5.7 claims 14 components are still `contractExempt`. The flag was deleted by D20 and §1 of the same file already says so. Delete the item.
- `:668-669` §5.8's roadmap claim is still true, but its "56 of 114" figure is not. Correct the figure.

- [ ] **Step 5: Fix `CLAUDE.md:102`**

The line claims the sibling `Minimal Design System` has no token-gate equivalent. It has run the records architecture since its own PR #49. Rewrite to say the two repos have converged on records and name the open schema differences, so the "say so in the PR body" instruction still has a reason to exist.

- [ ] **Step 6: Verify no stale claim survives**

```bash
grep -rn "99-item\|114 of 114\|contractExempt" README.md docs/design-system/README.md docs/CONTINUE.md CLAUDE.md \
  | grep -v "docs/CONTINUE.md:20[0-9][0-9]"
```

Expected: only historical mentions inside `CONTINUE.md`'s §8/§9 wave ledgers, which are a record of what was true then and stay as they are.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/design-system/README.md docs/CONTINUE.md CLAUDE.md
git commit -m "docs: reconcile every count and status claim against the manifest

README said 99 items, design-system/README carried four different totals and
none of them 116, CONTINUE §1 described a branch and PR from three weeks and
sixteen PRs ago while its own body ran to yesterday, §5.7 asserted a flag D20
deleted, and CLAUDE.md still said the sibling repo has no token gate."
```

---

### Task 7: Split the wave ledgers out of CONTINUE.md

At 2,723 lines `CONTINUE.md` is a handoff, a rule book and a nine-wave historical ledger at once. §8 and §9 are 1,700 of those lines and are pure history. This is why §1's header rotted while §8 stayed current: nobody reads to the top of a file they enter at §8.

**Files:**

- Create: `docs/design-system/wave-history.md`
- Modify: `docs/CONTINUE.md`

- [ ] **Step 1: Move §9 wholesale**

Cut `## 9. Gaps found by the case-story pilot` and every `### Wave N` subsection under it into `docs/design-system/wave-history.md`, under a header explaining that it is an append-only record of what each wave found, kept because the shape of the debt is the argument for the program.

- [ ] **Step 2: Leave §8 in place but link it**

§8 is the live composition-gap backlog, not history — `CLAUDE.md` points at it as current work. It stays. Add a line at its head pointing to `wave-history.md` for how each item was found.

- [ ] **Step 3: Replace §9 with a stub**

```markdown
## 9. What each wave found

Moved to [`design-system/wave-history.md`](design-system/wave-history.md). It is
append-only and nothing in it is current state; §1 is current state and §8 is the
live backlog.
```

- [ ] **Step 4: Verify the links resolve and nothing else moved**

```bash
wc -l docs/CONTINUE.md docs/design-system/wave-history.md
grep -rn "CONTINUE.md#9\|§9" docs CLAUDE.md | head
```

Expected: `CONTINUE.md` roughly 1,000 lines, `wave-history.md` roughly 1,700, and every §9 reference still resolving.

- [ ] **Step 5: Commit**

```bash
git add docs/CONTINUE.md docs/design-system/wave-history.md
git commit -m "docs: move the nine wave ledgers out of CONTINUE.md

1,700 of its 2,723 lines were an append-only history of what each wave found.
Keeping them in the handoff is why §1's header rotted three weeks behind §8:
nobody reads to the top of a file they enter in the middle."
```

---

### Task 8: Record D22

**Files:**

- Modify: `docs/design-system/decisions.md`
- Modify: `docs/design-system/component-build-brief.md`

- [ ] **Step 1: Confirm the number is free**

```bash
grep -n "^### D2[0-9]" docs/design-system/decisions.md
```

The 2026-09-04 ladder review earmarked a D21 for its stage 08 and never wrote it. If D21 is taken by the time this lands, take the next free number and say so in the commit.

- [ ] **Step 2: Write the record**

Add to `docs/design-system/decisions.md`, following the shape of D19 and D20:

```markdown
### D22 · Registry components ship English strings — 2026-09-06

29 registry components hardcode `aria-label` text and 6 hardcode placeholders.
They stay hardcoded.

Giving all 29 a labels prop is a public API change across already-published
items, the registry has no deprecation mechanism, and nobody has asked for
translation. The cost of being wrong in this direction is a later additive
prop; the cost of being wrong in the other direction is a prop shape shipped
to every consumer that cannot be walked back.

**Revisit when** a consumer asks, or when a second language ships. At that
point it needs its own spec: the question is not whether to add a prop but
whether labels belong per-component or in one provider.
```

- [ ] **Step 3: Write the rule into the build brief**

Add a line to `docs/design-system/component-build-brief.md` stating that user-facing strings a component owns are written in English at the call site, that a component must not invent a labels prop, and citing D22.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/decisions.md docs/design-system/component-build-brief.md
git commit -m "docs(decisions): D22 — registry components ship English strings"
```

---

## Wave exit gate

Run from the repo root, in this order, and stop at the first failure:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck \
  && pnpm check:tokens && pnpm check:contract && pnpm test \
  && pnpm build:registry && pnpm build \
  && pnpm --filter docs exec playwright test
rm -rf apps/storybook/node_modules/.cache/storybook
pnpm --filter storybook test:stories
apps/docs/scripts/consumer-test.sh
```

All twelve steps green, and `CLAUDE.md`'s CI section matching `ci.yml` step for step.
