import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mic, Scissors, Sparkles, Wand2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { RecommendationCard } from "@/registry/super-ai/recommendation-card";
import { FeatureCardRowDocs } from "@/content/components/feature-card-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const ICON_TITLE_DESC: FeatureCardRowItem[] = [
  {
    id: "script-to-video",
    icon: <Wand2 className="size-4" aria-hidden />,
    title: "Script to video",
    description: "Turn a written script into a rough cut with stock footage.",
    onSelect: () => {},
  },
  {
    id: "voice-clone",
    icon: <Mic className="size-4" aria-hidden />,
    title: "Clone a voice",
    description: "Generate narration in a voice trained on a short sample.",
    onSelect: () => {},
  },
  {
    id: "auto-edit",
    icon: <Scissors className="size-4" aria-hidden />,
    title: "Remove filler words",
    description: "Cut silences and \"um\"s from a raw recording automatically.",
    onSelect: () => {},
  },
];

const WITH_THUMBNAIL: FeatureCardRowItem[] = [
  {
    id: "templates",
    thumbnail: { src: "https://placehold.co/320x180?text=Templates", alt: "Grid of starter templates" },
    title: "Browse templates",
    description: "Start from a layout other teams already ship with.",
    onSelect: () => {},
  },
  {
    id: "brand-kit",
    thumbnail: { src: "https://placehold.co/320x180?text=Brand+Kit", alt: "Preview of a saved brand kit" },
    title: "Apply a brand kit",
    description: "Fonts, colors and logo, applied to every export.",
    onSelect: () => {},
  },
  {
    id: "captions",
    thumbnail: { src: "https://placehold.co/320x180?text=Captions", alt: "Preview of auto-generated captions" },
    title: "Auto-generate captions",
    description: "Burned-in or downloadable, in over 30 languages.",
    onSelect: () => {},
  },
];

const HORIZONTAL_SCROLL: FeatureCardRowItem[] = [
  ...WITH_THUMBNAIL,
  {
    id: "translate",
    thumbnail: { src: "https://placehold.co/320x180?text=Dub", alt: "Preview of a dubbed clip" },
    title: "Dub into another language",
    description: "Lip-synced translation for the whole project.",
    onSelect: () => {},
  },
  {
    id: "resize",
    thumbnail: { src: "https://placehold.co/320x180?text=Resize", alt: "Preview of resized aspect ratios" },
    title: "Resize for every platform",
    description: "One export, reframed for square, vertical and widescreen.",
    onSelect: () => {},
  },
  {
    id: "remove-bg",
    thumbnail: { src: "https://placehold.co/320x180?text=Remove+BG", alt: "Preview of background removal" },
    title: "Remove the background",
    description: "Isolate the subject without a green screen.",
    onSelect: () => {},
  },
];

