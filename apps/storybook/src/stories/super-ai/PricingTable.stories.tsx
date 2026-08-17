import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import {
  PricingTable,
  type BillingPeriod,
  type PricingAddOn,
  type PricingPlan,
} from "@/registry/super-ai/pricing-table";
import { PricingTableDocs } from "@/content/components/pricing-table.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof PricingTable> = {
  title: "Super AI/Pricing Table",
  component: PricingTable,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PricingTableDocs) } },
};

export default meta;
type Story = StoryObj<typeof PricingTable>;

/* -------------------------------------------------------------------------
 * Fixtures. Annual is priced at 80% of monthly across both paid tiers, so
 * `annualSaving` derives 20% and the badge has something real to render —
 * a table whose yearly column matches monthly renders a toggle that changes
 * nothing, which is the docs page's first don't.
 * ---------------------------------------------------------------------- */

const TIERS: PricingPlan[] = [
  { name: "Free", description: "For trying a few generations a week", monthly: 0, yearly: 0 },
  { name: "Pro", description: "For daily work", monthly: 20, yearly: 16, highlighted: true },
  { name: "Team", description: "For a studio sharing one workspace", monthly: 40, yearly: 32 },
];

const GROUPED_TIERS: PricingPlan[] = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    featureGroups: [
      { title: "Generation", features: ["50 credits a month", "Standard models"] },
      { title: "Collaboration", features: ["1 seat"] },
    ],
  },
  {
    name: "Pro",
    monthly: 20,
    yearly: 16,
    highlighted: true,
    featureGroups: [
      { title: "Generation", features: ["2,000 credits a month", "All models, including reasoning"] },
      { title: "Collaboration", features: ["3 seats", "Shared prompt library"] },
    ],
  },
  {
    name: "Team",
    monthly: 40,
    yearly: 32,
    featureGroups: [
      { title: "Generation", features: ["10,000 credits a month", "All models, including reasoning"] },
      { title: "Collaboration", features: ["Unlimited seats", "SSO and audit log"] },
    ],
  },
];

const ADD_ONS: PricingAddOn[] = [
  { name: "Extra credits", description: "5,000 more credits a month", monthly: 10, yearly: 8 },
  { name: "Priority rendering", description: "Jump the shared queue at peak times", monthly: 15, yearly: 12 },
];

/**
 * The add-on switch is fully controlled — it renders `enabled` and reports
 * through `onToggle`, holding no state of its own. Every story that shows an
 * add-on therefore has to own that state, or the switch is inert (which is
 * the docs page's first pitfall, and not what these stories are documenting).
 */
function LiveAddOns({
  plans = TIERS,
  addOns = ADD_ONS,
}: {
  plans?: PricingPlan[];
  addOns?: PricingAddOn[];
}) {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});
  return (
    <PricingTable
      plans={plans}
      addOns={addOns.map((addOn) => ({
        ...addOn,
        enabled: enabled[addOn.name] ?? false,
        onToggle: (next) => setEnabled((state) => ({ ...state, [addOn.name]: next })),
      }))}
    />
  );
}

/* -------------------------------------------------------------------------
 * Declared states — one per normalized state on the manifest entry.
 * ---------------------------------------------------------------------- */

/**
 * The billing-period control on its own, with no feature groups to read past.
 * The `Save 20%` badge is derived from the plans by `annualSaving`, which
 * takes the best monthly-to-yearly ratio across the paid tiers — it is not a
 * prop, and there is no way to assert a saving the prices do not support.
 */
export const BillingPeriodToggle: Story = {
  args: { plans: TIERS },
};

/**
 * Features grouped by product area with sub-headings. The grouping is the
 * spec's first rule and the reason the component exists in this shape: the
 * same twelve facts as one flat column of ticks cannot be compared across
 * tiers, because the reader has to re-find each area in every card.
 */
export const GroupedFeatures: Story = {
  args: { plans: GROUPED_TIERS },
};

