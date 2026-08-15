import { Coins } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface CostChipProps extends React.ComponentProps<"span"> {
  amount: number | string;
  unit?: string;
}

function CostChip({ amount, unit = "credits", className, children, ...props }: CostChipProps) {
  return (
    <span
      data-slot="cost-chip"
      // `text-foreground` on `bg-muted`, not `text-muted-foreground`: the muted
      // pairing measures 4.34:1 against the 4.5:1 minimum (a11y-baseline.md).
      // Every call site in the registry already overrode it to exactly this, so
      // this is the shipped appearance being promoted to the default, not a new
      // look — and those overrides are deleted with this change.
      // The rebind covers the trailing slot: this chip paints `bg-muted` and
      // renders caller-supplied children on it, and a slot-level override
      // cannot reach a child that carries its own `text-muted-foreground`
      // (a11y-baseline.md). Same pairing as docs-shell / studio-shell.
      className={cn(
        "bg-muted text-foreground [--muted-foreground:var(--accent-foreground)] inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        className,
      )}
      {...props}
    >
      <Coins aria-hidden className="size-3" />
      <span data-slot="cost-chip-amount" dir="ltr">
        {amount} {unit}
      </span>
      {children}
    </span>
  );
}

export { CostChip };
