"use client";

import { LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateDetail, type TemplateDetailTemplate } from "@/registry/super-ai/template-detail";

/**
 * Live examples for template-detail.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose: the docs
 * module is plain data read by a Server Component, so it cannot carry
 * "use client" itself and cannot create elements that hold event handlers.
 * Every example here is zero-prop, so nothing crosses the server/client
 * boundary except the element itself.
 */

/** Decorative stand-in art, hidden so a tile's accessible name stays its label. */
function Art({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="bg-foreground/10 text-foreground flex h-full w-full items-center justify-center gap-2 text-xs"
    >
      <LayoutTemplate aria-hidden className="size-4" />
      {label}
    </div>
  );
}

const POOL: TemplateDetailTemplate[] = [
  {
    id: "pitch",
    title: "Minimal pitch deck",
    description: "Twelve slides, one idea per slide.",
    previews: [
      { id: "cover", label: "Cover", media: <Art label="Cover" /> },
      { id: "metrics", label: "Metrics", media: <Art label="Metrics" /> },
    ],
    options: [
      {
        id: "size",
        label: "Size",
        choices: [
          { value: "16-9", label: "16:9 widescreen" },
          { value: "4-3", label: "4:3 standard" },
        ],
      },
    ],
    author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
    thumbnail: <Art label="Pitch" />,
  },
  {
    id: "report",
    title: "Quarterly report",
    previews: [{ id: "cover", label: "Cover", media: <Art label="Report" /> }],
    author: { id: "dev", name: "Dev Okafor", meta: "31 templates" },
    thumbnail: <Art label="Report" />,
  },
];

/** Options in the modal, so the commit carries a configured template. */
export function ConfiguredOnTheWayIn() {
  return <TemplateDetail open templates={POOL} onUseTemplate={() => {}} />;
}

/** A pool, so a related tile swaps the modal rather than ending the session. */
export function RelatedSwapsInPlace() {
  return <TemplateDetail open templates={POOL} onUseTemplate={() => {}} onTemplateChange={() => {}} />;
}

/**
 * The anti-pattern: options pushed past the commit, so the modal is a picture
 * with a button and every choice happens on the canvas afterwards.
 */
export function OptionsAfterCommit() {
  return (
    <div className="bg-popover text-popover-foreground flex w-72 flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
      <div className="bg-foreground/10 aspect-video w-full rounded-lg" />
      <p className="text-sm font-medium">Minimal pitch deck</p>
      <Button size="sm">Use this template</Button>
      <p className="text-muted-foreground text-xs">Choose a size after it opens.</p>
    </div>
  );
}

/** The other anti-pattern: one template, no way onward but the close button. */
export function DeadEndModal() {
  return <TemplateDetail open templates={[POOL[0]]} onUseTemplate={() => {}} />;
}
