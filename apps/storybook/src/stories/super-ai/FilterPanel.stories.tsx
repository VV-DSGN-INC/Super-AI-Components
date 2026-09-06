import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";
import {
  FilterPanel,
  type FilterPanelSection,
  type FilterPanelViewGroup,
  type SavedSearch,
} from "@/registry/super-ai/filter-panel";
import { FilterPanelDocs } from "@/content/components/filter-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const TYPE: FilterPanelSection = {
  id: "type",
  label: "Type",
  facets: [
    { value: "image", label: "Image", count: 1284 },
    { value: "video", label: "Video", count: 96 },
    { value: "upscale", label: "Upscale", count: 312 },
    // The dead end: disabled, and still showing its zero.
    { value: "3d", label: "3D", count: 0 },
  ],
};

const MODEL: FilterPanelSection = {
  id: "model",
  label: "Model",
  facets: [
    { value: "v7", label: "v7", count: 812 },
    { value: "v6.1", label: "v6.1", count: 407 },
    { value: "niji-6", label: "niji 6", count: 268 },
  ],
};

const STYLE: FilterPanelSection = {
  id: "style",
  label: "Style",
  visibleCount: 4,
  facets: [
    { value: "cinematic", label: "Cinematic", count: 214 },
    { value: "anime", label: "Anime", count: 188 },
    { value: "illustration", label: "Illustration", count: 176 },
    { value: "photographic", label: "Photographic", count: 143 },
    { value: "isometric", label: "Isometric", count: 88 },
    { value: "watercolour", label: "Watercolour", count: 61 },
    { value: "line-art", label: "Line art", count: 54 },
    { value: "collage", label: "Collage", count: 37 },
  ],
};

