// Story coverage as derived obligations plus a shrink-only baseline — the
// ds-architecture ladder's stage 06, applied to story-conventions.md.
//
// Two kinds of obligation, both derived from the manifest rather than listed
// by hand (a hand list is the drift arrangement the ratchet exists to end):
//
//   case       every shipped item, each of the eight case-story names. Met by
//              an export of that name, or by a `case-skip:` line in the
//              convention's grammar with a non-empty reason. Silence — the one
//              thing the convention says cannot be told from oversight — is
//              what fails.
//   described  every declared state's story export carries a JSDoc block
//              directly above it (blank lines allowed). "A story with no
//              description is a screenshot." Counted the way CONTINUE.md §8
//              prescribes: from the manifest's states, never from export names.
//
// Pure: the reader is injected, so the ratchet test and the regenerate script
// share this exact code path and cannot disagree about what "unmet" means.
import { statePascal } from "./scaffold-templates";

export const CASE_STORY_NAMES = [
  "RTL",
  "ReducedMotion",
  "KeyboardOrder",
  "Controlled",
  "EmptyLabel",
  "LongContent",
  "Mobile",
  "Boundary",
] as const;
export type CaseStoryName = (typeof CASE_STORY_NAMES)[number];

export type ObligationKind = "case" | "described";

export interface Obligation {
  /** `<item>:<kind>:<target>` — the baseline's unit. */
  key: string;
  item: string;
  kind: ObligationKind;
  /** The story export name the obligation is about. */
  target: string;
  why: string;
}

/** The slice of a manifest item this module reads. Structural so tests can
 *  hand it literals; blocks arrive with `states: []`. */
export interface CoverageItem {
  name: string;
  states: string[];
}

export function deriveObligations(items: CoverageItem[]): Obligation[] {
  const out: Obligation[] = [];
  for (const item of items) {
    for (const name of CASE_STORY_NAMES) {
      out.push({
        key: `${item.name}:case:${name}`,
        item: item.name,
        kind: "case",
        target: name,
        why: `${name} is written when it is true for the component, or recorded as \`// case-skip: ${name} — <reason>\` (story-conventions.md, "The eight")`,
      });
    }
    for (const state of item.states) {
      const target = statePascal(state);
      out.push({
        key: `${item.name}:described:${target}`,
        item: item.name,
        kind: "described",
        target,
        why: `the "${state}" story needs a JSDoc description above its export — a story with no description is a screenshot (story-conventions.md, Rules)`,
      });
    }
  }
  return out;
}

export interface StoryFacts {
  /** Names exported as `export const <Name>: Story = {` or `export const <Name> = {`. */
  exports: Set<string>;
  /** Case names recorded as skipped, with the reason given. */
  skips: Map<string, string>;
  /** Exports whose preceding non-blank line closes a JSDoc block. */
  described: Set<string>;
}

// Line-anchored on purpose: a commented-out export (`// export const …`) is
// not an export. check-contract.mts's unanchored form is fine for its
// purpose; here the line index is needed anyway for the description check.
const EXPORT_RE = /^export const ([A-Za-z0-9_]+)\s*[:=]/;
// The convention's grammar, em dash included, with an optional leading `*`
// because every skip line shipped today sits inside a JSDoc block. A skip
// with no reason after the dash is deliberately not a skip.
const SKIP_RE = /\/\/\s*case-skip:\s*([A-Za-z0-9_]+)\s*—\s*(.*)$/;

export function readStoryFacts(source: string): StoryFacts {
  const lines = source.split("\n");
  const exports = new Set<string>();
  const skips = new Map<string, string>();
  const described = new Set<string>();
  lines.forEach((line, i) => {
    const exp = EXPORT_RE.exec(line);
    if (exp) {
      exports.add(exp[1]);
      let j = i - 1;
      while (j >= 0 && lines[j].trim() === "") j--;
      if (j >= 0 && lines[j].trim().endsWith("*/")) described.add(exp[1]);
    }
    const skip = SKIP_RE.exec(line);
    if (skip) {
      const reason = skip[2].trim();
      if (reason) skips.set(skip[1], reason);
    }
  });
  return { exports, skips, described };
}

/** `facts === null` means the story file does not exist: everything is unmet. */
export function unmetObligations(obligations: Obligation[], facts: StoryFacts | null): Obligation[] {
  if (facts === null) return obligations.slice();
  return obligations.filter((o) =>
    o.kind === "case"
      ? !(facts.exports.has(o.target) || facts.skips.has(o.target))
      : !facts.described.has(o.target),
  );
}

/** Walks every item once. `readSource` returns the story file's text, or
 *  null when the file is missing. */
export function collectUnmet(
  obligations: Obligation[],
  readSource: (item: string) => string | null,
): Obligation[] {
  const byItem = new Map<string, Obligation[]>();
  for (const o of obligations) byItem.set(o.item, [...(byItem.get(o.item) ?? []), o]);
  const out: Obligation[] = [];
  for (const [item, group] of byItem) {
    const source = readSource(item);
    out.push(...unmetObligations(group, source === null ? null : readStoryFacts(source)));
  }
  return out;
}

/** What the regenerate script may write. `grown` lists every live key the
 *  committed baseline lacks — the caller refuses to write when it is
 *  non-empty, because the regenerate command may only shrink the baseline. */
export function nextBaseline(prev: string[] | null, live: string[]): { grown: string[]; baseline: string[] } {
  const baseline = [...new Set(live)].sort();
  const grown = prev === null ? [] : baseline.filter((k) => !prev.includes(k));
  return { grown, baseline };
}
