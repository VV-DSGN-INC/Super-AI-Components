# Phase 1 — O2 pathfinder + the seven-component leaf batch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the catalog from 94 to 102 of 114 and produce a written block contract, by building
O2 `chat-shell` as a sequential pathfinder while seven leaf components fan out in parallel.

**Architecture:** Two tracks. **Track M+A** (one engineer, sequential) extends the manifest and
contract gate to understand blocks, then builds O2 against that machinery and writes
`block-build-brief.md` — the artifact the twelve Phase 2 shells are handed. **Track B** (seven
parallel agents) builds C2 plus family N's six on the existing, proven component pipeline. Only C2
depends on Track M, and only on Task 1.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind + shadcn CSS variables ·
Base UI primitives · Vitest · Storybook 9 + Playwright/axe · pnpm workspaces + Turbo.

**Source spec:** [`docs/superpowers/specs/2026-08-07-catalog-completion-design.md`](../specs/2026-08-07-catalog-completion-design.md)

**Scope note.** This plan covers **Phase 1 only**. Phase 0 (the twelve A-family retrofits) gets its
own plan and is Phase 2's entry condition, not this plan's — see spec §1.2. Phases 2–4 are planned
after the pathfinder answers whether a block fits one agent's context.

---

## Global Constraints

Copied verbatim from the spec and `CONTINUE.md`. Every task's requirements implicitly include this
section.

- **Commit author must be** `weeeha <1083934+weeeha@users.noreply.github.com>`. GitHub rejects the
  default email for this account. Use
  `git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit`.
- **Never run `pnpm format`.** The tree is not prettier-clean at HEAD; it rewrites ~300 unrelated
  files and breaks `check:contract`, whose guidance regexes (`whatItIs:\s*"..."`) stop matching once
  prettier re-wraps the strings. Format only touched files:
  `pnpm exec prettier --write <paths>`.
- **`rm -rf node_modules/.cache/storybook` before every `pnpm test:stories` run.** Vite's dep
  optimiser invalidates mid-run otherwise and emits a wall of fake a11y-shaped failures that
  actually read `Failed to fetch dynamically imported module`.
- **`react/no-unescaped-entities` is an error, not a warning.** Every literal `'` and `"` in JSX
  text must be escaped.
- **Agents never run git write commands**, and never edit `apps/docs/lib/catalog.manifest.ts`.
  `git stash` is shared across worktrees and has already lost an agent's work; use
  `git show HEAD:path > /tmp/copy` instead.
- **Never pass `data-slot` to a registry component.** Every component spreads `...props` after its
  own attributes, so it silently erases that component's identity and every test keyed to it.
  Overriding a vendored `ui/` primitive's slot is fine; overriding a registry component's is the
  bug. Use `data-<thing>-id` to address rows.
- **Contrast:** `text-muted-foreground` on `bg-muted`/`bg-accent`/`bg-secondary` is 4.34:1 against a
  4.5 minimum. **Do not add call-site workarounds for A2 `cost-chip`, A8 `preview-tile` or A9
  `entity-row`** — those three are being fixed at source in Phase 0. If you need one of them and it
  fails your story, report it rather than papering over it.
- **Vendored `ui/` wrappers silently drop props.** Confirmed: `toggle-group` drops `orientation`;
  `slider` drops `getAriaLabel`/`getAriaValueText`; `tabs` re-emits `orientation` only as
  `data-orientation`; `popover` drops `anchor`; `select` renders the raw value unless passed
  `items`; `progress` is unusable for indeterminate. Read the wrapper before trusting its API;
  composing the Base UI primitive directly is often correct.
- **An `sr-only` suffix fuses with visible text in the accessible name.**
  `<span>In</span><span class="sr-only"> point at 3s</span>` computes as `"Inpoint at 3s"`. Either
  set an outright `aria-label`, or make the visual half `aria-hidden` and put the complete phrase in
  the sr-only span.
- **A Base UI popup is `role="dialog"` and needs a name** — `PopoverContent` without
  `aria-labelledby` fails axe's `aria-dialog-name`.
- **The house contract is [`docs/design-system/component-build-brief.md`](../../design-system/component-build-brief.md).**
  Point agents at it; never re-paste its rules into a prompt.

**Gate baselines to hold or beat:** `pnpm test` **1044** · `pnpm build` **113 pages** ·
`pnpm test:stories` **318** · `registry.json` **110 items**.

**The full gate run**, from the repo root unless noted:

