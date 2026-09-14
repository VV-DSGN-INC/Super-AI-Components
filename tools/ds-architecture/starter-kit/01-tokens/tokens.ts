/** The name contract with your design tool: every token's variable name, byte
 *  for byte. Renaming here or in the design tool without the other breaks the
 *  sync diff — that is this file's whole job.
 *
 *  TOOL_ONLY records the reverse drift: variables that exist in the design tool
 *  with no counterpart in code. Inventoried rather than invisible. */

export const TOKENS = [
  "--surface-primary",
  "--surface-secondary",
  "--text-primary",
  "--text-secondary",
  "--border-default",
  "--accent",
  "--text-on-accent",
  "--elevation-card",
  "--elevation-popover",
  "--elevation-overlay",
  "--radius-control",
  "--radius-card",
  "--background",
  "--foreground",
  "--muted",
  "--border",
  "--primary",
] as const

export const TOOL_ONLY: readonly string[] = []
