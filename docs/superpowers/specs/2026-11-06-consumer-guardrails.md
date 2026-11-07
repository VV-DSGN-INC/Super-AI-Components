# Consumer guardrails: the rules travel with the kit

**Date:** 2026-11-06 · **Owner:** Nick · **Status:** Approved 2026-11-06 (1A, 2A, 3A), nothing built; plan in `docs/superpowers/plans/2026-11-06-consumer-guardrails.md` · **Baseline:** `origin/main` at `76cc8910`
**Related:** [agent surfaces ledger spec](2026-10-15-agent-surfaces-ledger-design.md) §3.5 (the `agent-kit` item this extends) · [agentic layer spec](2026-08-11-agentic-layer-design.md) §3 (gates, hooks, skills) · [agentic contracts spec](2026-09-14-agentic-contracts-design.md) · `concept-model.md` §4 (the contracts) · `decisions.md` D23, D24, D25

**TL;DR.** After `npx shadcn add`, a consumer's agent gets the component and its `.meta.json`,
and nothing that says how to build with the kit. This spec writes that missing text: six rules,
each with a one-line reason, for a consumer's `CLAUDE.md` or `AGENTS.md`. It does not add a new
registry item. The rules become the rules section of the `AGENTS.super-ai.md` that the ledger
spec's `agent-kit` item already plans to install, and every rule the kit can check is backed by
the kit's `validate` script, so the prose only has to say when to run it. That split, soft prose
for judgment and a hard check for everything mechanical, is the point. Most kits that ship
agent rules ship only the prose. This repo already has 17 blocker rules that run on every
contributor edit; this spec lets them run in a consumer too.

---

## 1. Measured state

Read from `origin/main` at `76cc8910`. The worktree this draft was written in is 33 commits
behind, so nothing below comes from the local checkout.

| Layer                   | What exists                                                                                                                                                                                                                | Reaches a consumer?                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Gate                    | `packages/ds-rules/rulecheck.mjs` behind `pnpm check:tokens`: 20 records in `rules/core.json` and `rules/local.json`, 17 of them `blocker` (TOK-1 to TOK-8, ICO-1, ICO-2, COL-1, MOT-1, MOT-2, CPY-1, CHT-1, CHT-3, STA-3) | No. It scopes to this repo's own paths               |
| Hook, edit time         | `.claude/hooks/check-tokens-on-edit.sh`, PostToolUse, advisory, runs the blocker subset on the edited file                                                                                                                 | No                                                   |
| Hook, command time      | `.claude/hooks/deny-dangerous-bash.sh`, PreToolUse, denies third-party `shadcn add <url>`, rebase, amend, hard reset                                                                                                       | No                                                   |
| Global hook, Nick's Mac | `~/.claude/hooks/design-token-guard.mjs`, PreToolUse, walks up to the nearest `scripts/check-tokens.mjs` and calls its exported `lintText(path, text)`; blocks on a finding, fails open on any error                       | Only on Nick's Mac, and this repo has no such script |
| Installed contract      | `components/super-ai/<name>.meta.json` beside every catalog item (D24)                                                                                                                                                     | Yes, per item                                        |
| Contracts               | Token, State, Cost, Provenance, Empty, Approval, Dialog (`concept-model.md` §4)                                                                                                                                            | Only as fields inside each `.meta.json`              |
| Motion tokens           | None. Components use Tailwind's own scale (`duration-200`, `duration-300`) and pair every animation with `motion-reduce:animate-none` (204 uses in `registry/`)                                                            | n/a                                                  |
| Kit-level agent text    | None. The ledger spec §3.5 proposes `AGENTS.super-ai.md`; not built                                                                                                                                                        | No                                                   |

Two findings change the brief:

1. **There are no motion tokens.** A rule that says "motion from motion tokens" would point the
   agent at variables that do not exist, and it would invent them. The motion rule below is
   written against what the registry actually does. Adding real motion tokens is open decision 3.
2. **Nick's global hook looks for `scripts/check-tokens.mjs` with a `lintText` export.** If the
   kit's validate script exports the same function under that path, the global hook enforces the
   kit inside every consumer app on Nick's machine with no extra setup. That is cheap and is
   proposed in §4.

