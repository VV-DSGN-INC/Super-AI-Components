# Preset harness — design

**Written 2026-09-09, at commit `578ca17`** (the merge of PR #47). Every count
below was measured in a worktree at that commit.

---

## 1. Why this exists

The registry's promise is "plug into whatever theme you already have". Since
shadcn's create page, "whatever you have" is a preset space: base library
(Radix or Base UI), style (eight of them), base colour, theme, chart colour,
icon library (five), radius (five steps), fonts, and two menu settings, each
reproducible from a short preset code.

The consumer install test proves one point in that space. It scaffolds a fresh
Next app, runs `shadcn init --defaults`, installs every item, greps that the
shipped variables landed, and builds. It never renders, never runs axe, never
switches to dark, and never leaves the default preset. So "renders right under
a preset it has never seen" is untested, and the failures that class produces
are silent by construction: Tailwind v4 emits nothing for an undefined utility,
so a component reading a name the consumer lacks ships colourless with a green
build. The manifest's `WARNING_CSS_VARS` comment records exactly that failure
once already.

## 2. What was measured

### 2.1 What registry sources reference

All 134 registry items (118 components, 13 blocks, 3 lib) at `578ca17`:

| reference                                | count    | consumer-safe?                                                      |
| ---------------------------------------- | -------- | ------------------------------------------------------------------- |
| CSS variable reads via `var(--x)`        | 7        | all stock shadcn names, plus `--marketing-*` shipped by their items |
| colour-utility stems beyond stock        | 1        | `warning`, 19 uses, shipped via `cssVars` on some items             |
| raw hex / oklch / palette classes        | 0        | gated already (TOK-1, TOK-2, TOK-3)                                 |
| direct `@base-ui/react/*` imports        | 14 files | untested against a Radix consumer                                   |
| `lucide-react` imports                   | 92 files | pinned by ICO-1; a Tabler consumer gets both sets                   |
| numeric arbitrary radius `rounded-[Npx]` | 3        | ignores the consumer's radius setting                               |
| `rounded-[inherit]`                      | 2        | safe: inherits the consumer's radius                                |
| font couplings                           | 0        |                                                                     |

The docs app's own stylesheet declares 33 theme colour names; 31 are stock
shadcn v4 (`--destructive-foreground` is gone in v4), and the two extras are
`warning` and `warning-foreground`. So a colour name that works in the docs
app and breaks in a consumer is, today, exactly one name. The gate exists so it
stays one name, or fewer, as components are added.

### 2.2 The turbo cache trap

`build:registry` declares `outputs: ["public/r/**"]` only. `gen-registry.mts`
also writes `apps/docs/registry.json`, which `consumer-test.sh` reads to derive
the item list. On a turbo cache hit `public/r` is restored and `registry.json`
is not, so a warm local run fails with "derived zero items". CI never caches,
which is why it has never shown there.

### 2.3 The CLI contract

`shadcn` 4.11.0, installed in `apps/docs`, exposes `shadcn/preset` with
`encodePreset`, `decodePreset`, and the vocabularies (`PRESET_STYLES`,
`PRESET_THEMES`, `PRESET_RADII`, `PRESET_ICON_LIBRARIES`, `PRESET_BASES`, …).
The base library is not part of the code: it is `shadcn init --base radix|base`.
The default config encodes to `b0`.

## 3. Decisions

1. **Rows are values, codes are derived.** `apps/docs/harness/presets.ts`
   declares each row as `{ id, base, values, why }` and encodes the code with
   the CLI's own `encodePreset`. A test pins every value to the CLI's
   vocabulary, so a shadcn upgrade that renames an option fails by name, and a
   coverage test asserts the matrix moves every axis it exists to move: base
   library, style, base colour, theme, icon library, radius. A row cannot be
   quietly dropped without that test going red.

2. **Three rows, chosen to span the axes.**

   | id                                | base  | moved off default                               |
   | --------------------------------- | ----- | ----------------------------------------------- |
   | `default`                         | base  | nothing; what the old consumer test ran         |
   | `radix-violet-large`              | radix | primitive library, theme, radius                |
   | `vega-stone-emerald-tabler-small` | base  | style, base colour, theme, icon library, radius |

   Fonts and menu settings are not moved: no registry source references a font
   family, and menus are the consumer's own `dropdown-menu`.

3. **`consumer-test.sh` keeps its name and becomes row-driven.** It is
   referenced from `CLAUDE.md`, `README.md`, `run-gates.sh` and four plans, and
   the `default` row is the exact test it always ran. It gains a `ROW` argument
   and four phases after the install it already does: assert the generated
   `globals.css` declares every name in `CONSUMER_STOCK_VARS`; copy the docs
   demos into the consumer under `/harness/<name>` routes, with `tsconfig`
   paths mapping each item's source path to its installed target; build; then
   run Playwright with axe over every demo in light and dark, scoped to the
   demo's own `[data-harness-item]` container, screenshotting each page.

4. **Failures are baselined, shrink-only.** `apps/docs/harness/baseline.json`
   holds `row/theme/item:axe-rule` keys. A test fails on a key not in the
   baseline, and the run's teardown fails on a baselined key that no longer
   fires, so the file can only shrink. `pnpm harness:baseline <row>` rewrites
   it and refuses to grow it, the `story-coverage:baseline` discipline. The
   first run of a row is the one exception, as it is for every baseline here.

5. **CI: `verify` keeps its twelve steps; foreign rows are a matrix job.** The
   consumer install step now runs the `default` row with rendering and axe. A
   second job, `presets`, runs the other rows as a matrix, `needs: verify`, and
   uploads each row's screenshots as an artifact. `run-gates.sh` mirrors it by
   looping the non-default rows after the consumer install step.

6. **Axe scope and rules.** WCAG 2.x A and AA tags only, so best-practice rules
   about page structure (a bare harness page has no h1) do not fire on the
   harness's own chrome. This is narrower than the Storybook gate, which runs
   axe's defaults; the difference is recorded here so nobody reads the harness
   as a superset.

7. **Two rules land with it.**
   - `TOK-9`, consumer vocabulary: a registry source may reference a theme
     colour name only if it is stock shadcn or shipped by the item's own
     `cssVars`. Reads are colour-utility stems (`bg-warning`) and `var(--x)`
     reads, both resolved against the names the docs stylesheet declares. Its
     detector needs the manifest, which is TypeScript, so it lives as a vitest
     gate in `apps/docs/scripts/lib/` and the record carries a new detection
     method, `delegated`, naming that gate file. `records.test.ts` asserts the
     file exists. This is the method Super Mobile DS already has; the schema
     bump is the first convergence step CLAUDE.md asks for.
   - `LAY-2`, numeric arbitrary radius: `rounded-[<digits>…]` is a blocker
     grep. `rounded-[inherit]` passes by construction. The three sites move to
     `rounded-xs`, Tailwind's 2px step, which shadcn's theme leaves untouched,
     so the change is consumer-independent.

8. **Out of scope, on purpose.** The motion carrier (a `motion` registry item
   versus per-component media queries) is a separate decision. The 14 direct
   Base UI imports are not refactored: the `radix-violet-large` row measures
   whether they coexist with Radix, and the result goes in §5 after the first
   run. The icon-library question is likewise measured, not decided.

## 4. What "done" is

- `pnpm test` runs the preset tests, the vocabulary gate, and the two new rule
  fixtures; `check:tokens` reports `LAY-2` clean and `TOK-9` as
  `unchecked (delegated)` naming its gate.
- `apps/docs/scripts/consumer-test.sh` with no argument does what it did plus
  rendering and axe on the `default` row; with a row id it does the same under
  that preset.
- `ci.yml` runs the matrix; `run-gates.sh` mirrors it; `CLAUDE.md`'s CI section
  and the gate-run skill name the new job.
- `turbo.json` declares `registry.json` as a `build:registry` output.
- §5 below is filled in from the first full run.

## 5. Findings from the first run

Measured 2026-09-09 on the branch, every count from `harness/baseline.json` and
the run logs. Axe scope: WCAG 2.x A/AA, per §3.6.

| row                               | init and build | baselined, light | baselined, dark | rules that fired                                         |
| --------------------------------- | -------------- | ---------------- | --------------- | -------------------------------------------------------- |
| `default`                         | pass           | 10               | 12              | color-contrast, target-size, scrollable-region-focusable |
| `radix-violet-large`              | build fails    | not reached      | not reached     | six items import Base-UI-only exports from `ui/progress` |
| `vega-stone-emerald-tabler-small` | pass           | 10               | 18              | the same three; dark color-contrast on 12 items, not 6   |

**The default row, which the old test called green, carries 22 findings.**
Target-size on the track-lane trim handles and the filter-chip remove buttons
(both themes), a scrollable table region with no tab stop in timeline-shell
(both), and colour contrast on four items in light and six in dark. Dark had
never been audited by anything; the Storybook gate runs light only.

**The Radix question, measured.** The 14 direct `@base-ui/react` imports
compiled beside Radix without a complaint. What broke is the shadcn _style_
API: `generation-queue`, `render-queue`, `result-card`, `onboarding-wizard`
and `voice-clone-recorder` import `ProgressLabel`, and `run-button` imports
`ProgressTrack` and `ProgressIndicator`, from the consumer's `ui/progress`.
The Base UI style file exports all five parts; the Radix style file exports
`Progress` alone, so Turbopack fails with fourteen "Export … doesn't exist in
target module" errors. Two answers exist and the registry has not chosen:
declare Base UI a requirement on the install page, or have those six compose
only what both styles export. Until then the row carries a dated
`knownFailure` in `presets.ts`, runs by hand, and is left out of the matrix by
the mirror test. Whether the type-check phase would find further style
differences is unknown: compilation failed first.

**The icon question, measured.** The Tabler row installed `@tabler/icons-react`
for the consumer's own ui files beside the registry's `lucide-react`, and
built. The screenshots examined (`filter-bar`, `gen-settings-bar` in light,
`workspace-switcher` in dark) show registry glyphs only; a page where a
consumer ui part draws an icon beside a registry glyph was not verified in
this run, so the mixed-set claim stays a hypothesis.

**What the emerald theme does in dark.** The visible failure is the plan badge
in `workspace-switcher`: dim emerald on near-black, in
`harness/out/vega-stone-emerald-tabler-small/dark/workspace-switcher.png`.
Six more items fail dark contrast under emerald than under neutral, so accent
colour is a real axis for contrast, not only for taste.

**Two things the CLI taught the harness.**

- The init endpoint enforces a pairing the create page applies silently: a
  neutral chart palette must follow the base colour ("Chart color \"neutral\"
  is not available for base color \"stone\"", HTTP 400). `configFor` now derives
  it the way the page does, and the Vega row's code became `bJfF7mxU`, the
  page's own.
- The scaffold runs `shadcn@latest`, which resolved to 4.20.0, while the repo
  pins 4.11.0 for `shadcn build` and the encoder. Both decode the three codes
  to identical values today. The round-trip test pins only the repo's version;
  the harness run is what checks the server side, and a future skew will show
  there as an init failure naming the code.
