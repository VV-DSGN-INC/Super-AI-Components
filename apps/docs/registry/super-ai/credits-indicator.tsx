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

// The alarm states colour the *surface*, not the text. `text-destructive` on this
// pill's own `bg-muted` measures 4.37:1 and `text-warning` is lighter still — neither
// can reach 4.5:1 as foreground on a near-white fill, at any size. Going solid is the
// move a11y-baseline.md already prescribes for the destructive-tint failure, and it
// reads better anyway: an out-of-credits pill should look like an alarm, not like a
// normal pill wearing red text.
const SURFACE: Record<CreditsState, string> = {
  normal: "bg-muted text-foreground",
  low: "bg-warning text-warning-foreground",
  empty: "bg-destructive text-background",
};

// The ring rides on the surface, so it takes that surface's foreground rather than
// its own tint — a destructive-red stroke on a destructive-red fill is invisible.
const RING: Record<CreditsState, string> = {
  normal: "text-primary",
  low: "text-warning-foreground",
  empty: "text-background",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        SURFACE[state],
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
          // Inherits the pill's foreground instead of setting `text-muted-foreground`:
          // muted text on this pill's own `bg-muted` is the 4.34:1 pairing, and on the
          // solid alarm surfaces it would be wrong twice over. The border-l already
          // separates it from the balance, so hover is carried by an underline rather
          // than by a colour change that would have to be re-solved per surface.
          className="focus-visible:ring-ring border-border -mr-1 rounded-full border-l pl-1.5 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
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
