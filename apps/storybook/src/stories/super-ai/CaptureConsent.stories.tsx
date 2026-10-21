import type { Meta, StoryObj } from "@storybook/react-vite";

import { CaptureConsent } from "@/registry/super-ai/capture-consent";
import { CaptureConsentDocs } from "@/content/components/capture-consent.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CaptureConsent> = {
  title: "Super AI/Capture Consent",
  component: CaptureConsent,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CaptureConsentDocs) } },
};

export default meta;
type Story = StoryObj<typeof CaptureConsent>;

export const PreNotice: Story = {};
export const Recording: Story = {};
export const OthersNotified: Story = {};
export const Declined: Story = {};
export const Ended: Story = {};
