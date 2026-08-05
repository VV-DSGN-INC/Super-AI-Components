import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eraser, Image as ImageIcon, Maximize2, RefreshCw, Sparkles, Trash2, Wand2 } from "lucide-react";

import { AiToolsMenu, type AiToolGroup, type ToolSelection } from "@/registry/super-ai/ai-tools-menu";
import { AiToolsMenuDocs } from "@/content/components/ai-tools-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SELECTION: ToolSelection = {
  label: "Hero shot, layer 3",
  type: "Image",
  icon: <ImageIcon aria-hidden className="size-4" />,
};

const EDIT: AiToolGroup = {
  id: "edit",
  label: "Edit this image",
  actions: [
    {
      id: "remove-bg",
      title: "Remove background",
      description: "Cut the subject out",
      icon: <Eraser aria-hidden className="size-4" />,
    },
    {
      id: "expand",
      title: "Magic expand",
      description: "Paint beyond the frame",
      icon: <Maximize2 aria-hidden className="size-4" />,
      cost: { amount: 17 },
    },
  ],
};

const GENERATE: AiToolGroup = {
  id: "generate",
  label: "Generate from it",
  actions: [
    {
      id: "variations",
      title: "Variations",
      description: "Four more like this",
      icon: <Sparkles aria-hidden className="size-4" />,
      cost: { amount: 55 },
    },
    {
      id: "restyle",
      title: "Restyle",
      description: "Available on Studio",
      icon: <Wand2 aria-hidden className="size-4" />,
      cost: { amount: 900, per: "min" },
      locked: true,
    },
  ],
};

const CAREFUL: AiToolGroup = {
  id: "careful",
  label: "Costly or irreversible",
  destructive: true,
  actions: [
    {
      id: "regenerate",
      title: "Regenerate from scratch",
      description: "Discards every edit on this layer",
      icon: <RefreshCw aria-hidden className="size-4" />,
      cost: { amount: 2400 },
    },
    {
      id: "clear",
      title: "Clear the layer",
      description: "Cannot be undone",
      icon: <Trash2 aria-hidden className="size-4" />,
    },
  ],
};

const meta: Meta<typeof AiToolsMenu> = {
  title: "Super AI/Ai Tools Menu",
  component: AiToolsMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiToolsMenuDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { onAction: () => {}, presentation: "inline", className: "rounded-lg border p-1" },
};

export default meta;
type Story = StoryObj<typeof AiToolsMenu>;

/** Grouped by intent and scoped to the selected object — the selection is the prompt context. */
export const GroupedRows: Story = {
  args: { selection: SELECTION, groups: [EDIT, GENERATE] },
};

/** Each row carries a cost chip where the action spends, including the rate form. */
export const CostChips: Story = {
  args: { selection: SELECTION, groups: [GENERATE] },
};

/** Expensive or irreversible options below a rule, and never signalled by colour alone. */
export const DestructiveGroup: Story = {
  args: { selection: SELECTION, groups: [EDIT, CAREFUL] },
};
