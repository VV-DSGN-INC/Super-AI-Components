import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ContextChip, ContextChips } from "@/registry/super-ai/context-chips";
import { FrameStrip } from "@/registry/super-ai/frame-strip";
import { ReferenceStrip, type ReferenceStripItem } from "@/registry/super-ai/reference-strip";
import { ReferenceStripDocs } from "@/content/components/reference-strip.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const FILLED_ITEMS = [
  {
    id: "one",
    thumbnail: { src: "https://placehold.co/200x200?text=1", alt: "Concept sketch of a lighthouse" },
  },
  {
    id: "two",
    thumbnail: { src: "https://placehold.co/200x200?text=2", alt: "Photo of a coastline at dusk" },
  },
  {
    id: "three",
    thumbnail: { src: "https://placehold.co/200x200?text=3", alt: "Reference of a rope texture" },
  },
];

const ROLE_ITEMS = [
  {
    id: "first-frame",
    role: "first-frame" as const,
    thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
  },
  { id: "last-frame", role: "last-frame" as const },
  {
    id: "character",
    role: "character" as const,
    thumbnail: { src: "https://placehold.co/200x200?text=Char", alt: "Reference of the main character" },
  },
];

const meta: Meta<typeof ReferenceStrip> = {
  title: "Super AI/Reference Strip",
  component: ReferenceStrip,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ReferenceStripDocs) } },
};

export default meta;
type Story = StoryObj<typeof ReferenceStrip>;

/**
 * No references attached yet. This is the whole-strip empty state, and it is
 * deliberately not a strip at all: F4's first-class panel — a headline, a line
 * of explanation and one CTA — rather than a bare string or a single squeezed
 * tile in an otherwise empty row.
 *
 * The keyboard consequence is the thing to notice. With no items there is no
 * Carousel, so there is no `role="region"`, no arrow-key handler and no
 * previous/next pair: the surface is exactly one tab stop until the first
 * reference exists. Attaching one swaps in a scroller with up to three stops
 * per slot on top of two for the arrows, which is a much larger control than
 * the panel it replaced.
 */
export const Empty: Story = {
  args: {
    items: [],
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No references yet")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /add reference/i })).toBeInTheDocument();
  },
};

/**
 * Three plain references, no roles. `hasRoles` is derived from the data rather
 * than passed, so an array where no item carries a `role` or a `label` turns
 * the whole label row off — the caption line under each tile is not rendered
 * at all, not rendered empty.
 *
 * That is the right look for "here are the pictures I want you to match", and
 * it has a cost: with no role text there is no per-slot name to build controls
 * from, so every remove and reorder button falls back to the bare word
 * "reference". `EmptyLabel` is that consequence rendered.
 */
export const Filled: Story = {
  args: {
    items: FILLED_ITEMS,
    onMove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByAltText("Concept sketch of a lighthouse")).toBeInTheDocument();
    // No role text on a plain, roleless reference set.
    await expect(canvasElement.querySelector('[data-slot="reference-strip-role"]')).not.toBeInTheDocument();
  },
};

/**
 * Typed slots — first frame, last frame, character — which is the state D2
 * exists for: the role is data, and it changes what the model does with the
 * picture.
 *
 * The middle slot has no `thumbnail`, and that is the per-slot rule the spec
 * asks for: an unfilled typed slot stays in the strip as a still-visible add
 * affordance instead of being left out of the array, so "this mode accepts a
 * last frame" is discoverable before anything is attached. Note it is a
 * *different* rule from the whole-strip `Empty` above, and that an empty slot
 * carries only its add button — the move controls belong to filled slots, so
 * an unfilled typed slot cannot be reordered.
 */
