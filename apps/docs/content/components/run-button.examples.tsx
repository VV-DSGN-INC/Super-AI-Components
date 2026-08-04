"use client";

import { Button } from "@/components/ui/button";
import { RunButton } from "@/registry/super-ai/run-button";

/**
 * Live examples for run-button.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so run-button.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<CostAndProgressTogether />`), so a
 * handler like `onRun` never has to be serialized across the
 * server/client boundary — it's created and consumed entirely inside this
 * client module.
 */

export function CostAndProgressTogether() {
  return <RunButton cost={4} onRun={() => {}} />;
}

export function CancelExposedWhileRunning() {
  return <RunButton state="running" progress={55} onCancel={() => {}} />;
}

export function ShortfallSpelledOut() {
  return <RunButton state="insufficient-credits" cost={6} balance={2} onBuyCredits={() => {}} />;
}

export function LockedSwapsInPlace() {
  return <RunButton state="locked" lockedReason="Video generation is a Pro feature." onUnlock={() => {}} />;
}

// The anti-pattern: credits are short, but the button just goes grey with no
// numbers anywhere. There's nothing here for the user to act on.
export function DisabledWithNoShortfall() {
  return (
    <Button disabled title="Not enough credits">
      Generate
    </Button>
  );
}

// The anti-pattern: the trigger stays put and a separate card does the
// gating. Now there are two places that can disagree about whether the
// feature is locked.
export function SeparateLockBanner() {
  return (
    <div className="flex flex-col items-start gap-2">
      <Button>Generate</Button>
      <div className="rounded-lg border border-dashed p-2 text-xs">
        This feature needs a Pro plan.{" "}
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Upgrade
        </Button>
      </div>
    </div>
  );
}