const meta: Meta<typeof FeatureCardRow> = {
  title: "Super AI/Feature Card Row",
  component: FeatureCardRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeatureCardRowDocs) } },
  decorators: [(Story) => <div className="w-[36rem]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof FeatureCardRow>;

export const IconTitleDesc: Story = {
  args: { items: ICON_TITLE_DESC },
};

export const WithThumbnail: Story = {
  args: { items: WITH_THUMBNAIL },
};

export const HorizontalScroll: Story = {
  args: { items: HORIZONTAL_SCROLL },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this row meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply and why the two below are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the row moves, but nothing in it animates in CSS
 * Embla tweens `transform: translate3d(...)` from JavaScript, so neither
 * sanctioned idiom can reach the thing that moves: there is no `animate-*`
 * for `motion-reduce:animate-none` to cancel, and no `transition-*` on the
 * translated element. The two `transition-*` classes that do exist in the
 * tree crossfade rather than move — `EntityRow`'s `transition-colors` on
 * hover, and the shadcn Button base's `transition-all`, which also carries
 * the arrows' 1px `active:translate-y-px` press nudge. That nudge is the one
 * borderline case; it is Button-wide behaviour shared by every control in
 * the registry, so suppressing it on these two arrows alone would document a
 * branch this component does not own. Honouring the media feature properly
 * means branching Embla's `opts.duration` to 0 — behavioural, so recorded
 * here rather than made.
 *
 * // case-skip: Controlled — items fire and forget; the row holds no value
 * `FeatureCardRowProps` is `{ items }` plus div props. Each item's
 * `onSelect` starts a task on some other surface; nothing here exposes a
 * `value`/`onChange` pair or a selected state — `FeatureCard` never passes
 * `EntityRow`'s `selected` through, so no card can be held on. The only
 * state the row owns is its scroll offset, which lives inside Embla and has
 * no controlled prop to drive it.
 * ---------------------------------------------------------------------- */

/**
 * Every keyboard stop must show where focus is, not merely take it. The
 * treatment is measured rather than merely present — see
 * `expectPerceptibleFocus`, which is also why this is async: it settles the
 * ring's transition before concluding.
 */
async function expectVisiblyFocused(element: HTMLElement) {
  await expect(element.matches(":focus-visible")).toBe(true);
  await expectPerceptibleFocus(element);
}

/**
 * Right-to-left, and the row does not survive it. Three physical assumptions
 * stack up, all of them inside the vendored `components/ui/carousel.tsx`
 * rather than in this component:
 *
 * - Embla's `direction` option defaults to `'ltr'` and is never set — it does
 *   not read the document's `dir` — so the tween arithmetic still counts
 *   left-to-right while the flex row lays its cards out right-to-left.
 * - The gutter is compensated with physical properties: `-ml-4` on the
 *   content, `pl-4` on each item. Neither mirrors, so the 1rem inset lands on
 *   the wrong edge and the first card no longer sits flush with the start.
 * - `CarouselPrevious` is pinned `-left-12` behind a left chevron and
 *   `CarouselNext` `-right-12` behind a right one, so "previous" ends up on
 *   the side the *next* card arrives from, pointing away from it.
 *
 * Recorded rather than fixed, and deliberately unasserted: the repair is
 * `direction: 'rtl'` plus logical properties inside a shadcn primitive every
 * carousel consumer shares. Swapping only the `-ml-4` that this component
 * duplicates would leave the item's `pl-4` uncompensated and read worse than
 * doing nothing.
 */
export const RTL: Story = {
  args: { items: ICON_TITLE_DESC },
  render: (args) => (
    <div dir="rtl" className="w-full">
      <FeatureCardRow {...args} />
    </div>
  ),
};

/**
 * Tab traversal, and the two facts that make the row usable without a mouse.
 *
 * The first is order: every card is a real `<button>` — `FeatureCard` sets
 * `onSelect`, which is what flips `EntityRow` from a div to a button and adds
 * its focus ring — and both scroll affordances come *after* the whole card
 * list in DOM order, which is tab order here because nothing sets `tabindex`.
 * The second is that the affordance actually works from the keyboard:
 * pressing Enter on "Next slide" advances the row, and "Previous slide"
 * (disabled at rest, so not a tab stop at all until then) becomes reachable.
 * The row also answers ArrowLeft/ArrowRight anywhere inside it, via the
 * region's `onKeyDownCapture` — undocumented on the docs page, and the reason
 * the region wrapper is not decorative.
 *
 * What this story does *not* assert, on purpose: Embla scrolls a focused card
 * into view (SlideFocus, at `duration(0)`), but only when the focus follows a
 * Tab keydown within 10ms of wall-clock. That is an environment-sensitive
 * race by construction, so the walk below asserts the stop it reaches rather
 * than where the row scrolled to.
 */
export const KeyboardOrder: Story = {
  args: { items: ICON_TITLE_DESC },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Cards first, affordances last — the order a keyboard user meets them.
    const cards = ICON_TITLE_DESC.map((item) =>
      canvas.getByRole("button", { name: new RegExp(String(item.title), "i") }),
    );
    const previous = canvas.getByRole("button", { name: "Previous slide" });
    const next = canvas.getByRole("button", { name: "Next slide" });

    const focusable = Array.from(canvasElement.querySelectorAll("button, a[href]"));
    await expect(focusable.slice(-2)).toEqual([previous, next]);

    // At rest there is nothing behind the first card, so the pair is
    // asymmetric: one disabled control and one live one.
    await waitFor(() => expect(next).toBeEnabled());
    await expect(previous).toBeDisabled();

    // The affordance the spec demands is operable from the keyboard, and the
    // pair stays in sync once the row has moved off its start.
    next.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(previous).toBeEnabled());
    next.blur();

    // One lap: each card is its own stop and shows a focus treatment there.
    await userEvent.tab();
    for (const card of cards) {
      await expect(document.activeElement).toBe(card);
      await expectVisiblyFocused(card);
      await userEvent.tab();
    }

    // The stop after the last card is one of the two affordances — which one
    // depends on whether tabbing scrolled the row to its end, so assert the
    // property that holds either way.
    const affordance = document.activeElement as HTMLElement;
    await expect(["Previous slide", "Next slide"]).toContain(affordance.textContent?.trim());
    await expectVisiblyFocused(affordance);
  },
};

