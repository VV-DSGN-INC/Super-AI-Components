import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mic, Scissors, Sparkles, Wand2 } from "lucide-react";

import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";
import { FeatureCardRowDocs } from "@/content/components/feature-card-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const ICON_TITLE_DESC: FeatureCardRowItem[] = [
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
];

const WITH_THUMBNAIL: FeatureCardRowItem[] = [
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
];

const HORIZONTAL_SCROLL: FeatureCardRowItem[] = [
  ...WITH_THUMBNAIL,
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
  {
    id: "remove-bg",
    thumbnail: { src: "https://placehold.co/320x180?text=Remove+BG", alt: "Preview of background removal" },
    title: "Remove the background",
    description: "Isolate the subject without a green screen.",
    onSelect: () => {},
  },
];

const meta: Meta<typeof FeatureCardRow> = {
  title: "Super AI/Feature Card Row",
  component: FeatureCardRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeatureCardRowDocs) } },
  decorators: [(Story) => <div className="w-[36rem]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof FeatureCardRow>;

export const IconTitleDesc: Story = {
  args: { items: ICON_TITLE_DESC },
};

export const WithThumbnail: Story = {
  args: { items: WITH_THUMBNAIL },
};

export const HorizontalScroll: Story = {
  args: { items: HORIZONTAL_SCROLL },
};
