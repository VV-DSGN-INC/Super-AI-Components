# Foreground-opacity composites: keep the device, gate the floor

**Date:** 2026-08-23 · **Status:** designed, plan at `docs/superpowers/plans/2026-08-23-foreground-opacity-floor.md`
**Extends** `docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md` (adds one rule to the catalogue it created).
**Origin:** knowledge transfer from `~/Downloads/ds-open-problems-2026-08-23.zip` (the sibling design-system-rebuild's opacity-ratchet work), audited against this tree on 2026-08-23.

## Why

The registry carries 31 live foreground-opacity composite sites across 15
components — `text-foreground/70` ×26, `/60` and `/80` for the rest — and the
docs *recommend* the device: `generation-wizard.docs.tsx` and
`onboarding-wizard.docs.tsx` both steer consumers away from
`text-muted-foreground` on muted panes and toward a foreground composite.
Several component comments defend individual sites the same way.

Three defects sit on top of a sound convention:

1. **No gate can measure a composite.** TOK-4/5/6 match the literal
   `text-muted-foreground` + `bg-muted` pairing; a composite resolves against
   whatever is behind it. The Storybook axe gate measures only surfaces that
   stories happen to render. A failing composite has no detector.
2. **The recommended step drifts.** One pitfall says "`text-foreground/60`+",
   the other says "`text-foreground/70`". Nothing states a floor, so the next
   author extrapolates — and the natural next step down, `/50`, fails.
3. **The step set is unpinned.** The sibling repo let unlisted opacity grow to
   12 distinct steps across 271 sites before ratcheting it. Ours is at three
   steps on foregrounds today; that is the moment to pin it.

## The measurement (2026-08-23)

Every involved token is achromatic (`oklch(L 0 0)`), so contrast is exact
arithmetic: for grays, relative luminance is L³, and alpha blends in
gamma-encoded sRGB as the browser composites it. Computed for
`--foreground` at each step over every shipped surface
(script: run against `apps/docs/app/globals.css` values; no computed-style
parsing — the sibling repo turned a real 4.32:1 failure into a false 5.5:1
pass by regex-parsing oklab strings):

| composite | light: bg / card / muted | dark: bg / card / muted |
| --- | --- | --- |
| `foreground/50` | **3.71 / 3.71 / 3.65** — AA fail | 5.15 / 5.09 / 4.74 |
| `foreground/60` | 5.25 / 5.25 / 5.11 | 7.03 / 6.79 / 6.15 |
| `foreground/70` | 7.63 / 7.63 / 7.33 | 9.33 / 8.82 / 7.82 |
| `foreground/80` | 11.20 / 11.20 / 10.58 | 12.07 / 11.22 / 9.76 |
| `muted-foreground` flat | 4.73 / 4.73 / **4.34** | 7.63 / 6.91 / 5.83 |

Read it in two directions:

- **Every live site is correct.** `/60`+ clears 4.5:1 on every surface in both
  themes; each of the 31 sites was checked against its actual surface
  (cards, muted panes, `bg-muted/30` tints — all token-derived, no image
  overlays). The composites *outperform* the token they replace: `/70` on
  muted is 7.33 where flat `muted-foreground` is the infamous 4.34.
- **`/50` is the cliff.** 3.65–3.71 in light mode — an AA failure the moment
  someone reaches for the roundest number. Nothing catches it today.

## Decisions

1. **The device is kept and named, not banned.** The sibling repo banned
   foreground opacity because its token-vs-token contrast gate went blind on
   composites and it had text rungs to substitute. This repo is a shadcn-style
   registry: it cannot mint global text rungs (consumers bring stock shadcn
   tokens; `--warning` is the single sanctioned extra), and its measured
   composites beat its flat alternative. Different constraints, different
   ruling — the *method* (measure, then gate) transfers, the verdict doesn't.
2. **The floor is `/60`, and it becomes a blocker.** TOK-8 bans any
   foreground-property composite below the floor or off the pinned set.
3. **The pinned set is the live set: {60, 70, 80}.** Ratchet semantics: it may
   shrink, never grow. A new step is a rule change carrying a new measurement.
4. **Only `foreground` may carry a step.** Composites of any other color in
   text position are banned outright: `muted-foreground` starts at 4.34–4.73,
   so every composite of it fails; the rest are unmeasured. The one historical
   `text-muted-foreground/60` lives only in a calendar-view comment and gets
   reworded (the GH-1234 precedent: sources phrase around known
   false-positives of a line-based detector).
5. **All six foreground properties are enumerated from day one** — `text`,
   `fill`, `stroke`, `placeholder`, `decoration`, `caret`. The sibling repo
   left `stroke` out because one site used it and spent a follow-up closing
   the hole. No property waits for its first violation.
6. **Arbitrary alpha (`text-foreground/[0.55]`) is caught by the same
   pattern.** The sibling repo's first opacity regex missed arbitrary
   modifiers; this one matches them and the pinned set excludes them.
7. **The two docs pitfalls state the measured floor with its numbers**, so the
   published claim is verified and consistent instead of "/60+" in one file
   and "/70" in another.

## Scope

**In:** rule TOK-8 (record, fixtures, emitted JSON); the calendar-view comment
reword; the two docs-pitfall alignments; control tests both directions.

**Out:** component changes — all 31 sites measured correct. Non-foreground
opacity (`bg-*/N`, `border-*/N`): edges and fills composite against their own
element's stack and the axe gate sees them where it matters; ban nothing
that hasn't been measured failing. A palette-derived floor test that
recomputes 4.5:1 from `globals.css` (recorded as a follow-up: the floor rots
if the token values ever change; today they are stock shadcn and stable).

## Risks

- **The floor is palette-derived.** If `--foreground`/`--muted` values change,
  /60 may stop clearing 4.5:1 and the rule won't notice. Mitigated by
  recording the derivation in the rule's `why` and the follow-up above.
- **Comment/docs false positives.** The detector greps raw lines. Handled the
  way TOK-1 handles hex: a documented convention (phrase prose as
  "muted-foreground at 60% opacity", never the utility form) plus the
  heuristic method's `falsePositives` field.
- **A consumer's theme differs.** A registry component lands in apps with
  arbitrary palettes; no static rule can promise AA there. The rule promises
  the floor *for this token set*, which is also what TOK-4/5/6 promise.

## Verification

- **Positive control:** plant `text-foreground/50` in a shipped registry
  component; `pnpm check:tokens` must name the file and rule; remove the plant.
- **Negative control:** `text-foreground/70`, `hover:text-foreground/70`, and
  the `text-sm/6` size-with-line-height shorthand must not fire — the sibling
  repo's `[a-z]+` lesson says the shorthand is exactly where a lazy pattern
  over-matches.
- Fixtures encode both directions permanently (`__fixtures__/TOK-8/bad|good/`).
- A green run counts only after the plant has been seen to fail: this transfer
  exists because five sibling scanners reported clean while blind.
