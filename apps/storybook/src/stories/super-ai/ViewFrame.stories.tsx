import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Pin, RotateCw, Undo2, X } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrowserFrame } from "@/registry/super-ai/browser-frame";
import { TableView, type ColumnDef } from "@/registry/super-ai/data-views";
import {
  ViewFrame,
  ViewFrameAction,
  ViewFrameActions,
  ViewFrameContent,
  ViewFrameDescription,
  ViewFrameFoot,
  ViewFrameFooter,
  ViewFrameHeader,
  ViewFrameTitle,
} from "@/registry/super-ai/view-frame";
import { ViewFrameDocs } from "@/content/components/view-frame.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ViewFrame> = {
  title: "Super AI/View Frame",
  component: ViewFrame,
  parameters: { layout: "padded", docs: { page: componentDocsPage(ViewFrameDocs) } },
};

export default meta;
type Story = StoryObj<typeof ViewFrame>;

const RUNS = [
  {
    when: "Tue 02:14",
    project: "Onboarding video",
    prompt: "Scene 3: dashboard tour, slow pan",
    model: "Video HD",
    reason: "Timed out",
    credits: 40,
  },
  {
    when: "Tue 02:31",
    project: "Onboarding video",
    prompt: "Scene 4: settings walkthrough",
    model: "Video HD",
    reason: "Timed out",
    credits: 40,
  },
  {
    when: "Mon 23:05",
    project: "Spring campaign",
    prompt: "Poster variant B, crowd at night",
    model: "Image XL",
    reason: "Content filter",
    credits: 4,
  },
];

/** data-views' table draws a plain table with no scroller of its own, so the
 *  frame's content part stays the one scroll region. */
const RUN_COLUMNS: ColumnDef<(typeof RUNS)[number]>[] = [
  { id: "when", header: "When", cell: (r) => r.when },
  { id: "project", header: "Project", cell: (r) => r.project },
  { id: "prompt", header: "Prompt", cell: (r) => r.prompt },
  { id: "model", header: "Model", cell: (r) => r.model },
  { id: "reason", header: "Reason", cell: (r) => r.reason },
  { id: "credits", header: "Credits", cell: (r) => r.credits, align: "right" },
];

function RunsTable() {
  return (
    <TableView
      items={RUNS.map((r) => ({ ...r, id: r.when }))}
      columns={RUN_COLUMNS}
      className="h-auto overflow-visible"
    />
  );
}

