import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookCover } from "@/registry/super-ai/book-cover";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { BookCoverDocs } from "@/content/components/book-cover.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof BookCover> = {
  title: "Super AI/Book Cover",
  component: BookCover,
  parameters: { layout: "centered", docs: { page: componentDocsPage(BookCoverDocs) } },
};

export default meta;
type Story = StoryObj<typeof BookCover>;

/**
 * Title and nothing else. The default, and the one to reach for first — the
 * face is small enough that every additional element competes with the only
 * thing on it that a screen reader can read.
 */
export const Plain: Story = {
  args: { title: "Brand guidelines", width: 160 },
};

/**
 * A category band above the title. Worth adding when covers sit together and
 * the titles alone do not group them; worth nothing on a cover shown by itself.
 */
export const Stripe: Story = {
  args: { title: "API reference", variant: "stripe", width: 160 },
};

/**
 * The illustration fills the face behind the title and is hidden from assistive
 * tech unconditionally — the component cannot tell a decorative picture from a
 * meaningful one, so it assumes decoration. With nothing passed, this variant
 * falls back to `plain` rather than rendering an empty well.
 */
export const Illustrated: Story = {
  args: {
    title: "Onboarding templates",
    variant: "illustrated",
    width: 160,
    illustration: <div className="size-full bg-muted" />,
  },
};

/**
 * The cloth-binding hairline, drawn from `--border` at 1px every 6px and
 * nothing else. It has no colour of its own, so it cannot drift from the
 * palette — and it is a binding cue, not emphasis. On every cover in a shelf it
 * stops being either.
 */
export const Textured: Story = {
  args: { title: "Style guide", tone: "muted", textured: true, width: 160 },
};

/**
 * The three surfaces, side by side. They exist to hold contrast against
 * whatever is behind the shelf — not to encode a taxonomy. Three tones cannot
 * carry a category system, and the first time a fourth kind of thing arrives
 * the mapping breaks for every reader who learned it.
 */
export const Tone: Story = {
  render: () => (
    <div className="flex items-start gap-4">
      <BookCover title="Brand guidelines" tone="paper" width={140} />
      <BookCover title="API reference" tone="ink" width={140} />
      <BookCover title="Field notes" tone="muted" width={140} />
    </div>
  ),
};

// —— Case stories ——————————————————————————————————————————————————————————
//
// case-skip: KeyboardOrder — nothing in the cover is focusable under any prop
//   combination, by design; the focus ring belongs to the wrapping link. The
//   zero-tab-stop property is pinned by assertion in book-cover.test.tsx.
// case-skip: Controlled — no value or selection API. Every prop is a static
//   description of the cover.
// case-skip: ReducedMotion — the component has no animation and no transition,
//   so there is no branch to document. A story would render identically to
//   Plain and imply coverage that does not exist.
// case-skip: EmptyLabel — `title` is required, not optional. The optional slots
//   (icon, illustration) are decorative and aria-hidden, so their absence
//   changes nothing about how the component is named or announced.

/**
 * Under `dir="rtl"` the binding moves to the right: the spine, the asymmetric
 * radius, the stripe and the title inset are all logical properties, so the
 * whole cover mirrors rather than keeping its spine stranded on the left.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex items-start gap-4">
      <BookCover title="دليل العلامة التجارية" variant="stripe" width={140} />
      <BookCover title="Brand guidelines" variant="stripe" tone="ink" width={140} />
    </div>
  ),
};

/**
 * Roughly 90 characters in a 3:4 face. The title wraps rather than truncating,
 * which is the deliberate choice — a truncated title on a cover names nothing —
 * but it also shows the failure mode: past about six lines the cover is only
 * text, and the caller should be shortening the title, not resizing the cover.
 */
export const LongContent: Story = {
  args: {
    title: "Everything you need to know before you start writing your first prompt for this workspace",
    width: 160,
  },
};

/**
 * At 375px a two-up shelf still fits with each cover near its small rung. The
 * `@container` is on the shelf, not on the cover, and that is the consumer's
 * job: the cover cannot be its own query container without losing the ability
 * to size itself to its own width. Drop the `@container` here and both covers
 * render at their base rung forever, with no error to tell you why.
 *
 * The widths resolve against the shelf, not the viewport (D19), so the same
 * pair inside a 300px sidebar on a wide screen resolves to exactly this.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <div className="@container flex items-start gap-3">
        <BookCover title="Brand guidelines" variant="stripe" width={{ sm: 150, md: 196 }} />
        <BookCover title="API reference" tone="ink" width={{ sm: 150, md: 196 }} />
      </div>
    </div>
  ),
};

/**
 * The near twin is `preview-tile`, and the choosing rule is about the promise,
 * not the shape. `preview-tile` shows a thing and can be selected — it is the
 * atom of a picker. `book-cover` shows a thing you open and read, is not
 * interactive, and contributes a heading to the page outline. If the user is
 * choosing among generated artifacts it is a tile; if they are choosing what to
 * read it is a cover.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <BookCover title="Brand guidelines" variant="stripe" width={160} />
      <PreviewTile aspect="portrait" label="Brand guidelines" className="w-40" />
    </div>
  ),
};
