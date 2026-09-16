// Pure derivations over the pattern modules (spec 2026-09-15 D28). The site,
// the corpus emitter and the tests all call these, so "related" cannot mean
// two different things on two surfaces.
import type { PatternDocs, PatternStage } from "./pattern-docs";
import { STAGES } from "./pattern-docs";

export interface PatternEntry {
  slug: string;
  docs: PatternDocs;
}

export const DOCS_URL = "https://super-ai-components.vercel.app";

export function stageCounts(entries: PatternEntry[]): Record<PatternStage, number> {
  const counts = Object.fromEntries(STAGES.map((s) => [s.id, 0])) as Record<PatternStage, number>;
  for (const e of entries) counts[e.docs.stage] += 1;
  return counts;
}

const byTitle = (a: PatternEntry, b: PatternEntry) => a.docs.title.localeCompare(b.docs.title, "en");
const shippedFirst = (a: PatternEntry, b: PatternEntry) =>
  Number(a.docs.status === "unfilled") - Number(b.docs.status === "unfilled") || byTitle(a, b);

/** Every stage in spine order, each with its entries shipped first, then by title. */
export function byStage(entries: PatternEntry[]): Map<PatternStage, PatternEntry[]> {
  const map = new Map<PatternStage, PatternEntry[]>(STAGES.map((s) => [s.id, []]));
  for (const e of entries) map.get(e.docs.stage)!.push(e);
  for (const list of map.values()) list.sort(shippedFirst);
  return map;
}

/** Spec §6.4: shared components, then same stage, then title; a pattern that
 *  shares nothing (every unfilled one) gets its stage-mates. Capped. */
export function relatedPatterns(entries: PatternEntry[], slug: string, cap = 4): PatternEntry[] {
  const self = entries.find((e) => e.slug === slug);
  if (!self) return [];
  const mine = new Set(self.docs.components);
  const scored = entries
    .filter((e) => e.slug !== slug)
    .map((e) => ({
      entry: e,
      shared: e.docs.components.filter((c) => mine.has(c)).length,
      sameStage: e.docs.stage === self.docs.stage,
    }))
    .filter((s) => s.shared > 0 || s.sameStage)
    .sort(
      (a, b) =>
        b.shared - a.shared || Number(b.sameStage) - Number(a.sameStage) || shippedFirst(a.entry, b.entry),
    );
  return scored.slice(0, cap).map((s) => s.entry);
}

/** A pattern does not install (spec §13); its components do, in order. */
export function installCommands(components: string[]): string[] {
  return components.map((name) => `npx shadcn@latest add ${DOCS_URL}/r/${name}.json`);
}
