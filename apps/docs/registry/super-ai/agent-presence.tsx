import { cn } from "@/lib/utils";

/**
 * Agent Presence — An ambient sign that an agent is acting here, with its scope and a one-step takeover.
 *
 * Spec: docs/design-system/component-specs.md#n18-agent-presence
 * States: idle · watching · acting · needs-you · paused · taken-over
 */
export function AgentPresence({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="agent-presence" className={cn(className)} {...props} />;
}