/**
 * Add-ons as rows beneath the grid, each with a switch. Deliberately not a
 * fourth card: an add-on is bought on top of a tier rather than chosen
 * instead of one, and the row-plus-switch shape is what keeps that readable.
 * Rendered through `LiveAddOns` because the switch is fully controlled.
 */
export const AddOnRows: Story = {
  render: () => <LiveAddOns />,
};

/**
 * The disabled-shaped state. A plan marked `current` gets the pin beside its
 * name and its call to action goes `disabled` — the button becomes a label
 * for a state rather than an offer, and drops out of the tab order with it.
 * This is the only state that changes what is focusable, which is why
 * `KeyboardOrder` below deliberately uses plans without it.
 */
export const CurrentPlan: Story = {
  args: {
    plans: [
      TIERS[0],
      { ...TIERS[1], current: true, highlighted: false },
      TIERS[2],
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * None of the eight are skipped here, and that is a finding rather than
 * set-completion: this component happens to trip every trigger. It has a
 * real controlled pair (`period`/`onPeriodChange`), optional text slots
 * (`description`, `cta`, `featureGroups`), author-supplied copy in four
 * places, a transitioning switch, directional layout, focusable controls
 * throughout, and a genuine near-twin in `paywall-message`. Where a story
 * would otherwise have been a duplicate screenshot — `ReducedMotion` — the
 * branch it documents was added to the component rather than the story
 * being written around its absence; see the note on that export.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two things are load-bearing: the price and its
 * `billed yearly` qualifier must read as one phrase from the right, and the
 * add-on row's trailing cluster (price, then switch) must mirror.
 *
 * DEFECT, recorded not asserted: the switch thumb is positioned with
 * `translate-x-0.5` / `translate-x-4.5`, and CSS transforms are physical
 * rather than logical. Under `dir="rtl"` the track's flex start flips to the
 * right edge while the thumb's offset keeps pushing it further right, so the
 * thumb travels toward the wrong edge and clips instead of sliding between
 * the two ends. The fix is a direction-aware offset on the thumb, which is a
 * layout change rather than the one-class kind this retrofit is scoped to.
 * No assertion here pins the current behaviour, because it is wrong.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <LiveAddOns />
    </div>
  ),
};

/**
 * The reduced-motion branch of the add-on switch.
 *
 * The switch is the only moving part in the component: its track transitions
 * colour and its thumb transitions transform. Neither branched on the media
 * feature before this retrofit, so a `ReducedMotion` story would have been
 * pixel-identical to `AddOnRows` and implied coverage it did not have. The
 * one-class fix (`motion-reduce:transition-none` on both, the idiom already
 * used beside `animate-*` in trace-timeline, task-tray and citation-ref) is
 * in the component; this story is what keeps it there.
 *
 * `vitest.config.ts` runs every test under `reducedMotion: "reduce"`, so the
 * assertion below is the real branch, not a simulation of one.
 */
export const ReducedMotion: Story = {
  render: () => <LiveAddOns addOns={[ADD_ONS[0]]} />,
  play: async ({ canvasElement }) => {
    const thumb = canvasElement.querySelector<HTMLElement>(
      '[data-slot="pricing-table-addon-switch"] > span',
    );
    await expect(thumb).not.toBeNull();

    // `transition-none` sets `transition-property: none`. Drop the
    // motion-reduce class and this reads `transform`, failing here.
    await expect(getComputedStyle(thumb!).transitionProperty).toBe("none");
  },
};

/**
 * Tab traversal. What this story guarantees is that every control in the
 * table is reachable and visibly focused when it is reached, and that the
 * component does not trap focus — not any particular order of arrival.
 *
 * Three things are asserted, and all three hold whether or not the period
 * control is ever given roving tabindex: the two plan CTAs and the add-on
 * switch are each their own tab stop, the checked period option is always
 * reachable by Tab, and every stop the walk lands on sits inside this
 * component and matches `:focus-visible` with a ring or outline in its
 * computed style.
 *
 * DEFECT, recorded not asserted: the period control is `role="radiogroup"`
 * over two `role="radio"` buttons and does not implement the APG radiogroup
 * pattern — there is no tabindex management, so both options are tab stops
 * and neither arrow key moves the selection. It is behavioural, so it is
 * reported (and carried as a pitfall on the docs page) rather than fixed
 * here. Nothing below asserts how many stops the group contributes or which
 * element follows which: the walk derives its bound from the radios' live
 * tabindex, so implementing roving tabindex would keep this story green
 * instead of turning it red on the fix.
 *
 * The walk is bounded rather than run until focus escapes, so a control that
 * stopped being focusable fails the count above instead of passing quietly.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <LiveAddOns
      plans={[TIERS[1], TIERS[2]]}
      addOns={[ADD_ONS[0]]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const group = canvas.getByRole("radiogroup");
    const radios = canvas.getAllByRole("radio");
    await expect(radios).toHaveLength(2);

    // The invariant that survives a roving-tabindex fix: whatever the group
    // does internally, the checked option is the one Tab must reach. Today
    // both are reachable; under the APG pattern only this one would be.
    const checked = radios.find((radio) => radio.getAttribute("aria-checked") === "true");
    await expect(checked).toBeDefined();
    await expect(checked!.getAttribute("tabindex")).not.toBe("-1");

    // Outside the group the count *is* the assertion: two plan CTAs and one
    // add-on switch, each independently tabbable.
    const outside = Array.from(
      canvasElement.querySelectorAll<HTMLElement>("button:not([disabled])"),
    ).filter((el) => !group.contains(el));
    await expect(outside).toHaveLength(3);
    for (const el of outside) {
      await expect(el.getAttribute("tabindex")).not.toBe("-1");
    }

    // Bound taken from the DOM, not from the traversal this component
    // happens to ship — two group stops today, one after a roving fix.
    const groupStops = radios.filter((radio) => radio.getAttribute("tabindex") !== "-1").length;
    const expectedStops = groupStops + outside.length;

    await userEvent.tab();
    for (let i = 0; i < expectedStops; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(canvasElement.contains(focused)).toBe(true);

      // Every stop is visibly focused, not merely focusable.
      await expect(focused.matches(":focus-visible")).toBe(true);
      // The ring is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused);
      await userEvent.tab();
    }

    // …and the component does not trap: the stop after the last one is outside.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * The period as a controlled value. `period` is held by the parent and
 * `onPeriodChange` only reports — the handler deliberately does not apply
 * the change, which is what makes the contract visible.
 *
 * Three facts, all asserted below: clicking `yearly` does not move the
 * rendered price, the callback still fires with the period a consumer would
 * apply, and the re-render triggered by recording that callback leaves the
 * component exactly where it was. Uncontrolled usage (omit `period`, pass
 * `defaultPeriod`) is the other half of the API and is what every other
 * story here exercises.
 */
function ControlledDemo() {
  const [period] = React.useState<BillingPeriod>("monthly");
  const [reported, setReported] = React.useState<BillingPeriod | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <PricingTable
        plans={[TIERS[1]]}
        period={period}
        onPeriodChange={(next) => setReported(next)}
      />
      <p className="text-sm" data-testid="period-report">
        rendered: {period} · last reported: {reported ?? "nothing yet"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const monthly = canvas.getByRole("radio", { name: /monthly/i });
    const yearly = canvas.getByRole("radio", { name: /yearly/i });

    await expect(monthly).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByText("$20")).toBeInTheDocument();

    await userEvent.click(yearly);

    // 1. Interaction alone does not move the rendered value.
    await expect(monthly).toHaveAttribute("aria-checked", "true");
    await expect(yearly).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByText("$20")).toBeInTheDocument();
    await expect(canvas.queryByText("$16")).toBeNull();

    // 2. The callback fired with the payload a consumer needs to apply it.
    // 3. …and that state update re-rendered the table with an unchanged
    //    `period`, which held it fixed rather than letting it drift.
    await expect(canvas.getByTestId("period-report")).toHaveTextContent("last reported: yearly");
  },
};

