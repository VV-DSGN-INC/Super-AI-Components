import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";
import { RunButton } from "@/registry/super-ai/run-button";
import { CreditsIndicatorDocs } from "@/content/components/credits-indicator.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof CreditsIndicator> = {
  title: "Super AI/Credits Indicator",
  component: CreditsIndicator,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CreditsIndicatorDocs) } },
};

export default meta;
type Story = StoryObj<typeof CreditsIndicator>;

export const Counter: Story = {
  args: { balance: 414, onManage: () => {} },
};

export const Ring: Story = {
  args: { form: "ring", balance: 640, total: 1000, onManage: () => {} },
};

/**
 * The warning surface — and, as rendered here, a defect that is not this
 * component's.
 *
 * `low` paints `bg-warning text-warning-foreground`, but Storybook's
 * stylesheet never registers those tokens: `apps/storybook/src/index.css`
 * lists its `--color-*` theme entries explicitly and `--color-warning` is
 * not among them, while `--warning` itself is defined only in the docs
 * app's `globals.css`. In Tailwind v4 a colour utility with no theme entry
 * is simply not generated, so both classes are dead here. Probed on this
 * story: the pill computes to `background-color: rgba(0, 0, 0, 0)` with an
 * inherited `--foreground` text colour, rather than the amber surface the
 * component asks for.
 *
 * Two consequences worth stating. The `low` state renders as *less* styled
 * than `normal` in Storybook, since `bg-muted` does resolve. And the axe
 * gate has never actually seen this surface — for this component or for the
 * fifteen-odd others in the registry that use `--warning` — so a contrast
 * failure in any warning state is currently invisible to CI, which is the
 * same shape of hole `story-conventions.md` records for `safety-block`.
 *
 * Not fixed here: the repair belongs in the shared Storybook stylesheet,
 * not in a per-component retrofit. Carried in the report.
 */
export const Low: Story = {
  args: { form: "ring", balance: 80, total: 1000, onManage: () => {} },
};

export const Empty: Story = {
  args: { form: "ring", balance: 0, total: 1000, onManage: () => {} },
};

export const WithTopUp: Story = {
  args: { form: "ring", balance: 200, total: 1000, onManage: () => {}, onTopUp: () => {} },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The pill is a static span and the ring is a plain SVG: there is no
 * keyframe, transition or transform anywhere in the file. The arc is drawn
 * from a `strokeDashoffset` computed at render, so it cuts to its new value
 * rather than sweeping to it, and `prefers-reduced-motion` has nothing to
 * suppress. A story here would render identically to `Ring`.
 *
 * // case-skip: EmptyLabel — the balance always prints, so no slot can empty the accessible name
 * `balance` is required and always rendered, and both controls take their
 * names from it — the trigger via `aria-label={`${label} — manage plan`}`,
 * Top up via literal text. `unit` is the only optional text and it
 * defaults; emptying it leaves the number behind, not an icon-only button.
 * The ring is `aria-hidden`, so it can never become the sole label. There
 * is no unlabeled-target case to render.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Three things here are direction-sensitive, and they do not
 * all mirror.
 *
 * The two that do: flex reverses, so the ring moves to the right of the
 * balance and Top up moves to the far left; and the balance is pinned
 * `dir="ltr"`, which is correct — digits keep their own order inside an RTL
 * run, and a mirrored "1,000" is a different number.
 *
 * The one that does not: Top up's divider and edge nudge are physical
 * classes (`border-l`, `pl-1.5`, `-mr-1`). Under `dir="rtl"` that button
 * sits at the left end of the pill, so its separator should fall on its
 * right edge, facing the balance. Instead the rule stays on its physical
 * left — drawing a line down the pill's outer edge, with no divider at all
 * between the two controls — and the padding pair that hugs the pill's
 * inner edge in LTR now pushes the wrong way.
 *
 * Recorded rather than fixed. No component in this registry uses logical
 * properties (`border-s`, `ps-*`, `-me-*` appear zero times across all 114),
 * so adopting them here would make this the only one, and that is a
 * system-wide decision rather than a per-component one. `empty-state`'s RTL
 * story sets the same precedent for a directional defect it documents
 * instead of fixing. Carried in the retrofit report.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <CreditsIndicator {...args} />
    </div>
  ),
  args: { form: "ring", balance: 200, total: 1000, onManage: () => {}, onTopUp: () => {} },
};

