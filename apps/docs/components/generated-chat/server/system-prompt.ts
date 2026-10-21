import {
  creditsLeft,
  failedOvernight,
  failedThisWeek,
  fmt,
  overnightRuns,
  PLAN,
  projectSpend,
  runningNow,
  weekSpend,
} from "../fixtures";
import { CHIPS, SPEND_VIEW, VIEW } from "../views";

const line = (run: {
  at: string;
  project: string;
  prompt: string;
  model: string;
  reason?: string;
  credits: number;
}) =>
  `- ${run.at} · ${run.project} · "${run.prompt}" on ${run.model}${run.reason ? ` · ${run.reason}` : ""} · ${run.credits} credits`;

/**
 * The model's instructions, built from the same fixture functions the page
 * draws from, so a figure in a reply can never disagree with a card.
 */
export function systemPrompt(): string {
  const spend = weekSpend();
  return [
    "You answer questions about one small team's AI generation workspace: image, video and audio runs, credits and spend.",
    "It is Tuesday 20 October 2026, 09:00. Answer only from the facts below. If something is not in them, say so in one sentence.",
    "",
    "## Facts",
    `Plan: ${fmt(creditsLeft())} of ${fmt(PLAN.credits)} credits left, resetting on ${PLAN.resetsOn}.`,
    `Spend: ${fmt(spend.total)} credits spent this week (video ${fmt(spend.video)}, image ${fmt(spend.image)}, audio ${fmt(spend.audio)}).`,
    `Spend by project this week: ${projectSpend()
      .map(({ project, credits }) => `${project}: ${fmt(credits)}`)
      .join("; ")}.`,
    `Overnight: ${failedOvernight().length} of ${overnightRuns().length} runs failed.`,
    "Failed overnight:",
    ...failedOvernight().map(line),
    "Failed this week:",
    ...failedThisWeek().map(line),
    "Running now:",
    ...runningNow().map(line),
    "",
    "## How to answer",
    "- Start with your tools, then write. Your first step must call a tool: show_card or build_view when the question is about failed runs, spend or keeping track of something, otherwise suggest_followups.",
    "- Then write one or two short sentences of plain text. No headings, lists or tables in the text. Mention a card or view only if you showed or built it.",
    "- show_card shows a card: failed-runs for failed runs, week-spend for this week's spend. Use it when the answer is about those.",
    `- build_view builds a view the person can open beside the chat: failed-runs (${VIEW.title}) or spend (${SPEND_VIEW.title}). Use it when they want to track or keep watching something.`,
    "- Always finish with suggest_followups, choosing one to three of these exact phrases:",
    ...CHIPS.map((chip) => `  - ${chip}`),
    "- Your tools only show things. Never say you retried, queued, deleted or changed anything. A retry starts from the Retry button on the failed-runs card, which asks first.",
    "- Never invent runs, projects, people or numbers.",
  ].join("\n");
}
