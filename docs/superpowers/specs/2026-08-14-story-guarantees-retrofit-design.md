# Story guarantees retrofit — Design Specification

**Date:** 2026-08-14
**Status:** In flight — step 1 (the convention PR) and step 2 (wave 0: the 25
`contractExempt` items folded in, the flag now at zero) are implemented.
Steps 3 (the family waves) and 4 (the gate) remain — outcome in `CONTINUE.md` §1 and §9.
**Follows:** [story-conventions.md](../../design-system/story-conventions.md) (PR #28), which this
program extends and spreads; the benchmark comparison from the same session, whose finding was
"ours has more components and fewer of every single guarantee."

| | |
| --- | --- |
| Scope | Convention expansion (the seven → eight + two manifest rules), retrofit of case stories across all 116 registry items, full `contractExempt` fold-in (25 items), then a `check:contract` gate |
| Touches | `docs/design-system/story-conventions.md`, `component-build-brief.md`, all 105 story files + 11 new ones, `apps/docs/lib/catalog.manifest.ts` (integrator only), `apps/docs/scripts/check-contract.mts` (last) |
| Explicitly out | Sizes stories, variant × intent grids, any benchmark number-parity goal |

---

## 1. Why

The case-story convention shipped in PR #28 with the right rules and the wrong reach. Measured
today, across 105 story files: `RTL` 3 · `ReducedMotion` 1 · `KeyboardOrder` 3 · `EmptyLabel` 2 ·
`LongContent` 3 · `Mobile` 4 · `Boundary` 3. Play functions: 45, concentrated in 16 files. The
convention's own scope clause — "required for every component built from now on" — points at a
future that does not exist: the catalog is complete, so as written the seven never spread past the
three pilot components.

Meanwhile the benchmark's categories with **no rule at all** here: controlled vs uncontrolled
(the comparison system's second-largest category), visible focus treatment, and
disabled/loading/error coverage on components that never declared those states. And the pilot's
own findings sit open: 11 of the 25 `contractExempt` items have no story file and have never been
rendered under axe; 14 of the 17 animating components ignore `prefers-reduced-motion`.

Three decisions were taken in the 2026-08-14 brainstorm, and this spec records them as settled:
full program (rules + retrofit + gate), all four new rule categories, and full `contractExempt`
fold-in rather than stories-only.

## 2. Convention changes

One PR, before any wave runs. Two files.

### 2.1 The seven become eight: `Controlled`

Added to the table in `story-conventions.md`:

| Story | Write it when | What it must show |
| --- | --- | --- |
| `Controlled` | the component exposes a value/selection API (`value`/`onChange` or equivalent) | the component driven by external state, with a play function asserting the controlled contract |

The play function is the point, and it asserts three things: interaction alone does not move the
rendered value (the `value` prop wins), `onChange` fires with the payload a consumer would need to
apply the change, and re-rendering with an unchanged `value` holds the component fixed (no
internal drift). A `Controlled` story without a play function is a screenshot of a prop and does
not count.

### 2.2 `KeyboardOrder` gains the focus ring

Its "what it must show" extends to: **visible focus treatment at every tab stop**, play-asserted.
The assertion tabs through the sequence and checks each stop matches `:focus-visible` with a
non-default treatment. Axe cannot see this today — it audits contrast and semantics, not whether
the ring exists — which is exactly why it goes in the play function.

### 2.3 Two manifest-shape rules (build brief, not gate)

Added to `component-build-brief.md` §Manifest:

- A component that exposes `disabled` (its own prop or passed through to an interactive
  primitive) must declare a disabled-shaped state in the manifest, which forces a story through
  the existing contract gate.
- A component with an async lifecycle must declare its loading-shaped and failure-shaped states.

Both rules are about **shape, not name**. The house vocabulary stays: `running`, `generating`,
`streaming`, `failed`, `locked` are all conforming names. A checker cannot mechanically know
"async", so these live as review rules in the brief, enforced by the wave integrator and by
whoever reviews future changes — not by `check:contract`.

### 2.4 Scope clause and non-goals

The scope clause flips from "every component built from now on" to **"every component in the
registry; retrofit tracked in `CONTINUE.md`."** A new non-goals note records why two benchmark
categories are deliberately declined: sizes counts and variant × intent grids market the
optionality this system exists to remove (the existing "no every-variant-at-once story" rule,
promoted from rule to stated posture, so the next benchmark reader knows the gap is chosen).

## 3. The retrofit program

### 3.1 Wave 0 — the 25 `contractExempt` items, full fold-in

Highest risk first: the 11 with no story file have never been rendered under axe, and
`safety-block` already proved that hides real failures. Each of the 25 gets the complete
retrofit in one file-opening: states declared, one declared-state story per state with real
`args`, case stories per the (now eight-name) convention, docs contract satisfied, and the
`contractExempt` flag dropped. When wave 0 lands, the flag has no remaining members and the
early-`continue` in `check-contract.mts` (whose comment still says "the 14 pre-Wave-1.5
components" — stale twice over) becomes dead code to delete in the gate PR.

### 3.2 Family waves — the remaining ~91 items

Case stories only, family by family, one PR per family so the set reads together
(`feat(stories): case-story retrofit — family E`). Family sizes run 2–14 items; small
families batch into a shared PR, so this is roughly eight to twelve PRs at the established
parallel-agent throughput. Wave order is catalog order — no family has a risk profile that
justifies reordering, since the axe-blind items all land in wave 0.

### 3.3 Parallel mechanics — the two known traps, handled

Per `CONTINUE.md` §3.4 and the parallel-builds section of `CLAUDE.md`:

- One agent per component, each in its own git worktree with its own port. Verify each
  worktree's base commit carries the convention PR before dispatch.
- **No agent writes `catalog.manifest.ts`.** Wave-0 agents *report* their proposed states
  (name, description, story export name) in their reports; the integrator applies all manifest
  edits centrally, then runs the full gate list from the repo root in `ci.yml` order. This is
  the §3.2 single-shared-file rule applied to the one wave that must touch manifest content.
- Agent prompts point at `story-conventions.md` and the build brief; they never paste the
  contracts (`CONTINUE.md` §3.4 anti-drift rule).

### 3.4 Fix policy inside a wave

A case story that surfaces a defect follows a two-tier rule:

- **Mechanical fixes land in-wave.** One-class repairs with an established house idiom: the 14
  reduced-motion offenders get `motion-reduce:animate-none` beside their `animate-*` classes;
  contrast failures on painted surfaces get the `[--muted-foreground:var(--accent-foreground)]`
  rebind. These are drift corrections, not design decisions.
- **Behavioral fixes are recorded, never pinned.** Focus management, state-machine changes,
  anything with a design choice in it (the `generation-queue` focus-loss finding is the type
  specimen) goes into the story description and `CONTINUE.md` §8 as a gap, and the play
  function stops short of asserting the wrong behaviour. Pinning a bug green is the one
  forbidden move.

## 4. The gate, last

After wave 0 plus at least one family wave hold, `check:contract` learns the case-story
contract. For every story file of a non-exempt item (which by then means: every item), each of
the **eight names** must be either exported or skip-annotated with a parseable line:

```
// case-skip: RTL — no directional layout, icons or motion
```

Presence-or-annotated-absence, not presence: a gate demanding all eight everywhere would force
the exact anti-pattern the convention bans (stories written to complete the set). The skip
comment already exists as a convention rule; the gate merely makes silence — the one thing the
convention says cannot be told from oversight — a build failure. Blocks' gate-enforced
`Empty`/`Responsive` is the precedent, and blocks keep those names on top of the eight.

Housekeeping in the same PR: delete the dead `contractExempt` branches and the stale "14
components" comment. The PR body flags the checker change as portable to the Minimal Design
System repo, same as the token checker note in `CLAUDE.md`.

## 5. Success criteria

1. Every benchmark category is either covered by a written rule with measured coverage, or
   declined in writing in the convention's non-goals.
2. All 116 registry items render under axe — the 11 never-rendered items gain story files in
   wave 0.
3. `contractExempt` has zero members; the flag and its checker branches are deleted.
4. Zero components animate without a `prefers-reduced-motion` branch (or carry a written
   reason in `ReducedMotion`'s description).
5. `check:contract` fails on a story file missing any of the eight names without a
   `case-skip` annotation.
6. The gates pass from the repo root in `ci.yml` order after every wave, and no entry is ever
   added to the a11y exclusion list to get there.

## 6. Sequencing

| Step | Deliverable | Depends on |
| --- | --- | --- |
| 1 | Convention PR (§2) | this spec approved |
| 2 | Wave 0: 25-item fold-in (§3.1) | convention PR merged |
| 3 | Family waves (§3.2), one PR each | wave 0 merged |
| 4 | Gate PR (§4) | all family waves merged |

Step 3's waves are independent of each other and run in any interleaving. The gate goes
strictly last: it fails every story file that has not been retrofitted, and a red gate can
never land on `main`, so its merge-precondition is that no file it checks would fail. Its
*design* is validated earlier — after wave 0 plus one family wave, the checker is written and
run locally in report-only form against the whole tree, so the annotation grammar gets proven
against real files before the remaining waves write hundreds of `case-skip` lines against it.
