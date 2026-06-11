"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { getHandleType } from "./flow-types";

export interface NodeCatalogEntry {
  kind: string;
  label: string;
  description?: string;
  in: string[];
  out: string[];
}

export function compatibleTargets(dataType: string, catalog: NodeCatalogEntry[]): NodeCatalogEntry[] {
  return catalog.filter((entry) => entry.in.includes(dataType));
}

export interface ConnectionHintProps extends Omit<React.ComponentProps<"div">, "children"> {
  dataType: string;
  catalog: NodeCatalogEntry[];
  position: { x: number; y: number };
  /** Called when the user selects a node kind. Required. */
  onPick: (kind: string) => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Floating mini-palette shown when a React Flow connection is dropped on empty canvas.
 * Host wires React Flow's `onConnectEnd` → show this hint at the event position
 * when the connection was not dropped on a valid target handle.
 *
 * - Host container must have `position: relative` (or `position: absolute`) so that
 *   this component's `position: absolute` placement is correct.
 * - On mount, focus lands on the first option button (when at least one option exists).
 * - Style the satisfied state via `[data-satisfied="true"]` on sibling port chips.
 * - Escape key calls `onDismiss?.()` so the host can unmount the component.
 */
export function ConnectionHint({
  dataType,
  catalog,
  position,
  onPick,
  onDismiss,
  className,
  style,
  ...props
}: ConnectionHintProps) {
  const matches = compatibleTargets(dataType, catalog);
  const headingId = React.useId();

  React.useEffect(() => {
    if (!onDismiss) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      onDismiss!();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-labelledby={headingId}
      data-slot="connection-hint"
      className={cn("absolute z-50 min-w-[160px] rounded-lg border bg-popover p-2 shadow-md", className)}
      style={{ left: position.x, top: position.y, ...style }}
      {...props}
    >
      <p id={headingId} className="mb-1.5 px-1 text-xs text-muted-foreground">
        Add compatible node
      </p>
      {matches.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">No compatible nodes</p>
      ) : (
        matches.map((entry, i) => (
          <button
            key={entry.kind}
            type="button"
            autoFocus={i === 0}
            data-slot="connection-hint-option"
            onClick={() => onPick(entry.kind)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          >
            <span className="flex items-center gap-0.5">
              {entry.in.map((t) => (
                <span
                  key={t}
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: `var(${getHandleType(t)?.cssVar ?? "--flow-text"})` }}
                />
              ))}
            </span>
            {entry.label}
          </button>
        ))
      )}
    </div>
  );
}
