# CLAUDE.md

## Project overview

`super-ai-components` — a shadcn-style **registry** of AI-interface components, distributed by `npx shadcn add` rather than as an npm package. Turborepo + pnpm workspaces.

```
apps/docs        Next.js docs site — owns registry/super-ai/**, the token gate, the registry build
apps/storybook   Storybook workspace — and the accessibility gate (see CI)
```

`pnpm-workspace.yaml` also globs `packages/*`, but that directory does not exist yet — `apps/docs` and `apps/storybook` are the only workspaces today.

Design specs live under `docs/superpowers/specs/` and implementation plans under `docs/superpowers/plans/`, one file per initiative.

Repo: `github.com/VV-DSGN-INC/Super-AI-Components`.

**IMPORTANT — identity:** this lives under the **VV-DSGN-INC** org, not `weeeha`. Check the remote before pushing; several sibling design repos are under `weeeha` and the two have been mixed up before. Confirm the target repo and branch out loud before any push or deploy.

## IMPORTANT: the rule book lives in `docs/`, and this file is only a map

The real contracts are written down, in one copy each, under `docs/`. **This file points at them and must never restate them** — a second copy is how instructions drift, which is why `CONTINUE.md` §3.4 also forbids pasting them into subagent prompts.

Read these before writing any component code. The first two are contracts, not suggestions:

1. **[`docs/design-system/component-build-brief.md`](docs/design-system/component-build-brief.md)** — the house contract every component is built to. The single most important file in the repo, and what each build agent gets handed.
2. **[`docs/design-system/block-build-brief.md`](docs/design-system/block-build-brief.md)** — family O (blocks) only. Supplements the above, never replaces it.
3. **[`docs/design-system/story-conventions.md`](docs/design-system/story-conventions.md)** — the case-story convention. Also supplements the build brief rather than replacing it: declared-state stories restate the types, case stories are the only place a component's real situations are recorded.
4. **[`docs/CONTINUE.md`](docs/CONTINUE.md)** — where things stand, how a component gets built end to end, traps that have actually bitten, and the composition-gap backlog (§8).
5. **[`docs/design-system/decisions.md`](docs/design-system/decisions.md)** — especially D9 (family G cut), D12, D13.
6. **[`docs/design-system/a11y-baseline.md`](docs/design-system/a11y-baseline.md)** — the measured accessibility posture, the recurring contrast failure, and what is excluded from the gate and why.
7. **[`docs/design-system/anti-slop.md`](docs/design-system/anti-slop.md)** — the anti-slop taxonomy, audit, and fix ladder for generated UI; the runnable version is the `unslop` skill (`.claude/skills/unslop/`), used before building and again before "done".

Specs are normative **including their prose**: [`catalog.md`](docs/design-system/catalog.md) · [`component-specs.md`](docs/design-system/component-specs.md) · [`block-specs.md`](docs/design-system/block-specs.md).

**Catalog status: 116 of 116 shipped**, nothing `building`. There is no next batch. The `contractExempt` retrofit is **done** — the flag has since been deleted (D20), so every shipped item is under the full story-state and documentation contract. The remaining work is the gaps in `CONTINUE.md` §8.

## IMPORTANT: The registry is the product

`registry/super-ai/**/*.tsx` under `apps/docs` is what consumers actually install. A component that looks right in Storybook but breaks on `shadcn add` has failed. That is what the consumer install test in CI exists to catch — treat a red `consumer-test.sh` as a shipping bug, not a CI flake.

`pnpm build:registry` regenerates registry output. Run it after changing any registry source; a stale registry is invisible locally and broken for consumers.

## Rules that are easy to break by accident

Each has cost a real debugging session. The reasoning is in the linked file — this is only the trigger.

- **`apps/docs/lib/catalog.manifest.ts` is the one shared file.** Single source of truth, prepared centrally. A subagent must never write it. → `CONTINUE.md` §3.2
- **`consumes` / `shadcn` / `npm` are reconciled from real imports** — never from the catalog's assumed bases (it names primitives this repo does not vendor) and never from a builder's own list. → `CONTINUE.md` §3.5
- **A gate list must mirror `ci.yml`, in `ci.yml`'s order.** A gate missing from a written list goes unrun for a whole phase, and because CI stops at the first failure, one red gate hides every gate behind it. This has already happened here. → `CONTINUE.md` §1
- **A green run can prove nothing.** `playwright.config.ts` runs `pnpm start`, and `next start` serves the _prebuilt_ output — editing source without rebuilding tests a stale app. Rebuild, then run.
- **The a11y exclusion list may only shrink, never grow.** Adding a file to silence a new failure defeats the gate; fix the component instead. → `a11y-baseline.md`
- **Never pair `text-muted-foreground` with `bg-muted` / `bg-accent` / `bg-secondary`** — same lightness in this token set, 4.34:1 against a 4.5:1 minimum. When a component paints a surface, **rebind the variable** (`[--muted-foreground:var(--accent-foreground)]`) rather than restyling slots: composed children carry their own muted classes and a slot-level override cannot reach them. → `a11y-baseline.md`
- **Blocks compose; they do not implement.** When a composed component does not fit, use a labelled sibling or a documented override and _report the gap_ — never fork or reimplement it. A reimplemented row passes every gate and is still wrong. → `block-build-brief.md`
- **Don't name a state `default`** — it becomes the story export `Default`; use a meaningful name (`text-only`, `plain`). Note this is weaker than it looks: `check:contract` only asserts that every declared state has a matching export, so `default` would pass. What actually prevents it is the scaffolder never emitting one (pinned by `new-component.test.ts`). Blocks must export `Empty` and `Responsive` — that one _is_ gate-enforced. → `CONTINUE.md` §3.2
- **Family G and O5 are cut** (D9). Do not revive them.

