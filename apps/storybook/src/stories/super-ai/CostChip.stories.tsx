import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";
import { RunButton } from "@/registry/super-ai/run-button";
import { CostChipDocs } from "@/content/components/cost-chip.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CostChip> = {
  title: "Super AI/Cost Chip",
  component: CostChip,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CostChipDocs) } },
};

export default meta;
type Story = StoryObj<typeof CostChip>;

/**
 * The ordinary case: one action, one whole number of credits. `unit` defaults
 * to `"credits"`, so the common call passes a single prop — which is the
 * point, because a chip that costs three props to render is a chip that gets
 * left out of the row it belongs in.
 */
export const PerAction: Story = {
  args: { amount: 17 },
};

/**
 * Metered pricing, where the price is a rate rather than a total. The
 * denominator lives in the `unit` string; the chip does no arithmetic and
 * never multiplies the rate by a duration, so "900 credits/min" stays a rate
 * until the caller decides what the run will actually cost.
 *
 * This is the spec's `rate form`, and it is the only one of the spec's four
 * states this component can express today — see `WithQualifier` for what
 * happens to the other three.
 */
export const Rate: Story = {
  args: { amount: 900, unit: "credits/min" },
};

/**
 * `amount` is `number | string`, and the string form is the escape hatch out
 * of the credits vocabulary entirely: per-call API pricing is quoted in money,
 * not quota. Nothing in the chip formats the value — whatever string arrives
 * is printed verbatim, so rounding, grouping and the currency symbol are all
 * decided upstream. That is deliberate: it is how the same price reaches the
 * run button, the paywall card and this chip without being rounded three ways.
 */
export const Currency: Story = {
  args: { amount: "$0.004", unit: "per call" },
};

/**
 * The trailing slot. Anything passed as children renders after the amount,
 * inside the chip's own `gap-1`, inheriting its `text-xs`.
 *
 * It is worth a state of its own because it is currently the *only* way to
 * mark a price as provisional. The spec declares four states — estimate,
 * confirmed, insufficient, rate form — but the shipped component takes no
 * `state`, `tone` or `variant` prop and paints exactly one surface. So an
 * estimate differs from a confirmed charge only in the words a caller puts
 * here, and `insufficient` is not expressible at all: that handoff lives on
 * `run-button` (`state="insufficient-credits"`) and `paywall-message`, which
 * carry the shortfall line and the buy control. Recorded, not faked.
 */
export const WithQualifier: Story = {
  args: { amount: 17, children: "est." },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The whole component is one static span holding an icon and a text run.
 * There is no keyframe, transition or transform in the file, so
 * `prefers-reduced-motion` has nothing to suppress and a story here would
 * render identically to `PerAction`. Note that an estimate recomputing is a
 * re-render with a new `amount`, not an animation — nothing tweens between
 * the old price and the new one.
 *
 * // case-skip: KeyboardOrder — renders a non-focusable span with no focusables inside
 * `CostChip` is a `<span>` with no `tabIndex`, no interactive primitive and
 * no control of its own; it is decoration attached to something else, and
 * the focusable thing is always the neighbour (the run button, the model
 * row, the menu item). There is no tab sequence belonging to this component
 * to document.
 *
 * // case-skip: Controlled — no value/onChange pair, and no callback at all
 * Every prop is display-only: `amount`, `unit`, `children`, `className`.
 * `CostChipProps` declares no callback, and the chip owns no state, no memo
 * and no derived cache — it prints what it is handed on every render. There
 * is no interaction that could move a value, so the convention's assertion
 * ("interaction alone does not move the rendered value") has nothing to act
 * on. The consumer-side rule this would otherwise pin — never let an
 * estimate go stale — is stated in the docs module instead, where it is a
 * wiring rule rather than a component behaviour.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and this component mirrors cleanly — which is itself the
 * finding, since the neighbouring cost surfaces do not.
 *
 * Two things are direction-sensitive. The chip is an `inline-flex` with
 * logical spacing only (`gap-1`, symmetric `px-2`) and no physical edge
 * classes anywhere, so under `dir="rtl"` the coin icon simply moves to the
 * right of the number and nothing is stranded. And the amount is pinned
 * `dir="ltr"` — a deliberate bidi island, not an accident. Without it the
 * neutral characters in a price migrate: the `$` in "$0.004" jumps to the
 * far side of the digits, and the `/` in "credits/min" lands where it
 * changes what the rate says.
 *
 * The play function pins the island, because removing it is invisible in an
 * LTR screenshot and silently wrong here.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-full flex-col items-start gap-2">
      <CostChip {...args} />
      <CostChip amount={900} unit="credits/min" />
      <CostChip amount="$0.004" unit="per call" />
    </div>
  ),
  args: { amount: 17 },
  play: async ({ canvasElement }) => {
    const amounts = Array.from(canvasElement.querySelectorAll('[data-slot="cost-chip-amount"]'));
    await expect(amounts).toHaveLength(3);

    for (const amount of amounts) {
      // The bidi island. `dir="ltr"` on the amount run is what keeps a price
      // readable inside an RTL paragraph; a refactor that drops it looks
      // identical in every other story.
      await expect(amount).toHaveAttribute("dir", "ltr");
    }

    // …and the icon contributes nothing to the accessible text in either
    // direction, so the chip reads as its number, not as "coins 17".
    const icon = canvasElement.querySelector('[data-slot="cost-chip"] svg')!;
    await expect(icon).toHaveAttribute("aria-hidden");
  },
};

