import { ArrowRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type BentoGridProps = React.ComponentProps<"div">;

/**
 * One column on a phone, two from `sm`, three from `lg`. A card that spans
 * should span responsively too (`sm:col-span-2`, not `col-span-2`): a bare
 * span in the one-column layout adds an implicit second column and the page
 * scrolls sideways.
 */
function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      className={cn(
        "grid w-full auto-rows-[14rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The link is all or nothing: pass `href` and `cta` together, or neither and
 * the card renders no link. There is no default label and no `#` fallback,
 * because a generic "Learn more" pointing nowhere is a dead tab stop with a
 * name that says nothing out of context.
 */
type BentoCardLink =
  | {
      /** Where the card's link goes. */
      href: string;
      /** The link's label, revealed on hover or focus (always shown on touch). Name the destination. */
      cta: string;
    }
  | { href?: undefined; cta?: undefined };

type BentoCardProps = React.ComponentProps<"div"> &
  BentoCardLink & {
    name: string;
    description: string;
    icon?: React.ReactNode;
    /** Decorative layer behind the content (pattern, chart, image…). */
    background?: React.ReactNode;
  };

function BentoCard({ name, description, cta, href, icon, background, className, ...props }: BentoCardProps) {
  return (
    <div
      data-slot="bento-card"
      className={cn(
        "group bg-background relative flex flex-col justify-end overflow-hidden rounded-xl border",
        className,
      )}
      {...props}
    >
      {background && (
        <div data-slot="bento-card-background" aria-hidden="true" className="absolute inset-0">
          {background}
        </div>
      )}
      {/* Lifts to make room for the link. On a coarse pointer there is no
          hover, so the link is always shown and the content always lifted. */}
      <div
        className={cn(
          "z-10 flex flex-col gap-1 p-5 transition-transform duration-300 motion-reduce:transition-none",
          href &&
            "group-focus-within:-translate-y-8 group-hover:-translate-y-8 pointer-coarse:-translate-y-8",
        )}
      >
        {icon && (
          <div data-slot="bento-card-icon" className="text-muted-foreground mb-2 [&>svg]:size-8">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {href ? (
        <div
          data-slot="bento-card-cta"
          className="absolute bottom-0 z-10 flex w-full translate-y-2 items-center p-5 opacity-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100"
        >
          <a
            href={href}
            className="text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            {cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="group-hover:bg-muted/40 pointer-events-none absolute inset-0 transition-colors duration-300"
      />
    </div>
  );
}

export { BentoCard, BentoGrid };
export type { BentoCardProps, BentoGridProps };
