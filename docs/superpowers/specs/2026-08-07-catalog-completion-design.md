# Catalog completion — the last 20 items

**Status:** approved 2026-08-07
**Scope:** takes the catalog from 94 shipped to 114 of 114, contract-clean, with zero
`contractExempt` items remaining.

This spec covers all remaining work on the active catalog. It supersedes the "what's next"
guidance in [`CONTINUE.md`](../../CONTINUE.md) §1 and §5; the traps in §4 of that file remain
current and are referenced, not restated.

---

## 1. The decisions this spec rests on

Five calls were made on 2026-08-07. They are recorded here because each one closes a question
that had been open since D12.

### 1.1 · The target is frozen at 114

D12 left the catalog explicitly unfinished: a second reference board was to be collected and the
3+ inclusion test re-run, with [`gaps.md`](../../design-system/gaps.md) §4's twenty U-items held as
"candidates, not commitments". Until that happened, families J, K and N were not to be treated as
closed.

**Decision: freeze at 114.** All twenty remaining items ship as specced. The second reference
board becomes a **v2 project with its own spec**, and the U-items go with it. Families J and K
already shipped under this accepted rework risk and stated it in their PRs; family N now ships on
the same terms.

The rationale is that a moving target cannot be finished. `gaps.md` §4's own framing — that the
U-items are reasoned from the landscape rather than derived from the board, "exactly the
speculation the approved spec's rule exists to prevent" — is an argument for sampling them
properly in their own project, not for holding 114 items hostage to a research pass.

**Consequence for v2:** `gaps.md` §4 names extraction (U4 `field-extraction`, U5
`confidence-badge`, U6 `correction-queue`) as the biggest commercial gap and vision (U7
`annotation-overlay`, U8 `label-review`) as the biggest technical one. Those are the v2 spec's
starting point. D12's warning is not withdrawn — it is deferred, on the record.

### 1.2 · The A-family retrofit lands before the shell fan-out; the rest lands after

Twenty-five shipped components carry `contractExempt: true` — no per-state stories, no guidance
modules — totalling 105 declared states. Twelve of them are the A-family primitives, which every
other family composes.

**Decision: retrofit A1–A12 before the twelve-shell fan-out in Phase 2. The other thirteen (B6, D7,
K6–K8, L5, M2–M4, N9–N12 — 59 states) retrofit in Phase 3, after the shells.**

This is not sequencing preference. Three A primitives carry confirmed contrast failures that every
consumer currently works around at the call site (§3.1). Thirteen blocks are about to compose those
primitives roughly a hundred more times.

**Amended 2026-08-07, after the first draft.** This was originally written as "Phase 0, before any
block is built", with Phase 1 sequenced after it. That over-constrained the graph: the retrofit
exists to stop *thirteen shells* from composing broken primitives, and the shells are Phase 2.
Nothing in Phase 1 — the O2 pathfinder, C2, or family N's six — needs it to have happened first.
Writing Phase 1 between the retrofit and the shells quietly turned a Phase-2 prerequisite into a
Phase-1 blocker.

**The retrofit therefore runs concurrently with Phase 1, and must complete before Phase 2 begins.**
The risk it mitigates is *scale* — a hundred call-site workarounds written by twelve parallel
agents. A single pathfinder agent building one block can simply be told about the three known
failures explicitly, which is cheap for one build and unmanageable for twelve.

This is the only ordering constraint in the plan that is genuinely load-bearing. If the retrofit
slips past the start of Phase 2, the result is the "all 25 after the shells" ordering that was
considered and rejected.

### 1.3 · C2 resolves as a cross-registry dependency

C2 `suggestion-chips` has been blocked since the spec was written: its spec line says it composes
`@ai-elements/suggestion`, and `apps/docs` vendors no `ai-elements/` (only `apps/storybook` does,
at `src/components/ai-elements/`, 30 files). `CONTINUE.md` §5.1 framed the choice as vendor-into-docs
or build-standalone.

**Both options were wrong.** `registryDependencies` resolves by **URL**, not by local path — this is
already how the repo references its own items. `scripts/lib/registry-extras.ts:14` builds them as
`[...item.shadcn, ...item.consumes.map(self)]`, and `self()` emits a fully-qualified
`https://super-ai-components.vercel.app/r/<name>.json`. A registry item can therefore depend on
another vendor's registry natively.

Verified 2026-08-07: `https://registry.ai-sdk.dev/suggestion.json` returns 200 and is a clean,
self-contained item — `type: registry:component`, `registryDependencies: ["button", "scroll-area"]`,
`dependencies: []`, installing to `components/ai-elements/suggestion.tsx`.

