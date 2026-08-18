"use client";

import * as React from "react";

import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Feature Card Row — "Popular features" / "Start from scratch"
 *
 * Spec: docs/design-system/component-specs.md#c3-feature-card-row
 * States: icon-title-desc · with-thumbnail · horizontal-scroll
 *
 * D13 (docs/design-system/decisions.md): cards here are A9 `entity-row` in a
 * card layout — the same four slots (icon, title, description, trailing),
 * stacked vertically instead of horizontally. `FeatureCard` below composes
 * `EntityRow` rather than reimplementing those slots: only flex direction,
 * alignment and padding change to turn the row into a card face. The
 * icon/thumbnail split, and the horizontal-scroll behavior itself, live
 * outside `EntityRow` because neither is part of its four-slot contract.
 */

interface FeatureCardRowItem {
  id: string;
  /** Small glyph in the card's leading slot. Mutually exclusive with `thumbnail`. */
  icon?: React.ReactNode;
  /** Full-bleed media above the text. Drives the with-thumbnail state. */
  thumbnail?: { src: string; alt: string };
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Badge, shortcut, or affordance rendered after the description. */
  trailing?: React.ReactNode;
  onSelect?: () => void;
}

interface FeatureCardRowProps extends React.ComponentProps<"div"> {
  items: FeatureCardRowItem[];
}

function FeatureCard({ item }: { item: FeatureCardRowItem }) {
  const { icon, thumbnail, title, description, trailing, onSelect } = item;

  return (
    <Card data-slot="feature-card-row-card" className="h-full gap-3 py-0">
      {thumbnail ? (
        <img
          data-slot="feature-card-row-thumbnail"
          src={thumbnail.src}
          alt={thumbnail.alt}
          className="aspect-video w-full object-cover"
        />
      ) : null}
      <EntityRow
        icon={icon}
        title={title}
        description={description}
        trailing={trailing}
        onSelect={onSelect}
        // Same four EntityRow slots as any other row consumer — only the
        // axis flips (row -> column) and the row-menu chrome (rounded
        // highlight, min-height reservation) gives way to card padding.
        className="h-full min-h-0 flex-1 flex-col items-start gap-2 rounded-none p-4 text-left"
      />
    </Card>
  );
}

function FeatureCardRow({ items, className, ...props }: FeatureCardRowProps) {
  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      data-slot="feature-card-row"
      className={cn("w-full", className)}
      {...props}
    >
      <CarouselContent className="-ml-4">
        {items.map((item) => (
          <CarouselItem
            key={item.id}
            data-slot="feature-card-row-item"
            className="basis-64 sm:basis-72"
          >
            <FeatureCard item={item} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* The visible next affordance the spec calls out: trackpad-only
          scroll hides half the row, and Carousel's role="region" plus
          arrow-key handling is what keeps the row keyboard reachable.

          The vendored arrows sit at -left-12/-right-12, outside the carousel's
          own box. That is right for a full-bleed row and wrong in any
          constrained column, where it clips or forces a horizontal scroller.
          Overriding here rather than in the primitive: components/ui is
          vendored and stays byte-identical to upstream.

          Vertically centered (the vendored default) lands the arrow on top of
          the card's title text at any scroll position, since the title sits
          near mid-card height and the button is wide enough to reach it. Top-
          anchored instead: it only ever touches the icon/thumbnail above the
          title, never the text. `!top-2` is `!important` because `inset-y-0`
          survives `cn`'s merge (tailwind-merge doesn't treat `top` and
          `inset-y` as the same conflict group), and `my-0` is required
          alongside it — `inset-y-0`'s surviving `bottom-0` plus the vendored
          `my-auto` re-centers the box through the auto-margin formula even
          once `top` is pinned, unless the auto margins are zeroed too. */}
      <CarouselPrevious data-slot="feature-card-row-previous" className="left-2 !top-2 my-0" />
      <CarouselNext data-slot="feature-card-row-next" className="right-2 !top-2 my-0" />
    </Carousel>
  );
}

export { FeatureCardRow };
export type { FeatureCardRowItem, FeatureCardRowProps };
