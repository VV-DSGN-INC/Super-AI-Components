# Family P — Data Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two-axis collection/record contract from DS-WebApp-Shells into this registry as family P — `data-views` (P1) and `detail-view-shell` (P2) plus a `use-view-mode` lib contract — behind a D1 evidence gate.

**Architecture:** Wave 1 collects D1 evidence and is a hard gate. Wave 2 extends `gen-registry.mts` to emit multi-file items (D3 forbids the six view files from being numbered siblings of their only importer), adds family P to the manifest and catalog, then ports two components and one lib contract with their full artifact sets. Everything ports from `/Users/nickv/ClaudeCode Projects/DS-WebApp-Shells/shells/shadcn-shell/src/` — this is a port of tested code, not a rewrite.

**Tech Stack:** React 19 · TypeScript · Tailwind v4 · shadcn/Radix · Vitest · Storybook · shadcn registry · pnpm + turbo

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-11-data-views-v2-design.md`. Every task's requirements implicitly include it.
- **Source repo (read-only this plan):** `/Users/nickv/ClaudeCode Projects/DS-WebApp-Shells/shells/shadcn-shell/`. Never edit it in this plan; §7's consumer flip is a separate PR.
- **Branch:** `claude/shells-card-kanban-views-95b147`. Never commit to `main`. Never deploy.
- **Working directory:** all `pnpm` commands run from `apps/docs/` unless stated. All paths in this plan are relative to `apps/docs/` unless they start with `docs/`.
- **Token contract:** no raw hex, no `oklch()`, no Tailwind palette classes (`bg-blue-500`, `text-amber-700`, …) in `registry/**`. Never pair a bare `text-muted-foreground` with a bare `bg-muted`/`bg-accent`/`bg-secondary` in one class string.
- **Chromatic tokens available:** `--destructive` and `--warning` only. There is no `--success`, no `--info`. Colour goes on graphics, never on label text.
- **`contractExempt` is forbidden.** The catalog-completion spec drove that count to zero.
- **Every catalog component needs five artifacts:** `registry/super-ai/<name>.tsx`, `registry/super-ai/<name>.test.tsx`, `components/demos/<name>-demo.tsx`, `content/components/<name>.docs.tsx`, `../storybook/src/stories/super-ai/<Pascal>.stories.tsx`.
- **`.docs.tsx` must contain:** `whatItIs` (quoted string ≥10 chars), `whyItMatters` (≥10 chars), `dos: [{`, `donts: [{`, `pitfalls: ["`. The contract gate regexes these literally.
- **Story files must export one `export const <StatePascal>` per `states` entry** in the manifest row.
- **Commit style:** conventional commits, lowercase subject, body explains *why*. End every commit message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Structure

**Wave 1 (evidence only):**

| File | Responsibility |
|---|---|
| `docs/design-system/records-board-analysis.md` | Desk-research D1 evidence for the records pattern, every claim source-linked |
| `docs/design-system/decisions.md` | Gains D18 — provisional, following D16's form |

**Wave 2 infrastructure:**

| File | Responsibility |
|---|---|
| `apps/docs/lib/manifest-types.ts` | `FamilyId` gains `"P"`; `ManifestItem` gains optional `files` |
| `apps/docs/scripts/gen-registry.mts` | Emits `i.files` when present, else today's single-file path |
| `apps/docs/scripts/check-contract.mts` | Orphan check learns about declared extra files |
| `docs/design-system/catalog.md` | Family P section + Totals row |

**Wave 2 items:**

| Item | Source of truth to port from |
|---|---|
| `use-view-mode` (lib) | `src/lib/use-persisted-preference.ts`, `use-view-mode.ts`, `use-detail-mode.ts`, `view-mode-defaults.ts`, `detail-mode-defaults.ts` |
| `data-views` (P1) | `src/components/ui/{data-views,kanban-view,kanban-column,table-view,feed-view,calendar-view,timeline-view,view-switcher}.tsx`, `src/lib/{data-views,group-tone,date-range,pack-rows}.ts` |
| `detail-view-shell` (P2) | `src/components/ui/{detail-view-shell,detail-tabs,detail-fields}.tsx`, `src/lib/use-container-width.ts` |

---

## Task 1: Wave 1 — records board slice and D18

This is a **gate**. If Step 4's finding is that fewer than three unrelated products offer a user-selectable multi-view switch, stop the plan, report the finding, and do not start Task 2.

**Files:**
- Create: `docs/design-system/records-board-analysis.md`
- Modify: `docs/design-system/decisions.md` (append D18)

**Interfaces:**
- Consumes: nothing.
- Produces: the D1 justification every later task depends on. D18's ID is referenced by the manifest rows in Tasks 4 and 5 via `specAnchor`-adjacent prose, and by `catalog.md`'s family P section.

- [ ] **Step 1: Read the shape to match**

Read `docs/design-system/agent-board-analysis.md` in full. Wave 1's document mirrors its structure — products observed, patterns, what clears the 3+ bar, what is held. Do not invent a new format.

- [ ] **Step 2: Research the seven products**

For each of Linear, Notion, Asana, Height, Airtable, Monday, ClickUp, find public documentation (help centre, docs site, feature page) answering:

1. Does a user-selectable multi-view switch over one collection exist? Which views?
2. Is the view preference persisted, and at what scope — per section/view, per user, per workspace?
3. Does the record-open mode (modal / side peek / full page) vary independently of the collection view?
4. Are calendar and timeline peers of list/board in the same switcher, or separate destinations?

Record a source URL for every claim. Use WebSearch and WebFetch. Do not assert anything you did not read.

- [ ] **Step 3: Write the analysis**

Create `docs/design-system/records-board-analysis.md`. It **must** open with this caveat verbatim — the honesty of D18 depends on it:

```markdown
> **Method — read this before citing anything below.** Unlike
> [`reference-board-analysis.md`](reference-board-analysis.md) and
> [`agent-board-analysis.md`](agent-board-analysis.md), this slice is **not**
> derived from a collected board of real product screens. It is desk research
> from public product documentation, and every claim carries a source URL.
> D18 is therefore **provisional**: it justifies building family P on a
> branch, and it does not put family P on the same evidentiary footing as
> families A–O until the screens are verified.
```

Then: a products-observed table, a per-question findings table with source URLs, and a "what clears D1" section naming the specific products for each proposed item.

- [ ] **Step 4: Evaluate the gate**

Count the unrelated products in which a user-selectable multi-view switch appears.

- **3 or more** → the gate passes. Continue.
- **Fewer than 3** → **stop the plan.** Write the finding into the document, append D18 recording the failure, commit, and report that family P is not justified and the work folds into O10's internals.

Also evaluate question 3 separately. If products overwhelmingly *couple* the two axes, note it in D18 as a threat to the spec's central claim; it does not stop the plan, but it must be recorded.

- [ ] **Step 5: Append D18**

Append to `docs/design-system/decisions.md`, following D16's heading format exactly (`### D18 · <title> — 2026-08-11`). It must state: what the slice found, which products clear D1 for which item, what is explicitly held, and that its evidence is desk research and therefore provisional.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system/records-board-analysis.md docs/design-system/decisions.md
git commit -F - <<'MSG'
docs(design-system): records board slice and D18, provisional

Neither existing board contains kanban, calendar, timeline or view
switching — they sample AI tools, and multi-view browsing is a
project-management pattern. D1 therefore had nothing to say about the
family P candidates, which is why this slice exists before any code.

Desk research from public product documentation, not a collected board of
real screens. D18 ships provisional and says so in its own first
paragraph; family P does not reach A–O's evidentiary footing until the
screens are verified.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 2: Family P and multi-file registry items

Infrastructure only — no components. Ends green with family P declared and empty.

**Files:**
- Modify: `apps/docs/lib/manifest-types.ts`
- Modify: `apps/docs/scripts/gen-registry.mts:242-251`
- Modify: `apps/docs/scripts/check-contract.mts:210-216`
- Modify: `docs/design-system/catalog.md` (family P section + Totals row)

**Interfaces:**
- Consumes: D18 from Task 1.
- Produces: `FamilyId` accepting `"P"`; `ManifestItem.files?: RegistryFile[]` where `RegistryFile = { path: string; type: string; target: string }`; a `declaredFiles` set in the contract gate. Tasks 4 and 5 rely on all three.

- [ ] **Step 1: Capture the before-state of every emitted item**

This is the safety net for a shared-infrastructure change. Run:

```bash
cd apps/docs && pnpm build:registry && cp -R public/r /tmp/r-before
```

Expected: succeeds, `/tmp/r-before` contains one JSON per registry item.

- [ ] **Step 2: Widen the types**

In `apps/docs/lib/manifest-types.ts`, add `"P"` to the `FamilyId` union (after `"O"`), and add to `ManifestItem`:

```ts
  /**
   * Extra files this item ships beyond `registry/super-ai/<name>.tsx`.
   *
   * Present only when a component's internals are genuinely its own — D3
   * forbids an L3 importing another L3, so a component whose parts have
   * exactly one importer cannot split them into sibling registry items. P1
   * `data-views` is the first: its six view shells are imported by
   * `data-views.tsx` and by nothing else.
   *
   * Omit it and the item emits its single name-derived file, unchanged.
   * Every file listed here is exempt from orphan detection, because it is
   * accounted for by this row.
   */
  files?: { path: string; type: string; target: string }[];