const meta: Meta<typeof FilterPanel> = {
  title: "Super AI/Filter Panel",
  component: FilterPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FilterPanelDocs) } },
  decorators: [
    // The rail as it actually ships: a fixed-width bordered column. Stories
    // that need to control their own width opt out with `parameters.rail:
    // false`, because a 375px frame nested inside this 288px one measures
    // 288px — mechanical fact 2 in story-conventions.md, met from the outside.
    (Story, context) =>
      context.parameters.rail === false ? (
        <Story />
      ) : (
        <div className="w-72 rounded-lg border p-4">
          <Story />
        </div>
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

/**
 * The point of the component. Every facet carries the number of results it
 * would leave, and 3D — which would leave none — is disabled and still shows
 * its zero rather than being dimmed or dropped.
 */
export const FacetCounts: Story = {
  args: { sections: [TYPE, MODEL], defaultSelected: { model: ["v7"] } },
};

/**
 * Overflow inside one group: four styles on screen, one button naming the four
 * still hidden. Not a second section, and not an infinite list.
 */
export const SeeMore: Story = {
  args: { sections: [STYLE], defaultSelected: { style: ["cinematic"] } },
};

/**
 * Sections collapse and remember. Type is closed with a filter still applied,
 * so its header keeps saying "1 selected" — a collapsed group must never hide
 * the reason the result list is short.
 */
export const CollapsedSection: Story = {
  args: {
    sections: [TYPE, MODEL, { ...STYLE, defaultOpen: false }],
    defaultSelected: { type: ["video"] },
    defaultOpenSections: ["model"],
  },
};

/**
 * The top of the filtering scale ladder. Saved searches are their own region
 * above the facets — buttons, not checkboxes, because picking one replaces the
 * filter set instead of narrowing it.
 */
export const SavedSearches: Story = {
  args: { sections: [TYPE, MODEL] },
  render: function SavedSearchesStory(args) {
    const [active, setActive] = useState<string | null>("upscales");
    return (
      <FilterPanel
        {...args}
        savedSearches={[
          { id: "upscales", label: "Upscales this month", count: 42 },
          { id: "liked-v7", label: "Liked v7 cinematic", count: 18 },
          { id: "brief", label: "Client brief — moodboard", count: 7 },
        ]}
        activeSavedSearchId={active}
        onSavedSearchSelect={setActive}
      />
    );
  },
};

/**
 * Sort and layout change how results are shown, not which ones survive, so
 * they sit above the facets as single-select radio groups rather than
 * combinable checkboxes.
 */
export const ViewOptions: Story = {
  args: {
    sections: [TYPE],
    viewOptions: [
      {
        id: "sort",
        label: "Sort",
        defaultValue: "newest",
        options: [
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "rating", label: "Rating" },
        ],
      },
      {
        id: "layout",
        label: "Layout",
        defaultValue: "grid",
        options: [
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this rail meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing here animates, and the only motion class in the composed tree is a colour crossfade
 * Read back rather than assumed. `grep -E "animate-|transition-|duration-|
 * translate|scale-|rotate" filter-panel.tsx` returns nothing: collapsing a
 * section is a conditional render and see-more is a slice of an array, so
 * neither has a frame to suppress — the source says as much where it declines
 * to layer Base UI's `Collapsible` on top of A12. Of the three composed
 * children, `choice-chips` already carries `motion-reduce:transition-none`,
 * the vendored checkbox's indicator is explicitly `transition-none`, and
 * `reset-affordance`'s `transition-colors` is the recorded example in
 * story-conventions.md mechanical fact 3 — a crossfade of a text colour moves
 * nothing, so suppressing it would document no branch. A `ReducedMotion`
 * story would render pixel-for-pixel identical to `FacetCounts` and claim a
 * branch the component does not have.
 * ---------------------------------------------------------------------- */

const SAVED: SavedSearch[] = [
  { id: "upscales", label: "Upscales this month", count: 42 },
  { id: "liked-v7", label: "Liked v7 cinematic", count: 18 },
];

const SORT: FilterPanelViewGroup = {
  id: "sort",
  label: "Sort",
  defaultValue: "newest",
  options: [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ],
};

/**
 * Right-to-left. Every layout decision in the rail is a flex row plus a gap,
 * so the mirroring is mostly free and worth seeing once: a facet reads
 * checkbox, label, count from the right, the section header's "N selected"
 * moves to the left of its own trigger, and the see-more button's `self-start`
 * lands at the right edge of the group.
 *
 * One class was not free and is fixed in this wave. The saved-search button
 * carried `text-left`, a physical class in a row where every other participant
 * is a class and nothing else decides a side — so it is the byte-identical
 * `text-start` swap CONTINUE.md §8 sanctions, and the F5 counter-example (a
 * class paired with clip geometry) does not apply. Measured with `text-left`
 * put back: a short saved-search name sat against the left edge of a
 * right-to-left row with **65px of slack on the wrong side of the text**. The
 * play function asserts the geometry before it reads the class name back, so
 * the claim is the rendering rather than the string, and a revert fails on the
 * measurement — H3 `track-lane`'s pattern.
 *
 * Nothing here needs a `DirectionProvider`: the rail mounts no Base UI
 * composite. The vendored checkbox is direction-agnostic and `choice-chips` is
 * hand-rolled with no arrow-key handler at all, so wave 1's finding — Base UI
 * composites never learn about RTL without a provider — has no instance in
 * this component. It would return the moment the `choice-chips` TODO for a
 * roving tabindex is honoured.
 */
export const RTL: Story = {
  parameters: { rail: false },
  render: () => (
    <div dir="rtl" className="w-72 rounded-lg border p-4">
      <FilterPanel
        sections={[TYPE, MODEL, { ...STYLE, visibleCount: 2 }]}
        defaultSelected={{ model: ["v7"] }}
        savedSearches={SAVED}
        activeSavedSearchId="upscales"
        viewOptions={[SORT]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="filter-panel-saved-search-label"]')!;
    const button = label.closest<HTMLElement>('[data-slot="filter-panel-saved-search"]')!;

    // What the swap does on screen, measured first so this is the assertion
    // that carries the claim: "Upscales this month" is shorter than the slot it
    // sits in, so alignment is visible. Mirrored, the text hugs the right
    // (inline-end) edge of its box and the slack falls to the left. Verified by
    // putting `text-left` back — this pair fails before the class read below
    // does.
    const box = label.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    await expect(box.right - text.right).toBeLessThan(2);
    await expect(text.left - box.left).toBeGreaterThan(8);

    // …and the swap itself, so a revert cannot pass on a rounding.
    await expect(getComputedStyle(button).textAlign).toBe("start");

    // A facet reads checkbox → label → count from the right.
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-facet"][data-value="image"]',
    )!;
    const lefts = ["checkbox", "filter-panel-facet-label", "filter-panel-facet-count"].map(
      (slot) => row.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.getBoundingClientRect().left,
    );
    await expect(lefts[2]).toBeLessThan(lefts[1]);
    await expect(lefts[1]).toBeLessThan(lefts[0]);

    // The header's `justify-between` mirrors too: the trigger takes the right,
    // the "1 selected" badge the left.
    const header = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-section"][data-section="model"] [data-slot="section-header"]',
    )!;
    const trigger = header.querySelector<HTMLElement>('[data-slot="section-header-trigger"]')!;
    const action = header.querySelector<HTMLElement>('[data-slot="section-header-action"]')!;
    await expect(action.getBoundingClientRect().left).toBeLessThan(trigger.getBoundingClientRect().left);

    // `self-start` is a logical alignment, so the see-more sits at the group's
    // inline start — the right edge — with the slack on the left.
    const more = canvasElement.querySelector<HTMLElement>('[data-slot="filter-panel-see-more"]')!;
    const group = more.parentElement!.getBoundingClientRect();
    const moreBox = more.getBoundingClientRect();
    await expect(group.right - moreBox.right).toBeLessThan(2);
    await expect(moreBox.left - group.left).toBeGreaterThan(8);
  },
};

const KEYBOARD_SECTIONS: FilterPanelSection[] = [
  TYPE,
  { ...STYLE, visibleCount: 2 },
  { ...MODEL, facets: MODEL.facets.slice(0, 2) },
];

/**
 * What a focus treatment actually paints, for the differential in
 * `KeyboardOrder`. Deliberately narrower than `focusTreatmentSignature`, which
 * also carries `outlineWidth` — and every control in this rail carries
 * `focus-visible:outline-none`, which leaves `outline-style: none` while the
 * used width flips 3px → 1px on focus. That flip paints nothing and would make
 * the signature differential report "changed" on an element whose appearance is
 * identical, which is the exact false positive the differential was added to
 * remove. Box-shadow and border-colour are what the eye sees here.
 */
const paintedFocus = (el: Element) => {
  const style = getComputedStyle(el);
  return `${style.boxShadow}|${style.borderColor}`;
};

/**
 * The whole rail walked from the top, and the fact the anatomy table cannot
 * show: **three kinds of stop remove themselves, and one of them takes a
 * control out of the tab order rather than out of the viewport.**
 *
 * - The zero-count facet (3D) is `disabled`. Base UI renders the checkbox as a
 *   span, and `useFocusableWhenDisabled` gives a disabled non-native button
 *   `tabindex="-1"`, so Tab genuinely skips it — the docs' claim, measured,
 *   and not the neighbouring trap where Base UI leaves `tabindex="0"` on a
 *   disabled native button.
 * - A collapsed section unmounts its facets **and its see-more button**, so
 *   Model contributes exactly one stop. That is I2 `property-inspector`'s
 *   shape: a collapsed group leaves the tab order entirely, which is why the
 *   header keeps its "N selected" badge rather than relying on the rows being
 *   somewhere below.
 * - Clear-all is mounted at all times and `disabled` at `state="default"`, so
 *   the rail's first stop appears and disappears with the selection. Here
 *   something is selected, so it is stop 0.
 *
 * Two measurements worth keeping. Clear-all is A11 at `scope="group"`, which
 * is `size-6` — 24×24, exactly WCAG 2.2's floor and the one scope that clears
 * it; A11's 20×20 `scope="row"` problem recorded in CONTINUE.md §8 reaches
 * I2's column of rows and not this rail, because the rail mounts one reset and
 * mounts it at group scope. That single reset is also why this component
 * escapes A11's other recorded finding: there is no per-row reset to collide
 * with a namesake in a second section, and the default `clearLabel` names the
 * action ("Clear all filters") rather than a row.
 *
 * **The walk makes the stronger claim, and one stop cannot meet it.** Every
 * stop is checked twice: `settledFocusRing` (does it paint a treatment) and a
 * differential taken from the stop's own appearance one tab earlier (did focus
 * *cause* it). H6 `waveform-editor` is why the second exists, and the baseline
 * costs nothing here because the next stop is read while focus still sits on
 * the previous one — no blur, so nothing about the sequence is disturbed.
 *
 * Thirteen of the fourteen stops pass both. **The selected view chip passes the
 * first and fails the second, so it is excluded by name and recorded rather
 * than asserted.** `choice-chips` paints `ring-ring border-ring ring-2` on a
 * selected chip permanently, and its `focus-visible:ring-2
 * focus-visible:ring-ring` is the same 2px at the same `oklch(0.708 0 0)`.
 * Measured across the tab that focuses it, the box-shadow reads
 * `oklch(0.708 0 0) 0px 0px 0px 2px` before and after and the border-colour is
 * `oklch(0.708 0 0)` both times — byte-identical. `focus-visible:outline-none`
 * then removes the user-agent outline that would otherwise have distinguished
 * it. So a keyboard user landing on the already-selected chip gets no signal
 * that focus arrived; the fix belongs to `choice-chips`, and pinning the
 * measurement here would make that fix a failure in this file.
 *
 * A second finding fell out of the same measurement, and it is about the
 * shared helper rather than this rail. `focusTreatmentSignature` includes
 * `outlineWidth`, which on every control here flips 3px → 1px on focus while
 * `outline-style` reads `none` throughout — so the signature differential
 * reports "changed" on all fourteen stops, the selected chip included. It is
 * the fourth hole in that helper's series and the reason `paintedFocus` above
 * is narrower.
 *
 * Recorded and not asserted for the same reason: pressing clear-all clears the
 * selection, which is the state that disables clear-all, so focus drops to
 * `<body>` and the next Tab restarts at the top of the page. The docs module's
 * first focus bullet already carries it.
 */
export const KeyboardOrder: Story = {
  args: {
    sections: KEYBOARD_SECTIONS,
    defaultSelected: { type: ["image"], model: ["v7"] },
    defaultOpenSections: ["type", "style"],
    savedSearches: SAVED,
    viewOptions: [SORT],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The dead end is out of the tab order, not merely dimmed.
    const dead = canvas.getByRole("checkbox", { name: "3D 0 no matches" });
    await expect(dead).toHaveAttribute("tabindex", "-1");

    // The collapsed section keeps its signal and drops its controls.
    const model = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-section"][data-section="model"]',
    )!;
    await expect(model).toHaveAttribute("data-state", "closed");
    await expect(within(model).getByText("1 selected")).toBeInTheDocument();
    await expect(within(model).queryAllByRole("checkbox")).toHaveLength(0);
    await expect(model.querySelector('[data-slot="filter-panel-see-more"]')).toBeNull();

    const clear = canvas.getByRole("button", { name: "Clear all filters" });
    // A11 at group scope clears WCAG 2.2's 24×24; at row scope it would not.
    const clearBox = clear.getBoundingClientRect();
    await expect(clearBox.width).toBeGreaterThanOrEqual(24);
    await expect(clearBox.height).toBeGreaterThanOrEqual(24);

    const stops = [
      clear,
      canvas.getByRole("radio", { name: "Newest" }),
      canvas.getByRole("radio", { name: "Oldest" }),
      canvas.getByRole("button", { name: /Upscales this month/ }),
      canvas.getByRole("button", { name: /Liked v7 cinematic/ }),
      canvas.getByRole("button", { name: /^Type/ }),
      canvas.getByRole("checkbox", { name: "Image 1284" }),
      canvas.getByRole("checkbox", { name: "Video 96" }),
      canvas.getByRole("checkbox", { name: "Upscale 312" }),
      // "3D 0 no matches" would sit here; it is disabled, so it does not.
      canvas.getByRole("button", { name: /^Style/ }),
      canvas.getByRole("checkbox", { name: "Cinematic 214" }),
      canvas.getByRole("checkbox", { name: "Anime 188" }),
      canvas.getByRole("button", { name: "Show 6 more in Style" }),
      canvas.getByRole("button", { name: /^Model/ }),
    ];
    await expect(new Set(stops).size).toBe(stops.length);

    // The one stop whose treatment focus does not change; see the description.
    const selectedChip = stops[1];
    await expect(selectedChip).toHaveAttribute("aria-checked", "true");

    for (const stop of stops) {
      // The baseline is taken while focus is still on the *previous* stop, so
      // the differential costs no blur and does not disturb the sequence — the
      // objection story-conventions.md raises against differentials inside a
      // tab walk does not apply when the next stop is read ahead.
      const before = paintedFocus(stop);

      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      await expect(focused.matches(":focus-visible")).toBe(true);
      // `settledFocusRing`, not `boxShadow !== "none"` — the string check
      // passes on Tailwind's present-but-transparent off-state ring.
      await settledFocusRing(focused, waitFor);

      // …and then the stronger claim, which the absolute check cannot make:
      // focus *caused* the treatment. Every stop but one satisfies it.
      if (stop !== selectedChip) {
        await expect(paintedFocus(stop)).not.toBe(before);
      }
    }

    // The facet's ring belongs to the 16px checkbox, not to the `<label>` that
    // spans the row — the docs' last focus bullet, measured. A pointer user
    // gets the whole row; a keyboard user gets the box.
    const facetRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-facet"][data-value="image"]',
    )!;
    await expect(facetRow.contains(stops[6])).toBe(true);
    await expect(stops[6].getBoundingClientRect().width).toBeLessThan(
      facetRow.getBoundingClientRect().width / 2,
    );

    // The rail does not trap: one more tab leaves it.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

const onSelectedChangeSpy = fn();
const onOpenSectionsChangeSpy = fn();

/**
 * Two controlled pairs, and one piece of state that has neither.
 *
 * `selected` / `onSelectedChange` and `openSections` / `onOpenSectionsChange`
 * are both genuine: passing the value switches the panel off its internal
 * state, a click reports the intent, and nothing moves until the host applies
 * it. The host below re-renders on every callback while holding both values
 * frozen, so this proves the stronger claim — not "the DOM did not change
 * because nothing re-rendered", but "a real re-render with an unchanged value
 * holds the panel fixed". `data-renders` on the root is how the play function
 * confirms the re-render happened at all.
 *
 * **The third state has no pair, and it is E4 `preset-grid`'s shape one step
 * milder.** See-more expansion lives in `FilterPanelSectionView`'s own
 * `useState`, with no prop in and none out. Two consequences. A host swapping
 * `sections` on a mounted rail — the ordinary move, since facet counts are
 * recomputed as filters apply — carries the old expansion in, because the
 * section component is keyed by `id` and never remounts; `visibleCount` is
 * then ignored for that group. And collapsing the section does not clear it
 * either: only the facet list is conditionally rendered, so an expansion
 * survives a collapse and reopen, which is not what the source comment beside
 * it ("local to the section and to this mount") reads like at first glance.
 * Milder than E4 because this expansion is a toggle rather than one-way — the
 * user can press "Show fewer" — so it strands the host, not the person.
 * Recorded, not asserted and not fixed here: adding the prop is an API
 * decision.
 */
export const Controlled: Story = {
  parameters: { rail: false },
  render: function ControlledStory() {
    const [renders, setRenders] = useState(0);
    const bump = () => setRenders((n) => n + 1);
    return (
      <div className="w-72 rounded-lg border p-4">
        <FilterPanel
          data-renders={renders}
          sections={[STYLE, MODEL]}
          selected={{ style: ["cinematic"] }}
          onSelectedChange={(next) => {
            onSelectedChangeSpy(next);
            bump();
          }}
          openSections={["style"]}
          onOpenSectionsChange={(next) => {
            onOpenSectionsChangeSpy(next);
            bump();
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    onSelectedChangeSpy.mockClear();
    onOpenSectionsChangeSpy.mockClear();
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="filter-panel"]')!;

    await expect(root).toHaveAttribute("data-renders", "0");
    await expect(canvas.getByRole("checkbox", { name: "Cinematic 214" })).toBeChecked();

    const anime = canvas.getByRole("checkbox", { name: "Anime 188" });
    await userEvent.click(anime);

    // The callback carries the whole next map, keyed by section — what a
    // consumer has to apply, not a bare value.
    await expect(onSelectedChangeSpy).toHaveBeenCalledTimes(1);
    await expect(onSelectedChangeSpy).toHaveBeenLastCalledWith({ style: ["cinematic", "anime"] });
    // A real re-render happened, and it moved nothing.
    await expect(root).toHaveAttribute("data-renders", "1");
    await expect(anime).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Cinematic 214" })).toBeChecked();

    // Re-rendering again with the same `selected` holds it fixed rather than
    // drifting toward the interaction.
    await userEvent.click(anime);
    await expect(onSelectedChangeSpy).toHaveBeenCalledTimes(2);
    await expect(onSelectedChangeSpy).toHaveBeenLastCalledWith({ style: ["cinematic", "anime"] });
    await expect(root).toHaveAttribute("data-renders", "2");
    await expect(anime).not.toBeChecked();

    // The second pair, same shape: Model is closed because the host says so.
    const model = canvas.getByRole("button", { name: /^Model/ });
    await expect(model).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(model);
    await expect(onOpenSectionsChangeSpy).toHaveBeenLastCalledWith(["style", "model"]);
    await expect(model).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("checkbox", { name: "v7 812" })).not.toBeInTheDocument();

    // The state with no pair: this one *does* move on click, and a host has no
    // way to read it, set it or reset it.
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(4);
    await userEvent.click(canvas.getByRole("button", { name: "Show 4 more in Style" }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
  },
};

/**
 * What emptying the optional text slots costs, in the two places this rail
 * lets you empty them.
 *
 * **`title={null}` takes clear-all with it.** The prop is documented as "drop
 * the header row entirely", and the header is where A11 lives — so a caller
 * who supplies their own heading above the rail silently removes the only
 * control that returns the list to unfiltered. Nothing in the types or the
 * docs says the two travel together. The left panel below has a filter applied
 * and no way to clear it.
 *
 * **An empty `label` collapses a facet to its own count.** The row's whole
 * text is the checkbox's accessible name, so a facet with `label=""` and 512
 * results announces as "512" — a control named by a number, the same
 * empty-string collapse D3 `context-chips`, I2 `property-inspector` and H7
 * `stem-mixer` each found from a different direction. It is not an axe
 * failure, because the name is not empty; it is merely useless. A saved search
 * behaves the same way through a different code path: its `aria-label` joins
 * the defined parts, so an empty label with a count announces as "9".
 *
 * The third case is not rendered, and the gate is the reason. A saved search
 * with an empty label *and* no count joins to `""`, which React writes out as
 * `aria-label=""`; the tick beside it is `aria-hidden` and the label span is
 * empty, so nothing is left to name the button — the `button-name` shape H4
 * `transcript-editor` measured on its own empty token. `preview.tsx` runs axe
 * at `test: "error"`, so this story documents it instead of shipping a red
 * gate. `savedSearchesLabel=""` is the same family one level up: it names the
 * region's A12 header, which is the group's only `aria-labelledby` target.
 */
export const EmptyLabel: Story = {
  parameters: { rail: false },
  render: () => (
    <div className="flex gap-4">
      <div className="w-64 rounded-lg border p-4">
        <FilterPanel title={null} sections={[TYPE]} defaultSelected={{ type: ["video"] }} />
      </div>
      <div className="w-64 rounded-lg border p-4">
        <FilterPanel
          sections={[
            {
              id: "collection",
              label: "Collection",
              facets: [
                { value: "untitled", label: "", count: 512 },
                { value: "campaign", label: "Q3 campaign", count: 64 },
              ],
            },
          ]}
          savedSearches={[{ id: "unnamed", label: "", count: 9 }]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Dropping the title drops the only route back to an unfiltered list.
    const headless = canvasElement.querySelectorAll<HTMLElement>('[data-slot="filter-panel"]')[0]!;
    await expect(headless.querySelector('[data-slot="filter-panel-header"]')).toBeNull();
    await expect(headless.querySelector('[data-slot="reset-affordance"]')).toBeNull();
    await expect(canvas.queryAllByRole("button", { name: "Clear all filters" })).toHaveLength(1);
    // …while the filter it cannot clear is still applied.
    await expect(within(headless).getByRole("checkbox", { name: "Video 96" })).toBeChecked();

    // A facet named by a bare number, beside the one that reads properly.
    await expect(canvas.getByRole("checkbox", { name: "512" })).toBeInTheDocument();
    await expect(canvas.getByRole("checkbox", { name: "Q3 campaign 64" })).toBeInTheDocument();
    // And the saved search, same collapse through a different code path.
    await expect(canvas.getByRole("button", { name: "9" })).toBeInTheDocument();
  },
};

// 91 and 85 characters — the convention's ~90, in the language a collection
// name and a saved search really carry.
const LONG_COLLECTION =
  "Q3 campaign hero renders, portrait crops, client-approved v7 cinematic upscales only, final";
const LONG_SAVED = "Client brief moodboard, upscales only, v7 cinematic, portrait crops, last thirty days";

/**
 * Author-supplied text at ~90 characters, in the width the rail actually
 * ships at. Three slots take it and the component answers each the same way,
 * which is the right answer and worth stating: **the label gives up
 * characters, the count keeps every pixel.** `filter-panel-facet-label` is
 * `min-w-0 flex-1 truncate` and `filter-panel-facet-count` is `shrink-0`, so a
 * long collection name ellipsises while its 41 stays whole. A truncated number
 * would be a wrong number, so the count is the one thing in the row that must
 * not shrink.
 *
 * The half only a story can show: **truncation is visual only.** The row is
 * the checkbox's accessible name, and a name is computed from text content
 * rather than from what is painted, so a screen-reader user hears all 91
 * characters and the count while a sighted user sees an ellipsis. That is the
 * good outcome and it is asserted below — but it also means a rail of long
 * facet names is unreadable by eye and perfectly readable by ear, which
 * inverts the usual failure and is worth knowing before truncating harder.
 *
 * A long *section* label behaves the same way in the header and, less happily,
 * lands whole inside the see-more button's `aria-label` ("Show 2 more in <91
 * characters>"). That name exists so six see-mores down a rail stay tellable
 * apart; at this length the qualifier is longer than anything a listener
 * needs.
 */
export const LongContent: Story = {
  args: {
    sections: [
      {
        id: "collection",
        label: LONG_COLLECTION,
        visibleCount: 2,
        facets: [
          { value: "hero", label: LONG_COLLECTION, count: 41 },
          { value: "crops", label: "Portrait crops", count: 18 },
          { value: "stills", label: "Stills", count: 7 },
          { value: "loops", label: "Loops", count: 3 },
        ],
      },
    ],
    savedSearches: [{ id: "brief", label: LONG_SAVED, count: 7 }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="filter-panel"]')!;

    // The rail does not grow sideways to fit the text.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-facet"][data-value="hero"]',
    )!;
    const label = row.querySelector<HTMLElement>('[data-slot="filter-panel-facet-label"]')!;
    const count = row.querySelector<HTMLElement>('[data-slot="filter-panel-facet-count"]')!;

    // The label truncates…
    await expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    // …and the count is whole, which is the priority that matters.
    await expect(count.scrollWidth).toBeLessThanOrEqual(count.clientWidth);
    await expect(count).toHaveTextContent("41");

    // Truncation is paint, not name: the full string still reaches the
    // accessibility tree, count included.
    await expect(canvas.getByRole("checkbox", { name: `${LONG_COLLECTION} 41` })).toBeInTheDocument();

    // The see-more carries the whole section label into its name.
    await expect(
      canvas.getByRole("button", { name: `Show 2 more in ${LONG_COLLECTION}` }),
    ).toBeInTheDocument();

    // The saved search truncates on the same rule.
    const saved = canvasElement.querySelector<HTMLElement>('[data-slot="filter-panel-saved-search-label"]')!;
    await expect(saved.scrollWidth).toBeGreaterThan(saved.clientWidth);
    await expect(canvas.getByRole("button", { name: `${LONG_SAVED}, 7` })).toBeInTheDocument();
  },
};

/**
 * 375px. The rail carries no responsive variant at all — a grep for `sm:`,
 * `md:` and `lg:` in `filter-panel.tsx` is empty — so unlike `preset-grid` and
 * `generation-wizard` there is no desktop layout being squeezed here: a phone
 * gets the same single column the 288px rail gets, with more room. What the
 * width actually tests is the row, and the row holds.
 *
 * The tap targets are why this story earns its place, and they split three
 * ways against WCAG 2.2's 24×24:
 *
 * - **A facet passes because of where the target is.** The visible checkbox
 *   measures 16×16 and is under the floor — but the control is wrapped in a
 *   `<label htmlFor>`, so the pointer target is the whole row, measured here at
 *   341×32. Asserted below, because the row is what a finger hits.
 * - **Clear-all passes on its own.** A11 at `scope="group"` is `size-6`,
 *   measured at 24×24 — the floor exactly, with nothing spare.
 * - **The collapse trigger does not.** A12 at `size="sm"` puts the header at
 *   `text-xs` and the trigger adds no padding of its own, so it measures
 *   45×16: fine across, half the floor down. `section-header`'s own `Mobile`
 *   story records the same shape from the other side ("the horizontal budget
 *   is fine; the vertical one is not"); this is the second instance, and a
 *   rail is where it multiplies, one per section. Stated, not asserted,
 *   because the padding decision belongs to A12.
 */
export const Mobile: Story = {
  parameters: { rail: false },
  render: () => (
    <div className="w-[375px] max-w-full rounded-lg border p-4" data-testid="viewport">
      <FilterPanel
        sections={[TYPE, { ...STYLE, visibleCount: 3 }]}
        defaultSelected={{ type: ["image"] }}
        savedSearches={SAVED}
        activeSavedSearchId="upscales"
        viewOptions={[SORT]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    // The frame, not `canvasElement.firstElementChild` — `layout: "centered"`
    // wraps every story, and measuring the centring div passes for the wrong
    // reason (story-conventions.md, mechanical fact 2).
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // The facet's pointer target is the row, not the 16px box inside it.
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="filter-panel-facet"][data-value="image"]',
    )!;
    const rowBox = row.getBoundingClientRect();
    await expect(rowBox.height).toBeGreaterThanOrEqual(24);
    await expect(rowBox.width).toBeGreaterThan(300);
    const checkBox = row.querySelector<HTMLElement>('[data-slot="checkbox"]')!.getBoundingClientRect();
    await expect(checkBox.height).toBeLessThan(rowBox.height);

    const clear = canvas.getByRole("button", { name: "Clear all filters" }).getBoundingClientRect();
    await expect(clear.height).toBeGreaterThanOrEqual(24);

    // Expanding a group inside 375px adds rows without widening anything.
    await userEvent.click(canvas.getByRole("button", { name: "Show 5 more in Style" }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(12);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  },
};

/**
 * Beside A4 `filter-bar`, the same job one rung down the scale ladder — the
 * spec says so in as many words: "past roughly six facets, escalate to J2
 * `filter-panel`."
 *
 * - **Filter bar** is a horizontal row of chips over the results. Each chip is
 *   an independent toggle with its own remove affordance, there are no counts,
 *   and the set is meant to be read in one glance. It costs a row of vertical
 *   space and nothing horizontal, which is why it belongs above a grid.
 * - **Filter panel** is a vertical rail beside the results. It carries counts,
 *   collapsible groups, overflow inside a group, saved searches and view
 *   options — everything a bar has nowhere to put — and it costs a column.
 *
 * The choosing rule is the count of *facets*, not of applied filters: a bar of
 * five chips is legible and a bar of twenty is a wall, so the crossover is
 * roughly six. Two secondary tells, both visible below. If a user needs to
 * know how many results a choice would leave before making it, only the rail
 * answers — the bar has nowhere to put a number. And if a filter combination
 * is worth rebuilding by hand, it wants saved searches, which is a rail
 * feature by construction.
 *
 * They compose rather than compete: `filter-bar`'s `FiltersButton` is the
 * documented way to open a rail from a bar on a narrow screen, so the two
 * appear together on one page more often than either replaces the other.
 */
export const Boundary: Story = {
  parameters: { rail: false },
  render: () => (
    <div className="flex w-[640px] max-w-full flex-col gap-6">
      <FilterBar>
        <FiltersButton />
        <FilterChip active onRemove={() => {}}>
          Image
        </FilterChip>
        <FilterChip onRemove={() => {}}>v7</FilterChip>
        <AddFilterChip>Add filter</AddFilterChip>
      </FilterBar>

      <div className="w-72 rounded-lg border p-4">
        <FilterPanel
          sections={[TYPE, MODEL, { ...STYLE, defaultOpen: false }]}
          defaultSelected={{ type: ["image"], model: ["v7"] }}
          savedSearches={SAVED}
          activeSavedSearchId="upscales"
        />
      </div>
    </div>
  ),
};
