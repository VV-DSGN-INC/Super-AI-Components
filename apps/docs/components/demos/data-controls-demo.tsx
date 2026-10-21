"use client";

import * as React from "react";

import { DataControls } from "@/registry/super-ai/data-controls";

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "1y", label: "1 year" },
  { value: "forever", label: "Until I delete them" },
];

export default function DataControlsDemo() {
  const [training, setTraining] = React.useState(true);
  const [period, setPeriod] = React.useState("30d");
  const periodLabel = PERIODS.find((p) => p.value === period)?.label;

  return (
    <DataControls
      title="Data controls"
      description="What happens to the conversations you have here."
      training={{
        label: "Improve the model for everyone",
        description:
          "Your chats help train future models, which improves answers for everyone. You share what you write; you get better results over time.",
        effect: training
          ? "Right now your chats are used to train models."
          : "Right now your chats are not used to train models.",
        learnMoreHref: "#training",
        checked: training,
        onCheckedChange: setTraining,
      }}
      retention={{
        label: "Keep my chats",
        description: "How long chats stay in your history before they are deleted.",
        effect: `Right now chats are deleted after ${periodLabel}.`,
        learnMoreHref: "#retention",
        value: period,
        periods: PERIODS,
        onValueChange: setPeriod,
      }}
    />
  );
}
