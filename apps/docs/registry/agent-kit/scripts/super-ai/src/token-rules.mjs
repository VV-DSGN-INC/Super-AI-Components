// Pure token-contract predicates. Deliberately free of `node:fs` — check-tokens
// runs under plain `node` as .mjs (globSync is absent from @types/node@20, so
// the entry point cannot become .mts), and keeping this module fs-free is what
// lets it be unit-tested from a .ts test file.

export const MUTED_FG = "text-muted-foreground";
export const MUTED_BG_RE = /^bg-(?:muted|accent|secondary)(?:\/\d{1,3})?$/;

// May only shrink, never grow. See docs/design-system/a11y-baseline.md.
// Empty since the A8 retrofit: preview-tile.tsx's `failed` overlay no longer
// paints text-destructive on the frame's bg-muted (4.34:1) — it inherits
// text-foreground, which is what both real consumers already overrode it to.
// This list and the a11y exclusion list in apps/storybook/vitest.config.ts are
// asserted equal by check:contract's G3 gate; shrink them in the same commit.
export const CONTRAST_EXEMPT_FILES = [];

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
    let quote = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      const next = source[i + 1];
      // Parens inside strings and comments must not move the depth counter.
      // Tailwind arbitrary values are full of them — `[&:not(:first-child)]`,
      // `color-mix(...)`, `max-w-(--x)` — and those happen to self-balance, so
      // a naive scan survives them by luck rather than by design. A single
      // unbalanced paren in a comment (`// TODO (see GH-123`) would either
      // truncate the body early, losing detections, or run the scan to some
      // unrelated `)` later in the file and swallow foreign code into it.
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
      } else if (ch === "/" && next === "/") {
        while (i < source.length && source[i] !== "\n") i++;
        continue;
      } else if (ch === "/" && next === "*") {
        i += 2;
        while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
        i += 2;
        continue;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "(") depth++;
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
    // The base MUST be cva's first argument and MUST be a plain string
    // literal. Taking "the first quoted string anywhere in the body" instead
    // is wrong for a call whose first argument is a template literal, an
    // array, or a variable: the first *variant value* would be promoted to
    // base and then paired against its own siblings — precisely the
    // union-across-mutually-exclusive-values this rule exists to avoid.
    // Skipping such a call under-reports; promoting a variant value
    // false-positives. Under-reporting is the safe direction for a gate
    // whose failures block CI.
    const baseMatch = /^\s*(["'])((?:\\.|[^\\])*?)\1/.exec(call.body);
    if (!baseMatch) continue;

    const base = classTokens(baseMatch[2]);
    const rest = call.body.slice(baseMatch[0].length);
    const line = source.slice(0, call.index).split("\n").length;

    for (const m of rest.matchAll(/"([^"]*)"|'([^']*)'/g)) {
      const bg = crossPairViolation(base, classTokens(m[1] ?? m[2] ?? ""));
      // Keyed on the call's offset, not its line: two cva() calls can share a
      // physical line, and a line-based key would silently drop the second's
      // finding. `format:check` is not in CI, so one-line source is possible.
      const key = `${call.index}:${bg}`;
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
