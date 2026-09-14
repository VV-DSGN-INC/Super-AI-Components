---
name: unslop
description: Anti-slop audit for generated UI in @nickv/pegbo-ui. Use BEFORE designing/building any new screen, component, or prototype view (the rules constrain generation), and AGAIN before calling it done (the audit verifies it). Also use when reviewing UI changes, when a screen "looks AI-generated", or when the user says slop, generic, or template-y.
---

# Anti-slop audit

Slop is the absence of decisions — an unguided model emits the statistical
median of its training data (indigo gradients, Inter, three-card grids,
`#8884d8` charts). This system's decisions are already made: **Geist, one
emerald accent with a job, ink-on-paper grays, 6/12/18 radii, finish-axis
elevation, Phosphor**. A generated screen may only *instantiate* those
decisions, never re-make them.

Full research + rule rationale: `research/specs/2026-08-11-anti-slop-rules.md`
(rule IDs COL/TYP/LAY/CMP/ICO/MOT/CPY/CHT/STA/SYS — cite them in reviews).

## Phase 1 — Before generating (constraints)

Hold these while designing. Any hard-rule hit fails review:

1. **Color/effects** — zero gradients (incl. `bg-clip-text`), zero
   backdrop-blur, zero decorative background layers (orbs/spotlights/grain),
   shadows only from finish tokens and always neutral. One saturated accent
   per viewport; status hues only on real states.
2. **Type** — the 27 Geist styles only (`text-{size}/{Regular=500|Medium=600|Heavy=700}`).
   No new families, sizes, weights, or tracking. Hierarchy = size/weight steps,
   never decoration.
3. **Layout** — container nesting ≤1 (no cards in cards); separation ladder is
   spacing → hairline → `Surface Secondary` tint → card; radii only from the four
   `--radius-*` rungs (button/control/card/popup) plus pill, mapped by role,
   referenced as tokens never px (the values are theme × finish); spacing on the
   4px grid with tiered gaps; count follows content (no exactly-3-cards reflex);
   the screen's one question gets the visibly dominant element; product UI is
   left-anchored.
4. **Components** — compose from `src/components` (search first; no duplicate
   nouns, no V2 files); before placing a component, read its `.meta.json` if
   one exists (variant intent, relationships, anti-patterns are decided there
   — schema: `src/lib/component-meta.ts`); no colored left-border strips; no
   badge theater or unlabeled sparkles; marketing patterns (hero pills,
   marquees, testimonial carousels, stat bands) never in product UI.
5. **Icons** — `@nickv/pegbo-ui/lib/icons` only, one weight, sizes 16/20/24, zero
   emoji in chrome.
6. **Motion** — only on state change; two durations (~120–150ms feedback,
   ~200–250ms overlays), ease-out, transform/opacity only, named properties;
   `prefers-reduced-motion` guard whenever keyframes exist.
7. **Copy** — labels name the object and outcome (never "Get Started");
   banned register: elevate/unlock/seamless/effortless/supercharge,
   "not just X — it's Y", exclamation marks in microcopy; one text node per
   fact; zero fabricated numbers/names/quotes/logos.
8. **Charts** — `chart-1…5` in order, emphasis on the answering series;
   linear/step interpolation; flat marks; units visible; bars zero-based;
   <4 data points is a stat, not a chart.
9. **States** — empty/loading/error/populated all designed; state recipes from
   the system (never invented per screen); Focus Ring on everything
   interactive; AA contrast on the actual surface; hostile fixtures (long
   strings, zero/negative, mixed-sign) survive; works at 375px with ≥24px
   tap targets and no hover-only actions.
10. **Tokens** — every value resolves against `tokens.ts`; a plausible token
    name that isn't in the manifest is fabricated — stop and look it up.

## Phase 2 — Before "done" (the audit)

### Greps (expected: zero hits; exceptions noted)

```bash
grep -rn "bg-gradient-\|bg-clip-text\|backdrop-blur\|backdrop-filter" src/components prototypes/proto-oleh/src prototypes/proto-timur/src
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsl\(" src/components prototypes/proto-oleh/src prototypes/proto-timur/src --include="*.tsx"
grep -rnE "\-\[[0-9]+px\]" src/components prototypes/proto-oleh/src prototypes/proto-timur/src          # review every hit
grep -rn "lucide-react\|@phosphor-icons/react" src/components prototypes/proto-oleh/src prototypes/proto-timur/src | grep -v "lib/icons"
grep -rn "transition-all\|animate-bounce\|animate-spin\|animate-pulse" src/components prototypes/proto-oleh/src prototypes/proto-timur/src   # animate-pulse OK in skeleton.tsx only
grep -rn "8884d8\|82ca9d\|strokeDasharray=\"3 3\"" src prototypess
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2728}]" src/components prototypes/proto-oleh/src prototypes/proto-timur/src
grep -rniE "elevate|unlock|empower|supercharge|seamless|effortless|game.chang|revolutioniz" src prototypess
```

