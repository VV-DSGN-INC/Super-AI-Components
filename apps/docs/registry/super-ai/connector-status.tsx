"use client";

import { CircleAlert, CircleCheck, KeyRound, Plug } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ConnectorHealth, ConnectorState } from "./agent-types";

const HEALTH_ICON: Record<ConnectorHealth, React.ReactNode> = {
  connected: <CircleCheck className="size-3 text-primary" aria-hidden />,
  "auth-needed": <KeyRound className="size-3 text-muted-foreground" aria-hidden />,
  error: <CircleAlert className="size-3 text-destructive" aria-hidden />,
};

interface ConnectorStatusProps extends React.ComponentProps<"div"> {
  connectors: ConnectorState[];
  onConnectorSelect?: (id: string) => void;
}

function ConnectorStatus({ connectors, onConnectorSelect, className, ...props }: ConnectorStatusProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (connectors.length === 0) {
    return (
      <div
        data-slot="connector-status"
        className={cn("rounded-lg border bg-card p-4 text-sm text-muted-foreground", className)}
        {...props}
      >
        No connectors configured.
      </div>
    );
  }

  const open = connectors.find((c) => c.id === openId);

  return (
    <div data-slot="connector-status" className={cn("flex flex-col gap-1.5", className)} {...props}>
      <div className="flex flex-wrap items-center gap-1.5">
        {connectors.map((c) => (
          <button
            key={c.id}
            type="button"
            data-slot="connector-chip"
            data-health={c.health}
            aria-expanded={openId === c.id}
            aria-label={`Toggle detail for ${c.name}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent",
              openId === c.id && "bg-accent",
            )}
            onClick={() => setOpenId((cur) => (cur === c.id ? null : c.id))}
          >
            <Plug className="size-3 text-muted-foreground" aria-hidden />
            <span className="font-mono">{c.name}</span>
            {HEALTH_ICON[c.health]}
          </button>
        ))}
      </div>
      {open && (
        <div data-slot="connector-detail" className="flex items-center justify-between rounded-md border bg-card p-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{open.health}</span>
            {open.toolCount !== undefined && <span>{`${open.toolCount} tools`}</span>}
            {open.latencyMs !== undefined && <span className="tabular-nums">{`${open.latencyMs}ms`}</span>}
          </div>
          {onConnectorSelect && (
            <Button type="button" variant="ghost" size="sm" aria-label={`Open ${open.name}`} onClick={() => onConnectorSelect(open.id)}>
              Open
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { ConnectorStatus };
export type { ConnectorStatusProps };
