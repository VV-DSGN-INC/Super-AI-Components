import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";
import { FilterPanel } from "@/registry/super-ai/filter-panel";
import { FilterBarDocs } from "@/content/components/filter-bar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof FilterBar> = {
  title: "Super AI/Filter Bar",
  component: FilterBar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FilterBarDocs) } },
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

/**
 * The bar before anything is filtered — the state a library actually opens in.
 * There are no `FilterChip`s at all: an unfiltered bar is add-affordances and
 * the escape hatch to the full panel, and it is the only configuration in
 * which the row has nothing to remove.
 */
export const Unfiltered: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <AddFilterChip onClick={() => {}}>Type</AddFilterChip>
      <AddFilterChip onClick={() => {}}>Model</AddFilterChip>
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  ),
};

/**
 * Chips as facet toggles: `active` in, `onClick` out, no remove control. One
 * tab stop per chip, and `aria-pressed` carries the state — this is the shape
 * O2 `artifact-shell` uses for its single-select category row, where the user
 * switches between facets rather than accumulating them.
 */
export const ToggleChips: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <FilterChip active onClick={() => {}}>
        Image
      </FilterChip>
      <FilterChip onClick={() => {}}>Video</FilterChip>
      <FilterChip onClick={() => {}}>Upscale</FilterChip>
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  ),
};

/**
 * Applied facets that can be dismissed: the same chip plus `onRemove`, which
 * adds a sibling button inside the pill rather than nesting one control in
 * another. Two tab stops per chip is the cost of that, and the reason for it —
 * assistive tech needs a distinct target for "turn this facet off" and for
 * "drop it entirely". This is the shape O7 `records-shell` and J1
 * `asset-library` use.
 */
export const RemovableChips: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        Image
      </FilterChip>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        v7
      </FilterChip>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        Last 7 days
      </FilterChip>
      <AddFilterChip onClick={() => {}}>Style</AddFilterChip>
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  ),
};

/**
 * Every control in the bar takes `disabled`, because each one spreads its
 * props onto a real `<button>`. Two defects are visible here and neither is
 * fixed in this retrofit — both are API-shaped, not one-class.
 *
 * The first is that nothing in the component styles the disabled path: there
 * is no `disabled:` class anywhere in `filter-bar.tsx`, so a locked chip is
 * pixel-identical to a live one and the only signal a sighted user gets is
 * that clicking does nothing. Browser defaults do not help — these are
 * unstyled `<button>`s with explicit colour classes, so the UA greying never
 * applies.
 *
 * The second is narrower and worse: `disabled` reaches the toggle only.
 * `FilterChip` spreads `...props` onto its toggle button, while the remove
 * button is a sibling built from `onRemove` alone — so the first chip below is
 * a facet you cannot turn off and can still delete, by mouse or by Tab. A
 * caller disabling a chip has to withhold `onRemove` in the same breath.
 */
export const Disabled: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <FilterChip active disabled onClick={() => {}} onRemove={() => {}}>
        Image
      </FilterChip>
      <FilterChip disabled onClick={() => {}}>
        Video
      </FilterChip>
      <AddFilterChip disabled onClick={() => {}}>
        Style
      </AddFilterChip>
      <FiltersButton disabled onClick={() => {}} />
    </FilterBar>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this bar meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply and why the one that is missing is missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the only motion is a colour transition, and nothing branches on the media feature
 * All three controls carry `transition-colors` and nothing else: no
 * `animate-*`, no transform, no keyframe, and no `motion-reduce:` variant
 * anywhere in `filter-bar.tsx`. `vitest.config.ts` emulates
 * `prefers-reduced-motion: reduce` for every story in this project, so a
 * ReducedMotion story would render identically to `RemovableChips` and would
 * imply coverage of a branch that does not exist. A 150ms hover colour fade
 * is also not the motion the media feature is about.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the one place this component is measurably wrong.
 *
 * Two of the chip's spacing classes are physical rather than logical, and
 * both only apply to the removable chip. The toggle takes `pr-1` when
 * `onRemove` is present, to tighten the gap between the label and the X; the
 * remove button takes `mr-1` to hold itself off the pill's edge. Under `rtl`
 * the X moves to the left of the label while both classes stay on the right,
 * so the tightened padding lands on the pill's outer edge and the X ends up
 * pressed against the border with a full `px-3` gap behind it. `pe-1` / `me-1`
 * is the fix; it is a change to a shipped class rather than one of the two
 * sanctioned one-class additions, so it is recorded here and in the report
 * rather than made silently.
 *
 * Everything else mirrors correctly: the bar is `flex` with `gap`, and the
 * leading Plus and Sliders icons are ordinary flex children, so they follow
 * the writing direction without help.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <FilterBar {...args}>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          Image
        </FilterChip>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          v7
        </FilterChip>
        <AddFilterChip onClick={() => {}}>Style</AddFilterChip>
        <FiltersButton onClick={() => {}} />
      </FilterBar>
    </div>
  ),
};

