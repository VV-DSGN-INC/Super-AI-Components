import type { Meta, StoryObj } from "@storybook/react-vite";

import { TimelineShell } from "@/registry/super-ai/timeline-shell";
import { TimelineShellDocs } from "@/content/components/timeline-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TimelineShell> = {
  title: "Super AI/Timeline Shell",
  component: TimelineShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TimelineShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof TimelineShell>;


