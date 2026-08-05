"use client";

import { Bell, Check, Gauge, Server } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Rate Limit Banner — the wait, stated inline and truthfully.
 *
 * Spec: docs/design-system/component-specs.md#m6-rate-limit-banner
 * States: your-limit · provider-capacity · live-countdown · notify-me
 *
 * Three rules carry the weight:
 *
 * 1. **Your quota and the provider's capacity are two different facts and get
 *    two different sentences.** They are not one "rate limited" state with a
 *    swapped noun: one is a boundary you bought, the other is weather. Neither
 *    is written as the user's fault — each body line says outright which thing
 *    is *not* wrong, because the failure mode this component exists to prevent
 *    is a busy model reading as "you did something".
 * 2. **A live countdown, not "try again later".** `remainingSeconds` is a prop.
 *    The component holds no timer and fetches nothing — the host owns the
 *    clock, the same rule `quota-meter` follows for `resetsIn`. A component
 *    that ticks itself desyncs from the host's real reset, and can't be
 *    server-rendered without a hydration mismatch.
 * 3. **Inline, persistent, never a toast.** The constraint outlives any toast
 *    duration, so this renders above the composer and stays until the host
 *    removes it. That is also why the root is `role="note"` rather than the
 *    `role="alert"` the vendored Alert defaults to: an assertive live region
 *    wrapping a value that changes every second would interrupt a screen-reader
 *    user once a second, forever.
 *
 * Announcements are throttled *structurally* rather than by a timer: the
 * visible clock is not inside a live region at all, and the one live region
 * (`rate-limit-banner-status`, sr-only, `role="status"` = polite) carries a
 * deliberately coarse phrase — "about 3 minutes left" — whose text only
 * changes when the minute (or hour) bucket does. A ticking second never
 * reaches it, so the region speaks at most once a minute.
 */

type RateLimitCause = "your-limit" | "provider-capacity";

/**
 * Fixed per cause, and not overridable by prop. If the caller could pass the
 * title, the distinction this component exists to enforce would immediately
 * erode back into one generic "rate limited" string.
 */
const COPY: Record<
  RateLimitCause,
  {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
    countdownPrefix: string;
    readyText: string;
    noEtaText: string;
    notifyLabel: string;
    notifyConfirmation: string;
  }
> = {
  "your-limit": {
    icon: Gauge,
    title: "You've reached your plan's limit",
    body: "This is the cap on your plan, not a problem with your request.",
    countdownPrefix: "Resets in",
    readyText: "Your limit has reset — you can send again.",
    noEtaText: "No reset time reported yet.",
    notifyLabel: "Notify me when my limit resets",
    notifyConfirmation: "We'll let you know the moment it resets.",
  },
  "provider-capacity": {
    icon: Server,
    title: "The model is at capacity",
    body: "Demand is high right now. Nothing is wrong with your account or your request.",
    countdownPrefix: "Estimated wait",
    readyText: "Capacity is back — you can send again.",
    noEtaText: "No estimate yet — the provider hasn't given one.",
    notifyLabel: "Notify me when capacity returns",
    notifyConfirmation: "We'll let you know the moment capacity returns.",
  },
};

/** `2:34`, or `1:02:30` once the wait passes an hour. Clamps at zero. */
function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

/** "2 minutes 34 seconds" — the accessible name for the clock, read on demand. */
function spellDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * The throttle. Buckets the remaining time so the live region's text is stable
 * for a whole minute (or a whole hour) at a time — a second-by-second live
 * region is the single worst thing a countdown can do to a screen-reader user,
 * and the fix is coarser content, not a slower timer.
 */
function countdownAnnouncement(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return "available now";
  if (remainingSeconds < 60) return "less than a minute left";
  const minutes = Math.ceil(remainingSeconds / 60);
  if (minutes < 60) return `about ${minutes} minute${minutes === 1 ? "" : "s"} left`;
  const hours = Math.ceil(minutes / 60);
  return `about ${hours} hour${hours === 1 ? "" : "s"} left`;
}

