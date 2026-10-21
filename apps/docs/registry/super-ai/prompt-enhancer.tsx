import { cn } from "@/lib/utils";

/**
 * Prompt Enhancer — Shows a rewrite of the prompt beside the original before anything runs.
 *
 * Spec: docs/design-system/component-specs.md#d8-prompt-enhancer
 * States: idle · enhancing · suggested · accepted · reverted · failed
 */
export function PromptEnhancer({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="prompt-enhancer" className={cn(className)} {...props} />;
}
