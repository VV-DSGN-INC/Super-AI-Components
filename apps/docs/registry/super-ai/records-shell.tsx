import { cn } from "@/lib/utils";

/**
 * Records Shell — Project / scenario list
 *
 * Spec: docs/design-system/block-specs.md#o10-records-shell
 * States: 
 */
export function RecordsShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="records-shell" className={cn(className)} {...props} />;
}