**Decision: C2 declares `https://registry.ai-sdk.dev/suggestion.json` as an external registry
dependency.** `apps/docs` vendors the single file locally only so the workbench can render the
demo and stories — the same way it vendors shadcn `ui/` primitives. Consumers get AI Elements'
component from AI Elements.

This is the only option that delivers what C2's spec claims it is: *"composes rather than
reimplements — the cleanest example of the L1 boundary in the catalog."* It also makes the README's
"the missing half of AI Elements" positioning true in the install graph rather than only in the copy.

### 1.4 · A block is installable *and* a showcase page

Nothing in family O has ever been built, so this was undecided.
[`block-specs.md`](../../design-system/block-specs.md) says a block "is a composition of L0–L3
components and doubles as the demo that proves them", which reads as both but had never been ruled on.

**Decision: both.** A block is a real registry item (`npx shadcn add .../home-shell.json` drops a
working page) and the docs site renders it as the showcase for its archetype. All 114 items stay
uniform in the registry, and the catalog's strongest differentiator is actually in the thing being
distributed.

### 1.5 · Family O is built pathfinder-first, not fanned out blind

**Decision: build O2 `chat-shell` alone and sequentially, then fan out the remaining twelve.**

Every wave so far parallelised cleanly because each agent wrote only its own five files with no
shared state. Blocks are still file-independent but semantically coupled — twelve agents composing
the same primitives will each hit the same integration walls. That is exactly how the three
duplicated primitives in §3.2 came to exist: H2, H3 and H6 each wrote their own timeline coordinate
handling because nobody was looking across them.

O2 is the right pathfinder: eleven declared dependencies (the highest in the family), composing AI
Elements, the composer family, `artifact-grid`, `feedback`, `disclaimer-note`, and `paywall-message`
in the message stream. Representative and hard.

The repo's own history is the argument. Every expensive rework traces to parallel agents working
without a shared written contract; every batch that had one first — `component-build-brief.md`, the
`cost` module — went cleanly.

---

## 2. State at the time of writing

Verified against `apps/docs/lib/catalog.manifest.ts`, not from documentation.

| | |
| --- | --- |
| Shipped | 94 |
| Planned | 20 — C 1 · N 6 · O 13 |
| Cut | 11 — family G's 10 (D9) plus O5 `flow-shell` |
| `contractExempt` | 25, totalling 105 declared states |

Gate baselines to hold or beat: `pnpm test` **1044** · `pnpm build` **113 pages** ·
`pnpm test:stories` **318** · `registry.json` **110 items**.

Item arithmetic: 94 shipped + 1 (C2) + 6 (N) + 13 (O) = **114**.

**Dependency readiness, computed by parsing every block spec's `Filled by` line against the
manifest:** twelve of the thirteen blocks have every dependency shipped. Only **O1 `home-shell`**
is blocked, on C2 — the shell that §5 of `decisions.md` originally scheduled first.

**No block references any of the six remaining N components.** Family N is entirely off the
critical path for family O; it is in scope because the target is completeness, not because
anything waits on it.

### 2.1 · A finding worth recording: the build inverted its own sequencing

[`decisions.md`](../../design-system/decisions.md) §5 pairs every wave with the block that proves
it — wave 2 ships `home-shell`, wave 3 ships `chat-shell`, and so on. The actual build shipped
families A through M and deferred all thirteen blocks to the end.

That was defensible for throughput: parallel agents need independent work, and blocks are the one
thing in the catalog that isn't. But the consequence is that **no family has ever been proven by a
real composition.** The three duplicate primitives in §3.2 were found by builders bumping into each
other, not by a shell failing to assemble.

Family O is therefore not the last chunk of work. It is the first integration test, and it should
be planned as one.

---

## 3. Phase 0 — fix the base

**Runs concurrently with Phase 1 (§1.2). Must complete before Phase 2 begins.** It is numbered 0
because it gates the shell fan-out, not because everything waits behind it.

Phase 0 ships **no new catalog items**. The counter stays at 94. This is deliberate and it is the
phase most likely to be skipped under pressure; it exists because thirteen blocks are about to
compose this base a hundred times over.

Concurrency note: with Phase 1 running eight agents (§4) and the cap at roughly 10–16, Phase 0's
twelve retrofit agents will not all fit alongside them. Expect it to run as the second batch —
started while the O2 pathfinder is still defining the block contract, finished before the twelve
shells fan out. Track B's builders are told **not** to add contrast workarounds for A2, A8 or A9,
since those are being fixed here rather than worked around.

### 3.1 · Retrofit the twelve A-family primitives

