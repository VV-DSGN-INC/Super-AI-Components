"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PreviewTile, type PreviewTileAspect, type PreviewTileState } from "@/registry/super-ai/preview-tile";

/**
 * Frame Strip — Keyframe / page / artboard strip
 *
 * Spec: docs/design-system/component-specs.md#h5-frame-strip
 * States: video-frames · slide-pages · in-out-picker · reorder
 *
 * Built on A8 `preview-tile` (H5 "Built on: A8"): every cell is a
 * preview-tile — fixed aspect, overlay label, badge slot, loading/failed
 * treatment — and this component adds only the strip semantics around it:
 * which item is active, which two are the in/out marks, reorder and add.
 *
 * **Video frames, slide pages and artboards are one component.** `kind`
 * changes the tile's aspect and the words on the add affordance, and nothing
 * else: selection, reorder and add are the same code path for all three (H5).
 * There is deliberately no per-content-type component.
 *
 * **The active item is ringed, never bordered.** A8's `selected` draws
 * `ring-2 ring-offset-2` — a box-shadow, so it contributes zero layout — and
 * this component adds no border of its own. Moving the selection therefore
 * cannot reflow the strip, which is the whole reason H5 specifies a ring.
 * The per-item controls row has its height reserved unconditionally for the
 * same reason.
 *
 * A8's interactive Frame renders `aria-pressed` when handed `onSelect` —
 * toggle-button semantics, wrong for "which frame is current". So, as in E4
 * `preset-grid`, the tile is never given `onSelect`: its Frame stays an inert
 * `<div>` that still carries the ring, and this component wraps it in one
 * real `<button aria-current>` of its own. One interactive element per tile,
 * and nothing is ever placed in A8's `action` slot — that slot renders
 * *inside* the frame, and a control there plus an interactive frame is the
 * `nested-interactive` failure `result-card` had to work around.
 *
 * Horizontal scrolling is the Carousel base, as in D2 `reference-strip`: its
 * `role="region"` plus visible previous/next buttons keep the strip
 * keyboard-reachable and satisfy axe's `scrollable-region-focusable` rule.
 */

/** What the tiles contain. Behaviour is identical across all three. */
type FrameStripKind = "video" | "slides" | "artboards";

/**
 * `select` picks the one active item. `in-out` marks two — the first and last
 * frame — which is how D2 `reference-strip` gets its image→video conditioning
 * (H5). Those are different questions, so they are different variants rather
 * than one overloaded selection model.
 */
type FrameStripVariant = "select" | "in-out";

interface FrameStripMarks {
  inPoint?: string;
  outPoint?: string;
}

interface FrameStripItem {
  id: string;
  /**
   * Timecode, page number or artboard name. This is the tile's accessible
   * name, so it is required: a frame identified only by its picture is not
   * identifiable at all to a screen reader.
   */
  label: string;
  /** The frame itself. Decorative — pass `alt=""` on an `img`; `label` names the tile. */
  thumbnail?: React.ReactNode;
  /** A8's badge corner. Replaced by the In/Out mark in the `in-out` variant. */
  badge?: React.ReactNode;
  state?: Extract<PreviewTileState, "default" | "loading" | "failed">;
}

interface FrameStripProps extends Omit<React.ComponentProps<"div">, "onSelect" | "value" | "defaultValue"> {
  items?: FrameStripItem[];
  kind?: FrameStripKind;
  /** Overrides the aspect `kind` implies. Applies to every tile, so the strip stays even. */
  aspect?: PreviewTileAspect;
  variant?: FrameStripVariant;
  /** `select` variant: id of the active item. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** `in-out` variant: the two marks. */
  inPoint?: string;
  outPoint?: string;
  defaultInPoint?: string;
  defaultOutPoint?: string;
  onInOutChange?: (marks: FrameStripMarks) => void;
  /** Per-item reorder. Omit to hide the move controls entirely. */
  onReorder?: (id: string, direction: "left" | "right") => void;
  /** Renders the trailing add tile. Omit to hide it. */
  onAdd?: () => void;
  addLabel?: React.ReactNode;
}

const KIND_ASPECT: Record<FrameStripKind, PreviewTileAspect> = {
  video: "video",
  slides: "video",
  artboards: "square",
};

const KIND_WORDS: Record<FrameStripKind, { region: string; add: string }> = {
  video: { region: "Frames", add: "Add frame" },
  slides: { region: "Pages", add: "Add page" },
  artboards: { region: "Artboards", add: "Add artboard" },
};

