---
name: gate-run
description: Run every CI gate locally in ci.yml's exact order. Use before claiming a batch is done, before opening a PR, or whenever you need to know whether this tree is actually green.
---

# Running the gates

```bash
.claude/skills/gate-run/run-gates.sh
```

Eleven steps, in `.github/workflows/ci.yml`'s order. It stops at the first
failure, as CI does.

## Why the order is the point

CI stops at the first failing step, so **a red gate early in the pipeline hides
every gate behind it.** That is not hypothetical here: the Playwright smoke gate
was missing from a phase plan's gate list, went unrun for the whole phase, and
its eventual failure silently prevented the Storybook a11y gate and the consumer
install test from ever running — the two that verified that phase's most novel
work.

**Never hand-write a gate list.** If you need one, run this. If `ci.yml` gains a
step, add it here in the same position, and nowhere else.

## Before you trust a green run

- **`next start` serves the prebuilt output.** Editing source without rebuilding
  tests a stale app, and the Playwright smoke gate will pass against it. This
  script runs `build` before `playwright`, so a full run is safe — a partial one
  is not.
- **A gate that has only ever passed has proved nothing.** When you add one,
  make it fail on a deliberate instance of the bug first.

## First run on a fresh clone

`pnpm test:stories` fails with `Executable doesn't exist` rather than anything
a11y-shaped if Playwright's browsers are missing:

```bash
cd apps/storybook && pnpm exec playwright install chromium
```
