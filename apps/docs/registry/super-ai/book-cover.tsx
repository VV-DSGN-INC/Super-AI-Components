"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Book Cover — a thing you read, not a thing you generated.
 *
 * Spec: docs/design-system/component-specs.md#q2-book-cover
 * States: plain · stripe · illustrated · textured · tone
 *
 * Read from Vercel's Geist (D20), where it is decorative chrome for marketing
 * pages and docs landing covers. Its job here is a cover for a bounded body of
 * knowledge — a docs set, a template pack, a source collection — so a library
 * can distinguish what you read from what you generated.
 *
 * It carries **no AI-interface semantics**. It is presentational, its docs page
 * says so, and that is the honest description rather than a shortcoming to be
 * written around.
 */

type BookCoverVariant = "plain" | "stripe" | "illustrated";

/**
 * Geist exposes `color` and `textColor` as free strings. That cannot exist
 * here: `check:tokens` fails the build on raw hex, so a prop whose purpose is
 * to accept one is a defect. Three token-bound tones instead — named for the
 * object rather than for the palette, which also sidesteps a `default` value
 * that would surface as the rejected `Default` story export.
 */
type BookCoverTone = "paper" | "ink" | "muted";

type BookCoverWidth = number | { sm?: number; md?: number; lg?: number };

const TONE: Record<BookCoverTone, { face: string; stripe: string; spine: string }> = {
  paper: { face: "bg-card text-card-foreground", stripe: "bg-foreground/80", spine: "bg-foreground/5" },
  ink: { face: "bg-foreground text-background", stripe: "bg-background/70", spine: "bg-background/10" },
  muted: { face: "bg-muted text-foreground", stripe: "bg-foreground/70", spine: "bg-foreground/5" },
};

/**
 * A woven-cloth hairline, drawn from `--border` and nothing else.
 *
 * The job is the binding cue that separates a cover from a plain card. A noise
 * or grain layer would be depth theatre; one token at 1px every 6px is the same
 * cue at no cost, and it cannot drift from the palette because it has no colour
 * of its own.
 */
const TEXTURE: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(45deg, var(--border) 0 1px, transparent 1px 6px)",
};

/**
 * Container-query widths, per D19: a cover in a 300px sidebar and one in a
 * full-width grid resolve independently, because both read a container rather
 * than the viewport. The rungs are arbitrary values, not Tailwind's named
 * container steps — those do not share a scale with the named breakpoints,
 * which is the trap D19 records.
 *
 * The container is the CONSUMER's, not one this component establishes. That is
 * forced, not preferred: `container-type: inline-size` blocks content-based
 * sizing, so a wrapper that established its own container could not also size
 * itself to the px-wide face inside it — `w-fit` measured 0 and three covers in
 * a flex row rendered stacked on top of one another. Measuring a wrapper whose
 * width is the cover's own width would have been circular anyway. Put
 * `@container` on the shelf or grid; with no ancestor container the rungs
 * simply never match and the base width applies, which is a safe default.
 */
function widthVars(width: BookCoverWidth | undefined): React.CSSProperties | undefined {
  if (width === undefined) return undefined;
  if (typeof width === "number") {
    return {
      "--book-cover-w": `${width}px`,
      "--book-cover-w-md": `${width}px`,
      "--book-cover-w-lg": `${width}px`,
    } as React.CSSProperties;
  }
  // An unspecified step inherits the one below it, so `{ sm: 150, lg: 240 }`
  // holds 150 through the middle rung rather than collapsing to a default.
  const base = width.sm ?? width.md ?? width.lg;
  if (base === undefined) return undefined;
  const md = width.md ?? base;
  const lg = width.lg ?? md;
  return {
    "--book-cover-w": `${base}px`,
    "--book-cover-w-md": `${md}px`,
    "--book-cover-w-lg": `${lg}px`,
  } as React.CSSProperties;
}

interface BookCoverProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: string;
  variant?: BookCoverVariant;
  tone?: BookCoverTone;
  /** Sits above the title, or on the stripe when `variant="stripe"`. Decorative. */
  icon?: React.ReactNode;
  /** Fills the face behind the title when `variant="illustrated"`. Decorative. */
  illustration?: React.ReactNode;
  /** Adds the cloth-binding hairline. */
  textured?: boolean;
  /**
   * The heading level the title renders at. A grid of covers has to announce as
   * a list of titles, so this is a real heading and the caller places it in
   * their own outline.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Fixed px, or per-container-rung px. Omit to fill the available width. */
  width?: BookCoverWidth;
}

function BookCover({
  title,
  variant = "plain",
  tone = "paper",
  icon,
  illustration,
  textured = false,
  headingLevel = 3,
  width,
  className,
  ...props
}: BookCoverProps) {
  const t = TONE[tone];
  const vars = widthVars(width);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  // `illustrated` with nothing to illustrate is `plain` — falling back beats
  // rendering an empty well where a picture is implied.
  const showIllustration = variant === "illustrated" && Boolean(illustration);

  return (
    <div
      data-slot="book-cover"
      // Deliberately NOT a query container — see widthVars above. It only
      // carries the width variables and hugs the face: without `w-fit
      // shrink-0` this wrapper shrinks as a flex item while the px-sized face
      // does not, and the faces overlap.
      className={cn(vars ? "w-fit shrink-0" : "w-full", className)}
      style={vars}
      {...props}
    >
      <div
        data-slot="book-cover-face"
        className={cn(
          "relative flex aspect-[3/4] flex-col overflow-hidden rounded-s-sm rounded-e-lg border",
          vars
            ? "w-(--book-cover-w) @[24rem]:w-(--book-cover-w-md) @[40rem]:w-(--book-cover-w-lg)"
            : "w-full",
          t.face,
        )}
      >
        {textured ? <span aria-hidden="true" className="absolute inset-0" style={TEXTURE} /> : null}

        <span
          data-slot="book-cover-spine"
          aria-hidden="true"
          className={cn("absolute inset-y-0 start-0 w-2 border-e", t.spine)}
        />

        {showIllustration ? (
          <span
            data-slot="book-cover-illustration"
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden"
          >
            {illustration}
          </span>
        ) : null}

        {variant === "stripe" ? (
          <span
            data-slot="book-cover-stripe"
            aria-hidden="true"
            className={cn("relative mt-6 ms-6 h-1 w-10 shrink-0 rounded-full", t.stripe)}
          />
        ) : null}

        <div className={cn("relative mt-auto flex flex-col gap-2 p-4 ps-6", showIllustration && "pt-10")}>
          {icon ? (
            <span data-slot="book-cover-icon" aria-hidden="true" className="[&_svg]:size-5">
              {icon}
            </span>
          ) : null}
          <Heading data-slot="book-cover-title" className="text-pretty text-sm leading-snug font-medium">
            {title}
          </Heading>
        </div>
      </div>
    </div>
  );
}

export { BookCover, type BookCoverProps, type BookCoverTone, type BookCoverVariant, type BookCoverWidth };
