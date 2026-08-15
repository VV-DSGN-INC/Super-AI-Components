import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { RenderQueue } from "@/registry/super-ai/render-queue";
import { TaskTray, type TrayTask } from "@/registry/super-ai/task-tray";
import { TaskTrayDocs } from "@/content/components/task-tray.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TaskTray> = {
  title: "Super AI/Task Tray",
  component: TaskTray,
  // `fullscreen`, not `centered`: the panel is `position: fixed` app-shell
  // chrome pinned to the viewport edge, so a centered canvas would frame
  // empty space beside it and imply the tray sits in the page flow.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(TaskTrayDocs) } },
  // Every story renders the tray already open. A trigger-only story would
  // hand axe an empty canvas, and `preview.tsx` runs a11y at `test: "error"`
  // for each story — an unopened Sheet is a gate that checks nothing.
  args: { open: true },
};

export default meta;
type Story = StoryObj<typeof TaskTray>;

/* Fixture tasks. Background work an assistant of this kind really starts:
 * a render, an approval it cannot proceed past, an index, a migration.
 * Descriptions say where the task came from, which is what makes a row a
 * way back rather than a status line. */
const RENDERING: TrayTask = {
  id: "render-240",
  title: "Render 240 frames at 1080p",
  description: "Timeline · Sequence 4",
  status: "running",
};

const AWAITING_APPROVAL: TrayTask = {
  id: "send-reply",
  title: "Approve the drafted reply before sending",
  description: "Inbox · Support queue",
  status: "needs-input",
};

const INDEXED: TrayTask = {
  id: "index-kb",
  title: "Index 1,240 documents",
  description: "Workspace · Knowledge base",
  status: "done",
};

const MIGRATION_FAILED: TrayTask = {
  id: "migrate-v3",
  title: "Migrate schema to v3",
  description: "Database · Stopped at step 4 of 9",
  status: "failed",
};

/* -------------------------------------------------------------------------
 * Declared states — one export per normalized state.
 *
 * The manifest's `states` are catalog free text, with four separate
 * situations collapsed into one entry ("failed; per-task cancel; opt-in
 * completion notification; empty"). These seven are that text normalized
 * against the real API: the four members of `TaskStatus`, the tray-level
 * empty case, and the two per-task affordances that only exist when their
 * handler is supplied.
 * ---------------------------------------------------------------------- */

export const Running: Story = {
  args: { tasks: [RENDERING, { ...INDEXED, id: "transcribe", title: "Transcribe 3 interviews", status: "running", description: "Library · Uploads" }] },
};

export const NeedsInput: Story = {
  args: { tasks: [RENDERING, AWAITING_APPROVAL, INDEXED] },
};

export const Done: Story = {
  args: { tasks: [INDEXED, { ...INDEXED, id: "export-csv", title: "Export 4 tables to CSV", description: "Reports · Monthly" }] },
};

export const Failed: Story = {
  args: { tasks: [MIGRATION_FAILED, INDEXED] },
};

export const Empty: Story = {
  args: { tasks: [] },
};

export const PerTaskCancel: Story = {
  args: { tasks: [AWAITING_APPROVAL, RENDERING, INDEXED], onCancelTask: () => {} },
};

