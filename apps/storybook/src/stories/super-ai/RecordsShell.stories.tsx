import type { Meta, StoryObj } from "@storybook/react-vite";

import { RecordsShell } from "@/registry/super-ai/records-shell";
import { RecordsShellDocs } from "@/content/components/records-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RecordsShell> = {
  title: "Super AI/Records Shell",
  component: RecordsShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecordsShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof RecordsShell>;


