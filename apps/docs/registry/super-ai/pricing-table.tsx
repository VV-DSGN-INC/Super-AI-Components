"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "yearly";

interface PricingFeatureGroup {
  /** Product area, e.g. "Generation" — the sub-heading that stops this becoming a wall of ticks. */
  title: string;
  features: React.ReactNode[];
}

interface PricingPlan {
  name: string;
  description?: React.ReactNode;
  /** Per-month price. `yearly` is also per-month, billed annually — that is the anchor. */
  monthly: number;
  yearly: number;
  featureGroups?: PricingFeatureGroup[];
  highlighted?: boolean;
  current?: boolean;
  cta?: React.ReactNode;
}

interface PricingAddOn {
  name: string;
  description?: React.ReactNode;
  monthly: number;
  yearly: number;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface PricingTableProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  plans: PricingPlan[];
  addOns?: PricingAddOn[];
  /** Controlled period. Omit for uncontrolled. */
  period?: BillingPeriod;
  defaultPeriod?: BillingPeriod;
  onPeriodChange?: (period: BillingPeriod) => void;
  currencySymbol?: string;
  onSelectPlan?: (planName: string) => void;
}

const price = (plan: Pick<PricingPlan, "monthly" | "yearly">, period: BillingPeriod) =>
  period === "yearly" ? plan.yearly : plan.monthly;

/** Whole-percent annual saving, or null when there is nothing to anchor against. */
function annualSaving(plans: PricingPlan[]): number | null {
  const paid = plans.filter((p) => p.monthly > 0 && p.yearly > 0 && p.yearly < p.monthly);
  if (paid.length === 0) return null;
  const best = Math.max(...paid.map((p) => 1 - p.yearly / p.monthly));
  return Math.round(best * 100);
}

function PricingTable({
  plans,
  addOns,
  period: controlledPeriod,
  defaultPeriod = "monthly",
  onPeriodChange,
  currencySymbol = "$",
  onSelectPlan,
  className,
  ...props
}: PricingTableProps) {
  const [uncontrolled, setUncontrolled] = React.useState<BillingPeriod>(defaultPeriod);
  const period = controlledPeriod ?? uncontrolled;
  const saving = annualSaving(plans);

  const setPeriod = (next: BillingPeriod) => {
    if (controlledPeriod === undefined) setUncontrolled(next);
    onPeriodChange?.(next);
  };

  const money = (value: number) => (value === 0 ? "Free" : `${currencySymbol}${value.toLocaleString()}`);

  return (
    <div data-slot="pricing-table" className={cn("flex flex-col gap-6", className)} {...props}>
      {/* The toggle exists for the anchor, not for the convenience: annual sits under
          monthly so the cheaper number is the one being compared against. */}
      <div
        data-slot="pricing-table-period"
        role="radiogroup"
        aria-label="Billing period"
        className="bg-muted mx-auto inline-flex items-center gap-1 rounded-full p-1 text-sm"
      >
        {(["monthly", "yearly"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={period === value}
            onClick={() => setPeriod(value)}
            data-slot="pricing-table-period-option"
            // The unselected option is `text-foreground`, not `text-muted-foreground`:
            // this control's own track is `bg-muted`, and that pairing measures 4.34:1
            // (a11y-baseline.md, "The contrast pairing, measured"). The selected/unselected
            // distinction was never carried by the text colour anyway — it is the raised
            // `bg-background` pill and its shadow, which both survive untouched.
            className={cn(
              "focus-visible:ring-ring rounded-full px-3 py-1 capitalize focus-visible:ring-2 focus-visible:outline-none",
              period === value ? "bg-background text-foreground shadow-sm" : "text-foreground",
            )}
          >
            {value}
            {value === "yearly" && saving !== null ? (
              // Solid, not tinted text: `text-warning` is a light amber meant to sit on
              // the page background, and on this control's `bg-muted` track it fell under
              // 4.5:1. `--warning` / `--warning-foreground` are a designed pair, so the
              // badge goes solid — the same move a11y-baseline.md prescribes for the
              // `text-destructive`-on-tint failure.
              <span
                data-slot="pricing-table-save-badge"
                className="bg-warning text-warning-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
              >
                Save {saving}%
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            data-slot="pricing-table-plan"
            data-highlighted={plan.highlighted || undefined}
            data-current={plan.current || undefined}
            className={cn(
              "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5",
              plan.highlighted && "ring-primary ring-2",
            )}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{plan.name}</h3>
                {plan.current ? (
                  <span
                    data-slot="pricing-table-current"
                    className="bg-muted text-foreground rounded-full px-2 py-0.5 text-xs"
                  >
                    Current
                  </span>
                ) : null}
              </div>
              {plan.description ? <p className="text-muted-foreground text-sm">{plan.description}</p> : null}
            </div>

            <p className="flex items-baseline gap-1" data-slot="pricing-table-price">
              <span className="text-2xl font-semibold tabular-nums">{money(price(plan, period))}</span>
              {price(plan, period) > 0 ? (
                <span className="text-muted-foreground text-sm">
                  /mo{period === "yearly" ? ", billed yearly" : ""}
                </span>
              ) : null}
            </p>

            <button
              type="button"
              disabled={plan.current}
              onClick={() => onSelectPlan?.(plan.name)}
              data-slot="pricing-table-cta"
              className={cn(
                "focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                plan.highlighted
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {plan.cta ?? (plan.current ? "Current plan" : `Choose ${plan.name}`)}
            </button>

            {/* Grouped by product area with sub-headings — twenty flat ticks is a list
                nobody reads, and the grouping is what makes tiers comparable. */}
            {plan.featureGroups?.map((group) => (
              <div key={group.title} data-slot="pricing-table-feature-group" className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-1 text-sm">
                  {group.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span aria-hidden className="text-muted-foreground leading-5">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* An add-on is not a tier. It renders as a row with a switch so it can never be
          mistaken for a fourth plan card. */}
      {addOns?.length ? (
        <div data-slot="pricing-table-addons" className="flex flex-col rounded-xl border">
          {addOns.map((addOn) => (
            <div
              key={addOn.name}
              data-slot="pricing-table-addon"
              className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{addOn.name}</p>
                {addOn.description ? (
                  <p className="text-muted-foreground text-sm">{addOn.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums">{money(price(addOn, period))}/mo</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!addOn.enabled}
                  aria-label={addOn.name}
                  onClick={() => addOn.onToggle?.(!addOn.enabled)}
                  data-slot="pricing-table-addon-switch"
                  className={cn(
                    "focus-visible:ring-ring inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    addOn.enabled ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "bg-background size-4 rounded-full transition-transform",
                      addOn.enabled ? "translate-x-4.5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { PricingTable, annualSaving };
export type { BillingPeriod, PricingAddOn, PricingFeatureGroup, PricingPlan, PricingTableProps };