```

- [ ] **Step 3: Teach the generator to emit them**

In `apps/docs/scripts/gen-registry.mts`, the `superAiItems` map currently ends `files: [file(i.name)],`. Replace that one line with:

```ts
  files: i.files?.length ? [file(i.name), ...i.files] : [file(i.name)],
```

The item's own file always comes first, so `npx shadcn add` writes the entry point before its parts.

The local `Item` type in that file (line 26) needs the field too:

```ts
  files?: { path: string; type: string; target: string }[];
```

and `gen-wiring.mts`/`deriveExtras` need no change — they key off names, not files.

- [ ] **Step 4: Teach the contract gate about declared files**

In `apps/docs/scripts/check-contract.mts`, the orphan loop at line 210 flags any `.tsx` in `registry/super-ai/` without a manifest entry. Multi-file items would trip it for every part. Before that loop, add:

```ts
// Files declared by a multi-file item are accounted for by that item's row,
// so they are not orphans. Without this, every part of a multi-file item
// (P1 `data-views` ships six view shells) reads as a stray file.
const declaredFiles = new Set(
  manifest.flatMap((i) => i.files ?? []).map((f) => f.path.split("/").pop()!.replace(/\.tsx$/, "")),
);
```

then change the orphan condition from `if (!names.has(name))` to:

```ts
  if (!names.has(name) && !declaredFiles.has(name)) errors.push(`orphan: ${file} has no manifest entry`);
