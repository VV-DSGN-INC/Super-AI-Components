import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { DateSection } from "@/registry/super-ai/date-section";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { SectionHeaderDocs } from "@/content/components/section-header.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

// `layout: "padded"` rather than "centered": the whole component is a
// `justify-between` row, and centred it shrink-wraps to its content, which
// puts the title and the action slot next to each other and documents the
// opposite of what the component does.
const meta: Meta<typeof SectionHeader> = {
  title: "Super AI/Section Header",
  component: SectionHeader,
  parameters: { layout: "padded", docs: { page: componentDocsPage(SectionHeaderDocs) } },
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Plain: Story = {
  args: { title: "Recent projects" },
};

export const WithAction: Story = {
  args: {
    title: "Recent projects",
    action: (
      <a href="#" className="underline underline-offset-2">
        View all
      </a>
    ),
  },
};

export const WithCount: Story = {
  args: { title: "Assets", count: 12 },
};

export const Collapsible: Story = {
  args: { title: "Filters", count: 3, collapsible: true, defaultOpen: true, size: "sm" },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The file has no `animate-*`, no `transition-*` and no transform. Collapsing
 * is an instantaneous attribute flip (`aria-expanded` plus `data-state`), and
 * the panel that would be worth animating belongs to the caller, not to this
 * component. A reduced-motion story would render identically to `Collapsible`
 * and imply coverage of a branch that does not exist.
 *
 * // case-skip: EmptyLabel — `title` is required and is the trigger's only accessible-name source
 * There is no optional text slot to empty: `title` is non-optional in
 * `SectionHeaderProps`, and in the collapsible variant it is what names the
 * button. Rendering `title=""` would ship an axe `button-name` violation into
 * a gate running at `test: "error"` — a caller error, not a component state.
 * The optional slots (`count`, `action`) are omitted in `Plain` above, which
 * is the real "nothing else supplied" rendering.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing here because the component's only
 * layout decision is `justify-between`: the title and count take the inline
 * start, the action takes the inline end. Mirrored, the title and its count
 * move to the right and "View all" to the left, and the count stays *after*
 * the title in reading order rather than jumping in front of it.
 *
 * Two things worth checking by eye. The count is `tabular-nums` but is not
 * pinned `dir="ltr"` the way `credits-indicator`'s balance is — a bare
 * integer is safe, so this only matters if a caller ever puts a formatted
 * number or a range in that slot. And the action slot is caller markup, so a
 * chevron placed there mirrors only if the caller uses a logical property.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <SectionHeader {...args} />
    </div>
  ),
  args: {
    title: "Recent projects",
    count: 12,
    action: (
      <a href="#" className="underline underline-offset-2">
        View all
      </a>
    ),
  },
};

/**
 * Tab traversal, and the semantic question this component owns.
 *
 * The good half: the collapsible variant is a real `<button type="button">`
 * with `aria-expanded`, not a div with a click handler, and the title and
 * count sit *inside* it so the button's accessible name is "Filters 3". The
 * action is a separate stop after it, in DOM order, which is tab order here —
 * nothing sets `tabindex`. The play function pins all of that, plus a visible
 * focus treatment at every stop.
 *
 * The half that is not good, and is recorded rather than asserted: **the
 * header is not a heading.** The root is a plain `<div>` with no `h1`–`h6`,
 * no `role="heading"` and no `aria-level`, so a section title contributes
 * nothing to the document outline and heading navigation skips it. Every
 * consumer in the registry works around this the same way — `tool-panel`,
 * `filter-panel` and `asset-library` all wrap the group in `role="group"` +
 * `aria-labelledby` pointing at the header's `id` — which is a workaround
 * shaped exactly like a missing feature. No assertion is written for the
 * absence, because pinning it would make the eventual fix a test failure. See
 * the report and the docs module's first pitfall.
 *
 * **What the focus assertion measured, and it is about the `action` slot
 * rather than about this component's own markup: the slot styles nothing it
 * is handed.** The "View all" link is the story's own fixture, a bare `<a>`,
 * and focused it reads `box-shadow: none` — the whole treatment is Chromium's
 * own focus ring (`outline-style: auto`, 1px), which
 * `expectPerceptibleFocus` accepts because it is genuinely perceptible. The
 * collapsible trigger beside it carries `focus-visible:ring-2`, so the two
 * stops in one header are treated differently. `action` is a
 * `React.ReactNode`, so every consumer's link inherits that gap unless they
 * ring it themselves — worth saying in the docs module rather than papering
 * over in the fixture.
 */
