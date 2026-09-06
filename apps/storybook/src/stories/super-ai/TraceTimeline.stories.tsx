import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { Button } from "@/components/ui/button";
import { RenderQueue } from "@/registry/super-ai/render-queue";
import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";
import { TraceTimelineDocs } from "@/content/components/trace-timeline.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TraceTimeline> = {
  title: "Super AI/Trace Timeline",
  component: TraceTimeline,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TraceTimelineDocs) } },
};

export default meta;
type Story = StoryObj<typeof TraceTimeline>;

const BASE_SPANS: TraceSpan[] = [
  { id: "plan", name: "Plan the task", kind: "chain", status: "ok", startMs: 0, durationMs: 400 },
  { id: "search", name: "Search the web", kind: "tool", status: "ok", startMs: 400, durationMs: 900 },
  { id: "read-file", name: "Read repo file", kind: "tool", status: "ok", startMs: 600, durationMs: 500 },
];

const FAILED_CALL: TraceSpan = {
  id: "call-1",
  name: "Call LLM: draft answer",
  kind: "llm",
  status: "error",
  startMs: 1320,
  durationMs: 380,
  error: "Provider timed out after 30s",
};

/**
 * The resting shape: every row closed, and the only thing on screen is the
 * waterfall. Worth reading for what the bars say and a list cannot — `search`
 * starts at 400ms and runs 900ms, `read-file` starts at 600ms and runs 500ms,
 * so their bars visibly overlap. The same three calls as a flat step list
 * would read as three things that happened one after another.
 *
 * Nothing is expanded and nothing looks expandable beyond the chevron, which
 * is deliberate: a trace's first job is the shape of the run, not the
 * contents of any one call.
 */
export const Collapsed: Story = {
  args: { spans: BASE_SPANS, className: "w-[420px]" },
};

/**
 * One row open, which is the maximum — the component holds a single
 * `expandedId`, so opening a row closes whichever was open. What is on screen
 * here is the built-in fallback summary, used because `renderDetail` is
 * omitted; that fallback is what lets this state be demonstrated at all
 * before N5 `run-inspector` exists to fill the seam.
 *
 * Notice that start time appears only here. The row header carries duration
 * and the bar carries position, but "began at 400ms" is spoken nowhere except
 * inside the one row that happens to be open.
 */
export const Expanded: Story = {
  args: { spans: BASE_SPANS, defaultExpandedId: "search", className: "w-[420px]" },
};

/**
 * A failed call, open on its own error. The thing to check is that none of
 * "this failed" rides on the red bar: the row prints `Failed: <error>` as
 * text beside the name, the trigger's explicit `aria-label` repeats the same
 * sentence, and the open detail prints the reason a third time under an
 * `Error` term. The play function asserts the visible string, because colour
 * is the channel a greyscale display, a projector or a red-green deficiency
 * removes.
 *
 * The honest counterweight, which the docs module already records: the
 * *succeeded* rows say so nowhere on screen. `trace-timeline-row-status-text`
 * renders for `error` and `running` only, so success is carried by the tick
 * glyph and the bar colour — a shape as well as a colour, but not a word.
 */
export const Errored: Story = {
  args: {
    spans: [...BASE_SPANS, FAILED_CALL],
    defaultExpandedId: "call-1",
    className: "w-[420px]",
  },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="trace-timeline-row"][data-status="error"]',
    )!;

    // The reason survives with every colour channel thrown away.
    const statusText = row.querySelector<HTMLElement>('[data-slot="trace-timeline-row-status-text"]')!;
    await expect(statusText.textContent).toBe("Failed: Provider timed out after 30s");

    // The axis is decoration and says so, so it is not carrying status either.
    await expect(row.querySelector('[data-slot="trace-timeline-row-track"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    // …and the same sentence reaches a screen reader through the one explicit
    // label rather than through the visible spans, which are all `aria-hidden`.
    const trigger = row.querySelector<HTMLElement>('[data-slot="trace-timeline-row-trigger"]')!;
    await expect(trigger.getAttribute("aria-label")).toBe(
      "Call LLM: draft answer, Failed: Provider timed out after 30s, 380ms",
    );

    // The reason is printed a third time in the open body, so a reader who
    // expanded the row does not have to go back up for it.
    await expect(within(row).getByText("Provider timed out after 30s")).toBeInTheDocument();
  },
};

