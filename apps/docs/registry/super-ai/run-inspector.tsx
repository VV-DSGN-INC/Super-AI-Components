import { cn } from "@/lib/utils";

/**
 * Run Inspector — Span detail: I/O, tokens, cost, errors
 *
 * Spec: docs/design-system/component-specs.md#n5-run-inspector
 * States: input-tab · output-tab · metadata-tab · error-tab
 */
export function RunInspector({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="run-inspector" className={cn(className)} {...props} />;
}
