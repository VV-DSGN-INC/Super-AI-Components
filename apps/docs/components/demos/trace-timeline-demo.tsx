"use client";

import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";

// An agent run: a plan step, two tool calls that genuinely overlap in
// wall-clock time, an LLM call that timed out and was retried, and a final
// step still in flight — the shapes the four declared states exist for.
const SPANS: TraceSpan[] = [
  { id: "plan", name: "Plan the task", kind: "chain", status: "ok", startMs: 0, durationMs: 420 },
  { id: "search", name: "Search the web", kind: "tool", status: "ok", startMs: 420, durationMs: 900 },
  { id: "read-file", name: "Read repo file", kind: "tool", status: "ok", startMs: 620, durationMs: 500 },
  {
    id: "call-1",
    name: "Call LLM: draft answer",
    kind: "llm",
    status: "error",
    startMs: 1320,
    durationMs: 380,
    error: "Provider timed out after 30s",
  },
  {
    id: "call-2",
    name: "Call LLM: draft answer",
    kind: "llm",
    status: "ok",
    retryOf: "call-1",
    startMs: 1700,
    durationMs: 640,
  },
  {
    id: "write",
    name: "Write final answer",
    kind: "step",
    status: "running",
    startMs: 2340,
    durationMs: 260,
  },
];

export default function TraceTimelineDemo() {
  return <TraceTimeline spans={SPANS} defaultExpandedId="call-1" className="max-w-xl" />;
}
