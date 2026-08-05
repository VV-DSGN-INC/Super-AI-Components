"use client";

import { Clapperboard, Megaphone, Mic, Users } from "lucide-react";

import { OnboardingWizard, type OnboardingWizardStep } from "@/registry/super-ai/onboarding-wizard";

const STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    description: "This picks the templates and sample project you land in.",
    choices: [
      {
        value: "marketing",
        label: "Marketing video",
        description: "Ads, social cuts, product clips",
        icon: <Megaphone className="size-4" />,
      },
      {
        value: "film",
        label: "Film and story",
        description: "Scenes, shot lists, longer edits",
        icon: <Clapperboard className="size-4" />,
      },
      {
        value: "voice",
        label: "Voice and audio",
        description: "Narration, dubbing, podcasts",
        icon: <Mic className="size-4" />,
      },
      {
        value: "team",
        label: "Something for my team",
        description: "Shared brand kit and review flow",
        icon: <Users className="size-4" />,
      },
    ],
    effect: "Sets your default aspect ratio, template set, and the sample project we open first.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month", description: "Starter credit pack" },
      { value: "weekly", label: "Something most weeks", description: "Batch queue turned on" },
      { value: "daily", label: "Every day", description: "Concurrency raised to 4 renders" },
    ],
    effect: "Picks your credit pack and whether the batch queue starts on.",
  },
  {
    id: "workspace",
    title: "Bring your brand in",
    description: "Optional — you can add this later from Settings.",
    content: (
      <p className="text-foreground text-sm">
        Drop a logo and two brand colours here and every template picks them up.
      </p>
    ),
    effect: "Applies your palette to every generated title card.",
    panel: (
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Teams ship 3x faster with a brand kit</p>
        <p className="text-foreground/70 text-xs">
          Brand kits are shared across the workspace, so nobody re-picks the same blue twice.
        </p>
      </div>
    ),
    panelSide: "end",
  },
];

export default function OnboardingWizardDemo() {
  return <OnboardingWizard steps={STEPS} defaultAnswers={{ role: "marketing" }} />;
}