/**
 * Tab traversal across a bar with two applied facets, one plain toggle, an add
 * chip and the panel button — seven stops, and the count is the point.
 *
 * A removable chip contributes two stops, not one, and they are adjacent:
 * label then its own X. That is the spec's "remove buttons are siblings of the
 * chip label, not nested inside it" made observable, and it is the rule most
 * at risk from a refactor that makes the whole pill clickable — which would
 * halve this count and nest a button inside a button.
 *
 * The second fact is the remove buttons' names. They read "Remove Image
 * filter" and "Remove v7 filter", built from each chip's own text, so a screen
 * reader user tabbing the row is never offered two identical X controls.
 *
 * The loop is bounded by the expected stop count rather than running until
 * focus leaves the canvas, so adding or dropping a stop fails on the count
 * instead of quietly changing how many assertions ran.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        Image
      </FilterChip>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        v7
      </FilterChip>
      <FilterChip onClick={() => {}}>Upscale</FilterChip>
      <AddFilterChip onClick={() => {}}>Style</AddFilterChip>
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const removes = canvas.getAllByRole("button", { name: /^Remove / });
    await expect(removes).toHaveLength(2);
    await expect(new Set(removes.map((b) => b.getAttribute("aria-label"))).size).toBe(2);

    // Two applied chips (label + X each), one plain toggle, add, filters.
    const EXPECTED_STOPS = 7;
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(EXPECTED_STOPS);

    const visited: HTMLElement[] = [];
    for (let i = 0; i < EXPECTED_STOPS; i++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement | null;
      if (!focused || !canvasElement.contains(focused)) break;
      visited.push(focused);

      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }

    await expect(visited).toHaveLength(EXPECTED_STOPS);
    // Document order is tab order — nothing here sets tabindex — and each X
    // follows its own label rather than being collected at the end.
    await expect(visited).toEqual(buttons);
    await expect(visited[1]).toBe(removes[0]);
    await expect(visited[3]).toBe(removes[1]);
  },
};

/**
 * The controlled pair, which for this component is `active` in and `onClick` /
 * `onRemove` out. The bar owns no state whatsoever — no `useState`, no
 * `defaultActive` — so a chip cannot toggle itself, and the row you see is
 * exactly what the caller last handed it.
 *
 * The play function pins the half that a refactor would break silently:
 * clicking the chip that is already on re-applies the same value, and the chip
 * must stay pressed. An uncontrolled toggle would flip off there and every
 * screenshot would look the same.
 *
 * Worth knowing before you wire it: neither callback carries a payload.
 * `onClick` hands you a MouseEvent and `onRemove` is `() => void`, so which
 * facet was clicked comes from your own closure — as it does here, where the
 * row is built by mapping over the facet list.
 */
const appliedFacets: string[] = [];

export const Controlled: Story = {
  render: function ControlledScopeRow() {
    const [scope, setScope] = React.useState("Image");
    return (
      <div className="flex flex-col gap-2">
        <FilterBar>
          {["Image", "Video", "Upscale"].map((facet) => (
            <FilterChip
              key={facet}
              active={facet === scope}
              onClick={() => {
                appliedFacets.push(facet);
                setScope(facet);
              }}
            >
              {facet}
            </FilterChip>
          ))}
        </FilterBar>
        <p className="text-foreground text-xs">{`Showing: ${scope}`}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    appliedFacets.length = 0;
    const canvas = within(canvasElement);
    const image = canvas.getByRole("button", { name: "Image" });
    const video = canvas.getByRole("button", { name: "Video" });

    // Clicking the chip that is already on: the callback fires with the facet
    // the caller needs, and re-rendering with the same value holds the chip
    // fixed instead of toggling it off.
    await userEvent.click(image);
    await expect(appliedFacets).toEqual(["Image"]);
    await expect(image).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("Showing: Image")).toBeInTheDocument();

    // A different chip: the row moves only because the caller moved it.
    await userEvent.click(video);
    await expect(appliedFacets).toEqual(["Image", "Video"]);
    await expect(video).toHaveAttribute("aria-pressed", "true");
    await expect(image).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByText("Showing: Video")).toBeInTheDocument();
  },
};

