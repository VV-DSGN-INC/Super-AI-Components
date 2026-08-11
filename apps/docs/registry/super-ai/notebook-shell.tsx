import { cn } from "@/lib/utils";

/**
 * Notebook Shell — Three-pane sources ‖ chat ‖ outputs
 *
 * Spec: docs/design-system/block-specs.md#o13-notebook-shell
 * States: 
 */
export function NotebookShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="notebook-shell" className={cn(className)} {...props} />;
}
