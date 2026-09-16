import { describe, expect, it } from "vitest";

import type { PatternEntry } from "@/lib/patterns";

import type { ContractMeta } from "./contract-emit";
import { derivedFiles, renderLlmsFull, renderLlmsTxt } from "./contract-emit";
import { derivePatternMeta, renderPatternPage, renderPatternToon } from "./pattern-emit";

const meta = (name: string, evidence: string[]): Pick<ContractMeta, "name" | "evidence"> => ({
  name,
  evidence,
});
const metas = new Map([
  ["media-prompt-bar", meta("media-prompt-bar", ["Midjourney", "Freepik"])],
  ["context-chips", meta("context-chips", ["Claude", "Freepik"])],
]);
const entries: PatternEntry[] = [
  {
    slug: "attach-context",
    docs: {
      title: "Attach context to a prompt",
      stage: "ask",
      definition: "The prompt carries references as chips, not as words.",
      whyItMatters: "A chip can be removed; a sentence naming a file cannot.",
      components: ["media-prompt-bar", "context-chips"],
      anatomy: [{ slot: "composer", note: "The prompt bar." }],
      pitfalls: ["A chip with no remove control."],
      status: "shipped",
    },
  },
  {
    slug: "search-steps",
    docs: {
      title: "Show the search while it thinks",
      stage: "watch",
      definition: "Retrieval steps render while the answer is pending, then collapse.",
      whyItMatters: "A multi-second wait with nothing to read is a wait the user abandons.",
      components: [],
      anatomy: [{ slot: "steps", note: "One row per retrieval step." }],
      pitfalls: [],
      evidence: ["Perplexity", "Manus"],
      status: "unfilled",
      unfilledBecause: "No shipped component renders retrieval steps that collapse once the answer lands.",
    },
  },
];

describe("derivePatternMeta", () => {
  const p = derivePatternMeta(entries[0], entries, metas);

  it("inherits evidence from the components, deduplicated, in component order", () => {
    expect(p.evidence).toEqual(["Midjourney", "Freepik", "Claude"]);
  });

  it("carries one install command per component, the derived related slugs, and its source", () => {
    expect(p.install).toEqual([
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/media-prompt-bar.json",
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/context-chips.json",
    ]);
    expect(p.related).toEqual([]);
    expect(p.source).toBe("content/patterns/attach-context.pattern.tsx");
    expect(p.docs).toBe("https://super-ai-components.vercel.app/patterns/attach-context");
    expect(p.generated).toContain("pnpm contract:emit");
  });

  it("keeps an unfilled pattern's own evidence and reason", () => {
    const u = derivePatternMeta(entries[1], entries, metas);
    expect(u.evidence).toEqual(["Perplexity", "Manus"]);
    expect(u.install).toEqual([]);
    expect(u.unfilledBecause).toContain("No shipped component");
  });
});

describe("renderPatternToon", () => {
  it("writes one line per pattern with its components joined by |", () => {
    const toon = renderPatternToon(entries.map((e) => derivePatternMeta(e, entries, metas)));
    expect(toon.split("\n")[0]).toBe("patterns[2]{slug,stage,status,components,purpose}:");
    expect(toon).toContain("  attach-context,ask,shipped,media-prompt-bar|context-chips,");
    expect(toon).toContain("  search-steps,watch,unfilled,,");
  });
});

describe("renderPatternPage", () => {
  it("leads with the title and definition, lists components with install commands, and says when unfilled", () => {
    const page = renderPatternPage(derivePatternMeta(entries[0], entries, metas));
    expect(page.startsWith("# Attach context to a prompt\n\n> The prompt carries")).toBe(true);
    expect(page).toContain("- **media-prompt-bar**: `npx shadcn@latest add");
    const unfilled = renderPatternPage(derivePatternMeta(entries[1], entries, metas));
    expect(unfilled).toContain("## Status\n\nUnfilled: No shipped component");
  });
});

describe("the shared files carry patterns", () => {
  const ps = entries.map((e) => derivePatternMeta(e, entries, metas));

  it("adds a Patterns section to llms.txt and the pages to llms-full.txt", () => {
    expect(renderLlmsTxt([], ps)).toContain(
      "## Patterns\n\n- [Attach context to a prompt](https://super-ai-components.vercel.app/llms/patterns/attach-context.md): The prompt carries",
    );
    expect(renderLlmsTxt([], ps)).toContain("(unfilled)");
    expect(renderLlmsFull([], ps)).toContain("# Show the search while it thinks");
  });

  it("names the toon and one page per pattern beside the component files", () => {
    const files = derivedFiles([], ps);
    expect([...files.keys()].sort()).toEqual([
      "index/components.toon",
      "index/patterns.toon",
      "public/llms-full.txt",
      "public/llms.txt",
      "public/llms/patterns/attach-context.md",
      "public/llms/patterns/search-steps.md",
    ]);
  });
});
