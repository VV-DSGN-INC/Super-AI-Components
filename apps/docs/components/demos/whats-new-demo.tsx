"use client";

import { Layers, Mic, PackageOpen } from "lucide-react";
import * as React from "react";

import { WhatsNew, type WhatsNewEntry } from "@/registry/super-ai/whats-new";

function HeroMedia({ icon, caption }: { icon: React.ReactNode; caption: string }) {
  return (
    <div className="bg-muted text-foreground flex aspect-video w-full flex-col items-center justify-center gap-2">
      <span className="[&_svg]:size-8">{icon}</span>
      <span className="text-xs">{caption}</span>
    </div>
  );
}

export default function WhatsNewDemo() {
  // Unread lives with the host, never inside the component: it is per-user
  // state that has to survive a reload, and only the host can persist it.
  const [unread, setUnread] = React.useState<string[]>(["layers", "voices", "batch"]);
  const [landedIn, setLandedIn] = React.useState<string | null>(null);

  const entries: WhatsNewEntry[] = [
    {
      id: "layers",
      title: "Layer groups",
      date: "12 March 2026",
      dateTime: "2026-03-12",
      stage: "New",
      summary: "Nest layers into a group and move, hide, or export them as one.",
      media: <HeroMedia icon={<Layers aria-hidden />} caption="Grouped layers in the canvas sidebar" />,
      body: "Select any two layers and press Cmd G. Groups nest, and a group carries its own opacity and blend mode.",
      unread: unread.includes("layers"),
      cta: { label: "Open the layers panel", onAction: () => setLandedIn("Layers panel") },
    },
    {
      id: "voices",
      title: "Custom voices",
      date: "28 February 2026",
      dateTime: "2026-02-28",
      stage: "Beta",
      summary: "Train a voice from a 30-second sample and reuse it across every project.",
      media: <HeroMedia icon={<Mic aria-hidden />} caption="Voice training from a short sample" />,
      body: "Voices are workspace-wide, so anyone on the team can narrate with them once you publish.",
      unread: unread.includes("voices"),
      cta: { label: "Train a voice", onAction: () => setLandedIn("Voice trainer") },
    },
    {
      id: "batch",
      title: "Batch export",
      date: "14 February 2026",
      dateTime: "2026-02-14",
      summary: "Queue every variant in one pass instead of exporting them one at a time.",
      media: <HeroMedia icon={<PackageOpen aria-hidden />} caption="Six variants queued for export" />,
      unread: unread.includes("batch"),
      cta: { label: "Open export queue", onAction: () => setLandedIn("Export queue") },
    },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <WhatsNew
        entries={entries}
        description="Everything shipped in the last few releases."
        onEntryRead={(id) => setUnread((ids) => ids.filter((entry) => entry !== id))}
      />
      <p role="status" className="text-muted-foreground h-4 text-xs">
        {landedIn ? `Landed in: ${landedIn}` : null}
      </p>
    </div>
  );
}