/**
 * Tab traversal across the pill. Two stops, in DOM order: the balance, then
 * Top up.
 *
 * The load-bearing fact is that there are two rather than one. Top up is
 * rendered as a sibling of the balance button, never nested inside it,
 * because a button inside a button is invalid and the browser swallows the
 * inner click. A refactor that nested them would look pixel-identical and
 * would silently lose a tab stop, which is what this pins. The ring is
 * `aria-hidden` and takes no focus, so it never enters the sequence.
 *
 * The loop is bounded by that expected count rather than run until focus
 * leaves the canvas. This component does not trap focus, but an unbounded
 * tab loop is only safe in a component you have already proved doesn't —
 * and pinning the number is the stronger assertion anyway, because it fails
 * when a stop is added as well as when one is lost.
 */
export const KeyboardOrder: Story = {
  args: { form: "ring", balance: 200, total: 1000, onManage: () => {}, onTopUp: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByRole("button", { name: /manage plan/i });
    const topUp = canvas.getByRole("button", { name: "Top up" });

    // Siblings, not parent and child.
    await expect(trigger.contains(topUp)).toBe(false);

    const stops = [trigger, topUp];
    await expect(canvasElement.querySelectorAll("button, a[href]")).toHaveLength(stops.length);

    for (const expected of stops) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      // Every stop is visibly focused, not merely focusable. The ring is
      // measured rather than merely present — see `expectPerceptibleFocus`.
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(focused);
    }
  },
};

/** Harness for `Controlled`: the consumer owns the balance, as it does in a product. */
function ControlledBalance() {
  const [balance, setBalance] = React.useState(120);
  const [requests, setRequests] = React.useState(0);

  return (
    <div className="flex flex-col items-start gap-2">
      <CreditsIndicator
        form="ring"
        balance={balance}
        total={1000}
        onManage={() => {}}
        onTopUp={() => setRequests((n) => n + 1)}
      />
      <p className="text-foreground text-xs">Top-up requests: {requests}</p>
      <button
        type="button"
        onClick={() => setBalance(620)}
        className="focus-visible:ring-ring rounded-full border px-2 py-0.5 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        Settle 500-credit purchase
      </button>
    </div>
  );
}

/**
 * The balance belongs to the consumer, and the pill never moves it on its
 * own. Clicking Top up three times fires the callback three times and
 * leaves the number at 120; it changes only when the owner re-renders with
 * a new `balance`, here when the simulated purchase settles.
 *
 * For a credits readout that is the entire contract. A pill that
 * optimistically added credits at click time would be displaying money that
 * has not been taken yet, and the failure only shows up when a payment
 * fails — which is the worst possible moment to discover the number was
 * never authoritative.
 *
 * One clause of the convention's `Controlled` shape is not satisfiable
 * here, and it is worth naming rather than faking: `onTopUp` and `onManage`
 * are bare `() => void` intents, so no change payload arrives with the
 * callback. There is nothing for a consumer to apply — the next balance
 * comes back from the billing system, not from the click. The assertion
 * below therefore covers the two clauses that are real (interaction alone
 * does not move the value; an unchanged `balance` holds it fixed) and does
 * not invent a third.
 */
