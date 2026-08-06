import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectionToolbar } from "@/registry/super-ai/selection-toolbar";
import { SelectionToolbarDocs } from "@/content/components/selection-toolbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SELECTION =
  "It is our belief that the current onboarding process is not optimal and could probably be improved in a number of different ways going forward.";

const meta: Meta<typeof SelectionToolbar> = {
  title: "Super AI/Selection Toolbar",
  component: SelectionToolbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SelectionToolbarDocs) } },
  args: {
    selectionText: SELECTION,
    onIntent: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SelectionToolbar>;

/**
 * The resting bar. Improve is index 0, filled, and never eligible for
 * overflow — everything after it is a plain verb.
 */
export const Improve: Story = {
  args: { pending: null },
};

/**
 * Shorten in flight. The bar stays exactly where it was and announces itself;
 * the paragraph behind it is untouched, because the rewrite comes back as a
 * change to review rather than a replacement.
 */
export const Shorten: Story = {
  args: { pending: "shorten" },
};

/**
 * Expand against a terse selection. Same contract — a request, not an edit.
 */
export const Expand: Story = {
  args: {
    selectionText: "Onboarding needs work.",
    pending: "expand",
  },
};

/**
 * Tone is one verb with a submenu behind it, not five buttons in the bar. In a
 * generation panel the same list belongs in an E4 `preset-grid` instead.
 */
export const ToneSubmenu: Story = {
  args: {
    open: "tone",
    tones: [
      { id: "professional", label: "Professional" },
      { id: "friendly", label: "Friendly" },
      { id: "casual", label: "Casual" },
      { id: "confident", label: "Confident" },
      { id: "direct", label: "Direct" },
    ],
  },
};

/**
 * Free text, submitted in place. A popover with a textarea — never a
 * navigation to a panel that leaves the selection behind.
 */
export const CustomPrompt: Story = {
  args: {
    open: "custom",
    promptPlaceholder: "Tell the model what to do with the selection",
  },
};
