import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CitationRef } from "@/registry/super-ai/citation-ref";
import { ContextChip, ContextChips } from "@/registry/super-ai/context-chips";
import { QuoteReply } from "@/registry/super-ai/quote-reply";
import { QuoteReplyDocs } from "@/content/components/quote-reply.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures for the case stories are lines out of this repo's own
 * design-system docs — the corpus an assistant built on this registry would
 * actually be quoting back at someone. Nothing here is an invented document.
 */
const LONG_EXCERPT =
  "the consumer test, the a11y gate and the token gate are the three that protect people downstream";
const SHORT_EXCERPT = "A component without a registry entry is invisible to consumers.";

const meta: Meta<typeof QuoteReply> = {
  title: "Super AI/Quote Reply",
  component: QuoteReply,
  parameters: { layout: "centered", docs: { page: componentDocsPage(QuoteReplyDocs) } },
};

export default meta;
type Story = StoryObj<typeof QuoteReply>;

/**
 * The base case, and the anatomy the other three reuse unchanged: a glyph
 * naming the source, the selected text, and a `<cite>` line carrying where it
 * came from. The two values are deliberately independent — `excerpt` is what
 * was selected, `¶4` is where it lives — and only the anchor has to keep
 * resolving once someone edits the paragraph underneath it. The excerpt is
 * the part with a limit on it (`line-clamp-2`); the anchor has none.
 */
export const TextRange: Story = {
  args: {
    source: "text-range",
    excerpt: "the negative prompt should stay in sync with the reference strip",
    anchor: "¶4",
    onRemove: () => {},
  },
};

/**
 * The one state whose excerpt is not rendered as text. With a `thumbnail`,
 * the quote routes through `preview-tile` and `excerpt` becomes the tile's
 * below-placed caption — so it still has to read as prose describing the
 * crop, not as an alt string. The branch is on `thumbnail`, not on `source`:
 * drop it and this exact state falls back to the same text rendering the
 * other three use, which is what a real composer shows in the moment between
 * the selection being made and the crop arriving.
 */
export const ImageRegion: Story = {
  args: {
    source: "image-region",
    excerpt: "the torn edge of the poster",
    anchor: "212,88 · 160×120",
    thumbnail: <div className="bg-accent size-full" aria-hidden />,
    onRemove: () => {},
  },
};

/**
 * A spreadsheet cell, and the source where the excerpt on its own means
 * nothing — a number says neither which column it came from nor which row.
 * All of the meaning is in the anchor here, which is why the docs page's
 * "don't hand it a vague anchor" bites hardest in this state: `here` next to
 * a bare figure leaves a quote that cannot be checked or re-found.
 */
export const TableCell: Story = {
  args: {
    source: "table-cell",
    excerpt: "$42,300",
    anchor: "Q3 Budget!C12",
    onRemove: () => {},
  },
};

/**
 * A line quoted out of a recording, and the clearest demonstration of why the
 * anchor is a position rather than a snapshot: re-run the transcription and
 * the excerpt wording changes while `0:42–0:51` still points at the same nine
 * seconds. This is also the state where the excerpt is least self-describing
 * out of context — a transcript fragment reads as a sentence starting
 * mid-thought, so the anchor is what tells a reader it came from audio.
 */
