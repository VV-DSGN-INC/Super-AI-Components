import { cn } from "@/lib/utils";

/**
 * Docs Shell — Documentation
 *
 * Spec: docs/design-system/block-specs.md#o11-docs-shell
 * States: 
 */
export function DocsShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="docs-shell" className={cn(className)} {...props} />;
}
