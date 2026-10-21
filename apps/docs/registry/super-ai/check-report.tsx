import { cn } from "@/lib/utils";

/**
 * Check Report — The output checks' verdict per rule, with the fallback stated.
 *
 * Spec: docs/design-system/component-specs.md#r3-check-report
 * States: all-pass · some-fail
 */
export function CheckReport({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="check-report" className={cn(className)} {...props} />;
}