export const TimelineRange: Story = {
  args: {
    source: "timeline-range",
    excerpt: "so that's the part we want to cut",
    anchor: "0:42–0:51",
    onRemove: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the three that are missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in this component moves, and the two things nearby that can are not its branch
 * `quote-reply.tsx` carries no `animate-*` and no `transition-*` class at
 * all; the whole component is a static flex row. Two things in the composed
 * tree can move and neither is a branch this component owns: the shared
 * `Button` primitive carries `transition-all` plus a one-pixel `active:`
 * nudge, which is library-wide press chrome living outside
 * `registry/super-ai/`, and `preview-tile`'s `animate-pulse` skeleton is
 * reached only through `state="loading"`, which `QuoteReply` never sets — it
 * renders the tile at its default state. Since `vitest.config.ts` already
 * forces `reducedMotion: "reduce"` on every test, a ReducedMotion story here
 * would render pixel-identical to `TextRange` and imply a branch that does
 * not exist.
 *
 * // case-skip: Controlled — nothing here is a held value; `onRemove` reports an intent and carries no payload
 * There is no `value`/`onChange` pair or equivalent. `source`, `excerpt` and
 * `anchor` are rendering inputs the caller owns outright, the component holds
 * no state of its own (there is no `useState` anywhere in the file), and
 * `onRemove` is `() => void` — it asks for a removal without a payload,
 * because the caller already knows which quote it mounted. The spec's
 * structural guarantee points the same way: D5 renders **no input element**,
 * so "quotes are removable without clearing the typed message" holds by the
 * quote holding none of that state. With nothing for a parent to hold, the
 * convention's three assertions have no subject.
 *
 * // case-skip: EmptyLabel — the only optional text slot is `removeLabel`, and it is defaulted
 * `excerpt` and `anchor` are both required. `removeLabel` is optional but
 * defaults to "Remove quote", so the icon-only dismiss control is never
 * unnamed; forcing the empty case with `removeLabel=""` would ship an axe
 * `button-name` violation into a gate that runs at `test: "error"`, which is
 * the same reason `suggestion-chips` records for its own skip. The one
 * genuinely optional slot is `thumbnail`, which is a node rather than text
 * and whose absence is a documented fallback to the text branch rather than
 * an unlabelled control — `ImageRegion`'s description carries that fact.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Three things have to mirror together: the source glyph leads
 * the row, the dismiss control trails it, and the `<cite>` anchor sits under
 * the excerpt. They do, and the reason is worth recording — `quote-reply.tsx`
 * uses no physical inline utility anywhere (no `pl-`, `ml-`, `border-l`,
 * `text-left`); the row is `flex … gap-2` and the excerpt is `min-w-0 flex-1`,
 * all of which flip on their own. There is nothing here for the
 * logical-property sweep in `CONTINUE.md` §8 to swap. The composed
 * `preview-tile` reaches none of its own physical classes from here either,
 * because `QuoteReply` never passes `badge` and pins the label to `below`
 * rather than `overlay`.
 *
 * What the story does show is the bidi limit of the anchor line. `<cite>`
 * renders `{label} · {anchor}`, and both halves are Latin here, so the
 * neutral separator resolves to the surrounding strong direction and the line
 * keeps source order — it simply sits flush to the right edge. `anchor` is a
 * caller-supplied `ReactNode` interpolated with no `<bdi>` isolation around
 * it, so a mixed-script anchor reorders around that separator and the
 * component has no say in it.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex flex-col gap-2">
      <QuoteReply
        source="text-range"
        excerpt={SHORT_EXCERPT}
        anchor="CONTINUE.md · ¶3.2"
        onRemove={() => {}}
      />
      <QuoteReply
        source="image-region"
        excerpt="the torn edge of the poster"
        anchor="212,88 · 160×120"
        thumbnail={<div className="bg-accent size-full" aria-hidden />}
        onRemove={() => {}}
      />
    </div>
  ),
};

