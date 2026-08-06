import type { Meta, StoryObj } from "@storybook/react-vite";

import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";
import { AiDocBlockDocs } from "@/content/components/ai-doc-block.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const DRAFT =
  "Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at 2.1%. The number worth flagging is support volume, which rose 30% against a headcount that did not move.";

const meta: Meta<typeof AiDocBlock> = {
  title: "Super AI/Ai Doc Block",
  component: AiDocBlock,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiDocBlockDocs) } },
  decorators: [
    (Story) => (
      // Prose either side, because the whole claim of this component is that it
      // is a node in a document rather than a layer over one.
      <article className="text-foreground flex w-lg max-w-full flex-col gap-3 text-sm">
        <p>Here is where the quarter landed, ahead of Thursday&apos;s review.</p>
        <Story />
        <p>The rest of the document carries on below, exactly where it was.</p>
      </article>
    ),
  ],
  args: {
    label: "AI generated",
    children: <p>{DRAFT}</p>,
    onKeep: () => {},
    onEdit: () => {},
    onRegenerate: () => {},
    onDiscard: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AiDocBlock>;

/**
 * Text still arriving. Announced through a live region, drawn with the word
 * "Streaming" rather than a tint, and the four verbs stay on screen disabled
 * so the footer does not resize when generation lands.
 */
export const Streaming: Story = {
  args: {
    state: "streaming",
    children: <p>Revenue grew 14% quarter over quarter, driven mostly by the self-serve</p>,
  },
};

/** The prose swaps for a labelled textarea in place. Keep commits the edit. */
export const Editable: Story = {
  args: {
    state: "editable",
    value: DRAFT,
  },
};

/**
 * The re-prompt affordance replaces the verb row inside the same block, so
 * "Regenerate" never names two controls at once and the block never moves.
 */
export const RePromptable: Story = {
  args: {
    state: "re-promptable",
    prompt: "Cut it to two sentences and lead with support volume.",
    onRePrompt: () => {},
    onRePromptCancel: () => {},
  },
};

/**
 * The handlers here are supplied in reverse — Discard first, Keep last — and
 * the block still renders Keep · Edit · Regenerate · Discard. Order belongs to
 * the component, the same rule F7 `approval-card` applies to its own verbs.
 */
export const ApprovalVerbs: Story = {
  args: {
    state: "approval-verbs",
    onDiscard: () => {},
    onRegenerate: () => {},
    onEdit: () => {},
    onKeep: () => {},
  },
};
