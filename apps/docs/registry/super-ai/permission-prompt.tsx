import { cn } from "@/lib/utils";

/**
 * Permission Prompt — Agent asks before a side effect
 *
 * Spec: docs/design-system/component-specs.md#n8-permission-prompt
 * States: allow-once · always-allow · deny · edit-first
 */
export function PermissionPrompt({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="permission-prompt" className={cn(className)} {...props} />;
}
