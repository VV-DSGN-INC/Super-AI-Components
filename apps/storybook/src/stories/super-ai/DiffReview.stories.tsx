import type { Meta, StoryObj } from "@storybook/react-vite";

import { DiffReview, type DiffParagraph } from "@/registry/super-ai/diff-review";
import { DiffReviewDocs } from "@/content/components/diff-review.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const paragraphs: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "Teams can now " },
      { kind: "deleted", text: "utilise", changeId: "c1" },
      { kind: "inserted", text: "use", changeId: "c1" },
      { kind: "unchanged", text: " the export API to pull their own usage data" },
      { kind: "inserted", text: ", starting Monday", changeId: "c2" },
      { kind: "unchanged", text: "." },
    ],
  },
  {
    id: "p2",
    segments: [
      { kind: "unchanged", text: "It is " },
      { kind: "deleted", text: "very ", changeId: "c3" },
      { kind: "unchanged", text: "fast, and rate limits are documented " },
      { kind: "deleted", text: "in the appendix", changeId: "c4" },
      { kind: "inserted", text: "on the pricing page", changeId: "c4" },
      { kind: "unchanged", text: "." },
    ],
  },
];

const changes = [
  { id: "c1", rationale: "Plain English. Release notes are read in a hurry." },
  { id: "c2", rationale: "The launch date was missing, so every reader had to go and ask for it." },
  { id: "c3", rationale: "Intensifiers weaken a claim we can back with a number instead." },
  { id: "c4", rationale: "The appendix was retired last quarter; this link would have broken." },
];

const meta: Meta<typeof DiffReview> = {
  title: "Super AI/Diff Review",
  component: DiffReview,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DiffReviewDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Changelog entry",
    paragraphs,
    changes,
  },
};

export default meta;
type Story = StoryObj<typeof DiffReview>;

/**
 * The diff itself: a run of segments inside the paragraph, marked at word
 * level. Insertions and deletions are `ins`/`del` elements distinguished by
 * decoration shape, not hue, and each carries visually-hidden text naming it.
 * Read-only here — no handlers, so no verbs — and the reasons still show.
 */
export const WordLevel: Story = {};

/** One accept and one reject per change, each named for the change it resolves. */
export const PerChangeVerbs: Story = {
  args: {
    onAccept: () => {},
    onReject: () => {},
    changes: [
      changes[0],
      { ...changes[1], status: "accepted" as const },
      changes[2],
      { ...changes[3], status: "rejected" as const },
    ],
  },
};

/**
 * Accept-all and reject-all, in their own region below a separator and outside
 * the change list — a stray click near one change cannot resolve the document.
 */
export const BulkVerbs: Story = {
  args: {
    onAccept: () => {},
    onReject: () => {},
    onAcceptAll: () => {},
    onRejectAll: () => {},
  },
};
