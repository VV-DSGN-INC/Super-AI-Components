"use client";

import { useState } from "react";

import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";

/**
 * Live examples for credits-indicator.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends straight off the exported object, so
 * credits-indicator.docs.tsx has to stay plain server-evaluable data and cannot
 * carry "use client" itself. Every example below needs `onManage` or `onTopUp`,
 * and a handler cannot be serialized across that boundary — so they live here
 * and cross into the docs module as zero-prop elements.
 */

export function RingCarriesTheProportion() {
  return (
    <div className="flex flex-col items-start gap-3">
      <CreditsIndicator form="ring" balance={412} total={2000} onManage={() => {}} />
      <p className="text-foreground text-sm">
        With a <span className="font-medium">total</span>, the pill can draw the fraction left and derive its
        own low threshold at 10%.
      </p>
    </div>
  );
}

export function BalanceIsAWayIntoThePlan() {
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <CreditsIndicator
        form="ring"
        balance={128}
        total={2000}
        onManage={() => setOpened(true)}
        onTopUp={() => {}}
      />
      <p className="text-foreground text-sm">
        {opened ? "Plan management opened." : "Click the balance — it is the route into billing."}
      </p>
    </div>
  );
}

export function NoThresholdUntilZero() {
  // The wrong way: no `total` and no `lowAt`, so the threshold can never be
  // derived. Forty credits reads exactly like four thousand, and the pill only
  // changes once the run has already failed.
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <CreditsIndicator balance={40} onManage={() => {}} />
        <CreditsIndicator balance={0} onManage={() => {}} />
      </div>
      <p className="text-foreground text-sm">
        Both are the same component. The first is forty credits and still reads normal.
      </p>
    </div>
  );
}

export function TopUpMovesTheNumberEarly() {
  // The wrong way: `onTopUp` treated as a settlement. The number moves the
  // instant the control is pressed, so the pill shows credits that have not
  // been bought and may never clear.
  const [balance, setBalance] = useState(38);

  return (
    <div className="flex flex-col items-start gap-3">
      <CreditsIndicator
        balance={balance}
        total={2000}
        onManage={() => {}}
        onTopUp={() => setBalance((current) => current + 500)}
      />
      <p className="text-foreground text-sm">
        Press Top up: the balance jumps before any purchase has cleared.
      </p>
    </div>
  );
}
