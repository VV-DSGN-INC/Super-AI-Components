import type { GuardrailEvent } from "@/registry/super-ai/agent-types";
import { RefusalCard } from "@/registry/super-ai/refusal-card";

const event: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Email preliminary findings to the public security mailing list",
  preview: "Subject: Quantum threat report (draft) — contains unreviewed claims…",
};

export default function RefusalCardDemo() {
  return <RefusalCard event={event} onEscalate={() => {}} onRequestOverride={() => {}} className="w-full max-w-md" />;
}
