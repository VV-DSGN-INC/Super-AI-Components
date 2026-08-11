import type { Meta, StoryObj } from "@storybook/react-vite";

import { DocsShell } from "@/registry/super-ai/docs-shell";
import { DocsShellDocs } from "@/content/components/docs-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof DocsShell> = {
  title: "Super AI/Docs Shell",
  component: DocsShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DocsShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof DocsShell>;


