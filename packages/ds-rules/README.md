# ds-rules

One typed record per design rule; the detector, the docs, and the audit skill
all derive from it. Spec: `docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md`.

## Run

    node packages/ds-rules/rulecheck.mjs --severity blocker   # the check:tokens gate
    node packages/ds-rules/rulecheck.mjs --json               # full report, all severities
    node packages/ds-rules/rulecheck.mjs --files apps/docs/registry/super-ai/foo.tsx

Exit 0 no blockers · 1 blockers found · 2 the script itself failed. Warnings
never gate; findings under `apps/docs/components/ui/` demote to warnings
(vendored shadcn — see docs/design-system/vendored-token-findings.md).

## Provenance and drift

| piece | origin | local changes |
|---|---|---|
| `src/schema.ts` | ds-architecture starter kit (pegbo-inc/design-system-rebuild) | `TOK` added to RULE_ID_PATTERN |
| `src/core.ts` | same, harvested | scopes repointed; ICO-2 fix → lucide-react; 3 triage edits (COL-1/STA-3 exempts, CPY-2 severity), reasoned inline |
| `src/local.ts` | this repo (check-tokens.mjs, token-rules.mjs, a11y-baseline.md, anti-slop.md) | — |
| `rulecheck.mjs` | same starter kit | seven divergences, numbered in its header |
| `src/token-rules.mjs` | this repo, moved verbatim | — |

`rules/*.json` is generated (`pnpm --filter ds-rules rules:emit`); the emit
test is the drift gate. Every grep/heuristic rule carries a known-bad AND a
known-good fixture under `__fixtures__/<id>/`. TOK-6 is `rendered` and appears
in `unchecked` on every run — its checker is `pnpm test:stories`.
