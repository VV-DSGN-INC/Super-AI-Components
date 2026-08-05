import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";

import { TimeRuler } from "@/registry/super-ai/time-ruler";
import { TimeRulerDocs } from "@/content/components/time-ruler.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * The horizontal scroller belongs to the caller — it is what keeps the ruler
 * and the track lanes moving together — so every story supplies one, focusable
 * as axe's `scrollable-region-focusable` requires.
 */
function Scroller({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="focus-visible:ring-ring w-full overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="w-max">{children}</div>
    </div>
  );
}

function Lane({ title }: { title: string }) {
  return (
    <div className="bg-background flex h-10 items-center border-b">
      <span className="bg-primary/15 text-foreground mx-1 flex h-8 flex-1 items-center rounded px-2 text-xs">
        {title}
      </span>
    </div>
  );
}

const meta: Meta<typeof TimeRuler> = {
  title: "Super AI/Time Ruler",
  component: TimeRuler,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TimeRulerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    duration: 90,
    zoom: 40,
    playhead: 21,
    onPlayheadChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TimeRuler>;

const ZOOMS = [
  { zoom: 8, label: "Whole clip — 8 px/s" },
  { zoom: 40, label: "Seconds — 40 px/s" },
  { zoom: 160, label: "Frames — 160 px/s" },
];

/**
 * One number changes. Ticks subdivide, labels thin out rather than colliding —
 * neither density is authored anywhere.
 */
export const ZoomLevels: Story = {
  args: { zoom: 8 },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {ZOOMS.map(({ zoom, label }) => (
        <div key={zoom} className="flex flex-col gap-1">
          <span className="text-foreground text-xs">{label}</span>
          <Scroller label={label}>
            <TimeRuler {...args} zoom={zoom} />
          </Scroller>
        </div>
      ))}
    </div>
  ),
};

/** A half-second grid. Every value the ruler reports lands on it. */
export const Snap: Story = {
  args: { zoom: 40, snap: 0.5, playhead: 21.5 },
  render: (args) => (
    <Scroller label="Timeline, snapping to half seconds">
      <TimeRuler {...args} />
    </Scroller>
  ),
};

/**
 * In and out are a second layer with their own two values — moving them never
 * seeks, and seeking never moves them.
 */
export const InOutRange: Story = {
  args: { zoom: 20, playhead: 30, inPoint: 12, outPoint: 54, onRangeChange: () => {} },
  render: (args) => (
    <Scroller label="Timeline with an export range">
      <TimeRuler
        {...args}
        style={{ "--time-ruler-playhead-height": "112px" } as CSSProperties}
      />
      <Lane title="Interview A — take 3" />
      <Lane title="Room tone" />
    </Scroller>
  ),
};

/** Mid-seek: the timecode is text, and it is announced. */
export const Scrubbing: Story = {
  args: { zoom: 40, playhead: 21.4, scrubbing: true },
  render: (args) => (
    <Scroller label="Timeline, scrubbing">
      <TimeRuler
        {...args}
        style={{ "--time-ruler-playhead-height": "112px" } as CSSProperties}
      />
      <Lane title="Interview A — take 3" />
      <Lane title="Room tone" />
    </Scroller>
  ),
};
