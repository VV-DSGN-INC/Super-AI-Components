"use client";

import { Gauge, KeyRound, Lock } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCost, formatShortfall, useCost, type Cost } from "@/registry/super-ai/cost";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Paywall Message — the run that did not happen, held open so upgrading resumes it.
 *
 * Spec: docs/design-system/component-specs.md — M5 `paywall-message`
 * States: locked-model · quota-exhausted · feature-locked
 *
 * Three rules, and the first one is the whole component:
 *
 * 1. "The card carries the prompt and model it WOULD have used, so upgrading
 *    resumes the exact work." A paywall that drops the prompt makes you retype
 *    it after paying, which is the worst possible first minute of a new plan.
 *    That is why `prompt` is required, why it renders at full strength rather
 *    than greyed, and why `onUpgrade` is handed a `{ prompt, model }` resume
 *    payload instead of being a bare click handler — the resume is an API fact
 *    here, not just something the card happens to display.
 * 2. "Greyed preview text shows what was going to be produced." Greyed, but
 *    never *only* greyed: the preview carries a visible caption, so what it is
 *    survives for anyone who cannot see the dimming.
 * 3. "The agent explains in prose before and after; a bare upgrade card reads
 *    as an ad." Hence `before` (required) and `after` — this component is a
 *    turn in a message stream, not a standalone banner.
 *
 * Affordability comes from the cost contract and is never a prop: `useCost`
 * derives `insufficient`/`shortfall` from the estimate and the balance, so the
 * number here cannot disagree with the run button's or the credits ring's.
 */

/** Which gate fired. Three different facts, three different next actions. */
type PaywallReason = "locked-model" | "quota-exhausted" | "feature-locked";

/** What `onUpgrade` gets handed back, so the caller can re-run the exact work. */
interface PaywallResume {
  prompt: string;
  model?: string;
}

interface PaywallReasonCopy {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  cta: string;
  /** Caption over the held prompt — phrased for the gate that fired. */
  resumeLabel: string;
}

/**
 * Per-reason copy, and a distinct icon *shape* per reason so the three states
 * are never told apart by tone alone. The wording differs because the three
 * gates are genuinely different problems: a model you cannot use, a balance
 * you have spent, and a capability you never had.
 */
const COPY: Record<PaywallReason, PaywallReasonCopy> = {
  "locked-model": {
    icon: Lock,
    title: "This model is not on your plan",
    description: "The run was not started, so nothing was charged.",
    cta: "Upgrade to use this model",
    resumeLabel: "Saved — this runs as-is once the model is available",
  },
  "quota-exhausted": {
    icon: Gauge,
    title: "You are out of credits",
    description: "The run was not started, so nothing was charged.",
    cta: "Upgrade for more credits",
    resumeLabel: "Saved — this runs as-is once you have the credits",
  },
  "feature-locked": {
    icon: KeyRound,
    title: "This feature is not on your plan",
    description: "The run was not started, so nothing was charged.",
    cta: "Upgrade to unlock it",
    resumeLabel: "Saved — this runs as-is once the feature is unlocked",
  },
};

interface PaywallMessageProps extends Omit<React.ComponentProps<"div">, "title" | "prefix"> {
  /** Which gate fired. Not an affordability flag — see `cost`. */
  state: PaywallReason;
  /**
   * The prompt that would have run, verbatim. Required: this is the component.
   * A paywall that loses it charges the user twice — once in money, once in
   * retyping.
   */
  prompt: string;
  /** The model it would have used. Part of the resume, not decoration. */
  model?: string;
  /** Greyed sample of the output that was going to be produced. */
  preview?: React.ReactNode;
  /** The plan or entitlement this needs, e.g. "Pro". Rendered as text, not colour. */
  requirement?: React.ReactNode;
  /**
   * The estimate for the blocked run. `insufficient` and `shortfall` are
   * DERIVED from it by `useCost` against the balance in `CostProvider` — they
   * are deliberately not props, so this card and the run button cannot
   * disagree about whether you can afford the same job.
   */
  cost?: Cost;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * The agent's own words, above the card. Required, because "a bare upgrade
   * card reads as an ad" — the explanation is what makes this a turn in a
   * conversation rather than an interstitial.
   */
  before: React.ReactNode;
  /** The agent's follow-on, below the card: what to do meanwhile, or what happens next. */
  after?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  /** Handed the resume payload, so the caller can re-run the exact work. */
  onUpgrade?: (resume: PaywallResume) => void;
  /**
   * Label for the secondary top-up action. That action renders only when the
   * cost contract supplies `onTopUp` *and* money is actually what is missing —
   * the quota gate fired, or the contract derived a shortfall. Topping up and
   * upgrading are different purchases; the card never sells the wrong one.
   */
  topUpLabel?: React.ReactNode;
}