export const WithRoles: Story = {
  args: {
    items: ROLE_ITEMS,
    onAdd: () => {},
    onMove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("First frame")).toBeInTheDocument();
    await expect(canvas.getByText("Character")).toBeInTheDocument();

    // The unfilled "last frame" slot stays visible and actionable.
    const emptySlot = canvas.getByRole("button", { name: /last frame/i });
    await userEvent.click(emptySlot);
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this strip meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no case-skip lines. That is unusual
 * enough to justify rather than leave as box-ticking: the strip has physical
 * chevrons and a physical gutter (`RTL`), a `state: "loading"` slot that
 * animates (`ReducedMotion`), up to three buttons per slot (`KeyboardOrder`),
 * an `items` array it never mutates (`Controlled`), optional `role`/`label`
 * text (`EmptyLabel`), an author-supplied `label` in a 112px slot
 * (`LongContent`), and two near-twins it is confused with (`Boundary`).
 * `Mobile` is always written.
 *
 * The one that needed a decision was `ReducedMotion`. C3 `feature-card-row`
 * skips it — "the row moves, but nothing in it animates in CSS" — and this
 * strip shares C3's Embla base, so that half of the reasoning carries over
 * unchanged. What does not carry over is `ReferenceStripItem.state`: this
 * component's own item API can put a pulsing skeleton on screen, which C3 has
 * no way to do, so there is a branch here to document and a composition seam
 * worth pinning.
 * ---------------------------------------------------------------------- */

/** Every keyboard stop must show where focus is, not merely take it. */
function expectVisiblyFocused(element: Element) {
  expect(element.matches(":focus-visible")).toBe(true);
  const style = getComputedStyle(element);
  expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
}

/**
 * Right-to-left, and the strip does not survive it. Four things fail, three of
 * them inherited from the vendored `components/ui/carousel.tsx` and already
 * recorded against C3 `feature-card-row`:
 *
 * - Embla's `direction` option defaults to `'ltr'` and is never set — it does
 *   not read the document's `dir` — so the tween arithmetic counts one way
 *   while the flex row lays slots out the other.
 * - The gutter is compensated physically: `-ml-4` on the content, `pl-4` on
 *   each item. Neither mirrors, so the 1rem inset lands on the wrong edge.
 * - `CarouselPrevious` is pinned `-left-12` behind a left chevron and
 *   `CarouselNext` `-right-12` behind a right one, so "previous" ends up on
 *   the side the *next* slot arrives from.
 *
 * The fourth is this component's own, and is not recorded anywhere else: the
 * reorder controls are named and iconed by *physical* direction. "Move
 * Character left" carries a `ChevronLeft` and calls `onMove(id, "left")`,
 * which means "toward index 0" — and index 0 renders on the **right** under
 * `dir="rtl"`. So in RTL the button that reads and points left moves the slot
 * visually right. The array semantics stay correct; it is the label and the
 * icon that mislead. H5 `frame-strip`'s `onReorder(id, "left" | "right")` has
 * the same shape.
 *
 * Recorded rather than fixed, and deliberately unasserted. Three of the four
 * live in a shadcn primitive every carousel consumer shares, and the fourth
 * is a rename of a public callback's argument — an API change, not a class
 * swap.
 */
export const RTL: Story = {
  args: {
    items: ROLE_ITEMS,
    onAdd: () => {},
    onMove: () => {},
  },
  render: (args) => (
    <div dir="rtl" className="w-[36rem] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
};

/**
 * A slot uploading. `ReferenceStripItem.state` is this component's own API, so
 * a caller can put a pulsing skeleton in the strip without touching
 * `preview-tile` — and the branch that suppresses it is A8's
 * `motion-reduce:animate-none`, inherited rather than restated here.
 *
 * That inheritance is the fact worth a story. The assertion reads
 * `animationName` back off the strip's own slot rather than trusting a class
 * string, so it fails if the strip ever grows a role-aware skeleton of its
 * own — the plausible refactor, and the one that would silently drop the
 * branch.
 *
 * What does *not* branch: the scroll itself. Embla tweens
 * `transform: translate3d(...)` from JavaScript, so there is no `animate-*`
 * to cancel and no `transition-*` on the translated element; honouring the
 * media feature there means branching `opts.duration` to 0, which is
 * behavioural and belongs to the shared carousel rather than to this file.
 * Same finding as C3 `feature-card-row`, same disposition.
 */
export const ReducedMotion: Story = {
  args: {
    items: [
      {
        id: "uploading",
        role: "reference" as const,
        state: "loading" as const,
        thumbnail: { src: "https://placehold.co/200x200?text=Up", alt: "Reference still uploading" },
      },
      ROLE_ITEMS[2],
    ],
    onMove: () => {},
  },
  render: (args) => (
    <div className="w-[36rem] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector(
      '[data-slot="reference-strip-slot"] [data-slot="preview-tile-loading"]',
    );
    await expect(skeleton).not.toBeNull();
    await expect(getComputedStyle(skeleton as Element).animationName).toBe("none");
  },
};

/**
 * Tab traversal across three filled, reorderable slots, and the fact it exists
 * to pin is that the stop count is *asymmetric*: two on the first slot, three
 * on the second, two on the last. The move buttons are `disabled` at each end
 * of the array, and a disabled button is not a tab stop, so the traversal
 * costs exactly what is actionable rather than a uniform three-per-slot with
 * two inert stops in it. The previous/next pair drops out on the same
 * principle: the column here is wide enough that the strip cannot scroll, so
 * both arrows are disabled and neither is a stop either.
 *
 * Per slot the order is remove, then move-left, then move-right: the remove
 * control sits in `preview-tile`'s badge corner *inside* the frame, so it
 * precedes the caption row in DOM order, which is tab order here because
 * nothing sets `tabindex`.
 *
 * Not asserted, and a real defect: pressing the last enabled Move on a slot
 * disables the button under the cursor, and a focused element that becomes
 * disabled is blurred, so focus drops to `<body>`. The repair is for `onMove`
 * to hand focus to the sibling control, which is focus management — a design
 * decision, so it is recorded here and carried in the wave report for
 * CONTINUE.md §8 rather than pinned with an assertion that expects the wrong
 * thing.
 */
export const KeyboardOrder: Story = {
  args: {
    items: FILLED_ITEMS.map((item, index) => ({
      ...item,
      role: (["first-frame", "reference", "last-frame"] as const)[index],
      onRemove: () => {},
    })),
    onMove: () => {},
  },
  render: (args) => (
    <div className="w-[36rem] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing to scroll at this width, so both affordances are inert and out
    // of the tab order — the asymmetry below is the whole traversal.
    await expect(canvas.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Next slide" })).toBeDisabled();

    // Two, three, two: the ends lose the move they cannot make.
    const moves = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="reference-strip-move"]'),
    );
    await expect(moves).toHaveLength(6);
    await expect(moves[0]).toBeDisabled();
    await expect(moves[moves.length - 1]).toBeDisabled();

    const stops = Array.from(canvasElement.querySelectorAll<HTMLElement>("button:not([disabled])"));
    await expect(stops).toHaveLength(7);
    await expect(stops[0]).toHaveAttribute("data-slot", "reference-strip-remove");
    await expect(stops[1]).toHaveAttribute("data-slot", "reference-strip-move");

    // One lap: every stop is new, and every stop shows where focus is.
    const seen = new Set<Element>();
    await userEvent.tab();
    for (const stop of stops) {
      await expect(document.activeElement).toBe(stop);
      await expect(seen.has(stop)).toBe(false);
      seen.add(stop);
      expectVisiblyFocused(stop);
      await userEvent.tab();
    }
  },
};

