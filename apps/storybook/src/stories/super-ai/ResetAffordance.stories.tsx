import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { ResetAffordanceDocs } from "@/content/components/reset-affordance.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are the transform properties an inspector in this system actually
 * carries — opacity, blur, scale — with the units `UnitInput` already
 * documents (%, px, ×). No invented product names and no fabricated numbers.
 */
const meta: Meta<typeof ResetAffordance> = {
  title: "Super AI/Reset Affordance",
  component: ResetAffordance,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ResetAffordanceDocs) } },
  args: { label: "Reset opacity", onReset: fn() },
  render: (args) => (
    <div className="w-64">
      <FieldRow label="Opacity" reset={<ResetAffordance {...args} />}>
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof ResetAffordance>;

/**
 * The value differs from the default it shipped with, so the reset is live.
 * The one thing worth knowing here is what the click does *not* do: the
 * component holds no state, so `onReset` fires and the ↺ stays exactly as
 * lit as it was. It only goes quiet when the caller recomputes `state` from
 * the new value. A consumer who forgets that ships a reset button that never
 * turns off.
 */
export const Modified: Story = {
  args: { state: "modified" },
};

/**
 * Nothing to reset — and the answer this component gives is **disabled, not
 * hidden**. The button stays mounted at `opacity-30`, which has two
 * consequences worth stating out loud, because they pull in opposite
 * directions:
 *
 * - the slot keeps its width, so the row does not reflow the instant a value
 *   moves, and the control never migrates to a new position;
 * - a disabled button is out of the tab ring but still in the accessibility
 *   tree, so a screen-reader user browsing by element hears "Reset opacity,
 *   button, unavailable" on every untouched row in the inspector.
 *
 * That second cost is real and is the price of the first. Hiding it instead
 * would silence the announcement and reintroduce the reflow.
 */
export const AtDefault: Story = {
  args: { state: "default" },
  render: (args) => (
    <div className="w-64">
      <FieldRow label="Opacity" reset={<ResetAffordance {...args} />}>
        {(id) => <UnitInput id={id} unit="%" defaultValue={100} />}
      </FieldRow>
    </div>
  ),
};

/**
 * The value is driven by an animation track rather than a single number, so
 * the glyph swaps from ↺ to ◇ and the meaning of a click widens from "put
 * this number back" to "clear the track". Same slot, same size, same
 * accessible name — the only signal is the glyph, which is `aria-hidden`, so
 * the distinction is visual-only. If a product needs it announced, the
 * `label` is where it goes ("Clear scale keyframes").
 */
export const Keyframed: Story = {
  args: { state: "keyframed", label: "Reset scale" },
  render: (args) => (
    <div className="w-64">
      <FieldRow label="Scale" reset={<ResetAffordance {...args} />}>
        {(id) => <UnitInput id={id} unit="×" defaultValue={1} />}
      </FieldRow>
    </div>
  ),
};

/**
 * The same component on a section header, clearing every row beneath it.
 * `scope` changes nothing but the target size (24×24 against the row's
 * 20×20) — scope is a placement decision, never a "how much changed"
 * decision.
 *
 * Recorded tension: `section-header`'s `action` slot is documented as "a
 * link, never a button — it navigates, it does not act", while A11's spec
 * puts the group reset on the section header. The two specs disagree about
 * this one slot; the reset is placed here because it is the only slot that
 * exists for it, and the disagreement is reported rather than resolved by
 * forking either component.
 */
export const GroupLevel: Story = {
  args: { state: "modified", scope: "group", label: "Reset transform" },
  render: (args) => (
    <div className="w-64 space-y-2">
      <SectionHeader title="Transform" size="sm" action={<ResetAffordance {...args} />} />
      <FieldRow
        label="Opacity"
        reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
      <FieldRow
        label="Blur"
        reset={<ResetAffordance state="modified" label="Reset blur" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
      </FieldRow>
    </div>
  ),
};

/**
 * The collapsed rendering of `modified`: one situation, a different form.
 * Fold the group shut and the button is replaced by a 6px dot — and the
 * substitution is total, not cosmetic. There is no `<button>` left, so no
 * role, no accessible name, no tab stop and nothing to click; the only way
 * to reset is to open the group first.
 *
 * That is why this is declared as its own state rather than treated as a
 * skin on `modified`: the control stops being a control. It also means the
 * signal is `aria-hidden` — see the case-story block below and the docs
 * page's second pitfall.
 */
export const ModifiedDot: Story = {
  args: { state: "modified", collapsed: true, label: "Reset transform" },
  render: (args) => (
    <div className="w-64">
      <SectionHeader
        title="Transform"
        size="sm"
        collapsible
        defaultOpen={false}
        action={<ResetAffordance {...args} />}
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing here moves; the only timed change is a colour fade
 * The single timed change in the component is `transition-colors`, which
 * carries the hover move from `text-muted-foreground` to `text-foreground`.
 * There is no `animate-*` class anywhere in the tree, so there is nothing for
 * `motion-reduce:animate-none` to switch off.
 *
 * `motion-reduce:transition-none` is a sanctioned idiom in this repo — see
 * `story-conventions.md`, mechanical fact 3 — but it is sanctioned beside a
 * `transition-*` a user would perceive as motion: a thumb that slides, a panel
 * that grows. `pricing-table`'s switch is that. This is a 150ms crossfade
 * between two text colours at a fixed position and a fixed size; no pixel
 * changes place, so there is nothing a reduced-motion user needs suppressed
 * and no branch for a story to document. Adding the class would buy the story
 * an assertion about `transitionProperty` and nothing about the component.
 *
 * Because `vitest.config.ts` already runs every story with
 * `reducedMotion: "reduce"`, a ReducedMotion story here would render
 * pixel-identical to `Modified` and imply coverage of a branch that does not
 * exist.
 *
 * // case-skip: Controlled — `state` is a rendering input, not a held value
 * There is no `value`/`onChange` pair and no equivalent. `state` is derived
 * by the caller from "live value ≠ stored default" and the component never
 * proposes a change to it — no `onStateChange` exists, and no interaction
 * can move it. `onReset` is `() => void`: it requests an action and carries
 * no payload, because the caller already knows which field it wired the
 * control to. With nothing for a parent to hold, the convention's three
 * assertions have no subject. (`Modified`'s description carries the fact
 * this story would otherwise pin: the button does not go quiet by itself.)
 *
 * // case-skip: LongContent — the only author-supplied string is never painted
 * `label` lands in `aria-label`, and the button's visible content is one
 * fixed glyph (↺ or ◇) chosen by `state`. There is no visible text slot, so
 * there is no wrap, truncate or scroll decision to render at ~90 characters.
 * A long label is a screen-reader verbosity question, not a layout one.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two facts, and they point different ways.
 *
 * The row flips correctly for free: `field-row`'s `grid-cols-[6rem_1fr]`
 * resolves against the writing direction, so the label moves to the right
 * edge and the control group — input, then reset — runs leftward from it.
 * The reset still lands at the logical end of its row, which is what the
 * slot means.
 *
 * The glyph does **not** flip, and that is deliberate rather than an
 * oversight: ↺ is a text character, not an SVG, so no `rtl:` utility could
 * mirror it — and rotational reset/refresh marks are conventionally left
 * unmirrored in RTL anyway, unlike undo/redo arrows. Worth knowing before
 * someone "fixes" it.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-64 space-y-2">
      <SectionHeader
        title="Transform"
        size="sm"
        action={<ResetAffordance state="modified" scope="group" label="Reset transform" onReset={() => {}} />}
      />
      <FieldRow
        label="Opacity"
        reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
      <FieldRow
        label="Scale"
        reset={<ResetAffordance state="keyframed" label="Reset scale" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="×" defaultValue={1} />}
      </FieldRow>
    </div>
  ),
};

/**
 * The tab ring through a real inspector, and the reason "disabled, not
 * hidden" is the interesting choice this component owns.
 *
 * Four resets are rendered: one group-level and three row-level, of which
 * the Blur row is at its default. Six stops are expected — group reset,
 * then input/reset for Opacity, the input alone for Blur, then input/reset
 * for Scale. The disabled reset is skipped by the ring but stays in the
 * accessibility tree, which is exactly the trade `AtDefault` describes: a
 * keyboard user never lands on a dead control, and a screen-reader user is
 * still told the row has a reset that is currently unavailable. Hiding it
 * would have flipped both halves of that.
 *
 * The ring assertion is scoped to the reset controls on purpose. `UnitInput`
 * paints its focus ring on the wrapping `<span>` via `focus-within`, so the
 * focused `<input>` itself computes no outline and no box-shadow — a real
 * fact about a neighbour, and not something this story should assert against.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <SectionHeader
        title="Transform"
        size="sm"
        action={<ResetAffordance state="modified" scope="group" label="Reset transform" onReset={() => {}} />}
      />
      <FieldRow
        label="Opacity"
        reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
      <FieldRow
        label="Blur"
        reset={<ResetAffordance state="default" label="Reset blur" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="px" defaultValue={0} />}
      </FieldRow>
      <FieldRow
        label="Scale"
        reset={<ResetAffordance state="keyframed" label="Reset scale" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="×" defaultValue={1} />}
      </FieldRow>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All four resets are in the tree, including the one that cannot be used.
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
    const atDefault = canvas.getByRole("button", { name: "Reset blur" });
    await expect(atDefault).toBeDisabled();

    const stops: HTMLElement[] = [];
    // Bounded by the expected count plus slack: six stops, then focus should
    // leave the canvas. An unbounded while-loop would hang if it ever wrapped.
    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement | null;
      if (!focused || !canvasElement.contains(focused)) break;
      stops.push(focused);
      if (focused.dataset.slot === "reset-affordance") {
        await expect(focused.matches(":focus-visible")).toBe(true);
        const style = getComputedStyle(focused);
        await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      }
    }

    await expect(stops).toHaveLength(6);
    await expect(stops).not.toContain(atDefault);
    await expect(stops.filter((el) => el.dataset.slot === "reset-affordance")).toHaveLength(3);
  },
};

/**
 * `label` is optional, and this is what omitting it costs. The button is
 * always icon-only — the glyph is `aria-hidden`, so `aria-label` is the sole
 * source of an accessible name — and the default is the bare word "Reset".
 * Three untitled resets in one inspector therefore announce as three
 * identical buttons; the screen-reader element list that a user navigates by
 * reads "Reset, Reset, Reset", and the field each one belongs to exists only
 * in the visual adjacency. Nothing in the gates catches this: axe has no rule
 * against duplicate accessible names.
 *
 * The collapsed section below is the other end of the same problem. Its dot
 * has no label at all — `aria-hidden="true"`, no role, no tab stop — so the
 * spec's promise that a folded-up group still signals its changes is kept
 * for sighted users and silently broken for everyone else. Recorded here
 * rather than pinned with an assertion, because the fix is an API decision
 * (what should a non-control announce, and under which prop) and not a class
 * change.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div className="space-y-2">
        <SectionHeader title="Transform" size="sm" />
        <FieldRow label="Opacity" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
        </FieldRow>
        <FieldRow label="Blur" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
        </FieldRow>
        <FieldRow label="Scale" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="×" defaultValue={1} />}
        </FieldRow>
      </div>
      <SectionHeader
        title="Appearance"
        size="sm"
        collapsible
        defaultOpen={false}
        action={<ResetAffordance state="modified" collapsed />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Three fields, one accessible name between them.
    await expect(canvas.getAllByRole("button", { name: "Reset" })).toHaveLength(3);

    // The dot carries no name because it carries no semantics at all.
    const dot = canvasElement.querySelector('[data-slot="reset-affordance-dot"]');
    await expect(dot).toBeInTheDocument();
    await expect(dot).toHaveAttribute("aria-hidden", "true");
    await expect(dot?.tagName).toBe("SPAN");
    const focusable = Array.from(canvasElement.querySelectorAll("button, [tabindex], a[href]"));
    await expect(focusable).not.toContain(dot);
  },
};

/**
 * 375px. The row survives the width — `field-row` keeps its `6rem` label
 * column and the control group holds input, unit suffix and reset without
 * wrapping or scrolling sideways.
 *
 * The thing to look at here is the target, not the layout. Row scope renders
 * `size-5` — 20×20 CSS pixels with no padding around it — which clears
 * nothing: WCAG 2.2's minimum target size is 24×24, and this is the surface
 * where that matters, sitting a thumb's width from a number input it must
 * not be confused with. Group scope (`size-6`) is exactly 24. Recorded, not
 * silently fixed: growing the row control changes the vertical rhythm of
 * every inspector row in the system.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full space-y-2">
      <SectionHeader
        title="Transform"
        size="sm"
        action={<ResetAffordance state="modified" scope="group" label="Reset transform" onReset={() => {}} />}
      />
      <FieldRow
        label="Opacity"
        reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
      <FieldRow
        label="Blur"
        reset={<ResetAffordance state="default" label="Reset blur" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="px" defaultValue={0} />}
      </FieldRow>
    </div>
  ),
};

/**
 * The three placements side by side. They are one component, and choosing
 * between them is a question about the **container**, never about how much
 * has changed:
 *
 * - **Group scope, on a `section-header`.** The header owns a set of rows, so
 *   its reset clears all of them. Bigger only because a header baseline is
 *   bigger.
 * - **Row scope, in a `field-row`'s `reset` slot.** One value, one control,
 *   at the logical end of the row. This is the default and the common case.
 * - **The collapsed dot, on a folded group.** Not a third scope — the
 *   collapsed form of whichever scope was already there. It reports; it does
 *   not act.
 *
 * The neighbour it is easiest to confuse this with is `section-header`'s own
 * `action` slot, which the header documents as a navigation link ("View
 * all") rather than a control. If the thing in the top-right of a group
 * takes you somewhere, it is that slot's intended occupant; if it changes
 * values in place, it is this component.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <section className="space-y-2">
        <p className="text-foreground text-xs font-medium">Group scope — clears every row below</p>
        <SectionHeader
          title="Transform"
          size="sm"
          action={
            <ResetAffordance state="modified" scope="group" label="Reset transform" onReset={() => {}} />
          }
        />
        <FieldRow
          label="Opacity"
          reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
        >
          {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
        </FieldRow>
        <FieldRow
          label="Scale"
          reset={<ResetAffordance state="keyframed" label="Reset scale" onReset={() => {}} />}
        >
          {(id) => <UnitInput id={id} unit="×" defaultValue={1} />}
        </FieldRow>
      </section>

      <section className="space-y-2">
        <p className="text-foreground text-xs font-medium">Row scope — clears one value</p>
        <FieldRow
          label="Blur"
          reset={<ResetAffordance state="modified" label="Reset blur" onReset={() => {}} />}
        >
          {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
        </FieldRow>
      </section>

      <section className="space-y-2">
        <p className="text-foreground text-xs font-medium">Collapsed — signals, does not act</p>
        <SectionHeader
          title="Appearance"
          size="sm"
          collapsible
          defaultOpen={false}
          action={<ResetAffordance state="modified" collapsed />}
        />
      </section>
    </div>
  ),
};
