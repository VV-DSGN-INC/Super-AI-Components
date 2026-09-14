import { cn } from "@/lib/utils";

/**
 * AI Node — One node card: header with status, media and body slots, a footer or floating settings menu, and the locked and failed states.
 *
 * Spec: docs/design-system/component-specs.md#g2-ai-node
 * States: idle · queued · streaming · done · failed · locked · selected · menu-floating
 */
export function AiNode({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ai-node" className={cn(className)} {...props} />;
}
