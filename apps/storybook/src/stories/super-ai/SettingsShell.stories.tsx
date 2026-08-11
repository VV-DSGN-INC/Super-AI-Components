import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, KeyRound, Plug, Server, SlidersHorizontal, Users } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import type { SettingsRowData } from "@/registry/super-ai/settings-dialog";
import { SettingsShell, type SettingsShellProps } from "@/registry/super-ai/settings-shell";
import { SettingsShellDocs } from "@/content/components/settings-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MCP_CONFIG = `{
  "mcpServers": {
    "northwind-docs": {
      "command": "npx",
      "args": ["-y", "@northwind/mcp-docs"]
    }
  }
}`;

const toggle = (id: string, label: string, description: string): SettingsRowData => ({
  id,
  label,
  description,
  control: ({ controlId, labelId, descriptionId }) => (
    <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
  ),
});

const SECTIONS: SettingsShellProps["sections"] = [
  {
    id: "general",
    label: "General",
    group: "Account",
    icon: <SlidersHorizontal aria-hidden />,
    callout: {
      title: "Personal",
      description: "These follow your account into every workspace you belong to.",
    },
    rows: [
      toggle("autosave", "Autosave drafts", "Keep a copy of every prompt while you type, recoverable for 30 days."),
      toggle("sounds", "Completion sounds", "Play a chime when a long generation finishes in a background tab."),
      toggle("telemetry", "Share usage data", "Send anonymised feature usage so the team can prioritise work."),
      {
        id: "delete",
        label: "Delete account",
        description: "Removes every project, render and API key. This cannot be undone.",
        destructiveAction: { label: "Delete account" },
      },
    ],
  },
  {
    id: "members",
    label: "Members",
    group: "Account",
    icon: <Users aria-hidden />,
    callout: {
      description: "Members inherit the workspace plan. Seats are billed the day they are added.",
    },
    rows: [
      toggle("invite-links", "Invite links", "Let anyone with the link join without an admin approving them."),
    ],
  },
  {
    id: "mcp",
    label: "MCP",
    group: "Workspace",
    icon: <Server aria-hidden />,
    tier: "Pro",
    callout: {
      description:
        "MCP servers run with this workspace's credentials. Everyone here can call whatever you connect.",
    },
    rows: [
      toggle("mcp-autoconnect", "Auto-connect servers", "Reconnect known MCP servers when a session starts."),
      toggle("mcp-approvals", "Ask before every tool call", "Pause the first time a server calls a new tool."),
    ],
    gatedLabel: "Included with Pro",
    gated: [
      {
        id: "remote-servers",
        icon: <Plug aria-hidden />,
        label: "Remote MCP servers",
        description: "Connect servers that run outside this machine, over HTTP.",
        state: "locked",
        tier: "Pro",
        onRequestUpgrade: () => {},
      },
      {
        id: "server-secrets",
        icon: <KeyRound aria-hidden />,
        label: "Per-server secrets",
        description: "Scope an API key to one server instead of the whole workspace.",
        state: "trial-available",
        trialLabel: "Free trial",
      },
    ],
    code: { label: "MCP server configuration", language: "json", value: MCP_CONFIG },
  },
  {
    id: "plans",
    label: "Plans",
    group: "Billing",
    icon: <CreditCard aria-hidden />,
    tier: "Pro",
    callout: {
      description: "Changing plan takes effect immediately. Unused days are credited at renewal.",
    },
    rows: [
      toggle("invoices", "Email invoices", "Send a PDF invoice to the workspace owner after each renewal."),
    ],
    pricing: {
      plans: [
        { name: "Free", description: "Everything you need to try the workspace.", monthly: 0, yearly: 0 },
        {
          name: "Pro",
          description: "Remote servers, per-server secrets, priority runs.",
          monthly: 20,
          yearly: 16,
          current: true,
          highlighted: true,
        },
        { name: "Team", description: "Shared servers and pooled credits.", monthly: 40, yearly: 32 },
      ],
    },
  },
];

const ACCOUNT_MENU = (
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
);

const FULL_ARGS: SettingsShellProps = {
  sections: SECTIONS,
  sectionId: "mcp",
  onSectionChange: () => {},
  description: "Workspace and account preferences for Northwind.",
  usage: [
    { label: "Generations", used: 820, limit: 1000, resetsIn: "Resets in 6 days" },
    { label: "MCP calls", used: 12400, limit: 50000, resetsIn: "Resets in 6 days" },
  ],
  accountMenu: ACCOUNT_MENU,
};

const meta: Meta<typeof SettingsShell> = {
  title: "Super AI/Settings Shell",
  component: SettingsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(SettingsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsShell>;

/** The working page: grouped nav with tier badges, a scope callout, M1's rows, E7's gated rows and a copy-ready config block. */
export const Workspace: Story = { args: FULL_ARGS };

/**
 * Day one. No sections at all — the nav column and the content column each fall
 * to their own L1, the callout falls back to the workspace-scope line, and the
 * code region says it has nothing to copy. Four independent empty affordances,
 * and still a working search field. Mandatory export for the block contract.
 */
export const Empty: Story = { args: { accountMenu: ACCOUNT_MENU } };

/**
 * Narrow viewport. The nav column keeps its width and the content column takes
 * what is left, so M4's plan cards and M1's two-column row grid are what give
 * first. Mandatory export for the block contract — a shell is a layout, and
 * layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width, exactly
 * like every other story. The narrow layout here is verified by hand.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * Settings search, mid-query. The match count lands on every nav row, including
 * the two groups you are not looking at — which is the whole point: a search
 * that only reports on the open section finds nothing you had not already found.
 */
export const Searching: Story = {
  args: { ...FULL_ARGS, sectionId: "general", search: "invoice", onSearchChange: () => {} },
};

/**
 * The paywall as a placement rather than a modal: the Pro badge in the nav, the
 * locked E7 rows it was promising, and — one section down — the plan comparison
 * the upgrade lands on.
 */
export const TierGated: Story = {
  args: {
    ...FULL_ARGS,
    sectionId: "mcp",
    sections: SECTIONS?.map((section) =>
      section.id === "mcp"
        ? {
            ...section,
            gated: section.gated?.map((gate) =>
              gate.id === "remote-servers"
                ? {
                    ...gate,
                    state: "inline-upsell" as const,
                    upsellDescription:
                      "Pro workspaces can connect hosted servers and share them with every member.",
                  }
                : gate,
            ),
          }
        : section,
    ),
  },
};

/** The billing section: M4 on the page, under the rows it is selling against. */
export const Plans: Story = { args: { ...FULL_ARGS, sectionId: "plans" } };
