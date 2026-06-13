"use client";

import { Eye, ShieldAlert } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GuardrailEvent } from "./agent-types";

interface RefusalCardProps extends React.ComponentProps<"div"> {
  event: GuardrailEvent;
  onEscalate?: (id: string) => void;
  onRequestOverride?: (id: string) => void;
}

// Renders the "refusal" guardrail kind. System-level states (degraded/sandbox/filter)
// are safety-banner's job — see the Human Oversight & Reliability pattern page.
function RefusalCard({ event, onEscalate, onRequestOverride, className, ...props }: RefusalCardProps) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div
      data-slot="refusal-card"
      data-kind={event.kind}
      role="alert"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-destructive/50 bg-card p-4 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-destructive" aria-hidden />
        <p className="text-sm font-medium">Action blocked by guardrail</p>
      </div>
      {event.blocked && <p className="text-sm">{event.blocked}</p>}
      <p className="text-xs text-muted-foreground">
        Policy: <span className="rounded-sm bg-muted px-1 py-0.5 font-mono text-foreground">{event.policy}</span>
      </p>
      {event.preview &&
        (revealed ? (
          <p className="rounded-md border bg-background p-2 text-xs text-muted-foreground">{event.preview}</p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            aria-label="Show blocked content"
            onClick={() => setRevealed(true)}
          >
            <Eye className="size-3.5" aria-hidden />
            Show blocked content
          </Button>
        ))}
      {(onEscalate || onRequestOverride) && (
        <div className="flex justify-end gap-2">
          {onRequestOverride && (
            <Button type="button" variant="outline" size="sm" aria-label="Request override" onClick={() => onRequestOverride(event.id)}>
              Request override
            </Button>
          )}
          {onEscalate && (
            <Button type="button" size="sm" aria-label="Escalate to a human" onClick={() => onEscalate(event.id)}>
              Escalate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { RefusalCard };
export type { RefusalCardProps };
