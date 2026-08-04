import type { Meta, StoryObj } from "@storybook/react-vite";
import { Layers, Mic, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

import { WhatsNew, type WhatsNewEntry } from "@/registry/super-ai/whats-new";
import { WhatsNewDocs } from "@/content/components/whats-new.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof WhatsNew> = {
  title: "Super AI/Whats New",
  component: WhatsNew,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WhatsNewDocs) } },
};

export default meta;
type Story = StoryObj<typeof WhatsNew>;

function HeroMedia({ icon, caption }: { icon: ReactNode; caption: string }) {
  return (
    <div className="bg-muted text-foreground flex aspect-video w-full flex-col items-center justify-center gap-2">
      <span className="[&_svg]:size-8">{icon}</span>
      <span className="text-xs">{caption}</span>
    </div>
  );
}

const ENTRIES: WhatsNewEntry[] = [
  {
    id: "layers",
    title: "Layer groups",
    date: "12 March 2026",
    dateTime: "2026-03-12",
    stage: "New",
    summary: "Nest layers into a group and move, hide, or export them as one.",
    media: <HeroMedia icon={<Layers aria-hidden />} caption="Grouped layers in the canvas sidebar" />,
    body: "Select any two layers and press Cmd G. Groups nest, and a group carries its own opacity and blend mode.",
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
  },
  {
    id: "batch",
    title: "Batch export",
    date: "14 February 2026",
    dateTime: "2026-02-14",
    summary: "Queue every variant in one pass instead of exporting them one at a time.",
    media: <HeroMedia icon={<PackageOpen aria-hidden />} caption="Six variants queued for export" />,
  },
];

// The left pane: every entry dated on its own row, newest first. The list is
// the tablist that drives the panel beside it.
export const EntryList: Story = {
  args: {
    entries: ENTRIES,
    defaultOpen: true,
    description: "Everything shipped in the last few releases.",
  },
};

// The right pane: hero media first, because that explains the feature faster
// than the copy does. Started on the second entry so the pane is visibly
// driven by the selection rather than just showing the first row.
export const EntryDetail: Story = {
  args: { entries: ENTRIES, defaultOpen: true, defaultSelectedId: "voices" },
};

// Unread is per-entry state the host owns, and the number of dots is what the
// trigger badge counts. Left closed on purpose: the badge is this state's
// payoff, and every open story hides the trigger behind the dialog. Open it
// to see the dots on the first two rows.
export const Unread: Story = {
  args: {
    entries: [{ ...ENTRIES[0], unread: true }, { ...ENTRIES[1], unread: true }, ENTRIES[2]],
    onEntryRead: () => {},
  },
};

// The call-to-action is an action, not a link out: it lands the reader in the
// feature the entry is about.
export const EntryCta: Story = {
  args: {
    entries: [
      { ...ENTRIES[0], cta: { label: "Open the layers panel", onAction: () => {} } },
      { ...ENTRIES[1], cta: { label: "Train a voice", onAction: () => {} } },
      { ...ENTRIES[2], cta: { label: "Open export queue", onAction: () => {} } },
    ],
    defaultOpen: true,
  },
};
