import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { RunButton } from "@/registry/super-ai/run-button";
import { RunButtonDocs } from "@/content/components/run-button.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RunButton> = {
  title: "Super AI/Run Button",
  component: RunButton,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RunButtonDocs) } },
};

export default meta;
type Story = StoryObj<typeof RunButton>;

export const Idle: Story = {
  args: {
    state: "idle",
    cost: 4,
    onRun: () => {},
  },
};

export const Estimating: Story = {
  args: {
    state: "estimating",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Generate" })).toBeDisabled();
    await expect(canvas.getByRole("status")).toHaveTextContent("Estimating cost…");
  },
};

export const Running: Story = {
  args: {
    state: "running",
    progress: 60,
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A generation you can't stop burns credits and trust — Cancel has to be reachable.
    const cancel = canvas.getByRole("button", { name: /cancel/i });
    await expect(cancel).not.toBeDisabled();
    await userEvent.click(cancel);
  },
};

export const Done: Story = {
  args: {
    state: "done",
    cost: 4,
    onRun: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Run again" })).toBeInTheDocument();
  },
};

export const Failed: Story = {
  args: {
    state: "failed",
    errorMessage: "The model timed out. No credits were charged.",
    onRun: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The failure reads even with colour removed — the icon and the text both carry it.
    await expect(canvas.getByRole("alert")).toHaveTextContent("The model timed out.");
    await expect(canvas.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  },
};

export const InsufficientCredits: Story = {
  args: {
    state: "insufficient-credits",
    cost: 6,
    balance: 2,
    onBuyCredits: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/need 6 credits, you have 2/i)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
  },
};

export const Locked: Story = {
  args: {
    state: "locked",
    lockedReason: "Video generation is a Pro feature.",
    onUnlock: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Same answer as hero-omnibox's locked state: the CTA replaces the
    // trigger in place, not a separate banner.
    await expect(canvas.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Upgrade to run" }));
  },
};
