"use client";

import { AudioLines, FileText, Network, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotebookShell } from "@/registry/super-ai/notebook-shell";

const SOURCES = [
  {
    id: "q3-report",
    name: "Q3-report.pdf",
    meta: "PDF · 2.4 MB",
    stage: "ready" as const,
    chunkCount: 184,
  },
  {
    id: "kickoff-call",
    name: "Kickoff call transcript",
    meta: "Transcript · 48 min",
    stage: "ready" as const,
    chunkCount: 96,
  },
  {
    id: "pricing-page",
    name: "competitor-pricing.html",
    meta: "Web page",
    stage: "embedding" as const,
  },
];

const MESSAGES = [
  {
    id: "m1",
    role: "user" as const,
    content: "What did we actually commit to on pricing, and where is that written down?",
  },
  {
    id: "m2",
    role: "assistant" as const,
    claims: [
      {
        id: "c1",
        text: "The commitment is a flat per-seat price held for the first twelve months.",
        citations: [{ id: "x1", label: "1", sourceId: "q3-report", quote: "Per-seat pricing is fixed for the first four quarters of any new contract." }],
      },
      {
        id: "c2",
        text: "It was agreed verbally on the kickoff call before it reached the report.",
        citations: [{ id: "x2", label: "2", sourceId: "kickoff-call", quote: "We'll hold the seat price for a year — put that in writing before Q4." }],
      },
    ],
    retrievedUnused: 1,
  },
];

const OUTPUT_TYPES = [
  {
    id: "audio",
    icon: <AudioLines aria-hidden />,
    title: "Audio Overview",
    description: "Two hosts talk through everything you have added.",
  },
  {
    id: "mind-map",
    icon: <Network aria-hidden />,
    title: "Mind Map",
    description: "How the sources connect to one another.",
  },
  {
    id: "briefing",
    icon: <FileText aria-hidden />,
    title: "Briefing Doc",
    description: "A one-page summary, cited throughout.",
  },
];

const OUTPUTS = [
  {
    id: "o1",
    state: "done" as const,
    aspect: "video" as const,
    label: "Audio Overview · 11 min",
    badge: "Audio",
    footer: <span>Generated from 3 sources</span>,
  },
  {
    id: "o2",
    state: "streaming" as const,
    aspect: "video" as const,
    progress: 62,
    label: "Mind Map",
    badge: "Diagram",
  },
];

export default function NotebookShellDemo() {
  return (
    <NotebookShell
      className="h-[42rem]"
      sources={SOURCES}
      sourcesAction={
        <Button type="button" size="sm" variant="outline">
          <Plus aria-hidden />
          Add source
        </Button>
      }
      sourcesEmptyAction={
        <Button type="button" size="sm">
          Add source
        </Button>
      }
      messages={MESSAGES}
      contextChips={[{ id: "chip-1", kind: "file", label: "Q3-report.pdf" }]}
      outputTypes={OUTPUT_TYPES}
      outputs={OUTPUTS}
    />
  );
}
