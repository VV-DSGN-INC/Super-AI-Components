"use client";

import { Ellipsis } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Agent Presence: an ambient sign that an agent is acting here, with its scope and a one-step takeover.
 *
 * Spec: docs/design-system/component-specs.md#n18-agent-presence
 * States: idle · watching · acting · needs-you · paused · taken-over
 *
 * Two exports, because the cue lives in two places. `AgentPresence` is the chip
 * for app chrome. `AgentPresenceRegion` wraps the tab, frame or panel the agent
 * controls and outlines it; both read the same `state`, which the host owns.
 *
 * There is no variant axis. The six states are what the host reports.
 *
 * Decisions from the spec that tests pin:
 *
 * 1. **Ambient.** Nothing here opens a modal. State changes are announced
 *    politely through one persistent `role="status"` element.
 * 2. **The boundary is text.** `scope` is required and always shown, so what
 *    the agent can see or touch is read, not assumed.
 * 3. **Takeover is one action.** Pause or Resume and Take over share one menu,
 *    each a host callback. `taken-over` says control is back with the person.
 * 4. **`needs-you` draws attention without blocking.** It names the approval in
 *    copy through `need`; the approval itself belongs to `permission-prompt`.
 * 5. **The outline never stands alone.** Style differs by state (solid,
 *    dashed, dotted) and the chip carries the state in words.
 * 6. **No copy says watching prevents harm.** Oversight is not a safeguard.
 * 7. **Motion has a reduced form.** The dot and the region glow pulse; under
 *    `prefers-reduced-motion` the pulse stops and the cue stays.
 *
 * Composition: vendored Badge, Button and dropdown-menu. L3 components never
 * import each other, so `trace-timeline` and `permission-prompt` are reached
 * through the `onOpenSteps` callback and the `need` copy.
 *
 * Surface: the chip sits on `bg-background`; nothing paints muted text over a
 * muted, accent or secondary fill.
 */

export type AgentPresenceState = "idle" | "watching" | "acting" | "needs-you" | "paused" | "taken-over";

export interface AgentPresenceProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** What the agent is doing now. The host owns it; the menu only asks. */
  state: AgentPresenceState;
  /** What the agent can see and use, as a sentence: "Can see and use this tab". */
  scope: string;
  /** Shown in the state sentence. Defaults to "Agent". */
  agentName?: string;
  /** In `needs-you`, what the agent is waiting for: "Approve sending the draft". */
  need?: string;
  /** Pause the agent. The item shows while the agent is watching, acting or blocked. */
  onPause?: () => void;
  /** Let the agent continue. The item shows while paused. */
  onResume?: () => void;
  /** Take control. The item shows whenever the agent is not idle and not already handed over. */
  onTakeOver?: () => void;
  /** Offers a link to the agent's steps, for example a trace timeline. */
  onOpenSteps?: () => void;
}

const REDUCED = "motion-reduce:animate-none";

function sentence(state: AgentPresenceState, name: string): string {
  switch (state) {
    case "idle":
      return `${name} is idle`;
    case "watching":
      return `${name} is watching`;
    case "acting":
      return `${name} is acting`;
    case "needs-you":
      return `${name} needs you`;
    case "paused":
      return `${name} is paused`;
    case "taken-over":
      return "Control is back with you";
  }
}

const DOT: Record<AgentPresenceState, string> = {
  idle: "border border-border",
  watching: "border-2 border-primary",
  acting: cn("bg-primary animate-pulse", REDUCED),
  "needs-you": cn("bg-foreground animate-pulse", REDUCED),
  paused: "bg-muted-foreground",
  "taken-over": "border-2 border-foreground",
};

export function AgentPresence({
  state,
  scope,
  agentName = "Agent",
  need,
  onPause,
  onResume,
  onTakeOver,
  onOpenSteps,
  className,
  ...props
}: AgentPresenceProps) {
  const running = state === "watching" || state === "acting" || state === "needs-you";
  const items = {
    pause: running && onPause,
    resume: state === "paused" && onResume,
    takeOver: state !== "idle" && state !== "taken-over" && onTakeOver,
    steps: onOpenSteps,
  };
  const hasControl = Boolean(items.pause || items.resume || items.takeOver);

  return (
    <div
      data-slot="agent-presence"
      data-state={state}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-background py-1 pe-1 ps-2 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      <span
        role="status"
        data-slot="agent-presence-status"
        className="inline-flex flex-wrap items-center gap-2"
      >
        <Badge variant="outline" data-slot="agent-presence-badge">
          <span
            aria-hidden="true"
            data-slot="agent-presence-dot"
            className={cn("size-2 shrink-0 rounded-full", DOT[state])}
          />
          {sentence(state, agentName)}
        </Badge>
        {state === "needs-you" && need ? (
          <span data-slot="agent-presence-need" className="font-medium">
            {need}
          </span>
        ) : null}
      </span>
      <span data-slot="agent-presence-scope" className="text-muted-foreground">
        {scope}
      </span>
      {hasControl || items.steps ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Agent controls"
                data-slot="agent-presence-menu"
              />
            }
          >
            <Ellipsis aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-auto min-w-44 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
          >
            {items.pause ? <DropdownMenuItem onClick={items.pause}>Pause agent</DropdownMenuItem> : null}
            {items.resume ? <DropdownMenuItem onClick={items.resume}>Resume agent</DropdownMenuItem> : null}
            {items.takeOver ? <DropdownMenuItem onClick={items.takeOver}>Take over</DropdownMenuItem> : null}
            {hasControl && items.steps ? <DropdownMenuSeparator /> : null}
            {items.steps ? <DropdownMenuItem onClick={items.steps}>View agent steps</DropdownMenuItem> : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/** Outline style per state. Differs in line style as well as colour. */
const OUTLINE: Record<AgentPresenceState, string> = {
  idle: "outline-transparent",
  watching: "outline-dashed outline-ring",
  acting: "outline-solid outline-primary",
  "needs-you": cn("outline-solid outline-foreground animate-pulse", REDUCED),
  paused: "outline-dotted outline-border",
  "taken-over": "outline-transparent",
};

export interface AgentPresenceRegionProps extends React.ComponentProps<"div"> {
  /** The same state the chip shows. */
  state: AgentPresenceState;
}

/**
 * Wraps the region the agent controls and outlines it. The outline sits on an
 * inert overlay, so a pulse never fades the content underneath and the overlay
 * never takes a click.
 */
export function AgentPresenceRegion({ state, className, children, ...props }: AgentPresenceRegionProps) {
  return (
    <div
      data-slot="agent-presence-region"
      data-state={state}
      className={cn("relative", className)}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        data-slot="agent-presence-outline"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] outline-2 -outline-offset-2",
          OUTLINE[state],
        )}
      />
    </div>
  );
}
