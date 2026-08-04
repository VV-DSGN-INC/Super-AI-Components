"use client";

import { Download, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ResultCard, type ResultCardState } from "@/registry/super-ai/result-card";

/**
 * The demo walks one card through the lifecycle rather than showing six cards
 * side by side, because the property worth seeing is that the box never moves
 * as the state changes.
 */
const CYCLE: ResultCardState[] = ["idle", "queued", "streaming", "done", "failed", "locked"];

function Media() {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-8" />
    </div>
  );
}

export default function ResultCardDemo() {
  const [index, setIndex] = React.useState(3);
  const state = CYCLE[index];

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ResultCard
        state={state}
        aspect="square"
        progress={62}
        label="A red bicycle leaning on a sunlit wall"
        badge={state === "queued" ? "3rd in queue" : "Image"}
        onRetry={() => setIndex(CYCLE.indexOf("streaming"))}
        lockedAction={
          <Button size="sm" onClick={() => setIndex(CYCLE.indexOf("done"))}>
            Upgrade to unlock
          </Button>
        }
        actions={
          <Button size="icon-sm" variant="secondary" aria-label="Download result">
            <Download aria-hidden />
          </Button>
        }
        // A2 cost-chip is the real occupant here, but it still carries the
        // muted-on-muted pairing a11y-baseline.md records at 4.34:1, so the
        // demo spells the cost out until that retrofit lands.
        footer={state === "done" ? <span>17 credits · seed 4471</span> : null}
      >
        <Media />
      </ResultCard>

      <Button variant="outline" size="sm" onClick={() => setIndex((i) => (i + 1) % CYCLE.length)}>
        Next state — currently {state}
      </Button>
    </div>
  );
}
