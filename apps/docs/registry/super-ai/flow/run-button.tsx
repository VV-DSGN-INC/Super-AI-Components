"use client"

import * as React from "react"
import { ChevronDown, Play, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { FlowStatus } from "./flow-types"

export interface RunButtonProps {
  status: FlowStatus
  onRun: () => void
  onStop?: () => void
  onRunFrom?: () => void
  onRunSelection?: () => void
  onRunAll?: () => void
  cost?: { amount: number; unit: string }
  size?: "sm" | "default"
  className?: string
}

export function RunButton({
  status,
  onRun,
  onStop,
  onRunFrom,
  onRunSelection,
  onRunAll,
  cost,
  size = "default",
  className,
}: RunButtonProps) {
  const hasMenu = !!(onRunFrom || onRunSelection || onRunAll)

  const costTitle = cost ? `~${cost.amount} ${cost.unit}` : undefined

  function primaryButton() {
    if (status === "streaming") {
      return (
        <Button
          size={size}
          variant="default"
          onClick={onStop}
          aria-label="Stop"
          className={cn(!hasMenu && className)}
        >
          <Square aria-hidden />
          Stop
        </Button>
      )
    }

    if (status === "queued") {
      return (
        <Button
          size={size}
          variant="default"
          disabled
          aria-label="Queued…"
          className={cn(!hasMenu && className)}
        >
          Queued…
        </Button>
      )
    }

    if (status === "locked") {
      return (
        <Button
          size={size}
          variant="default"
          disabled
          aria-label="Upgrade to run"
          className={cn(!hasMenu && className)}
        >
          Upgrade to run
        </Button>
      )
    }

    // idle | done | failed
    return (
      <Button
        size={size}
        variant="default"
        onClick={onRun}
        title={costTitle}
        aria-label="Run"
        className={cn(!hasMenu && className)}
      >
        <Play aria-hidden />
        Run
      </Button>
    )
  }

  if (!hasMenu) {
    return (
      <div data-slot="run-button" className={cn("inline-flex", className)}>
        {primaryButton()}
      </div>
    )
  }

  return (
    <div data-slot="run-button" className={cn("inline-flex", className)}>
      {primaryButton()}
      <DropdownMenu>
        {/* Base UI adaptation: DropdownMenuTrigger uses render= prop (not asChild).
            We render a Button element as the trigger's DOM node. */}
        <DropdownMenuTrigger
          render={
            <Button
              size={size === "sm" ? "icon-sm" : "icon"}
              variant="default"
              aria-label="Run options"
              className="rounded-l-none border-l border-l-primary-foreground/20"
            />
          }
        >
          <ChevronDown aria-hidden className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onRunFrom && (
            <DropdownMenuItem onClick={onRunFrom}>
              Run from here
            </DropdownMenuItem>
          )}
          {onRunSelection && (
            <DropdownMenuItem onClick={onRunSelection}>
              Run selection
            </DropdownMenuItem>
          )}
          {onRunAll && (
            <DropdownMenuItem onClick={onRunAll}>
              Run all
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
