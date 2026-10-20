import { cn } from "@/lib/utils";

/**
 * Widget Grid — The container-query grid that places a widget family two or four columns wide.
 *
 * Spec: docs/design-system/component-specs.md#r2-widget-grid
 * States: two-column · four-column · mixed-sizes
 */
export function WidgetGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="widget-grid" className={cn(className)} {...props} />;
}
