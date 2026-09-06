import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import {
  RunInspector,
  type RunInspectorProps,
  type RunInspectorTab,
} from "@/registry/super-ai/run-inspector";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";
import { RunInspectorDocs } from "@/content/components/run-inspector.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { measureContrastAgainstAncestor } from "@/lib/wcag-contrast";

const meta: Meta<typeof RunInspector> = {
  title: "Super AI/Run Inspector",
  component: RunInspector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RunInspectorDocs) } },
};

export default meta;
type Story = StoryObj<typeof RunInspector>;

const INPUT = {
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Draft a one-paragraph release summary." }],
  maxTokens: 256,
};

const OUTPUT = {
  text: "This release ships the run inspector, giving engineers a single place to read a span's input, output, cost, and any retry it went through.",
};

const METADATA = {
  model: "gpt-4o-mini",
  latencyMs: 640,
  tokensIn: 118,
  tokensOut: 54,
  cost: 0.07,
  costUnit: "credits",
  cacheHit: false,
};

/**
 * The tab a run opens on: the request as it was actually sent, pretty-printed
 * and copyable. The play function is the contrast guard, not a demo — the
 * vendored `tabsListVariants` pairs its own `text-muted-foreground` with
 * `bg-muted`, which is 4.34:1 in this token set, so the component rebinds
 * `--muted-foreground` on the list rather than restyling the trigger slots.
 * Remove that one class and this story goes red.
 */
export const InputTab: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA, defaultTab: "input", className: "w-[440px]" },
  play: async ({ canvasElement }) => {
    // RunInspector's TabsList takes tabsListVariants' `default` variant:
    // text-muted-foreground (cva base) on bg-muted (cva default variant) —
    // 4.34:1 in this token set, under the 4.5:1 minimum. A rebound
    // --muted-foreground on the list (below) is what should clear it.
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="run-inspector-tabs"]');
    await expect(list, 'expected a [data-slot="run-inspector-tabs"] element').not.toBeNull();
    const ratio = measureContrastAgainstAncestor(list!);
    await expect(
      ratio,
      `run-inspector-tabs text/background contrast is ${ratio.toFixed(2)}:1, below the 4.5:1 minimum`,
    ).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * The response, in the same pane shape as the request — deliberately, because
 * the two are read against each other. `output` is optional and the empty
 * text says why ("this run may still be in flight"), so a span opened mid-run
 * has a state rather than a blank panel. The Copy button only exists when
 * there is a payload, which is also why the Output tab has three keyboard
 * stops here and two while a run is still going.
 */
export const OutputTab: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA, defaultTab: "output", className: "w-[440px]" },
};

/**
 * Cache state inside the cost row rather than on a row of its own — the
 * spec's second bullet, and the reason to look at this state rather than the
 * types. `cacheHit: true` with `cost: 0` is the pairing that makes the layout
 * argument: the two facts explain each other, and a reader who has to find
 * them in different rows has to do the joining.
 *
 * The grid itself is A10 `stat-readout`, which owns the em-dash for a missing
 * value and the per-row copy control; nothing here restates those.
 */
export const MetadataTab: Story = {
  args: {
    input: INPUT,
    output: OUTPUT,
    metadata: { ...METADATA, cacheHit: true, cost: 0 },
    defaultTab: "metadata",
    className: "w-[440px]",
  },
};

/**
 * A failed call that a later attempt repaired. Retry lineage runs both ways in
 * visible text — `retriedAttempt` is what this run retried, `retriedBy` is
 * what retried it — and neither is inferred from `error`, which is why a run
 * can carry `retriedBy` with no error of its own.
 *
 * Read it for what is *not* here: the panel states what happened and has no
 * place to put what to do about it. There is no action slot, no `aria-live`
 * region anywhere in the component (measured: zero), and no `output`, so the
 * tab strip drops to two stops. The remedy, when there is one, is the
 * `retriedBy` line saying a later attempt succeeded; with `retriedBy`
 * omitted, a reader gets a provider error string and no next step.
 */
