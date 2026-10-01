"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The notifications control a host puts beside its account menu. Demo-only: the
 * registry ships no notifications component, and every shell with an account
 * slot takes this in that same slot, which is why no shell has a
 * `notifications` prop (shell fidelity spec, section 4).
 */
export function DemoNotifications({ unread = 2 }: { unread?: number }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative"
    >
      <Bell aria-hidden />
      {unread > 0 ? (
        <span aria-hidden className="bg-primary absolute end-1 top-1 size-1.5 rounded-full" />
      ) : null}
    </Button>
  );
}
