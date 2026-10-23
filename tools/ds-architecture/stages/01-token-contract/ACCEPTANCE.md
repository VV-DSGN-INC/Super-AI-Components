---
appliesTo: [tokens-only, component-library, app-consumer]
claims: [01.1, 01.2, 01.3, 01.4, 01.4c, 01.5, 01.6]
---

# Stage 01 — Token contract · acceptance

Every profile includes this stage, but `app-consumer` means something different by it:
an app resolves values against an imported name contract and declares none of its own.
That difference is in the claims below, not in a skipped stage.

| Claim | Statement | Checked by |
|---|---|---|
| `01.1` | A name-contract module exists at the path `config.paths.nameContract` names. | `acceptance.mjs` |
| `01.2` | Every custom property declared in the style entry points appears in the name contract. | `acceptance.mjs` |
| `01.3` | Every `@theme inline` alias carries a `var()`, never a literal value. | `acceptance.mjs` |
| `01.4` | A contrast test file exists and is reachable from `commands.test`. | `acceptance.mjs` |
| `01.4c` | That contrast test covers the text ramp across **every** axis cell. | **unchecked** — needs the target's own test runner |
| `01.5` | A liveness test file exists and is reachable from `commands.test`. | `acceptance.mjs` |
| `01.6` | No declared token resolves to zero consumers. | `acceptance.mjs`, via the three-hop walk |

## Why `01.4c` is a separate claim

The probe can see that a contrast test file exists. It cannot see whether that file
covers all of the target's axis cells without executing the target's test runner, which
a dependency-free probe must never do. Folding coverage into `01.4` would let a target
with one token-pair assertion report the same `met` as one covering nine cells — a claim
reporting success with nothing having inspected it. Splitting it means the report says
plainly that coverage was not determined.

This is the first stage in the ladder to emit an `unchecked` result in normal operation.
Two consequences are known and are the owner's open decisions, not defects to fix here:
a run with undetermined claims still exits `0`, and `highestContiguous` counts this stage
as reached even though `01.4c` was never settled.

## The three-hop walk behind `01.6`

Declared token → `@theme inline` alias → component or app code that writes the utility.
Checking any single link is what allowed two whole token families to sit declared,
themed, axis-overridden and mirrored in the design tool while nothing read them. Grep for
the consumer in shipped code, never for the declaration in CSS — the declaration being
present is precisely what hides a dead token.

### Where a consumer may live

A consumer is a file in the `components` or `app` scope role, minus stories and tests,
minus every file in `paths.styleEntry`. A page writing `text-brand` ships the utility as
surely as a component does. A story writing it proves it can be typed, not that anything
ships it. The style entry points are dropped even when a role's glob covers them
(`src/app/**` covers `src/app/globals.css`), because an alias chain there
(`--hairline: var(--color-border)`) reads the token and paints nothing. Both consumer
paths below read this same list.

### Which tokens the walk covers

Only tokens carrying an `@theme inline` alias are walked. A token with no alias is
either a raw primitive (a ramp step no component should read) or a Layer-3 alias name
that is itself the walk's destination — neither can own a utility, so demanding one
would make every conformant system fail. The narrowing is recorded here rather than
left implicit, because a liveness claim narrowed to nothing still reports `met`.

An alias in a namespaced family resolves to the family's utility prefixes, not to the
alias name: `--color-x` is written `bg-x` / `text-x` / `border-x` / `ring-x` /
`fill-x` / `stroke-x`, never `color-x`. Matching the alias name literally would have
reported every colour token in a conformant system as dead. The one-side border
colours count as well (`border-l-x`, `border-t-x`, and the `r`, `b`, `x`, `y`, `s`,
`e` forms): a card stripe drawn as `border-l-x` over a full border can be a token's
only reader, and deriving `border-x` alone called that token dead.

### The second consumer path: a direct `var()` read

A walked token also counts as consumed when a consumer reads it directly:
`style={{ color: "var(--color-text)" }}` in a page, or `background: var(--color-bg)` in
a CSS module. A site that paints this way never writes the utility, and the
utility-only walk reported seven of one portfolio site's tokens as reaching no consumer
while each had between 5 and 185 such reads.

The read must name the walked token itself: `var(--color-text-secondary)` is not a read
of `--color-text`, and neither is the name appearing outside a `var()`. This path adds
consumers, not tokens. The walked set is still only the tokens carrying an
`@theme inline` alias.

## Fixtures

`__fixtures__/nonconformant/` holds five trees, each breaking exactly one claim:
`missing-name-contract` (01.1), `undeclared-token` (01.2), `literal-alias` (01.3),
`dead-token` (01.6), `var-read-only-in-style-entry` (01.6). The probe must reject each,
and exactly one claim per tree.

Two trees must pass. `conformant` reaches every token through a utility in a component.
`conformant-consumer-paths` reaches each of five tokens a different way: a utility in a
component, a one-side border utility (`border-l-x`) in a component, a utility in an app
page, a `var()` read in a component CSS module and a `var()` read in an app page. A probe
missing any one path fails it.
`var-read-only-in-style-entry` is that tree plus one token whose only `var()` read is an
alias chain in the style entry, which is what a probe that forgot to drop the style
entry would miss.
