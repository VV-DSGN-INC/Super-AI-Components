import type { PlanStep } from "@/registry/super-ai/agent-types";

const example: PlanStep = {
  id: "s1",
  title: "Research common cryptographic algorithms",
  status: "running",
  substeps: [{ id: "s1a", title: "Search arXiv", status: "done", durationMs: 4200 }],
  costUsd: 0.012,
};

export default function AgentTypesDemo() {
  return (
    <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-lg p-4 text-xs">
      <code>{JSON.stringify(example, null, 2)}</code>
    </pre>
  );
}
