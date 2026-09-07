# Case-story family waves — the wave brief

**Spec:** [`2026-08-14-story-guarantees-retrofit-design.md`](../specs/2026-08-14-story-guarantees-retrofit-design.md)
§3.2 (family waves) and §3.4 (fix policy). This plan is the brief a wave agent is
handed; the contracts it points at are the only copy of the rules
(`CONTINUE.md` §3.4 — never paste them into a prompt).

**What changed since the spec:** the gate landed first, as a shrink-only ratchet
(`story-conventions.md` "Scope today"). A wave therefore does not prepare the
tree for a gate — it shrinks `story-coverage.baseline.json`. Both kinds of debt
in that file are in scope for the same agent, in the same file-opening: the
eight case names, and a JSDoc description above every declared-state export.

**Waves** (one agent per item, in parallel, integrated centrally):

This table is **what happened**, corrected after each wave rather than
predicted once. The original plan split the families differently; the waves were
re-cut as they ran, so the families here are not the ones the first version of
this file listed.

| wave | families | items                 | landed     |
| ---- | -------- | --------------------- | ---------- |
| 1    | D, I     | 11 (+18 descriptions) | 2026-09-05 |
| 2    | E, P     | 11                    | 2026-09-05 |
| 3    | F        | 7                     | 2026-09-06 |
| 4    | H        | 7                     | 2026-09-06 |
| 5    | J        | 7                     | 2026-09-06 |
| 6    | K, L     | 9                     | 2026-09-06 |
| 7    | M, N     | 12                    | 2026-09-06 |
| 8    | O        | 13                    | —          |

Wave 1 also carried the 18 items whose only debt was descriptions (A 2 · B 7 ·
C 5 · E 1 · K 1 · M 1 · N 1); that debt is now zero registry-wide. Family O is
all that remains — 13 shells, 104 case obligations, no descriptions.
`pnpm story-coverage:report` from `apps/docs` is the live list; recount with it
rather than trusting the table.

## Agent procedure

You own exactly one item. Read this whole file before doing anything.

### 1. Make your worktree current

Agent worktrees are cut from `origin/main`, which lacks the ratchet, this
brief and the earlier waves. From your worktree root:

```bash
git merge --ff-only claude/component-stories-specs-b80050
pnpm install --offline --frozen-lockfile
```

Confirm `git log --oneline -1` shows a commit on or after `feat(stories):
story-coverage ratchet`. If the fast-forward refuses, stop and report.

**Integrator: commit the brief before you dispatch, not after.** An agent
fast-forwards at step 0, so it sees the branch as it was at dispatch time. Wave
8 dispatched its second batch while the updated §2b and a vendored fix were
still uncommitted in the integrator's working tree, and two agents duly reported
that guidance was missing and that a fixed file was still broken. Both were
right about what they had and wrong about the branch, which costs a round of
reconciliation every time.

### 2. Read, in this order

1. [`docs/design-system/story-conventions.md`](../../design-system/story-conventions.md) — whole file. The eight, the skip grammar, the five mechanical facts, the play-function rule.
2. [`docs/design-system/component-build-brief.md`](../../design-system/component-build-brief.md) §Story.
3. The spec's §3.4 fix policy (link above): mechanical fixes land in-wave, behavioural fixes are recorded and never pinned.
4. `CONTINUE.md` §8's "Added by the D/I case-story wave" and §9's "Wave 1" entry. Wave 1 found four traps that live in the primitives rather than in any one component — unnamed `PopoverContent`s, the missing `DirectionProvider`, the vendored `Button`'s press nudge, and `Tabs.Panel` as an unstyled extra stop. Read them before you conclude your component is the first to hit one.
5. Exemplars: `apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx` (pilot — the skip-comment block), `RunButton.stories.tsx` (wave 0), and from wave 1 `ContextToolbar.stories.tsx` (all eight, a real `role="toolbar"` walk) and `QuoteReply.stories.tsx` (three well-argued skips). If your component renders inside a Base UI portal (dialog, popover, sheet, menu, select, tooltip), also `AiToolsMenu.stories.tsx` — it carries the settle-on-departure form of the focus walk, which is the one to copy — and note that `TaskTray.stories.tsx` and `ShortcutsSheet.stories.tsx` still use the older arrival form.
6. Your own item: the component source `apps/docs/registry/super-ai/<name>.tsx`, its docs module `apps/docs/content/components/<name>.docs.tsx`, its spec anchor in `component-specs.md` or `block-specs.md`, and the existing story file `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`.
7. `cd apps/docs && pnpm story-coverage:report <name>` — your exact obligations.

