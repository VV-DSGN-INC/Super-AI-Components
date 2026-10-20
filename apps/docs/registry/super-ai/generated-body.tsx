import { cn } from "@/lib/utils";

/**
 * Generated Body — The body of a view written as an OpenUI program: streamed, with the last good version kept when a new one fails.
 *
 * Spec: docs/design-system/component-specs.md#r4-generated-body
 * States: streaming · rendered · failed-with-fallback · failed-without-fallback
 */
export function GeneratedBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="generated-body" className={cn(className)} {...props} />;
}
