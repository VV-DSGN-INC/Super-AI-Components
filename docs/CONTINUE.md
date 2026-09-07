# CONTINUE HERE — building out the component catalog

A handoff for a fresh session. Read this top to bottom before touching
anything; it is written so you can pick up mid-build without re-deriving what
was already decided.

**Last updated:** 2026-09-07, after wave 2 of the post-case-story remediation.
The catalog has been complete since family O's twelve blocks (2026-08-11), and
`contractExempt` has had no members since 2026-08-15.

**This header rotted three weeks behind §8 once already**, because §8 is where
people enter the file and §1 is where they do not. That is why the nine wave
ledgers moved out to `design-system/wave-history.md` — see §9.

---

## 1. Where things stand

|                 |                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Repo            | `VV-DSGN-INC/Super-AI-Components`                                                                                                       |
| Branch          | `claude/wave-2-gates-and-truth`, merged into **local `main`** for wave 0                                                                |
| HEAD at handoff | **Waves 0 and 2 of the post-case-story remediation** — a portable Storybook gate, D21, and the three gates that existed but never ran   |
| Pushed          | **Nothing is pushed.** `origin/main` is still at PR #45. Pushing needs the `weeeha` identity, which a work-context session may not have |
| Preview         | Not deployed. Production serves 133 items and **69 of them differ** from what `main` builds — see §7.                                   |

**Catalog progress: 116 shipped. Nothing is planned, nothing is building.**
11 cut (family G's 10 + O5, per decision D9 — do not revive them).
_(`check:contract` counts **116**, and the two numbers are already reconciled:
the 114 is the frozen A–O count, and family P's 2 are counted alongside it
rather than reopening it — `catalog.manifest.test.ts`'s "holds the A–O freeze
at 114 while family P grows separately" asserts all three figures, which is
what keeps "frozen at 114" a checkable claim rather than a comment. See §5.9.)_

**`contractExempt` has no members.** The 25 pre-Wave-1.5 legacy items that
carried it were folded into the full contract by wave 0 of the story-guarantees
program (`superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md`,
step 2): states normalized and declared, one story per declared state, a docs
module, the flag dropped. `check:contract` reports **116 checked / 0 exempt**,
from 91 / 25 at the program's start. `catalog.manifest.test.ts` pins the empty
set as a ratchet, so re-exempting any of them fails a dedicated assertion. The
flag's own branches in `check-contract.mts` and its stale "the 14 pre-Wave-1.5
components" comment are now dead code, which the gate PR deletes (spec §4).

**No super-ai story is excluded from axe**, and both "may only shrink" lists
reached zero in the same wave. The Storybook a11y exclusion in
`apps/storybook/vitest.config.ts` now names only the vendored directories
(`stories/ui/**`, `stories/ai-elements/**`, plus three mount-crash files already
inside them), and `CONTRAST_EXEMPT_FILES` in
`packages/ds-rules/src/token-rules.mjs` is `[]`. `preview-tile` was the last
entry on both, and putting it under the enforced gate is what found the contrast
failure the exemption had been covering. The two lists are paired by
`check:contract`'s G3 rule, so they can only move together.

Plus one `registry:lib` contract, `cost` — not a catalog item, so not in the 114. See §5.9.

**The case-story gate landed as a ratchet on 2026-09-04, not as the program's
final step.** `apps/docs/scripts/lib/story-coverage.test.ts` derives the
obligations from the manifest — the eight case names present-or-`case-skip`,
and a JSDoc description above every declared-state export — and compares the
unmet set with a committed `story-coverage.baseline.json` in both directions.
The baseline holds the adoption-time debt: **817** obligations (615 case, 202
described) — 76 story files with no case block at all, one partial, and 50
files with undocumented state exports. Family coverage at adoption (files
with all eight accounted for): A 12/12 · B 8/8 · C 5/5 · D 1/7 · E 1/10 ·
F 0/7 · H 0/7 · I 0/5 · J 0/7 · K 3/8 · L 2/6 · M 3/7 · N 4/12 · O 0/13 ·
P 0/2. Each family wave then "shrank the baseline": a wave wrote its stories or
skips and ran `pnpm story-coverage:baseline` from `apps/docs` to lock the
progress in, and the script refuses to grow the file. **Eight waves later the
baseline is `[]`.** The figures above are the adoption-time snapshot, kept
because the shape of the debt is the argument for the program; they are all
derived by that test, so recount with it rather than maintaining them here.

With the file empty the ratchet stops being a ledger and becomes a plain
guarantee: every declared state has a documented export, every item has the
eight case names or a written reason one is absent, and a regression has nothing
to hide behind. Do not delete the file — an empty baseline is what makes the
next unmet obligation fail.

**Wave 1 of the family waves — families D and I — landed 2026-09-05, together
with the description-only debt.** The brief the agents were handed is
[`superpowers/plans/2026-09-05-case-story-family-waves.md`](superpowers/plans/2026-09-05-case-story-family-waves.md),
and `pnpm story-coverage:report [item …]` (from `apps/docs`) is the report-only
view it gave them: the unmet obligations for one item, computed on the same code
path as the ratchet, never touching the baseline. Baseline **817 → 625** (527
case, 98 described): the 18 items whose only debt was undocumented state
exports (76 descriptions across A/B/C/E/K/M/N) and the 11 D/I items (88 case
obligations, 28 descriptions). Seven of the eleven carried a sanctioned source
fix out of the wave — §8's D/I subsection has what stayed open, §9's wave 1
entry has what was fixed and what was found.

**Wave 8 — family O — landed 2026-09-06, and the baseline reached zero.**
Baseline **104 → 0**: thirteen shells, thirteen agents, all at zero unmet. Every
one of the 116 registry items now carries the eight case names or an annotated
skip, and every declared-state export carries a JSDoc description.
`story-coverage.baseline.json` is an empty list, which turns the ratchet from a
debt ledger into a plain regression guard — an obligation that goes unmet from
here is a new failure with nothing to hide behind. The wave's distinguishing
feature is one line of tooling: `page.viewport(375, 812)` from `vitest/browser`
makes a `Mobile` story move the real breakpoint, and everything it found had been
unreachable for seven waves. §8's family O subsection and [wave-history](design-system/wave-history.md)'s wave 8 entry have
the detail; what stays open is listed at the end of that entry.

**Wave 7 — families M and N — landed 2026-09-06.** Baseline **219 → 104** (104
case, **0 described**): twelve agents, twelve items, all at zero unmet, and the
description-only debt reaches zero across the whole registry. Everything left is
family O's 13 shells. The wave closed the dialog backdrop that wave 6 fixed one
primitive short of — `components/ui/alert-dialog.tsx`, found independently by
two agents — and it produced the first negative against the
physical-to-logical swap rule that six waves had treated as free. §8's M/N
subsection and [wave-history](design-system/wave-history.md)'s wave 7 entry have the detail.

**Wave 6 — families K and L — landed 2026-09-06.** Baseline **305 → 219** (200
case, 19 described). Nine agents, nine items, all at zero unmet. It closed the
last unrestated dropdown popup in the registry, fixed the dialog backdrop that
no call site could reach, and corrected five more written claims — four docs
notes and, for the third time, this file's own entry on right-to-left. §8's K/L
subsection and [wave-history](design-system/wave-history.md)'s wave 6 entry have the detail.

**Wave 5 — family J — landed 2026-09-06.** Baseline **362 → 305** (272 case,
33 described). Seven agents, seven items, all at zero unmet. Its distinguishing
feature is how much of it was an audit of earlier work: three claims recorded in
this file turned out to be stale or overstated, each caught by an agent that had
been told to cite them. §8's J subsection and [wave-history](design-system/wave-history.md)'s wave 5 entry have the detail.

**Wave 4 — family H — landed 2026-09-06.** Baseline **427 → 362** (328 case,
34 described). Seven agents, seven items, all at zero unmet. It found more that
the gates cannot see than any wave before it: four components whose slider
handles paint no focus ring at all, a whole class of reduced-motion assertions
that cannot fail, and two more holes in the focus-ring helper introduced during
wave 3. §8's H subsection and [wave-history](design-system/wave-history.md)'s wave 4 entry have the detail.

**Wave 3 — family F — landed 2026-09-06.** Baseline **490 → 427** (383 case,
44 described). Seven agents, seven items, all at zero unmet. Its findings are
in §8's F subsection and [wave-history](design-system/wave-history.md)'s wave 3 entry; the one with the widest reach is
that the focus-ring assertion the convention asks for could not fail, which is
now fixed with a shared helper.

**Wave 2 — families E and P — landed the same day.** Baseline **625 → 490**
(439 case, 51 described). Four of the eleven agents reported normally; the
other seven were killed by a session rate limit _between finishing their work
and verifying it_, and were salvaged rather than re-run — [wave-history](design-system/wave-history.md)'s wave 2 entry
carries the salvage procedure, because it will happen again.

Gate baselines at the close of wave 0: `pnpm test` **1568** across 143 files ·
`pnpm test:stories` **719** across 131 files · `check:contract`
**116 checked / 0 exempt** · Playwright **133 passed** · `registry.json`
**133 items** · `check:tokens` **180 of 182 files clean** (the 2 warnings are
vendored `components/ui/`, triaged and not gated) · `pnpm build` and the
consumer install test clean. The a11y gate's 131 / 719 is from **119 / 452**
before this program; the growth is wave 0's stories, not new components.

### Start here for the next phase

**Both prerequisites this section used to list are done, and the fan-out they
gated has happened.** The A-family retrofit landed (see below), and the twelve
shells were built by twelve concurrent agents, each in its own git worktree.
Recorded because both predictions held:

- **The worktree isolation was necessary.** Twelve agents sharing one tree would
  have raced on `tsbuildinfo` exactly as the seven leaves did. One agent still
  hit the residue of sharing — it found port 3000 held by a _sibling_ worktree's
  dev server, and its preview reported success while serving another worktree's
  build, so its new routes 404'd with no error anywhere. **If you hand-verify in
  a parallel worktree, take your own port and your own browser tab.**
- **The retrofit was worth doing first.** Twelve shells composed those
  primitives; had `cost-chip` still carried its default, the compensation list
  would have grown rather than gone to zero.

One thing that did _not_ work as intended, and will bite the next fan-out the
same way: **the agent worktrees were cut from `main`, not from the integration
branch.** So none of the twelve saw the manifest prep or the retrofit — all
twelve independently reported "the five files were not scaffolded" and "the
manifest row has no `regions`". No damage, because a block builder only writes
its own five files and the integrator sets the manifest centrally anyway. But
every incoming file had to be checked against the retrofit before it landed
(an agent working on pre-retrofit `cost-chip` could reasonably have re-added the
very override just deleted). **Check the base commit of an isolated worktree
before you rely on it carrying your prep.**

Read **[`design-system/block-build-brief.md`](design-system/block-build-brief.md)**
before touching family O. It is what the twelve builders were handed, and it
held: every one of them composed rather than reimplemented, and the composition
gaps they could not solve came back as reports instead of forks. See §8 for
those.

### The smoke gate was broken and is now fixed

`e2e/smoke.spec.ts` had been failing for six components — four of which predate
this phase — and the cause was the gate, not the components. Line 19 asserted
the `h1` via `getByRole`, but that is only a readiness proxy; the assertion the
test is named for is `expect(errors).toEqual([])` on the next line. `getByRole`
queries the accessibility tree, and any demo opening a Base UI modal on mount
makes the library set `aria-hidden` on the page shell — removing the `h1` from
that tree while leaving it in the DOM. The gate was accidentally testing "this
demo does not open a modal on mount". It also failed _differently_ per
environment: six locally, four on CI.

Now located by tag: **119/119 pass.**

**It then broke a second time, for a different reason, in this round.** A bare
`h1` tag locator started matching _two_ elements once family O landed: a block
is a page shell and renders its own heading inside the preview, below the docs
chrome's own `<h1>`. Four blocks failed and looked like broken components. The
gate now targets `[data-slot="component-page-title"]` — the docs page's own
title, explicitly — so anything the preview renders is out of scope by
construction. **131/131 pass.**

The lesson worth carrying: this locator has been wrong twice, and both times the
failure presented as "these components are broken" rather than "this gate is
wrong". A readiness proxy that overlaps with what it is proxying for will keep
doing this.

Two things worth keeping:

- **A green run proved nothing here.** The console-error assertion was verified
  by compiling a deliberate `console.error` into a demo and watching the test
  fail. The first attempt at that probe passed misleadingly, because
  `playwright.config.ts` runs `pnpm start` — `next start` serves the _prebuilt_
  output, so editing source without rebuilding tests a stale app.
- **This gate was missing from the Phase 1 plan's gate list**, which is how it
  went unrun for a whole phase. Worse, because GitHub Actions stops at the first
  failing step, its failure silently prevented the **Storybook a11y gate** and
  the **consumer install test** from ever running in CI — the two that verify
  this phase's most novel work. Per-task gate lists must mirror `ci.yml`, and a
  red gate early in a pipeline hides everything behind it.

---

## 2. Read these first, in this order

1. [`design-system/component-build-brief.md`](design-system/component-build-brief.md)
   — the house contract every component is built to. This is the single most
   important file; it is what gets handed to each build agent.
2. [`design-system/catalog.md`](design-system/catalog.md) — the 124 rows (114 active, 10 cut).
3. [`design-system/decisions.md`](design-system/decisions.md) — especially **D9**
   (family G cut), **D12** (scope, restorations, and the warning that J/K/N are
   not closed), **D13** (derived tables drift — the reason this whole pipeline
   exists), and **§5** (wave sequencing).
4. [`design-system/a11y-baseline.md`](design-system/a11y-baseline.md) — the
   measured accessibility posture, the recurring contrast failure, and what is
   excluded from the gate and why.
5. [`superpowers/specs/2026-08-03-component-pipeline-design.md`](superpowers/specs/2026-08-03-component-pipeline-design.md)
   — why the machinery is shaped the way it is.

---

## 3. How a component gets built

The loop, per batch of ~8–10 components:

### 3.1 Pick the batch

Follow `decisions.md` §5 wave order. Blocks (family O) compose components from
many families, so they come **last**.

**Families E, F, H, I, J, K, L and M are complete.**

**C and N are now closed.** Family N shipped under the same accepted rework risk
J and K took — D12's warning that J/K/N are unclosed pending re-sampling was
deliberately set aside when the catalog target was frozen at 114, and the
second reference board became its own v2 project.

**Family O is now closed too, and with it the catalog — there is no next
batch.** Its fourteen: twelve built here by twelve concurrent agents, O2
`chat-shell` as the earlier pathfinder, O5 cut.

**And that v2 project now exists, as family P.** P1 `data-views`, P2
`detail-view-shell`, plus the `use-view-mode` lib contract, shipped 2026-08-11
under [`2026-08-11-data-views-v2-design.md`](superpowers/specs/2026-08-11-data-views-v2-design.md).
It is counted separately from A–O by construction, so "the catalog is complete
at 114" above stays exactly true — `catalog.manifest.test.ts` asserts the two
halves independently rather than leaving that a comment.

Family P is where the "any v2 catalog" clause below stops being hypothetical.
Two things about it are open work rather than done work:

- **D18's evidence is desk research**, not a collected board of screens — see
  [`records-board-analysis.md`](design-system/records-board-analysis.md) §1.
  Family P does not reach A–O's evidentiary footing until those seven products
  are verified against real screens. P2 cleared D1 at exactly 3 of 5, so re-test
  that one first.
- **The consumer flip is not done.** `shadcn-shell` in DS-WebApp-Shells still
  authors its own copies of these files. Pointing it at the registry needs a
  published URL and is its own PR.

One correction the merge forces, worth recording because it inverts an
assumption family P was written under: **O10 `records-shell` shipped before P1
and P2 existed**, so it composes J5 `record-list` rather than the view axis.
That is not a defect — but "records-shell now has its dependencies" was written
when O10 was still planned, and it is no longer the right framing. Whether O10
should be revised to compose P1 is an open question, not a task.

**Parallel agents are the throughput mechanism** — §3.4 is not optional advice.
Wave 6's 12 items were built by 12 concurrent agents in one pass; family O's 12
likewise, each in its own git worktree. Sequential building runs at roughly 7
components per session.

**What this loop is still for:** the `contractExempt` retrofit (25 legacy
items), the composition gaps in §8, and any v2 catalog. The machinery is not
retired just because the 114 are.

### 3.2 Prepare the manifest — you do this, not the agents

`apps/docs/lib/catalog.manifest.ts` is the single source of truth and the one
shared file. Agents must never write it.

For each component in the batch, set `status: "building"` and normalise its
`states` into clean kebab-case identifiers. The raw `states` came from
`catalog.md`'s markdown table and contain prose like `"8–14 items"` or
`"editor context; privacy chip; saved-state"`, which cannot become story export
names.

**Two naming traps, both already hit:**

- A state named `"default"` becomes the story export `Default`. Use a meaningful
  name (`text-only`, `plain`). **Correction (2026-08-11): this bullet used to say
  "which the contract gate forbids", and that is not true.** `check-contract.mts`
  only asserts that every declared state has a matching export, so a state called
  `default` passes it. What actually keeps `Default` out is the scaffolder, which
  never emits one — pinned by `new-component.test.ts:65` — and the 14 stories
  that do export it are exactly the pre-Wave-1.5 `contractExempt` set. Worth
  knowing before you rely on the gate to catch this.
- Two states that normalise to the same identifier silently collide.

**Two shape rules (2026-08-14, story-guarantees program):** a component
exposing `disabled` declares a disabled-shaped state; an async component
declares loading-shaped and failure-shaped states — the component's own
vocabulary, shape not name (`story-conventions.md` §Manifest-shape rules).

### 3.3 Scaffold

```bash
cd apps/docs && pnpm new:component <name>
```

Emits five files with **deliberately failing tests**. Run it for each item.

### 3.4 Fan out — one agent per component, in parallel

They are independent: each writes only its own five files (plus an optional
`.examples.tsx`). No shared state, so they parallelise cleanly. Give each agent:

- A pointer to `docs/design-system/component-build-brief.md` — **do not
  re-paste the house rules into prompts.** That is how instructions drift; the
  brief exists so there is one copy.
- Its spec anchor (`component-specs.md` § `<ID> <name>`) and declared states.
- Component-specific steering only: which shipped primitive it must compose,
  which a11y trap applies to its shape, which prior component solved the same
  problem.
- An instruction to report **tersely** and to flag judgment calls rather than
  bury them. Several of this system's best decisions came from a builder saying
  "the spec is ambiguous here and I chose X".

Concurrency caps around 10–16; more than that just queues.

### 3.5 Integrate — you do this centrally

```bash
# 1. Reconcile declared deps against REAL imports. Never trust the catalog's
#    assumed bases: it names primitives this repo does not vendor.
cd apps/docs
for n in <names>; do
  printf "%-22s " "$n"
  grep -h 'from "' registry/super-ai/$n.tsx \
    | sed 's/.*from "//;s/".*//' \
    | grep -E '^@/components/ui/|^@/registry/super-ai/|lucide-react|^@base-ui' \
    | sort -u | tr '\n' ' '; echo
done

# 2. Set shadcn / consumes / npm from that output, flip status to "shipped".
# 3. Regenerate wiring and run every gate.
pnpm gen:wiring
pnpm check:contract
cd ../.. && pnpm typecheck && pnpm lint && pnpm check:tokens && pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

**On `@base-ui/react`:** it is normally left out of `npm`, because it arrives
as a peer of any vendored `ui/` primitive the component also imports — that is
why `parameter-panel`, `run-button` and `compare-viewer` all declare `[]`. The
exception is a component that imports **no** `ui/` primitive at all: `time-ruler`
uses only `@base-ui/react/slider`, so nothing would drag the package in and it
declares `npm: ["@base-ui/react"]`. Check before assuming the default.

`rm -rf node_modules/.cache/storybook` before `test:stories` is **not optional**
after adding components — Vite's dep optimiser invalidates mid-run and produces
a wall of fake failures that look like a11y errors but say
`Failed to fetch dynamically imported module`.

### 3.6 Commit, push, deploy

Commit author must be `weeeha <1083934+weeeha@users.noreply.github.com>` —
GitHub rejects the default email for this account:

```bash
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit
```

---

## 4. Traps that have actually bitten

Every one of these cost real time. They are ordered by how likely you are to
hit them again.

**Contrast: `text-muted-foreground` on `bg-muted`/`bg-accent`/`bg-secondary`.**
Those three tokens are the same value; the pairing measures 4.34:1 against a
4.5 minimum. It has failed five separate rounds. `check:tokens` now catches the
single-element form mechanically, but **not** the cross-component form — muted
text inside a child whose ancestor sets the background — which is how most real
instances shipped. Only `pnpm test:stories` catches that.

**Guidance modules and the server/client boundary.** `<name>.docs.tsx` is read
by a Server Component. Marking it `"use client"` breaks the server read; putting
JSX with event handlers in it breaks the static export. Interactive examples go
in `<name>.examples.tsx` as zero-prop client components. Both halves have broken
the build.

**Vendored `ui/` wrappers silently drop props.** Confirmed so far:
`toggle-group` doesn't forward `orientation`, `progress` appends its own track,
`slider` doesn't forward `getAriaLabel`/`getAriaValueText` (the only way to give
a slider thumb an accessible name). Read the wrapper before assuming its API;
composing Base UI directly is sometimes correct — say so when you do.

**`git stash` is shared across worktrees.** An agent lost work to a sibling
session's stash. Use `git show HEAD:path > /tmp/copy` instead. Agents are told
never to run git write commands at all.

**Vercel project linking.** A fresh worktree has no `.vercel`, and
`vercel deploy` will silently create a _new_ project. Ensure
`apps/docs/.vercel/project.json` contains:
`{"projectId":"prj_Z0ri0CNPMxq5LJawVq8z9y3FQdmy","orgId":"team_a028ZfIo8cWgn1t63MHMUVfw"}`.
A stray project named `docs` exists from this mistake and can be deleted.

**`react/no-unescaped-entities` is an error here, not a warning.** Guidance prose
quotes things; every literal `'`/`"` in JSX text must be escaped. Broke the lint
gate twice.

**`fs.globSync`** exists at runtime on Node 22+ but not in `@types/node@20`, so
it passes in untyped `.mjs` gates and fails typecheck in `.mts` ones.

**A `data-slot` you pass to a registry component replaces its own.** Every
component here spreads `...props` _after_ its own attributes, so
`<DateSection data-slot="my-group">` silently erases `date-section` and any
test or style keyed to it. Don't rename another component's slot from the
call site.

**Composing A8 inside a card means the frame can become a nested interactive.**
A8 draws its `action` slot _inside_ the frame, so a `failed` or `locked` tile
already contains a button. If `onSelect` also makes that frame a `<button>`,
axe fails `nested-interactive`. `result-card.tsx` suppresses tile
interactivity in exactly those two states — copy that rule in any other
component that puts a control in A8's action slot.

**A `data-slot` you pass to a registry component replaces its own — this bit
three times in one batch.** `DateSection`, `CostChip` and `StatReadout` all
spread `...props` after their own attributes, so
`<StatReadout data-slot="asset-detail-params">` silently erases
`stat-readout` and every test or style keyed to it. Let the composed component
keep its slot; it is also what makes the composition visible in the DOM.

**A2 `cost-chip` fails contrast wherever you compose it.** It sets
`text-muted-foreground` on its own `bg-muted` (4.34:1) and is excluded from
the a11y gate only under its _own_ story name — so any component that renders
one fails its own stories. Until A2's retrofit lands, pass
`className="text-foreground"` at the call site; tailwind-merge swaps the token
and leaves the chip otherwise intact. See `action-stack.tsx`.

**The `data-slot` rule, refined.** Overriding a **vendored `ui/` primitive's**
slot is house idiom (`result-card` on `Card`, `frame-strip` on `Carousel`,
`tool-panel` on `Tabs`) — nothing keys on those values. Overriding a
**registry component's** slot is the bug, because that slot is the component's
identity and every test and style keyed to it silently misses. `DateSection`,
`CostChip`, `StatReadout` and `EntityRow` have all been erased this way. Use
`data-<thing>-id` to address rows instead.

**An `sr-only` suffix fuses with the visible text in the accessible name.**
`<span>In</span><span class="sr-only"> point at 3s</span>` computes as
**"Inpoint at 3s"** — accname concatenates name-from-content chunks with
whitespace trimmed and no separator. Two agents hit this independently on the
same afternoon (`frame-strip`, `transcript-editor`), and it broke three tests
before either worked out why. Either set an outright `aria-label`, or make the
visual half `aria-hidden` and put the _complete_ phrase in the sr-only span.

**A decorative thumbnail that renders text doubles the accessible name.**
A tile whose thumbnail contains the item's label, inside A8 which also renders
that label, is named `"Dashed line Dashed line"` and every exact-name query
misses. Mark thumbnails `aria-hidden`. Cost this batch a story-gate failure.

**A8 `preview-tile`'s `failed` branch is `text-destructive` on its own
`bg-muted`** (~4.0:1). A8 is gate-exempt under its own story name, so its
stories pass and yours will not. Override the message to `text-foreground`
(`result-card` does) or don't render that state (`tool-panel` doesn't).

