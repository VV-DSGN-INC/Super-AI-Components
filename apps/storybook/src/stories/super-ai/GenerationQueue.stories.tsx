import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { RenderQueue } from "@/registry/super-ai/render-queue";
import { TaskTray } from "@/registry/super-ai/task-tray";
import { GenerationQueueDocs } from "@/content/components/generation-queue.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof GenerationQueue> = {
  title: "Super AI/Generation Queue",
  component: GenerationQueue,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationQueueDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenerationQueue>;

export const Queued: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "queued" },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

export const Running: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "running", progress: 71 },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

export const Done: Story = {
  args: {
    heading: "Generation complete",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "done" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "done" },
    ],
  },
};

export const Failed: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      {
        id: "2",
        title: "Studio portrait, soft light",
        state: "failed",
        errorMessage: "Generation timed out",
      },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "running", progress: 45 },
    ],
    onCancelItem: () => {},
    onRetryItem: () => {},
    onCancelAll: () => {},
  },
};

export const Cancel: Story = {
  args: {
    heading: "Generation cancelled",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      { id: "2", title: "Studio portrait, soft light", state: "cancel" },
      { id: "3", title: "Neon alley, rain reflections", state: "cancel" },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — see docs/design-system/story-conventions.md. Seven of the
 * eight apply to this component, which is why it was chosen for the pilot —
 * `Controlled` joined the convention afterward and is the one that does not.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — items/onCancel/onRetry callbacks are one-way actions, no value/onChange pair
 * `items` and `batchProgress` are inbound render data: a caller-supplied
 * batch of job states the queue displays, not a value a user selects and
 * the component reports back — the `value` read by the vendored `Progress`
 * primitive is this same inbound number, not a controlled prop of the
 * queue's own. `onCancelAll`, `onCancelItem` and `onRetryItem` are one-way
 * action callbacks, never paired with a `value` prop: there is nothing here
 * to re-render unchanged and expect the queue to hold fixed.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Every row is `entity-row`'s icon → title → trailing
 * sequence, and the trailing cluster is itself ordered (percentage, badge,
 * cancel). Under `dir="rtl"` all of that mirrors, and the per-slot progress
 * bar must fill from the right. The batch header's `justify-between` puts
 * the heading and Cancel all on opposite ends, so it mirrors too.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <GenerationQueue {...args} />
    </div>
  ),
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "done" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

/**
 * The reduced-motion path, and the one case story in this file that
 * currently documents a gap rather than a behaviour.
 *
 * Two things in this component move: the `running` row's `Loader2`
 * (`animate-spin`) and the `queued` row's `Skeleton` (`animate-pulse`).
 * Neither branches on `prefers-reduced-motion`, so for a reduced-motion user
 * this renders exactly like `Running` — two indefinite animations that were
 * asked to stop and did not.
 *
 * That is drift, not an open question. Its own near-twin `task-tray` writes
 * `animate-spin motion-reduce:animate-none` on the same lucide spinner. Across
 * `registry/super-ai`, 17 components animate and 3 use `motion-reduce:`.
 * Nothing in the pipeline sees this: `check:tokens` reads colour, and axe does
 * not evaluate the media feature at all.
 */
export const ReducedMotion: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

/**
 * Keyboard traversal down a queue whose rows carry their own actions. The
 * rows are `<li>`s and never focusable themselves — `entity-row` is rendered
 * without `onSelect` precisely so the row is not a button — so the tab
 * sequence is Cancel all, then one control per unresolved row, in list
 * order.
 *
 * The assertion below pins the thing that makes that sequence usable: every
 * per-row control carries a distinct accessible name built from its own
 * title. Three buttons all called "Cancel" is a tab sequence a screen-reader
 * user cannot navigate, and it is what a default `aria-label` would produce.
 *
 * Open gap, deliberately not asserted: where focus goes when a row's Cancel
 * unmounts as that row resolves. The component does not manage that today.
 *
 * The ring check is `expectPerceptibleFocus`, which measures blur and spread
 * rather than asking whether a box-shadow string exists. Every control here
 * clears it — all four take `Button`'s `focus-visible:ring-3` — but only once
 * the ring has finished growing: `transition-all` means the first read after
 * `tab()` returns `0px 0px 0px 0px`, which the helper settles past.
 */
export const KeyboardOrder: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
      { id: "3", title: "Neon alley, rain reflections", state: "failed", errorMessage: "Generation timed out" },
    ],
    onCancelItem: () => {},
    onRetryItem: () => {},
    onCancelAll: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Batch-level control first, then per-row controls in list order.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons[0]).toHaveAccessibleName("Cancel all");

    // Each row's control names its own row. This is the contract that makes
    // the sequence navigable without sight of the list.
    await expect(canvas.getByRole("button", { name: "Cancel Rooftop garden, golden hour" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Cancel Studio portrait, soft light" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry Neon alley, rain reflections" })).toBeInTheDocument();

    // Resolved rows contribute no control at all, so nothing focusable is
    // left behind pointing at work that already finished.
    await expect(buttons).toHaveLength(4);

    // The KeyboardOrder must-show: every stop is visibly focused. The ring is
    // measured rather than merely present — see `expectPerceptibleFocus`.
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(focused);
      await userEvent.tab();
    }
  },
};

