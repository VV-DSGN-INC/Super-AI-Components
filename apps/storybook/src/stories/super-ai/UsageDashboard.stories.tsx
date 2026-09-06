import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";
import { QuotaMeter } from "@/registry/super-ai/quota-meter";
import { UsageDashboard, type UsageDashboardPeriodData } from "@/registry/super-ai/usage-dashboard";
import { UsageDashboardDocs } from "@/content/components/usage-dashboard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof UsageDashboard> = {
  title: "Super AI/Usage Dashboard",
  component: UsageDashboard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(UsageDashboardDocs) } },
};

export default meta;
type Story = StoryObj<typeof UsageDashboard>;

// UsageDashboard is one composed view, not three mutually-exclusive variants
// — see the file-header comment in usage-dashboard.tsx. Each story below
// renders the same full dashboard (selector, summary cards, and model
// breakdown together) with data chosen to spotlight the part it's named for,
// the same "anatomy, not variants" shape used for N2 trust-dialog's stories.

const FEW_PERIODS = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
];

const PERIOD_SELECT_DATA: Record<string, UsageDashboardPeriodData> = {
  "24h": {
    summary: {
      spend: 4.2,
      tokens: 9800,
      latencyMs: 640,
      spendDeltaPct: 2,
      tokensDeltaPct: 1,
      latencyDeltaPct: -3,
    },
    models: [{ id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 4.2, tokens: 9800, latencyMs: 640 }],
  },
  "7d": {
    summary: {
      spend: 28.7,
      tokens: 64000,
      latencyMs: 700,
      spendDeltaPct: 11,
      tokensDeltaPct: 6,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 18.4, tokens: 41000, latencyMs: 620 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 10.3, tokens: 23000, latencyMs: 800 },
    ],
  },
  "30d": {
    summary: {
      spend: 128.7,
      tokens: 412000,
      latencyMs: 830,
      spendDeltaPct: 12,
      tokensDeltaPct: -4,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 82.5, tokens: 288000, latencyMs: 620 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 46.2, tokens: 124000, latencyMs: 810 },
    ],
  },
  "90d": {
    summary: {
      spend: 402.9,
      tokens: 1180000,
      latencyMs: 890,
      spendDeltaPct: -8,
      tokensDeltaPct: 22,
      latencyDeltaPct: 4,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 260.1, tokens: 820000, latencyMs: 640 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 142.8, tokens: 360000, latencyMs: 860 },
    ],
  },
};

/** Multiple periods, and the trigger shows the human label — never the raw period id. */
export const PeriodSelect: Story = {
  args: { periods: FEW_PERIODS, data: PERIOD_SELECT_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};

const TWO_PERIODS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const SUMMARY_CARDS_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    // Deliberately mixed directions — spend up (worth a second look), tokens
    // down, latency unchanged — so all three delta shapes show at once.
    summary: {
      spend: 96.4,
      tokens: 258000,
      latencyMs: 910,
      spendDeltaPct: 24,
      tokensDeltaPct: -9,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 68.1, tokens: 176000, latencyMs: 980 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 28.3, tokens: 82000, latencyMs: 600 },
    ],
  },
  "30d": {
    summary: {
      spend: 380.2,
      tokens: 990000,
      latencyMs: 870,
      spendDeltaPct: -5,
      tokensDeltaPct: 14,
      latencyDeltaPct: -2,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 260.4, tokens: 690000, latencyMs: 940 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 119.8, tokens: 300000, latencyMs: 590 },
    ],
  },
};

/** A delta beside every summary figure: increase, decrease, and no-change, each stated as visible text. */
export const SummaryCards: Story = {
  args: { periods: TWO_PERIODS, data: SUMMARY_CARDS_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};

const MODEL_BREAKDOWN_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: {
      spend: 214.6,
      tokens: 720000,
      latencyMs: 840,
      spendDeltaPct: 7,
      tokensDeltaPct: 12,
      latencyDeltaPct: -3,
    },
    // Five models with a wide spend spread — the actionable view: which
    // model is actually driving the total, not just that the total moved.
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 118.2, tokens: 312000, latencyMs: 960 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 52.4, tokens: 218000, latencyMs: 590 },
      { id: "claude-3-5-sonnet", name: "claude-3-5-sonnet", spend: 31.8, tokens: 96000, latencyMs: 1120 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 9.6, tokens: 68000, latencyMs: 620 },
      { id: "llama-3-70b", name: "llama-3.1-70b", spend: 2.6, tokens: 26000, latencyMs: 480 },
    ],
  },
  "30d": {
    summary: {
      spend: 890.5,
      tokens: 2860000,
      latencyMs: 860,
      spendDeltaPct: 3,
      tokensDeltaPct: 9,
      latencyDeltaPct: 1,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 486.2, tokens: 1240000, latencyMs: 970 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 214.7, tokens: 860000, latencyMs: 600 },
      { id: "claude-3-5-sonnet", name: "claude-3-5-sonnet", spend: 138.4, tokens: 420000, latencyMs: 1140 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 40.1, tokens: 260000, latencyMs: 630 },
      { id: "llama-3-70b", name: "llama-3.1-70b", spend: 11.1, tokens: 80000, latencyMs: 500 },
    ],
  },
};

