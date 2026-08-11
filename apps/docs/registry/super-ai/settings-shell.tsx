import { cn } from "@/lib/utils";

/**
 * Settings Shell — Full-page settings
 *
 * Spec: docs/design-system/block-specs.md#o12-settings-shell
 * States: 
 */
export function SettingsShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="settings-shell" className={cn(className)} {...props} />;
}