/** A parent that records every reorder it is asked for and refuses one of them. */
function ControlledReferenceStrip() {
  const [items, setItems] = React.useState<ReferenceStripItem[]>([
    {
      id: "first-frame",
      role: "first-frame",
      thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
    },
    {
      id: "character",
      role: "character",
      thumbnail: { src: "https://placehold.co/200x200?text=Char", alt: "Reference of the main character" },
    },
    {
      id: "style",
      role: "reference",
      thumbnail: { src: "https://placehold.co/200x200?text=Style", alt: "Reference of a rope texture" },
    },
  ]);
  const [requests, setRequests] = React.useState<string[]>([]);

  const move = (id: string, direction: "left" | "right") => {
    setRequests((log) => [...log, `${id} ${direction}`]);
    // The first frame is pinned to index 0 by the pipeline; the request is
    // recorded, the array is not changed.
    if (id === "first-frame") return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === id);
      const to = direction === "left" ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-2">
      <ReferenceStrip
        items={items.map((item) => ({
          ...item,
          onRemove: () => setItems((current) => current.filter((entry) => entry.id !== item.id)),
        }))}
        onMove={move}
      />
      <p className="text-foreground text-xs">{`Moves requested: ${requests.length}`}</p>
    </div>
  );
}

/**
 * The parent owns the array; the strip renders it and nothing else. There is
 * no `value`/`onChange` pair here because `items` *is* the value — the strip
 * keeps no order, no selection and no draft of its own, so every mutation has
 * to travel out through `onMove` / `onRemove` and come back as new props.
 *
 * The harness proves that by refusing one of the moves it is asked for, which
 * is a real pipeline constraint rather than a contrivance: a first frame that
 * stops being first stops being a first frame. Three things follow, in the
 * order the play function takes them. A refused reorder fires `onMove` with
 * the `(id, direction)` payload a caller needs and leaves the rendered order
 * untouched. An accepted one moves the strip only because the parent applied
 * it. And removing the character reference leaves the two survivors on their
 * own roles — the spec's third bullet ("removing a first frame must not
 * silently promote another reference") stated as a test, which holds for the
 * simple reason that there is no internal state here to promote anything with.
 */
