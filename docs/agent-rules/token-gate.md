# The token gate

This rule protects the design spec's token contract across `CATALOG_SCOPES`, so registry code carries no raw values.

`packages/ds-rules/rulecheck.mjs`, run by `pnpm check:tokens`, fails the build on raw hex colours, raw `oklch(...)`, Tailwind palette classes (`bg-zinc-400`, `text-blue-600`), and a bare `text-muted-foreground` in the same quoted class string as a bare `bg-muted`, `bg-accent` or `bg-secondary`. It also enforces the adopted core blockers (gradients, emoji in chrome, `animate-bounce`, `transition-all`, generic CTAs, recharts defaults, unpaired `outline-none`) and every rule of severity `blocker` in `packages/ds-rules/rules/*.json`, which is the authoritative list. Rules are typed records in `packages/ds-rules/src/`; the emitted JSON is drift-gated and each rule ships bad and good fixtures.

Two documented limitations. First, an issue reference like `#1234` in a comment false-positives as hex, so write `GH-1234` in registry sources. Second, and the important one: the contrast rule catches only the single-element shape. It cannot see muted text in a child whose ancestor sets the muted background, and every instance that has actually shipped broken was that shape. `pnpm test:stories` is the real backstop.

This checker is the most portable thing in the repo. The sibling `Minimal Design System` now runs the same records architecture (its PR #49) with its own detector, and the two have not converged on a schema: Super-AI has the structural routing, vendored demotion and `DS_RULES_DIR` seam, while MDS has a scale ratchet, `exemptPatterns` selector stripping and a token-gate-allow comment. An improvement here is worth carrying across: say so in the PR body, and say which schema it assumes.

The full account: `packages/ds-rules/` and `docs/design-system/a11y-baseline.md` ("The static gate").

## What it costs

The gate prevents raw values and known slop patterns from reaching consumers, and it fails the build rather than a review. Following it costs an author token classes in place of literals and a `GH-` prefix in comments, and it does not excuse skipping the story run.
