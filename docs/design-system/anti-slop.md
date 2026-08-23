# AI slop in generated UIs — research + anti-slop rules (portable edition)

> **Mechanical detection moved to code.** Every grep-expressible ban below is a
> typed record in `packages/ds-rules/src/{core,local}.ts` — the record, not
> this prose, is what `pnpm check:tokens`, the write-time hook, and the unslop
> skill execute. The one ban here that resists a reliable grep — arbitrary,
> off-scale pixel values — is instead a `judgment`-method record (LAY-1) that
> surfaces in the detector's `unchecked` list rather than being silently
> dropped. This document keeps the taxonomy, the reasoning, and the fix
> ladder; when prose and record disagree, the record wins and this file has
> drifted.

**Date:** 2026-08-11 · **Method:** 12 parallel research lenses, ~40 practitioner sources, ~110 catalogued indicators — each with a *mechanical* detection rule. Origin: the `pegbo-inc/design-system-rebuild` anti-slop spec; this is the project-agnostic edition. The runnable companion is the `unslop` skill (`.claude/skills/unslop/`).

**How to use in this repo:** the taxonomy (Part 2), audit (Part 4), and fix ladder are universal. The rules (Part 3) are written against "the project's declared system" — bind them to THIS repo's tokens, scales, and contracts, which always win over the generic phrasing.

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

## Part 3 · Anti-slop rules (generic)

The one-line version: **a design system is a set of decisions already made; a generated screen may only instantiate them, never re-make them.** Discover this project's decisions first (token file, type scale, icon setup, motion tokens, existing rules) and treat them as law.

Universal hard bans (any occurrence needs explicit justification):

1. **Effects** — no gradient text (`bg-clip-text`); no gradients on controls or readable text; no indigo→violet gradients anywhere; no glassmorphism without real underlying content; no blurred orbs, spotlights, aurora washes, or grain layers; no colored or glowing shadows; no pure `#000`/`#fff` pairs.
2. **Typography** — only the project's declared families and scale steps; no new fonts, ad-hoc sizes, or blanket `tracking-tight`; no italic-serif accent words; no caps eyebrows repeated per section; hierarchy = size/weight, never decoration.
3. **Layout** — visible-container nesting ≤1 (no cards in cards); separation ladder: spacing → hairline → surface tint → card, climbed only as far as needed; radii and gaps only from the project's scale; no exactly-3-equal-cards reflex; no identical stat-card strips; the screen's most important element visibly dominant at squint distance.
4. **Components** — compose from the project's library (search before creating; no near-duplicate or V2 components); no colored left-border accent strips; no "✨ AI-powered" badge theater; sparkle icons at most once per surface and always text-labeled.
5. **Icons** — one library, one weight, 2–3 sizes; zero emoji in chrome (nav, buttons, headings, labels, bullets).
6. **Motion** — only on state change (hover, focus, open/close, loading, data update); no idle loops, scroll-reveal, marquee, typewriter, or parallax; never `transition: all`; transform/opacity only; `prefers-reduced-motion` guard whenever keyframes exist. Use the project's motion tokens where they exist.
7. **Copy** — labels and CTAs name the object and outcome (never "Get Started"/"Learn More"); banned register: elevate/unlock/empower/seamless/effortless/supercharge, "not just X — it's Y", exclamation marks in microcopy; one text node per fact; zero fabricated numbers, names, quotes, logos, or demo data no real system could emit.
8. **Charts** — the project's chart palette only (never `#8884d8`/`#82ca9d`); linear/step interpolation; no gradient area fills; flat marks; units visible; bars zero-based; fewer than 4 data points is a stat, not a chart.
9. **States & accessibility** — empty/loading/error/populated all designed; visible focus on everything interactive; AA contrast on the actual surface; semantic elements (no `onClick` divs); accessible names on icon-only buttons; hostile fixtures (3×-length strings, zero/negative, mixed-sign) survive.
10. **Responsive** — verified at 375px: no horizontal scroll; ≥24px tap targets (44px in sticky bars); no hover-only actions; tables get a small-screen strategy; `dvh` not `vh` for full-height shells.

Process rules (the system-coherence layer):

- **Tokens only** — no raw hex/rgb/px in components when a token system exists; a plausible-but-nonexistent token name is machine provenance: stop and look it up.
- **Value ratchet** — a change never grows the count of distinct radii, shadows, font sizes, or spacing steps; new steps enter via the token system + a recorded decision.
- **Editive over additive** — restyle requests modify existing definitions; no V2 files, no override classes.
- **Same role, same values** — identical component roles resolve identical spacing/type/state treatments across screens.

---

## Part 4 · The self-audit (countable, not vibes)

Run on any generated/modified screen before calling it done.

Mechanical checks first — run the detector, do not re-grep what it owns:

    node packages/ds-rules/rulecheck.mjs --json

Every rule ID cited by name in Part 2 and Part 3 is a typed record in
`packages/ds-rules/src/{core,local}.ts`; the record's `detect.pattern` is
authoritative over any grep this document used to spell out inline, and on
disagreement the record wins. Violations are findings — apply each record's
own `fix`. Then work the `unchecked` list: TOK-6 discharges via
`pnpm test:stories`; the remaining unchecked coverage is the rendered checks
below.

