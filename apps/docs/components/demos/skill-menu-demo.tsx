"use client";

import { FileText, Languages, Mic, Wand2 } from "lucide-react";

import { SkillMenu, type SkillMenuItem } from "@/registry/super-ai/skill-menu";

const SKILLS: SkillMenuItem[] = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Condense a long document into key points",
    icon: <FileText aria-hidden />,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">
          &ldquo;The Q3 report shows revenue up 12%, driven mainly by the new APAC region...&rdquo;
        </p>
      </div>
    ),
  },
  {
    id: "translate",
    title: "Translate",
    description: "Convert text between languages while preserving tone",
    icon: <Languages aria-hidden />,
    cost: 1,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">
          &ldquo;El informe del tercer trimestre muestra un aumento del 12%...&rdquo;
        </p>
      </div>
    ),
  },
  {
    id: "voiceover",
    title: "Generate voiceover",
    description: "Turn a script into narration with a natural-sounding voice",
    icon: <Mic aria-hidden />,
    cost: 4,
    preview: (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">
        Preview: waveform
      </div>
    ),
  },
  {
    id: "remove-bg",
    title: "Remove background",
    description: "Cut a subject out onto a transparent background",
    icon: <Wand2 aria-hidden />,
    preview: (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">
        Preview: cutout result
      </div>
    ),
  },
];

export default function SkillMenuDemo() {
  return <SkillMenu skills={SKILLS} />;
}