/**
 * Two quotes stacked above one composer, which is the situation that makes
 * the tab order worth documenting at all. Each quote contributes exactly one
 * stop — the dismiss control — because the excerpt, the glyph and the
 * `<cite>` anchor are static text, and an `image-region` thumbnail is a
 * `preview-tile` with no `onSelect`, so its frame stays a `<div>` and never
 * enters the sequence. Drop `onRemove` and a quote contributes no stop at all.
 *
 * The story passes a distinct `removeLabel` per quote on purpose. The prop
 * defaults to "Remove quote" on every instance, so a stack left at the
 * default hands a keyboard user two identical stops with nothing saying which
 * quote each one drops.
 *
 * **Where focus returns is the gap, and this story does not pin it.** The
 * dismiss control is the only focusable element a quote owns, so removing one
 * unmounts the focused element and focus falls to `<body>`, making the next
 * Tab restart from the top of the page. Restoring it is a focus-management
 * decision whose right destination — the composer's input — lives outside
 * this component, so it is recorded in the docs page's focus notes and left
 * unasserted here rather than asserted green against the wrong behaviour.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <QuoteReply
        source="text-range"
        excerpt={SHORT_EXCERPT}
        anchor="CONTINUE.md · ¶3.2"
        removeLabel="Remove the quoted text range"
        onRemove={() => {}}
      />
      <QuoteReply
        source="timeline-range"
        excerpt="so that's the part we want to cut"
        anchor="0:42–0:51"
        removeLabel="Remove the quoted timeline range"
        onRemove={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Two quotes, two stops. Everything else a quote renders is static text.
    const stops = canvas.getAllByRole("button");
    await expect(stops).toHaveLength(2);
    await expect(canvasElement.querySelectorAll("button, a[href], [tabindex]")).toHaveLength(2);

    // The spec's structural guarantee for D5: it renders no input element, so
    // a composer's typed draft can never sit inside a quote's subtree and
    // cannot be cleared by removing one.
    await expect(canvasElement.querySelectorAll("input, textarea")).toHaveLength(0);

    // DOM order is tab order here — nothing in the tree sets tabindex.
    for (const expected of stops) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      // Every stop is visibly focused, not merely focusable.
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }

    // Stops here deliberately. Clicking either control unmounts the element
    // that had focus and nothing restores it — see the description.
  },
};

/**
 * A ~95-character excerpt, and the point is that the component gives it two
 * different answers depending on the branch. The text branch clamps:
 * `line-clamp-2` cuts the sentence mid-word at two lines, which is what the
 * docs page's first don't is about. The image branch does not clamp — the
 * excerpt becomes `preview-tile`'s below-placed label, which is `truncate`,
 * so the same string gets one line and an ellipsis inside a `w-20` tile and
 * loses far more of itself than the text branch does.
 *
 * The third quote shows the slot with no limit on it. `<cite>` carries
 * neither `line-clamp` nor `truncate`, so a long anchor wraps and grows the
 * block instead of being cut. That asymmetry is deliberate rather than an
 * oversight: the anchor is the half that has to stay resolvable, so it is the
 * one thing the component will not truncate.
 *
 * All three clips are visual only. The whole string stays in the accessible
 * text, so a screen-reader user hears the full sentence where a sighted user
 * sees two lines and an ellipsis.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <QuoteReply source="text-range" excerpt={LONG_EXCERPT} anchor="¶4" onRemove={() => {}} />
      <QuoteReply
        source="image-region"
        excerpt={LONG_EXCERPT}
        anchor="212,88 · 160×120"
        thumbnail={<div className="bg-accent size-full" aria-hidden />}
        onRemove={() => {}}
      />
      <QuoteReply
        source="text-range"
        excerpt={SHORT_EXCERPT}
        anchor="docs/CONTINUE.md · §3.2 · ¶4 · characters 118–204"
        onRemove={() => {}}
      />
    </div>
  ),
};

/**
 * 375px. The root is `w-full max-w-sm`, so below 384px the cap stops applying
 * and the quote simply fills the viewport — there is no narrow-width layout
 * branch to see, which is the useful finding.
 *
 * What is load-bearing at this width is `min-w-0` on the `<blockquote>`. A
 * flex child defaults to `min-width: auto`, so without it the excerpt's
 * intrinsic width would win over the row and an unbroken token — a filename
 * in the anchor, say — would push the whole quote wider than its parent and
 * scroll the page sideways. The dismiss control is `size-6`, 24px square:
 * exactly the WCAG 2.2 minimum target size with nothing to spare, and
 * `shrink-0` so a cramped row never squeezes it below that.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-2">
      <QuoteReply
        source="text-range"
        excerpt={LONG_EXCERPT}
        anchor="component-build-brief.md · ¶Story"
        onRemove={() => {}}
      />
      <QuoteReply
        source="image-region"
        excerpt="the torn edge of the poster"
        anchor="212,88 · 160×120"
        thumbnail={<div className="bg-accent size-full" aria-hidden />}
        onRemove={() => {}}
      />
    </div>
  ),
};

/**
 * Three ways of pointing at a source, and they are chosen by two questions:
 * who put the pointer there, and does it show the content or only name it.
 *
 * - **Quote reply** — the user selected a *range inside* a source and is
 *   answering that range. It shows the content itself plus a stable anchor,
 *   sits beside the composer, and removing it leaves the typed draft alone.
 * - **Context chips** — the user attached a whole *resource*. A chip names
 *   the reference and never shows any of it, and it carries a resolution
 *   status because the target can move out from under it.
 * - **Citation ref** — the model's own pointer, inside generated output. It
 *   runs the other way: from an answer back to where the claim came from.
 *
 * So: if it shows an excerpt of the thing, it is a quote. If it only names
 * the thing, it is a chip. If the model put it there rather than the user, it
 * is a citation. A chip that grew an excerpt has become a quote reply, and a
 * quote reply that lost its excerpt has become a context chip with extra
 * padding.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Quote reply — a range inside a source, shown</p>
        <QuoteReply
          source="text-range"
          excerpt={SHORT_EXCERPT}
          anchor="CONTINUE.md · ¶3.2"
          onRemove={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Context chips — a whole reference, named</p>
        <ContextChips>
          <ContextChip kind="file" label="CONTINUE.md" onRemove={() => {}} />
          <ContextChip kind="selection" label="Lines 40–58" onRemove={() => {}} />
        </ContextChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Citation ref — the model pointing back out</p>
        <p className="text-foreground text-sm">
          {SHORT_EXCERPT}
          <CitationRef label="1" source="CLAUDE.md — Conventions" quote={SHORT_EXCERPT} />
        </p>
      </section>
    </div>
  ),
};
