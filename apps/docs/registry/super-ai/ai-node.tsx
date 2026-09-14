"use client";
import * as React from "react";
import { AlertCircle, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { NODE_WIDTH, type FlowStatus, type NodeSize } from "@/registry/super-ai/flow-types";
import { NodeStatusBadge, STATUS_LABEL, statusRingClass } from "@/registry/super-ai/node-status";

/**
 * AI Node — One node card: header, media and body slots, footer or floating menu
 *
 * Spec: docs/design-system/component-specs.md#g2-ai-node
 * States: idle · queued · streaming · done · failed · locked · selected · menu-floating
 *
 * Props-as-slots rather than compound parts is deliberate: slot order is a
 * tested contract, and modality-node (phase 2) composes this API directly,
 * putting D1 media-prompt-bar in the body, F1 result-card in media and E5
 * run-button plus A7 gen-settings-bar in the footer.
 */
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
  /**
   * Where the footer renders. `docked` keeps it inside the card under a
   * border; `floating` renders it as a pill below the card, outside the group,
   * which is the FilmMaker settings-pill placement.
   */
  menuPlacement?: "docked" | "floating";
  children?: React.ReactNode;
  /** Content rendered inside the locked block in place of the body. */
  lockedCta?: React.ReactNode;
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
  menuPlacement = "docked",
  children,
  lockedCta,
  className,
  style,
  ...props
}: AiNodeProps) {
  const isLocked = status === "locked";
  const floating = menuPlacement === "floating" && footer != null;

  const card = (
    <div
      role="group"
      aria-label={`${title} node, ${STATUS_LABEL[status]}`}
      data-slot="ai-node"
      data-status={status}
      data-node-id={id}
      className={cn(
        "bg-card text-card-foreground rounded-xl border shadow-sm transition-shadow",
        selected && "ring-ring shadow-md ring-2",
        !selected && statusRingClass(status),
        className,
      )}
      style={{ width: NODE_WIDTH[size], ...style }}
      {...props}
    >
      <div
        data-slot="ai-node-header"
        className="text-muted-foreground flex items-center justify-between gap-2 px-3 pt-2 text-xs"
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
      {isLocked ? (
        <div
          data-slot="ai-node-locked"
          className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center"
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
          className="bg-destructive/10 text-destructive mx-3 mb-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-3">{error ?? "Generation failed"}</span>
        </div>
      )}
      {footer && !floating && (
        <div
          data-slot="ai-node-footer"
          className="flex items-center justify-between gap-2 border-t px-3 py-2"
        >
          {footer}
        </div>
      )}
    </div>
  );

  if (!floating) return card;
  return (
    <div data-slot="ai-node-frame" className="inline-flex flex-col items-center gap-2">
      {card}
      <div
        data-slot="ai-node-menu"
        className="bg-card text-card-foreground flex items-center gap-2 rounded-full border px-2 py-1 shadow-sm"
      >
        {footer}
      </div>
    </div>
  );
}
