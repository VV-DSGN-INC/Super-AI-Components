"use client";

import { Button } from "@/components/ui/button";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";

/**
 * Live examples for rate-limit-banner.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component,
 * so it cannot carry "use client" or JSX with handlers. Every example with a
 * callback lives here and crosses over as a zero-prop element.
 */

/** DO — name the cause. A busy provider is not the user running out of quota. */
export function CauseNamedCorrectly() {
  return (
    <RateLimitBanner
      cause="provider-capacity"
      resource="Claude Opus 4.5"
      remainingSeconds={95}
      onNotifyMe={() => {}}
    />
  );
}

/** DO — a real countdown the host ticks, plus a way out that isn&apos;t waiting. */
export function CountdownWithAnEscapeHatch() {
  return (
    <RateLimitBanner
      cause="your-limit"
      resource="Image generations · 50 of 50 used today"
      remainingSeconds={1847}
      action={
        <Button type="button" variant="outline" size="sm">
          Upgrade plan
        </Button>
      }
    />
  );
}

/**
 * DON&apos;T — reporting a provider outage as the user&apos;s own quota. The
 * words say they overspent; the truth is the model is busy. This is the single
 * mistake the component exists to make hard.
 */
export function ProviderOutageBlamedOnTheUser() {
  return <RateLimitBanner cause="your-limit" resource="Claude Opus 4.5" remainingSeconds={95} />;
}

/**
 * DON&apos;T — no countdown and no opt-in, which is &quot;try again later&quot;
 * with extra steps. If you genuinely have no estimate, the opt-in is what
 * replaces it.
 */
export function NoEstimateAndNoOptIn() {
  return <RateLimitBanner cause="provider-capacity" resource="Video renders" />;
}
