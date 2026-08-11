import { cn } from "@/lib/utils";

/**
 * Explore Shell — Community gallery
 *
 * Spec: docs/design-system/block-specs.md#o8-explore-shell
 * States: 
 */
export function ExploreShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="explore-shell" className={cn(className)} {...props} />;
}
