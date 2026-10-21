import { cn } from "@/lib/utils";

/**
 * Memory Manager — What the AI remembers about a person, with scope, edit, delete and reset.
 *
 * Spec: docs/design-system/component-specs.md#n17-memory-manager
 * States: empty · populated · scoped · just-saved · editing · memory-off · reset-confirm
 */
export function MemoryManager({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="memory-manager" className={cn(className)} {...props} />;
}
