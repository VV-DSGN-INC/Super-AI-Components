import { ArrowRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type BentoGridProps = React.ComponentProps<"div">;

function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      className={cn("grid w-full auto-rows-[14rem] grid-cols-3 gap-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoCardProps extends React.ComponentProps<"div"> {
  name: string;
  description: string;
  /** CTA label revealed on hover. */
  cta?: string;
  href?: string;
  icon?: React.ReactNode;
  /** Decorative layer behind the content (pattern, chart, image…). */
  background?: React.ReactNode;
}

function BentoCard({
  name,
  description,
  cta = "Learn more",
  href = "#",
  icon,
  background,
  className,
  ...props
}: BentoCardProps) {
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
      <div className="z-10 flex flex-col gap-1 p-5 transition-all duration-300 group-hover:-translate-y-8 group-focus-within:-translate-y-8">
        {icon && (
          <div data-slot="bento-card-icon" className="text-muted-foreground mb-2 [&>svg]:size-8">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div
        data-slot="bento-card-cta"
        className="absolute bottom-0 z-10 flex w-full translate-y-2 items-center p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <a href={href} className="text-primary inline-flex items-center gap-1 text-sm font-medium">
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
      <div
        aria-hidden="true"
        className="group-hover:bg-muted/40 pointer-events-none absolute inset-0 transition-colors duration-300"
      />
    </div>
  );
}

export { BentoCard, BentoGrid };
export type { BentoCardProps, BentoGridProps };
