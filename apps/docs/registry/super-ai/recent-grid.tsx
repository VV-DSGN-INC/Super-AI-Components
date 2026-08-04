"use client";

import { Clock } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Recent Grid — Recent projects with thumbnails
 *
 * Spec: docs/design-system/component-specs.md#c4-recent-grid
 * States: grid · list · duration-badge · edited-ago · empty · hover-actions
 */

interface RecentGridItem {
  id: string;
  /** The only required field — thumbnail, duration and edited-ago are all optional. */
  title: string;
  /** Handed straight to preview-tile's children slot: image, colour, text, 3D, ... */
  thumbnail?: React.ReactNode;
  /** e.g. "12:04". Rendered as a badge on the tile (grid) or inline (list). */
  durationLabel?: string;
  /** e.g. "Edited 19 hours ago" — recency beats a raw timestamp, per the spec. */
  editedAgo?: string;
  onOpen?: () => void;
  /**
   * Row/tile actions (rename, delete, ...). Always mounted in the DOM — only
   * their opacity is hover/focus-driven, so they stay in the tab order and
   * reachable by keyboard even though they're visually hidden until hovered
   * or focused. A `hidden group-hover:flex` version would remove them from
   * the tab order entirely and trap keyboard users — see the docs "don't".
   */
  actions?: React.ReactNode;
}

interface RecentGridProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** Defaults to an empty array, which renders the first-class empty tile. */
  items?: RecentGridItem[];
  layout?: "grid" | "list";
  emptyTitle?: string;
  emptyDescription?: string;
  /** Optional CTA rendered inside the empty tile, e.g. a "New project" button. */
  emptyAction?: React.ReactNode;
}

function RecentGridActions({ actions, className }: { actions: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="recent-grid-actions"
      className={cn(
        "opacity-0 transition-opacity group-hover/recent-grid-item:opacity-100 group-focus-within/recent-grid-item:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
    >
      {actions}
    </div>
  );
}

function RecentGridDurationBadge({ durationLabel, className }: { durationLabel?: string; className?: string }) {
  if (!durationLabel) return null;
  return (
    <Badge data-slot="recent-grid-duration" variant="secondary" className={cn("text-[0.65rem]", className)}>
      {durationLabel}
    </Badge>
  );
}

function RecentGridEditedAgo({ editedAgo, className }: { editedAgo?: string; className?: string }) {
  return (
    <p
      data-slot="recent-grid-edited-ago"
      // Rendered unconditionally (even blank) with a non-breaking space
      // fallback so the text line always occupies its slot — "card height
      // fixed regardless" per the spec, whether or not this item has an
      // edited-ago value. aria-hidden keeps the placeholder silent for
      // screen readers when there's nothing to announce.
      aria-hidden={!editedAgo}
      className={cn("text-muted-foreground truncate text-xs", className)}
    >
      {editedAgo ?? " "}
    </p>
  );
}

function RecentGridItemGrid({ item }: { item: RecentGridItem }) {
  const { title, thumbnail, durationLabel, editedAgo, onOpen, actions } = item;
  return (
    <div data-slot="recent-grid-item" className="group/recent-grid-item relative flex flex-col">
      {/* Composes preview-tile (A8) for the media frame, badge and title
          label — "below" placement is exactly what A8's spec reserves for
          C4's title-under-thumbnail layout, so the tile owns aspect ratio,
          loading/failed states and the selection ring; this component only
          adds duration, edited-ago and hover actions around it. */}
      <PreviewTile
        aspect="video"
        label={title}
        labelPlacement="below"
        onSelect={onOpen}
        badge={<RecentGridDurationBadge durationLabel={durationLabel} />}
      >
        {thumbnail}
      </PreviewTile>
      {actions ? <RecentGridActions actions={actions} className="absolute top-2 left-2 z-10" /> : null}
      <RecentGridEditedAgo editedAgo={editedAgo} className="mt-0.5" />
    </div>
  );
}

function RecentGridItemList({ item }: { item: RecentGridItem }) {
  const { title, thumbnail, durationLabel, editedAgo, onOpen, actions } = item;
  return (
    <div
      data-slot="recent-grid-item"
      className="group/recent-grid-item hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2"
    >
      <PreviewTile aspect="video" labelPlacement="none" onSelect={onOpen} className="w-28 shrink-0">
        {thumbnail}
      </PreviewTile>
      <div className="min-w-0 flex-1">
        {/* List rows put the title beside the thumbnail rather than below it,
            so it's rendered here instead of through preview-tile's label
            slot (which stays labelPlacement="none" in this layout). */}
        <p data-slot="recent-grid-title" className="truncate text-sm font-medium">
          {title}
        </p>
        <RecentGridEditedAgo editedAgo={editedAgo} />
      </div>
      <RecentGridDurationBadge durationLabel={durationLabel} className="shrink-0" />
      {actions ? <RecentGridActions actions={actions} className="shrink-0" /> : null}
    </div>
  );
}

function RecentGrid({
  items = [],
  layout = "grid",
  emptyTitle = "No recent projects",
  emptyDescription = "Projects you open or create will show up here.",
  emptyAction,
  className,
  ...props
}: RecentGridProps) {
  return (
    <div data-slot="recent-grid" data-layout={layout} className={cn(className)} {...props}>
      {items.length === 0 ? (
        // F4: empty states are the default view, not an afterthought. This
        // renders as a single dashed-border tile in the grid's own footprint
        // — an in-grid tile, not a page takeover.
        <Empty data-slot="recent-grid-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
          {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
        </Empty>
      ) : (
        <div
          className={cn(
            layout === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col",
          )}
        >
          {items.map((item) =>
            layout === "grid" ? (
              <RecentGridItemGrid key={item.id} item={item} />
            ) : (
              <RecentGridItemList key={item.id} item={item} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export { RecentGrid };
export type { RecentGridItem, RecentGridProps };
