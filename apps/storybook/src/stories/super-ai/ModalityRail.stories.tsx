import type { Meta, StoryObj } from "@storybook/react-vite";
import { Layers, Music, Pencil, Settings, Sparkles, Square, Type, Wand2 } from "lucide-react";

import { ModalityRail } from "@/registry/super-ai/modality-rail";
import { ModalityRailDocs } from "@/content/components/modality-rail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ModalityRail> = {
  title: "Super AI/Modality Rail",
  component: ModalityRail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModalityRailDocs) } },
};

export default meta;
type Story = StoryObj<typeof ModalityRail>;

const TOOLS = [
  { id: "select", label: "Select", icon: <Square /> },
  { id: "draw", label: "Draw", icon: <Pencil /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "layers", label: "Layers", icon: <Layers /> },
];

export const Active: Story = {
  args: {
    items: TOOLS,
    activeId: "draw",
  },
};

export const Overflow: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music /> },
      { id: "effects", label: "Effects", icon: <Wand2 /> },
    ],
    activeId: "select",
    maxVisible: 3,
  },
};

export const WithBadge: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music />, badge: "new" },
      { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" },
    ],
    activeId: "draw",
  },
};

export const BottomPinned: Story = {
  args: {
    items: TOOLS,
    activeId: "select",
    pinned: [
      { id: "plugins", label: "Plugins", icon: <Wand2 /> },
      { id: "settings", label: "Settings", icon: <Settings /> },
    ],
  },
};
