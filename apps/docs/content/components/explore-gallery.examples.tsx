"use client";

import { ExploreGallery, type ExploreGalleryItem } from "@/registry/super-ai/explore-gallery";

/**
 * Live examples for explore-gallery.docs.tsx.
 *
 * Client sidecar, kept separate on purpose: the docs module is read directly
 * by a Server Component, so it has to stay plain, server-evaluable data. Every
 * example here is a zero-prop component, which means a handler like
 * `onLoadMore` is created and consumed entirely inside this client module and
 * never has to cross the server/client boundary.
 */

function Swatch({ tone }: { tone: "primary" | "secondary" }) {
  return <div className={tone === "primary" ? "bg-primary/25 size-full" : "bg-secondary size-full"} />;
}

const ITEMS: ExploreGalleryItem[] = [
  {
    id: "1",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    typeLabel: "Image",
    author: "@lumen",
    media: <Swatch tone="primary" />,
  },
  {
    id: "2",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    typeLabel: "Image",
    author: "@fold",
    media: <Swatch tone="secondary" />,
  },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
];

const TYPES = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
];

/** DO — ordering and filtering stay two controls with two names. */
export function TwoAxesKeptSeparate() {
  return (
    <div className="w-full max-w-md">
      <ExploreGallery items={ITEMS} sorts={SORTS} types={TYPES} defaultType="all" dockedPrompt={false} />
    </div>
  );
}

/** DO — a focusable Load more, plus a live region that says where you are. */
export function LoadMoreIsReal() {
  return (
    <div className="w-full max-w-md">
      <ExploreGallery items={ITEMS} sorts={SORTS} totalCount={240} hasMore dockedPrompt={false} />
    </div>
  );
}

/** DON'T — one merged row makes "Hot" and "Video" look mutually exclusive. */
export function MergedFilterRow() {
  return (
    <div className="flex w-full max-w-md flex-wrap gap-2 rounded-lg border p-3">
      {["Hot", "New", "All", "Images", "Video"].map((label) => (
        <span key={label} className="rounded-lg border px-3 py-1.5 text-sm">
          {label}
        </span>
      ))}
    </div>
  );
}

/** DON'T — loading that only ever happens on scroll is unreachable. */
export function ScrollOnlyFeed() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-lg border p-3">
      <div className="bg-secondary h-16 w-full rounded-md" />
      <div className="bg-secondary h-16 w-full rounded-md" />
      <p className="text-foreground/70 text-xs">Keep scrolling for more…</p>
    </div>
  );
}
