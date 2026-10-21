import { cn } from "@/lib/utils";

/**
 * Prompt Template Form — A fill-in-the-blank prompt template with a live preview of what will be sent.
 *
 * Spec: docs/design-system/component-specs.md#d9-prompt-template-form
 * States: empty · partially-filled · complete · with-defaults · missing-required · multi-step
 */
export function PromptTemplateForm({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="prompt-template-form" className={cn(className)} {...props} />;
}
