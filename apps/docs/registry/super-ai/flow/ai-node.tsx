// apps/docs/registry/super-ai/flow/ai-node.tsx
"use client";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { NODE_WIDTH, type FlowStatus, type NodeSize } from "./flow-types";
import { NodeStatusBadge, statusRingClass } from "./node-status";

export interface AiNodeProps {
  id: string;
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
  className,
}: AiNodeProps) {
  return (
    <div
      role="group"
      aria-label={`${title} node, ${status}`}
      data-slot="ai-node"
      data-status={status}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition",
        selected && "ring-2 ring-ring shadow-md",
        !selected && statusRingClass(status),
        className,
      )}
      style={{ width: NODE_WIDTH[size] }}
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
      {status === "failed" && error && (
        <div
          data-slot="ai-node-error"
          className="mx-3 mb-2 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-3">{error}</span>
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
