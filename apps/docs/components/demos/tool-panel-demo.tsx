"use client";

import { useMemo, useState } from "react";
import { Shapes, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolPanel, type ToolPanelSection } from "@/registry/super-ai/tool-panel";

// A thumbnail stand-in. Real panels put an <img> or a live preview here.
function Swatch({ children }: { children: string }) {
  return (
    <span className="text-foreground flex h-full w-full items-center justify-center p-1 text-center text-[0.6rem]">
      {children}
    </span>
  );
}

const CATALOG: ToolPanelSection[] = [
  {
    id: "recent",
    title: "Recently used",
    tab: "elements",
    action: (
      <a href="#recent" className="underline underline-offset-2">
        View all
      </a>
    ),
    items: [
      { id: "circle", label: "Circle" },
      { id: "arrow", label: "Arrow" },
      { id: "burst", label: "Burst" },
    ],
  },
  {
    id: "shapes",
    title: "Shapes",
    tab: "elements",
    collapsible: true,
    items: [
      { id: "square", label: "Square" },
      { id: "triangle", label: "Triangle" },
      { id: "hexagon", label: "Hexagon" },
      { id: "star", label: "Star" },
      { id: "blob", label: "Blob" },
      { id: "ring", label: "Ring" },
    ],
  },
  {
    id: "lines",
    title: "Lines",
    tab: "elements",
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: "solid", label: "Solid line" },
      { id: "dashed", label: "Dashed line" },
      { id: "curved", label: "Curved line" },
    ],
  },
  {
    id: "generated",
    title: "Generated",
    tab: "generate",
    items: [
      { id: "gen-1", label: "Neon skyline" },
      { id: "gen-2", label: "Paper texture" },
      { id: "gen-3", label: "Ink splash", state: "loading" },
    ],
  },
  {
    id: "uploads",
    title: "Your uploads",
    tab: "uploads",
    items: [
      { id: "logo", label: "logo.svg" },
      { id: "headshot", label: "headshot.png" },
    ],
  },
];

export default function ToolPanelDemo() {
  const [query, setQuery] = useState("");
  const [inserted, setInserted] = useState<string[]>([]);

  // Filtering is the host's job — the panel renders the field and reports the
  // query, because a section's content can be an opaque render callback the
  // panel cannot search.
  const sections = useMemo(() => {
    const withThumbnails = CATALOG.map((section) => ({
      ...section,
      count: section.items?.length,
      items: section.items?.map((item) => ({
        ...item,
        thumbnail: <Swatch>{item.label}</Swatch>,
        onSelect: () => setInserted((prev) => [item.label, ...prev].slice(0, 3)),
      })),
    }));

    const q = query.trim().toLowerCase();
    if (!q) return withThumbnails;

    return withThumbnails
      .map((section) => ({ ...section, items: section.items?.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((section) => (section.items?.length ?? 0) > 0)
      .map((section) => ({ ...section, count: section.items?.length }));
  }, [query]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="h-[34rem] w-80">
        <ToolPanel
          label="Elements"
          sections={sections}
          searchable
          searchValue={query}
          onSearchChange={setQuery}
          searchLabel="Search elements"
          searchPlaceholder="Search elements"
          tabs={[
            { value: "elements", label: "Elements", icon: <Shapes /> },
            { value: "generate", label: "Generate", icon: <Sparkles /> },
            { value: "uploads", label: "Uploads", icon: <Upload /> },
          ]}
          empty={<p className="text-foreground text-sm">Nothing matches that search.</p>}
          prompt={
            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <Textarea
                aria-label="Describe an element to generate"
                placeholder="Describe an element to generate…"
                className="min-h-16 resize-none"
              />
              <Button type="submit" size="sm" className="self-end">
                Generate
              </Button>
            </form>
          }
        />
      </div>
      <p className="text-muted-foreground text-xs" role="status">
        {inserted.length === 0 ? "Pick a tile to insert it." : `Inserted: ${inserted.join(", ")}`}
      </p>
    </div>
  );
}