A1 `kbd` (3 states) · A2 `cost-chip` (4) · A3 `date-section` (2) · A4 `choice-chips` (3) ·
A5 `filter-bar` (3) · A6 `field-row` (5) · A7 `gen-settings-bar` (3) · A8 `preview-tile` (5) ·
A9 `entity-row` (6) · A10 `stat-readout` (3) · A11 `reset-affordance` (5) · A12 `section-header` (4)
— **46 states**. Write per-state stories and guidance modules, then drop `contractExempt`.

The stories are the mechanism. The deliverable is **three contrast fixes at source**:

| Primitive | Failure | Current call-site workaround |
| --- | --- | --- |
| A2 `cost-chip` | `text-muted-foreground` on its own `bg-muted`, 4.34:1 | `action-stack.tsx` passes `className="text-foreground"` |
| A8 `preview-tile` | `failed` branch is `text-destructive` on `bg-muted`, ~4.0:1 | `result-card` overrides the message; `tool-panel` declines to render the state |
| A9 `entity-row` | confirmed contrast failure | — |

Both A2 and A8 are excluded from the a11y gate **under their own story names only**, which is why
every composing component fails its own stories instead.

**The workaround removal must land in the same commit as each fix.** Otherwise the primitive is
"fixed" while consumers still carry compensating overrides that now double-apply. Phase 0's
definition of done is fix *plus* cleanup, verified by `pnpm test:stories`.

This is the largest regression risk in the whole plan and it is not recorded anywhere in
`CONTINUE.md`.

### 3.2 · Promote the three shared pieces to L2

D3 requires shared pieces be promoted to L2 rather than imported sideways. Three violations exist,
each found independently by builders working blind — which is what makes them real signals rather
than tidiness.

**`ParameterSlider` — a straight lift.** `drawing-tools.tsx:8` imports it from
`@/registry/super-ai/parameter-panel`: an L3→L3 sideways import across families, precisely what D3
forbids. A third consumer exists that the handoff does not record — `tts-composer.tsx:340`
describes using "the same technique" in prose, meaning it wanted the abstraction and
re-implemented rather than import it. Promote to `registry/super-ai/`, three consumers.

**The four-verb approval row — also a lift.** F7 `approval-card`, I4 and K1 all need the same fixed
verb row. Neither I4 nor K1 could compose F7, because F7's root *is* a Card carrying its own
title/summary/undo model; nesting it inverts the relationship and doubles the frame. Extracting the
verb row alone resolves all three.

**Timeline coordinates — a design decision, not a refactor.** `CONTINUE.md` describes this as "two
implementations of the same math". Reading the source shows it is worse than that: they are
**incompatible coordinate models**.

| Component | Model |
| --- | --- |
| `track-lane.tsx:352-357` | absolute pixels, no zoom — `clip.start * pixelsPerSecond`, container `width: duration * pixelsPerSecond` |
| `waveform-editor.tsx:250-251` | viewport-relative percentage **with** zoom — `((regionStart - viewStart) / visible) * 100`, driven by zoom exponents |
| `time-ruler.tsx` | a third model, exporting its own `TimeRulerScale` type |

No shared helper can be lifted out of these, because `waveform-editor`'s zoom/viewport model has no
expression in `track-lane`'s absolute one. H2's spec requires the playhead to span every track,
which is satisfiable only once they agree.

**Phase 0 scopes this as "choose and document the coordinate model", not "unify the
implementations".** Decision first; migration follows in Phase 3 or alongside O4 `timeline-shell`,
whichever comes first. This is the one item in the plan with genuine unknowns and it is scoped so
that the unknown cannot block the rest of Phase 0.

`compare-viewer`'s unimplemented `syncKey` (it emits `data-sync-key` for something else to read)
belongs with this decision — H2, H3 and H6 all shipped without a sync story and each said so
independently.

### 3.3 · Resolve A12's `action` slot contract

A12 `section-header` documents its `action` slot as "a link, never a button. It navigates, it does
not act." In one batch, two builders working blind both violated it: J1 `asset-library` put Upload
and New folder **buttons** there; J2 `filter-panel` put inert **text** there (`N selected`, so
collapsing a section cannot silently hide live filters). Both documented the departure.

Every real header violates the rule, so the rule loses. Widen the contract and update A12's
guidance as part of its retrofit in §3.1.

### 3.4 · Machinery for the cross-registry dependency

`ManifestItem` gains `external: string[]`. `scripts/lib/registry-extras.ts:14` includes it when
building `registryDependencies`. `scripts/check-contract.mts:94` currently asserts the emitted
dependency count equals `shadcn.length + consumes.length` and must learn about the third kind.

