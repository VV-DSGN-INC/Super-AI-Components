# Storybook compiles apps/docs source, and turbo cannot see it

This rule protects `typecheck`, `build` and `lint` in `apps/storybook` from replaying a cache hit over code that no longer compiles.

`apps/storybook` reaches into `apps/docs` through `paths`, `include` and bundler aliases, which are not a package edge, so turbo hashes its tasks from files inside `apps/storybook` alone. The reachable `apps/docs` directories are therefore listed in `apps/storybook/turbo.json` `inputs`. Pin any new task there in the same commit, and keep the list in step with the configs. A blanket `apps/docs` glob is not the fix: it does not respect `.gitignore` and turbo ignores negations against it.

The full account: `docs/CONTINUE.md` §4 ("Turbo cannot see the storybook to docs edge").

## What it costs

Without the pin, root `pnpm typecheck` exits 0 over code that does not compile, and the failure shows up later as story files that fail to import. The rule prevents that. Following it costs a precise, hand-maintained input list, which `apps/docs/scripts/turbo-inputs.test.ts` checks for you.
