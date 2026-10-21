import { cn } from "@/lib/utils";

/**
 * Summary Card — A labelled summary of a named source at a chosen depth, linked back to it.
 *
 * Spec: docs/design-system/component-specs.md#k9-summary-card
 * States: generating · ready · attributed · quote-and-condense · collapsed · turned-off
 */
export function SummaryCard({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="summary-card" className={cn(className)} {...props} />;
}
