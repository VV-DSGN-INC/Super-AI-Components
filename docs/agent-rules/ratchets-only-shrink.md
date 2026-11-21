# Ratchets only shrink

This rule protects two gates that exist to be strictly tightened: the Storybook a11y exclusion list and `story-coverage.baseline.json`.

A file may leave the a11y exclusion list once its component is fixed; no file may join it to silence a new failure. Fix the component instead. The story-coverage baseline is regenerated with `pnpm story-coverage:baseline` from `apps/docs`, which refuses to grow it, so a resolved obligation is locked in and a new one is a regression.

The full account: `docs/design-system/a11y-baseline.md` ("What the gate enforces today") and `docs/design-system/story-conventions.md` (the story-coverage ratchet).

## What it costs

A list that can grow turns each gate into a record of what was once skipped. The rule prevents that drift. Following it costs an author the fix: a new component with a real a11y failure or an unmet story obligation is repaired, not excused.