### 2b. If your item is a family O shell — read this too

Family O is the last wave and the only one made of **blocks**, and four things
differ:

1. **Read [`docs/design-system/block-build-brief.md`](../../design-system/block-build-brief.md)
   in full**, before the exemplars. Its rule outranks convenience: _when a
   composed component does not fit, report it, do not fork it._ A reimplemented
   row passes every gate and is still wrong.
2. **There is no step 3b for you.** A shell declares `regions`, not `states`
   (`states: []` in the manifest), so it has no declared-state exports and no
   description obligations. Your report will say `0 described` because there
   were none, not because you skipped them. Your whole obligation is the eight
   case names — confirm with `pnpm story-coverage:report <name>`.
3. **`Empty` and `Responsive` are mandatory exports and `check:contract`
   enforces them.** Do not rename, merge or remove either while adding the
   eight. `Responsive` proves nothing mechanically — the viewport addon has no
   manager in the vitest runner — and it stays anyway; your `Mobile` is what
   makes the narrow claim real.
4. **Your `Mobile` must move the real breakpoint, not just the box.** The width
   wrapper the other twelve waves used is not enough here: B1 `app-sidebar`'s
   drawer swap keys on a viewport media query, so a 375px wrapper renders the
   desktop rail inside a narrow box and reports success. Call
   `page.viewport(375, 812)` from `vitest/browser` at the top of the
   play — probed 2026-09-06, it moves `window.innerWidth`, flips `matchMedia`,
   and does not leak into the next story. Import it **dynamically**:
   `const { page } = await import("vitest/browser")` — a top-level import
   breaks the file outside Browser Mode. See `story-conventions.md`,
   mechanical fact 2.

**What wave 8's first seven measured, so the last six need not repeat it:**

- **Two family O shells cannot share a document.** Each `SidebarInset` renders a
  `<main>`, so a `Boundary` rendering two shells fails
  `landmark-no-duplicate-main` outright; O6 also measured
  `landmark-no-duplicate-banner` plus `landmark-unique` twice. Put your shell
  beside a _component_ it gets confused with, or render it alone and make "a
  shell is the page" the boundary rule — O1 asserts
  `querySelectorAll("main").length === 1`. Do not suppress the rule per story
  and do not `inert` one shell: that trades a duplicate landmark for focusable
  content inside `aria-hidden`.
- **The vendored sidebar does not mirror.** Under `dir="rtl"` the in-flow
  `sidebar-gap` follows direction while the `fixed` container stays put
  (`data-[side=left]:left-0`), so a 256px blank strip sits at the start edge and
  the sidebar lies on top of the first 256px of content. Measured independently
  by O1 and O2, and it reaches every B1 consumer. Record it; do not fix a
  vendored file from a shell.
- **`data-slot="app-sidebar"` does not exist below 768px.** The vendored
  `Sidebar` spreads B1's props onto a `Sheet` root that renders no element; what
  renders is `data-slot="sidebar"` with `data-mobile="true"`. Any selector on
  the B1 slot silently stops matching inside a `Mobile` story.
- **`sheet.tsx`'s drawer was fixed centrally in this wave** — it was the last
  surface still animating under reduced motion, and nothing before
  `page.viewport` could reach it. Do not add a branch. If you open the drawer,
  assert `transition-property: none`, which is the value the fix changes;
  duration stays `0.2s`, so a duration check would pass after a revert.
- **`getByRole("region")` cannot see an unnamed `<section>`.** `aria-query` keys
  on the presence of `aria-labelledby`, not on the name it computes to.
- **B4 `modality-rail`'s stacked label is 63×0 CSS px, and the rail is 92px at
  every width**, so a rail-based shell has no narrow layout to swap into. Three
  agents measured it; cite it, do not re-measure it.
- **`EmbeddedWithSidebarFooter` stays a sibling export, not one of the eight** —
  it is a desktop-width geometric guard on `SIDEBAR_FILLS_SHELL`, and below
  768px there is no rail to size. O2 reused O1's verbatim; O9 can too. O11 needs
  the prop renamed (`railFooter`); O10 forwards no footer prop at all and needs
  either a different anchor or a stated exemption.