export const NotifyOptIn: Story = {
  args: {
    tasks: [{ ...RENDERING, notify: true }, { ...AWAITING_APPROVAL, notify: false }, INDEXED],
    onNotifyChange: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written. That is unusual and it is not set-completion: this
 * component is a portaled modal that animates, traps focus, exposes two
 * controlled pairs, has an optional text slot, and has two named near-twins
 * in the catalog (CONTINUE.md §9). Each of the eight below records a fact
 * that exists nowhere else in the repo. No `case-skip` lines follow because
 * none of the eight was skipped.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing three times over: the panel is
 * `side="right"` and must arrive from the logical end, each row's status
 * icon leads while the cancel and notify buttons trail, and the close button
 * is corner-pinned.
 *
 * The wrapper `<div dir="rtl">` that every other case story in this repo
 * uses cannot work here. `SheetContent` renders through `SheetPortal` into
 * the end of `document.body`, so a wrapper in the story canvas is not an
 * ancestor of the thing being tested and inherited `dir` never reaches it.
 * Direction has to be set on the document and put back on unmount.
 */
export const RTL: Story = {
  args: { tasks: [AWAITING_APPROVAL, RENDERING, INDEXED], onCancelTask: () => {}, onNotifyChange: () => {} },
  render: (args) => <RtlDocument>{<TaskTray {...args} />}</RtlDocument>,
};

function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/**
 * The reduced-motion branch, and the reason this component is the house
 * exemplar for it. The running row's spinner is
 * `animate-spin motion-reduce:animate-none`, so under
 * `prefers-reduced-motion: reduce` the icon holds still instead of turning.
 *
 * `vitest.config.ts` emulates that media feature for every test, so the
 * assertion below is the real rendered behaviour rather than a class-name
 * check: the computed `animation-name` resolves to `none`. CONTINUE.md §9
 * records that 14 of the 17 animating components in this catalog omit the
 * class — including `generation-queue` and `render-queue`, this component's
 * near-twins, which use the identical lucide spinner. Run this assertion
 * against either of those and it fails, which is exactly why it is here.
 */
export const ReducedMotion: Story = {
  args: { tasks: [RENDERING, INDEXED] },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const spinner = dialog.querySelector('[data-status="running"] svg');
    await expect(spinner).not.toBeNull();
    await expect(getComputedStyle(spinner as Element).animationName).toBe("none");
  },
};

/**
 * The focus ring, walked once. Order is DOM order — nothing here sets
 * tabindex — so each task contributes its row button, then its notify
 * toggle, then its cancel button, and the Sheet's own close button comes
 * last because `SheetContent` renders it after `children`.
 *
 * The walk is one lap, not a budget. This is a modal Sheet: Base UI traps
 * focus, so tabbing past the close button wraps to the first row and a
 * `while (contains(...))` walk would never terminate. But a fixed allowance
 * of "enough" tabs is the wrong bound too — it makes the count a race, and
 * this story lost it in CI while passing on every local run. See
 * `settledStop` for the mechanism. Because every settled tab moves by exactly
 * one control, `stops.length` tabs from wherever focus lands is a full lap and
 * no more, which is what makes the count provable rather than generous.
 *
 * It still cannot assume where the ring starts. Base UI focuses the first
 * tabbable control on open, but the lap is indexed from whatever it actually
 * lands on, and the closing tab returning there is the proof that focus
 * cycles: an untrapped ring would leave the panel after the close button and
 * never come back to the rows above it.
 *
 * Known gap, deliberately not asserted: with two live tasks the two cancel
 * buttons share the accessible name "Cancel task", and the two notify
 * toggles share theirs. Pinning that with an assertion would make it
 * permanent; it is recorded in the docs module's pitfalls instead. The walk
 * below tells them apart by index rather than by name for the same reason.
 */
export const KeyboardOrder: Story = {
  args: {
    tasks: [AWAITING_APPROVAL, RENDERING],
    onOpenTask: () => {},
    onCancelTask: () => {},
    onNotifyChange: () => {},
  },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");

    // Two live tasks × (row + notify + cancel), plus the Sheet's close.
    const stops = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    await expect(stops).toHaveLength(7);

    // Indexed, because the two cancel buttons share an accessible name and so
    // do the two notify toggles — a name alone cannot identify a stop here.
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.tagName}[${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 24) ?? ""}]`;

    /**
     * The focused control, once the trap has finished moving focus.
     *
     * Reading `document.activeElement` the instant `tab()` resolves is a race
     * against Base UI, not against this component. Tabbing off the last
     * control lands on the popup's trailing focus guard, whose `onFocus`
     * re-enters the panel through `enqueueFocus` — which defers the `focus()`
     * call to a `requestAnimationFrame`. Where a frame has already painted the
     * read returns the row the guard handed focus to; where it has not, it
     * returns the guard. The guard is not a control, so the walk counted it as
     * a miss and the *next* tab stepped over the row the redirect had just
     * landed on — silently, and always the same row, the one focus started on.
     * That is a 6-of-7 that no allowance fixes, because widening the budget
     * only buys more laps that skip the same stop.
     */
    const settledStop = async () => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the panel's controls: ${nameOf(active)}`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(
        `${id} focusVisible=true`,
      );
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // The trap installs asynchronously — wait for it rather than tabbing from
    // wherever focus happens to be when the story mounts.
    const start = await settledStop();
    await assertVisiblyFocused(start);

    const seen = new Set<HTMLElement>([start]);
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = await settledStop();
      // One control per tab, never a repeat — the walk cannot reach seven by
      // circling six.
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
        `${nameOf(focused)} repeat=false`,
      );
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }

    // Every control was reached.
    await expect(seen.size).toBe(stops.length);

    // And the lap closes: the tab after the last control comes back to the
    // first, so the panel cycles rather than leaking focus to the inert page
    // behind it.
    await userEvent.tab();
    await expect(nameOf(await settledStop())).toBe(nameOf(start));
    await expect(dialog.contains(document.activeElement)).toBe(true);
  },
};

