# Runner fixtures

Stage directories that exist only to make the conformance runner's own edge cases
reproducible. They live under `__fixtures__/` rather than at `stages/` top level so
`discoverStages()` (which matches `^\d\d-` on the immediate children of `stages/`)
never picks them up — a real run must not see them. Every test that uses one passes
it explicitly through `opts.stageDirs`.
