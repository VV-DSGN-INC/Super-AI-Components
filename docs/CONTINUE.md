# CONTINUE HERE — building out the component catalog

A handoff for a fresh session. Read this top to bottom before touching
anything; it is written so you can pick up mid-build without re-deriving what
was already decided.

**Last updated:** 2026-08-15, after wave 0 of the story-guarantees retrofit —
**`contractExempt` has no members left**. The catalog has been complete since
family O's twelve blocks (2026-08-11).

---

## 1. Where things stand

|                 |                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repo            | `VV-DSGN-INC/Super-AI-Components`                                                                                           |
| Branch          | `claude/design-systems-tests-rules-870a35` — the convention PR (§2 of the spec) and wave 0                                   |
| HEAD at handoff | **Wave 0 of the story-guarantees retrofit** — the 25 `contractExempt` items folded into the full contract, the flag at zero  |
| Pushed          | pushed to `origin`, **not merged.** `main` is still at PR #29.                                                               |
| Preview         | Not deployed. Production is behind and serves fewer registry items than this branch builds — see §7.                        |

**Catalog progress: 114 of 114 active items shipped. Nothing is planned.**
11 cut (family G's 10 + O5, per decision D9 — do not revive them).
*(`check:contract` counts **116**, and the two numbers are already reconciled:
the 114 is the frozen A–O count, and family P's 2 are counted alongside it
rather than reopening it — `catalog.manifest.test.ts`'s "holds the A–O freeze
at 114 while family P grows separately" asserts all three figures, which is
what keeps "frozen at 114" a checkable claim rather than a comment. See §5.9.)*

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

Plus one `registry:lib` contract, `cost` — not a catalog item, so not in the
114. See §5.9.

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
P 0/2. The remaining family waves (spec §3.2) are now "shrink the baseline":
a wave writes its stories or skips, then runs `pnpm story-coverage:baseline`
from `apps/docs` to lock the progress in — the script refuses to grow the
file. These figures are derived by that test; recount with it rather than
maintaining them here.

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

**Wave 3 — family F — landed 2026-09-06.** Baseline **490 → 427** (383 case,
44 described). Seven agents, seven items, all at zero unmet. Its findings are
in §8's F subsection and §9's wave 3 entry; the one with the widest reach is
that the focus-ring assertion the convention asks for could not fail, which is
now fixed with a shared helper.

**Wave 2 — families E and P — landed the same day.** Baseline **625 → 490**
(439 case, 51 described). Four of the eleven agents reported normally; the
other seven were killed by a session rate limit *between finishing their work
and verifying it*, and were salvaged rather than re-run — §9's wave 2 entry
carries the salvage procedure, because it will happen again. Remaining, all
case-block debt after wave 3: H 7 · J 7 · K 5 · L 4 · M 4 · N 8 · O 13 = 48
items; recount with the test rather than trusting this line.

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
  hit the residue of sharing — it found port 3000 held by a *sibling* worktree's
  dev server, and its preview reported success while serving another worktree's
  build, so its new routes 404'd with no error anywhere. **If you hand-verify in
  a parallel worktree, take your own port and your own browser tab.**
- **The retrofit was worth doing first.** Twelve shells composed those
  primitives; had `cost-chip` still carried its default, the compensation list
  would have grown rather than gone to zero.

One thing that did *not* work as intended, and will bite the next fan-out the
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
demo does not open a modal on mount". It also failed *differently* per
environment: six locally, four on CI.

Now located by tag: **119/119 pass.**

**It then broke a second time, for a different reason, in this round.** A bare
`h1` tag locator started matching *two* elements once family O landed: a block
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
  `playwright.config.ts` runs `pnpm start` — `next start` serves the *prebuilt*
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
the a11y gate only under its *own* story name — so any component that renders
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
visual half `aria-hidden` and put the *complete* phrase in the sr-only span.

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
indeterminate indicator *no width*, so `<Progress value={null}>` renders an
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
branches on the method's *existence*, not its return value, so the two-line
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
run, and the flip tracked *what else was in the same vitest invocation*, not
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

   The rest stands. All five *other* missing entries were written on 2026-08-04
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
7. **The 14 legacy components are still `contractExempt`** — no per-state
   stories, no guidance modules, and `entity-row` has a confirmed contrast
   failure. The retrofit is unscheduled.
8. **T14, the `/roadmap` page, was specced but never built.** The site still
   shows no roadmap, so "56 of 114" is invisible to a visitor.

9. **SHIPPED — but family E still needs retrofitting to it.** The `cost`
   module now exists at `registry/super-ai/cost.tsx` as the registry's first
   `registry:lib` item, exporting `Cost`, `CostProvider`, `useCost`,
   `formatCost`, `formatShortfall` and `GenerationState`. F1 already takes its
   lifecycle union from it.

   **What is still outstanding is the retrofit the spec called for**, none of
   which is done: E5 `run-button` and E7 `member-gate-row` are the two cost
   placements and still do not call `useCost`, so the rule that `insufficient`
   is *derived* and never accepted as a prop is unenforced where it matters
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
    same thing, which is what D3 means by *"promote shared pieces to L2 rather
    than importing sideways"*. None is broken; all three are correct-but-
    duplicated, and were deliberately left for a dedicated pass rather than
    stalling the build queue.

    | Shared piece | Found by | Current state |
    | --- | --- | --- |
    | Timeline coordinates — `timeToPixels`, `pixelsToTime`, `snapTime` | H2 / H3 / H6 | H2 exports them and calls them "the coordinate model H3 shares"; H3 built its own from `duration × pixelsPerSecond`; H6 has a third. **Two implementations of the same math, and H2's spec requires the playhead to span every track — which is only true if they agree.** |
    | The action row — A9 + A2 trailing chip + locked treatment + menu/inline split | F4 / I4 | I4 established it cannot *compose* F4 (F4's root owns the `DropdownMenu`, so composing per-group yields N menus where I4 needs one). It mirrored the shape instead and documented it. |
    | `ParameterSlider` — A6 `field-row` + a slider with a real accessible name | E3 / I5 | I5 imports it from E3 — an L3→L3 sideways import across families, which is precisely what D3 forbids. It should be an L2 primitive. |
    | The four-verb approval row | F7 / I4 / K1 | **Now a third instance.** K1 `ai-doc-block` could not compose F7 `approval-card` — F7's root *is* a `Card` carrying its own title/summary/undo model, so nesting it would invert the relationship (the block is the thing being approved, not a payload inside an approval surface) and double the frame. K1 copied the *rule* — a fixed `VERBS` array whose order the component owns — with prose labels. Lifting the verb row out of F7 into a shared primitive is the fix all three want. |

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
- **Carousel arrows positioned outside their own box** (`-left-12`/`-right-12`):
  C3 `feature-card-row` (O1, O13) and H5 `frame-strip` (O3). In any constrained
  column they are clipped, or they turn the page into a horizontal scroller.
  O1 measured 407px of content in a 375px column, all of it the arrow.
- **Grid columns keyed off the viewport rather than the container**: J4
  `artifact-grid` (O9) and C4 `recent-grid` (O1). Every shell that puts a grid
  beside a sidebar has to shift each breakpoint up a step by hand.

**Missing opt-outs — a component that always renders its own chrome cannot be
composed into a surface that already has that chrome:**

- **L6 `onboarding-wizard`** always draws a progress rail and Back/Skip footer,
  so O14's single-step sign-in had to suppress three dead buttons. Wants
  `progress={false}` / `nav={false}`.
- **M1 `settings-dialog`** renders its own nav *and* search, both of which O12
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
  the base/variant pairing correctly. It is *found and downgraded to a warning* because the file
  is vendored. Our two default-variant call sites now rebind
  `--muted-foreground`; the vendored default remains unsafe for consumers who
  compose a stock `TabsList`, recorded in `vendored-token-findings.md`.

**One infrastructure fix worth doing before the next fan-out:** Base UI's
`ScrollArea` (under C2 `suggestion-chips`) schedules a timer calling
`getAnimations()`, which jsdom lacks — it throws *after* the triggering test
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

  | component | site | swap |
  | --- | --- | --- |
  | `citation-ref.tsx:46` | marker | `ml-0.5` → `ms-0.5` |
  | `safety-block.tsx:95` | quoted fragment | `border-l-2 pl-2` → `border-s-2 ps-2` |
  | `credits-indicator.tsx:114` | detail link | `border-l` → `border-s`, `pl-1.5` → `ps-1.5`, `-mr-1` → `-me-1` |
  | `source-cards.tsx:100` | title button | `text-left` → `text-start` |
  | `explore-gallery.tsx:418` | facet count | `ml-1.5` → `ms-1.5` |
  | `artifact-grid.tsx:272` | count badge | `ml-1.5` → `ms-1.5` |
  | `preview-tile.tsx:150` | badge slot | `right-2` → `end-2` (added 2026-09-05, flagged independently by two D/I agents) |

  **Changes that are *not* byte-identical stay open decisions, and must not be
  swept in with the above.** Two of them:

  - **N11 `escalation-handoff`'s `ArrowRight` does not mirror** (line 115).
    Fixing it means `rtl:-scale-x-100`, which appears nowhere in the registry
    and *is* a visible change — a new idiom for mirroring icons, and one worth
    choosing deliberately rather than as a side effect of a whitespace sweep.
  - **`kbd`'s `KbdGroup` has no `dir="ltr"` pin, and this one is a real bug.**
    `KbdGroup` is a plain `inline-flex` row, so under `dir="rtl"` a chord
    reverses with its container: `⌘ ⇧ Z` paints as `Z ⇧ ⌘`. Chords are written
    modifier-first in every locale, so the RTL rendering is *a different
    instruction that still looks correct* — the worst failure shape available,
    because nothing about it reads as broken. Found independently by two
    agents (`shortcuts-sheet`, which records it as a pitfall, and the
    logical-properties pass). The fix belongs in the `kbd` primitive, and it
    is a behaviour change rather than a compile-identical swap, which is why
    it is here and not in the table.

- **Duplicate accessible names on repeated per-item controls — six instances,
  and no gate can see any of them.** A component that renders one control per
  row, and gives that control a *constant* name, produces N identically-named
  buttons in a list of N. The screen-reader element list a user navigates by
  reads "Reset, Reset, Reset"; the row each one acts on exists only in the
  visual adjacency. **This is the category, not six separate bugs:**

  | component | the name | why it repeats |
  | --- | --- | --- |
  | A2 `thread-list` | `"Thread actions"` | ~~constant~~ **fixed 2026-08-15** — now `Thread actions for ${title}` |
  | `stat-readout` | `"Copy"` | private `CopyButton` takes `value` only, never `item.label` |
  | `autonomy-selector` | `"Revoke"` | visible button text, no `aria-label`; per grant row |
  | A11 `reset-affordance` | `"Reset"` | `label` prop defaults to the bare word; three untouched fields announce alike |
  | A5 `filter-bar` | `"Remove filter"` | `label` is derived as `typeof children === "string" ? children : ""`, so any chip with an icon child collapses to the generic name |
  | A8 `preview-tile` | *(none)* | worse shape of the same defect — the frame button is named only when `labelPlacement === "overlay"`; `below`/`none` ship a nameless button (already recorded above under the family O list) |

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
  the claims. There is no way to express *generation stopped* or *retrieval
  errored* — an answer that failed halfway renders as a partially-cited answer
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

  | scope | undocumented declared-state exports | files |
  | --- | --- | --- |
  | the 25 wave-0 components | **23** | 5 — `task-tray` 6, `source-cards` 5, `stat-readout` 4, `section-header` 4, `credits-indicator` 4 |
  | the whole registry | **202** | 50 |

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
in-wave (spec §3.4) and are listed under §9's wave 1 entry; these are the gaps
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
  learn about RTL.** `CompositeRoot` reads `useDirection()`, which falls back
  to `"ltr"` without a provider, and `dir="rtl"` on a wrapper is invisible to
  React context. Measured on `mode-tabs`: under `dir="rtl"`, ArrowRight
  advances in DOM order, which paints to the left. `account-menu` records the
  same root cause for popup side resolution. The fix is one provider at the app
  shell (or the primitive reading `dir`) — a shell-level decision, recorded,
  not made here.
- **The vendored `Button` moves on press with no reduced-motion branch.**
  `components/ui/button.tsx` carries `transition-all` and
  `active:not-aria-[haspopup]:translate-y-px`, so every button in the registry
  nudges a pixel while pressed under `prefers-reduced-motion: reduce`. Found
  independently by the `quote-reply` and `media-prompt-bar` agents. It is the
  `transition-all` blocker the token gate downgrades to a warning for vendored
  files (`vendored-token-findings.md`) — a primitive-wide posture, not any one
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
  `onMove(id, "left")`, meaning "toward index 0" — which renders on the *right*
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
  edges and `border-l-0` strips the border from the group's *outer* edge while
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
  surface that lands under the 4.5:1 minimum; the *selected* tab's badge
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
  the two *announce* alike; the visual collapse is new. Both are rendered side
  by side in `preset-grid`'s `ReducedMotion`, and nothing asserts they are
  distinguishable.

- **Three more components hold state a host cannot reach.** E4 `preset-grid`'s
  see-more expansion is internal, one-way and never reset, so a host swapping
  `items` on a mounted grid — the natural move, since four content types are one
  component — carries the old expansion in and `visibleCount` is ignored from
  then on. E1 `generation-panel` exposes no
  `openSections`/`onSectionOpenChange` at all, one step past I2's
  after-the-fact callback. E8 `generation-wizard` focuses its step title on
  *any* change of the active step except the first render, so a host restoring
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
  and alpha, "every stop shows a ring" means "every stop has *something* in
  those two properties".

### Added by the F case-story wave (2026-09-06)

- **The focus-ring assertion could not fail, and that is now fixed.** Four
  agents across three waves reached the same finding independently, and between
  them they measured the whole mechanism. A Tailwind `ring-*` utility composes
  shadow layers that are *always present*, reading
  `rgba(0, 0, 0, 0) 0px 0px 0px 0px` when the ring is off — not the string
  `"none"`, so `boxShadow !== "none"` passes on an element painting nothing.
  `focus-visible:outline-none` leaves `outline-width` at its used value while
  `outline-style` reads `none`, so a width-based check has the same hole. And
  the vendored `Button`'s `transition-all` *fades the ring in*, so an immediate
  read on a control that does paint one is a false negative — the same element
  reads transparent and zero-sized on the frame focus lands and
  `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` at 250ms. F5's agent put it best:
  this is the default reading for every shadcn-v4 control in the registry, not
  a quirk of two components. `apps/storybook/src/lib/focus-ring.ts` now checks
  the layers for non-zero alpha *and* non-zero geometry and waits for them to
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
  `right-2` *and* the wipe clip is `clipPath: inset(0 0 0 N%)`, which is
  physical and has no logical form. The badges pair with the content today
  because both halves are physical, so swapping only the classes would put each
  number over the other pane's picture — a class-only swap makes RTL worse. The
  same shape, resolved the other way, is F1/A8's corner pair: there both halves
  *were* classes, so the integrator swapped them together (a half-swap would
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
  under a *sibling* worktree, which means a docs lint error in an agent's
  worktree can be masked by another worktree's cache. Verify a lint result in
  the integration tree, not in an agent's.

## 9. Gaps found by the case-story pilot

Three components (`suggestion-chips`, `generation-queue`, `empty-state`) were
given the case-story block defined in
[`story-conventions.md`](design-system/story-conventions.md). The convention was
adopted on the strength of what one afternoon of it turned up. Same provenance
rule as §8: each item was found by someone writing a story who could not write
it honestly without noticing.

**Fixed on the pilot branch:**

- **N10 `safety-block` shipped a 4.33:1 contrast failure.** Its root paints
  `bg-destructive/5` (#fef2f3) and the vendored `AlertDescription` child carries
  its own `text-muted-foreground` (#737373). This is the *cross-component* shape
  `check:tokens` documents that it cannot see, and it had never been caught
  because the component has no story. Fixed with the house idiom — rebinding
  `[--muted-foreground:var(--accent-foreground)]` on the surface-painting root,
  which reaches the composed children a slot-level `className` cannot. Found by
  L1 `empty-state`'s `Boundary` story, which renders `safety-block` as a
  neighbour.

**Open, and the largest of the three:**

- **11 of the 25 shipped `contractExempt` components have no story file at
  all**, so they have never been rendered under axe: `slot-summary`,
  `citation-ref`, `answer-block`, `source-cards`, `credits-indicator`,
  `quota-meter`, `pricing-table`, `autonomy-selector`, `safety-block`,
  `escalation-handoff`, `task-tray`. The cause is mechanical:
  `check-contract.mts` does `if (item.contractExempt) { exempt++; continue; }`
  *before* the story-existence assertion, so the exemption silently covers the
  story file too, not only the per-state and docs assertions it is documented to
  cover. `safety-block` is the proof this is not theoretical — one of the eleven,
  carrying a real contrast bug, for as long as it has shipped. **Requiring a
  story file (not per-state stories) from exempt items would be a small change
  to the gate and would put eleven components under axe for the first time.**

- **14 of the 17 components that animate ignore `prefers-reduced-motion`.**
  `motion-reduce:` appears in `citation-ref`, `task-tray` and `trace-timeline`
  only. The other fourteen — including `generation-queue` and `render-queue`,
  which are `task-tray`'s own near-twins and use the identical lucide spinner —
  write a bare `animate-spin`/`animate-pulse`. So the convention exists and was
  then lost, which makes this drift rather than an open question. Nothing in the
  pipeline sees it: `check:tokens` reads colour, and axe does not evaluate the
  media feature at all. The fix is one class per site — **but see the correction
  immediately below before applying it to a dialog, popover or sheet.**

- **Correction (2026-08-15): "one class per site" is wrong on a Base UI popup
  surface, and the earlier sentence should not be applied there.** The
  prescription above is written for the shape it was found in — a lucide
  spinner carrying a plain `animate-spin`. It does not hold where the animating
  element is a Base UI popup, and anyone who applied it to a dialog, popover or
  hover-card fixed nothing and has no way to tell. The mechanism, measured on
  `shortcuts-sheet` while writing its `ReducedMotion` story:

  `dialog`, `alert-dialog`, `popover`, `tooltip`, `hover-card`,
  `dropdown-menu` and `select` animate through `data-open:animate-in` /
  `data-closed:animate-out`. Tailwind v4 compiles that to
  `.data-open\:animate-in:where([data-open]:not([data-open=false]))` — the
  attribute test sits inside `:where()`, which contributes **no** specificity,
  so it and `.motion-reduce\:animate-none` are both a single class and the tie
  falls to source order. Tailwind emits the plain `motion-reduce:` block well
  before the `data-*` variants (offsets 112494 vs 124370 in the current docs
  CSS chunk), so `animation: enter` wins and `animation-name` reads back
  `"enter"` under emulated reduce. The remedy is to restate the variant on both
  halves — `motion-reduce:data-open:animate-none
  motion-reduce:data-closed:animate-none` — which sorts *after* its counterpart
  and wins the same tie. `sheet` is a third case: it animates by transition
  (`data-starting-style` / `data-ending-style`), so
  `motion-reduce:transition-none` is what suppresses it.

  **Surveyed, and the honest answer is that no shipped branch is inert today.**
  Every bare `motion-reduce:animate-none` in `registry/super-ai/` sits on a
  plain `animate-spin`/`animate-pulse`, where the same source order works in
  its favour: K6 `citation-ref` (`animate-pulse` on the marker, which is the
  hover-card *trigger*, not its surface), A8 `preview-tile` (skeleton),
  `task-tray` and `trace-timeline` (both lucide spinners). All four work.

  What the finding costs is the *remainder* of the backlog above. These 33
  registry components render a keyframe-animating popup surface, none of them
  suppresses it, and each is a site where the plain remedy would be inert:
  `account-menu`, `action-stack`, `ai-tools-menu`, `asset-detail`,
  `asset-library`, `citation-ref`, `coach-mark`, `context-toolbar`,
  `detail-view-shell`, `docs-shell`, `drawing-tools`, `feature-announcement`,
  `feedback`, `hero-omnibox`, `inline-generate-popup`, `modality-rail`,
  `mode-tabs`, `model-picker`, `permission-prompt`, `recommendation-card`,
  `record-list`, `records-shell`, `selection-toolbar`, `settings-dialog`,
  `template-detail`, `thread-list`, `transport-controls`, `trust-dialog`,
  `tts-composer`, `usage-dashboard`, `voice-clone-recorder`, `whats-new`,
  `workspace-switcher`, plus `task-tray` on the transition path. Only
  `shortcuts-sheet` has the working form. Not fixed here — that is a follow-up
  wave, and the point of this entry is that the list is accurate before anyone
  starts it. The idiom is written up in
  [`story-conventions.md`](design-system/story-conventions.md), mechanical
  fact 3.

- **E6 `generation-queue` does not manage focus when a row resolves.** A row's
  Cancel button unmounts as it transitions to done/failed/cancelled, and nothing
  moves focus, so a keyboard user cancelling the second of three rows loses
  their place. Deliberately *not* pinned by the `KeyboardOrder` play function —
  asserting the current behaviour would make the bug permanent. Recorded in that
  story's description.

The convention became a program on 2026-08-14: eight names (`Controlled`
joined), manifest-shape rules, and a retrofit —
`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md` — and
a shrink-only ratchet on 2026-09-04 (§1).

### Wave 0 — the 25 `contractExempt` items (2026-08-15)

Two batches, one agent per component, every manifest edit made centrally (§3.2).
**Batch A** took the 11 with no story file — the largest of the pilot's three
open items above, now closed: all 11 were rendered under axe for the first time.
**Batch B** took the other 14, **every one of which exported `Default`**, the one
name the house rule forbids; all 14 are gone, each renamed to the state it was
actually rendering or split into the states it conflated. Each of the 25 got the
full fold-in — states normalized and declared, one story per declared state,
case stories, a docs module, the flag dropped. `contractExempt` reached zero
(§1).

What it found:

- **Fifteen declared states across the 25 name behaviour no component
  implements.** Ten of batch B's 14 needed real normalization before a single
  story per state could be written, and the retrofit turned into an audit of
  `catalog.md`'s states column — which is normative prose, not a hint. A7
  `gen-settings-bar` declares `inline · compact · node-docked` and implements
  none of the three; the last names the node builder **D9 cut**. Absent for the
  same reason: A5 `filter-bar`'s overflow count and clear-all, A3
  `date-section`'s with/without count and collapsible, L5 `shortcuts-sheet`'s
  `searchable` and its controls-primer variant, A2 `cost-chip`'s
  estimate/confirmed/insufficient, and K6 `citation-ref`'s "copy quote" (filed
  separately in §8). One is factually **wrong** rather than absent: A10
  `stat-readout`'s "inline rows" describes `columns={1}`, which sets
  `grid-cols-1` and therefore stacks label *above* value — the inline form is
  `columns={2}`. B6 `thread-list`'s `running` is removed outright; the spec's
  status slot was never built. **The mechanism is the finding.** Nobody had ever
  written one story per declared state for these components, because an exempt
  component was not required to have a story at all — so nothing had ever
  compared the column to the code.

- **Two components ship colourless to consumers.** M6 `rate-limit-banner` paints
  `border-warning/40 bg-warning/5`, and P1 `data-views` paints
  `bg-warning text-warning-foreground` through `data-views-shared.tsx`. Neither
  declares `cssVars`, so `shadcn add` installs them without the token and the
  surface arrives unpainted in a consumer's app. This is a
  registry-is-the-product bug and it is **distinct from** the Storybook
  `--warning` gate hole recorded in §8 — the six components carrying
  `WARNING_CSS_VARS` are wrong only under the axe gate; these two are wrong
  wherever they are installed. Found by the audit of that hole, recorded beside
  it, not fixed.

- **A keyboard-help panel was unusable by keyboard.** L5 `shortcuts-sheet`'s
  section list scrolls once the sections pass its 80vh cap, and the scroll
  container was not focusable — axe `scrollable-region-focusable`, whose real
  consequence is that a keyboard user opens a 60-binding shortcuts panel and can
  read only the first screenful. **Fixed in-wave**, then corrected in review: the
  first fix put `tabIndex` and `aria-label` on a bare `<div>`, which is
  `role="generic"`, where ARIA prohibits `aria-label`. The tab stop was real and
  did clear the axe rule, but it arrived anonymous. It is now a `<section>` named
  for its contents, and the story asserts the name *through* the role — the only
  form that catches the original failure.

- **A disabled filter chip can still be deleted.** A5 `filter-bar`'s
  `FilterChip` spreads `...props` onto its toggle button, so `disabled` reaches
  the toggle only; the remove button is a sibling built from `onRemove` alone and
  never sees it. A facet you cannot turn off, you can still delete — by mouse or
  by Tab. A caller has to withhold `onRemove` in the same breath. (Milder, same
  site: nothing in `filter-bar.tsx` styles the disabled path at all, and these
  are unstyled `<button>`s with explicit colour classes, so the UA greying never
  applies — a locked chip is pixel-identical to a live one.) Recorded in the
  `Disabled` story, **not fixed**: what `disabled` means on a composite chip is
  an API decision.

- **`kbd` renders chords backwards under RTL.** `KbdGroup` is a bare
  `inline-flex` with no direction pin, so `⌘ ⇧ Z` paints as `Z ⇧ ⌘` under
  `dir="rtl"` — *a different instruction that still looks correct*, which is the
  worst failure shape available, because nothing about it reads as broken. Found
  independently by two of the wave's agents. **Not fixed**: the pin belongs in
  the `kbd` primitive and is a behaviour change rather than a compile-identical
  swap. Full entry in §8, under logical properties.

**Two defects the wave's own review caught — the program's quality evidence, and
the reason a retrofit wave gets reviewed rather than merged on green.** Both were
`KeyboardOrder` play functions that pinned the exact defect their own JSDoc
documented: green today, **red the moment someone fixed it**. That is the one
move `story-conventions.md` forbids outright, and neither would have been caught
by any gate — a pinned bug passes.

- **M4 `pricing-table`** asserted which element each tab landed on. The same
  story records that its `role="radiogroup"` has no roving tabindex; implementing
  that gives the unchecked radio `tabindex="-1"`, the second tab skips it, and
  the test goes red on the fix. Rewritten on `autonomy-selector`'s shape, which
  asserts invariants that hold both today and under APG: the checked radio is
  tabbable, the controls outside the group are each independently tabbable, plus
  containment, ring and no-trap — with the expected stop count derived from live
  DOM `tabindex` rather than hardcoded.
- **A7 `gen-settings-bar`** asserted that Tab visits all five toolbar segments in
  DOM order — the exact traversal its `role="toolbar"` contradicts. Its JSDoc
  argued the pin was a *feature* ("this story is what notices"), which is
  precisely the inversion the convention warns about. Rewritten on
  `choice-chips`' pattern, which carries the identical defect and asserts only
  that the stops exist and each shows a ring. `pricing-table`'s DOM-derived bound
  was considered and rejected for this shape: nothing here sets `tabindex` at
  all, so the derivation reduces to counting the buttons — the same claim wearing
  a disguise.

**What wave 0 closed from the list above:** the 11-with-no-story item, outright.
The reduced-motion backlog moved from three branching components to seven —
`choice-chips`, `preview-tile`, `pricing-table` and `shortcuts-sheet` gained
branches — and `shortcuts-sheet` is what produced the Base UI popup correction
recorded above. `generation-queue`'s focus-loss finding is untouched and stays
open. The remaining ~91 items are spec §3.2's family waves; the gate is §4.

### Wave 1 — families D and I (2026-09-05)

Eleven agents, one per item, each in its own worktree cut from `origin/main` and
fast-forwarded to the integration branch as step 0 of the brief (the base-commit
trap from §1, handled rather than re-hit). All eleven reached zero unmet
obligations: 88 case obligations and 28 descriptions resolved, the baseline
regenerated once at the end. Brief and integrator procedure:
[`superpowers/plans/2026-09-05-case-story-family-waves.md`](superpowers/plans/2026-09-05-case-story-family-waves.md).

**Skips versus writes.** 11 `case-skip` lines across six files (`quote-reply`
3, `property-inspector` 2, `context-chips` 2, `skill-menu` 2,
`media-prompt-bar` 1, `ai-tools-menu` 1) and five files with all eight written
(`reference-strip`, `mode-tabs`, `context-toolbar`, `tool-panel`,
`drawing-tools`). Every skip is one of three shapes: `Controlled` where no
value/onChange pair exists (six items — `onSelect`/`onRemove`/`onAction`
report an intent and carry no value), `ReducedMotion` where nothing moves or
only a colour crossfades (four), and `EmptyLabel` where the only optional text
slot is a defaulted label whose empty case would ship a `button-name` violation
into the gate (two). `Controlled` was skipped *against* the steering on
`property-inspector`, correctly: its `onSectionOpenChange` fires after the
section has already moved, so it is half a controlled pair and a host cannot
refuse; the reasoning is in the skip block.

**Mechanical fixes landed in-wave (seven source files):**

- Reduced-motion pairs restated on Base UI popups, each measured
  (`animationName` "enter" → "none" under emulated reduce): `mode-tabs`
  (tooltip), `context-toolbar` (tooltip, menu, popover), `ai-tools-menu`
  (menu), `drawing-tools` (popover). Four more off §8's 33-item list.
- Logical-property swaps, byte-identical in LTR: `context-chips`
  (`pl-2`/`pr-1`/`pr-2`/`ml-0.5` → `ps`/`pe`/`ms`), `skill-menu` (`border-r` →
  `border-e`), `tool-panel` (`left-2.5` → `start-2.5`, `pl-8` → `ps-8`,
  `text-left` → `text-start`), `drawing-tools` (`text-left` → `text-start`).
  `left-` → `start-` is not one of the four swaps §8's sweep entry enumerates;
  it was taken because it meets that entry's own test, and because swapping
  only the gutter would have left icon and gutter on opposite sides.
- `aria-label` on two unnamed `PopoverContent`s (`context-toolbar`,
  `drawing-tools`) — the one fix outside §3.4's literal list, accepted because
  it is a one-attribute drift correction with an in-repo idiom
  (`modality-rail`) and the alternative was leaving the popover closed so the
  gate stayed quiet. §8 has the general finding.

**Recorded, never pinned** — every play function in the wave stops short of
the defect its description names:

- Focus lost on removal or dismissal: `quote-reply` and `context-chips` (the
  remove control is the only focusable a chip owns), `reference-strip` (the
  last enabled Move disables itself under the cursor), plus the two
  `media-prompt-bar` behaviours its docs module already carried.
- No visible focus treatment: `media-prompt-bar`'s two textareas
  (`border-none focus-visible:ring-0`, no container `focus-within`);
  `skill-menu`'s search field (`InputGroup` keys its ring off
  `has-[[data-slot=input-group-control]:focus-visible]`, but cmdk's input sets
  `data-slot="command-input"`, so the selector never matches); `ai-tools-menu`'s
  menu rows (§8).
- `mode-tabs`: Tab lands on the first mode, not the active one (as
  `modality-rail` records on the same primitive); five modes with icons measure
  422px in a 375px column with no overflow handling, so the fifth is off-column
  with nothing saying it exists.
- `context-chips`: mention labels reorder under RTL (`@teammate` paints
  `teammate@` — the `@` is a neutral with no Latin before it), fix is
  `dir="ltr"` on the label; no `title` on the `max-w-40` truncated label.
- `quote-reply`: `<cite>` interpolates a caller-supplied `anchor` with no
  `<bdi>` isolation, so a mixed-script anchor reorders around the `·`.
- `reference-strip`: inherits C3's three RTL findings (Embla `direction` never
  set, physical `-ml-4`/`pl-4` gutter, previous/next on the wrong sides);
  Embla's JS tween has no reduced-motion branch; the empty slot still carries
  `aria-pressed` from `preview-tile`'s default `selectMode="toggle"`.
- `property-inspector`: a long value scrolls inside the fixed `w-20`
  `UnitInput` and loses its leading digits — 1920000 reads as a smaller number,
  not a clipped one.
- `drawing-tools`: long alternate labels spill (`toggleVariants`' base
  `whitespace-nowrap` plus a fixed `h-8`, the B4 trap again).
- `ai-tools-menu`: no `open`/`onOpenChange`, so a host cannot close the menu
  when the selection changes behind it.

**Spec and docs drift found by writing stories:**

- `component-specs.md` D3 lists `resolved · resolving · unresolved`; the
  component and manifest have no `resolving` state. Same class as wave 0's
  "declared states name behaviour no component implements".
- D6 `skill-menu`'s spec says search filters titles *and* descriptions;
  `CommandItem` gets `value={skill.id}` with the description as its only
  `keywords`, so a title-only skill is findable by nothing the user can see.
  `Search`'s play asserts only the honoured half.
- Three docs corrections made centrally in the integration commit:
  `skill-menu.docs.tsx`'s second "do" told callers to override `cost-chip`'s
  `text-muted-foreground`, which the chip stopped shipping in the A retrofit;
  `drawing-tools.docs.tsx`'s keyboard note counted ten stops where roving
  tabindex makes five; and a stale comment in `ai-tools-menu.tsx`'s `ToolCost`
  described the same deleted override.
- `choice-chips`' `Boundary` one-liner ("if a chip can be removed, it is a
  filter chip") is one line short — context chips are removable too.

**Idiom hardening.** `ai-tools-menu`'s `KeyboardOrder` passed 13 warm runs and
failed the first run against a cleared Storybook cache: a key press read before
it applied leaves focus on the *previous* stop, which is itself an expected
stop, so the "settle until focus is on some expected stop" wait cannot see it.
The tightened form waits for focus to *leave* the previous stop before reading.
Recorded in `story-conventions.md` fact 4; `TaskTray` and `ShortcutsSheet`
still use the arrival form.

**Steering that did not bind** — for the next wave's prompts: `quote-reply`
has no `border-l`/`pl-` quote bar (it is icon + `gap-2`), so the predicted swap
did not exist; `property-inspector` is not controlled; `context-toolbar` needed
no frame/group/camera variant; `tool-panel`'s tabs contrast concern does not
apply (`variant="line"`, `text-foreground/60` at TOK-8's floor). One agent also
reported a repo-root `pnpm lint` cache hit whose output named a sibling agent
worktree's paths; `turbo.json` configures no shared cache dir, so the mechanism
is unconfirmed — noted here rather than in §4 until it bites again.

### Wave 2 — families E and P (2026-09-05)

Eleven agents, same shape as wave 1. All eleven reached zero unmet obligations
and families E and P are complete, but only four reported: **the other seven
were killed by a session rate limit in the window between finishing their work
and verifying it.** That window is the interesting part, because the work was
not lost — and the recovery is worth writing down, since the next long wave will
hit the same wall.

**The salvage procedure.** A killed agent's worktree survives with its working
tree intact. Every one of the seven had fast-forwarded correctly (step 0 of the
brief) and left a complete, uncommitted tree. So:

1. `git -C <agent worktree> diff > patch` for each, then `git apply --check`
   every patch against the integration branch before applying any. All seven
   applied clean, because each wave agent writes only its own files.
2. Read every registry-source hunk before adopting it. Seven of the seven were
   the sanctioned shapes, so nothing needed rejecting — but the review is the
   point, not a formality: nobody had verified this code.
3. Run `pnpm story-coverage:report <the whole list>`. All seven printed zero
   unmet, which is what established the work was finished rather than
   abandoned mid-file — including the one whose last words were "now the story
   file, writing it in full".
4. Run the story files. **Five passed as delivered. The two that had never been
   run once both failed**, which is the lesson: an unverified story file is not
   evidence of anything, and the two failures were of completely different
   kinds (see below).
5. Commit as one reviewed change rather than seven forged agent commits, and
   say in the message that the verification was done centrally.

**What the two unverified files were hiding.**

- **P1 `data-views` had a real defect and two false assertions.** The defect:
  the kanban board's scroll container was a bare `<div class="overflow-x-auto">`
  with no keyboard access — axe `scrollable-region-focusable`, the same rule
  L5 `shortcuts-sheet` failed in wave 0, and with the same consequence, that a
  keyboard user reaches the first columns of a board and no further. It is
  invisible at desktop width because nothing overflows there; the `Mobile`
  story is the only reason it was found. Fixed with that wave-0 idiom exactly:
  a `<section>` rather than a `<div>` (a bare div is `role="generic"`, where
  ARIA prohibits `aria-label`, so the tab stop would arrive anonymous),
  `tabIndex={0}`, a name for its contents, and a focus ring.

  The two false assertions are the more useful half, because **both were
  written from reading the source rather than running it, and both read
  perfectly.** One asserted that a group with an empty label "still announces
  its count and its tone", reasoning correctly about `groupAccessibleName` and
  never noticing that `feed-view.tsx` guards the whole header on
  `section.label ?` so the function is never called. The other asserted that a
  long title wraps in a table cell and grows the row — true in principle, false
  at the width the gate runs, where the title column takes 974px of a 1200px
  table and absorbs it on one line. Both descriptions asserted the same wrong
  things in prose. Rewritten against measurements, with the measurements in the
  descriptions.

- **P2 `detail-view-shell` failed on its own debugging probes**, left behind
  mid-run: two `expect(...).toBe("PROBE")` calls whose whole purpose was to
  print measurements into a failure message. Deleting them restored the real
  assertions underneath, which pass. One probe was worth keeping the output of
  — the 4.34:1 badge contrast now recorded in §8.

**The general lesson, and it is not about rate limits.** A story file that has
never been executed is a draft, however good it looks; two of two unverified
files failed, and the failures were a live accessibility defect and two
confidently-argued untruths. The convention already says a story earns its place
by being the only place a fact exists — this wave adds that **a fact nobody ran
is not yet a fact.**

**Also worth carrying forward:** `layout: "centered"` in a meta wraps every
story, so `canvasElement.firstElementChild` is the ~1200px centring div rather
than the story's own frame — a `Mobile` overflow assertion against it measures
the wrapper and passes for the wrong reason. Give the frame a `data-testid`.
Found on E7 `member-gate-row`; it will bite the next `Mobile` author.

### Wave 3 — family F (2026-09-06)

Seven agents, seven items, all at zero unmet, and no rate-limit casualties —
the batch was deliberately smaller than the eleven that hit the session wall in
wave 2. Six of the seven wrote all eight case stories with no skips at all,
which is worth noting against the D/I wave's eleven `case-skip` lines: family F
is result surfaces, and a result surface genuinely meets every one of the eight
situations.

**Fixed in-wave:** reduced-motion branches on F3 `asset-detail`'s dialog (the
fifth popup family off §8's list), F6 `render-queue`'s streaming spinner, F7
`approval-card`'s chevron *and* its Confirm spinner, and F4 `action-stack`'s
menu popup. F4's measurement is the one that generalises: suppressing the popup
animation changed `animation-name` from `enter` to `none` **and** the popup's
width from 304px to 320px, because `data-open:animate-in` composes `zoom-in-95`
— the popup was arriving at 95% and growing, so this is real motion rather than
a fade. That agent also stated the rule the whole program had been circling:
the animation classes live on the vendored primitive, but the suppression has
to be restated per call site, **so fixing one consumer fixes none of the
others.**

**Which is how a false skip surfaced.** Acting on that rule, the integrator
swept the registry for `DropdownMenuContent` call sites without the pair and
found four. Three belong to families J and K and were left to their waves. The
fourth was B6 `thread-list`, whose `ReducedMotion` skip read "nothing this
component owns animates", on the grounds that the motion belonged to the
vendored popups and was therefore upstream — a reasonable position when it was
written and wrong under the per-call-site rule, since the component renders both
a dropdown menu and a delete confirmation and both animated. **Family B had no
case-story debt at adoption, so no later wave was going to reopen that file.**
Both surfaces now carry the pair and the skip is a real story that reads
`animationName` back on each. A skip is the one part of this convention with no
gate behind it: `story-coverage` checks that a reason exists, never that it is
true.

**Two integrator fixes an agent correctly declined to make.** F1's agent found
that A8 `preview-tile` owns the badge at `right-2` while F1 `result-card` owns
the select checkbox and hover actions at `left-2`, so swapping either alone
stacks both occupants on one edge — and it may not edit A8. It wrote an RTL
assertion that fails on a half-swap and passes on a full one, then left both.
Done centrally, with all eight `preview-tile` consumers re-run. F5's agent
declined the *same* swap for the opposite reason and was equally right: its wipe
clip is `clipPath: inset(...)`, physical with no logical form, so a class-only
swap would put each pane number over the other pane's picture. §8 carries the
rule the pair gives.

**A claim that was checked and refuted.** F6's report stated that transition
assertions are vacuous in this gate — that the browser runner injects
`*, ::before, ::after { transition-property: none }`, defeating every Tailwind
`transition-*`, and that wave 2's `run-button` assertion therefore passes with
or without the fix it was written to prove. Measured directly: a plain vendored
`Button` computes `transition-property: all` at `0.15s`, and sweeping every
stylesheet in the document finds exactly one `transition-property: none` —
Tailwind's own `.transition-none` utility definition. There is no global
suppressor, F7's independent measurement agrees, and the transition assertions
written in waves 2 and 3 are real. Recorded because a plausible, specific,
wrong claim in an otherwise excellent report is exactly what gets repeated.
