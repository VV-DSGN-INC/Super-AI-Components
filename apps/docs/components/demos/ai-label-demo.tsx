import { AiLabel } from "@/registry/super-ai/ai-label";

export default function AiLabelDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <AiLabel variant="generated" by="Claude" at="3 minutes ago" />
        <AiLabel variant="edited" />
        <AiLabel variant="summarized" />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium">Support assistant</span>
        <AiLabel variant="sender" />
      </div>
      <p className="max-w-xs text-sm">
        <AiLabel variant="text-tint">The summary keeps the three action items.</AiLabel>
      </p>
    </div>
  );
}
