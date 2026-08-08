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

export const Preview: Story = {};
export const Warning: Story = {};
export const TrustCheckbox: Story = {};
export const AccountPicker: Story = {};