export const Controlled: Story = {
  render: () => <ControlledBalance />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = canvasElement.querySelector('[data-slot="credits-indicator"]')!;

    await expect(pill).toHaveTextContent("120 credits");
    await expect(pill).toHaveAttribute("data-state", "normal");

    const topUp = canvas.getByRole("button", { name: "Top up" });
    await userEvent.click(topUp);
    await userEvent.click(topUp);
    await userEvent.click(topUp);

    // The callback fired every time…
    await expect(canvas.getByText("Top-up requests: 3")).toBeInTheDocument();
    // …and the rendered balance did not move, because nothing re-rendered it.
    await expect(pill).toHaveTextContent("120 credits");

    // Only the owner can move it.
    await userEvent.click(canvas.getByRole("button", { name: "Settle 500-credit purchase" }));
    await expect(pill).toHaveTextContent("620 credits");
  },
};

/**
 * The longest label this component can honestly be given: a five-figure
 * balance and a multi-word unit. Its answer to long content is to do
 * nothing — there is no truncation, no `max-w` and no ellipsis anywhere in
 * the pill. It is an `inline-flex` that grows to fit its text.
 *
 * That is worth rendering because M2's home is a topbar trailing slot, both
 * `home-shell` and `generation-shell` put it there. The 220px box stands in
 * for that slot: the pill overruns it rather than clipping or shortening,
 * so the caller — not the component — owns the decision about what gives.
 *
 * The convention's ~90 characters is not reachable with honest content.
 * `unit` is the only author-supplied text, and the units this system
 * actually emits are short nouns: credits, GPU-minutes, transcription
 * minutes. This is the realistic ceiling rather than a padded string.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="flex w-[220px] items-center gap-2 border p-2">
      <CreditsIndicator {...args} />
    </div>
  ),
  args: { balance: 12500, unit: "transcription minutes", onManage: () => {} },
};

/**
 * 375px, in the arrangement it actually ships in: last item in a topbar
 * row. At this width the question is not whether the pill fits but whether
 * it survives sharing a row that is already full — ring, balance and Top up
 * all present is the widest this component gets in normal use.
 *
 * No horizontal scroll, and the reason is the neighbour rather than the
 * pill: the title takes `min-w-0 flex-1 truncate` and gives way, while the
 * pill keeps its intrinsic width. That is the arrangement `home-shell`
 * uses. A topbar that let the pill shrink instead would wrap the balance
 * mid-number, which is why it has no shrink affordance of its own.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <div className="flex items-center gap-2 border-b p-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">Quarterly review deck</span>
        <CreditsIndicator {...args} />
      </div>
    </div>
  ),
  args: { form: "ring", balance: 840, total: 1000, onManage: () => {}, onTopUp: () => {} },
};

/**
 * The three surfaces of the cost contract, side by side. They share a
 * vocabulary — a number, a unit, a pill — and they answer different
 * questions. The choosing rule is the tense:
 *
 * - **Credits indicator (M2)** — what you have. Persistent, lives in the
 *   chrome, changes only when you spend or buy.
 * - **Cost chip (A2)** — what this one action costs. Attached to the thing
 *   being priced, recomputes as settings change.
 * - **Run button (E5)** — what you are about to spend, at the instant of
 *   commitment. The price and the commit control are deliberately the same
 *   element, so there is no gap between reading it and agreeing to it.
 *
 * The short test: if the number would still be true with nothing selected,
 * it is a balance. If it changes when you change the model or the
 * resolution, it is a cost. Note that A2's chip is not merely a neighbour
 * of E5 but a part of it — the run button renders a `CostChip` itself,
 * which is what keeps one price from being formatted two ways.
 *
 * All three read from one source; the spec's stated failure mode is showing
 * a different price in two of them, and this is the only place in the repo
 * where they can be seen disagreeing.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Credits indicator — what is left on the plan</p>
        <div>
          <CreditsIndicator form="ring" balance={640} total={1000} onManage={() => {}} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Cost chip — what this action costs</p>
        <div>
          <CostChip amount={55} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Run button — the price at the moment of commit</p>
        <RunButton state="idle" cost={55} onRun={() => {}} />
      </section>
    </div>
  ),
};