export const ErrorTab: Story = {
  args: {
    input: INPUT,
    metadata: METADATA,
    defaultTab: "error",
    error: "Provider timed out after 30s",
    retriedAttempt: { id: "call-0", name: "Call LLM: draft summary", status: "error" },
    retriedBy: { id: "call-2", name: "Call LLM: draft summary (retry)", status: "ok" },
    className: "w-[440px]",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations one span's record meets in a real trace, as
 * opposed to the four tabs above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The skip:
 *
 * // case-skip: ReducedMotion — a grep of registry/super-ai/run-inspector.tsx for `animate-`, `transition-` and `motion-` returns no match; the only motion beneath it is vendored, and both instances are recorded postures rather than this component's: the `Button` behind Copy carries `transition-all` with `active:not-aria-[haspopup]:translate-y-px` (CONTINUE.md §8, "the vendored Button moves on press with no reduced-motion branch" — explicitly not a thing a case story fixes), and `TabsTrigger` carries `transition-all` over background, text colour and `data-active:shadow-sm`, which is the colour-crossfade case fact 3 excludes because nothing changes position. The `after:transition-opacity` underline on that trigger never fires here at all: it is gated on `group-data-[variant=line]`, and this component takes the default variant.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two halves, and they do not have the same answer.
 *
 * **The chrome mirrors.** The tab strip is a plain flex row, so Input paints
 * at the right edge and Error at the left (measured: Input 1089..1197, Error
 * 763..872). The Error tab's dot was the one physical class in the file —
 * `ml-1`, swapped to `ms-1` in this wave — and the swap is asserted below
 * rather than trusted, following H3 `track-lane`: with `ml-1` the 4px landed
 * on the dot's outer edge and the word sat 6px from it (the trigger's own
 * `gap-1.5`) instead of the 10px it gets in LTR, so the dot drifted toward
 * the neighbouring tab.
 *
 * **The payload does not, and that is the finding.** The `pre` inherits
 * `direction: rtl`, so bidi resolves each JSON line as neutrals wrapped
 * around one Latin run and moves the neutrals to the paragraph edge. Measured
 * on line 2 of this exact input: LTR puts the opening quote of `"model"` at
 * x27 and the line's trailing comma at x186, 159px to its right; RTL puts the
 * quote at x1165 and the same comma at x1006, **159px to its left**. The
 * braces do the same — `{` lands at the far right of its line. The JSON is
 * still copyable and still correct in the clipboard, but read on screen it is
 * no longer the JSON that was sent. The fix is `dir="ltr"` on the `pre`
 * (source code is not prose and has no reading direction of its own), which
 * is not one of the swaps §3.4 sanctions, so it is recorded here rather than
 * taken.
 *
 * **Arrow keys are also direction-blind**, the registry-wide missing
 * `DirectionProvider`: ArrowRight moves from Input to Output, which under RTL
 * paints to the *left*. Measured, not asserted — pinning it would fix the
 * wrong behaviour in place.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <RunInspector {...args} />
    </div>
  ),
  args: {
    input: INPUT,
    output: OUTPUT,
    metadata: METADATA,
    defaultTab: "input",
    error: "Provider timed out after 30s",
    className: "w-[440px]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    // The strip mirrors: reading order right to left is Input, Output,
    // Metadata, Error.
    const lefts = tabs.map((t) => t.getBoundingClientRect().left);
    await expect(lefts[0]).toBeGreaterThan(lefts[1]);
    await expect(lefts[1]).toBeGreaterThan(lefts[2]);
    await expect(lefts[2]).toBeGreaterThan(lefts[3]);

    // The `ms-1` swap, pinned on both the resolved side and the painted gap.
    // `ml-1` would put the 4px on marginLeft here and leave the word 6px away.
    const errorTab = tabs[3];
    const dot = errorTab.querySelector<HTMLElement>("span.rounded-full")!;
    const word = errorTab.querySelector<HTMLElement>('span[aria-hidden="true"]')!;
    const dotStyle = getComputedStyle(dot);
    await expect(dotStyle.marginRight).toBe("4px");
    await expect(dotStyle.marginLeft).toBe("0px");
    await expect(dot.getBoundingClientRect().right).toBeLessThan(word.getBoundingClientRect().left);
    await expect(Math.round(word.getBoundingClientRect().left - dot.getBoundingClientRect().right)).toBe(10);
  },
};

