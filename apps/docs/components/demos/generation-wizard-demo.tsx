"use client";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { GenerationWizard, type GenerationWizardStep } from "@/registry/super-ai/generation-wizard";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";

const STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    description: "Pick the engine this generation runs on.",
    content: (
      <ChoiceChips defaultValue="fast">
        <ChoiceChip value="fast">Fast (2 credits)</ChoiceChip>
        <ChoiceChip value="quality">Quality (6 credits)</ChoiceChip>
      </ChoiceChips>
    ),
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Fast model</p>
        <CostChip amount={2} className="text-foreground" />
      </div>
    ),
  },
  {
    id: "style",
    title: "Set style",
    description: "Applied to every frame in this generation.",
    content: (
      <ChoiceChips defaultValue="cinematic">
        <ChoiceChip value="cinematic">Cinematic</ChoiceChip>
        <ChoiceChip value="anime">Anime</ChoiceChip>
        <ChoiceChip value="realistic">Realistic</ChoiceChip>
      </ChoiceChips>
    ),
    preview: <p className="text-foreground text-center text-sm">Cinematic, 16:9, +1 credit</p>,
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm before spending credits.",
    content: <p className="text-foreground text-sm">Fast model · Cinematic style · 1 clip</p>,
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Total cost</p>
        <CostChip amount={3} className="text-foreground" />
      </div>
    ),
  },
];

export default function GenerationWizardDemo() {
  return <GenerationWizard steps={STEPS} />;
}
