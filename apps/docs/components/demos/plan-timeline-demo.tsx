import type { PlanStep } from "@/registry/super-ai/agent-types";
import { PlanTimeline } from "@/registry/super-ai/plan-timeline";

const steps: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing", status: "done", durationMs: 8400, costUsd: 0.011 },
  {
    id: "s2",
    title: "Research common cryptographic algorithms",
    status: "running",
    substeps: [
      { id: "s2a", title: "Search arXiv for post-quantum cryptography", status: "done", durationMs: 4100 },
      { id: "s2b", title: "Query financial-data API for adoption metrics", status: "running" },
    ],
  },
  { id: "s3", title: "Find expert analysis on quantum threats", status: "needs-approval" },
  { id: "s4", title: "Synthesize findings into a structured report", status: "pending" },
];

export default function PlanTimelineDemo() {
  return <PlanTimeline steps={steps} aria-label="Research plan" className="w-full max-w-md" />;
}
