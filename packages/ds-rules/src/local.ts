import type { Rule } from "./schema";

/** This repo's own rules, migrated from their four previous homes:
 *  check-tokens.mjs PATTERNS (TOK-1..3), token-rules.mjs (TOK-4..5, added in
 *  the same PR by rulecheck's STRUCTURAL routing), a11y-baseline.md's
 *  cross-component warning (TOK-6), and anti-slop.md Phase 2 (TOK-7, the one
 *  ban the old gate never mechanised). Spec:
 *  docs/superpowers/specs/2026-08-21-ds-rules-retrofit-design.md §4. */

export const CATALOG_SCOPES = [
  "apps/docs/registry/super-ai",
  "apps/docs/registry/marketing",
  "apps/docs/components/ui",
];

/** Findings under these scopes report as warnings, never blockers: vendored
 *  shadcn ports, where fixing means diverging from upstream — a decision
 *  nobody has made. Triaged in docs/design-system/vendored-token-findings.md.
 *  rulecheck.mjs mirrors this list; records.test.ts pins the two equal. */
export const VENDORED_SCOPES = ["apps/docs/components/ui"];

const catalogGrep = { flags: "", scope: CATALOG_SCOPES, include: [".tsx"], exempt: [".test."] };

export const LOCAL_RULES: Rule[] = [
  {
    id: "TOK-1",
    title: "No raw hex colours in registry sources",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "#[0-9a-fA-F]{3,8}\\b",
      ...catalogGrep,
      falsePositives:
        "Issue references like #1234 in comments — the documented repo convention is to write GH-1234 in registry sources instead (carried from check-tokens.mjs).",
    },
    fix: "Use a shadcn CSS variable (bg-background, text-foreground, …) or the item's own cssVars entry.",
    why: "A raw hex is unreachable by the token system: no theme or axis can re-map it.",
  },
  {
    id: "TOK-2",
    title: "No raw oklch() in registry sources",
    severity: "blocker",
    detect: { method: "grep", pattern: "\\boklch\\s*\\(", ...catalogGrep, flags: "i" },
    fix: "Use a shadcn CSS variable; oklch literals belong only in globals.css token definitions.",
    why: "Same as TOK-1 — a colour literal bypasses the contract.",
  },
  {
    id: "TOK-3",
    title: "No Tailwind palette classes in registry sources",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern:
        "\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b",
      ...catalogGrep,
    },
    fix: "Use the semantic shadcn variable for the role (bg-muted, text-destructive, border-input, …).",
    why: "A palette class hardcodes a hue the theme cannot re-map (design spec §6).",
  },
  {
    id: "TOK-6",
    title: "No muted text under a composed muted surface",
    severity: "blocker",
    detect: {
      method: "rendered",
      how: "Static rules cannot see a child's text-muted-foreground under an ancestor's bg-muted/accent/secondary — every instance that actually shipped broken was this shape. The checker for this rule is the Storybook axe gate: pnpm test:stories.",
    },
    fix: "Rebind the variable on the surface-painting element — [--muted-foreground:var(--accent-foreground)] — never restyle composed children's slots.",
    why: "bg-muted/accent/secondary against text-muted-foreground is 4.34:1 against a 4.5:1 minimum (a11y-baseline.md); the cross-component shape is invisible to single-file analysis.",
  },
  {
    id: "TOK-7",
    title: "No raw rgb()/rgba()/hsl() in registry sources",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "\\b(?:rgba?|hsla?)\\s*\\(",
      ...catalogGrep,
      falsePositives:
        "A string that discusses a colour function (docs copy, comments) rather than applying one. None known in the current tree; every hit needs a look before dismissal.",
    },
    fix: "Use a shadcn CSS variable; if a computed colour is genuinely needed, color-mix() over variables inside globals.css.",
    why: "anti-slop.md Phase 2 bans raw colour functions in components when a token system exists; the old gate covered hex and oklch but not these.",
  },
];
