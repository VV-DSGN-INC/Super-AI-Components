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
          title, never the text.

          The `!important` on `!top-2` is deliberate, not sloppiness: what it
          defeats is `inset-y-0` surviving `cn`'s tailwind-merge pass, because
          tailwind-merge does not treat `top` and `inset-y` as the same
          conflict group, so a plain `top-2` would sit alongside `inset-y-0`
          in the class list with no guarantee which one's `top` declaration
          wins in the generated stylesheet. `!important` removes that
          ambiguity outright rather than relying on it. `my-0` is required
          alongside it for the same reason: `inset-y-0`'s surviving `bottom-0`
          plus the vendored `my-auto` re-centers the box through the CSS
          auto-margin formula for absolutely-positioned elements even once
          `top` is pinned, unless the auto margins are zeroed too.

          This registry ships owned source, not a compiled package: a
          consumer who needs different arrow placement edits these two lines
          directly, the same way they would any other call-site override in
          this file.

          H5 frame-strip deliberately does NOT carry this `!top-2 my-0`
          pair, and the reason is narrower than "the label is somewhere
          else": its tile's label is an *overlay* band on the tile's own
          bottom edge (A8 preview-tile, labelPlacement="overlay"), still
          inside the same frame the arrow sits over — not a caption below
          it. Its vertically-centered arrow currently clears that band only
          because, in the configuration its own stories exercise without a
          controls row, the item's height is just the tile's height, and the
          clearance is narrow rather than generous. Adding a controls row
          there (onReorder, or the in-out variant) would grow the item and
          pull that centered arrow's middle down toward the label, shrinking
          it further — see that file for the mechanism. Top-anchoring here
          is what makes C3 immune to the equivalent shift: pinned to `top-2`
          rather than centered, this arrow's position never depends on how
          tall the item is, so nothing below it — longer description text,
          an extra row, anything — can move it. The asymmetry between the
          two files is intentional, not a mismatch to reconcile. */}
      <CarouselPrevious data-slot="feature-card-row-previous" className="left-2 !top-2 my-0" />
      <CarouselNext data-slot="feature-card-row-next" className="right-2 !top-2 my-0" />
    </Carousel>
  );
}

export { FeatureCardRow };
export type { FeatureCardRowItem, FeatureCardRowProps };
