// Pure token-contract predicates. Deliberately free of `node:fs` — check-tokens
// runs under plain `node` as .mjs (globSync is absent from @types/node@20, so
// the entry point cannot become .mts), and keeping this module fs-free is what
// lets it be unit-tested from a .ts test file.

export const MUTED_FG = "text-muted-foreground";
export const MUTED_BG_RE = /^bg-(?:muted|accent|secondary)(?:\/\d{1,3})?$/;

// May only shrink, never grow. See docs/design-system/a11y-baseline.md.
// preview-tile.tsx's violations are a different defect (text-destructive on the
// default surface, and label text over unpredictable image content), not the
// muted-on-muted pairing this module looks for.
export const CONTRAST_EXEMPT_FILES = ["preview-tile.tsx"];

// Exactly the original predicate — do not widen it. This is a
// behaviour-preserving refactor, and `isExempt` guards an exemption list that
// may only shrink; a looser matcher is a loosening even when inert today.
export function isExempt(file) {
  return CONTRAST_EXEMPT_FILES.some((name) => file.endsWith(`/${name}`));
}

// `.filter(Boolean)` is intentional and is the one deliberate departure from
// the original `segment.split(/\s+/)`. It is inert for the single-string rule
// (an empty token matches neither MUTED_FG nor MUTED_BG_RE), and Task 3 needs
// it: cva base strings are multi-line and carry leading indentation, which
// yields empty tokens the original never had to handle.
function classTokens(segment) {
  return segment.split(/\s+/).filter(Boolean);
}

/**
 * The single-element shape: muted text and a muted background inside one
 * quoted class-list literal.
 *
 * Each quoted segment is checked on its own, not merged with the rest of the
 * line — a ternary's two branches are mutually exclusive at runtime and must
 * not be treated as one combined class list.
 *
 * Variant-prefixed backgrounds (`hover:bg-accent`, `dark:bg-muted`) do not
 * match MUTED_BG_RE, which is anchored: the hover rule that introduces the
 * background normally swaps the text token too, so the pairing never renders.
 */
export function findSingleStringViolations(file, source) {
  if (isExempt(file)) return [];

  const found = [];
  source.split("\n").forEach((line, i) => {
    for (const match of line.matchAll(/"([^"]*)"|'([^']*)'/g)) {
      const tokens = classTokens(match[1] ?? match[2] ?? "");
      const mutedBgToken = tokens.find((t) => MUTED_BG_RE.test(t));
      if (tokens.includes(MUTED_FG) && mutedBgToken) {
        found.push(
          `${file}:${i + 1} — text-muted-foreground paired with ${mutedBgToken} in one class list (4.34:1 against a 4.5:1 minimum): ${line.trim()}`,
        );
      }
    }
  });
  return found;
}

/**
 * Find every `cva(` call and return its body by balanced-paren scan. A regex
 * cannot do this: variant bodies routinely contain nested calls.
 */
export function extractCvaCalls(source) {
  const calls = [];
  const re = /\bcva\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      i++;
    }
    if (depth === 0) calls.push({ body: source.slice(start, i - 1), index: m.index });
  }
  return calls;
}

/**
 * Returns the offending background token when muted text and a muted
 * background are split ACROSS the two argument lists — never when they sit
 * together in one (findSingleStringViolations owns that case) and never
 * between two variant values (mutually exclusive at runtime).
 */
function crossPairViolation(baseTokens, variantTokens) {
  const bgInBase = baseTokens.find((t) => MUTED_BG_RE.test(t));
  const bgInVariant = variantTokens.find((t) => MUTED_BG_RE.test(t));
  if (baseTokens.includes(MUTED_FG) && bgInVariant) return bgInVariant;
  if (variantTokens.includes(MUTED_FG) && bgInBase) return bgInBase;
  return null;
}

/**
 * The cva shape: a base class string that always applies, paired with each
 * variant value string that may apply alongside it.
 *
 * This is the gap that let components/ui/tabs.tsx ship the exact pairing this
 * gate exists to catch — text-muted-foreground in tabsListVariants' base,
 * bg-muted in its `default` variant. Recorded as unresolved in CONTINUE.md §4.
 */
export function findCvaViolations(file, source) {
  if (isExempt(file)) return [];

  const found = [];
  const seen = new Set();
  for (const call of extractCvaCalls(source)) {
    const strings = [...call.body.matchAll(/"([^"]*)"|'([^']*)'/g)].map((x) => x[1] ?? x[2] ?? "");
    if (strings.length < 2) continue;

    const base = classTokens(strings[0]);
    const line = source.slice(0, call.index).split("\n").length;

    for (const value of strings.slice(1)) {
      const bg = crossPairViolation(base, classTokens(value));
      const key = `${line}:${bg}`;
      if (bg && !seen.has(key)) {
        seen.add(key);
        found.push(
          `${file}:${line} — cva() pairs text-muted-foreground with ${bg} across its base and a variant value (4.34:1 against a 4.5:1 minimum)`,
        );
      }
    }
  }
  return found;
}
