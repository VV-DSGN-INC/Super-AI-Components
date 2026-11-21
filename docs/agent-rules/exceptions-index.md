# The exceptions index

This rule protects the gates from quiet erosion: every allowance a gate carries is indexed, has a reason, and shows up in review when a PR adds one.

An allowance is an entry in a list that tells a gate to skip something. A ledger is one such list, read by `apps/docs/scripts/lib/exceptions/registry.ts`. There are six:

- `RULE_EXEMPT`: per-rule files the token and slop detector skips whole-file, in `packages/ds-rules/src/core.ts` and `local.ts`.
- `VENDORED_SCOPES`: vendored upstream trees whose hits are demoted below blocker, in `packages/ds-rules/src/local.ts`.
- `A11Y_EXCLUSIONS`: story globs the axe gate does not run, in `apps/storybook/a11y-exclusions.baseline.json`. It may only shrink.
- `CSSVARS_LIVENESS`: CSS variables that nothing resolves or reads, in `apps/docs/cssvars-liveness.baseline.json`.
- `CONTRAST_EXEMPT_FILES`: files the single-element contrast rule skips, in `packages/ds-rules/src/token-rules.mjs`.
- `UNGATED`: agent rules with no gate, in `docs/design-system/UNGATED.md`, each with its own reason.

The `DECLINED` list in the registry names what is deliberately not a ledger, each with a `why`: the `.test.` exempt entries (a population exclusion, not an allowance), `story-coverage.baseline.json` and `contract-coverage.baseline.json` (coverage work lists that may only shrink, where an entry is owed work).

The index is `apps/docs/index/exceptions.json`, derived from the lists and never hand-edited. Each entry carries a key, a reason, and provenance (commit, author, date, PR) taken from `git blame` of its own line.

The reason rule: every entry needs a reason. Either it is the exact string `migrated 2026-10`, the placeholder for entries that predate the index, or it is a sentence of at least 40 characters that is not a placeholder such as `tbd` or `n/a`. Reasons live in `apps/docs/scripts/lib/exceptions/reasons.json` under `<LEDGER>#<key>`, except `UNGATED`, which keeps them in its own file. The count of `migrated 2026-10` entries is capped by `MIGRATED_CEILING` in the registry. It only falls: replace a placeholder with a real reason, then lower the ceiling.

Two modes, one test (`apps/docs/scripts/lib/exceptions/emit.test.ts`). Gate mode, the default in `pnpm test`, rebuilds the index from the lists, reads provenance from the committed index, never runs git, and fails when the committed file is stale. Emit mode, `pnpm exceptions:emit` from `apps/docs`, runs git blame and writes the file.

The delta is `apps/docs/scripts/exceptions-delta.mjs`, run by the `exceptions-delta` CI job. It diffs the index against the base ref and reports what the PR adds or removes. It is a report, not a gate, and exits 0 whenever it can run. It prints FLAG for any ledger that gains three or more allowances in one PR, which tells the reviewer to read each reason. A base with no index reads as empty.

To add an allowance: put it in its own list, add a reason to `reasons.json` (or its own line in `UNGATED.md`), then run `cd apps/docs && pnpm exceptions:emit` and commit the index with the change. Commit the list change first if the blame must name it, then emit.

## What it costs

The index prevents allowances from piling up unexplained, and it makes a PR that widens a gate visible. Following it costs an author a written reason and one emit run per allowance, and a reviewer a read of any flagged ledger. It does not make an allowance acceptable: a ratcheted list still may not grow.
