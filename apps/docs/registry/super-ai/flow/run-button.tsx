"use client";

import * as React from "react";
import { ChevronDown, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FlowStatus } from "./flow-types";

export interface RunButtonProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  status: FlowStatus;
  /**
   * Called when the user clicks Run.
   * May fire again until the host flips `status` — debounce/disable is the
   * host's concern (controlled component).
   */
  onRun: () => void;
  onStop?: () => void;
  onRunFrom?: () => void;
  onRunSelection?: () => void;
  onRunAll?: () => void;
  cost?: { amount: number; unit: string };
  size?: "sm" | "default";
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
  ...rest
}: RunButtonProps) {
  const hasMenu = !!(onRunFrom || onRunSelection || onRunAll);

  const costTitle = cost ? `~${cost.amount} ${cost.unit}` : undefined;

  // The split-button join: primary gets right-side removed so it abuts the trigger.
  const primaryJoin = hasMenu ? "rounded-r-none border-r-0" : undefined;

  function primaryButton() {
    if (status === "streaming") {
      return (
        <Button size={size} variant="default" onClick={onStop} disabled={!onStop} className={primaryJoin}>
          <Square aria-hidden />
          Stop
        </Button>
      );
    }

    if (status === "queued") {
      return (
        <Button size={size} variant="default" disabled className={primaryJoin}>
          Queued…
        </Button>
      );
    }

    if (status === "locked") {
      return (
        <Button size={size} variant="default" disabled className={primaryJoin}>
          Upgrade to run
        </Button>
      );
    }

    // idle | done | failed
    return (
      <Button size={size} variant="default" onClick={onRun} title={costTitle} className={primaryJoin}>
        <Play aria-hidden />
        Run
      </Button>
    );
  }

  return (
    <div data-slot="run-button" className={cn("inline-flex", className)} {...rest}>
      {primaryButton()}
      {hasMenu && (
        <DropdownMenu>
          {/* Base UI adaptation: DropdownMenuTrigger uses render= prop (not asChild).
              We render a Button element as the trigger's DOM node. */}
          <DropdownMenuTrigger
            // streaming/queued deliberately keep the menu enabled — host may want
            // "Run selection" while another branch streams.
            disabled={status === "locked"}
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
            {onRunFrom && <DropdownMenuItem onClick={onRunFrom}>Run from here</DropdownMenuItem>}
            {onRunSelection && <DropdownMenuItem onClick={onRunSelection}>Run selection</DropdownMenuItem>}
            {onRunAll && <DropdownMenuItem onClick={onRunAll}>Run all</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