/** Five models with an uneven spend spread — the breakdown says which model to act on, not just that the total moved. */
export const ModelBreakdown: Story = {
  args: { periods: TWO_PERIODS, data: MODEL_BREAKDOWN_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this dashboard meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for the eight and the rule for
 * deciding which apply.
 *
 * All eight are written; nothing is skipped. A dashboard with an
 * author-supplied label per row, a controlled selector, one popup and a
 * chart genuinely meets every one of them.
 *
 * Two mechanical facts about this file, both of which cost time here:
 *
 * - **The `data-slot` overrides win.** `SelectTrigger` and `SelectContent`
 *   set `data-slot="select-trigger"` / `"select-content"` *before* spreading
 *   props, so this component's `usage-dashboard-period-trigger` and
 *   `usage-dashboard-period-content` replace them. Querying for the vendored
 *   names finds nothing, and the failure reads as "the popup never opened".
 * - **Base UI's select popup never unmounts.** After Escape it stays in the
 *   document with `data-closed`; the *positioner* above it takes the
 *   `hidden` attribute, which is what takes the subtree out of the render
 *   and out of axe's reach. `waitFor(() => expect(popup).toBeNull())` times
 *   out here — wait for `hidden` on the parent instead, which is what
 *   satisfies the convention's "never leave a popup mid-dismissal" rule.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document, which is the only place a portal can read it. */
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

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="usage-dashboard"]')!;
const slot = (root: HTMLElement, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

/** The box a node's own text paints in, which is not the box of the cell holding it. */
function textBox(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

/** Every element in `root` that a Tab would actually stop on. */
function tabStops(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]"),
  ).filter((el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled);
}

/** Open the period popup and hand back the surface, settled. */
async function openPeriodPopup(root: HTMLElement) {
  await userEvent.click(slot(root, "usage-dashboard-period-trigger"));
  let found: HTMLElement | null = null;
  await waitFor(() => {
    found = document.querySelector<HTMLElement>('[data-slot="usage-dashboard-period-content"]');
    if (!found) throw new Error("the period popup never opened");
  });
  const popup = found as unknown as HTMLElement;
  await waitFor(() => expect(popup).toHaveAttribute("data-open"));
  return popup;
}

/** Escape, and wait for the popup's subtree to leave the render — see the header note. */
async function dismissPeriodPopup(popup: HTMLElement) {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(popup.parentElement).toHaveAttribute("hidden"));
}

/**
 * Right-to-left, with `dir` on the document rather than a wrapper so the
 * portalled popup can read it too.
 *
 * **What was swapped, and is now pinned.** The table's column headings and
 * its row headings carried physical `text-left` / `pr-3` while every data
 * cell carried no alignment class at all — measured before the swap, every
 * `th` computed `text-align: left` and every `td` computed `start`. In LTR
 * those are the same edge and nothing shows; under RTL a heading sits
 * against the opposite edge from the data it names, which is the shape J1
 * `asset-library` measured on the vendored table and F6 `render-queue`
 * recorded before it. Both classes are byte-identical in LTR (`text-start`,
 * `pe-3`), so they landed in-wave. Measured after: the Tokens heading and
 * its data now share a right edge at 771px inside a cell running 661..771,
 * and the assertions below are the regression guard H3 `track-lane`
 * established.
 *
 * **The swap is byte-identical only where the class lands on the element
 * itself, and a `<th>` is where that bites.** The physical class lived on
 * the `<tr>`, and moving it across as `text-start` centred all four column
 * headings in LTR — a visible regression from a swap the convention calls
 * safe. Chrome's UA sheet gives `th` `text-align: -internal-center`, which
 * defers to an inherited value only when that value is not the initial
 * `start`, so an inherited `text-left` reaches the heading and an inherited
 * `text-start` does not. The assertion below caught it before it shipped and
 * the class now sits on each `th`. This is a sixth negative for the
 * don't-swap-blind rule and the first that is about *where* the class lives
 * rather than what else decides the side.
 *
 * **What cannot be swapped, and is the real finding: this component's
 * quantities are pinned left-to-right in three separate mechanisms, and the
 * chart is where it shows.**
 *
 * - *The bars grow the wrong way.* Measured under `dir="rtl"`: every bar
 *   still starts at x=684 and grows rightwards — the largest to 1165, the
 *   smallest to 695 — because Recharts lays a `layout="vertical"` chart out
 *   in SVG coordinates, which no amount of `direction` touches. An RTL
 *   reader's eye starts at the right, where the bars *end*.
 * - *The category axis stays on the left.* The model names run down the
 *   physical left edge of the chart while the table's Model column, now
 *   correctly start-aligned, runs down the right. The two views of the same
 *   five rows disagree about which side a row begins on.
 * - *The trend icon does not mirror.* `TrendingUp` is a diagonal encoding
 *   "later is to the right". Under RTL later is to the left, so the glyph
 *   states the opposite of the sentence beside it. This is the same class as
 *   N11 `escalation-handoff`'s `ArrowRight` (CONTINUE.md §8): a visible
 *   change needing an idiom, not a class swap, so it is recorded and not
 *   fixed here.
 *
 * **And the signed percentage comes apart.** Measured character by
 * character under RTL: the `+` paints at 1164..1172, `%` at 1153..1164 and
 * `7` at 1146..1153 — so the glyphs read `7 % +` left to right. Unicode
 * bidi resolves the leading `+` to ON and then to the paragraph's own
 * direction, which detaches it from the digits it signs; `%` stays welded on
 * by rule W5. A2 `cost-chip`, composed in the row right below, already
 * solves exactly this with `dir="ltr"` on its amount — asserted here — and
 * the delta does not. One attribute, but it changes RTL rendering, so it is
 * recorded rather than swept.
 */
export const RTL: Story = {
  args: { periods: TWO_PERIODS, data: MODEL_BREAKDOWN_DATA, defaultPeriod: "7d", className: "w-[640px]" },
  render: (args) => (
    <RtlDocument>
      <UsageDashboard {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const table = slot(root, "usage-dashboard-model-table");
    await expect(getComputedStyle(table).direction).toBe("rtl");

    // 1. The swap: heading and data now resolve to the same edge, and the
    //    gutter is logical. `start` under RTL is the right edge.
    const headings = Array.from(table.querySelectorAll<HTMLElement>("thead th"));
    const rowHeading = table.querySelector<HTMLElement>("tbody th")!;
    const tokenCell = table.querySelector<HTMLElement>("tbody tr td:nth-child(3)")!;
    for (const el of [...headings, rowHeading, tokenCell]) {
      await expect(getComputedStyle(el).textAlign).toBe("start");
    }
    await expect(
      `heading padding start=${getComputedStyle(headings[0]).paddingRight} end=${getComputedStyle(headings[0]).paddingLeft}`,
    ).toBe("heading padding start=0px end=12px");
    await expect(Math.round(textBox(headings[0]).right)).toBe(Math.round(textBox(rowHeading).right));

    // 2. The chart does not mirror: one shared baseline on the physical
    //    left, every bar growing right, whatever the direction is.
    const chart = slot(root, "usage-dashboard-model-chart");
    const bars = Array.from(chart.querySelectorAll<SVGElement>(".recharts-rectangle"));
    await expect(bars).toHaveLength(5);
    const lefts = bars.map((b) => Math.round(b.getBoundingClientRect().left));
    await expect(new Set(lefts).size).toBe(1);
    const widest = bars[0].getBoundingClientRect();
    const narrowest = bars[4].getBoundingClientRect();
    await expect(widest.width).toBeGreaterThan(narrowest.width);
    await expect(`bars grow toward the physical right: ${widest.right > narrowest.right}`).toBe(
      "bars grow toward the physical right: true",
    );

    // …and its category labels sit on the opposite side from the table's own
    // model column, which is the consequence a reader sees.
    const axisLabel = chart.querySelector<SVGTextElement>("text")!;
    await expect(axisLabel.textContent).toBe("gpt-4o");
    await expect(axisLabel.getBoundingClientRect().left).toBeLessThan(
      rowHeading.getBoundingClientRect().left,
    );

    // 3. The delta: the phrase mirrors as a block (the icon moves to the
    //    reading edge, correctly) but the sign detaches from its digits.
    const delta = root.querySelector<HTMLElement>(
      '[data-slot="usage-dashboard-delta"][data-direction="up"]',
    )!;
    const icon = delta.querySelector("svg")!;
    await expect(icon.getBoundingClientRect().left).toBeGreaterThan(delta.getBoundingClientRect().left);
    const chars = Array.from(delta.childNodes).find((n) => n.nodeType === Node.TEXT_NODE)!;
    const glyph = (from: number, to: number) => {
      const range = document.createRange();
      range.setStart(chars, from);
      range.setEnd(chars, to);
      return range.getBoundingClientRect();
    };
    await expect(chars.textContent).toBe("+7% vs previous period");
    await expect(`sign is right of the digit it signs: ${glyph(0, 1).left > glyph(1, 2).left}`).toBe(
      "sign is right of the digit it signs: true",
    );

    // 4. The one number that is protected, and by the composed chip rather
    //    than by this component: A2 pins its amount to `dir="ltr"`.
    const amount = slot(root, "cost-chip-amount");
    await expect(getComputedStyle(amount).direction).toBe("ltr");
    await expect(amount).toHaveTextContent("118.2 credits");
  },
};

/**
 * `prefers-reduced-motion`, and the registry's only chart is the reason this
 * story is worth reading.
 *
 * **The chart already branches, and this repo did not write the branch.**
 * Recharts 3.8 defaults `isAnimationActive` to `"auto"`, documented as
 * disabling animation in SSR and respecting the user's reduced-motion
 * preference (`recharts/types/cartesian/Bar.d.ts`). So under the runner's
 * emulated reduce the bars are drawn at their final geometry on the first
 * frame — asserted below by reading the widest bar at play time and again
 * after a settle window, finding it unmoved, and separately checking that
 * the first read was already 481px of a ~490px plot rather than a partial
 * frame of a grow. That is the first reduced-motion branch in this program
 * supplied by a dependency instead of by a `motion-reduce:` class, and it is
 * a real guard: pass `isAnimationActive` as `true`, or take a Recharts
 * version that changes the default, and the two reads diverge. Its one limit
 * is worth stating — if mount-to-play latency ever exceeded the 1500ms
 * default duration, a completed animation would look the same, which is why
 * the size check sits beside the equality rather than instead of it.
 *
 * **Nothing this component owns animates.** No `animate-*` class exists in
 * the rendered subtree — checked, not claimed. The only `transition-*` is
 * the vendored `SelectTrigger`'s `transition-colors`, which crossfades a
 * border and moves nothing (the `reset-affordance` qualifier in the
 * convention's fact 3).
 *
 * **The popup carries the restated pair, and the gate cannot demonstrate
 * it.** `select.tsx` defaults `alignItemWithTrigger` to `true` and kills the
 * animation outright with `data-[align-trigger=true]:animate-none`, so the
 * popup reads `animation-name: none` and `animation-duration: 0s` with or
 * without reduced motion — measured here as `data-align-trigger="true"`.
 * H1 `transport-controls` established that an `animationName === "none"`
 * assertion on a default select popup is therefore vacuous; this file makes
 * the same distinction, pinning the mechanism and then checking the classes
 * separately, because they cover the branch the runner cannot reach: Base UI
 * falls back to unaligned positioning when the popup will not fit, the flag
 * flips to `false`, and `zoom-in-95` becomes real motion (F4 `action-stack`
 * measured that variant as a 304px→320px growth, not a fade).
 */
export const ReducedMotion: Story = {
  args: { periods: TWO_PERIODS, data: MODEL_BREAKDOWN_DATA, defaultPeriod: "7d", className: "w-[640px]" },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);

    // 1. This component's own tree: nothing to suppress, stated as a check.
    await expect(root.querySelector('[class*="animate-"]')).toBeNull();

    // 2. The chart. Recharts decides this, and it decides it correctly.
    const chart = slot(root, "usage-dashboard-model-chart");
    const widest = () =>
      chart.querySelector<SVGElement>(".recharts-rectangle")!.getBoundingClientRect().width;
    const first = Math.round(widest());
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(`bar width first=${first} settled=${Math.round(widest())}`).toBe(
      `bar width first=${first} settled=${first}`,
    );
    // …and it was already at full size on that first read, not partway
    // through a grow: 481px of the ~490px plot area for the largest spend.
    await expect(first).toBeGreaterThan(400);

    // 3. The popup: why it is still, and the classes that matter elsewhere.
    const popup = await openPeriodPopup(root);
    await expect(popup).toHaveAttribute("data-align-trigger", "true");
    const style = getComputedStyle(popup);
    await expect(style.animationName).toBe("none");
    await expect(style.animationDuration).toBe("0s");
    await expect(popup).toHaveClass("motion-reduce:data-open:animate-none");
    await expect(popup).toHaveClass("motion-reduce:data-closed:animate-none");
    await expect(within(popup).getByRole("option", { name: "Last 30 days" })).toBeInTheDocument();
    await dismissPeriodPopup(popup);
  },
};

