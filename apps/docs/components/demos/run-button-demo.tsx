"use client";
import { useEffect, useRef, useState } from "react";

import { RunButton, type RunButtonState } from "@/registry/super-ai/run-button";

// Local state stands in for whatever the consumer actually persists (a job
// queue, a websocket progress event). The component only renders the
// state/progress it's given — this timer is what turns a click into
// "running", ticking progress, and a landed "done".
export default function RunButtonDemo() {
  const [state, setState] = useState<RunButtonState>("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    setState("running");
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((current) => {
        const next = current + 20;
        if (next >= 100) {
          if (timer.current) clearInterval(timer.current);
          setState("done");
          return 100;
        }
        return next;
      });
    }, 350);
  };

  const cancel = () => {
    if (timer.current) clearInterval(timer.current);
    setState("idle");
    setProgress(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Lifecycle — idle → running → done</p>
        <RunButton state={state} cost={4} progress={progress} onRun={start} onCancel={cancel} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Insufficient credits — at the point of spend</p>
        <RunButton
          state="insufficient-credits"
          cost={6}
          balance={2}
          onBuyCredits={() => console.log("buy credits clicked")}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Locked — plan gate, not a shortfall</p>
        <RunButton
          state="locked"
          lockedReason="Video generation is a Pro feature."
          onUnlock={() => console.log("unlock clicked")}
        />
      </div>
    </div>
  );
}
