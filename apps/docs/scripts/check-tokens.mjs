import { globSync, readFileSync } from "node:fs";

const FILES = globSync("registry/{super-ai,marketing}/**/*.tsx", {
  exclude: (f) => f.includes(".test."),
});

// One entry per token-contract rule (design spec §6). Known limitation: issue refs
// like "#1234" in comments can false-positive as hex — use GH-1234 in registry sources.
const PATTERNS = [
  { re: /#[0-9a-fA-F]{3,8}\b/g, why: "raw hex color" },
  { re: /\boklch\s*\(/gi, why: "raw oklch()" },
  {
    re: /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    why: "tailwind palette class",
  },
];

// This exact pairing (text-muted-foreground on bg-muted/bg-accent/bg-secondary,
// 4.34:1 against a 4.5:1 minimum — see docs/design-system/a11y-baseline.md) has
// now failed the browser a11y gate (`pnpm test:stories`) across five separate
// rounds, in a new file each time. Documentation alone hasn't prevented it, so
// this catches the single-element case statically, before anyone runs a
// browser: a bare (unprefixed by a variant like `hover:`/`dark:`) occurrence of
// `text-muted-foreground` and a bare `bg-muted`/`bg-accent`/`bg-secondary`
// (opacity variants like `bg-muted/50` included) inside the *same* quoted
// class-list literal.
//
// KNOWN LIMITATION — cannot catch, and does not attempt to catch, the
// *cross-component* case: muted text inside a child whose ancestor (a
// different element, or a different component entirely — e.g. entity-row's
// selected row vs. its own description span) sets the muted background. Every
// instance of this pairing that has actually shipped broken was exactly that
// shape, not the single-string shape this rule can see. The browser a11y gate
// (`pnpm test:stories`, axe against real computed styles) remains the real
// backstop for that case — this rule only removes the easiest, single-element
// way to reintroduce the failure.
//
// Tuned to ignore `contractExempt` legacy files (cost-chip.tsx, entity-row.tsx,
// preview-tile.tsx) — their pre-existing violations are a known, documented,
// separate-decision exemption (see a11y-baseline.md), the same exemption the
// browser gate already carries by file name. Without this, adding the rule
// would fail the build on three files nobody asked this task to fix.
//
// Tuned to ignore variant-prefixed backgrounds (`hover:bg-accent`,
// `dark:bg-muted`, etc.): `filter-bar.tsx` and `modality-rail.tsx` both pair
// bare `text-muted-foreground` with `hover:bg-accent` in one string, but the
// same hover rule also swaps the text to `hover:text-accent-foreground` — the
// muted text and the muted background are never on screen at the same time.
// Treating any `bg-` occurrence as disqualifying would flag both files for a
// pairing that never actually renders.
const MUTED_FG = "text-muted-foreground";
const MUTED_BG_RE = /^bg-(?:muted|accent|secondary)(?:\/\d{1,3})?$/;
const CONTRAST_EXEMPT_FILES = ["cost-chip.tsx", "entity-row.tsx", "preview-tile.tsx"];

function findMutedOnMutedViolations(file, source) {
  if (CONTRAST_EXEMPT_FILES.some((name) => file.endsWith(`/${name}`))) return [];

  const found = [];
  source.split("\n").forEach((line, i) => {
    // Each quoted segment is checked on its own, not merged with the rest of
    // the line — a ternary's two branches (e.g. sidebar-nav.tsx's active vs.
    // inactive row class strings) are mutually exclusive at runtime and must
    // not be treated as one combined class list.
    const segments = line.matchAll(/"([^"]*)"|'([^']*)'/g);
    for (const match of segments) {
      const segment = match[1] ?? match[2] ?? "";
      const tokens = segment.split(/\s+/);
      const hasMutedText = tokens.includes(MUTED_FG);
      const mutedBgToken = tokens.find((t) => MUTED_BG_RE.test(t));
      if (hasMutedText && mutedBgToken) {
        found.push(
          `${file}:${i + 1} — text-muted-foreground paired with ${mutedBgToken} in one class list (4.34:1 against a 4.5:1 minimum): ${line.trim()}`,
        );
      }
    }
  });
  return found;
}

if (FILES.length === 0) {
  console.warn(
    "check:tokens — WARNING: no .tsx files found under registry/{super-ai,marketing}/. Gate has no coverage yet.",
  );
}

let violations = 0;
for (const file of FILES) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch (e) {
    violations++;
    console.error(`${file}: could not read (${e.code ?? e.message})`);
    continue;
  }
  source.split("\n").forEach((line, i) => {
    for (const { re, why } of PATTERNS) {
      if (re.test(line)) {
        violations++;
        console.error(`${file}:${i + 1} — ${why}: ${line.trim()}`);
      }
      re.lastIndex = 0;
    }
  });
  for (const message of findMutedOnMutedViolations(file, source)) {
    violations++;
    console.error(message);
  }
}

if (violations) {
  console.error(`\ncheck:tokens — ${violations} violation(s). Use shadcn CSS variables.`);
  process.exit(1);
}
console.log(`check:tokens — ${FILES.length} file(s) clean.`);
