import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { TransportControls } from "@/registry/super-ai/transport-controls";
import { TransportControlsDocs } from "@/content/components/transport-controls.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TransportControls> = {
  title: "Super AI/Transport Controls",
  component: TransportControls,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TransportControlsDocs) } },
};

export default meta;
type Story = StoryObj<typeof TransportControls>;

export const Simple: Story = {
  args: {
    variant: "simple",
    currentTime: 12,
    duration: 90,
    speed: 1,
    onPlayPause: () => {},
    onSeek: () => {},
    onSpeedChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Icon-only controls carry real accessible names, not tooltips alone.
    await expect(canvas.getByRole("button", { name: "Play" })).toBeInTheDocument();
    // Elapsed is a field, not a caption — typing a timecode seeks.
    await expect(canvas.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("0:12");
    await expect(canvas.queryByRole("button", { name: "Next frame" })).not.toBeInTheDocument();
  },
};

export const FrameAccurate: Story = {
  args: {
    variant: "frame-accurate",
    currentTime: 12.5,
    duration: 90,
    fps: 24,
    speed: 1,
    inPoint: 2,
    outPoint: 30,
    onPlayPause: () => {},
    onSeek: () => {},
    onStepFrame: () => {},
    onSpeedChange: () => {},
    onMarkIn: () => {},
    onMarkOut: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("00:00:12:12");
    await expect(canvas.getByRole("button", { name: "Mark in point" })).toBeInTheDocument();

    // The load-bearing rule: frame-accurate appends, so the three shared
    // buttons are still the first three, in the same order.
    const order = Array.from(
      canvasElement.querySelectorAll("button[data-slot^='transport-controls-']"),
    ).map((button) => button.getAttribute("data-slot"));
    await expect(order.slice(0, 3)).toEqual([
      "transport-controls-skip-back",
      "transport-controls-play",
      "transport-controls-skip-forward",
    ]);
  },
};