```

- [ ] **Step 5: Add family P to catalog.md**

Append after the family O section and before `## Totals`:

```markdown
---

## P · Records & views (v2) — 0

Family P is the first product of the **second reference board**, which
[`2026-08-07-catalog-completion-design.md`](../superpowers/specs/2026-08-07-catalog-completion-design.md)
§1.1 ruled would become its own v2 project rather than reopen the frozen 114.
It is counted separately for exactly that reason: nothing in the B–N subtotal
or the O block count changes because family P exists.

Its evidence is [`records-board-analysis.md`](records-board-analysis.md) and
D18, both **provisional** — desk research, not a collected board.

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
```

Then add a row to the `## Totals` table immediately after the `O — Blocks (L4)` row:

```markdown
| P — Records & views (v2) | 0 |
```

Leave the `B–N subtotal` and `Total registry items` rows untouched at this step — the manifest has no P items yet, so the totals still reconcile.

- [ ] **Step 6: Verify nothing existing changed**

```bash
cd apps/docs && pnpm build:registry && diff -r /tmp/r-before public/r
```

Expected: **no output.** Every one of the existing emitted items must be byte-identical. Any diff here means the generator change was not additive — fix it before continuing.

Then:

```bash
cd apps/docs && pnpm check:contract && pnpm check:tokens && pnpm typecheck
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/lib/manifest-types.ts apps/docs/scripts/gen-registry.mts apps/docs/scripts/check-contract.mts docs/design-system/catalog.md
git commit -F - <<'MSG'
feat(registry): family P and multi-file registry items

gen-registry.mts hardcoded `files: [file(i.name)]`, so every one of the 98
items shipped exactly one file — not by policy but because the generator
could not emit anything else. D3 forbids an L3 depending on an L3, and
data-views' six view shells have exactly one importer, so they can be
neither sibling items nor a sideways import. They have to be its own files.

The override is additive: an item without `files` takes the identical
path it took before, verified by diffing every emitted JSON before and
after. The contract gate learns the same field, so a declared part is not
mistaken for an orphan.

Family P is declared empty here and counted separately from the frozen
114, per the catalog-completion spec's v2 ruling.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 3: `use-view-mode` lib contract

Smallest item, no dependencies, proves the `registry:lib` path before the components need it.

**Files:**
- Create: `apps/docs/registry/super-ai/use-view-mode.tsx`
- Create: `apps/docs/registry/super-ai/use-view-mode.test.tsx`
- Modify: `apps/docs/lib/lib.manifest.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `usePersistedPreference<T extends string>(key: string, fallback: T, isValid: (v: unknown) => v is T): [T, (v: T) => void]`; `useViewMode(section: ViewSection, options?: { timeCapable?: boolean }): [ViewMode, (m: ViewMode) => void, readonly ViewMode[]]`; `useDetailMode(entity: string): [DetailMode, (m: DetailMode) => void]`; types `ViewMode`, `ViewSection`, `DetailMode`. Tasks 4 and 5 import `ViewMode` and `DetailMode` from here.

- [ ] **Step 1: Port the sources into one file**

`registry:lib` items are one `.tsx` file (`gen-registry.mts:263-269` hardcodes `registry/super-ai/${i.name}.tsx`), so concatenate these five source files into `apps/docs/registry/super-ai/use-view-mode.tsx`, in this order, dropping their `@/lib/...` imports in favour of local references:

1. `src/lib/view-mode-defaults.ts` — `ViewMode`, `ViewSection`, `VIEW_MODE_DEFAULT`, `VIEW_MODE_STORAGE_KEY`, `availableViewModes`, `isViewMode`
2. `src/lib/detail-mode-defaults.ts` — `DetailMode` and its equivalents
3. `src/lib/use-persisted-preference.ts` — the hook
4. `src/lib/use-view-mode.ts` — the collection axis
5. `src/lib/use-detail-mode.ts` — the record axis

Keep every explanatory comment. The single-owner rule comment in `use-persisted-preference.ts` is load-bearing documentation — a consumer who ignores it gets two hooks drifting on one key.

Add `"use client";` as the first line: the hooks use `useState`/`useEffect`.

- [ ] **Step 2: Port the tests into one file**

Concatenate `src/lib/use-persisted-preference.test.ts`, `use-persisted-preference.ssr.test.tsx`, `use-view-mode.test.tsx` and `view-mode-defaults.test.ts` into `apps/docs/registry/super-ai/use-view-mode.test.tsx`, repointing every import to `./use-view-mode`.

The SSR test is the one that matters most — it is the reason this contract is safe in a Next app.

- [ ] **Step 3: Run the tests to verify they pass**

```bash
cd apps/docs && pnpm test use-view-mode
```

Expected: PASS. These are ported tests of ported code; a failure means the concatenation dropped something, not that the design is wrong.

If `localStorage` is undefined in the test environment, check `vitest.setup.ts` — the repo already carries a localStorage polyfill for `feature-announcement`.

- [ ] **Step 4: Add the manifest row**

In `apps/docs/lib/lib.manifest.ts`, append to `LIB_MANIFEST` after `cost`:

```ts
  {
    name: "use-view-mode",
    title: "View & detail mode contracts",
    description:
      "The collection-axis and record-axis preference hooks, each validated against what a section actually offers and persisted independently.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/use-view-mode.tsx",
  },
```

- [ ] **Step 5: Verify the gates**

```bash
cd apps/docs && pnpm check:contract && pnpm check:tokens && pnpm build:registry
```

Expected: all pass, and `public/r/use-view-mode.json` exists with `"type": "registry:lib"`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/use-view-mode.tsx apps/docs/registry/super-ai/use-view-mode.test.tsx apps/docs/lib/lib.manifest.ts
git commit -F - <<'MSG'
feat(registry): use-view-mode, the second lib contract

The registry's rule is that a component never persists — "it emits, the
host stores" — and only 2 of 102 shipped components touch storage. But
the per-section and per-entity keying, and the validator that reconciles a
stored value against what a section actually offers, are the non-obvious
part of the two-axis design. Dropping them would ship the shape without
the idea.

So they ship beside the components rather than inside them, joining cost
as a registry:lib contract: a host with server-side preferences installs
data-views and detail-view-shell and never sees localStorage.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 4: P1 `data-views`

The first multi-file item. Seven files, one manifest row.

**Files:**
- Create: `apps/docs/registry/super-ai/data-views.tsx` (entry point)
- Create: `apps/docs/registry/super-ai/{kanban-view,kanban-column,table-view,feed-view,calendar-view,timeline-view}.tsx`
- Create: `apps/docs/registry/super-ai/data-views.test.tsx`
- Create: `apps/docs/components/demos/data-views-demo.tsx`
- Create: `apps/docs/content/components/data-views.docs.tsx`
- Create: `apps/storybook/src/stories/super-ai/DataViews.stories.tsx`
- Modify: `apps/docs/lib/catalog.manifest.ts`, `docs/design-system/catalog.md`

