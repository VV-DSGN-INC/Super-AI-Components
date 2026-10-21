import { cn } from "@/lib/utils";

/**
 * Capture Consent — Consent gate before AI capture starts, and the indicator while it runs.
 *
 * Spec: docs/design-system/component-specs.md#n13-capture-consent
 * States: pre-notice · recording · others-notified · declined · ended
 */
export function CaptureConsent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="capture-consent" className={cn(className)} {...props} />;
}
