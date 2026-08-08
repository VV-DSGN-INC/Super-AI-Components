import type { ComponentDocs } from "@/lib/component-docs";
import {
  PositionedByStartTime,
  RetryAsSiblingRow,
  RetryReplacingFailedAttempt,
  StackedIgnoringStartTime,
} from "./trace-timeline.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n4-trace-timeline.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "trace-timeline.examples" client module and are referenced here as
 * zero-prop elements.
 */
export const TraceTimelineDocs: ComponentDocs = {
  whatItIs:
    "A waterfall view of an agent run's steps, tool calls, and LLM calls, positioned along a shared time axis instead of listed in a flat sequence. Each row expands in place to show the full detail of that call.",
  whyItMatters:
    "This is the view an engineer opens once a run has already gone wrong, and its entire value over a plain log is what a flat list hides: which calls actually overlapped. LangSmith, Vercel's AI SDK observability, and every agent debugger on the reference board place spans on a shared time axis rather than just an order, because \"what happened, and when\" is a question a bulleted step list can't answer.",
  evidence: ["LangSmith", "Vercel AI observability", "Agent debuggers"],
  anatomy: [
    { slot: "trace-timeline", note: "Root wrapper around the row list." },
    { slot: "trace-timeline-rows", note: "The list of spans, ordered by start time." },
    { slot: "trace-timeline-row", note: "One span: a Collapsible carrying its trigger and detail." },
    { slot: "trace-timeline-row-trigger", note: "The clickable row header — status, name, bar, duration." },
    { slot: "trace-timeline-row-name", note: "The span's own name." },
    {
      slot: "trace-timeline-row-attempt",
      note: '"Attempt N" badge, shown once a span shares retry lineage.',
    },
    {
      slot: "trace-timeline-row-status-text",
      note: "Visible status text for error/running rows — never colour alone.",
    },
    { slot: "trace-timeline-row-track", note: "The decorative axis a row's bar is positioned on." },
    { slot: "trace-timeline-row-bar", note: "Positioned by startMs/durationMs — the waterfall itself." },
    { slot: "trace-timeline-row-duration", note: "How long the call took." },
    { slot: "trace-timeline-row-detail", note: "The CollapsibleContent an open row expands into." },
  ],
  usage:
    "Reach for it once a run has more than a couple of steps and someone needs to reconstruct what actually happened, not just what was attempted. Feed it a flat `spans` array with `startMs`/`durationMs` in milliseconds from the start of the run — it derives the shared axis itself, so never pre-stack or pre-offset spans before handing them in. When a step retries, add the retry as a second span whose `retryOf` points at the id of the one it retried; never mutate or remove the failed attempt to make room for it. Pass `renderDetail` to fill an expanded row with the real per-run detail (I/O, tokens, cost) once that surface exists on your side — omit it and a minimal built-in summary is used instead.",
  dos: [
    {
      text: "Let a bar's position come from startMs/durationMs so two calls that actually overlapped visibly overlap.",
      example: <PositionedByStartTime />,
    },
    {
      text: "Add a retry as a new span with retryOf set — the failed attempt keeps its own row, error text and all.",
      example: <RetryAsSiblingRow />,
    },
  ],
  donts: [
    {
      text: "Don't lay every span out full-width in call order — that hides the one thing this view exists to show: concurrency.",
      example: <StackedIgnoringStartTime />,
    },
    {
      text: "Don't drop the failed attempt once a retry succeeds — the record of what actually happened is the point.",
      example: <RetryReplacingFailedAttempt />,
    },
  ],
  pitfalls: [
    "Deriving the timeline's total span from array order or index instead of startMs + durationMs — the moment a call starts after an earlier one has already finished, index-based layout stops matching reality.",
    "Treating an errored row as done once it's red. The visible \"Failed: <reason>\" text is the real signal — colour alone fails anyone who can't see it.",
    "Wiring `renderDetail` to assume N5 `run-inspector`'s exact prop shape before that component exists — this component only ever hands back the row's own `TraceSpan`; the richer per-run record N5 needs is the host's to look up by `span.id`.",
  ],
};
