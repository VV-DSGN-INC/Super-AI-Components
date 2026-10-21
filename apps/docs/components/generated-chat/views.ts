/**
 * The demo's views and chip phrases, in a module with no client code, so the
 * chat route can build the same views the scripted turns build. Only types
 * come from the lib, which is a client module.
 */
import type { ViewInput, ViewVersion } from "@/registry/super-ai/generated-chat";

export const READY_PROMPTS = [
  "What failed overnight?",
  "What's my day?",
  "How much have we spent this week?",
];

/** What the fallback reply says before offering the ready prompts. */
export const FALLBACK_TEXT =
  "I answer from this workspace's runs, credits and queue. These are ready to try:";

export const VIEW = { id: "failed-runs", title: "Failed runs this week", kind: "runs" } as const;

/** A view whose body is a generated OpenUI program (see programs.ts). */
export const SPEND_VIEW = { id: "spend", title: "Spend by project this week", kind: "generated" } as const;

export const spendVersion = (n: number, variant: string): ViewVersion => ({
  label: `v${n} · generated`,
  mode: "generated",
  variant,
});

/** The failed-runs view as a turn builds it. `origin` is the chat that asked. */
export const buildFailedRunsView = (origin: string): ViewInput => ({
  ...VIEW,
  scope: "All projects",
  origin,
  version: { label: "v1 · table", mode: "table" },
});

/** The generated spend view as a turn builds it. */
export const buildSpendView = (origin: string): ViewInput => ({
  ...SPEND_VIEW,
  scope: "All projects",
  origin,
  version: spendVersion(1, "spend-v1"),
});

/**
 * Every chip any reply offers. Each one has a scripted turn, so a chip the
 * model suggests resolves the same way a scripted chip does.
 */
export const CHIPS = [
  ...READY_PROMPTS,
  "Track failed runs",
  "Why was the poster blocked?",
  "Make it a board",
  "Show spend by project",
  "Add a daily trend",
  "Show the daily trend as a table",
] as const;
