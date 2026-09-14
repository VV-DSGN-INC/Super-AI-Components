# AI slop in generated UIs — research + anti-slop rules

**Date:** 2026-08-11 · **Method:** 12 parallel research agents (9 planned lenses + 3 gap-fills chosen by a completeness critic), ~40 practitioner sources: designer blogs, HN/Reddit threads, audits of v0/Lovable/Bolt output, NN/g and Google sparkle-icon research, WCAG/touch-target literature, dashboard-craft guides. ~110 catalogued indicators, each with a *mechanical* detection rule.

**Purpose:** rules and principles that keep agent-generated UI in this repo from reading as AI slop. Part 3 is the ruleset; Part 4 is the self-audit an agent runs before claiming a screen done; Part 5 is a condensed block ready to wire into `AGENTS.md` or a skill.

---

## Part 1 · What slop actually is

Slop is not "bad taste" — it is the **absence of decisions**. An LLM left unguided emits the statistical median of its training corpus (the Tailwind/shadcn-era web), and the median is recognizable. Every indicator in Part 2 traces back to one of four root causes:

1. **Statistical gravity.** The model reaches for the most-copied snippet: `indigo-500` gradients (Tailwind UI's demo default), Inter, exactly-three feature cards, `transition: all 0.3s`, Recharts' `#8884d8`. One practitioner calls the purple gradient "the Times New Roman of AI output."
2. **Decoration standing in for hierarchy.** When the model can't produce emphasis it produces effects — gradient text, glassmorphism, glow shadows, grain overlays, scroll animations. Effects are cheap to emit and look "designed" in the single screenshot the model is judged on.
3. **Fabrication pressure.** The memorized template expects content the project doesn't have — stat banners, testimonials, logo walls, always-rising charts — so the model invents it. Slop and dishonesty converge here.
4. **Per-emission amnesia.** Every generation re-decides settled questions. Padding drifts 14/16/20px across identical roles, near-duplicate components accumulate, token names get hallucinated, and three screens side-by-side look like three products.

The countermeasure follows the causes: **(a)** make each decision once, in tokens — this repo already does; **(b)** name and ban the statistical defaults explicitly — vague "make it tasteful" prompts do nothing, named bans work; **(c)** require provenance for every number, name, and image; **(d)** audit output with counts, not vibes. This system's existing laws (token-only styling, states-as-recipes, the Phosphor adapter, whole-px radii) are already anti-slop machinery — Part 3 completes the perimeter.

A meta-finding worth keeping: **published anti-slop checklists were confirmed to have near-zero responsive/touch coverage** (checked directly by the gap-fill agent against nexu-io's anti-ai-slop.md, the 925studios guide, and the "Anti-Slop Framework"). Aesthetic audits pass while the product breaks at 375px. Hence rule group STA-7 and the mandatory small-viewport pass.

---

## Part 2 · The slop taxonomy

Condensed from ~110 researched indicators. Each row: the tell, and the countable check that catches it.

### 2.1 Typography

| Indicator | Mechanical check |
|---|---|
| Gradient-clipped headline/metric text | `bg-clip-text` + gradient count must be 0 |
| Unchosen default font (Inter-and-nothing-else, no pairing decision) | rendered family set = 1 undeclared default → flag |
| Serif-italic single accent word in a sans hero | italic child with different family inside h1/h2 → flag |
| Full-sentence display type | heading ≥48px with >8 words → flag |
| Blanket `tracking-tight` | identical negative tracking on every heading level; negative tracking <20px → flag |
| Incoherent scale (14/15/16/17 co-existing, or 16→48 canyon) | >7 distinct sizes per screen; sizes within 10% serving different roles → flag |
| Eyebrow-label rash (CAPS kicker over every section) | ≥3 uppercase micro-labels per page → flag |
| Fake-premium serif (Playfair/DM Serif) in product UI | decorative serif on a screen with controls/tables → flag |
| Font accretion across regenerations | >2 families or >3 weights per family → flag |
| Ghost fonts (declared, never loaded) | declared primary family absent from `document.fonts` → flag |

### 2.2 Color & effects

| Indicator | Mechanical check |
|---|---|
| Indigo→violet gradient (buttons, heroes, text) | any gradient with both stops in hue 230–290 → fail |
| Blurred gradient orbs / aurora / mesh blobs | empty absolute element + `blur() >40px` + radius 50% → fail |
| Blanket glassmorphism | >2 `backdrop-filter` per view; blur >12px; glass over nothing → fail |
| Neon glow / colored box-shadows | any shadow with saturation >10% → fail |
| Unrequested dark-mode-default | dark-only ship; pure `#000`/`#fff` pairs; >1 saturated accent per viewport → fail |
| Radial spotlight behind hero | saturated radial gradient behind text on dark → fail |
| Animated gradient borders / pulsing glow | keyframes on background-position/box-shadow at rest → fail |
| Shadow-on-everything | >3 distinct shadow values per view; nested shadowed ancestors → fail |
| Noise/grain overlay | page-scope feTurbulence / tiled-noise layer → fail |

### 2.3 Layout & composition

| Indicator | Mechanical check |
|---|---|
| Canned page skeleton (hero→features→proof→pricing→FAQ) | section order matches template with zero deviation → flag |
| Three-card reflex | >1 row of exactly-3 identical-anatomy cards → fail |
| Cardocalypse (everything boxed) | >60% of content area inside bordered/filled containers → fail |
| Nested cards | visible-container nesting depth >1 → fail |
| One-recipe containers (same radius/pad/shadow everywhere) | single radius value shared by hero, card, and input → fail |
| Everything centered | zero non-centered sections; badge centered above H1 → fail |
| Monotonous spacing | intra-group gap not clearly < inter-group gap → fail |
| Identical section anatomy | ≥3 consecutive sections with same structural signature → fail |
| Bento reflex | cell area rank contradicts content importance; filler cells → fail |
| Identical KPI-card strip | ≥3 pixel-identical stat cards, none dominant → fail |

### 2.4 Components & patterns

| Indicator | Mechanical check |
|---|---|
| Unmodified shadcn defaults shipped as the finish | <3 of 5 base decisions differ from stock (neutral ramp, radius, font, accent, signature token) → flag |
| Hero announcement pill ("✨ New", links nowhere) | pill above H1 matching /new\|introducing\|ai-powered/i with no dated target → fail |
| Icon-in-tinted-circle feature grid | ≥3 siblings: tinted rounded icon chip + heading + copy → fail |
| Stat-counter band ("10k+ users" on a day-old product) | big-number row with no data provenance → fail |
| Fabricated social proof (testimonials, logo marquee) | placeholder avatars, unverifiable names, marquee animation → fail |
| Three-tier pricing cliché | Free/Pro/Enterprise + promoted middle + check-list parity, no billing behind it → fail |
| Colored left-border strips ("the em-dash of AI design") | 2–4px chromatic border-left without documented state mapping → fail |
| Emoji as icon system | emoji codepoints in nav/buttons/headings/bullets → fail |
| Sparkle-branded AI everything | >1 sparkle glyph per screen; any sparkle without text label → fail (NN/g: users don't read ✨ as "AI") |

### 2.5 Copy

| Indicator | Mechanical check |
|---|---|
| Power-verb headline (Elevate/Unlock/Supercharge Your X) | headline still works on 10 competitor products → fail |
| Generic CTA ("Get Started", "Learn More") | CTA label contains no product noun → flag |
| Emoji bullets / heading decor | >20% of bullets emoji-led; emoji in any button label → fail |
| Manufactured contrast ("not just X — it's Y") | >1 match per page → fail |
| Em-dash + triad cadence ("Fast. Simple. Secure.") | >1 em-dash per 100 words; ≥2 X.Y.Z. triads per page → flag |
| Fabricated testimonials/logos/stats | any number/name/quote not traceable to input data → fail |
| Redundant microcopy stack (label+placeholder+helper restating) | >2 text nodes per form control → fail |
| Buzzword-and-hedge register | >2 of {streamline, seamless, effortless, enterprise-grade, …}; ! in microcopy → fail |

### 2.6 Icons & imagery

| Indicator | Mechanical check |
|---|---|
| Mixed icon libraries / stroke weights / sizes | >1 icon package; >2 stroke widths; >3 sizes per screen → fail |
| Oversized decorative icons | icon >48px outside empty states; icon taller than its heading → fail |
| Plastic AI-generated hero illustration | raster image containing rendered text; glossy 3D blobs → fail |
| Placeholder-grade inline SVG scenes / broken images | hand-assembled primitive-shape art; placeholder `src` patterns → fail |
| Generic stock / isometric filler | people-at-laptops or isometric-dashboard imagery not from brand assets → flag |

### 2.7 Motion

| Indicator | Mechanical check |
|---|---|
| Universal fade-up-on-scroll | same entry variant on >3 sections; >50% of sections animated → fail |
| `transition: all 0.3s` monoculture | any `transition: all`; distinct-duration set of size 1 → fail |
| Idle infinite loops (pulsing dots, bobbing badges) | `infinite` iteration outside real progress indicators → fail |
| Hover-scale on everything | >2 classes with hover transforms; transforms on non-clickables → fail |
| Bounce/elastic easing on chrome | overshooting curves on dialog/toast/card entrances → fail |
| Typewriter headline + fake cursor | character-reveal or caret-blink outside terminal contexts → fail |
| Marquee tickers | infinite translate loop on readable content → fail |
| Scroll-jacking / decorative parallax | wheel preventDefault; >1 scroll-linked decorative section → fail |
| Animating layout properties | transitions on width/height/padding/margin/top/left → fail |
| No reduced-motion guard | >3 animations and zero `prefers-reduced-motion` matches → fail |

### 2.8 Structure & accessibility

| Indicator | Mechanical check |
|---|---|
| Gray-on-gray text | any node <4.5:1 against its effective background → fail |
| Tiny "minimal" text | interactive/data text <12px; body <14px → fail |
| Missing/suppressed focus states | `outline-none` without `:focus-visible` replacement → fail |
| Div-soup interactivity | onClick on non-interactive tags; zero landmarks; unlisted repeats → fail |
| Unlabeled icon buttons | any control with empty accessible name → fail |
| Implausible demo data | all deltas positive; all numbers round; "John Doe"/lorem rendered → fail |
| Truncation never exercised | 3×-length fixture causes overflow at 375/768/1440 → fail |
| Broken heading outline | skipped levels; h1 count ≠ 1; styled-div headings → fail |
| Happy-path-only screens | any data view lacking empty/loading/error branches → fail |

### 2.9 Data visualization (gap-fill lens)

| Indicator | Mechanical check |
|---|---|
| Gradient-to-transparent area under every line | >1 fade-fill chart per screen; area mark on non-cumulative metric → fail |
| Oversmoothed bezier curves on sparse data | non-linear interpolation under ~30 points; path exceeding data min/max → fail |
| Untouched library defaults | literal `#8884d8`, `#82ca9d`, `strokeDasharray="3 3"`; any chart color not a token → fail |
| Rainbow / all-indigo palettes | >5 hues per chart; red/green without semantics → fail |
| Donut/gauge reflex | >5 slices; gauges for single values; >1 radial per screen → fail |
| Axes without units / non-zero bars | no unit anywhere; bar axis excluding 0; raw `1234567` ticks → fail |
| Single-series legends | legend on 1-series chart; legend duplicating title → fail |
| Glow/3D/gradient marks | filters on paths; gradient bar fills; neon-on-dark → fail |
| Chart-by-reflex | <4 points charted (should be a stat); pies >8 slices; >6 equal-weight lines → fail |

### 2.10 Cross-screen coherence (gap-fill lens — the process-level slop)

| Indicator | Mechanical check |
|---|---|
| Spacing drift on the same role | one role resolving to >1 padding/gap value across screens → fail |
| Near-duplicate component accumulation | new component sharing a noun with an existing export → fail |
| Fabricated token names | any `var(--…)` not present in `tokens.ts` manifest → fail |
| Hardcoded literals beside a live token system | raw hex/rgb/px in component diffs → fail |
| Regeneration non-determinism | distinct radius/shadow/size count grew after a change → fail |
| Additive instead of editive iteration | restyle request produced new files/classes instead of edits → fail |
| Per-screen design language | screen style profile contains entries absent from system inventory → fail |
| Vendor import leakage | direct vendor/icon-package imports outside the adapter → fail |
| States re-invented per screen | same role resolving a state with different recipes → fail |

### 2.11 Responsive & touch (gap-fill lens — the checklist blind spot)

| Indicator | Mechanical check |
|---|---|
| Desktop-frozen layout | horizontal scroll at 375px; fixed widths ≥400px unguarded → fail |
| Grid-collapse-to-identical-stack | only responsive change anywhere is column count → flag |
| Unscaled hero type | bare `text-6xl` with no smaller base; >3-line heading at 375px → fail |
| `h-screen` viewport assumptions | `h-screen` over `dvh` with inputs/scrollables inside → fail |
| Hover-only affordances | interactive elements gated by hover with no touch path → fail |
| Sub-target taps | hit areas <24px (hard) / <44px in sticky bars; <8px between targets → fail |
| Tables with no small-screen strategy | 4+ columns, no overflow container and no column strategy → fail |
| Hamburger-everything | ≤4 links hidden behind hamburger; app shell with no mobile nav surface → flag |
| Breakpoint monoculture | exactly one responsive prefix on a 3+-section screen → flag |

---

## Part 3 · Anti-slop rules for this system

Grounded in the token contract (`src/tokens.ts`, `globals.css`), the 9 principles, and the competitor extraction (2026-08-11 product-style research). Rules carry IDs so reviews can cite them. **Hard rule = fail the change. Soft rule = justify in the PR or fix.**

The one-line version: **this system's look is decided — Geist, one emerald accent doing work, ink-on-paper grays, 6/12/18 radii, whisper elevation, Phosphor. A generated screen may only *instantiate* those decisions, never re-make them.**

### COL — Color & effects

- **COL-1 (hard)** Zero gradients in product UI: not on buttons, text, backgrounds, borders, or chart marks. `bg-clip-text` count is 0. The competitor set (OpenAI, Linear, Claude, Twenty…) ships zero gradients — flat is the expensive look.
- **COL-2 (hard)** One accent, one job (Principle 2). Emerald marks *the way forward*; status hues appear only bound to real states via `Status/*` tokens. Never cycle colors across sibling cards; never use color where hierarchy is the actual need.
- **COL-3 (hard)** Elevation only from the finish axis (`Card/*`, `Overlays/*`, `Flat/*` effect styles). No new shadow values, no colored or glowing shadows (any shadow with chroma is a fail), no shadow on an element whose ancestor is shadowed.
- **COL-4 (hard)** No `backdrop-filter`, no blurred orbs, spotlights, auroras, mesh washes, or grain overlays. Surfaces come from `Surface/*` tokens; atmosphere is not a component concern.
- **COL-5 (hard)** Dark mode is the `.dark` token block, never an aesthetic: no pure `#000`/`#fff` pairs, no neon accents, no dark-only screens.
- **COL-6 (soft)** Indigo/violet/purple (hue 250–290) exists in this system only as `chart-4`. Anywhere else it appears, it's the model's default leaking through — remove it.

### TYP — Typography

- **TYP-1 (hard)** One family: Geist (mono only in code contexts). Adding a font family is a design-system change with a spec, never a screen-level decision. No italic-serif accent words, no decorative serifs.
- **TYP-2 (hard)** Type = the 27 declared styles (`text-{size}/{Regular=500|Medium=600|Heavy=700}`). No ad-hoc sizes, no w400/w800, no per-screen `tracking-*`. Emphasis at small sizes is a weight step, not a size step (the Twenty/Linear/Pipedrive pattern).
- **TYP-3 (hard)** Hierarchy never comes from decoration: no gradient text, no caps eyebrow repeated per section. Uppercase only for ≤3-word labels that carry information.
- **TYP-4 (soft)** Display sizes carry fragments, not sentences: nothing ≥32px longer than ~8 words.

### LAY — Layout & containers

- **LAY-1 (hard)** One visible container boundary per object. Bordered/filled/shadowed rounded containers never nest more than 1 deep. Inside a card: spacing, type, and hairline dividers only.
- **LAY-2 (hard)** Not everything is a card. Content defaults to sitting on the surface; the separation ladder is **spacing → hairline (`--border`) → `Surface Secondary` tint → card**, climbed only as far as needed. If >60% of a screen is boxed, remove boxes.
- **LAY-3 (hard)** Radius comes from the four `--radius-*` rungs (button/control/card/popup, pill for chips), mapped by role: controls tight, cards mid, large surfaces wide. The values belong to the active theme × finish (emerald elevated resolves 6/12/18, flat-dense 6/10/12), so a component references the rung and never the number. A screen never introduces a new radius and never puts card radius on a control.
- **LAY-4 (hard)** Spacing has tiers: within-group gaps visibly smaller (≤ half) than between-group gaps; all gaps on the 4px grid; no arbitrary values (`p-[13px]`).
- **LAY-5 (hard)** Count follows content: never exactly-3 equal cards by reflex, never equal-size stat strips. The screen's one question (Principle 4) gets the dominant element; at squint distance the priority must be visible.
- **LAY-6 (soft)** Product UI is left-anchored. Centered compositions are for empty states and true focal moments only.

### CMP — Components & patterns

- **CMP-1 (hard)** Compose from the library. Search `src/components` before creating anything; a new component sharing a noun with an existing export (Card, Badge, Dialog…) is a fail. Restyle requests **edit** the existing definition — no V2 files, no override classes.
- **CMP-2 (hard)** No vendor-default rendering: everything routes through the themed components; direct shadcn/vendor imports outside the sanctioned paths fail lint.
- **CMP-3 (hard)** No colored left-border accent strips (the researched "em-dash of AI design") — status is carried by the chip/callout vocabulary, not decorated edges.
- **CMP-4 (hard)** No badge theater: badges bind to the real status vocabulary. No "✨ AI-powered" chrome; sparkle iconography at most once per surface and always text-labeled (NN/g: unlabeled sparkles fail as icons). AI features are named by what they do (Principle 8 covers the receipts).
- **CMP-5 (hard)** Marketing-slop quarantine: hero pill badges, logo marquees, testimonial carousels, stat-counter bands, and 3-tier pricing theater don't exist in product UI, and on marketing surfaces require real, verifiable content behind every claim.

### ICO — Icons

- **ICO-1 (hard)** Phosphor via `@nickv/pegbo-ui/lib/icons` only (existing law), one weight per context, sizes 16/20/24.
- **ICO-2 (hard)** Zero emoji in chrome — nav, buttons, headings, labels, bullets, table cells. Emoji live only in user-generated content.
- **ICO-3 (hard)** Icons are sized to their job: ≤24px inline, ≤48px in empty states, never a decorative giant, never the icon-in-tinted-circle feature-grid mold.

### MOT — Motion

- **MOT-1 (hard)** Motion only on state change: hover, focus, press, open/close, loading, data update. Zero infinite loops outside genuine progress indicators (Skeleton's pulse is the sanctioned exception).
- **MOT-2 (hard)** Two durations: ~120–150ms micro-feedback, ~200–250ms overlays. Ease-out, named properties (never `transition: all`), transform/opacity only — no animating layout properties.
- **MOT-3 (hard)** No entrance choreography: no scroll-reveal, typewriter, marquee, parallax, animated gradients, bounce/elastic easing on chrome.
- **MOT-4 (hard)** The moment any keyframe exists, `prefers-reduced-motion` guards ship with it.

### CPY — Copy

- **CPY-1 (hard)** Say the thing: labels and CTAs name the object and outcome ("Create submission request", "Import COI"), never "Get Started"/"Learn More". The label predicts the next screen.
- **CPY-2 (hard)** Banned register: elevate/unlock/empower/supercharge/seamless/effortless/game-changing…; "not just X — it's Y" constructions; exclamation marks in microcopy; em-dash density >1 per 100 words; "X. Y. Z." triad headers.
- **CPY-3 (hard)** One text node per fact: a field gets a label; placeholder only for format examples; helper text only when it adds constraints/consequences the label can't.
- **CPY-4 (hard)** Zero fabrication: every number, name, quote, and logo traces to real data or clearly-marked fixtures. No invented social proof, ever. (This is Principle 8 applied to content.)

### CHT — Charts

- **CHT-1 (hard)** Chart colors are `chart-1…5`, assigned in order; the series answering the card's question gets emphasis, context series go gray. Never library defaults (`#8884d8` is an automatic fail), never red/green without status semantics.
- **CHT-2 (hard)** Lines interpolate linear or step. No bezier smoothing on sparse/periodic data, no gradient area fills; area marks only for genuinely cumulative quantities, at most one per screen.
- **CHT-3 (hard)** Marks are flat: no glow, 3D, or gradient fills; hairline horizontal-only gridlines; elevation belongs to the card, not the plot.
- **CHT-4 (hard)** Readability floor: every axis has a unit somewhere visible; bars zero-based; ≥10k values abbreviated; no legend on single-series charts; ≤5 slices or switch to sorted bars; <4 data points is a stat, not a chart.

### STA — States, structure & accessibility

- **STA-1 (hard)** Every data view ships empty/loading/error/populated, designed — the empty state leads with the creating action (Principle 5). Happy-path-only fails.
- **STA-2 (hard)** Interaction states use the recipes (Principle 7): one recipe per role across the whole app. Inventing a state treatment per screen fails.
- **STA-3 (hard)** `Focus Ring` token on every interactive element; `outline-none` without a `:focus-visible` replacement fails.
- **STA-4 (hard)** Semantics: native elements or Radix primitives; no `onClick` divs; landmarks present; one h1 per view; sequential heading levels; every icon-only control has an accessible name; decorative SVGs get `aria-hidden`.
- **STA-5 (hard)** AA contrast on the surface the text actually sits on — the darkened `--status-action`/`--text-destructive` values exist for exactly this; never "restore" brighter ones. Functional text ≥12px, body ≥14px.
- **STA-6 (hard)** Hostile fixtures before done: 3×-length names, one unbroken 60-char token, zero/negative cases, mixed-sign deltas, non-round numbers. Truncation policy declared per slot. No "John Doe", no lorem, no uniformly-green dashboards.
- **STA-7 (hard)** The 375px pass: no horizontal scroll; tap targets ≥24px (44px in sticky bars, ≥8px apart); no hover-gated actions without a touch path; tables have a declared small-screen strategy; `dvh` not `vh` for full-height shells; more than one breakpoint doing work on any real screen.

### SYS — System coherence (the process rules)

- **SYS-1 (hard)** Tokens only (existing law, extended): no raw hex/rgb/px in components; every `var(--…)` and themed utility must resolve against `tokens.ts`. A plausible-but-nonexistent token name is machine provenance — fail.
- **SYS-2 (hard)** The value ratchet: a change may not grow the count of distinct radii, shadows, font sizes, or spacing steps in the app. The inventory shrinks or holds; it grows only via a design decision recorded in a spec.
- **SYS-3 (hard)** Same role, same values, everywhere: identical component roles resolve identical spacing/type/state treatments across screens. New screens are diffed against the system inventory before acceptance.
- **SYS-4 (hard)** Before "done": run the Part 4 audit, then `npm run lint && npm run typecheck && npm test` (and `npx tsc -p prototypes/proto-oleh` / `npx tsc -p prototypes/proto-timur` when applicable).

---

## Part 4 · The self-audit (countable, not vibes)

Run on any generated/modified screen before calling it done. Expected result of every grep: **zero** (exceptions listed inline).

```bash
# Effects & gradients (COL-1/3/4)
grep -rn "bg-gradient-\|bg-clip-text\|backdrop-blur\|backdrop-filter" src/components prototypes/proto-oleh/src prototypes/proto-timur/src

# Raw values in components (SYS-1)
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsl\(" src/components prototypes/proto-oleh/src prototypes/proto-timur/src --include="*.tsx"

# Arbitrary Tailwind values (LAY-4, SYS-1) — review every hit
grep -rnE "\-\[[0-9]+px\]" src/components prototypes/proto-oleh/src prototypes/proto-timur/src

# Icon discipline (ICO-1)
grep -rn "lucide-react\|@phosphor-icons/react" src/components prototypes/proto-oleh/src prototypes/proto-timur/src | grep -v "lib/icons"

# Motion defaults (MOT-2) — animate-pulse allowed only in skeleton.tsx
grep -rn "transition-all\|animate-bounce\|animate-spin\|animate-pulse" src/components prototypes/proto-oleh/src prototypes/proto-timur/src

# Chart defaults (CHT-1)
grep -rn "8884d8\|82ca9d\|strokeDasharray=\"3 3\"" src prototypess

# Emoji in chrome (ICO-2)
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2728}]" src/components prototypes/proto-oleh/src prototypes/proto-timur/src

# Copy register (CPY-2)
grep -rniE "elevate|unlock|empower|supercharge|seamless|effortless|game.chang|revolutioniz" src prototypess
```

Rendered checks (Storybook or prototype, via browser tools):

1. **Squint test** — screenshot at 50% zoom: is the screen's one question visually dominant? Do any two sections share an identical structural signature?
2. **Count pass** — distinct font sizes ≤7, radii ⊆ the four `--radius-*` values of the active theme × finish (+ pill), shadow values ⊆ finish tokens, saturated accents per viewport ≤1 (+ status colors on real states).
3. **Contrast pass** — every text node ≥4.5:1 against its effective background (3:1 for ≥24px/19px-bold).
4. **Keyboard pass** — Tab through: visible focus ring on every stop; no unreachable interactive element.
5. **375px pass** — no horizontal scroll, headings ≤3 lines, tap targets per STA-7, tables strategy visible.
6. **Hostile-fixture pass** — long strings, empty array, error state, mixed-sign data rendered without breakage.
7. **Ratchet pass** — re-run count pass and compare to before the change: no inventory growth (SYS-2).

### When a check fails — the fix ladder

A failing check is never fixed by bare deletion. Slop is a **faked decision**: the gradient was faking emphasis, the card was faking grouping, the pulse was faking liveness, the stat band was faking proof. Identify the job, then do it with the system's device for that job:

| Failing check | Fix — substitute the system's device |
|---|---|
| Gradient fill / gradient text | Flat token: fills → accent or `Surface/*` tint; gradient text → `text-primary` + a weight step, or one word in `text-accent`. Express the intended emphasis with size/weight/position. |
| Glass / glow / orbs / grain | Delete the layer; separation comes from the ladder (spacing → hairline → tint → card). A surface that truly floats is `surface-popover` + `Overlays/*` shadow. |
| Colored / new shadow value | Swap to the finish-axis token for the surface's role. Intent was focus → Focus Ring; intent was attention → position/size/contrast. |
| Raw hex / rgb / px literal | Find the semantic token by its `usage` line in `tokens.ts`, use its utility. Nothing fits → stop and propose the token in a spec; never inline. |
| Arbitrary `[Npx]` spacing/radius | Snap to the 4px grid / nearest of 6/12/18. |
| New font size, weight, or family | Snap to the nearest of the 27 styles. Emphasis wanted → weight step (500→600→700), not a new size. |
| Icon import leak / emoji in chrome | Re-route through `lib/icons` (add the alias there if missing); emoji → the Phosphor equivalent at 16/20/24, or nothing. |
| `transition-all` / idle loops / scroll effects | Name the properties (`transition-colors`, `-opacity`, `-transform`) at 120–150ms / 200–250ms ease-out. Loops bind to a real changing state or die; entrance choreography renders static. |
| Copy register / generic CTA | Rewrite as verb + object ("Create submission request"). Every adjective must be provable by the screenshot, every number by data — otherwise delete the claim, not just the word. |
| Chart defaults | Colors → `chart-1…5`; gradient area → plain 1.5–2px line; smoothing → linear/step; unit via tick formatter or title; single-series legend → direct label. |
| Contrast failure | Move **up** the text ramp (tertiary → secondary → primary) or lighten the surface — never invent a one-off darker hex. |
| Missing focus state | Apply the shared Focus Ring recipe; `outline-none` is only legal next to a `:focus-visible` replacement. |
| Nested cards / cardocalypse | Dissolve inner boundaries down the ladder (card → tint → divider → spacing), keeping the content. Card only for discrete objects. |
| Three-card reflex / equal stat strip | Rank the content: the answering item gets the dominant cell; the rest become a row, list, or table. |
| Happy-path-only view | Add the three missing states: empty = one sentence + the creating action; loading = skeleton matching the final layout; error = human-readable cause + retry. |
| 375px failures | Mobile-first bases (`text-3xl md:text-6xl`), `dvh` for shells, pad hit areas to 24/44px, hover-reveals become kebab menus, tables pick a strategy (hide secondary columns / card rows / contained scroll + cue). |
| Fabricated token name | Grep `tokens.ts` for the concept and use the real name; genuinely missing → surface it, don't guess. |
| Duplicate component / V2 file | Delete the new one; extend the existing component via `tone`/`variant` per the prop convention. |
| Ratchet growth | Converge stray values onto existing scale steps. A genuinely new step enters via tokens + spec + Figma, never via a component. |

---

## Part 5 · Condensed block (ready for AGENTS.md or a skill)

```markdown
## Anti-slop rules (generated UI)

Slop = the absence of decisions. This system's decisions are already made — Geist,
one emerald accent with a job, ink-on-paper grays, 6/12/18 radii, finish-axis
elevation, Phosphor icons. A screen may only instantiate them. Full ruleset +
self-audit: research/specs/2026-08-11-anti-slop-rules.md.

Hard bans (any occurrence fails review):
- Gradients anywhere in product UI; `bg-clip-text`; backdrop-blur/glassmorphism;
  blurred orbs, spotlights, grain overlays; colored/glowing shadows; pure #000/#fff.
- Indigo/violet outside `chart-4`; color cycling across siblings; colored
  left-border accent strips; decoration where hierarchy is the need.
- New font families, ad-hoc sizes/weights/tracking outside the 27 text styles;
  gradient or italic-serif accent text; caps eyebrows per section.
- Cards in cards (container nesting >1); everything-boxed screens (>60% area);
  new radius values; off-scale spacing; exactly-3-equal-cards reflex; identical
  stat-card strips with no dominant metric.
- Emoji in chrome; >1 sparkle per surface or any unlabeled sparkle; icon-in-
  tinted-circle feature grids; direct icon-package imports (use lib/icons).
- Motion at rest (infinite loops, scroll-reveal, marquee, typewriter, parallax);
  `transition: all`; bounce easing; layout-property animation; missing
  prefers-reduced-motion guard.
- "Get Started"/"Learn More" CTAs; elevate/unlock/seamless/effortless register;
  "not just X — it's Y"; exclamation marks in microcopy; fabricated numbers,
  testimonials, logos, or demo data no real system could emit.
- Chart defaults (#8884d8, gradient area fills, bezier smoothing on sparse data,
  glow/3D marks, single-series legends, unit-less axes, non-zero bar baselines).
- Happy-path-only views (empty/loading/error are deliverables); hover-only
  actions; tap targets <24px; `h-screen` where `dvh` belongs; horizontal
  scroll at 375px.

Process rules:
- Tokens only; a var() that isn't in tokens.ts is a fabricated token — stop.
- Search src/components before creating; restyles edit existing definitions
  (no V2 files, no override classes).
- Value ratchet: a change never grows the count of distinct radii/shadows/
  sizes/spacing steps in the app.
- Before done: run the anti-slop audit greps + the 7 rendered passes
  (squint, counts, contrast, keyboard, 375px, hostile fixtures, ratchet).
- Fixes are substitutions, not deletions: every failing check has a recipe
  (the fix ladder) — find the job the slop was faking (emphasis, grouping,
  liveness, proof) and do it with the system's device.
```

---

## Sources (primary)

Slop catalogues & tells: impeccable.style/slop · vibecodekit.dev/ai-slop-design · 925studios.co (slop tells + web guide) · developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it · adriankrebs.ch/blog/design-slop (1,590-site Show HN scoring) · thefountaininstitute.com/blog/signs-vibe-coded-ui · mania.design "Spot the Slop" · smoothui.dev/blog/ai-design-slop · killaislop.com · github.com/yetone/kill-ai-slop · usehallmark.com · slop-detect.com

Why convergence happens: dev.to/alanwest ("Blame Tailwind's indigo-500" + fix guide) · prg.sh "Why Your AI Keeps Building the Same Purple Gradient Website" · superdesign.dev (generic-look + design-system drift) · shuffle.dev on template convergence · puckeditor.com "AI slop vs constrained UI" · hardik.substack.com "Expose your design system to LLMs" · builder.io "How to make AI agents follow your design system"

Audits & evidence: overlayqa.com (Lovable/Bolt/Figma-Make bug audit, ~160 issues/app) · frontendmasters.com + master.dev "AI-generated UI is inaccessible by default" · nngroup.com "The AI sparkle-icon problem" · design.google sparkle research · motherduck.com "Vibecoding dashboards" · landingnova.medium.com on social proof · HN threads 45523537, 48496483, 48504912

Craft references: WCAG 2.5.5/2.5.8 tap targets (smashingmagazine, logrocket) · mayank.co + sarahmhigley.com on tooltips/hover · datylon.com + flourish.studio + vizwiz.com on chart craft · shadcn-ui discussions 3650/2345 on h-screen/responsive