/**
 * The rule that makes this a record rather than a status board: a retry is a
 * new row, and the attempt it replaced keeps its own row, its own error text
 * and its own bar. Both attempts are named `Call LLM: draft answer`; the
 * `Attempt 1` / `Attempt 2` badges are the only thing telling them apart, and
 * they appear only once a span shares a retry lineage.
 *
 * The fixture puts a `Wait before retry` step between the two attempts,
 * because that is what a backoff looks like in a real trace and because it
 * exposes what the anatomy table cannot: **rows are sorted by start time, so
 * a retry is a sibling but not necessarily an adjacent one.** Measured here,
 * the two attempts are two rows apart.
 *
 * **What that costs a reader who cannot see the list.** The lineage is
 * carried by exactly one channel — the words `Attempt 1` / `Attempt 2` inside
 * each trigger's `aria-label`, plus the shared name. The structure carries
 * none of it: the rows are flat `<li>`s in one `<ul>`, `data-retry-of` is a
 * data attribute and reaches no accessibility API, and there is no
 * `aria-owns`, no nesting and no group. So "Attempt 2" is announced with
 * nothing pointing back at Attempt 1 except a number, across a row that has
 * nothing to do with either. The forward pointer exists and is good — the
 * component derives it in `computeRetriedBy` and the built-in detail prints
 * "Retried by …" — but only for the row that is open, so a reader has to
 * expand the failed attempt to learn it was ever retried. Recorded, not
 * asserted: the repair is structural (a nested list, or an `aria-describedby`
 * from each attempt to its lineage) and is an API decision.
 */
export const RetrySiblings: Story = {
  args: {
    spans: [
      ...BASE_SPANS,
      FAILED_CALL,
      {
        id: "backoff",
        name: "Wait before retry",
        kind: "step",
        status: "ok",
        startMs: 1700,
        durationMs: 300,
      },
      {
        id: "call-2",
        name: "Call LLM: draft answer",
        kind: "llm",
        status: "ok",
        retryOf: "call-1",
        startMs: 2000,
        durationMs: 640,
      },
    ],
    className: "w-[420px]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="trace-timeline-row"]')];

    // Six spans in, six rows out: the failed attempt was not replaced.
    await expect(rows).toHaveLength(6);
    const failed = canvas.getByRole("button", {
      name: "Call LLM: draft answer, Attempt 1, Failed: Provider timed out after 30s, 380ms",
    });
    const succeeded = canvas.getByRole("button", {
      name: "Call LLM: draft answer, Attempt 2, Succeeded, 640ms",
    });

    // Siblings in one flat list, with the backoff step between them — so the
    // attempt number is doing all the work of relating the two.
    const rowIndex = (el: HTMLElement) => rows.findIndex((row) => row.contains(el));
    await expect(rowIndex(succeeded) - rowIndex(failed)).toBe(2);
    await expect(rows[rowIndex(succeeded)]).toHaveAttribute("data-retry-of", "call-1");
    await expect(rows[rowIndex(failed)]).not.toHaveAttribute("data-retry-of");

    // The forward half — who retried this, and how it went — is derived by the
    // component and handed to the open row rather than left as a convention
    // for the host to re-derive by scanning `spans`.
    await userEvent.click(failed);
    const retriedBy = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>(
        '[data-slot="trace-timeline-row-detail-retried-by"]',
      );
      if (!el) throw new Error("no retried-by line in the open row");
      return el;
    });
    await expect(retriedBy.textContent).toBe("Call LLM: draft answer — Succeeded");
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a trace meets in a product, as opposed to the
 * prop combinations above. See docs/design-system/story-conventions.md for
 * which of the eight apply.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * ---------------------------------------------------------------------- */

const RUNNING_SPANS: TraceSpan[] = [
  ...BASE_SPANS,
  {
    id: "call-1",
    name: "Call LLM: draft answer",
    kind: "llm",
    status: "running",
    startMs: 1320,
    durationMs: 900,
  },
];

