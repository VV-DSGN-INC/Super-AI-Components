import { cn } from "@/lib/utils";

/**
 * Node Status — The badge and ring map for the six-status contract: a dot or spinner, a label, and the class a node card paints for each status.
 *
 * Spec: docs/design-system/component-specs.md#g11-node-status
 * States: idle · queued · streaming · done · failed · locked · compact
 */
export function NodeStatus({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="node-status" className={cn(className)} {...props} />;
}
