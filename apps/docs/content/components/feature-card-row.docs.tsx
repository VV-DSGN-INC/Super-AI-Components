import type { ComponentDocs } from "@/lib/component-docs";
import {
  ClickableCards,
  ConsistentIconShape,
  MixedIconAndThumbnailShape,
  ScrollWithNoAffordance,
} from "./feature-card-row.examples";

/**
 * Seeded from docs/design-system/component-specs.md#c3-feature-card-row.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity
 * live in the ./feature-card-row.examples client sidecar and get
 * referenced here as zero-prop elements — see that file for why.
 */
export const FeatureCardRowDocs: ComponentDocs = {
  whatItIs:
    'A horizontally scrollable row of feature cards, used for both "Start from scratch" prompts and "Popular features" shortcuts. Each card is an entity-row\'s four slots — icon or thumbnail, title, description, trailing — turned on its side and stacked vertically into a card face, so the row and its menu-list cousins never drift apart in behavior.',
  whyItMatters:
    "It's the second thing a user sees on the home surface, right after the composer: a menu of what the product can do before they've typed anything. Descript, Zapier, CapCut and Spline all ship a version of this row, and all four solve the same tension — showing more options than fit on screen without hiding half of them behind a scrollbar nobody notices on a trackpad.",
  evidence: ["Descript", "Zapier", "CapCut", "Spline"],
  anatomy: [
    {
      slot: "feature-card-row",
      note: 'Root — the scrollable region (Carousel), announced to AT via role="region".',
    },
    {
      slot: "feature-card-row-item",
      note: "One card's slide wrapper; fixed width so cards don't reflow as the row scrolls.",
    },
    { slot: "feature-card-row-card", note: "The card surface (shadcn Card) each item renders inside." },
    {
      slot: "feature-card-row-thumbnail",
      note: "Full-bleed image at the top of a card, present only in the with-thumbnail state.",
    },
    {
      slot: "entity-row",
      note: "Composed, not rebuilt — the card's icon/title/description/trailing, stacked vertically instead of in a row.",
    },
    {
      slot: "feature-card-row-previous",
      note: 'The visible "scroll left" affordance the spec calls out — never optional chrome.',
    },
    {
      slot: "feature-card-row-next",
      note: 'The visible "scroll right" affordance; also what keeps the row reachable by keyboard.',
    },
  ],
  usage:
    'Reach for it on a home or empty-state surface when there are more actions or features than a single row can show without scrolling. Give every item in a row the same content shape — all icons or all thumbnails — pick icons for actions the user starts ("Start from scratch") and thumbnails for features that have a visual result worth previewing ("Popular features"). It is one component for both: the difference is entirely in the data you pass, not a variant prop.',
  dos: [
    {
      text: "Wire onSelect on every item so the whole card is the click target, not just a link buried in the description.",
      example: <ClickableCards />,
    },
    {
      text: "Keep one content shape per row — all icon cards, or all thumbnail cards — so the row reads as one grid instead of a jumble.",
      example: <ConsistentIconShape />,
    },
  ],
  donts: [
    {
      text: "Don't hand-roll a scrolling row with overflow-x-auto and no prev/next buttons — trackpad-only scroll hides half the content and nothing signals more cards exist.",
      example: <ScrollWithNoAffordance />,
    },
    {
      text: "Don't mix icon cards and thumbnail cards in the same row — pick one shape so the row doesn't look like two different components stitched together.",
      example: <MixedIconAndThumbnailShape />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop per card, plus Previous and Next — and only for cards that have `onSelect`. An item without one composes `entity-row`'s non-interactive shape, which is a `div`: not focusable, not activatable, and invisible to everything below.",
      "Left and Right scroll the row, but only while focus is already inside it. The handler is a capture listener on the region and the region itself is not focusable, so the arrows work from a card or from Previous/Next and nowhere else. Both keys are `preventDefault`ed, so nothing inside a card can use them for anything else.",
      "Previous and Next disable themselves at the ends of the row, which removes them from the tab order — the number of tab stops changes as the user scrolls.",
      "There is no way to disable a card. `entity-row` takes a `disabled` prop and this component never passes it, so an unavailable feature has to be left out of `items` rather than dimmed.",
    ],
    screenReader: [
      'Every card announces as a plain button. A9 `entity-row` renders `aria-pressed` only when the caller passes `selected`, and this row does not, so "Start from scratch" arrives as a button that opens something.',
      "A card's accessible name is its whole face read as one string — icon text, title, description and anything in `trailing`, concatenated. A card with a two-line description has a two-line name, which is the cost of making the whole card the target.",
      "The thumbnail is part of neither that name nor that target. It renders above `entity-row` and outside the button, so its `alt` is announced separately and clicking it does nothing — which is why a decorative-sounding alt costs more here than usual.",
      'The row announces as "carousel" through `aria-roledescription`, and each item as "slide", but neither has a name. The root is a `role="region"` with nothing labelling it, so it is a region that is never exposed as a landmark. Pass `aria-label` on `FeatureCardRow` to fix it — the component spreads your props onto that region.',
      'Previous and Next are named "Previous slide" and "Next slide" by visually-hidden text, and they are the only thing the row says about position. Nothing reports which card is on screen, or how many there are in total.',
      "Scrolling is silent. There is no live region anywhere, so pressing Next tells a listener that nothing changed.",
    ],
    focus: [
      "`entity-row` supplies a card's focus ring and the shadcn `Button` supplies Previous and Next's. The region and the slide wrappers have none, and neither ever takes focus.",
      "Tab can put focus on a card that is scrolled out of view: the carousel positions with a transform and does not advance to follow focus, so a keyboard user can be working on a card they cannot see.",
      "Pressing Next does not move focus to a newly revealed card. Focus stays on the button — right for repeated presses, and it means the cards themselves are only ever reached by Tab.",
    ],
  },
  pitfalls: [
    "Reaching for a plain overflow-x-auto div instead of the Carousel base — that reimplements the keyboard-reachable region and visible next affordance the spec requires, and axe's scrollable-region-focusable rule already caught this exact class of bug once in this repo.",
    "Setting both `icon` and `thumbnail` on the same item. Only the thumbnail renders (it sits above the entity-row and there's no icon slot left to fill) — pick one per item instead of relying on that precedence.",
    'Shipping a thumbnail with a decorative-sounding alt like "feature preview" — the image is the only visual difference from the icon state, so screen reader users need the alt text to actually describe what the feature produces.',
  ],
};
