import { cn } from "@/lib/utils";

/**
 * AI Label — The "AI acted here" chip: what AI did to this content, in one word or two.
 *
 * Spec: docs/design-system/component-specs.md#a13-ai-label
 * States: generated · edited · summarized · sender · after-handoff · text-tint
 */
export function AiLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ai-label" className={cn(className)} {...props} />;
}
