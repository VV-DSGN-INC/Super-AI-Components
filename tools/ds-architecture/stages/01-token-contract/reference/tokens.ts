/** The name contract with the design tool: every token's variable name, byte
 *  for byte. Renaming here or in the design tool without the other breaks the
 *  sync diff — that is the whole job of this file.
 *
 *  TOOL_ONLY records the reverse drift: variables that exist in the design tool
 *  with no code counterpart. Inventoried rather than invisible. */

export const TOKENS = [
  "--surface-primary",
  "--surface-secondary",
  "--text-primary",
  "--text-secondary",
  "--border-default",
  "--accent",
  "--elevation-card",
  "--elevation-overlay",
  "--radius-control",
  "--radius-card",
  "--background",
  "--foreground",
  "--muted",
  "--border",
  "--primary",
  "--color-background",
  "--color-foreground",
  "--color-muted",
  "--color-border",
  "--color-primary",
  "--color-text-secondary",
  "--shadow-card",
  "--shadow-overlay",
  "--radius-control-utility",
  "--radius-card-utility",
] as const

export const TOOL_ONLY: readonly string[] = []
