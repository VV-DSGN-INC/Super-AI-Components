import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  CUT_OFF_PROGRAM,
  generatedBodyLibrary,
  SPEND_PROGRAM,
  TREND_PROGRAM,
} from "@/components/demos/generated-body-demo";
import { GeneratedBody } from "@/registry/super-ai/generated-body";
import { GeneratedBodyDocs } from "@/content/components/generated-body.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof GeneratedBody> = {
  title: "Super AI/Generated Body",
  component: GeneratedBody,
  args: { library: generatedBodyLibrary },
  parameters: { layout: "centered", docs: { page: componentDocsPage(GeneratedBodyDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GeneratedBody>;

/**
 * The stream is open and has delivered the first five lines. The totals block
 * names `s2` and `s3`, which have not arrived yet, so a finished parse would
 * call this program broken. Nothing is judged while `streaming` is true: the
 * body draws what it has and stays quiet.
 */
export const Streaming: Story = {
  args: { program: CUT_OFF_PROGRAM, streaming: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("status")).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="generated-body"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );
  },
};

/** A finished program the library can draw. `onRender` reports it as ok, once. */
export const Rendered: Story = {
  args: { program: SPEND_PROGRAM, onRender: fn() },
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getByText("Credits spent, by project.")).toBeInTheDocument();
    await waitFor(() => expect(args.onRender).toHaveBeenCalledTimes(1));
    await expect(args.onRender).toHaveBeenCalledWith({ ok: true, errors: [] });
  },
};

/**
 * The trend version asks for a `Chart`, which this library does not have. The
 * alert names it, Retry is offered, and the last version that rendered stays
 * under it. The failed body itself is not drawn.
 */
export const FailedWithFallback: Story = {
  args: { program: TREND_PROGRAM, fallbackProgram: SPEND_PROGRAM, onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("status");
    await expect(alert).toHaveTextContent("This version did not render.");
    await expect(alert).toHaveTextContent("Chart is not a component this view can use.");
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(canvasElement.querySelector('[data-slot="generated-body-fallback"]')).toHaveTextContent(
      "Credits spent, by project.",
    );
    await expect(canvasElement.querySelector('[data-slot="generated-body-content"]')).toBeNull();
  },
};

/**
 * The same failure with nothing to fall back to, so the alert is the whole
 * body. The valid lines of the failed program are not shown either: half a
 * view next to an error would read as a view that worked.
 */
export const FailedWithoutFallback: Story = {
  args: { program: TREND_PROGRAM },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("This version did not render.");
    await expect(canvas.queryByRole("button", { name: "Retry" })).toBeNull();
    await expect(canvas.queryByText("Credits spent, by project.")).toBeNull();
  },
};

/* ------------------------------------------------------------------------
 * Case stories. Written: RTL, KeyboardOrder, LongContent, Mobile. Not written,
 * deliberately:
 *
 * // case-skip: ReducedMotion — no keyframes or transitions of its own: `grep -nE "animate-|transition-|motion-|@keyframes" generated-body.tsx` returns nothing, and lines arriving is a re-render the media feature cannot reach
 * // case-skip: Controlled — no value or onChange pair: `program` is read-only input, and `onRender` reports a verdict rather than a value to apply
 * // case-skip: EmptyLabel — no optional text slot: the alert title and Retry label are fixed strings, and the only author-supplied text is the program itself
 * // case-skip: Boundary — no near-twin: view-frame is the chrome around a body and answer-block is prose with citations, so neither renders an OpenUI program
 *
 * The Retry button is the vendored `Button`, which carries `transition-all`;
 * that is the primitive-wide posture CONTINUE.md section 8 records, not
 * something this component adds.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The alert is a two-column grid with the icon in the first
 * column, so it mirrors by itself: the icon moves to the right of the text.
 * Retry sits inside the description rather than in the Alert's action slot,
 * whose `right-2` is physical and would stay on the right. The rendered body
 * mirrors only as far as the caller's library does.
 */
export const RTL: Story = {
  args: { program: TREND_PROGRAM, fallbackProgram: SPEND_PROGRAM, onRetry: fn() },
  render: (args) => (
    <div dir="rtl" data-testid="rtl-frame">
      <GeneratedBody {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector<HTMLElement>('[data-slot="generated-body-failure"]')!;
    const icon = alert.querySelector<SVGElement>(":scope > svg")!;
    const title = alert.querySelector<HTMLElement>('[data-slot="alert-title"]')!;
    // In LTR the icon sits left of the title. Mirrored, it sits right of it.
    await expect(icon.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().left);
  },
};

/**
 * One tab stop, and only on a failure: Retry. The fallback's own content
 * (the caller's library) adds none here because Page, Stats and Table render
 * no controls. Focus must show a ring on Retry, since the vendored `Button`
 * rests with transparent ring layers and a plain `box-shadow !== "none"`
 * check would pass on an element painting nothing.
 */
export const KeyboardOrder: Story = {
  args: { program: TREND_PROGRAM, fallbackProgram: SPEND_PROGRAM, onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const stops = Array.from(canvasElement.querySelectorAll<HTMLElement>("button"));
    await expect(stops).toHaveLength(1);

    await userEvent.tab();
    await expect(document.activeElement).toBe(stops[0]);
    await expect(stops[0]!.matches(":focus-visible")).toBe(true);
    await settledFocusRing(stops[0]!, waitFor);

    await userEvent.keyboard("{Enter}");
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/**
 * The reason carries a component name the model chose, and a model can write
 * a very long one with no break points. The reason breaks anywhere so the
 * alert grows downward and the frame never scrolls sideways.
 */
export const LongContent: Story = {
  args: {
    program: [
      "root = Page([intro, trend])",
      'intro = Markdown("Credits spent, by project.")',
      'trend = AverageCreditsSpentPerProjectPerDayWithRollingSevenDayWindowLineChart("line", days)',
    ].join("\n"),
    fallbackProgram: SPEND_PROGRAM,
    onRetry: fn(),
  },
  render: (args) => (
    <div data-testid="long-frame" className="w-[24rem] max-w-full">
      <GeneratedBody {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="long-frame"]')!;
    const alert = canvasElement.querySelector<HTMLElement>('[data-slot="generated-body-failure"]')!;
    await expect(alert).toHaveTextContent(
      "AverageCreditsSpentPerProjectPerDayWithRollingSevenDayWindowLineChart",
    );
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * 375px, failed with a fallback so the widest thing the component can show is
 * on screen: the alert, Retry and a second render of the table. The wrapper
 * constrains width, not the breakpoint, so this proves the layout squeezed
 * narrow does not scroll sideways.
 */
export const Mobile: Story = {
  args: { program: TREND_PROGRAM, fallbackProgram: SPEND_PROGRAM, onRetry: fn() },
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <GeneratedBody {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(Math.round(frame.getBoundingClientRect().width)).toBe(375);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
