"use client";

import { Mic, Scissors, Sparkles, Wand2 } from "lucide-react";

import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";

const START_FROM_SCRATCH: FeatureCardRowItem[] = [
  {
    id: "script-to-video",
    icon: <Wand2 className="size-4" aria-hidden />,
    title: "Script to video",
    description: "Turn a written script into a rough cut with stock footage.",
    onSelect: () => {},
  },
  {
    id: "voice-clone",
    icon: <Mic className="size-4" aria-hidden />,
    title: "Clone a voice",
    description: "Generate narration in a voice trained on a short sample.",
    onSelect: () => {},
  },
  {
    id: "auto-edit",
    icon: <Scissors className="size-4" aria-hidden />,
    title: "Remove filler words",
    description: "Cut silences and \"um\"s from a raw recording automatically.",
    onSelect: () => {},
  },
  {
    id: "generate-b-roll",
    icon: <Sparkles className="size-4" aria-hidden />,
    title: "Generate B-roll",
    description: "Fill gaps in a timeline with AI-generated cutaway footage.",
    onSelect: () => {},
  },
];

const POPULAR_FEATURES: FeatureCardRowItem[] = [
  {
    id: "templates",
    thumbnail: { src: "https://placehold.co/320x180?text=Templates", alt: "Grid of starter templates" },
    title: "Browse templates",
    description: "Start from a layout other teams already ship with.",
    onSelect: () => {},
  },
  {
    id: "brand-kit",
    thumbnail: { src: "https://placehold.co/320x180?text=Brand+Kit", alt: "Preview of a saved brand kit" },
    title: "Apply a brand kit",
    description: "Fonts, colors and logo, applied to every export.",
    onSelect: () => {},
  },
  {
    id: "captions",
    thumbnail: { src: "https://placehold.co/320x180?text=Captions", alt: "Preview of auto-generated captions" },
    title: "Auto-generate captions",
    description: "Burned-in or downloadable, in over 30 languages.",
    onSelect: () => {},
  },
  {
    id: "translate",
    thumbnail: { src: "https://placehold.co/320x180?text=Dub", alt: "Preview of a dubbed clip" },
    title: "Dub into another language",
    description: "Lip-synced translation for the whole project.",
    onSelect: () => {},
  },
  {
    id: "resize",
    thumbnail: { src: "https://placehold.co/320x180?text=Resize", alt: "Preview of resized aspect ratios" },
    title: "Resize for every platform",
    description: "One export, reframed for square, vertical and widescreen.",
    onSelect: () => {},
  },
];

export default function FeatureCardRowDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">Start from scratch</p>
        <FeatureCardRow items={START_FROM_SCRATCH} />
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Popular features — enough cards to need the scroll affordance
        </p>
        <FeatureCardRow items={POPULAR_FEATURES} />
      </div>
    </div>
  );
}
