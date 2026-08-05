"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WhatsNew, type WhatsNewEntry } from "@/registry/super-ai/whats-new";

/**
 * Live examples for whats-new.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so whats-new.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here and crosses into the docs module as a zero-prop element, so a
 * handler like `onEntryRead` never has to serialize across the boundary.
 */

const ENTRIES: WhatsNewEntry[] = [
  {
    id: "layers",
    title: "Layer groups",
    date: "12 March 2026",
    dateTime: "2026-03-12",
    stage: "New",
    summary: "Nest layers into a group and move them as one.",
    unread: true,
    cta: { label: "Open the layers panel", onAction: () => {} },
  },
  {
    id: "voices",
    title: "Custom voices",
    date: "28 February 2026",
    dateTime: "2026-02-28",
    summary: "Train a voice from a 30-second sample.",
    unread: true,
    cta: { label: "Train a voice", onAction: () => {} },
  },
  {
    id: "batch",
    title: "Batch export",
    date: "14 February 2026",
    summary: "Queue every variant in one pass.",
    cta: { label: "Open export queue", onAction: () => {} },
  },
];

/** Do: the unread count rides on the trigger, and it says the word. */
export function BadgeOnTheTrigger() {
  return <WhatsNew entries={ENTRIES} onEntryRead={() => {}} />;
}

/** Do: the CTA is an action that lands the user in the feature. */
export function CtaLandsInTheFeature() {
  return (
    <div className="bg-popover text-popover-foreground flex w-64 flex-col gap-2 rounded-lg border p-3">
      <p className="text-xs">12 March 2026</p>
      <p className="text-sm font-medium">Layer groups</p>
      <Button size="sm" className="self-start">
        Open the layers panel
      </Button>
    </div>
  );
}

/** Don't: a link out of the product, dressed as the CTA. */
export function CtaLinksToMarketing() {
  return (
    <div className="bg-popover text-popover-foreground flex w-64 flex-col gap-2 rounded-lg border p-3">
      <p className="text-xs">12 March 2026</p>
      <p className="text-sm font-medium">Layer groups</p>
      <a
        href="#"
        className="text-primary inline-flex items-center gap-1 self-start text-sm underline underline-offset-4"
      >
        Read the announcement post
        <ExternalLink aria-hidden className="size-3" />
      </a>
    </div>
  );
}

/** Don't: a dot that only exists as a colour. */
export function UnreadDotAlone() {
  return (
    <div className="bg-popover text-popover-foreground flex w-64 flex-col gap-1 rounded-lg border p-2">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <span className="flex-1 text-sm font-medium">Layer groups</span>
        <span className="bg-primary size-2 rounded-full" />
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <span className="flex-1 text-sm font-medium">Custom voices</span>
        <span className="bg-primary size-2 rounded-full" />
      </div>
    </div>
  );
}
