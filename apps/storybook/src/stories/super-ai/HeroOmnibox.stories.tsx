import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";
import { HeroOmniboxDocs } from "@/content/components/hero-omnibox.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MODES = [
  { value: "ask", label: "Ask" },
  { value: "build", label: "Build" },
];

const MODELS = [
  { value: "veo-3.1", label: "Veo 3.1" },
  { value: "sora-2", label: "Sora 2" },
];

const meta: Meta<typeof HeroOmnibox> = {
  title: "Super AI/Hero Omnibox",
  component: HeroOmnibox,
  parameters: { layout: "centered", docs: { page: componentDocsPage(HeroOmniboxDocs) } },
};

export default meta;
type Story = StoryObj<typeof HeroOmnibox>;

export const Idle: Story = {
  args: {
    state: "idle",
    modes: MODES,
    mode: "ask",
    models: MODELS,
    model: "veo-3.1",
    cost: 5,
    onSubmit: () => {},
  },
};

export const Focused: Story = {
  args: {
    ...Idle.args,
    state: "focused",
  },
};

export const Generating: Story = {
  args: {
    ...Idle.args,
    state: "generating",
    onStop: () => {},
  },
};

export const Locked: Story = {
  args: {
    state: "locked",
    modes: MODES,
    mode: "ask",
    lockedTitle: "You've hit your plan's limit",
    lockedDescription: "Upgrade to keep generating.",
    lockedCtaLabel: "Upgrade",
    onUnlock: () => {},
  },
};