/**
 * The whole lap, and it is one longer than a reader expects. Three stops on a
 * tab with a payload — the strip, the open panel, the Copy button — and two
 * on Metadata and Error, because Copy only exists where there is JSON to
 * copy. The strip is one stop whatever the tab count: three of the four tabs
 * carry `tabindex="-1"`, which is asserted here because it is the only reason
 * a four-tab panel does not cost four stops.
 *
 * The middle stop is Base UI's `Tabs.Panel`, which takes `tabIndex=0` even
 * though it holds focusable content, and it is the trap wave 1 recorded on
 * I1 `tool-panel`: the vendored `ui/tabs.tsx` styles it `outline-none` and
 * adds no `focus-visible` ring, so the stop is invisible. Measured here:
 * `outline-style: none`, `box-shadow: none`. It is filtered out of the ring
 * check rather than asserted in either direction — the component's own docs
 * already record the gap, and pinning it green or red is the move the
 * convention forbids. Every other stop must paint something, checked with
 * `settledFocusRing` because the Copy button's `transition-all` fades its
 * ring in and an immediate read is a false negative (all five ring layers
 * still `rgba(0, 0, 0, 0) 0px 0px 0px 0px` on the frame focus lands).
 *
 * Arrows highlight without switching, which is the half of the tab contract
 * worth stating: this Base UI version defaults `activateOnFocus` to `false`,
 * so ArrowRight moves focus to Output while `aria-selected` stays on Input
 * and the input panel stays mounted. Enter is what commits.
 */
export const KeyboardOrder: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA, defaultTab: "input", className: "w-[440px]" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="run-inspector"]')!;
    const tabs = canvas.getAllByRole("tab");

    // Roving tabindex: one stop for four tabs.
    await expect(tabs.filter((t) => t.getAttribute("tabindex") !== "-1")).toHaveLength(1);

    tabs[0].focus();
    const stops: string[] = [];
    for (let i = 0; i < 5; i++) {
      const focused = document.activeElement as HTMLElement;
      if (!root.contains(focused)) break;
      stops.push(focused.getAttribute("data-slot") ?? focused.tagName.toLowerCase());
      if (focused.getAttribute("role") !== "tabpanel") {
        await settledFocusRing(focused, waitFor);
      }
      await userEvent.tab();
    }

    // The lap, in order. `run-inspector-input-panel` is the stop nobody
    // predicts and the one with no ring.
    await expect(stops).toEqual(["tabs-trigger", "run-inspector-input-panel", "button"]);

    // One tab past Copy leaves the component entirely — nothing traps.
    await expect(root.contains(document.activeElement)).toBe(false);

    // Arrows move the highlight; they do not activate.
    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(tabs[1]);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await expect(canvasElement.querySelector('[data-slot="run-inspector-input-panel"]')).not.toBeNull();

    // Enter is what commits the highlight.
    await userEvent.keyboard("{Enter}");
    await waitFor(async () => {
      await expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });
    await expect(canvasElement.querySelector('[data-slot="run-inspector-output-panel"]')).not.toBeNull();

    // Home and End reach the ends of the strip.
    await userEvent.keyboard("{End}");
    await expect(document.activeElement).toBe(tabs[3]);
    await userEvent.keyboard("{Home}");
    await expect(document.activeElement).toBe(tabs[0]);
  },
};

// A host that hears every tab request and applies none. The request log is
// real state, so each refused click re-renders the inspector with `tab`
// unchanged — the third thing a controlled component has to survive, and the
// one that catches a second internal copy of the value drifting out of step.
function PinnedInspector(args: RunInspectorProps) {
  const [requests, setRequests] = React.useState<RunInspectorTab[]>([]);

  return (
    <div className="flex w-[440px] flex-col gap-2">
      <RunInspector {...args} tab="input" onTabChange={(next) => setRequests((prev) => [...prev, next])} />
      <p data-testid="requests" className="text-foreground text-xs">
        {requests.join(" · ") || "no requests yet"}
      </p>
    </div>
  );
}

