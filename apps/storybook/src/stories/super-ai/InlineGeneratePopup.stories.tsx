import type { Meta, StoryObj } from "@storybook/react-vite";

import { InlineGeneratePopup } from "@/registry/super-ai/inline-generate-popup";
import { InlineGeneratePopupDocs } from "@/content/components/inline-generate-popup.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof InlineGeneratePopup> = {
  title: "Super AI/Inline Generate Popup",
  component: InlineGeneratePopup,
  parameters: { layout: "centered", docs: { page: componentDocsPage(InlineGeneratePopupDocs) } },
  args: {
    context: "Q3 revenue drivers",
    contextLabel: "Under",
    triggerLabel: "Ask AI on this line",
    onSubmit: () => {},
    onCancel: () => {},
    onCommit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof InlineGeneratePopup>;

/**
 * Waiting on a prompt. The heading it sits under is already on screen, so the
 * placeholder is four words rather than an instruction template.
 */
export const Idle: Story = {
  args: { state: "idle" },
};

/**
 * A run in flight: announced in a live region, interruptible by a real Cancel
 * button, and the prompt stays readable throughout.
 */
export const Generating: Story = {
  args: {
    state: "generating",
    defaultPrompt: "Three bullets on why churn moved",
  },
};

/**
 * After a cancel. The prompt survived, nothing was committed, and the primary
 * button reads Try again — the state is legible as words, not as a faded frame.
 */
export const Cancelled: Story = {
  args: {
    state: "cancelled",
    defaultPrompt: "Three bullets on why churn moved",
  },
};
