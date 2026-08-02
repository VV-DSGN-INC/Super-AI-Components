"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface StatReadoutItem {
  label: React.ReactNode;
  value?: React.ReactNode;
  /** Seed and sampler exist to make a result reproducible — so they must be copyable. */
  copyable?: boolean;
}

interface StatReadoutProps extends React.ComponentProps<"dl"> {
  items: StatReadoutItem[];
  columns?: 1 | 2;
}

function StatReadout({ items, columns = 2, className, ...props }: StatReadoutProps) {
  return (
    <dl
      data-slot="stat-readout"
      className={cn(
        "grid gap-x-4 gap-y-1 text-sm",
        columns === 2 ? "grid-cols-[auto_1fr]" : "grid-cols-1",
        className,
      )}
      {...props}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <dt data-slot="stat-readout-label" className="text-muted-foreground">
            {item.label}
          </dt>
          <dd data-slot="stat-readout-value" className="flex items-center gap-1 font-medium">
            {/* An em-dash, never a blank cell, so the absence reads as deliberate. */}
            {item.value ?? "—"}
            {item.copyable && item.value !== undefined ? <CopyButton value={item.value} /> : null}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function CopyButton({ value }: { value: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label="Copy"
      data-slot="stat-readout-copy"
      onClick={() => {
        void navigator.clipboard?.writeText(String(value));
      }}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-xs focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true">⧉</span>
    </button>
  );
}

export { StatReadout };
export type { StatReadoutItem, StatReadoutProps };
