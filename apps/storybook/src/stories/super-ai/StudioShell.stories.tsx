import type { Meta, StoryObj } from "@storybook/react-vite";

import { StudioShell } from "@/registry/super-ai/studio-shell";
import { StudioShellDocs } from "@/content/components/studio-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof StudioShell> = {
  title: "Super AI/Studio Shell",
  component: StudioShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(StudioShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof StudioShell>;