/**
 * Right-to-left, beside the same trace left-to-right so the two can be read
 * against each other. **The row chrome mirrors and the waterfall does not**,
 * and that split is why this story renders both.
 *
 * What mirrors, correctly and for free, because every part of a row is a flex
 * item plus a gap: the status glyph moves from the row's left edge to its
 * right (measured 13px → 1171px), the chevron and the duration move the other
 * way (391px → 793px), and the open row's detail grid inherits
 * `direction: rtl` so its terms and values swap sides.
 *
 * **The bars do not move.** They are positioned with an inline
 * `style={{ left: … }}`, which is physical and has no logical form as a
 * class, so on a 287px track the first span of the trace (`plan`, at
 * `startMs: 0`) sits 0px from the *left* edge and 219px from the right under
 * both directions, and the last (`call-1`) sits flush against the *right*
 * edge under both. In a right-to-left reading order that puts the run's
 * beginning at the far end of every row and its end at the near end: the axis
 * runs backwards against the text above it. Recorded, not asserted and not
 * fixed here — `insetInlineStart` in JS is a source change rather than the
 * byte-identical class swap CONTINUE.md §8 sanctions, and it is the shape H2
 * `time-ruler` recorded for its tick labels and scrub bubble.
 *
 * One class *was* swapped in this wave, and it repairs nothing today: the
 * trigger's `text-left` became `text-start`. Measured with `text-left` put
 * back, every box in the right-to-left frame is identical to the pixel — the
 * name box spans 872..1159 either way — because every text run in a row
 * either shrink-wraps to its content or overflows its box, and `text-align`
 * does neither. It is taken as drift correction, and the play function reads
 * `textAlign` back so a revert fails on the computed value rather than on a
 * grep.
 *
 * Wave 1's missing `DirectionProvider` costs this component nothing:
 * `Collapsible` is not a Base UI composite, so there is no arrow-key travel
 * to point the wrong way, and nothing here portals, so `dir` on a wrapper is
 * enough and the `RtlDocument` idiom is not needed.
 */
export const RTL: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div dir="rtl" data-testid="rtl-frame">
        <TraceTimeline
          spans={[...BASE_SPANS, FAILED_CALL]}
          defaultExpandedId="call-1"
          className="w-[420px]"
        />
      </div>
      <div dir="ltr" data-testid="ltr-frame">
        <TraceTimeline
          spans={[...BASE_SPANS, FAILED_CALL]}
          defaultExpandedId="call-1"
          className="w-[420px]"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parts = (frameId: string) => {
      const frame = canvas.getByTestId(frameId);
      const trigger = frame.querySelector<HTMLElement>('[data-slot="trace-timeline-row-trigger"]')!;
      return {
        trigger,
        icon: trigger.firstElementChild as HTMLElement,
        chevron: trigger.querySelector<HTMLElement>(":scope > svg")!,
        detail: frame.querySelector<HTMLElement>('[data-slot="trace-timeline-row-detail-fallback"]')!,
      };
    };
    const rtl = parts("rtl-frame");
    const ltr = parts("ltr-frame");

    // The swap, pinned by the computed value: `text-left` reads "left" here.
    await expect(getComputedStyle(rtl.trigger).textAlign).toBe("start");

    // The row reverses: status glyph and chevron trade ends.
    await expect(rtl.icon.getBoundingClientRect().left).toBeGreaterThan(
      rtl.chevron.getBoundingClientRect().left,
    );
    await expect(ltr.icon.getBoundingClientRect().left).toBeLessThan(
      ltr.chevron.getBoundingClientRect().left,
    );

    // The open detail is a grid, so it mirrors with the document.
    await expect(getComputedStyle(rtl.detail).direction).toBe("rtl");
    await expect(getComputedStyle(ltr.detail).direction).toBe("ltr");
  },
};

