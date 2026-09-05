import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ContextChip, ContextChipOverflow, ContextChips } from "@/registry/super-ai/context-chips";
import { FilterBar, FilterChip } from "@/registry/super-ai/filter-bar";
import { SlotSummary } from "@/registry/super-ai/slot-summary";
import { ContextChipsDocs } from "@/content/components/context-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ContextChips> = {
  title: "Super AI/Context Chips",
  component: ContextChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContextChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ContextChips>;

/**
 * A file the user attached to the message. The chip body is inert — a
 * `<span>` holding an `aria-hidden` icon and a text node — so the only thing
 * a pointer or a keyboard can reach here is the X, and that is deliberate:
 * making the whole pill clickable would nest one interactive element inside
 * another.
 *
 * The X reports, it does not remove. `onRemove` is a bare `() => void` and
 * the component holds no list of its own, so a caller who wires it to nothing
 * ships a remove button that visibly does nothing. What is rendered is
 * exactly the children that were passed, always.
 */
export const File: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
    </ContextChips>
  ),
};

/**
 * A range inside a document the user highlighted before asking. `kind` picks
 * the glyph and nothing else — the range itself lives entirely in `label`, as
 * a display string.
 *
 * That is the difference between this and D5 `quote-reply`, which carries a
 * stable anchor so an edited source still resolves. Nothing in
 * `ContextChipProps` anchors anywhere, so "lines 12-40" keeps reading
 * "lines 12-40" after someone inserts a paragraph at line 5. Watching for
 * that drift is the host's job, and `unresolved` is where it reports the
 * answer.
 */
export const Selection: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
    </ContextChips>
  ),
};

/**
 * A page the model will fetch. Worth noticing what is absent: no anchor, no
 * activation, no `href` anywhere in the tree. A URL reference can be removed
 * but never followed, so a user who wants to check what they attached has to
 * find it somewhere other than here.
 *
 * The label is a display string, not the URL — the host decides how much of
 * it to show, and `LongContent` below is what happens when it decides to show
 * all of it.
 */
export const Url: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
    </ContextChips>
  ),
};

/**
 * A person or agent pulled into the message. The `@` is part of the label the
 * caller passes, not something the component prepends, so it is stated twice
 * for a sighted reader (the AtSign glyph and the character) and once for a
 * screen reader, which never hears the icon.
 *
 * This is also the one `kind` whose label is direction-fragile — see `RTL`.
 */
export const Mention: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
    </ContextChips>
  ),
};

/**
 * The row's answer to running out of space, and the spec's rule stated as a
 * component: references past the visible set collapse into one count, never
 * into a horizontal scroll a user can push context out of.
 *
 * Two things it does not do. It carries no `aria-expanded` and no
 * `aria-controls`, so nothing tells a keyboard or screen-reader user whether
 * activating it grows the row or opens a panel — describe that in your own
 * handler. And it has no remove control, so the four references behind it are
 * unremovable until something reveals them.
 */
export const Overflow: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
      <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
      <ContextChipOverflow count={4} onClick={() => {}} />
    </ContextChips>
  ),
};

/**
 * A reference whose target moved, was deleted, or expired. The state is
 * carried four independent ways at once — the glyph swaps to a warning
 * triangle, the border goes dashed, the label is struck through, and the
 * literal word "unresolved" is appended as text — so it survives greyscale,
 * a colour-vision deficiency, and a screen reader that never sees any of the
 * first three.
 *
 * What no amount of styling covers: there is no live region here. A chip that
 * flips to unresolved mid-session because someone deleted the file announces
 * nothing at all, which is the exact failure this state exists to prevent,
 * reintroduced for anyone not watching the screen.
 */
