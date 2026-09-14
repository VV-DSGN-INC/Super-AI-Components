import { cn } from "@/lib/utils";

/**
 * Connection Hint — The mini palette shown when a connection is dropped on empty canvas, and the port chips that list what a node accepts and emits.
 *
 * Spec: docs/design-system/component-specs.md#g12-connection-hint
 * States: with-matches · no-matches · chips
 */
export function ConnectionHint({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="connection-hint" className={cn(className)} {...props} />;
}
