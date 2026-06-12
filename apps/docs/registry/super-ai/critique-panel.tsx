"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CritiqueIteration {
  draft: string;
  critique: string;
  verdict: "approved" | "needs-work";
}

interface CritiquePanelProps extends React.ComponentProps<"div"> {
  iterations: CritiqueIteration[];
  onAccept: () => void;
  onIterate: () => void;
}

function CritiquePanel({ iterations, onAccept, onIterate, className, ...props }: CritiquePanelProps) {
  const [index, setIndex] = React.useState(iterations.length - 1);
  const current = iterations[index];

  return (
    <div
      data-slot="critique-panel"
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous iteration"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {`Iteration ${index + 1} of ${iterations.length}`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next iteration"
            disabled={index === iterations.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
        <span
          data-slot="critique-verdict"
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            current.verdict === "approved" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
          )}
        >
          {current.verdict}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Draft</h4>
          <p className="rounded-md border bg-background p-3 text-sm">{current.draft}</p>
        </section>
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Critique</h4>
          <p className="rounded-md border bg-background p-3 text-sm">{current.critique}</p>
        </section>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" aria-label="Run another iteration" onClick={onIterate}>
          Iterate
        </Button>
        <Button type="button" aria-label="Accept draft" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

export { CritiquePanel };
export type { CritiqueIteration, CritiquePanelProps };
