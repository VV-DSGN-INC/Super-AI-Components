import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ReferenceStrip } from "@/registry/super-ai/reference-strip";
import { ReferenceStripDocs } from "@/content/components/reference-strip.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const FILLED_ITEMS = [
  { id: "one", thumbnail: { src: "https://placehold.co/200x200?text=1", alt: "Concept sketch of a lighthouse" } },
  { id: "two", thumbnail: { src: "https://placehold.co/200x200?text=2", alt: "Photo of a coastline at dusk" } },
  { id: "three", thumbnail: { src: "https://placehold.co/200x200?text=3", alt: "Reference of a rope texture" } },
];

const ROLE_ITEMS = [
  {
    id: "first-frame",
    role: "first-frame" as const,
    thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
  },
  { id: "last-frame", role: "last-frame" as const },
  {
    id: "character",
    role: "character" as const,
    thumbnail: { src: "https://placehold.co/200x200?text=Char", alt: "Reference of the main character" },
  },
];

const meta: Meta<typeof ReferenceStrip> = {
  title: "Super AI/Reference Strip",
  component: ReferenceStrip,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ReferenceStripDocs) } },
};

export default meta;
type Story = StoryObj<typeof ReferenceStrip>;

export const Empty: Story = {
  args: {
    items: [],
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No references yet")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /add reference/i })).toBeInTheDocument();
  },
};

export const Filled: Story = {
  args: {
    items: FILLED_ITEMS,
    onMove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByAltText("Concept sketch of a lighthouse")).toBeInTheDocument();
    // No role text on a plain, roleless reference set.
    await expect(canvasElement.querySelector('[data-slot="reference-strip-role"]')).not.toBeInTheDocument();
  },
};

export const WithRoles: Story = {
  args: {
    items: ROLE_ITEMS,
    onAdd: () => {},
    onMove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("First frame")).toBeInTheDocument();
    await expect(canvas.getByText("Character")).toBeInTheDocument();

    // The unfilled "last frame" slot stays visible and actionable.
    const emptySlot = canvas.getByRole("button", { name: /last frame/i });
    await userEvent.click(emptySlot);
  },
};
