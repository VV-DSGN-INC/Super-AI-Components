---
name: gate-repair
description: Fix a fan of red gates after a structural change. A directory added, moved, renamed or graduated, a new CSS entry point, a new app or prototype tree, or a usage-contract edit. Use when several unrelated tests go red at once, when a gate names a path that no longer exists, when the test run is red on code the branch did not touch, or when a green result looks too clean to believe. Separates the four independent mechanisms people conflate, and ends in a sweep that tells cause from cascade.
---

# Repairing the gates after a structural change

A structural change reddens several gates at once, and they look related because they
fail together. They are not. **Four independent mechanisms** produce that fan, and
fixing the wrong one turns a red gate green while leaving the real hole open.

## The four mechanisms, in the order to check them

### 1. The scan map

`CATALOG_SCOPES` and `VENDORED_SCOPES` in `packages/ds-rules/src/local.ts`, mirrored by the `case` list in `.claude/hooks/check-tokens-on-edit.sh`; `hook-mirror.test.ts` pins the two equal. **Derive it from disk; never hand-
list it.** A derived map covers a new app or prototype tree on the day it is created.
Every real miss in a hand-drawn list sits in the gap between two of them, and
re-introducing a hand-drawn list is the regression.

Two parts stay hand-maintained, and they are what actually goes red:

- **The ledger of unscanned top-level directories.** A test asserts that the union of
  roots accounts for the whole tree, so a new top-level directory fails until it is
  reachable from a root or listed with a reason. A reason, not a name: the ledger is
  read as justification.
- **Per-gate opt-outs.** A gate may opt a root out and record why at the gate. A gate
  may never opt into a root the map does not know. About to add a path literal to a
  test file? That is the smell.

The theme and finish roster is the same shape for the token axes. Widening either map
is ledger debt in the same commit, never a follow-up.

`ds-architecture.config.json` carries the same roots for the ladder (`scopeRoles`) and the `runtime.slotExempt` ledger: a file allowed to write no `data-slot`, with its reason.

### 2. Tailwind `@source` anchoring (a separate system)

`@source not` resolves **against the file it is written in**, and an `@import` chain
re-anchors it. An exclusion in the root stylesheet does nothing for an entry that
imports it: the exclusion has to be restated at that entry's own depth.

```
apps/docs/app/globals.css         the docs entry
apps/storybook/src/index.css      the Storybook entry; restate every exclusion at its own depth
```

A new CSS entry point needs an `@source` line for its own files, `@source` lines for
any component subtree it renders that the root stylesheet does not scan, and the
exclusions at its own depth. Keep a pair of fixture entries, one fixed and one
unfixed, so a test proves the trap in both directions.

### 3. Derived artifacts

Each emitter's test is both the writer and the drift gate. Run plain, it asserts the
committed artifact equals what the tree would generate. Run with its env var, it
rewrites. So a contract edit reddens the emit gate, and the fix is to regenerate,
never to hand-edit the artifact.

```bash
pnpm --filter ds-rules rules:emit && pnpm build:registry
```

| Emitter          | Artifact                         | Note                                                                                       |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `rules:emit`     | `packages/ds-rules/rules/*.json` | authored in `src/core.ts` and `src/local.ts`; `emit.test.ts` proves emitted matches source |
| `build:registry` | the built registry               | **published**: this is what a consumer installs                                            |

### 4. Ledgers and canaries that quote a path or a count

Ratchet and adoption gates hold counts and path literals: `docs/design-system/a11y-baseline.md`, `docs/design-system/vendored-token-findings.md`, and the counts `.claude/hooks/session-baselines.sh` prints at session start. A graduation moves code across a boundary, so these move too. A canary
quoted in its own rule doc must be re-pointed in both places.

`CLAUDE.md` is a map, not the rule book: a rule that grows a body moves under `docs/` and leaves a one-line pointer. Measure base, branch, and the merge result when two branches both grow it; the collision only appears in the merge.

## Gates that report clean while blind

Never accept these as evidence without a control test.

| Signal                                    | Why it lies                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| story tests pass                          | they under-collect. A collection drop with no failures is not a pass; compare the collected count, not the exit code          |
| visual tests pass                         | pixel comparison skips anti-aliased pixels. It cannot see a contrast regression. Control-test at zero tolerance first         |
| a grep sweep returns clean                | grep goes silently to zero on one NUL byte. Run `file` on anything "clean"                                                    |
| a scanner returns no hits                 | it may be reading its own prose: comments count as code unless the scanner strips them. Seed a violation and confirm it fails |
| a fresh worktree is red on untouched code | stale dependencies. Every checkout needs its own install                                                                      |

## The sweep

Run in this order. Each step's output is only meaningful if the previous one passed,
which is what separates cause from cascade.

```bash
pnpm --filter ds-rules rules:emit && pnpm build:registry
pnpm --filter ds-rules test
pnpm check:tokens && pnpm check:contract
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
```

Rotating timeouts across unrelated files are machine load or a file-count cliff, not
your diff. Prove it before editing anything:

```bash
pnpm --filter ds-rules exec vitest run --no-file-parallelism
```

Done means: the sweep is green, every widened map carries its reason in the ledger,
and any new CSS entry restates the exclusions at its own depth.
