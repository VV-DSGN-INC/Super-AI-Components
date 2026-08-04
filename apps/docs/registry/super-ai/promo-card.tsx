"use client";

import { RefreshCw, Sparkles, TriangleAlert, UserPlus, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PromoCardFlavour = "upgrade" | "invite" | "update-available" | "quota-warning";

interface PromoCardFlavourMeta {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconClass: string;
  toneClass: string;
  /**
   * Overrides the CTA button's default (variant="default") styling. Needed
   * when a flavour's own tinted background stacks with the button variant's
   * translucent colours and drops below 4.5:1 — quota-warning's destructive
   * button is the only flavour that currently needs this; every other
   * flavour's CTA renders on an opaque primary/primary-foreground pair that
   * clears contrast regardless of the card's tint.
   */
  ctaClassName?: string;
  /** Quota warnings carry the only flavour that needs to interrupt, not just inform. */
  urgent?: boolean;
}

// Every flavour pairs a distinct icon shape with its tone class, so the four
// states never rely on colour alone — the icon glyph still reads on its own.
const FLAVOUR_META: Record<PromoCardFlavour, PromoCardFlavourMeta> = {
  upgrade: {
    icon: Sparkles,
    iconClass: "text-primary",
    toneClass: "border-primary/30 bg-primary/5",
  },
  invite: {
    icon: UserPlus,
    iconClass: "text-accent-foreground",
    toneClass: "border-border bg-accent/30",
  },
  "update-available": {
    icon: RefreshCw,
    iconClass: "text-muted-foreground",
    toneClass: "border-border bg-muted/30",
  },
  "quota-warning": {
    icon: TriangleAlert,
    iconClass: "text-destructive",
    toneClass: "border-destructive/40 bg-destructive/10",
    // The soft destructive/10-on-destructive/10 button (Button's own
    // `variant="destructive"` style) drops to ~3.4:1 once it's stacked on
    // top of this flavour's own destructive/10 card tint. Going solid here
    // — bg-destructive paired with text-background, which is white in light
    // mode and near-black in dark mode, i.e. it always inverts against the
    // saturated destructive fill — clears 4.5:1 in both themes and reads as
    // more urgent than the other flavours' neutral CTA, not less.
    ctaClassName: "bg-destructive text-background hover:bg-destructive/90",
    urgent: true,
  },
};

interface PromoCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  flavour: PromoCardFlavour;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Illustration or product shot. Optional in every flavour — omit it in a
   * cramped sidebar placement and the card still reads fine. */
  art?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onCtaClick?: () => void;
  /**
   * Whether this card is currently hidden. The component is controlled: it
   * owns rendering, the consumer owns persistence. Dismissing does nothing
   * to storage, cookies, or a backend flag on its own — wire `onDismiss` to
   * whatever remembers the choice (localStorage, a user preference, a query
   * param) and feed the result back in as `dismissed`. A promo that returns
   * every session because that wiring was skipped reads as a bug, not a
   * missing feature.
   */
  dismissed?: boolean;
  onDismiss: () => void;
  dismissLabel?: string;
}

/**
 * Promo Card — the ambient upgrade/invite/update/quota-warning CTA that sits
 * in a sidebar rather than blocking an action. One component, four flavours;
 * see `PromoCardFlavour`. Always dismissible — see `dismissed`/`onDismiss`.
 */
function PromoCard({
  flavour,
  title,
  description,
  art,
  ctaLabel,
  onCtaClick,
  dismissed = false,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  ...props
}: PromoCardProps) {
  if (dismissed) return null;

  const { icon: Icon, iconClass, toneClass, ctaClassName, urgent } = FLAVOUR_META[flavour];

  return (
    <div
      data-slot="promo-card"
      data-flavour={flavour}
      role={urgent ? "alert" : undefined}
      className={cn(
        "relative flex w-full max-w-sm flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground",
        toneClass,
        className,
      )}
      {...props}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={dismissLabel}
        onClick={onDismiss}
        data-slot="promo-card-dismiss"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
      >
        <X aria-hidden className="size-3.5" />
      </Button>

      {art ? (
        <div data-slot="promo-card-art" className="overflow-hidden rounded-lg">
          {art}
        </div>
      ) : null}

      <div className="flex items-start gap-2 pr-6">
        <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
        <div className="flex flex-col gap-1">
          {/* Urgency has to survive past colour for AT users too — a plain
              sr-only prefix, kept out of the title node so getByText(title)
              (and any consumer doing the same) still matches exactly. */}
          {urgent ? <span className="sr-only">Warning:</span> : null}
          <p data-slot="promo-card-title" className="text-sm leading-snug font-medium">
            {title}
          </p>
          {description ? (
            // text-muted-foreground reads fine on the bare bg-card surface,
            // but every flavour tints that surface (border-primary/30
            // bg-primary/5 through border-destructive/40 bg-destructive/10)
            // and muted-foreground's contrast against those tints — ~4.3–4.6:1
            // by the same math axe used to catch quota-warning at 3.98 — sits
            // right at or under the 4.5:1 line for every flavour, not just
            // the one axe happened to run against. text-foreground/70 keeps
            // the description visually lighter
            // than the title (which is full-strength text-card-foreground)
            // while clearing 4.5:1 against all four tints with margin to
            // spare (~7:1+), so it doesn't reintroduce the same near-miss.
            <p data-slot="promo-card-description" className="text-foreground/70 text-xs leading-snug">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {onCtaClick ? (
        <Button
          type="button"
          size="sm"
          variant={flavour === "quota-warning" ? "destructive" : "default"}
          onClick={onCtaClick}
          data-slot="promo-card-cta"
          className={cn("self-start", ctaClassName)}
        >
          {ctaLabel ?? "Learn more"}
        </Button>
      ) : null}
    </div>
  );
}

export { PromoCard };
export type { PromoCardFlavour, PromoCardProps };
