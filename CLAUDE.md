# CLAUDE.md

## Project overview

`super-ai-components` — a shadcn-style **registry** of AI-interface components, distributed by `npx shadcn add` rather than as an npm package. Turborepo + pnpm workspaces.

```
apps/docs        Next.js docs site — owns registry/super-ai/**, the token gate, the registry build
apps/storybook   Storybook workspace
packages/*       shared workspace packages
```

Repo: `github.com/VV-DSGN-INC/Super-AI-Components`.

**IMPORTANT — identity:** this lives under the **VV-DSGN-INC** org, not `weeeha`. Check the remote before pushing; several sibling design repos are under `weeeha` and the two have been mixed up before. Confirm the target repo and branch out loud before any push or deploy.

## IMPORTANT: The registry is the product

`registry/super-ai/**/*.tsx` under `apps/docs` is what consumers actually install. A component that looks right in Storybook but breaks on `shadcn add` has failed. That is what the consumer install test in CI exists to catch — treat a red `consumer-test.sh` as a shipping bug, not a CI flake.

`pnpm build:registry` regenerates registry output. Run it after changing any registry source; a stale registry is invisible locally and broken for consumers.

## Commands

Everything routes through turbo from the repo root:

| command | what it does |
|---|---|
| `pnpm dev` | all workspaces |
| `pnpm lint` / `typecheck` / `test` | across the monorepo |
| `pnpm check:tokens` | **the token contract gate** (see below) |
| `pnpm build:registry` | regenerate registry output |
| `pnpm build` | full build |
| `pnpm format` / `format:check` | prettier |

Use `pnpm`, not npm — the lockfile is `pnpm-lock.yaml` and CI installs with `--frozen-lockfile`.

## The token gate

`apps/docs/scripts/check-tokens.mjs` (47 lines) enforces the design spec's token contract across `registry/super-ai/**/*.tsx`. It fails the build on:

- raw hex colours (`#1a1a1a`)
- raw `oklch(...)`
- Tailwind palette classes (`bg-zinc-400`, `text-blue-600`, `border-slate-200`, …)

**Documented limitation:** an issue reference like `#1234` in a comment false-positives as hex. Write `GH-1234` in registry sources instead.

This checker is the most portable thing in the repo — the sibling `Minimal Design System` has no equivalent. If you improve it here, say so in the PR body so it can be carried across.

## CI

`.github/workflows/ci.yml`, job `verify`: install → `lint` → `typecheck` → `check:tokens` → `test` → `build:registry` → `build` → Playwright smoke → consumer install test.

This is a genuinely complete pipeline. Do not add a step that duplicates one of these, and do not disable a step to get a PR green — the consumer test and the token gate are the two that protect people downstream.

## Conventions

- Every component ships with its story and its registry entry **in the same commit**. A component without a registry entry is invisible to consumers; a component without a story is untested.
- Components are grouped into families and shipped in waves (`feat(wave-1.5): batch 3 — family E`). Keep a batch's components in one PR so the family reads as a set.
- Semantic roles over presentation: prefer a correct `role`/`aria-*` on a primitive to a visually equivalent div. Past fixes in this repo have been exactly this (`pin role="note"` so a checkbox story stops reading as an open gate).

## Open decisions — flag, don't silently pick

- **Branching.** Work has been landing on long-lived feature branches (`feat/storybook-component-showcase`) rather than short-lived ones. Confirm the intended base branch before opening a PR rather than assuming `main`.
- **Overlap with `@weeeha/ui`** (the `Minimal Design System` repo). Both define AI-interface components. Before adding a component here, check whether it exists there and say which repo should own it — do not quietly fork a second implementation.

## Finishing a task

Verify before claiming done: `pnpm check:tokens` and `pnpm test` pass, and the registry builds. Then give a link — a deployed preview or the local docs URL. A green build is not a working page.
