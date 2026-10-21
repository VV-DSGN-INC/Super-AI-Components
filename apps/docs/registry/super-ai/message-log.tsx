import { cn } from "@/lib/utils";

/**
 * Message Log — The append-only trace of one message, one sentence per event.
 *
 * Spec: docs/design-system/component-specs.md#r2-message-log
 * States: empty · populated
 */
export function MessageLog({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="message-log" className={cn(className)} {...props} />;
}
