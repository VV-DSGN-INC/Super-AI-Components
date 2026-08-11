# The agentic layer — flows, rules, gates

**Date:** 2026-08-11
**Status:** approved design, not yet planned
**Scope:** internal build tooling, designed so the composition rules and guidance
extract into a consumer-facing layer later.

---

## 1. The problem

This repo has excellent written process and no executable process.

`.claude/` contains exactly one file, `launch.json`. There are no skills, no
agent definitions, no commands, no hooks, no `settings.json`. Every operational
rule — and there are many, each earned by an incident — lives as prose in
`docs/CONTINUE.md` (665 lines), `component-build-brief.md` and
`block-build-brief.md`, and depends on a human or agent reading it, remembering
it, and voluntarily obeying it.

Two consequences, both already observed:

**Rules with no enforcement get broken.** CONTINUE.md §4 says "Never run
`pnpm format`". That rule has a 100% enforcement gap and has already broken
`check:contract`, because prettier re-wraps the guidance strings its regexes
match against.

**Prose drifts from the code it describes.** Three instances found while
writing this spec:

- `check-contract.mts:10` says "the 14 pre-Wave-1.5 components". There are 25.
- CONTINUE.md §4 says "Until A2's retrofit lands, pass
  `className="text-foreground"`". A2 `cost-chip` and A9 `entity-row` were
  retrofitted; the Storybook exclusion list is down to
  `PreviewTile.stories.tsx` plus vendored directories. The advice is stale.
- CONTINUE.md §6 lists gate baselines (1117 tests, 121 pages, 350 stories) that
  §1 supersedes (1387, 133, 422). The doc contradicts itself one section apart.

Drift is not a documentation problem to be solved by better documentation. It is
what happens when a fact has two homes.

## 2. Goals and non-goals

**Goals**

- Convert the rules that *can* be mechanised into gates and hooks, so following
  them costs nothing and breaking them is difficult.
- Give a fan-out a real agent definition rather than a re-pasted prompt, so
  §3.4's "do not re-paste the house rules" is structurally true.
- Close the five documented gate gaps, one of which (`ui/tabs.tsx`) CONTINUE.md
  records as outright unresolved.
- Prove all of it by running the `contractExempt` retrofit through it.

**Non-goals**

- Automating the integrator. `catalog.manifest.ts` preparation and the
  reconciliation of `consumes`/`shadcn`/`npm` against real imports stay
  human-driven. Both have gone wrong when assumed; §3.2 and §3.5 exist because
  of it.
- A consumer-facing cookbook in this phase. It is the intended follow-on, and
  the retrofit produces its substrate, but it is not in scope here.
- Any change to the 114 components' public API. The §8 composition gaps are a
  separate piece of work.

## 3. Architecture — three layers

| Layer | Enforces | Cannot |
| --- | --- | --- |
| **Gates** (`apps/docs/scripts/*`, `ci.yml`) | What is mechanically checkable in committed code | Prevent the action; only notice it afterwards |
| **Hooks** (`.claude/settings.json`) | What must never happen, at the moment of attempt | Judge quality |
| **Skills + agents** (`.claude/skills`, `.claude/agents`) | The sequence, and what each participant may write | Bind, unless backed by the two above |

**Placement rule.** If a gate can catch it, it is a gate. If a gate cannot catch
it but a tool call can be denied, it is a hook. Only what survives both becomes
prose in a skill.

**No second copies.** Skills and agent prompts point at
`component-build-brief.md`; they never restate it. This is the repo's own rule
(§3.4) applied to the tooling that implements it.

## 4. Flows

### 4.1 `.claude/agents/component-builder.md`

Replaces the re-pasted build prompt. Its system prompt is deliberately thin: the
scope statement, a pointer to `docs/design-system/component-build-brief.md`, and
the reporting format. Everything component-specific (spec anchor, declared
states, which primitive to compose, which a11y trap applies) arrives in the
invocation prompt.

Its value over a prompt is **tool configuration**, which converts three prose
rules into impossibilities:

- `Write`/`Edit` restricted to the component's own five files plus an optional
  `.examples.tsx`.
