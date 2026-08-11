import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotebookShell } from "@/registry/super-ai/notebook-shell";
import { NotebookShellDocs } from "@/content/components/notebook-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof NotebookShell> = {
  title: "Super AI/Notebook Shell",
  component: NotebookShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(NotebookShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof NotebookShell>;