/**
 * One tab stop, whatever the data — and the two guards that keep it that
 * way, both of which are on the chart.
 *
 * The period trigger is the whole keyboard surface. Five model rows, twenty
 * numbers and a bar per row add nothing: the table is static (no sort, no
 * selection, no arrow movement), and the chart is out of the tab order
 * because `accessibilityLayer={false}` is passed explicitly. That prop is
 * load-bearing and invisible — Recharts 3 defaults `accessibilityLayer` to
 * true and turns it into `tabIndex={0}` plus `role="application"` on the
 * chart's root SVG, which inside this component's `aria-hidden` wrapper is
 * the `aria-hidden-focus` violation exactly. Asserted below as
 * `tabindex=null`, so deleting the prop fails here rather than in a
 * consumer's app.
 *
 * The listbox's name is the other guard. Base UI renders the popup's list as
 * `role="listbox"`, and every `SelectContent` in this registry shipped
 * unnamed until a story opened one (CONTINUE.md §8). This call site now
 * passes `aria-label`, which the vendored wrapper forwards to the `List`
 * rather than the `Popup` — the element that carries the role. Note that
 * axe's `aria-input-field-name` catches this "in at least one shape": it
 * failed H1 `transport-controls` outright and raised nothing on J6
 * `template-detail`, so the assertion here is the reliable check, not the
 * gate.
 *
 * Focus is checked both ways the convention's fact 5 requires. Unfocused,
 * the trigger's `box-shadow` is literally `none`; focused, it settles to
 * five ring layers of which one is real (`oklab(0.708 0 0 / 0.5) 0px 0px 0px
 * 3px`). `settledFocusRing` proves something is painted and the differential
 * proves focus is what painted it.
 *
 * Inside the popup, focus is roving rather than `aria-activedescendant`:
 * opening moves focus onto the *currently selected* option — the second of
 * four here, asserted — and each arrow key moves the real focus one row.
 * The reads use the settle-on-departure form (convention fact 4), because
 * an arrival wait cannot tell "focus reached an option" from "focus is
 * still on the option it started on": the first read of this story, taken
 * immediately after the click, returned the trigger once and an option the
 * next time, which is the race that form exists to remove.
 */
