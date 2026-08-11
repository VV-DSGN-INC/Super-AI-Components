import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExploreShell } from "@/registry/super-ai/explore-shell";
import { ExploreShellDocs } from "@/content/components/explore-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ExploreShell> = {
  title: "Super AI/Explore Shell",
  component: ExploreShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ExploreShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof ExploreShell>;