function RunsBoard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {["Timed out", "Content filter"].map((reason) => (
        <section key={reason} aria-label={reason} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{reason}</h3>
          {RUNS.filter((r) => r.reason === reason).map((r) => (
            <div key={r.when} className="rounded-lg border p-3">
              <p>{r.prompt}</p>
              <p className="text-muted-foreground">
                {r.project} · {r.when} · {r.credits} credits
              </p>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function IconActions() {
  return (
    <>
      <ViewFrameAction label="Undo" disabled>
        <Undo2 />
      </ViewFrameAction>
      <ViewFrameAction label="Rerun">
        <RotateCw />
      </ViewFrameAction>
      <ViewFrameAction label="Pin">
        <Pin />
      </ViewFrameAction>
      <ViewFrameAction label="Close">
        <X />
      </ViewFrameAction>
    </>
  );
}

function AskBar() {
  return <Input aria-label="Ask about this view" placeholder="Ask about this view" />;
}

function Frame({
  modes,
  foot,
  body,
  description = "All projects · updated just now",
  title = "Failed runs this week",
  origin = "Made in chat: Track failed runs",
  version = "v2 · board",
}: {
  modes?: React.ReactNode;
  foot?: React.ReactNode;
  body?: React.ReactNode;
  description?: string;
  title?: string;
  origin?: string;
  version?: string;
}) {
  return (
    <ViewFrame title={title}>
      <ViewFrameHeader>
        <ViewFrameTitle>{title}</ViewFrameTitle>
        <ViewFrameDescription>{description}</ViewFrameDescription>
        <ViewFrameActions>
          {modes}
          <IconActions />
        </ViewFrameActions>
      </ViewFrameHeader>
      <ViewFrameContent>{body ?? <RunsTable />}</ViewFrameContent>
      <ViewFrameFoot>{foot}</ViewFrameFoot>
      <ViewFrameFooter origin={origin} version={version} />
    </ViewFrame>
  );
}

/**
 * Docked beside the conversation. The frame is the same component as `Page`;
 * the only difference is the container: a narrow pane with a height. The
 * header wraps at this width, the actions drop to their own row once the
 * title's 14rem floor is hit, and the table scrolls inside the one scroll
 * region rather than widening the pane.
 */
export const Docked: Story = {
  render: () => (
    <div className="flex h-[32rem] gap-4">
      <div className="hidden w-64 shrink-0 rounded-xl border p-4 text-sm lg:block">
        <p className="font-medium">Track failed runs</p>
      </div>
      <div className="w-96 max-w-full">
        <Frame />
      </div>
    </div>
  ),
};

/**
 * Full width, with an ask bar in the foot. The foot is in flow between the
 * body and the footer, so the body gives up height to it and the last row is
 * never covered.
 */
export const Page: Story = {
  render: () => (
    <div className="h-[32rem] w-full">
      <Frame foot={<AskBar />} />
    </div>
  ),
};

/**
 * Two modes over one view. The frame knows nothing about them: the caller
 * renders the vendored `tabs` without panels inside `ViewFrameActions` and
 * swaps the body itself. The footer's version label is the caller's too.
 */
export const WithModes: Story = {
  render: function Render() {
    const [mode, setMode] = React.useState<"table" | "board">("table");
    return (
      <div className="h-[28rem] w-full max-w-3xl">
        <Frame
          modes={
            <Tabs value={mode} onValueChange={(v) => setMode(v as "table" | "board")}>
              <TabsList variant="line">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          body={mode === "table" ? <RunsTable /> : <RunsBoard />}
          version={`v2 · ${mode}`}
        />
      </div>
    );
  },
};

/**
 * The ask-bar slot filled. `ViewFrameFoot` renders nothing at all without
 * children, so the frame without a bar has no empty strip above its footer.
 */
export const WithAskBar: Story = {
  render: () => (
    <div className="h-[28rem] w-full max-w-3xl">
      <Frame foot={<AskBar />} />
    </div>
  ),
};

/**
 * A rerun in flight. The header, actions and footer stay exactly where they
 * were; only the body is a skeleton set the caller renders. The skeleton sits
 * in a `role="status"` so the change is announced, because the frame has no
 * live region of its own.
 */
export const Rerunning: Story = {
  render: () => (
    <div className="h-[28rem] w-full max-w-3xl">
      <Frame
        description="All projects · rerunning"
        body={
          <div role="status" aria-label="Rerunning the view" className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        }
      />
    </div>
  ),
};

/**
 * A run that did not finish. The caller renders the vendored alert with a
 * Retry button inside the body; the chrome keeps its shape, so Close and Undo
 * still work and the footer still says where the view came from.
 */
export const Failed: Story = {
  render: () => (
    <div className="h-[28rem] w-full max-w-3xl">
      <Frame
        body={
          <Alert>
            <CircleAlert aria-hidden />
            <AlertDescription>This view could not run. The runs service did not answer.</AlertDescription>
            <Button className="mt-2 w-fit">Retry</Button>
          </Alert>
        }
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the frame declares no transition, animation or keyframe (grep of view-frame.tsx)
 * The only motion on this page is the vendored `Skeleton`'s `animate-pulse` in
 * `Rerunning` and the vendored `Button`'s `transition-all`, both owned by those
 * primitives and neither guarded by `motion-safe`. That is a finding about the
 * primitives, not something this frame can switch off.
 *
 * // case-skip: Controlled — no value or selection API; the mode tabs are the caller's
 * `ViewFrame` has no `value`/`onChange`. `WithModes` holds its own state in the
 * story, which is the caller's state, not the frame's.
 *
 * // case-skip: EmptyLabel — no optional text slot changes a tap target
 * `ViewFrameAction` requires `label`, and the title and description are not
 * tap targets. The one optional part, the foot, renders nothing without
 * children; `view-frame.test.tsx` pins that.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The actions are end-aligned, so they land at the left, and
 * the footer swaps its ends: origin starts at the right, version sits at the
 * left. The play function pins the footer order by position, not by class.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="h-[28rem] w-full max-w-3xl">
      <Frame foot={<AskBar />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const origin = canvasElement.querySelector('[data-slot="view-frame-origin"]')!;
    const version = canvasElement.querySelector('[data-slot="view-frame-version"]')!;
    await expect(origin.getBoundingClientRect().left).toBeGreaterThan(version.getBoundingClientRect().left);
  },
};

/**
 * Tab order: the header's enabled actions in source order, then the one
 * scroll region (a real tab stop so the arrows can scroll it), then the ask
 * bar in the foot. Undo is disabled here and is skipped. Every stop shows a
 * focus ring.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="h-[28rem] w-full max-w-3xl">
      <Frame foot={<AskBar />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const seen: string[] = [];
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      seen.push(focused.getAttribute("aria-label") ?? focused.tagName);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      await userEvent.tab();
    }
    await expect(seen).toEqual(["Rerun", "Pin", "Close", "View content", "Ask about this view"]);
    await expect(canvas.getByRole("region", { name: "View content" })).toHaveAttribute("tabindex", "0");
  },
};

/**
 * A 90-character title, description, origin and version. The title and the
 * description wrap; the origin truncates and the version label never does, so
 * the version stays visible when the origin is cut. The frame never grows
 * wider than its container.
 */
export const LongContent: Story = {
  render: () => (
    <div className="h-[28rem] w-96 max-w-full" data-testid="long-frame">
      <Frame
        title="Failed runs this week across every project that has used a video model since the last reset"
        description="All projects, including archived ones, with the runs that were retried automatically hidden"
        origin="Made in chat: Track failed runs across every project that has used a video model since the reset"
        version="v12 · board"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement
      .querySelector<HTMLElement>('[data-testid="long-frame"]')!
      .getBoundingClientRect();
    const footer = canvasElement.querySelector('[data-slot="view-frame-footer"]')!.getBoundingClientRect();
    const version = canvasElement.querySelector('[data-slot="view-frame-version"]')!.getBoundingClientRect();
    await expect(footer.right).toBeLessThanOrEqual(box.right + 1);
    await expect(version.right).toBeLessThanOrEqual(footer.right + 1);
    await expect(version.left).toBeGreaterThanOrEqual(footer.left);
  },
};

/**
 * A real phone. The play function resizes the iframe to 375px so the `md`
 * rules apply: the actions leave the title row and wrap on their own full
 * width row below the description, and each icon button is a 44px target. The
 * frame does not scroll sideways; the table scrolls inside the content region.
 */
export const Mobile: Story = {
  render: () => (
    <div className="h-[32rem] w-full" data-testid="mobile-frame">
      <Frame foot={<AskBar />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    // The resize lands after this call returns. Measuring before it does reads
    // the desktop button size, so wait for the phone media query first.
    await waitFor(() => expect(window.matchMedia("(max-width: 767px)").matches).toBe(true));
    const canvas = within(canvasElement);
    const wrap = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(wrap.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const description = canvasElement
      .querySelector('[data-slot="view-frame-description"]')!
      .getBoundingClientRect();
    const actions = canvasElement.querySelector('[data-slot="view-frame-actions"]')!.getBoundingClientRect();
    await expect(actions.top).toBeGreaterThanOrEqual(description.bottom - 1);
    // Wait on the measurement itself: in CI the phone sizes can land a frame
    // after the media query reports a match. A real regression never reaches 44.
    for (const name of ["Rerun", "Pin", "Close"]) {
      const button = canvas.getByRole("button", { name });
      await waitFor(
        () => {
          const rect = button.getBoundingClientRect();
          expect(rect.width).toBe(44);
          expect(rect.height).toBe(44);
        },
        { timeout: 3000 },
      );
    }
  },
};

/**
 * The frame beside its nearest neighbour. Both draw a bordered surface around
 * something that is not the page, and they are not interchangeable:
 *
 * - **Browser frame** says "this came from somewhere else". It is chrome for
 *   external content an agent visited, with an address and no actions.
 * - **View frame** says "this is ours, and you can act on it". It wraps a view
 *   the product generated, with a title, actions you run and a version.
 *
 * If the content is a page the agent fetched, use the browser frame. If the
 * user can rerun, pin or close it, use the view frame.
 */
export const Boundary: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-foreground">Browser frame: a page the agent visited</p>
        <BrowserFrame address="https://example.com/status">
          <div className="flex size-full items-center justify-center bg-muted text-sm text-foreground">
            Captured page
          </div>
        </BrowserFrame>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-foreground">View frame: a view this product made</p>
        <div className="h-72">
          <Frame />
        </div>
      </div>
    </div>
  ),
};