export const KeyboardOrder: Story = {
  args: { periods: FEW_PERIODS, data: PERIOD_SELECT_DATA, defaultPeriod: "7d", className: "w-[640px]" },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const trigger = slot(root, "usage-dashboard-period-trigger");

    // 1. One stop in the whole dashboard, and it is the selector.
    await expect(tabStops(root)).toEqual([trigger]);
    await expect(tabStops(slot(root, "usage-dashboard-model-breakdown"))).toEqual([]);

    // 2. The chart is out of the tab order, which is what makes its
    //    `aria-hidden` wrapper legal.
    const svg = slot(root, "usage-dashboard-model-chart").querySelector("svg")!;
    await expect(svg.getAttribute("tabindex")).toBeNull();
    await expect(svg.getAttribute("role")).toBeNull();

    // 3. Focus arrives, and paints — absolute check and differential.
    const unfocused = focusTreatmentSignature(trigger);
    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await expect(trigger.matches(":focus-visible")).toBe(true);
    await settledFocusRing(trigger, waitFor);
    await expect(focusTreatmentSignature(trigger)).not.toBe(unfocused);

    // 4. Inside the popup: a named listbox, one option per period, and
    //    arrow keys that move focus onto the rows themselves rather than
    //    through `aria-activedescendant`.
    const popup = await openPeriodPopup(root);
    const list = within(popup).getByRole("listbox", { name: "Period" });
    const options = within(list).getAllByRole("option");
    await expect(options.map((o) => o.textContent?.trim())).toEqual([
      "Last 24 hours",
      "Last 7 days",
      "Last 30 days",
      "Last 90 days",
    ]);
    await expect(list.getAttribute("aria-activedescendant")).toBeNull();

    // Settle on departure, not on arrival (convention fact 4): opening moves
    // focus off the trigger and into the list, so the wait names the element
    // focus has to leave and each read is provably a move rather than a
    // stale value from the previous frame.
    const settledOption = async (previous: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement as HTMLElement;
        if (active === previous) throw new Error("focus has not moved off the previous stop yet");
        if (!options.includes(active)) {
          throw new Error(`focus is not on an option: ${active?.getAttribute("role") ?? active?.tagName}`);
        }
      });
      return document.activeElement as HTMLElement;
    };
    const landed = await settledOption(trigger);
    await expect(landed).toBe(options[1]);
    await userEvent.keyboard("{ArrowDown}");
    await expect(await settledOption(landed)).toBe(options[2]);

    // 5. Escape returns focus to the trigger and leaves nothing behind for
    //    axe to scan.
    await dismissPeriodPopup(popup);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * `period` / `onPeriodChange` is a real controlled pair, and the shell below
 * holds it the hard way: it records what the dashboard asked for and applies
 * it only when told to.
 *
 * What it shows, in order: choosing a period does not move the rendered
 * value; the callback still fires with the id a host needs; a re-render with
 * an unchanged `period` leaves every panel where it was; and applying the
 * request moves the summary figures **and** the model rows in one pass.
 *
 * That last step is the component's whole reason to exist as one component.
 * `currentPeriodId` is the single piece of state both panels derive from, so
 * there is no interleaving in which the cards have updated and the breakdown
 * has not — a host cannot produce that state even by trying, which is the
 * claim the spec's "period select drives every panel at once" is making.
 *
 * What is **not** controlled is the popup's open state: `UsageDashboardProps`
 * exposes no `open`/`onOpenChange`, so a host that wants to close the
 * selector when something behind it changes cannot. Same shape as E1
 * `generation-panel`'s sections and J4 `artifact-grid`'s fold, and milder
 * than either, because nothing is lost when it stays open.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);
    const trigger = slot(root, "usage-dashboard-period-trigger");
    const spend = () => slot(root, "usage-dashboard-summary-value").textContent;
    const rows = () =>
      Array.from(root.querySelectorAll<HTMLElement>('[data-slot="usage-dashboard-model-row"]')).map((r) =>
        r.getAttribute("data-model-id"),
      );

    await expect(trigger).toHaveAttribute("aria-label", "Period: Last 7 days");
    await expect(spend()).toBe("214.6 credits");
    await expect(rows()).toHaveLength(5);

    // 1. Interaction alone does not move the rendered value.
    const popup = await openPeriodPopup(root);
    await userEvent.click(within(popup).getByRole("option", { name: "Last 30 days" }));
    await waitFor(() => expect(popup.parentElement).toHaveAttribute("hidden"));
    await expect(trigger).toHaveAttribute("aria-label", "Period: Last 7 days");
    await expect(spend()).toBe("214.6 credits");

    // 2. …but the callback fired, with the id the host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("30d");

    // 3. Re-render with an unchanged `period`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(trigger).toHaveAttribute("aria-label", "Period: Last 7 days");
    await expect(spend()).toBe("214.6 credits");

    // 4. Applying it moves both panels together — one state, one update.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(spend()).toBe("890.5 credits"));
    await expect(trigger).toHaveAttribute("aria-label", "Period: Last 30 days");
    await expect(rows()).toEqual([
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "claude-haiku",
      "llama-3-70b",
    ]);
    await expect(slot(root, "usage-dashboard-model-table")).toHaveTextContent("486.2 credits");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState("7d");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-[640px] flex-col gap-4">
      <UsageDashboard
        periods={TWO_PERIODS}
        data={MODEL_BREAKDOWN_DATA}
        period={applied}
        onPeriodChange={setRequested}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>period prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onPeriodChange</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPass((p) => p + 1)}>
          Re-render
        </Button>
        <Button size="sm" onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

