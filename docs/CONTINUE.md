# CONTINUE HERE — building out the component catalog

A handoff for a fresh session. Read this top to bottom before touching
anything; it is written so you can pick up mid-build without re-deriving what
was already decided.

**Last updated:** 2026-08-04, after F1 + F2 (family F opened).

---

## 1. Where things stand

|                 |                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repo            | `VV-DSGN-INC/Super-AI-Components`                                                                                           |
| Branch          | `claude/wave-4-family-f` (branched from `main` after PR #15 merged)                                                         |
| HEAD at handoff | F1 `result-card` + F2 `generation-grid`                                                                                     |
| Pushed          | **no.** Local commit only — needs a push and a PR.                                                                          |
| Open PR         | **none** for this work. PR #11 (`claude/wave-specs-and-infra`) is still open, but its content landed on main via `11f633e`. |
| Preview         | https://super-ai-components-v0.vercel.app (preview deploy, behind Vercel SSO)                                               |

**Catalog progress: 56 of 114 active items shipped.** 58 planned, 10 cut
(family G + O5, per decision D9 — do not revive them).

Of the 56, **25 are pre-Wave-1.5 legacy** carrying `contractExempt: true`. They
are exempt from the story-state and documentation contracts until someone runs
the retrofit. The other 31 satisfy the full contract.

Remaining by family: C 1 · F 5 · H 7 · I 5 · J 7 · K 5 · L 5 · M 4 · N 6 · O 13.

Gate baselines at this handoff: `pnpm test` **482**, `pnpm build` **75 pages**,
`pnpm test:stories` **156**.

---

## 2. Read these first, in this order

1. [`design-system/component-build-brief.md`](design-system/component-build-brief.md)
   — the house contract every component is built to. This is the single most
   important file; it is what gets handed to each build agent.
2. [`design-system/catalog.md`](design-system/catalog.md) — the 107 items.
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

**Family F is open: F1 `result-card` and F2 `generation-grid` have shipped.**
Next up is the rest of it, in the wave-4 spec's own build order (§5): F4
`action-stack` and F3 `asset-detail` together, then F7 `approval-card`, F5
`compare-viewer` and F6 `render-queue`, which have no dependencies within the
wave. **F3, F4 and F6 all take a `Cost` — build the contract module first (see
§5.9).**

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
    | grep -E '^@/components/ui/|^@/registry/super-ai/|lucide-react' \
    | sort -u | tr '\n' ' '; echo
done

# 2. Set shadcn / consumes / npm from that output, flip status to "shipped".
# 3. Regenerate wiring and run every gate.
pnpm gen:wiring
pnpm check:contract
cd ../.. && pnpm typecheck && pnpm lint && pnpm check:tokens && pnpm test && pnpm build
cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
```

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

1. **C2 `suggestion-chips` is blocked.** Its spec says it composes
   `@ai-elements/suggestion`; `apps/docs` has no `ai-elements/` (only
   `apps/storybook` does). Either vendor AI Elements into the docs app or build
   it standalone. Only two references to AI Elements exist in the whole spec, so
   this is not systemic.
2. **`gen-settings-bar` (A7) should compose `model-picker` (E2)**, not render the
   model as inert text. E2's spec says the picker owns capabilities and A7 only
   renders them. Same duplication class as the `hero-omnibox`/`mode-tabs`
   overlap that was already reconciled.
3. **Inconsistent accessible-name convention** for model selection:
   `model-picker` uses `"Model: Veo 3.1 Fast"`, `hero-omnibox` a static
   `"Model"`. One should win.
4. **Six components have no spec prose** — `H6 waveform-editor`,
   `H7 stem-mixer`, `J7 track-list`, `M7 connection-manager`, `N7 env-status`,
   `N8 permission-prompt`. Five are D12 restorations. E9/E10 had the same gap and
   were built from `catalog.md` + `gaps.md` + D12 with `evidence: []` rather than
   invented sources. That precedent works; expect thinner guidance.
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

9. **The `cost` contract module was never built, and family E shipped without
   it.** It is step **1** of the wave-4 spec's own build order
   (`2026-08-02-wave-4-generation-results-design.md` §2, §5) — one
   `registry:lib` item exporting `Cost`, `CostProvider`, `useCost` and
   `formatCost`, plus the `GenerationState` union (§2.5). Nothing in
   `registry/super-ai/` references any of it. Three consequences, in order of
   cost to fix:
   - **E5 `run-button` and E7 `member-gate-row` shipped as the two cost
     placements without the contract they were supposed to validate.** The
     spec's rule that `insufficient` is _derived_ from `balance < amount` and
     "never accepted as a prop" is therefore unenforced — which is exactly the
     "two different prices is the failure mode" the module exists to prevent.
   - **F3, F4 and F6 all declare `cost?: Cost` in their APIs.** They cannot be
     built to spec until the type exists. Build the module before them.
   - **F1 declares its lifecycle union locally** (`ResultCardState` in
     `result-card.tsx`) rather than duplicating a contract that has no home
     yet. When the module lands, that type should collapse into it. The union
     is already spelled the spec's way — `streaming`, never `running`.

   The spec also leaves a naming question open for Nick: if the file carries
   both the cost and state contracts it is misnamed as `cost` and should be
   `contracts.tsx`. Note the manifest's `layer` is
   `primitive | component | block` with no `lib`, so adding a `registry:lib`
   item needs a small change to `manifest-types.ts` and `gen-registry.mts`
   as well.

10. **`generation-grid`'s `renderItem` context carries a `toggleSelected` the
    wave-4 spec's §6.2 sketch does not list.** Without it `onSelectionChange`
    could never fire — the checkbox that toggles an item is rendered by the
    caller, not by the grid — so the prop would be dead. Additive and
    documented, but it is a departure from the written API.

---

## 6. What good looks like

The gates are the contract. All of these must pass before a batch lands:

- `pnpm typecheck`, `pnpm lint` (0 errors), `pnpm check:tokens`
- `pnpm check:contract` — files exist, stories cover every declared state,
  guidance fields non-empty, `consumes` resolves to shipped items, deps match
  what `gen-registry` emits, wiring not stale, catalog counts agree
- `pnpm test` — 366 at handoff
- `pnpm build` — 62 pages at handoff
- `pnpm test:stories` — 144 at handoff, **blocking**, run twice to rule out flake

A component is not done because it renders. It is done when it composes the
right primitives, its tests pin the spec's load-bearing sentences, its guidance
tells a consumer when to reach for it and what goes wrong, and the gates are
green.
