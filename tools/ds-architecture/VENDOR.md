# Vendored: ds-architecture conformance checker

Authority flows one way: the `ds-architecture` repo is upstream, and is where a stage
is specced and fixture-tested before it travels. Refreshing is a manual copy during a
normal sweep — an automatic sync would let an unexercised stage travel.

| Artifact        | Upstream path                      | SHA     | Date       |
| --------------- | ---------------------------------- | ------- | ---------- |
| ds-architecture | scripts/, src/, stages/, starter-kit/, LADDER.md | 1afb173 | 2026-10-20 |

- **Source:** the `ds-architecture` repo (now `weeeha/ds-architecture`, private), commit `1afb173`
  (2026-10-20, "Merge pull request #7 from weeeha/feat/stage-10-runtime-identity"). Stages built
  upstream at that commit: 00, 01, 09, 10.
- **Vendored here:** 2026-08-22 at stage 00; refreshed to `396bab6` on 2026-09-14,
  runtime only (scripts/, src/, stages/, LADDER.md); refreshed to `1afb173` on
  2026-10-21 (the same set plus starter-kit/, and the checker's own `tsconfig.json`
  and `vitest.config.ts`, which its suite now needs: the tsconfig excludes
  `stages/10-runtime-identity-and-streams/reference/record-streams.ts`, a template that
  imports `ai`, and the vitest config collects two starter-kit tests). MANUAL.md,
  DESIGN.md, ARCHITECTURE.md, README.md, `gates/` and `harness/` stay upstream — one copy
  of the rule book.
- **Stage 10 declared 2026-10-21.** `runtime.systemId` is `super-ai`, written onto
  `<html>` by `apps/docs/components/theme-provider.tsx` (added to the `components` role
  for that reason, and exempt from `data-slot` because it renders no DOM of its own). Four
  registry files and one primitive are `slotExempt`, each with its reason in the config.
  `10.3` and `10.4` are not applicable: no `runtime.partsRenderer` is declared.
- **Stage 01 and 09 at the 2026-09-14 refresh: unmet, recorded rather than fixed.**
  (`01.2` and `09.1` closed on 2026-10-21 with the flat name contract in
  `packages/ds-rules/src/tokens.ts` and the Loops section of `CLAUDE.md`; `01.3` and
  `01.6` stay open, see that PR.) The refresh is what made these visible; closing them is separate work, sized in
  `CONTINUE.md` §8. `highestContiguous` is therefore **00**, which is the
  honest number and not the one the agentic-contracts spec first predicted.

  | claim  | what it wants                                                   | why this registry does not meet it today                                                                                                                                 |
  | ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `01.2` | every token declared in the style entry is in the name contract | 72 stock shadcn tokens live in `apps/docs/app/globals.css`; `packages/ds-rules/src/local.ts` names only the ones it bans. The contract here is a ban list, not a roster. |
  | `01.3` | an alias points at a semantic token, never a literal            | six `--radius-*` aliases carry literals, which is how stock shadcn ships its radius scale.                                                                               |
  | `01.6` | every token reaches a consumer                                  | eight `--sidebar-*` tokens are declared and read by nothing in `registry/super-ai/**`.                                                                                   |
  | `09.1` | the instructions file describes both loops and the human gate   | `CLAUDE.md` is deliberately a map (see its own second heading); the loops live in `CONTINUE.md` §3.                                                                      |

- **`09.3` closed 2026-09-18.** The review-round budget is
  `docs/design-system/review-rounds.md`, with a one-line pointer under
  Conventions in `CLAUDE.md` because the probe reads only that file. Four
  claims stay unmet, so `highestContiguous` is still **00**.

- **Local changes:** `@types/node` added to devDependencies (its typecheck
  fails without it; found while verifying the archive). `package.json` is otherwise the
  2026-09-14 one: upstream's `bin`, `files` and `harness:*` entries serve its npm
  package and are not needed by a copied tree.
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
  test suite: `cd tools/ds-architecture && npm install && npm test` (294
  tests in 24 files at `1afb173`; node_modules is gitignored).
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

## Local modifications

- **2026-10-12, names only.** Client brand and repo names in the vendored copy were
  replaced with placeholders, because this repo is public: the starter kit's icon package
  became `@your-org/ui`, its two example themes became `brand-emerald` and `brand-warm`,
  and stage 01's reference test no longer lists the brand name among the words the
  reference CSS must not contain. No behaviour changed: these files are not part of the
  pnpm workspace and nothing in this repo runs their tests. Upstream is unchanged.
- **2026-10-21, superseded.** Upstream made the same scrub itself on 2026-10-16
  (`7345397`, "drop the reference repo's name and its owner from every tracked file"),
  with `@acme/ui` where this copy had `@your-org/ui`. The `1afb173` refresh takes
  upstream's wording verbatim, so the copy carries no local edit beyond `package.json`.
  Re-checked at refresh: no client brand, client repo name, personal npm scope or
  absolute path from a developer machine anywhere under `tools/ds-architecture/`.