const EMPTY_LABEL_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: { spend: 214.6, tokens: 720000, latencyMs: 840, spendDeltaPct: 7 },
    models: [{ id: "gpt-4o", name: "gpt-4o", spend: 118.2, tokens: 312000, latencyMs: 960 }],
  },
};

/**
 * Every optional text slot emptied at once, plus the fourth way this
 * component loses a name — which is not an empty string at all.
 *
 * `title=""` is the well-behaved one: the heading is dropped rather than
 * rendered blank, so the dashboard contributes no heading to the page
 * outline and the header row keeps its layout through a placeholder span.
 * A host that wants the dashboard inside its own `<h2>` section can have
 * that, and asserting "no heading" is how a reader learns it is a choice —
 * the second dashboard below keeps the default `title` and is the control
 * that proves the first one's absence is the empty string's doing.
 *
 * `spendUnit=""` is the shape A2 `cost-chip` cannot defend against: the chip
 * renders `{amount} {unit}`, so an empty unit leaves the trailing space and
 * the accessible name of the spend cell becomes `"118.2 "` — a number with
 * no unit in a table whose whole subject is money.
 *
 * `periodSelectLabel=""` is the one to watch. The trigger's name is built as
 * `` `${label}: ${current.label}` ``, so it degrades to `": Last 7 days"` —
 * still non-empty, so no axe rule fires, and still wrong: the colon is now
 * the only thing separating a name from nothing. Worse, the same prop is the
 * listbox's whole `aria-label`, so opening the popup with an empty label
 * puts back the unnamed listbox this component just fixed. That is the H7
 * `stem-mixer` / J7 shape — `label=""` defeating its own default parameter —
 * reached through a second element. The popup is deliberately *not* opened
 * here, because it would ship an unnamed listbox into a gate that runs at
 * `test: "error"`.
 *
 * And the fourth: **a `period` id with no entry in `periods` empties the
 * name without any empty string being passed.** The second dashboard below
 * asks for `"180d"`, gets `current === undefined`, and names its trigger
 * `"Period: "` while showing "Period" as its visible text. Both halves are
 * degraded, and a host that persists a period id across a plan change hits
 * it with entirely well-formed props. The panels below it zero out
 * correctly, which is the documented behaviour and reads as considered; the
 * name does not.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-[640px] flex-col gap-8">
      <UsageDashboard
        periods={TWO_PERIODS}
        data={EMPTY_LABEL_DATA}
        defaultPeriod="7d"
        title=""
        periodSelectLabel=""
        spendUnit=""
      />
      <UsageDashboard periods={TWO_PERIODS} data={EMPTY_LABEL_DATA} period="180d" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [emptied, unknown] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="usage-dashboard"]'),
    );

    // 1. No heading at all — dropped, not rendered blank. The second
    //    dashboard keeps the default `title`, so it is the control.
    await expect(within(emptied).queryAllByRole("heading")).toEqual([]);
    await expect(emptied.querySelector('[data-slot="usage-dashboard-title"]')).toBeNull();
    await expect(within(unknown).getByRole("heading", { level: 3 })).toHaveTextContent("Usage");

    // 2. The trigger keeps a name, and the name is a colon and a value.
    await expect(slot(emptied, "usage-dashboard-period-trigger")).toHaveAttribute(
      "aria-label",
      ": Last 7 days",
    );

    // 3. The spend figure loses its unit and keeps the space that held it.
    await expect(slot(emptied, "usage-dashboard-summary-value").textContent).toBe("214.6 ");
    await expect(slot(emptied, "cost-chip-amount").textContent).toBe("118.2 ");

    // 4. The unknown-period dashboard: a name with nothing after the colon,
    //    and panels that zero out rather than break.
    await expect(slot(unknown, "usage-dashboard-period-trigger")).toHaveAttribute("aria-label", "Period: ");
    await expect(slot(unknown, "usage-dashboard-period-trigger")).toHaveTextContent("Period");
    await expect(slot(unknown, "usage-dashboard-summary-value").textContent).toBe("0 credits");
    await expect(unknown).toHaveTextContent("No usage recorded for this period yet.");
    await expect(unknown.querySelector('[data-slot="usage-dashboard-model-table"]')).toBeNull();
  },
};

const LONG_MODEL_NAME = "anthropic/claude-3-5-sonnet-20241022-extended-thinking-preview-eu-west-1";

const LONG_CONTENT_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: {
      spend: 214.6,
      tokens: 720000,
      latencyMs: 840,
      spendDeltaPct: 7,
      tokensDeltaPct: 12,
      latencyDeltaPct: -3,
    },
    models: [
      { id: "long", name: LONG_MODEL_NAME, spend: 118.2, tokens: 312000, latencyMs: 960 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 52.4, tokens: 218000, latencyMs: 590 },
      { id: "llama-3-70b", name: "llama-3.1-70b", spend: 2.6, tokens: 26000, latencyMs: 480 },
    ],
  },
};

/**
 * A 72-character model id in the breakdown, beside its cost. Deployment
 * aliases really are this long once a region and a snapshot date are in
 * them, and the two halves of this panel handle it differently.
 *
 * **The table's decision is wrap, and it is the right one.** The row heading
 * carries no `truncate`, so at 640px the 72-character name wraps to two
 * lines with `scrollWidth === clientWidth` — nothing clipped, nothing
 * scrolling. The Model column takes 383px of the 608px table and the three
 * numeric columns still fit, so the surrounding `overflow-x-auto` never
 * engages. The row grows by only 2px (53px against a neighbour's 51px),
 * because the `CostChip` in the Spend column already sets a taller floor
 * than a single line of text — so a wrapped model id costs almost no
 * vertical rhythm, which is part of why wrapping is affordable here. A
 * truncated id would be the wrong call anyway: the distinguishing part is
 * at the end, which is exactly what an ellipsis removes.
 *
 * **The chart's decision is nothing at all, and that is the finding.**
 * Recharts anchors a `layout="vertical"` category tick at `text-anchor: end`
 * against the axis's fixed `width={104}`, and does not measure, wrap or
 * truncate. Measured at 640px: the label's box runs from **−300 to 116**
 * while the breakdown `Card` runs 0..640 — so **300px of it is outside the
 * card**, and only that card's own `overflow: hidden` stops it painting
 * across the page. What survives is the *tail*, so the chart labels this row
 * `…thinking-preview-eu-west-1` while the table beside it spells the whole
 * id out. Under `dir="rtl"` the overflow runs the other way and lands on top
 * of the bars instead — measured at 676..1082 against bars at 684..1165, so
 * ~400px of label over the plot. Both are recorded, neither is fixed:
 * `width={104}` is a design number and truncating a model id is a decision
 * about which end matters.
 *
 * The consolation is the one the component's rule 3 already claims — the
 * chart is decorative and `aria-hidden`, and every number and name it draws
 * exists as real text in the table below it. So this defect costs a sighted
 * reader a clipped label and costs a screen-reader user nothing, which is
 * the opposite of the usual direction and worth saying out loud.
 */
