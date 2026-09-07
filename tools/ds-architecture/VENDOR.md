# Vendored: ds-architecture conformance checker

- **Source:** `pegbo-inc/design-system-rebuild` (PR #115 there), via the local
  archive `ds-architecture-archive-2026-08-21.zip`; archive stamp
  `design-spec@1d7cf45 (2026-08-21)`.
- **Vendored here:** 2026-08-22, runtime only (scripts/, src/, stages/,
  LADDER.md). MANUAL.md and DESIGN.md stay in the archive — one copy of the
  rule book.
- **Local changes:** `@types/node` added to devDependencies (its typecheck
  fails without it; found while verifying the archive).
- **Inherited open questions** (upstream's, deliberately not fixed here):
  1. A stage directory missing its probe reports `unchecked` but the run still
     exits 0 — "could not tell" collapses into "conformant" for a structurally
     broken stage.
  2. `highestContiguous` counts a stage as reached when only some of its
     claims were determined.
- **Known archive erratum:** its ARCHIVE.md counts the starter kit as 17 files
  / 11 harvested; the kit's own README correctly enumerates 16 / 10.
- **Not wired into CI.** `pnpm check:ladder` is informational; only stage 00
  is scoreable today. This directory is not a pnpm workspace; to run its own
  test suite: `cd tools/ds-architecture && npm install && npm test` (130
  tests; node_modules is gitignored).
- **Staying outside the workspace is deliberate, re-confirmed 2026-09-07.**
  Wave 0 of the post-case-story remediation considered adding `tools/*` to
  `pnpm-workspace.yaml` so this suite would run on a plain `pnpm install`, and
  rejected it. `scripts/lib/no-deps.test.ts` exists to prove every probe is
  dependency-free, because a probe that imports a package works here and fails
  in a target repo that never installed it. Joining the workspace would let
  probes resolve hoisted packages and make exactly that failure invisible,
  which is the one thing this checker cannot afford while it is meant to be
  carried elsewhere. Its `vitest ^2.1.0` and `@types/node ^22` therefore
  diverge from the repo's `^4.1.8` and `^24` **on purpose** — they are the
  target's versions, not this repo's.
- **Known config compromise:** the schema requires `axes[].attribute` to
  match `^data-…`, so `ds-architecture.config.json` declares `data-theme`;
  the repo's real mechanism is the `.dark` class (globals.css
  `@custom-variant dark`). Stage 00 never reads axes against the tree, so
  this is inert today — revisit when a stage consumes axes (stamp
  `data-theme` at runtime, or upstream a schema relaxation).
