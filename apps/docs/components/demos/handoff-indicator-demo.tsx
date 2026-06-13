import type { HandoffEvent } from "@/registry/super-ai/agent-types";
import { HandoffStack } from "@/registry/super-ai/handoff-indicator";

const handoffs: HandoffEvent[] = [
  { id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved; gather sources", at: "13:58" },
  { id: "h2", from: "Researcher", to: "Writer", reason: "Sources gathered; draft needed", payloadSummary: "12 sources, threat matrix", at: "14:02" },
  { id: "h3", from: "Writer", to: "Critic", reason: "Draft ready for review", at: "14:05" },
];

export default function HandoffIndicatorDemo() {
  return <HandoffStack handoffs={handoffs} className="w-full max-w-sm" />;
}
