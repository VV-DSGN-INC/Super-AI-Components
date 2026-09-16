// The pattern half of the corpus (spec 2026-09-15 §8). Same field names as
// the component entries where the meaning is the same, so an agent that reads
// one can read the other.
import type { PatternStage } from "@/lib/pattern-docs";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { DOCS_URL, installCommands, relatedPatterns } from "@/lib/patterns";

import type { ContractMeta } from "./contract-emit";
import { csv, cut } from "./emit-text";

export interface PatternMeta {
  generated: string;
  slug: string;
  title: string;
  stage: PatternStage;
  status: "shipped" | "unfilled";
  definition: string;
  whyItMatters: string;
  components: string[];
  install: string[];
  anatomy: { slot: string; note: string }[];
  pitfalls: string[];
  evidence: string[];
  related: string[];
  unfilledBecause?: string;
  source: string;
  docs: string;
}

export function derivePatternMeta(
  entry: PatternEntry,
  entries: PatternEntry[],
  metasByName: ReadonlyMap<string, Pick<ContractMeta, "name" | "evidence">>,
): PatternMeta {
  const { slug, docs } = entry;
  // A shipped pattern needs no fresh research (D26): its evidence is what its
  // components were measured against, in composition order, deduplicated.
  const inherited = docs.components.flatMap((name) => metasByName.get(name)?.evidence ?? []);
  const evidence = [...new Set([...inherited, ...(docs.evidence ?? [])])];
  return {
    generated: `Derived by pnpm contract:emit from content/patterns/${slug}.pattern.tsx. Do not edit.`,
    slug,
    title: docs.title,
    stage: docs.stage,
    status: docs.status,
    definition: docs.definition,
    whyItMatters: docs.whyItMatters,
    components: docs.components,
    install: installCommands(docs.components),
    anatomy: docs.anatomy,
    pitfalls: docs.pitfalls,
    evidence,
    related: relatedPatterns(entries, slug).map((e) => e.slug),
    ...(docs.unfilledBecause !== undefined ? { unfilledBecause: docs.unfilledBecause } : {}),
    source: `content/patterns/${slug}.pattern.tsx`,
    docs: `${DOCS_URL}/patterns/${slug}`,
  };
}

/** The agent's routing table for behaviours. One line per pattern. */
export function renderPatternToon(patterns: PatternMeta[]): string {
  const rows = patterns.map((p) =>
    [p.slug, p.stage, p.status, p.components.join("|"), csv(cut(p.definition, 100))].join(","),
  );
  return (
    [
      `patterns[${patterns.length}]{slug,stage,status,components,purpose}:`,
      ...rows.map((r) => `  ${r}`),
    ].join("\n") + "\n"
  );
}

const section = (title: string, body: string) => `## ${title}\n\n${body}\n`;
const list = (items: string[]) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "None recorded.");
const stageLabel = (id: PatternStage) => STAGES.find((s) => s.id === id)!.label;

/** One published page per pattern. A pattern is not a registry item, so the
 *  install line is its components' commands in composition order (spec §13). */
export function renderPatternPage(p: PatternMeta): string {
  const components = p.components.length
    ? p.components
        .map((name, i) => `- **${name}**: \`${p.install[i]}\` · ${DOCS_URL}/components/${name}`)
        .join("\n")
    : "None yet: this pattern is unfilled.";
  return [
    `# ${p.title}\n\n> ${p.definition}\n`,
    `Stage: ${stageLabel(p.stage)} · Status: ${p.status} · Docs: ${p.docs}\n`,
    section("Why it matters", p.whyItMatters),
    section("Components, in composition order", components),
    section("Anatomy", list(p.anatomy.map((a) => `\`${a.slot}\`: ${a.note}`))),
    section("Pitfalls", list(p.pitfalls)),
    section("Related patterns", list(p.related.map((s) => `${DOCS_URL}/llms/patterns/${s}.md`))),
    section("Evidence", p.evidence.length ? p.evidence.join(", ") : "None recorded."),
    ...(p.status === "unfilled" ? [section("Status", `Unfilled: ${p.unfilledBecause}`)] : []),
  ].join("\n");
}

/** The Patterns block of llms.txt. */
export function renderPatternsIndex(patterns: PatternMeta[]): string {
  const lines = patterns.map(
    (p) =>
      `- [${p.title}](${DOCS_URL}/llms/patterns/${p.slug}.md): ${cut(p.definition, 100)}${p.status === "unfilled" ? " (unfilled)" : ""}`,
  );
  return `## Patterns\n\n${lines.join("\n")}\n`;
}
