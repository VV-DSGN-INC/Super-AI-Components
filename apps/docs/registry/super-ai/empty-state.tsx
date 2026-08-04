import { ArrowRight } from "lucide-react";
import * as React from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * Empty State — the canonical nothing-here surface.
 *
 * Spec: docs/design-system/component-specs.md#l1-empty-state
 * States: page · panel · in-grid · example-pair
 *
 * Three sentences from the spec drive the whole API:
 *
 * 1. "Three sizes, one component. The in-grid variant is a tile so the grid
 *    keeps its rhythm." `size` is a prop, never a fork: page, panel and
 *    in-grid emit the same slots in the same order and differ only in the
 *    root's metrics. `in-grid` additionally draws a dashed tile that fills its
 *    cell, so dropping it into F2 `generation-grid`'s `empty` slot leaves the
 *    column geometry untouched.
 * 2. "The CTA uses the same verb as the primary action of the surface it
 *    replaces." So this component never renders a CTA of its own — `action` is
 *    caller-supplied, and there is deliberately no `ctaLabel` prop to make a
 *    generic "Get started" the path of least resistance.
 * 3. "The example-pair variant is the strongest form for generation tools — it
 *    shows the transformation." `examplePair` is a *content mode*, not a fourth
 *    size: it composes with whichever of the three sizes the surface calls for.
 *
 * Composes the vendored shadcn `empty` primitive rather than restyling a div,
 * so the type scale, the balanced text and the header/content rhythm stay in
 * one place. Overriding `data-slot` on a vendored `ui/` primitive is the house
 * idiom (see `result-card` on Card); nothing keys on `empty`/`empty-header`.
 */

type EmptyStateSize = "page" | "panel" | "in-grid";

/**
 * Root metrics per size. Only the frame moves — the slots inside it are
 * identical, which is what makes "three sizes, one component" true rather than
 * aspirational.
 */
const SIZE_ROOT: Record<EmptyStateSize, string> = {
  page: "min-h-80 gap-6 px-6 py-16",
  panel: "gap-4 px-4 py-10",
  // A tile: fills the grid cell it was handed, keeps the dashed frame that
  // reads as "a slot with nothing in it", and never demands more height than a
  // real cell would. Left-aligned because a 1/6th-width column has no room to
  // centre anything legibly.
  "in-grid":
    "h-full min-h-32 items-start justify-center gap-3 rounded-lg border border-dashed p-4 text-left",
};

const SIZE_TITLE: Record<EmptyStateSize, string> = {
  page: "text-lg",
  panel: "text-base",
  "in-grid": "text-sm",
};

const SIZE_DESCRIPTION: Record<EmptyStateSize, string> = {
  page: "text-sm",
  panel: "text-sm",
  "in-grid": "text-xs",
};

/** The decorative mark. `page` earns a larger one; the tile gets none by default. */
const SIZE_MEDIA: Record<EmptyStateSize, string> = {
  page: "size-12 [&_svg:not([class*='size-'])]:size-6",
  panel: "size-10 [&_svg:not([class*='size-'])]:size-5",
  "in-grid": "size-8",
};

interface EmptyStateExample {
  /**
   * One half of the transformation. Its semantics are yours: an `<img>` with
   * real `alt` stays announced, a purely decorative frame should carry
   * `aria-hidden` at the call site so it cannot double the figure's name.
   */
  content: React.ReactNode;
  /**
   * Visible caption — "Before" / "After", or the two states in your own words.
   * Required: the direction of the transformation must survive without the
   * arrow, which is decoration.
   */
  label: string;
}

interface EmptyStateExamplePair {
  before: EmptyStateExample;
  after: EmptyStateExample;
  /** Optional line under the pair — usually the prompt that produced it. */
  caption?: React.ReactNode;
}

interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  size?: EmptyStateSize;
  /**
   * The one sentence that says what is missing. Pass a heading element when
   * this replaces a page's whole content region, so document structure
   * survives the empty case.
   */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Decoration. Rendered `aria-hidden`, so it can never contribute a name. */
  icon?: React.ReactNode;
  /**
   * The CTA. Caller-supplied on purpose: it must repeat the verb of the
   * primary action of the surface it stands in for ("Generate", "Upload",
   * "Invite"), which only the caller knows.
   */
  action?: React.ReactNode;
  /** A quieter escape hatch beside the CTA — "Browse templates", "Learn more". */
  secondaryAction?: React.ReactNode;
  /** Before → after. The strongest form for a generation tool. */
  examplePair?: EmptyStateExamplePair;
}

function EmptyState({
  size = "panel",
  title,
  description,
  icon,
  action,
  secondaryAction,
  examplePair,
  className,
  ...props
}: EmptyStateProps) {
  const compact = size === "in-grid";

  return (
    <Empty
      data-slot="empty-state"
      data-size={size}
      className={cn(SIZE_ROOT[size], className)}
      {...props}
    >
      <EmptyHeader
        data-slot="empty-state-header"
        className={cn(compact && "max-w-full items-start text-left")}
      >
        {icon ? (
          // aria-hidden: an illustration that renders text would otherwise be
          // concatenated into the accessible name of everything around it.
          <EmptyMedia
            variant="icon"
            data-slot="empty-state-media"
            aria-hidden
            className={SIZE_MEDIA[size]}
          >
            {icon}
          </EmptyMedia>
        ) : null}
        <EmptyTitle data-slot="empty-state-title" className={SIZE_TITLE[size]}>
          {title}
        </EmptyTitle>
        {description ? (
          <EmptyDescription
            data-slot="empty-state-description"
            className={SIZE_DESCRIPTION[size]}
          >
            {description}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>

      {examplePair ? (
        <div
          data-slot="empty-state-example-pair"
          className={cn(
            "flex w-full max-w-md flex-col items-center gap-2",
            compact && "max-w-full",
          )}
        >
          <div className="flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
            <ExampleHalf data-example="before" example={examplePair.before} />
            {/* Decoration. The order of the two halves and their captions
                carry the direction, so nothing is conveyed by the arrow alone. */}
            <ArrowRight
              data-slot="empty-state-example-arrow"
              aria-hidden
              className="text-foreground/60 mx-auto size-4 shrink-0 rotate-90 sm:rotate-0"
            />
            <ExampleHalf data-example="after" example={examplePair.after} />
          </div>
          {examplePair.caption ? (
            <p
              data-slot="empty-state-example-caption"
              className="text-muted-foreground text-xs text-balance"
            >
              {examplePair.caption}
            </p>
          ) : null}
        </div>
      ) : null}

      {action || secondaryAction ? (
        <EmptyContent
          data-slot="empty-state-actions"
          className={cn(
            "flex-row flex-wrap items-center justify-center gap-2",
            compact && "max-w-full justify-start",
          )}
        >
          {action}
          {secondaryAction}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/**
 * One side of the pair. A `figure`/`figcaption` so the caption is the figure's
 * accessible name rather than a loose line of text next to it.
 */
function ExampleHalf({
  example,
  ...props
}: { example: EmptyStateExample } & React.ComponentProps<"figure">) {
  return (
    <figure
      data-slot="empty-state-example"
      // The caption is visible *and* the outright name. Relying on figcaption
      // alone leaves the name to be assembled from content, which concatenates
      // whatever the caller put in `content` onto the label with no separator.
      aria-label={example.label}
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
      {...props}
    >
      <div
        data-slot="empty-state-example-media"
        className="bg-card w-full overflow-hidden rounded-md border"
      >
        {example.content}
      </div>
      <figcaption
        data-slot="empty-state-example-label"
        className="text-foreground text-xs font-medium"
      >
        {example.label}
      </figcaption>
    </figure>
  );
}

export { EmptyState };
export type {
  EmptyStateExample,
  EmptyStateExamplePair,
  EmptyStateProps,
  EmptyStateSize,
};