/**
 * Every optional text slot omitted: no `description`, no `cta`, no
 * `featureGroups`. What survives is the fact worth pinning — the call to
 * action falls back to `Choose {name}`, so a card stripped to its minimum
 * still ships a button with an accessible name. The failure mode this rules
 * out is a caller passing `cta=""` to tidy the layout and shipping three
 * unlabelled buttons.
 */
export const EmptyLabel: Story = {
  args: {
    plans: [
      { name: "Free", monthly: 0, yearly: 0 },
      { name: "Pro", monthly: 20, yearly: 16, highlighted: true },
      { name: "Team", monthly: 40, yearly: 32 },
    ],
  },
};

/**
 * Author-supplied copy at ~90 characters in the three places a product will
 * actually overrun: the plan description, a feature line, and an add-on
 * description. All three wrap rather than truncate — the cards are a grid of
 * equal columns, so a long line grows the row height and the tallest card
 * sets it.
 *
 * The add-on row is the one to watch: its text column and its price/switch
 * cluster are flex siblings with no `min-w-0` on the text side, so the row
 * resolves by growing rather than by letting the description shrink.
 */
export const LongContent: Story = {
  render: () => (
    <LiveAddOns
      plans={[
        {
          name: "Pro",
          description: "For daily work across a couple of projects",
          monthly: 20,
          yearly: 16,
          highlighted: true,
          featureGroups: [
            { title: "Generation", features: ["2,000 credits a month"] },
          ],
        },
        {
          name: "Team",
          description: "Everything in Pro, plus SSO, an audit log, and shared billing for the studio",
          monthly: 40,
          yearly: 32,
          featureGroups: [
            {
              title: "Collaboration",
              features: ["Unlimited seats, with per-seat credit limits an admin sets in workspace settings"],
            },
          ],
        },
      ]}
      addOns={[
        {
          name: "Priority rendering",
          description: "Jump the shared render queue at peak times, including overnight batch generations",
          monthly: 15,
          yearly: 12,
        },
      ]}
    />
  ),
};

