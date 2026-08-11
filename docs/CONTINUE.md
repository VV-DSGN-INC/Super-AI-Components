# CONTINUE HERE — building out the component catalog

A handoff for a fresh session. Read this top to bottom before touching
anything; it is written so you can pick up mid-build without re-deriving what
was already decided.

**Last updated:** 2026-08-05, after families J + K (12 items via parallel agents).

---

## 1. Where things stand

|                 |                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repo            | `VV-DSGN-INC/Super-AI-Components`                                                                                           |
| Branch          | `claude/repo-status-review-8bac54` (branched from `main` after PR #18 merged)                                               |
| HEAD at handoff | **Phase 1 of the catalog-completion plan complete** — the block contract, O2 `chat-shell`, C2, and family N's six           |
| Pushed          | **yes**, with an open PR. See the repo's PR list.                                                                           |
| Preview         | Not deployed. Production is still one merge behind and serves 98 registry items against 118 here — see §7.                  |

**Catalog progress: 102 of 114 active items shipped.** 12 planned, 11 cut
(family G's 10 + O5, per decision D9 — do not revive them).

Of the 102, **25 are pre-Wave-1.5 legacy** carrying `contractExempt: true`. They
are exempt from the story-state and documentation contracts until someone runs
the retrofit. The other 77 satisfy the full contract.

**Remaining: family O's 12 blocks.** C and N are closed.

Plus one `registry:lib` contract, `cost` — not a catalog item, so not in the
114. See §5.9.

Gate baselines at this handoff: `pnpm test` **1117**, `pnpm build` **121 pages**,
`pnpm test:stories` **350**, `registry.json` **118 items**,
`check:contract` **77 checked / 25 exempt**.

### Start here for the next phase

Read **[`design-system/block-build-brief.md`](design-system/block-build-brief.md)** —
it did not exist before this phase. O2 `chat-shell` was built alone as a
pathfinder specifically so that document could be written from what it hit, and
it is the artifact each of the twelve remaining shell builders is handed,
alongside its spec anchor, regions and `consumes` list. It supplements
`component-build-brief.md` rather than replacing it.

**Two things must happen before the twelve-shell fan-out:**

1. **The A-family retrofit (Phase 0) must land first.** Six call sites now
   carry `className="text-foreground"` overrides compensating for A2
   `cost-chip`'s unfixed 4.34:1 contrast bug — two of them added during this
   phase. Twelve shells composing those primitives is how that list becomes
   twenty. See `a11y-baseline.md` §5.
2. **Give each shell its own worktree.** This phase ran its seven leaf
   components sequentially rather than in parallel, because they share one
   working tree and each runs a repo-root `pnpm typecheck` — concurrent runs
   race on `tsbuildinfo` and typecheck against each other's half-written
   files. The fan-out the plan assumed needs isolation to actually happen, and
   the win is far larger for twelve shells than it was for seven leaves.

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

**That v2 project now exists.** Family P — P1 `data-views`, P2
`detail-view-shell`, plus the `use-view-mode` lib contract — shipped 2026-08-11
under [`2026-08-11-data-views-v2-design.md`](superpowers/specs/2026-08-11-data-views-v2-design.md).
The A–O freeze is untouched, and `catalog.manifest.test.ts` now asserts the two
halves separately so that stays checkable rather than commented.

Two things there are open work rather than done work:

- **D18's evidence is desk research**, not a collected board of screens — see
  [`records-board-analysis.md`](design-system/records-board-analysis.md) §1.
  Family P does not reach A–O's evidentiary footing until those seven products
  are verified against real screens. P2 cleared D1 at exactly 3 of 5, so re-test
  that one first.
- **The consumer flip is not done.** `shadcn-shell` in DS-WebApp-Shells still
  authors its own copies of these files. Pointing it at the registry needs a
  published URL and is its own PR.

Next and last: **family O's 12 remaining blocks**. O10 `records-shell` now has
its dependencies shipped. O2 `chat-shell` is built;
read [`design-system/block-build-brief.md`](design-system/block-build-brief.md)
before starting any of the rest, and see §1 for the two prerequisites.

**Parallel agents are the throughput mechanism** — §3.4 is not optional advice.
Wave 6's 12 items were built by 12 concurrent agents in one pass; sequential
building runs at roughly 7 components per session.

### 3.2 Prepare the manifest — you do this, not the agents

`apps/docs/lib/catalog.manifest.ts` is the single source of truth and the one
shared file. Agents must never write it.

For each component in the batch, set `status: "building"` and normalise its
`states` into clean kebab-case identifiers. The raw `states` came from
`catalog.md`'s markdown table and contain prose like `"8–14 items"` or
`"editor context; privacy chip; saved-state"`, which cannot become story export
names.

**Two naming traps, both already hit:**

- A state named `"default"` becomes the story export `Default`, which the
  contract gate forbids. Use a meaningful name (`text-only`, `plain`).
- Two states that normalise to the same identifier silently collide.

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
