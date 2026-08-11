"use client";

import { CreditCard, KeyRound, Plug, Server, SlidersHorizontal, Users } from "lucide-react";
import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import { SettingsShell, type SettingsShellSection } from "@/registry/super-ai/settings-shell";

const MCP_CONFIG = `{
  "mcpServers": {
    "northwind-docs": {
      "command": "npx",
      "args": ["-y", "@northwind/mcp-docs"],
      "env": { "NORTHWIND_TOKEN": "\${NORTHWIND_TOKEN}" }
    }
  }
}`;

function useToggles(initial: Record<string, boolean>) {
  const [values, setValues] = React.useState(initial);
  const bind = (id: string) => ({
    checked: values[id] ?? false,
    onCheckedChange: (next: boolean) => setValues((prev) => ({ ...prev, [id]: next })),
  });
  return bind;
}

export default function SettingsShellDemo() {
  const [sectionId, setSectionId] = React.useState("mcp");
  const [search, setSearch] = React.useState("");
  const [remoteServers, setRemoteServers] = React.useState<"locked" | "inline-upsell">("locked");
  const [theme, setTheme] = React.useState("system");
  const [background, setBackground] = React.useState("default");
  const bind = useToggles({
    autosave: true,
    sounds: false,
    telemetry: true,
    "mcp-autoconnect": true,
    "mcp-approvals": true,
    invoices: true,
  });

  const sections: SettingsShellSection[] = [
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
        {
          id: "autosave",
          label: "Autosave drafts",
          description: "Keep a copy of every prompt while you type, recoverable for 30 days.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("autosave")}
            />
          ),
        },
        {
          id: "sounds",
          label: "Completion sounds",
          description: "Play a chime when a long generation finishes in a background tab.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("sounds")}
            />
          ),
        },
        {
          id: "telemetry",
          label: "Share usage data",
          description: "Send anonymised feature usage so the team can prioritise work.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("telemetry")}
            />
          ),
        },
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
        {
          id: "invite-links",
          label: "Invite links",
          description: "Let anyone with the link join without an admin approving them first.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("invite-links")}
            />
          ),
        },
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
        {
          id: "mcp-autoconnect",
          label: "Auto-connect servers",
          description: "Reconnect known MCP servers when a session starts.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("mcp-autoconnect")}
            />
          ),
        },
        {
          id: "mcp-approvals",
          label: "Ask before every tool call",
          description: "Pause and request approval the first time a server calls a new tool.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("mcp-approvals")}
            />
          ),
        },
      ],
      gatedLabel: "Included with Pro",
      gated: [
        {
          id: "remote-servers",
          icon: <Plug aria-hidden />,
          label: "Remote MCP servers",
          description: "Connect servers that run outside this machine, over HTTP.",
          state: remoteServers,
          tier: "Pro",
          onRequestUpgrade: () => setRemoteServers("inline-upsell"),
          onDismissUpsell: () => setRemoteServers("locked"),
          upsellDescription: "Pro workspaces can connect hosted servers and share them with members.",
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
      code: {
        label: "MCP server configuration",
        language: "json",
        value: MCP_CONFIG,
      },
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
        {
          id: "invoices",
          label: "Email invoices",
          description: "Send a PDF invoice to the workspace owner after each renewal.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...bind("invoices")}
            />
          ),
        },
      ],
      pricing: {
        plans: [
          {
            name: "Free",
            description: "Everything you need to try the workspace.",
            monthly: 0,
            yearly: 0,
          },
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

  return (
    <SettingsShell
      className="h-[42rem]"
      sections={sections}
      sectionId={sectionId}
      onSectionChange={setSectionId}
      search={search}
      onSearchChange={setSearch}
      description="Workspace and account preferences for Northwind."
      usage={[
        { label: "Generations", used: 820, limit: 1000, resetsIn: "Resets in 6 days" },
        { label: "MCP calls", used: 12400, limit: 50000, resetsIn: "Resets in 6 days" },
      ]}
      accountMenu={
        <AccountMenu
          user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
          theme={theme}
          onThemeChange={setTheme}
          background={background}
          onBackgroundChange={setBackground}
          onSignOut={() => {}}
        />
      }
    />
  );
}
