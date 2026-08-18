# Token findings in vendored `components/ui/**`

`check:tokens` now scans vendored shadcn primitives as well as this repo's own
registry. It previously did not, which is how `ui/tabs.tsx` shipped the exact
`text-muted-foreground` / `bg-muted` pairing the gate exists to catch — the
finding CONTINUE.md §8 records as sitting outside the scan scope.

**These are reported, not fixed.** Fixing them means diverging from upstream,
which is the same open question `a11y-baseline.md` parks for the a11y
exclusions, and nobody has decided it. Each entry below is triaged only.

Anything a consumer hits by taking a primitive's **default** variant is marked
`CONSUMER-FACING` — those are the ones worth deciding about first.

## Findings

Captured from `pnpm check:tokens` after widening the glob (exit 0, warn-only):

- **`components/ui/tabs.tsx:19`** — (a) muted-on-muted pairing. `cva()` pairs
  `text-muted-foreground` with `bg-muted` across its base and a variant value
  (4.34:1 against a 4.5:1 minimum). `tabsListVariants`' `defaultVariants` is
  `{ variant: "default" }`, and `default` is the variant that carries
  `bg-muted` (line 24). Every consumer of `<TabsList>` who doesn't explicitly
  pass `variant="line"` hits this. **CONSUMER-FACING.**

- **`components/ui/chart.tsx:68`** — (c) raw colour. The regex flags two raw
  hex literals, `#ccc` and `#fff`, inside `ChartContainer`'s className. On
  inspection these are not applied colour values: they're Tailwind arbitrary
  attribute selectors (`[&_.recharts-cartesian-grid_line[stroke='#ccc']]:…`)
  that target Recharts' own hardcoded `stroke="#ccc"` / `stroke="#fff"`
  attributes on rendered SVG elements, so this component can re-skin them with
  token classes (`stroke-border`, `fill-muted`, `stroke-transparent`, …). The
  hex values are match targets, not styling this component chose — likely a
  false positive of the single-element raw-colour rule, which can't
  distinguish a selector literal from an applied value. Reported as-is per the
  "report, don't fix" scope of this task. The className is applied
  unconditionally on every `<ChartContainer>` (no variant gate at all), so by
  the same "does a default-path consumer hit this" test used for `tabs.tsx`,
  every consumer of `ChartContainer` hits it. **CONSUMER-FACING.**

No other file under `components/ui/**` produced a warning: no additional
`cva()` muted-on-muted pairings, no Tailwind palette classes (`bg-zinc-400`
etc.), and no other raw hex/`oklch()` literals across the remaining 37
vendored files.

### `tabs.tsx` — `tabsListVariants`, default variant

`text-muted-foreground` in the cva base against `bg-muted` in the `default`
variant value: 4.34:1 against a 4.5:1 minimum. Found by `findCvaViolations`,
warned rather than gated because the file is vendored.

Handled at our two call sites (`parameter-panel`, `run-inspector`) by rebinding
`--muted-foreground`; `explore-shell` and `tool-panel` already pass
`variant="line"`, which paints no background.

**Unhandled, and unhandleable from here:** a consumer who installs one of our
components and takes a stock `TabsList` at its default variant gets the failing
pairing. Fixing that means diverging from upstream, which is the open decision
this file exists to hold.