export const Unresolved: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="brief.pdf" unresolved onRemove={() => {}} />
    </ContextChips>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the reference kinds above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing moves; the only timed change is a colour crossfade
 * The remove button and the overflow chip carry `transition-colors` for their
 * hover swap (`hover:bg-accent hover:text-accent-foreground`), and that is the
 * whole of the motion in this tree — no `animate-*`, no transform, no size or
 * position change anywhere. `motion-reduce:transition-none` is a sanctioned
 * idiom here, but only beside a `transition-*` a user would perceive as
 * motion; a background and text crossfade is `reset-affordance`'s recorded
 * case, and this is the same one. A story would render identically to
 * `File` and imply a branch that does not exist.
 *
 * // case-skip: Controlled — no value/onChange pair; `onRemove` is a one-way report with no payload
 * `ContextChipsProps` is `React.ComponentProps<"div">` and `ContextChipProps`
 * adds `kind`, `label`, `unresolved` and `onRemove: () => void`. There is no
 * `value`, no selection, and the removal callback takes no argument — the
 * chip cannot tell its caller which reference it was, because identity lives
 * in the closure the caller wrote. The reference set is the children, held by
 * the host, which is the same shape `generation-queue` and `suggestion-chips`
 * skipped on. The one fact a `Controlled` story would have carried — that
 * clicking X removes nothing by itself — is in `File`'s description instead.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Every chip is an icon, then a label, then a trailing remove
 * control, so direction decides where the tight edge of the pill goes and
 * which side the "· unresolved" suffix lands on.
 *
 * **Fixed in this wave (mechanical).** The chip padded itself with `pl-2` and
 * `pr-1`/`pr-2`, and the remove button offset itself with `ml-0.5` — all
 * physical. Under `dir="rtl"` that put the wide edge next to the X and the
 * tight edge next to the icon, mirrored from what the LTR design says. Swapped
 * to `ps-2` / `pe-1` / `pe-2` / `ms-0.5`, which compile to byte-identical
 * declarations in LTR; `field-row` and `promo-card` carry the same swap.
 *
 * **Recorded, not fixed (behavioural).** `mention` labels reorder. Measured in
 * chromium: `@teammate` inside this row under `dir="rtl"` paints as
 * `teammate@`. The `@` is a neutral character with no strong direction and no
 * Latin text before it, so the bidi algorithm hands it the paragraph's
 * direction and moves it to the far end of the run. `design.fig`,
 * `lines 12-40` and `vercel.com/docs` are all safe under the same measurement,
 * because their separators sit between two Latin runs and take direction from
 * them. The fix is to pin the label `dir="ltr"` — a behaviour change and a new
 * idiom for this registry, not a compile-identical swap, so it is recorded
 * here rather than swept in with the padding. Same class as `kbd`'s
 * `KbdGroup` in `CONTINUE.md` §8, and worse in the same way: a mention that
 * reads `teammate@` still looks like a mention.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <ContextChips {...args}>
        <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
        <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
        <ContextChip kind="selection" label="lines 12-40" unresolved onRemove={() => {}} />
        <ContextChipOverflow count={2} onClick={() => {}} />
      </ContextChips>
    </div>
  ),
};

/**
 * Tab traversal across a mixed row, and the contract it pins is the one
 * `CONTINUE.md` §8 records as broken in five other components: **every
 * per-chip control carries a distinct accessible name.** Five components in
 * this catalog name their per-row button with a constant, so a screen-reader
 * user navigating by element list hears "Remove, Remove, Remove" with the row
 * identity living only in visual adjacency. This one builds the name from
 * `label`, and the assertion below is what keeps it that way through a
 * refactor.
 *
 * The other fact here is subtractive: the third chip has no `onRemove`, so it
 * is not a tab stop at all. A row of five references where two are
 * non-removable is a row of three stops, and nothing about the rendering says
 * which two a keyboard cannot reach.
 *
 * **Recorded, not fixed (behavioural).** Removing a chip unmounts the button
 * that had focus and nothing restores it, so focus falls to `<body>` and the
 * next Tab restarts at the top of the page. That belongs in the component, not
 * in a story assertion, so the play function walks the row and stops short of
 * clicking — asserting the current focus loss would pin it green.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
      <ContextChip kind="url" label="vercel.com/docs" />
      <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
      <ContextChipOverflow count={2} onClick={() => {}} />
    </ContextChips>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Four buttons for five chips: the url chip has no `onRemove` and so
    // contributes nothing to the tab sequence.
    const buttons = [...canvasElement.querySelectorAll("button")];
    await expect(buttons).toHaveLength(4);

    // The contract. Each remove control is named from its own chip, so the
    // four names are four different names.
    const names = buttons.map((b) => b.getAttribute("aria-label"));
    await expect(new Set(names).size).toBe(names.length);
    await expect(names).toEqual([
      "Remove design.fig",
      "Remove lines 12-40",
      "Remove @teammate",
      "2 more references",
    ]);
    await expect(canvas.getByRole("button", { name: "Remove design.fig" })).toBeInTheDocument();

    // One lap of the row: DOM order is tab order (nothing here sets
    // tabindex), and every stop paints a visible focus treatment.
    const stops: Element[] = [];
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      stops.push(focused);
      await userEvent.tab();
    }
    await expect(stops).toEqual(buttons);
  },
};

/**
 * A chip whose label is the empty string. `label` is a required `string`,
 * which is not the same as a non-empty one: an @-mention that resolves to an
 * account with no display name set, or a selection whose host had nothing to
 * summarise, both arrive here.
 *
 * What renders is a pill with a glyph and an X and no text between them, and
 * the failure is in the part you cannot see. The remove control's name is
 * built as `Remove ${label}`, so an empty label collapses it to "Remove" —
 * the generic per-row name `CONTINUE.md` §8 catalogues as its own defect
 * category, reached here through an empty string rather than through a
 * constant. Two such chips in one row announce identically.
 *
 * **Recorded, not fixed (behavioural).** The component would have to fall back
 * to the `kind` word ("Remove file reference") or refuse to render, and either
 * is a design decision rather than a drift correction. Worth flagging with it:
 * the docs module's screen-reader note currently claims this name "cannot
 * silently collapse to a generic name" — this story is the hole in that
 * sentence.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="brief.pdf" onRemove={() => {}} />
      <ContextChip kind="mention" label="" onRemove={() => {}} />
    </ContextChips>
  ),
};

/**
 * A 91-character URL and a 78-character path, both things a host really hands
 * this component. The label is capped at `max-w-40` and truncated, so the
 * component's answer to long content is a hard 160px ellipsis regardless of
 * how much room the row has.
 *
 * The interesting part is who can still read it. The remove button's
 * `aria-label` interpolates the whole label, so a screen-reader user hears the
 * full URL that a sighted user cannot see: there is no `title`, no tooltip,
 * and no expansion anywhere. On the second chip, which has no `onRemove`, even
 * that route is gone and the truncated text is the only copy that exists.
 *
 * The path chip is the docs page's third pitfall rendered: mid-path truncation
 * keeps `packages/ds-rules/src/rul…` and drops the filename, which is the only
 * part that identifies the reference. Pass the display name, not the raw path.
 *
 * **Recorded, not fixed (behavioural).** A `title` on the label span would
 * close the sighted-user half; it is an API addition rather than a class swap.
 */
