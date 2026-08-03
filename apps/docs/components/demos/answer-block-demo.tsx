"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { AnswerBlock, type AnswerClaim } from "@/registry/super-ai/answer-block";

const CLAIMS: AnswerClaim[] = [
  {
    id: "1",
    text: "Out-of-network imaging requires prior authorization.",
    citations: [
      {
        id: "1a",
        label: "1",
        source: "Benefits policy 2026 · §4.2",
        quote: "Imaging performed outside the network requires prior authorization.",
      },
    ],
  },
  {
    id: "2",
    text: "Emergency scans are exempt from that requirement.",
    citations: [
      { id: "2a", label: "2", source: "Benefits policy 2026 · §4.3", quote: "…except in emergencies." },
    ],
  },
  { id: "3", text: "Most requests are approved within two business days." },
];

export default function AnswerBlockDemo() {
  const [streaming, setStreaming] = React.useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Button size="sm" variant="outline" className="self-start" onClick={() => setStreaming((s) => !s)}>
        {streaming ? "Show settled" : "Show streaming"}
      </Button>
      <AnswerBlock claims={CLAIMS} streaming={streaming} retrievedUnused={2} />
    </div>
  );
}
