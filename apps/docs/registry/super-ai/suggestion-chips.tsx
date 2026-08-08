import { cn } from "@/lib/utils";

/**
 * Suggestion Chips — Task starter chips
 *
 * Spec: docs/design-system/component-specs.md#c2-suggestion-chips
 * States: plain · with-icon · with-thumbnail · overflow-link
 */
export function SuggestionChips({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="suggestion-chips" className={cn(className)} {...props} />;
}
