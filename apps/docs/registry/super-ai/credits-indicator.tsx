"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type CreditsState = "normal" | "low" | "empty";

interface CreditsIndicatorProps extends Omit<React.ComponentProps<"span">, "onSelect"> {
  balance: number;
  /** Plan allowance. Required for the ring — a ring with no denominator is a circle. */
  total?: number;
  unit?: string;
  form?: "ring" | "counter";
  /** Absolute balance at or below which the state reads `low`. Defaults to 10% of `total`. */
  lowAt?: number;
  /** Plan management. The balance is the link to it — this is the app-level ring of the cost contract. */
  onManage?: () => void;
  onTopUp?: () => void;
}

function creditsState(balance: number, lowAt: number | undefined): CreditsState {
  if (balance <= 0) return "empty";
  // `low` and `empty` are distinct: the useful moment is before zero, and a
  // component that only knows "out of credits" arrives after the decision.
  return lowAt !== undefined && balance <= lowAt ? "low" : "normal";
}

const TONE: Record<CreditsState, string> = {
  normal: "text-foreground",
  low: "text-warning",
  empty: "text-destructive",
};

const RING: Record<CreditsState, string> = {
  normal: "text-primary",
  low: "text-warning",
  empty: "text-destructive",
};

function CreditsIndicator({
  balance,
  total,
  unit = "credits",
  form = "counter",
  lowAt,
  onManage,
  onTopUp,
  className,
  children,
  ...props
}: CreditsIndicatorProps) {
  const threshold = lowAt ?? (total !== undefined ? total * 0.1 : undefined);
  const state = creditsState(balance, threshold);
  const label = `${balance.toLocaleString()} ${unit}`;

  const body = (
    <>
      {form === "ring" && total !== undefined ? (
        <CreditsRing value={balance} max={total} className={RING[state]} />
      ) : null}
      <span data-slot="credits-indicator-balance" dir="ltr" className="tabular-nums">
        {label}
      </span>
    </>
  );

  return (
    <span
      data-slot="credits-indicator"
      data-state={state}
      className={cn(
        "bg-muted inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE[state],
        className,
      )}
      {...props}
    >
      {/* Always clickable through to plan management — never a dead readout.
          Rendered as a sibling of the top-up control, never its parent: a button
          inside a button is invalid and swallows the inner click. */}
      {onManage ? (
        <button
          type="button"
          onClick={onManage}
          data-slot="credits-indicator-trigger"
          aria-label={`${label} — manage plan`}
          className="focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          {body}
        </button>
      ) : (
        body
      )}

      {onTopUp ? (
        <button
          type="button"
          onClick={onTopUp}
          data-slot="credits-indicator-top-up"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring border-border -mr-1 rounded-full border-l pl-1.5 focus-visible:ring-2 focus-visible:outline-none"
        >
          Top up
        </button>
      ) : null}

      {children}
    </span>
  );
}

function CreditsRing({ value, max, className }: { value: number; max: number; className?: string }) {
  const r = 6;
  const circumference = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-3.5 -rotate-90", className)}>
      <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2.5" className="stroke-border" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
      />
    </svg>
  );
}

export { CreditsIndicator, creditsState };
export type { CreditsIndicatorProps, CreditsState };