// `resource` is omitted from the div props because RDFa already claims that
// attribute name as a string — ours is a node.
interface RateLimitBannerProps extends Omit<React.ComponentProps<"div">, "resource"> {
  /**
   * Whose constraint this is. Drives every word of the copy — these are not two
   * skins of one message.
   */
  cause: RateLimitCause;
  /** What is constrained: "Image generations", "Claude Opus 4.5". */
  resource?: React.ReactNode;
  /**
   * Seconds left, ticked by the host. This component starts no interval — pass
   * a fresh value each second and the countdown is live; omit it and the banner
   * says so honestly instead of inventing "try again later".
   */
  remainingSeconds?: number;
  /** Opt-in for when the wait ends. Omit and no opt-in renders. */
  onNotifyMe?: () => void;
  /** Whether the opt-in has been taken. Controlled — the host owns the subscription. */
  notifyEnabled?: boolean;
  /** An escape hatch that isn't waiting: upgrade, switch model, queue it. */
  action?: React.ReactNode;
}

function RateLimitBanner({
  cause,
  resource,
  remainingSeconds,
  onNotifyMe,
  notifyEnabled = false,
  action,
  className,
  ...props
}: RateLimitBannerProps) {
  const copy = COPY[cause];
  const Icon = copy.icon;
  const hasCountdown = typeof remainingSeconds === "number";
  const isReady = hasCountdown && remainingSeconds <= 0;

  // One live-region string, assembled from coarse parts only. It changes when
  // the minute bucket rolls over or the opt-in is taken — never on a tick.
  const statusText = [
    copy.title,
    hasCountdown ? countdownAnnouncement(remainingSeconds) : null,
    notifyEnabled ? "You will be notified when it is available" : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Alert
      // Not `alert`. This banner persists for the whole constraint, and its
      // content changes every second; assertive would mean interrupting a
      // screen reader every second for as long as the limit holds.
      role="note"
      data-slot="rate-limit-banner"
      data-cause={cause}
      // The two causes deliberately share one frame. Distinguishing "your fault"
      // from "not your fault" by hue would be exactly the colour-alone signal
      // the a11y baseline forbids — the icon shape and the words carry it.
      className={cn("border-warning/40 bg-warning/5", className)}
      {...props}
    >
      <Icon className="size-4" />
      <AlertTitle data-slot="rate-limit-banner-title">{copy.title}</AlertTitle>
      {/* AlertDescription is one grid cell, so everything below the title has to
          stack inside it — a sibling of AlertDescription would land under the
          icon in the Alert's two-column grid. */}
      <AlertDescription className="text-foreground flex flex-col items-start gap-1.5">
        <span data-slot="rate-limit-banner-body">{copy.body}</span>

        {resource ? (
          <span data-slot="rate-limit-banner-resource" className="text-xs font-medium">
            {resource}
          </span>
        ) : null}

        {hasCountdown ? (
          <span data-slot="rate-limit-banner-countdown" className="text-xs">
            {isReady ? (
              copy.readyText
            ) : (
              <>
                {copy.countdownPrefix}{" "}
                <span
                  dir="ltr"
                  className="font-medium tabular-nums"
                  aria-label={spellDuration(remainingSeconds)}
                >
                  {formatCountdown(remainingSeconds)}
                </span>
              </>
            )}
          </span>
        ) : (
          // The honest alternative to a countdown is "we don't know" plus an
          // opt-in — never "try again later", which asks the user to poll.
          <span data-slot="rate-limit-banner-no-eta" className="text-xs">
            {copy.noEtaText}
          </span>
        )}

        {onNotifyMe || action ? (
          <span className="mt-1 flex flex-wrap items-center gap-2">
            {onNotifyMe ? (
              <Button
                data-slot="rate-limit-banner-notify"
                type="button"
                variant="outline"
                size="sm"
                // The label stays put and `aria-pressed` carries the state, so
                // the control never renames itself under a returning user.
                aria-pressed={notifyEnabled}
                onClick={onNotifyMe}
              >
                {notifyEnabled ? <Check aria-hidden /> : <Bell aria-hidden />}
                {copy.notifyLabel}
              </Button>
            ) : null}
            {action ? <span data-slot="rate-limit-banner-action">{action}</span> : null}
          </span>
        ) : null}

        {onNotifyMe && notifyEnabled ? (
          // Visible confirmation as text, not as a colour change on the button:
          // "opted in" must survive for anyone who can't see the variant swap.
          <span data-slot="rate-limit-banner-notify-status" className="text-xs">
            {copy.notifyConfirmation}
          </span>
        ) : null}
      </AlertDescription>

      {/* Polite, sr-only, and coarse. See countdownAnnouncement. */}
      <span data-slot="rate-limit-banner-status" role="status" className="sr-only">
        {statusText}
      </span>
    </Alert>
  );
}

export { RateLimitBanner, countdownAnnouncement, formatCountdown };
export type { RateLimitBannerProps, RateLimitCause };