/**
 * Descriptions dropped. Only `title` is required — `icon`, `thumbnail`,
 * `description` and `trailing` are all optional — so a "Start from scratch"
 * row of self-explanatory entry points is a card face with nothing on it but
 * a line of text.
 *
 * Two things are only visible here. The tap target does not shrink with the
 * content: the `EntityRow` button is `h-full flex-1` inside an `h-full` Card,
 * so it stays the whole card face rather than collapsing to the height of its
 * one line. And the row stays even — deliberately mixed here, one described
 * card among bare ones — even though `FeatureCard` overrides the `min-h-14`
 * that keeps `EntityRow` menus from going ragged with `min-h-0`. Nothing
 * inside the card reserves that height any more; the evenness comes entirely
 * from the carousel row's default `align-items: stretch`, which is a much
 * easier thing to remove by accident.
 */
export const EmptyLabel: Story = {
  args: {
    items: [
      { id: "blank", title: "Start from a blank timeline", onSelect: () => {} },
      {
        id: "record",
        title: "Record your screen",
        description: "Capture a window or the whole desktop, with system audio.",
        onSelect: () => {},
      },
      { id: "import", title: "Import from a link", onSelect: () => {} },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A card with no icon and no description is still named by its title.
    await expect(canvas.getByRole("button", { name: "Start from a blank timeline" })).toBeInTheDocument();

    const cards = canvasElement.querySelectorAll<HTMLElement>('[data-slot="feature-card-row-card"]');
    await expect(cards).toHaveLength(3);
    const heights = new Set(Array.from(cards).map((card) => Math.round(card.getBoundingClientRect().height)));
    await expect(heights.size).toBe(1);

    // …and the button fills the card it sits in, rather than the one text line.
    const firstCard = cards[0];
    const button = firstCard.querySelector<HTMLElement>('[data-slot="entity-row"]');
    await expect(button).toBeInTheDocument();
    await expect(Math.round(button?.getBoundingClientRect().height ?? 0)).toBe(
      Math.round(firstCard.getBoundingClientRect().height),
    );
  },
};

/**
 * An 88-character description on a fixed-width card. The answer is a single
 * line and an ellipsis: `EntityRow`'s title and description slots are both
 * `truncate`, and `CarouselItem` is `shrink-0 grow-0 basis-64` with `min-w-0`,
 * so the text can neither wrap nor widen its card.
 *
 * That is the sharp edge of D13's "cards are A9 turned on their side". The
 * `truncate` is right for a menu row, where horizontal space is all there is;
 * on a card face it throws away the vertical room the card exists to provide,
 * and a feature whose description is its only explanation ships with the
 * explanation cut off. A `line-clamp-2` on the card presentation is the
 * obvious repair, but it is a visual change to a shipped component rather
 * than a mechanical one, so this story records it instead of making it.
 *
 * The play function pins the half that survives that repair: however long the
 * text, the cards stay the same width. Letting a long card grow would break
 * the row's rhythm in a way clamping does not.
 */
export const LongContent: Story = {
  args: {
    items: [
      {
        id: "highlights",
        icon: <Sparkles className="size-4" aria-hidden />,
        title: "Turn a long recording into a highlight reel",
        description: "Finds the moments most likely to be quoted and cuts them into a reel you can post as-is.",
        onSelect: () => {},
      },
      {
        id: "trim",
        icon: <Scissors className="size-4" aria-hidden />,
        title: "Trim silences",
        description: "Cut dead air from a take.",
        onSelect: () => {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="feature-card-row-item"]');
    await expect(items).toHaveLength(2);
    const [long, short] = Array.from(items).map((item) => Math.round(item.getBoundingClientRect().width));
    await expect(long).toBe(short);
  },
};

/**
 * 375px, where the spec's own requirement — "horizontal scroll needs a
 * visible next affordance" — is the thing that breaks.
 *
 * `CarouselPrevious` and `CarouselNext` are absolutely positioned at
 * `-left-12` and `-right-12`: 3rem *outside* the row's own box. On a
 * full-bleed mobile surface that puts both arrows past the viewport edge, and
 * because the carousel viewport is `overflow-hidden` rather than a scroller,
 * there is no scrollbar and no trackpad-scroll fallback behind them — drag is
 * the only way left to advance, which is precisely the failure the arrows
 * were added to prevent. Note the story's own frame lies about this: the
 * file's `w-[36rem]` decorator still leaves room around the 375px wrapper, so
 * the arrows render here. A real 375px surface with no gutter clips them.
 *
 * What does survive is the peek. `basis-64` is 256px against 375px, so the
 * second card is cut off mid-face rather than hidden — the row at least says
 * it continues, which is more than `suggestion-chips` manages at this width
 * with its hidden scrollbar. Recorded, not fixed: the arrow placement lives
 * in the shared shadcn carousel, not in this component.
 */
export const Mobile: Story = {
  args: { items: ICON_TITLE_DESC },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <FeatureCardRow {...args} />
    </div>
  ),
};

/**
 * The three home-surface card patterns side by side. They are drawn from the
 * same parts and are not interchangeable; the rule is about **whose content
 * the card holds**:
 *
 * - **Feature card row** holds *the product's* capabilities. The list is
 *   authored, identical for every user, and a card is an entry point to work
 *   that does not exist yet. Nothing here has state: no recency, nothing to
 *   dismiss, nothing to come back to.
 * - **Recent grid** holds *the user's* artifacts. It is ordered by recency
 *   ("Edited 19 hours ago", never a timestamp), its thumbnails are the user's
 *   own output, and it needs a first-class empty state precisely because a new
 *   account has nothing to show.
 * - **Recommendation card** holds *one claim about this user, right now* —
 *   which is why it alone has to be auditable before you commit ("How it
 *   works", numbered, in a modal) and why it carries Save for later beside
 *   Dismiss. A menu item needs neither.
 *
 * The test, in order: if the same content ships to every user, it is a
 * feature card row. If it is the user's own work, it is a recent grid. If the
 * system is asserting that *this* one is right for you now, it is a
 * recommendation card — and it owes you the steps.
 */
export const Boundary: Story = {
  args: { items: ICON_TITLE_DESC.slice(0, 2) },
  render: (args) => (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Feature card row — what the product can do</p>
        <FeatureCardRow {...args} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recent grid — what the user already made</p>
        <RecentGrid
          items={[
            { id: "trailer", title: "Q3 Launch Trailer", durationLabel: "12:04", editedAgo: "Edited 19 hours ago" },
            { id: "explainer", title: "Brand Explainer", durationLabel: "3:41", editedAgo: "Edited 2 days ago" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recommendation card — what the system thinks you should do next</p>
        <RecommendationCard
          icon={<Sparkles aria-hidden />}
          title="Turn this week's takes into a highlight reel"
          description="Three recordings from this week are still unedited."
          apps={["Timeline", "Captions"]}
          steps={[
            "Pick the takes to include.",
            "Cut to the moments with speech and drop the silences.",
            "Add captions, then export a vertical version.",
          ]}
          onTry={() => {}}
          onSaveForLater={() => {}}
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
};
