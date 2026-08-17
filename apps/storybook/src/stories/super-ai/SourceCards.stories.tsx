import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { AnswerBlock } from "@/registry/super-ai/answer-block";
import { CitationRef } from "@/registry/super-ai/citation-ref";
import { SourceCards, type RetrievedSource } from "@/registry/super-ai/source-cards";
import { SourceCardsDocs } from "@/content/components/source-cards.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof SourceCards> = {
  title: "Super AI/Source Cards",
  component: SourceCards,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SourceCardsDocs) } },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SourceCards>;

/**
 * One retrieval against an internal knowledge base, reused across the stories
 * below so the difference between them is the state and nothing else.
 */
const RETRIEVED: RetrievedSource[] = [
  {
    id: "access-review",
    title: "Access review — quarterly key rotation",
    snippet:
      "Service accounts rotate credentials every 90 days. Owners are notified 14 days before expiry, and again at 3 days.",
  },
  {
    id: "staging-access",
    title: "Engineering onboarding: staging access",
    snippet:
      "Request staging access through the platform portal. Approval is automatic for members of the engineering group.",
  },
  {
    id: "retention-v4",
    title: "Data retention policy v4",
    snippet:
      "Customer records are retained for 24 months after account closure, after which they are purged on the nightly job.",
  },
];

export const Ranked: Story = {
  args: {
    sources: RETRIEVED.map((s) => ({ ...s, used: true })),
  },
};

export const RelevanceBanded: Story = {
  args: {
    sources: [
      { ...RETRIEVED[0], used: true, relevance: "high" },
      { ...RETRIEVED[1], used: true, relevance: "medium" },
      { ...RETRIEVED[2], used: true, relevance: "low" },
    ],
  },
};

/**
 * The state the spec calls the whole component. It is also where this pass
 * found a real contrast failure: `opacity-60` on an unused card dims its
 * descendants, and axe measured the already-muted snippet and relevance band
 * at 2.29:1 against a 4.5:1 floor. Fixed in the component by rebinding
 * `--muted-foreground` on the dimmed card — the cross-component shape that
 * `check:tokens` is documented as unable to see, caught here.
 */
export const UsedAndUnused: Story = {
  args: {
    // Passed unused-first on purpose: the component sorts cited sources to the
    // top, so the render order below is not this order.
    sources: [
      { ...RETRIEVED[2], used: false, relevance: "low" },
      { ...RETRIEVED[0], used: true, relevance: "high" },
      { ...RETRIEVED[1], used: true, relevance: "medium" },
    ],
  },
};

export const PermissionFiltered: Story = {
  args: {
    sources: [
      { ...RETRIEVED[0], used: true, relevance: "high" },
      { ...RETRIEVED[1], used: false, relevance: "medium" },
    ],
    permissionFilteredCount: 3,
  },
};

export const EmptySearched: Story = {
  args: { sources: [], hasRun: true },
};

export const NotYetRun: Story = {
  args: { sources: [], hasRun: false },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The card, the badges and the permission line are static; there is no
 * transition, transform or keyframe anywhere in `source-cards.tsx` to
 * suppress. The one animated thing in this neighbourhood is `citation-ref`'s
 * `animate-pulse` loading marker, which already pairs it with
 * `motion-reduce:animate-none` and belongs to that component's stories.
 *
 * // case-skip: Controlled — onOpen opens a document, there is no value to hold
 * `SourceCardsProps` exposes no `value`/`onChange` pair and no selection of
 * any kind. `onOpen` is a per-source action that navigates elsewhere; the
 * component keeps no state a parent could drive, and the one thing it derives
 * — the used-first ordering — is computed from `sources` on every render.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in three places: the leading file
 * icon and the rank number must precede the title from the right, the badge
 * row must start at the right edge, and the permission line's `EyeOff` icon
 * must sit to the right of its sentence.
 *
 * One thing this story does not fix, and should not be read as blessing: the
 * title button carries the physical class `text-left` rather than the logical
 * `text-start`. It is invisible here because the button is content-width, so
 * there is no spare box for the alignment to act in — but it is the wrong
 * class, and a future change that stretches the button would surface it as an
 * RTL bug. Recorded rather than fixed, since this pass is stories and docs.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <SourceCards {...args} />
    </div>
  ),
  args: {
    sources: [
      { ...RETRIEVED[0], used: true, relevance: "high" },
      { ...RETRIEVED[2], used: false, relevance: "low" },
    ],
    permissionFilteredCount: 2,
  },
};

/**
 * Tab traversal across the list. The load-bearing fact is that tab order is
 * the *sorted* order, not the order the caller passed: the unused source
 * below is first in `sources` and last under the cursor, because the
 * component moves cited sources to the front before rendering. A caller
 * reasoning about keyboard order from their own array would get it wrong.
 *
 * The ring walk is bounded by the known stop count rather than looping until
 * focus escapes. This list neither traps nor cycles focus today, so an
 * unbounded walk would terminate — but it would also spin forever if a later
 * change introduced a cycle, and a hanging test is a worse failure than a
 * red one.
 */
