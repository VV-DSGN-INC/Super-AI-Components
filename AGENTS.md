# AGENTS.md

## Project overview

`super-ai-components` — a shadcn-style **registry** of AI-interface components, distributed by `npx shadcn add` rather than as an npm package. Turborepo + pnpm workspaces.

```
apps/docs        Next.js docs site — owns registry/super-ai/**, the token gate, the registry build
apps/storybook   Storybook workspace — and the accessibility gate (see CI)
```

`pnpm-workspace.yaml` also globs `packages/*`; `packages/ds-rules` (rule records + detector behind `check:tokens`) is the third workspace.

Design specs live under `docs/superpowers/specs/` and implementation plans under `docs/superpowers/plans/`, one file per initiative.

Repo: `github.com/VV-DSGN-INC/Super-AI-Components`.

**IMPORTANT — identity:** this lives under the **VV-DSGN-INC** org, not `weeeha`. Check the remote before pushing; several sibling design repos are under `weeeha` and the two have been mixed up before. Confirm the target repo and branch out loud before any push or deploy.

## IMPORTANT: the rule book lives in `docs/`, and this file is only a map

The real contracts are written down, in one copy each, under `docs/`. **This file points at them and must never restate them** — a second copy is how instructions drift, which is why `CONTINUE.md` §3.4 also forbids pasting them into subagent prompts.

Read these before writing component code. The first two are contracts:

1. **[`docs/design-system/component-build-brief.md`](docs/design-system/component-build-brief.md)** — the house contract every component is built to. The single most important file in the repo, and what each build agent gets handed.
2. **[`docs/design-system/block-build-brief.md`](docs/design-system/block-build-brief.md)** — family O (blocks) only. Supplements the above, never replaces it.
3. **[`docs/design-system/story-conventions.md`](docs/design-system/story-conventions.md)** — the case-story convention. Also supplements the build brief rather than replacing it: declared-state stories restate the types, case stories are the only place a component's real situations are recorded.
4. **[`docs/CONTINUE.md`](docs/CONTINUE.md)** — where things stand, how a component gets built end to end, traps that have actually bitten, and the composition-gap backlog (§8).
5. **[`docs/design-system/decisions.md`](docs/design-system/decisions.md)** — especially D9 (family G cut), D12, D13.
6. **[`docs/design-system/a11y-baseline.md`](docs/design-system/a11y-baseline.md)** — the measured accessibility posture, the recurring contrast failure, and what is excluded from the gate and why.
7. **[`docs/design-system/anti-slop.md`](docs/design-system/anti-slop.md)** — this repo's anti-slop decisions and the rule that enforces each. The taxonomy, audit and fix ladder are the `unslop` skill (`.claude/skills/unslop/`), used before building and again before "done".

Specs are normative **including prose**: [`catalog.md`](docs/design-system/catalog.md) · [`component-specs.md`](docs/design-system/component-specs.md) · [`block-specs.md`](docs/design-system/block-specs.md).

**Catalog status: 137 of 137 shipped**, nothing `building`, no next batch. The `contractExempt` flag is deleted (D20), so every shipped item is under the full story-state and documentation contract. The remaining work is the gaps in `CONTINUE.md` §8.

## IMPORTANT: The registry is the product

`registry/super-ai/**/*.tsx` under `apps/docs` is what consumers actually install. A component that looks right in Storybook but breaks on `shadcn add` has failed. That is what the consumer install test in CI exists to catch — treat a red `consumer-test.sh` as a shipping bug, not a CI flake.

`pnpm build:registry` regenerates registry output. Run it after changing any registry source; a stale registry is invisible locally and broken for consumers.

## Rules that are easy to break by accident

Each has cost a real debugging session. The body holds the reasoning; this is only the trigger. Open the body when the trigger matches the work in front of you.

### Shared files and dependencies

- **`apps/docs/lib/catalog.manifest.ts` is the one shared file; a subagent must never write it.** Read `docs/agent-rules/catalog-manifest.md`. Gate: `apps/docs/lib/catalog.manifest.test.ts`.
- **`consumes` / `shadcn` / `npm` are reconciled from real imports, never from the catalog or a builder's own list.** Read `docs/agent-rules/reconcile-deps.md`. Gate: `apps/docs/scripts/reconcile-deps.mts`.
- **Contracts derive; never hand-edit a `.meta.json`, `index/components.toon` or `public/llms*`.** Read `docs/agent-rules/contracts-derive.md`. Gate: `apps/docs/scripts/lib/contract-emit.test.ts`.
- **Family G and O5 are cut (D9); do not revive them.** Read `docs/agent-rules/family-g-cut.md`. Gate: `apps/docs/lib/catalog.manifest.test.ts`.

### Gates and CI

