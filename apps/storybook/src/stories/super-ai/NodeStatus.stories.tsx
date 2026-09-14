import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { NodeStatusBadge } from "@/registry/super-ai/node-status";
import { NodeStatusDocs } from "@/content/components/node-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof NodeStatusBadge> = {
  title: "Super AI/Node Status",
  component: NodeStatusBadge,
  parameters: { layout: "centered", docs: { page: componentDocsPage(NodeStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof NodeStatusBadge>;

/** The resting state: a neutral dot and the word. No ring is painted for it. */
export const Idle: Story = { args: { status: "idle" } };

/** Waiting for an upstream node. Same neutral dot as idle; the ring on the card is what says "soon". */
export const Queued: Story = { args: { status: "queued" } };

/** The only status with motion. The word is "Running", not "streaming": copy may diverge from the contract, the union never does. */
export const Streaming: Story = { args: { status: "streaming" } };

/** Finished. Green is the one colour this family adds beyond the type scale. */
export const Done: Story = { args: { status: "done" } };

/** Failed, painted with --destructive through --flow-failed. The card shows the error text; the badge only marks it. */
export const Failed: Story = { args: { status: "failed" } };

/** A plan gate. The label reads "Upgrade to run" because the node is not broken, it is unavailable. */
export const Locked: Story = { args: { status: "locked" } };

/** Header density: the dot alone, the label sr-only, the word in a title. */
export const Compact: Story = { args: { status: "streaming", compact: true } };

/*
 * Case stories.
 * // case-skip: RTL — an inline-flex of a dot and a word with no directional icon; `gap-1` is the only spacing
 * // case-skip: KeyboardOrder — a span with no role, no tabIndex and no handlers; grep confirms zero focusables
 * // case-skip: Controlled — no value/onChange pair; status is a display prop
 * // case-skip: EmptyLabel — the label is derived from the status union and is never optional
 * // case-skip: LongContent — labels are the six fixed words in STATUS_LABEL, none author-supplied
 * // case-skip: Boundary — `grep -l "status" registry/super-ai/*.tsx` finds env-status and run-inspector; both describe a service or a span, neither a graph node
 */

/** The spinner is `motion-safe:animate-spin`, so under prefers-reduced-motion it renders as a still glyph and the status is still legible from the word. */
export const ReducedMotion: Story = {
  args: { status: "streaming" },
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector("[data-slot=node-status-spinner]");
    await expect(spinner).toHaveClass("motion-safe:animate-spin");
  },
};

/** 375px frame, six badges in a row: they wrap rather than scroll, because the wrapper is inline-flex and the row is flex-wrap. */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        {(["idle", "queued", "streaming", "done", "failed", "locked"] as const).map((s) => (
          <NodeStatusBadge key={s} status={s} />
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
