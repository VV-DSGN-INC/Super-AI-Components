import { DEFAULT_PRESET_CONFIG, encodePreset, type PresetConfig } from "shadcn/preset";

/** A preset the harness scaffolds a consumer on. Rows are values, not codes:
 *  the code is derived with the CLI's own encoder, so a shadcn release that
 *  changes the encoding cannot leave a stale code here, and presets.test.ts
 *  pins every value to the CLI's vocabulary so a renamed option fails by
 *  name. The base library is not part of the code — shadcn keeps it as
 *  `init --base` — so it is a field of its own. */
export interface HarnessRow {
  /** The CI matrix key, the screenshot directory, the baseline key prefix. */
  id: string;
  base: "base" | "radix";
  /** Axes moved off DEFAULT_PRESET_CONFIG. */
  values: Partial<PresetConfig>;
  why: string;
  /** A row that measured a failure the registry has not decided how to answer.
   *  It stays in the record (the coverage test still sees its axis), runs by
   *  hand, and is excluded from the CI matrix and the gate loop — the mirror
   *  test pins that exclusion to exactly these rows. Same discipline as a
   *  written-reason ledger: the reason travels with the row, and removing the
   *  field is the act of deciding. */
  knownFailure?: { since: string; reason: string };
}

export const HARNESS_ROWS: readonly HarnessRow[] = [
  {
    id: "default",
    base: "base",
    values: {},
    why: "What `shadcn init --defaults` produces; the row the consumer install test always ran.",
  },
  {
    id: "radix-violet-large",
    base: "radix",
    values: { theme: "violet", radius: "large" },
    why: "Radix primitives beside the registry's direct Base UI imports, a coloured accent, and a radius the components do not draw themselves.",
    knownFailure: {
      since: "2026-09-09",
      reason:
        "The consumer build fails: six items (generation-queue, render-queue, result-card, run-button, onboarding-wizard, voice-clone-recorder) import ProgressLabel, ProgressTrack or ProgressIndicator from the consumer's ui/progress, which the Radix-style file does not export. The 14 direct @base-ui/react imports compiled fine beside Radix. Decision pending: declare Base UI a requirement, or make those six compose only what both styles export (spec §5).",
    },
  },
  {
    id: "vega-stone-emerald-tabler-small",
    base: "base",
    values: { style: "vega", baseColor: "stone", theme: "emerald", iconLibrary: "tabler", radius: "small" },
    why: "A second component style, a warm neutral, a second colour, a non-Lucide icon set for the consumer's own ui files, and a tight radius.",
  },
];

/** The create page's own derivation: a neutral chart palette follows the base
 *  colour, and the init endpoint rejects the pair otherwise ("Chart color
 *  \"neutral\" is not available for base color \"stone\"", 400, measured
 *  2026-09-09). A row that moves baseColor without naming chartColor gets the
 *  same chart palette the page would give it. */
/** Rows CI and the gate loop run. */
export const ACTIVE_ROWS: readonly HarnessRow[] = HARNESS_ROWS.filter((r) => !r.knownFailure);

export function configFor(row: HarnessRow): PresetConfig {
  const config = { ...DEFAULT_PRESET_CONFIG, ...row.values };
  if (row.values.baseColor && !row.values.chartColor) config.chartColor = row.values.baseColor;
  return config;
}

export function codeFor(row: HarnessRow): string {
  return encodePreset(configFor(row));
}

export function rowById(id: string): HarnessRow {
  const row = HARNESS_ROWS.find((r) => r.id === id);
  if (!row)
    throw new Error(`unknown harness row "${id}" — known: ${HARNESS_ROWS.map((r) => r.id).join(", ")}`);
  return row;
}