**Vendored wrappers drop props — now confirmed six times.** `toggle-group`
never forwards `orientation`; `slider` forwards neither `getAriaLabel` nor
`getAriaValueText`; **`tabs` destructures `orientation` and re-emits it only as
`data-orientation`**, so a vertical nav keeps horizontal arrow keys and
announces `aria-orientation="horizontal"`. Two agents found the `tabs` one
independently. Wave 7/8 added three more: **`popover` forwards only
`side`/`align`/`alignOffset`/`sideOffset` to `Popover.Positioner` and drops
`anchor`** — the one prop caret anchoring needs, so `inline-generate-popup`
composes Portal/Positioner/Popup directly; **`select` renders the raw value
(`16-9`) instead of the choice label (`16:9`) unless you pass `items`**, which
`template-detail` found via a failing test, not by inspection; and **`progress`
is unusable for indeterminate as shipped** — it appends its own
`Track`/`Indicator` with no handle on either, and Base UI gives an
indeterminate indicator _no width_, so `<Progress value={null}>` renders an
empty muted track that reads as broken (`source-panel` works around it with a
call-site arbitrary-descendant fix; fixing `components/ui/progress.tsx`
centrally would spare every future consumer). Read the wrapper before trusting
its API; composing the Base UI primitive directly is often correct
(`settings-dialog`, `whats-new`, `compare-viewer`, `inline-generate-popup`,
`explore-gallery` all do).

**A state name whose Pascal form collides with the story file's own imports.**
`statePascal("meta")` is `Meta`, which collides with `import type { Meta } from
"@storybook/react"` in every generated story. `record-list` had to alias
(`Meta as StorybookMeta`). `check:contract` does **not** catch this — it only
greps for `export const Meta`, which is present either way. Avoid `meta` and
`story` as state names when normalising the manifest in §3.2.

**`check:tokens` misses the muted-on-muted pairing when the two tokens sit in
different class strings of the same `cva` call.** Its heuristic matches within
one class-list string. `components/ui/tabs.tsx` puts `text-muted-foreground` in
`tabsListVariants`' base string and `bg-muted` in its `default` variant, so the
gate written specifically to catch the single-element shape of this bug is
blind to it. Found while building `explore-gallery`, which avoided the wrapper
for this reason. `parameter-panel.tsx:294` renders `<TabsList>` with no
variant and so inherits it; `tool-panel.tsx` uses `variant="line"`
(`bg-transparent`) and is safe. Not recorded in `a11y-baseline.md` — it is
neither a known nor an accepted exclusion. Unresolved at this handoff.

**DOM prop-name collisions.** `onVolumeChange` (a media event on every element)
and `resource` (RDFa) both collide with plausible component props and fail
typecheck in confusing ways. `Omit` them from the extended props — `stem-mixer`
and `rate-limit-banner` each had to.

**A Base UI popup is `role="dialog"` and needs a name.** `PopoverContent` with
no `aria-labelledby` fails axe's `aria-dialog-name` outright. Point it at the
visible title — `feature-announcement` shipped without this and the gate caught
it.

