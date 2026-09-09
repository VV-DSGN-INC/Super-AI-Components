# Handoff after the case-story program

**Written 2026-09-06, at commit `e501c4b`.** For whoever picks this up next.

This file is deliberately short. Everything durable is already in
[`CONTINUE.md`](../../CONTINUE.md) and
[`story-conventions.md`](../../design-system/story-conventions.md), and this repo
treats a second copy of a rule as how instructions drift. What follows is only
what those files do **not** say: the transient state, and a pick-up order for the
six things the program left open on purpose.

## 1. State, which is the part with a shelf life

- **The case-story program is done.** `story-coverage.baseline.json` is `[]`.
  All 116 registry items carry the eight case names or an annotated skip, and
  every declared-state export carries a description. §1 of `CONTINUE.md` has the
  wave-by-wave numbers; §8's family subsections and §9's wave entries have the
  findings.
- **Nothing is pushed.** Local `main` was fast-forwarded to `e501c4b` and is
  **93 commits ahead of `origin/main`**. The branch
  `claude/component-stories-specs-b80050` points at the same commit. To undo the
  merge: `git branch -f main b420c5a`.
- **Pushing is blocked on credentials, not on the work.** The only account in
  `gh auth` is a work account, which has `push: false` on this repo
  (`gh api repos/VV-DSGN-INC/Super-AI-Components --jq .permissions`). `weeeha`
  is no longer stored, so `gh auth switch` does not help. Re-auth is interactive.
  **Do not try to work around this.**
- **All eleven gates passed at `e501c4b`**, Storybook from a cleared cache:
  131 story files / 1,392 tests, Playwright 133, `check:contract` 116 items,
  `build:registry` 133 items, consumer install clean.
- **A deploy is a separate act.** `ci.yml` only verifies; nothing ships on merge.
  See `CONTINUE.md` §7.

## 2. The six open items, in the order worth taking them

Each is recorded in §8 with its measurement. None is a case story's to fix,
which is why they are still here. The effort notes are mine; the measurements
are the agents'.

**Take these two first — they are contained and the stories already exist.**

1. **`hover-card.tsx` has no reduced-motion branch.** One consumer,
   `citation-ref.tsx:64`, and it _can_ reach the class, so by this repo's own
   rule the pair belongs at that call site rather than in the primitive. The
   three sibling primitives were fixed in wave 8 and their guards are the model:
   assert `animation-name: none`, then watch it fail on a reverted class before
   keeping it. **One line plus one assertion.** The reason it was left is that
   taking the fix without the assertion is worse than recording it.

2. **`model-picker`'s listbox is unnamed** — `model-picker.tsx:236`, the last
   `SelectContent` in the registry without an `aria-label`. `trust-dialog`,
   `usage-dashboard` and `records-shell` fixed theirs in waves 7 and 8; copy
   whichever is closest. Read §8's note first: axe's behaviour here is
   **configuration-dependent** and one measurement had it raise nothing on an
   open unnamed listbox, so a story assertion is what protects the name, not the
   gate. `records-shell` proved that by stripping the attribute and watching
   exactly one test fail. Do the same.

**Then the two vendored ones, which need a decision before a diff.**

3. **The vendored sidebar does not mirror under RTL.** `sidebar.tsx:233` places
   the `fixed` container with `data-[side=left]:left-0`, while the in-flow
   `sidebar-gap` follows direction, so under `dir="rtl"` a 256px blank strip
   sits at the inline-start edge and the sidebar lies on top of the first 256px
   of content. Measured four times by four shells at two widths. This is a
   layout change to a vendored file shared by five shells, not a class swap, and
   it will move boxes that landed RTL assertions already pin. **Budget for
   rewriting those assertions in the same commit.**

4. **An invisible tooltip eats the first Escape in the mobile drawer.**
   `sidebar.tsx:546` passes `hidden={state !== "collapsed" || isMobile}` to
   `TooltipContent`, so the popup opens on focus and is merely hidden rather
   than unmounted: Escape #1 closes a tooltip nobody can see, Escape #2 closes
   the drawer. Affects every sidebar consumer with tooltip rows. The fix is to
   stop rendering it rather than to hide it, which is a behavioural change to a
   vendored file — **say so out loud before taking it.**

**Leave these two last. Both are real and neither has an obvious right answer.**

5. **`settings-shell` carries a second copy of a private predicate, and the two
   now visibly disagree.** `settings-dialog.tsx:224` owns `matchesQuery` and does
   not export it; `settings-shell.tsx:189` has a re-implementation that has
   already **diverged in shape** (array haystack against row object). O12
   measured a query where the badge reads 1, the status line reads "1 setting
   matches across 4 sections", the gated row renders, and the composed panel one
   region up reads "No settings in MCP match this search". The shell's own
   constant says to delete its overrides when M1 grows an opt-out, and that is
   still the right instruction — so the fix is an API on `settings-dialog`
   (export the predicate, add `nav={false}`), not a patch on the shell.

6. **The notebook chat pane fails `scrollable-region-focusable` and cannot take
   the standard repair.** `shortcuts-sheet`'s idiom (`<section tabIndex={0}
aria-label>` plus a ring) is unavailable, because `StickToBottom.Content`
   renders the scrolling div itself and accepts exactly one prop for it,
   `scrollClassName` — a class, never `tabIndex` or `aria-label`, verified
   against `use-stick-to-bottom@1.1.6`'s own types. `notebook-shell.tsx:6`
   composes it through AI Elements' `Conversation`. Fixing this means either
   patching the vendored `conversation` port or upstreaming a prop. The same
   dependency also springs `scrollTop` in a rAF loop with no `matchMedia`, so
   its smooth scroll ignores reduced motion.

## 3. Four things that will bite you specifically

Read `CONTINUE.md` §4 for the general set. These four are new since wave 8 and
are the ones a fresh agent gets wrong.

- **Run the Storybook suite from a cleared cache at least once.** A warm cache
  hid a real flake in `whats-new` for two whole waves — it passed six warm runs
  and failed deterministically cold. With the 6007 dev server **down**:
  `rm -rf apps/storybook/node_modules/.cache/storybook && cd apps/storybook && pnpm test:stories`.
- **`vitest/browser` must be imported dynamically inside a play.** It throws on
  evaluation outside Browser Mode, so a top-level import breaks the whole story
  file in a built Storybook. `story-conventions.md` fact 2 has the measurement.
- **A `motion-reduce:transition-none` fix moves `transition-property`, not
  `transition-duration`.** Three assertions in wave 8 were passing green against
  a fix they could not see because they read the duration. If you fix a motion
  defect, check whether the assertion that found it still means anything.
- **Commit before you dispatch agents.** A subagent worktree fast-forwards at
  step 0 and sees the branch as it was at dispatch time. Wave 8 dispatched its
  second batch while an updated brief and a vendored fix were still uncommitted,
  and two agents correctly reported guidance missing that was sitting in the
  integrator's working tree. This is now in the wave brief's step 0.

## 4. What not to do

- **Do not delete `story-coverage.baseline.json` because it is empty.** Empty is
  what makes the next unmet obligation fail. It stopped being a debt ledger and
  became the guarantee.
- **Do not add to the a11y exclusion list.** It reached zero super-ai entries and
  may only shrink. Same rule for the baseline.
- **Do not pin a defect green.** Every open item above is recorded rather than
  asserted for that reason. If you fix one, the assertion that recorded it has
  to be rewritten in the same commit, and the guard has to be watched fail on a
  revert before you keep it.
- **Do not restate any of this in `CLAUDE.md`.** It is a map, not a rule book.
