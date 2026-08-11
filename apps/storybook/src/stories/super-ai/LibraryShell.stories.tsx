import type { Meta, StoryObj } from "@storybook/react-vite";

import { LibraryShell } from "@/registry/super-ai/library-shell";
import { LibraryShellDocs } from "@/content/components/library-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof LibraryShell> = {
  title: "Super AI/Library Shell",
  component: LibraryShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(LibraryShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof LibraryShell>;


