import { cn } from "@/lib/utils";

/**
 * Library Shell — Personal archive
 *
 * Spec: docs/design-system/block-specs.md#o7-library-shell
 * States: 
 */
export function LibraryShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="library-shell" className={cn(className)} {...props} />;
}
