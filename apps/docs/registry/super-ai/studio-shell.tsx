import { cn } from "@/lib/utils";

/**
 * Studio Shell — Creative studio editor
 *
 * Spec: docs/design-system/block-specs.md#o3-studio-shell
 * States: 
 */
export function StudioShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="studio-shell" className={cn(className)} {...props} />;
}