/**
 * The two slots that really are optional, emptied. `FiltersButton` falls back
 * to the visible word "Filters", and `AddFilterChip` falls back to the
 * accessible name "Add filter" while rendering as a bare dashed plus — named,
 * but a ~26px tall icon-only target with nothing on screen saying what it
 * adds. Label it unless the surrounding column already does.
 *
 * A third slot only looks optional. `FilterChip`'s children are typed
 * optional, but the toggle has no fallback: an empty chip is a button with no
 * accessible name, which is an axe `button-name` failure rather than a
 * degraded rendering, so it is described here instead of rendered into a gate
 * that runs at `test: "error"`.
 *
 * The related trap is subtler and is a real defect, recorded rather than
 * fixed: the remove button's name is built from `typeof children === "string"`
 * only. Wrap a label in any element — `<FilterChip><span>Image</span>` — and
 * the name silently degrades to "Remove filter", which every removable chip in
 * the row then shares.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <FilterBar {...args}>
      <AddFilterChip onClick={() => {}} />
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both fallbacks are contracts, not conveniences: they are what keeps an
    // unlabelled bar out of the unnamed-button category.
    await expect(canvas.getByRole("button", { name: "Add filter" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  },
};

/**
 * An 85-character facet label — ordinary for a saved prompt or search, which
 * is whatever the user typed. The chip's answer is to wrap, not to truncate:
 * the toggle is `inline-flex … px-3 py-1` with no `max-w`, no `truncate` and
 * no `whitespace-nowrap`, so the text breaks across lines inside the pill and
 * `rounded-full` stretches into a tall lozenge, with the X still centred
 * vertically against a multi-line label.
 *
 * Nothing is lost, which is the argument for it. But a chip that is four lines
 * tall has stopped being a chip, so cap what you put in one at a facet name
 * and let the panel carry the sentence.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <FilterBar {...args}>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          Prompt contains: isometric city at golden hour with volumetric light and long shadows
        </FilterChip>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          v7
        </FilterChip>
        <FiltersButton onClick={() => {}} />
      </FilterBar>
    </div>
  ),
};

/**
 * 375px, with the facet count a real library reaches by lunchtime.
 *
 * The row wraps. `FilterBar` is `flex flex-wrap`, so the bar grows downwards
 * — five facets become three or four stacked lines and the content below moves
 * with them. Nothing is hidden and nothing scrolls sideways, which the play
 * function pins.
 *
 * That is worth stating plainly because it is not what the spec describes:
 * "overflow collapses to a count (+3)" has no implementation here. There is no
 * overflow component, no `maxVisible`, no counter — the choice is wrap or
 * escalate to J2 `filter-panel`, and on a phone the escalation comes early.
 * Recorded as a gap in the report.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <FilterBar {...args}>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          Image
        </FilterChip>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          v7
        </FilterChip>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          Last 7 days
        </FilterChip>
        <FilterChip active onClick={() => {}} onRemove={() => {}}>
          Cinematic
        </FilterChip>
        <AddFilterChip onClick={() => {}}>Style</AddFilterChip>
        <FiltersButton onClick={() => {}} />
      </FilterBar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('[data-slot="filter-bar"]') as HTMLElement;
    await expect(bar).not.toBeNull();
    // Wrapping, not scrolling: no applied facet is off-screen at this width.
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  },
};

/**
 * Three rows that look alike and answer different questions.
 *
 * - **Filter bar** narrows a list that already exists. A chip is a facet, its
 *   pressed state means "results are limited to this", and the X takes the
 *   limit off. Applied facets stay visible because the user has to be able to
 *   see why the library looks empty.
 * - **Choice chips** set a parameter for the next run. Nothing is being
 *   narrowed and nothing is removable — the row is a radio group with a ring,
 *   and exactly one value is always on.
 * - **Filter panel** is the same job as the bar at rail scale: counts per
 *   facet, groups that collapse, an overflow button per group. The spec puts
 *   the crossover at roughly six facets, and the honest signal is counts — the
 *   moment a user needs to know how many results a facet would leave *before*
 *   clicking it, the bar cannot answer and the panel can.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Filter bar — narrows the library</p>
        <FilterBar>
          <FilterChip active onClick={() => {}} onRemove={() => {}}>
            Image
          </FilterChip>
          <FilterChip active onClick={() => {}} onRemove={() => {}}>
            v7
          </FilterChip>
          <FiltersButton onClick={() => {}} />
        </FilterBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Choice chips — sets the next run</p>
        <ChoiceChips defaultValue="16:9">
          <ChoiceChip value="1:1">1:1</ChoiceChip>
          <ChoiceChip value="4:5">4:5</ChoiceChip>
          <ChoiceChip value="16:9">16:9</ChoiceChip>
        </ChoiceChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Filter panel — the same job, past six facets</p>
        <FilterPanel
          title="Filters"
          defaultSelected={{ type: ["image"] }}
          sections={[
            {
              id: "type",
              label: "Type",
              facets: [
                { value: "image", label: "Image", count: 1284 },
                { value: "video", label: "Video", count: 96 },
                { value: "upscale", label: "Upscale", count: 312 },
              ],
            },
            {
              id: "model",
              label: "Model",
              facets: [
                { value: "v7", label: "v7", count: 812 },
                { value: "v6.1", label: "v6.1", count: 407 },
              ],
            },
          ]}
        />
      </section>
    </div>
  ),
};