## 2. Placement, applied to a consumer

The agentic layer spec's rule holds here: if a check can catch it, it is a check; only what
survives becomes prose. Applied to the six rules:

| Rule                          | Hard part (runs)                                                                                        | Soft part (read)                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| R1 Build from installed items | none                                                                                                    | all of it: needs judgment about what the screen is       |
| R2 Tokens, never raw colour   | `validate`: TOK-1 to TOK-8, COL-1, CHT-1                                                                | the reason, and the rebind idiom for painted surfaces    |
| R3 Motion                     | `validate`: MOT-1, MOT-2; new check for an animation with no `motion-reduce` pair                       | when motion is warranted at all                          |
| R4 Contracts                  | partly: Empty and Approval are checkable per item later; State, Cost, Provenance, Dialog are not, today | read the installed `.meta.json` before composing         |
| R5 Escalate system changes    | `validate --system`: lists diff hunks that touch tokens or primitives, exit 3                           | the scope line, so feature work is never interrupted     |
| R6 Run the check              | the check itself                                                                                        | one sentence: when to run it, and that exit 0 is the bar |

## 3. The rules text, draft

This is the section `gen-registry.mts` would emit into `AGENTS.super-ai.md`. The rules are
authored once in a source module and emitted (§4.2); the routing index and per-component names
that follow it in the same file come from the metas, as the ledger spec's D28 says. Paths assume
shadcn's defaults (`components/ui`, `components/super-ai`, `app/globals.css`); the emitter
rewrites them from the consumer's `components.json` aliases at install time if that proves
possible (Task 1 of the plan checks).

```markdown
## Super AI Components: rules for agents

These rules apply to UI built with the Super AI Components registry in this project.
Each rule says why. Where a rule can be checked, the check is the authority, not this text.

### 1. Build from installed items before writing UI

Before writing a component, check `components/super-ai/` and the index in
`components/super-ai/index.toon`. If an item covers the job, install or compose it; do not
rebuild it by hand.
Why: a hand-built copy passes every check and still drifts from the contract, the
accessibility work and the fixes the registry item carries.

### 2. Style from tokens, never raw colour

Use the shadcn CSS variables through Tailwind (`bg-background`, `text-muted-foreground`,
`border-border`, `chart-1` to `chart-5`). No hex, `rgb()`, `hsl()`, `oklch()`, palette steps
like `bg-zinc-400`, or gradients. When a surface is painted, rebind the variable
(`[--muted-foreground:var(--accent-foreground)]`) rather than restyling each child.
Why: tokens are what makes dark mode, theming and contrast hold; a raw value is correct in one
theme and wrong in the other.

### 3. Motion only on state change, and always reducible

Animate a change of state, never as decoration. Name the transitioned property
(`transition-opacity`, not `transition-all`). Use Tailwind's duration scale as the installed
components do; do not invent durations. Pair every animation with `motion-reduce:animate-none`
or `motion-reduce:transition-none`. Infinite animation is for genuine progress only.
Why: decorative motion is the most common tell of generated UI, and unpaired motion fails
users who asked the OS for less of it.

### 4. Follow the contract in the installed `.meta.json`

Each installed item has `components/super-ai/<name>.meta.json`. Read it before composing the
item. It wins over the docs site when they disagree. The cross-cutting contracts it names:

- State: generation-aware UI shows idle, queued, streaming, done, failed and locked.
- Cost: an action that spends shows its cost before the user commits.
- Provenance: a generated asset keeps its prompt, model, seed and params.
- Empty: every panel, list and pane has an empty state; it is the first thing users see.
- Approval: an artifact awaiting approval offers Confirm, Edit, Regenerate and Skip.
- Dialog: multi-turn flows record where each value came from and allow correction without
  restarting.
  Why: the installed file is version-locked to the code you have; the web copy may be newer
  than your install.

### 5. Ask before changing the system, not before building features

Stop and ask the human before you:

- create a new primitive in `components/ui/` or `components/super-ai/`,
- edit an installed registry file instead of composing it,
- add, remove or change the value of a CSS variable in `globals.css`.
  Do not ask for routine feature work: composing installed items, writing app components that
  use tokens, adding pages, wiring data.
  Why: system changes outlive the task and touch every screen; feature work does not, and
  asking about it trains the human to approve without reading.

### 6. Run the check before calling UI done

Run `node scripts/super-ai/validate.mjs <changed files>` and fix every blocker. Exit 0 is the
bar. Exit 3 means the diff changes the system (rule 5): show it to the human.
Why: a sentence asks, a check that runs is what actually changes the result.
```