/**
 * `prefers-reduced-motion`. Two things here move under the default media
 * query, and one was a live offender until this wave: the row chevron is the
 * third of the four rotating chevrons `CONTINUE.md` §8 listed after the E/P
 * wave, at `trace-timeline.tsx:375`.
 *
 * Fixed here as a mechanical repair (spec §3.4): `transition-transform` gains
 * `motion-reduce:transition-none`, the `pricing-table` idiom E1
 * `generation-panel` and F7 `approval-card` already used on the identical
 * shape. A 180° rotation is travel rather than a colour crossfade, so it is
 * the second sanctioned idiom in `story-conventions.md` fact 3 and not the
 * declined one. Measured against the unfixed source, the chevron read
 * `transition-property: transform, translate, scale, rotate` under emulated
 * reduce; it now reads `none`, and the assertions below read that back off
 * the live element rather than trusting the class.
 *
 * **The rotation itself survives, which is the point of suppressing only the
 * tween.** An open row's chevron computes `rotate: 180deg` and a closed one
 * `none`, so the affordance still says which row is open — it just gets there
 * in one frame. (The rotation has to be read from the standalone `rotate`
 * property: Tailwind v4 compiles `rotate-180` to `rotate`, not to
 * `transform`.)
 *
 * The running spinner was already branched before this wave and is asserted
 * to stay that way — a bare `animate-spin motion-reduce:animate-none` on a
 * lucide glyph, where the plain one-class form is correct because nothing
 * here portals and §8's restated `data-open` form does not apply.
 *
 * Two things this component does *not* animate, checked rather than assumed.
 * The Collapsible panel declares neither an animation nor a transition — the
 * vendored `CollapsibleContent` threads no className, so opening a row is a
 * plain mount — and the bars have no growth tween, so a trace arriving after
 * mount simply appears. Not this component's branch either way: the vendored
 * `Button` inside any `renderDetail` body still carries `transition-all` and
 * its one-pixel press nudge, which §8 records as a primitive-wide posture.
 */
export const ReducedMotion: Story = {
  args: { spans: RUNNING_SPANS, defaultExpandedId: "search", className: "w-[420px]" },
  play: async ({ canvasElement }) => {
    const chevronOf = (trigger: HTMLElement) => trigger.querySelector<HTMLElement>(":scope > svg")!;
    const open = canvasElement.querySelector<HTMLElement>(
      '[data-slot="trace-timeline-row-trigger"][aria-expanded="true"]',
    )!;
    const closed = canvasElement.querySelector<HTMLElement>(
      '[data-slot="trace-timeline-row-trigger"][aria-expanded="false"]',
    )!;

    // The tween is gone…
    await expect(getComputedStyle(chevronOf(open)).transitionProperty).toBe("none");
    await expect(getComputedStyle(chevronOf(closed)).transitionProperty).toBe("none");

    // …and the affordance is not. `rotate`, not `transform` — Tailwind v4.
    await expect(getComputedStyle(chevronOf(open)).rotate).toBe("180deg");
    await expect(getComputedStyle(chevronOf(closed)).rotate).toBe("none");

    // The running row's spinner, branched before this wave.
    const spinner = canvasElement
      .querySelector<HTMLElement>('[data-slot="trace-timeline-row"][data-status="running"]')!
      .querySelector("svg")!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");

    // The panel has no keyframe animation to suppress in the first place.
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="trace-timeline-row-detail"]')!;
    await expect(getComputedStyle(panel).animationName).toBe("none");
  },
};

