"use client";

import { AudioLines, Blocks, Image as ImageIcon } from "lucide-react";

import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

/**
 * Live examples for docs-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onSelect` never has to cross the
 * server/client boundary.
 *
 * These are fragments of the shell rather than whole shells: four page shells
 * stacked down a documentation page would teach nothing the live preview at the
 * top of the page does not already teach.
 */

const PAGE_SECTIONS = [
  {
    label: "Get started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    label: "Generate",
    items: [
      { id: "text-to-image", label: "Text to image" },
      { id: "upscale", label: "Upscale" },
    ],
  },
];

const AREAS = [
  { id: "platform", label: "Platform", icon: <Blocks aria-hidden className="size-4" /> },
  { id: "images", label: "Image models", icon: <ImageIcon aria-hidden className="size-4" /> },
  { id: "audio", label: "Audio models", icon: <AudioLines aria-hidden className="size-4" /> },
];

const PARAGRAPH =
  "Every image request is a POST to /v1/images with a JSON body. The response streams progress events until the final asset URL arrives, so a client can show partial results without polling for them.";

/** Do — the rail switches product area, the nav switches page, and they say so. */
export function TwoNavigationsTwoJobs() {
  return (
    <div className="flex w-full max-w-lg overflow-hidden rounded-lg border">
      <nav aria-label="Product areas (example)" className="bg-sidebar flex flex-col gap-1 border-r p-2">
        {AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-current={area.id === "images" ? "page" : undefined}
            className={
              area.id === "images"
                ? "bg-accent text-accent-foreground flex size-8 items-center justify-center rounded-md"
                : "text-foreground flex size-8 items-center justify-center rounded-md"
            }
          >
            {area.icon}
            <span className="sr-only">{area.label}</span>
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 p-2">
        <SidebarNav aria-label="Pages (example)" sections={PAGE_SECTIONS} activeId="text-to-image" />
      </div>
    </div>
  );
}

/** Don't — one flat list, so "which product" and "which page" become the same question. */
export function OneFlatNavigation() {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border p-2">
      <SidebarNav
        aria-label="Everything (anti-example)"
        sections={[
          {
            label: "Navigation",
            items: [
              { id: "platform", label: "Platform" },
              { id: "images", label: "Image models" },
              { id: "audio", label: "Audio models" },
              { id: "quickstart", label: "Quickstart" },
              { id: "authentication", label: "Authentication" },
              { id: "text-to-image", label: "Text to image" },
            ],
          },
        ]}
        activeId="text-to-image"
      />
    </div>
  );
}

/** Do — the column is measured, so the eye finds the next line without hunting. */
export function ContentIsMeasured() {
  return (
    <div className="w-full rounded-lg border px-4 py-3">
      <p className="max-w-[68ch] text-sm leading-relaxed">{PARAGRAPH}</p>
    </div>
  );
}

/** Don't — full-bleed prose. Every line return is a small act of navigation. */
export function ContentIsStretched() {
  return (
    <div className="w-full rounded-lg border px-4 py-3">
      <p className="w-full text-sm leading-relaxed">{PARAGRAPH}</p>
    </div>
  );
}
