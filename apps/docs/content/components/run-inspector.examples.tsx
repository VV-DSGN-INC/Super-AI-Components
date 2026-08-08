"use client";

import { RunInspector } from "@/registry/super-ai/run-inspector";

/**
 * Live examples for run-inspector.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so run-inspector.docs.tsx has to stay
 * plain server-evaluable data. Every example lives here and crosses into
 * the docs module as a zero-prop element.
 *
 * The "Don't" examples are static mockups, not the real component misused:
 * RunInspector has no prop that renders an un-copyable input pane or hides
 * cache state in a second surface, so there's no wrong prop combination to
 * demonstrate — these show what the anti-pattern looks like if a team
 * hand-rolled it instead.
 */

const INPUT = { model: "gpt-4o-mini", messages: [{ role: "user", content: "Summarize the ticket." }] };
const OUTPUT = { text: "The ticket describes a login regression on the mobile app after the 2.4 release." };

export function CopyableRawInput() {
  return <RunInspector input={INPUT} output={OUTPUT} defaultTab="input" className="w-full" />;
}

export function CacheBesideCost() {
  return (
    <RunInspector
      input={INPUT}
      output={OUTPUT}
      defaultTab="metadata"
      metadata={{
        model: "gpt-4o-mini",
        latencyMs: 410,
        tokensIn: 96,
        tokensOut: 41,
        cost: 0.03,
        cacheHit: true,
      }}
      className="w-full"
    />
  );
}

export function ErrorTabWithRetryLineage() {
  return (
    <RunInspector
      input={INPUT}
      defaultTab="error"
      error="Provider timed out after 30s"
      retriedBy={{ id: "call-2", name: "Call LLM (retry)", status: "ok" }}
      className="w-full"
    />
  );
}

export function UncopyableJsonMockup() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <p className="text-foreground text-xs font-medium">Input</p>
      <pre className="bg-muted text-foreground rounded-md border p-3 font-mono text-xs">
        {JSON.stringify(INPUT, null, 2)}
      </pre>
      <p className="text-muted-foreground text-xs">
        Wrong: pretty-printed but no copy affordance. A reader has to hand-transcribe the payload into a bug
        report — RunInspector&apos;s own JSON panes always pair the block with a Copy control.
      </p>
    </div>
  );
}

export function CacheAsSeparateBadgeMockup() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-xs font-medium">Cost</span>
        <span className="text-foreground text-xs">0.03 credits</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-foreground text-xs font-medium">Somewhere else entirely</span>
        <span className="text-foreground text-xs">Cache hit</span>
      </div>
      <p className="text-muted-foreground text-xs">
        Wrong: cache state on its own row, disconnected from cost. RunInspector renders the cache badge inside
        the cost stat itself — the lever and its biggest input stay in the same glance.
      </p>
    </div>
  );
}