/**
 * The whole trace walked from the top, and the fact the anatomy table cannot
 * show: **a closed row's detail is not merely hidden, it is not in the
 * document.** `renderDetail` here returns a real focusable — a Copy button,
 * which is what N5 `run-inspector`'s raw-JSON panel will actually put there —
 * and with every row closed the page holds four buttons, one per row. Base UI
 * unmounts `Collapsible.Panel`, so nothing inside a closed row is a tab stop,
 * a find-in-page hit or an axe target. That is I2 `property-inspector`'s and
 * J2 `filter-panel`'s shape, third instance, and it is what makes "one tab
 * stop per span" true rather than aspirational: a forty-span trace is forty
 * stops however much each row would expand into.
 *
 * The rest of the order holds no surprises, which is worth pinning too. The
 * bars, the axis, the attempt badge and the duration are inert; opening a row
 * keeps focus on its own trigger; and the detail's stop appears immediately
 * after the trigger that owns it.
 *
 * **Opening a second row removes the first one's stops mid-traversal**, which
 * is the docs module's fourth keyboard bullet, measured here: pressing Enter
 * on row 4 while row 2 is open leaves `Copy search as JSON` nowhere in the
 * document. From the keyboard that is safe, because the only way to open
 * another row is to already be standing on its trigger — focus is never
 * inside the thing that disappears.
 *
 * **The unsafe path is the host's, and it is recorded rather than asserted.**
 * Changing `expandedId` from outside while focus sits inside the open row's
 * detail unmounts that detail and drops focus to `<body>`; measured directly,
 * `document.activeElement` is the body element afterwards and the next Tab
 * restarts at the top of the page. The docs module's second focus bullet
 * already carries the claim and this is the measurement behind it. Pinning it
 * would make the repair — moving focus to the row's trigger on unmount — a
 * failure in this file.
 *
 * Every stop is checked twice: `settledFocusRing` for "does it paint
 * anything", and a differential taken from the stop's own appearance one tab
 * earlier for "did focus cause it". The differential reads box-shadow and
 * border-colour only. `focusTreatmentSignature` also carries `outlineWidth`,
 * which on these controls flips 3px → 1px on focus while `outline-style`
 * reads `none` throughout — J2 `filter-panel`'s fourth hole in that helper,
 * reproduced here on the detail button (`none/3px` → `none/1px`, with nothing
 * painted either time). The vendored `Button`'s ring also fades in exactly as
 * `focus-ring.ts` records: transparent and zero-sized on the frame focus
 * lands, `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` a moment later, which is
 * why the settling check is not optional.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <TraceTimeline
      spans={[...BASE_SPANS, FAILED_CALL]}
      className="w-[420px]"
      renderDetail={(span) => (
        <Button size="sm" variant="outline">
          {`Copy ${span.id} as JSON`}
        </Button>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const paintedFocus = (el: Element) => {
      const style = getComputedStyle(el);
      return `${style.boxShadow}|${style.borderColor}`;
    };
    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="trace-timeline-row-trigger"]'),
    ];
    await expect(triggers).toHaveLength(4);

    // Four rows closed, four buttons on the page: a closed row's detail is
    // not in the document, focusable or otherwise.
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
    await expect(canvas.queryByRole("button", { name: /Copy .+ as JSON/ })).toBeNull();

    for (const stop of triggers) {
      // The baseline is read while focus is still on the previous stop, so the
      // differential costs no blur and cannot disturb the sequence.
      const before = paintedFocus(stop);

      await userEvent.tab();
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      await expect(paintedFocus(stop)).not.toBe(before);
    }

    // The list does not trap.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Opening a row keeps focus on its own trigger, and the body's stop lands
    // immediately after it.
    triggers[1].focus();
    await userEvent.keyboard("{Enter}");
    await expect(document.activeElement).toBe(triggers[1]);
    const detail = await waitFor(() => canvas.getByRole("button", { name: "Copy search as JSON" }));
    await userEvent.tab();
    await expect(document.activeElement).toBe(detail);
    await settledFocusRing(detail, waitFor);

    // Opening another row takes the first row's stop away — from the keyboard
    // that is safe, because focus is on the new trigger by construction.
    triggers[3].focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Copy search as JSON" })).toBeNull());
    await expect(document.activeElement).toBe(triggers[3]);
    await expect(canvas.getByRole("button", { name: "Copy call-1 as JSON" })).toBeInTheDocument();
  },
};

const onFrozenChangeSpy = fn();

/**
 * A real controlled pair, and worth stating plainly because the program has
 * recorded the opposite four times. E4 `preset-grid`, E1 `generation-panel`,
 * J4 `artifact-grid` and J2 `filter-panel` each hold a fold or an expansion
 * in internal state a host can neither read nor restore. **This component is
 * the counter-case:** `expandedId` / `defaultExpandedId` / `onExpandedChange`
 * is a complete trio, so a saved position can be restored on mount *and* held
 * against the user, and the single-open rule falls out of the value's shape
 * rather than out of a hidden state machine.
 *
 * The upper panel proves the refusal half. Its `expandedId` is frozen at
 * `search`, and every click re-renders it — `data-renders` on the root is how
 * the play function confirms a real re-render happened, rather than the DOM
 * merely staying put because React did nothing. Clicking the open row reports
 * `null` and the row stays open; clicking a different row reports that row's
 * id and neither row moves. The lower panel applies what it is told, so the
 * same click moves it, which is the half a frozen host cannot show.
 *
 * One measurement on the payload, because switching rows is where a
 * single-open list usually gets chatty. Moving from `search` to `plan` fires
 * **once**, with `"plan"` — not a `null` for the row being closed followed by
 * an id for the one being opened. A host can treat the argument as the next
 * value rather than as an event to reduce over. The uncontrolled path behaves
 * identically.
 *
 * Not asserted, and recorded in `KeyboardOrder`: a host that collapses the
 * open row while focus is inside its detail drops focus to `<body>`.
 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [frozenRenders, setFrozenRenders] = useState(0);
    const [appliedId, setAppliedId] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-4">
        <div data-testid="frozen">
          <TraceTimeline
            data-renders={frozenRenders}
            spans={BASE_SPANS}
            className="w-[420px]"
            expandedId="search"
            onExpandedChange={(next) => {
              onFrozenChangeSpy(next);
              setFrozenRenders((n) => n + 1);
            }}
          />
        </div>
        <div data-testid="applied">
          <TraceTimeline
            spans={BASE_SPANS}
            className="w-[420px]"
            expandedId={appliedId}
            onExpandedChange={setAppliedId}
          />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    onFrozenChangeSpy.mockClear();
    const canvas = within(canvasElement);
    const frozen = within(canvas.getByTestId("frozen"));
    const applied = within(canvas.getByTestId("applied"));
    const root = canvas.getByTestId("frozen").querySelector('[data-slot="trace-timeline"]')!;

    const frozenSearch = frozen.getByRole("button", { name: "Search the web, Succeeded, 900ms" });
    const frozenPlan = frozen.getByRole("button", { name: "Plan the task, Succeeded, 400ms" });

    // The host's value is what is rendered, from the first frame.
    await expect(root).toHaveAttribute("data-renders", "0");
    await expect(frozenSearch).toHaveAttribute("aria-expanded", "true");

    // Closing the open row reports the intent and moves nothing.
    await userEvent.click(frozenSearch);
    await expect(onFrozenChangeSpy).toHaveBeenCalledTimes(1);
    await expect(onFrozenChangeSpy).toHaveBeenLastCalledWith(null);
    await expect(root).toHaveAttribute("data-renders", "1");
    await expect(frozenSearch).toHaveAttribute("aria-expanded", "true");

    // Switching rows fires once, with the next value — not a close plus an
    // open — and the frozen value still wins on both rows.
    await userEvent.click(frozenPlan);
    await expect(onFrozenChangeSpy).toHaveBeenCalledTimes(2);
    await expect(onFrozenChangeSpy).toHaveBeenLastCalledWith("plan");
    await expect(root).toHaveAttribute("data-renders", "2");
    await expect(frozenPlan).toHaveAttribute("aria-expanded", "false");
    await expect(frozenSearch).toHaveAttribute("aria-expanded", "true");

    // The half a frozen host cannot show: applying the callback moves it.
    const appliedPlan = applied.getByRole("button", { name: "Plan the task, Succeeded, 400ms" });
    await expect(appliedPlan).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(appliedPlan);
    await waitFor(() => expect(appliedPlan).toHaveAttribute("aria-expanded", "true"));
  },
};

/**
 * Emptying the text slots a caller controls, in the three places this
 * component lets you.
 *
 * **An empty `name` deletes the row's identity and nothing notices.** The
 * accessible name is joined from name, attempt, status and duration with
 * `.filter(Boolean)`, so `name: ""` simply drops out and the first row below
 * announces as `"Succeeded, 240ms"` — a control named by its outcome and its
 * length. The visible name span measures 0px wide, so the row is a glyph, a
 * bar and a number. It is not an axe failure, because the button still has a
 * name; it is merely a name that identifies nothing, the same empty-string
 * collapse D3 `context-chips`, I2 `property-inspector`, H7 `stem-mixer` and
 * J2 `filter-panel` each reached from a different direction. Two unnamed
 * spans of equal duration and equal status are indistinguishable to a screen
 * reader, and a trace is exactly where that happens — the failure mode is a
 * loop emitting the same unnamed step.
 *
 * **An error with no `error` string is red and silent.** The second row is
 * `status: "error"` with `error` omitted, so the visible text and the
 * accessible name both read `Failed` and stop. That is the docs module's
 * "colour alone" pitfall arriving from the other side: the text channel is
 * present, it just has nothing in it, and the reason a reader needs sits on
 * the provider's side of an API this component never sees.
 *
 * **An omitted `kind` costs nothing**, which is the one that should be
 * optional: the third row drops its leading glyph and keeps everything that
 * carries meaning. `kind` is documented as driving the icon and never as the
 * only signal of anything, and that holds.
 */
