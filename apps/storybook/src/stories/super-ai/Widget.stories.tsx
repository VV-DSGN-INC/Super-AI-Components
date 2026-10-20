import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Coins, Play, RotateCw } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { EntityRow } from "@/registry/super-ai/entity-row";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { Widget, WidgetAction } from "@/registry/super-ai/widget";
import { WidgetDocs } from "@/content/components/widget.docs";
import {
  CELL,
  CREDITS_OPEN_LABEL,
  CreditsBody,
  FAILED_OPEN_LABEL,
  FailedBody,
  RUNNING_OPEN_LABEL,
  RunningBody,
} from "@/content/components/widget.examples";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof Widget> = {
  title: "Super AI/Widget",
  component: Widget,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WidgetDocs) } },
  // The tile sizes to its grid item, so every story hands it a cell.
  render: (args) => (
    <div className={CELL[args.size]}>
      <Widget {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Widget>;

const retry = (
  <WidgetAction label="Retry 2 timed-out runs" onClick={() => {}}>
    <RotateCw />
  </WidgetAction>
);

/** One cell. A figure and its caption; the meta sits beside the title. */
export const Small: Story = {
  args: {
    size: "small",
    title: "Credits left",
    icon: <Coins />,
    meta: "Nov 1",
    children: <CreditsBody size="small" />,
  },
};

/** Two cells wide: a figure with its supporting bar, and a header action. */
export const Medium: Story = {
  args: {
    size: "medium",
    title: "Failed overnight",
    icon: <CircleAlert />,
    action: retry,
    children: <FailedBody size="medium" />,
  },
};

/** Two by two: the size that fits a short list with progress. */
export const Large: Story = {
  args: {
    size: "large",
    title: "Running now",
    icon: <Play />,
    meta: "3 runs",
    children: <RunningBody />,
  },
};

/**
 * Only the body is swapped for a skeleton matched to the size; the title, icon
 * and meta render at once, so nothing moves when the data lands.
 */
export const Loading: Story = {
  args: { size: "medium", title: "Running now", icon: <Play />, meta: "3 runs", loading: true },
};

/**
 * The whole tile is one native button named by `openLabel`, which states the
 * fact and the follow-up. Hover and focus change the ring and nothing else.
 */
export const Openable: Story = {
  args: {
    size: "small",
    title: "Credits left",
    icon: <Coins />,
    onOpen: () => {},
    openLabel: CREDITS_OPEN_LABEL,
    children: <CreditsBody size="small" />,
  },
};

/**
 * The header is screen-reader-only, never removed, so the group is still
 * named. The action floats over the body's top end and the body keeps
 * clearance for it.
 */
export const HeaderHidden: Story = {
  args: {
    size: "medium",
    title: "Failed overnight",
    hideHeader: true,
    action: retry,
    children: <FailedBody size="medium" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Failed overnight" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry 2 timed-out runs" })).toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — no value or selection API: the tile shows what it is given and onOpen is a bare intent
 * // case-skip: EmptyLabel — title is a required string, the action's label is required, and openLabel is required with onOpen, so no slot can empty an accessible name
 * ---------------------------------------------------------------------- */

/**
 * Logical placement, not mirrored by hand: the icon moves to the right of the
 * title and the meta and action to the left. The numeric figure keeps its own
 * digit order because digits are not reversed in an RTL run.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className={CELL.medium}>
      <Widget {...args} />
    </div>
  ),
  args: {
    size: "medium",
    title: "Failed overnight",
    icon: <CircleAlert />,
    meta: "26 runs",
    action: retry,
    children: <FailedBody size="medium" />,
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('[data-slot="widget-icon"]')!.getBoundingClientRect();
    const title = canvasElement.querySelector('[data-slot="widget-title"]')!.getBoundingClientRect();
    const action = canvasElement.querySelector('[data-slot="widget-action"]')!.getBoundingClientRect();
    await expect(icon.left).toBeGreaterThanOrEqual(title.right - 1);
    await expect(action.right).toBeLessThanOrEqual(title.left + 1);
  },
};

/**
 * The skeleton pulses with `animate-pulse`, and each bar carries
 * `motion-reduce:animate-none`. The gate's chromium emulates reduced motion, so
 * the read-back is `none`; the header and the open ring do not animate at all.
 */
export const ReducedMotion: Story = {
  args: { size: "large", title: "Running now", icon: <Play />, meta: "3 runs", loading: true },
  play: async ({ canvasElement }) => {
    const bars = canvasElement.querySelectorAll('[data-slot="skeleton"]');
    await expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) await expect(getComputedStyle(bar).animationName).toBe("none");
  },
};

