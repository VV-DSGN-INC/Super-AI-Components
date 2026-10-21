import { cn } from "@/lib/utils";

/**
 * Content Credentials — The provenance panel behind an AI label: model, time, edits, publisher, and whether it verifies.
 *
 * Spec: docs/design-system/component-specs.md#n16-content-credentials
 * States: verified · unverified · stripped · ai-generated · ai-edited · with-history
 */
export function ContentCredentials({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="content-credentials" className={cn(className)} {...props} />;
}
