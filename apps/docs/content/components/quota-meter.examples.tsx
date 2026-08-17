"use client";

import { QuotaMeter } from "@/registry/super-ai/quota-meter";

/**
 * Live examples for quota-meter.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component that reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so quota-meter.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * example lives here and crosses into the docs module as a zero-prop element.
 *
 * QuotaMeter itself holds no state and takes no handlers — it is one of the
 * few registry components that renders on the server perfectly well. The
 * sidecar exists so the docs page can show the *contrast* between a right and
 * a wrong call, which means several meters per example rather than one.
 */

/**
 * The right way: one row per metered resource, so the rows are free to
 * disagree. Storage is barely touched and video minutes are nearly gone —
 * which is the only fact on this card worth acting on, and the only one an
 * average would have buried.
 */
export function RowsAreAllowedToDisagree() {
  return (
    <div className="w-full max-w-sm">
      <QuotaMeter
        resources={[
          { label: "Storage", used: 3, limit: 50, unit: "GB", resetsIn: "Does not reset" },
          { label: "Image generations", used: 410, limit: 2000, resetsIn: "Resets in 12 days" },
          { label: "Video minutes", used: 57, limit: 60, unit: "min", resetsIn: "Resets in 12 days" },
        ]}
      />
    </div>
  );
}

/**
 * The right way in a sidebar: `compact` tightens the type and drops the reset
 * line entirely — so the surface around it has to carry the reset date, as the
 * footnote under this rail does.
 */
export function CompactInASidebar() {
  return (
    <div className="w-56 rounded-lg border p-3">
      <QuotaMeter
        compact
        resources={[
          { label: "Messages", used: 840, limit: 1000 },
          { label: "Tool calls", used: 120, limit: 500 },
        ]}
      />
      <p className="text-muted-foreground mt-3 text-xs">Everything resets on 1 September.</p>
    </div>
  );
}

/**
 * The wrong way: the four resources averaged into one "plan usage" row. It
 * reads as comfortable at 62%, and the resource that is actually about to stop
 * the user — video minutes, spent — is nowhere on the card.
 */
export function AggregatedIntoOnePercentage() {
  return (
    <div className="w-full max-w-sm">
      <QuotaMeter resources={[{ label: "Plan usage", used: 62, limit: 100, unit: "%" }]} />
    </div>
  );
}

/**
 * The wrong way: severity painted by hand at the call site. Both rows below
 * are `data-state="normal"` — 12% and 30% of their allowance — and both have
 * been tinted as though they were spent, so the colour and the numbers say
 * different things. The component derives the threshold from `used` and
 * `limit`; a caller-applied fill disagrees with it the moment the numbers move.
 */
export function HandTintedRows() {
  return (
    <div className="w-full max-w-sm">
      <QuotaMeter
        className="[&_[data-slot=quota-meter-bar]]:bg-destructive"
        resources={[
          { label: "Image generations", used: 240, limit: 2000 },
          { label: "Tool calls", used: 150, limit: 500 },
        ]}
      />
    </div>
  );
}