function FrameStripSlide({
  item,
  index,
  count,
  aspect,
  variant,
  active,
  mark,
  hasControls,
  onSelect,
  onMark,
  onReorder,
}: {
  item: FrameStripItem;
  index: number;
  count: number;
  aspect: PreviewTileAspect;
  variant: FrameStripVariant;
  active: boolean;
  mark?: "in" | "out";
  hasControls: boolean;
  onSelect: (id: string) => void;
  onMark: (mark: "in" | "out", id: string) => void;
  onReorder?: (id: string, direction: "left" | "right") => void;
}) {
  const tile = (
    <PreviewTile
      aspect={aspect}
      state={item.state ?? "default"}
      // The ring, and only the ring. A8 draws it as a box-shadow, so it costs
      // no layout and the strip cannot shift as the active item moves.
      selected={active}
      label={item.label}
      labelPlacement="overlay"
      badge={
        mark ? (
          // The mark is a word, not a colour: "In"/"Out" survives colourblind
          // users and screen readers both.
          <Badge data-slot="frame-strip-mark" data-mark={mark}>
            {mark === "in" ? "In" : "Out"}
          </Badge>
        ) : (
          item.badge
        )
      }
      action={
        item.state === "failed" ? (
          // No colour class: A8's failed overlay paints `text-foreground`
          // itself (preview-tile.tsx:88) and this inherits it. The override
          // that used to be here was the local fix for destructive-on-bg-muted
          // (a11y-baseline.md); it became redundant when that colour was
          // promoted to A8's default, so it is deleted rather than left
          // duplicating a default.
          <span>Couldn&apos;t load</span>
        ) : undefined
      }
    >
      {item.thumbnail}
    </PreviewTile>
  );

  return (
    <CarouselItem
      // py-1/pr-1 reserve room for A8's ring-offset, which CarouselContent's
      // overflow-hidden would otherwise clip. Unconditional, so it is never
      // layout that selection can move.
      className="group/frame basis-32 py-1 pr-1 sm:basis-36"
    >
      <div data-slot="frame-strip-item" data-active={active ? "true" : "false"} className="flex flex-col gap-1.5">
        {variant === "select" ? (
          <button
            type="button"
            data-slot="frame-strip-frame"
            // aria-current, not aria-pressed/aria-selected: this is "the frame
            // you are on" within a set, and it is a real programmatic state,
            // so the ring is never the only carrier of activeness.
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(item.id)}
            className="focus-visible:ring-ring w-full rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
          >
            {tile}
          </button>
        ) : (
          // In the in/out variant the two toggles below own the interaction —
          // a third control over the same frame would be two answers to one
          // question.
          <div data-slot="frame-strip-frame">{tile}</div>
        )}

        {hasControls ? (
          <div data-slot="frame-strip-controls" className="flex min-h-6 items-center justify-between gap-1">
            {variant === "in-out" ? (
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant={mark === "in" ? "default" : "outline"}
                  aria-pressed={mark === "in"}
                  data-slot="frame-strip-in"
                  onClick={() => onMark("in", item.id)}
                >
                  {/* The visible word stays "In"; the accessible name says
                      which frame, so the two toggles on frame 3 are not
                      indistinguishable from the two on frame 4 in a list of
                      controls. Split rather than a leading-space sr-only
                      suffix, which accname concatenates into "Inpoint at". */}
                  <span aria-hidden>In</span>
                  <span className="sr-only">In point at {item.label}</span>
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={mark === "out" ? "default" : "outline"}
                  aria-pressed={mark === "out"}
                  data-slot="frame-strip-out"
                  onClick={() => onMark("out", item.id)}
                >
                  <span aria-hidden>Out</span>
                  <span className="sr-only">Out point at {item.label}</span>
                </Button>
              </div>
            ) : (
              <span />
            )}

            {onReorder ? (
              // opacity, never display:none — a hover-only affordance that
              // cannot be reached by keyboard is an a11y failure, so these
              // stay in the tab order and focus-within reveals them.
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/frame:opacity-100 group-focus-within/frame:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  data-slot="frame-strip-move"
                  aria-label={`Move ${item.label} left`}
                  disabled={index === 0}
                  onClick={() => onReorder(item.id, "left")}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  data-slot="frame-strip-move"
                  aria-label={`Move ${item.label} right`}
                  disabled={index === count - 1}
                  onClick={() => onReorder(item.id, "right")}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </CarouselItem>
  );
}

function FrameStrip({
  items = [],
  kind = "video",
  aspect,
  variant = "select",
  value: valueProp,
  defaultValue,
  onValueChange,
  inPoint: inPointProp,
  outPoint: outPointProp,
  defaultInPoint,
  defaultOutPoint,
  onInOutChange,
  onReorder,
  onAdd,
  addLabel,
  className,
  ...props
}: FrameStripProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = valueProp ?? internalValue;

  const [internalMarks, setInternalMarks] = React.useState<FrameStripMarks>({
    inPoint: defaultInPoint,
    outPoint: defaultOutPoint,
  });
  const marksControlled = inPointProp !== undefined || outPointProp !== undefined;
  const marks = marksControlled ? { inPoint: inPointProp, outPoint: outPointProp } : internalMarks;

  const tileAspect = aspect ?? KIND_ASPECT[kind];
  const words = KIND_WORDS[kind];
  const hasControls = variant === "in-out" || typeof onReorder === "function";

  const handleSelect = (id: string) => {
    if (valueProp === undefined) setInternalValue(id);
    onValueChange?.(id);
  };

  const handleMark = (mark: "in" | "out", id: string) => {
    const next: FrameStripMarks =
      mark === "in"
        ? { inPoint: marks.inPoint === id ? undefined : id, outPoint: marks.outPoint }
        : { inPoint: marks.inPoint, outPoint: marks.outPoint === id ? undefined : id };

    // In must come before out — the pair is a range that D2 reads as first
    // frame and last frame. Rather than keep an impossible range, the mark
    // the user did not just set gives way.
    if (next.inPoint && next.outPoint) {
      const from = items.findIndex((entry) => entry.id === next.inPoint);
      const to = items.findIndex((entry) => entry.id === next.outPoint);
      if (next.inPoint === next.outPoint || from > to) {
        if (mark === "in") next.outPoint = undefined;
        else next.inPoint = undefined;
      }
    }

    if (!marksControlled) setInternalMarks(next);
    onInOutChange?.(next);
  };

  const markFor = (id: string): "in" | "out" | undefined => {
    if (variant !== "in-out") return undefined;
    if (marks.inPoint === id) return "in";
    if (marks.outPoint === id) return "out";
    return undefined;
  };

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      data-slot="frame-strip"
      data-kind={kind}
      data-variant={variant}
      aria-label={words.region}
      className={cn("w-full", className)}
      {...props}
    >
      <CarouselContent>
        {items.map((item, index) => {
          const mark = markFor(item.id);
          return (
            <FrameStripSlide
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              aspect={tileAspect}
              variant={variant}
              // In the in/out variant the ringed items are the two marks —
              // "the active item is ringed" applies to whatever the strip is
              // currently picking, and here it is picking two.
              active={variant === "in-out" ? mark !== undefined : value === item.id}
              mark={mark}
              hasControls={hasControls}
              onSelect={handleSelect}
              onMark={handleMark}
              onReorder={onReorder}
            />
          );
        })}

        {onAdd ? (
          // Add is a tile in the strip, in the same cell geometry as a frame —
          // H5's "selection, reorder and add are identical" is about them
          // being one interaction surface, not three separate ones.
          <CarouselItem className="basis-32 py-1 pr-1 sm:basis-36">
            <div data-slot="frame-strip-item" data-add="true" className="flex flex-col gap-1.5">
              <button
                type="button"
                data-slot="frame-strip-add"
                onClick={onAdd}
                className="focus-visible:ring-ring w-full rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                <PreviewTile aspect={tileAspect} labelPlacement="none">
                  {/* text-foreground, not text-muted-foreground: A8's frame is
                      bg-muted and that pairing measures 4.34:1. */}
                  <div className="text-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs font-medium">
                    <Plus className="size-4" aria-hidden />
                    <span>{addLabel ?? words.add}</span>
                  </div>
                </PreviewTile>
              </button>
              {/* Keeps the add tile the same height as its neighbours. */}
              {hasControls ? <div className="min-h-6" aria-hidden /> : null}
            </div>
          </CarouselItem>
        ) : null}
      </CarouselContent>
      <CarouselPrevious data-slot="frame-strip-previous" />
      <CarouselNext data-slot="frame-strip-next" />
    </Carousel>
  );
}

export { FrameStrip };
export type { FrameStripItem, FrameStripKind, FrameStripMarks, FrameStripProps, FrameStripVariant };
