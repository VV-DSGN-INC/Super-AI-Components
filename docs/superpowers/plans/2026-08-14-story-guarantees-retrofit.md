# Story Guarantees Retrofit — Implementation Plan (steps 1–2: convention PR + wave 0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the case-story convention from seven names to eight plus two manifest-shape rules, then fold in all 25 `contractExempt` items (stories, docs modules, normalized states, flag dropped) so every shipped registry item meets the full contract and renders under axe.

**Architecture:** One docs-only convention commit first, then two parallel-agent batches (the 11 story-less items, then the 14 `Default`-export legacy stories), each integrated centrally: agents write only their own story + docs files in isolated worktrees and *report* proposed manifest states; the integrator applies every `catalog.manifest.ts` edit, runs the full gate list, and commits.

**Tech Stack:** Storybook 9 CSF3 (`@storybook/react-vite`, `storybook/test`), Next.js docs app, tsx scripts, pnpm + turbo.

**Spec:** `docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md` — read it first; this plan implements its §2 (convention) and §3.1 (wave 0). Family waves (§3.2) and the gate (§4) are later plans.

## Global Constraints

- Work on branch `claude/design-systems-tests-rules-870a35`; never commit to `main`.
- Commit author, every commit: `git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit` (GitHub rejects the default email — CONTINUE.md §3.6).
- `pnpm`, never npm. Gates run from the **repo root** in `ci.yml` order: `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke (`cd apps/docs && pnpm exec playwright test`, after the build) → Storybook a11y (`cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories`) → consumer install test (`apps/docs/scripts/consumer-test.sh`).
- **No agent ever writes `apps/docs/lib/catalog.manifest.ts`** (CONTINUE.md §3.2). Agents write only their own component's story file, docs module, optional `.examples.tsx` sidecar, and — for sanctioned mechanical fixes only — their own `registry/super-ai/<name>.tsx`.
- Agent prompts point at the contract docs; they never paste contract text (CONTINUE.md §3.4).
- The a11y exclusion list and `CONTRAST_EXEMPT_FILES` may only shrink, never grow.
- Registry sources write issue refs as `GH-1234`, never `#1234` (token-gate false positive).
- Never pair `text-muted-foreground` with `bg-muted`/`bg-accent`/`bg-secondary`; on painted surfaces rebind `[--muted-foreground:var(--accent-foreground)]` (a11y-baseline.md).
- Spec §3.4 fix policy: mechanical one-class fixes land in-wave; behavioral defects are recorded (story description + CONTINUE.md §8), **never pinned green**.

---

### Task 1: Convention expansion — the seven become eight

**Files:**
- Modify: `docs/design-system/story-conventions.md`
- Modify: `docs/design-system/component-build-brief.md` (§Story, one phrase)
- Modify: `docs/CONTINUE.md` (§3.2 addition, §9 tail note)
- Modify: `apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx`, `GenerationQueue.stories.tsx`, `EmptyState.stories.tsx` (comment blocks + one play function)

**Interfaces:**
- Consumes: nothing — first task.
- Produces: the eight-name convention and the `case-skip` grammar that every wave-0 agent prompt references; the extended `KeyboardOrder` play in `SuggestionChips.stories.tsx` as the ring-assertion exemplar.

- [ ] **Step 1: story-conventions.md — retitle and extend the table.** Change heading `## The seven` to `## The eight` and fix the intro's "the seven" references. Add this row to the table after `KeyboardOrder`:

```markdown
| `Controlled` | it exposes a value/selection API (`value`/`onChange` or an equivalent controlled pair) | the component driven by external state, play-asserted: interaction alone does not move the rendered value, the change callback fires with the payload a consumer needs to apply it, and re-rendering with an unchanged `value` holds the component fixed. Without a play function this story is a screenshot of a prop and does not count |
```

Replace `KeyboardOrder`'s "What it must show" cell with:

```markdown
the tab sequence, where focus returns on close or dismiss, and a visible focus treatment at every stop — play-asserted: the focused element matches `:focus-visible` and its computed style shows a ring or outline
```

- [ ] **Step 2: story-conventions.md — the skip grammar.** In the "Record the ones you skipped" paragraph, add the machine-readable form (prose stays welcome around it):

```markdown
Write each skip as its own line in that comment, in exactly this grammar, so
the eventual gate (spec §4) can parse presence-or-annotated-absence:

    // case-skip: RTL — no directional layout, icons or motion

One line per skipped name: `case-skip: <StoryName> — <reason>`. The pilot
files carry the pattern.
```

- [ ] **Step 3: story-conventions.md — manifest-shape rules and non-goals.** Add two sections before `## Scope today`:

```markdown
## Manifest-shape rules

Two rules about `states`, enforced during manifest prep (`CONTINUE.md` §3.2)
and in review — deliberately not by `check:contract`, which cannot know
"async" or "disabled-capable" mechanically:

- A component that exposes `disabled` (its own prop, or passed through to an
  interactive primitive) declares a disabled-shaped state.
- A component with an async lifecycle declares its loading-shaped and
  failure-shaped states.

Both are about **shape, not name**: `running`, `generating`, `streaming`,
`failed` and `locked` all conform. The rule is that the shape exists in the
manifest, because a declared state is what forces a story through the gate.

## Non-goals

Two guarantee categories from the 2026-08 benchmark are declined, not
missing. Sizes catalogues (the comparison system's largest category) and
variant × intent grids market the optionality this system exists to remove —
the "no every-variant-at-once story" rule above is that posture, stated. A
future benchmark reader should find this paragraph and know the gap is
chosen.
```

- [ ] **Step 4: story-conventions.md — scope clause.** Replace the `## Scope today` bullets ("Required … from now on", "Not retrofitted …", "Not gated …") with:

```markdown
- **Required for every component in the registry.** The retrofit that makes
  that true is the story-guarantees program
  (`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md`);
  wave status lives in `CONTINUE.md`.
- **Not yet gated.** The gate (presence or `case-skip` annotation for each of
  the eight names) is the program's final step, landing only after every
  family wave — a red gate can never sit on `main`.
```

- [ ] **Step 5: component-build-brief.md §Story.** Change the phrase "it carries the seven names" to "it carries the eight names".

- [ ] **Step 6: CONTINUE.md.** In §3.2, after the two naming traps, add:

```markdown
**Two shape rules (2026-08-14, story-guarantees program):** a component
exposing `disabled` declares a disabled-shaped state; an async component
declares loading-shaped and failure-shaped states — the component's own
vocabulary, shape not name (`story-conventions.md` §Manifest-shape rules).
```

At the end of §9, add:

```markdown
The convention became a program on 2026-08-14: eight names (`Controlled`
joined), manifest-shape rules, and a retrofit —
`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md`.
Wave 0 (the 25 `contractExempt` items) status is recorded here when it lands.
```

- [ ] **Step 7: pilot files.** In each of the three pilot story files' case-story banner comments: update "the seven" wording to "the eight", and rewrite each skipped-story bullet as a `// case-skip:` grammar line followed by its existing prose. Then check each pilot component for a controlled pair (`grep -n "value\|onChange\|onSelect" apps/docs/registry/super-ai/{suggestion-chips,generation-queue,empty-state}.tsx`): none of the three has a `value`/`onChange` controlled pair (suggestion-chips fires `onSelect` with no selection state; verify the other two the same way), so each gains a `// case-skip: Controlled — <verified reason>` line.

- [ ] **Step 8: the ring-assertion exemplar.** Extend the existing `KeyboardOrder` play in `SuggestionChips.stories.tsx` (and in the other two pilots if they have `KeyboardOrder` plays) with the focus-ring assertion. Import `userEvent` from `storybook/test` alongside `expect`/`within`, and append:

```tsx
// The new KeyboardOrder must-show: every stop is visibly focused.
await userEvent.tab();
while (document.activeElement && canvasElement.contains(document.activeElement)) {
  const el = document.activeElement as HTMLElement;
  await expect(el.matches(":focus-visible")).toBe(true);
  const s = getComputedStyle(el);
  await expect(s.boxShadow !== "none" || s.outlineStyle !== "none").toBe(true);
  await userEvent.tab();
}
```

- [ ] **Step 9: verify.** From the repo root: `pnpm lint && pnpm typecheck`, then `cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories`. Expected: all pass (the ring assertion runs against real focus styles; if a pilot fails it, that is a finding — apply spec §3.4 policy, do not weaken the assertion).

- [ ] **Step 10: commit.**

```bash
git add docs/design-system/story-conventions.md docs/design-system/component-build-brief.md docs/CONTINUE.md apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx apps/storybook/src/stories/super-ai/GenerationQueue.stories.tsx apps/storybook/src/stories/super-ai/EmptyState.stories.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "docs(conventions): the seven become eight — Controlled, focus ring, manifest-shape rules, case-skip grammar"
```

---

### Task 2: Dispatch batch A — the 11 items with no story file

**Files:** none in this tree — 11 subagents, each in an isolated worktree (`Agent` tool, `isolation: "worktree"`, ≤12 concurrent), each writing only:
- Create: `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`
- Create: `apps/docs/content/components/<name>.docs.tsx` (+ optional `<name>.examples.tsx` sidecar)
- Modify (mechanical fixes only): `apps/docs/registry/super-ai/<name>.tsx`

**Interfaces:**
- Consumes: Task 1's committed convention (verify each worktree's base includes the Task 1 commit before dispatch).
- Produces: per-item report in the exact format below, consumed by Task 3.

The 11, with their raw manifest states (free text — each agent proposes the normalized replacement):

| id | name | raw states |
| --- | --- | --- |
| D7 | slot-summary | 8 raw states |
| K6 | citation-ref | 3 |
| K7 | answer-block | 4 |
| K8 | source-cards | 5 |
| M2 | credits-indicator | 5 |
| M3 | quota-meter | 4 |
| M4 | pricing-table | 3 |
| N9 | autonomy-selector | 3 |
| N10 | safety-block | 2 |
| N11 | escalation-handoff | 8 |
| N12 | task-tray | 4 |

- [ ] **Step 1: baseline.** From the repo root run the full gate list (Global Constraints order). Expected: all green. A red baseline stops the wave — fix or escalate first.

- [ ] **Step 2: dispatch all 11 in one message**, one Agent call per item, `isolation: "worktree"`, using this prompt template (fill `<…>` slots from the manifest; add at most 2–3 lines of component-specific steering — a known near-twin for `Boundary`, a known a11y trap — nothing more):