### Rendered passes (Storybook/prototype via browser tools)

- [ ] **Squint** — screenshot at 50% zoom: one question visually dominant; no
      two sections with identical structural signatures.
- [ ] **Counts** — font sizes ≤7 distinct; radii ⊆ the active theme × finish's
      four `--radius-*` values (+ pill); shadows ⊆ finish tokens; saturated
      accents per viewport ≤1 (+ status on real states).
- [ ] **Contrast** — every text node ≥4.5:1 on its effective background
      (3:1 for ≥24px / 19px-bold).
- [ ] **Keyboard** — Tab through: visible focus ring on every stop.
- [ ] **375px** — no horizontal scroll; headings ≤3 lines; tap targets ≥24px
      (44px in sticky bars); tables have a small-screen strategy.
- [ ] **Hostile fixtures** — 3×-length strings, empty array, error state,
      mixed-sign data render without breakage.
- [ ] **Ratchet** — re-run counts vs. before the change: the inventory of
      distinct radii/shadows/sizes/spacing steps did not grow.
- [ ] **Meta contracts** — no placement violates a placed component's
      `.meta.json` anti-patterns (e.g. two default Buttons in one view,
      solid-red destructive); when a violation was a judgment gap, add the
      missing anti-pattern to the meta file so it can't recur.

Then the repo gates: `npm run lint && npm run typecheck && npm test`
(+ `npx tsc -p prototypes/proto-oleh` / `npx tsc -p prototypes/proto-timur` for prototype changes).

## Phase 3 — Fixing violations (the fix ladder)

Never fix by bare deletion. Slop is a **faked decision** — the gradient fakes
emphasis, the card fakes grouping, the pulse fakes liveness, the stat band
fakes proof. Identify the job, then do it with the system's device:

| Violation | Substitute |
|---|---|
| Gradient fill / text | Flat token: accent or `Surface/*` tint; text → `text-primary` + weight step, or one word in `text-accent` |
| Glass / glow / orbs / grain | Delete the layer; separation via the ladder (spacing → hairline → tint → card); true overlays = `surface-popover` + `Overlays/*` |
| Colored / new shadow | Finish-axis token for the role; focus intent → Focus Ring; attention intent → position/size/contrast |
| Raw hex / rgb / px | Match the `usage` line in `tokens.ts`, use its utility; no fit → stop, propose the token in a spec |
| Arbitrary `[Npx]` | Snap to 4px grid / the nearest `--radius-*` rung |
| New size / weight / family | Nearest of the 27 styles; emphasis = weight step (500→600→700), not a new size |
| Icon leak / emoji in chrome | Route through `lib/icons` (add alias there); emoji → Phosphor at 16/20/24, or nothing |
| `transition-all` / loops / scroll FX | Named properties at 120–150 / 200–250ms ease-out; loops bind to real state or die; entrances render static |
| Copy register / generic CTA | Verb + object ("Create submission request"); unprovable adjective or number → delete the claim |
| Chart defaults | Colors → `chart-1…5`; gradient area → 1.5–2px line; smoothing → linear/step; add unit; direct-label single series |
| Contrast fail | Move UP the text ramp (tertiary → secondary → primary) or lighten the surface — never a one-off darker hex |
| Missing focus | Shared Focus Ring recipe; `outline-none` only beside `:focus-visible` |
| Nested cards / cardocalypse | Dissolve inner boundaries down the ladder, keep content; card only for discrete objects |
| 3-card reflex / equal stat strip | Rank: answering item gets the dominant cell; rest become a row/list/table |
| Happy-path only | Empty = sentence + creating action; loading = layout-matched skeleton; error = human cause + retry |
| 375px fails | Mobile-first bases, `dvh` shells, 24/44px hit areas, hover-reveals → kebab menu, tables pick a strategy |
| Fabricated token name | Grep `tokens.ts` for the concept; use the real name; missing → surface it, don't guess |
| Duplicate component / V2 | Delete the new one; extend the existing via `tone`/`variant` |
| Ratchet growth | Converge onto existing steps; new steps enter via tokens + spec + Figma only |

Report results as rule IDs (e.g. "COL-1 clean, LAY-1 violation at … → fixed
via ladder"), apply fixes, re-run Phase 2 until clean.
