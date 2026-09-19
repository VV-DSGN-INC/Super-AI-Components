/**
 * Types and pure helpers for the Harness and Architecture pages.
 *
 * No Node imports here. Storybook bundles this file for the browser through
 * the `@/lib/system-page` alias in apps/storybook/vite.config.ts.
 */

/** Every number the two pages may state. The list is closed: `deriveFacts`
 *  fills exactly these keys, and `pages.test.ts` fails on a key no page uses. */
export const FACT_KEYS = [
  "ciSteps",
  "contracts",
  "ledgers",
  "prosePages",
  "ruleBlockers",
  "rules",
  "rulesJudgment",
  "rulesRendered",
  "rulesStatic",
  "shipped",
  "shippedBlocks",
  "shippedComponents",
  "shippedPrimitives",
  "skills",
  "storyFiles",
] as const;

export type FactKey = (typeof FACT_KEYS)[number];
export type SystemFacts = Record<FactKey, number>;

export type FigureId = "harness-parts" | "consumer-surfaces" | "loops" | "ci-pipeline";

export type PageBlock =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "figure"; figure: FigureId; caption: string }
  | { kind: "gates" }
  | { kind: "derived" }
  | { kind: "links"; items: { label: string; href: string; storybook?: string }[] };

export interface PageSection {
  id: string;
  heading: string;
  blocks: PageBlock[];
}

export interface SystemPage {
  slug: "harness" | "architecture";
  title: string;
  description: string;
  /** True until Nick has done his pass. The renderer prints a draft note. */
  draft?: true;
  lede: string[];
  sections: PageSection[];
}

const PLACEHOLDER = /\{facts\.([A-Za-z]+)\}/g;

/** The fact keys a string uses, in order, repeats included. */
export function factKeysIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]);
}

/** Replaces every `{facts.key}` in `text`. Throws on a key that is not a fact. */
export function resolveFacts(text: string, facts: SystemFacts): string {
  return text.replace(PLACEHOLDER, (_whole, key: string) => {
    if (!(FACT_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unknown fact placeholder {facts.${key}}`);
    }
    return String(facts[key as FactKey]);
  });
}

/** Every prose string on a page, for the tests that police prose. */
export function pageStrings(page: SystemPage): string[] {
  const out = [page.title, page.description, ...page.lede];
  for (const section of page.sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      switch (block.kind) {
        case "p":
        case "quote":
          out.push(block.text);
          break;
        case "list":
          out.push(...block.items);
          break;
        case "table":
          out.push(...block.columns, ...block.rows.flat());
          break;
        case "figure":
          out.push(block.caption);
          break;
        case "links":
          out.push(...block.items.map((item) => item.label));
          break;
        case "gates":
        case "derived":
          break;
      }
    }
  }
  return out;
}
