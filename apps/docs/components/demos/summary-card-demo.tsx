"use client";

import * as React from "react";

import { SummaryCard, type SummaryDepth, type SummaryPoint } from "@/registry/super-ai/summary-card";

const BY_DEPTH: Record<SummaryDepth, SummaryPoint[]> = {
  short: [
    {
      id: "s1",
      text: "Parental leave is 16 weeks at full pay, starting within 12 months of the birth or placement.",
    },
  ],
  detailed: [
    { id: "d1", text: "Parental leave is 16 weeks at full pay for employees in the EMEA entities." },
    { id: "d2", text: "The first four weeks are taken in one block that begins within 12 months." },
    { id: "d3", text: "The remaining weeks can be split into blocks of at least one week." },
  ],
  "key-points": [
    { id: "k1", text: "16 weeks at full pay." },
    { id: "k2", text: "First four weeks in one block." },
    { id: "k3", text: "Remaining weeks in blocks of one week or more." },
  ],
};

export default function SummaryCardDemo() {
  const [depth, setDepth] = React.useState<SummaryDepth>("short");
  const [generating, setGenerating] = React.useState(false);

  // The host regenerates on a depth change. A short timer stands in for the model call.
  function handleDepth(next: SummaryDepth) {
    setDepth(next);
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 900);
  }

  return (
    <SummaryCard
      scope={{ kind: "document", title: "leave-policy-emea.docx", href: "#leave-policy-emea" }}
      depth={depth}
      onDepthChange={handleDepth}
      state={generating ? "generating" : "ready"}
      points={BY_DEPTH[depth]}
    />
  );
}