- **A gate list must mirror `ci.yml`, in `ci.yml`'s order.** Read `docs/agent-rules/gate-list-mirrors-ci.md`.
- **A green run can prove nothing: `next start` serves the prebuilt output, so rebuild, then run.** Read `docs/agent-rules/green-proves-nothing.md`.
- **`apps/storybook` compiles `apps/docs` source and turbo can't see it; pin new tasks in its `turbo.json`.** Read `docs/agent-rules/storybook-compiles-docs.md`. Gate: `apps/docs/scripts/turbo-inputs.test.ts`.
- **The a11y exclusion list and `story-coverage.baseline.json` may only shrink, never grow.** Read `docs/agent-rules/ratchets-only-shrink.md`. Gate: `apps/docs/scripts/lib/a11y-ratchet.test.ts`, `apps/docs/scripts/lib/story-coverage.test.ts`.
- **The token gate (`pnpm check:tokens`) bans raw colours, palette classes and the core blockers; its contrast rule misses cross-component cases.** Read `docs/agent-rules/token-gate.md`. Gate: `packages/ds-rules/rulecheck.mjs`.
- **Every gate allowance is indexed with a reason; add one in its own list, add its reason, then run `pnpm exceptions:emit`.** Read `docs/agent-rules/exceptions-index.md`. Gate: `apps/docs/scripts/lib/exceptions/emit.test.ts`, `apps/docs/scripts/exceptions-delta.mjs`.

### Component code

- **Never pair `text-muted-foreground` with `bg-muted` / `bg-accent` / `bg-secondary`; rebind the variable instead.** Read `docs/agent-rules/muted-on-muted.md`. Gate: `packages/ds-rules/rulecheck.mjs`.
- **Blocks compose; they do not implement. Report the gap, never fork or reimplement.** Read `docs/agent-rules/blocks-compose.md`.
- **Don't name a state `default`; blocks must export `Empty` and `Responsive`.** Read `docs/agent-rules/no-default-state.md`. Gate: `apps/docs/scripts/new-component.test.ts`.

### Parallel work

- **Parallel builds: one worktree per agent, and check the worktree's base commit.** Read `docs/agent-rules/parallel-builds.md`.

## Commands

Everything routes through turbo from the repo root:

| command                            | what it does                                          |
| ---------------------------------- | ----------------------------------------------------- |
| `pnpm dev`                         | all workspaces                                        |
| `pnpm lint` / `typecheck` / `test` | across the monorepo                                   |
| `pnpm check:tokens`                | **the token contract gate** (see the token gate stub) |
| `pnpm check:contract`              | manifest / story / docs contract                      |
| `pnpm build:registry`              | regenerate registry output                            |
| `pnpm build`                       | full build                                            |
| `pnpm format` / `format:check`     | prettier — **gated in CI since 2026-09-07**           |
| `pnpm check:ladder`                | ds-architecture conformance, not in CI                |
| `./scripts/linux-gate.sh`          | **the Storybook gate in the CI image**                |

Per-workspace: `cd apps/docs && pnpm new:component <name>` scaffolds the five files · `cd apps/docs && pnpm exec playwright test` is the smoke gate (rebuild first) · `cd apps/storybook && pnpm test:stories` is the axe a11y gate · `apps/docs/scripts/consumer-test.sh` installs everything into a fresh app.

Use `pnpm`, not npm — the lockfile is `pnpm-lock.yaml` and CI installs with `--frozen-lockfile`.

## CI

`.github/workflows/ci.yml`, three parallel jobs, each in this order:

`gates`: `install --frozen-lockfile` → `lint` → `format:check` → `typecheck` → `check:tokens` → `check:contract` → `test`
`exceptions-delta` (pull requests only, a report that never fails): `Exceptions delta report`
`product`: `install --frozen-lockfile` → `build:registry` → `build` → **Playwright smoke** → **Storybook a11y + interaction** → **consumer install test**

Thirteen steps. The last three are the ones that actually exercise the product; they run in their own job so a red `gates` step no longer hides them, and within a job a red step still hides every step after it. Do not add a step that duplicates one of these, and do not disable a step to get a PR green: the consumer test, the a11y gate and the token gate are the three that protect people downstream.

One quirk worth knowing: `docs/design-system/story-conventions.md` needs three
`--write` passes to converge, because reformatting its widest table changes the
column widths that decide the wrapping. If `format:check` fails immediately
after a format, run the format again before assuming something else is wrong.

## Conventions

- Every component ships with its story and its registry entry **in the same commit**. A component without a registry entry is invisible to consumers; a component without a story is untested.
- Components are grouped into families and shipped in waves (`feat(wave-1.5): batch 3 — family E`). Keep a batch's components in one PR so the family reads as a set.
- Semantic roles over presentation: prefer a correct `role`/`aria-*` on a primitive to a visually equivalent div. Past fixes in this repo have been exactly this (`pin role="note"` so a checkbox story stops reading as an open gate).
- Branch per task; never commit to `main` directly. Production deploys from `main` after CI is green, through `.github/workflows/deploy.yml`, which needs the `VERCEL_TOKEN` repository secret; a preview is a manual deploy from `apps/docs`.
- Review budget: rounds 1-2 fix everything; from round 3 only a blocker holds the PR. → `docs/design-system/review-rounds.md`

## Loops

- **Build loop**, on a component change: manifest, scaffold, then the co-located files (implementation, story, registry entry, tests), then the gates. `build-component` runs it.
- **Audit loop**, on every pull request and again on merge: the token gate, the contract check, the story run. `gate-run` runs it locally.
- **Human gate**: review approves judgment, not syntax. A rejection is finished only once it is a rule in `packages/ds-rules`, so it cannot recur.

## Open decisions — flag, don't silently pick

- **Overlap with `@weeeha/ui`** (the `Minimal Design System` repo). Both define AI-interface components. Before adding a component here, check whether it exists there and say which repo should own it — do not quietly fork a second implementation.

## Finishing a task

Verify before claiming done: the gates pass and the registry builds. Then give a link — a deployed preview or the local docs URL. A green build is not a working page.