export const EmptyLabel: Story = {
  args: {
    spans: [
      { id: "unnamed", name: "", status: "ok", startMs: 0, durationMs: 240 },
      {
        id: "reasonless",
        name: "Call LLM: draft answer",
        kind: "llm",
        status: "error",
        startMs: 240,
        durationMs: 380,
      },
      { id: "kindless", name: "Read repo file", status: "ok", startMs: 620, durationMs: 500 },
    ],
    className: "w-[420px]",
  },
  play: async ({ canvasElement }) => {
    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="trace-timeline-row-trigger"]'),
    ];

    // The name is gone from both channels, and the button is still named.
    await expect(triggers[0].getAttribute("aria-label")).toBe("Succeeded, 240ms");
    const name = triggers[0].querySelector<HTMLElement>('[data-slot="trace-timeline-row-name"]')!;
    await expect(name.textContent).toBe("");
    await expect(name.getBoundingClientRect().width).toBe(0);

    // The failure states that it failed and cannot say why.
    await expect(triggers[1].getAttribute("aria-label")).toBe("Call LLM: draft answer, Failed, 380ms");
    const status = triggers[1].querySelector<HTMLElement>('[data-slot="trace-timeline-row-status-text"]')!;
    await expect(status.textContent).toBe("Failed");

    // No `kind`, no glyph, everything else intact: status icon and chevron.
    await expect(triggers[2].getAttribute("aria-label")).toBe("Read repo file, Succeeded, 500ms");
    await expect(triggers[2].querySelectorAll("svg")).toHaveLength(2);
  },
};