export const LongContent: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip
        kind="url"
        label="https://vercel.com/docs/frameworks/nextjs/app-router/data-fetching/caching-and-revalidating"
        onRemove={() => {}}
      />
      <ContextChip
        kind="file"
        label="packages/ds-rules/src/rules/contrast/foreground-composite-contrast.fixture.tsx"
      />
    </ContextChips>
  ),
};

/**
 * 375px, with six references attached — the width where this component's
 * layout choice starts costing something.
 *
 * The row is `flex flex-wrap`, so nothing is ever hidden and nothing scrolls:
 * chips move to a second and third line and the block grows downward. That is
 * the opposite of C2 `suggestion-chips`, which is a scroller with a hidden
 * scrollbar and simply loses its later chips at this width — and it is the
 * right trade here, because a context chip you cannot see is context you
 * cannot remove.
 *
 * What it costs: the truncation cap is a fixed 160px, not a proportion, so a
 * long label eats 43% of a 375px viewport and puts one chip on a line by
 * itself. Six references is three rows of chips sitting on top of the
 * composer. That is the point where `ContextChipOverflow` stops being
 * optional, which is why this story shows both.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <ContextChips {...args}>
        <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
        <ContextChip kind="file" label="quarterly-review-draft.pdf" onRemove={() => {}} />
        <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
        <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
        <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
        <ContextChipOverflow count={3} onClick={() => {}} />
      </ContextChips>
    </div>
  ),
};

/**
 * Three surfaces that look like a row of small pills and answer different
 * questions. C2 `suggestion-chips`'s Boundary already separates the three
 * chip *rows* by what a click does; this one continues past it, to the two
 * components a context chip is genuinely mistakable for.
 *
 * - **Context chips** are references the user attached. Removing one changes
 *   what the model reads, so a removal is destructive to the answer. The chip
 *   body is inert text and the X is the single tab stop.
 * - **A5 `filter-bar`'s chips** are also removable pills, and that is the
 *   whole of the resemblance. A filter narrows what *you* see; removing one
 *   widens the view and changes nothing the model receives. Structurally the
 *   chip body is itself an `aria-pressed` toggle, so each filter chip is two
 *   tab stops to a context chip's one.
 * - **D7 `slot-summary`** is task state the *system* resolved, not references
 *   the user attached — the spec's own boundary, and the accountability is
 *   inverted. A wrong slot is corrected in place and the row stays; a wrong
 *   reference is removed and the chip goes.
 *
 * `choice-chips`'s Boundary offers "if a chip can be removed, it is a filter
 * chip" as a one-line test. It is one line short: both removable chip types
 * are here. The test that separates them is what the removal costs — a view,
 * or an answer.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Context chips — removing one changes what the model reads
        </p>
        <ContextChips>
          <ContextChip kind="file" label="quarterly-review.pdf" onRemove={() => {}} />
          <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
        </ContextChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Filter chips — removing one widens what you see</p>
        <FilterBar>
          <FilterChip active onRemove={() => {}}>
            Images
          </FilterChip>
          <FilterChip active onRemove={() => {}}>
            Last 7 days
          </FilterChip>
        </FilterBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Slot summary — the system resolved it, so it is corrected, not removed
        </p>
        <SlotSummary
          slots={[
            { id: "source", label: "Document", value: "quarterly-review.pdf", source: "stated" },
            { id: "range", label: "Range", value: "lines 12-40", source: "inferred" },
          ]}
          onCorrect={() => {}}
        />
      </section>
    </div>
  ),
};