/**
 * `unit=""` — the shape every composing component in this registry actually
 * uses. `action-stack` and `paywall-message` both format the price upstream
 * and suppress the unit so one formatter owns rounding and pluralisation for
 * every surface.
 *
 * What that exposes: the coin icon is `aria-hidden`, so with the unit gone
 * the chip's entire accessible name is whatever `amount` says. Pass a bare
 * `17` and the chip reads "17" — a number in a pill, next to an icon assistive
 * tech cannot see. The pre-formatted string has to carry its own unit, which
 * is why the second chip here reads "1,240 credits" rather than "1,240".
 *
 * A second, smaller fact only visible here: `{amount} {unit}` interpolates
 * unconditionally, so an empty unit leaves a trailing space in the text node.
 * Harmless on screen, but an exact-string assertion on "17" fails.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <CostChip amount={17} unit="" />
      <CostChip amount="1,240 credits" unit="" />
    </div>
  ),
};

/**
 * A ~90-character unit, in a 220px box that stands in for the row this chip
 * normally shares — a model row, a menu item, a run control.
 *
 * The component's answer to long content is to have none: there is no
 * `truncate`, no `max-w`, no `whitespace-nowrap` and no `min-w-0` anywhere in
 * the file. So the text wraps, the pill grows tall, and `rounded-full` — a
 * radius chosen for a single 20px line — turns the chip into a large stadium
 * that no longer reads as a chip. The caller owns the decision about what
 * gives, which in practice means keeping the unit to the short nouns this
 * system emits: credits, credits/min, GPU-minutes, per call.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-[220px] items-start gap-2 border p-2">
      <CostChip amount="1,200–1,800" unit="credits, depending on the selected resolution and the frame count" />
    </div>
  ),
};

/**
 * 375px, in the arrangement it ships in: the trailing slot of a model row.
 * `model-picker`, `skill-menu` and `hero-omnibox` all place it exactly here.
 *
 * No horizontal scroll, and the reason is the neighbour rather than the chip.
 * The chip is an `inline-flex` with no shrink affordance and no truncation,
 * so it holds its intrinsic width; the model name takes `min-w-0 flex-1
 * truncate` and gives way. A row that let the price shrink instead would wrap
 * a number mid-digit, which is the one thing a price may never do.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <div className="flex items-center gap-2 border-b p-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">Stable Video Diffusion</span>
        <CostChip amount={15} />
      </div>
      <div className="flex items-center gap-2 border-b p-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">Veo 3.1</span>
        <CostChip amount={20} />
      </div>
    </div>
  ),
};

/**
 * The three surfaces of the cost contract, seen from the chip's side. They
 * share a vocabulary — a number, a unit, a pill — and answer different
 * questions. The choosing rule is the tense, and it is the same rule the
 * `credits-indicator` Boundary states from the balance side:
 *
 * - **Credits indicator (M2)** — what you have. Persistent, lives in the
 *   chrome, changes only when you spend or buy.
 * - **Cost chip (A2)** — what this one action costs. Attached to the thing
 *   being priced, recomputes as settings change.
 * - **Run button (E5)** — what you are about to spend, at the instant of
 *   commitment. Price and commit control are the same element on purpose.
 *
 * The short test: if the number would still be true with nothing selected, it
 * is a balance and belongs to M2. If it changes when you change the model or
 * the resolution, it is a cost and belongs here.
 *
 * What is only visible from this side: A2 is not merely a neighbour of the
 * other two, it is a part of them. `run-button` renders a `CostChip`, and so
 * do `model-picker`, `skill-menu`, `hero-omnibox`, `action-stack` and
 * `paywall-message`. It is the shared price atom, which is what keeps one
 * number from being formatted six ways — and why the failure the spec names,
 * two surfaces showing different prices for one job, is a wiring failure
 * rather than a styling one.
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
        <p className="text-foreground text-xs font-medium">
          Run button — the same chip again, at the moment of commit
        </p>
        <RunButton state="idle" cost={55} onRun={() => {}} />
      </section>
    </div>
  ),
};
