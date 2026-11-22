# The catalog manifest is one shared file

This rule protects the single source of truth that every component's status, states and dependencies are read from.

`apps/docs/lib/catalog.manifest.ts` is prepared centrally, by the integrator, before a batch fans out. A subagent never writes it. Setting a component to `building`, normalising its `states` into kebab-case identifiers, and flipping it to `shipped` all happen in that one place, by one hand.

The full account: `docs/CONTINUE.md` §3.2 (and §3.4 for what each agent is handed instead).

## What it costs

Parallel agents writing one file would overwrite each other's rows and produce merge conflicts in the file everything else derives from. The rule prevents that, and prevents a builder's guess at a state name from becoming a story export. Following it costs an author a handoff: a component that needs a manifest change asks the integrator rather than editing the row itself.
