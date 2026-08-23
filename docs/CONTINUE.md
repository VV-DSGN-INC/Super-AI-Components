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

**What is not done: the case-story gate.** `check:contract` still says nothing
about the eight case-story names — presence-or-`case-skip` enforcement is the
program's final step and lands only after the family waves (spec §4). Until
then the convention is normative and unenforced: a story file missing `RTL` with
no skip line is indistinguishable from one that considered it. The remaining
work is spec §3.2's family waves — case stories only, one PR per family, the
~91 items wave 0 did not touch.

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
4. **RESOLVED — the spec gap is closed.** All five genuinely missing entries
   were written on 2026-08-04 from `catalog.md` + `gaps.md` + D12: **H6
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
`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md`.

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
