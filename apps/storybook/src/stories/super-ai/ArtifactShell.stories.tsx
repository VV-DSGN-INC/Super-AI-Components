import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArtifactShell } from "@/registry/super-ai/artifact-shell";
import { ArtifactShellDocs } from "@/content/components/artifact-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ArtifactShell> = {
  title: "Super AI/Artifact Shell",
  component: ArtifactShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ArtifactShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof ArtifactShell>;