export const Controlled: Story = {
  render: () => <ControlledReferenceStrip />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const roles = () =>
      Array.from(canvasElement.querySelectorAll('[data-slot="reference-strip-role"]')).map(
        (el) => el.textContent,
      );

    await expect(roles()).toEqual(["First frame", "Character", "Reference"]);

    // Refused: the callback fires with the payload, the rendered order holds.
    await userEvent.click(canvas.getByRole("button", { name: "Move First frame right" }));
    await expect(canvas.getByText("Moves requested: 1")).toBeInTheDocument();
    await expect(roles()).toEqual(["First frame", "Character", "Reference"]);

    // Applied: the strip moves only because the owner moved it.
    await userEvent.click(canvas.getByRole("button", { name: "Move Character right" }));
    await expect(canvas.getByText("Moves requested: 2")).toBeInTheDocument();
    await expect(roles()).toEqual(["First frame", "Reference", "Character"]);

    // Removing one slot promotes nothing: the survivors keep their own roles.
    await userEvent.click(canvas.getByRole("button", { name: "Remove Character" }));
    await expect(roles()).toEqual(["First frame", "Reference"]);
  },
};

/**
 * The same three references with no `role` and no `label` on any of them — the
 * plain "match these pictures" strip, which is what `Filled` ships. Dropping
 * the text does two things at once.
 *
 * Visibly, the caption row still renders, because `onMove` is passed and the
 * move controls live in it; only the label span is gone, and it is gone rather
 * than rendered empty. The fourth slot here is unfilled, which has no caption
 * row at all, so its column is shorter than its filled siblings' by exactly
 * that row — the tiles still share a top edge, and the carousel items stay
 * even because the flex row stretches them. That is what keeps a mixed strip
 * from going ragged, and it is asserted below.
 *
 * Invisibly, and this is the sharp edge: the accessible names are built from
 * `typeof roleLabel === "string"`, which falls through to the bare word
 * "reference" for every slot. Nine icon-only buttons collapse onto three
 * distinct names — three each of "Remove reference", "Move reference left"
 * and "Move reference right" — so a screen-reader user has no way to tell
 * which slot a control belongs to, in the one configuration where the tiles
 * carry no visible text either. The play function pins the half that is
 * unambiguously right, that no control ships unnamed; the collision itself is
 * described rather than asserted, because the repair (an index, or requiring
 * `thumbnail.alt` to name the controls) would rightly break an assertion that
 * expected the duplicates.
 */