```text
You are retrofitting stories and docs for the shipped component `<name>` (<id>) in
apps/docs/registry/super-ai/<name>.tsx. Work only in your worktree. Read first, in
this order — they are the contract, follow them over any instinct:

1. docs/design-system/story-conventions.md (the eight case stories, skip grammar,
   manifest-shape rules, the three mechanical Storybook facts)
2. docs/design-system/component-build-brief.md §Story and §Guidance
3. docs/design-system/component-specs.md#<specAnchor> — your component's spec
4. apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx — the exemplar
   (meta shape, case-story banner, case-skip lines, KeyboardOrder ring assertion)
5. apps/docs/content/components/suggestion-chips.docs.tsx + apps/docs/lib/component-docs.ts
   — the docs-module shape (every ComponentDocs field is required; the .examples.tsx
   sidecar is optional)

Deliver exactly:
A. apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx — one export per
   normalized state (you propose the normalization, see C) with real args, plus the
   case stories among the eight that are TRUE for this component, each with a JSDoc
   description carrying the judgment, and a case-skip line for each one you skip.
   No export named Default. Fixture content must be something this system could
   really emit.
B. apps/docs/content/components/<name>.docs.tsx — full ComponentDocs, seeded from
   your spec anchor, translated to consumer-facing voice, never verbatim.
C. Proposed normalized states. The manifest's raw states are catalog free text
   (yours: <raw states verbatim>). Propose clean kebab-case single-situation names
   that match the component's REAL API (read the source), one story export each.
   You do NOT edit the manifest — apps/docs/lib/catalog.manifest.ts is off-limits.
D. Apply the shape rules: if the component exposes disabled, a disabled-shaped
   state; if async, loading-shaped and failure-shaped states.
E. Fix policy: mechanical one-class fixes (motion-reduce:animate-none beside
   animate-*; the muted-foreground rebind idiom on painted surfaces) go in your
   component file and your report. Anything behavioral: record it in the story
   description and your report — never assert wrong behaviour to get green.

Verify in your worktree: pnpm typecheck from the repo root, then
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories -- <Pascal>.stories.tsx
Commit your files (author: git -c user.name="weeeha"
-c user.email="1083934+weeeha@users.noreply.github.com").

Report tersely, exactly this shape:
## <id> <name>
states: <kebab-name> — <what it shows> (export <Pascal>)   [one line per state]
case stories: <names written> | skipped: <name — reason>   [skip lines verbatim]
defects: fixed-mechanical: <…> | recorded: <…> | none
files: <paths written>
verify: typecheck <pass|fail>; test:stories <n passed>
judgment calls: <flagged, or none>
```

- [ ] **Step 3: collect all 11 reports.** Do not start Task 3 until every agent has reported or been retried once.

---

### Task 3: Integrate batch A

**Files:**
- Modify: `apps/docs/lib/catalog.manifest.ts` (integrator only: normalized `states` + remove `contractExempt` for the 11)
- Land: each agent's committed files (verify worktree base carries Task 1's commit before landing)

**Interfaces:**
- Consumes: Task 2's reports (`states:` lines become manifest arrays; `defects: recorded:` lines go to CONTINUE.md §8 in Task 6).
- Produces: 11 items fully in contract; `check:contract` exempt count 25 → 14.

- [ ] **Step 1: land the files.** For each agent worktree: confirm its base commit contains Task 1's commit (`git merge-base --is-ancestor <task1-sha> <agent-head>`), review the diff touches only that component's allowed files, then cherry-pick or apply it onto the program branch.

- [ ] **Step 2: apply the manifest.** For each of the 11: replace `states` with the report's normalized list (sanity-check each against the shape rules and the two §3.2 naming traps: no `default`, no two states normalizing to one identifier) and delete the `contractExempt: true` line.

- [ ] **Step 3: regenerate and gate.** `cd apps/docs && pnpm gen:wiring`, then from the repo root the full gate list in Global Constraints order. Expected: `check:contract` prints `… 14 legacy item(s) exempt.`; every gate in the Global Constraints list green. Storybook run must follow the cache clear — skipping it produces fake `Failed to fetch dynamically imported module` failures (CONTINUE.md §3.5).

- [ ] **Step 4: fix fallout.** Integration-scale issues (manifest typos, wiring) you fix; component-scale failures go back to the owning agent as a bounded fix dispatch. Re-run the gate list until green.

- [ ] **Step 5: commit.**

```bash
git add -A
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(stories): wave 0 batch A — 11 never-rendered contractExempt items enter the full contract"
```

---

### Task 4: Dispatch batch B — the 14 legacy story files

Same mechanics as Task 2 (≤14 concurrent is within the §3.4 cap). The 14: A1 kbd, A2 cost-chip, A3 date-section, A4 choice-chips, A5 filter-bar, A6 field-row, A7 gen-settings-bar, A8 preview-tile, A9 entity-row, A10 stat-readout, A11 reset-affordance, A12 section-header, B6 thread-list, L5 shortcuts-sheet.

**Interfaces:** as Task 2, plus each report gains a `removed exports:` line.

- [ ] **Step 1: dispatch all 14** with the Task 2 template plus this delta paragraph:

```text
Your component already has a story file. Extend it, do not rewrite it: keep any
existing export that maps cleanly onto one of your proposed normalized states
(rename where needed), REPLACE the legacy `Default` export with a meaningful
state name (CONTINUE.md §3.2 records that all 14 of these files export Default —
yours is one), and delete only exports that restate a prop combination no
declared state needs. Report every removed or renamed export.
A4 choice-chips only: your component has the `value`/`onValueChange` controlled
pair — your `Controlled` story is the program's reference implementation; write
its play against the real API.
```

- [ ] **Step 2: collect all 14 reports.**

---

### Task 5: Integrate batch B — exempt count reaches zero

Same steps as Task 3, for the 14. Differences:

- [ ] **Step 1: land files** (same base-commit and diff-scope checks).
- [ ] **Step 2: manifest** — normalized states + delete the last 14 `contractExempt: true` lines. The flag now has zero members; the checker's exempt branches stay (their deletion is the gate PR's housekeeping, spec §4).
- [ ] **Step 3: shrink-check the exemption lists.** If any wave-0 fix corrected a component named in `CONTRAST_EXEMPT_FILES` / the Storybook exclusion (G3 pair), remove it from **both** lists — they must agree, and they may only shrink.
- [ ] **Step 4: full gate list.** Expected: `check:contract — 116 item(s) checked, 0 legacy item(s) exempt.` (91 + 25, the same total the 2026-08-14 baseline printed as 91/25), and every gate in the Global Constraints list green.
- [ ] **Step 5: commit** as Task 3, message: `feat(stories): wave 0 batch B — the 14 Default-export legacy stories enter the full contract; contractExempt is empty`.

---

### Task 6: Bookkeeping, PR, preview

**Files:**
- Modify: `docs/CONTINUE.md` (§1 status, §8 new recorded defects, §9 wave-0 outcome line)
- Modify: `docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md` (Status: steps 1–2 implemented)

- [ ] **Step 1: record.** §9 gains the wave-0 outcome (items, exempt 25→0, defects fixed vs recorded, with counts from the reports); every `defects: recorded:` line becomes a §8 entry; §1 status paragraph updated; spec Status line flipped.
- [ ] **Step 2: measure the after.** Re-run the coverage tally (`grep -c "export const <Name>"` per case-story name across `apps/storybook/src/stories/super-ai/`) and put the before → after numbers in the PR body — this is the benchmark answer.
- [ ] **Step 3: commit, push, PR.** Push the branch to the `VV-DSGN-INC/Super-AI-Components` remote (confirm remote + branch out loud first — house rule), open the PR to `main` with the coverage table, the wave-0 outcome, and the standard footer. PR title: `feat(stories): story guarantees — convention v2 + wave 0 (contractExempt fold-in)`.
- [ ] **Step 4: preview.** Storybook via `.claude/launch.json` (`storybook`, port 6007) — verify two retrofitted items render (one from each batch), then give Nick the PR link + the local Storybook URL.

---

## Self-review notes (already applied)

- Spec §2.3 said the manifest-shape rules go in "`component-build-brief.md` §Manifest"; no such section exists. They live in `story-conventions.md` (§Manifest-shape rules) with a §3.2 pointer in CONTINUE.md — recorded here as a deliberate deviation.
- Spec §3.1 said wave 0 "declares states"; the audit showed all 25 already declare *raw* states. The work is normalization (agents propose, integrator applies), which §3.2's prep rule already prescribes.
- The pilot files predate `Controlled` and the ring assertion, so Task 1 Step 7–8 brings them to the eight — otherwise the convention's own exemplars would violate it.