const LONG_NAME =
  "Call tool: repo.searchFiles({ pattern: '**/*.stories.tsx', maxResults: 200, includeIgnored: false })";
const LONG_ERROR =
  "Provider returned 429 rate_limit_exceeded: retry after 20s, org quota of 40 requests per minute exceeded";

/**
 * A 101-character span name and a 104-character error, which is what a tool
 * call serialised with its arguments and a provider error returned verbatim
 * actually look like. **The two slots make opposite decisions, and both are
 * right.**
 *
 * The name truncates to one line: 622px of text in a 287px box, ellipsised,
 * 20px tall. That keeps every row the same height, which is what makes a
 * waterfall scannable — a trace whose rows grow with the length of a tool
 * argument stops being a chart. The error wraps instead, to three lines and
 * 48px, because a truncated reason is a reason you have to click to read, and
 * the point of printing it in the row is that you do not have to. Nothing
 * scrolls sideways either way: the root's `scrollWidth` and `clientWidth` are
 * both 418px.
 *
 * **The truncated name carries no `title`**, so a pointer user has no way to
 * read the clipped half without opening the row — and nothing in the open row
 * repeats it, because the built-in detail prints status, timing and error
 * while the `<h4>` that would carry the name is `sr-only`. Wave 1 recorded
 * the same missing `title` on D3 `context-chips`' truncated label; this is
 * the second instance, and unlike that one the clipped text is a tool call
 * whose arguments are the part that got cut. Recorded, not fixed: adding a
 * `title` is a source change with a design question attached (a native
 * tooltip on a row that is already a button).
 *
 * The accessible name is unaffected — 221 characters, the whole name plus
 * status plus the whole error. Truncation is paint, not name, which is the
 * one thing keeping this from being a data loss.
 */
export const LongContent: Story = {
  args: {
    spans: [
      { id: "plan", name: "Plan the task", kind: "chain", status: "ok", startMs: 0, durationMs: 400 },
      {
        id: "long",
        name: LONG_NAME,
        kind: "tool",
        status: "error",
        startMs: 400,
        durationMs: 900,
        error: LONG_ERROR,
      },
    ],
    defaultExpandedId: "long",
    className: "w-[420px]",
  },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="trace-timeline-row"][data-status="error"]',
    )!;
    const name = row.querySelector<HTMLElement>('[data-slot="trace-timeline-row-name"]')!;
    const status = row.querySelector<HTMLElement>('[data-slot="trace-timeline-row-status-text"]')!;
    const trigger = row.querySelector<HTMLElement>('[data-slot="trace-timeline-row-trigger"]')!;
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="trace-timeline"]')!;

    // The name clips to a single line, so rows keep a constant height.
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(name.getBoundingClientRect().height).toBeLessThan(24);

    // …and it offers no way to read the clipped half.
    await expect(name).not.toHaveAttribute("title");

    // The reason wraps rather than clipping — more than one line, no overflow.
    await expect(status.scrollWidth).toBe(status.clientWidth);
    await expect(status.getBoundingClientRect().height).toBeGreaterThan(24);

    // Nothing scrolls sideways.
    await expect(root.scrollWidth).toBe(root.clientWidth);

    // Truncation is paint, not name: both full strings reach the tree.
    const label = trigger.getAttribute("aria-label")!;
    await expect(label).toContain(LONG_NAME);
    await expect(label).toContain(LONG_ERROR);
  },
};

