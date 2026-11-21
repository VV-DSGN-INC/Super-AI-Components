# A green run can prove nothing

This rule protects the meaning of a passing Playwright smoke run.

`apps/docs/playwright.config.ts` runs `pnpm start`, and `next start` serves the prebuilt output. Editing source and running `playwright test` without rebuilding tests a stale app. Rebuild first, then run. A gate that has only ever passed has proved nothing either: make it fail on a deliberate instance of the bug before you trust it.

The full account: `docs/CONTINUE.md` §1 (the smoke gate section), and `.claude/skills/gate-run/SKILL.md` ("Before you trust a green run").

## What it costs

Without the rebuild, a probe that should fail can pass misleadingly, which is how the console-error assertion first looked verified when it was not. The rule prevents a false green. Following it costs a full `next build` before each smoke run, which `run-gates.sh` already does in its own order.
