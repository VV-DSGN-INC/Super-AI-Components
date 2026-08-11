import { globSync, readFileSync } from "node:fs";

import { findCvaViolations, findSingleStringViolations } from "./lib/token-rules.mjs";

const FILES = globSync("{registry/{super-ai,marketing},components/ui}/**/*.tsx", {
  exclude: (f) => f.includes(".test."),
});

// Findings in components/ui/** (vendored shadcn primitives) warn instead of
// failing the gate. See docs/design-system/vendored-token-findings.md.
const isVendored = (f) => f.startsWith("components/ui/");

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

if (FILES.length === 0) {
  console.warn(
    "check:tokens — WARNING: no .tsx files found under registry/{super-ai,marketing}/. Gate has no coverage yet.",
  );
}

let violations = 0;
let warnings = 0;
const warnedFiles = new Set();
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
        const message = `${file}:${i + 1} — ${why}: ${line.trim()}`;
        if (isVendored(file)) {
          warnings++;
          warnedFiles.add(file);
          console.warn(`WARN ${message}`);
        } else {
          violations++;
          console.error(message);
        }
      }
      re.lastIndex = 0;
    }
  });
  for (const message of findSingleStringViolations(file, source)) {
    if (isVendored(file)) {
      warnings++;
      warnedFiles.add(file);
      console.warn(`WARN ${message}`);
    } else {
      violations++;
      console.error(message);
    }
  }
  for (const message of findCvaViolations(file, source)) {
    if (isVendored(file)) {
      warnings++;
      warnedFiles.add(file);
      console.warn(`WARN ${message}`);
    } else {
      violations++;
      console.error(message);
    }
  }
}

if (violations) {
  console.error(`\ncheck:tokens — ${violations} violation(s). Use shadcn CSS variables.`);
  process.exit(1);
}
if (warnings) {
  console.warn(
    `\ncheck:tokens — ${warnings} warning(s) across ${warnedFiles.size} vendored file(s) in components/ui/. Triaged in docs/design-system/vendored-token-findings.md; not gated, because fixing them means diverging from upstream and nobody has decided that.`,
  );
}
const clean = FILES.length - warnedFiles.size;
console.log(
  warnedFiles.size
    ? `check:tokens — ${clean} of ${FILES.length} file(s) clean, ${warnedFiles.size} vendored file(s) warned.`
    : `check:tokens — ${FILES.length} file(s) clean.`,
);