/**
 * 375px. There is no responsive layout being squeezed here — a grep for
 * `sm:`, `md:` and `lg:` in `trace-timeline.tsx` is empty — so a phone gets
 * the same single column a 420px card gets, with 45px less of it. What the
 * width actually tests is the row, and the row holds: `scrollWidth` and
 * `clientWidth` are both 375px with a failed row open.
 *
 * The tap targets are why this story earns its place in a component whose
 * rows are its only controls, and they pass with room. Each trigger measures
 * 373×52, and the failed row 373×70 because its reason wraps — well clear of
 * WCAG 2.2's 24×24, which the rails in this registry have generally not
 * managed (A12's collapse trigger measures 45×16 inside J2 `filter-panel`,
 * and A11's row-scope reset is 20×20). A row spanning the whole width of the
 * phone is the cheapest way to clear that floor, and this component gets it
 * by construction rather than by decision.
 *
 * What does *not* survive the narrow width is the axis. The track is 349px
 * here, so a 40ms call inside a two-second trace is floored to
 * `MIN_BAR_WIDTH_PCT` and paints about 5px — visible, as that constant
 * intends, but no longer proportional. The floor is honest at any width and
 * simply bites sooner on a phone; the bars stay decoration (`aria-hidden`)
 * either way, so nothing is lost that only they carry, because nothing is
 * only carried by them.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <TraceTimeline spans={[...BASE_SPANS, FAILED_CALL]} defaultExpandedId="call-1" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The 375px frame, not `canvasElement.firstElementChild` — `layout:
    // "centered"` wraps every story, and measuring the centring div passes
    // for the wrong reason (story-conventions.md, mechanical fact 2).
    const viewport = canvas.getByTestId("viewport");
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="trace-timeline-row-trigger"]'),
    ];
    for (const trigger of triggers) {
      const box = trigger.getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(box.width).toBeGreaterThan(300);
    }
  },
};

/**
 * Beside F6 `render-queue`, the component this one is most often mistaken
 * for: both are lists of named units of work, each with a status, a failure
 * and the word "retry" somewhere in it. Their specs disagree in one sentence
 * each, and that disagreement is the whole choosing rule.
 *
 * - **Render queue** is work you still want done. Its rows are jobs, they
 *   carry the output spec you are about to be billed for, and a failed row
 *   "keeps its spec and offers retry in place" — the retry mutates the row.
 *   The list shrinks as things finish. Its verbs are retry, cancel, download.
 * - **Trace timeline** is a record of work already done. Its rows are events
 *   positioned on a shared time axis, a retry is appended as a sibling and
 *   the failed attempt keeps its row forever, and the list only ever grows.
 *   Its only verb is "look at what happened".
 *
 * So: **if a row can be acted on it is a queue, and if it can only be read it
 * is a trace.** Two consequences fall straight out of that and are visible
 * below. A queue has nowhere to put concurrency, because two jobs that ran at
 * once are still one row each and a table cell has no axis. And a trace has
 * nowhere to put a spec, because what a call cost is N5 `run-inspector`'s
 * job, reached by opening the row.
 *
 * They also appear together: the queue is what you watch, and the trace is
 * what you open when one of its rows went wrong.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[640px] max-w-full flex-col gap-6">
      <TraceTimeline
        spans={[
          FAILED_CALL,
          {
            id: "call-2",
            name: "Call LLM: draft answer",
            kind: "llm",
            status: "ok",
            retryOf: "call-1",
            startMs: 1700,
            durationMs: 640,
          },
        ]}
      />
      <RenderQueue
        jobs={[
          {
            id: "hero",
            name: "hero-cut.mp4",
            spec: { format: "MP4", codec: "H.264", resolution: "1920×1080", fps: 24 },
            stage: "export",
            state: "failed",
            error: "Encoder ran out of disk space",
          },
          {
            id: "teaser",
            name: "teaser-15s.mp4",
            spec: { format: "MP4", codec: "H.264", resolution: "1280×720", fps: 24 },
            stage: "preview",
            state: "done",
            downloadUrl: "#",
          },
        ]}
        onRetry={() => {}}
        onDownload={() => {}}
      />
    </div>
  ),
};
