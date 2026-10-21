import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContentCredentials } from "@/registry/super-ai/content-credentials";
import { ContentCredentialsDocs } from "@/content/components/content-credentials.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ContentCredentials> = {
  title: "Super AI/Content Credentials",
  component: ContentCredentials,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContentCredentialsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ContentCredentials>;

export const Verified: Story = {};
export const Unverified: Story = {};
export const Stripped: Story = {};
export const AiGenerated: Story = {};
export const AiEdited: Story = {};
export const WithHistory: Story = {};
