import { cn } from "@/lib/utils";

/**
 * Data Controls — Training and retention as separate, explained controls with the default stated in the UI.
 *
 * Spec: docs/design-system/component-specs.md#n14-data-controls
 * States: training-on · training-off · retention · plan-locked · none-collected · admin-managed
 */
export function DataControls({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="data-controls" className={cn(className)} {...props} />;
}
