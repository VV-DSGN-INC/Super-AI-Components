import { cn } from "@/lib/utils";

/**
 * Usage Dashboard — Aggregate cost / token / latency
 *
 * Spec: docs/design-system/component-specs.md#n6-usage-dashboard
 * States: period-select · summary-cards · model-breakdown
 */
export function UsageDashboard({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="usage-dashboard" className={cn(className)} {...props} />;
}
