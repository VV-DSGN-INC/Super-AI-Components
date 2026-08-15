"use client";

import { AlertTriangle, Pencil } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** How a value got into the frame. The Dialog contract's `sourced slots` obligation. */
type SlotSource = "stated" | "inferred" | "defaulted" | "retrieved";

/** Bands, not percentages — see D17 on why this is not yet a shared primitive. */
type SlotConfidence = "high" | "medium" | "low";

interface Slot {
  id: string;
  label: React.ReactNode;
  /** Absent + `required` renders as a visible ask, never as a missing row. */
  value?: React.ReactNode;
  source: SlotSource;
  confidence?: SlotConfidence;
  required?: boolean;
}

interface SlotSummaryProps extends React.ComponentProps<"div"> {
  slots: Slot[];
  /** Correction happens on the slot it corrects, and never restarts the flow. */
  onCorrect?: (id: string) => void;
  /** States the consequence — "Cancel these 3 orders", not "Confirm". */
  confirmLabel?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// `stated` is deliberately unmarked: it is the quiet default, and marking
// everything is the same as marking nothing. The other three earn a badge
// because the user did not supply them.
const SOURCE_BADGE: Record<SlotSource, string | null> = {
  stated: null,
  inferred: "Inferred",
  defaulted: "Default",
  retrieved: "From records",
};

function SlotSummary({
  slots,
  onCorrect,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  className,
  ...props
}: SlotSummaryProps) {
  const missing = slots.filter((s) => s.required && s.value == null);

  return (
    <div
      data-slot="slot-summary"
      className={cn("border-border flex flex-col gap-3 rounded-lg border p-3", className)}
      {...props}
    >
      <ul className="flex flex-col">
        {slots.map((slot) => {
          const isMissing = slot.value == null;
          const badge = SOURCE_BADGE[slot.source];
          return (
            <li
              key={slot.id}
              data-slot="slot-summary-slot"
              data-source={slot.source}
              data-missing={isMissing ? "" : undefined}
              className="flex min-h-9 items-center gap-3 py-1"
            >
              <span className="text-muted-foreground w-32 shrink-0 text-xs">{slot.label}</span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {isMissing ? (
                  <span className="text-muted-foreground text-sm italic">
                    {slot.required ? "Still needed" : "Not set"}
                  </span>
                ) : (
                  <span className="truncate text-sm">{slot.value}</span>
                )}
                {badge && !isMissing ? (
                  <Badge variant="outline" className="text-[0.6875rem]">
                    {badge}
                  </Badge>
                ) : null}
                {slot.confidence === "low" && !isMissing ? (
                  // Badge's own destructive tint (bg-destructive/10
                  // text-destructive) measures 4.0:1 and fails the gate; going
                  // solid is the substitution a11y-baseline.md prescribes and
                  // generation-queue/tts-composer already carry.
                  <Badge variant="destructive" className="bg-destructive text-background text-[0.6875rem]">
                    <AlertTriangle />
                    Check this
                  </Badge>
                ) : null}
              </span>
              {onCorrect ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={isMissing ? `Add ${slot.label}` : `Change ${slot.label}`}
                  onClick={() => onCorrect(slot.id)}
                >
                  <Pencil />
                  {isMissing ? "Add" : "Change"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {onConfirm || onCancel ? (
        <div className="flex items-center gap-2">
          {onConfirm ? (
            <Button
              type="button"
              onClick={onConfirm}
              // Blocked while a required slot is empty: acting on a partial
              // frame is the failure this whole surface exists to prevent.
              disabled={missing.length > 0}
            >
              {confirmLabel}
            </Button>
          ) : null}
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          {missing.length > 0 ? (
            <span data-slot="slot-summary-blocked" className="text-muted-foreground text-xs">
              {missing.length} still needed
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { SlotSummary };
export type { Slot, SlotConfidence, SlotSource, SlotSummaryProps };
