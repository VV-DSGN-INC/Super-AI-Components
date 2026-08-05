"use client";

import { CreditCard, Settings2, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsDialog, type SettingsSectionData } from "@/registry/super-ai/settings-dialog";

export default function SettingsDialogDemo() {
  const [toggles, setToggles] = React.useState({
    autosave: true,
    sounds: false,
    invoices: true,
    telemetry: false,
  });

  const toggle = (key: keyof typeof toggles) => (checked: boolean) =>
    setToggles((current) => ({ ...current, [key]: checked }));

  const sections: SettingsSectionData[] = [
    {
      id: "general",
      label: "General",
      icon: <Settings2 />,
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
              checked={toggles.autosave}
              onCheckedChange={toggle("autosave")}
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
              checked={toggles.sounds}
              onCheckedChange={toggle("sounds")}
            />
          ),
        },
      ],
    },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard />,
      tier: "Pro",
      rows: [
        {
          id: "invoices",
          label: "Email invoices",
          description: "Send a PDF invoice to the workspace owner after every renewal.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              checked={toggles.invoices}
              onCheckedChange={toggle("invoices")}
            />
          ),
        },
      ],
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: <ShieldCheck />,
      rows: [
        {
          id: "telemetry",
          label: "Share usage data",
          description: "Send anonymised feature usage so the team can prioritise what to build.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              checked={toggles.telemetry}
              onCheckedChange={toggle("telemetry")}
            />
          ),
        },
        {
          id: "delete",
          label: "Delete workspace",
          description: "Removes every project, render and API key. This cannot be undone.",
          destructiveAction: { label: "Delete workspace" },
        },
      ],
    },
  ];

  return (
    <SettingsDialog
      sections={sections}
      title="Settings"
      description="Preferences for this workspace."
      trigger={<Button variant="outline">Open settings</Button>}
    />
  );
}
