"use client";

import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";

/**
 * Live examples for trace-timeline.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so trace-timeline.docs.tsx has to stay
 * plain server-evaluable data — see workspace-switcher.examples.tsx for the
 * full explanation. Every example lives here instead and crosses into the
 * docs module as a zero-prop element.
 */

const CONCURRENT_SPANS: TraceSpan[] = [
  { id: "search", name: "Search the web", kind: "tool", status: "ok", startMs: 0, durationMs: 900 },
  { id: "read-file", name: "Read repo file", kind: "tool", status: "ok", startMs: 200, durationMs: 500 },
];

export function PositionedByStartTime() {
  return <TraceTimeline spans={CONCURRENT_SPANS} className="w-full" />;
}

const RETRY_SPANS: TraceSpan[] = [
  {
    id: "call-1",
    name: "Call LLM",
    kind: "llm",
    status: "error",
    startMs: 0,
    durationMs: 380,
    error: "Provider timed out",
  },
  {
    id: "call-2",
    name: "Call LLM",
    kind: "llm",
    status: "ok",
    retryOf: "call-1",
    startMs: 380,
    durationMs: 640,
  },
];

export function RetryAsSiblingRow() {
  return <TraceTimeline spans={RETRY_SPANS} className="w-full" />;
}

/**
 * Contrast: every span drawn full-width in call order. Position is ignored,
 * so the fact that search and read-file actually overlapped never shows —
 * this is the failure mode `traceTimelineLayout` exists to prevent.
 */
export function StackedIgnoringStartTime() {
  return (
    <ul className="w-full rounded-lg border">
      {CONCURRENT_SPANS.map((span) => (
        <li key={span.id} className="flex items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0">
          <span className="text-foreground flex-1 truncate font-medium">{span.name}</span>
          <span className="bg-primary h-1.5 flex-1 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Contrast: only the retry is kept, so the record of the first attempt
 * failing is gone entirely.
 */
export function RetryReplacingFailedAttempt() {
  return <TraceTimeline spans={[RETRY_SPANS[1]!]} className="w-full" />;
}
