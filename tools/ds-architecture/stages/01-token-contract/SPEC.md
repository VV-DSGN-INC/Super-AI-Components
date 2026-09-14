# Stage 01 — Token contract

## Problem

Every later stage resolves values against something. Without a named, gated
substrate, a component hardcodes a hex, an axis cannot reach it, and the design tool
and the code drift with nothing detecting it.

## What this stage establishes

Three layers — raw ramps, semantic tokens, framework aliases — crossed with N
orthogonal axes declared as single-attribute selectors on the root element. Plus the
name contract: one module listing every token's name byte for byte, which is what makes
a design-tool sync diff meaningful.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Layer 3 | Aliases only, never values | An alias carrying a value is a fourth place to change a colour, and the axes cannot reach it |
| Axis collision | Import order decides; the later-imported axis wins | Two axes will both want radius; something has to break the tie, and stating it beats discovering it |
| Shared scales | All-or-nothing per axis | A single-rung override is correct for at most one cell by accident — it once left a card radius a rung out of step with its own popup |
| Interaction states | Recipes, not tokens | Hover, disabled and pressed get written recipes; only focus ring, border hover, surface hover and select state earn tokens. Otherwise an agent invents `--button-hover-bg` and the ramp count doubles |
| Fill slots vs text slots | Separate tokens | A fill slot used as a text colour passed AA in three cells and failed at 2.33:1 in the fourth; the three passing cells hid it |
| Liveness | Gated by a three-hop walk | Checking the declaration is what let two whole token families sit declared, themed, axis-overridden and read by nothing |
| Claim `01.4` | Split into existence (`01.4`) and coverage (`01.4c`, unchecked) | Coverage needs the target's own runner; folding it in would let one assertion look like nine cells of coverage |
| Which tokens the liveness walk covers | Only those carrying an `@theme inline` alias | A raw primitive read by another token, and an alias name itself, can never own a utility. Walking them called six of seven tokens dead on a conformant fixture |
| Utility derivation | Namespace-aware, not the alias name | `--color-x` is written `bg-x` / `text-x`, never `color-x`. Reading the alias name literally marked every colour token dead |

## Rejected alternatives

- **Hardcoding the token list in the liveness gate.** Derive it from the CSS instead, so
  a token added later arrives already gated rather than being the one nobody wired up.
- **Grepping the CSS to prove a token is alive.** The declaration being present is
  precisely what hides a dead token. Grep for the consumer in components.
- **Counting a story or a test as a consumer.** A story writing the utility proves the
  utility can be typed, not that anything ships it.
- **Scaling a shared scale relatively per axis.** Whole even values times a ratio
  produce fractional rungs; retuning a rung is a change to the scale's owner, once, for
  every axis value.
- **Executing the target's test runner from the probe.** Probes are dependency-free and
  run against unknown toolchains. What needs the runner is reported `unchecked`.
- **Narrowing the liveness walk until it passes.** A claim narrowed to nothing still
  reports `met`, which is the same defect it exists to catch. What the walk covers is
  stated in `ACCEPTANCE.md` and control-tested: the conformant fixture walks three
  tokens, not zero.

## What a probe may assert here

Structural facts read off the filesystem: a file exists, a name appears in a module, an
alias resolves to a `var()`, a token reaches a component. Everything requiring the
target's runner — whether the contrast test actually covers every cell, whether the
liveness test passes — is a file in `reference/` that the target copies and runs, and a
claim reported `unchecked`.