function PaywallMessage({
  state,
  prompt,
  model,
  preview,
  requirement,
  cost,
  title,
  description,
  before,
  after,
  ctaLabel,
  onUpgrade,
  topUpLabel = "Top up",
  className,
  ...props
}: PaywallMessageProps) {
  const titleId = React.useId();
  const copy = COPY[state];
  const Icon = copy.icon;

  // Props beat context, context beats nothing, and affordability is computed
  // exactly once — here, by the contract, never handed in.
  const resolved = useCost(cost);
  const shortfall = formatShortfall(resolved);

  // Topping up only ever helps when money is what is missing. Offering it on a
  // locked model or a locked feature sells the wrong thing: more credits buy
  // nothing you could not already afford. So the button needs both an
  // `onTopUp` from the contract and a reason — the quota gate having fired, or
  // the contract having derived that the balance falls short.
  const canTopUp = Boolean(resolved.onTopUp) && (state === "quota-exhausted" || resolved.insufficient);

  return (
    <div
      data-slot="paywall-message"
      data-state={state}
      className={cn("flex w-full max-w-md flex-col gap-3", className)}
      {...props}
    >
      {/* Prose first. The card is the artefact the sentence refers to. */}
      {before ? (
        <p data-slot="paywall-message-before" className="text-sm leading-relaxed">
          {before}
        </p>
      ) : null}

      <Card
        // Overriding a vendored ui/ primitive's slot is house idiom; nothing
        // keys on `card`. (A registry component's slot would be off-limits.)
        data-slot="paywall-message-card"
        // Named region rather than a live one: the surrounding stream already
        // announces the turn, and an assertive re-announcement of a card the
        // user is being invited to read would interrupt rather than inform.
        role="group"
        aria-labelledby={titleId}
      >
        <CardHeader>
          <CardTitle id={titleId} data-slot="paywall-message-title" className="flex items-center gap-2">
            {/* Icon plus words: three distinct glyphs, and the sentence still
                carries the state if the glyph never renders. */}
            <Icon aria-hidden className="size-4 shrink-0" />
            {title ?? copy.title}
          </CardTitle>
          {requirement ? (
            <CardAction>
              <Badge variant="secondary" data-slot="paywall-message-requirement">
                {requirement}
              </Badge>
            </CardAction>
          ) : null}
          {/* text-foreground/70, not text-muted-foreground: the description sits
              beside the muted-tinted resume block and the muted cost chip, and
              the muted-on-muted pairing measures 4.34:1 against a 4.5 minimum.
              Same fix promo-card and member-gate-row use. */}
          <p data-slot="paywall-message-description" className="text-foreground/70 text-sm leading-snug">
            {description ?? copy.description}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/*
            The held work. Full strength on purpose — the preview below is what
            gets greyed, because it does not exist yet; the prompt does, and
            dimming it would suggest it had been thrown away.
          */}
          <div
            data-slot="paywall-message-resume"
            className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 px-3 py-2.5"
          >
            <span data-slot="paywall-message-resume-label" className="text-foreground/70 text-xs">
              {copy.resumeLabel}
            </span>
            <p data-slot="paywall-message-prompt" className="text-foreground text-sm leading-snug">
              {prompt}
            </p>
            {model ? (
              <span data-slot="paywall-message-model" className="text-foreground text-xs">
                Model: {model}
              </span>
            ) : null}
          </div>

          {preview ? (
            // Greyed, and captioned. The dimming says "not real yet" to someone
            // who can see it; the caption says the same thing to everyone else,
            // which is the rule about never conveying state by colour alone.
            <div data-slot="paywall-message-preview" className="border-border flex flex-col gap-1 border-l-2 pl-3">
              <span data-slot="paywall-message-preview-label" className="text-foreground text-xs font-medium">
                Would have produced
              </span>
              <div data-slot="paywall-message-preview-body" className="text-foreground/70 text-sm leading-snug italic">
                {preview}
              </div>
            </div>
          ) : null}

          {resolved.cost || shortfall ? (
            <div data-slot="paywall-message-cost" className="flex flex-wrap items-center gap-2">
              {resolved.cost ? (
                // A2 cost-chip, fed by formatCost so this card, the run button
                // and the queue cannot print three different prices for one job.
                // `text-foreground` is the documented call-site contrast fix:
                // A2 sets text-muted-foreground on its own bg-muted (4.34:1)
                // and is gate-exempt only under its own story name. Remove once
                // A2's retrofit lands. See action-stack.tsx.
                <CostChip amount={formatCost(resolved.cost)} unit="" />
              ) : null}
              {shortfall ? (
                // Derived, never passed in. "Need 900 credits, you have 120."
                <span data-slot="paywall-message-shortfall" className="text-foreground text-xs">
                  {shortfall}
                </span>
              ) : null}
            </div>
          ) : null}

          {onUpgrade || canTopUp ? (
            <div data-slot="paywall-message-actions" className="flex flex-wrap items-center gap-2">
              {onUpgrade ? (
                <Button
                  type="button"
                  size="sm"
                  data-slot="paywall-message-cta"
                  onClick={() => onUpgrade({ prompt, model })}
                >
                  {ctaLabel ?? copy.cta}
                </Button>
              ) : null}
              {/* Topping up is a different purchase from upgrading, and only the
                  cost contract knows whether it is even on offer. */}
              {canTopUp && resolved.onTopUp ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-slot="paywall-message-top-up"
                  onClick={resolved.onTopUp}
                >
                  {topUpLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {after ? (
        <p data-slot="paywall-message-after" className="text-sm leading-relaxed">
          {after}
        </p>
      ) : null}
    </div>
  );
}

export { PaywallMessage };
export type { PaywallMessageProps, PaywallReason, PaywallResume };