/**
 * The per-task notification opt-in, driven from outside. `notify` and
 * `onNotifyChange` are a controlled pair: the toggle renders
 * `aria-pressed={task.notify ?? false}` and calls the handler, but changes
 * nothing itself.
 *
 * The parent below is deliberately a rejecting one — it records the request
 * and re-renders without applying it. That separates the two halves a
 * consumer has to trust: the callback carries the task id and the requested
 * value, and the pressed state stays put until the `tasks` array says
 * otherwise.
 *
 * The re-render is driven from inside the panel rather than by a control
 * beside it. An open Sheet is modal: Base UI marks everything outside the
 * dialog `aria-hidden` and `data-base-ui-inert`, so a button in the story
 * canvas has no accessible role to click while the tray is open. Each click
 * on the toggle appends to the parent's record, which re-renders the tray
 * with `notify` unchanged — which is the render this story needs anyway.
 */
export const Controlled: Story = {
  args: { tasks: [RENDERING] },
  render: () => <RejectingParent />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const canvas = within(canvasElement);

    const bell = await body.findByRole("button", { name: "Notify me when done" });
    await expect(bell).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(bell);

    // The callback carries both halves a consumer needs to apply the change.
    await expect(canvas.getByTestId("notify-calls")).toHaveTextContent("render-240:true");

    // …and the rendered value did not move on its own.
    await expect(await body.findByRole("button", { name: "Notify me when done" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // That click re-rendered the parent without changing `notify`. Clicking
    // again proves the toggle still reads the prop rather than a latched
    // internal value, and still asks for `true` rather than flipping.
    await userEvent.click(await body.findByRole("button", { name: "Notify me when done" }));
    await expect(canvas.getByTestId("notify-calls")).toHaveTextContent(
      "render-240:true,render-240:true",
    );
    await expect(await body.findByRole("button", { name: "Notify me when done" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

function RejectingParent() {
  const [calls, setCalls] = React.useState<string[]>([]);

  return (
    <>
      {/* A probe, not a control: the open Sheet inerts everything out here,
          so this is read by test id rather than by role. */}
      <output data-testid="notify-calls" className="sr-only">
        {calls.join(",")}
      </output>
      <TaskTray
        open
        tasks={[{ ...RENDERING, notify: false }]}
        onNotifyChange={(id, notify) => setCalls((c) => [...c, `${id}:${notify}`])}
      />
    </>
  );
}

/**
 * A task with no `description`. That is the component's only optional text
 * slot, and emptying it does not produce an unlabelled control: `title` is
 * required and remains the row's accessible name.
 *
 * What it does expose is a quiet interaction with the composed primitive.
 * `TaskTray` always hands `EntityRow` a description element — a fragment
 * whose first child is the visually-hidden status word — so the `description
 * ? … : null` branch inside `EntityRow` is never taken, even here. The
 * status still reaches assistive tech, and the row still reserves the
 * description line rather than collapsing to the shorter layout that
 * `EntityRow` renders for its other callers.
 */
export const EmptyLabel: Story = {
  args: {
    tasks: [
      { id: "compress", title: "Compress export bundle", status: "running" },
      RENDERING,
    ],
  },
};

/**
 * A ~90 character task title against a panel that is `sm:max-w-sm`. Both
 * `entity-row-title` and `entity-row-description` are `truncate`, so the
 * answer is a single clipped line with an ellipsis — not a wrap, and not a
 * tooltip. Nothing in the tray reveals the rest of the string.
 *
 * Worth seeing rather than reading, because the trailing cancel and notify
 * buttons are `shrink-0`: they hold their width and the title gives way, so
 * a long title loses more room on a live row than on a finished one.
 */
export const LongContent: Story = {
  args: {
    tasks: [
      {
        id: "reprocess",
        title: "Reprocess every attachment uploaded since the March migration and re-embed them",
        description: "Workspace · Knowledge base · Backfill",
        status: "running",
      },
      MIGRATION_FAILED,
    ],
    onCancelTask: () => {},
    onNotifyChange: () => {},
  },
};

/**
 * 375px. The usual `<div className="w-[375px]">` wrapper is a no-op for this
 * component twice over — the panel is portaled out of the canvas, and it is
 * `position: fixed`, so it measures against the viewport rather than any
 * ancestor. Width has to arrive through `className`, which `TaskTray`
 * forwards to `SheetContent`; tailwind-merge resolves it against the Sheet's
 * own `w-3/4`.
 *
 * At this width a live row is carrying a status icon, two lines of text and
 * two 36px buttons, which is the tightest the layout ever gets — and the
 * reason the title truncates rather than wraps.
 */
export const Mobile: Story = {
  args: {
    tasks: [AWAITING_APPROVAL, RENDERING, INDEXED],
    onCancelTask: () => {},
    onNotifyChange: () => {},
    className: "w-[375px] max-w-full",
  },
};

/**
 * The three queue-shaped components side by side. They look alike — the same
 * lucide spinner, the same `entity-row` — and the rule is about **where the
 * work lives**, not what it looks like:
 *
 * - **Task tray** is app-shell chrome for work that outlives the view that
 *   started it. It is a Sheet, mounted once, reached from anywhere.
 * - **Generation queue** is a panel inside the surface doing the generating.
 *   It shows per-slot and batch progress, because you are watching it.
 * - **Render queue** is the same idea for exports, and its rows carry their
 *   spec and cost so a finished queue is auditable afterwards.
 *
 * If navigating away should not stop you seeing it, it belongs in the tray.
 * If the numbers only mean something while you are on this screen, it does
 * not. Note that only the tray suppresses its spinner under reduced motion —
 * see `ReducedMotion` above, and CONTINUE.md §9.
 */
export const Boundary: Story = {
  args: { tasks: [AWAITING_APPROVAL, RENDERING] },
  render: (args) => (
    <div className="flex w-full max-w-2xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Task tray — app-shell chrome, opens over anything
        </p>
        <TaskTray {...args} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Generation queue — lives in the surface that is generating
        </p>
        <GenerationQueue
          heading="Generating 3 images"
          items={[
            { id: "img-1", title: "Cover art, square", state: "running", progress: 62 },
            { id: "img-2", title: "Cover art, vertical", state: "queued" },
            { id: "img-3", title: "Cover art, widescreen", state: "done" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Render queue — exports, with the spec on the row
        </p>
        <RenderQueue
          jobs={[
            {
              id: "job-1",
              name: "Sequence 4",
              spec: { format: "MP4", codec: "H.264", resolution: "1920×1080", fps: 24 },
              stage: "export",
              state: "streaming",
              progress: 41,
            },
            {
              id: "job-2",
              name: "Sequence 3",
              spec: { format: "MP4", codec: "H.264", resolution: "1920×1080", fps: 24 },
              stage: "preview",
              state: "done",
            },
          ]}
        />
      </section>
    </div>
  ),
};
