"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsDialog, type SettingsSectionData } from "@/registry/super-ai/settings-dialog";

/**
 * Live examples for settings-dialog.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose: the docs
 * module is read directly by a Server Component, so it has to stay plain
 * server-evaluable data. Anything with a handler — a controlled Switch, an
 * onAction — lives here and crosses into the docs module as a zero-prop
 * element.
 *
 * The two "don't" examples are hand-built markup rather than SettingsDialog
 * calls, because the component's own API makes both mistakes unreachable:
 * `description` is a required string, and a destructive action is data the
 * component renders itself. That is the point of the examples.
 */

function describedRow(): SettingsSectionData[] {
  return [
    {
      id: "general",
      label: "General",
      rows: [
        {
          id: "autosave",
          label: "Autosave drafts",
          description: "Keeps a copy of every prompt while you type, recoverable for 30 days.",
          control: ({ controlId, labelId, descriptionId }) => (
            <Switch
              id={controlId}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              defaultChecked
            />
          ),
        },
      ],
    },
  ];
}

export function DescribedToggleRow() {
  return (
    <SettingsDialog
      variant="full-page"
      title="General"
      sections={describedRow()}
      className="w-full max-w-xl"
    />
  );
}

export function DestructiveAsText() {
  return (
    <SettingsDialog
      variant="full-page"
      title="Privacy"
      className="w-full max-w-xl"
      sections={[
        {
          id: "privacy",
          label: "Privacy",
          rows: [
            {
              id: "telemetry",
              label: "Share usage data",
              description: "Sends anonymised feature usage so the team can prioritise what to build.",
              control: ({ controlId, labelId, descriptionId }) => (
                <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
              ),
            },
            {
              id: "delete",
              label: "Delete workspace",
              description: "Removes every project, render and API key. This cannot be undone.",
              destructiveAction: { label: "Delete workspace", onAction: () => {} },
            },
          ],
        },
      ]}
    />
  );
}

export function BareToggleNoDescription() {
  return (
    <div className="w-full max-w-xl">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-b py-3">
        <span className="text-foreground block text-sm font-medium">Autosave drafts</span>
        <Switch aria-label="Autosave drafts" defaultChecked />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 py-3">
        <span className="text-foreground block text-sm font-medium">Enhanced mode</span>
        <Switch aria-label="Enhanced mode" />
      </div>
    </div>
  );
}

export function FilledDestructiveButtonBesideToggles() {
  return (
    <div className="w-full max-w-xl">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-b py-3">
        <div className="min-w-0 space-y-0.5">
          <span className="text-foreground block text-sm font-medium">Share usage data</span>
          <p className="text-muted-foreground text-sm">
            Sends anonymised feature usage so the team can prioritise what to build.
          </p>
        </div>
        <Switch aria-label="Share usage data" />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 py-3">
        <div className="min-w-0 space-y-0.5">
          <span className="text-foreground block text-sm font-medium">Delete workspace</span>
          <p className="text-muted-foreground text-sm">
            Removes every project, render and API key. This cannot be undone.
          </p>
        </div>
        {/* Solid rather than the vendored tinted variant: the mistake being
            illustrated is that it is filled at all, and shipping the tinted
            variant here would also ship a 4.0:1 contrast failure. */}
        <Button variant="destructive" size="sm" className="bg-destructive text-background">
          Delete workspace
        </Button>
      </div>
    </div>
  );
}
