"use client";
import * as React from "react";

import { cn } from "@/lib/utils";
import { getHandleType } from "@/registry/super-ai/flow-types";

/**
 * Connection Hint — The mini palette shown when a connection is dropped on empty canvas, plus PortChips
 *
 * Spec: docs/design-system/component-specs.md#g12-connection-hint
 * States: with-matches · no-matches · chips
 */

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

function TypeDot({ type }: { type: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 rounded-full"
      style={{ background: `var(${getHandleType(type)?.cssVar ?? "--flow-text"})` }}
    />
  );
}

export interface ConnectionHintProps extends Omit<React.ComponentProps<"div">, "children"> {
  dataType: string;
  catalog: NodeCatalogEntry[];
  /** Canvas coordinates of the drop; the host container must be positioned. */
  position: { x: number; y: number };
  onPick: (kind: string) => void;
  onDismiss?: () => void;
}

/**
 * The host wires react-flow's `onConnectEnd` to render this at the event
 * position when the connection was not dropped on a valid target. Focus lands
 * on the first option on mount; Escape calls `onDismiss` so the host unmounts it.
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
      className={cn("bg-popover absolute z-50 min-w-40 rounded-lg border p-2 shadow-md", className)}
      style={{ left: position.x, top: position.y, ...style }}
      {...props}
    >
      <p id={headingId} className="text-muted-foreground mb-1.5 px-1 text-xs">
        Add compatible node
      </p>
      {matches.length === 0 ? (
        <p className="text-muted-foreground px-1 text-xs">No compatible nodes</p>
      ) : (
        matches.map((entry, i) => (
          <button
            key={entry.kind}
            type="button"
            autoFocus={i === 0}
            data-slot="connection-hint-option"
            onClick={() => onPick(entry.kind)}
            className="hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex items-center gap-0.5">
              {entry.in.map((t) => (
                <TypeDot key={t} type={t} />
              ))}
            </span>
            {entry.label}
          </button>
        ))
      )}
    </div>
  );
}

function ChipRow({
  label,
  types,
  satisfied,
}: {
  label: "IN" | "OUT";
  types: string[];
  satisfied?: string[];
}) {
  if (!types.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {types.map((t) => {
        const def = getHandleType(t);
        const ok = satisfied?.includes(t) ?? false;
        return (
          <span
            key={t}
            data-slot="port-chip"
            data-satisfied={ok}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
              ok ? "bg-secondary border-transparent" : "opacity-70",
            )}
          >
            <TypeDot type={t} />
            {def?.label ?? t}
          </span>
        );
      })}
    </div>
  );
}

export interface PortChipsProps extends Omit<React.ComponentProps<"div">, "children"> {
  in?: string[];
  out?: string[];
  /** Types whose ports are currently connected; every chip carries data-satisfied="true" or "false". */
  satisfied?: string[];
}

/** IN / OUT chips for a node kind, for palettes and inspectors. Select satisfied chips with `[data-satisfied="true"]`. */
export function PortChips({ in: ins = [], out = [], satisfied, className, ...props }: PortChipsProps) {
  return (
    <div data-slot="port-chips" className={cn("flex flex-col gap-1", className)} {...props}>
      <ChipRow label="IN" types={ins} satisfied={satisfied} />
      <ChipRow label="OUT" types={out} satisfied={satisfied} />
    </div>
  );
}
