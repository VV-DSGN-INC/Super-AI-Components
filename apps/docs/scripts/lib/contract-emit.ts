import type { ComponentDocs, DocsNone, DocsRedirect, DocsVariant } from "@/lib/component-docs";
import type { ManifestItem } from "@/lib/manifest-types";

import { axisKey, isNone } from "./contract-schema";
import { csv, cut } from "./emit-text";
import type { PatternMeta } from "./pattern-emit";
import { renderPatternPage, renderPatternsIndex, renderPatternToon } from "./pattern-emit";

export const DOCS_URL = "https://super-ai-components.vercel.app";

/** The shipped contract: the guidance module's judgments plus the manifest
 *  facts an agent in a consumer tree has no other way to read. Derived only;
 *  spec 2026-09-14 §4.1. */
export interface ContractMeta {
  generated: string;
  name: string;
  title: string;
  layer: ManifestItem["layer"];
  family: ManifestItem["family"];
  description: string;
  purpose: string;
  whyItMatters: string;
  usage: string;
  evidence: string[];
  anatomy: { slot: string; note: string }[];
  variants?: DocsVariant[] | DocsNone;
  insteadUse?: DocsRedirect[] | DocsNone;
  dos: string[];
  donts: string[];
  accessibility: { keyboard: string[]; screenReader: string[]; focus?: string[] };
  pitfalls: string[];
  states: string[];
  regions: string[];
  consumes: string[];
  shadcn: string[];
  npm: string[];
  source: string;
  docs: string;
}

/** JSON.stringify writes keys in insertion order, so the two contract fields
 *  are spread in where the spec's sample puts them: after anatomy. An
 *  unwritten field is omitted, never invented as empty. */
export function deriveMeta(item: ManifestItem, docs: ComponentDocs): ContractMeta {
  return {
    generated: `by \`pnpm contract:emit\` from content/components/${item.name}.docs.tsx. Do not edit.`,
    name: item.name,
    title: item.title,
    layer: item.layer,
    family: item.family,
    description: item.description,
    purpose: docs.whatItIs,
    whyItMatters: docs.whyItMatters,
    usage: docs.usage,
    evidence: docs.evidence,
    anatomy: docs.anatomy.map(({ slot, note }) => ({ slot, note })),
    ...(docs.variants !== undefined ? { variants: docs.variants } : {}),
    ...(docs.insteadUse !== undefined ? { insteadUse: docs.insteadUse } : {}),
    dos: docs.dos.map((d) => d.text),
    donts: docs.donts.map((d) => d.text),
    accessibility: {
      keyboard: docs.accessibility.keyboard,
      screenReader: docs.accessibility.screenReader,
      ...(docs.accessibility.focus ? { focus: docs.accessibility.focus } : {}),
    },
    pitfalls: docs.pitfalls,
    states: item.states,
    regions: item.regions ?? [],
    consumes: item.consumes,
    shadcn: item.shadcn,
    npm: item.npm,
    source: `content/components/${item.name}.docs.tsx`,
    docs: `${DOCS_URL}/components/${item.name}`,
  };
}

function variantsCell(v: ContractMeta["variants"]): string {
  if (v === undefined) return "unwritten";
  if (isNone(v)) return "none";
  return v.map((axis) => `${axisKey(axis)}=${axis.values.map((x) => x.value).join("/")}`).join("|");
}

function redirectsCell(r: ContractMeta["insteadUse"]): string {
  if (r === undefined) return "unwritten";
  if (isNone(r)) return "none";
  return r.map((x) => x.component).join("|");
}

/** The builder agent's routing table. One line per item, manifest order. */
export function renderToon(metas: ContractMeta[]): string {
  const rows = metas.map((m) =>
    [
      m.name,
      m.layer,
      m.family,
      `registry/super-ai/${m.name}.meta.json`,
      variantsCell(m.variants),
      redirectsCell(m.insteadUse),
      csv(cut(m.purpose, 100)),
    ].join(","),
  );
  return (
    [
      `components[${metas.length}]{name,layer,family,meta,variants,insteadUse,purpose}:`,
      ...rows.map((r) => `  ${r}`),
    ].join("\n") + "\n"
  );
}

