"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Feature Announcement — New-feature surface
 *
 * Spec: docs/design-system/component-specs.md#l3-feature-announcement
 * States: modal · anchored · inline-card · dismissible-chip · stage-badge
 *
 * Four escalation levels, one component. `level` picks the presentation; the
 * content props are identical across all four, because the decision a consumer
 * makes here is "how loud should this be", not "which component do I import".
 */

/**
 * Ordered loudest → quietest. Escalation should match the news:
 *
 * - `modal`            — interrupts. A launch that changes how the product works.
 * - `anchored`         — points at the control the feature lives on. A new affordance.
 * - `inline-card`      — sits in the flow of a surface. Worth reading, not worth blocking.
 * - `dismissible-chip` — a line of text. A tweak, a rename, a limit change.
 *
 * A modal for a minor tweak is the anti-pattern this component exists to make
 * visible: the four levels are one prop apart, so downgrading costs a word.
 */
const FEATURE_ANNOUNCEMENT_LEVELS = ["modal", "anchored", "inline-card", "dismissible-chip"] as const;

type FeatureAnnouncementLevel = (typeof FEATURE_ANNOUNCEMENT_LEVELS)[number];

/**
 * Stage badges set expectations before the user spends attention. The three
 * named stages get distinct badge treatments; anything else (a version string
 * such as "v2.4") renders in the neutral treatment. The stage is always its own
 * word on screen — never a bare coloured dot — so it survives for colourblind
 * and screen-reader users alike.
 */
const STAGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  new: "default",
  beta: "secondary",
  preview: "outline",
};

interface FeatureAnnouncementProps
  extends Omit<React.ComponentProps<"div">, "title" | "id" | "children" | "onSelect"> {
  /**
   * Required, and the whole reason dismissal can be trusted. Every dismissal
   * emits this id (`onDismiss(id)`) so the host can record *which* announcement
   * was dismissed. Change it only when the news changes — reusing an id shows
   * nothing new, and minting a fresh one for the same news re-shows an
   * announcement the user already dismissed, which is the most-hated pattern on
   * this surface.
   */
  id: string;
  /** Escalation level. See `FEATURE_ANNOUNCEMENT_LEVELS`. */
  level?: FeatureAnnouncementLevel;
  /**
   * The headline. A plain string rather than a node on purpose: it is also the
   * source of the dismiss control's accessible name, so it has to read as text.
   */
  title: string;
  description?: React.ReactNode;
  /** "New", "Beta", "Preview", or a version string such as "v2.4". */
  stage?: string;
  /**
   * Screenshot, loop, or diagram. Rendered by `modal`, `anchored` and
   * `inline-card`; ignored by `dismissible-chip`, which is a line of text by
   * definition — if the news needs a picture, it needs a louder level.
   */
  media?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onCtaClick?: () => void;
  /**
   * `anchored` only: the control the announcement points at, used as the
   * popover trigger. Pass the feature's own button so the popover lands on the
   * thing it describes. Falls back to a labelled button.
   */
  anchor?: React.ReactElement<Record<string, unknown>>;
  /** Visible label for the fallback anchor. */
  anchorLabel?: string;
  /** `modal`/`anchored` only. Uncontrolled and open by default — an announcement announces. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether this announcement has already been dismissed. The component is
   * controlled and deliberately stateless about persistence: it never writes to
   * localStorage, cookies, or a backend. It emits, the host stores. Feed the
   * stored answer back in here.
   */
  dismissed?: boolean;
  /** Receives the announcement `id`, so one handler can serve every announcement. */
  onDismiss: (id: string) => void;
  /**
   * Overrides the dismiss control's accessible name. The default names the
   * announcement ("Dismiss announcement: Multi-track timeline") rather than
   * saying "Close", which tells a screen-reader user nothing about what is
   * going away when several announcements share a screen.
   */
  dismissLabel?: string;
}

