"use client";

import * as React from "react";

import { ExploreGallery, type ExploreGalleryItem } from "@/registry/super-ai/explore-gallery";

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

const ITEMS: ExploreGalleryItem[] = [
  {
    id: "1",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@lumen",
    metric: "1.2k",
    prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
    media: <Swatch tone="primary" />,
  },
  {
    id: "2",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    type: "image",
    typeLabel: "Image",
    author: "@fold",
    metric: "840",
    prompt: "layered paper-cut forest, warm rim light",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "3",
    title: "Chrome jellyfish",
    aspectRatio: "1 / 1",
    type: "video",
    typeLabel: "Video",
    author: "@drift",
    metric: "3.4k",
    prompt: "chrome jellyfish drifting through black water, slow motion",
    media: <Swatch tone="muted" />,
  },
  {
    id: "4",
    title: "Brutalist greenhouse",
    aspectRatio: "4 / 5",
    type: "image",
    typeLabel: "Image",
    author: "@cass",
    metric: "612",
    prompt: "brutalist concrete greenhouse, overgrown, golden hour",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "5",
    title: "Tide pool macro",
    aspectRatio: "3 / 2",
    type: "image",
    typeLabel: "Image",
    author: "@sable",
    metric: "298",
    prompt: "tide pool macro photography, iridescent shells",
    media: <Swatch tone="muted" />,
  },
  {
    id: "6",
    title: "Loop: falling ribbons",
    aspectRatio: "9 / 16",
    type: "video",
    typeLabel: "Video",
    author: "@nine",
    metric: "2.1k",
    prompt: "seamless loop of falling silk ribbons, studio backdrop",
    media: <Swatch tone="primary" />,
  },
];

export default function ExploreGalleryDemo() {
  const [shown, setShown] = React.useState(4);

  return (
    <div className="h-[36rem] w-full max-w-4xl">
      <ExploreGallery
        className="h-full"
        items={ITEMS.slice(0, shown)}
        sorts={[
          { value: "hot", label: "Hot" },
          { value: "new", label: "New" },
          { value: "top", label: "Top" },
        ]}
        types={[
          { value: "all", label: "All", count: 6 },
          { value: "image", label: "Images", count: 4 },
          { value: "video", label: "Video", count: 2 },
        ]}
        defaultType="all"
        totalCount={ITEMS.length}
        hasMore={shown < ITEMS.length}
        onLoadMore={() => setShown((n) => Math.min(n + 2, ITEMS.length))}
      />
    </div>
  );
}