export const EmptyLabel: Story = {
  args: {
    items: [...FILLED_ITEMS.map((item) => ({ ...item, onRemove: () => {} })), { id: "spare" }],
    onAdd: () => {},
    onMove: () => {},
  },
  render: (args) => (
    <div className="w-[36rem] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing labels a slot, and no label element is rendered empty.
    await expect(canvasElement.querySelector('[data-slot="reference-strip-role"]')).not.toBeInTheDocument();

    // Every icon-only control still carries a name, which is the failure this
    // configuration usually produces elsewhere.
    const controls = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="reference-strip-remove"], [data-slot="reference-strip-move"]',
      ),
    );
    await expect(controls).toHaveLength(9);
    for (const control of controls) {
      await expect(control.getAttribute("aria-label")?.trim()).toBeTruthy();
    }

    // The unlabelled empty slot names itself "Add" rather than nothing.
    await expect(canvas.getByRole("button", { name: "Add" })).toBeInTheDocument();

    // Filled and unfilled slots agree about height, so the row stays even.
    const slots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="reference-strip-item"]'),
    );
    const heights = new Set(slots.map((slot) => Math.round(slot.getBoundingClientRect().height)));
    await expect(heights.size).toBe(1);
  },
};

/**
 * An 86-character `label` on a 112px slot. `label` is `React.ReactNode` and
 * overrides the word `role` would have produced, so nothing bounds it, and the
 * strip's answer is one line and an ellipsis: the role span is `min-w-0
 * truncate` and the slide is `shrink-0 grow-0 basis-24 sm:basis-28`, so the
 * text can neither wrap nor widen its slot.
 *
 * That is the right answer here, and it is worth saying why, because the
 * identical `truncate` on C3 `feature-card-row` is recorded as a defect. A
 * feature card's description is its only explanation and deserves the vertical
 * room the card already has; a role is a two-word noun by construction —
 * "First frame", "Character" — so a caller who needs 86 characters is writing
 * a sentence into a slot that is not a caption.
 *
 * The one thing that does not truncate is the accessible name. `accessibleName`
 * takes the whole string, so the remove button announces all 86 characters
 * while the eye gets about twelve. Better than the "reference" fallback in
 * `EmptyLabel`, and still not what a caller intends.
 */
export const LongContent: Story = {
  args: {
    items: [
      {
        id: "character",
        label: "Character reference — keep the same face, hair and jacket across every generated frame",
        thumbnail: { src: "https://placehold.co/200x200?text=Char", alt: "Reference of the main character" },
        onRemove: () => {},
      },
      {
        id: "first-frame",
        role: "first-frame" as const,
        thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
        onRemove: () => {},
      },
    ],
    onMove: () => {},
  },
  render: (args) => (
    <div className="w-[36rem] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The long label does not widen its slot.
    const slots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="reference-strip-item"]'),
    );
    const widths = slots.map((slot) => Math.round(slot.getBoundingClientRect().width));
    await expect(widths[0]).toBe(widths[1]);

    // …and it is genuinely clipped rather than merely long.
    const role = canvasElement.querySelector<HTMLElement>('[data-slot="reference-strip-role"]')!;
    await expect(role.scrollWidth).toBeGreaterThan(role.clientWidth);
  },
};

