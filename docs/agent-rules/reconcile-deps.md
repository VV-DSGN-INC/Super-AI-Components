# Dependencies come from real imports

This rule protects consumers, who install exactly what `consumes`, `shadcn` and `npm` say and nothing else.

Those three fields are reconciled from the imports in the component's `registry/super-ai/<name>.tsx`, centrally, with `apps/docs/scripts/reconcile-deps.mts`. They are never copied from the catalog's assumed bases, which name primitives this repo does not vendor, and never taken from a builder's own list.

The full account: `docs/CONTINUE.md` §3.5.

## What it costs

A declared dependency that the code does not import, or an import that is not declared, passes in Storybook and breaks on `shadcn add`. The rule prevents that mismatch. Following it costs one reconcile pass per batch, run by the integrator after the components land, and an author who needs a new dependency must import it for real before it is listed.