```bash
cd apps/docs && pnpm gen:wiring && pnpm check:contract && cd ../..
pnpm typecheck && pnpm lint && pnpm check:tokens && pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

---

## File Structure

**Modified — machinery (Tasks 1–4):**

| File | Responsibility after this plan |
| --- | --- |
| `apps/docs/lib/manifest-types.ts` | Adds `external?: string[]` and `regions?: string[]` to `ManifestItem` |
| `apps/docs/scripts/lib/registry-extras.ts` | Includes `external` verbatim in `registryDependencies` |
| `apps/docs/scripts/check-contract.mts` | Counts `external` in the dependency assertion; adds the block branch |
| `apps/docs/scripts/gen-manifest.mts` | Branches `specAnchor` on `layer === "block"` |
| `apps/docs/lib/catalog.manifest.test.ts` | Asserts the anchor per layer instead of one pattern |
| `apps/docs/scripts/gen-registry.mts` | Adds `registry:block` to the type union |
| `apps/docs/lib/catalog.manifest.ts` | 14 O rows get correct anchors; O2 gets `regions`/`consumes`; C2 gets `external` |

**Modified — docs site (Task 4):**

| File | Responsibility after this plan |
| --- | --- |
| `apps/docs/lib/catalog.ts` | `group` widens to include `"Blocks"` |
| `apps/docs/app/components/[name]/page.tsx` | Renders blocks full-bleed rather than in a centred frame |
| `apps/docs/components/preview-tabs.tsx` | Gains a `fullBleed?: boolean` prop |

**Created — machinery:**

| File | Responsibility |
| --- | --- |
| `apps/docs/lib/catalog.test.ts` | Regression guard for the `"Blocks"` grouping |
| `docs/design-system/block-build-brief.md` | The house contract for blocks; handed to each Phase 2 agent |

**No new route.** A shipped block already renders at `/components/<name>` — see Task 4's note.

**Created — components (Tasks 5–12).** Each follows the established five-file shape emitted by
`pnpm new:component`:

```
apps/docs/registry/super-ai/<name>.tsx           # the component
apps/docs/registry/super-ai/<name>.test.tsx      # behaviour tests
apps/docs/components/demos/<name>-demo.tsx       # demo
apps/docs/content/components/<name>.docs.tsx     # guidance (plain data, no "use client")
apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx
```

Optional sixth file `<name>.examples.tsx` (a `"use client"` module of zero-prop components) when a
Do/Don't needs a live interactive example. `<name>.docs.tsx` is read by a Server Component and must
never be marked `"use client"` — both halves of this boundary have broken the build before.

---

## Task 1: Manifest learns `external` and `regions`

Adds the two fields the rest of the plan depends on. `external` is what makes C2's cross-registry
dependency expressible; `regions` is what replaces `states` for blocks.

**Files:**
- Modify: `apps/docs/lib/manifest-types.ts:17-54`
- Modify: `apps/docs/scripts/lib/registry-extras.ts:14-16`
- Modify: `apps/docs/scripts/check-contract.mts:93`
- Test: `apps/docs/scripts/lib/registry-extras.test.ts`

**Interfaces:**
- Consumes: nothing — this is the first task.
- Produces: `ManifestItem.external?: string[]` (absolute registry URLs, spread into
  `registryDependencies` after `shadcn` and before `consumes`) and
  `ManifestItem.regions?: string[]` (kebab-case region identifiers, blocks only).
  `deriveExtras(items, self)` keeps its existing signature.

- [ ] **Step 1: Write the failing test**

Append to `apps/docs/scripts/lib/registry-extras.test.ts`:

```ts
it("spreads external registry URLs into registryDependencies", () => {
  const items = [
    {
      id: "C2",
      name: "suggestion-chips",
      title: "Suggestion Chips",
      description: "Task starter chips",
      family: "C",
      layer: "component",
      status: "shipped",
      wave: 2,
      base: [],
      shadcn: ["button"],
      consumes: [],
      npm: [],
      states: ["plain"],
      specAnchor: "component-specs.md#c2-suggestion-chips",
      external: ["https://registry.ai-sdk.dev/suggestion.json"],
    },
  ] as unknown as ManifestItem[];

  const extras = deriveExtras(items, (n) => `https://example.test/r/${n}.json`);

  expect(extras["suggestion-chips"].registryDependencies).toEqual([
    "button",
    "https://registry.ai-sdk.dev/suggestion.json",
  ]);
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts
```

Expected: FAIL — received `["button"]`, the external entry is dropped.

- [ ] **Step 3: Add the fields to the type**

In `apps/docs/lib/manifest-types.ts`, inside `interface ManifestItem`, after the `consumes` field:

```ts
  /**
   * Absolute registry URLs from *other* vendors' registries, spread into
   * registryDependencies verbatim. C2 `suggestion-chips` is the first: it
   * declares AI Elements' own item rather than vendoring or reimplementing it,
   * which is what its spec's "composes rather than reimplements" line requires.
   * Distinct from `consumes` (registry-internal, resolved through self()) and
   * from `shadcn` (bare names shadcn resolves against its own registry).
   */
  external?: string[];
  /**
   * Blocks only. Kebab-case region identifiers taken from the block's
   * `Regions:` line in block-specs.md. Blocks have no `states` — a shell is a
   * layout, not a state machine — so regions are what the contract gate
   * asserts instead.
   */
  regions?: string[];
```

- [ ] **Step 4: Include `external` in the derived dependencies**

In `apps/docs/scripts/lib/registry-extras.ts`, replace line 14:

```ts
    const registryDependencies = [...item.shadcn, ...(item.external ?? []), ...item.consumes.map(self)];
```

- [ ] **Step 5: Run the test and confirm it passes**

```bash
cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts
```

Expected: PASS.

- [ ] **Step 6: Teach the contract gate to count the third kind**

In `apps/docs/scripts/check-contract.mts`, replace line 93:

```ts
  const expectedDeps = item.shadcn.length + (item.external?.length ?? 0) + item.consumes.length;
```

And the error message immediately below it, so a failure names which bucket is off:

```ts
    errors.push(
      `${item.name}: gen-registry would emit ${actualDeps} registryDependencies, expected ${expectedDeps} (shadcn: ${item.shadcn.length}, external: ${item.external?.length ?? 0}, consumes: ${item.consumes.length})`,
    );
```

- [ ] **Step 7: Run the gates**

```bash
cd apps/docs && pnpm check:contract && cd ../.. && pnpm typecheck && pnpm test
```

Expected: `check:contract` green, typecheck clean, **1044+** tests passing.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/lib/manifest-types.ts apps/docs/scripts/lib/registry-extras.ts \
        apps/docs/scripts/lib/registry-extras.test.ts apps/docs/scripts/check-contract.mts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(manifest): external registry deps and block regions"
```

---

## Task 2: Fix the fourteen dead block spec anchors

Every O row points at `component-specs.md#<id>-<name>`, which contains zero `## O` headings — the
block specs are all in `block-specs.md`. The generator produces the wrong anchor unconditionally and
a test asserts the wrong pattern, so the data, the generator and the test must change together.

**Files:**
- Modify: `apps/docs/scripts/gen-manifest.mts:151`
- Modify: `apps/docs/lib/catalog.manifest.test.ts:63`
- Modify: `apps/docs/lib/catalog.manifest.ts` — the 14 O rows

**Interfaces:**
- Consumes: `ManifestItem.layer` from Task 1's file (unchanged by Task 1).
- Produces: every `layer: "block"` item has `specAnchor` matching `^block-specs\.md#`; every other
  item keeps `^component-specs\.md#`.

- [ ] **Step 1: Write the failing test**

Replace the assertion at `apps/docs/lib/catalog.manifest.test.ts:63`:

```ts
      if (item.layer === "block") {
        expect(item.specAnchor).toMatch(/^block-specs\.md#/);
      } else {
        expect(item.specAnchor).toMatch(/^component-specs\.md#/);
      }
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd apps/docs && pnpm vitest run lib/catalog.manifest.test.ts
```

Expected: FAIL — 14 block items still carry `component-specs.md#...`.

- [ ] **Step 3: Branch the generator**

In `apps/docs/scripts/gen-manifest.mts`, replace line 151:

```ts
    specAnchor: `${row.layer === "block" ? "block-specs.md" : "component-specs.md"}#${row.id.toLowerCase()}-${row.name.toLowerCase()}`,
```

- [ ] **Step 4: Fix the fourteen rows**

In `apps/docs/lib/catalog.manifest.ts`, for every item whose `id` starts with `O`, change the
`specAnchor` prefix from `component-specs.md#` to `block-specs.md#`. The anchor slugs themselves are
already correct. Verify all fourteen changed and nothing else did:

```bash
grep -c 'specAnchor: "block-specs.md#o' apps/docs/lib/catalog.manifest.ts   # expect 14
grep -c 'specAnchor: "component-specs.md#o' apps/docs/lib/catalog.manifest.ts  # expect 0
```

- [ ] **Step 5: Run the test and confirm it passes**

```bash
cd apps/docs && pnpm vitest run lib/catalog.manifest.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify the anchors now resolve**

A spec heading is `## <ID> \`<name>\` — description`; the anchor is `<id>-<name>`, dropping the
description. Match on that shape, not on a slug of the whole heading.

```bash
cd "$(git rev-parse --show-toplevel)" && node -e '
const fs=require("fs");
const man=fs.readFileSync("apps/docs/lib/catalog.manifest.ts","utf8");
const files={
  "block-specs.md":"docs/design-system/block-specs.md",
  "component-specs.md":"docs/design-system/component-specs.md",
};
const anchorsIn={};
for(const [k,p] of Object.entries(files)){
  const s=fs.readFileSync(p,"utf8");
  anchorsIn[k]=new Set();
  for(const m of s.matchAll(/^##\s+([A-Z]\d{1,2})\s+`?~?~?([a-z0-9-]+)/gm))
    anchorsIn[k].add((m[1]+"-"+m[2]).toLowerCase());
}
const dead=[];
for(const m of man.matchAll(/specAnchor:\s*"([^"#]+)#([^"]+)"/g)){
  const [,file,a]=m;
  if(!anchorsIn[file] || !anchorsIn[file].has(a)) dead.push(file+"#"+a);
}
console.log("dead anchors: "+dead.length);
dead.forEach(d=>console.log("  "+d));
'
```

**Expected after this task: exactly 3 dead anchors, all pre-existing and none of them blocks.**

```
component-specs.md#e9-tts-composer
component-specs.md#e10-voice-clone-recorder
component-specs.md#g-useflowrunner-useflowrunner
```

Before this task there are 17; the 14 block anchors are what you just fixed. Do **not** try to fix
the remaining three here — see the note below. If you see any anchor containing `o1-`…`o14-`, the
fix is incomplete.

> **Finding, recorded 2026-08-07 while writing this plan — do not action in this task.**
> `useFlowRunner` is cut (D9), so its dead anchor is harmless and the gate never reads it.
> **E9 `tts-composer` and E10 `voice-clone-recorder` are different: both are `status: "shipped"`
> and neither has ever had a spec section written.** The only occurrence of `tts-composer` in
> `component-specs.md` is a cross-reference in another component's Boundary line (~line 705), not a
> `## E9` heading.
>
> This contradicts `CONTINUE.md` §5.4, which records the spec gap as **RESOLVED** — its list of the
> five specs written on 2026-08-04 (H6, H7, J7, M7, N7) never included E9 or E10, which arrived
> separately as D12's restorations R6 and R7. Two shipped components therefore have no spec.
>
> Writing them is out of scope for Phase 1 (both components already exist and pass their gates).
> Raise it with Nick and let him decide whether it joins Phase 0, Phase 3, or its own task. It is
> logged here so it stops being invisible.

- [ ] **Step 7: Run the gates and commit**

```bash
cd apps/docs && pnpm check:contract && cd ../.. && pnpm typecheck && pnpm test
git add apps/docs/scripts/gen-manifest.mts apps/docs/lib/catalog.manifest.test.ts apps/docs/lib/catalog.manifest.ts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "fix(manifest): block specAnchors point at block-specs.md"
```

---

## Task 3: `registry:block` and the contract gate's block branch

**Files:**
- Modify: `apps/docs/scripts/gen-registry.mts:30`
- Modify: `apps/docs/scripts/check-contract.mts` — after the `contractExempt` early-return at line 112
- Test: `apps/docs/scripts/lib/registry-extras.test.ts`

**Interfaces:**
- Consumes: `ManifestItem.regions` (Task 1), `layer: "block"` (already in the type).
- Produces: blocks emit `type: "registry:block"`; `check-contract` applies four block assertions
  (non-empty `consumes`, every declared region present as `data-region="<id>"`, an `Empty` story
  export, a `Responsive` story export) and skips per-state story coverage.

- [ ] **Step 1: Add the type to the union**

In `apps/docs/scripts/gen-registry.mts`, replace line 30:

```ts
  type?: "registry:component" | "registry:hook" | "registry:lib" | "registry:block";
```

And in the item mapping at line 241, derive it from the layer instead of defaulting:

```ts
  type: i.type ?? (i.layer === "block" ? "registry:block" : "registry:component"),
```

- [ ] **Step 2: Write the failing gate assertions**

In `apps/docs/scripts/check-contract.mts`, immediately after the `contractExempt` block that ends at
line 115, insert:

```ts
  if (item.layer === "block") {
    checked++;

    // A block that composes nothing is a block that reimplemented its parts.
    // This is the assertion that catches a shell agent writing its own
    // inspector markup instead of composing property-inspector.
    if (item.consumes.length === 0) {
      errors.push(`${item.name}: blocks must declare a non-empty consumes list`);
    }

    const blockPath = fileFor.component(item.name);
    const source = existsSync(blockPath) ? readFileSync(blockPath, "utf8") : "";
    for (const region of item.regions ?? []) {
      if (!source.includes(`data-region="${region}"`)) {
        errors.push(`${item.name}: block does not render declared region "${region}" (expected data-region="${region}")`);
      }
    }
    if (!(item.regions ?? []).length) {
      errors.push(`${item.name}: blocks must declare a non-empty regions list`);
    }

    const blockStoryPath = storyFor(item.name);
    if (!existsSync(blockStoryPath)) {
      errors.push(`${item.name}: missing story file ${blockStoryPath}`);
    } else {
      const blockStory = readFileSync(blockStoryPath, "utf8");
      // Empty is mandatory because F4, O1 and O3 all independently say the
      // empty state is the view most users actually see. Responsive is
      // mandatory because a shell is a layout and layout is what breaks.
      for (const required of ["Empty", "Responsive"]) {
        if (!new RegExp(`export const ${required}\\s*[:=]`).test(blockStory)) {
          errors.push(`${item.name}: block story is missing the mandatory "${required}" export`);
        }
      }
    }

    continue; // blocks have no `states`; per-state coverage does not apply
  }
```

- [ ] **Step 3: Run the gate and confirm it fails for the right reason**

```bash
cd apps/docs && pnpm check:contract
```

Expected: PASS for now — every O item is still `status: "planned"`, and the loop skips non-shipped
items at line 74. This step confirms the branch is syntactically live without breaking the tree; it
starts failing meaningfully the moment O2 flips to `shipped` in Task 5.

- [ ] **Step 4: Verify the branch actually fires**

Temporarily flip O2's `status` to `"shipped"` in `apps/docs/lib/catalog.manifest.ts`, run
`pnpm check:contract`, and confirm you get all four failures (empty `consumes`, empty `regions`,
missing story, missing `Empty`/`Responsive`). Then **revert the status back to `"planned"`**.

```bash
cd apps/docs && pnpm check:contract   # expect 4+ errors naming chat-shell
git checkout apps/docs/lib/catalog.manifest.ts
```

- [ ] **Step 5: Run the gates and commit**

```bash
cd apps/docs && pnpm check:contract && cd ../.. && pnpm typecheck && pnpm lint && pnpm test
git add apps/docs/scripts/gen-registry.mts apps/docs/scripts/check-contract.mts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(contract): registry:block type and the block branch"
```

---

## Task 4: Give blocks their own group and a full-bleed showcase

> **Corrected while writing this plan.** The first draft of this task created a separate
> `app/blocks/[name]/page.tsx` route. That would have shipped a **duplicate** page.
> `apps/docs/lib/catalog.ts:12` builds `CATALOG_ITEMS` by filtering the manifest on
> `status === "shipped"` alone — with no layer filter — and its `ORDER` map at line 10 already reads
> `{ primitive: 0, component: 1, block: 2 }`. Blocks were anticipated. The moment O2 flips to
> `shipped` it gets `/components/chat-shell`, a sidebar entry and a `demos.generated` requirement,
> for free.
>
> What is actually missing is smaller: blocks are grouped under **"Components"**, and a full-page
> shell rendered inside a centred preview frame is useless. That is what this task fixes.

**Files:**
- Modify: `apps/docs/lib/catalog.ts:3-19` — add the `"Blocks"` group
- Modify: `apps/docs/app/components/[name]/page.tsx:69-88` — full-bleed preview for blocks
- Test: `apps/docs/lib/catalog.test.ts` (create if absent)

**Interfaces:**
- Consumes: `ManifestItem.layer` — already present, unchanged by Task 1.
- Produces: `CatalogItem.group` widens to `"Primitives" | "Components" | "Blocks"`. The component
  route renders blocks full-bleed. **No new route and no change to page count** — a shipped block
  already produces exactly one page.

- [ ] **Step 1: Write the failing test**

The grouping must be tested as a **pure function of layer**, not by filtering the manifest for
shipped blocks — no block is shipped until Task 5, so a manifest-driven assertion would iterate an
empty array and assert nothing. Export the mapping so it can be tested directly.

Create `apps/docs/lib/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { CATALOG_ITEMS, groupFor } from "./catalog";
import { MANIFEST } from "./catalog.manifest";

describe("groupFor", () => {
  it("maps every layer to its own group", () => {
    expect(groupFor("primitive")).toBe("Primitives");
    expect(groupFor("component")).toBe("Components");
    expect(groupFor("block")).toBe("Blocks");
  });
});

describe("CATALOG_ITEMS", () => {
  it("assigns each shipped item the group its layer maps to", () => {
    const shipped = MANIFEST.filter((i) => i.status === "shipped");
    expect(shipped.length).toBeGreaterThan(0);
    for (const item of shipped) {
      expect(CATALOG_ITEMS.find((i) => i.name === item.name)?.group).toBe(groupFor(item.layer));
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd apps/docs && pnpm vitest run lib/catalog.test.ts
```

Expected: FAIL — `groupFor` is not exported yet. Both assertions are real from the first run: the
`groupFor` test covers `"block"` directly, and the `CATALOG_ITEMS` test guards against an empty
manifest with `toBeGreaterThan(0)` so it cannot pass vacuously.

- [ ] **Step 3: Add the group**

In `apps/docs/lib/catalog.ts`, widen the union at line 7, export the mapping, and use it at line 18:

```ts
  group: "Primitives" | "Components" | "Blocks";
```

```ts
export const groupFor = (layer: ManifestItem["layer"]): CatalogItem["group"] =>
  layer === "primitive" ? "Primitives" : layer === "block" ? "Blocks" : "Components";
```

```ts
    group: groupFor(i.layer),
```

`ManifestItem` will need importing from `./manifest-types` if it is not already.

- [ ] **Step 4: Render blocks full-bleed**

In `apps/docs/app/components/[name]/page.tsx`, derive the layer alongside the existing item lookup
(after line 58):

```tsx
  const isBlock = !isMarketing && CATALOG_ITEMS.find((i) => i.name === name)?.group === "Blocks";
```

Then pass it through to the preview so a shell is not squeezed into a centred frame — replace the
`<PreviewTabs ... />` call at line 76:

```tsx
      <PreviewTabs preview={<Demo />} code={demoSource} fullBleed={isBlock} />
```

Add the `fullBleed?: boolean` prop to `apps/docs/components/preview-tabs.tsx`, defaulting to
`false`, and use it to drop the preview container's centring and max-width. Read that file before
editing — do not assume its current class names.

- [ ] **Step 5: Verify the group union is exhaustive wherever it is consumed**

```bash
cd apps/docs && grep -rn '"Primitives"\|"Components"' --include=*.tsx --include=*.ts . \
  | grep -v node_modules | grep -v '\.test\.'
```

Any sidebar or index that switches on `group` needs a `"Blocks"` arm, or blocks will silently
vanish from navigation. Fix every hit.

- [ ] **Step 6: Run the gates and commit**

```bash
cd apps/docs && pnpm vitest run lib/catalog.test.ts && cd ../.. && pnpm typecheck && pnpm lint && pnpm build
```

Expected: page count unchanged at **113** — no block ships until Task 5.

```bash
git add apps/docs/lib/catalog.ts apps/docs/lib/catalog.test.ts \
        apps/docs/app/components apps/docs/components/preview-tabs.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(docs): blocks get their own group and a full-bleed preview"
```

---

## Task 5: O2 `chat-shell` — the pathfinder

The one block built by hand. Its purpose is to prove the four block assertions from Task 3 and
produce the brief for Phase 2.

**Files:**
- Modify: `apps/docs/lib/catalog.manifest.ts` — the O2 row
- Create: `apps/docs/registry/super-ai/chat-shell.tsx`
- Create: `apps/docs/registry/super-ai/chat-shell.test.tsx`
- Create: `apps/docs/components/demos/chat-shell-demo.tsx`
- Create: `apps/docs/content/components/chat-shell.docs.tsx`
- Create: `apps/storybook/src/stories/super-ai/ChatShell.stories.tsx`
- Spec: [`docs/design-system/block-specs.md`](../../design-system/block-specs.md) § `O2 chat-shell`

**Interfaces:**
- Consumes: Tasks 1–4 — `regions` field, corrected anchor, block gate branch, showcase route.
- Produces: the first `registry:block` item, and the empirical answers Task 6 writes down —
  whether a block fits one agent's context, and which of the four assertions needed adjusting.

**O2's spec, for reference.** Regions: `sidebar + task list · topbar · message stream · artifact
cards · composer`. Filled by: B1 `app-sidebar` · B6 `thread-list` · B7 `app-topbar` · the D1/D3/D4
composer family · J4 `artifact-grid` · N1 `feedback` · N3 `disclaimer-note` · M5 `paywall-message` ·
L1 `empty-state`. The sidebar doubles as a job queue — running tasks show spinners in B6.
Artifacts render as cards inside the stream and open into their own surface. M5 lives in the
stream, which is why monetization could not be deferred to a late wave in this shell.

- [ ] **Step 1: Prepare the manifest row**

In `apps/docs/lib/catalog.manifest.ts`, set O2's fields. `regions` are kebab-cased from the spec's
`Regions:` line; `consumes` from its `Filled by:` line. Leave `status: "building"` until Step 7.

```ts
    status: "building",
    regions: ["sidebar", "topbar", "message-stream", "artifact-cards", "composer"],
    consumes: [
      "app-sidebar",
      "thread-list",
      "app-topbar",
      "artifact-grid",
      "feedback",
      "disclaimer-note",
      "paywall-message",
      "empty-state",
    ],
    states: [],
```

Confirm every name resolves to a shipped item before going further:

```bash
cd "$(git rev-parse --show-toplevel)" && node -e '
const src=require("fs").readFileSync("apps/docs/lib/catalog.manifest.ts","utf8");
const st={};
for(const b of src.split(/\n\s*\{\s*\n/).slice(1)){
  const n=(b.match(/name:\s*"([^"]+)"/)||[])[1], s=(b.match(/status:\s*"([^"]+)"/)||[])[1];
  if(n&&s) st[n]=s;
}
for(const d of ["app-sidebar","thread-list","app-topbar","artifact-grid","feedback","disclaimer-note","paywall-message","empty-state"])
  console.log((st[d]==="shipped"?"OK   ":"BAD  ")+d+" ("+(st[d]||"absent")+")");
'
```

Expected: all eight `OK`. If any is `absent`, its registry name differs from the catalog ID's label —
find the real name before proceeding rather than guessing.

- [ ] **Step 2: Scaffold**

```bash
cd apps/docs && pnpm new:component chat-shell
```

Emits the five files with deliberately failing tests.

- [ ] **Step 3: Write the failing region test**

In `apps/docs/registry/super-ai/chat-shell.test.tsx`, replace the scaffold's `expect.fail` stubs:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatShell } from "./chat-shell";

const REGIONS = ["sidebar", "topbar", "message-stream", "artifact-cards", "composer"];

describe("ChatShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<ChatShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<ChatShell className="test-class" />);
    expect(document.querySelector('[data-slot="chat-shell"]')!.className).toContain("test-class");
  });
});
```

- [ ] **Step 4: Run it and confirm it fails**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/chat-shell.test.tsx
```

Expected: FAIL — five region assertions, no `data-region` attributes yet.

- [ ] **Step 5: Implement the shell**

Compose the eight declared components. Every region gets `data-region="<id>"`. Do not reimplement
anything in the `consumes` list — that is exactly what Task 3's gate checks for. Where a composed
component does not fit, **report it rather than working around it**: that report is the most
valuable output of this task.

- [ ] **Step 6: Run the test and confirm it passes**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/chat-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Write the stories, including the two mandatory exports**

In `apps/storybook/src/stories/super-ai/ChatShell.stories.tsx`, `Empty` and `Responsive` are
required by Task 3's gate. `Empty` renders the shell with no threads and no messages — the day-one
view. `Responsive` exercises the layout at a narrow viewport via Storybook's `viewport` parameter.

- [ ] **Step 8: Flip to shipped, reconcile deps, run every gate**

Set `status: "shipped"` in the manifest, then reconcile declared deps against real imports:

```bash
cd apps/docs
grep -h 'from "' registry/super-ai/chat-shell.tsx \
  | sed 's/.*from "//;s/".*//' \
  | grep -E '^@/components/ui/|^@/registry/super-ai/|lucide-react|^@base-ui' \
  | sort -u
```

Set `shadcn`, `consumes` and `npm` from that output. On `@base-ui/react`: leave it out of `npm`
unless the block imports **no** vendored `ui/` primitive at all — it normally arrives as a peer.

```bash
cd apps/docs && pnpm gen:wiring && pnpm check:contract && cd ../..
pnpm typecheck && pnpm lint && pnpm check:tokens && pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

Expected: all green. `pnpm build` now reports **114 pages** — 113 plus `/components/chat-shell`,
which `CATALOG_ITEMS` produces automatically once O2 is `shipped` (Task 4). Confirm the page renders
full-bleed and appears under a **Blocks** heading in the sidebar, not under Components.

- [ ] **Step 9: Commit**

```bash
git add apps/docs apps/storybook
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(O2): chat-shell — the first block, and the block contract it proves"
```

---

## Task 6: Write `block-build-brief.md`

The deliverable Phase 2's twelve agents are handed. Written **after** O2, from what O2 actually
taught, not before it from theory.

**Files:**
- Create: `docs/design-system/block-build-brief.md`
- Reference: `docs/design-system/component-build-brief.md` — match its voice and length (163 lines);
  it is the proven model.

**Interfaces:**
- Consumes: everything Task 5 learned.
- Produces: the single artifact each Phase 2 agent receives, alongside its spec anchor, declared
  regions and `consumes` list.

- [ ] **Step 1: Write the brief**

It must cover, at minimum:

1. **Scope** — a block composes; it does not implement. If a composed component does not fit,
   report it; do not fork it.
2. **The four gate assertions** from Task 3, stated as requirements: non-empty `consumes`, every
   declared region present as `data-region="<id>"`, an `Empty` story, a `Responsive` story.
3. **Regions, not states** — and why (a shell is a layout, not a state machine).
4. **Why `Empty` is mandatory** — cite F4, O1 and O3, which say it independently.
5. **A pointer to `component-build-brief.md`** for everything that is unchanged (tokens, a11y,
   guidance, escaping). Do not restate those rules — one copy is what prevents drift.
6. **What O2 actually hit** — the concrete traps found in Task 5, written down while fresh.

- [ ] **Step 2: Verify it does not duplicate the component brief**

```bash
cd "$(git rev-parse --show-toplevel)" && wc -l docs/design-system/*-build-brief.md
```

If the block brief approaches the component brief's length, it is probably restating rules rather
than pointing at them. Cut it back.

- [ ] **Step 3: Commit**

```bash
git add docs/design-system/block-build-brief.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "docs(design-system): the block build brief"
```

---

## Task 7: Prepare the manifest and scaffold the leaf batch

Central, controller-owned work for all seven leaf components. `apps/docs/lib/catalog.manifest.ts`
is the single source of truth and the one shared file — **agents must never write it**, which is why
this is its own task ahead of the seven builds.

**Files:**
- Modify: `apps/docs/lib/catalog.manifest.ts` — the C2, N2, N4, N5, N6, N7, N8 rows
- Create (via scaffold): five files each for all seven components

**Interfaces:**
- Consumes: `ManifestItem.external` from Task 1.
- Produces: seven rows at `status: "building"` with normalised `states`, C2 carrying its `external`
  entry, and 35 scaffolded files. Tasks 8–14 each own exactly one component's five files.

The raw `states` in `catalog.md` are prose and cannot become story exports. Below are the normalised
values, already checked against the three known traps: no `default` (forbidden by the gate), no
`meta` or `story` (they collide with the story template's own `Meta` import), no two states
normalising to the same identifier, and no `Error` — which would shadow the JS global inside the
story module, and is why N5's tabs carry a `-tab` suffix.

- [ ] **Step 1: Set `status: "building"` and these exact `states` for all seven**

```ts
// C2 suggestion-chips  → Plain · WithIcon · WithThumbnail · OverflowLink
states: ["plain", "with-icon", "with-thumbnail", "overflow-link"],

// N2 trust-dialog      → Preview · Warning · TrustCheckbox · AccountPicker
states: ["preview", "warning", "trust-checkbox", "account-picker"],

// N4 trace-timeline    → Collapsed · Expanded · Errored · RetrySiblings
states: ["collapsed", "expanded", "errored", "retry-siblings"],

// N5 run-inspector     → InputTab · OutputTab · MetadataTab · ErrorTab
states: ["input-tab", "output-tab", "metadata-tab", "error-tab"],

// N6 usage-dashboard   → PeriodSelect · SummaryCards · ModelBreakdown
states: ["period-select", "summary-cards", "model-breakdown"],

// N7 env-status        → Ok · Degraded · KeyInvalid · NotRunning
states: ["ok", "degraded", "key-invalid", "not-running"],

// N8 permission-prompt → AllowOnce · AlwaysAllow · Deny · EditFirst
states: ["allow-once", "always-allow", "deny", "edit-first"],
```

- [ ] **Step 2: Set C2's cross-registry dependency**

On the C2 row only:

```ts
    external: ["https://registry.ai-sdk.dev/suggestion.json"],
```

- [ ] **Step 3: Verify no state normalises to a forbidden or colliding identifier**

```bash
cd "$(git rev-parse --show-toplevel)/apps/docs" && pnpm exec tsx -e '
import { statePascal } from "./scripts/lib/scaffold-templates";
const sets: Record<string,string[]> = {
  "suggestion-chips": ["plain","with-icon","with-thumbnail","overflow-link"],
  "trust-dialog": ["preview","warning","trust-checkbox","account-picker"],
  "trace-timeline": ["collapsed","expanded","errored","retry-siblings"],
  "run-inspector": ["input-tab","output-tab","metadata-tab","error-tab"],
  "usage-dashboard": ["period-select","summary-cards","model-breakdown"],
  "env-status": ["ok","degraded","key-invalid","not-running"],
  "permission-prompt": ["allow-once","always-allow","deny","edit-first"],
};
const banned = new Set(["Default","Meta","Story","StoryObj","Error"]);
let bad = 0;
for (const [name, states] of Object.entries(sets)) {
  const idents = states.map(statePascal);
  const dupes = idents.filter((v,i) => idents.indexOf(v) !== i);
  const hits = idents.filter(i => banned.has(i));
  if (dupes.length || hits.length) { bad++; console.log("BAD  " + name, {dupes, hits}); }
  else console.log("OK   " + name + "  " + idents.join(" · "));
}
console.log(bad ? bad + " components need renaming" : "all clear");
'
```

Expected: seven `OK` lines and `all clear`. This exact command was run on 2026-08-07 and produced
that output; a different result means the manifest was edited incorrectly in Step 1.

- [ ] **Step 4: Scaffold all seven**

```bash
cd apps/docs
for n in suggestion-chips trust-dialog trace-timeline run-inspector usage-dashboard env-status permission-prompt; do
  pnpm new:component "$n"
done
```

Each emits five files with deliberately failing tests.

- [ ] **Step 5: Verify 35 files landed**

```bash
cd "$(git rev-parse --show-toplevel)" && for n in suggestion-chips trust-dialog trace-timeline run-inspector usage-dashboard env-status permission-prompt; do
  printf "%-20s " "$n"
  ls apps/docs/registry/super-ai/$n.tsx apps/docs/registry/super-ai/$n.test.tsx \
     apps/docs/components/demos/$n-demo.tsx apps/docs/content/components/$n.docs.tsx 2>/dev/null | wc -l
done
```

Expected: `4` on every line (the fifth file is the story, under `apps/storybook`).

- [ ] **Step 6: Commit the scaffold**

```bash
git add apps/docs apps/storybook
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "chore(wave-11): scaffold C2 and family N's six"
```

---

## Task 8: C2 `suggestion-chips`

**Files:**
- Modify: `apps/docs/registry/super-ai/suggestion-chips.tsx`
- Modify: `apps/docs/registry/super-ai/suggestion-chips.test.tsx`
- Modify: `apps/docs/components/demos/suggestion-chips-demo.tsx`
- Modify: `apps/docs/content/components/suggestion-chips.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx`
- Vendor: `apps/docs/components/ai-elements/suggestion.tsx`
- Spec: `docs/design-system/component-specs.md#c2-suggestion-chips`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7; `external` already set on the manifest row — do not edit the
  manifest.
- Produces: story exports `Plain`, `WithIcon`, `WithThumbnail`, `OverflowLink`.

**Steering.** This composes `@ai-elements/suggestion`, which is **not** vendored in `apps/docs`
(only `apps/storybook` has an `ai-elements/` directory). Vendor the single file so the workbench can
render it; the consumer-facing dependency is declared via the manifest's `external` field, already
set. Chips are **prompts, not filters** — clicking fills the composer; it never navigates or
submits. Overflow resolves to a link, because a half-visible chip reads as a layout bug. `plain` is
deliberately not named `default` (the contract gate forbids a `Default` export).

- [ ] **Step 1: Vendor the AI Elements component**

```bash
cd apps/docs && npx shadcn@latest add https://registry.ai-sdk.dev/suggestion.json
```

Confirm it landed at `apps/docs/components/ai-elements/suggestion.tsx`. Read it before composing —
do not assume its API.

- [ ] **Step 2: Write the failing tests**

Replace the scaffold's `expect.fail` stubs in `suggestion-chips.test.tsx` with real behavioural
tests, one per declared state, plus one pinning the spec's load-bearing sentence: **clicking a chip
fills the composer rather than submitting**. Assert on the callback, not on the DOM alone.

- [ ] **Step 3: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/suggestion-chips.test.tsx
```

Expected: FAIL — the scaffold renders an empty `div`.

- [ ] **Step 4: Implement, composing rather than reimplementing**

- [ ] **Step 5: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/suggestion-chips.test.tsx
```

- [ ] **Step 6: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `Plain`, `WithIcon`, `WithThumbnail`, `OverflowLink`. The `.docs.tsx`
module is plain data read by a Server Component — **never** mark it `"use client"`; interactive
examples go in a sibling `suggestion-chips.examples.tsx`.

- [ ] **Step 7: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/suggestion-chips.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command — integration is
central (Task 15).

---

## Task 9: N2 `trust-dialog`

**Files:**
- Modify: `apps/docs/registry/super-ai/trust-dialog.tsx`
- Modify: `apps/docs/registry/super-ai/trust-dialog.test.tsx`
- Modify: `apps/docs/components/demos/trust-dialog-demo.tsx`
- Modify: `apps/docs/content/components/trust-dialog.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/TrustDialog.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n2-trust-dialog`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7. Do not edit the manifest.
- Produces: story exports `Preview`, `Warning`, `TrustCheckbox`, `AccountPicker`.

**Steering.** Base: Alert-dialog, Checkbox. The primary action **stays disabled until the trust
checkbox is ticked** — that is the load-bearing behaviour and a test must pin it. A preview of what
will run sits above the warning. The account picker on Continue chooses *where* untrusted code
executes, which matters as much as whether it runs at all.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one that asserts the primary action is disabled until the checkbox is ticked and enabled after.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trust-dialog.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trust-dialog.test.tsx
```

- [ ] **Step 5: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `Preview`, `Warning`, `TrustCheckbox`, `AccountPicker`. The
`.docs.tsx` module is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trust-dialog.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 10: N4 `trace-timeline`

**Files:**
- Modify: `apps/docs/registry/super-ai/trace-timeline.tsx`
- Modify: `apps/docs/registry/super-ai/trace-timeline.test.tsx`
- Modify: `apps/docs/components/demos/trace-timeline-demo.tsx`
- Modify: `apps/docs/content/components/trace-timeline.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/TraceTimeline.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n4-trace-timeline`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7. Do not edit the manifest.
- Produces: story exports `Collapsed`, `Expanded`, `Errored`, `RetrySiblings`.

**Steering.** Base: Collapsible. Bars are positioned by **start time, not stacked** — a waterfall
that hides concurrency is just a list, and a test must pin the positioning. Retries render as
**sibling rows**, never replacing the failed attempt. Rows expand into N5 `run-inspector` in place;
N5 ships in this same batch, so **do not import it** — describe the expanded-row contract you assume
in your report and let integration reconcile it.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one asserting bars are positioned by start time (two concurrent spans overlap rather than stack) and
one asserting a retry renders as a sibling row alongside the failed attempt, not in place of it.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trace-timeline.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trace-timeline.test.tsx
```

- [ ] **Step 5: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `Collapsed`, `Expanded`, `Errored`, `RetrySiblings`. The `.docs.tsx`
module is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/trace-timeline.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 11: N5 `run-inspector`

**Files:**
- Modify: `apps/docs/registry/super-ai/run-inspector.tsx`
- Modify: `apps/docs/registry/super-ai/run-inspector.test.tsx`
- Modify: `apps/docs/components/demos/run-inspector-demo.tsx`
- Modify: `apps/docs/content/components/run-inspector.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/RunInspector.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n5-run-inspector`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7; composes A10 `stat-readout` (shipped). Do not edit the
  manifest.
- Produces: story exports `InputTab`, `OutputTab`, `MetadataTab`, `ErrorTab`.

**Steering.** Base: Tabs, A10 `stat-readout`. Raw input and output must be **copyable** JSON —
pretty-printed but uncopyable cannot go in a bug report, and a test should pin that a copy
affordance exists. Cache hit/miss belongs beside cost; it is usually the largest lever on spend. The
error tab explains what was retried and whether it worked.

Two traps specific to this component: **the vendored `tabs` wrapper destructures `orientation` and
re-emits it only as `data-orientation`**, so a vertical tab list keeps horizontal arrow keys and
announces `aria-orientation="horizontal"` — read `apps/docs/components/ui/tabs.tsx` before trusting
it, and compose Base UI directly if needed. And A10 is `contractExempt` pending a Phase 0 retrofit —
**compose it normally and do not add a call-site workaround**; if it fails your story, report it.

The state names carry a `-tab` suffix deliberately: the raw spec names would normalise to `Input`,
`Output` and `Error`, and `export const Error` shadows the JS global inside the story module.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one asserting the input and output panes expose a copy affordance carrying the raw JSON.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/run-inspector.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/run-inspector.test.tsx
```

- [ ] **Step 5: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `InputTab`, `OutputTab`, `MetadataTab`, `ErrorTab`. The `.docs.tsx`
module is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/run-inspector.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 12: N6 `usage-dashboard`

**Files:**
- Modify: `apps/docs/registry/super-ai/usage-dashboard.tsx`
- Modify: `apps/docs/registry/super-ai/usage-dashboard.test.tsx`
- Modify: `apps/docs/components/demos/usage-dashboard-demo.tsx`
- Modify: `apps/docs/content/components/usage-dashboard.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/UsageDashboard.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n6-usage-dashboard`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7. Do not edit the manifest.
- Produces: story exports `PeriodSelect`, `SummaryCards`, `ModelBreakdown`.

**Steering.** Base: Chart, Card. **Per-model breakdown is the actionable view** — total spend only
says there is a problem, not what to do about it. Deltas sit beside every summary figure. The period
select **drives every panel at once**; that coupling is the component's point and a test must pin
it. This is the team-facing counterpart to M2 `credits-indicator`: same data, different audience.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one asserting that changing the period updates both the summary figures and the per-model breakdown
in the same interaction.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/usage-dashboard.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/usage-dashboard.test.tsx
```

- [ ] **Step 5: Write the three stories, the demo, and the guidance module**

Story exports must be exactly `PeriodSelect`, `SummaryCards`, `ModelBreakdown`. The `.docs.tsx`
module is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/usage-dashboard.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 13: N7 `env-status`

**Files:**
- Modify: `apps/docs/registry/super-ai/env-status.tsx`
- Modify: `apps/docs/registry/super-ai/env-status.test.tsx`
- Modify: `apps/docs/components/demos/env-status-demo.tsx`
- Modify: `apps/docs/content/components/env-status.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/EnvStatus.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n7-env-status`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7; composes A9 `entity-row` (shipped). Do not edit the manifest.
- Produces: story exports `Ok`, `Degraded`, `KeyInvalid`, `NotRunning`.

**Steering.** Base: Badge, A9 `entity-row`. **Four states because there are four different
remedies:** `degraded` means wait, `key-invalid` means go and fix a credential, `not-running` means
start something locally. Collapsing them into one red dot tells a user something is wrong and
nothing about what to do.

**Never status by colour alone** — each provider row states its condition **in words**. A row of
coloured dots is the failure mode this component exists to avoid, and a test must pin the textual
condition. Reachability is not spend: a run can fail with a full balance when a key has expired,
which is precisely why D12 restored this component.

A9 is `contractExempt` pending a Phase 0 retrofit and has a known contrast failure — **compose it
normally and do not add a call-site workaround**; if it fails your story, report it.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one asserting each state is conveyed in text and not by colour alone.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/env-status.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/env-status.test.tsx
```

- [ ] **Step 5: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `Ok`, `Degraded`, `KeyInvalid`, `NotRunning`. The `.docs.tsx` module
is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/env-status.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 14: N8 `permission-prompt`

`gaps.md` records this as **the single most important missing component in the catalog**: every
tool-calling agent needs it, and it is a safety surface rather than a convenience one. Build it to
that weight.

**Files:**
- Modify: `apps/docs/registry/super-ai/permission-prompt.tsx`
- Modify: `apps/docs/registry/super-ai/permission-prompt.test.tsx`
- Modify: `apps/docs/components/demos/permission-prompt-demo.tsx`
- Modify: `apps/docs/content/components/permission-prompt.docs.tsx`
- Modify: `apps/storybook/src/stories/super-ai/PermissionPrompt.stories.tsx`
- Spec: `docs/design-system/component-specs.md#n8-permission-prompt`
- House contract: `docs/design-system/component-build-brief.md` — **read it; do not expect its rules
  restated here**

**Interfaces:**
- Consumes: the scaffold from Task 7. Do not edit the manifest.
- Produces: story exports `AllowOnce`, `AlwaysAllow`, `Deny`, `EditFirst`.

**Steering.** Base: Alert-dialog. **Four verbs, and edit-first carries equal visual weight with
allow.** Every framework in the sampled agent population implements approve / reject / *edit* on a
paused tool call: deny throws the agent's work away and restarts the loop, while edit-first keeps it
and puts the human in the loop productively. It is the difference between a gate and a
collaboration — a test must pin that edit-first is not visually subordinate.

The prompt states **what and why**: the action in plain language, the full arguments, and the reason
the agent believes it is needed. Arguments truncate with an **explicit expand**, same rule as F7 —
approving what you cannot read is what this component prevents.

**"Always allow" does not create its grant UI here.** Choosing it writes a grant, but the grant's
review-and-revoke surface belongs to N9 `autonomy-selector`, which already ships. A component that
can create a permanent permission but cannot show you the ones you already granted is a one-way
door. Emit the choice; do not build the grant list.

Deny must be safe to press: the agent reports what it could not do rather than silently rerouting.

- [ ] **Step 1: Write the failing tests**

Replace the scaffold's `expect.fail` stubs with real behavioural tests, one per declared state, plus
one asserting the arguments truncate with an expand control, and one asserting all four verbs are
reachable with edit-first given weight equal to allow.

- [ ] **Step 2: Run them and confirm they fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/permission-prompt.test.tsx
```

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/permission-prompt.test.tsx
```

- [ ] **Step 5: Write the four stories, the demo, and the guidance module**

Story exports must be exactly `AllowOnce`, `AlwaysAllow`, `Deny`, `EditFirst`. The `.docs.tsx`
module is plain data read by a Server Component — **never** mark it `"use client"`.

- [ ] **Step 6: Self-check before reporting**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/permission-prompt.test.tsx
cd "$(git rev-parse --show-toplevel)" && pnpm typecheck && pnpm lint && pnpm check:tokens
```

Do **not** run `pnpm gen:wiring`, edit the manifest, or run any git write command.

---

## Task 15: Integrate the leaf batch

Central, controller-owned. Tasks 8–14 each wrote only their own files; this reconciles them against
the manifest and runs every gate.

**Files:**
- Modify: `apps/docs/lib/catalog.manifest.ts` — the seven rows

**Interfaces:**
- Consumes: seven implemented components from Tasks 8–14; O2 from Task 5.
- Produces: seven rows at `status: "shipped"` with `shadcn`/`consumes`/`npm` reconciled against real
  imports. Catalog reaches 102 of 114.

- [ ] **Step 1: Reconcile declared deps against real imports for all seven**

```bash
cd apps/docs
for n in suggestion-chips trust-dialog trace-timeline run-inspector usage-dashboard env-status permission-prompt; do
  printf "%-22s " "$n"
  grep -h 'from "' registry/super-ai/$n.tsx \
    | sed 's/.*from "//;s/".*//' \
    | grep -E '^@/components/ui/|^@/registry/super-ai/|lucide-react|^@base-ui|^@/components/ai-elements/' \
    | sort -u | tr '\n' ' '; echo
done
```

Set `shadcn` / `consumes` / `npm` from that output — never from the catalog's assumed bases, which
name primitives this repo does not vendor. On `@base-ui/react`: leave it out of `npm` unless the
component imports **no** vendored `ui/` primitive at all, since it normally arrives as a peer. Then
flip all seven to `status: "shipped"`.

- [ ] **Step 2: Run every gate**

```bash
cd apps/docs && pnpm gen:wiring && pnpm check:contract && cd ../..
pnpm typecheck && pnpm lint && pnpm check:tokens && pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

Run `test:stories` **twice** to rule out flake. Expected: all green, **102 shipped** (94 + O2 from
Task 5 + these 7), and `pnpm build` at **121 pages** (113 + 8 new component pages, one of which is
O2's from Task 5).

- [ ] **Step 3: Verify the cross-registry install actually works**

This path has never been exercised — C2 is the first item whose install pulls from another vendor's
registry.

```bash
cd apps/docs && ./scripts/consumer-test.sh
```

Expected: the fresh app installs every item including `suggestion-chips`, and
`components/ai-elements/suggestion.tsx` appears in the consumer app pulled from
`registry.ai-sdk.dev`. **If this fails, it is a real finding** — report it rather than falling back
to vendoring, because the vendoring fallback was considered and rejected in spec §1.3.

- [ ] **Step 4: Commit**

```bash
git add apps/docs apps/storybook
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "feat(wave-11): C2 + family N's six — 94 to 102"
```


## Task 16: Close out Phase 1

- [ ] **Step 1: Verify the counts**

```bash
cd "$(git rev-parse --show-toplevel)" && node -e '
const src=require("fs").readFileSync("apps/docs/lib/catalog.manifest.ts","utf8");
const c={};
for(const b of src.split(/\n\s*\{\s*\n/).slice(1)){
  const s=(b.match(/status:\s*"([^"]+)"/)||[])[1];
  if(s) c[s]=(c[s]||0)+1;
}
console.log(c, "shipped should be 102, planned 12, cut 11");
'
```

- [ ] **Step 2: Update the handoff**

In `docs/CONTINUE.md`, update §1's progress line to **102 of 114**, the remaining-by-family line to
**O 12**, and the gate baselines to the new numbers. Remove C2 from §5's open-decisions list — it is
resolved. Note that `block-build-brief.md` now exists and is the entry point for Phase 2.

- [ ] **Step 3: Commit and open the PR**

```bash
git add docs/CONTINUE.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" \
  commit -m "docs: handoff — Phase 1 complete, 102 of 114"
git push -u origin claude/repo-status-review-8bac54
gh pr create --title "Phase 1: the block contract + 8 components (94 → 102)" --body "$(cat <<'BODY'
Takes the catalog from 94 to 102 of 114 and establishes the block contract.

**O2 `chat-shell` — the first block.** Built sequentially as a pathfinder. The contract it proves,
now enforced by `check:contract`: blocks declare a non-empty `consumes` reconciled against real
imports, render every declared region as `data-region`, and ship mandatory `Empty` and `Responsive`
stories. Regions replace states, because a shell is a layout, not a state machine.
`block-build-brief.md` is written from what O2 actually hit and is the artifact each of the twelve
Phase 2 shells is handed.

**Seven leaf components:** C2 `suggestion-chips` and family N's six (N2, N4, N5, N6, N7, N8).

**C2 resolves the AI Elements block** via a cross-registry dependency on
`registry.ai-sdk.dev/suggestion.json` rather than vendoring or reimplementing — the first use of the
new `external` manifest field, and verified end to end by `consumer-test.sh`.

**Fixes:** fourteen block `specAnchor`s pointed at `component-specs.md`, which contains zero `## O`
headings, and a test asserted the broken pattern. Blocks now get their own sidebar group and a
full-bleed preview.

Spec: `docs/superpowers/specs/2026-08-07-catalog-completion-design.md`
Plan: `docs/superpowers/plans/2026-08-07-phase-1-pathfinder-and-leaf-batch.md`

**Follow-ups, not in this PR:** Phase 0's A-family retrofit must land before the twelve-shell
fan-out. E9 `tts-composer` and E10 `voice-clone-recorder` are shipped with no spec section — see
Task 2's note.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

**Do not deploy to production.** That is Phase 4 and needs an explicit go.

---

## Definition of done

- [ ] 102 of 114 shipped; `check:contract` green with the block branch live
- [ ] All 14 block spec anchors resolve to real headings in `block-specs.md`
- [ ] `block-build-brief.md` written from what O2 actually hit
- [ ] The cross-registry install verified by `consumer-test.sh`
- [ ] `pnpm test:stories` green twice in a row
- [ ] Phase 0's entry condition for Phase 2 recorded in the handoff: **the A-family retrofit must
      land before the twelve-shell fan-out**