/**
 * 375px. The grid collapses to a single column below the `sm` breakpoint, so
 * the tiers stack and each card gets full width — the comparison becomes
 * vertical, which is the trade this layout makes rather than a compromise it
 * hides. The add-on row keeps its horizontal shape at this width because its
 * text column can shrink while the price and switch cannot.
 *
 * The assertion is the convention's must-show for this story: nothing here
 * scrolls sideways.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <LiveAddOns plans={TIERS} addOns={[ADD_ONS[0]]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="pricing-table"]');
    await expect(root).not.toBeNull();
    await expect(root!.scrollWidth).toBeLessThanOrEqual(root!.clientWidth);
  },
};

/**
 * Against its near-twin, `paywall-message`. Both are upgrade surfaces
 * showing a price and a call to action, and the rule is about what the
 * person was doing when they arrived:
 *
 * - **Pricing table** is for someone who came to compare. Every tier is
 *   present at once, nothing is in progress, and the decision being made is
 *   which plan — so the surface is a grid and the toggle re-frames all of it
 *   at the same time.
 * - **Paywall message** is for someone who was stopped. One specific run did
 *   not happen, the card holds that prompt and model open so upgrading
 *   resumes it, and the decision is whether to unblock this piece of work —
 *   not which tier is best value.
 *
 * If the surface can afford to lose what the user was doing, it is a pricing
 * table. If losing it would make the user retype their prompt after paying,
 * it is a paywall message.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Pricing table — came to compare, nothing in progress
        </p>
        <PricingTable plans={[TIERS[1], TIERS[2]]} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Paywall message — was stopped mid-run, the work is held open
        </p>
        <PaywallMessage
          state="locked-model"
          prompt="Rewrite this section in a plainer register and keep the citations"
          model="claude-opus-4"
          requirement="Pro"
          before="That model is not on your plan, so I did not start the run — nothing was charged."
        />
      </section>
    </div>
  ),
};
