import { describe, expect, it } from "vitest";

import type { PatternDocs } from "./pattern-docs";
import { STAGES } from "./pattern-docs";
import { byStage, installCommands, relatedPatterns, stageCounts } from "./patterns";

const shipped = (title: string, stage: PatternDocs["stage"], components: string[]): PatternDocs => ({
  title,
  stage,
  definition: "What the interface does for the user, in two sentences.",
  whyItMatters: "Because the reader arrives with this job and not with a component name.",
  components,
  anatomy: [{ slot: "composer", note: "Where the prompt is typed." }],
  pitfalls: [],
  status: "shipped",
});

const ENTRIES = [
  {
    slug: "attach-context",
    docs: shipped("Attach context to a prompt", "ask", [
      "media-prompt-bar",
      "context-chips",
      "reference-strip",
    ]),
  },
  {
    slug: "quote-a-selection",
    docs: shipped("Quote a selection", "ask", ["quote-reply", "selection-toolbar"]),
  },
  {
    slug: "reuse-a-result",
    docs: shipped("Reuse a result as the next reference", "keep", [
      "asset-detail",
      "reference-strip",
      "preview-tile",
    ]),
  },
  { slug: "find-it-again", docs: shipped("Find it again", "keep", ["asset-library", "filter-bar"]) },
  { slug: "ask-first", docs: shipped("Ask before a side effect", "trust", ["permission-prompt"]) },
  {
    slug: "search-steps",
    docs: {
      ...shipped("Show the search while it thinks", "watch", []),
      status: "unfilled" as const,
      evidence: ["Perplexity"],
      unfilledBecause: "No shipped component renders retrieval steps that collapse once the answer lands.",
    },
  },
];

describe("STAGES", () => {
  it("is the seven-stage spine in journey order", () => {
    expect(STAGES.map((s) => s.id)).toEqual(["start", "ask", "tune", "watch", "review", "keep", "trust"]);
  });
});

describe("stageCounts and byStage", () => {
  it("counts every stage, including empty ones, in spine order", () => {
    expect(stageCounts(ENTRIES)).toEqual({
      start: 0,
      ask: 2,
      tune: 0,
      watch: 1,
      review: 0,
      keep: 2,
      trust: 1,
    });
    expect([...byStage(ENTRIES).keys()]).toEqual(STAGES.map((s) => s.id));
  });

  it("sorts a stage's entries shipped first, then by title", () => {
    const unfilledFirst = [
      ENTRIES[5],
      {
        ...ENTRIES[5],
        slug: "z",
        docs: { ...ENTRIES[5].docs, status: "shipped" as const, components: ["kbd"], title: "Zed" },
      },
    ];
    expect(
      byStage(unfilledFirst)
        .get("watch")!
        .map((e) => e.slug),
    ).toEqual(["z", "search-steps"]);
  });
});

describe("relatedPatterns", () => {
  it("ranks by shared components, then same stage, then title, and excludes itself", () => {
    const related = relatedPatterns(ENTRIES, "attach-context").map((e) => e.slug);
    // reuse-a-result shares reference-strip (score 1); quote-a-selection shares nothing but the stage.
    expect(related).toEqual(["reuse-a-result", "quote-a-selection"]);
  });

  it("gives an unfilled pattern its stage-mates, shipped first, capped", () => {
    const entries = [
      ...ENTRIES,
      { slug: "trace", docs: shipped("Trace what the agent did", "watch", ["trace-timeline"]) },
    ];
    expect(relatedPatterns(entries, "search-steps").map((e) => e.slug)).toEqual(["trace"]);
    expect(relatedPatterns(entries, "search-steps", 0)).toEqual([]);
  });
});

describe("installCommands", () => {
  it("is one shadcn add per component, in composition order", () => {
    expect(installCommands(["kbd", "cost-chip"])).toEqual([
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/kbd.json",
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/cost-chip.json",
    ]);
  });
});