About 3.4 KB. The routing index does not go in this file: `index/components.toon` is 27.9 KB on
`origin/main`, over the ledger spec's 8 KB budget on its own, so the file points at the
installed `components/super-ai/index.toon` instead of inlining it.

## 4. How it ships

### 4.1 Inside `agent-kit`, not a new item

The recommendation is one item, `@super-ai/agent-kit`, as the ledger spec §3.5 already defines
it, with this spec supplying its rules section and two additions to its `validate` script. A
separate `super-ai-rules` item was considered and is option B in open decision 1.

Files the kit installs, all `registry:file`:

| Target            | Source                                 | Kind                                                                 |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------- | ---- |
| Item              | Target                                 | Source                                                               | Kind |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------- | ---- |
| `agent-kit`       | `AGENTS.super-ai.md`                   | emitted: §3 rules, then the pointer to the index and retrieval order | soft |
| `agent-kit`       | `components/super-ai/index.toon`       | copy of `index/components.toon`                                      | soft |
| `agent-kit`       | `scripts/super-ai/validate.mjs`        | `packages/ds-rules/consumer/validate.mjs`, byte copy                 | hard |
| `agent-kit`       | `scripts/super-ai/rulecheck.mjs`       | `packages/ds-rules/rulecheck.mjs`, byte copy                         | hard |
| `agent-kit`       | `scripts/super-ai/src/token-rules.mjs` | `packages/ds-rules/src/token-rules.mjs`, byte copy                   | hard |
| `agent-kit`       | `scripts/super-ai/system-diff.mjs`     | `packages/ds-rules/consumer/system-diff.mjs`, byte copy              | hard |
| `agent-kit`       | `scripts/super-ai/rules.json`          | emitted: static rules from `rules/*.json`, scopes rewritten          | hard |
| `agent-kit-hooks` | `scripts/check-tokens.mjs`             | shim re-exporting `lintText` from `super-ai/validate.mjs`            | hard |
| `agent-kit-hooks` | `.claude/hooks/super-ai-guard.mjs`     | PreToolUse hook that runs `lintText` on Write and Edit               | hard |

Decision 2A is carried by the second item: `agent-kit-hooks` declares `agent-kit` as a
registry dependency, so opting in is one more `shadcn add`, and `agent-kit` alone never
writes a hook or a file that Nick's global hook would pick up.

Two things the kit must not do:

- **Overwrite the consumer's `CLAUDE.md`, `AGENTS.md` or `.claude/settings.json`.** A
  `registry:file` replaces its target. The kit therefore writes its own file and the install
  `docs` string tells the human the one line to add: `@AGENTS.super-ai.md` in `CLAUDE.md`
  (Claude Code follows the import), or a pointer sentence in `AGENTS.md` (which has no import
  syntax). The hook is the same: the kit installs the script, the human adds the matcher.
- **Carry a second copy of the engine.** `rulecheck.mjs` ships byte for byte; what differs in
  a consumer is data (the rules with consumer scopes) and a thin CLI. The one engine change is
  that `scan` takes the vendored scopes as a parameter instead of a module constant.

### 4.2 One authored source

The rules prose is authored once in `apps/docs/lib/consumer-rules.ts` and emitted by
`pnpm contract:emit` beside the metas, so the existing drift test in `contract-emit.test.ts`
holds the emitted files to their sources, the same arrangement as D23 for component guidance. The rule list in R2 and R3 is checked against the blocker ids in
`packages/ds-rules/rules/*.json`, so a rule added to the gate and missing from the prose turns
the test red rather than going unsaid.

### 4.3 The two `validate` additions

