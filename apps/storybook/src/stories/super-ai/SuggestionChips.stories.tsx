import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Sparkles } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { ContextChip, ContextChips } from "@/registry/super-ai/context-chips";
import { SuggestionChip, SuggestionChips, SuggestionChipsOverflow } from "@/registry/super-ai/suggestion-chips";
import { SuggestionChipsDocs } from "@/content/components/suggestion-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SuggestionChips> = {
  title: "Super AI/Suggestion Chips",
  component: SuggestionChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SuggestionChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof SuggestionChips>;

export const Plain: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
    </SuggestionChips>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Draft a reply" icon={<Sparkles />} onSelect={() => {}} />
      <SuggestionChip suggestion="Summarize this document" icon={<Sparkles />} onSelect={() => {}} />
    </SuggestionChips>
  ),
};

export const WithThumbnail: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip
        suggestion="Continue from last template"
        thumbnail={
          <div className="bg-primary/15 flex size-full items-center justify-center">
            <FileText className="text-primary size-3" />
          </div>
        }
        onSelect={() => {}}
      />
      <SuggestionChip
        suggestion="Resume the Q3 report"
        thumbnail={
          <div className="bg-primary/15 flex size-full items-center justify-center">
            <FileText className="text-primary size-3" />
          </div>
        }
        onSelect={() => {}}
      />
    </SuggestionChips>
  ),
};

export const OverflowLink: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
      <SuggestionChipsOverflow count={6} href="#" />
    </SuggestionChips>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the three that are missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * `Suggestions` is a ScrollArea with a hidden ScrollBar and `Suggestion` is
 * a plain Button; there is no transition, transform or keyframe to
 * suppress. A story asserting the reduced-motion path would assert that
 * nothing changed.
 *
 * // case-skip: EmptyLabel — suggestion is required, the chip's only accessible-name source
 * The component has no optional text slot to empty. The docs module's third
 * pitfall ("an icon-only chip with empty suggestion text ships an unlabeled
 * button") describes a caller error, and rendering it here would ship an
 * axe `button-name` violation into a gate that runs at `test: "error"`. It
 * belongs in the docs page's donts, where it is.
 *
 * // case-skip: Controlled — onSelect reports a pick, there is no value to hold
 * `SuggestionChip`'s `onSelect` fires with the clicked suggestion's text so
 * a caller can fill a composer elsewhere; the component never tracks a
 * selection of its own — no `value` prop exists anywhere in
 * `SuggestionChipsProps`/`SuggestionChipProps`, and no chip carries a
 * selected state a parent could hold with one. A prompt shortcut, not a
 * controlled input.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The row is a horizontal scroller with an optional leading
 * icon slot, so direction is load-bearing in three places: the chips must
 * start at the right edge, each chip's icon must precede its text on the
 * right, and the overflow link must land at the logical end of the row
 * rather than the visual left.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <SuggestionChips {...args}>
        <SuggestionChip suggestion="Summarize this document" icon={<Sparkles />} onSelect={() => {}} />
        <SuggestionChip suggestion="Find action items" icon={<Sparkles />} onSelect={() => {}} />
        <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
        <SuggestionChipsOverflow count={6} href="#" />
      </SuggestionChips>
    </div>
  ),
};

/**
 * Tab traversal across the row. The load-bearing fact is the last stop: the
 * overflow affordance is a real `<a href>`, not a chip, so a keyboard user
 * reaches it as a link and can open it in a new tab. The play function pins
 * that — a future refactor turning the overflow back into a button would
 * still look identical and would silently break the spec's "overflow
 * resolves to a real link" rule.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChipsOverflow count={6} href="#" />
    </SuggestionChips>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Chips are buttons; the overflow is a link. Two different roles, in
    // that order, is the whole contract.
    const chips = canvas.getAllByRole("button");
    await expect(chips).toHaveLength(2);

    const overflow = canvas.getByRole("link", { name: "6 more" });
    await expect(overflow).toHaveAttribute("href");

    // …and it comes last in DOM order, which is tab order here: nothing in
    // this row sets tabindex, so document order is the traversal.
    const focusable = canvasElement.querySelectorAll("button, a[href]");
    await expect(focusable[focusable.length - 1]).toBe(overflow);

    // The new KeyboardOrder must-show: every stop is visibly focused.
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      await userEvent.tab();
    }
  },
};

/**
 * A 90-character suggestion. `Suggestions` lays its children out as
 * `flex w-max flex-nowrap` inside `whitespace-nowrap`, so a long chip does
 * not wrap and does not truncate — it widens the row and pushes everything
 * after it out of view. That is the component's actual answer to long
 * content, and it is only visible here.
 */
export const LongContent: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip
        suggestion="Summarize the quarterly review and list every decision that still needs an owner"
        onSelect={() => {}}
      />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
    </SuggestionChips>
  ),
};

/**
 * 375px. The row overflows and its scrollbar is hidden by design
 * (`Suggestions` renders `<ScrollBar className="hidden">`), so at this width
 * the third chip is not merely off-screen, it is off-screen with no visible
 * affordance saying so. This is the rendered form of the docs page's first
 * don't, and the reason `SuggestionChipsOverflow` exists.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SuggestionChips {...args}>
        <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
        <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
        <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
      </SuggestionChips>
    </div>
  ),
};

/**
 * The three chip rows side by side. They look alike and are not
 * interchangeable, and the rule is about what a click does:
 *
 * - **Suggestion chips** put text into the composer. A click is a shortcut
 *   for typing, and the user still has to send.
 * - **Choice chips** set a parameter. A click changes a value the next run
 *   will use; the row carries radio/checkbox semantics and a selected state.
 * - **Context chips** point at something already attached. A click removes
 *   it; the chip is a handle on state that exists, not an action.
 *
 * If the row has a selected state, it is not a suggestion row. If the chips
 * can be dismissed, it is not a suggestion row either.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Suggestion chips — fills the composer</p>
        <SuggestionChips>
          <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
          <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
        </SuggestionChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Choice chips — sets a parameter</p>
        <ChoiceChips defaultValue="16:9">
          <ChoiceChip value="1:1">1:1</ChoiceChip>
          <ChoiceChip value="4:5">4:5</ChoiceChip>
          <ChoiceChip value="16:9">16:9</ChoiceChip>
        </ChoiceChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Context chips — removes an attachment</p>
        <ContextChips>
          <ContextChip kind="file" label="quarterly-review.pdf" onRemove={() => {}} />
          <ContextChip kind="selection" label="Lines 40–58" onRemove={() => {}} />
        </ContextChips>
      </section>
    </div>
  ),
};
