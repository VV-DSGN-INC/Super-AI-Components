"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { ExploreGallery, type ExploreGalleryItem } from "@/registry/super-ai/explore-gallery";

/**
 * Live examples for explore-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onValueChange` never has to cross
 * the server/client boundary.
 *
 * These are fragments of the shell — a feed, a control strip — not whole page
 * shells. Four full shells stacked down a documentation page would teach
 * nothing the live preview at the top of it does not already teach.
 */

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

const VARIED: ExploreGalleryItem[] = [
  { id: "1", title: "Neon city", aspectRatio: "3 / 4", author: "@lumen", media: <Swatch tone="primary" /> },
  { id: "2", title: "Paper forest", aspectRatio: "16 / 9", author: "@fold", media: <Swatch tone="secondary" /> },
  { id: "3", title: "Chrome jellyfish", aspectRatio: "1 / 1", author: "@drift", media: <Swatch tone="muted" /> },
  { id: "4", title: "Greenhouse", aspectRatio: "4 / 5", author: "@slab", media: <Swatch tone="secondary" /> },
];

const FLATTENED: ExploreGalleryItem[] = VARIED.map((item) => ({ ...item, aspectRatio: "1 / 1" }));

/** Do: variable heights, so scanning the feed turns up something unplanned. */
export function MasonryKeepsTheSurprise() {
  return <ExploreGallery items={VARIED} layout="masonry" dockedPrompt={false} />;
}

/** Don't: one ratio for everything turns a community feed into a contact sheet. */
export function UniformRowsFlattenTheFeed() {
  return <ExploreGallery items={FLATTENED} layout="rows" dockedPrompt={false} />;
}

/** Do: ordering and filtering as two named controls, side by side. */
export function TwoAxesStaySeparate() {
  return (
    <Tabs defaultValue="hot" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <TabsList variant="line" aria-label="Sort">
        <TabsTrigger value="hot">Hot</TabsTrigger>
        <TabsTrigger value="new">New</TabsTrigger>
        <TabsTrigger value="top">Top</TabsTrigger>
      </TabsList>
      <ChoiceChips aria-label="Type" defaultValue="image">
        <ChoiceChip value="image">Images</ChoiceChip>
        <ChoiceChip value="video">Videos</ChoiceChip>
        <ChoiceChip value="template">Templates</ChoiceChip>
      </ChoiceChips>
    </Tabs>
  );
}

/** Don't: one row of chips makes &quot;Hot&quot; and &quot;Videos&quot; look mutually exclusive. */
export function OneMergedFilterRow() {
  return (
    <ChoiceChips aria-label="Sort and type" defaultValue="hot">
      <ChoiceChip value="hot">Hot</ChoiceChip>
      <ChoiceChip value="new">New</ChoiceChip>
      <ChoiceChip value="top">Top</ChoiceChip>
      <ChoiceChip value="image">Images</ChoiceChip>
      <ChoiceChip value="video">Videos</ChoiceChip>
    </ChoiceChips>
  );
}
