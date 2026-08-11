import { cn } from "@/lib/utils";

/**
 * Artifact Shell — Artifact / document index
 *
 * Spec: docs/design-system/block-specs.md#o9-artifact-shell
 * States: 
 */
export function ArtifactShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="artifact-shell" className={cn(className)} {...props} />;
}
