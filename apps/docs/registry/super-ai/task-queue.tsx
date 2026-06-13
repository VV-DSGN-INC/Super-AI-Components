"use client";

import { ArrowDown, ArrowUp, Loader2, Zap } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type QueuePriority = "P0" | "P1" | "P2" | "P3";
type QueueStatus = "queued" | "running" | "blocked";

interface QueuedTask {
  id: string;
  title: string;
  priority: QueuePriority;
  status: QueueStatus;
  rankDelta?: number; // positive = moved up N places this re-rank, negative = moved down
  preempted?: boolean;
}

const PRIORITY_CLASS: Record<QueuePriority, string> = {
  P0: "bg-destructive/10 text-destructive",
  P1: "bg-primary/10 text-primary",
  P2: "bg-muted text-foreground",
  P3: "bg-muted text-muted-foreground",
};

interface TaskQueueProps extends React.ComponentProps<"ol"> {
  tasks: QueuedTask[];
}

function TaskQueue({ tasks, className, ...props }: TaskQueueProps) {
  if (tasks.length === 0) {
    return (
      <ol data-slot="task-queue" role="list" className={cn("flex flex-col gap-1", className)} {...props}>
        <li className="rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground">
          Queue is empty.
        </li>
      </ol>
    );
  }

  return (
    <ol data-slot="task-queue" role="list" className={cn("flex flex-col gap-1", className)} {...props}>
      {tasks.map((t, i) => (
        <li
          key={t.id}
          data-slot="task-queue-item"
          data-status={t.status}
          data-preempted={t.preempted || undefined}
          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
        >
          <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[t.priority])}>
            {t.priority}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
          {t.preempted && <Zap className="size-3.5 text-muted-foreground" aria-label="Preempted" />}
          {t.rankDelta !== undefined && t.rankDelta !== 0 && (
            <span
              aria-label={t.rankDelta > 0 ? `Moved up ${t.rankDelta}` : `Moved down ${Math.abs(t.rankDelta)}`}
              className="flex items-center text-xs tabular-nums text-muted-foreground"
            >
              {t.rankDelta > 0 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
              {Math.abs(t.rankDelta)}
            </span>
          )}
          {t.status === "running" && <Loader2 className="size-3.5 animate-spin text-primary" aria-label="Running" />}
        </li>
      ))}
    </ol>
  );
}

export { TaskQueue };
export type { QueuedTask, TaskQueueProps };
