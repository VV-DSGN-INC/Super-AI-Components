import { questionId, type QuestionData, type Turn, type TurnPart } from "@/registry/super-ai/generated-chat";

import {
  creditsLeft,
  failedOvernight,
  fmt,
  overnightRuns,
  PLAN,
  retryCost,
  timedOutOvernight,
  weekSpend,
} from "./fixtures";

/** What a turn may read from the page when it plays. */
export interface DemoContext {
  viewBuilt: boolean;
  /** The generated spend view exists. */
  spendBuilt: boolean;
}

export const READY_PROMPTS = [
  "What failed overnight?",
  "What's my day?",
  "How much have we spent this week?",
];

export const VIEW = { id: "failed-runs", title: "Failed runs this week", kind: "runs" } as const;

/** A view whose body is a generated OpenUI program (see programs.ts). */
export const SPEND_VIEW = { id: "spend", title: "Spend by project this week", kind: "generated" } as const;

const spendVersion = (n: number, variant: string) => ({
  label: `v${n} · generated`,
  mode: "generated",
  variant,
});

const text = (value: string): TurnPart => ({ type: "text", text: value });
const chips = (...items: string[]): TurnPart => ({ type: "data-suggestions", data: { items } });

/** Posted as a new reply once the retry is approved. */
export const RETRY_AFTER: TurnPart[] = [
  text(
    `Queued. Both runs should finish in about six minutes, and ${fmt(creditsLeft() - retryCost(timedOutOvernight()))} credits are left.`,
  ),
  chips("Track failed runs", "What's my day?"),
];

/** The question the failed-runs card asks before it spends credits. */
export function retryQuestion(): QuestionData {
  const runs = timedOutOvernight();
  const cost = retryCost(runs);
  return {
    id: questionId("retry", ...runs.map((r) => r.id)),
    title: `Retry ${runs.length} video runs?`,
    summary: `Queues both runs again on ${runs[0]!.model} with the same settings. ${fmt(creditsLeft() - cost)} credits left this month after.`,
    cost,
    undoable: true,
    after: RETRY_AFTER,
  };
}

export const TURNS: Turn<DemoContext>[] = [
  {
    id: "failed-overnight",
    match: ["what failed overnight", "what failed last night"],
    parts: () => [
      text(
        `${failedOvernight().length} of ${overnightRuns().length} runs failed overnight. Both video runs timed out on Video HD, and one image was blocked by the content filter.`,
      ),
      { type: "data-card", data: { type: "failed-runs" } },
      chips("Track failed runs", "Why was the poster blocked?", "What's my day?"),
    ],
  },
  {
    id: "poster-blocked",
    match: ["why was the poster blocked"],
    parts: [
      text(
        "The content filter flagged the crowd scene in poster variant B. The run stopped before it spent more than its 4 credits, and nothing was stored. Rewording the prompt is the usual fix; the same prompt will be blocked again.",
      ),
      chips("Track failed runs", "What's my day?"),
    ],
  },
  {
    id: "track-failed",
    match: ["track failed runs", "track this"],
    parts: [
      text("I built a view of this week's failed runs. It reruns on current data every time you open it."),
      { type: "data-view", data: { viewId: VIEW.id, title: VIEW.title, kind: VIEW.kind } },
      chips("Make it a board", "What's my day?"),
    ],
    effects: [
      {
        type: "build-view",
        view: {
          ...VIEW,
          scope: "All projects",
          origin: "Track failed runs",
          version: { label: "v1 · table", mode: "table" },
        },
      },
    ],
  },
  {
    id: "make-board",
    match: ["make it a board"],
    parts: (ctx) =>
      ctx.viewBuilt
        ? [
            text(
              "Done. The view is now a board grouped by reason, saved as a new version. Undo in its header goes back to the table.",
            ),
            chips("What's my day?"),
          ]
        : [text("There is no view yet. Ask to track failed runs first."), chips("Track failed runs")],
    effects: (ctx) =>
      ctx.viewBuilt
        ? [{ type: "edit-view", id: VIEW.id, version: { label: "v2 · board", mode: "board" } }]
        : [],
  },
  {
    id: "my-day",
    match: ["what s my day", "whats my day"],
    parts: [
      text("Here is today at a glance."),
      {
        type: "data-widgets",
        data: {
          items: [
            { type: "credits", size: "small" },
            { type: "failed", size: "small" },
            { type: "running", size: "medium" },
          ],
        },
      },
      chips("What failed overnight?", "How much have we spent this week?"),
    ],
  },
  {
    id: "week-spend",
    match: ["how much have we spent this week"],
    parts: () => [
      text(
        `${fmt(weekSpend().total)} credits this week, most of it on video. ${fmt(creditsLeft())} of ${fmt(PLAN.credits)} are left until the plan resets on ${PLAN.resetsOn}.`,
      ),
      { type: "data-card", data: { type: "week-spend" } },
      chips("Show spend by project", "What failed overnight?"),
    ],
  },
];

TURNS.push(
  {
    id: "spend-view",
    match: ["show spend by project"],
    parts: [
      text(
        "I built a view of this week's spend by project. Its body is generated, so it can change shape when you ask.",
      ),
      { type: "data-view", data: { viewId: SPEND_VIEW.id, title: SPEND_VIEW.title, kind: SPEND_VIEW.kind } },
      chips("Add a daily trend", "What failed overnight?"),
    ],
    effects: [
      {
        type: "build-view",
        view: {
          ...SPEND_VIEW,
          scope: "All projects",
          origin: "Show spend by project",
          version: spendVersion(1, "spend-v1"),
        },
      },
    ],
  },
  {
    id: "spend-trend",
    match: ["add a daily trend"],
    parts: (ctx) =>
      ctx.spendBuilt
        ? [
            text("Adding a daily trend to the spend view, as version 2."),
            chips("Show the daily trend as a table"),
          ]
        : [
            text("There is no spend view yet. Ask to show spend by project first."),
            chips("Show spend by project"),
          ],
    effects: (ctx) =>
      ctx.spendBuilt
        ? [{ type: "edit-view", id: SPEND_VIEW.id, version: spendVersion(2, "spend-v2-chart") }]
        : [],
  },
  {
    id: "spend-trend-table",
    match: ["show the daily trend as a table"],
    parts: (ctx) =>
      ctx.spendBuilt
        ? [text("Here is the daily trend as a table, as version 3."), chips("What failed overnight?")]
        : [
            text("There is no spend view yet. Ask to show spend by project first."),
            chips("Show spend by project"),
          ],
    effects: (ctx) =>
      ctx.spendBuilt
        ? [{ type: "edit-view", id: SPEND_VIEW.id, version: spendVersion(3, "spend-v3-table") }]
        : [],
  },
);

export const FALLBACK: Turn<DemoContext> = {
  id: "fallback",
  match: [],
  parts: [
    text("I answer from this workspace's runs, credits and queue. These are ready to try:"),
    chips(...READY_PROMPTS),
  ],
};
