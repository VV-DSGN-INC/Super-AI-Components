"use client";

import { Bookmark, BookmarkCheck, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RecommendationCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Shown on the row and re-used as the modal title — one source, two renders. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Leading glyph on the row. Optional — a bare title still reads fine. */
  icon?: React.ReactNode;
  /** The "apps" half of "apps + steps" — the tools this recommendation touches. */
  apps?: string[];
  /**
   * "How it works", numbered. Only shown inside the modal — the row stays a
   * one-liner. A recommendation you cannot audit before committing is an
   * instruction, not a suggestion.
   */
  steps: string[];
  /** Label on the row trigger that opens the modal. Defaults to "Try it". */
  triggerLabel?: string;
  /** Label on the modal's commit action. Defaults to "Get started". */
  commitLabel?: string;
  /** Fires when the user commits from inside the modal, after reading the steps. */
  onTry?: () => void;
  saveLabel?: string;
  savedLabel?: string;
  onSaveForLater?: () => void;
  /**
   * Whether this recommendation is already saved. Controlled, same shape as
   * `dismissed` below — the component only renders the saved affordance,
   * the consumer owns persisting the choice.
   */
  saved?: boolean;
  /** Modal open state. Uncontrolled by default; pass `open` to control it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether this card is currently hidden. Controlled, following the
   * promo-card convention: the component owns rendering, the consumer owns
   * persistence. Dismissing does nothing to storage on its own — wire
   * `onDismiss` to whatever remembers the choice and feed the result back
   * in as `dismissed`.
   */
  dismissed?: boolean;
  onDismiss: () => void;
  dismissLabel?: string;
}

/**
 * Recommendation Card — "Recommended for you" with apps + steps. Two levels:
 * a one-line row in the feed, and a modal ("How it works") that lays out the
 * apps involved and the steps as a numbered list before the user commits.
 * Save for later sits next to Try it as a real middle option — dismissal
 * without one just trains people to dismiss.
 */
function RecommendationCard({
  title,
  description,
  icon,
  apps = [],
  steps,
  triggerLabel = "Try it",
  commitLabel = "Get started",
  onTry,
  saveLabel = "Save for later",
  savedLabel = "Saved",
  onSaveForLater,
  saved = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  dismissed = false,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  ...props
}: RecommendationCardProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const openControlled = openProp !== undefined;
  const open = openControlled ? openProp : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!openControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openControlled, onOpenChange],
  );

  if (dismissed) return null;

  const saveButton = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onSaveForLater}
      disabled={saved}
      data-slot="recommendation-card-save"
    >
      {saved ? (
        <>
          <BookmarkCheck aria-hidden className="size-3.5" />
          {savedLabel}
        </>
      ) : (
        <>
          <Bookmark aria-hidden className="size-3.5" />
          {saveLabel}
        </>
      )}
    </Button>
  );

  return (
    <Card
      data-slot="recommendation-card"
      className={cn("relative w-full max-w-sm border", className)}
      {...props}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={dismissLabel}
        onClick={onDismiss}
        data-slot="recommendation-card-dismiss"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
      >
        <X aria-hidden className="size-3.5" />
      </Button>

      <CardContent className="flex flex-col gap-3 pr-6">
        <div className="flex items-start gap-2">
          {icon ? (
            <div data-slot="recommendation-card-icon" className="text-primary mt-0.5 shrink-0 [&_svg]:size-4">
              {icon}
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <p data-slot="recommendation-card-title" className="text-sm leading-snug font-medium">
              {title}
            </p>
            {description ? (
              <p data-slot="recommendation-card-description" className="text-muted-foreground text-xs leading-snug">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {apps.length > 0 ? (
          <div data-slot="recommendation-card-apps" className="flex flex-wrap items-center gap-1.5">
            {apps.map((app) => (
              <Badge key={app} variant="secondary">
                {app}
              </Badge>
            ))}
          </div>
        ) : null}

        <div data-slot="recommendation-card-actions" className="flex flex-wrap items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              data-slot="recommendation-card-trigger"
              render={<Button type="button" size="sm" />}
            >
              {triggerLabel}
            </DialogTrigger>
            <DialogContent data-slot="recommendation-card-dialog">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </DialogHeader>

              {apps.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {apps.map((app) => (
                    <Badge key={app} variant="secondary">
                      {app}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <ol data-slot="recommendation-card-steps" className="flex flex-col gap-2 text-sm">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span
                      aria-hidden
                      className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <DialogFooter>
                {saveButton}
                <Button
                  type="button"
                  onClick={() => {
                    onTry?.();
                    setOpen(false);
                  }}
                  data-slot="recommendation-card-commit"
                >
                  {commitLabel}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {saveButton}
        </div>
      </CardContent>
    </Card>
  );
}

export { RecommendationCard };
export type { RecommendationCardProps };