function FeatureAnnouncement({
  id,
  level = "inline-card",
  title,
  description,
  stage,
  media,
  ctaLabel,
  onCtaClick,
  anchor,
  anchorLabel = "What's new",
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  dismissed = false,
  onDismiss,
  dismissLabel,
  className,
  ...props
}: FeatureAnnouncementProps) {
  const isOverlay = level === "modal" || level === "anchored";
  // Names the anchored level's popup, which Base UI renders as role="dialog".
  const titleId = React.useId();

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    // Closing an overlay announcement *is* dismissing it — Escape and the
    // backdrop have to persist for the same reason the ✕ does, or the
    // announcement returns on the next page load.
    if (!next) onDismiss(id);
  };

  if (dismissed) return null;

  const handleDismiss = () => {
    if (isOverlay) handleOpenChange(false);
    else onDismiss(id);
  };

  const stageNode = stage ? (
    <Badge
      data-slot="feature-announcement-stage"
      data-stage={stage}
      variant={STAGE_VARIANT[stage.trim().toLowerCase()] ?? "outline"}
    >
      {stage}
    </Badge>
  ) : null;

  const dismissButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      data-slot="feature-announcement-dismiss"
      aria-label={dismissLabel ?? `Dismiss announcement: ${title}`}
      onClick={handleDismiss}
      className="shrink-0 text-muted-foreground hover:text-foreground"
    >
      <X aria-hidden className="size-3.5" />
    </Button>
  );

  const mediaNode = media ? (
    <div data-slot="feature-announcement-media" className="overflow-hidden rounded-lg">
      {media}
    </div>
  ) : null;

  const rootProps = {
    "data-slot": "feature-announcement",
    "data-level": level,
    "data-announcement-id": id,
    ...props,
  };

  if (level === "modal") {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent {...rootProps} showCloseButton={false} className={cn("sm:max-w-md", className)}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col items-start gap-2">
                {stageNode}
                <DialogTitle data-slot="feature-announcement-title">{title}</DialogTitle>
              </div>
              {dismissButton}
            </div>
            {description ? (
              <DialogDescription data-slot="feature-announcement-description">{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {mediaNode}
          {ctaLabel != null ? (
            <DialogFooter>
              <Button type="button" size="sm" data-slot="feature-announcement-cta" onClick={onCtaClick}>
                {ctaLabel}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  if (level === "anchored") {
    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          data-slot="feature-announcement-anchor"
          render={anchor ?? <Button variant="outline" size="sm" />}
        >
          {anchor ? undefined : anchorLabel}
        </PopoverTrigger>
        {/* Base UI gives the popup role="dialog", and a dialog with no
            accessible name fails axe outright (aria-dialog-name). The modal
            level gets its name from DialogTitle; this level has to say so
            itself, pointing at the same visible title. */}
        <PopoverContent
          {...rootProps}
          aria-labelledby={titleId}
          align="start"
          className={cn("w-80", className)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col items-start gap-1.5">
              {stageNode}
              <p
                id={titleId}
                data-slot="feature-announcement-title"
                className="text-sm leading-snug font-medium"
              >
                {title}
              </p>
            </div>
            {dismissButton}
          </div>
          {description ? (
            <p data-slot="feature-announcement-description" className="text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
          {mediaNode}
          {ctaLabel != null ? (
            <Button
              type="button"
              size="sm"
              data-slot="feature-announcement-cta"
              onClick={onCtaClick}
              className="self-start"
            >
              {ctaLabel}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  if (level === "dismissible-chip") {
    return (
      // A chip is a container with sibling controls, never a button wrapping a
      // button — the CTA and the ✕ sit next to the text, not inside a pressable
      // frame (axe `nested-interactive`).
      <div
        {...rootProps}
        className={cn(
          "flex w-fit max-w-md items-center gap-2 rounded-full bg-card py-1 pr-1 pl-2.5 text-sm text-card-foreground ring-1 ring-foreground/10",
          className,
        )}
      >
        {stageNode}
        <span data-slot="feature-announcement-title" className="truncate font-medium">
          {title}
        </span>
        {description ? (
          <span data-slot="feature-announcement-description" className="truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
        {ctaLabel != null ? (
          <Button
            type="button"
            size="xs"
            variant="link"
            data-slot="feature-announcement-cta"
            onClick={onCtaClick}
            className="shrink-0"
          >
            {ctaLabel}
          </Button>
        ) : null}
        {dismissButton}
      </div>
    );
  }

  return (
    <Card {...rootProps} className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle data-slot="feature-announcement-title" className="flex items-center gap-2">
          {stageNode}
          <span>{title}</span>
        </CardTitle>
        {description ? (
          <CardDescription data-slot="feature-announcement-description">{description}</CardDescription>
        ) : null}
        <CardAction>{dismissButton}</CardAction>
      </CardHeader>
      {mediaNode ? <CardContent>{mediaNode}</CardContent> : null}
      {ctaLabel != null ? (
        <CardContent>
          <Button
            type="button"
            size="sm"
            data-slot="feature-announcement-cta"
            onClick={onCtaClick}
            className="self-start"
          >
            {ctaLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export { FEATURE_ANNOUNCEMENT_LEVELS, FeatureAnnouncement };
export type { FeatureAnnouncementLevel, FeatureAnnouncementProps };
