import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { FrameStrip, type FrameStripItem } from "@/registry/super-ai/frame-strip";
import { FrameStripDocs } from "@/content/components/frame-strip.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const FRAMES: FrameStripItem[] = ["00:00:00", "00:00:04", "00:00:08", "00:00:12", "00:00:16"].map(
  (timecode, index) => ({
    id: `f${index + 1}`,
    label: timecode,
    thumbnail: (
      <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />
    ),
  }),
);

const PAGES: FrameStripItem[] = ["1. Title", "2. Problem", "3. Approach", "4. Results"].map((label, index) => ({
  id: `p${index + 1}`,
  label,
  thumbnail: (
    <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />
  ),
}));

const ARTBOARDS: FrameStripItem[] = ["Hero", "Pricing", "Footer"].map((label, index) => ({
  id: `a${index + 1}`,
  label,
  thumbnail: <img src={`https://placehold.co/320x320?text=${label}`} alt="" className="h-full w-full object-cover" />,
}));

const meta: Meta<typeof FrameStrip> = {
  title: "Super AI/Frame Strip",
  component: FrameStrip,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FrameStripDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full px-12">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FrameStrip>;

export const VideoFrames: Story = {
  args: {
    kind: "video",
    items: FRAMES,
    defaultValue: "f2",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Timecodes are the tiles' accessible names, and the active one is
    // programmatic — never the ring alone.
    await expect(canvas.getByRole("button", { name: "00:00:04" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(canvas.getByRole("button", { name: "00:00:12" }));
    await expect(canvas.getByRole("button", { name: "00:00:12" })).toHaveAttribute("aria-current", "true");
  },
};

export const SlidePages: Story = {
  args: {
    kind: "slides",
    items: PAGES,
    defaultValue: "p1",
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Same component, same behaviour — only the tile contents differ.
    await userEvent.click(canvas.getByRole("button", { name: "3. Approach" }));
    await expect(canvas.getByRole("button", { name: "3. Approach" })).toHaveAttribute("aria-current", "true");
    await expect(canvas.getByRole("button", { name: /add page/i })).toBeInTheDocument();
  },
};

export const InOutPicker: Story = {
  args: {
    kind: "video",
    variant: "in-out",
    items: FRAMES,
    defaultInPoint: "f2",
    defaultOutPoint: "f4",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Two marks, each named in words rather than by colour.
    await expect(canvas.getByRole("button", { name: /in point at 00:00:04/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByRole("button", { name: /out point at 00:00:12/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvasElement.querySelectorAll('[data-slot="frame-strip-mark"]')).toHaveLength(2);
  },
};

export const Reorder: Story = {
  args: {
    kind: "artboards",
    items: ARTBOARDS,
    defaultValue: "a1",
    onReorder: () => {},
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Hover-revealed but keyboard-reachable: the controls are in the tab
    // order and disabled only at the ends of the strip.
    await expect(canvas.getByRole("button", { name: /move hero left/i })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /move pricing right/i }));
    await expect(canvas.getByRole("button", { name: /add artboard/i })).toBeInTheDocument();
  },
};

/**
 * 375px. Same vendored-arrow defect C3 `feature-card-row` hit: `-left-12`/
 * `-right-12` puts the controls outside the strip's own box, so a narrow
 * column clips them or scrolls sideways. Reported by O3 independently of
 * O1's report on C3.
 */
export const Mobile: Story = {
  args: {
    kind: "video",
    items: FRAMES,
    defaultValue: "f2",
  },
  render: (args) => (
    <div className="w-[375px] max-w-full overflow-x-hidden">
      <FrameStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const strip = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip"]')!;
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);

    const prev = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip-previous"]')!;
    const stripBox = strip.getBoundingClientRect();
    const prevBox = prev.getBoundingClientRect();
    await expect(prevBox.left).toBeGreaterThanOrEqual(stripBox.left);
    await expect(prevBox.right).toBeLessThanOrEqual(stripBox.right);
  },
};
