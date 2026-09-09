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
  },
  {
    id: "vega-stone-emerald-tabler-small",
    base: "base",
    values: { style: "vega", baseColor: "stone", theme: "emerald", iconLibrary: "tabler", radius: "small" },
    why: "A second component style, a warm neutral, a second colour, a non-Lucide icon set for the consumer's own ui files, and a tight radius.",
  },
];

export function configFor(row: HarnessRow): PresetConfig {
  return { ...DEFAULT_PRESET_CONFIG, ...row.values };
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