export const LongContent: Story = {
  args: { periods: TWO_PERIODS, data: LONG_CONTENT_DATA, defaultPeriod: "7d", className: "w-[640px]" },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const table = slot(root, "usage-dashboard-model-table");
    const [longRow, shortRow] = Array.from(
      table.querySelectorAll<HTMLElement>('[data-slot="usage-dashboard-model-row"]'),
    );
    const heading = longRow.querySelector<HTMLElement>("th")!;

    // 1. The table wraps: full text, no clipping, a taller row.
    await expect(heading).toHaveTextContent(LONG_MODEL_NAME);
    await expect(heading.scrollWidth).toBe(heading.clientWidth);
    await expect(longRow.getBoundingClientRect().height).toBeGreaterThan(
      shortRow.getBoundingClientRect().height,
    );

    // 2. …and the panel still does not scroll sideways.
    const scroller = table.parentElement!;
    await expect(scroller.scrollWidth).toBe(scroller.clientWidth);

    // 2b. The LTR half of `RTL`'s swap, pinned where it is visible: with the
    //     alignment on each `th`, a heading and its own data still share a
    //     left edge, exactly as the physical `text-left` produced.
    const tokensHeading = table.querySelectorAll<HTMLElement>("thead th")[2];
    const tokensCell = shortRow.querySelectorAll<HTMLElement>("td")[1];
    await expect(getComputedStyle(tokensHeading).textAlign).toBe("start");
    await expect(Math.round(textBox(tokensHeading).left)).toBe(Math.round(textBox(tokensCell).left));

    // 3. The cost stays on the same row as the name it belongs to.
    const chip = longRow.querySelector<HTMLElement>('[data-slot="cost-chip-amount"]')!;
    await expect(chip).toHaveTextContent("118.2 credits");

    // 4. The chart overflows its own card and is saved only by the clip.
    const card = slot(root, "usage-dashboard-model-breakdown");
    const label = slot(root, "usage-dashboard-model-chart").querySelector<SVGTextElement>("text")!;
    await expect(label.textContent).toBe(LONG_MODEL_NAME);
    await expect(getComputedStyle(label).textAnchor).toBe("end");
    await expect(getComputedStyle(card).overflow).toBe("hidden");
    const clipped = Math.round(card.getBoundingClientRect().left - label.getBoundingClientRect().left);
    await expect(`clipped px of the chart's own label: ${clipped > 200}`).toBe(
      "clipped px of the chart's own label: true",
    );
    // …and the whole name is still readable in the table, which is what
    // makes the clipped chart label a presentation loss rather than a
    // content one.
    await expect(textBox(heading).width).toBeLessThan(heading.clientWidth + 1);
  },
};

