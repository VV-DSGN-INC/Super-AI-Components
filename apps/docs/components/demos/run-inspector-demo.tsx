"use client";

import { RunInspector } from "@/registry/super-ai/run-inspector";

// A failed LLM call that was retried and succeeded — the shape that
// exercises all four tabs at once: an input to inspect, an output the
// retry produced, cost/cache metadata, and an error tab with a real retry
// lineage.
const INPUT = {
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Summarize the attached incident report." }],
  maxTokens: 512,
};

const OUTPUT = {
  text: "The incident was caused by a cache invalidation race during deploy; mitigated by a rollback at 14:32 UTC.",
};

export default function RunInspectorDemo() {
  return (
    <RunInspector
      input={INPUT}
      output={OUTPUT}
      defaultTab="error"
      metadata={{
        model: "gpt-4o-mini",
        latencyMs: 2140,
        tokensIn: 412,
        tokensOut: 96,
        cost: 0.18,
        costUnit: "credits",
        cacheHit: false,
      }}
      error="Provider timed out after 30s"
      retriedBy={{ id: "call-2", name: "Call LLM (retry)", status: "ok" }}
      className="w-full max-w-xl"
    />
  );
}
