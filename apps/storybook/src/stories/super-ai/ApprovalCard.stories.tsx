import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { ApprovalCardDocs } from "@/content/components/approval-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ApprovalCard> = {
  title: "Super AI/Approval Card",
  component: ApprovalCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ApprovalCardDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Send the Q3 summary to the team",
    summary: "Three paragraphs drafted from last quarter's metrics, ready to post in #general.",
    onConfirm: () => {},
    onEdit: () => {},
    onRegenerate: () => {},
    onSkip: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ApprovalCard>;

export const Pending: Story = {
  args: {
    state: "pending",
    detail: (
      <p>
        Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat
        at 2.1%. The one number worth flagging is support volume, which rose 30% against a headcount
        that did not move.
      </p>
    ),
  },
};

/** Every verb locks while the decision is in flight, not just the one clicked. */
export const Submitting: Story = {
  args: { state: "submitting" },
};

/** Confirm and Skip are terminal, so the outcome keeps Undo for a window. */
export const Resolved: Story = {
  args: {
    state: "resolved",
    resolution: "confirmed",
    onUndo: () => {},
  },
};

/**
 * The handlers here are passed in reverse — Skip first, Confirm last — and the
 * card still renders Confirm · Edit · Regenerate · Skip. Order is a property
 * of the component, so it holds across every approval surface in the product.
 */
export const VerbOrder: Story = {
  args: {
    title: "Verb order is fixed by the component",
    summary: "Handlers were supplied in reverse order.",
    onSkip: () => {},
    onRegenerate: () => {},
    onEdit: () => {},
    onConfirm: () => {},
  },
};