/**
 * Three tiles in a row: an openable tile, a tile with an action, and a plain
 * tile. Tab visits the open button, then the action, and skips the plain tile,
 * because the body clips and holds nothing focusable. Each open tile is one
 * stop and its ring is inset on the overlay itself, so the card clip cannot
 * cut it.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex gap-3">
      <div className={CELL.small}>
        <Widget
          size="small"
          title="Credits left"
          icon={<Coins />}
          onOpen={() => {}}
          openLabel={CREDITS_OPEN_LABEL}
        >
          <CreditsBody size="small" />
        </Widget>
      </div>
      <div className={CELL.medium}>
        <Widget size="medium" title="Failed overnight" icon={<CircleAlert />} action={retry}>
          <FailedBody size="medium" />
        </Widget>
      </div>
      <div className={CELL.small}>
        <Widget size="small" title="Running now" icon={<Play />}>
          <p className="text-2xl font-semibold">3</p>
        </Widget>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole("button", { name: CREDITS_OPEN_LABEL });
    const action = canvas.getByRole("button", { name: "Retry 2 timed-out runs" });
    const stops = [open, action];
    await expect(canvasElement.querySelectorAll("button")).toHaveLength(stops.length);

    for (const expected of stops) {
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(expected));
      await expect((document.activeElement as HTMLElement).matches(":focus-visible")).toBe(true);
    }

    // The open overlay paints an inset ring when focused.
    open.focus();
    await waitFor(() => {
      const shadow = getComputedStyle(open).boxShadow;
      expect(shadow).toMatch(/inset/);
      expect(shadow).toMatch(/\b2px\b/);
    });
  },
};

/**
 * A 90-character title and a long meta against a small tile. The title keeps
 * one line and truncates; the meta truncates too and the title keeps the rest
 * of the row; the body clips at the tile edge and never scrolls. The tile keeps
 * its cell: it does not grow to fit.
 */
export const LongContent: Story = {
  args: {
    size: "small",
    title: "Spring campaign poster variant C, second pass after the content filter review",
    icon: <Play />,
    meta: "Regenerated 2 hours ago",
    children: (
      <p className="text-sm">
        Spring campaign, poster variant C. Prompt: a rooftop garden at golden hour, soft focus, warm film
        grain, 4:5. Regenerated after the content filter flagged the first pass; two timed out before this
        run.
      </p>
    ),
  },
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="widget-title"]')!;
    const content = canvasElement.querySelector<HTMLElement>('[data-slot="widget-content"]')!;
    const tile = canvasElement.querySelector<HTMLElement>('[data-slot="widget"]')!;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    await expect(getComputedStyle(content).overflowY).toBe("hidden");
    await expect(tile.getBoundingClientRect().width).toBeCloseTo(144, 0);
  },
};

/**
 * 375px, two tiles across with a medium tile spanning both. The grid here is a
 * stand-in for the real one (R2): the story proves the tiles fill whatever cell
 * they are handed and nothing scrolls sideways. The wrapper constrains width,
 * not the breakpoint, and the tile has no breakpoint classes, so the two agree.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <div className="grid grid-cols-2 auto-rows-[9rem] gap-3">
        <Widget
          size="small"
          title="Credits left"
          icon={<Coins />}
          onOpen={() => {}}
          openLabel={CREDITS_OPEN_LABEL}
        >
          <CreditsBody size="small" />
        </Widget>
        <Widget
          size="small"
          title="Failed overnight"
          icon={<CircleAlert />}
          onOpen={() => {}}
          openLabel={FAILED_OPEN_LABEL}
        >
          <FailedBody size="small" />
        </Widget>
        <div className="col-span-2">
          <Widget
            size="medium"
            title="Running now"
            icon={<Play />}
            meta="3 runs"
            onOpen={() => {}}
            openLabel={RUNNING_OPEN_LABEL}
          >
            <RunningBody rows={2} />
          </Widget>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * Three ways to show a number, told apart by the shape of the thing:
 *
 * - **Widget**: a tile among same-sized siblings in a grid; one fact, at a
 *   glance, optionally the door to a bigger answer.
 * - **Entity row**: one item in a list: icon, title, description, trailing.
 *   The row grows with its text; a tile never does.
 * - **Stat readout**: label and value pairs inside a panel that already
 *   exists. No tile, no size, nothing to open.
 *
 * The test: if it sits in a grid beside tiles of the same size, it is a
 * widget. If it scrolls with other rows, it is an entity row. If it is a
 * line in a settings or detail panel, it is a stat readout.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium">Widget: one fact in a tile</p>
        <div className={CELL.small}>
          <Widget size="small" title="Credits left" icon={<Coins />}>
            <CreditsBody size="small" />
          </Widget>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium">Entity row: one item in a list</p>
        <EntityRow icon={<Play />} title="Podcast intro, music bed" description="Running, 64%" />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium">Stat readout: pairs inside a panel</p>
        <StatReadout
          items={[
            { label: "Credits left", value: "360" },
            { label: "Plan", value: "2,000" },
            { label: "Resets", value: "Nov 1" },
          ]}
        />
      </section>
    </div>
  ),
};
