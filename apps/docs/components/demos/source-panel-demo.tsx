"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { SourcePanel, type SourcePanelSource } from "@/registry/super-ai/source-panel";

const INITIAL_SOURCES: SourcePanelSource[] = [
  { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
  {
    id: "2",
    name: "pricing-policy.docx",
    meta: "Word · 310 KB",
    stage: "ready",
    chunkCount: 96,
    stats: [{ label: "Indexed", value: "2 days ago" }],
  },
  { id: "3", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "chunking" },
  { id: "4", name: "competitor-teardown.md", meta: "Markdown · 61 KB", stage: "embedding" },
  {
    id: "5",
    name: "annual-review-2024.pdf",
    meta: "PDF · 18 MB",
    stage: "failed",
    errorMessage: "Parse failed — the file is a scan with no text layer",
  },
];

export default function SourcePanelDemo() {
  const [sources, setSources] = React.useState<SourcePanelSource[]>(INITIAL_SOURCES);

  // Retry re-enters the pipeline at its first stage rather than jumping to
  // ready, so the row keeps telling you where the work actually is.
  const handleRetry = (id: string) => {
    setSources((current) =>
      current.map((source) =>
        source.id === id ? { ...source, stage: "parsing", errorMessage: undefined } : source,
      ),
    );
  };

  return (
    <SourcePanel
      heading="Sources"
      sources={sources}
      onRetrySource={handleRetry}
      action={
        <Button type="button" variant="outline" size="sm">
          <Plus aria-hidden />
          Add source
        </Button>
      }
    />
  );
}
