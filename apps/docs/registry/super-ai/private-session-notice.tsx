import { cn } from "@/lib/utils";

/**
 * Private Session Notice — Incognito mode: the fixed statement, the persistent chip, and what is switched off.
 *
 * Spec: docs/design-system/component-specs.md#n15-private-session-notice
 * States: entering · active · connectors-reduced · exiting · unavailable
 */
export function PrivateSessionNotice({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="private-session-notice" className={cn(className)} {...props} />;
}