/**
 * 375px, wrapper-constrained rather than `parameters.viewport` — the gate
 * runs headless chromium at its own size, so a viewport parameter would
 * render this at desktop width in the run that matters.
 *
 * **Read the caveat before reading the pass.** A wrapper constrains width,
 * not the breakpoint. The gate's chromium is 1200px wide, so `sm:` still
 * applies inside the 375px box and the summary row renders its
 * `sm:grid-cols-3` layout: three cards at 117px each, measured, where a real
 * phone gets one card at full width. So what this story proves is the
 * stronger and narrower claim the convention describes — the *desktop*
 * layout squeezed into 375px does not scroll sideways — and the phone's own
 * single-column stack is not what is being rendered here.
 *
 * The parts that are genuinely narrow-width facts: the four-column table
 * fits in 343px with five models and seven-digit token counts
 * (`scrollWidth === clientWidth`, so the `overflow-x-auto` never becomes a
 * scroll container and there is no keyboard-unreachable region — the shape
 * F6 `render-queue`, L5 `shortcuts-sheet` and P1 `data-views` all failed on),
 * and the chart keeps its 104px category axis at this width, leaving roughly
 * 220px of plot, which is where a long model id would start costing real
 * information (see `LongContent`).
 *
 * The frame carries a `data-testid` because `layout: "centered"` wraps every
 * story in a ~1200px centring div, so `canvasElement.firstElementChild` is
 * that div and an overflow assertion against it passes for the wrong reason.
 */
