import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * View Frame — The chrome of a generated view: title, actions, one scrolling body, an ask-bar slot and a footer.
 *
 * Spec: docs/design-system/component-specs.md#r3-view-frame
 * States: docked · page · with-modes · with-ask-bar · rerunning · failed
 *
 * The frame is fixed; only the body is generated. It owns no view logic: mode
 * tabs, Undo, Rerun, Pin and Close are children the caller renders inside
 * `ViewFrameActions`, and the rerunning skeleton and the failed alert live
 * inside `ViewFrameContent`. The states `docked` and `page` differ only in the
 * container the caller gives the frame, which fills it (`h-full`).
 */

export type ViewFrameProps = Omit<React.ComponentProps<"section">, "title"> & {
  /**
   * Names the section for assistive technology. Not rendered: draw the visible
   * heading with `ViewFrameTitle`. A caller's `aria-labelledby` wins over it.
   */
  title?: string;
};

export function ViewFrame({ className, title, "aria-labelledby": labelledBy, ...props }: ViewFrameProps) {
  return (
    <section
      data-slot="view-frame"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : title}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    />
  );
}

export function ViewFrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="view-frame-header"
      className={cn("flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3", className)}
      {...props}
    />
  );
}

export function ViewFrameTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="view-frame-title"
      className={cn("order-1 min-w-0 flex-1 basis-56 text-base font-medium break-words", className)}
      {...props}
    />
  );
}

export function ViewFrameDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="view-frame-description"
      className={cn("order-2 basis-full text-sm break-words text-muted-foreground md:order-3", className)}
      {...props}
    />
  );
}

export function ViewFrameActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="view-frame-actions"
      className={cn(
        "order-3 flex w-full flex-wrap items-center justify-end gap-1 md:order-2 md:w-auto",
        className,
      )}
      {...props}
    />
  );
}

export type ViewFrameActionProps = Omit<React.ComponentProps<typeof Button>, "aria-label" | "title"> & {
  /** The action's accessible name and its hover title. The icon is the only visible content. */
  label: string;
};

export function ViewFrameAction({ label, className, children, ...props }: ViewFrameActionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={cn("max-md:size-11", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ViewFrameContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="view-frame-content"
      role="region"
      aria-label="View content"
      tabIndex={0}
      className={cn(
        "min-h-0 flex-1 overflow-auto p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
        className,
      )}
      {...props}
    />
  );
}

export function ViewFrameFoot({ className, children, ...props }: React.ComponentProps<"div">) {
  if (React.Children.toArray(children).length === 0) return null;
  return (
    <div data-slot="view-frame-foot" className={cn("shrink-0 border-t p-3", className)} {...props}>
      {children}
    </div>
  );
}

export type ViewFrameFooterProps = Omit<React.ComponentProps<"footer">, "children"> & {
  /** Where the view came from, e.g. "Made in chat: Track failed runs". Truncates first. */
  origin?: React.ReactNode;
  /** The version label, e.g. "v2 · board". Never shrinks. */
  version?: React.ReactNode;
};

export function ViewFrameFooter({ origin, version, className, ...props }: ViewFrameFooterProps) {
  return (
    <footer
      data-slot="view-frame-footer"
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span data-slot="view-frame-origin" className="min-w-0 truncate">
        {origin}
      </span>
      <span data-slot="view-frame-version" className="shrink-0 whitespace-nowrap">
        {version}
      </span>
    </footer>
  );
}