/**
 * `tab` / `onTabChange` driven from outside, pinned to Input. A four-tab
 * inspector is exactly where this matters: a host that wants to deep-link a
 * span to its error tab, or hold every inspector on a trace to the same tab
 * while the user walks the waterfall, has to own the value.
 *
 * All three clauses are asserted. Clicking Metadata does not move the
 * rendered tab; `onTabChange` carries the whole next tab id rather than a
 * delta, so the host can apply it without reconstructing the interaction; and
 * the re-render each refusal causes leaves the panel where it was. The source
 * is why it holds — `currentTab` reads `tab ?? internalTab` and the internal
 * setter is skipped whenever `tab` is supplied, so there is no second copy to
 * fall out of step.
 *
 * The keyboard path goes through the same callback, which is worth pinning
 * separately: arrow-then-Enter is a different code path from a click, and
 * only Enter reaches `onValueChange`.
 */
export const Controlled: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA },
  render: (args) => <PinnedInspector {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByTestId("requests");
    const tabs = canvas.getAllByRole("tab");

    await expect(log).toHaveTextContent("no requests yet");

    await userEvent.click(tabs[2]);
    await waitFor(async () => {
      await expect(log).toHaveTextContent("metadata");
    });
    // Refused: the rendered tab has not moved, and the panel beneath it is
    // still the input pane.
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    await expect(canvasElement.querySelector('[data-slot="run-inspector-input-panel"]')).not.toBeNull();
    await expect(canvasElement.querySelector('[data-slot="run-inspector-metadata-panel"]')).toBeNull();

    // The keyboard path reaches the same callback, and is refused the same way.
    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await waitFor(async () => {
      await expect(log).toHaveTextContent("metadata · output");
    });
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await expect(canvasElement.querySelector('[data-slot="run-inspector-input-panel"]')).not.toBeNull();
  },
};

/**
 * `tabsLabel=""`. The tab list is the component's one optional text slot, and
 * an empty string is not the same as omitting it: a default parameter only
 * fills in for `undefined`, so `""` reaches `aria-label` intact and the
 * `tablist` ends up with no accessible name at all.
 *
 * Nothing catches it. Axe raises no violation here — there is no rule
 * requiring a `tablist` to be named — so this story is green while the group
 * a screen reader lands in announces as an anonymous tablist. That is the
 * shape J4 `artifact-grid` and H7 `stem-mixer` found from the other side: the
 * same empty string is a red gate on a field with a `label` rule behind it
 * and completely silent one element over. The individual tabs keep their own
 * names, so nothing is unreachable — what is lost is the sentence saying what
 * the four of them are.
 *
 * A caller who wants no visible heading already has one: the label is
 * `aria-label`, never rendered, so there is nothing to suppress by blanking it.
 */
export const EmptyLabel: Story = {
  args: {
    input: INPUT,
    output: OUTPUT,
    metadata: METADATA,
    tabsLabel: "",
    defaultTab: "input",
    className: "w-[440px]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="run-inspector-tabs"]')!;

    // The attribute survives as an empty string rather than falling back.
    await expect(list).toHaveAttribute("aria-label", "");
    // And with it empty, the tablist has no accessible name to match on.
    await expect(canvas.queryByRole("tablist", { name: /./ })).toBeNull();
    await expect(canvas.queryByRole("tablist", { name: "Run detail" })).toBeNull();
    // The tabs themselves are untouched: four named stops in an unnamed group.
    await expect(canvas.getAllByRole("tab")).toHaveLength(4);
    await expect(canvas.getByRole("tab", { name: "Metadata" })).toBeInTheDocument();
  },
};

/** An 80-character model id — long, and full of its own break opportunities. */
const LONG_MODEL_ID = "bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0:200k-context-preview-eu-west-1";

/** A 64-character provider request id — as long, and with nowhere to break. */
const LONG_REQUEST_ID = "req01JAV9K3QW7ZC4P8M2ND6XTBRYF5HGE0SU1AL3JO9IK2QW8ZX7CVBNM4TYUP6";

