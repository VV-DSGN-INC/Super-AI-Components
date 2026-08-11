import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthShell } from "@/registry/super-ai/auth-shell";
import { AuthShellDocs } from "@/content/components/auth-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AuthShell> = {
  title: "Super AI/Auth Shell",
  component: AuthShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AuthShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof AuthShell>;