export const KeyboardOrder: Story = {
  args: {
    title: "Filters",
    count: 3,
    collapsible: true,
    defaultOpen: true,
    action: (
      <a href="#" className="underline underline-offset-2">
        View all
      </a>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The disclosure is a real button carrying real state, and the title and
    // count both live inside it, so both feed its accessible name.
    const trigger = canvas.getByRole("button", { name: /Filters/ });
    await expect(trigger).toHaveAttribute("type", "button");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger.querySelector('[data-slot="section-header-title"]')).not.toBeNull();
    await expect(trigger.querySelector('[data-slot="section-header-count"]')).not.toBeNull();

    const action = canvas.getByRole("link", { name: "View all" });

    // Bounded by the known stop count, so a regression that added a stop fails
    // here instead of hanging the run. Every stop must be visibly focused —
    // the KeyboardOrder must-show.
    for (const expected of [trigger, action]) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(expected);
      await expect(focused.matches(":focus-visible")).toBe(true);
      // The ring is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused);
    }

    // Activating from the keyboard flips the state the button advertises.
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

const onOpenChangeSpy = fn();

/**
 * The controlled pair. `open` + `onOpenChange` is a genuine controlled API:
 * passing `open` switches the component off its internal state entirely, so a
 * click reports the intent and moves nothing on screen until the host
 * re-renders with a new value. `property-inspector` and `filter-panel` both
 * drive it this way, because they need the panel and the header to agree.
 *
 * The trap this story exists to pin is the half-wired case: `open` passed with
 * no `onOpenChange` gives you a focusable button that can never change
 * anything, and neither TypeScript nor the runtime says a word. Here the spy
 * catches the payload, and the assertions confirm both halves — the callback
 * carries the *next* value (`false`), and repeated clicks against an unchanged
 * `open` hold the header fixed rather than drifting.
 */
export const Controlled: Story = {
  args: {
    title: "Filters",
    count: 3,
    collapsible: true,
    open: true,
    onOpenChange: onOpenChangeSpy,
  },
  play: async ({ canvasElement }) => {
    onOpenChangeSpy.mockClear();
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="section-header"]');
    const trigger = canvas.getByRole("button", { name: /Filters/ });

    await expect(root).toHaveAttribute("data-state", "open");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);

    // The callback fires with the value a consumer has to apply…
    await expect(onOpenChangeSpy).toHaveBeenCalledTimes(1);
    await expect(onOpenChangeSpy).toHaveBeenCalledWith(false);
    // …and interaction alone does not move the rendered value.
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(root).toHaveAttribute("data-state", "open");

    // Re-rendering with an unchanged `open` holds it fixed.
    await userEvent.click(trigger);
    await expect(onOpenChangeSpy).toHaveBeenCalledTimes(2);
    await expect(onOpenChangeSpy).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

/**
 * A ~90-character title in a rail-width column, which is the width these
 * actually ship at. The component's answer is asymmetric and only visible
 * here: `section-header-title` carries `truncate` and `section-header-action`
 * carries `shrink-0`, so the title loses characters and the count and action
 * keep every pixel they asked for. That is the right priority for a count —
 * a truncated number is a wrong number — and the wrong one for a long action,
 * which is why the docs cap the action at two or three words.
 *
 * The `max-w-sm` wrapper is a test condition, not a design value; it is the
 * width the shipped demo already uses.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <SectionHeader {...args} />
    </div>
  ),
  args: {
    title: "Generated variations from the quarterly-review deck, sorted by run",
    count: 24,
    action: (
      <a href="#" className="underline underline-offset-2">
        View all
      </a>
    ),
  },
};

/**
 * 375px. Nothing reflows and nothing scrolls sideways — the row is a single
 * flex line that truncates, so the phone case is the rail case with less
 * room, and the title simply gives up more of itself. Worth having as its own
 * gate because the collapsible trigger is the only tap target in the row, and
 * this is where its size is visible: `size="sm"` puts the row at `text-xs`
 * with `py-1`, and the trigger adds no padding of its own, so the target is
 * one small line of text tall and only as wide as "Filters 3". The horizontal
 * budget is fine; the vertical one is not. A caller shipping this to a phone
 * should pad the row rather than assume the header did.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SectionHeader {...args} />
    </div>
  ),
  args: {
    title: "Filters",
    count: 3,
    collapsible: true,
    defaultOpen: true,
    size: "sm",
  },
};

/**
 * Beside `date-section` (A3), the temporal near-twin. Both put a small label
 * above a list of rows and both are reached for when a flat list needs
 * breaking up, and they are not interchangeable:
 *
 * - **Section header** is a header *line*. It wraps nothing — pass it children
 *   and they are discarded — and it owns a count, a trailing action and an
 *   optional disclosure. Reach for it when the group is a thing the user acts
 *   on: filters to reset, assets to view all of, a panel to shut.
 * - **Date section** is a *wrapper*. It renders `role="group"` with
 *   `aria-labelledby` around its children, so the grouping is announced for
 *   free, and it has exactly one prop: `label`. Reach for it when the group is
 *   a time bucket the user reads past — Today, Yesterday, Last week.
 *
 * The choosing rule: if the group has a count, an action or a collapse, it is
 * a section header. If it is a bucket in a chronological list, it is a date
 * section. And note what the comparison exposes — the temporal sibling is the
 * one that gets the group semantics right, while the header that names itself
 * a header renders a div.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div>
        <SectionHeader
          title="Assets"
          count={3}
          action={
            <a href="#" className="underline underline-offset-2">
              View all
            </a>
          }
        />
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>quarterly-review.pdf</li>
          <li>launch-deck.key</li>
          <li>onboarding-script.md</li>
        </ul>
      </div>

      <DateSection label="Today">
        <p className="text-muted-foreground px-2 text-sm">Summarize the quarterly review</p>
        <p className="text-muted-foreground px-2 text-sm">Draft the launch announcement</p>
      </DateSection>
    </div>
  ),
};
