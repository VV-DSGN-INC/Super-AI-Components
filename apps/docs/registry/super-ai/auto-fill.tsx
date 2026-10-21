import { cn } from "@/lib/utils";

/**
 * Auto Fill — One prompt across many fields, previewed on a few records before it writes anything.
 *
 * Spec: docs/design-system/component-specs.md#p3-auto-fill
 * States: configuring · sample-preview · applying · suggested · accepted · overridden · failed
 */
export function AutoFill({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="auto-fill" className={cn(className)} {...props} />;
}
