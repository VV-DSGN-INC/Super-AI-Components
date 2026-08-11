"use client";

import { AlertCircle, Bell, BellOff, Check, Loader2, X } from "lucide-react";
import * as React from "react";

import { EntityRow } from "./entity-row";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type TaskStatus = "running" | "needs-input" | "done" | "failed";

interface TrayTask {
  id: string;
  title: React.ReactNode;
  /** Where the task came from. A tray that reports without navigating is a notification list. */
  description?: React.ReactNode;
  status: TaskStatus;
  /** Per-task, not a global preference: the user knows which of five runs they care about. */
  notify?: boolean;
}

interface TaskTrayProps extends React.ComponentProps<typeof SheetContent> {
  tasks: TrayTask[];
  /** Opens the surface that owns the task. */
  onOpenTask?: (id: string) => void;
  /** Work you cannot stop burns budget and trust. Offered for anything still live. */
  onCancelTask?: (id: string) => void;
  onNotifyChange?: (id: string, notify: boolean) => void;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  "needs-input": <AlertCircle className="size-4" />,
  running: <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />,
  done: <Check className="size-4" />,
  failed: <AlertCircle className="size-4" />,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  "needs-input": "Needs input",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

// `needs-input` first: a background task blocked on an approval is invisible work
// that has silently stopped, and it is the only row the user must act on. Failed
// next — it is over, but it is news. Running and done are reporting.
const ORDER: Record<TaskStatus, number> = { "needs-input": 0, failed: 1, running: 2, done: 3 };

function TaskTray({
  tasks,
  onOpenTask,
  onCancelTask,
  onNotifyChange,
  trigger,
  open,
  onOpenChange,
  className,
  ...props
}: TaskTrayProps) {
  const sorted = React.useMemo(() => [...tasks].sort((a, b) => ORDER[a.status] - ORDER[b.status]), [tasks]);
  const attention = tasks.filter((t) => t.status === "needs-input").length;
  const live = (status: TaskStatus) => status === "running" || status === "needs-input";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Base UI adaptation: SheetTrigger uses `render` prop (not Radix `asChild`). */}
      {trigger ? <SheetTrigger render={trigger} /> : null}
      <SheetContent data-slot="task-tray" className={cn("gap-0", className)} {...props}>
        <SheetHeader>
          <SheetTitle>Tasks</SheetTitle>
          <SheetDescription>
            {attention > 0
              ? `${attention} waiting on you`
              : "Work here keeps running when you navigate away."}
          </SheetDescription>
        </SheetHeader>

        {sorted.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            Nothing running. Tasks you start in the background collect here.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2 pb-4">
            {sorted.map((task) => (
              // The row and its controls are siblings, not nested. EntityRow
              // renders a <button> when it has onSelect, so putting the notify
              // and cancel buttons in its `trailing` slot produces nested
              // buttons — invalid HTML, and a hydration error in React.
              <li key={task.id} className="flex items-center gap-0.5">
                {/* No data-slot override: EntityRow spreads ...props after
                    its own attributes, so one would erase `entity-row` and
                    hide that this is what renders a row (CONTINUE.md §4).
                    Rows are addressed by data-task-id instead. */}
                <EntityRow
                  data-task-id={task.id}
                  data-status={task.status}
                  className="flex-1"
                  icon={
                    <span
                      className={cn(
                        task.status === "failed" && "text-destructive",
                        task.status === "needs-input" && "text-foreground",
                      )}
                    >
                      {STATUS_ICON[task.status]}
                    </span>
                  }
                  title={task.title}
                  description={
                    <>
                      <span className="sr-only">{STATUS_LABEL[task.status]}. </span>
                      {task.description}
                    </>
                  }
                  onSelect={onOpenTask ? () => onOpenTask(task.id) : undefined}
                />
                {onNotifyChange && live(task.status) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-pressed={task.notify ?? false}
                    aria-label={task.notify ? "Stop notifying when done" : "Notify me when done"}
                    onClick={() => onNotifyChange(task.id, !task.notify)}
                  >
                    {task.notify ? <Bell /> : <BellOff />}
                  </Button>
                ) : null}
                {onCancelTask && live(task.status) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Cancel task"
                    onClick={() => onCancelTask(task.id)}
                  >
                    <X />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { TaskTray };
export type { TaskStatus, TaskTrayProps, TrayTask };
