"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { getHandleType } from "./flow-types"

export interface NodeCatalogEntry {
  kind: string
  label: string
  description?: string
  in: string[]
  out: string[]
}

export function compatibleTargets(dataType: string, catalog: NodeCatalogEntry[]): NodeCatalogEntry[] {
  return catalog.filter((entry) => entry.in.includes(dataType))
}

export interface ConnectionHintProps {
  dataType: string
  catalog: NodeCatalogEntry[]
  position: { x: number; y: number }
  onPick?: (kind: string) => void
  onDismiss?: () => void
  className?: string
}

/**
 * Floating mini-palette shown when a React Flow connection is dropped on empty canvas.
 * Host wires React Flow's `onConnectEnd` → show this hint at the event position
 * when the connection was not dropped on a valid target handle.
 *
 * Escape key calls `onDismiss?.()` so the host can unmount the component.
 */
export function ConnectionHint({ dataType, catalog, position, onPick, onDismiss, className }: ConnectionHintProps) {
  const matches = compatibleTargets(dataType, catalog)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss?.()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onDismiss])

  return (
    <div
      data-slot="connection-hint"
      className={cn(
        "absolute z-50 min-w-[160px] rounded-lg border bg-popover p-2 shadow-md",
        className,
      )}
      style={{ left: position.x, top: position.y }}
    >
      <p className="mb-1.5 px-1 text-xs text-muted-foreground">Add compatible node</p>
      {matches.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">No compatible nodes</p>
      ) : (
        matches.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            onClick={() => onPick?.(entry.kind)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
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
  )
}