**Interfaces:**
- Consumes: `ViewMode` from Task 3's `use-view-mode`; `files` support from Task 2.
- Produces: `DataViews<T extends ViewItem>(props: DataViewsProps<T>)`; types `ViewItem` (`{ id: string }`), `ViewGroup<T>` (`{ id, label, tone?, match }`), `ColumnDef<T>` (`{ id, header, cell, width?, align? }`), `GroupTone` (`"neutral" | "info" | "warning" | "success"`), `TimeCapability<T>` (`{ getDateRange, renderChip }`). Task 5 does not depend on these.

- [ ] **Step 1: Port the eight sources**

Copy from `src/components/ui/`: `data-views.tsx`, `kanban-view.tsx`, `kanban-column.tsx`, `table-view.tsx`, `feed-view.tsx`, `calendar-view.tsx`, `timeline-view.tsx`. Inline `view-switcher.tsx` into `data-views.tsx` as an exported `DataViewsSwitcher`.

Fold `src/lib/data-views.ts` (the config types), `date-range.ts`, `pack-rows.ts` and `group-tone.ts` into the files that use them — `data-views.tsx` for the shared types, `timeline-view.tsx` for `pack-rows`, `calendar-view.tsx` for `date-range`.

Rewrite every import as `@/registry/super-ai/<name>` (the house convention — see `chat-shell.tsx`), and `@/components/ui/<name>` for shadcn primitives.

Add `"use client";` to `data-views.tsx`, `calendar-view.tsx` and `timeline-view.tsx` (they hold state or measure).

Preserve the both-or-neither `TimeCapability` union exactly. It is a compile-time guarantee that a calendar never falls back to `renderCard` and overflows a day cell.

- [ ] **Step 2: Apply the token contract to group tones**

`GROUP_TONE_CLASS` currently fails all four tones. Replace it with the mark-based form, adopting J5 `record-list`'s idiom (colour on the graphic, never the label):

```tsx
import { AlertTriangle, CheckCircle2, Circle, CircleDashed } from "lucide-react";

/**
 * Tone is carried by mark shape first and colour second — the idiom J5
 * `record-list` states outright: "the colour is on the icon only:
 * `text-destructive` measures 4.0:1, which is fine for a graphic and not fine
 * for a label."
 *
 * The system has two chromatic tokens, `--destructive` and `--warning`. There
 * is no `--success` and no `--info`, so `info` and `success` are separated by
 * shape, not by hue. That is a deliberate loss of a colour channel, taken in
 * preference to expanding a monochrome palette for a presentational gain.
 *
 * Shared across four call sites — kanban column headers, feed section
 * headers, timeline lanes and calendar bars — so they cannot drift.
 */
export const GROUP_TONE_MARK: Record<GroupTone, React.ReactNode> = {
  neutral: <CircleDashed aria-hidden className="size-3.5" />,
  info: <Circle aria-hidden className="text-primary size-3.5" />,
  warning: <AlertTriangle aria-hidden className="text-warning size-3.5" />,
  success: <CheckCircle2 aria-hidden className="text-primary size-3.5" />,
};

/** Header surface. Never tinted — see GROUP_TONE_MARK. */
export const GROUP_HEADER_CLASS = "flex items-center gap-2 rounded-t-lg px-3 py-2";
```

Update all four call sites (`kanban-column.tsx:29`, `timeline-view.tsx:246,270`, `calendar-view.tsx:52`) to render the mark beside the label instead of applying a tinted class.

Because tone no longer reaches the eye through colour alone, each group's accessible name must still carry it: render the tone word in an `sr-only` span beside the mark when tone is not `neutral`.

- [ ] **Step 3: Verify the token gate catches nothing**

```bash
cd apps/docs && pnpm check:tokens
```

Expected: PASS with no new exemption. If it reports a palette class or a muted-on-muted pairing, Step 2 is incomplete — fix it rather than adding the file to `CONTRAST_EXEMPT_FILES`.

- [ ] **Step 4: Port the tests**

Concatenate `src/components/ui/data-views.test.tsx`, `calendar-view.test.tsx` and `timeline-view.test.tsx` into `apps/docs/registry/super-ai/data-views.test.tsx`, repointing imports.

Add one test for the tone change, because it is new behaviour rather than ported behaviour:

