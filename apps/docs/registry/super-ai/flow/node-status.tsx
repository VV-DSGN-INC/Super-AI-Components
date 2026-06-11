// apps/docs/registry/super-ai/flow/node-status.tsx
// Status badge + ring map for flow nodes. UI copy may diverge from the
// contract state (streaming renders as "Running") — the FlowStatus union
// in flow-types.ts stays the master vocabulary.
import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FlowStatus } from "./flow-types";

export const STATUS_LABEL: Record<FlowStatus, string> = {
  idle: "Idle",
  queued: "Queued",
  streaming: "Running",
  done: "Done",
  failed: "Failed",
  locked: "Upgrade to run",
};

/** Full literal class strings so Tailwind can statically extract them. */
const STATUS_RING: Record<FlowStatus, string> = {
  idle: "",
  queued: "ring-2 ring-[var(--flow-queued)]/40",
  streaming: "ring-2 ring-[var(--flow-streaming)]/50",
  done: "",
  failed: "ring-2 ring-[var(--flow-failed)]/60",
  locked: "ring-2 ring-[var(--flow-queued)]/40",
};

const STATUS_DOT: Record<FlowStatus, string> = {
  idle: "bg-[var(--flow-queued)]",
  queued: "bg-[var(--flow-queued)]",
  streaming: "bg-[var(--flow-streaming)]",
  done: "bg-[var(--flow-done)]",
  failed: "bg-[var(--flow-failed)]",
  locked: "bg-[var(--flow-queued)]",
};

function statusRingClass(status: FlowStatus): string {
  return STATUS_RING[status];
}

interface NodeStatusBadgeProps extends React.ComponentProps<"span"> {
  status: FlowStatus;
  /** Dot/spinner only — label is visually hidden (sr-only) with a `title` tooltip. */
  compact?: boolean;
}

function NodeStatusBadge({ status, compact, className, ...props }: NodeStatusBadgeProps) {
  const label = STATUS_LABEL[status];
  return (
    <span
      data-slot="node-status"
      data-status={status}
      aria-live="polite"
      title={compact ? label : undefined}
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {status === "streaming" ? (
        <Loader2
          aria-hidden
          data-slot="node-status-spinner"
          className="size-3 animate-spin text-[var(--flow-streaming)]"
        />
      ) : (
        <span
          aria-hidden
          data-slot="node-status-dot"
          className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
        />
      )}
      <span
        data-slot="node-status-label"
        className={cn("text-[10px] text-muted-foreground", compact && "sr-only")}
      >
        {label}
      </span>
    </span>
  );
}

export { NodeStatusBadge, statusRingClass };
