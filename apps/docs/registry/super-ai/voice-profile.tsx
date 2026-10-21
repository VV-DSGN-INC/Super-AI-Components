import { cn } from "@/lib/utils";

/**
 * Voice Profile — Saved rules for how output sounds, with the active voice shown at the input.
 *
 * Spec: docs/design-system/component-specs.md#e11-voice-profile
 * States: none · preset · custom · editing · scoped · conflict · reset
 */
export function VoiceProfile({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="voice-profile" className={cn(className)} {...props} />;
}
