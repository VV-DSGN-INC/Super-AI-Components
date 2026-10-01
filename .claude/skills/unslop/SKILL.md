---
name: unslop
description: Anti-slop audit for AI-generated UI, portable across projects. Use BEFORE designing/building any new screen, component, or page (constraints first), and AGAIN before calling it done (audit + fix). Also use when reviewing UI, when something "looks AI-generated", or when the user says slop, generic, or template-y.
---

# Unslop

Slop is the absence of decisions — an unguided model emits the statistical
median of its training data: indigo gradients, Inter, three-card grids,
glassmorphism, `#8884d8` charts, "Elevate Your Workflow". Four root causes:
**statistical gravity** (most-copied snippet wins), **decoration faking
hierarchy**, **fabrication pressure** (invented stats/testimonials/data), and
**per-emission amnesia** (values drift, components duplicate across
generations). Counter all four: decide once in the project's system, ban the
named defaults, require provenance, audit with counts — not vibes.

Origin research (12 lenses, ~110 indicators, ~40 sources):
`upstream-design-system/docs/superpowers/specs/2026-08-11-anti-slop-rules.md`.

## Phase 0 — This repo's bindings

`super-ai-components` is governed by contracts in `docs/design-system/` —
`component-build-brief.md` is the law, `packages/ds-rules` (`rulecheck.mjs`,
run via `pnpm check:tokens`) is the token gate, `a11y-baseline.md` the
measured posture. Unslop complements the gate: the gate owns every
grep-expressible blocker in the records; warning-severity records (CPY-2,
COL-6) and `review`/`judgment` records (LAY-1) surface only in this skill's
full-detector run — CI's `check:tokens` and the write-time hook both filter
to `--severity blocker`; this skill owns the `unchecked` list (TOK-6 →
`pnpm test:stories`, `judgment` rules), the rendered passes, and
fix-as-substitution. Known trap that is also an unslop rule: never pair
`text-muted-foreground` with `bg-muted`/`bg-accent`/`bg-secondary`.
Phase 2 here means the full CI gate order in `ci.yml`.
Taxonomy + fix ladder: `docs/design-system/anti-slop.md`.

**Mechanical audit.** Phase 2's detector here is the full records run, not
the blocker-only gate:

    node packages/ds-rules/rulecheck.mjs --json

Violations are findings; apply each record's own `fix`. Then work the
`unchecked` list: TOK-6 discharges via `pnpm test:stories`; `judgment`-method
rules are the reading work of the rendered passes.

<!-- unslop-core:start me@1.18.0 sha256:4cecae21f48d349e -->
<!-- Generated from me:unslop by its scripts/sync.mjs. Edit that skill, not this block; this repo's own rules go in Phase 0 above. -->
<!-- prettier-ignore-start -->
## Phase 1: Constraints while generating

Universal hard bans (researched AI tells; any occurrence needs an explicit
justification, and an exception written in the repo's Phase 0 wins over this
list):

1. **Effects.** No gradient text (`bg-clip-text`), no gradients on controls
   or text, no indigo→violet gradient anywhere, no glassmorphism without real
   underlying content, no blurred orbs / spotlights / grain layers, no colored
   or glowing shadows, no pure #000/#fff pairs.
2. **Type.** Only the project's declared families and scale; no new fonts,
   ad-hoc sizes, or blanket `tracking-tight`; no italic-serif accent words;
   no caps eyebrow repeated per section; hierarchy = size/weight, never
   decoration.
3. **Layout.** Container nesting ≤1 (no cards in cards); separation ladder:
   spacing → hairline → surface tint → card; radii and gaps only from the
   project's scale; no exactly-3-equal-cards reflex; no identical stat-card
   strips; the screen's most important element visibly dominant. **Layout
   does not move on state change**: hover, focus and selection may change
   colour/shadow/ring/opacity, never padding, gap, size, border-width or
   type; space for anything conditional is reserved at rest (disclosure
   components are the declared exception).
4. **Components.** Compose from the project's library (search before
   creating; no V2 duplicates); no colored left-border accent strips; no
   "✨ AI-powered" badge theater; unlabeled sparkle icons never.
5. **Icons.** One library, one weight, 2–3 sizes; zero emoji in chrome.
6. **Motion.** Only on state change; no idle loops, scroll-reveal, marquee,
   typewriter, parallax; never `transition: all`; transform/opacity only;
   `prefers-reduced-motion` guard whenever keyframes exist.
7. **Copy.** Verb + object labels (never "Get Started"/"Learn More"); banned
   register: elevate/unlock/empower/seamless/effortless/supercharge,
   "not just X, it's Y", exclamation marks in microcopy; zero fabricated
   numbers, names, quotes, logos, or demo data no real system could emit.
8. **Charts.** Project palette only (never `#8884d8`/`#82ca9d`); linear/step
   interpolation; no gradient area fills; flat marks; units visible; bars
   zero-based; <4 data points is a stat, not a chart.
