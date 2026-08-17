import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { AnswerBlock } from "@/registry/super-ai/answer-block";
import { CitationRef } from "@/registry/super-ai/citation-ref";
import { SourceCards } from "@/registry/super-ai/source-cards";
import { CitationRefDocs } from "@/content/components/citation-ref.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

/**
 * Fixtures are real lines out of this repo's own design-system docs, which is
 * the corpus a docs assistant built on this registry would actually be
 * citing. Nothing here is an invented document or a fabricated metric.
 */
const CLAIM = "Every component ships with its story and its registry entry in the same commit.";
const SOURCE = "CLAUDE.md — Conventions";
const QUOTE = "Every component ships with its story and its registry entry in the same commit.";

const meta: Meta<typeof CitationRef> = {
  title: "Super AI/Citation Ref",
  component: CitationRef,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CitationRefDocs) } },
  render: (args) => (
    <p className="text-foreground max-w-prose text-sm">
      {CLAIM}
      <CitationRef {...args} />
    </p>
  ),
  args: { label: "1", source: SOURCE, quote: QUOTE },
};

export default meta;
type Story = StoryObj<typeof CitationRef>;

/**
 * The citation resolved to a chunk. The marker is a real button, and hovering
 * or focusing it opens a preview card carrying the quoted passage — not just
 * the document name, which is the whole argument for the component.
 */
export const Resolved: Story = {
  args: { state: "resolved" },
};

/**
 * The same resolved marker, wired to a source panel. `onJumpToSource` is
 * gated on `state === "resolved"` in the component, so this handler is
 * attached here and is absent in the two states below — the card and the
 * panel are meant to be two views of one chunk, and a marker that cannot
 * resolve has no chunk to scroll to.
 */
export const JumpToSource: Story = {
  args: { state: "resolved", onJumpToSource: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "1" }));
    await expect(args.onJumpToSource).toHaveBeenCalledTimes(1);
  },
};

/**
 * Retrieval has returned the reference but the chunk is still being fetched.
 * The marker pulses and renders bare — no preview card is mounted, because
 * there is no quote to put in one yet.
 */
export const Loading: Story = {
  args: { label: "2", state: "loading" },
};

/**
 * The source could not be resolved. The marker stays on the page, goes dashed
 * and destructive, and picks up an explicit accessible name
 * ("Citation 4 — source unavailable"). Removing it instead would leave a
 * confident sentence with nothing behind it, which is the failure this state
 * exists to prevent.
 */
export const Unresolved: Story = {
  args: { label: "4", state: "unresolved" },
};

/**
 * `disabled` is not a prop this component declares — it arrives through the
 * native button props it spreads. Worth a state of its own because the result
 * is not the one a caller expects: the preview card is still mounted, but
 * browsers do not dispatch hover events on a disabled button, so the quote
 * becomes unreachable rather than merely inactive. Prefer a non-interactive
 * rendering to disabling a citation.
 */
export const Disabled: Story = {
  args: { state: "resolved", disabled: true },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — no value/onChange pair exists; `state` is a rendering input, not a held value
 * `state` is chosen by the caller from retrieval status and the component
 * never proposes a change to it: there is no `onStateChange`, and no
 * interaction on the marker can move it. `onJumpToSource` notifies a panel to
 * scroll, it does not report a new value to apply. With nothing for a parent
 * to hold, the convention's three assertions (interaction does not move the
 * value, the callback carries the payload, re-render with an unchanged value
 * holds) have no subject.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two placements are load-bearing and both are currently
 * wrong, which is the reason this story is worth its place:
 *
 * - the marker sets `ml-0.5`, a physical margin, so in RTL the gap lands
 *   between the marker and the next word instead of between the claim and
 *   the marker;
 * - the card's blockquote sets `border-l-2 pl-2`, so the quote rule stays on
 *   the visual left rather than flipping to the reading edge.
 *
 * The logical-property equivalents (`ms-0.5`, `border-s-2 ps-2`) are
 * identical in LTR, so this is a safe correction — it is left unmade here
 * because the retrofit brief scopes component edits to the two sanctioned
 * mechanical idioms. Recorded rather than asserted: no assertion below
 * pretends the mirroring works.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="max-w-prose">
      <p className="text-foreground text-sm">
        {CLAIM}
        <CitationRef {...args} />
      </p>
    </div>
  ),
  args: { state: "resolved" },
};

/**
 * The marker is the one animated thing here: `loading` carries
 * `animate-pulse motion-reduce:animate-none`, so it genuinely branches on the
 * media feature rather than merely animating. Because `vitest.config.ts` sets
 * Playwright's `reducedMotion: "reduce"` for every test, the pulse is
 * suppressed in the run that gates — this story is the suppressed rendering,
 * and it differs from `Loading` only under that emulation.
 *
 * The preview card's own mount transition (`data-open:animate-in`,
 * `fade-in-0`, `zoom-in-95`) comes from the shared hover-card primitive and
 * carries no reduced-motion branch, but that file is outside this
 * component's registry entry.
 */
export const ReducedMotion: Story = {
  args: { label: "2", state: "loading" },
};