/**
 * A long parameter value in the metadata grid, at phone width so the decision
 * is visible. The answer is **wrap** — not truncate, not scroll, which is the
 * opposite of I2 `property-inspector`, where wave 1 measured a long number
 * scrolling inside a fixed `w-20` field and losing its leading digits. A10
 * gives the value column a `1fr` grid track with no width cap, so the 80-char
 * model id in the first panel breaks at its own hyphens and takes three lines in
 * a 289px column. Nothing is hidden and nothing needs a `title`.
 *
 * The second panel is the same length with nowhere to break, and it is why
 * the two are rendered together rather than as one panel with two rows. A
 * provider request id is one unbroken token, and the `dd` is a flex container
 * whose `min-width: auto` floor is its min-content width, so the `1fr` track
 * cannot shrink under it: measured at 375px, that readout reports
 * `scrollWidth` 654 against `clientWidth` 375 — **279px of the panel sideways
 * off a phone**, while the panel above it sits at 375/375. Only the first is
 * asserted. The second is rendered and described, because asserting it would
 * pin it; `break-all` or `min-w-0` on A10's value cell is the repair, and it
 * belongs to A10 rather than here.
 *
 * The other two author-supplied slots make different choices, and one of them
 * cannot be shown at all. The error string is a plain `p` and wraps freely.
 * The JSON panes are `whitespace-pre-wrap` inside `max-h-80 overflow-auto`,
 * so a long payload **scrolls** — and a payload actually long enough to
 * scroll fails axe outright: `scrollable-region-focusable`, measured at 2680px
 * of content in a 318px box with zero focusable descendants, because the `pre`
 * has no `tabIndex` and holds nothing that can take focus. The docs module
 * already records the keyboard half ("the panel's own tab stop sits outside
 * the scroll container, so it scrolls nothing") and names `settings-shell`,
 * which puts `tabIndex={0}` on its equivalent `pre`; this is the measurement
 * that makes it a red gate rather than a nuisance. Rendering it here would
 * turn a documented gap into a failing story, so it stays a number.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-6">
      <section data-testid="wraps" className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          80 characters with hyphens to break on — three lines, nothing clipped
        </p>
        <RunInspector
          input={INPUT}
          output={OUTPUT}
          defaultTab="metadata"
          tabsLabel="Wrapping run detail"
          metadata={{ ...METADATA, model: LONG_MODEL_ID }}
        />
      </section>

      <section data-testid="overflows" className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          64 characters with none — the grid track cannot shrink under it
        </p>
        <RunInspector
          input={INPUT}
          output={OUTPUT}
          defaultTab="metadata"
          tabsLabel="Overflowing run detail"
          metadata={{ ...METADATA, extra: [{ label: "Request id", value: LONG_REQUEST_ID }] }}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wraps = canvas.getByTestId("wraps");
    const readout = wraps.querySelector<HTMLElement>('[data-slot="stat-readout"]')!;
    const values = Array.from(readout.querySelectorAll<HTMLElement>('[data-slot="stat-readout-value"]'));

    // The model id wraps rather than clipping, and every character of it is
    // inside the box.
    const model = values[0];
    await expect(model.textContent).toContain("eu-west-1");
    await expect(model.scrollWidth).toBe(model.clientWidth);
    await expect(getComputedStyle(model).whiteSpace).toBe("normal");

    // Three lines exactly, measured against the single-line row beneath it, so
    // the height is the wrap and not the column being tall.
    const lineHeight = values[1].getBoundingClientRect().height;
    await expect(lineHeight).toBeLessThan(30);
    await expect(Math.round(model.getBoundingClientRect().height / lineHeight)).toBe(3);

    // And the panel holding it does not scroll sideways — the wrap is a real
    // fit, not an overflow hidden by the frame.
    await expect(readout.scrollWidth).toBeLessThanOrEqual(readout.clientWidth);
    await expect(wraps.scrollWidth).toBeLessThanOrEqual(wraps.clientWidth);
  },
};

/**
 * 375px, all four tabs. The panel fits: the strip lays four labels across the
 * full width with no scroll container of its own (measured 375/375), and the
 * two JSON panes wrap inside it at 373px rather than scrolling sideways.
 * Nothing here is breakpoint-dependent — the component carries no `sm:`/`md:`
 * variants at all — so a 375px wrapper measures the same layout a phone gets,
 * which is not true of every story in this repo.
 *
 * The play function walks all four tabs rather than trusting the one that
 * renders, because each panel has different content and only one is mounted
 * at a time: the metadata grid and the error paragraph are never on screen
 * together with the JSON, so a single-tab measurement would prove a quarter
 * of the claim. The frame is measured by `data-testid`, not
 * `canvasElement.firstElementChild`, which under this file's `layout:
 * "centered"` meta would be the ~1200px centring div.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <RunInspector {...args} />
    </div>
  ),
  args: {
    input: INPUT,
    output: OUTPUT,
    metadata: METADATA,
    defaultTab: "input",
    error: "Provider timed out after 30s",
    retriedBy: { id: "call-2", name: "Call LLM: draft summary (retry)", status: "ok" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="run-inspector"]')!;
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="run-inspector-tabs"]')!;

    // Four labels across a phone with no scroller of their own.
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);

    for (const name of ["Input", "Output", "Metadata", "Error, this run failed"]) {
      const tab = canvas.getByRole("tab", { name });
      await userEvent.click(tab);
      await waitFor(async () => {
        await expect(tab).toHaveAttribute("aria-selected", "true");
      });
      await expect(viewport.scrollWidth, `${name} tab scrolls sideways at 375px`).toBeLessThanOrEqual(
        viewport.clientWidth,
      );
      await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    }

    // The JSON wraps inside the pane instead of pushing it wide.
    await userEvent.click(canvas.getByRole("tab", { name: "Input" }));
    const pre = await waitFor(() => canvasElement.querySelector<HTMLElement>("pre")!);
    await expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth);
  },
};

const BOUNDARY_SPANS: TraceSpan[] = [
  { id: "plan", name: "Plan the task", kind: "chain", status: "ok", startMs: 0, durationMs: 400 },
  { id: "search", name: "Search the web", kind: "tool", status: "ok", startMs: 400, durationMs: 900 },
  {
    id: "call-1",
    name: "Call LLM: draft summary",
    kind: "llm",
    status: "error",
    startMs: 1320,
    durationMs: 380,
    error: "Provider timed out after 30s",
  },
];

/**
 * Three surfaces that all show "what the run did", and the rule is what each
 * one is a record *of*.
 *
 * - **N4 `trace-timeline`** is the trace: which steps ran, in what order, how
 *   long each took, which failed. It answers *where*, and it is the only one
 *   of the three that can. It has no room for a payload, by design.
 * - **N5 `run-inspector`** is one span. It answers *what happened inside*
 *   that step, and it is worth its four tabs only when there is a raw request
 *   and response to read. The two compose rather than compete: N4's
 *   `renderDetail(span, retriedBy)` is the seam this fills, and `retriedBy`
 *   is shaped as N4's exported `TraceSpanRetryOutcome` so it passes straight
 *   through with no adapter.
 * - **A10 `stat-readout`** is the grid, and N5's metadata tab *is* A10 with
 *   the cost row assembled for it. If key-and-value metadata is all you have,
 *   reaching for N5 buys three empty tabs and a tab stop; use A10 directly.
 *
 * The fourth near-twin is F3 `asset-detail`, not rendered here because it is
 * a dialog: it is the same A10 params grid attached to a generated *artifact*
 * rather than a run, with prompt spans and Copy/Remix/Edit as its verbs.
 * Choose by the subject, not the layout — F3's record is of a thing that was
 * produced, N5's is of the call that produced it.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          N4 trace timeline — which step, and which one failed
        </p>
        <TraceTimeline spans={BOUNDARY_SPANS} className="w-[420px]" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          N5 run inspector — what that step actually sent, cost and retried
        </p>
        <RunInspector
          input={INPUT}
          output={OUTPUT}
          metadata={METADATA}
          error="Provider timed out after 30s"
          retriedBy={{ id: "call-2", name: "Call LLM: draft summary (retry)", status: "ok" }}
          tabsLabel="Call LLM: draft summary detail"
          className="w-[420px]"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          A10 stat readout — the same grid, with nothing else attached to it
        </p>
        <StatReadout
          className="w-[420px]"
          items={[
            { label: "Model", value: "gpt-4o-mini" },
            { label: "Latency", value: "640ms" },
            { label: "Tokens in", value: "118" },
          ]}
        />
      </section>
    </div>
  ),
};
