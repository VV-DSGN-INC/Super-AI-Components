"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Reference Strip — Typed attachment slots above the prompt
 *
 * Spec: docs/design-system/component-specs.md#d2-reference-strip
 * States: empty · filled · with-roles
 *
 * Built on A8 `preview-tile`: each slot is a preview-tile instance (frame,
 * loading/failed state, badge slot for remove) rather than a hand-rolled
 * thumbnail. Only the typed-slot chrome — role label, move controls, the
 * still-visible empty placeholder — lives here.
 *
 * D2's "empty slots stay visible rather than collapsing" is a *per-slot*
 * rule, separate from the catalog's whole-strip `empty` state: an item with
 * no `thumbnail` renders as a discoverable, still-present add affordance
 * (see `ReferenceSlot` below) even while sibling slots are filled — that's
 * what the `with-roles` story demonstrates. The whole-strip `empty` state
 * (no items at all) is the F4 first-class empty state instead: a full-width
 * panel with copy and a CTA, not a bare string or a single squeezed tile.
 *
 * The row uses the same Carousel base as `feature-card-row` for its
 * horizontal scroll: `role="region"` plus visible previous/next buttons are
 * what keep the strip reachable by keyboard, satisfying axe's
 * scrollable-region-focusable rule.
 */

type ReferenceRole = "reference" | "first-frame" | "last-frame" | "video-ref" | "character";

const ROLE_LABEL: Record<ReferenceRole, string> = {
  reference: "Reference",
  "first-frame": "First frame",
  "last-frame": "Last frame",
  "video-ref": "Video ref",
  character: "Character",
};

interface ReferenceStripItem {
  id: string;
  /** The role IS the data — it changes what the model does (D2). Drives the label. */
  role?: ReferenceRole;
  /** Overrides the label derived from `role`. */
  label?: React.ReactNode;
  /** Omit to render this slot as an empty, still-visible placeholder rather than collapsing it. */
  thumbnail?: { src: string; alt: string };
  state?: "loading" | "failed";
  onRemove?: () => void;
}

interface ReferenceStripProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items?: ReferenceStripItem[];
  /** Called with the slot's role (or undefined for a bare add) when an empty slot or the empty-state CTA is activated. */
  onAdd?: (role?: ReferenceRole) => void;
  /** Per-slot reorder. Omit to hide the move controls entirely. */
  onMove?: (id: string, direction: "left" | "right") => void;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
}

function ReferenceSlot({
  item,
  index,
  count,
  showRole,
  onAdd,
  onMove,
}: {
  item: ReferenceStripItem;
  index: number;
  count: number;
  showRole: boolean;
  onAdd?: (role?: ReferenceRole) => void;
  onMove?: (id: string, direction: "left" | "right") => void;
}) {
  const roleLabel = item.label ?? (item.role ? ROLE_LABEL[item.role] : undefined);
  const accessibleName = typeof roleLabel === "string" ? roleLabel : "reference";

  if (!item.thumbnail) {
    return (
      <div data-slot="reference-strip-slot" data-state="slot-empty" className="flex w-full flex-col gap-1.5">
        <PreviewTile aspect="square" onSelect={onAdd ? () => onAdd(item.role) : undefined}>
          {/* text-foreground, not text-muted-foreground: the tile frame's own
              background is bg-muted, and that pairing fails contrast (see
              docs/design-system/a11y-baseline.md). */}
          <div className="text-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs">
            <Plus className="size-4" aria-hidden />
            <span>{showRole && roleLabel ? roleLabel : "Add"}</span>
          </div>
        </PreviewTile>
      </div>
    );
  }

  return (
    <div data-slot="reference-strip-slot" data-state="slot-filled" className="flex w-full flex-col gap-1.5">
      <PreviewTile
        aspect="square"
        state={item.state ?? "default"}
        labelPlacement="none"
        action={item.state === "failed" ? <span>Couldn&apos;t load</span> : undefined}
        badge={
          item.onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              data-slot="reference-strip-remove"
              aria-label={`Remove ${accessibleName}`}
              onClick={item.onRemove}
              className="rounded-full"
            >
              <X aria-hidden />
            </Button>
          ) : undefined
        }
      >
        <img src={item.thumbnail.src} alt={item.thumbnail.alt} className="h-full w-full object-cover" />
      </PreviewTile>
      {showRole || onMove ? (
        <div className="flex items-center justify-between gap-1">
          {showRole ? (
            <span data-slot="reference-strip-role" className="text-foreground min-w-0 truncate text-xs">
              {roleLabel}
            </span>
          ) : (
            <span />
          )}
          {onMove ? (
            <div className="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                data-slot="reference-strip-move"
                aria-label={`Move ${accessibleName} left`}
                disabled={index === 0}
                onClick={() => onMove(item.id, "left")}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                data-slot="reference-strip-move"
                aria-label={`Move ${accessibleName} right`}
                disabled={index === count - 1}
                onClick={() => onMove(item.id, "right")}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReferenceStrip({
  items = [],
  onAdd,
  onMove,
  emptyTitle = "No references yet",
  emptyDescription = "Attach an image, frame or character to guide generation.",
  className,
  ...props
}: ReferenceStripProps) {
  if (items.length === 0) {
    return (
      <div data-slot="reference-strip" data-state="empty" className={cn("w-full", className)} {...props}>
        <div
          data-slot="reference-strip-empty"
          className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center"
        >
          <p className="text-foreground text-sm font-medium">{emptyTitle}</p>
          <p className="text-muted-foreground text-xs">{emptyDescription}</p>
          {onAdd ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-slot="reference-strip-add"
              onClick={() => onAdd()}
            >
              <Plus aria-hidden /> Add reference
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const hasRoles = items.some((item) => item.role || item.label);

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      data-slot="reference-strip"
      data-state={hasRoles ? "with-roles" : "filled"}
      className={cn("w-full", className)}
      {...props}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.id} data-slot="reference-strip-item" className="basis-24 sm:basis-28">
            <ReferenceSlot
              item={item}
              index={index}
              count={items.length}
              showRole={hasRoles}
              onAdd={onAdd}
              onMove={onMove}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious data-slot="reference-strip-previous" />
      <CarouselNext data-slot="reference-strip-next" />
    </Carousel>
  );
}

export { ReferenceStrip };
export type { ReferenceStripItem, ReferenceStripProps, ReferenceRole };
