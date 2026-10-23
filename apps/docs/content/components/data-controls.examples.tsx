"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { DataControls } from "@/registry/super-ai/data-controls";

/**
 * Live examples for data-controls.docs.tsx.
 *
 * A client sidecar on purpose: the docs module is read by a Server Component
 * and cannot carry handlers, so every example that owns state lives here and
 * crosses over as a zero-prop element.
 */

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "1y", label: "1 year" },
  { value: "forever", label: "Until I delete them" },
];

const TRAINING_DESCRIPTION =
  "Your chats help train future models, which improves answers for everyone. You give up some privacy of content; you get better results over time.";

function TrainingStateful() {
  const [checked, setChecked] = React.useState(true);
  return (
    <DataControls
      training={{
        label: "Improve the model for everyone",
        description: TRAINING_DESCRIPTION,
        effect: checked
          ? "Right now your chats are used to train models."
          : "Right now your chats are not used to train models.",
        learnMoreHref: "#training",
        checked,
        onCheckedChange: setChecked,
      }}
    />
  );
}

export function EffectSentenceFollowsTheSwitch() {
  return <TrainingStateful />;
}

export function TwoSeparateRows() {
  const [checked, setChecked] = React.useState(false);
  const [period, setPeriod] = React.useState("30d");
  return (
    <DataControls
      training={{
        label: "Improve the model for everyone",
        description: TRAINING_DESCRIPTION,
        effect: checked
          ? "Right now your chats are used to train models."
          : "Right now your chats are not used to train models.",
        learnMoreHref: "#training",
        checked,
        onCheckedChange: setChecked,
      }}
      retention={{
        label: "Keep my chats",
        description: "How long chats stay in your history before they are deleted.",
        effect: `Right now chats are deleted after ${PERIODS.find((p) => p.value === period)?.label}.`,
        learnMoreHref: "#retention",
        value: period,
        periods: PERIODS,
        onValueChange: setPeriod,
      }}
    />
  );
}

export function PlanLockedStaysVisible() {
  return (
    <DataControls
      training={{
        kind: "plan-locked",
        plan: "Pro",
        onUpgrade: () => {},
        label: "Improve the model for everyone",
        description: TRAINING_DESCRIPTION,
        effect: "Right now your chats are used to train models.",
        learnMoreHref: "#training",
        checked: true,
      }}
    />
  );
}

export function NoneCollectedExplainsItself() {
  return (
    <DataControls
      training={{
        kind: "none-collected",
        reason: "Chats are processed to answer you and then discarded, so there is nothing to opt out of.",
        label: "Improve the model for everyone",
        description: "Models are trained on licensed and public data only.",
        effect: "Nothing you write is used to train models.",
        learnMoreHref: "#training",
      }}
    />
  );
}

export function AdminManagedShowsWhoToAsk() {
  return (
    <DataControls
      training={{
        kind: "admin-managed",
        policy: "chats are never used for training.",
        contact: "your workspace admin",
        label: "Improve the model for everyone",
        description: TRAINING_DESCRIPTION,
        effect: "Right now your chats are not used to train models.",
        learnMoreHref: "#training",
        checked: false,
      }}
    />
  );
}

export function BareToggleNoDescription() {
  const [checked, setChecked] = React.useState(true);
  return (
    <div className="flex w-72 items-center justify-between gap-4 rounded-lg border p-3 text-sm">
      <span>Improve the model</span>
      <Switch checked={checked} onCheckedChange={setChecked} aria-label="Improve the model" />
    </div>
  );
}

export function OneSwitchForBoth() {
  const [checked, setChecked] = React.useState(true);
  return (
    <div className="flex w-72 items-center justify-between gap-4 rounded-lg border p-3 text-sm">
      <span>Use my data (training and history)</span>
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="Use my data (training and history)"
      />
    </div>
  );
}

export function OptOutHiddenFromFreePlan() {
  return (
    <div className="w-72 rounded-lg border p-3 text-sm">
      <p className="font-medium">Data controls</p>
      <p className="mt-1">Nothing to configure.</p>
    </div>
  );
}
