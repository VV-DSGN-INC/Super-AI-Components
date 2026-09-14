import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, within } from "storybook/test";

import { AiNode } from "@/registry/super-ai/ai-node";
import { RunButton } from "@/registry/super-ai/run-button";
import { AiNodeDocs } from "@/content/components/ai-node.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const Media = () => <div className="bg-muted aspect-video w-full rounded-md" />;
const base = {
  id: "n1",
  title: "Video",
  modelLabel: "Veo 3.1 Fast",
  runtime: "cloud" as const,
  size: "sm" as const,
};

const meta: Meta<typeof AiNode> = {
  title: "Super AI/AI Node",
  component: AiNode,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiNodeDocs) } },
  args: { ...base, children: <Media /> },
};

export default meta;
type Story = StoryObj<typeof AiNode>;

/** At rest: no ring, a neutral dot in the header, the body showing an empty result. */
export const Idle: Story = { args: { status: "idle" } };

/** Waiting on an upstream node: the queued ring at 40%, nothing else moves. */
export const Queued: Story = { args: { status: "queued" } };

/** Running: the streaming ring and the header spinner. The badge word is "Running". */
export const Streaming: Story = { args: { status: "streaming" } };

/** Finished: no ring, a green dot. The result now lives in media, in phase 2 as result-card. */
export const Done: Story = { args: { status: "done", media: <Media />, children: undefined } };

/** Failed: the destructive ring, and the error banner under the body clamped to three lines. */
export const Failed: Story = {
  args: { status: "failed", error: "Provider rate limit exceeded, retry in 30 seconds." },
};

/** Locked: media and body are replaced by the lock block; pass lockedCta to say what unlocks it. */
export const Locked: Story = {
  args: { status: "locked", lockedCta: <span className="text-xs">Available on the Pro plan.</span> },
};

/** Selected: the ring token wins over the status ring, so a selected running node shows one ring, not two. */
export const Selected: Story = { args: { status: "streaming", selected: true } };

/** The FilmMaker placement: the footer as a pill below the card, outside the group, inside ai-node-frame. */
export const MenuFloating: Story = {
  args: {
    status: "done",
    menuPlacement: "floating",
    footer: <span className="text-muted-foreground text-xs">Veo 3.1 Fast · 16:9 · 720p</span>,
  },
};

/*
 * Case stories.
 * // case-skip: ReducedMotion — the only animation in the tree is node-status's spinner, which carries its own ReducedMotion story
 * // case-skip: KeyboardOrder — the card owns no focusables; every tab stop is slot content and carries its own story (see RunButtonInFooter for E5)
 * // case-skip: Controlled — no value/onChange pair; status and selected are display props
 * // case-skip: Boundary — `grep -l "role=\"group\"" registry/super-ai/*.tsx` finds no other card that names itself by status; result-card is the result, not the node
 */

/** Under dir="rtl" the header's title and badge swap ends and the error banner's icon leads from the right; padding is symmetric so nothing else moves. */
export const RTL: Story = {
  args: { status: "failed", error: "Provider rate limit exceeded, retry in 30 seconds." },
  render: (args) => (
    <div dir="rtl">
      <AiNode {...args} />
    </div>
  ),
};

/** No model label: the header holds only the title and the badge, with the gap intact. */
export const EmptyLabel: Story = { args: { status: "idle", modelLabel: undefined } };

/** A ~90-character title and error: the title stays on one line by the header's flex, the error clamps at three lines. */
export const LongContent: Story = {
  args: {
    status: "failed",
    title: "Video generation from the storyboard frames with the reference audio attached upstream",
    error:
      "The provider rejected the request because the reference image exceeds the maximum resolution accepted by the selected model version.",
  },
};

/** 375px frame with a sm (280px) node: fits with room; md (320px) also fits; lg (420px) is the size that does not, and is not for phones. */
export const Mobile: Story = {
  args: { status: "streaming" },
  render: (args) => (
    <div data-testid="frame" className="w-[375px] overflow-hidden">
      <AiNode {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * Spec risk 1, measured: E5 run-button in the docked footer of a sm (280px) node.
 * The play asserts the footer does not overflow its card. If this assertion
 * fails, do not loosen it: replace the play with a description that records
 * the measured overflow, and add the §8 entry from Task 12 step 6.
 */
export const RunButtonInFooter: Story = {
  args: { status: "idle", footer: <RunButton state="idle" cost={4} onRun={() => {}} /> },
  play: async ({ canvasElement }) => {
    const footer = canvasElement.querySelector("[data-slot=ai-node-footer]") as HTMLElement;
    await expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
  },
};