### 3.5 · Phase 0 exit criteria

All seven gates green, `contractExempt` count down from 25 to 13, the three contrast workarounds
deleted from their call sites, and the timeline coordinate model written down in `decisions.md` as
a numbered decision.

---

## 4. Phase 1 — two tracks in parallel

### 4.1 · Track A (sequential) — O2 `chat-shell`, the pathfinder

One build, done carefully, whose output is a **contract** as much as a component.

**The block contract.** The component contract is *states → one story per state*. Blocks have
`states: []` and always will: every block spec leads with `Regions:`, not states. Four requirements
replace it, each traceable to something already written.

**1 · `consumes` becomes required and non-empty, reconciled against real imports.** Today every O
row has `consumes: []`, which makes the gate's dependency reconciliation a no-op for exactly the
items that compose six to eleven things each.

This is the load-bearing requirement. **The single biggest risk in fanning out twelve shell agents
is a shell quietly reimplementing a component instead of composing it** — an agent that cannot make
`property-inspector` fit will write its own inspector markup, and nothing currently catches that.
Required `consumes`, reconciled against imports by the same `grep 'from "'` pass §3.5 of
`CONTINUE.md` does by hand, catches it mechanically rather than by reviewer attention.

**2 · Regions replace states.** The manifest gains `regions: string[]`, seeded from each block
spec's `Regions:` line. Each region renders with an addressable `data-region` attribute; the gate
asserts every declared region is present. O3's five regions become five assertions.

**3 · A mandatory `empty` story.** Three independent places in the design record say the same
thing: F4 states "empty states are the default view"; O1 says "the whole page is C4's empty state
on day one — that is the version most new users actually see"; O3 says the inspector "must ship an
empty state, because 'nothing selected' is the most common state." A block that demos only its full
state demos the view fewest users see.

**4 · Responsive stories.** Shells are layouts and layout is what breaks. Components never needed
this — a chip has no breakpoints; a five-region editor does.

**Mechanical changes, all precedented by the `cost` module's introduction of `registry:lib`:**

- `registry:block` joins the type union at `scripts/gen-registry.mts:30`.
- `specAnchor` branches on `layer`. All fourteen O rows currently point at
  `component-specs.md#<id>-<name>`, which contains **zero** `## O` headings — the specs are in
  `block-specs.md`, which has all fourteen. `scripts/gen-manifest.mts:151` generates the wrong
  anchor unconditionally, and `lib/catalog.manifest.test.ts:63` *asserts* the wrong pattern
  (`/^component-specs\.md#/`), so fixing the data breaks a currently-green test. All three change
  together.
- A route at `app/blocks/[name]/page.tsx` renders the showcase, alongside the existing
  `app/components/[name]/page.tsx`.
- `check-contract.mts` grows a block branch applying the four requirements above and skipping
  per-state story coverage.

**Track A exit criteria:** O2 shipped and installable, the four requirements enforced by
`check:contract`, thirteen spec anchors fixed, and `docs/design-system/block-build-brief.md`
written — the block equivalent of `component-build-brief.md`, and the single artifact handed to
each of the twelve agents in Phase 2.

### 4.2 · Track B (parallel agents) — C2 plus family N's six

Seven independent leaf components on the proven pipeline: **C2** `suggestion-chips` (per §1.3),
and **N2** `trust-dialog` · **N4** `trace-timeline` · **N5** `run-inspector` · **N6**
`usage-dashboard` · **N7** `env-status` · **N8** `permission-prompt`.

All six N specs exist — verified, no spec gap. Nothing here depends on the pathfinder, so this is
free throughput: Track A occupies one agent sequentially while the fan-out machinery would
otherwise sit idle.

N8 `permission-prompt` is recorded in `gaps.md` as the single most important missing component in
the catalog — every tool-calling agent needs it, and it is a safety surface rather than a
convenience one. It gets built to that weight.

**Phase 1 exit: 102 of 114** — 94 shipped, plus C2, plus family N's six (Track B), plus O2 itself
(Track A) — **and a written block contract.** Phase 2's twelve blocks close the remaining gap.

---

## 5. Phase 2 — fan out the remaining twelve shells

**Entry condition: Phase 0 is complete.** This is the plan's one load-bearing ordering constraint
(§1.2). Twelve agents composing unretrofitted primitives is exactly the outcome Phase 0 exists to
prevent.

O1 `home-shell` (unblocked by C2 in Phase 1) · O3 `studio-shell` · O4 `timeline-shell` ·
O6 `generation-shell` · O7 `library-shell` · O8 `explore-shell` · O9 `artifact-shell` ·
O10 `records-shell` · O11 `docs-shell` · O12 `settings-shell` · O13 `notebook-shell` ·
O14 `auth-shell`.

