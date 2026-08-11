import { cn } from "@/lib/utils";

/**
 * Generation Shell — Single-purpose tool app
 *
 * Spec: docs/design-system/block-specs.md#o6-generation-shell
 * States: 
 */
export function GenerationShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="generation-shell" className={cn(className)} {...props} />;
}