**Never run `pnpm format`.** The tree is **not** prettier-clean at HEAD, so it
rewrites ~300 unrelated files in one go — and worse, it breaks
`check:contract`: that gate matches guidance fields with regexes like
`whatItIs:\s*"..."`, and prettier re-wraps those strings so the match fails on
six previously-passing components. Format only the files you touched
(`pnpm exec prettier --write <paths>`), or leave it to the editor. Bringing
the whole repo up to prettier is its own task, and it needs the contract
gate's regexes made whitespace-tolerant first.

**A fresh clone has no Playwright browsers**, and `pnpm test:stories` fails
with `Executable doesn't exist` rather than anything a11y-shaped. Run
`pnpm exec playwright install chromium` from `apps/storybook` once.

**`pnpm` and `corepack` may both be missing** even though the repo pins
`pnpm@11.1.0`. `npm i -g pnpm@11.1.0` is enough; Node 26 works against
`.nvmrc`'s 24 for every gate in this repo.

**Defining `Element.getAnimations` in jsdom switches every Base UI overlay to
its async exit path — and the switch is not uniformly safe to land.** Base UI
branches on the method's _existence_, not its return value, so the two-line
`vitest.setup.ts` shim (`Element.prototype.getAnimations ??= () => []`) moves
popups, dialogs and tab panels from synchronous unmount to awaited unmount all
at once. Five components' tests asserted the synchronous behaviour:
`inline-generate-popup.test.tsx:65`, `recommendation-card.test.tsx:57`,
`selection-toolbar.test.tsx:106`, `settings-dialog.test.tsx:206`,
`tool-panel.test.tsx:151`. Applying the shim alone and running just those five
files ten times back to back gave **3, 4, 4, 4, 4, 5, 3, 3, 4, 3** failures —
not a fixed number. Splitting it out: `inline-generate-popup`,
`recommendation-card` and `selection-toolbar` failed in all ten runs (a real,
fixable synchronous assertion, exactly what the shim's own docs predict).
`settings-dialog` and `tool-panel` did not — they flipped pass/fail run to
run, and the flip tracked _what else was in the same vitest invocation_, not
the component's own logic: `tool-panel.test.tsx` run alone passed 9/9 but
failed intermittently only when run alongside the other four files; the
inverse held for `settings-dialog.test.tsx`, which failed 8/8 in isolation but
sometimes passed when run with company. Neither test uses fake timers, so this
is real-clock, cross-file scheduling noise from vitest's worker pool — how
many other files/timers are interleaved in the same tick decides whether the
exit-animation callback resolves before the assertion runs. `waitFor` would
make it pass reliably, but it would be papering over event-loop timing that
genuinely varies, on the strength of a ten-run sample that itself varied. The
shim was **not landed**: rewriting all five assertions on that evidence risks
hiding a real defect behind a green run. Before finishing this, get a much
larger sample (50–100 runs is cheap) and, if the two racy tests are still
racy, treat their non-determinism as the finding to fix, not a `waitFor` away.
If you add any jsdom shim like this, check its blast radius (a browser API a
library branches on, not one it merely stubs) before touching an assertion,
and check any new failure against the base commit before calling it
pre-existing.

---

## 5. Open decisions — these need a human, don't guess

1. **RESOLVED — C2 `suggestion-chips` shipped via a cross-registry dependency.**
   The old framing here was a false choice between vendoring AI Elements into
   `apps/docs` and building standalone. `registryDependencies` resolves by
   **URL**, not by local path — `registry-extras.ts` already emits
   fully-qualified URLs for this repo's own items — so a registry item can
   depend on another vendor's registry natively.

   C2 declares `external: ["https://registry.ai-sdk.dev/suggestion.json"]`
   (a manifest field added this phase) and vendors the file locally only so the
   workbench can render. **The consumer test proves the path works end to end:**
   a fresh app installing C2 pulls `components/ai-elements/suggestion.tsx` from
   `registry.ai-sdk.dev`, and its `next build` typechecks the whole chain. O2
   `chat-shell` uses the same mechanism for `conversation` and `message`.

   Two things learned doing it, both of which will bite the next person:
   - **`npx shadcn add <third-party URL>` is unsafe in this repo.** It resolves
     the item's own `registryDependencies` (`button`, `scroll-area`, `tooltip`)
     against the **default Radix registry** and offers to overwrite this repo's
     Base UI primitives — then writes no component files. Vendor by hand.
   - **AI Elements is Radix-flavoured; this registry is Base UI.** `message.tsx`
     needed two `asChild` → `render=` edits to typecheck. Those patches are
     local, so a consumer gets upstream's unpatched file, and **no registry
     mechanism expresses "…but adapted."** That remains an open architectural
     question, not a solved one.

2. **`gen-settings-bar` (A7) should compose `model-picker` (E2)**, not render the
   model as inert text. E2's spec says the picker owns capabilities and A7 only
   renders them. Same duplication class as the `hero-omnibox`/`mode-tabs`
   overlap that was already reconciled.
3. **Inconsistent accessible-name convention** for model selection:
   `model-picker` uses `"Model: Veo 3.1 Fast"`, `hero-omnibox` a static
   `"Model"`. One should win.
4. **PARTLY RESOLVED — two entries are still missing, found 2026-09-05.** **E9
   `tts-composer` and E10 `voice-clone-recorder` have no section in
   `component-specs.md` at all**, and never have (`git log -S` finds none).
   Their manifest rows still carry `specAnchor:
"component-specs.md#e9-tts-composer"` / `#e10-voice-clone-recorder`, because
   `gen-manifest.mts` synthesises that string from the catalog row rather than
   from a heading that exists — so both anchors are dead links, and **nothing
   checks them**: `check:contract` asserts the manifest's shape and
   `check-citations.mts` covers docs-module prose, neither resolves a
   `specAnchor`. A sweep of all 116 shipped items finds exactly these two.
   Their normative text today is the `catalog.md` row (E9/E10, both
   `RESTORED`), `gaps.md` §2 R6 and R7, and the shipped docs module. **Hand a
   wave agent those, not the anchor**, until the sections are written — and
   writing them is a design act that needs a human, since it would bless
   whatever shipped.

   The paragraph below compounds it: it cites "the precedent E9/E10 set" for
   how a restored entry should handle its `Evidence` line, and that precedent
   is not written down anywhere either. The rule it describes is still right;
   its citation is not.

   The rest stands. All five _other_ missing entries were written on 2026-08-04
   from `catalog.md` + `gaps.md` + D12: **H6
   `waveform-editor`** (gaps R3), **H7 `stem-mixer`** (R4), **J7 `track-list`**
   (R5), **M7 `connection-manager`** (T5) and **N7 `env-status`** (R1). The
   sixth on the old list, `N8 permission-prompt`, had already been specced by
   D16 — that list was stale.

   Each new entry carries an explicit **Evidence** line saying it is a restored
   consolidation error rather than a board sample, and instructs implementations
   to use `evidence: []` rather than inventing product names — the precedent
   E9/E10 set. Do not "improve" those entries by adding a product list; the
   screenshots were never collected.

5. **D12 warns families J, K and N are not closed** pending re-sampling — 20 of
   the 64 remaining. Building them now risks rework.
6. **The preview is SSO-protected.** Making it publicly shareable means
   promoting to production or disabling deployment protection. Nick's standing
   rule: never push to production without an explicit go.
7. **RESOLVED — nothing is `contractExempt`.** The flag reached zero members on
   2026-08-15 and D20 deleted it outright; §1 of this file has said so since.
   This item survived as an open decision for three weeks after it stopped
   being true, which is the failure mode §1's new header is about.
8. **T14, the `/roadmap` page, was specced but never built.** Still true —
   `apps/docs/app` has no roadmap route. What has changed is the argument for
   it: the catalog is complete at 116 shipped with nothing planned, so a
   roadmap page would now be documenting a finished set rather than progress
   toward one. Decide what it is for before building it.

9. **SHIPPED — but family E still needs retrofitting to it.** The `cost`
   module now exists at `registry/super-ai/cost.tsx` as the registry's first
   `registry:lib` item, exporting `Cost`, `CostProvider`, `useCost`,
   `formatCost`, `formatShortfall` and `GenerationState`. F1 already takes its
   lifecycle union from it.

   **What is still outstanding is the retrofit the spec called for**, none of
   which is done: E5 `run-button` and E7 `member-gate-row` are the two cost
   placements and still do not call `useCost`, so the rule that `insufficient`
   is _derived_ and never accepted as a prop is unenforced where it matters
   most. A2 `cost-chip` still has only `amount`/`unit` against a spec that
   declares four states, and A7 `gen-settings-bar` still has no cost slot
   though its spec says "A2 lives inside the bar rather than beside it".
   Both retrofits are additive and safe — a registry change never touches an
   already-installed component.

   Also still open: E5 and E6 spell the running state `running`, where the
   contract says `streaming`. The two names must not both survive.

   **Naming is still open for Nick.** The spec flagged that a file carrying
   both the cost and lifecycle contracts is misnamed as `cost` and might want
   to be `contracts.tsx`. It shipped as `cost.tsx` — the name the spec
   specifies — and renaming it later is a one-line change in
   `lib/lib.manifest.ts` plus the file itself.

   **How lib items work**, since this is the first one. They live in
   `lib/lib.manifest.ts`, not `catalog.manifest.ts`, and have their own
   narrower `LibManifestItem` type. That is deliberate: a contract has no
   family, no states, no demo, no docs page and no stories, and `family` in
   particular feeds the per-family reconciliation against `catalog.md`'s
   Totals table — a lib item parked in a family would silently inflate it. The
   contract gate holds lib items to what actually applies (the component and
   test files exist, the name cannot be shadowed by an orphan) and lets them
   be legal `consumes` targets. `gen-registry.mts` emits them with
   `type: "registry:lib"` and a `target` under the consumer's `lib/`.

10. **Two additive API departures, both because the written sketch left a prop
    unreachable.** Each is documented in its component's pitfalls:
    - `generation-grid`'s `renderItem` context carries a `toggleSelected` the
      wave-4 spec's §6.2 sketch does not list. Without it `onSelectionChange`
      could never fire — the checkbox that toggles an item is rendered by the
      caller, not by the grid.
    - `compare-viewer` adds `onActivePaneChange`. §6.15 lists `activePaneId`
      with no way to change it, which leaves `single` mode switchable only by
      the caller re-rendering, and leaves the pane numbers — the one identity
      that survives into that mode — with nothing to do.

11. **THREE SHARED PIECES WANT PROMOTING — the clearest signal this catalog
    has produced.** In each case two builders working blind reached for the
    same thing, which is what D3 means by _"promote shared pieces to L2 rather
    than importing sideways"_. None is broken; all three are correct-but-
    duplicated, and were deliberately left for a dedicated pass rather than
    stalling the build queue.

    | Shared piece                                                                  | Found by     | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
    | ----------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Timeline coordinates — `timeToPixels`, `pixelsToTime`, `snapTime`             | H2 / H3 / H6 | H2 exports them and calls them "the coordinate model H3 shares"; H3 built its own from `duration × pixelsPerSecond`; H6 has a third. **Two implementations of the same math, and H2's spec requires the playhead to span every track — which is only true if they agree.**                                                                                                                                                                                                                   |
    | The action row — A9 + A2 trailing chip + locked treatment + menu/inline split | F4 / I4      | I4 established it cannot _compose_ F4 (F4's root owns the `DropdownMenu`, so composing per-group yields N menus where I4 needs one). It mirrored the shape instead and documented it.                                                                                                                                                                                                                                                                                                        |
    | `ParameterSlider` — A6 `field-row` + a slider with a real accessible name     | E3 / I5      | I5 imports it from E3 — an L3→L3 sideways import across families, which is precisely what D3 forbids. It should be an L2 primitive.                                                                                                                                                                                                                                                                                                                                                          |
    | The four-verb approval row                                                    | F7 / I4 / K1 | **Now a third instance.** K1 `ai-doc-block` could not compose F7 `approval-card` — F7's root _is_ a `Card` carrying its own title/summary/undo model, so nesting it would invert the relationship (the block is the thing being approved, not a payload inside an approval surface) and double the frame. K1 copied the _rule_ — a fixed `VERBS` array whose order the component owns — with prose labels. Lifting the verb row out of F7 into a shared primitive is the fix all three want. |

    A fourth signal, different in kind — **A12 `section-header`'s `action` slot
    contract is too narrow.** A12 documents it as "a link, never a button. It
    navigates, it does not act." Two builders working blind both had to stretch
    it in the same batch: J1 `asset-library` put Upload / New folder **buttons**
    there, and J2 `filter-panel` put inert **text** there (`N selected`, so
    collapsing a section cannot silently hide live filters). Both documented the
    departure; neither fits the written rule. The rule or the slot should change
    — right now every real header violates it.

    The `registry:lib` machinery built for `cost` (see §5.9) is the right home
    for the first; the third is a straight promotion to `registry/super-ai/`.

12. **`compare-viewer`'s `syncKey` is rendered, not implemented.** The spec
    calls for synchronised zoom, pan and playhead, but gives the component no
    zoom API and no ownership of the media (which arrives as opaque
    `content`). It emits `data-sync-key` for whatever does own the media to
    read. Real synchronisation still needs a home — most likely in family H,
    where `time-ruler` and `track-lane` already have to agree on a playhead.
    **Now confirmed:** H2, H3 and H6 all shipped without a sync story, and each
    said so independently. It belongs with the coordinate model in item 11.

---

## 6. What good looks like

The gates are the contract. All of these must pass before a batch lands:

- `pnpm typecheck`, `pnpm lint` (0 errors), `pnpm check:tokens`
- `pnpm check:contract` — files exist, stories cover every declared state,
  guidance fields non-empty, `consumes` resolves to shipped items, deps match
  what `gen-registry` emits, wiring not stale, catalog counts agree
- `pnpm test` — 1117 at handoff
- `pnpm build` — 121 pages at handoff
- `pnpm test:stories` — 350 at handoff, **blocking**, run twice to rule out flake
- `pnpm --filter docs exec playwright test` — the smoke gate, 119 at handoff.
  **CI runs this (`ci.yml:23`) and it was missing from the Phase 1 plan's gate
  list**, which is how a gate goes unrun for a whole phase — and, because the
  job stops at the first failure, how the two steps behind it never ran either.
  Any per-task gate list must mirror `ci.yml`, in `ci.yml`'s order.

A component is not done because it renders. It is done when it composes the
right primitives, its tests pin the spec's load-bearing sentences, its guidance
tells a consumer when to reach for it and what goes wrong, and the gates are
green.

---

## 7. Deploy state

Production is behind this branch. Deploys are manual, from `apps/docs`, and need
the `weeeha` GitHub account. Nothing in this round has shipped to production.

---

## 8. Composition gaps found by family O — the fan-out's most useful output

The block brief's rule — **when a composed component does not fit, report it, do
not fork it** — held for all twelve builders. Nobody reimplemented a composed
component; every mismatch came back as a labelled sibling or a documented
call-site override plus a written gap. That makes this list the honest inventory
of where the component layer is not yet good enough to be composed, and **it is
the best-evidenced backlog in the repo**: each item was found by someone who
needed it to work and could not make it work.

**Found independently by three or more builders — fix these first:**

- **~~B1 `app-sidebar`'s bottom-anchored slots are clipped~~ — fixed 2026-08-17, and
  B1 was never the defect.** The clipping came from the vendored
  `sidebar-container`'s `fixed inset-y-0 h-svh` meeting the non-viewport
  containing block `EMBEDDABLE_SHELL` creates: containment redirects where the
  box is anchored, `h-svh` still sized it from the window. `app-sidebar` wires
  `promo` and `footer` correctly and was not changed. Fixed by
  `SIDEBAR_FILLS_SHELL` in five shells. Note the shells' own JSDoc and docs
  pages described the mechanism correctly all along — this entry's summary is
  what misattributed it to B1.
- **The sidebar-footer geometric assertion (Task 10) only covers `HomeShell`.**
  `chat-shell` and `artifact-shell` forward `sidebarFooter` to `AppSidebar`'s
  `footer` prop identically to `HomeShell` and could reuse
  `EmbeddedWithSidebarFooter` almost verbatim. `docs-shell` forwards
  `railFooter` to the same `footer` prop under a different prop name.
  `records-shell` forwards no footer prop at all and would need either a
  different anchor or a documented exemption. None of the other four shells
  has this story yet — open follow-up.
- **~~Carousel arrows positioned outside their own box~~ (`-left-12`/`-right-12`)
  — both named components were fixed at the call site; the open one is a third.**
  The finding stands: the vendored `Carousel` puts its arrows outside the box, so
  in a constrained column they clip or turn the page into a horizontal scroller,
  and O1 measured 407px of content in a 375px column, all of it the arrow. But
  C3 `feature-card-row` and H5 `frame-strip`, the two this entry named, each
  carry a horizontal override at their own call site rather than in the
  primitive — C3 also pins the arrow to `top-2`, H5 does not need to, and both
  files explain why in a comment. The H wave re-measured H5 in the configuration
  its own source calls narrow (square tiles plus a controls row) and the arrow
  clears A8's label band by 9px, now asserted in its `Mobile` story. **What is
  actually open is D2 `reference-strip`**, found in wave 1 composing `Carousel`
  with no override at all: measured 471px of footprint in a 375px column, 96px
  of arrow outside it. Corrected 2026-09-06 — this entry had been read as three
  open instances when it was one.
- **~~Grid columns keyed off the viewport rather than the container~~ — fixed by
  D19, and this entry outlived it.** J4 `artifact-grid` (O9) and C4 `recent-grid`
  (O1) both shipped viewport-keyed columns, so every shell that put a grid beside
  a sidebar carried a hand-written override to shift each breakpoint up a step.
  D19 (2026-08-18) made container queries the default for a component's own
  layout, with J4 as the pilot and C4 converting after it; both files carry
  `@container` wrappers with arbitrary-value thresholds today, and four
  pre-existing stories already assert them. Closed 2026-09-06, by the J-wave
  agent that was told to cite this bullet and checked it instead.

**Missing opt-outs — a component that always renders its own chrome cannot be
composed into a surface that already has that chrome:**

- **L6 `onboarding-wizard`** always draws a progress rail and Back/Skip footer,
  so O14's single-step sign-in had to suppress three dead buttons. Wants
  `progress={false}` / `nav={false}`.
- **M1 `settings-dialog`** renders its own nav _and_ search, both of which O12
  had to suppress because the page owns them. Wants a `chrome` opt-out, and its
  private `matchesQuery` exported — O12 had to duplicate the predicate.
- **J1 `asset-library`** has no `viewSwitch={false}` (O10) and no header-only
  mode (O7, which called this the biggest gap it hit).
- **J3 `explore-gallery`** bundles prompt, sort tabs, type pills and feed under
  one root with no slots, so O8 had to mount it feed-only and host the rest.
- **E5 `run-button`** renders its own cost chip whenever given `cost`; O6 wanted
  the control without the chip. Wants `showCost`.
- **F2 `generation-grid`** has no full-width empty mode (O6).
- **J3, J4, J5** — O10 and O8 both wanted a per-row/per-item slot and neither
  has one.

**Smaller, but real:**

- **H3 `track-lane`** exposes no scroll handle, so O4 cannot sync stacked lanes
  with each other or with the ruler; its gutter width is a private constant the
  shell has to hardcode. **H2 `TimeRuler`** always draws its own playhead, with
  no opt-out.
- **I3 `context-toolbar`'s `selection` is a closed four-member union** while I2's
  `elementType` is an open string, so O3 cannot express an inspector variant for
  a frame, group or camera.
- **I1 `tool-panel`** has no pinned slot other than `prompt`.
- **A5 `filter-bar`** has no single-select mode (O9) and no sort affordance
  (O10); its root is a bare `div`, so `aria-label` alone trips
  `aria-prohibited-attr`.
- **A8 `preview-tile`** cannot name its own frame button unless the label is
  `overlay`, and its interactive frame is always a toggle (`aria-pressed`) even
  when the tile is an open action. O7 notes C4 `recent-grid` uses `below` +
  `onSelect` and therefore ships nameless buttons — **a latent violation in a
  shipped component, not yet caught by a gate.**
- **K5 `source-panel`** stamps no per-source id, so O13's citation→source jump
  has to find rows positionally.
- **B4 `modality-rail`'s stacked label never renders** — `ToggleGroupItem`'s base
  `h-8` collapses the label span to zero height. The accessible name survives;
  the rail is icon-only visually. Pre-existing, verified in a browser by O4.
- **~~Vendored `ui/tabs.tsx` ... sitting outside its scan scope~~ — corrected and
  handled 2026-08-17.** It is not outside the scan scope: TOK-5's rule scope
  (`packages/ds-rules`) covers `components/ui` and `findCvaViolations` detects
  the base/variant pairing correctly. It is _found and downgraded to a warning_ because the file
  is vendored. Our two default-variant call sites now rebind
  `--muted-foreground`; the vendored default remains unsafe for consumers who
  compose a stock `TabsList`, recorded in `vendored-token-findings.md`.

**One infrastructure fix worth doing before the next fan-out:** Base UI's
`ScrollArea` (under C2 `suggestion-chips`) schedules a timer calling
`getAnimations()`, which jsdom lacks — it throws _after_ the triggering test
resolves, so every assertion passes and the run still exits 1. O1 shimmed it in
its own test file; **it belongs in the shared `vitest.setup.ts`** next to the
ResizeObserver stub, and will bite anything composing a ScrollArea.

### Added by the wave 0 story retrofit (2026-08-15)

Same provenance rule as the list above: each was found by someone writing a
story who could not write it honestly without noticing. These are not
composition gaps — they are divergences with no owner, filed here because
that is where the backlog lives.

- **`--warning` is undefined in Storybook, so no warning surface has ever been
  measured.** `apps/storybook/src/index.css` carries no `--color-warning` and
  no `--warning`; `apps/docs/app/globals.css` carries both. Tailwind v4 emits
  nothing for an undefined utility, so every `bg-warning` / `text-warning` in
  the registry renders **unpainted** under the axe gate — the stories that
  exist to show a near-limit or degraded state are green while proving nothing
  about it. Carrying `cssVars: WARNING_CSS_VARS`: M2 `credits-indicator`, M3
  `quota-meter`, M4 `pricing-table`, N2 `trust-dialog`, N6 `usage-dashboard`,
  N7 `env-status`. Painting with the token while declaring **no** `cssVars`,
  which additionally ships colourless to consumers: M6 `rate-limit-banner` and
  P1 `data-views` (via `data-views-shared.tsx`). Deliberately not fixed —
  defining the variable without choosing its value turns several components red
  at once, and `text-warning` measures ~2.2:1 where it does resolve. Full
  mechanism and the two M-family fixes it invalidates:
  [`a11y-baseline.md`](design-system/a11y-baseline.md), "Gate hole".

- **Logical properties: decided, and now a scoped sweep.** This entry was
  originally filed as an open system-wide question — K6 `citation-ref` was
  found **twice**, by two agents independently, and both declined for the same
  reason: logical properties appeared in zero registry sources, so the first
  adopter would set a convention by accident. That premise has expired, and the
  argument that settles it is narrow and checkable: **a physical→logical swap
  of this kind is byte-identical in LTR.** `pe-2` and `pr-2` compile to the
  same declaration in the shipped direction; `text-end` and `text-right` do
  too. There is no risk to weigh against the RTL correctness, so there is
  nothing left to decide.

  **The swap class is sanctioned. A5 `field-row` is the first adopter** — it
  landed `text-end` on `UnitInput`'s field and `pe-2` on its unit suffix, both
  with the reasoning in a comment at the site. **A4 `entity-row` is the second**
  — `text-left` → `text-start` on the row root, taken next because seventeen
  other registry components compose it, so it is the single highest-leverage
  site in the table.

  The remaining sites are a **scoped sweep**, not a research question. Verified
  present as listed, 2026-08-15:

  | component                   | site            | swap                                                                            |
  | --------------------------- | --------------- | ------------------------------------------------------------------------------- |
  | `citation-ref.tsx:46`       | marker          | `ml-0.5` → `ms-0.5`                                                             |
  | `safety-block.tsx:95`       | quoted fragment | `border-l-2 pl-2` → `border-s-2 ps-2`                                           |
  | `credits-indicator.tsx:114` | detail link     | `border-l` → `border-s`, `pl-1.5` → `ps-1.5`, `-mr-1` → `-me-1`                 |
  | `source-cards.tsx:100`      | title button    | `text-left` → `text-start`                                                      |
  | `explore-gallery.tsx:418`   | facet count     | `ml-1.5` → `ms-1.5`                                                             |
  | `artifact-grid.tsx:272`     | count badge     | `ml-1.5` → `ms-1.5`                                                             |
  | `preview-tile.tsx:150`      | badge slot      | `right-2` → `end-2` (added 2026-09-05, flagged independently by two D/I agents) |

  **Changes that are _not_ byte-identical stay open decisions, and must not be
  swept in with the above.** Two of them:

  - **N11 `escalation-handoff`'s `ArrowRight` does not mirror** (line 115).
    Fixing it means `rtl:-scale-x-100`, which appears nowhere in the registry
    and _is_ a visible change — a new idiom for mirroring icons, and one worth
    choosing deliberately rather than as a side effect of a whitespace sweep.
  - **`kbd`'s `KbdGroup` has no `dir="ltr"` pin, and this one is a real bug.**
    `KbdGroup` is a plain `inline-flex` row, so under `dir="rtl"` a chord
    reverses with its container: `⌘ ⇧ Z` paints as `Z ⇧ ⌘`. Chords are written
    modifier-first in every locale, so the RTL rendering is _a different
    instruction that still looks correct_ — the worst failure shape available,
    because nothing about it reads as broken. Found independently by two
    agents (`shortcuts-sheet`, which records it as a pitfall, and the
    logical-properties pass). The fix belongs in the `kbd` primitive, and it
    is a behaviour change rather than a compile-identical swap, which is why
    it is here and not in the table.

- **Duplicate accessible names on repeated per-item controls — six instances,
  and no gate can see any of them.** A component that renders one control per
  row, and gives that control a _constant_ name, produces N identically-named
  buttons in a list of N. The screen-reader element list a user navigates by
  reads "Reset, Reset, Reset"; the row each one acts on exists only in the
  visual adjacency. **This is the category, not six separate bugs:**

  | component              | the name           | why it repeats                                                                                                                                                                              |
  | ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | A2 `thread-list`       | `"Thread actions"` | ~~constant~~ **fixed 2026-08-15** — now `Thread actions for ${title}`                                                                                                                       |
  | `stat-readout`         | `"Copy"`           | private `CopyButton` takes `value` only, never `item.label`                                                                                                                                 |
  | `autonomy-selector`    | `"Revoke"`         | visible button text, no `aria-label`; per grant row                                                                                                                                         |
  | A11 `reset-affordance` | `"Reset"`          | `label` prop defaults to the bare word; three untouched fields announce alike                                                                                                               |
  | A5 `filter-bar`        | `"Remove filter"`  | `label` is derived as `typeof children === "string" ? children : ""`, so any chip with an icon child collapses to the generic name                                                          |
  | A8 `preview-tile`      | _(none)_           | worse shape of the same defect — the frame button is named only when `labelPlacement === "overlay"`; `below`/`none` ship a nameless button (already recorded above under the family O list) |

  **Two components in the catalog already solve it**, so the pattern is
  available and this is drift rather than an open question: `record-list.tsx`
  (`More actions for ${record.title}`) and `slot-summary.tsx`
  (`Add ${slot.label}` / `Change ${slot.label}`). `thread-list` was one line
  away from the same shape — `title` was already in scope — and has been
  fixed. **The other five are deliberately not fixed here**, because each
  needs the row's identity threaded to a control that currently cannot see it:
  a new prop, a changed private signature, or a decision about what a nameless
  tile should be called. That is an API question per component, not a sweep.

  **Nothing in the pipeline catches this.** Axe has no rule against two
  distinct controls sharing an accessible name — `duplicate-id` is about
  attributes and does not apply, and there is no `unique-accessible-name`
  check. `check:contract` reads the manifest, `check:tokens` reads colour, and
  the a11y gate is axe. So the whole category is invisible to CI and was found
  only by people writing `EmptyLabel` and `KeyboardOrder` stories and reading
  what they rendered. **A candidate for a new check:** within one rendered
  story, assert that controls sharing a `data-slot` have distinct accessible
  names. That is mechanical, would have caught five of these six, and is the
  first gate proposal to come out of the story program.

- **M3 `quota-meter`'s over-limit row is an invalid ARIA range.** `OverLimit`
  renders `aria-valuenow="5240"` against `aria-valuemax="5000"`. ARIA requires
  `aria-valuenow` to fall inside the range its min/max describe, so an
  assistive technology computing its own percentage announces over 100%. The
  visible `5,240 / 5,000` against a clamped bar is right and should stay; the
  fix is to stop reusing the allowance as the progressbar's maximum once `used`
  exceeds it. Its story framed this as a consequence of the visual clamp;
  reframed as a defect, and still not asserted.

- **K7 `answer-block` has no answer-level failure state.** `AnswerBlockProps`
  is `claims` / `streaming` / `retrievedUnused`, and coverage is derived from
  the claims. There is no way to express _generation stopped_ or _retrieval
  errored_ — an answer that failed halfway renders as a partially-cited answer
  that simply ended. This is an API gap, not a story gap: no story can be
  written for it until the prop exists.

- **`catalog.md` promises K6 `citation-ref` an affordance it does not have.**
  Line ~173 lists "copy quote" among its states; the component implements
  `resolved` / `loading` / `unresolved` and `onJumpToSource`, and nothing
  copies. The normalized manifest no longer carries it, so the divergence now
  survives only in the catalog row and a docs pitfall — which means nothing
  will catch it. Either build it or strike it from the row; specs are normative
  including their prose.

- **Declared-state stories are shipping without descriptions, and it is a
  registry-wide pattern rather than a wave-0 artefact.**
  `story-conventions.md` is explicit that a story with no description is a
  screenshot, and no gate can see the omission: `check:contract` asserts only
  that every declared state has a matching export, never that the export says
  anything.

  Counted 2026-08-15 by walking each shipped non-block item's declared states
  to its `statePascal` export and checking whether the preceding non-blank line
  closes a JSDoc block:

  | scope                    | undocumented declared-state exports | files                                                                                            |
  | ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
  | the 25 wave-0 components | **23**                              | 5 — `task-tray` 6, `source-cards` 5, `stat-readout` 4, `section-header` 4, `credits-indicator` 4 |
  | the whole registry       | **202**                             | 50                                                                                               |

  The registry-wide figure is the one that matters: wave 0 accounts for barely
  a tenth of it, so this is a pre-existing convention gap the retrofit merely
  made visible, not damage the retrofit did. Scope any follow-up to the 202.

  **A caution for whoever counts it next.** This number was got wrong three
  times before it was got right — 23, then "corrected" to 29, then to 25 —
  because "does this export have a description" is a question about the shape
  of the lines above it, and grep answers a slightly different question than
  the one being asked. Count it mechanically, from the manifest's declared
  states rather than from export names, and state the scope you counted.

  **Ratcheted since 2026-09-04:** each of the 202 is a `described` key in
  `apps/docs/scripts/lib/story-coverage.baseline.json`, derived by
  `story-coverage.test.ts` from the manifest's states exactly as the caution
  below prescribes; the count can now only go down.

  **Why it is a follow-up and not a blocker: zero case stories lack a
  description.** Every undocumented export is a declared-state story — the kind
  that restates the types and the manifest by construction — so nothing a case
  story is the only record of has gone unwritten. Four `Controlled` exports
  read as undocumented to a naive grep and are not: `filter-bar`,
  `pricing-table`, `slot-summary` and `thread-list` each carry the block above
  the harness or `const` the story renders, with only that declaration in
  between. Worth knowing twice over — once for whoever writes the audit grep,
  and once because a block separated from its export that way is attached to
  the wrong declaration, so autodocs may drop it.

- **cssVars liveness gate** (`scripts/lib/cssvars-liveness.test.ts`): two known
  construction limits — `cssVarKeys()` compares bare manifest keys against
  `--`-prefixed reads (can only over-flag, proven), and Tailwind theme-group
  keys are consumed via derived utilities so they live permanently in
  `cssvars-liveness.baseline.json`. Improving either shrinks the baseline.

- ds-rules follow-ups from the retrofit's final review: config `axes` declares
  `data-theme` (schema-forced) while the real mechanism is the `.dark` class —
  reconcile when a stage consumes axes. (The rest of this entry's items closed
  in `chore(ds-rules): close the final-review follow-ups backlog`.)

### Added by the D/I case-story wave (2026-09-05)

Same provenance rule: each was found by an agent writing a story who could not
write it honestly without noticing. The sanctioned mechanical fixes landed
in-wave (spec §3.4) and are listed under [wave-history](design-system/wave-history.md)'s wave 1 entry; these are the gaps
that stayed open, plus what the wave learned about the primitives underneath.

- **`PopoverContent` supplies no accessible name.** Base UI renders the popup
  `role="dialog"`, so every registry popover without an explicit `aria-label`
  is an `aria-dialog-name` violation the moment a story opens it — and the
  declared-state stories open none of them, which is how `context-toolbar`'s
  AI popover and `drawing-tools`' flyout shipped unnamed from wave 6 until this
  wave's `ReducedMotion`/`Controlled` stories opened them. Both fixed in-wave
  with the `modality-rail` idiom (`aria-label` on the content). Named today:
  `modality-rail`, `feature-announcement`, `context-toolbar`, `drawing-tools`.
  Every other popover in the registry is latently in this position until its
  case stories open it — a candidate for a ds-rules rule (a `PopoverContent`
  with neither `aria-label` nor `aria-labelledby`).
- **No `DirectionProvider` is mounted anywhere, so Base UI composites never
  learn about RTL — but only the keyboard half, and this entry originally said
  more than it should.** `CompositeRoot` reads `useDirection()`, which falls
  back to `"ltr"` without a provider, and `dir="rtl"` on a wrapper is invisible
  to React context. Measured on `mode-tabs`, and again on `selection-toolbar`,
  `time-ruler`, `stem-mixer` and `transcript-editor`: under `dir="rtl"`,
  ArrowRight advances in DOM order, which paints to the left.

  **`align` is a separate mechanism and does work; `side` is not.** Three
  agents narrowed this in turn. K4 `selection-toolbar` and K2
  `inline-generate-popup` measured that floating-ui's `platform.isRTL` reads
  _computed style_, so `align="start"` mirrors correctly whenever `dir` sits on
  the document — K2's numbers: RTL popup 495..815 against a trigger at 685..815,
  LTR 385..705 against 385..515. L2 `coach-mark` then measured the half that
  does **not**: a physical `side="right"` request stays physically right
  (596..916 against an anchor at 483..584), because Base UI reads _that_ from
  the same `DirectionContext` nothing mounts. So the split is not
  positioning-versus-keyboard, it is which source each property happens to
  read: `align` off rendered direction, `side` and composite arrow travel off
  React context.

  Two consequences either way. A wrapper `<div dir="rtl">` silently fails the
  `align` half, which is why an RTL story for anything portalled has to set
  `dir` on the document (the `RtlDocument` idiom). And a popup that lands on the
  correct side under RTL is not evidence that its arrow keys, or its `side`
  request, do.

  The fix for the keyboard half is one provider at the app shell, or the
  primitive reading `dir` — a shell-level decision, recorded, not made here.

- **The vendored `Button` moves on press with no reduced-motion branch.**
  `components/ui/button.tsx` carries `transition-all` and
  `active:not-aria-[haspopup]:translate-y-px`, so every button in the registry
  nudges a pixel while pressed under `prefers-reduced-motion: reduce`. Found
  independently by the `quote-reply` and `media-prompt-bar` agents. **This entry
  originally said the token gate downgrades it to a warning for vendored files;
  M5 `paywall-message` checked and it is worse than that.** MOT-2, the
  `transition-all` blocker, is a core rule scoped to
  `apps/docs/registry/super-ai` and `apps/docs/registry/marketing` only, so
  `components/ui` is outside it entirely — the finding is not demoted, it is
  never made. The demotion mechanism is real but belongs to the _local_ rules,
  whose `CATALOG_SCOPES` do include `components/ui`; that is why
  `check:tokens` reports vendored warnings for TOK-8 and none for MOT-2. The
  triage is still in `vendored-token-findings.md` (`vendored-token-findings.md`) — a primitive-wide posture, not any one
  component's, so no case story adds `motion-reduce:transition-none` for it.
- **Base UI's `Tabs.Panel` is an extra keyboard stop with no visible focus.**
  A tabbed panel puts two keyless stops in front of its sections, not one, and
  the vendored `ui/tabs.tsx` styles `TabsContent` `outline-none` with no
  `focus-visible` ring — the unpaired-`outline-none` shape the token gate exists
  to catch and does not see in a vendored file. `tool-panel`'s `KeyboardOrder`
  pins the order and filters that one slot out of its ring check so nothing is
  pinned in either direction. Its docs keyboard list omits the stop.
- **The carousel-arrow shape has a third instance: D2 `reference-strip`.** It
  composes `Carousel` with no override, so the arrows sit at `-left-12` /
  `-right-12`; measured 471px of footprint in a 375px column (96px of arrow
  outside it). C3 and H5 are recorded above; D2 is the first still open on both
  counts. Position is a design decision, so it stays recorded.
- **Reorder controls are named and iconed by physical direction.** D2
  `reference-strip`'s "Move X left" carries `ChevronLeft` and calls
  `onMove(id, "left")`, meaning "toward index 0" — which renders on the _right_
  under RTL. The array semantics stay correct; the label and icon mislead. H5
  `frame-strip`'s `onReorder(id, "left" | "right")` has the same shape. An API
  naming decision (`"start" | "end"`, or index deltas), not a class swap.
- **A keyboard-focused menu row in I4 `ai-tools-menu` has no perceptible focus
  treatment.** `focus:bg-transparent` on the `DropdownMenuItem` overrides the
  primitive's `focus:bg-accent` — presumably to keep A9's muted description off
  an accent surface — and leaves the focused row distinguishable only by title
  colour (oklch 0.205 vs 0.145). F4 `action-stack` carries the identical
  override on the identical row, so it is one decision for both and belongs
  with the shared row the I4 docs module's last pitfall already asks for.
- **Two more accessible-name collapses in the empty-string class.** D3
  `context-chips` with `label=""` names its remove control bare "Remove" (its
  docs module says the name cannot collapse — that sentence has a hole); I2
  `property-inspector`'s `Reset <label>` default cannot see the section above
  it, so a property under two groups produces duplicate names ("Reset Opacity"
  twice, which `EmptyLabel` asserts), and its `selectionLabel` fallback
  announces the raw `elementType` lookup key.
- **`aria-activedescendant` on D6 `skill-menu` is empty until the first arrow
  key.** cmdk 1.1.1 writes `selectedItemId` only inside `setState("value", …)`,
  and its select-first fallback runs only when the store value is empty — never
  true because `skill-menu` controls cmdk's `value`. A screen-reader user is
  told the field controls a listbox and never which option is current, while
  the preview is already rendering that option. The first Down repairs it.
- **Tap targets under WCAG 2.2's 24×24 in two rails.** I5 `drawing-tools`'
  flyout chevron measures 16×32 CSS px against a 32×32 tool button with no gap,
  so the spacing exception cannot apply; A11 `reset-affordance`'s 20×20 row
  target is multiplied across I2's column of rows. Axe's `target-size` is
  experimental and off, so no gate sees either.
- **Sweep-table addition, above.** A8 `preview-tile`'s badge slot is `absolute
top-2 right-2` — the byte-identical `end-2` swap, flagged independently by
  the `quote-reply` and `tool-panel` agents. Its own `RTL` story still says the
  swap would be "a system-wide decision"; that premise expired when the sweep
  was decided, and the description should be corrected when the sweep runs.

### Added by the E/P case-story wave (2026-09-05)

- **A second vendored primitive does not mirror, and this one is measurable.**
  `components/ui/switch.tsx` moves its thumb with
  `translate-x-[calc(100%-2px)]`, a physical axis. Measured settled under
  `dir="rtl"` on E7 `member-gate-row`: the track spans 12–44px and the thumb
  41–57px, so **thirteen of the thumb's sixteen pixels sit outside its own
  track**; in LTR the same pair is flush. Every switch in the registry inherits
  it. Its sibling is `components/ui/button-group.tsx`, which joins children with
  `rounded-r-none` / `rounded-r-lg!` / `rounded-l-none` / `border-l-0` — measured
  on E8 `generation-wizard`, the radii land on the seam instead of the outer
  edges and `border-l-0` strips the border from the group's _outer_ edge while
  two borders stack at the seam. Each is one logical-utility fix that would
  repair every consumer at once, and both are vendored, so neither was swept.

- **A group with an empty label loses its heading, its count and its tone
  together.** `feed-view.tsx` guards the entire `<header>` on `section.label ?`
  and renders `null`, so P1 `data-views` drops the group's separator and never
  calls `groupAccessibleName` for it. That function's own docstring is what
  makes this sharp: the tone marks are `aria-hidden` decoration and the
  function is "where the meaning actually reaches assistive tech", so an empty
  label silently deletes the only channel carrying tone. Measured: four groups,
  three headers. A caller passing `""` to hide a heading gets a data loss, not
  a visual tweak.

- **An unselected tab's count badge measures 4.34:1.** `detail-tabs.tsx` dims
  the badge with `opacity-70` rather than choosing a token, and against its
  surface that lands under the 4.5:1 minimum; the _selected_ tab's badge
  measures 18.15:1, so the failure exists only in the state nobody is looking
  at. axe does not catch it, because the rule reads composited colour rather
  than an opacity applied to a foreground — the same blind spot TOK-8 exists to
  describe, reached from the other side. Recorded in P2's `LongContent`
  description, asserted nowhere.

- **E1 `generation-panel`'s "Generate never scrolls away" is conditional, and
  nothing enforces the condition.** Measured at 375px with identical content:
  constrained to a 600px column the body scrolls and the footer sits on the
  card's bottom edge, as the spec promises; **unconstrained, the root's `h-full`
  resolves to `auto`, `flex-1` and `overflow-y-auto` never engage, and the card
  grows to 740px — putting Generate 140px below a phone fold.** The docs
  module's focus note inherits the same conditional. Both panels are rendered in
  that component's `Mobile` story; only the constrained one is asserted.

- **Under reduced motion, a loading tile and a failed tile become
  indistinguishable.** A8 `preview-tile` paints both on `bg-muted` and adds text
  for neither, and E4 `preset-grid` passes no `action` node, so suppressing the
  pulse removes the only signal separating them. The docs already record that
  the two _announce_ alike; the visual collapse is new. Both are rendered side
  by side in `preset-grid`'s `ReducedMotion`, and nothing asserts they are
  distinguishable.

- **Three more components hold state a host cannot reach.** E4 `preset-grid`'s
  see-more expansion is internal, one-way and never reset, so a host swapping
  `items` on a mounted grid — the natural move, since four content types are one
  component — carries the old expansion in and `visibleCount` is ignored from
  then on. E1 `generation-panel` exposes no
  `openSections`/`onSectionOpenChange` at all, one step past I2's
  after-the-fact callback. E8 `generation-wizard` focuses its step title on
  _any_ change of the active step except the first render, so a host restoring
  a saved position a tick after mount yanks focus into the wizard.

- **Four more rotating chevrons animate with no reduced-motion branch.** E1's
  was fixed in-wave with the `pricing-table` idiom; the same shape is still
  live at `approval-card.tsx:162`, `permission-prompt.tsx:184` and
  `trace-timeline.tsx:375`, all verified present 2026-09-05. Each is a
  one-class fix for whoever owns the file, so they are left to the F and N
  waves rather than swept here.

- **The shared ring-check helper is weaker than it reads.** Story play
  functions assert a visible focus treatment with
  `boxShadow !== "none" || outlineStyle !== "none"`, and both halves have now
  produced a false positive: a fully transparent, zero-size shadow
  (`rgba(0, 0, 0, 0) 0px 0px 0px 0`, measured on P2 `detail-view-shell`'s close
  button) is not the string `"none"`, and an `sr-only` input clipped to 1×1
  still carries the UA outline (measured on E1). Until the helper checks size
  and alpha, "every stop shows a ring" means "every stop has _something_ in
  those two properties".

### Added by the F case-story wave (2026-09-06)

- **The focus-ring assertion could not fail, and that is now fixed.** Four
  agents across three waves reached the same finding independently, and between
  them they measured the whole mechanism. A Tailwind `ring-*` utility composes
  shadow layers that are _always present_, reading
  `rgba(0, 0, 0, 0) 0px 0px 0px 0px` when the ring is off — not the string
  `"none"`, so `boxShadow !== "none"` passes on an element painting nothing.
  `focus-visible:outline-none` leaves `outline-width` at its used value while
  `outline-style` reads `none`, so a width-based check has the same hole. And
  the vendored `Button`'s `transition-all` _fades the ring in_, so an immediate
  read on a control that does paint one is a false negative — the same element
  reads transparent and zero-sized on the frame focus lands and
  `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` at 250ms. F5's agent put it best:
  this is the default reading for every shadcn-v4 control in the registry, not
  a quirk of two components. `apps/storybook/src/lib/focus-ring.ts` now checks
  the layers for non-zero alpha _and_ non-zero geometry and waits for them to
  settle; `story-conventions.md`'s mechanical fact 5 has the details.
  **Additive: 63 story files still carry the inline string check**, so a
  "shows a ring" claim in an older file is weaker than it reads.

- **A third vendored primitive does not mirror.** `components/ui/toggle-group.tsx`
  joins its children physically, exactly as `switch.tsx` and `button-group.tsx`
  do: measured under `dir="rtl"` with `spacing={0}`, the leftmost item loses its
  border (`border-left-width: 0` on the group's outer edge), 1px stacks against
  1px at the seam, and both 10px radii land on inner corners. It is gated on
  `data-spacing=0`, so today it reaches F5 `compare-viewer` and J1
  `asset-library` only — the registry's four other toggle groups keep the
  default gap and are unaffected.

- **A physical class is not always safe to swap, and F5 is the counter-example
  worth keeping.** The sanctioned swap assumes the class is the only thing
  deciding a side. In `compare-viewer` the pane numbers are `top-2 left-2` /
  `right-2` _and_ the wipe clip is `clipPath: inset(0 0 0 N%)`, which is
  physical and has no logical form. The badges pair with the content today
  because both halves are physical, so swapping only the classes would put each
  number over the other pane's picture — a class-only swap makes RTL worse. The
  same shape, resolved the other way, is F1/A8's corner pair: there both halves
  _were_ classes, so the integrator swapped them together (a half-swap would
  have stacked the badge on the checkbox). The rule the two cases give: swap
  when every participant in the layout is a class, and check what else decides
  the side before you do.

- **The wipe handle detaches from its seam under RTL.** Base UI positions the
  thumb with `inset-inline-start`, which mirrors; the clip is physical, which
  does not. Measured at `wipePosition={25}` in a 640px frame: the seam sits at
  160px and the handle at 465px, and ArrowRight moves them further apart. The
  fix is a direction-aware value in JS rather than a class.

- **Three more controls have no accessible name or no visible focus.** F5's
  resize divider renders `role="separator"` with `aria-valuemin/max/now` and no
  `aria-label`, so with three panes two stops both announce as "separator, N%",
  and no axe rule covers it. F5's wipe handle puts `focus-visible:ring-3` on the
  thumb while focus actually lands on Base UI's clipped `<input type="range">`
  inside it, so the ring is on an element that is never focused — the docs' own
  focus bullet claims that ring exists. And F1 `result-card` does not forward
  A8's `frameLabel`, so an unlabelled interactive card is a `button-name`
  violation with no escape hatch.

- **`components/ui/table.tsx`'s scroll container is the third
  `scrollable-region-focusable`.** After L5 `shortcuts-sheet` (wave 0) and P1
  `data-views`' kanban board (wave 2), F6 `render-queue` found the same shape one
  level down: a bare `div` with `overflow-x-auto`, no `tabIndex`, no role, no
  name. A read-only queue rendered at 375px with no handlers fails axe outright,
  because nothing inside it is focusable. Shared by every table in the registry.

- **`asset-detail`'s `onRemix` declares a field it never sends.** The type is
  `{ prompt?: string; span?: string }` and the button fires
  `onRemix({ prompt })` unconditionally, so the spec's "selecting a phrase feeds
  Remix" holds only if the host stitches `onSpanSelect`'s text to it. The docs
  page said the click "hands that exact text to Remix"; both that sentence and
  the prop's own comment were corrected, and populating the field stays an API
  decision.

- **Two more geometry guarantees are conditional.** F1 `result-card`'s spec
  promises identical card geometry in every state so grids never reflow; the
  media half holds and is asserted, but the footer's `min-h-9` is a floor, so a
  full provenance line makes one card 309px against a neighbour's 304px. And
  F2 `generation-grid`'s bulk bar overflows at 375px — 432px of content in a
  373px box — so the grid's own chrome is what scrolls sideways.

- **Every per-cell checkbox in a generation grid has the same accessible name.**
  `result-card.tsx` labels from a fixed `sr-only` "Select this result", so a
  four-result grid offers four identical names and a compact row offers eight.
  F1 already receives the prompt as `label`. Third instance of the per-row
  naming contract, after `property-inspector`'s resets and `context-chips`'
  empty label.

- **The turbo cache is shared across worktrees, confirmed.** Wave 1 filed it as
  unconfirmed; three F agents saw it. A cached `docs:lint` replay prints paths
  under a _sibling_ worktree, which means a docs lint error in an agent's
  worktree can be masked by another worktree's cache. Verify a lint result in
  the integration tree, not in an agent's.

### Added by the H case-story wave (2026-09-06)

- **`components/ui/**`exists twice, and only one copy is what the gate
renders.**`apps/docs/components/ui`has 39 primitives;`apps/storybook/src/components/ui`has 60. Storybook's Vite alias sends`@/components/ui/\*`to its own copy, so a
registry component renders against the docs copy on the docs site and against
the storybook copy under the a11y gate. Today the overlap differs only
cosmetically —`"use client"` directives the Next app needs and Vite does not,
  plus semicolon formatting — so nothing is broken, **but a substantive fix has
  to be made in both and nothing checks that.** Found the hard way: the fix for
  the unnamed select listbox went into the docs copy, the gate kept failing
  intermittently, and the probe that explained it showed the listbox still
  unlabelled. Both copies now carry it.

- **Every `SelectContent` in the registry is an unnamed listbox.** Base UI
  renders the popup as `role="listbox"`, and axe's `aria-input-field-name`
  fails one with no accessible name. Found the way the popover equivalents were
  — a story opened a select for the first time — and it surfaced
  _intermittently_, because axe has to run while the popup is open. Named at
  four call sites: H1 `transport-controls` (the one that found it), plus C1
  `hero-omnibox` and E9 `tts-composer`'s two, whose families have no case-story
  debt left to bring anyone back. **Still unnamed, and belonging to their own
  waves: `records-shell`, `template-detail`, `trust-dialog`,
  `usage-dashboard`.** The name comes from the trigger, which already has one.

- **Four components have slider handles that paint no focus ring, and four docs
  pages said otherwise.** Base UI renders a real `<input>` inside each thumb and
  clips it away with `position: fixed; clip-path: inset(50%)`. Focus lands on
  that input; the `focus-visible:ring-3` sits on the thumb wrapper, which
  therefore never matches `:focus-visible`. F5 `compare-viewer`'s wipe handle,
  H2 `time-ruler`'s three handles, H7 `stem-mixer`'s two faders — half of every
  mixer lane — and H6 `waveform-editor`'s four thumbs, which is four of its
  twelve tab stops. The prose in `time-ruler`, `stem-mixer` and
  `waveform-editor`'s docs modules promised that ring and has been corrected to
  say what is there. **The repair is one decision across all four**, and the
  in-repo idiom exists: `input-group.tsx` rings a wrapper with
  `has-[…:focus-visible]`. Not swept, because choosing which element carries the
  ring is a design call.

- **The unnamed-listbox rule is configuration-dependent, and the entry below
  overstated it.** H1 `transport-controls` failed axe outright on
  `aria-input-field-name` with its select popup open; J6 `template-detail`
  measured its own unnamed listbox open under the same gate and axe 4.12 raised
  nothing, while a deliberately nameless button in the same story did fail
  `button-name` — so the gate was running and the rule simply did not apply
  there. Both are measurements, neither explains the other, and the fix is
  right either way: an unnamed listbox is wrong whether or not a rule catches
  it. Read the entry below as "fails axe in at least one shape", not always.

- **A whole class of reduced-motion assertions cannot fail.**
  `components/ui/select.tsx` defaults `alignItemWithTrigger` to `true` and the
  content carries `data-[align-trigger=true]:animate-none`, so a default
  `SelectContent` computes `animationName: "none"` with or without any
  suppression. H1's agent wrote that assertion, watched it pass before applying
  any fix, and rewrote it. Eight registry components mount a `SelectContent`;
  H1 `transport-controls` is the only one carrying the restated pair, and the
  other seven are in the same position. Two stories already merged assert it:
  E2 `model-picker`'s comment already said it was a regression guard on the
  primitive's branch, which is honest; E9 `tts-composer`'s claimed it measured
  the frame a bare class fails to reach, and was corrected.

- **The focus-ring helper introduced in wave 3 had two more holes, both found
  after it shipped.** It reported a ring on the clipped `<input>` above, because
  a clipped element still carries the user agent's `outline: auto 1px` — fixed
  with an `isPainted` guard. And more fundamentally, **an absolute check answers
  "does this element paint a treatment", never "did focus cause it"**, so a span
  with a permanent `shadow-sm` passes whether focused or not; H6 found three
  slider spans in exactly that position. `focusTreatmentSignature` now exists
  for the differential, which is the stronger claim wherever an element can be
  focused directly. H2's agent hit the first hole, correctly declined to use the
  helper rather than manufacture green, and said so — which is how it was found.

- **Direction-blind arrow keys, now measured on a hand-rolled handler too.**
  Wave 1 recorded that Base UI composites never learn about right-to-left
  because no `DirectionProvider` is mounted. H4 `transcript-editor` has the same
  defect from a different cause: its own `handleKeyDown` maps ArrowRight to
  `index + 1` with no reference to `dir`, so focus moves to the token painted
  left. H2 and H7 measured the Base UI half again, and H7 added a consequence
  worth naming — Base UI takes a thumb's centring `translate` sign from
  `useDirection()`, so under RTL every thumb is offset by half its own width.

- **A Latin transcript renders backwards under right-to-left.** H4's tokens are
  flex items, so bidi never runs across the sentence and the flex main axis
  alone orders the words. Correct for an Arabic or Hebrew transcript, wrong for
  an English one in an RTL shell, and there is no API separating the chrome's
  direction from the transcript's language. Its word gaps are also `gap-x-1`
  rather than whitespace, so `textContent` reads `"Sothesecondpass"` and a
  copy out of the transcript runs the words together.

- **`landmark-unique`, a rule no story had tripped before.** H5 `frame-strip`'s
  root is `role="region"` named from `kind` alone, so two strips of the same
  kind on one page are two identically named landmarks — it failed two stories
  outright until each strip got its own `aria-label`. The escape hatch works;
  nothing in the component or its docs says a caller must use it.

- **Two more empty-string collapses, and one that fails the gate.** H4's word
  token with `text: ""` renders `role="option"` with no name and an 8×0 box —
  `aria-toggle-field-name`, a red gate, so the story documents it rather than
  rendering it. H4's speaker fallback is nullish (`?? "Unknown speaker"`), so
  `""` survives and the listbox is named `"Transcript, "`; the same fallback is
  seeded into the editable field, so renaming on the first keystroke stores the
  placeholder. H7's `label=""` renders `aria-label=""` rather than falling back
  to its default.

- **The don't-swap rule now has four negatives to two positives.** A physical
  class is safe to swap only when every participant in the layout is a class.
  H3 `track-lane`'s trim handles pair `left-0`/`right-0` with clip geometry, so
  a swap puts "Trim start" on the later edge; H2 `time-ruler`'s tick label and
  scrub bubble each pair a class with an inline `left` that has no logical form;
  H5 `frame-strip`'s arrows pair with Embla's LTR axis in JavaScript. Against
  those, the F1/A8 corner pair and H3's own gutter border were swapped and
  pinned. H3's is the pattern to copy: it added an RTL assertion on
  `borderLeftWidth`/`borderRightWidth` so the swap cannot silently regress.

- **Two more spec-and-docs corrections that only writing a story would find.**
  H2's docs claimed Home and End on the range handles stop one step short of
  each other; `minStepsBetweenValues` is 0, so they clamp to equality and one
  keypress produces a zero-length range with no keyboard route back. And both
  H6 `waveform-editor`'s file header and its docs module opened by saying the
  component has no `component-specs.md` entry — it has had one since
  2026-08-04, written shortly before the wave that built it. Both corrected.

- **H1's `aria-keyshortcuts="Space"` never fires, and the unit suite hid it.**
  `transport-controls.test.tsx` dispatches synthetic keydowns at the root
  `<div>`, which has no `tabIndex` and can never be the event target in a
  browser; every element that _can_ hold focus takes an early return. The docs
  module already carried the sentence — this is the measurement behind it.

### Added by the J case-story wave (2026-09-06)

- **The vendored carousel is broken under right-to-left, not merely
  mis-positioned.** J6 `template-detail` measured it: the same eight previews in
  the same 430px strip report `canScrollPrev` _and_ `canScrollNext` both false
  under `dir="rtl"`, so both arrows are natively disabled and **the four
  previews past the fold cannot be reached at all**; the LTR control has next
  enabled and steps one thumbnail. At 375px with four previews, RTL's "Next"
  moves the track 17px the wrong way against LTR's clean 95px. The cause is
  Embla never being told `direction` in `components/ui/carousel.tsx` — recorded
  since wave 1 as a positioning nuisance, and this is the first measurement
  showing it removes content.

- **A file name rendered as a button never truncates.** J1 `asset-library`
  measured the same name in all three of its variants at 832px: the link and
  span forms clip 552px into 421px, the button form paints 8..584 in a cell
  ending at 461 — **123px of file name across the next column** — and reports
  `scrollWidth === clientWidth`, so nothing sees it as overflowing. A button's
  `width: auto` is shrink-to-fit even at `display: flex`, so `truncate` never
  engages, and the cell's `max-w-64` cannot save it because `table-layout: auto`
  treats a cell max-width as advisory. At 375px in grid view it is real
  horizontal page scroll.

- **A fifth vendored primitive does not mirror, and this one is in every
  table.** `components/ui/table.tsx` gives each `<th>` a physical `text-left`
  while cells inherit `start`. Measured under RTL on J1's Name column: the
  heading paints at 488..526 and its data at 695..824 — **title and data on
  opposite edges, 207px apart**. F6 and J7 both saw the class; this is the first
  measurement of what it costs.

- **Facet counts announce with no separator, third and fourth instances.** J4
  `artifact-grid`'s chips read `"Markdown3"` and J3 `explore-gallery`'s read
  `"Images180"`, because the gap is a margin and a margin is invisible to name
  computation. J4's own docs page warns about exactly this shape under a
  different name (its "1,204views" pitfall) — corrected to say what it measures.
  H4 `transcript-editor`'s `gap-x-1` word spacing is the same defect in prose.

- **Viewport-keyed columns survive in a third component.** D19 fixed J4 and C4;
  J3 `explore-gallery` was never on that list and still keys `sm:columns-2
lg:columns-3` off the viewport, so any 375px container on a desktop page gets
  three ~114px columns.

- **Two more host-unreachable states, making four.** J4 `artifact-grid` keeps
  its per-session fold in an internal record with no prop and no callback, so a
  saved fold cannot be restored. J2 `filter-panel`'s see-more lives in a
  section's own `useState` and the section never remounts, so swapping
  `sections` carries the old expansion in — milder than E4 `preset-grid`'s,
  because it toggles, so it strands the host rather than the person.

- **The empty-string class keeps producing new shapes.** J4: a session `label`
  of `""` is _not_ an axe failure and is worse for it, because `aria-labelledby`
  pointing at an empty span leaves a region with no name, so the session stops
  being a landmark. J1: `searchPlaceholder=""` deletes the field's only
  accessible name and is a red gate. J7 and H7: `label=""` defeats its own
  default parameter, leaving a table or group unnamed with no rule covering it.

- **One positive worth recording, because the contract has failed four times
  elsewhere.** J1 `asset-library`'s per-row controls are named `Select {name}`
  and `Actions for {name}` — distinct, derived from the row's own data. That is
  what the per-row naming contract looks like when it holds.

### Added by the K/L case-story wave (2026-09-06)

- **Every dialog in the registry was still fading its backdrop under reduced
  motion, and no call site could fix it.** `DialogContent` renders
  `<DialogOverlay />` with no `className` threaded through, so the pair that
  waves 3, 4 and 6 applied to dialog _panels_ never reached the scrim. L3
  `feature-announcement` measured it: its popup read `animation-name: none`
  while its overlay read `enter`. The pair now lives on `DialogOverlay`'s own
  class string in both copies of the vendored file, verified by probe.

- **Tabbing past the last control destroys work in two components.** L2
  `coach-mark`: Base UI's trigger focus guard closes the popup on `focusOut`
  before forwarding, so Tab past Next ends the tour — and the guard forwards to
  the tabbable _after_ the anchor, so forward-tabbing never reaches the control
  being pointed at, which is the opposite of the intent. L3
  `feature-announcement`: the same close path fires `onDismiss(id)`, and the
  contract says a dismissed id must never re-show, so a Tab permanently
  dismisses an announcement. K2 `inline-generate-popup` has the milder form —
  the popup closes but nothing is lost.

- **The same empty string is a red gate on one field and silent on the next.**
  K1 `ai-doc-block` has two textareas: `editLabel=""` fails axe `label`
  outright, while `rePromptLabel=""` raises nothing even though
  `dom-accessibility-api` computes an empty name. The only structural
  difference is that the second field has a placeholder to fall back on. That is
  the clearest statement yet of why the gate is a floor and not a check: whether
  this defect is caught depends on an unrelated property of the field it lands
  on.

- **Suppressing motion can turn a progress bar into a lie.** K5
  `source-panel`'s indeterminate bar is a full-width pulse; stopping the pulse
  leaves a solid 100% bar under a row reading "Step 1 of 3", so a stalled import
  reads as finished. Distinct from E4 `preset-grid`'s collapse, where two states
  became indistinguishable — here one state reads as a _different_ state. K5 is
  otherwise the counter-case: all five stage names survive as visible text.

- **Neither focus helper can see a menu row's treatment.** `DropdownMenuItem`
  marks focus with `focus:bg-accent`, and `focusTreatmentSignature` reads
  outline, box-shadow and border colour only. K4 `selection-toolbar` takes its
  own signature including `background-color`, which doubles as the regression
  guard for the `focus:bg-transparent` override F7 and I4 carry — a candidate
  for the shared helper.

- **`check:tokens` false-positives on prose.** L6 `onboarding-wizard` found that
  writing the literal class name `transition-all` inside a source _comment_
  fails MOT-2 as a blocker. Same shape as the documented `#1234`-reads-as-hex
  limitation, and not written down anywhere until now.

- **Two vendored findings narrowed rather than added.** K1 measured that the
  `button-group` border defect costs nothing visible on a consumer whose
  children are `variant="default"`, because those are `border-transparent` — it
  is the radii that are seen, so the severity depends on the variants a call
  site uses. And L6 measured that the vendored `Progress` transition is inert
  where the call site hides the track, which is real registry-wide and a no-op
  there.

- **Three positives worth recording, because the program has mostly logged
  failures.** K2 `inline-generate-popup` does _not_ lose focus on cancel — the
  shape broken in four other components — because Cancel and Try again are the
  same element in the same slot of one ternary, so React relabels one node in
  place. L4 `whats-new`'s vertical composite never consults direction, so the
  missing provider costs it nothing. And L2 `coach-mark`'s popover was already
  named through Base UI's own title, unlike the four that shipped unnamed.

### Added by the M/N case-story wave (2026-09-06)

- **The dialog backdrop fix landed one primitive short, and two agents found it
  independently.** Wave 6 put the restated reduced-motion pair on
  `DialogOverlay`'s own class string because no call site could reach it.
  `components/ui/alert-dialog.tsx` is a separate file and did not get it, and
  `AlertDialogContent` renders `<AlertDialogOverlay />` with no `className`
  either — the identical unreachability, one file over. N8 `permission-prompt`
  and N2 `trust-dialog` each measured the same values after fixing their own
  panels: popup `animation-name: none`, backdrop `enter` at `0.1s` with
  `opacity: 0`. Four consumers (`permission-prompt`, `thread-list`,
  `trust-dialog`, `voice-clone-recorder`). Fixed centrally in both copies and
  guarded in `TrustDialog.stories.tsx`'s `ReducedMotion`, which was verified to
  fail on a reverted class before it was kept.

- **A modal can put every control off-screen with no scrollbar and no way to
  scroll.** N8 `permission-prompt` expanded its arguments to a 24-line file
  body at 1200×900: the panel measured 1193px tall, top **−146**, footer at
  982..1047, `scrollHeight === clientHeight`, document 900/900.
  `AlertDialogContent` sets no `max-height` and no `overflow`, and a `fixed`
  element cannot be scrolled into view, so Escape is the only exit — and Escape
  reports nothing to the host. A phone's viewport reaches this far sooner. This
  is the shared primitive again, not one component's layout.

- **Two components need direction handled in JS, not in a class swap.** N4
  `trace-timeline` positions its waterfall bars with an inline
  `style={{ left }}`, so under RTL the time axis runs backwards: the first span
  sits 0px from the _left_ under both directions. N5 `run-inspector`'s `<pre>`
  inherits `direction: rtl` and JSON reorders inside it — on one line, LTR puts
  the opening quote at x27 and the trailing comma 159px to its right, RTL puts
  them at x1165 and 159px to its _left_. The fix there is `dir="ltr"` on the
  `<pre>`. Neither is on the sanctioned physical-to-logical list, and H2
  `time-ruler` has the same shape as the first.

- **A trailing full stop renders at the wrong end under RTL.** N3
  `disclaimer-note` measured it reading `.AI can make mistakes. Check important
info` — `.` is a bidi neutral with nothing strong after it, so it takes the
  paragraph level. Passing a `link` hides the defect, because the link's Latin
  text makes the stop interior. A new shape: every earlier RTL finding in this
  file was a physical utility or a positioning API.

- **`scrollable-region-focusable` is now at four instances, and the fourth is a
  red gate nobody can see.** N5 `run-inspector`'s JSON payload measured 2680px
  of content in a 318px box with zero focusable descendants. It is not rendered
  in a story, because rendering it would fail the a11y gate — after
  `shortcuts-sheet`, the `data-views` kanban and the vendored table, all fixed
  with the same `<section tabIndex={0} aria-label>` idiom.

- **The vendored `text-left` collection is six files**, not one: `alert.tsx`,
  `alert-dialog.tsx`, `field.tsx`, `sidebar.tsx`, `table.tsx`, `select.tsx`
  (`grep -l` across `components/ui`). M6 `rate-limit-banner` measured `alert.tsx`
  putting a heading and its body on _opposite edges_ of a 32rem RTL frame, 256px
  apart; N2 `trust-dialog` measured `alert-dialog.tsx`'s header doing the same
  inside a mirrored dialog at 1200px. Byte-identical swaps in a shared file, so
  still not taken from a consumer.

- **One component cannot be localised at all.** M6 `rate-limit-banner` holds
  eight fixed English strings, including the clock's `aria-label`, in a
  module-level `COPY` constant that is neither exported nor reachable by prop.
  Its auto-updating clock also has no pause, stop or hide (WCAG 2.2 SC 2.2.2),
  and the docs do not mention it.

- **A permission editor seeded once at mount emits the previous call's
  arguments.** N8 `permission-prompt` swapped `to/subject/attachment` for
  `to/subject/amount_usd` on a mounted prompt: carried fields showed the _old_
  values, the new field rendered empty, and Approve-edited emitted three
  arguments including one the current call does not have. A permission gate is
  the natural singleton, so this is the shape a real host reaches.

- **A long label can push a dialog's footer outside the dialog with no rule
  seeing it.** N2 `trust-dialog`: `button-group`'s `w-fit` plus the trigger's
  `whitespace-nowrap` gave a `scrollWidth` of 768 against a `clientWidth` of 384. The `entity-row` truncation that would have saved it is defeated by
  `w-(--anchor-width)` sizing off the same over-wide trigger. Related: this
  component's own `sm:max-w-md` never applies, because the vendored
  `data-[size=default]:sm:max-w-sm` outranks it.

- **The one-red-one-silent empty string reached its third and fourth
  instances**, and N2 `trust-dialog` named the rule it actually trips: Base UI
  renders its checkbox as `<span role="checkbox">`, so `trustLabel=""` fails
  `aria-toggle-field-name`, not `label`. N3 `disclaimer-note`'s `children=""`
  deletes the disclaimer in silence while `link={{label: ""}}` fails
  `link-name`; N1 `feedback`'s `reasonPlaceholder=""` fails `label` because that
  one prop is both the placeholder and the `aria-label` — the counter-case to
  K1's pair, which survived by having a placeholder to fall back on.

- **Two more docs focus bullets were wrong in the same direction.** N3
  `disclaimer-note`'s said its one focusable element is "invisible when
  focused"; the user agent supplies `outline: auto 1px`, recoloured by the
  repo's global `outline-ring/50`, so it is _thin_ against the registry's ring-2
  and ring-3, not absent. M1 `settings-dialog`'s said the panel "sets
  `outline-none` without adding a ring"; the `Tabs.Panel` has carried
  `focus-visible:ring-2` since before this program, verified in the source at
  the commit before the wave, and the differential measures it arriving. Both
  corrected centrally.

- **A written claim about the a11y gate was corrected.** L5 `shortcuts-sheet`'s
  stated reason for not rendering a modal beside focusable neighbours does not
  hold: N2 `trust-dialog` measured the canvas as `aria-hidden="true"` with
  `data-base-ui-inert` and no real `inert` (`el.inert === false`), and axe
  raises nothing because `aria-hidden-focus` carries a `focusable-modal-open`
  check, verified present in `axe-core@4.12.1`. `Boundary` renders both surfaces
  live.

- **The reduced-motion popover sweep is complete.** N1 `feedback` carried the
  last of eight `<PopoverContent` call sites in the registry
  (`inline-generate-popup` never used the wrapper). With the dropdown holdout
  closed in wave 6 and the alert-dialog backdrop closed here, no registry
  surface _reachable at desktop width_ still animates under
  `prefers-reduced-motion: reduce`. **Wave 8 found the qualifier the sentence
  needed, twice.** The vendored `sheet.tsx` drawer that every B1 sidebar swaps
  to below 768px was never suppressed — panel `0.2s`, backdrop `0.15s`, 40px of
  translate — and nothing could reach it, because the branch needs a real
  viewport media query and every `Mobile` story until wave 8 constrained a
  wrapper instead. Then `components/ui/sidebar.tsx`'s _desktop_ collapse turned
  out to be unsuppressed as well — `transition-[width]` on the in-flow gap and
  `transition-[left,right,width]` on the fixed container, 256px of travel — which
  needed no new tooling at all, only a story that opened a sidebar under reduce.
  Both fixed in both copies; O1, O2, O9 and O10 measured them between them.
  Inside `components/ui/` only `dialog`, `alert-dialog`, `sheet` and `sidebar`
  carry a branch; for `popover`, `dropdown-menu`, `select`, `tooltip` and
  `hover-card` it lives at the call sites, which is why those sweeps were
  per-consumer.

- **Two findings narrowed rather than added.** N1 `feedback` narrowed K1's
  `button-group` border defect further: the `border-l-0` is invisible on _ghost_
  children too, because `buttonVariants`' base is `border-transparent`, so the
  severity depends on the call site's variants and not on the group. And N4
  `trace-timeline` kept a `text-left` → `text-start` swap that changes no box in
  its RTL frame, said so plainly, and pinned it by reading `textAlign` back
  rather than claiming a visual repair.

- **Two positives.** N4 `trace-timeline` is the counter-case to the four
  host-unreachable-fold findings (E4, E1, J4, J2): `expandedId`,
  `defaultExpandedId` and `onExpandedChange` are a complete trio, so a saved
  fold can be restored _and_ held against the user. And M1
  `settings-dialog`'s nav rows paint a real focus ring — the wave-3
  suppressed-treatment check came back negative, asserted rather than assumed.

- **The sanctioned `text-left` → `text-start` swap is not always byte-identical,
  and where the class _sits_ decides it.** N6 `usage-dashboard` put the swap on a
  `<tr>` whose alignment is consumed by its `<th>`s: Chrome's user-agent rule is
  `th { text-align: -internal-center }`, which defers to an inherited value only
  when that value is not the initial `start`, so `text-left` was being inherited
  and `text-start` was not — the swap centred all four headings in LTR. Caught
  by the agent's own RTL assertion before it shipped; the class now sits on each
  `th`. Six waves have treated this swap as free. It is free on the element that
  paints the text, and not on an ancestor of one the user agent has an opinion
  about.

- **A chart can be pinned left-to-right in three independent ways.** N6
  `usage-dashboard`: the bars share a physical left baseline (684..1165 in LTR
  against 684..695 in RTL), the category axis stays left while the table's
  matching column moves right, and the trend glyph's diagonal encodes "later is
  to the right". None of the three is a class swap. Its signed delta also comes
  apart under RTL — `+` at 1164, `%` at 1153, `7` at 1146, reading `7 % +` —
  while A2 `cost-chip`, composed one row below it, already solves exactly this
  with `dir="ltr"`.

- **Two vendored lists in this file were stale, and both were re-derived rather
  than edited.** By `grep` across `registry/super-ai` after this wave, the
  `SelectContent` popups still shipping without an `aria-label` are
  **`model-picker` and `records-shell`** — `template-detail` was named in wave 5,
  `trust-dialog` and `usage-dashboard` in this one, and `model-picker` was never
  on the written list. The reduced-motion half of that list should not be kept at
  all: five call sites carry no `motion-reduce` pair, and no registry call site
  passes `alignItemWithTrigger={false}`, so `data-[align-trigger=true]:animate-none`
  already suppresses every one of them. H1 `transport-controls` measured that in
  wave 4; listing them as holdouts invites a fix that changes nothing.

- **The first reduced-motion branch in this program supplied by a dependency.**
  Recharts 3.8 defaults `isAnimationActive` to `"auto"`, which reads
  `prefers-reduced-motion` itself, so N6's bars need no `motion-reduce:` class.
  Worth knowing before someone adds one. No recharts default leaks either: the
  bar fill resolves to `--chart-1`, with no `#8884d8` and no `strokeDasharray`.

- **Two query shapes that cost an agent real time**, both now in N6's file
  header: a component's own `data-slot` override _replaces_ the vendored
  `select-trigger` / `select-content` name, so querying the vendored name reads
  as "the popup never opened"; and Base UI's select popup never unmounts — the
  _positioner_ takes `hidden` — so `waitFor(() => expect(popup).toBeNull())`
  times out rather than passing.

- **A cold-cache-only flake in landed work, found by running the full suite
  cold.** L4 `whats-new`'s `KeyboardOrder` read the detail pane once after
  waiting on `aria-selected`; the `hidden` attribute moves between the two Base
  UI tab panels a tick later, so the read could still return the previous
  entry's pane. Warm: passed on every run, including three repeats. Cold: failed
  deterministically. Fixed by re-querying inside the `waitFor`. **The integrator
  should clear `apps/storybook/node_modules/.cache/storybook` and run
  `test:stories` once per wave** — a warm cache had been hiding this since wave 6.

### Added by the family O case-story wave (2026-09-06)

The last wave, and the first whose `Mobile` stories move the real viewport
(`page.viewport(375, 812)` from `vitest/browser`, imported dynamically inside the
play — see `story-conventions.md` fact 2). Most of what follows was unreachable
before that one line.

- **Three vendored surfaces were still animating under
  `prefers-reduced-motion: reduce`, and the wave-7 entry above was wrong to
  imply none were left.** `sheet.tsx`'s mobile drawer (panel `0.2s`, backdrop
  `0.15s`, 40px of translate) is the one nothing could see, because the drawer
  branch needs a genuine viewport media query. `sidebar.tsx`'s _desktop_
  collapse (`transition-[width]` on the in-flow gap, `transition-[left,right,width]`
  on the fixed container, 256px of travel) needed no new tooling at all — only a
  story that opened a sidebar under reduce. And `tooltip.tsx` had no branch and
  one consumer that cannot supply one, because the vendored `sidebar.tsx`
  renders its own `<TooltipContent>` for every collapsed rail row with no
  className threaded through. All three fixed in both copies; each guard was
  watched fail on a reverted class first. **`hover-card.tsx` is in the same
  state and was deliberately left**: it has exactly one consumer
  (`citation-ref`) which _can_ reach it, so by this file's own rule the branch
  belongs at that call site, and taking it without writing the assertion would
  be worse than recording it.

- **Guarding a fixed defect usually means rewriting the assertion that found
  it, and three of them were passing green against a fix they could not see.**
  An agent that measures a motion defect naturally asserts
  `transition-duration`; `motion-reduce:transition-none` sets
  `transition-property` to `none` and leaves the duration alone, so those
  assertions kept passing after the repair and would have kept passing after a
  revert. `ChatShell`, `ArtifactShell` (twice) were rewritten to read
  `transition-property`. This is the predictable cost of the record-don't-pin
  rule and it is cheap; the alternative is not recording.

- **The vendored sidebar does not mirror.** Under `dir="rtl"` the in-flow
  `sidebar-gap` follows direction while the `fixed` container is placed by
  `data-[side=left]:left-0` and does not, so a 256px blank strip sits at the
  inline-start edge and the sidebar lies on top of the first 256px of content.
  Measured four times by four shells at two widths (O1 at full width with C3's
  carousel arrow underneath it, O2, O9, O11 at icon width: gap `1152..1200`,
  container `0..48`). Recorded, not fixed — a vendored layout change rather than
  a class swap, and no shell may take it.

- **An invisible tooltip eats the first Escape in the mobile drawer.**
  `sidebar.tsx:546` passes `hidden={state !== "collapsed" || isMobile}` to
  `TooltipContent`, so the popup opens on focus and is merely `hidden` rather
  than unmounted. Measured in sequence by O11: Escape #1 closes a tooltip the
  user cannot see and leaves the drawer open; Escape #2 closes the drawer. Every
  B1 consumer with tooltip rows has this.

- **Two family O shells cannot share a document, for three separate reasons.**
  Each `SidebarInset` renders a `<main>` (`landmark-no-duplicate-main`); two
  shells bring two banners and two identically-named regions
  (`landmark-no-duplicate-banner`, `landmark-unique` twice, measured by O6); and
  two index shells break the heading outline, because O9 emits an `<h1>` while
  O7's first heading is `filter-panel`'s hardcoded `<h3>` with no `<h2>` between
  — O9-first fails `heading-order` outright, and neither component has a
  heading-level prop. O1 turned this into the boundary rule itself — "a shell is
  the page", asserted as `querySelectorAll("main").length === 1` — rather than
  suppressing a rule or inerting one shell, which would trade a duplicate
  landmark for focusable content inside `aria-hidden`. O11 and O12 _can_ share
  one, because O12 renders no `main`.

- **The empty-label gate hole is settled, by probe rather than by argument.**
  Wave 6 recorded that the same empty string is a red gate on one field and
  silent on the next, and this wave produced two competing explanations. A
  five-shape probe story run against the real gate settles it: an empty
  `<label for>` **with a placeholder** is the only shape of five that passes.
  Empty `<label for>` with no placeholder, no label at all, `aria-label=""`, and
  an empty `<label for>` beside `placeholder=""` all fail `label` outright. So
  **the escape hatch is axe's `non-empty-placeholder` check**, O14 `auth-shell`
  and O12 `settings-shell` reached that independently, and O9's proposed
  refinement (`<label for>` versus `aria-label`) was wrong. Say it the way O12
  did: **an empty `<label for>` is worse than none**, because it satisfies the
  rule while the name query stops finding the field.

- **`modality-rail` never narrows — 92px at every width** — so a rail-based
  shell has no narrow layout to swap into, where a B1 sidebar swaps to a drawer.
  Measured by O8 and confirmed by O3 and O4, and only findable with a real
  viewport move. Its stacked label is also 63×0 CSS px with the truncation
  machinery intact inside a zero-height box, which three agents pinned after §8
  had carried it as prose since family O shipped.

- **`shortcuts-sheet`'s scroll-container repair cannot reach the notebook chat
  pane.** O13 reproduced O2's cross-shell measurement of
  `scrollable-region-focusable` (`scrollHeight 1484` against `clientHeight 743`,
  zero focusables) and then established why the standard idiom is unavailable:
  `StickToBottom.Content` renders the scrolling div itself and accepts exactly
  one prop for it, `scrollClassName` — a class, never `tabIndex` or
  `aria-label`, verified in `use-stick-to-bottom@1.1.6`'s own types. Fifth
  instance of the shape, and the first that cannot be fixed the usual way. The
  same dependency springs `scrollTop` in a rAF loop with no `matchMedia`
  anywhere, so its smooth scroll also ignores reduced motion.

- **Activating a real link closes the browser and fails the run.** B3
  `sidebar-nav`'s rows are anchors; `userEvent.click` and Enter both trigger the
  default hash navigation and kill the vitest browser runner ("Was the page
  closed unexpectedly?"). Assigning `location.hash` survives, as does a wrapper
  that cancels the event the way a router would. Now mechanical fact 6.

- **Eleven docs focus bullets said a control paints nothing when it paints the
  user agent's outline**, recoloured by the repo's global `outline-ring/50` —
  thin against the ring-2 its neighbours draw, not absent. Every family O docs
  module carried one. **Two more had a tab order backwards** (O2, O10): both
  said the sequence starts with the sidebar trigger, and in both the rail comes
  first, because the topbar is a DOM sibling _after_ the sidebar. O10's read
  true only because the default `nav` is an L1 with nothing focusable in it —
  which is why a walk with a filled rail is what found it.

- **`model-picker` is the last unnamed `SelectContent` listbox in the
  registry.** O10 named its own and measured the gate first, as this file's
  configuration-dependent note asks: with the name stripped and the popup open,
  axe 4.12 raised nothing, so the story's own assertion is the only thing
  keeping it named — verified by stripping the attribute and watching exactly
  one test fail.

- **The `matchesQuery` divergence is reachable, not theoretical.** O12 measured
  a query that matches only a gated description: B3's badge reads 1, the status
  line reads "1 setting matches across 4 sections", the gated row renders — and
  M1's panel one region up reads "No settings in MCP match this search". Neither
  copy of the predicate can see the other's set. The shell's own constant saying
  to delete its overrides when M1 grows an opt-out is still the right
  instruction, and `KeyboardOrder` now measures the cost: zero tabs, and one
  orphan `tabpanel` announcing as a tab panel with no tab list.

## 9. What each wave found

Moved to [`design-system/wave-history.md`](design-system/wave-history.md), which
is append-only and records how the case-story program's nine waves reached the
current state. Nothing in it is current state: §1 above is, and §8 is the live
backlog.

It was 1,700 of this file's 2,728 lines. Keeping a ledger inside the handoff is
why §1 sat three weeks behind §8 — people enter this file in the middle, and a
header nobody reaches is a header nobody corrects.
