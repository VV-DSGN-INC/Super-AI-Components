import { cn } from "@/lib/utils";

/**
 * Trace Timeline — Waterfall of steps / tool calls / LLM calls
 *
 * Spec: docs/design-system/component-specs.md#n4-trace-timeline
 * States: collapsed · expanded · errored · retry-siblings
 */
export function TraceTimeline({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="trace-timeline" className={cn(className)} {...props} />;
}