One agent per block, following `CONTINUE.md` §3.4: each agent gets a pointer to
`block-build-brief.md` (never a re-paste of the rules), its spec anchor in `block-specs.md`, its
declared regions and `consumes` list, and block-specific steering only.

**If O2 strains a single agent's context, Phase 2 batches rather than running all twelve at once.**
The pathfinder answers this question before it becomes a problem.

Integration is central and follows the existing §3.5 procedure, with `consumes` reconciliation now
mechanical rather than manual.

**Phase 2 exit: 114 of 114.**

---

## 6. Phase 3 — the remaining thirteen retrofits

B6 `thread-list` (6 states) · D7 `slot-summary` (8) · K6 `citation-ref` (3) · K7 `answer-block` (4) ·
K8 `source-cards` (5) · L5 `shortcuts-sheet` (4) · M2 `credits-indicator` (5) · M3 `quota-meter` (4) ·
M4 `pricing-table` (3) · N9 `autonomy-selector` (3) · N10 `safety-block` (2) ·
N11 `escalation-handoff` (8) · N12 `task-tray` (4) — **59 states**.

Also lands here: the timeline coordinate migration, if §3.2's decision has not already been
actioned alongside O4.

**Phase 3 exit: zero `contractExempt` items. The catalog is 114 of 114 and fully contract-clean.**

---

## 7. Phase 4 — ship

- **The `/roadmap` page (T14)** — specced but never built, which is why "114 of 114" is currently
  invisible to a visitor.
- **The `cost` retrofit loose ends** — E5 `run-button` and E7 `member-gate-row` still do not call
  `useCost`, so the rule that `insufficient` is *derived* and never accepted as a prop is
  unenforced at both cost placements. A2 still exposes only `amount`/`unit` against a spec
  declaring four states, and A7 still has no cost slot. E5 and E6 spell the running state
  `running` where the contract says `streaming`; both names must not survive.
- **The production deploy.** Production currently serves 98 registry items against 110 on `main` —
  it is one merge behind and missing the wave 7/8 batch. Requires the `weeeha` account and an
  explicit go; never automatic.

---

## 8. Verification

The seven gates are the contract and all must pass before any batch lands:

```
pnpm typecheck && pnpm lint && pnpm check:tokens
pnpm check:contract
pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

`test:stories` is blocking and is run twice to rule out flake. The cache removal is not optional
after adding components.

**The consumer test becomes load-bearing.** `apps/docs/scripts/consumer-test.sh` is the only thing
that proves a block actually installs, and blocks are the first items whose install pulls a
**cross-registry** dependency (C2 → `registry.ai-sdk.dev`). That path is untested today and must be
exercised in Phase 1.

The traps in `CONTINUE.md` §4 remain current — Storybook cache, never `pnpm format`, `data-slot` on
registry components, `sr-only` accessible-name fusion, vendored wrappers silently dropping props.
Briefs point at that section rather than restating it, per the rule that one copy prevents drift.

---

## 9. Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | **A-family fixes break their own consumers** — workarounds double-apply once the primitive is fixed | Fix and cleanup in the same commit; `test:stories` verifies. §3.1 |
| 2 | **Shell agents reimplement instead of compose** | Required non-empty `consumes`, reconciled against real imports. §4.1 |
| 3 | **Timeline coordinate model is a genuine unknown** | Scoped to a decision, not a migration, so it cannot block Phase 0. §3.2 |
| 4 | **A block may exceed one agent's context** | Pathfinder answers it before twelve agents hit it; Phase 2 batches if needed |
| 5 | **Phase 0 ships nothing visible** and will be tempting to skip | Named explicitly here; exit criteria in §3.5 are objective, and it is Phase 2's entry condition (§5) |
| 7 | **Phase 0 slips past the start of Phase 2** now that it runs concurrently rather than first | The only hard gate in the plan; §5 states it as an entry condition rather than a convention |
| 6 | J/K/N rework if v2's re-sampling invalidates them | Accepted on the record in §1.1 |

---

## 10. Out of scope

Named so the spec cannot quietly grow:

- **The second reference board and `gaps.md` §4's twenty U-items** — a v2 project with its own
  spec (§1.1).
- **The fifteen-component marketing namespace** — untouched.
- **Bringing the tree prettier-clean** — its own task, and it requires `check:contract`'s guidance
  regexes be made whitespace-tolerant first, or six passing components break.
- **Production deploys** outside Phase 4, and never without an explicit go.
