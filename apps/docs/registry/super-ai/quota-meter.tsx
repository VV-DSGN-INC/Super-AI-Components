import * as React from "react";

import { cn } from "@/lib/utils";

type QuotaState = "normal" | "near-limit" | "over-limit";

interface QuotaMeterResource {
  label: React.ReactNode;
  used: number;
  limit: number;
  unit?: string;
  /**
   * Preformatted, e.g. "Resets in 3 days". Not a Date: formatting a countdown at
   * render time differs between server and client and desyncs hydration, and this
   * registry ships UI only — the host owns the clock.
   */
  resetsIn?: React.ReactNode;
}

interface QuotaMeterProps extends React.ComponentProps<"div"> {
  resources: QuotaMeterResource[];
  /** Ratio at which a resource starts reading as near-limit. */
  nearLimitAt?: number;
  /** Sidebar variant: same rows, tighter type, no reset line. */
  compact?: boolean;
}

/**
 * The useful moment is before zero, so `near-limit` is a state of its own rather
 * than a shade of normal. Over-limit is distinct again: a plan you have already
 * exceeded is not a plan you are about to exceed.
 */
function quotaState(used: number, limit: number, nearLimitAt: number): QuotaState {
  if (limit <= 0 || used >= limit) return "over-limit";
  return used / limit >= nearLimitAt ? "near-limit" : "normal";
}

const BAR: Record<QuotaState, string> = {
  normal: "bg-primary",
  "near-limit": "bg-warning",
  "over-limit": "bg-destructive",
};

const VALUE: Record<QuotaState, string> = {
  normal: "text-muted-foreground",
  "near-limit": "text-warning",
  "over-limit": "text-destructive",
};

function QuotaMeter({ resources, nearLimitAt = 0.8, compact = false, className, ...props }: QuotaMeterProps) {
  // Names each track from the row's own visible label. `aria-valuetext` carried the
  // numbers but nothing said *what* was being measured, so every track announced as
  // an unnamed progressbar (axe `aria-progressbar-name`, serious). Pointing at the
  // label rather than duplicating it into an `aria-label` keeps the two in step.
  const labelBaseId = React.useId();

  return (
    <div
      data-slot="quota-meter"
      className={cn("flex flex-col", compact ? "gap-2.5" : "gap-4", className)}
      {...props}
    >
      {/* Per-resource rows, never one aggregate: an aggregate hides the one you'll hit. */}
      {resources.map((resource, i) => {
        const { label, used, limit, unit, resetsIn } = resource;
        const state = quotaState(used, limit, nearLimitAt);
        // The bar clamps; the numbers do not. Over-limit still reports the real overage.
        const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 100;

        return (
          <div key={i} data-slot="quota-meter-row" data-state={state} className="flex flex-col gap-1.5">
            <div className={cn("flex items-baseline justify-between gap-3", compact && "text-xs")}>
              <span
                id={`${labelBaseId}-${i}`}
                data-slot="quota-meter-label"
                className={cn(!compact && "text-sm", "font-medium")}
              >
                {label}
              </span>
              <span
                data-slot="quota-meter-value"
                dir="ltr"
                className={cn("tabular-nums", compact ? "text-xs" : "text-sm", VALUE[state])}
              >
                {used.toLocaleString()} / {limit.toLocaleString()}
                {unit ? ` ${unit}` : null}
              </span>
            </div>

            <div
              data-slot="quota-meter-track"
              role="progressbar"
              aria-labelledby={`${labelBaseId}-${i}`}
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuetext={`${used} of ${limit}${unit ? ` ${unit}` : ""} used`}
              className={cn("bg-muted w-full overflow-hidden rounded-full", compact ? "h-1" : "h-1.5")}
            >
              <div
                data-slot="quota-meter-bar"
                style={{ width: `${percent}%` }}
                className={cn("h-full rounded-full transition-[width]", BAR[state])}
              />
            </div>

            {/* The countdown changes the decision more than the raw number does, so it
                survives into the row rather than living in a tooltip. */}
            {resetsIn && !compact ? (
              <span data-slot="quota-meter-reset" className="text-muted-foreground text-xs">
                {resetsIn}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export { QuotaMeter, quotaState };
export type { QuotaMeterProps, QuotaMeterResource, QuotaState };
