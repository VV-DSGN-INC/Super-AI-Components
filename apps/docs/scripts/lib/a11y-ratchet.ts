// The shrink-only ratchet on apps/storybook/vitest.config.ts's a11y
// `exclude: [...]` list. G3 (contract-rules.ts's compareExemptionLists) only
// asserts the exclusion list agrees with CONTRAST_EXEMPT_FILES for super-ai
// entries — nothing fails today when someone adds a new exclusion outright.
// This complements G3: it parses every quoted entry (vendored globs and
// legacy filenames alike, not just super-ai names) and the ratchet test
// checks that set never grows past the committed baseline.
import { stripComments } from "./contract-rules";

// contract-rules.ts's stripComments is reused rather than reimplemented here
// (or the simpler regex `source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")`
// written inline) because that simpler form is provably wrong on this exact
// file: apps/storybook/vitest.config.ts's exclude list has two adjacent
// globs ending "/**" — "**/stories/ui/**" then "**/stories/ai-elements/**".
// The first glob's trailing "/**" contains the two-char sequence "/*", which
// the naive block-comment regex reads as an opening comment marker; scanning
// forward non-greedily, the very next "*/" it finds is inside the SECOND
// glob's own leading "**/" prefix. The "comment" it strips spans from inside
// entry one to inside entry two, merging both into one corrupted string —
// verified by running the naive version against the live file, which
// collapses all five real entries down to a single garbled one. This is the
// identical failure contract-rules.ts's own stripComments docstring already
// diagnoses for this file ("corrupting both"); its quote-tracking scanner
// treats "**/*" ... "*/" inside a live "..." string as ordinary characters,
// not comment syntax, so it parses the real file correctly (confirmed
// against contract-rules.test.ts's "extracts only this repo's own super-ai
// story exclusions" fixture, which seeds this exact adjacent-glob shape).
// Importing avoids both the bug and a second hand-maintained copy of a
// quote-aware scanner drifting from the original.

/** Every quoted entry of the storybook a11y `exclude: [...]` array — globs
 *  and filenames alike. Complements G3 (which parses only super-ai names):
 *  G3 catches the two lists disagreeing; this catches the list growing. */
export function parseRawExclusions(source: string): string[] | null {
  const live = stripComments(source);
  const block = /exclude:\s*\[([\s\S]*?)\]/.exec(live);
  if (!block) return null;
  return [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}
