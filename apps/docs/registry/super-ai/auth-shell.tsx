import { cn } from "@/lib/utils";

/**
 * Auth Shell — Sign in / sign up
 *
 * Spec: docs/design-system/block-specs.md#o14-auth-shell
 * States: 
 */
export function AuthShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="auth-shell" className={cn(className)} {...props} />;
}
