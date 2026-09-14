import { cn } from "@/lib/utils";

/**
 * Typed Handle — A react-flow port that encodes its data type in the handle id, paints the type colour, and refuses connections of another type.
 *
 * Spec: docs/design-system/component-specs.md#g3-typed-handle
 * States: input · output · stacked · compatible · unregistered-type
 */
export function TypedHandle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="typed-handle" className={cn(className)} {...props} />;
}