```tsx
it("carries group tone in the accessible name, not only in colour", () => {
  render(
    <DataViews
      items={[{ id: "1" }]}
      viewMode="kanban"
      groups={[{ id: "g", label: "Review", tone: "warning", match: () => true }]}
      renderCard={(i) => <div>{i.id}</div>}
      columns={[]}
      renderRow={(i) => <div>{i.id}</div>}
    />,
  );
  expect(screen.getByText("Review").closest("[data-slot]")).toHaveTextContent(/warning/i);
});
```

- [ ] **Step 5: Run the tests**

```bash
cd apps/docs && pnpm test data-views
```

Expected: PASS, including the new tone test.

- [ ] **Step 6: Write the demo, docs and stories**

Read `components/demos/record-list-demo.tsx` and `content/components/record-list.docs.tsx` first and match their shape.

`content/components/data-views.docs.tsx` must contain `whatItIs`, `whyItMatters`, at least one `dos` entry, one `donts` entry and one `pitfalls` string — the contract gate regexes each. The pitfall to document is the real one: a group set that does not cover the full domain silently drops items from grouped views.

`apps/storybook/src/stories/super-ai/DataViews.stories.tsx` needs one `export const` per manifest `states` entry from Step 7, named in PascalCase.

- [ ] **Step 7: Add the manifest row and catalog entry**

In `apps/docs/lib/catalog.manifest.ts`:

```ts
  {
    id: "P1",
    name: "data-views",
    title: "Data Views",
    description: "One config, five interchangeable collection views",
    family: "P",
    layer: "component",
    status: "shipped",
    wave: 8,
    base: ["table", "toggle-group"],
    shadcn: ["table", "toggle-group", "tooltip"],
    consumes: [],
    npm: ["lucide-react"],
    states: ["kanban", "table", "feed", "calendar", "timeline", "group-tone"],
    specAnchor: "component-specs.md#p1-data-views",
    files: [
      "kanban-view",
      "kanban-column",
      "table-view",
      "feed-view",
      "calendar-view",
      "timeline-view",
    ].map((n) => ({
      path: `registry/super-ai/${n}.tsx`,
      type: "registry:component",
      target: `components/super-ai/${n}.tsx`,
    })),
  },
```

Add the matching row to `catalog.md`'s family P table, bump its heading count to 1, set the Totals `P` row to 1, and bump `Total registry items` by 1.

Add a `## P1 data-views` section to `docs/design-system/component-specs.md` so `specAnchor` resolves.

- [ ] **Step 8: Run every gate**

```bash
cd apps/docs && pnpm check:contract && pnpm check:tokens && pnpm test && pnpm build:registry
```

Expected: all pass. `public/r/data-views.json` must list **seven** files, `data-views.tsx` first.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/registry/super-ai/ apps/docs/components/demos/data-views-demo.tsx apps/docs/content/components/data-views.docs.tsx apps/storybook/src/stories/super-ai/DataViews.stories.tsx apps/docs/lib/catalog.manifest.ts docs/design-system/
git commit -F - <<'MSG'
feat(registry): P1 data-views — one config, five collection views

A section declares its groups, its card, its columns and its row once; the
switcher picks a shell by viewMode. Adding a sixth view means adding one
shell and one contract, not touching any section.

The six view shells ship as this item's own files rather than as sibling
items: they have exactly one importer, and D3 forbids an L3 depending on
an L3. Promoting them to family A was rejected — A1-A12 are atoms like kbd
and entity-row, and a calendar grid is not one.

Group tone changes shape here. The shell tinted backgrounds and label text
in blue, amber and emerald; this system has two chromatic tokens and
neither may be a label colour. Tone is now carried by mark shape, colour
where a token exists, and an sr-only word — J5 record-list's idiom. info
and success both resolve to text-primary and are told apart by shape. That
is a real loss of a colour channel and it is deliberate.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 5: P2 `detail-view-shell`

**Files:**
- Create: `apps/docs/registry/super-ai/detail-view-shell.tsx`
- Create: `apps/docs/registry/super-ai/{detail-tabs,detail-fields,use-container-width}.tsx`
- Create: `apps/docs/registry/super-ai/detail-view-shell.test.tsx`
- Create: `apps/docs/components/demos/detail-view-shell-demo.tsx`
- Create: `apps/docs/content/components/detail-view-shell.docs.tsx`
- Create: `apps/storybook/src/stories/super-ai/DetailViewShell.stories.tsx`
- Modify: `apps/docs/lib/catalog.manifest.ts`, `docs/design-system/catalog.md`, `docs/design-system/component-specs.md`

