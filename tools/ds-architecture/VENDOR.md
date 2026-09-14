# Vendored: ds-architecture conformance checker

Authority flows one way: the `ds-architecture` repo is upstream, and is where a stage
is specced and fixture-tested before it travels. Refreshing is a manual copy during a
normal sweep — an automatic sync would let an unexercised stage travel.

| Artifact        | Upstream path                      | SHA     | Date       |
| --------------- | ---------------------------------- | ------- | ---------- |
| ds-architecture | scripts/, src/, stages/, LADDER.md | 396bab6 | 2026-08-22 |

- **Source:** the local `ds-architecture` repo (no remote), commit `396bab6`
  (2026-08-22, "feat: ladder integration across three stages"). Stages built
  upstream at that commit: 00, 01, 09.
- **Vendored here:** 2026-08-22 at stage 00; refreshed to the commit above on
  2026-09-14, runtime only (scripts/, src/, stages/, LADDER.md). MANUAL.md,
  DESIGN.md and README.md stay upstream — one copy of the rule book.
- **Stage 01 and 09 at refresh: unmet, recorded rather than fixed.** The
  refresh is what made these visible; closing them is separate work, sized in
  `CONTINUE.md` §8. `highestContiguous` is therefore **00**, which is the
  honest number and not the one the agentic-contracts spec first predicted.

  | claim  | what it wants                                                   | why this registry does not meet it today                                                                                                                                 |
  | ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `01.2` | every token declared in the style entry is in the name contract | 72 stock shadcn tokens live in `apps/docs/app/globals.css`; `packages/ds-rules/src/local.ts` names only the ones it bans. The contract here is a ban list, not a roster. |
  | `01.3` | an alias points at a semantic token, never a literal            | six `--radius-*` aliases carry literals, which is how stock shadcn ships its radius scale.                                                                               |
  | `01.6` | every token reaches a consumer                                  | eight `--sidebar-*` tokens are declared and read by nothing in `registry/super-ai/**`.                                                                                   |
  | `09.1` | the instructions file describes both loops and the human gate   | `CLAUDE.md` is deliberately a map (see its own second heading); the loops live in `CONTINUE.md` §3.                                                                      |
  | `09.3` | a review-round budget is written down                           | the sibling repos carry one; this repo has never written its own.                                                                                                        |

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