## Parallel builds

Parallel agents are the throughput mechanism, not an optimization — one agent per component, each writing only its own five files. Sequential building runs at roughly 7 components per session; twelve concurrent agents have twice done a wave in one pass. Two things to get right:

- **Give each agent its own git worktree.** They otherwise share a working tree and each runs a repo-root `pnpm typecheck`; concurrent runs race on `tsbuildinfo` and typecheck against each other's half-written files. Take your own port and browser tab too — a sibling worktree's dev server on the same port will serve _its_ build while your preview reports success.
- **Check the worktree's base commit.** An isolated worktree may be cut from `main` rather than from your integration branch, so it will not carry your prep. Verify rather than assume, and check incoming files against any in-flight refactor before landing them.

→ `CONTINUE.md` §3.4, and §8 for the current gap backlog.

## Commands

Everything routes through turbo from the repo root:

| command                            | what it does                            |
| ---------------------------------- | --------------------------------------- |
| `pnpm dev`                         | all workspaces                          |
| `pnpm lint` / `typecheck` / `test` | across the monorepo                     |
| `pnpm check:tokens`                | **the token contract gate** (see below) |
| `pnpm check:contract`              | manifest / story / docs contract        |
| `pnpm build:registry`              | regenerate registry output              |
| `pnpm build`                       | full build                              |
| `pnpm format` / `format:check`     | prettier (note: not run in CI)          |

Per-workspace: `cd apps/docs && pnpm new:component <name>` scaffolds the five files · `cd apps/docs && pnpm exec playwright test` is the smoke gate (rebuild first) · `cd apps/storybook && pnpm test:stories` is the axe a11y gate · `apps/docs/scripts/consumer-test.sh` installs everything into a fresh app.

Use `pnpm`, not npm — the lockfile is `pnpm-lock.yaml` and CI installs with `--frozen-lockfile`.

## The token gate

`packages/ds-rules/rulecheck.mjs` (invoked by `pnpm check:tokens`) enforces the design spec's token contract across `registry/super-ai/**/*.tsx`. It fails the build on:

- raw hex colours (`#1a1a1a`)
- raw `oklch(...)`
- Tailwind palette classes (`bg-zinc-400`, `text-blue-600`, `border-slate-200`, …)
- a bare `text-muted-foreground` in the same quoted class string as a bare `bg-muted` / `bg-accent` / `bg-secondary`

Since the records swap, the same step also enforces the adopted core blockers — gradients, emoji in chrome, `animate-bounce`, `transition-all`, generic CTAs, recharts defaults, and unpaired `outline-none` — plus everything else severity `blocker` in `packages/ds-rules/rules/*.json`; that emitted JSON is the authoritative list.

Rules are typed records in `packages/ds-rules/src/`; the emitted `rules/*.json` is drift-gated, and every rule ships bad+good fixtures.

**Documented limitation:** an issue reference like `#1234` in a comment false-positives as hex. Write `GH-1234` in registry sources instead.

**Second documented limitation, and the important one:** the contrast rule catches only the _single-element_ shape. It cannot see the cross-component case — muted text in a child whose ancestor sets the muted background — and **every instance that has actually shipped broken was that shape.** `pnpm test:stories` is the real backstop.

This checker is the most portable thing in the repo — the sibling `Minimal Design System` has no equivalent. If you improve it here, say so in the PR body so it can be carried across.

## CI

`.github/workflows/ci.yml`, job `verify`, in this order:

`install --frozen-lockfile` → `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → **Playwright smoke** → **Storybook a11y + interaction** → **consumer install test**

Eleven steps. The last three are the ones that actually exercise the product, and they are last — so any earlier failure hides them entirely. Do not add a step that duplicates one of these, and do not disable a step to get a PR green: the consumer test, the a11y gate and the token gate are the three that protect people downstream.

Note `format:check` is **not** in CI, so markdown and prose formatting are not gated.

## Conventions

- Every component ships with its story and its registry entry **in the same commit**. A component without a registry entry is invisible to consumers; a component without a story is untested.
- Components are grouped into families and shipped in waves (`feat(wave-1.5): batch 3 — family E`). Keep a batch's components in one PR so the family reads as a set.
- Semantic roles over presentation: prefer a correct `role`/`aria-*` on a primitive to a visually equivalent div. Past fixes in this repo have been exactly this (`pin role="note"` so a checkbox story stops reading as an open gate).
- Branch per task; never commit to `main` directly. Deploys are manual, from `apps/docs`, and need the `weeeha` GitHub account — nothing deploys on merge.

## Open decisions — flag, don't silently pick

- **Overlap with `@weeeha/ui`** (the `Minimal Design System` repo). Both define AI-interface components. Before adding a component here, check whether it exists there and say which repo should own it — do not quietly fork a second implementation.

## Finishing a task

Verify before claiming done: the gates pass and the registry builds. Then give a link — a deployed preview or the local docs URL. A green build is not a working page.
