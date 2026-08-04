import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { PresetGrid, type PresetGridItem } from "@/registry/super-ai/preset-grid";
import { PresetGridDocs } from "@/content/components/preset-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const STYLE_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "photoreal", label: "Photoreal" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
  { id: "claymation", label: "Claymation" },
  { id: "pixel-art", label: "Pixel art" },
];

// Light/mid-tone on purpose: the overlay label always sits on
// `bg-background/80`, so keeping the swatch itself light keeps the blended
// contrast comfortably wide rather than riding the edge of the ratio.
const PALETTE_ITEMS: PresetGridItem[] = [
  { id: "sunset", label: "Sunset orange", color: "#fb923c" },
  { id: "ocean", label: "Ocean blue", color: "#38bdf8" },
  { id: "sage", label: "Sage green", color: "#86efac" },
  { id: "blush", label: "Blush pink", color: "#f9a8d4" },
];

const FILTER_ITEMS: PresetGridItem[] = [
  { id: "vivid", label: "Vivid" },
  { id: "mono", label: "Mono" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
];

const ENVIRONMENT_ITEMS: PresetGridItem[] = [
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "night", label: "Night" },
  { id: "golden-hour", label: "Golden hour" },
];

const meta: Meta<typeof PresetGrid> = {
  title: "Super AI/Preset Grid",
  component: PresetGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PresetGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof PresetGrid>;

export const Style: Story = {
  args: {
    items: STYLE_ITEMS,
    content: "style",
    "aria-label": "Style presets",
    defaultValue: "photoreal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radiogroup", { name: "Style presets" })).toBeInTheDocument();
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "true");

    const sketch = canvas.getByRole("radio", { name: "Sketch" });
    await userEvent.click(sketch);
    await expect(sketch).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "false");
  },
};

export const Palette: Story = {
  args: {
    items: PALETTE_ITEMS,
    content: "palette",
    "aria-label": "Colour presets",
    defaultValue: "ocean",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The colour is never the only carrier of meaning — the accessible name
    // says what it is.
    await expect(canvas.getByRole("radio", { name: "Sunset orange" })).toBeInTheDocument();
    await expect(canvas.getByRole("radio", { name: "Ocean blue" })).toHaveAttribute("aria-checked", "true");
  },
};

export const Filter: Story = {
  args: {
    items: FILTER_ITEMS,
    content: "filter",
    "aria-label": "Filter presets",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mono = canvas.getByRole("radio", { name: "Mono" });
    await expect(mono).toHaveAttribute("aria-checked", "false");
    await userEvent.click(mono);
    await expect(mono).toHaveAttribute("aria-checked", "true");
  },
};

export const Environment: Story = {
  args: {
    items: ENVIRONMENT_ITEMS,
    content: "environment",
    "aria-label": "Environment presets",
    multiple: true,
    defaultValue: ["studio"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Environment presets" })).toBeInTheDocument();
    await expect(canvas.getByRole("checkbox", { name: "Studio" })).toHaveAttribute("aria-checked", "true");

    const night = canvas.getByRole("checkbox", { name: "Night" });
    await userEvent.click(night);
    // Multi-select: choosing a new preset doesn't clear the existing one.
    await expect(night).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("checkbox", { name: "Studio" })).toHaveAttribute("aria-checked", "true");
  },
};

export const SeeMore: Story = {
  args: {
    items: STYLE_ITEMS,
    content: "style",
    "aria-label": "Style presets",
    visibleCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);

    const seeMore = canvas.getByRole("button", { name: /see more/i });
    await userEvent.click(seeMore);

    await expect(canvas.getAllByRole("radio")).toHaveLength(STYLE_ITEMS.length);
    await expect(canvas.queryByRole("button", { name: /see more/i })).not.toBeInTheDocument();
  },
};
