import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ConnectionHint, PortChips, type NodeCatalogEntry } from "@/registry/super-ai/connection-hint";
import { ConnectionHintDocs } from "@/content/components/connection-hint.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const catalog: NodeCatalogEntry[] = [
  {
    kind: "video-generation",
    label: "Video Generation",
    in: ["speech", "audio", "image", "text"],
    out: ["video"],
  },
  { kind: "image-generation", label: "Image Generation", in: ["image", "text"], out: ["image"] },
  { kind: "text-to-speech", label: "Text to Speech", in: ["text"], out: ["speech"] },
  { kind: "lip-sync", label: "Lip Sync", in: ["avatar", "audio", "text"], out: ["video"] },
];

function Host({
  dataType,
  width = 320,
  children,
}: {
  dataType: string;
  width?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-testid="frame"
      style={{ width }}
      className="bg-muted/30 relative h-56 overflow-hidden rounded-lg border"
    >
      {children ?? (
        <ConnectionHint
          dataType={dataType}
          catalog={catalog}
          position={{ x: 16, y: 16 }}
          onPick={() => {}}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
}

const meta: Meta<typeof ConnectionHint> = {
  title: "Super AI/Connection Hint",
  component: ConnectionHint,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ConnectionHintDocs) } },
};

export default meta;
type Story = StoryObj<typeof ConnectionHint>;

/** Dropped an image output on empty canvas: every kind with an image input is offered, first one focused. */
export const WithMatches: Story = { render: () => <Host dataType="image" /> };

/** Dropped a 3D output: nothing in this catalog accepts it, and the dialog says so instead of vanishing. */
export const NoMatches: Story = { render: () => <Host dataType="3d" /> };

/** The chips: IN and OUT rows for a kind, with image satisfied and text open. */
export const Chips: Story = {
  name: "Port Chips",
  render: () => (
    <Host dataType="image">
      <div className="p-4">
        <PortChips in={["image", "text"]} out={["video"]} satisfied={["image"]} />
      </div>
    </Host>
  ),
};

/*
 * Case stories.
 * // case-skip: RTL — the hint is placed by canvas x/y; inside it, rows are flex with the dots leading, which mirror under dir="rtl" with no physical utilities in the file (grep -E "\b(pl|pr|ml|mr|left|right)-" finds none)
 * // case-skip: ReducedMotion — nothing in the tree animates; the file has no transition or animate utility
 * // case-skip: Controlled — no value/onChange pair; onPick is an event, not a value
 * // case-skip: EmptyLabel — labels come from the catalog entries and are required by the type
 * // case-skip: Boundary — the complete path is G7 node-palette, planned for phase 2; the choosing rule lands with it
 */

/** Tab order: first option is focused on mount, Tab walks the rest in catalog order, and the focused option shows the ring. Escape calls onDismiss. */
export const KeyboardOrder: Story = {
  render: () => <Host dataType="text" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const options = canvas.getAllByRole("button");
    await expect(options[0]).toHaveFocus();
    await userEvent.tab();
    await expect(options[1]).toHaveFocus();
    await expect(options[1].matches(":focus-visible")).toBe(true);
    const shadow = getComputedStyle(options[1]).boxShadow;
    await expect(shadow === "none").toBe(false);
  },
};

/** A ~90-character label: the option wraps onto a second line rather than truncating, because the kind name is what the user is choosing by. */
export const LongContent: Story = {
  render: () => (
    <Host dataType="text">
      <ConnectionHint
        dataType="text"
        catalog={[
          {
            kind: "long",
            label:
              "Text to Speech with a voice cloned from the reference audio attached to the upstream node",
            in: ["text"],
            out: ["speech"],
          },
        ]}
        position={{ x: 16, y: 16 }}
        onPick={() => {}}
      />
    </Host>
  ),
};

/** 375px host: the dialog is min-w-40 and grows to its content; the host clips, so nothing scrolls sideways. */
export const Mobile: Story = {
  render: () => <Host dataType="text" width={375} />,
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
