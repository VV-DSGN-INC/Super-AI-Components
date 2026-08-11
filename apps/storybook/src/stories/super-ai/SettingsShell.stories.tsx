import type { Meta, StoryObj } from "@storybook/react-vite";

import { SettingsShell } from "@/registry/super-ai/settings-shell";
import { SettingsShellDocs } from "@/content/components/settings-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SettingsShell> = {
  title: "Super AI/Settings Shell",
  component: SettingsShell,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SettingsShellDocs) } },
};

export default meta;
type Story = StoryObj<typeof SettingsShell>;