/**
 * Three markers in one sentence, one per state. The contract being pinned is
 * that every stop shows a visible focus treatment — the marker sets
 * `focus-visible:ring-2`, and at 10px superscript that ring is the only thing
 * separating a focused citation from an unfocused one.
 *
 * The loop is bounded by the marker count rather than walking until focus
 * leaves the canvas: a resolved marker is a preview-card trigger whose popup
 * portals to `document.body`, outside `canvasElement`, so a
 * `contains(activeElement)` condition would be asking the wrong tree.
 *
 * Recorded, not asserted: all three markers are tab stops, but only
 * `resolved` does anything on activation. A keyboard user reaches the
 * `loading` marker and finds a button that neither acts nor announces why —
 * it carries no `aria-disabled` and no name change, unlike `unresolved`,
 * which at least says "source unavailable". Pinning that with a passing
 * assertion would freeze it, so it stays here in prose.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <p className="text-foreground max-w-prose text-sm">
      {CLAIM}
      <CitationRef label="1" state="resolved" source={SOURCE} quote={QUOTE} onJumpToSource={() => {}} />
      {" The token gate rejects a muted foreground on a muted surface."}
      <CitationRef label="2" state="loading" />
      {" A third reference is still being looked up."}
      <CitationRef label="4" state="unresolved" />
    </p>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const markers = canvas.getAllByRole("button");
    await expect(markers).toHaveLength(3);

    for (const marker of markers) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(marker);
      await expect(marker.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(marker);
    }
  },
};

/**
 * Both card slots are optional, and a `resolved` marker always builds a card
 * — so a citation passed neither `source` nor `quote` opens an empty popup
 * over the claim. That is the no-label failure for this component: not an
 * unnamed control, but an affordance that promises evidence and delivers a
 * blank box.
 *
 * The play function opens the card and asserts it mounted; it deliberately
 * does not assert the emptiness, because that would pin the defect. The fix
 * belongs at the call site (pass a quote) and is written up as the second
 * "don't" on the docs page.
 */
export const EmptyLabel: Story = {
  render: () => (
    <p className="text-foreground max-w-prose text-sm">
      {CLAIM}
      <CitationRef label="1" state="resolved" />
    </p>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "1" }));
    await waitFor(
      () => {
        expect(document.querySelector('[data-slot="hover-card-content"]')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * A ~90-character quoted chunk, which is an ordinary length for a retrieved
 * passage rather than an edge case. The card wraps it: width is fixed by the
 * preview-card primitive at `w-64`, so a long quote grows the card downward
 * and never sideways. The `max-w-sm` this component sets is inert for the
 * same reason — 24rem can never bind under a fixed 16rem.
 */
export const LongContent: Story = {
  render: () => (
    <p className="text-foreground max-w-prose text-sm">
      {"The token gate rejects a muted foreground on a muted surface."}
      <CitationRef
        label="2"
        state="resolved"
        source="a11y-baseline.md — Contrast"
        quote="Never pair text-muted-foreground with bg-muted, bg-accent or bg-secondary: they share a lightness in this token set and land at 4.34:1."
      />
    </p>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "2" }));
    await waitFor(
      () => {
        expect(document.querySelector('[data-slot="citation-ref-quote"]')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * 375px. The marker is inline and superscript, so the constraint it has to
 * survive is not its own width but the claim wrapping around it — a citation
 * must not be what pushes a paragraph into horizontal scroll. Three markers
 * in one wrapped paragraph is the realistic density.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <p className="text-foreground text-sm">
        {CLAIM}
        <CitationRef label="1" state="resolved" source={SOURCE} quote={QUOTE} />
        {" The token gate rejects a muted foreground on a muted surface."}
        <CitationRef
          label="2"
          state="resolved"
          source="a11y-baseline.md — Contrast"
          quote="Never pair text-muted-foreground with bg-muted, bg-accent or bg-secondary."
        />
        {" A third reference could not be resolved."}
        <CitationRef label="4" state="unresolved" />
      </p>
    </div>
  ),
};

/**
 * The three ways this catalog shows sourcing, at their three different
 * scales. They are routinely confused because all three are "the citations
 * bit", and the rule is about what the reader is trying to do:
 *
 * - **Citation ref** attaches one claim to one chunk. Reach for it when the
 *   question is *where did this sentence come from*. It is inline, and it
 *   belongs inside the sentence.
 * - **Answer block** owns a whole answer: it places a citation ref per claim
 *   and reports coverage across them, including the claims with no marker at
 *   all. Reach for it when the question is *how much of this is sourced*.
 * - **Source cards** is the retrieved set behind the answer, with the used
 *   and merely-retrieved entries kept distinguishable. Reach for it when the
 *   question is *what did it look at, and what did it ignore*.
 *
 * If you find yourself rendering a row of citation refs detached from any
 * sentence, you want answer block. If you are listing documents rather than
 * passages, you want source cards.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Citation ref — one claim, one chunk</p>
        <p className="text-foreground text-sm">
          {CLAIM}
          <CitationRef label="1" state="resolved" source={SOURCE} quote={QUOTE} />
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Answer block — coverage across claims</p>
        <AnswerBlock
          claims={[
            {
              id: "claim-registry",
              text: CLAIM,
              citations: [{ id: "cite-1", label: "1", source: SOURCE, quote: QUOTE }],
            },
            {
              id: "claim-waves",
              text: "Components are grouped into families and shipped in waves.",
            },
          ]}
          retrievedUnused={2}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Source cards — what retrieval returned</p>
        <SourceCards
          sources={[
            {
              id: "src-claude-md",
              title: "CLAUDE.md",
              snippet: "Every component ships with its story and its registry entry in the same commit.",
              relevance: "high",
              used: true,
            },
            {
              id: "src-a11y",
              title: "a11y-baseline.md",
              snippet: "The measured accessibility posture and the recurring contrast failure.",
              relevance: "medium",
              used: false,
            },
          ]}
        />
      </section>
    </div>
  ),
};
