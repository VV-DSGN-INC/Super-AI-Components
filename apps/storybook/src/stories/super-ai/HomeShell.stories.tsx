import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomeShell } from "@/registry/super-ai/home-shell";
import { HomeShellDocs } from "@/content/components/home-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof HomeShell> = {
  title: "Super AI/Home Shell",
  component: HomeShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(HomeShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof HomeShell>;