- **Motion pairing.** Flag an `animate-*` or `transition-*` class with no `motion-reduce:` pair
  in the same class string. It is a new rule record, MOT-3, with bad and good fixtures, like
  every other. Measured on `origin/main`: 37 of 50 movement class strings (`animate-*` other
  than `none` and `spin`, `transition`, `transition-transform`) across 24 files have no pair
  in the same string. So MOT-3 lands at severity `review`: reported here and in consumers,
  never an exit 1. Fixing the 24 files and promoting it to `blocker` is a follow-up, not this
  initiative.
- **`--system`.** Given a git range (default: the working tree against `HEAD`), list hunks that
  add a file under `components/ui/` or `components/super-ai/`, modify an installed registry
  file, or change a custom property inside `:root` or `.dark` in `globals.css`. Exit 3 when any
  exist, 0 otherwise. This is a report for the human, not a block: the agent may still make the
  change once asked. It makes R5 checkable without making feature work slower.

### 4.4 Soft against hard

- **Soft** is `AGENTS.super-ai.md`. It works only if the agent loads it and follows it, and an
  always-loaded file beat on-demand skills in the measurements the ledger spec cites. It carries
  everything that needs judgment: R1, R4 and the scope of R5.
- **Hard** is `super-ai-validate.mjs`, and optionally the hook and the `check-tokens.mjs` shim.
  The script fails closed (exit 1 on any blocker, exit 2 when it cannot run); the hook fails open,
  as this repo's own hooks and Nick's global hook do, because a guard that breaks editing gets
  removed.
- The advantage this repo has is that the hard layer already exists and is tested: 17 blockers,
  each with fixtures, a drift-gated JSON emission, and a planted-positive habit. The kit only has
  to carry it to the consumer.

### 4.5 Proof

`consumer-test.sh` already scaffolds a fresh app and installs every item. Add: install
`agent-kit`; assert `AGENTS.super-ai.md` exists and the consumer's `CLAUDE.md` is untouched;
run `validate` on the installed tree and expect 0; plant a raw hex and expect 1; plant a new
`globals.css` variable and expect `--system` to exit 3. Each check is proven by its planted
positive before it counts.

## 5. Out of scope

- Building any of it. This is the draft; the plan follows Nick's go.
- The ledger itself (rows, arms, briefs). This spec feeds the ledger's `kit` arm; whether the
  rules move the numbers is the ledger's question to answer.
- Carrying the rules to the Minimal Design System. Worth saying in the PR when it lands, per
  `CLAUDE.md`.
- Any rule about git, branching or deploys in the consumer. Those are the consumer's own house
  rules, not the kit's.

## 6. Decisions (Nick, 2026-11-06: 1A, 2A, 3A)

1. **Packaging.**
   A. Rules section inside `agent-kit` (recommended): one install, one file, matches the ledger spec.
   B. A separate `super-ai-rules` item: installable without the index and validate script, but a
   second consumer surface for the ledger to measure.
2. **Hard layer default.**
   A. `validate` script always; hook and `check-tokens.mjs` shim as opt-in files the install note
   names (recommended).
   B. Script only, no hook or shim.
   C. All three on every install.
3. **Motion.**
   A. Write R3 against what exists (Tailwind scale, named transitions, `motion-reduce` pair) and
   add the pairing check (recommended).
   B. Define real motion tokens first (`--duration-*`, `--ease-*` in the registry's CSS), then
   point R3 at them. A token change across 118 items, so its own initiative.

## Changelog

- 2026-11-06: first draft, from `origin/main` at `76cc8910`.
- 2026-11-06: approved 1A, 2A, 3A. Planning found three corrections: the index is too large to
  inline, MOT-3 lands as `review` because 37 strings are unpaired today, and the opt-in hook
  layer is its own item, `agent-kit-hooks`.
- 2026-11-06: built on `claude/guardrails-rules-file-7f91be` (commits `4a43be2` to `732844e` and
  the review fixes after them). The consumer run found two gaps the plan did not foresee:
  vendored `ai-elements` must stay warnings in consumers (`rules.json` carries the vendored
  list), and the hook must compare real paths (it failed open on a symlinked project).
