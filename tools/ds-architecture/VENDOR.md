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
