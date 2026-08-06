"use client";

import { LayoutTemplate } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { TemplateDetail, type TemplateDetailTemplate } from "@/registry/super-ai/template-detail";

/**
 * Decorative stand-in art. `aria-hidden` so a thumbnail's accessible name stays
 * its preview label rather than "Cover Cover".
 */
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

const TEMPLATES: TemplateDetailTemplate[] = [
  {
    id: "pitch",
    title: "Minimal pitch deck",
    description: "Twelve slides, one idea per slide. Built for a ten-minute room.",
    previews: [
      { id: "cover", label: "Cover", media: <Art label="Cover" /> },
      { id: "problem", label: "Problem", media: <Art label="Problem" /> },
      { id: "metrics", label: "Metrics", media: <Art label="Metrics" /> },
      { id: "ask", label: "Ask", media: <Art label="Ask" /> },
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
      {
        id: "length",
        label: "Slides",
        defaultValue: "12",
        hint: "Extra slides are added as blanks after the ask.",
        choices: [
          { value: "8", label: "8 slides" },
          { value: "12", label: "12 slides" },
          { value: "20", label: "20 slides" },
        ],
      },
    ],
    author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
    thumbnail: <Art label="Pitch" />,
  },
  {
    id: "report",
    title: "Quarterly report",
    description: "A print-ready long-form layout with a numbers appendix.",
    previews: [
      { id: "cover", label: "Cover", media: <Art label="Report cover" /> },
      { id: "tables", label: "Tables", media: <Art label="Tables" /> },
    ],
    options: [
      {
        id: "size",
        label: "Paper",
        choices: [
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
        ],
      },
    ],
    author: { id: "dev", name: "Dev Okafor", meta: "31 templates" },
    thumbnail: <Art label="Report" />,
  },
  {
    id: "poster",
    title: "Event poster",
    description: "One loud headline, one date, one QR code.",
    previews: [{ id: "poster", label: "Poster", media: <Art label="Poster" /> }],
    options: [
      {
        id: "size",
        label: "Size",
        choices: [
          { value: "a2", label: "A2" },
          { value: "a1", label: "A1" },
        ],
      },
    ],
    author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
    thumbnail: <Art label="Poster" />,
  },
];

export default function TemplateDetailDemo() {
  const [open, setOpen] = React.useState(false);
  const [committed, setCommitted] = React.useState<string>();

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={() => setOpen(true)}>Preview template</Button>
      {committed ? <p className="text-foreground text-xs">{committed}</p> : null}

      <TemplateDetail
        open={open}
        onOpenChange={setOpen}
        templates={TEMPLATES}
        onUseTemplate={({ templateId, options }) => {
          const name = TEMPLATES.find((entry) => entry.id === templateId)?.title ?? templateId;
          setCommitted(
            `Created ${name} with ${Object.entries(options)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")}`,
          );
          setOpen(false);
        }}
      />
    </div>
  );
}
