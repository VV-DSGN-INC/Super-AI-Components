import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlignLeft,
  Bold,
  Copy,
  Crop,
  Gauge,
  Highlighter,
  Italic,
  Link2,
  Lock,
  MessageSquare,
  Palette,
  Scissors,
  Square,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Volume2,
} from "lucide-react";

import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";
import { ContextToolbarDocs } from "@/content/components/context-toolbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const TEXT_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "underline", label: "Underline", icon: <Underline /> },
  { id: "link", label: "Link", icon: <Link2 /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter /> },
];

const IMAGE_ACTIONS: ContextToolbarAction[] = [
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "remove-bg", label: "Remove background", icon: <Scissors /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

const SHAPE_ACTIONS: ContextToolbarAction[] = [
  { id: "fill", label: "Fill", icon: <Palette />, showLabel: true },
  { id: "border", label: "Border", icon: <Square /> },
  { id: "text", label: "Add text", icon: <Type /> },
  { id: "lock", label: "Lock", icon: <Lock /> },
];

const MEDIA_ACTIONS: ContextToolbarAction[] = [
  { id: "trim", label: "Trim", icon: <Scissors /> },
  { id: "volume", label: "Volume", icon: <Volume2 /> },
  { id: "speed", label: "Speed", icon: <Gauge /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
];

/** Twelve verbs — four past the cap, on purpose. */
const OVERSTUFFED: ContextToolbarAction[] = [
  ...TEXT_ACTIONS,
  { id: "strike", label: "Strikethrough", icon: <Strikethrough /> },
  { id: "align", label: "Align left", icon: <AlignLeft /> },
  { id: "comment", label: "Comment", icon: <MessageSquare /> },
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "fill", label: "Fill", icon: <Palette /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

const AI_MENU = (
  <div className="flex flex-col gap-0.5 text-sm">
    <p className="px-2 py-1 text-xs">Where I4 ai-tools-menu is rendered</p>
    <span className="rounded-md px-2 py-1.5">Rewrite</span>
    <span className="rounded-md px-2 py-1.5">Shorten</span>
    <span className="rounded-md px-2 py-1.5">Translate</span>
  </div>
);

const meta: Meta<typeof ContextToolbar> = {
  title: "Super AI/Context Toolbar",
  component: ContextToolbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContextToolbarDocs) } },
  args: { onAction: () => {}, onAiSelect: () => {} },
};

export default meta;
type Story = StoryObj<typeof ContextToolbar>;

/** A text run: the AI entry first, then formatting. */
export const Text: Story = {
  args: { selection: "text", actions: TEXT_ACTIONS, aiMenu: AI_MENU },
};

/** An image: the verbs change, the anatomy does not. */
export const Image: Story = {
  args: { selection: "image", actions: IMAGE_ACTIONS, aiMenu: AI_MENU },
};

/** A shape, with the first label drawn rather than hidden. */
export const Shape: Story = {
  args: { selection: "shape", actions: SHAPE_ACTIONS, aiMenu: AI_MENU },
};

/** A clip on a timeline, flipped below the selection. */
export const Media: Story = {
  args: { selection: "media", placement: "below", actions: MEDIA_ACTIONS, aiMenu: AI_MENU },
};

/** Twelve actions supplied; eight buttons drawn, the rest behind the overflow menu. */
export const Overflow: Story = {
  args: { selection: "text", actions: OVERSTUFFED, aiMenu: AI_MENU },
};
