import { cn } from "@/lib/utils";

/**
 * Trust Dialog — Confirm running third-party content
 *
 * Spec: docs/design-system/component-specs.md#n2-trust-dialog
 * States: preview · warning · trust-checkbox · account-picker
 */
export function TrustDialog({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="trust-dialog" className={cn(className)} {...props} />;
}
