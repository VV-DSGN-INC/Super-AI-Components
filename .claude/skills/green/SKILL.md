---
name: green
description: Prove a change in super-ai-components is actually done before opening or updating a pull request. Use when about to claim a change works, before pushing or asking for review, when CI is red on code the branch did not touch, or whenever a local pass and a CI result disagree. Carries the command order that catches failures earliest, the checks that run only in CI, and the failures that look like your diff and are not.
---

# Is it actually green

A local test command is rarely what CI runs, and CI is rarely the whole suite.
Claiming done from the wrong command is the cheapest way to burn a review round.

## What runs where

| Command                                              | What it covers                                                                     | In CI?                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm lint` / `pnpm format:check` / `pnpm typecheck` | per package via turbo; prettier checks markdown too                                | yes                                                       |
| `pnpm check:tokens`                                  | every blocker-severity rule in `packages/ds-rules/rules/*.json` over the catalogue | yes                                                       |
| `pnpm check:contract`                                | the registry contract                                                              | yes                                                       |
| `pnpm test`                                          | each package's vitest suite, including the rules package's drift and mirror gates  | yes                                                       |
| `pnpm build:registry` then `pnpm build`              | the registry JSON and the docs site                                                | yes, second job                                           |
| `pnpm --filter storybook test:stories`               | every story rendered; the real backstop for cross-component contrast               | no: run it yourself when you touch anything rendered      |
| `pnpm check:ladder`                                  | the vendored ds-architecture checker                                               | no: run it when you touch CLAUDE.md, tokens or the config |

CI (`.github/workflows/ci.yml`) runs, in order: `lint`, `format:check`, `typecheck`, `check:tokens`, `check:contract`, `test`; then `build:registry` and `build`.

## The order that catches things earliest

Emitters first. A stale `rules/*.json` or registry reddens a gate for a reason that has nothing to do with your code.

```bash
pnpm --filter ds-rules rules:emit && pnpm build:registry
pnpm lint && pnpm format:check && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
```

Then, if you touched a story, a component or a token:

```bash
pnpm --filter storybook test:stories
```

The single-element contrast rule cannot see muted text inside a child whose ancestor sets the muted background. Every instance that has shipped broken was that shape; the story run is what catches it.

## Three reds that are not your diff

**Stale dependencies in a fresh worktree.** Every checkout needs its own install. The
symptom is a red typecheck or a test-runner API error on code the branch never
touched. Install in this worktree before believing any red.

**Load flakes and the file-count cliff.** Rotating timeouts across unrelated files are
machine load, not logic. Adding one test file can push a suite over a timing cliff and
redden two unrelated gates. Prove which before editing anything:

```bash
npm test -- --no-file-parallelism
```

If that is green, the failure was contention. If you just added a test file and
unrelated gates went red, add an empty test file to a clean tree and confirm it
reproduces before touching your own diff.

**CI checks out the merge ref.** On `pull_request`, the checkout action resolves the
merge of your head into base, so CI can be red on a combination that exists in neither
branch alone. Merge the base into the branch and re-run locally before assuming your
code is at fault. Size ceilings and ratchets collide the same way: measure base,
branch, and the merge result.

## Greens that are not evidence

| Result                   | What it does not prove                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| story tests passed       | they under-collect. Compare the collected count to the previous run; a silent drop still exits zero                            |
| visual tests passed      | pixel comparison skips anti-aliased pixels, so it cannot see a contrast regression                                             |
| a screenshot looks right | a hidden browser pane produces blank or stale frames                                                                           |
| the build succeeded      | the page may still not render. Open it, load data, click through, in two browser engines. If you did not, say it is unverified |

## Reporting

State what you ran and what passed, not "all green". If something was skipped or is
unverified, say which and why. A failing step gets its output quoted, not summarised.
