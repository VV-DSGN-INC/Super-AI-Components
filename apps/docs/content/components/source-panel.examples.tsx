"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SourcePanel, type SourcePanelSource } from "@/registry/super-ai/source-panel";

/**
 * Live examples for source-panel.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so source-panel.docs.tsx has to stay plain
 * server-evaluable data and cannot carry "use client" itself. Every example
 * lives here and crosses into the docs module as a zero-prop element, so a
 * handler like `onRetrySource` is never serialized across the boundary.
 */

const IN_FLIGHT: SourcePanelSource[] = [
  { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
  { id: "2", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "chunking" },
  { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "embedding" },
];

export function StageIsTheStatus() {
  return <SourcePanel sources={IN_FLIGHT} />;
}

const READY: SourcePanelSource[] = [
  { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
  {
    id: "2",
    name: "pricing-policy.docx",
    meta: "Word · 310 KB",
    stage: "ready",
    chunkCount: 96,
    stats: [{ label: "Indexed", value: "2 days ago" }],
  },
];

export function ChunkCountsOnReadySources() {
  return <SourcePanel sources={READY} />;
}

/**
 * The anti-pattern, drawn by hand rather than with SourcePanel — the point is
 * that the component cannot express it.
 */
export function GenericSpinnerHidesTheStage() {
  return (
    <ul className="flex w-full max-w-md flex-col gap-1">
      {["Q3-report.pdf", "kickoff-call.vtt", "pricing-policy.docx"].map((name) => (
        <li key={name} className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2">
          <Loader2 aria-hidden className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="text-foreground/70 truncate text-xs">Processing…</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const FAILED: SourcePanelSource[] = [
  { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
  {
    id: "2",
    name: "annual-review-2024.pdf",
    meta: "PDF · 18 MB",
    stage: "failed",
    errorMessage: "Parse failed — the file is a scan with no text layer",
  },
];

/**
 * A panel-level Retry above rows that already succeeded. Rendered without
 * `onRetrySource`, so no per-row control appears — which is the whole problem.
 */
export function PanelLevelRetry() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm">
          Retry all sources
        </Button>
      </div>
      <SourcePanel sources={FAILED} />
    </div>
  );
}