export const Mobile: Story = {
  args: { periods: TWO_PERIODS, data: MODEL_BREAKDOWN_DATA, defaultPeriod: "7d" },
  render: (args) => (
    <div data-testid="usage-dashboard-mobile" className="w-[375px] max-w-full">
      <UsageDashboard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="usage-dashboard-mobile"]')!;
    const root = rootOf(canvasElement);

    // 1. Nothing scrolls sideways — the frame, the dashboard, or the table.
    await expect(frame.clientWidth).toBe(375);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    await expect(root.scrollWidth).toBe(root.clientWidth);
    const scroller = slot(root, "usage-dashboard-model-table").parentElement!;
    await expect(scroller.scrollWidth).toBe(scroller.clientWidth);

    // 2. The caveat, measured rather than asserted about: three cards in a
    //    row at 375px, because `sm:` resolves against the 1200px viewport.
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="usage-dashboard-summary-card"]'),
    );
    await expect(cards).toHaveLength(3);
    const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
    await expect(new Set(tops).size).toBe(1);
    await expect(Math.round(cards[0].getBoundingClientRect().width)).toBeLessThan(130);

    // 3. Every number is still real text at this width, which is the claim
    //    the decorative chart depends on.
    await expect(slot(root, "usage-dashboard-model-table")).toHaveTextContent("118.2 credits");
    await expect(slot(root, "usage-dashboard-model-table")).toHaveTextContent("312,000");
  },
};

/**
 * The three cost surfaces in this registry, side by side, because they read
 * the same numbers for three different people.
 *
 * **The choosing rule is the audience, not the shape.** M2
 * `credits-indicator` is one person's remaining balance, sized for app
 * chrome and linked to plan management — it answers "can I run this?". M3
 * `quota-meter` is one account's headroom per resource with a reset date —
 * "how much is left, and until when?". N6 is the team's period view, and the
 * only one of the three that can answer "which model do we change?", because
 * it is the only one that breaks a total down by the thing you can act on.
 * A product that ships N6 where M2 belongs has put a five-row table in a
 * toolbar; one that ships M2 where N6 belongs has told a team its spend went
 * up and nothing else — the "don't ship the total without the breakdown"
 * rule on this component's docs page, stated as a component choice.
 *
 * **All three carry `cssVars: WARNING_CSS_VARS`, and this story is not
 * evidence about any of it.** `apps/storybook/src/index.css` defines no
 * `--warning` and no `--color-warning` (`apps/docs/app/globals.css` defines
 * both), and Tailwind v4 emits nothing at all for an undefined utility. So
 * under this gate `text-warning` and `bg-warning` are absent rather than
 * wrong, and both halves were measured here: N6's rising-spend delta
 * computes `color: oklch(0.145 0 0)`, identical to the falling-spend delta
 * beside it, and M2's `low` pill — rendered in its alarm state on purpose —
 * computes `background-color: rgba(0, 0, 0, 0)` and the same default
 * foreground, while carrying `bg-warning text-warning-foreground` in its
 * class list. **A green axe pass on this story is not evidence about the
 * warning colour at all.** That is the whole content of CONTINUE.md §8's
 * "`--warning` is undefined in Storybook" entry, and the reason nothing
 * below asserts a colour.
 *
 * The comparison that survives is the design one, and it goes against N6.
 * M2's source explains that it paints its alarm states on the *surface*
 * because a warning tint used as foreground cannot reach 4.5:1 on a
 * near-white fill at any size; `a11y-baseline.md` records ~2.2:1 for
 * `text-warning` in the docs app, where the token resolves. N6's delta uses
 * exactly the foreground shape M2 rejected, so on the reading recorded there
 * it is a contrast failure that this environment cannot show. Recorded
 * rather than repainted: choosing a warning treatment for a delta is a
 * design decision, and the fix M2 chose (going solid) is not obviously right
 * for a percentage sitting inside a sentence.
 *
 * The one thing that does not depend on the token is asserted: every delta
 * states its direction in words and in `data-direction`, so removing the
 * colour removes nothing a reader needs.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[640px] flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <CreditsIndicator balance={420} total={5000} lowAt={500} onManage={() => {}} />
        <span className="text-muted-foreground text-xs">M2 — one person, one balance</span>
      </div>
      <QuotaMeter
        compact
        resources={[
          { label: "Messages", used: 4310, limit: 5000, resetsIn: "Resets in 3 days" },
          { label: "Image generations", used: 34, limit: 200, resetsIn: "Resets in 3 days" },
        ]}
      />
      <UsageDashboard periods={TWO_PERIODS} data={MODEL_BREAKDOWN_DATA} defaultPeriod="7d" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);

    // 1. Only N6 names the thing you can act on.
    const table = slot(root, "usage-dashboard-model-table");
    await expect(within(table).getByRole("rowheader", { name: "gpt-4o" })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[data-slot="usage-dashboard-model-row"]')).toHaveLength(5);

    // 2. M3 states a limit per resource; M2 states a balance. Neither can
    //    name a model, which is the whole distinction.
    const meters = canvas.getAllByRole("progressbar");
    await expect(meters.length).toBeGreaterThan(0);
    await expect(canvasElement).toHaveTextContent("420");
    // M2 is in its `low` state here, which is what makes the token point
    // above checkable: the classes are on the element and paint nothing.
    const pill = canvasElement.querySelector<HTMLElement>('[data-slot="credits-indicator"]')!;
    await expect(pill).toHaveClass("bg-warning");
    await expect(pill).toHaveClass("text-warning-foreground");

    // 3. Direction survives without the token: text and attribute, on every
    //    delta, whatever `--warning` resolves to.
    const deltas = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="usage-dashboard-delta"]'));
    await expect(deltas).toHaveLength(3);
    for (const delta of deltas) {
      const direction = delta.getAttribute("data-direction");
      await expect(["up", "down", "flat"]).toContain(direction);
      await expect(delta.textContent).toMatch(/^[+\-±][\d.]+% vs previous period$/);
    }
    await expect(deltas.map((d) => d.getAttribute("data-direction"))).toEqual(["up", "up", "down"]);
  },
};
