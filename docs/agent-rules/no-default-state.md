# Do not name a state default

This rule protects story export names, which are generated from declared state names.

A state named `default` becomes the story export `Default`. Use a meaningful name such as `text-only` or `plain`. Blocks must export `Empty` and `Responsive`; that one is enforced by the contract check. Two states that normalise to the same identifier also collide silently.

The full account: `docs/CONTINUE.md` §3.2 ("Two naming traps, both already hit").

## What it costs

`check:contract` only asserts that each declared state has a matching export, so a state called `default` would pass it. What keeps `Default` out is the scaffolder never emitting one, pinned by `apps/docs/scripts/new-component.test.ts`. Following the rule costs an author a moment to name the state for what it shows.
