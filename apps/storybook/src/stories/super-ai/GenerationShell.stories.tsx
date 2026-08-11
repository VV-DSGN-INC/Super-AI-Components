import type { Meta, StoryObj } from "@storybook/react-vite";

import { GenerationShell } from "@/registry/super-ai/generation-shell";
import { GenerationShellDocs } from "@/content/components/generation-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GenerationShell> = {
  title: "Super AI/Generation Shell",
  component: GenerationShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenerationShell>;