export const KeyboardOrder: Story = {
  args: {
    sources: [
      { ...RETRIEVED[2], used: false, relevance: "low", onOpen: () => {} },
      { ...RETRIEVED[0], used: true, relevance: "high", onOpen: () => {} },
      { ...RETRIEVED[1], used: true, relevance: "medium", onOpen: () => {} },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A title is a button only where `onOpen` was passed; all three were.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(3);

    // Cited first, in the order they were given; the unused one falls to the
    // end despite leading the input array.
    await expect(buttons[0]).toBe(
      canvas.getByRole("button", { name: "Access review — quarterly key rotation" }),
    );
    await expect(buttons[2]).toBe(canvas.getByRole("button", { name: "Data retention policy v4" }));

    // Every stop is reached in DOM order and is visibly focused there.
    for (const expected of buttons) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(focused);
    }
  },
};

/**
 * Every optional text slot emptied: no `snippet`, no `relevance`. What is
 * left is the rank, the title and the used/unused badge — and that is the
 * floor this component has to stay readable at, because a retriever that
 * returns titles without extractable passages is the common case, not the
 * degenerate one.
 *
 * Distinct from `EmptySearched` above, which is the list itself having
 * nothing in it. This is a full list whose optional slots are blank.
 */
export const EmptyLabel: Story = {
  args: {
    sources: [
      { id: RETRIEVED[0].id, title: RETRIEVED[0].title, used: true },
      { id: RETRIEVED[2].id, title: RETRIEVED[2].title, used: false },
    ],
  },
};

/**
 * A ~90-character title against a long snippet, which is where the component
 * makes two different decisions in the same card: the title is `truncate`,
 * so it ends in a single-line ellipsis, while the snippet is `line-clamp-2`
 * and ends after two. Neither has a tooltip or an expander, so the tail of a
 * long title is simply unavailable — the reason the docs page asks for titles
 * that identify themselves in their first few words.
 */
export const LongContent: Story = {
  args: {
    sources: [
      {
        id: "checkout-postmortem",
        title: "Incident postmortem — checkout latency regression following the March payments migration",
        snippet:
          "p99 latency rose from 240ms to 3.1s for 41 minutes. The migration doubled write amplification on the orders table, and the connection pool saturated before the autoscaler reacted.",
        used: true,
        relevance: "high",
      },
      { ...RETRIEVED[1], used: false, relevance: "low" },
    ],
  },
};

/**
 * 375px. The card survives the width because the text column is `min-w-0
 * flex-1` — without that the truncating title would push the card wider than
 * the viewport instead of shortening. The badge row is the part that actually
 * changes here: `flex-wrap` drops "Strong match" below "Cited" rather than
 * squeezing them, and the permission line keeps its icon on the sentence's
 * first line.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SourceCards {...args} />
    </div>
  ),
  args: {
    sources: [
      { ...RETRIEVED[0], used: true, relevance: "high" },
      { ...RETRIEVED[2], used: false, relevance: "low" },
    ],
    permissionFilteredCount: 3,
  },
};

/**
 * The three ways this catalog renders a source, side by side. They are not
 * interchangeable, and the rule is about *what is being shown*:
 *
 * - **Citation ref (K6)** is a marker inside a sentence. It points from one
 *   claim to one source, and its job is to be verifiable without leaving the
 *   line you are reading.
 * - **Answer block (K7)** is the answer itself, with citations attached to
 *   individual claims and a coverage judgment over the whole. It shows how
 *   well the answer is sourced.
 * - **Source cards (K8)** is the retrieval, not the answer. It is the only
 *   one of the three that can show a negative — a document that was found and
 *   not used, or a document withheld for permissions.
 *
 * So: reaching into prose, use K6. Describing how well an answer is sourced,
 * use K7. Showing what the search returned, including what it discarded, use
 * K8. If your list can never display a source the answer did not cite, you
 * probably want K7's coverage line instead of this component.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Citation ref — points from one claim</p>
        <p className="text-sm">
          Credentials for service accounts rotate on a 90-day cycle
          <CitationRef
            label="1"
            source="Access review — quarterly key rotation"
            quote="Service accounts rotate credentials every 90 days."
          />
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Answer block — how well the answer is sourced</p>
        <AnswerBlock
          claims={[
            {
              id: "rotation",
              text: "Service account credentials rotate every 90 days.",
              citations: [
                {
                  id: "c1",
                  label: "1",
                  source: "Access review — quarterly key rotation",
                  quote: "Service accounts rotate credentials every 90 days.",
                },
              ],
            },
            { id: "owners", text: "Owners are notified before expiry." },
          ]}
          retrievedUnused={1}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Source cards — what retrieval returned</p>
        <SourceCards
          sources={[
            { ...RETRIEVED[0], used: true, relevance: "high" },
            { ...RETRIEVED[2], used: false, relevance: "low" },
          ]}
          permissionFilteredCount={1}
        />
      </section>
    </div>
  ),
};