**Interfaces:**
- Consumes: `DetailMode` from Task 3's `use-view-mode`; `files` support from Task 2.
- Produces: `DetailViewShell(props: DetailViewShellProps)` where `DetailViewShellProps = { open: boolean; onOpenChange: (open: boolean) => void; mode: DetailMode; header: ReactNode; attributes: ReactNode; conversation?: DetailChannel[]; collapse?: "tabs" | "stack"; ariaLabel?: string; className?: string }`.

- [ ] **Step 1: Port the four sources**

Copy `src/components/ui/detail-view-shell.tsx`, `detail-tabs.tsx`, `detail-fields.tsx` and `src/lib/use-container-width.ts` (rename to `.tsx`). Repoint imports to `@/registry/super-ai/<name>` and `@/components/ui/<name>`.

Add `"use client";` to `detail-view-shell.tsx`, `detail-tabs.tsx` and `use-container-width.tsx`.

Do **not** port `use-detail-navigation.ts`. Fullscreen mode's URL is the host's concern, and the component already ignores `open` in that mode.

Preserve verbatim: the 720px threshold, the `contain: layout` reasoning if present, the pessimistic pre-measurement default, and the roving-tabindex idiom in `detail-tabs`.

- [ ] **Step 2: Check the token contract**

```bash
cd apps/docs && pnpm check:tokens
```

Expected: PASS. These files were clean in the source scan; if anything trips, fix at the source rather than exempting.

- [ ] **Step 3: Port the tests, and add the ResizeObserver stub**

Copy `src/components/ui/detail-view-shell.test.tsx`, `detail-tabs.test.tsx`, `detail-fields.test.tsx` and `src/lib/use-container-width.test.tsx` into `apps/docs/registry/super-ai/detail-view-shell.test.tsx`.

`use-container-width` needs a `ResizeObserver` stub. The source repo keeps one at `src/test/resize-observer.ts`; port it into `apps/docs/vitest.setup.ts` beside the existing localStorage polyfill, not into the test file, so any later component that measures gets it too.

- [ ] **Step 4: Run the tests**

```bash
cd apps/docs && pnpm test detail-view-shell
```

Expected: PASS, including the no-ResizeObserver case (the hook must stay narrow rather than throw).

- [ ] **Step 5: Write the demo, docs and stories**

Same shape as Task 4 Step 6. The pitfall worth documenting: collapse is driven by *measured container width*, not viewport — a consumer who tests only by resizing the browser will not see the two-column form inside a narrow sheet.

The stories file is where level-2 tabs actually get exercised: the running app has one channel, so the multi-channel case exists only here and in the tests. Say so in the story description rather than inventing product fixtures.

- [ ] **Step 6: Add the manifest row and catalog entry**

```ts
  {
    id: "P2",
    name: "detail-view-shell",
    title: "Detail View Shell",
    description: "One record, three opening modes",
    family: "P",
    layer: "component",
    status: "shipped",
    wave: 8,
    base: ["dialog", "sheet", "tabs"],
    shadcn: ["dialog", "sheet", "tabs"],
    consumes: [],
    npm: ["lucide-react"],
    states: ["popup", "overlay", "fullscreen", "two-column", "collapsed-tabs", "collapsed-stack"],
    specAnchor: "component-specs.md#p2-detail-view-shell",
    files: ["detail-tabs", "detail-fields", "use-container-width"].map((n) => ({
      path: `registry/super-ai/${n}.tsx`,
      type: "registry:component",
      target: `components/super-ai/${n}.tsx`,
    })),
  },
```

Bump `catalog.md`'s family P heading to 2, its Totals row to 2, and `Total registry items` by 1. Add `## P2 detail-view-shell` to `component-specs.md`.

- [ ] **Step 7: Run every gate**

```bash
cd apps/docs && pnpm check:contract && pnpm check:tokens && pnpm test && pnpm build:registry && pnpm typecheck
```

Expected: all pass. `public/r/detail-view-shell.json` lists four files.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/registry/super-ai/ apps/docs/components/demos/detail-view-shell-demo.tsx apps/docs/content/components/detail-view-shell.docs.tsx apps/storybook/src/stories/super-ai/DetailViewShell.stories.tsx apps/docs/lib/catalog.manifest.ts apps/docs/vitest.setup.ts docs/design-system/
git commit -F - <<'MSG'
feat(registry): P2 detail-view-shell — one record, three opening modes

