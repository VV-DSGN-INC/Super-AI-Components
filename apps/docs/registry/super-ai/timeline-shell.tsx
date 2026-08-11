import { cn } from "@/lib/utils";

/**
 * Timeline Shell — Timeline-dominant editor (variant of O3)
 *
 * Spec: docs/design-system/block-specs.md#o4-timeline-shell
 * States: 
 */
export function TimelineShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline-shell" className={cn(className)} {...props} />;
}
