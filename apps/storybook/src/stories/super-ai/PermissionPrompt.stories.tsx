import type { Meta, StoryObj } from "@storybook/react-vite";

import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { PermissionPromptDocs } from "@/content/components/permission-prompt.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PermissionPrompt> = {
  title: "Super AI/Permission Prompt",
  component: PermissionPrompt,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PermissionPromptDocs) } },
  args: {
    open: true,
    onAllowOnce: () => {},
    onAlwaysAllow: () => {},
    onDeny: () => {},
    onEditFirst: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PermissionPrompt>;

const EMAIL_ARGS = [
  { key: "to", value: "finance@acme.com" },
  { key: "subject", value: "Q3 invoice — ready for review" },
  { key: "attachment", value: "q3-invoice.pdf" },
];

/** Approves this one call only — nothing persists past it. Allow once and Edit first render with identical weight. */
export const AllowOnce: Story = {
  args: {
    action: "Send email to finance@acme.com",
    reason:
      "The invoice PDF finished rendering and this recipient is on the approved list from the last three runs.",
    args: EMAIL_ARGS,
  },
};

/** Writes a standing grant, but the choice is all this component emits — the grant's review-and-revoke surface is N9 autonomy-selector. */
export const AlwaysAllow: Story = {
  args: {
    action: "Read ~/.ssh/config",
    reason: "Checking which git remotes are configured before pushing the branch.",
    args: [{ key: "path", value: "~/.ssh/config" }],
  },
};

/** Terminal, and safe to press — Deny is the dialog's own Close path, so pressing it does nothing but end the surface. */
export const Deny: Story = {
  args: {
    action: "Force-push to main",
    reason: "The agent believes the last commit needs to be rewritten to fix a bad merge.",
    args: [
      { key: "branch", value: "main" },
      { key: "force", value: "true" },
    ],
  },
};

/** Edit-first swaps the arguments block for an inline editor instead of discarding the call like Deny would. */
export const EditFirst: Story = {
  args: {
    action: "Send email to finance@acme.com",
    reason: "The invoice PDF finished rendering.",
    args: EMAIL_ARGS,
    defaultEditing: true,
  },
};
