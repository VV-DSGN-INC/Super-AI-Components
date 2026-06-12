"use client";

import * as React from "react";

import type { PlanStep } from "@/registry/super-ai/agent-types";
import { PlanApproval } from "@/registry/super-ai/plan-approval";

const proposed: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing", status: "pending" },
  { id: "s2", title: "Research common cryptographic algorithms", status: "pending" },
  { id: "s3", title: "Email preliminary findings to the security list", status: "pending" },
  { id: "s4", title: "Synthesize findings into a structured report", status: "pending" },
];

export default function PlanApprovalDemo() {
  const [result, setResult] = React.useState<string>();
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <PlanApproval
        key="proposal-1"
        steps={proposed}
        onApprove={(steps) => setResult(`Approved ${steps.length} steps`)}
        onReject={(reason) => setResult(`Rejected: ${reason}`)}
      />
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
