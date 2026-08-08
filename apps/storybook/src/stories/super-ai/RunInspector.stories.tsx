import type { Meta, StoryObj } from "@storybook/react-vite";

import { RunInspector } from "@/registry/super-ai/run-inspector";
import { RunInspectorDocs } from "@/content/components/run-inspector.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RunInspector> = {
  title: "Super AI/Run Inspector",
  component: RunInspector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RunInspectorDocs) } },
};

export default meta;
type Story = StoryObj<typeof RunInspector>;

export const InputTab: Story = {};
export const OutputTab: Story = {};
export const MetadataTab: Story = {};
export const ErrorTab: Story = {};
