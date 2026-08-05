"use client";

import * as React from "react";

/**
 * The cost contract, and the generation lifecycle union alongside it.
 *
 * Spec: docs/superpowers/specs/2026-08-02-wave-4-generation-results-design.md §2
 *
 * Why this exists, in one sentence from E5's own entry: "The cost number here
 * and in E1 / D1 come from one source. Two different prices is the failure
 * mode." A2 states it from the other end — "same numbers, three surfaces, one
 * source of truth".
 *
 * The shape that achieves it is deliberately not a hook that fetches, nor a
 * mandatory provider:
 *
 * - **Shared types alone** stop the shape drifting, not the value. Three
 *   siblings each handed a `cost` prop can still show three numbers.
 * - **A hook that computes cost** would be data fetching inside a component,
 *   which this registry's API conventions forbid.
 * - **A mandatory provider** would break the single-file install that a shadcn
 *   registry sells: components here are copied into a consumer's app one file
 *   at a time, and a component that renders nothing until you wrap it is not
 *   installable that way.
 *
 * So: one value type, an **optional** provider, and props that always win.
 * `useCost(props.cost)` reads the prop when it is there, falls back to the
 * provider when it is not, and renders nothing rather than a zero when neither
 * exists. Affordability is never passed in — it is derived, once, here.
 */

/** Estimate quality, not affordability. Affordability is always derived. */
type CostStatus = "estimate" | "estimating" | "confirmed" | "unavailable";

interface Cost {
  amount: number;
  /** "credits" · "tokens" · "minutes". Pricing is quota pricing. */
  unit?: string;
  /** The rate form: "run" · "minute" · "image" → "900 credits/min". */
  per?: string;
  /** Defaults to "estimate". */
  status?: CostStatus;
}

interface CostContextValue {
  /** The estimate for the action currently being configured. */
  cost?: Cost;
  /** The account balance, in the same unit. */
  balance?: number;
  onTopUp?: () => void;
}

interface ResolvedCost {
  cost?: Cost;
  balance?: number;
  /** DERIVED. Never passed in, so two surfaces cannot disagree. */
  insufficient: boolean;
  /** How far short the balance falls. 0 when affordable or unknowable. */
  shortfall: number;
  onTopUp?: () => void;
}

const CostContext = React.createContext<CostContextValue>({});

/**
 * Optional. The provider holds a value; it does not compute one — re-estimating
 * when settings change is the host's job, which is what keeps the
 * no-data-fetching convention intact.
 */
function CostProvider({
  cost,
  balance,
  onTopUp,
  children,
}: CostContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ cost, balance, onTopUp }), [cost, balance, onTopUp]);
  return <CostContext.Provider value={value}>{children}</CostContext.Provider>;
}

/**
 * Props beat context; context beats nothing.
 *
 * `insufficient` is computed here and only here. That is the mechanical
 * enforcement of one-source-of-truth: the run button, the cost chip and the
 * gate row cannot disagree about affordability, because none of them stores it.
 */
function useCost(local?: Cost): ResolvedCost {
  const context = React.useContext(CostContext);
  const cost = local ?? context.cost;
  const { balance, onTopUp } = context;

  // Unknown balance is not the same as a zero balance: without one, nothing
  // can be called unaffordable, so `insufficient` stays false rather than
  // guessing. Likewise a cost that is still being estimated has no settled
  // amount to compare against.
  const comparable = cost != null && balance != null && cost.status !== "estimating";
  const insufficient = comparable && balance < cost.amount;

  return {
    cost,
    balance,
    insufficient,
    shortfall: insufficient ? cost.amount - balance : 0,
    onTopUp,
  };
}

/**
 * Trailing zeros are noise on a price; four decimal places is enough for a
 * per-token rate. `maximumFractionDigits` has to be restated for
 * toLocaleString, which otherwise re-rounds to three and quietly undoes the
 * line above.
 */
function formatAmount(amount: number): string {
  return Number(amount.toFixed(4)).toLocaleString("en-US", { maximumFractionDigits: 4 });
}

/** "1 credit", not "1 credits". Only touches the plural the caller supplied. */
function singularise(unit: string): string {
  return unit.endsWith("s") ? unit.slice(0, -1) : unit;
}

/**
 * The single place a Cost becomes text. Every surface calls it, so rounding
 * and unit pluralisation cannot fork between the button and the chip.
 *
 * A cost that is being re-estimated never renders its old amount — "a cost chip
 * that goes stale is worse than showing no cost" (component-specs.md:31).
 */
function formatCost(cost: Cost): string {
  if (cost.status === "estimating") return "Estimating…";
  if (cost.status === "unavailable") return "Cost unavailable";

  const unit = cost.unit ?? "credits";
  const noun = cost.amount === 1 ? singularise(unit) : unit;
  const base = `${formatAmount(cost.amount)} ${noun}`;
  return cost.per ? `${base}/${cost.per}` : base;
}

/** "Need 4 credits, you have 2" — the shortfall, phrased once for every surface. */
function formatShortfall(resolved: ResolvedCost): string | undefined {
  if (!resolved.insufficient || !resolved.cost || resolved.balance == null) return undefined;
  const unit = resolved.cost.unit ?? "credits";
  const noun = resolved.cost.amount === 1 ? singularise(unit) : unit;
  return `Need ${formatAmount(resolved.cost.amount)} ${noun}, you have ${formatAmount(resolved.balance)}`;
}

/**
 * The lifecycle every generation-aware component reports — "idle · queued ·
 * streaming · done · failed · locked on every generation-aware component"
 * (concept-model.md:108).
 *
 * It lives here rather than in its own module because both are cross-cutting
 * contracts and shipping two `registry:lib` items doubles the registry change
 * for no benefit. **`streaming`, never `running`**: E6 and E5 shipped with
 * `running`, and the two names must not both survive (wave-4 spec §1.6).
 */
type GenerationState = "idle" | "queued" | "streaming" | "done" | "failed" | "locked";

export { CostProvider, formatCost, formatShortfall, useCost };
export type { Cost, CostContextValue, CostStatus, GenerationState, ResolvedCost };
