"use client";

import { Mic, Sparkles, Video } from "lucide-react";
import { useState } from "react";

import { MemberGateRow, type MemberGateRowState } from "@/registry/super-ai/member-gate-row";

export default function MemberGateRowDemo() {
  // Locked -> inline-upsell is a small state machine the consumer owns: the
  // row reports an activation attempt via onRequestUpgrade, and the demo
  // decides what that means (reveal the upsell in place, never a modal).
  const [exportState, setExportState] = useState<MemberGateRowState>("locked");
  const [voiceCloning, setVoiceCloning] = useState(false);
  const [backgroundRemoval, setBackgroundRemoval] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-1">
      <MemberGateRow
        icon={<Video className="size-4" aria-hidden />}
        label="4K export"
        description="Render at full resolution"
        state={exportState}
        tier="Pro"
        onRequestUpgrade={() => setExportState("inline-upsell")}
        upsellDescription="4K export is a Pro feature. Upgrade to render at full resolution."
        onUpgrade={() => setExportState("unlocked")}
        onDismissUpsell={() => setExportState("locked")}
      />

      <MemberGateRow
        icon={<Mic className="size-4" aria-hidden />}
        label="Voice cloning"
        description="Clone a voice from a short sample"
        state="trial-available"
        trialLabel="Free trial ×1"
        checked={voiceCloning}
        onCheckedChange={setVoiceCloning}
      />

      <MemberGateRow
        icon={<Sparkles className="size-4" aria-hidden />}
        label="Background removal"
        state="unlocked"
        checked={backgroundRemoval}
        onCheckedChange={setBackgroundRemoval}
      />
    </div>
  );
}