Rendered checks (Storybook or prototype, via browser tools):

1. **Squint test** — screenshot at 50% zoom: is the screen's one question visually dominant? Do any two sections share an identical structural signature?
2. **Count pass** — distinct font sizes ≤7, radii ⊆ the project scale, shadow values ⊆ project elevation tokens, saturated accents per viewport ≤1 (+ status colors on real states).
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
| Raw hex / rgb / px literal | Find the semantic token by its project's token manifest, use its utility. Nothing fits → stop and propose the token in a spec; never inline. |
| Arbitrary `[Npx]` spacing/radius | Snap to the 4px grid / the project's radius scale. |
| New font size, weight, or family | Snap to the nearest of the project's declared type styles. Emphasis wanted → weight step (500→600→700), not a new size. |
| Icon import leak / emoji in chrome | Re-route through the project's icon entry point; emoji → the project's icon set, or nothing. |
| `transition-all` / idle loops / scroll effects | Name the properties (`transition-colors`, `-opacity`, `-transform`) at 120–150ms / 200–250ms ease-out. Loops bind to a real changing state or die; entrance choreography renders static. |
| Copy register / generic CTA | Rewrite as verb + object ("Create submission request"). Every adjective must be provable by the screenshot, every number by data — otherwise delete the claim, not just the word. |
| Chart defaults | Colors → the project's chart palette; gradient area → plain 1.5–2px line; smoothing → linear/step; unit via tick formatter or title; single-series legend → direct label. |
| Contrast failure | Move **up** the text ramp (tertiary → secondary → primary) or lighten the surface — never invent a one-off darker hex. |
| Missing focus state | Apply the shared Focus Ring recipe; `outline-none` is only legal next to a `:focus-visible` replacement. |
| Nested cards / cardocalypse | Dissolve inner boundaries down the ladder (card → tint → divider → spacing), keeping the content. Card only for discrete objects. |
| Three-card reflex / equal stat strip | Rank the content: the answering item gets the dominant cell; the rest become a row, list, or table. |
| Happy-path-only view | Add the three missing states: empty = one sentence + the creating action; loading = skeleton matching the final layout; error = human-readable cause + retry. |
| 375px failures | Mobile-first bases (`text-3xl md:text-6xl`), `dvh` for shells, pad hit areas to 24/44px, hover-reveals become kebab menus, tables pick a strategy (hide secondary columns / card rows / contained scroll + cue). |
| Fabricated token name | Grep the token manifest for the concept and use the real name; genuinely missing → surface it, don't guess. |
| Duplicate component / V2 file | Delete the new one; extend the existing component via its variant props. |
| Ratchet growth | Converge stray values onto existing scale steps. A genuinely new step enters via the token system + a recorded decision, never via a component. |

---

## Part 5 · Wiring

- **Skill:** `.claude/skills/unslop/SKILL.md` — auto-discovered by Claude Code in this repo; invoke before building UI and again before "done".
- **CLAUDE.md / AGENTS.md:** points here; keep it a pointer, not a copy.
- **Origin:** full research with the worked @weeeha/ui ruleset lives in `pegbo-inc/design-system-rebuild` → `docs/superpowers/specs/2026-08-11-anti-slop-rules.md`; improvements should flow back there.

---

## Sources (primary)

Slop catalogues & tells: impeccable.style/slop · vibecodekit.dev/ai-slop-design · 925studios.co (slop tells + web guide) · developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it · adriankrebs.ch/blog/design-slop (1,590-site Show HN scoring) · thefountaininstitute.com/blog/signs-vibe-coded-ui · mania.design "Spot the Slop" · smoothui.dev/blog/ai-design-slop · killaislop.com · github.com/yetone/kill-ai-slop · usehallmark.com · slop-detect.com

Why convergence happens: dev.to/alanwest ("Blame Tailwind's indigo-500" + fix guide) · prg.sh "Why Your AI Keeps Building the Same Purple Gradient Website" · superdesign.dev (generic-look + design-system drift) · shuffle.dev on template convergence · puckeditor.com "AI slop vs constrained UI" · hardik.substack.com "Expose your design system to LLMs" · builder.io "How to make AI agents follow your design system"

Audits & evidence: overlayqa.com (Lovable/Bolt/Figma-Make bug audit, ~160 issues/app) · frontendmasters.com + master.dev "AI-generated UI is inaccessible by default" · nngroup.com "The AI sparkle-icon problem" · design.google sparkle research · motherduck.com "Vibecoding dashboards" · landingnova.medium.com on social proof · HN threads 45523537, 48496483, 48504912

Craft references: WCAG 2.5.5/2.5.8 tap targets (smashingmagazine, logrocket) · mayank.co + sarahmhigley.com on tooltips/hover · datylon.com + flourish.studio + vizwiz.com on chart craft · shadcn-ui discussions 3650/2345 on h-screen/responsive