/**
 * 375px, five slots, and the strip escapes its column. The vendored Carousel
 * draws its arrows at `-left-12` / `-right-12`, outside its own box: correct
 * on a full-bleed marketing row, and in a constrained column it is either
 * clipped or it turns the page into a horizontal scroller. C3
 * `feature-card-row` and H5 `frame-strip` both hit this and were fixed at
 * their call sites; D2 composes the same primitive with no override, so it is
 * the third instance and the first still open. O1's measurement on C3 was
 * 407px of content in a 375px column, all of it arrow.
 *
 * The wrapper here deliberately does *not* clip, unlike C3's and H5's, so the
 * escape is visible rather than hidden by the test harness. Measured in this
 * story: the strip's own box is 375px, each arrow's outer edge sits 48px
 * beyond it, and the visual footprint is 471px — 96px of arrow hanging out of
 * a 375px column.
 *
 * Recorded rather than fixed, per the wave's fix policy: the repair is a
 * position, and where the arrow lands is a design decision. `left-2` alone
 * keeps the vendored vertical centering and drops the button on the middle of
 * the tile image — which is why C3 needed `!top-2 my-0` on top of it, verified
 * in a browser rather than from the story assertion. The assertions below are
 * on what stays true either way: the strip's own box is inside the column, and
 * the slots keep their full width rather than being squeezed to fit.
 */
export const Mobile: Story = {
  args: {
    items: [
      ...FILLED_ITEMS,
      {
        id: "four",
        thumbnail: { src: "https://placehold.co/200x200?text=4", alt: "Photo of a harbour at dawn" },
      },
      {
        id: "five",
        thumbnail: { src: "https://placehold.co/200x200?text=5", alt: "Reference of a brass texture" },
      },
    ],
    onMove: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <ReferenceStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const strip = canvasElement.querySelector<HTMLElement>('[data-slot="reference-strip"]')!;
    await expect(Math.round(strip.getBoundingClientRect().width)).toBeLessThanOrEqual(375);

    // Five slots at this width overflow, and the row is a real scroller rather
    // than a squeeze: every slot keeps the same width it has at full size.
    const slots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="reference-strip-item"]'),
    );
    await expect(slots).toHaveLength(5);
    const widths = new Set(slots.map((slot) => Math.round(slot.getBoundingClientRect().width)));
    await expect(widths.size).toBe(1);
  },
};

/**
 * The three strips of small pictures, side by side. They are built from the
 * same parts — two of them literally wrap `preview-tile` in a Carousel — and
 * they answer different questions. The rule is about **what a slot is**:
 *
 * - **Reference strip** holds *inputs to the next generation*. A slot has a
 *   type, and the type is data: "first frame" conditions where a video starts,
 *   "character" conditions identity across every frame. An unfilled slot stays
 *   on screen because it advertises an input the mode accepts.
 * - **Frame strip** holds *the contents of something that already exists* —
 *   the frames of a clip, the pages of a deck. A slot is a position in a
 *   sequence, selection picks which one is current, and there is no such thing
 *   as an empty one: the sequence is however long it is.
 * - **Context chips** hold *pointers to things already in scope* — a file, a
 *   selection, a URL. No picture, no order, no type that changes model
 *   behaviour; removing one narrows what the model may read.
 *
 * The test, in order: if the slot's label changes what the model is
 * conditioned on, it is a reference strip. If it names a position inside one
 * artifact, it is a frame strip. If it has no picture and no order, it is a
 * context chip.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[36rem] max-w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Reference strip — typed inputs to the next generation
        </p>
        <ReferenceStrip items={ROLE_ITEMS} onAdd={() => {}} onMove={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Frame strip — positions inside one artifact</p>
        <FrameStrip
          kind="video"
          defaultValue="f2"
          items={["00:00:00", "00:00:04", "00:00:08"].map((timecode, index) => ({
            id: `f${index + 1}`,
            label: timecode,
            thumbnail: (
              <img
                src={`https://placehold.co/320x180?text=${index + 1}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ),
          }))}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Context chips — pointers to what is already in scope
        </p>
        <ContextChips>
          <ContextChip kind="file" label="shot-list.pdf" onRemove={() => {}} />
          <ContextChip kind="selection" label="Lines 40–58" onRemove={() => {}} />
        </ContextChips>
      </section>
    </div>
  ),
};
