"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Widget — A fixed-size tile in three size families, for one fact among same-sized siblings.
 *
 * Spec: docs/design-system/component-specs.md#r1-widget
 * States: small · medium · large · loading · openable · header-hidden
 */

type WidgetSize = "small" | "medium" | "large";

/**
 * Open and action exclude each other in the type: the open overlay covers the
 * whole tile, so a header action under it would never receive a click.
 */
type WidgetInteraction =
  | { onOpen: () => void; openLabel: string; action?: never }
  | { action?: React.ReactNode; onOpen?: never; openLabel?: never };

type WidgetProps = Omit<React.ComponentProps<"div">, "title" | "children" | "onOpen"> & {
  /** Which fixed family the tile is laid out for. The grid item decides its actual width and height. */
  size: WidgetSize;
  /** The fact's name. Truncates to one line and always stays in the accessibility tree. */
  title: string;
  icon?: React.ReactNode;
  /** A short qualifier beside the title: a period, a count, a freshness. */
  meta?: React.ReactNode;
  /** Moves the header to screen-reader-only. It is never removed, so the title is still announced. */
  hideHeader?: boolean;
  /** Swaps the body for a skeleton matched to `size`. The header renders at once. */
  loading?: boolean;
  children?: React.ReactNode;
} & WidgetInteraction;

/**
 * Padding comes from the card's own spacing variable, set per size. `data-size`
 * is overridden on the Card (it would otherwise read "default"|"sm"), so the
 * card's `data-[size=sm]` spacing rule no longer matches and this owns it.
 */
const SIZE_SPACING: Record<WidgetSize, string> = {
  small: "[--card-spacing:--spacing(3)]",
  medium: "[--card-spacing:--spacing(4)]",
  large: "[--card-spacing:--spacing(4)]",
};

const SKELETON_CLASS = "motion-reduce:animate-none";

/** A skeleton laid out like the body it stands in for, one per size family. */
function WidgetSkeleton({ size }: { size: WidgetSize }) {
  return (
    <div data-slot="widget-skeleton" data-size={size} aria-hidden="true" className="flex flex-col gap-2">
      {size === "small" ? (
        <>
          <Skeleton className={cn("h-7 w-1/2", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-3/4", SKELETON_CLASS)} />
        </>
      ) : null}
      {size === "medium" ? (
        <>
          <Skeleton className={cn("h-7 w-1/3", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-2/3", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-1/2", SKELETON_CLASS)} />
        </>
      ) : null}
      {size === "large" ? (
        <>
          <Skeleton className={cn("h-7 w-1/3", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-2/3", SKELETON_CLASS)} />
          <Skeleton className={cn("mt-2 h-3 w-full", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-5/6", SKELETON_CLASS)} />
          <Skeleton className={cn("h-3 w-2/3", SKELETON_CLASS)} />
        </>
      ) : null}
    </div>
  );
}

function Widget({
  size,
  title,
  icon,
  meta,
  hideHeader = false,
  loading = false,
  children,
  action,
  onOpen,
  openLabel,
  className,
  ...props
}: WidgetProps) {
  const titleId = React.useId();
  const openable = onOpen !== undefined;
  const floatedAction = hideHeader && action != null;

  return (
    <Card
      data-slot="widget"
      data-size={size}
      role="group"
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      className={cn(
        "group/widget relative h-full min-h-0 gap-2",
        SIZE_SPACING[size],
        // The card clips; the open overlay carries its own inset ring so the
        // clip cannot cut it.
        className,
      )}
      {...props}
    >
      {/*
       * First in DOM so it is the first tab stop. It is a native button, named
       * by `openLabel`, and everything beneath it is hidden from assistive
       * tech so a screen reader hears that one name and nothing twice.
       * Hover and focus change the ring only: nothing here moves or resizes.
       */}
      {openable ? (
        <button
          type="button"
          data-slot="widget-open"
          aria-label={openLabel}
          onClick={onOpen}
          className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] outline-hidden hover:ring-2 hover:ring-inset hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      ) : null}
      <div
        data-slot="widget-header"
        aria-hidden={openable || undefined}
        className={cn(
          "flex min-w-0 shrink-0 items-center gap-2 px-(--card-spacing)",
          hideHeader && "sr-only",
        )}
      >
        {icon ? (
          <span
            data-slot="widget-icon"
            aria-hidden="true"
            className="flex shrink-0 items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <span
          id={titleId}
          data-slot="widget-title"
          className={cn("min-w-0 flex-1 truncate font-medium", size === "small" ? "text-xs" : "text-sm")}
        >
          {title}
        </span>
        {meta ? (
          <span
            data-slot="widget-meta"
            className="max-w-1/2 min-w-0 shrink-0 truncate text-xs text-muted-foreground"
          >
            {meta}
          </span>
        ) : null}
        {!hideHeader && action != null ? (
          <span data-slot="widget-action-slot" className="relative z-20 -my-1 shrink-0">
            {action}
          </span>
        ) : null}
      </div>
      {floatedAction ? (
        <span data-slot="widget-action-slot" data-floated="" className="absolute end-2 top-2 z-20 flex">
          {action}
        </span>
      ) : null}
      <CardContent
        data-slot="widget-content"
        aria-hidden={openable || undefined}
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          // Clearance for the floated action, so the body never runs under it.
          floatedAction && "pe-9",
        )}
      >
        {loading ? (
          <>
            <WidgetSkeleton size={size} />
            <span role="status" className="sr-only">
              Loading {title}
            </span>
          </>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

type WidgetActionProps = Omit<React.ComponentProps<typeof Button>, "aria-label" | "size" | "variant"> & {
  /** The control's accessible name. The tooltip repeats it visually; it is never the only name. */
  label: string;
};

/** The tile's one header control: an icon button whose `label` is its name. */
function WidgetAction({ label, children, className, ...props }: WidgetActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            data-slot="widget-action"
            aria-label={label}
            className={className}
            {...props}
          />
        }
      >
        <span aria-hidden="true" className="flex items-center">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export { Widget, WidgetAction };
export type { WidgetProps, WidgetSize, WidgetActionProps };