**And §8's opening section is your own backlog.** "Composition gaps found by
family O" was written by the twelve builders who built these shells — each item
is a place the component layer was not good enough to compose. Read the entries
that name your shell, cite them where a case story reaches one, and say which
are now stale: several have been fixed since, and at least one was found to
misattribute the defect.

### 3. Write

**3a. The case-story block.** Each of the eight is either written or recorded as
`// case-skip: <Name> — <reason>` in the convention's grammar. Write only the
ones true for this component; a story written to complete the set is worse than
a skip. `Controlled` and `KeyboardOrder` without play functions do not count.
Every story gets a JSDoc description that carries the judgment.

**3b. Descriptions.** A JSDoc block directly above every declared-state export
the report names. Say what the state is for and what a reader should notice —
never restate the export name.

**Files you may touch:** your story file; your component source
(`apps/docs/registry/super-ai/<name>.tsx`) only for a mechanical fix under §3.4
(`motion-reduce:*` beside an animation, the `[--muted-foreground:…]` rebind on a
painted surface, or the physical→logical class swap that is byte-identical in
LTR — `pl-`→`ps-`, `ml-`→`ms-`, `border-l`→`border-s`, `text-left`→`text-start` —
which `CONTINUE.md` §8 "Logical properties" sanctions; a swap that is not
byte-identical is recorded, never swept — and **byte-identical is a measurement,
not an assumption**: N6 `usage-dashboard` measured `text-left` → `text-start` on
a `<tr>` centring all four of its `<th>`s in LTR, because Chrome's user-agent
`th { text-align: -internal-center }` defers to an inherited value only when
that value is not the initial `start`. Read the LTR frame back before and after
the swap, not just the RTL one). **Never:** `apps/docs/lib/catalog.manifest.ts`,
`story-coverage.baseline.json`, the convention docs, the a11y exclusion list,
any other component's files. If a story needs a change outside that list, record
the gap in the story description and your report instead.

### 4. Verify

```bash
cd apps/docs && pnpm story-coverage:report <name>            # must print 0 unmet, exit 0
cd ../storybook && pnpm exec vitest run --project storybook src/stories/super-ai/<Pascal>.stories.tsx
pnpm --filter storybook typecheck
```

If you touched the component source, also from the repo root:
`pnpm --filter docs lint`, `pnpm --filter docs typecheck`, `pnpm check:tokens`,
and `cd apps/docs && pnpm exec vitest run registry/super-ai/<name>.test.tsx`.

Do not start `storybook dev`: sibling worktrees share the machine and the port,
and a dev server is not the verification — the vitest run is. If the offline
install fails, report it; do not install from the network.

`apps/docs/scripts/lib/story-coverage.test.ts` will now fail in your worktree on
"the committed baseline holds no resolved entries", listing your item's keys.
That is expected and is the integrator's job. **Do not run
`pnpm story-coverage:baseline`.**

### 5. Commit

One commit on your worktree branch, author set on the command line
(`CONTINUE.md` §3.6):

```bash
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -am "feat(stories): case stories — <name>" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### 6. Report, tersely

- Written: which of the eight, one line each on what the story shows.
- Skipped: which, with the reason as committed.
- Defects: fixed in-wave (mechanical) vs recorded (behavioural), each with the evidence.
- Judgment calls and anything ambiguous in the convention or the spec — flag, don't bury.
- Files touched, commit SHA, branch name, and the vitest counts.

## Integrator procedure

1. `git cherry-pick <sha>` each agent commit onto the integration branch (distinct files — no conflicts expected; if one appears, stop and read it).
2. `cd apps/docs && pnpm story-coverage:baseline` — must shrink; it refuses to grow.
3. From the repo root, the gate list in `ci.yml` order: `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright (`cd apps/docs && pnpm exec playwright test`, after the build) → `cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories`. The consumer install test only when registry sources changed.
4. Record what the wave found in `CONTINUE.md` §8/§9 (defects, gaps, judgment calls worth keeping), then one commit: `feat(stories): case-story retrofit — family <X>, baseline ratcheted`.
5. `git worktree remove --force <agent worktree>` and delete its branch.
