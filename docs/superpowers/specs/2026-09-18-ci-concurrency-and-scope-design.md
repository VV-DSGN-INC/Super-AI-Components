# CI concurrency and docs-only scope: design

**Date:** 2026-09-18. **Baseline:** `main` at `9ded33d` (PR #58 merged). **Plan:**
[`../plans/2026-09-18-ci-concurrency-and-scope.md`](../plans/2026-09-18-ci-concurrency-and-scope.md).

**Starts after** Task 5 of `2026-09-17-project-review-remediation.md` has merged. That
task replaces the whole of `ci.yml` with two parallel jobs, `gates` and `product`, and
this design is written on top of that file. Anything changed in `ci.yml` before Task 5
lands would be overwritten by it.

Two changes to CI. A superseded pull request run is cancelled when a newer push
arrives. A pull request that touches only documents skips the `product` job's steps,
and the job still reports green.

## 1. Measured state

| check                                          | result                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| repository visibility                          | public, so GitHub-hosted Actions minutes cost nothing                                                                             |
| branch protection on `main`                    | none (`gh api …/branches/main/protection` returns 404). No check is required today                                                |
| last 25 CI runs                                | 24 green, 1 red, 6 to 10 minutes each                                                                                             |
| step times, run 35305434349                    | `test` 111 s, `build` 63 s, Playwright 58 s, Storybook a11y 132 s, consumer install 67 s; every other step under 25 s             |
| time the `product` steps take                  | about 320 s of a 515 s run                                                                                                        |
| docs-only share of the last 40 merged PRs      | 5 of 40 (every changed path under `docs/`, or a root-level `*.md`)                                                                |
| what reads repo-root `docs/` from the code     | `check-contract.mts` and `claude-md.test.ts`, both in the `gates` job. `gen-manifest.mts` also reads it and runs in no job        |
| what the `product` job reads from `docs/`      | nothing. `build:registry` is `gen-wiring` + `gen-registry` + `shadcn build`, and no script in the job opens the repo-root `docs/` |
| `concurrency` in `ci.yml` today                | absent. Every push to a PR branch runs to completion, even when the next push has already replaced it                             |
| `CLAUDE.md` after Task 5 and the review budget | 14,495 bytes of 14,500. Five bytes free                                                                                           |

**What this buys, stated plainly.** After Task 5 a pull request waits for the slower of
two parallel jobs, and `product` is the slower one. A docs-only pull request would stop
waiting for it: roughly two and a half minutes saved, on about one pull request in
eight, and no money either way. The larger reason to build it now is that the scoping
is done with step guards, which keep working on the day `main` gets required checks.

## 2. Design

### 2.1 Concurrency

```yaml
concurrency:
  group: ci-${{ github.event.pull_request.number || github.sha }}
  cancel-in-progress: true
```

A pull request's runs share a group keyed by its number, so a new push cancels the run
it replaces. A push to `main` is keyed by its commit SHA, which makes every group on
`main` unique: nothing there is ever cancelled, and nothing waits behind another run.

Keying `main` by ref with `cancel-in-progress: false` looks equivalent and is not. A
concurrency group holds one running and one pending run, and a newer pending run
replaces the older pending one. Three merges in five minutes, which is how stacks land
here, would lose the middle run without any red mark.

### 2.2 The scope decision

One module, `apps/docs/scripts/lib/ci-scope.mjs`, beside the other pure gate logic and
its test. It uses the standard library only and needs no build step, because `ci.yml`
runs it before `pnpm install`, on the Node the runner image ships with.

It reads changed paths on stdin and prints `true` (run the product steps) or `false`.
The light list is three patterns, and each one is a checked claim from §1:

| pattern       | matches                                | why the `product` job cannot see it                                                                        |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `^docs/`      | everything under the repo-root `docs/` | its only readers run in `gates`                                                                            |
| `^\.claude/`  | skills, hooks, settings                | its one reader, `packages/ds-rules/src/hook-mirror.test.ts`, runs in `gates`; CI never runs `run-gates.sh` |
| `^[^/]+\.md$` | a markdown file at the repo root       | `CLAUDE.md` is read by `claude-md.test.ts`, in `gates`. Nested markdown is never light                     |

Everything else is heavy, including `tools/`, `research/`, `reviews/`, `.github/`, every
root config file, and this module itself.

**It fails open.** An empty list is heavy. A path git had to quote is heavy. Renames
are listed as a delete plus an add (`--no-renames`), so moving a file out of `apps/`
into `docs/` is heavy. A push event never consults the module. If `git` or `node`
fails, the shell falls through to `heavy=true`. The step guards skip only on the exact
string `false`, so an empty or missing output runs everything.

### 2.3 Wiring in `ci.yml`

- `gates` is untouched and never scoped. It is the job that reads `docs/`, and it
  carries `format:check`, which covers every markdown file.
- `product` checks out with `fetch-depth: 2`. On a pull request `HEAD` is GitHub's
  merge commit and its first parent is the base, so `git diff HEAD^1 HEAD` is exactly
  what the pull request changes, with no API call and no token.
- The second step, `id: scope`, writes `heavy=true|false` to `$GITHUB_OUTPUT`. When it
  skips, it writes one line to the step summary, so a green `product` with no work in
  it says why.
- Every later step, including both setup actions, carries
  `if: steps.scope.outputs.heavy != 'false'`. The setup actions are guarded too:
  `setup-node@v4`'s cache post-step throws, and fails the job, when the pnpm store
  path does not exist, and a skipped install never creates it (`src/cache-save.ts`).
- Guards sit on steps, never on the workflow. A `paths:` filter stops the workflow from
  starting, a required check that never starts never reports, and the pull request
  waits forever. That cannot bite today, because nothing is required, and it is the
  first thing that would bite on the day something is.

### 2.4 Tests

`apps/docs/scripts/lib/ci-scope.test.ts`, 29 cases, run by `pnpm test` in `gates`:

- five lists that must be light, and fifteen that must be heavy. The heavy half is the
  control: a classifier that answered `false` to everything passes the light half.
- the light list pinned to its three patterns, so widening it is a diff a reviewer sees.
- the module run as a process, the way `ci.yml` runs it.
- six assertions on `ci.yml` itself: `gates` never mentions the scope output; checkout
  depth is 2; the scope step is second and passes `--no-renames`; every later step
  carries the exact guard; no workflow-level `paths:`; the concurrency group string.

In the state this plan starts from, four of the 29 fail. With the design applied, all
29 pass. Both were run while writing this spec.

### 2.5 Written mirrors

| file                                   | change                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.claude/skills/gate-run/run-gates.sh` | two header comment lines: CI may skip `product` on a docs-only pull request; this script never skips |
| `.claude/skills/gate-run/SKILL.md`     | one short paragraph saying the same                                                                  |
| `CLAUDE.md`, CI section                | one paragraph describing the skip, replacing the `format:check` history paragraph (§2.6)             |
| `docs/CONTINUE.md` §4                  | receives that history paragraph under a bold lead, like the other traps                              |

### 2.6 Making room in `CLAUDE.md`

The file has five bytes free and the CI section must say that `product` can skip, or
the map is wrong. The paragraph that starts "`format:check` joined the list on
2026-09-07" is 466 bytes of history: why a hook once blocked a repo-wide format. The
commands table already carries the one live fact in it ("gated in CI since
2026-09-07"). It moves to `CONTINUE.md` §4, where traps that have bitten are kept, and
the 255-byte scope paragraph takes its place. Net change: 211 bytes fewer. The ceiling
constant is not touched. The plan starts only from the first row below and stops
otherwise, so that one plan never has to rewrite another's expected numbers.

| entry state                              | `CLAUDE.md` before | after  |
| ---------------------------------------- | ------------------ | ------ |
| Task 5 and the review budget both landed | 14,495             | 14,284 |
| Task 5 landed, the review budget has not | 14,367             | 14,156 |

## 3. Decisions Nick can overrule

| #   | decision                | default the plan assumes                                                   | alternative                                                                        |
| --- | ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| D1  | the light list          | `docs/`, `.claude/`, root `*.md`                                           | add `research/` and `reviews/`. Neither showed up in the 40 measured pull requests |
| D2  | runs on `main`          | never cancelled, keyed by SHA                                              | key by ref and cancel, which saves free minutes and loses per-merge verdicts       |
| D3  | what leaves `CLAUDE.md` | the `format:check` history paragraph moves to `CONTINUE.md` §4             | move "One quirk worth knowing" instead (about 330 bytes), or both                  |
| D4  | proving the skip        | a throwaway draft pull request stacked on the branch, watched, then closed | wait for the next real docs pull request and look then                             |

## 4. Acceptance

- `pnpm --filter docs exec vitest run scripts/lib/ci-scope.test.ts`: 29 passed.
- The pull request for this change is itself heavy. Both jobs run in full and pass.
- The proof pull request (D4) shows `product` green in under a minute, every step after
  "Scope" skipped, and the summary line "Docs-only change: product steps skipped".
  `gates` runs in full on it.
- A second push to the proof branch within a minute leaves the first run `cancelled`.
- `wc -c CLAUDE.md` matches the table in §2.6, and `claude-md.test.ts` is green.
- `.claude/skills/gate-run/run-gates.sh` is green before the pull request opens.

## 5. Not in scope

- **Scoping the `gates` job.** It reads `docs/` and formats markdown. It always runs.
- **Path-based scoping inside `product`** (for example, Storybook-only changes skipping
  the consumer test). Every such rule is a claim about what a step reads, and the three
  steps it would touch are the ones that protect consumers.
- **Branch protection and required checks.** A separate decision. This design is safe
  under it and does not add it.
- **Minimal Design System.** It already cancels superseded runs. Whether docs-only
  scoping pays there needs its own measurement.