9. **States & a11y.** Empty/loading/error/populated all designed; anything
   that fetches also gets an honest offline/stale tell, never fallback or
   mock data rendered as live; visible focus on everything interactive; AA
   contrast on the actual surface, in every theme the project ships;
   semantic elements (no onClick divs); accessible names on icon buttons.
   **Chrome states count too**: every collapsed/compact/truncating mode a
   component declares is designed and checked, and truncation is decided for
   the tree, not per leaf.
10. **Responsive.** Verify at 375px: no horizontal scroll, ≥24px tap targets
    (44px in sticky bars), no hover-only actions, tables get a small-screen
    strategy, `dvh` not `vh` for shells.

## Phase 2: Audit before "done"

Audit what you changed. Older code that already breaks a rule is its own
scoped task; do not sweep it uninvited.

**Mechanical first.** If the project has a rule detector or token gate
(Phase 0 names it), run it and apply each hit's own `fix` rather than
inventing one. Do not re-grep what a gate already owns: greps run from
memory go stale, and two of this skill's own greps once sat broken for weeks
that way. Then work the detector's `unchecked` list, the rules no script can
run. They are reported so they cannot be forgotten, and most of them
discharge in the rendered passes below.

**Without a detector**, grep the changed files (expect zero, exceptions
justified), over the same roots the project's gate scans if it has one; a
grep list that disagrees with the gate's scope is where a violation
survives: `bg-gradient-|bg-clip-text|backdrop-blur` · raw
`#hex|rgba?(|hsl(` in components when a token system exists · arbitrary
`[Npx]` values · `transition-all|animate-` outside sanctioned loaders ·
`8884d8|82ca9d|strokeDasharray="3 3"` · emoji codepoints in chrome ·
`elevate|unlock|empower|supercharge|seamless|effortless` in copy.

Rendered passes: **squint** (one thing dominant, no identical section
anatomy) · **counts** (font sizes ≤7, radii/shadows ⊆ project scale, ≤1
saturated accent per viewport) · **contrast** (≥4.5:1, every theme) ·
**keyboard** (focus visible everywhere) · **375px** · **state stability**
(at rest, hovered, focused, selected: only colour/shadow/ring/opacity
differ, nothing reflows a neighbour) · **chrome states** (render every
collapsed/compact/truncating mode; a clipped focus ring still passes the
DOM, so this pass is a screenshot or it did not happen) · **hostile
fixtures** (3× strings, empty, error, offline, mixed-sign data) · **motion
at rest** (idle viewport: nothing animates outside genuine, state-bound
progress indicators) · **ratchet** (distinct radii/shadows/sizes did not
grow vs. before the change).

## Phase 3: Fix ladder

Never fix by bare deletion: slop is a **faked decision**. Find the job the
decoration was doing and do it with the system's device. A repo's Phase 0
may add rows, and where one names the same violation as a row here, the
repo's row wins.

| Violation | Substitute |
|---|---|
| Gradient fill/text | Flat token; emphasis via size/weight/position; one accent word max |
| Glass/glow/orbs | Delete layer; separate via spacing → hairline → tint → card |
| Colored/new shadow | Project elevation token; focus → focus ring; attention → hierarchy |
| Raw hex/px | The project's token (match by usage); none fits → propose it, don't inline |
| Off-scale value | Snap to the project's nearest scale step |
| New font/size/weight | Nearest declared style; emphasis = weight step, not new size |
| Emoji/icon leak | Project icon set at its sizes, or nothing |
| Loops/scroll FX | Bind to real state change or render static; named transitions, ease-out |
| Copy register | Verb + object; unprovable adjective/number → delete the claim |
| Chart defaults | Project palette, plain line, linear/step, add unit, direct labels |
| Contrast fail | Move UP the text ramp or lighten surface; never a one-off darker hex |
| Nested cards | Dissolve inner boundaries down the ladder, keep content |
| 3-card reflex/stat strip | Rank content; dominant cell for the answering item, rest → row/table |
| Happy-path only | Empty = sentence + creating action; loading = matched skeleton; error = cause + retry |
| Mock data shown as live | Honest offline/stale tell; never a silent fallback |
| Layout moves on a state | Reserve the space at rest (`invisible`/`opacity-0`, or the same border in `transparent`); put the signal on colour/shadow/ring/opacity |
| Collapsed state loses content | Design the collapsed mode as its own state; icons keep their labels as tooltips/accessible names |
| Indicator clipped by an ancestor | Draw it on the ancestor that owns the boundary, or lift the clip one level |
| 375px fails | Mobile-first bases, `dvh`, padded hit areas, kebab menus, table strategy |
| Duplicate component | Delete new one; extend existing via its variant props |
| Ratchet growth | Converge onto existing steps; new steps enter via the token system only |

Report as: violation → rule area → fix applied. Re-run Phase 2 until clean.
<!-- prettier-ignore-end -->
<!-- unslop-core:end -->
