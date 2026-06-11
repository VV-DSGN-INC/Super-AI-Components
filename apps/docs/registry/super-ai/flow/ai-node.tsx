// apps/docs/registry/super-ai/flow/ai-node.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Lock } from "lucide-react";
import { NODE_WIDTH, type FlowStatus, type NodeSize } from "./flow-types";
import { NodeStatusBadge, statusRingClass, STATUS_LABEL } from "./node-status";

// Props-as-slots (vs §6 compound parts) is deliberate — slot order is a fixed
// tested contract; presets compose this API directly.
export interface AiNodeProps extends Omit<React.ComponentProps<"div">, "title"> {
  id: string;
  /** Node title shown in the header and used for the accessible name. */
  title: string;
  status: FlowStatus;
  modelLabel?: string;
  runtime?: "local" | "cloud";
  error?: string;
  selected?: boolean;
  size?: NodeSize;
  media?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Content rendered inside the CTA-replaced locked block. */
  lockedCta?: React.ReactNode;
  className?: string;
}

export function AiNode({
  id,
  title,
  status,
  modelLabel,
  runtime,
  error,
  selected,
  size = "md",
  media,
  footer,
  children,
  lockedCta,
  className,
  style,
  ...props
}: AiNodeProps) {
  const isLocked = status === "locked";
  return (
    <div
      role="group"
      aria-label={`${title} node, ${STATUS_LABEL[status]}`}
      data-slot="ai-node"
      data-status={status}
      data-node-id={id}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition",
        selected && "ring-2 ring-ring shadow-md",
        !selected && statusRingClass(status),
        className,
      )}
      style={{ width: NODE_WIDTH[size], ...style }}
      {...props}
    >
      <div
        data-slot="ai-node-header"
        className="flex items-center justify-between gap-2 px-3 pt-2 text-[11px] text-muted-foreground"
      >
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2">
          {modelLabel && (
            <span>
              {modelLabel}
              {runtime === "local" ? " · Local" : ""}
            </span>
          )}
          <NodeStatusBadge status={status} compact />
        </span>
      </div>
      {/* Implements the master contract's CTA-replaced locked state at the card layer. */}
      {isLocked ? (
        <div
          data-slot="ai-node-locked"
          className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground"
        >
          <Lock aria-hidden className="mb-2 size-4" />
          {lockedCta ?? <span className="text-xs">Upgrade to unlock this node</span>}
        </div>
      ) : (
        <>
          {media && (
            <div data-slot="ai-node-media" className="px-3 pt-2">
              {media}
            </div>
          )}
          {children && (
            <div data-slot="ai-node-body" className="px-3 py-2">
              {children}
            </div>
          )}
        </>
      )}
      {status === "failed" && (
        <div
          data-slot="ai-node-error"
          className="mx-3 mb-2 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-3">{error ?? "Generation failed"}</span>
        </div>
      )}
      {footer && (
        <div
          data-slot="ai-node-footer"
          className="flex items-center justify-between gap-2 border-t px-3 py-2"
        >
          {footer}
        </div>
      )}
    </div>
  );
}
