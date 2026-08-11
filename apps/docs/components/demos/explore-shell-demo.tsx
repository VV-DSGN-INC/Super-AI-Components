"use client";

import { Compass, Library, MessagesSquare, Settings, Sparkles } from "lucide-react";

import { ExploreShell, type ExploreShellItem } from "@/registry/super-ai/explore-shell";

/** Stand-in for real community artwork — token-only, no palette classes. */
function Swatch({ tone }: { tone: "primary" | "secondary" | "muted" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "bg-primary/25 size-full"
          : tone === "secondary"
            ? "bg-secondary size-full"
            : "bg-muted size-full"
      }
    />
  );
}

const RAIL = [
  { id: "explore", label: "Explore", icon: <Compass /> },
  { id: "create", label: "Create", icon: <Sparkles />, badge: "new" as const },
  { id: "library", label: "Library", icon: <Library /> },
  { id: "chat", label: "Chat", icon: <MessagesSquare /> },
];

const RAIL_PINNED = [{ id: "settings", label: "Settings", icon: <Settings /> }];

const ITEMS: ExploreShellItem[] = [
  {
    id: "neon",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@lumen",
    metric: "1.2k",
    prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
    media: <Swatch tone="primary" />,
    asset: {
      media: <Swatch tone="primary" />,
      prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
      highlightedSpans: [{ start: 22, end: 47 }],
      params: [
        { label: "Model", value: "Flux 1.1 Pro" },
        { label: "Seed", value: "884201", copyable: true },
        { label: "Sampler", value: "DPM++ 2M", copyable: true },
        { label: "Steps", value: "28" },
      ],
      cost: { amount: 4, unit: "credits", status: "confirmed" as const },
    },
  },
  {
    id: "forest",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    type: "image",
    typeLabel: "Image",
    author: "@fold",
    metric: "840",
    prompt: "layered paper-cut forest, warm rim light",
    media: <Swatch tone="secondary" />,
    asset: {
      media: <Swatch tone="secondary" />,
      prompt: "layered paper-cut forest, warm rim light",
      params: [
        { label: "Model", value: "Flux 1.1 Pro" },
        { label: "Seed", value: "119003", copyable: true },
      ],
    },
  },
  {
    id: "jellyfish",
    title: "Chrome jellyfish",
    aspectRatio: "1 / 1",
    type: "video",
    typeLabel: "Video",
    author: "@drift",
    metric: "3.4k",
    prompt: "chrome jellyfish drifting through black water, slow motion",
    media: <Swatch tone="muted" />,
    asset: {
      media: <Swatch tone="muted" />,
      prompt: "chrome jellyfish drifting through black water, slow motion",
      params: [{ label: "Model", value: "Veo 3.1" }],
    },
  },
  {
    id: "greenhouse",
    title: "Brutalist greenhouse",
    aspectRatio: "4 / 5",
    type: "image",
    typeLabel: "Image",
    author: "@slab",
    metric: "612",
    prompt: "brutalist greenhouse, overgrown, morning fog",
    media: <Swatch tone="secondary" />,
    asset: {
      media: <Swatch tone="secondary" />,
      prompt: "brutalist greenhouse, overgrown, morning fog",
      params: [{ label: "Model", value: "Flux 1.1 Pro" }],
    },
  },
  {
    id: "launch-deck",
    title: "Launch deck",
    aspectRatio: "16 / 10",
    type: "template",
    typeLabel: "Template",
    author: "@studio",
    metric: "9.1k",
    media: <Swatch tone="primary" />,
    template: {
      templates: [
        {
          id: "launch-deck",
          title: "Launch deck",
          description: "Twelve slides that open on the problem and close on the ask.",
          previews: [
            { id: "cover", label: "Cover slide", media: <Swatch tone="primary" /> },
            { id: "metrics", label: "Metrics slide", media: <Swatch tone="secondary" /> },
          ],
          options: [
            {
              id: "length",
              label: "Length",
              choices: [
                { value: "12", label: "12 slides" },
                { value: "20", label: "20 slides" },
              ],
            },
          ],
          author: { id: "studio", name: "Studio Ninefold", meta: "84 templates" },
        },
      ],
    },
  },
  {
    id: "zine",
    title: "Risograph zine cover",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@press",
    metric: "455",
    prompt: "risograph zine cover, two-colour overprint, halftone",
    media: <Swatch tone="muted" />,
    asset: {
      media: <Swatch tone="muted" />,
      prompt: "risograph zine cover, two-colour overprint, halftone",
      params: [{ label: "Model", value: "Flux 1.1 Pro" }],
    },
  },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TYPES = [
  { value: "image", label: "Images", count: 812 },
  { value: "video", label: "Videos", count: 44 },
  { value: "template", label: "Templates", count: 126 },
];

export default function ExploreShellDemo() {
  return (
    <ExploreShell
      className="h-[42rem]"
      rail={RAIL}
      railPinned={RAIL_PINNED}
      activeRailId="explore"
      sorts={SORTS}
      defaultSort="hot"
      types={TYPES}
      items={ITEMS}
      gallery={{ hasMore: true, totalCount: 982 }}
    />
  );
}
