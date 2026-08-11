"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useContainerWidth } from "@/registry/super-ai/use-container-width";

export interface DetailField {
  id: string;
  label: string;
  value: ReactNode;
}

export interface DetailFieldsProps {
  fields: DetailField[];
  className?: string;
}

/** Two label/value pairs need roughly this much room before they stop crushing. */
const TWO_COLUMN_THRESHOLD = 460;

/* ─────────────────────────────────────────────────────────────────────────────
   DetailFields — the nested collapse.

   The pane-level collapse turns two columns into one; this one turns two
   label/value PAIRS per row into one. Without it the left column keeps a fixed
   grid while everything around it responds, which is the half-done state the
   reference tools avoid.

   It measures itself rather than taking a size prop, so a caller cannot forget
   to thread it — and it stays a <dl> in both layouts, because the collapse is
   presentation and the term/definition relationship is not.
   ─────────────────────────────────────────────────────────────────────────── */
export function DetailFields({ fields, className }: DetailFieldsProps) {
  const [ref, size] = useContainerWidth<HTMLDListElement>(TWO_COLUMN_THRESHOLD);

  if (fields.length === 0) return null;

  const columns = size === "wide" ? 2 : 1;

  return (
    <dl
      ref={ref}
      data-slot="detail-fields"
      data-columns={columns}
      className={cn(
        "grid gap-x-4 gap-y-1.5 text-sm",
        columns === 2 ? "grid-cols-[8rem_1fr_8rem_1fr]" : "grid-cols-[8rem_1fr]",
        className,
      )}
    >
      {fields.map((field) => (
        <div key={field.id} className="contents">
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="min-w-0">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
