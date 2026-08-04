import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountMenu } from "@/registry/super-ai/account-menu";
import { AccountMenuDocs } from "@/content/components/account-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SAMPLE_USER = { name: "Ada Lovelace", email: "ada@example.com" };

const meta: Meta<typeof AccountMenu> = {
  title: "Super AI/Account Menu",
  component: AccountMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AccountMenuDocs) } },
  args: {
    user: SAMPLE_USER,
    onThemeChange: () => {},
    onBackgroundChange: () => {},
    onSignOut: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AccountMenu>;

export const ThemeRadio: Story = {
  args: {
    theme: "dark",
    background: "default",
  },
};

export const BackgroundSwatches: Story = {
  args: {
    theme: "light",
    background: "forest",
  },
};

export const ShortcutHints: Story = {
  args: {
    theme: "system",
    background: "default",
    items: [
      { label: "Settings", shortcut: ["⌘", ","] },
      { label: "Invite people", shortcut: ["⌘", "I"] },
    ],
    signOutShortcut: ["⇧", "⌘", "Q"],
  },
};
