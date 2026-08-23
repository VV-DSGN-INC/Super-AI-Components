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
`design-system-rebuild/docs/superpowers/specs/2026-08-11-anti-slop-rules.md`.

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

## Phase 1 — Constraints while generating

Universal hard bans (researched AI tells — any occurrence needs an explicit
justification):

1. **Effects** — no gradient text (`bg-clip-text`), no gradients on controls
   or text, no indigo→violet gradient anywhere, no glassmorphism without real
   underlying content, no blurred orbs / spotlights / grain layers, no colored
   or glowing shadows, no pure #000/#fff pairs.
2. **Type** — only the project's declared families and scale; no new fonts,
   ad-hoc sizes, or blanket `tracking-tight`; no italic-serif accent words;
   no caps eyebrow repeated per section; hierarchy = size/weight, never
   decoration.
3. **Layout** — container nesting ≤1 (no cards in cards); separation ladder:
   spacing → hairline → surface tint → card; radii and gaps only from the
   project's scale; no exactly-3-equal-cards reflex; no identical stat-card
   strips; the screen's most important element visibly dominant.
4. **Components** — compose from the project's library (search before
   creating; no V2 duplicates); no colored left-border accent strips; no
   "✨ AI-powered" badge theater; unlabeled sparkle icons never.
5. **Icons** — one library, one weight, 2–3 sizes; zero emoji in chrome.
6. **Motion** — only on state change; no idle loops, scroll-reveal, marquee,
   typewriter, parallax; never `transition: all`; transform/opacity only;
   `prefers-reduced-motion` guard whenever keyframes exist.
7. **Copy** — verb + object labels (never "Get Started"/"Learn More"); banned
   register: elevate/unlock/empower/seamless/effortless/supercharge,
   "not just X — it's Y", exclamation marks in microcopy; zero fabricated
   numbers, names, quotes, logos, or demo data no real system could emit.
8. **Charts** — project palette only (never `#8884d8`/`#82ca9d`); linear/step
   interpolation; no gradient area fills; flat marks; units visible; bars
   zero-based; <4 data points is a stat, not a chart.
9. **States & a11y** — empty/loading/error/populated all designed; visible
   focus on everything interactive; AA contrast on the actual surface;
   semantic elements (no onClick divs); accessible names on icon buttons.
10. **Responsive** — verify at 375px: no horizontal scroll, ≥24px tap targets
    (44px in sticky bars), no hover-only actions, tables get a small-screen
    strategy, `dvh` not `vh` for shells.

## Phase 2 — Audit before "done"

Mechanical rules first — run the detector, do not re-grep what it owns:

    node packages/ds-rules/rulecheck.mjs --json

Violations are findings; apply each record's own `fix`. Then work the
`unchecked` list: TOK-6 discharges via `pnpm test:stories`; `judgment`-method
rules are the reading work below. The rendered passes (squint, counts,
contrast, keyboard, 375px, hostile fixtures, ratchet) remain this skill's own.

Rendered passes: **squint** (one thing dominant, no identical section
anatomy) · **counts** (font sizes ≤7, radii/shadows ⊆ project scale, ≤1
saturated accent per viewport) · **contrast** (≥4.5:1) · **keyboard** (focus
visible everywhere) · **375px** · **hostile fixtures** (3× strings, empty,
error, mixed-sign data) · **ratchet** (distinct radii/shadows/sizes did not
grow vs. before the change).

## Phase 3 — Fix ladder

Never fix by bare deletion — slop is a **faked decision**. Find the job the
decoration was doing and do it with the system's device:

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
| Contrast fail | Move UP the text ramp or lighten surface — never one-off darker hex |
| Nested cards | Dissolve inner boundaries down the ladder, keep content |
| 3-card reflex/stat strip | Rank content; dominant cell for the answering item, rest → row/table |
| Happy-path only | Empty = sentence + creating action; loading = matched skeleton; error = cause + retry |
| 375px fails | Mobile-first bases, `dvh`, padded hit areas, kebab menus, table strategy |
| Duplicate component | Delete new one; extend existing via its variant props |
| Ratchet growth | Converge onto existing steps; new steps enter via the token system only |

Report as: violation → rule area → fix applied. Re-run Phase 2 until clean.
