import { cn } from "@/lib/utils";

/**
 * Home Shell — App Home / launcher
 *
 * Spec: docs/design-system/block-specs.md#o1-home-shell
 * States: 
 */
export function HomeShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="home-shell" className={cn(className)} {...props} />;
}
