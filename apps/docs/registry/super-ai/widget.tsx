import { cn } from "@/lib/utils";

/**
 * Widget — A fixed-size tile in three size families, for one fact among same-sized siblings.
 *
 * Spec: docs/design-system/component-specs.md#r1-widget
 * States: small · medium · large · loading · openable · header-hidden
 */
export function Widget({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="widget" className={cn(className)} {...props} />;
}
