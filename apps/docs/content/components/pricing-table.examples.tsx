"use client";

import * as React from "react";

import { PricingTable, type PricingPlan } from "@/registry/super-ai/pricing-table";

/**
 * Live examples for pricing-table.docs.tsx.
 *
 * Client sidecar: every example below either passes an event handler
 * (`onToggle`, `onPeriodChange`) or holds state, and neither survives the
 * server-component boundary the docs module is read across. Each export is
 * zero-prop so the docs module can reference it as `<Thing />`.
 */

const ANCHORED: PricingPlan[] = [
  {
    name: "Free",
    description: "For trying a few generations a week",
    monthly: 0,
    yearly: 0,
  },
  {
    name: "Pro",
    description: "For daily work",
    monthly: 20,
    yearly: 16,
    highlighted: true,
  },
];

/** Annual priced under monthly, so the toggle has something to anchor. */
export function AnnualUnderMonthly() {
  return <PricingTable plans={ANCHORED} />;
}

/** The same two tiers with annual priced level — the badge silently vanishes. */
export function AnnualPricedLevel() {
  return (
    <PricingTable
      plans={[
        { name: "Free", description: "For trying a few generations a week", monthly: 0, yearly: 0 },
        { name: "Pro", description: "For daily work", monthly: 20, yearly: 20, highlighted: true },
      ]}
    />
  );
}

/** An add-on kept in the add-on row, where its switch says it is optional. */
export function AddOnStaysARow() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <PricingTable
      plans={ANCHORED}
      addOns={[
        {
          name: "Extra credits",
          description: "5,000 more credits a month",
          monthly: 10,
          yearly: 8,
          enabled,
          onToggle: setEnabled,
        },
      ]}
    />
  );
}

/** The same add-on promoted to a third card — now it reads as a tier you pick instead of buy. */
export function AddOnAsAThirdPlan() {
  return (
    <PricingTable
      plans={[
        ...ANCHORED,
        { name: "Extra credits", description: "5,000 more credits a month", monthly: 10, yearly: 8 },
      ]}
    />
  );
}

/** Features grouped by product area, which is what makes two tiers comparable. */
export function FeaturesGroupedByArea() {
  return (
    <PricingTable
      plans={[
        {
          name: "Pro",
          monthly: 20,
          yearly: 16,
          highlighted: true,
          featureGroups: [
            { title: "Generation", features: ["2,000 credits a month", "All models"] },
            { title: "Collaboration", features: ["3 seats", "Shared prompt library"] },
          ],
        },
      ]}
    />
  );
}

/** The same facts as one undifferentiated column of ticks. */
export function FeaturesAsOneFlatList() {
  return (
    <PricingTable
      plans={[
        {
          name: "Pro",
          monthly: 20,
          yearly: 16,
          highlighted: true,
          featureGroups: [
            {
              title: "Included",
              features: ["2,000 credits a month", "All models", "3 seats", "Shared prompt library"],
            },
          ],
        },
      ]}
    />
  );
}