const INSTALL = (name: string) => `npx shadcn@latest add ${DOCS_URL}/r/${name}.json`;

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}\n`;
}

function list(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "None recorded.";
}

/** One published page per component, every meta field in prose order. */
export function renderComponentPage(m: ContractMeta): string {
  const variants =
    m.variants === undefined
      ? "Not yet recorded."
      : isNone(m.variants)
        ? `None: ${m.variants.none}`
        : m.variants
            .map(
              (axis) =>
                `### ${axis.prop}${axis.default !== undefined ? ` (default: \`${axis.default}\`)` : ""}\n\n` +
                axis.values.map((v) => `- \`${v.value}\`: ${v.intent}`).join("\n"),
            )
            .join("\n\n");
  const redirects =
    m.insteadUse === undefined
      ? "Not yet recorded."
      : isNone(m.insteadUse)
        ? `None: ${m.insteadUse.none}`
        : m.insteadUse.map((r) => `- **${r.component}**: ${r.when}`).join("\n");
  const a11y = [
    `**Keyboard**\n\n${list(m.accessibility.keyboard)}`,
    `**Screen reader**\n\n${list(m.accessibility.screenReader)}`,
    ...(m.accessibility.focus ? [`**Focus**\n\n${list(m.accessibility.focus)}`] : []),
  ].join("\n\n");
  const composition = [
    `- States: ${m.states.length ? m.states.map((s) => `\`${s}\``).join(", ") : "none (a block is a layout, not a state machine)"}`,
    ...(m.regions.length ? [`- Regions: ${m.regions.map((s) => `\`${s}\``).join(", ")}`] : []),
    `- Composes from this registry: ${m.consumes.length ? m.consumes.join(", ") : "nothing"}`,
    `- shadcn primitives: ${m.shadcn.length ? m.shadcn.join(", ") : "none"}`,
    `- npm: ${m.npm.length ? m.npm.join(", ") : "none"}`,
  ].join("\n");

  return [
    `# ${m.title}\n\n> ${m.purpose}\n`,
    `Layer: ${m.layer} · Family: ${m.family} · Install: \`${INSTALL(m.name)}\` · Contract: \`components/super-ai/${m.name}.meta.json\` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: ${m.docs}\n`,
    section("Why it matters", m.whyItMatters),
    section("When to reach for it", m.usage),
    section("Variants", variants),
    section("Instead use", redirects),
    section("Do", list(m.dos)),
    section("Don't", list(m.donts)),
    section("Anatomy", list(m.anatomy.map((a) => `\`${a.slot}\`: ${a.note}`))),
    section("Accessibility", a11y),
    section("Pitfalls", list(m.pitfalls)),
    section("Composition", composition),
    section("Evidence", m.evidence.length ? m.evidence.join(", ") : "None recorded."),
  ].join("\n");
}

const HEADER = `# Super AI Components

> A shadcn-style registry of AI-interface components: primitives, components and blocks installed one item at a time with \`npx shadcn add\`, on stock shadcn tokens plus \`--warning\`. Code is the source of truth; every page here derives from the component's guidance module.

Install one item: \`npx shadcn@latest add ${DOCS_URL}/r/<name>.json\`. Each item installs its component and a \`<name>.meta.json\` beside it.
Retrieval order: with an item installed, read \`components/super-ai/<name>.meta.json\` first; it is version-locked to the installed code and its contents outrank these pages. Before installing, read the component's page below, then the full corpus if you are choosing between several.
`;

export function renderLlmsTxt(metas: ContractMeta[], patterns: PatternMeta[] = []): string {
  const lines = metas.map(
    (m) => `- [${m.title}](${DOCS_URL}/llms/components/${m.name}.md): ${cut(m.purpose, 100)}`,
  );
  // Omitted entirely when there are no patterns, so the file's bytes are
  // unchanged until the first module lands.
  const patternsBlock = patterns.length ? `\n${renderPatternsIndex(patterns)}` : "";
  return `${HEADER}\n## Guides\n\n- [Full corpus](${DOCS_URL}/llms-full.txt): every component page in one file\n\n## Components\n\n${lines.join("\n")}\n${patternsBlock}`;
}

export function renderLlmsFull(metas: ContractMeta[], patterns: PatternMeta[] = []): string {
  const pages = [...metas.map(renderComponentPage), ...patterns.map(renderPatternPage)];
  return `${HEADER}\n---\n\n${pages.join("\n---\n\n")}`;
}

/** Every derived file, keyed by path relative to apps/docs. Manifest order in,
 *  manifest order out, so parallel regeneration touches disjoint lines. */
export function derivedFiles(metas: ContractMeta[], patterns: PatternMeta[] = []): Map<string, string> {
  const files = new Map<string, string>();
  for (const m of metas) {
    files.set(`registry/super-ai/${m.name}.meta.json`, `${JSON.stringify(m, null, 2)}\n`);
    files.set(`public/llms/components/${m.name}.md`, renderComponentPage(m));
  }
  for (const p of patterns) files.set(`public/llms/patterns/${p.slug}.md`, renderPatternPage(p));
  files.set("index/components.toon", renderToon(metas));
  files.set("index/patterns.toon", renderPatternToon(patterns));
  files.set("public/llms.txt", renderLlmsTxt(metas, patterns));
  files.set("public/llms-full.txt", renderLlmsFull(metas, patterns));
  return files;
}
