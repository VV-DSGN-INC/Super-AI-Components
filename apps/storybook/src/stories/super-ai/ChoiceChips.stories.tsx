import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { AddFilterChip, FilterBar, FilterChip } from "@/registry/super-ai/filter-bar";
import { PresetGrid, type PresetGridItem } from "@/registry/super-ai/preset-grid";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { ChoiceChipsDocs } from "@/content/components/choice-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof ChoiceChips> = {
  title: "Super AI/Choice Chips",
  component: ChoiceChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ChoiceChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ChoiceChips>;

const RATIOS = ["1:1", "4:5", "16:9"];

const STYLES = [
  { value: "photoreal", label: "Photoreal" },
  { value: "cinematic", label: "Cinematic" },
  { value: "anime", label: "Anime" },
  { value: "watercolor", label: "Watercolor" },
];

/**
 * Batch size — the numeric content shape, and what the docs-site demo shows.
 * Numbers are the case where naming the group is not optional: the chips read
 * "1", "2", "3", "4" to a screen reader and nothing else says four of what.
 */
export const Numeric: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Images per run" defaultValue="4" {...args}>
      {["1", "2", "3", "4"].map((n) => (
        <ChoiceChip key={n} value={n}>
          {n}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
};

/**
 * Word labels — style presets, quality tiers, artifact types. The chip sizes
 * itself to its label, so a row of text chips is ragged by construction; that
 * is the trade for not hiding the options behind a select.
 */
export const Text: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Style" defaultValue="cinematic" {...args}>
      {STYLES.map(({ value, label }) => (
        <ChoiceChip key={value} value={value}>
          {label}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
};

/**
 * The A4 ↔ E4 seam, rendered. A chip can carry a preview instead of a word by
 * embedding A8 `preview-tile` as its child — the same `button` wrapping a
 * decorative tile that E4 `preset-grid` builds each of its cells from, so the
 * two are the same idea at two scales rather than two implementations.
 *
 * The explicit tile width is a layout condition, not a design value:
 * `preview-tile`'s frame is `w-full`, and a flex chip gives it no basis to be
 * a fraction of. Four of these is about the ceiling — past that the row is a
 * grid pretending to be a row, and `preset-grid` is the component that admits
 * it.
 */
export const PreviewContent: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Style" defaultValue="cinematic" className="gap-3" {...args}>
      {STYLES.map(({ value, label }) => (
        <ChoiceChip key={value} value={value} className="p-1.5">
          <PreviewTile aspect="square" label={label} labelPlacement="below" className="w-16">
            <span aria-hidden className="bg-primary/15 block h-full w-full" />
          </PreviewTile>
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
};

/**
 * An option that exists but is not available — the plan-gated resolution, the
 * model that is out of credits. `ChoiceChip` spreads onto a native button, so
 * `disabled` is a real disabled button: it leaves the tab order and cannot
 * take the selection, which is what the play function pins.
 *
 * **Defect, recorded not fixed:** the chip carries no disabled styling, so
 * the unavailable option is pixel-identical to an available one. The registry
 * already has a house idiom for this (`disabled:opacity-50
 * disabled:pointer-events-none`, six components deep) but applying it is a
 * visual decision that belongs to one integrator, not to fourteen concurrent
 * retrofits. Until it lands, a disabled chip is only discoverable by trying
 * it, and callers should prefer omitting the option and saying why.
 */
export const DisabledChip: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Output resolution" defaultValue="1080p" {...args}>
      <ChoiceChip value="720p">720p</ChoiceChip>
      <ChoiceChip value="1080p">1080p</ChoiceChip>
      <ChoiceChip value="4k" disabled>
        4K
      </ChoiceChip>
    </ChoiceChips>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fourK = canvas.getByRole("radio", { name: "4K" });
    await expect(fourK).toBeDisabled();

    // The contract is that the selection cannot land on it, not that the
    // click is swallowed somewhere in this component — a native disabled
    // button never fires one.
    await userEvent.click(fourK);
    await expect(fourK).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByRole("radio", { name: "1080p" })).toHaveAttribute("aria-checked", "true");
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the content shapes above. See docs/design-system/story-conventions.md.
 *
 * All eight apply here and all eight are written, which is unusual and worth
 * saying out loud rather than leaving the reader to count: this is a
 * focusable, text-bearing, value-holding primitive that wraps, transitions
 * and has three near-twins in the catalog, so every one of the eight
 * questions has a real answer. No `case-skip` lines.
 *
 * `Uncontrolled` below is a ninth, outside the eight names. It is here
 * because `defaultValue` and `value` are genuinely different situations for
 * this component and only one of them can be the `Controlled` story.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The group itself is direction-clean — `flex flex-wrap gap-2`
 * flips its start edge for free and the selection ring is drawn on all four
 * sides — so the thing worth rendering is the chip content, where both
 * shipped consumers put a count after the label.
 *
 * That count is the RTL hazard, and this story is where it was found:
 * `explore-gallery.tsx` and `artifact-grid.tsx` both space it with a physical
 * `ml-1.5`, which under `dir="rtl"` puts the gap on the far side of the count
 * and lets the number collide with its label. Rendered here with the logical
 * `ms-1.5` those two should be using. Numeric labels are safe without help —
 * a colon between two digits is a bidi common separator, so `16:9` survives
 * an RTL paragraph unreversed.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <ChoiceChips aria-label="Artifact type" defaultValue="all" {...args}>
        <ChoiceChip value="all">
          All
          <span className="ms-1.5 tabular-nums">128</span>
        </ChoiceChip>
        <ChoiceChip value="document">
          Documents
          <span className="ms-1.5 tabular-nums">64</span>
        </ChoiceChip>
        <ChoiceChip value="image">
          Images
          <span className="ms-1.5 tabular-nums">48</span>
        </ChoiceChip>
        <ChoiceChip value="code">
          Code
          <span className="ms-1.5 tabular-nums">16</span>
        </ChoiceChip>
      </ChoiceChips>
    </div>
  ),
};

/**
 * The reduced-motion branch. The chip fades between its rest, hover and
 * selected colours with `transition-colors`; under `prefers-reduced-motion`
 * `motion-reduce:transition-none` cuts the fade and the colour swaps
 * instantly.
 *
 * That class was added as part of this retrofit — the same one-class branch
 * `pricing-table`, `trace-timeline`, `task-tray` and `citation-ref` already
 * carry. Without it this story would have been a second screenshot of
 * `Text`, since `vitest.config.ts` runs every story under
 * `reducedMotion: "reduce"` and a bare `transition-colors` does not branch.
 */
export const ReducedMotion: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Style" defaultValue="cinematic" {...args}>
      {STYLES.map(({ value, label }) => (
        <ChoiceChip key={value} value={value}>
          {label}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
};

/**
 * Tab traversal, deliberately with nothing selected so that every ring the
 * assertion sees is a focus ring rather than the selection ring.
 *
 * **Defect, recorded not fixed:** the ARIA radiogroup pattern says a group is
 * one tab stop and arrow keys move the selection inside it. v1 ships Tab per
 * chip and no arrow handling — the `TODO` in `choice-chips.tsx` names it, and
 * `preset-grid.tsx` carries the same accepted gap by reference. So a ten-chip
 * facet row is ten tab stops on the way past it. The play function asserts
 * only what is true today (each stop is genuinely `:focus-visible` and paints
 * a ring); it deliberately does not assert the stop count, which would pin
 * the gap in place and make fixing it a test failure.
 *
 * Second thing this story makes visible: focus and selection are drawn with
 * the same `ring-ring ring-2`. A focused chip and a selected chip are the
 * same picture, which is why the assertion below has to go through
 * `:focus-visible` rather than through the computed ring.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Aspect ratio" {...args}>
      {RATIOS.map((ratio) => (
        <ChoiceChip key={ratio} value={ratio}>
          {ratio}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);

    await userEvent.tab();
    let stops = 0;
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      // The ring is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused);
      stops += 1;
      await userEvent.tab();
    }
    // At least one stop, so the loop above cannot pass by never running.
    await expect(stops).toBeGreaterThan(0);
  },
};

/**
 * The controlled pair, driven by a host that owns the value.
 *
 * Three facts, and all three are asserted because a `Controlled` story
 * without a play function is a screenshot of a prop:
 *
 * 1. **`value` wins over interaction.** Clicking `1:1` while the host still
 *    says `16:9` moves nothing — this component reads `valueProp ?? internal`
 *    on every render, so the prop is the value whenever it is present.
 * 2. **`onValueChange` hands back what a consumer needs to apply the change** —
 *    the chip's own `value` string, not an event. Pressing Apply feeds that
 *    exact payload back as the new `value`, and only then does the selection
 *    move.
 * 3. **An unchanged `value` holds the selection fixed across re-renders.**
 *    Re-render bumps an unrelated counter on the host; the assertion checks
 *    the counter actually advanced before checking the selection did not, so
 *    it cannot pass by the re-render never happening.
 *
 * One shape worth knowing, and it is the reason `artifact-grid` ships an
 * "All" chip: `value={undefined}` is read as *uncontrolled*, not as *nothing
 * selected*, so a controlled group cannot express an empty selection without
 * a sentinel chip to point at.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wide = canvas.getByRole("radio", { name: "16:9" });
    const square = canvas.getByRole("radio", { name: "1:1" });
    await expect(wide).toHaveAttribute("aria-checked", "true");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(square);
    await expect(wide).toHaveAttribute("aria-checked", "true");
    await expect(square).toHaveAttribute("aria-checked", "false");

    // 2. …but the callback fired, with the payload the host needs.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("1:1");

    // 3. Re-render with an unchanged `value`. Check the re-render really
    //    happened first, so the selection assertion after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(wide).toHaveAttribute("aria-checked", "true");
    await expect(square).toHaveAttribute("aria-checked", "false");

    // The payload was sufficient to apply the change — the whole point of
    // reporting it rather than swallowing it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(square).toHaveAttribute("aria-checked", "true");
    await expect(wide).toHaveAttribute("aria-checked", "false");
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState("16:9");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <ChoiceChips aria-label="Aspect ratio" value={applied} onValueChange={setRequested}>
        {RATIOS.map((ratio) => (
          <ChoiceChip key={ratio} value={ratio}>
            {ratio}
          </ChoiceChip>
        ))}
      </ChoiceChips>

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>value prop</dt>
        <dd data-testid="applied" className="tabular-nums">
          {applied}
        </dd>
        <dt>last onValueChange</dt>
        <dd data-testid="requested" className="tabular-nums">
          {requested ?? "—"}
        </dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </Button>
        <Button size="sm" disabled={!requested} onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * The uncontrolled path — a genuinely different situation from `Controlled`,
 * not a variant of it. With `defaultValue` and no `value`, the group keeps its
 * own selection and a click moves it immediately; `onValueChange` still fires,
 * but as a notification rather than as a request the host has to grant.
 *
 * This is the right shape for a parameter nothing else on screen reads — the
 * generate button pulls the value when it runs. It stops being the right
 * shape the moment two surfaces need to agree on the value, because
 * `defaultValue` is read once at mount and a later change to it is ignored.
 */
export const Uncontrolled: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Aspect ratio" defaultValue="16:9" {...args}>
      {RATIOS.map((ratio) => (
        <ChoiceChip key={ratio} value={ratio}>
          {ratio}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wide = canvas.getByRole("radio", { name: "16:9" });
    const square = canvas.getByRole("radio", { name: "1:1" });
    await expect(wide).toHaveAttribute("aria-checked", "true");

    await userEvent.click(square);
    await expect(square).toHaveAttribute("aria-checked", "true");
    await expect(wide).toHaveAttribute("aria-checked", "false");
  },
};

/**
 * A chip with no visible label. `ChoiceChip`'s children are optional, so this
 * is reachable — and it is where a preview-content row lands as soon as the
 * thumbnails are self-explanatory enough that a caller drops the caption.
 *
 * The accessible name has to come from somewhere, and here it comes from
 * `aria-label` on each chip. Get that wrong and the row is four radios named
 * nothing, which is the whole failure mode this story exists to name. The
 * other half of it is size: an empty chip with no child at all does not
 * collapse to nothing, but it does collapse to roughly a 24px hollow pill,
 * which is under every tap-target guideline going. A preview keeps the target
 * honest; a bare empty chip does not.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <ChoiceChips aria-label="Style" defaultValue="cinematic" className="gap-3" {...args}>
      {STYLES.map(({ value, label }) => (
        <ChoiceChip key={value} value={value} aria-label={label} className="p-1.5">
          <PreviewTile aspect="square" labelPlacement="none" className="w-16">
            <span aria-hidden className="bg-primary/15 block h-full w-full" />
          </PreviewTile>
        </ChoiceChip>
      ))}
    </ChoiceChips>
  ),
};

/**
 * An 84-character preset name, in the narrow container these rows actually
 * live in — J2 `filter-panel` renders its facet groups as choice-chips inside
 * a rail this wide.
 *
 * The component's answer to long content is: nothing. No `max-width`, no
 * `truncate`, no `whitespace-nowrap`. Inside a constrained parent the chip
 * keeps its padding and wraps its own text, so a long label becomes a
 * three-line pill that sets the height of its row; unconstrained, the same
 * chip is one long line and the group grows as wide as the label. Either way
 * the label is never cut off, which is the right default for text a caller
 * chose — but it means a row of chips is only as tidy as its longest label.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-full max-w-xs">
      <ChoiceChips aria-label="Style" defaultValue="cinematic" {...args}>
        <ChoiceChip value="cinematic">
          Cinematic teal-and-orange grade with shallow depth of field and anamorphic lens flare
        </ChoiceChip>
        <ChoiceChip value="photoreal">Photoreal</ChoiceChip>
        <ChoiceChip value="anime">Anime</ChoiceChip>
      </ChoiceChips>
    </div>
  ),
};

/**
 * 375px, and the useful comparison is with C2 `suggestion-chips`, which looks
 * like the same row and behaves oppositely here. That row is a scroller with
 * a hidden scrollbar, so at this width its later chips are simply gone. This
 * one is `flex flex-wrap`, so nothing is ever hidden — the row gets taller
 * instead, and no chip is unreachable.
 *
 * The cost moves from invisible to expensive: eight chips at 375px is four
 * rows of vertical space above whatever they configure. That is the signal to
 * escalate to E4 `preset-grid`, which pays the same space in a grid and adds
 * a see-more, rather than the signal to add a scroller.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <ChoiceChips aria-label="Style" defaultValue="cinematic" {...args}>
        {[
          "Photoreal",
          "Cinematic",
          "Anime",
          "Watercolor",
          "Claymation",
          "Pixel art",
          "Line art",
          "Low poly",
        ].map((label) => (
          <ChoiceChip key={label} value={label.toLowerCase().replace(" ", "-")}>
            {label}
          </ChoiceChip>
        ))}
      </ChoiceChips>
    </div>
  ),
};

const BOUNDARY_PRESETS: PresetGridItem[] = [
  { id: "photoreal", label: "Photoreal" },
  { id: "cinematic", label: "Cinematic" },
  { id: "anime", label: "Anime" },
  { id: "watercolor", label: "Watercolor" },
  { id: "claymation", label: "Claymation" },
  { id: "pixel-art", label: "Pixel art" },
];

/**
 * Three chip-shaped rows that are not interchangeable. C2
 * `suggestion-chips`'s own Boundary story draws the first line — a click on a
 * suggestion fills the composer, a click on a choice chip sets a parameter, a
 * click on a context chip removes an attachment — and this one continues past
 * it, into the two components a choice chip is genuinely mistakable for.
 *
 * - **Choice chips** are the options themselves, exactly one chosen, in a
 *   row. Reach for them under about eight options with short labels.
 * - **`preset-grid` (E4)** is the same selection model once the options need
 *   pictures or stop fitting a row: a grid, a see-more, and — the part that
 *   decides many cases outright — `multiple`, which choice-chips does not
 *   have. If you need two things selected at once, you need this one.
 * - **`filter-bar` (A5)** looks closest and is furthest away. Its chips are
 *   not options, they are filters already applied: each one carries a remove
 *   button, the row grows as you add, and an empty row is the normal state.
 *   Choice chips always show every option and always have one chosen.
 *
 * The one-line test: if a chip can be removed, it is a filter chip; if two
 * can be lit at once, it is a preset grid; if the row can be empty, it is
 * neither.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Choice chips — one option chosen</p>
        <ChoiceChips aria-label="Style" defaultValue="cinematic">
          {STYLES.map(({ value, label }) => (
            <ChoiceChip key={value} value={value}>
              {label}
            </ChoiceChip>
          ))}
        </ChoiceChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Preset grid — pictures, see-more, and multi-select
        </p>
        <PresetGrid
          aria-label="Style"
          items={BOUNDARY_PRESETS}
          multiple
          defaultValue={["cinematic", "anime"]}
          visibleCount={4}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Filter bar — filters already applied</p>
        <FilterBar>
          <FilterChip active onRemove={() => {}}>
            Images
          </FilterChip>
          <FilterChip active onRemove={() => {}}>
            Last 7 days
          </FilterChip>
          <AddFilterChip>Filter</AddFilterChip>
        </FilterBar>
      </section>
    </div>
  ),
};
