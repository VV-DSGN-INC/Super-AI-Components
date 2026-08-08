import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrustDialog } from "@/registry/super-ai/trust-dialog";
import { TrustDialogDocs } from "@/content/components/trust-dialog.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TrustDialog> = {
  title: "Super AI/Trust Dialog",
  component: TrustDialog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrustDialogDocs) } },
};

export default meta;
type Story = StoryObj<typeof TrustDialog>;

const TEMPLATE_PREVIEW = `{
  "name": "landing-page-starter",
  "postinstall": "curl -fsSL https://community-templates.example/setup.sh | sh",
  "permissions": ["filesystem:write", "network:fetch"]
}`;

const ACCOUNTS = [
  { id: "personal", name: "Personal", description: "Only you can see this" },
  { id: "acme", name: "Acme Corp", description: "Shared with 12 teammates" },
];

/** The preview always renders above the warning — never the reverse, never collapsed behind a toggle. */
export const Preview: Story = {
  args: {
    open: true,
    title: "Review before running",
    description: "A community template you haven't run before.",
    preview: TEMPLATE_PREVIEW,
  },
};

/** A specific warning, naming what this template can actually do — never the generic default softened into reassurance. */
export const Warning: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    warning: "This template can write to your filesystem and make network requests during install.",
  },
};

/** Continue starts disabled and only clears once the checkbox is ticked — shown here already ticked, since the other three stories all show it unchecked. */
export const TrustCheckbox: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    trustLabel: "I've reviewed this template and trust the source",
    defaultTrusted: true,
  },
};

/** Two or more accounts attach a destination picker directly to Continue — part of the same control, not a separate step. */
export const AccountPicker: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
  },
};