- `apps/docs/lib/catalog.manifest.ts` denied outright.
- `Bash` denies all git write commands (`commit`, `add`, `checkout`, `stash`,
  `reset`). `refs/stash` is shared across worktrees and an agent has already
  lost work that way.
- `Bash` denies `pnpm build`, the full `pnpm test`, and anything in
  `apps/storybook` — per the brief, the integrator runs those.

### 4.2 `.claude/agents/retrofit-builder.md`

A narrower variant for the 25 `contractExempt` items. The component file already
exists and **must not change**; only the story file, the docs module and (via
report, not write) the manifest states are in scope. Strictly smaller write
surface, which is what makes a 25-way fan-out safe on shipped code.

### 4.3 `.claude/skills/gate-run/SKILL.md`

Runs all eleven `ci.yml` steps in `ci.yml` order and reports where it stopped.

The highest value-per-line item in this design. CONTINUE.md §1 records the
Playwright smoke gate going unrun for an entire phase because a hand-written
gate list omitted it — and because GitHub Actions stops at the first failure,
its absence also hid the Storybook a11y gate and the consumer install test, the
two that verify the phase's most novel work. One skill reading the order from
one place ends that class of failure.

It also bakes in `rm -rf node_modules/.cache/storybook` before `test:stories`,
which §3.5 marks "not optional" and which currently depends on remembering.

### 4.4 `.claude/skills/build-component/SKILL.md`

The §3 loop as an executable sequence: prep manifest → scaffold → fan out →
integrate → gate-run. Its substantive content is the state-name normalisation
rules from §3.2, applied where the manifest is written rather than discovered
three steps later:

- no `default` (becomes the story export `Default`)
- no `meta` or `story` (Pascal forms collide with the story file's own imports)
- no two states that normalise to the same kebab identifier

### 4.5 `.claude/skills/integrate-batch/SKILL.md`

§3.5's reconciliation. The `grep -h 'from "'` loop already written in
CONTINUE.md becomes `apps/docs/scripts/reconcile-deps.mts`, printing a diff
between real imports and what the manifest declares. Encodes the
`@base-ui/react` rule: normally omitted from `npm` because it arrives as a peer
of any vendored `ui/` primitive, *except* for a component importing no `ui/`
primitive at all (`time-ruler`).

## 5. Rules — hooks

Five hooks in `.claude/settings.json`, checked in so they apply to everyone.

Note that git-write denial is **not** here. Hooks apply session-wide and cannot
reliably distinguish a subagent from the integrator, and the integrator must
commit. That denial lives in the agent definition (§4.1), where it is precise.

| Event | Matcher | Action |
| --- | --- | --- |
| `PreToolUse` | Bash, bare `pnpm format` / `prettier --write .` | Deny. Rewrites ~300 unrelated files and breaks `check:contract`, whose guidance regexes (`whatItIs:\s*"..."`) do not survive re-wrapping. Message points at `pnpm exec prettier --write <paths>` |
| `PreToolUse` | Bash, `npx shadcn add <http…>` | Deny. Resolves the item's own `registryDependencies` against the default **Radix** registry, offers to overwrite this repo's Base UI primitives, and writes no component files |
| `PreToolUse` | Write/Edit on `apps/docs/lib/catalog.manifest.ts` | Confirm, not deny — the integrator legitimately writes it |
| `PostToolUse` | Write/Edit on `apps/docs/registry/super-ai/*.tsx` | Run `check:tokens` scoped to that file; surface failures at edit time rather than CI time |
| `SessionStart` | — | Print live gate baselines, current exempt count, and the worktree base-commit reminder |

The `SessionStart` hook does more than it appears to. Every number in
CONTINUE.md §1 is a hand-maintained snapshot, and §6's are already stale against
it. Printing them live lets the doc stop trying to be a dashboard.

## 6. Gates

### G1 — `cva` multi-string union

`findMutedOnMutedViolations` (`check-tokens.mjs:56`) tests one quoted segment at
a time. `components/ui/tabs.tsx` puts `text-muted-foreground` in
`tabsListVariants`' base string and `bg-muted` in its `default` variant, so the
gate written specifically to catch this pairing is blind to it. CONTINUE.md §4
records this as unresolved.

Fix: union all quoted segments belonging to a single `cva()` call before
testing.

**This gate carries a scope decision.** `check-tokens.mjs:3` globs
`registry/{super-ai,marketing}/**` — `components/ui/tabs.tsx` is not scanned at
all, so the union alone does not catch the real bug. The glob must widen to
vendored `ui/` primitives, which will surface further upstream violations.

**Decision: widen the glob and take the result as a findings list, not an
auto-fix.** Diverging from upstream vendored code is the same open question the
a11y exclusions already park, and it is not settled here. Any violation found in
`components/ui/**` is reported and triaged, not silently patched.

### G2 — `data-slot` erasure

Static scan of registry sources for `data-slot=` passed to a JSX element whose
tag is a **registry component**. Every component here spreads `...props` after
its own attributes, so the passed value silently replaces the component's own
slot and every test or style keyed to it misses. `DateSection`, `CostChip`,
`StatReadout` and `EntityRow` have each been erased this way.

Passing `data-slot` to a vendored `ui/` primitive stays legal — that is house
idiom (`result-card` on `Card`, `frame-strip` on `Carousel`, `tool-panel` on
`Tabs`) and nothing keys on those values. The gate encodes CONTINUE.md §4's
refined rule exactly.

### G3 — exemption-list coherence

Two exemption lists exist for one component, in two files, with no link between
them: `CONTRAST_EXEMPT_FILES = ["preview-tile.tsx"]` at `check-tokens.mjs:54`,
and `"**/stories/super-ai/PreviewTile.stories.tsx"` in
`apps/storybook/vitest.config.ts`. Both are governed by "may only shrink, never
grow", and nothing asserts they agree or that either has held.

Gate: assert the two lists correspond, and that neither has grown against a
committed baseline count.

### G4 — story-export name collisions

`check:contract` greps for `export const <StatePascal>`, which is present
whether or not the name collides with the story file's own imports.
`statePascal("meta")` is `Meta`, colliding with
`import type { Meta } from "@storybook/react"`; `record-list` had to alias it,
and the gate passed throughout.

Extend `check-contract.mts` to reject any declared state whose Pascal form is
`Meta`, `Story`, or `Default`.

### G5 — sr-only name fusion: deliberately not a gate

`<span>In</span><span class="sr-only"> point at 3s</span>` computes as
**"Inpoint at 3s"** — accname concatenates name-from-content chunks with
whitespace trimmed and no separator. Two agents hit this independently in one
afternoon (`frame-strip`, `transcript-editor`) and it broke three tests first.

A static detector for "element with visible text plus an `sr-only` sibling"
would fire on every legitimate use of the pattern, and a noisy gate gets
excluded or ignored — the failure mode this whole design exists to avoid.

**Decision: ship a shared `expectAccessibleName(el, expected)` test helper plus
a build-brief entry instead.** This is weaker than a gate and is recorded as
such. It catches the bug where the accessible name is actually computed.

### G6 — `vitest.setup.ts` ScrollArea shim

Base UI's `ScrollArea` (under C2 `suggestion-chips`) schedules a timer calling
`getAnimations()`, which jsdom lacks. It throws *after* the triggering test
resolves, so every assertion passes and the run still exits 1. O1 shimmed it in
its own test file; it belongs in the shared setup next to the ResizeObserver
stub, and will bite anything composing a `ScrollArea`.

## 7. The proving run — the `contractExempt` retrofit

### 7.1 Why this job

The 25 exempt items are, almost exactly, the primitives:

`kbd` · `cost-chip` · `date-section` · `choice-chips` · `filter-bar` ·
`field-row` · `gen-settings-bar` · `preview-tile` · `entity-row` ·
`stat-readout` · `reset-affordance` · `section-header` · `thread-list` ·
`slot-summary` · `citation-ref` · `answer-block` · `source-cards` ·
`shortcuts-sheet` · `credits-indicator` · `quota-meter` · `pricing-table` ·
`autonomy-selector` · `safety-block` · `escalation-handoff` · `task-tray`

These are the atoms `component-build-brief.md` instructs every builder to
compose. The least-verified layer is the most-composed layer, so the debt is not
25 units — it is 25 multiplied by composer count.

`check-contract.mts:108` skips the docs-file *existence* check for exempt items,
so all 25 ship with no guidance module at all.

The job is also high-volume, templated, and mechanically verifiable, which makes
it the right thing to test a fan-out flow against. If the tooling cannot do
this, it cannot do anything.

### 7.2 Order

1. **Gates and hooks** (G1–G4, G6; the five hooks). Land against current `main`
   and verify. Expect G1's widened glob to produce a findings list requiring
   triage.
2. **`gate-run` skill.** Useful immediately, no dependencies.
3. **Agents and remaining skills** (`component-builder`, `retrofit-builder`,
   `build-component`, `integrate-batch`).
4. **Manifest prep for the 25** — human, central, one commit. Normalising legacy
   `states` is exactly where the `default` / `meta` / `story` traps bite; 14 of
   the 25 currently export `Default`.
5. **Fan out** in two batches of roughly twelve. Each agent gets its own git
   worktree **cut from the integration branch, not `main`**, and its own dev
   server port and browser tab. Both failures are recorded in §1: twelve agents
   were cut from `main` and none saw the prep, and one agent's preview reported
   success while serving a sibling worktree's build on port 3000.
6. **Integrate, `gate-run`, land.**

### 7.3 Success criteria

- `pnpm check:contract` reports **114 checked / 0 exempt**.
- `contractExempt` is removed from the manifest type, not merely unused. A
  retrofit that leaves stragglers exempt leaves the flag, the branch in the
  gate, and the whole ambiguity intact.
- All eleven `ci.yml` steps green via `gate-run`.
- G1–G4 and G6 are in `ci.yml` and demonstrated to fail on a deliberately
  introduced instance of the bug each one targets. A gate verified only by
  passing has proved nothing — this is the §1 lesson about the console-error
  assertion, which passed misleadingly until it was made to fail on purpose.
- 25 guidance modules exist with real `anatomy`, ≥2 `dos`, ≥2 `donts`, ≥2
  `pitfalls`.

### 7.4 What this produces for the consumer layer

Guidance modules on the 25 most-composed components are the substrate a
consumer-facing cookbook is extracted from. That is why "internal first" was the
right sequencing: the internal layer generates the material the consumer layer
needs, and the reverse is not true.

## 8. Open decisions

1. **G1's widened glob** will surface violations in vendored `components/ui/**`.
   This spec commits to reporting rather than fixing them. Whether this repo
   ever diverges from upstream vendored code remains open, and is the same
   question `a11y-baseline.md` parks.
2. **Thin agent prompts are unproven here.** Pointing an agent at
   `component-build-brief.md` is correct by the repo's no-second-copy rule, but
   every past fan-out used pasted rules. If retrofit quality drops measurably,
   the fallback is a short pinned excerpt in the agent prompt — accepting a
   second copy in exactly one place, with a gate asserting it matches.
3. **CONTINUE.md's role after the `SessionStart` hook lands.** Once baselines
   print live, §1's snapshot table and §6's contradicting one should be reduced
   to prose. Out of scope here; noted so it is not forgotten.
4. **G5 is a deliberate weak point.** If sr-only fusion recurs after the helper
   ships, revisit the static gate and accept the false-positive cost.

## 9. Explicitly out of scope

- The §8 composition gaps (~20 API changes to shipped components). Better suited
  to an adversarial multi-agent review than a templated fan-out, and it touches
  public API.
- The three promotions in §5.11 (timeline coordinates, `ParameterSlider` → L2,
  the four-verb approval row). Careful single-threaded architectural work.
- Any consumer-facing skill or registry-distributed cookbook.
- Deploying. Production is behind, deploys are manual from `apps/docs`, and
  Nick's standing rule is no production push without an explicit go.
