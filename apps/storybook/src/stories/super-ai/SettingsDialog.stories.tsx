import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, Settings2, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { SettingsDialog, type SettingsSectionData } from "@/registry/super-ai/settings-dialog";
import { SettingsDialogDocs } from "@/content/components/settings-dialog.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SettingsDialog> = {
  title: "Super AI/Settings Dialog",
  component: SettingsDialog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SettingsDialogDocs) } },
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

const toggle =
  (initial: "on" | "off") =>
  ({ controlId, labelId, descriptionId }: { controlId: string; labelId: string; descriptionId: string }) => (
    <Switch
      id={controlId}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      defaultChecked={initial === "on"}
    />
  );

const GENERAL: SettingsSectionData = {
  id: "general",
  label: "General",
  icon: <Settings2 />,
  rows: [
    {
      id: "autosave",
      label: "Autosave drafts",
      description: "Keeps a copy of every prompt while you type, recoverable for 30 days.",
      control: toggle("on"),
    },
    {
      id: "sounds",
      label: "Completion sounds",
      description: "Plays a chime when a long generation finishes in a background tab.",
      control: toggle("off"),
    },
  ],
};

const BILLING: SettingsSectionData = {
  id: "billing",
  label: "Billing",
  icon: <CreditCard />,
  tier: "Pro",
  rows: [
    {
      id: "invoices",
      label: "Email invoices",
      description: "Sends a PDF invoice to the workspace owner after every renewal.",
      control: toggle("on"),
    },
    {
      id: "seats",
      label: "Auto-add seats",
      description: "Buys a seat automatically when someone new joins, at the current rate.",
      control: toggle("off"),
    },
  ],
};

const PRIVACY: SettingsSectionData = {
  id: "privacy",
  label: "Privacy",
  icon: <ShieldCheck />,
  rows: [
    {
      id: "telemetry",
      label: "Share usage data",
      description: "Sends anonymised feature usage so the team can prioritise what to build.",
      control: toggle("off"),
    },
    {
      id: "history",
      label: "Clear generation history",
      description: "Deletes every stored prompt and render older than the retention window.",
      destructiveAction: { label: "Clear history" },
    },
    {
      id: "delete",
      label: "Delete workspace",
      description: "Removes every project, render and API key. This cannot be undone.",
      destructiveAction: { label: "Delete workspace" },
    },
  ],
};

export const Dialog: Story = {
  args: {
    variant: "dialog",
    open: true,
    title: "Settings",
    description: "Preferences for this workspace.",
    sections: [GENERAL, BILLING, PRIVACY],
  },
};

export const FullPage: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    description: "Search every preference, or link straight to a section.",
    anchorPrefix: "settings",
    sections: [GENERAL, BILLING, PRIVACY],
  },
  render: (args) => {
    // Search and the active section are controlled so the URL can own them —
    // the story stands in for the app that would normally hold that state.
    function Harness() {
      const [search, setSearch] = React.useState("");
      const [sectionId, setSectionId] = React.useState("general");
      return (
        <SettingsDialog
          {...args}
          className="w-[44rem]"
          search={search}
          onSearchChange={setSearch}
          sectionId={sectionId}
          onSectionChange={setSectionId}
        />
      );
    }
    return <Harness />;
  },
};

export const ToggleRows: Story = {
  args: {
    variant: "full-page",
    title: "General",
    description: "Every row is a label, a description and one control.",
    sections: [GENERAL],
    className: "w-[36rem]",
  },
};

export const DestructiveRows: Story = {
  args: {
    variant: "full-page",
    title: "Privacy",
    description: "Destructive actions are text in the control column, never a filled button.",
    sections: [PRIVACY],
    className: "w-[36rem]",
  },
};

export const TierBadgedNav: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    defaultSectionId: "billing",
    sections: [GENERAL, BILLING, PRIVACY],
    className: "w-[36rem]",
  },
};
