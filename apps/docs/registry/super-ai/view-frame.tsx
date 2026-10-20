import { cn } from "@/lib/utils";

/**
 * View Frame — The chrome of a generated view: title, actions, one scrolling body, an ask-bar slot and a footer.
 *
 * Spec: docs/design-system/component-specs.md#r3-view-frame
 * States: docked · page · with-modes · with-ask-bar · rerunning · failed
 */
export function ViewFrame({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="view-frame" className={cn(className)} {...props} />;
}
