import { cn } from "@/lib/utils";

/**
 * Env Status — Per-provider reachability
 *
 * Spec: docs/design-system/component-specs.md#n7-env-status
 * States: ok · degraded · key-invalid · not-running
 */
export function EnvStatus({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="env-status" className={cn(className)} {...props} />;
}
