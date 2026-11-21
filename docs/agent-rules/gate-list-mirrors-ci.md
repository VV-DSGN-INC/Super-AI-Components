# A gate list mirrors ci.yml

This rule protects the gates that sit behind a red one from going unrun.

Any list of gates, in a plan, a brief or a checklist, must match `.github/workflows/ci.yml` step for step and in its order. Do not write one by hand. Run `.claude/skills/gate-run/run-gates.sh`, which is the one mirror allowed to exist, and change it in the same commit as any change to `ci.yml`.

The full account: `docs/CONTINUE.md` §1 (the smoke gate section), and `.claude/skills/gate-run/SKILL.md`.

## What it costs

CI stops at the first failing step, so one red gate hides every gate behind it. The Playwright smoke gate was once missing from a phase plan's list, went unrun for the whole phase, and its eventual failure kept the Storybook a11y gate and the consumer install test from running. Following the rule costs an author the habit of running the script instead of typing a list, and a ci.yml edit needs a second edit beside it.