/**
 * Everything optional omitted: no `heading`, no per-row `description`, no
 * `batchProgress`. The header collapses entirely rather than reserving empty
 * space, and each row falls back to `entity-row`'s title-only form.
 *
 * This is the shape the component takes when it is embedded in a panel that
 * already has its own heading, which is the common case and which no
 * state-derived story shows.
 */
export const EmptyLabel: Story = {
  args: {
    items: [
      { id: "1", title: "Rooftop garden, golden hour", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", state: "queued" },
    ],
    onCancelItem: () => {},
  },
};

/**
 * Author-supplied strings at length: a 90-character prompt as the row title
 * and a full sentence as `errorMessage`. Titles come from user prompts, so
 * this is the ordinary case rather than the extreme one.
 *
 * Watch the trailing cluster: percentage, badge and cancel are
 * `shrink-0`, so all the pressure lands on the title, and `entity-row`'s
 * truncation is the only thing standing between this and a broken row.
 */
export const LongContent: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      {
        id: "1",
        title: "Rooftop garden at golden hour, shallow depth of field, warm rim light from the west",
        description: "Image · 4:5",
        state: "running",
        progress: 24,
      },
      {
        id: "2",
        title: "Studio portrait, soft key light, neutral seamless backdrop",
        state: "failed",
        errorMessage: "The model timed out after 60 seconds. Nothing was charged for this attempt.",
      },
    ],
    onCancelItem: () => {},
    onRetryItem: () => {},
    onCancelAll: () => {},
  },
};

/**
 * 375px. The root is `max-w-md` (448px), so this is the first width at which
 * the frame is decided by the viewport rather than the component. The
 * trailing cluster is unavoidable — percentage, badge and a 32px control all
 * `shrink-0` — which leaves roughly half the row for a prompt-derived title.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <GenerationQueue {...args} />
    </div>
  ),
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "done" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

/**
 * Three queues that all render rows with a spinner and a cancel button. The
 * rule is not what they look like, it is what a row is accountable for:
 *
 * - **Generation queue** — slots in one batch you just started. Rows are
 *   interchangeable outputs of a single request, so the batch has one
 *   heading and one progress number, and the queue disappears when the batch
 *   resolves.
 * - **Render queue** — jobs that cost money. Every row carries its output
 *   spec as a visible column, because the bill is set by settings chosen
 *   several screens ago and a filename plus a spinner cannot be checked
 *   before it charges you. If a row has a price, it belongs here.
 * - **Task tray** — work that outlived the view that started it. It is
 *   app-shell chrome in a sheet, not a panel inside a surface, and its
 *   justifying state is `needs-input`: a background task blocked on an
 *   approval is invisible work that has silently stopped.
 *
 * The deciding questions, in order: does a row have a price (render queue);
 * does the work survive navigating away (task tray); otherwise generation
 * queue.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Generation queue — slots in one batch</p>
        <GenerationQueue
          heading="Generating 2 images"
          items={[
            { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
            { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
          ]}
          onCancelItem={() => {}}
          onCancelAll={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Render queue — jobs that carry a spec and a price</p>
        <RenderQueue
          jobs={[
            {
              id: "1",
              name: "Rooftop garden, golden hour",
              spec: { format: "MP4", codec: "H.264", resolution: "1920×1080", fps: 30 },
              stage: "export",
              state: "streaming",
              progress: 42,
            },
            {
              id: "2",
              name: "Studio portrait, soft light",
              spec: { format: "MP4", codec: "H.264", resolution: "1280×720", fps: 24 },
              stage: "preview",
              state: "queued",
            },
          ]}
          onCancel={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Task tray — chrome, opened from the shell; the work outlives this view
        </p>
        <TaskTray
          trigger={<Button variant="outline">Tasks</Button>}
          tasks={[
            { id: "1", title: "Relight the product set", description: "Started from Library", status: "running" },
            { id: "2", title: "Batch export, Q3 review", description: "Waiting on approval", status: "needs-input" },
          ]}
          onOpenTask={() => {}}
          onCancelTask={() => {}}
        />
      </section>
    </div>
  ),
};
