import type { RouteDecision } from "@/registry/super-ai/agent-types";
import { DecisionTrace } from "@/registry/super-ai/decision-trace";

const decisions: RouteDecision[] = [
  {
    id: "d1",
    input: "Find expert analysis on quantum threats to cryptography",
    chosen: { route: "web-search", confidence: 0.92, rationale: "Needs sources fresher than the knowledge base" },
    alternatives: [
      { route: "internal-kb", confidence: 0.31 },
      { route: "direct-llm", confidence: 0.12 },
    ],
  },
  {
    id: "d2",
    input: "Summarize gathered findings",
    chosen: { route: "writer-agent", confidence: 0.88 },
    alternatives: [{ route: "direct-llm", confidence: 0.55 }],
  },
];

export default function DecisionTraceDemo() {
  return <DecisionTrace decisions={decisions} className="w-full max-w-lg" />;
}
