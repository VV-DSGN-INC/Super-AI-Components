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
  {
    id: "TOK-4",
    title: "No muted text paired with a muted background in one class string",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "text-muted-foreground",
      ...catalogGrep,
      falsePositives:
        "The pattern alone matches every legitimate muted-text usage — it is only a pre-filter. Findings come exclusively from the structural single-string check in token-rules.mjs; rulecheck routes this id there and never runs the pattern generically.",
    },
    fix: "Give muted text a non-muted surface (bg-card, bg-background), or rebind [--muted-foreground:var(--accent-foreground)] on the surface-painting wrapper — note the rebind lives on the wrapper, never in the same class string as the pairing.",
    why: "bg-muted/accent/secondary with text-muted-foreground is 4.34:1 against a 4.5:1 minimum (a11y-baseline.md).",
  },
  {
    id: "TOK-5",
    title: "No muted text/background split across a cva() base and a variant value",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "text-muted-foreground",
      ...catalogGrep,
      falsePositives:
        "Same pre-filter as TOK-4; findings come exclusively from the balanced-paren cva scan in token-rules.mjs (the shape that let components/ui/tabs.tsx ship the exact pairing this gate exists to catch).",
    },
    fix: "Rebind [--muted-foreground:var(--accent-foreground)] on the variant that paints the surface.",
    why: "A base class and a variant value render together at runtime; the single-string rule cannot see the pair.",
  },
  {
    id: "TOK-8",
    title: "Foreground composites only from foreground, only at the measured steps",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern:
        "\\b(?:text|fill|stroke|placeholder|decoration|caret)-(?!(?:xs|sm|base|lg|[2-9]?xl)/)(?!foreground/(?:60|70|80)\\b)[a-z][a-z-]*/(?:\\d+|\\[[^\\]]*\\])",
      ...catalogGrep,
      /** dot-pattern: an aria-hidden, pointer-events-none decorative dot grid
       *  painted via currentColor at muted-foreground/40 — texture, not a
       *  readable foreground, so the floor does not apply. Same footing as
       *  skeleton.tsx's animate-pulse exemption. */
      exempt: [".test.", "dot-pattern.tsx"],
      falsePositives:
        "A comment or docs string naming a banned form rather than applying one — phrase prose as 'muted-foreground at 60% opacity', never the utility form (the GH-1234 convention; applied to calendar-view's history note when this rule landed). The size shorthand text-sm/6 is excluded by the pattern itself.",
    },
    fix: "Quiet text derives from the foreground token at a pinned step — text-foreground/60, /70 or /80 (floor measured 2026-08-23: /60 ≥ 5.11:1 on every shipped surface, both themes). Below the floor, any other colour's composite, and arbitrary alphas: use the flat semantic token or TOK-6's rebind device instead.",
    why: "A composite resolves against whatever sits behind it, so neither the pair rules nor a story-scoped axe run reliably sees one. foreground/50 measures 3.65–3.71:1 in light (AA fail); composites of muted-foreground are strictly worse than its flat 4.34:1. The pinned set {60,70,80} is the live set and may only shrink — a new step is a rule change carrying a new measurement (docs/superpowers/specs/2026-08-23-foreground-opacity-floor-design.md).",
  },
  {
    id: "ICO-1",
    title: "Only lucide-react ships icons in registry sources",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern: "from\\s*[\"'][^\"']*icons?[^\"']*[\"']",
      flags: "i",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx"],
      exempt: [".test."],
      falsePositives:
        "A non-icon package with 'icon' in its name, or a local module named icons. lucide-react contains no 'icon' substring, so the sanctioned library never matches.",
    },
    fix: "Import the equivalent glyph from lucide-react at the size the component already uses (16/20/24).",
    why: "One library, one stroke weight (anti-slop Part 2.6 / Part 3.5): mixed icon sets read as unguided assembly. Closes the zero-homes gap left when the prose grep (old anti-slop Part 4 ICO-1) was retired. Inverted from a four-library denylist (final review): any icon-ish import that is not lucide-react now needs a look.",
  },
  {
    id: "LAY-1",
    title: "Arbitrary pixel values duplicate or bypass the scale",
    severity: "review",
    detect: {
      method: "judgment",
      how: "Read changed components for arbitrary Tailwind values — [17px], w-[13.5rem], gap-[11px] — that duplicate an existing scale step or invent an off-scale one. A grep is structurally false-positive-prone here (legitimate arbitrary values exist: container-query thresholds, computed track sizes), so this is read-work on the diff, not a pattern.",
    },
    fix: "Snap to the nearest scale step; a value the scale genuinely lacks is a proposal for the token system, not an inline literal.",
    why: "Off-scale values are the quiet ratchet. Was anti-slop Part 4's LAY-4 grep; retired to judgment method because its false-positive rate is structural — declared unchecked beats silently dropped.",
  },
];
