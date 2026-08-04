import type { Meta, StoryObj } from "@storybook/react-vite";

import { ModelPicker, type ModelPickerModel } from "@/registry/super-ai/model-picker";
import { ModelPickerDocs } from "@/content/components/model-picker.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MODELS: ModelPickerModel[] = [
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    description: "Google's flagship text-to-video model",
    group: "Text → video",
    price: 20,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
  {
    id: "sora-2",
    name: "Sora 2",
    description: "OpenAI's video model with native audio",
    group: "Text → video",
    price: 25,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
  {
    id: "kling-2-5",
    name: "Kling 2.5",
    description: "Image-to-video with strong motion control",
    group: "Image → video",
    price: 15,
    capabilities: ["4K"],
    runtime: "cloud",
  },
  {
    id: "svd-local",
    name: "Stable Video Diffusion",
    description: "Runs entirely on your machine",
    group: "Image → video",
    price: 0,
    capabilities: ["720p"],
    runtime: "local",
    hardware: "12GB VRAM",
  },
];

const meta: Meta<typeof ModelPicker> = {
  title: "Super AI/Model Picker",
  component: ModelPicker,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModelPickerDocs) } },
  args: { models: MODELS, selectedId: "veo-3-1" },
};

export default meta;
type Story = StoryObj<typeof ModelPicker>;

export const Dropdown: Story = { args: { presentation: "dropdown" } };
export const ExpandedCards: Story = { args: { presentation: "expanded-cards" } };
export const NodeInline: Story = { args: { presentation: "node-inline" } };
