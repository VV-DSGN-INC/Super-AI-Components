# Marketing Mini-Components — Wave 1 Design

**Date:** 2026-07-31
**Status:** Approved (pending final spec review)
**Reference:** [Magic UI](https://magicui.design) used as _behavioral reference only_ — all components are rebuilt from scratch to this repo's standards. No Magic UI source is copied.

## 1. Context & Goal

The repo today has two tiers: the **Super AI registry** (first-class components in
`apps/docs/registry/super-ai/` with docs pages, tests, token lint) and **vendored showcase
sections** in Storybook (`shadcn/ui`, `AI Elements`). Nick wants a set of marketing-site
mini-components — marquees, bento grids, animated text, fancy buttons, decorative effects —
that don't dilute the "AI application components" positioning.

**Decisions made during brainstorming:**

| Decision    | Choice                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Destination | Storybook section **and** published in the registry (installable), under a separate namespace                    |
| Scope       | Wave 1 = 15 flagship components; 17 more parked for wave 2                                                       |
| Naming      | **Marketing** — Storybook section `Marketing/`, dirs `components/marketing/`, registry dir `registry/marketing/` |
| Sourcing    | **Rebuild to repo standards** — Magic UI is the behavioral spec, not the source                                  |
| Testing     | **Full per-component tests** — one co-located `.test.tsx` per component, Super AI convention                     |

## 2. Wave-1 Catalog (15 components)

Groups map to Storybook nesting (`Marketing/<Group>/<Name>`) and the docs sidebar's
new "Marketing" group.

### Layout

| Name                | Description                                                                                                                            | Animation strategy                                                 | New deps |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| `bento-grid`        | Responsive feature grid: `BentoGrid` container + `BentoCard` with icon, title, description, hover CTA reveal                           | CSS transitions only                                               | —        |
| `marquee`           | Infinite horizontal/vertical scroller for logos/testimonials; `pauseOnHover`, `reverse`, `repeat` props                                | CSS keyframes (duplicated track, `translate` loop)                 | —        |
| `terminal`          | Fake terminal window playing a scripted session: `Terminal` shell + `TypingLine` / `AnimatedSpan` children with sequenced delays       | JS sequencing (React state + timeouts); `motion` for line entrance | —        |
| `hero-video-dialog` | Video thumbnail with play button that opens a full-screen lightbox; animation-style variants (e.g. `from-center`, `top-in-bottom-out`) | `motion` (`AnimatePresence`)                                       | —        |

### Text

| Name               | Description                                                                                                      | Animation strategy                                                   | New deps |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| `number-ticker`    | Animates a number from `startValue` to `value` on viewport entry; `decimalPlaces`, `delay`, direction            | `motion` spring + `useInView`                                        | —        |
| `text-animate`     | General-purpose text entrance: split by character/word/line, presets (`blurInUp`, `fadeIn`, `slideUp`…), stagger | `motion` variants + stagger                                          | —        |
| `typing-animation` | Typewriter effect with optional caret, `duration` per char, start-on-view                                        | JS interval (React state)                                            | —        |
| `aurora-text`      | Gradient text with slow drifting aurora hues                                                                     | CSS keyframes over `background-position`; hues from CSS custom props | —        |

### Buttons

| Name               | Description                                                                                                 | Animation strategy                                                        | New deps |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| `rainbow-button`   | CTA button with animated multi-stop gradient border/glow; `variant` (default/outline), `size` set via `cva` | CSS keyframes; 5 stops from CSS custom props                              | —        |
| `ripple-button`    | Button emitting a click-point ripple                                                                        | JS-lite (span injected at click coords) + CSS keyframe                    | —        |
| `pulsating-button` | Button with a soft expanding pulse halo                                                                     | CSS keyframes; halo color from custom prop defaulting to `var(--primary)` | —        |

### Effects

| Name               | Description                                                                               | Animation strategy                                        | New deps                                    |
| ------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `border-beam`      | A light "beam" tracing a container's border; `size`, `duration`, `delay`, colors          | CSS `offset-path: rect()` keyframe                        | —                                           |
| `orbiting-circles` | Children orbit a center at `radius` with `duration`/`delay`/`reverse`; optional path ring | CSS keyframes (rotate on wrapper, counter-rotate content) | —                                           |
| `dot-pattern`      | SVG dot background, sized/faded via props; commonly masked with a radial fade             | Static SVG (optional CSS fade)                            | —                                           |
| `confetti`         | Imperative confetti: `Confetti` canvas component + `ConfettiButton`; ref-triggerable      | `canvas-confetti`                                         | `canvas-confetti`, `@types/canvas-confetti` |

## 3. Component Standards (the contract)

Every component follows the existing Super AI idiom, observable in
`apps/docs/registry/super-ai/cost-chip.tsx`:

- `import * as React from "react"`; named function component; **named export** at file end.
- Props: `interface <X>Props extends React.ComponentProps<"div">` (or the actual root
  element); component-specific props documented with JSDoc where non-obvious.
- `data-slot="<component-name>"` on the root and `data-slot="<component-name>-<part>"` on
  significant parts — this is the styling/testing contract.
- `cn()` from `@/lib/utils`; incoming `className` merged **last**.
- `"use client"` directive on every component that uses state/effects/motion (docs app is
  Next; Storybook ignores it harmlessly).
- Variants via `cva` only where a component genuinely has them (`rainbow-button`).

### Color & token rules

- **Chrome colors** (backgrounds, borders, text, rings) use shadcn CSS variables only —
  `bg-background`, `border-border`, `text-muted-foreground`, etc. All files must pass
  `check:tokens` (no raw hex, no `oklch()`, no Tailwind palette classes).
- **Signature palettes** (rainbow stops, aurora hues, beam colors) are component-scoped CSS
  custom properties, e.g. `--rainbow-1…5`, `--aurora-1…4`, `--beam-from`/`--beam-to`,
  consumed in TSX as `var(--rainbow-1)` — never literal colors in TSX. Defaults live in a
  single `marketing.css` (see §4) and are deliberately the designer-tunable surface.
- Dark mode must look intentional for every component under Storybook's theme toggle —
  chrome flips via tokens; signature palettes may define `.dark` overrides in
  `marketing.css` where the light values glare.

### Motion rules

- **CSS-first**: anything expressible as a keyframe loop is a keyframe loop (marquee,
  border-beam, orbits, pulse, aurora, rainbow). JS animation (`motion` v12) only where
  interpolation or orchestration demands it (number-ticker, text-animate, hero-video-dialog,
  terminal) or DOM injection does (ripple).
- **`prefers-reduced-motion` is honored by every animated component.** Mechanism by tier:
  CSS loops gate under `@media (prefers-reduced-motion: reduce)` in `marketing.css`;
  components already importing `motion` use its `useReducedMotion()`; JS-animated
  components without motion (`typing-animation`, `ripple-button`, `confetti`) read
  `window.matchMedia("(prefers-reduced-motion: reduce)")` in an effect (SSR-safe, no
  extra dependency). All JS paths render the **final state instantly** — ticker shows the target number, typing shows the
  full line, marquee holds a static row, confetti no-ops. This doubles as the deterministic
  path used by tests. Magic UI does not do this consistently; it's part of what makes these
  rebuilds "ours".

### Keyframes

Keyframes and custom-prop defaults live in one shared stylesheet, `marketing.css`,
present in both apps (`apps/docs/` imported from `globals.css`; `apps/storybook/src/`
imported from `index.css`) — same duplication convention as components (§4). Names are
prefixed `marketing-` (e.g. `@keyframes marketing-marquee`) to avoid collisions with
`tw-animate-css`.

## 4. File Layout & Plumbing

**Source of truth:** `apps/docs/registry/marketing/<name>.tsx` (+ co-located
`<name>.test.tsx`). Storybook gets copies at `apps/storybook/src/components/marketing/`
per the existing super-ai convention (registry = truth, storybook = showcase copy).

**Demos:** one demo per component, written once, copied verbatim between apps
(`apps/docs/components/demos/<name>-demo.tsx` and
`apps/storybook/src/components/marketing/demos/<name>-demo.tsx`) — the docs page reads the
demo source off disk for its code tab, so demo code and rendered preview can't drift.
Demos are realistic marketing moments (logo cloud in the marquee, stats row of tickers,
feature bento), not prop dumps, and must themselves pass the token rules. Any logo/brand
marks in demos are neutral placeholder shapes, not real company logos.

**Catalog:** `apps/docs/lib/catalog.ts` gains

```ts
export interface MarketingItem {
  name: string;
  title: string;
  description: string;
  group: "Layout" | "Text" | "Buttons" | "Effects";
}
export const MARKETING_ITEMS: MarketingItem[] = [
  /* 15 entries */
];
```

plus a merged `ALL_ITEMS` (name-uniqueness asserted) used by:

- `app/components/[name]/page.tsx` — routes and demos map extended (union type
  `CatalogName | MarketingName`); install snippet unchanged (`/r/<name>.json`).
- `app/components/layout.tsx` — sidebar renders a **Marketing** group below the existing
  Primitives/Components groups, driven by `MARKETING_ITEMS`.

**Registry generator** (`scripts/gen-registry.mts`):

- Second pass over `MARKETING_ITEMS` with `file()` pointed at `registry/marketing/`,
  target `components/marketing/<name>.tsx`.
- Item-level `css` and `cssVars` support added to the `Item` type and emitted into
  `registry.json`, so keyframes + palette custom props ship to `npx shadcn add` consumers
  (shadcn v4 registry schema supports both). Each marketing item declares exactly the
  keyframes/vars it needs; `marketing.css` is the human-readable mirror of those blocks.
- `extras` gains `confetti: { dependencies: ["canvas-confetti"] }` and `dependencies:
["motion"]` for the motion-using items.

**Token lint** (`scripts/check-tokens.mjs`): glob widens to
`registry/{super-ai,marketing}/**/*.tsx`. No new exception mechanism — marketing
components comply via the custom-prop rule (§3).

**Dependencies:** `motion@^12` added to `apps/docs`; `canvas-confetti` +
`@types/canvas-confetti` added to both apps.

**Storybook:** stories at `apps/storybook/src/stories/marketing/<Name>.stories.tsx`, titled
`Marketing/<Group>/<Name>`; `preview.tsx` `storySort.order` becomes
`["Overview", "Super AI", "AI Elements", "shadcn/ui", "Marketing"]`.

## 5. Testing

One `.test.tsx` per component (15 files), co-located in `registry/marketing/`, mirroring
the Super AI style (vitest + Testing Library, run via existing `apps/docs/vitest.config.ts`).
Every test asserts at minimum: renders children/content, exposes the `data-slot` contract,
merges `className`. Behavioral additions per component where logic exists:

- `number-ticker` — reduced-motion path renders the exact final formatted value
  (`decimalPlaces` respected).
- `typing-animation` / `terminal` — fake timers advance the sequence; full text appears in
  order; reduced-motion renders complete text immediately.
- `marquee` — content duplicated for the loop (`aria-hidden` on the clone), `reverse` /
  `pauseOnHover` reflected in data attributes/classes.
- `confetti` — `canvas-confetti` mocked (JSDOM has no canvas); fires on trigger, no-ops
  under reduced motion.
- `hero-video-dialog` — opens/closes, iframe src set, Escape closes, focus returned.
- `bento-grid` / `dot-pattern` / buttons / `aurora-text` / `text-animate` /
  `border-beam` / `orbiting-circles` — render + slot + className contract, plus any prop
  that changes DOM structure (e.g. `orbiting-circles` radius style, button variants).

JSDOM keeps CSS keyframes inert, and the reduced-motion instant-final-state path (§3) is
the deterministic branch tests lean on — no animation-frame polling in tests.

## 6. Acceptance Criteria (wave 1 done =)

1. `pnpm typecheck`, `pnpm test`, `pnpm check:tokens`, `pnpm build:registry`, `pnpm build`
   all green from repo root.
2. `registry.json` contains 24 items (9 super-ai + 15 marketing); spot-install of
   `marquee` and `confetti` via `consumer-test.sh` pattern succeeds.
3. Storybook builds; sidebar shows the Marketing section with 4 groups / 15 stories; every
   story presentable in **light and dark** via the theme toolbar.
4. Docs site shows the Marketing sidebar group; each component page renders live demo +
   code tab + install snippet.
5. Reduced-motion: with OS/emulated `prefers-reduced-motion: reduce`, no marketing
   component loops or auto-animates.

## 7. Out of Scope (Wave 2 parking lot)

`file-tree`, `code-comparison`, `tweet-card`, `lens`, `animated-beam`,
`animated-theme-toggler`, `video-text`, `text-reveal`, `scroll-based-velocity`,
`sparkles-text`, `highlighter`, `animated-gradient-text`, `safari`, `iphone`, `android`,
plus `backlight` and `dia-text-reveal` (existence/shape to verify upstream at wave-2
scoping). Decision recorded now: for the three device mockups, wave 2 revisits sourcing —
hand-redrawing hardware SVG shells has no rebuild value, so those may use traced/own-drawn
shells or stay Storybook-only; that call is deferred, not implied by this spec.

Also out of scope for wave 1: e2e coverage beyond the existing smoke test, docs-site search,
and any promotion of marketing items into the Super AI catalog groups.
