import { cn } from "@/lib/utils";

/**
 * Typed Edge — A react-flow edge whose stroke colour derives from its source port's type, thicker when selected, dashed and moving while streaming.
 *
 * Spec: docs/design-system/component-specs.md#g10-typed-edge
 * States: type-coloured · selected · streaming
 */
export function TypedEdge({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="typed-edge" className={cn(className)} {...props} />;
}
