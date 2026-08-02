"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  count?: number;
  /** "View all" — a link, never a button. It navigates, it does not act. */
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: "default" | "sm";
}

function SectionHeader({
  title,
  count,
  action,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  size = "default",
  className,
  ...props
}: SectionHeaderProps) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internal;

  const toggle = () => {
    const next = !open;
    if (!controlled) setInternal(next);
    onOpenChange?.(next);
  };

  const label = (
    <>
      <span data-slot="section-header-title" className="truncate">
        {title}
      </span>
      {count !== undefined ? (
        <span data-slot="section-header-count" className="text-muted-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </>
  );

  return (
    <div
      data-slot="section-header"
      data-state={collapsible ? (open ? "open" : "closed") : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2",
        size === "sm"
          ? "text-muted-foreground py-1 text-xs font-medium tracking-wide uppercase"
          : "py-2 text-sm font-semibold",
        className,
      )}
      {...props}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          data-slot="section-header-trigger"
          className="focus-visible:ring-ring flex min-w-0 items-center gap-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          {label}
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-2">{label}</span>
      )}
      {action ? (
        <span data-slot="section-header-action" className="shrink-0 text-sm font-normal">
          {action}
        </span>
      ) : null}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };
