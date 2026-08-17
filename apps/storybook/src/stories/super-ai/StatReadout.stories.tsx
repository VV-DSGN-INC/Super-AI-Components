import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { QuotaMeter } from "@/registry/super-ai/quota-meter";
import { SlotSummary } from "@/registry/super-ai/slot-summary";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { StatReadoutDocs } from "@/content/components/stat-readout.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof StatReadout> = {
  title: "Super AI/Stat Readout",
  component: StatReadout,
  parameters: { layout: "centered", docs: { page: componentDocsPage(StatReadoutDocs) } },
};

export default meta;
type Story = StoryObj<typeof StatReadout>;

/**
 * The parameters of one image generation, which is the shape this component
 * was drawn from: enough to run the same job again, plus one field that was
 * left unset.
 */
const RECIPE = [
  { label: "Model", value: "flux-1-dev" },
  { label: "Seed", value: "884201773", copyable: true },
  { label: "Sampler", value: "dpmpp_2m" },
  { label: "Guidance", value: "3.5" },
  { label: "Negative", value: undefined },
];

export const LabelBesideValue: Story = {
  args: { items: RECIPE },
};

export const LabelAboveValue: Story = {
  args: { columns: 1, items: RECIPE },
};

export const CopyableValue: Story = {
  args: {
    items: [
      { label: "Seed", value: "884201773", copyable: true },
      { label: "Sampler", value: "dpmpp_2m", copyable: true },
      { label: "Steps", value: "28" },
    ],
  },
};

export const MissingValue: Story = {
  args: {
    items: [
      { label: "Model", value: "flux-1-dev" },
      { label: "Negative", value: undefined },
      // `copyable` on an absent value is dropped, not disabled: there is
      // nothing to put on the clipboard, so the control is simply not there.
      { label: "Seed", value: undefined, copyable: true },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The whole component is a `dl`, a `dt`, a `dd` and one button. There is no
 * keyframe, transition or transform in the file — the only stateful styling
 * is `hover:text-foreground` and a focus ring, neither of which is motion.
 * A story here would render identically to `CopyableValue`.
 *
 * // case-skip: Controlled — nothing here holds a value
 * `items` is data in and the component keeps no copy of it. There is no
 * `value`/`onChange` pair, no selection, and no callback of any kind in
 * `StatReadoutProps`; the copy button writes to the clipboard and changes
 * nothing rendered. A readout has no state for a parent to own.
 *
 * // case-skip: EmptyLabel — the optional slot is the value, and its empty rendering is already a declared state
 * `label` is required and is the row's only naming source, so there is no
 * label-less or icon-only rendering to expose. The slot that can go empty is
 * `value`, and the component's answer to that — the em-dash — is the
 * `MissingValue` state above, where the judgment belongs. A second story
 * emptying the same slot would read as coverage and prove nothing new.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the most consequential of the case stories here because
 * this component is made of numbers.
 *
 * Two things behave correctly. The grid reverses, so labels sit at the right
 * and values at the left, which is what `grid-cols-[auto_1fr]` should do
 * under `dir="rtl"`. And the copy control, being the second child of a flex
 * `dd`, lands at the logical end of its value rather than at a fixed visual
 * side.
 *
 * One thing does not, and it is recorded rather than fixed. The value is not
 * pinned `dir="ltr"`, unlike the numbers in the three sibling components that
 * price or meter something — `cost-chip` pins `stat-readout`-shaped digits on
 * `cost-chip-amount`, `credits-indicator` on `credits-indicator-balance`, and
 * `quota-meter` on its used/limit span, all for this reason. Under the bidi
 * algorithm a neutral character sitting between two numbers takes the
 * paragraph direction, so a composite value such as the `1024 × 1024` below,
 * or a range like `12 – 48`, has its two number runs laid out right-to-left
 * while each run stays internally left-to-right. A lone number (`884201773`,
 * `3.5`) is unaffected, which is why this has survived: it only shows up on
 * the composite values, and a readout of generation parameters is full of
 * them.
 *
 * Not fixed here because it is an API decision, not a class: `value` is a
 * `ReactNode` and is as often prose ("Enabled", a model name in the page's
 * own language) as it is a number, so a blanket `dir="ltr"` on the `dd` would
 * break the prose case. It needs either a per-item opt-in or a caller-side
 * wrapper. Carried in the report.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full max-w-xs">
      <StatReadout {...args} />
    </div>
  ),
  args: {
    items: [
      { label: "Model", value: "flux-1-dev" },
      { label: "Size", value: "1024 × 1024" },
      { label: "Seed", value: "884201773", copyable: true },
      { label: "Negative", value: undefined },
    ],
  },
};

/**
 * Tab traversal, which for this component is a short list: the labels and
 * values are `dt`/`dd` and take no focus, so the only stops are the copy
 * controls, in the order their rows were passed. The play function pins that
 * the stops are exactly the copy controls and that each one shows a visible
 * ring — the button sets `focus-visible:outline-none` alongside its
 * `focus-visible:ring-2`, so if the ring utility were ever dropped the focus
 * indicator would disappear entirely rather than fall back to the UA outline.
 *
 * The defect this story surfaces is in the names, not the order: every copy
 * control is `aria-label="Copy"` with nothing identifying its row, so the two
 * stops below announce identically. `slot-summary` — the nearest component
 * with a per-row control — already does the right thing, naming each one
 * `Change {label}`, and its own `KeyboardOrder` asserts the four names are
 * distinct. That assertion is deliberately not written here, because it would
 * fail: the fix is an API change (`label` is a `ReactNode`, so a row-scoped
 * name needs either a string coercion or an explicit `copyLabel`), and
 * pinning the current behaviour with a passing assertion would be worse than
 * leaving it unpinned. Carried in the report.
 */
export const KeyboardOrder: Story = {
  args: {
    items: [
      { label: "Seed", value: "884201773", copyable: true },
      { label: "Sampler", value: "dpmpp_2m", copyable: true },
      { label: "Guidance", value: "3.5" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Two copyable rows, one plain row: only the copyable rows have controls.
    const copies = canvas.getAllByRole("button");
    await expect(copies).toHaveLength(2);

    // Nothing here sets tabindex, so DOM order is tab order — and the only
    // focusables in the subtree are those two controls.
    const focusable = Array.from(canvasElement.querySelectorAll<HTMLElement>("button, a[href]"));
    await expect(focusable).toHaveLength(2);
    await expect(focusable[0]).toBe(copies[0]);
    await expect(focusable[1]).toBe(copies[1]);

    const visited: HTMLElement[] = [];
    for (let i = 0; i < copies.length; i++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement | null;
      if (!focused || !canvasElement.contains(focused)) break;
      visited.push(focused);

      await expect(focused.matches(":focus-visible")).toBe(true);
      // The ring is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused);
    }

    await expect(visited).toHaveLength(2);
    await expect(visited[0]).toBe(copies[0]);
    await expect(visited[1]).toBe(copies[1]);
  },
};

/**
 * A ~90 character value, which is what a negative prompt actually looks like.
 * The component neither truncates nor scrolls: the `dd` wraps, and because
 * the label track is `auto` against a `1fr` value track, a wrapped value
 * pushes the grid into an increasingly lopsided shape rather than clipping.
 * Two consequences are only visible here. The copy control uses
 * `items-center`, so on a value that wraps to three lines it floats beside
 * the middle line instead of aligning with the first. And the row height is
 * now set by one field, which breaks the even rhythm that made the two-column
 * form worth having — this is the rendered form of the docs page's second
 * don't, and the reason long prose belongs above the readout rather than
 * inside it.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-full max-w-xs">
      <StatReadout {...args} />
    </div>
  ),
  args: {
    items: [
      { label: "Model", value: "flux-1-dev" },
      {
        label: "Negative",
        value: "blurry, low contrast, watermark, extra fingers, text artifacts, oversaturated colors",
        copyable: true,
      },
      { label: "Seed", value: "884201773", copyable: true },
    ],
  },
};

/**
 * 375px. This is one of the components that is genuinely fine at phone width,
 * and the story exists to say so with a rendered pass rather than an
 * assertion of faith: the root is a grid, not a flex row, so the value column
 * absorbs whatever the `auto` label column leaves and long values wrap
 * instead of forcing horizontal scroll. The two-column form survives here, so
 * `columns={1}` is a density choice for narrow *containers* — a sidebar rail,
 * a popover — not something a phone breakpoint forces on you.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <StatReadout {...args} />
    </div>
  ),
  args: { items: RECIPE },
};

/**
 * Three components that all render a column of label/value rows and mean
 * different things. The rule is what the number is measured against, and who
 * is accountable for it being right:
 *
 * - **Stat readout** reports. The value is whatever the run produced; there
 *   is no threshold, no denominator and no opinion. Its only control copies.
 * - **Quota meter** measures against a limit. There is a denominator, so the
 *   component can have a view about whether the number is bad, and it paints
 *   near-limit and over-limit differently. If the value reads as `x of y`,
 *   it is this one.
 * - **Slot summary** is task state the system resolved on the user's behalf,
 *   so every row carries where the value came from and a way to correct it.
 *   If a wrong value would cause a wrong action, it belongs here.
 *
 * The shortcut: if anything can act on the number, it is not a readout. The
 * moment a stat readout grows a source mark or a correction affordance it has
 * become a slot summary, which is the boundary the spec draws explicitly.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Stat readout — a reported number</p>
        <StatReadout
          items={[
            { label: "Model", value: "flux-1-dev" },
            { label: "Seed", value: "884201773", copyable: true },
            { label: "Steps", value: "28" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Quota meter — a number against a limit</p>
        <QuotaMeter
          resources={[{ label: "Image generations", used: 412, limit: 1000, resetsIn: "Resets in 6 days" }]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Slot summary — a value someone may need to correct
        </p>
        <SlotSummary
          slots={[
            { id: "model", label: "Model", value: "flux-1-dev", source: "stated" },
            { id: "size", label: "Size", value: "1024 × 1024", source: "defaulted" },
            { id: "seed", label: "Seed", source: "inferred", required: true },
          ]}
          onCorrect={() => {}}
        />
      </section>
    </div>
  ),
};