Branches on mode into Dialog, Sheet or a plain container. Only fullscreen
owns a URL, and it owns it in the host: use-detail-navigation is
deliberately not ported, because a registry component that reaches for a
router is a component that only works in one framework.

Collapse is driven by measured container width at 720px, not by viewport
and not by mode — which is what lets the same body render inside a 480px
sheet and a full-width route without branching. The pessimistic default
before first measurement is kept; it is what prevents a flash of two
columns on first paint.

The ResizeObserver stub lands in vitest.setup.ts beside the localStorage
polyfill rather than in this test file, so the next component that
measures inherits it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 6: Full-gate run, CONTINUE.md pointer, and PR

**Files:**
- Modify: `docs/CONTINUE.md`

**Interfaces:**
- Consumes: everything.
- Produces: a PR.

- [ ] **Step 1: Run every gate from a clean state**

```bash
cd apps/docs && pnpm check:tokens && pnpm check:contract && pnpm typecheck && pnpm test && pnpm build:registry
```

Expected: all pass. Record the test count — it must exceed the pre-branch baseline, since ported tests were added.

- [ ] **Step 2: Run the browser a11y gate**

```bash
cd apps/docs && pnpm test:stories
```

Expected: PASS. This is the real backstop for the tone change — if a group header fails contrast here, Task 4 Step 2 is wrong and needs fixing, not exempting.

- [ ] **Step 3: Run the consumer test**

```bash
cd apps/docs && ./scripts/consumer-test.sh
```

Expected: PASS. This is the one that proves multi-file items actually install — it is the first time a consumer receives an item with seven files.

- [ ] **Step 4: Point the next session at family P**

In `docs/CONTINUE.md` §3.1, after the paragraph ending "the second reference board became its own v2 project", add:

```markdown
**That v2 project now exists.** Family P (`data-views`, `detail-view-shell`,
plus the `use-view-mode` lib contract) shipped on 2026-08-11 under
[`2026-08-11-data-views-v2-design.md`](superpowers/specs/2026-08-11-data-views-v2-design.md).
Its evidence — [`records-board-analysis.md`](design-system/records-board-analysis.md)
and D18 — is **desk research, not a collected board**, so verifying it against
real product screens is open work. Family O's twelve remaining blocks are
still the main line; O10 `records-shell` now has its dependencies shipped.
```

- [ ] **Step 5: Commit and push**

```bash
git add docs/CONTINUE.md
git commit -F - <<'MSG'
docs: point the next session at family P

O10 records-shell's dependencies are now shipped, and the v2 project the
catalog freeze anticipated is no longer hypothetical. Records the one piece
of open work the shipped code cannot show on its own: D18's evidence is desk
research and still needs verifying against real screens.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git push -u origin claude/shells-card-kanban-views-95b147
```

- [ ] **Step 6: Open the PR**

The description must lead with the two things a reviewer cannot see in the diff: **the tone change is a visible behaviour change**, and **D18 is provisional desk research**. Then the generator change and its before/after verification. Do not bury either as a lint fix.

---

## Self-Review

**Spec coverage:** §1 → Task 2 Step 5. §2 → Tasks 4–5 port sources. §3.1 → Task 2 Steps 2, 5. §3.2 → Task 4 Step 7 `files`. §3.3 → Task 2 Steps 1–3, 6. §3.4 → Task 1. §3.5 → Task 3. §3.6/§6 → Task 4 Step 2. §5 → Tasks 3–5. §7 → deferred by the spec itself; Task 6 Step 4 records it. §8 → Task 6 Steps 1–3, plus per-task gates. §9 risks → the Task 1 gate, Task 2 Step 6 diff, Task 4 Step 3.

**Gap found and closed:** the spec did not anticipate orphan detection or the catalog Totals reconciliation. Both are now Task 2 Steps 4 and 5.

**Type consistency:** `ViewMode` and `DetailMode` are produced by Task 3 and consumed by Tasks 4 and 5 under those exact names. `GroupTone` is defined in Task 4 Step 1 and used in Step 2. `files` has the same `{ path, type, target }` shape in Task 2 Step 2, Task 4 Step 7 and Task 5 Step 6.

**Known open item:** Task 4 Step 7 and Task 5 Step 6 both require `component-specs.md` sections for `specAnchor` to resolve; the contract gate does not currently verify anchors resolve, but `catalog.md`'s totals reconciliation does run and is covered.
