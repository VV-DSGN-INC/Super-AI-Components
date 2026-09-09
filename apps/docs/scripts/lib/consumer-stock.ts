/** The colour roles every `shadcn init` writes, whatever the preset. Measured
 *  from the docs app's own generated stylesheet at 578ca17 (33 names, of
 *  which `warning` and `warning-foreground` are this registry's additions)
 *  and re-checked by the preset harness against every scaffolded consumer's
 *  globals.css (harness/assert-stock.mts), so a shadcn release that drops one
 *  fails there by name rather than shipping a colourless component.
 *
 *  `destructive-foreground` is deliberately absent: shadcn v4 removed it. */
export const CONSUMER_STOCK_COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

/** Custom properties a consumer's stylesheet is guaranteed to declare: the
 *  colour roles above as `--<role>`, plus `--radius`. Fonts are not listed
 *  because no registry source references a font family (design §2.1). */
export const CONSUMER_STOCK_VARS: readonly string[] = [
  ...CONSUMER_STOCK_COLORS.map((c) => `--${c}`),
  "--radius",
];
