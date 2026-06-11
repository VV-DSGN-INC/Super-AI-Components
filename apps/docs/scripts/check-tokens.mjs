import { globSync, readFileSync } from "node:fs";

const FILES = globSync("registry/super-ai/**/*.tsx", { exclude: (f) => f.includes(".test.") });

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
    "check:tokens — WARNING: no .tsx files found under registry/super-ai/. Gate has no coverage yet.",
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
}

if (violations) {
  console.error(`\ncheck:tokens — ${violations} violation(s). Use shadcn CSS variables.`);
  process.exit(1);
}
console.log(`check:tokens — ${FILES.length} file(s) clean.`);
